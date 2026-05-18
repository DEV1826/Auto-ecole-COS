// /home/stive-junior/Auto-ecole-COS/electron/services/vehicule.service.js

/**
 * Service de gestion des véhicules et de leurs entretiens
 *
 * @module vehiculeService
 * @description
 * Fournit toutes les opérations CRUD pour les véhicules, les entretiens,
 * les statistiques agrégées, les tendances et les sparklines.
 * Gère également la synchronisation avec les leçons et les dépenses.
 *
 * Toutes les fonctions utilisent le wrapper `executePrismaOperation` pour une
 * gestion homogène des erreurs. Les dates sont manipulées au format ISO.
 *
 * @author Stive Junior
 * @version 1.0.0
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
  remove,
} from './prisma.client.js';

// ===============================
// CONSTANTES & UTILITAIRES INTERNES
// ===============================

/** Liste des catégories de permis valides (basée sur l'énumération Prisma) */
const VALID_CATEGORIES = ['A', 'B', 'C', 'D', 'BE'];

/** Liste des statuts de véhicule valides */
const VALID_STATUS = ['DISPONIBLE', 'EN_LECON', 'EN_ENTRETIEN', 'HORS_SERVICE'];

/**
 * Convertit une date au format ISO string ou Date en objet Date.
 * @param {Date|string|null} date
 * @returns {Date|null}
 */
function toDate(date) {
  if (!date) return null;
  return date instanceof Date ? date : new Date(date);
}

/**
 * Construit l'objet `where` pour la liste paginée des véhicules.
 * @param {Object} params
 * @param {string} [params.search] - Recherche textuelle (immatriculation, marque, modèle)
 * @param {string} [params.categorie] - Catégorie de permis
 * @param {string} [params.statut] - Statut du véhicule
 * @param {Date|string} [params.dateDebut] - Date début d'acquisition
 * @param {Date|string} [params.dateFin] - Date fin d'acquisition
 * @returns {Object} Condition Prisma `where`
 */
function buildWhereClause({ search, categorie, statut, dateDebut, dateFin }) {
  const where = {};

  if (categorie && VALID_CATEGORIES.includes(categorie)) {
    where.categorie = categorie;
  }

  if (statut && VALID_STATUS.includes(statut)) {
    where.statut = statut;
  }

  if (search && search.trim().length > 0) {
    const term = search.trim();
    where.OR = [
      { immatriculation: { contains: term, mode: 'insensitive' } },
      { marque: { contains: term, mode: 'insensitive' } },
      { modele: { contains: term, mode: 'insensitive' } },
    ];
  }

  // Filtrage sur dateAcquisition
  if (dateDebut || dateFin) {
    where.dateAcquisition = {};
    if (dateDebut) where.dateAcquisition.gte = toDate(dateDebut);
    if (dateFin) where.dateAcquisition.lte = toDate(dateFin);
  }

  return where;
}

// ===============================
// FONCTIONS PRINCIPALES (exportées) – VÉHICULES
// ===============================

/**
 * Récupère la liste des véhicules avec filtres optionnels.
 * Si `page` et `limit` sont fournis, la réponse est paginée.
 * Sinon, retourne tous les véhicules correspondant aux filtres.
 *
 * @param {Object} [params] - Paramètres de pagination, filtres et tri
 * @param {number} [params.page] - Numéro de page (optionnel)
 * @param {number} [params.limit] - Nombre d'éléments par page (optionnel)
 * @param {string} [params.search] - Recherche textuelle (immatriculation, marque, modèle)
 * @param {string} [params.categorie] - Catégorie de permis
 * @param {string} [params.statut] - Statut du véhicule
 * @param {Date|string} [params.dateDebut] - Date début d'acquisition
 * @param {Date|string} [params.dateFin] - Date fin d'acquisition
 * @param {string} [params.sortBy='createdAt'] - Champ de tri (dateAcquisition, kilometrage, createdAt)
 * @param {'asc'|'desc'} [params.sortOrder='desc'] - Sens du tri
 * @returns {Promise<Object|Array>} Si paginé : { vehicules, total, page, limit, totalPages }
 *                                   Sinon : tableau direct de véhicules (avec entretiens et dépenses)
 */
