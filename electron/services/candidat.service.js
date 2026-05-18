// /home/stive-junior/Auto-ecole-COS/electron/services/candidat.service.js

/**
 * Service de gestion des candidats (élèves)
 *
 * @module candidatService
 * @description
 * Fournit toutes les opérations CRUD, la recherche, les statistiques,
 * la gestion des documents et l'accès aux relations (paiements, leçons, examens, factures)
 * pour les candidats de l'auto‑école COS.
 *
 * Toutes les fonctions utilisent le wrapper `executePrismaOperation` pour une
 * gestion homogène des erreurs. Les dates sont manipulées au format ISO.
 *
 * @author Stive Junior
 * @version 2.0.0
 *
 * @see {@link prisma.client.js} – Utilitaires génériques Prisma
 */

import {
  prisma,
  executePrismaOperation,
  create,
  update,
  findUnique,
  findMany,
  count,
  softDelete,
  transaction,
} from './prisma.client.js';

// ===============================
// CONSTANTES & UTILITAIRES INTERNES
// ===============================

/** Nombre maximum de résultats pour une recherche rapide */
const MAX_SEARCH_RESULTS = 20;

/** Liste des statuts valides pour un candidat */
const VALID_STATUTS = ['EN_COURS', 'RECU', 'ECHOUE', 'ABANDONNE', 'EN_ATTENTE'];

/**
 * Convertit une date au format ISO string ou Date en objet Date.
 * Retourne null si la valeur est null/undefined.
 * @param {Date|string|null} date
 * @returns {Date|null}
 */
function toDate(date) {
  if (!date) return null;
  return date instanceof Date ? date : new Date(date);
}

/**
 * Construit l'objet `where` pour la liste paginée avec filtres.
 * @param {Object} params - Paramètres de filtrage
 * @param {string} [params.search] - Terme de recherche (nom, prénom, email, numéro permis)
 * @param {string} [params.statut] - Statut du candidat
 * @param {string} [params.categorie] - Catégorie de permis
 * @param {Date|string} [params.dateDebut] - Date d'inscription min
 * @param {Date|string} [params.dateFin] - Date d'inscription max
 * @returns {Object} Condition Prisma `where`
 */
function buildWhereClause({ search, statut, categorie, dateDebut, dateFin }) {
  const where = { deletedAt: null };

  if (search && search.trim().length > 0) {
    const term = search.trim();
    where.OR = [
      { nom: { contains: term, mode: 'insensitive' } },
      { prenom: { contains: term, mode: 'insensitive' } },
      { email: { contains: term, mode: 'insensitive' } },
      { numeroPermis: { contains: term, mode: 'insensitive' } },
    ];
  }

  if (statut && VALID_STATUTS.includes(statut)) {
    where.statut = statut;
  }

  if (categorie) {
    where.categorie = categorie;
  }

  if (dateDebut || dateFin) {
    where.dateInscription = {};
    if (dateDebut) where.dateInscription.gte = toDate(dateDebut);
    if (dateFin) where.dateInscription.lte = toDate(dateFin);
  }

  return where;
}

// ===============================
// FONCTIONS PRINCIPALES (exportées)
// ===============================

/**
 * Récupère la liste paginée des candidats avec filtres optionnels.
 *
 * @param {Object} [params] - Paramètres de pagination et filtres
 * @param {number} [params.page=1] - Numéro de page (1-indexed)
 * @param {number} [params.limit=10] - Nombre d'éléments par page
 * @param {string} [params.search] - Recherche textuelle (nom, prénom, email, numéro permis)
 * @param {string} [params.statut] - Filtrer par statut (EN_COURS, RECU, ...)
 * @param {string} [params.categorie] - Filtrer par catégorie de permis (A, B, C, D, BE)
 * @param {Date|string} [params.dateDebut] - Date d'inscription minimale
 * @param {Date|string} [params.dateFin] - Date d'inscription maximale
 * @returns {Promise<Object>} Réponse paginée
 * @property {Candidat[]} candidats - Liste des candidats (sans les relations lourdes)
 * @property {number} total - Nombre total de candidats (tous filtres confondus)
 * @property {number} page - Page courante
 * @property {number} limit - Limite par page
 * @property {number} totalPages - Nombre total de pages
 *
 * @example
 * const result = await getAll({ page: 2, limit: 20, search: 'Dupont', statut: 'EN_COURS' });
 */