export async function getAllVehicules(params = {}) {
  const { page, limit, sortBy = 'createdAt', sortOrder = 'desc', ...filters } = params;
  const where = buildWhereClause(filters);

  // Relations à inclure par défaut (pour le détail, on les garde même en liste)
  const include = {
    entretiens: {
      orderBy: { date: 'desc' },
      take: 3, // limiter pour la liste
    },
    depenses: {
      orderBy: { date: 'desc' },
      take: 3,
    },
    lecons: {
      orderBy: { date: 'desc' },
      take: 3,
    },
  };

  // Cas paginé : page ET limit sont fournis
  if (page !== undefined && limit !== undefined) {
    const skip = (Math.max(1, page) - 1) * Math.max(1, limit);
    const take = Math.max(1, limit);
    const allowedSortFields = ['dateAcquisition', 'kilometrage', 'createdAt'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const orderDirection = sortOrder === 'asc' ? 'asc' : 'desc';
    const orderBy = { [orderField]: orderDirection };

    return executePrismaOperation(async () => {
      const [vehicules, total] = await Promise.all([
        findMany('vehicule', where, include, orderBy, skip, take),
        count('vehicule', where),
      ]);

      return {
        vehicules,
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take),
      };
    }, 'Erreur lors de la récupération des véhicules');
  } else {
    // Pas de pagination : retourner tous les véhicules (triés par date de création décroissante)
    return executePrismaOperation(async () => {
      const vehicules = await findMany('vehicule', where, include, { createdAt: 'desc' });
      return vehicules;
    }, 'Erreur lors de la récupération des véhicules');
  }
}

/**
 * Récupère un véhicule par son identifiant avec toutes ses relations.
 *
 * @param {number} id - Identifiant du véhicule
 * @returns {Promise<Vehicule>} Véhicule complet (entretiens, leçons, dépenses)
 * @throws {Error} Si le véhicule n'existe pas
 */
export async function getVehiculeById(id) {
  if (!id || isNaN(id)) {
    throw new Error('Identifiant véhicule invalide.');
  }

  return executePrismaOperation(async () => {
    const vehicule = await findUnique(
      'vehicule',
      { id },
      {
        entretiens: { orderBy: { date: 'desc' } },
        lecons: {
          orderBy: { date: 'desc' },
          include: { candidat: true, moniteur: true },
        },
        depenses: { orderBy: { date: 'desc' } },
      }
    );
    if (!vehicule) {
      throw new Error('Véhicule non trouvé.');
    }
    return vehicule;
  }, 'Erreur lors de la récupération du véhicule');
}

/**
 * Crée un nouveau véhicule.
 *
 * @param {Object} data - Données du véhicule
 * @param {string} data.immatriculation - Plaque d'immatriculation (unique)
 * @param {string} data.marque - Marque
 * @param {string} data.modele - Modèle
 * @param {number} data.annee - Année de fabrication
 * @param {string} data.categorie - Catégorie de permis
 * @param {number} [data.kilometrage=0] - Kilométrage initial
 * @param {Date|string} [data.dateAcquisition] - Date d'acquisition (défaut: maintenant)
 * @param {Date|string|null} [data.dateDerniereRevision] - Dernière révision
 * @param {number|null} [data.prochaineRevisionKm] - Prochaine révision (km)
 * @param {string} [data.statut='DISPONIBLE'] - Statut initial
 * @returns {Promise<Vehicule>} Véhicule créé
 */