export async function getAll(params = {}) {
  const { page, limit, ...filters } = params;
  const where = buildWhereClause(filters);

  if (page !== undefined && limit !== undefined) {
    const skip = (Math.max(1, page) - 1) * Math.max(1, limit);
    const take = Math.max(1, limit);
    return executePrismaOperation(async () => {
      const [candidats, total] = await Promise.all([
        findMany(
          'candidat',
          where,
          {
            formation: {
              include: { formation: true },
            },
          },
          { dateInscription: 'desc' },
          skip,
          take
        ),
        count('candidat', where),
      ]);

      return {
        candidats,
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take),
      };
    }, 'Erreur lors de la récupération des candidats');
  } else {
    return executePrismaOperation(async () => {
      const candidats = await Promise.all([
        findMany(
          'candidat',
          where,
          {
            formation: {
              include: { formation: true },
            },
          },
          { dateInscription: 'desc' }
        ),
        count('candidat', where),
      ]);

      return candidats;
    }, 'Erreur lors de la récupération des logs d’audit');
  }
}

/**
 * Récupère un candidat par son identifiant avec toutes ses relations.
 *
 * @param {number} id - Identifiant du candidat
 * @returns {Promise<Candidat>} Candidat complet (paiements, leçons, examens, factures, documents, formation)
 * @throws {Error} Si le candidat n'existe pas ou a été supprimé
 */
export async function getById(id) {
  if (!id || isNaN(id)) {
    throw new Error('Identifiant candidat invalide.');
  }

  return executePrismaOperation(async () => {
    const candidat = await findUnique(
      'candidat',
      { id, deletedAt: null },
      {
        paiements: { orderBy: { date: 'desc' } },
        lecons: {
          include: { moniteur: true, vehicule: true },
          orderBy: { date: 'desc' },
        },
        examens: { orderBy: { date: 'desc' } },
        factures: { orderBy: { dateEmission: 'desc' } },
        formation: {
          include: { formation: true },
        },
        documents: { orderBy: { uploadedAt: 'desc' } },
      }
    );

    if (!candidat) {
      throw new Error('Candidat non trouvé ou supprimé.');
    }

    return candidat;
  }, 'Erreur lors de la récupération du candidat');
}

/**
 * Crée un nouveau candidat.
 *
 * @param {Object} data - Données du candidat (conformes au schéma de création)
 * @param {string} data.nom - Nom de famille
 * @param {string} data.prenom - Prénom
 * @param {string} [data.email] - Email (unique)
 * @param {string} [data.telephone] - Téléphone
 * @param {Date|string} [data.dateNaissance] - Date de naissance
 * @param {string} [data.adresse] - Adresse
 * @param {string} data.categorie - Catégorie de permis (A, B, C, D, BE)
 * @param {string} [data.statut='EN_COURS'] - Statut initial
 * @param {Date|string} [data.dateInscription=new Date()] - Date d'inscription
 * @param {string} [data.notes] - Remarques internes
 * @param {number} [data.formationId] - ID de la formation associée (optionnel)
 * @returns {Promise<Candidat>} Candidat créé (avec ses relations de base)
 */