export async function createVehicule(data) {
  // Validation
  if (!data.immatriculation || !data.immatriculation.trim()) {
    throw new Error('L’immatriculation est requise.');
  }
  if (!data.marque || !data.marque.trim()) {
    throw new Error('La marque est requise.');
  }
  if (!data.modele || !data.modele.trim()) {
    throw new Error('Le modèle est requis.');
  }
  if (!data.annee || data.annee < 1900 || data.annee > new Date().getFullYear() + 1) {
    throw new Error('Année invalide.');
  }
  if (!data.categorie || !VALID_CATEGORIES.includes(data.categorie)) {
    throw new Error(`Catégorie invalide. Valeurs autorisées : ${VALID_CATEGORIES.join(', ')}`);
  }

  // Vérifier l'unicité de l'immatriculation
  const existing = await findUnique('vehicule', { immatriculation: data.immatriculation.trim() });
  if (existing) {
    throw new Error('Cette immatriculation est déjà utilisée.');
  }

  const vehiculeData = {
    immatriculation: data.immatriculation.trim(),
    marque: data.marque.trim(),
    modele: data.modele.trim(),
    annee: data.annee,
    categorie: data.categorie,
    kilometrage: data.kilometrage ?? 0,
    dateAcquisition: data.dateAcquisition ? toDate(data.dateAcquisition) : new Date(),
    dateDerniereRevision: data.dateDerniereRevision ? toDate(data.dateDerniereRevision) : null,
    prochaineRevisionKm: data.prochaineRevisionKm ?? null,
    statut: data.statut && VALID_STATUS.includes(data.statut) ? data.statut : 'DISPONIBLE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return executePrismaOperation(async () => {
    const newVehicule = await create('vehicule', vehiculeData);
    return getVehiculeById(newVehicule.id);
  }, 'Erreur lors de la création du véhicule');
}

/**
 * Met à jour un véhicule existant (patch partiel).
 *
 * @param {number} id - Identifiant du véhicule
 * @param {Object} data - Champs à modifier
 * @returns {Promise<Vehicule>} Véhicule mis à jour
 */
export async function updateVehicule(id, data) {
  if (!id || isNaN(id)) {
    throw new Error('Identifiant véhicule invalide.');
  }

  const existing = await findUnique('vehicule', { id });
  if (!existing) {
    throw new Error('Véhicule non trouvé.');
  }

  const updateData = {};
  const updatableFields = [
    'immatriculation',
    'marque',
    'modele',
    'annee',
    'categorie',
    'kilometrage',
    'dateAcquisition',
    'dateDerniereRevision',
    'prochaineRevisionKm',
    'statut',
  ];

  for (const field of updatableFields) {
    if (data[field] !== undefined) {
      if (field === 'dateAcquisition' || field === 'dateDerniereRevision') {
        updateData[field] = data[field] ? toDate(data[field]) : null;
      } else if (typeof data[field] === 'string') {
        updateData[field] = data[field].trim() || null;
      } else {
        updateData[field] = data[field];
      }
    }
  }

  // Validation spécifique
  if (updateData.immatriculation && updateData.immatriculation !== existing.immatriculation) {
    const existingImmat = await findUnique('vehicule', {
      immatriculation: updateData.immatriculation,
    });
    if (existingImmat) {
      throw new Error('Cette immatriculation est déjà utilisée.');
    }
  }
  if (updateData.categorie && !VALID_CATEGORIES.includes(updateData.categorie)) {
    throw new Error(`Catégorie invalide. Valeurs autorisées : ${VALID_CATEGORIES.join(', ')}`);
  }
  if (updateData.statut && !VALID_STATUS.includes(updateData.statut)) {
    throw new Error(`Statut invalide. Valeurs autorisées : ${VALID_STATUS.join(', ')}`);
  }

  updateData.updatedAt = new Date();

  return executePrismaOperation(async () => {
    const updated = await update('vehicule', { id }, updateData);
    return getVehiculeById(updated.id);
  }, 'Erreur lors de la mise à jour du véhicule');
}