export async function createCandidat(data) {
  // Validation basique
  if (!data.nom?.trim() || !data.prenom?.trim()) {
    throw new Error('Le nom et le prénom sont obligatoires.');
  }
  if (!data.categorie) {
    throw new Error('La catégorie de permis est obligatoire.');
  }

  // Vérifier l'unicité de l'email (si fourni)
  if (data.email) {
    const existing = await findUnique('candidat', { email: data.email });
    if (existing) {
      throw new Error('Un candidat avec cet email existe déjà.');
    }
  }

  // Vérifier l'unicité du numéro de permis (si fourni)
  if (data.numeroPermis) {
    const existing = await findUnique('candidat', { numeroPermis: data.numeroPermis });
    if (existing && !existing.deletedAt) {
      throw new Error('Ce numéro de permis est déjà attribué.');
    }
  }

  const createData = {
    nom: data.nom.trim(),
    prenom: data.prenom.trim(),
    email: data.email?.trim() || null,
    telephone: data.telephone?.trim() || null,
    dateNaissance: data.dateNaissance ? toDate(data.dateNaissance) : null,
    adresse: data.adresse?.trim() || null,
    numeroPermis: data.numeroPermis?.trim() || null,
    categorie: data.categorie,
    statut: data.statut && VALID_STATUTS.includes(data.statut) ? data.statut : 'EN_COURS',
    dateInscription: data.dateInscription ? toDate(data.dateInscription) : new Date(),
    notes: data.notes?.trim() || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return executePrismaOperation(async () => {
    // Création dans une transaction si formationId est fourni
    if (data.formationId) {
      return transaction(async (tx) => {
        // 1. Récupérer la formation pour obtenir le prix total
        const formation = await tx.formation.findUnique({
          where: { id: data.formationId },
          select: { prixTotal: true },
        });
        if (!formation) {
          throw new Error('Formation non trouvée.');
        }

        // 2. Créer le candidat
        const candidat = await tx.candidat.create({ data: createData });

        // 3. Créer l'entrée formationCandidat avec le montant total de la formation
        await tx.formationCandidat.create({
          data: {
            candidatId: candidat.id,
            formationId: data.formationId,
            montantTotal: formation.prixTotal,
            dateDebut: new Date(),
            heuresConduiteEffectuees: 0,
            heuresCodeEffectuees: 0,
          },
        });

        // Retourner le candidat avec la formation incluse
        return tx.candidat.findUnique({
          where: { id: candidat.id },
          include: { formation: { include: { formation: true } } },
        });
      });
    } else {
      const candidat = await create('candidat', createData, {
        formation: { include: { formation: true } },
      });
      return candidat;
    }
  }, 'Erreur lors de la création du candidat');
}

/**
 * Met à jour un candidat existant (patch partiel).
 *
 * @param {number} id - Identifiant du candidat
 * @param {Object} data - Champs à mettre à jour (tous optionnels)
 * @returns {Promise<Candidat>} Candidat mis à jour (avec relations)
 */
export async function updateCandidat(id, data) {
  if (!id || isNaN(id)) {
    throw new Error('Identifiant candidat invalide.');
  }

  // Vérifier l'existence
  const existing = await findUnique('candidat', { id, deletedAt: null });
  if (!existing) {
    throw new Error('Candidat non trouvé ou supprimé.');
  }

  // Vérifier l'unicité de l'email si modifié
  if (data.email && data.email !== existing.email) {
    const conflict = await findUnique('candidat', { email: data.email });
    if (conflict && conflict.id !== id && !conflict.deletedAt) {
      throw new Error('Un autre candidat utilise déjà cet email.');
    }
  }

  // Vérifier l'unicité du numéro de permis si modifié
  if (data.numeroPermis && data.numeroPermis !== existing.numeroPermis) {
    const conflict = await findUnique('candidat', { numeroPermis: data.numeroPermis });
    if (conflict && conflict.id !== id && !conflict.deletedAt) {
      throw new Error('Ce numéro de permis est déjà attribué à un autre candidat.');
    }
  }

  const updateData = {
    updatedAt: new Date(),
  };

  // Seuls les champs fournis sont mis à jour
  const fields = [
    'nom',
    'prenom',
    'email',
    'telephone',
    'dateNaissance',
    'adresse',
    'numeroPermis',
    'categorie',
    'statut',
    'notes',
  ];
  for (const field of fields) {
    if (data[field] !== undefined) {
      if (field === 'dateNaissance') {
        updateData[field] = data[field] ? toDate(data[field]) : null;
      } else if (typeof data[field] === 'string') {
        updateData[field] = data[field].trim() || null;
      } else {
        updateData[field] = data[field];
      }
    }
  }

  // Gestion spéciale du statut : validation
  if (updateData.statut && !VALID_STATUTS.includes(updateData.statut)) {
    throw new Error(`Statut invalide. Valeurs autorisées : ${VALID_STATUTS.join(', ')}`);
  }

  return executePrismaOperation(async () => {
    const candidat = await update('candidat', { id }, updateData, {
      formation: { include: { formation: true } },
    });
    return candidat;
  }, 'Erreur lors de la mise à jour du candidat');
}

/**
 * Supprime logiquement (soft delete) un candidat.
 * Définit le champ `deletedAt` à la date courante.
 *
 * @param {number} id - Identifiant du candidat
 * @returns {Promise<{ success: boolean; message: string }>}
 */
export async function remove(id) {
  if (!id || isNaN(id)) {
    throw new Error('Identifiant candidat invalide.');
  }

  return executePrismaOperation(async () => {
    const existing = await findUnique('candidat', { id, deletedAt: null });
    if (!existing) {
      throw new Error('Candidat non trouvé ou déjà supprimé.');
    }

    await softDelete('candidat', { id });
    return { success: true, message: 'Candidat supprimé avec succès.' };
  }, 'Erreur lors de la suppression du candidat');
}

/**
 * Recherche rapide de candidats par nom, prénom, email ou numéro de permis.
 *
 * @param {string} query - Terme de recherche (minimum 2 caractères)
 * @returns {Promise<Candidat[]>} Liste des candidats correspondants (max 20)
 */
export async function search(query) {
  if (!query || query.trim().length < 2) {
    throw new Error('Le terme de recherche doit contenir au moins 2 caractères.');
  }

  const term = query.trim();
  const where = {
    deletedAt: null,
    OR: [
      { nom: { contains: term, mode: 'insensitive' } },
      { prenom: { contains: term, mode: 'insensitive' } },
      { email: { contains: term, mode: 'insensitive' } },
      { numeroPermis: { contains: term, mode: 'insensitive' } },
    ],
  };

  return executePrismaOperation(async () => {
    return findMany(
      'candidat',
      where,
      {
        formation: { include: { formation: true } },
      },
      { nom: 'asc', prenom: 'asc' },
      0,
      MAX_SEARCH_RESULTS
    );
  }, 'Erreur lors de la recherche de candidats');
}

/**
 * Met à jour uniquement le statut d'un candidat.
 *
 * @param {Object} params
 * @param {number} params.id - Identifiant du candidat
 * @param {string} params.statut - Nouveau statut (EN_COURS, RECU, ECHOUE, ABANDONNE, EN_ATTENTE)
 * @returns {Promise<Candidat>} Candidat mis à jour
 */
export async function updateStatus({ id, statut }) {
  if (!id || isNaN(id)) {
    throw new Error('Identifiant candidat invalide.');
  }
  if (!statut || !VALID_STATUTS.includes(statut)) {
    throw new Error(`Statut invalide. Valeurs autorisées : ${VALID_STATUTS.join(', ')}`);
  }

  return executePrismaOperation(async () => {
    const existing = await findUnique('candidat', { id, deletedAt: null });
    if (!existing) {
      throw new Error('Candidat non trouvé.');
    }

    const updated = await update(
      'candidat',
      { id },
      { statut, updatedAt: new Date() },
      {
        formation: { include: { formation: true } },
      }
    );
    return updated;
  }, 'Erreur lors de la mise à jour du statut');
}

/**
 * Récupère les statistiques agrégées des candidats.
 *
 * @returns {Promise<Object>} Statistiques étendues
 * @property {number} total - Nombre total de candidats (non supprimés)
 * @property {number} actifs - Candidats avec statut EN_COURS
 * @property {number} reçus - Candidats avec statut RECU
 * @property {number} echecs - Candidats avec statut ECHOUE
 * @property {number} enAttente - Candidats avec statut EN_ATTENTE
 * @property {number} abandonnes - Candidats avec statut ABANDONNE
 * @property {number} tauxReussite - Pourcentage de réussite (reçus / (reçus + echecs))
 * @property {number} inscritsAujourdHui - Inscriptions du jour
 * @property {number} inscritsCeMois - Inscriptions du mois en cours
 */
export async function getStats() {
  return executePrismaOperation(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const [
      total,
      actifs,
      recus,
      echecs,
      enAttente,
      abandonnes,
      inscritsAujourdHui,
      inscritsCeMois,
    ] = await Promise.all([
      count('candidat', { deletedAt: null }),
      count('candidat', { deletedAt: null, statut: 'EN_COURS' }),
      count('candidat', { deletedAt: null, statut: 'RECU' }),
      count('candidat', { deletedAt: null, statut: 'ECHOUE' }),
      count('candidat', { deletedAt: null, statut: 'EN_ATTENTE' }),
      count('candidat', { deletedAt: null, statut: 'ABANDONNE' }),
      count('candidat', {
        deletedAt: null,
        dateInscription: { gte: today, lt: new Date(today.getTime() + 86400000) },
      }),
      count('candidat', {
        deletedAt: null,
        dateInscription: { gte: startOfMonth, lt: startOfNextMonth },
      }),
    ]);

    const totalTermines = recus + echecs;
    const tauxReussite = totalTermines > 0 ? (recus / totalTermines) * 100 : 0;

    return {
      total,
      actifs,
      reçus: recus,
      echecs,
      enAttente,
      abandonnes,
      tauxReussite: parseFloat(tauxReussite.toFixed(2)),
      inscritsAujourdHui,
      inscritsCeMois,
    };
  }, 'Erreur lors du calcul des statistiques');
}