/**
 * Supprime définitivement un véhicule.
 * @param {number} id - Identifiant du véhicule
 * @returns {Promise<{ success: boolean; message: string }>}
 */
export async function removeVehicule(id) {
  if (!id || isNaN(id)) {
    throw new Error('Identifiant véhicule invalide.');
  }

  const existing = await findUnique('vehicule', { id });
  if (!existing) {
    throw new Error('Véhicule non trouvé.');
  }

  return executePrismaOperation(async () => {
    await remove('vehicule', { id });
    return { success: true, message: 'Véhicule supprimé avec succès.' };
  }, 'Erreur lors de la suppression du véhicule');
}

/**
 * Met à jour le statut d'un véhicule (utilitaire).
 * @param {Object} params
 * @param {number} params.id - Identifiant du véhicule
 * @param {string} params.statut - Nouveau statut
 * @returns {Promise<Vehicule>}
 */
export async function updateVehiculeStatus({ id, statut }) {
  if (!id || isNaN(id)) throw new Error('Identifiant véhicule invalide.');
  if (!statut || !VALID_STATUS.includes(statut)) {
    throw new Error(`Statut invalide. Valeurs autorisées : ${VALID_STATUS.join(', ')}`);
  }
  return executePrismaOperation(async () => {
    const updated = await update('vehicule', { id }, { statut, updatedAt: new Date() });
    return getVehiculeById(updated.id);
  }, 'Erreur lors de la mise à jour du statut');
}

// ===============================
// STATISTIQUES, TENDANCES ET SPARKLINES
// ===============================

/**
 * Récupère les statistiques agrégées complètes des véhicules.
 *
 * @returns {Promise<VehiculesStatsExtended>} Métriques étendues
 */
export async function getVehiculesStats() {
  return executePrismaOperation(async () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Totaux par statut
    const totalVehicules = await count('vehicule');
    const disponibles = await count('vehicule', { statut: 'DISPONIBLE' });
    const enLecon = await count('vehicule', { statut: 'EN_LECON' });
    const enEntretien = await count('vehicule', { statut: 'EN_ENTRETIEN' });
    const horsService = await count('vehicule', { statut: 'HORS_SERVICE' });

    // Kilométrage moyen et total
    const kmAgg = await prisma.vehicule.aggregate({
      _avg: { kilometrage: true },
      _sum: { kilometrage: true },
    });
    const kilometrageMoyen = Math.round(kmAgg._avg.kilometrage || 0);
    const kilometrageTotal = kmAgg._sum.kilometrage || 0;

    // Entretiens de l'année
    const entretiensAnnee = await count('entretien', {
      date: { gte: startOfYear },
    });
    const coutEntretiensAnneeAgg = await prisma.entretien.aggregate({
      where: { date: { gte: startOfYear } },
      _sum: { cout: true },
    });
    const coutEntretiensAnnee = coutEntretiensAnneeAgg._sum.cout || 0;

    // Évolution du nombre de disponibles (mois précédent vs mois courant)
    const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const disponiblesLastMonth = await count('vehicule', {
      statut: 'DISPONIBLE',
      createdAt: { lte: endLastMonth },
    });
    const disponiblesCurrent = disponibles;
    const evolutionDisponibles =
      disponiblesLastMonth === 0
        ? disponiblesCurrent > 0
          ? 100
          : 0
        : ((disponiblesCurrent - disponiblesLastMonth) / disponiblesLastMonth) * 100;

    return {
      totalVehicules,
      disponibles,
      enLecon,
      enEntretien,
      horsService,
      kilometrageMoyen,
      entretiensAnnee,
      totalEntretiens: entretiensAnnee,
      coutEntretiensAnnee,
      kilometrageTotal,
      evolutionDisponibles: parseFloat(evolutionDisponibles.toFixed(1)),
    };
  }, 'Erreur lors du calcul des statistiques des véhicules');
}

/**
 * Récupère les tendances évolutives (mois courant vs mois précédent).
 *
 * @returns {Promise<VehiculesTrends>} Variations en pourcentage
 */
export async function getVehiculesTrends() {
  return executePrismaOperation(async () => {
    const now = new Date();
    const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endLastMonth = startThisMonth;

    const computeTrend = (current, prev) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return parseFloat((((current - prev) / prev) * 100).toFixed(1));
    };

    // Total véhicules (créés ce mois vs mois dernier)
    const totalThis = await count('vehicule', { createdAt: { gte: startThisMonth } });
    const totalLast = await count('vehicule', {
      createdAt: { gte: startLastMonth, lt: endLastMonth },
    });
    const totalVehicules = computeTrend(totalThis, totalLast);

    // Disponibles (même logique)
    const disponiblesThis = await count('vehicule', {
      statut: 'DISPONIBLE',
      createdAt: { gte: startThisMonth },
    });
    const disponiblesLast = await count('vehicule', {
      statut: 'DISPONIBLE',
      createdAt: { gte: startLastMonth, lt: endLastMonth },
    });
    const disponibles = computeTrend(disponiblesThis, disponiblesLast);

    // Kilométrage moyen (des véhicules existants, on compare la moyenne fin de mois)
    const kmCurrentAgg = await prisma.vehicule.aggregate({ _avg: { kilometrage: true } });
    const kmPrevAgg = await prisma.vehicule.aggregate({
      where: { createdAt: { lt: startThisMonth } },
      _avg: { kilometrage: true },
    });
    const kilometrageMoyen = computeTrend(
      kmCurrentAgg._avg.kilometrage || 0,
      kmPrevAgg._avg.kilometrage || 0
    );

    // Entretiens de l'année (même période)
    const entretiensThis = await count('entretien', { date: { gte: startThisMonth } });
    const entretiensLast = await count('entretien', {
      date: { gte: startLastMonth, lt: endLastMonth },
    });
    const entretiensAnnee = computeTrend(entretiensThis, entretiensLast);

    // Coût des entretiens
    const coutThisAgg = await prisma.entretien.aggregate({
      where: { date: { gte: startThisMonth } },
      _sum: { cout: true },
    });
    const coutLastAgg = await prisma.entretien.aggregate({
      where: { date: { gte: startLastMonth, lt: endLastMonth } },
      _sum: { cout: true },
    });
    const coutEntretiensAnnee = computeTrend(
      coutThisAgg._sum.cout || 0,
      coutLastAgg._sum.cout || 0
    );

    return {
      totalVehicules,
      disponibles,
      kilometrageMoyen,
      entretiensAnnee,
      coutEntretiensAnnee,
    };
  }, 'Erreur lors du calcul des tendances des véhicules');
}

/**
 * Récupère les données des sparklines pour les 12 derniers mois.
 *
 * @returns {Promise<VehiculesSparklineData>} Séries mensuelles
 */