// ===============================
// FONCTIONS D'ACCÈS AUX RELATIONS
// ===============================

/**
 * Récupère tous les paiements d'un candidat.
 *
 * @param {number} candidatId - Identifiant du candidat
 * @returns {Promise<Paiement[]>} Liste des paiements (triés par date décroissante)
 */
export async function getPaiements(candidatId) {
  if (!candidatId || isNaN(candidatId)) {
    throw new Error('Identifiant candidat invalide.');
  }

  return executePrismaOperation(async () => {
    const candidat = await findUnique('candidat', { id: candidatId, deletedAt: null });
    if (!candidat) {
      throw new Error('Candidat non trouvé.');
    }
    return findMany('paiement', { candidatId }, {}, { date: 'desc' });
  }, 'Erreur lors de la récupération des paiements');
}

/**
 * Récupère toutes les leçons d'un candidat.
 *
 * @param {number} candidatId - Identifiant du candidat
 * @returns {Promise<Lecon[]>} Liste des leçons (avec moniteur et véhicule, triées par date décroissante)
 */
export async function getLecons(candidatId) {
  if (!candidatId || isNaN(candidatId)) {
    throw new Error('Identifiant candidat invalide.');
  }

  return executePrismaOperation(async () => {
    const candidat = await findUnique('candidat', { id: candidatId, deletedAt: null });
    if (!candidat) {
      throw new Error('Candidat non trouvé.');
    }
    return findMany('lecon', { candidatId }, { moniteur: true, vehicule: true }, { date: 'desc' });
  }, 'Erreur lors de la récupération des leçons');
}