export async function getVehiculesSparklines() {
  return executePrismaOperation(async () => {
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      months.push({
        start,
        end,
        label: start.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
      });
    }

    const disponiblesValues = [];
    const enLeconValues = [];
    const entretiensValues = [];
    const kilometrageValues = [];

    for (const m of months) {
      // Nombre de véhicules disponibles à la fin du mois (créés avant ou pendant le mois et statut DISPONIBLE)
      const disponibles = await prisma.vehicule.count({
        where: {
          statut: 'DISPONIBLE',
          createdAt: { lte: m.end },
        },
      });
      disponiblesValues.push(disponibles);

      // En leçon (même logique)
      const enLecon = await prisma.vehicule.count({
        where: {
          statut: 'EN_LECON',
          createdAt: { lte: m.end },
        },
      });
      enLeconValues.push(enLecon);

      // Nombre d'entretiens dans le mois
      const entretiens = await prisma.entretien.count({
        where: { date: { gte: m.start, lte: m.end } },
      });
      entretiensValues.push(entretiens);

      // Kilométrage moyen (des véhicules créés avant la fin du mois)
      const kmAgg = await prisma.vehicule.aggregate({
        where: { createdAt: { lte: m.end } },
        _avg: { kilometrage: true },
      });
      kilometrageValues.push(Math.round(kmAgg._avg.kilometrage || 0));
    }

    return {
      disponiblesSparkline: { values: disponiblesValues, labels: months.map((m) => m.label) },
      enLeconSparkline: { values: enLeconValues, labels: months.map((m) => m.label) },
      entretiensSparkline: { values: entretiensValues, labels: months.map((m) => m.label) },
      kilometrageSparkline: { values: kilometrageValues, labels: months.map((m) => m.label) },
    };
  }, 'Erreur lors de la génération des sparklines des véhicules');
}

// ===============================
// GESTION DES ENTRETIENS
// ===============================

/**
 * Récupère tous les entretiens d'un véhicule.
 *
 * @param {number} vehiculeId - Identifiant du véhicule
 * @returns {Promise<Entretien[]>} Liste des entretiens triés par date décroissante
 */
export async function getEntretiensByVehicule(vehiculeId) {
  if (!vehiculeId || isNaN(vehiculeId)) {
    throw new Error('Identifiant véhicule invalide.');
  }
  return executePrismaOperation(async () => {
    const entretiens = await findMany('entretien', { vehiculeId }, {}, { date: 'desc' });
    return entretiens;
  }, 'Erreur lors de la récupération des entretiens');
}

/**
 * Crée un nouvel entretien pour un véhicule.
 *
 * @param {Object} data - Données de l'entretien
 * @param {string} data.type - Type d'entretien
 * @param {string} [data.description] - Description
 * @param {number} [data.cout] - Coût en FCFA
 * @param {number} [data.kilometre] - Kilométrage au moment de l'entretien
 * @param {Date|string} [data.date] - Date de l'entretien (défaut: maintenant)
 * @param {number} [data.prochainKm] - Prochain kilométrage recommandé
 * @param {number} data.vehiculeId - Identifiant du véhicule
 * @returns {Promise<Entretien>} Entretien créé
 */
export async function createEntretien(data) {
  if (!data.type || !data.type.trim()) {
    throw new Error('Le type d’entretien est requis.');
  }
  if (!data.vehiculeId || isNaN(data.vehiculeId)) {
    throw new Error('Identifiant véhicule invalide.');
  }

  // Vérifier l'existence du véhicule
  const vehicule = await findUnique('vehicule', { id: data.vehiculeId });
  if (!vehicule) {
    throw new Error('Véhicule non trouvé.');
  }

  const entretienData = {
    type: data.type.trim(),
    description: data.description?.trim() || null,
    cout: data.cout ?? null,
    kilometre: data.kilometre ?? null,
    date: data.date ? toDate(data.date) : new Date(),
    prochainKm: data.prochainKm ?? null,
    vehiculeId: data.vehiculeId,
    createdAt: new Date(),
  };

  return executePrismaOperation(async () => {
    const newEntretien = await create('entretien', entretienData);
    // Option : mettre à jour la date de dernière révision du véhicule
    if (entretienData.date && entretienData.type.toLowerCase().includes('révision')) {
      await update(
        'vehicule',
        { id: data.vehiculeId },
        {
          dateDerniereRevision: entretienData.date,
          prochaineRevisionKm: entretienData.prochainKm,
          updatedAt: new Date(),
        }
      );
    }
    return newEntretien;
  }, 'Erreur lors de la création de l’entretien');
}

/**
 * Met à jour un entretien existant.
 *
 * @param {number} id - Identifiant de l'entretien
 * @param {Object} data - Champs à modifier
 * @returns {Promise<Entretien>} Entretien mis à jour
 */