/**
 * Récupère tous les examens d'un candidat.
 *
 * @param {number} candidatId - Identifiant du candidat
 * @returns {Promise<Examen[]>} Liste des examens (triés par date décroissante)
 */
export async function getExamens(candidatId) {
  if (!candidatId || isNaN(candidatId)) {
    throw new Error('Identifiant candidat invalide.');
  }

  return executePrismaOperation(async () => {
    const candidat = await findUnique('candidat', { id: candidatId, deletedAt: null });
    if (!candidat) {
      throw new Error('Candidat non trouvé.');
    }
    return findMany('examen', { candidatId }, {}, { date: 'desc' });
  }, 'Erreur lors de la récupération des examens');
}

/**
 * Récupère toutes les factures d'un candidat.
 *
 * @param {number} candidatId - Identifiant du candidat
 * @returns {Promise<Facture[]>} Liste des factures (triées par date décroissante)
 */
export async function getFactures(candidatId) {
  if (!candidatId || isNaN(candidatId)) {
    throw new Error('Identifiant candidat invalide.');
  }

  return executePrismaOperation(async () => {
    const candidat = await findUnique('candidat', { id: candidatId, deletedAt: null });
    if (!candidat) {
      throw new Error('Candidat non trouvé.');
    }
    return findMany('facture', { candidatId }, {}, { dateEmission: 'desc' });
  }, 'Erreur lors de la récupération des factures');
}

/**
 * Récupère tous les documents d'un candidat.
 *
 * @param {number} candidatId - Identifiant du candidat
 * @returns {Promise<Document[]>} Liste des documents (triés par date de création décroissante)
 */
export async function getDocuments(candidatId) {
  if (!candidatId || isNaN(candidatId)) {
    throw new Error('Identifiant candidat invalide.');
  }

  return executePrismaOperation(async () => {
    const candidat = await findUnique('candidat', { id: candidatId, deletedAt: null });
    if (!candidat) {
      throw new Error('Candidat non trouvé.');
    }
    return findMany('document', { candidatId }, {}, { uploadedAt: 'desc' });
  }, 'Erreur lors de la récupération des documents');
}

/**
 * Ajoute un document à un candidat.
 *
 * @param {Object} data - Données du document
 * @param {number} data.candidatId - Identifiant du candidat
 * @param {string} data.type - Type de document (permis, carte_identite, photo, autre)
 * @param {string} data.nomFichier - Nom du fichier
 * @param {string} data.chemin - Chemin absolu ou URL
 * @param {number} [data.taille] - Taille en octets
 * @param {string} [data.mimeType] - Type MIME
 * @returns {Promise<Document>} Document créé
 */
export async function addDocument(data) {
  if (!data.candidatId || isNaN(data.candidatId)) {
    throw new Error('Identifiant candidat invalide.');
  }
  if (!data.type?.trim() || !data.nomFichier?.trim() || !data.chemin?.trim()) {
    throw new Error('Type, nomFichier et chemin sont obligatoires.');
  }

  return executePrismaOperation(async () => {
    const candidat = await findUnique('candidat', { id: data.candidatId, deletedAt: null });
    if (!candidat) {
      throw new Error('Candidat non trouvé.');
    }

    const documentData = {
      candidatId: data.candidatId,
      type: data.type.trim(),
      nomFichier: data.nomFichier.trim(),
      chemin: data.chemin.trim(),
      taille: data.taille || null,
      mimeType: data.mimeType?.trim() || null,
      createdAt: new Date(),
    };

    return create('document', documentData);
  }, "Erreur lors de l'ajout du document");
}

/**
 * Supprime définitivement un document d'un candidat.
 *
 * @param {number} docId - Identifiant du document
 * @returns {Promise<{ success: boolean; message: string }>}
 */
export async function deleteDocument(docId) {
  if (!docId || isNaN(docId)) {
    throw new Error('Identifiant document invalide.');
  }

  return executePrismaOperation(async () => {
    const doc = await findUnique('document', { id: docId });
    if (!doc) {
      throw new Error('Document non trouvé.');
    }

    await prisma.document.delete({ where: { id: docId } });
    return { success: true, message: 'Document supprimé avec succès.' };
  }, 'Erreur lors de la suppression du document');
}

/**
 * Récupère les tendances évolutives des indicateurs candidats.
 * Compare les données des 30 derniers jours avec la période précédente (30 jours avant).
 *
 * @returns {Promise<Object>} Tendances (variations en pourcentage)
 * @property {number} total - Variation du nombre total
 * @property {number} actifs - Variation des candidats actifs
 * @property {number} reçus - Variation des candidats reçus
 * @property {number} echecs - Variation des candidats échoués
 */
export async function getTrends() {
  return executePrismaOperation(async () => {
    const now = new Date();
    const endCurrent = now;
    const startCurrent = new Date(now);
    startCurrent.setDate(now.getDate() - 30);
    const startPrevious = new Date(startCurrent);
    startPrevious.setDate(startCurrent.getDate() - 30);
    const endPrevious = startCurrent;

    // Fonction pour compter les candidats créés dans une période
    const countInPeriod = async (start, end) => {
      const where = {
        deletedAt: null,
        createdAt: { gte: start, lt: end },
      };
      const total = await count('candidat', where);
      const actifs = await count('candidat', { ...where, statut: 'EN_COURS' });
      const recus = await count('candidat', { ...where, statut: 'RECU' });
      const echecs = await count('candidat', { ...where, statut: 'ECHOUE' });
      return { total, actifs, recus, echecs };
    };

    const current = await countInPeriod(startCurrent, endCurrent);
    const previous = await countInPeriod(startPrevious, endPrevious);

    const calcVar = (curr, prev) => {
      if (prev === 0) return curr === 0 ? 0 : 100;
      return parseFloat((((curr - prev) / prev) * 100).toFixed(1));
    };

    return {
      total: calcVar(current.total, previous.total),
      actifs: calcVar(current.actifs, previous.actifs),
      reçus: calcVar(current.recus, previous.recus),
      echecs: calcVar(current.echecs, previous.echecs),
    };
  }, 'Erreur lors du calcul des tendances');
}