export async function updateEntretien(id, data) {
  if (!id || isNaN(id)) {
    throw new Error('Identifiant entretien invalide.');
  }

  const existing = await findUnique('entretien', { id });
  if (!existing) {
    throw new Error('Entretien non trouvé.');
  }

  const updateData = {};
  const updatableFields = ['type', 'description', 'cout', 'kilometre', 'date', 'prochainKm'];

  for (const field of updatableFields) {
    if (data[field] !== undefined) {
      if (field === 'date') {
        updateData[field] = data[field] ? toDate(data[field]) : null;
      } else if (typeof data[field] === 'string') {
        updateData[field] = data[field].trim() || null;
      } else {
        updateData[field] = data[field];
      }
    }
  }

  return executePrismaOperation(async () => {
    const updated = await update('entretien', { id }, updateData);
    return updated;
  }, 'Erreur lors de la mise à jour de l’entretien');
}

/**
 * Supprime un entretien.
 *
 * @param {number} id - Identifiant de l'entretien
 * @returns {Promise<{ success: boolean; message: string }>}
 */
export async function deleteEntretien(id) {
  if (!id || isNaN(id)) {
    throw new Error('Identifiant entretien invalide.');
  }

  const existing = await findUnique('entretien', { id });
  if (!existing) {
    throw new Error('Entretien non trouvé.');
  }

  return executePrismaOperation(async () => {
    await remove('entretien', { id });
    return { success: true, message: 'Entretien supprimé avec succès.' };
  }, 'Erreur lors de la suppression de l’entretien');
}

// ===============================
// MISE À JOUR DU KILOMÉTRAGE
// ===============================

/**
 * Met à jour le kilométrage d'un véhicule.
 *
 * @param {Object} data
 * @param {number} data.vehiculeId - Identifiant du véhicule
 * @param {number} data.nouveauKilometrage - Nouveau kilométrage
 * @param {boolean} [data.force=false] - Forcer la mise à jour même si la valeur est inférieure
 * @returns {Promise<Vehicule>} Véhicule mis à jour
 */
export async function updateVehiculeKilometrage({ vehiculeId, nouveauKilometrage, force = false }) {
  if (!vehiculeId || isNaN(vehiculeId)) {
    throw new Error('Identifiant véhicule invalide.');
  }
  if (typeof nouveauKilometrage !== 'number' || nouveauKilometrage < 0) {
    throw new Error('Le kilométrage doit être un nombre positif.');
  }

  const vehicule = await findUnique('vehicule', { id: vehiculeId });
  if (!vehicule) {
    throw new Error('Véhicule non trouvé.');
  }

  if (!force && nouveauKilometrage < vehicule.kilometrage) {
    throw new Error('Le nouveau kilométrage ne peut pas être inférieur au kilométrage actuel.');
  }

  return executePrismaOperation(async () => {
    const updated = await update(
      'vehicule',
      { id: vehiculeId },
      {
        kilometrage: nouveauKilometrage,
        updatedAt: new Date(),
      }
    );
    return getVehiculeById(updated.id);
  }, 'Erreur lors de la mise à jour du kilométrage');
}

// ===============================
// VÉRIFICATION D'UNICITÉ
// ===============================

/**
 * Vérifie si une immatriculation est unique.
 *
 * @param {string} immatriculation - Plaque à vérifier
 * @param {number} [excludeId] - Identifiant du véhicule à exclure (pour modification)
 * @returns {Promise<boolean>} true si unique
 */
export async function isImmatriculationUnique(immatriculation, excludeId = null) {
  if (!immatriculation || !immatriculation.trim()) {
    return false;
  }
  const where = { immatriculation: immatriculation.trim() };
  if (excludeId && !isNaN(excludeId)) {
    where.id = { not: excludeId };
  }
  const existing = await findUnique('vehicule', where);
  return !existing;
}
