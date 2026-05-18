// /home/stive-junior/Auto-ecole-COS/electron/services/moniteur.service.js

/**
 * Service de gestion des moniteurs (instructeurs)
 *
 * @module moniteurService
 * @description
 * Fournit toutes les opérations CRUD pour les moniteurs, les statistiques agrégées,
 * les tendances et les sparklines pour le dashboard.
 * Gère également la récupération des leçons associées à chaque moniteur.
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
} from './prisma.client.js';

// ===============================
// CONSTANTES & UTILITAIRES INTERNES
// ===============================

/** Liste des champs triables pour la liste des moniteurs */
const SORT_BY_VALUES = ['createdAt', 'dateEmbauche'];

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
 * Construit l'objet `where` pour la liste paginée des moniteurs.
 * @param {Object} params
 * @param {string} [params.search] - Recherche textuelle (nom, prénom, email)
 * @param {boolean} [params.actif] - Filtrer par statut actif/inactif
 * @returns {Object} Condition Prisma `where`
 */
function buildWhereClause({ search, actif }) {
  const where = {};

  if (actif !== undefined) {
    where.actif = actif === true;
  }

  if (search && search.trim().length > 0) {
    const term = search.trim();
    where.OR = [
      { nom: { contains: term, mode: 'insensitive' } },
      { prenom: { contains: term, mode: 'insensitive' } },
      { email: { contains: term, mode: 'insensitive' } },
    ];
  }

  return where;
}

// ===============================
// FONCTIONS PRINCIPALES (exportées)
// ===============================

/**
 * Récupère la liste paginée des moniteurs avec filtres optionnels.
 * Si `page` et `limit` sont fournis, la réponse est paginée.
 * Sinon, retourne tous les moniteurs correspondant aux filtres.
 *
 * @param {Object} [params] - Paramètres de pagination, filtres et tri
 * @param {number} [params.page] - Numéro de page (1-indexed) – optionnel
 * @param {number} [params.limit] - Nombre d'éléments par page – optionnel
 * @param {string} [params.search] - Recherche textuelle (nom, prénom, email)
 * @param {boolean} [params.actif] - Filtrer par statut actif/inactif
 * @param {string} [params.sortBy='createdAt'] - Champ de tri (createdAt, dateEmbauche)
 * @param {'asc'|'desc'} [params.sortOrder='desc'] - Sens du tri
 * @returns {Promise<Object|Array>} Si paginé : { moniteurs, total, page, limit, totalPages }
 *                                   Sinon : tableau direct de moniteurs (avec leçons comptées)
 */
export async function getAllMoniteurs(params = {}) {
  const { page, limit, sortBy = 'createdAt', sortOrder = 'desc', ...filters } = params;
  const where = buildWhereClause(filters);

  // Relations minimales pour la liste
  const include = {
    lecons: {
      orderBy: { date: 'desc' },
      include: { candidat: true, vehicule: true },
    },
    _count: {
      select: { lecons: true },
    },
  };

  // Cas paginé
  if (page !== undefined && limit !== undefined) {
    const skip = (Math.max(1, page) - 1) * Math.max(1, limit);
    const take = Math.max(1, limit);
    const orderField = SORT_BY_VALUES.includes(sortBy) ? sortBy : 'createdAt';
    const orderDirection = sortOrder === 'asc' ? 'asc' : 'desc';
    const orderBy = { [orderField]: orderDirection };

    return executePrismaOperation(async () => {
      const [moniteurs, total] = await Promise.all([
        findMany('moniteur', where, include, orderBy, skip, take),
        count('moniteur', where),
      ]);
      return {
        moniteurs,
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take),
      };
    }, 'Erreur lors de la récupération des moniteurs');
  } else {
    // Non paginé : tous les moniteurs
    return executePrismaOperation(async () => {
      const moniteurs = await findMany('moniteur', where, include, { createdAt: 'desc' });
      return moniteurs;
    }, 'Erreur lors de la récupération des moniteurs');
  }
}

/**
 * Récupère un moniteur par son identifiant (avec ses leçons).
 *
 * @param {number} id - Identifiant du moniteur
 * @returns {Promise<Object>} Moniteur avec ses leçons
 * @throws {Error} Si le moniteur n'existe pas
 */
export async function getMoniteurById(id) {
  if (!id || isNaN(id)) {
    throw new Error('Identifiant moniteur invalide.');
  }

  return executePrismaOperation(async () => {
    const moniteur = await findUnique(
      'moniteur',
      { id },
      {
        lecons: {
          orderBy: { date: 'desc' },
          include: { candidat: true, vehicule: true },
        },
        _count: {
          select: { lecons: true },
        },
      }
    );
    if (!moniteur) {
      throw new Error('Moniteur non trouvé.');
    }
    return moniteur;
  }, 'Erreur lors de la récupération du moniteur');
}

/**
 * Crée un nouveau moniteur.
 *
 * @param {Object} data - Données du moniteur
 * @param {string} data.nom - Nom de famille
 * @param {string} data.prenom - Prénom
 * @param {string} [data.email] - Email (unique)
 * @param {string} [data.telephone] - Téléphone
 * @param {string} [data.specialite] - Spécialité
 * @param {Date|string} [data.dateEmbauche] - Date d'embauche (défaut: maintenant)
 * @param {boolean} [data.actif=true] - Statut actif
 * @returns {Promise<Object>} Moniteur créé
 */
export async function createMoniteur(data) {
  // Validation basique
  if (!data.nom?.trim()) throw new Error('Le nom est obligatoire.');
  if (!data.prenom?.trim()) throw new Error('Le prénom est obligatoire.');

  // Vérifier l'unicité de l'email si fourni
  if (data.email) {
    const existing = await findUnique('moniteur', { email: data.email.trim() });
    if (existing) {
      throw new Error('Un moniteur avec cet email existe déjà.');
    }
  }

  const moniteurData = {
    nom: data.nom.trim(),
    prenom: data.prenom.trim(),
    email: data.email?.trim() || null,
    telephone: data.telephone?.trim() || null,
    specialite: data.specialite?.trim() || null,
    dateEmbauche: data.dateEmbauche ? toDate(data.dateEmbauche) : new Date(),
    actif: data.actif !== undefined ? data.actif : true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return executePrismaOperation(async () => {
    const newMoniteur = await create('moniteur', moniteurData);
    return newMoniteur;
  }, 'Erreur lors de la création du moniteur');
}

/**
 * Met à jour un moniteur existant (patch partiel).
 *
 * @param {number} id - Identifiant du moniteur
 * @param {Object} data - Champs à modifier
 * @returns {Promise<Object>} Moniteur mis à jour
 */
export async function updateMoniteur(id, data) {
  if (!id || isNaN(id)) {
    throw new Error('Identifiant moniteur invalide.');
  }

  const existing = await findUnique('moniteur', { id });
  if (!existing) {
    throw new Error('Moniteur non trouvé.');
  }

  const updateData = {};
  const updatableFields = [
    'nom',
    'prenom',
    'email',
    'telephone',
    'specialite',
    'dateEmbauche',
    'actif',
  ];

  for (const field of updatableFields) {
    if (data[field] !== undefined) {
      if (field === 'dateEmbauche') {
        updateData[field] = data[field] ? toDate(data[field]) : null;
      } else if (field === 'actif') {
        updateData[field] = data[field] === true;
      } else if (typeof data[field] === 'string') {
        updateData[field] = data[field].trim() || null;
      } else {
        updateData[field] = data[field];
      }
    }
  }

  // Vérifier l'unicité de l'email si modifié
  if (updateData.email && updateData.email !== existing.email) {
    const conflict = await findUnique('moniteur', { email: updateData.email });
    if (conflict && conflict.id !== id) {
      throw new Error('Un autre moniteur utilise déjà cet email.');
    }
  }

  updateData.updatedAt = new Date();

  return executePrismaOperation(async () => {
    const updated = await update('moniteur', { id }, updateData);
    return updated;
  }, 'Erreur lors de la mise à jour du moniteur');
}

/**
 * Désactive (soft delete) un moniteur.
 * Définit `actif = false` plutôt qu'une suppression physique.
 *
 * @param {number} id - Identifiant du moniteur
 * @returns {Promise<{ success: boolean; message: string }>}
 */
export async function deleteMoniteur(id) {
  if (!id || isNaN(id)) {
    throw new Error('Identifiant moniteur invalide.');
  }

  const existing = await findUnique('moniteur', { id });
  if (!existing) {
    throw new Error('Moniteur non trouvé.');
  }

  return executePrismaOperation(async () => {
    await update('moniteur', { id }, { actif: false, updatedAt: new Date() });
    return { success: true, message: 'Moniteur désactivé avec succès.' };
  }, 'Erreur lors de la désactivation du moniteur');
}

// ===============================
// STATISTIQUES, TENDANCES ET SPARKLINES
// ===============================

/**
 * Récupère les statistiques agrégées des moniteurs.
 *
 * @returns {Promise<Object>} MoniteursStatsExtended
 */
export async function getMoniteursStats() {
  return executePrismaOperation(async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalMoniteurs = await count('moniteur');
    const actifs = await count('moniteur', { actif: true });
    const inactifs = totalMoniteurs - actifs;

    // Heures totales de leçons (pour tous les moniteurs, toutes périodes)
    const toutesLecons = await prisma.lecon.aggregate({
      where: { statut: 'EFFECTUEE' },
      _sum: { duree: true },
    });
    const totalHeuresLeçons = (toutesLecons._sum.duree || 0) / 60;

    // Heures du mois en cours
    const leconsMois = await prisma.lecon.aggregate({
      where: {
        statut: 'EFFECTUEE',
        date: { gte: startOfMonth },
      },
      _sum: { duree: true },
    });
    const heuresMois = (leconsMois._sum.duree || 0) / 60;

    const moyenneHeuresParMoniteurMois = actifs > 0 ? heuresMois / actifs : 0;

    // Évolution du nombre d'actifs (mois précédent vs mois courant)
    const actifsLastMonth = await count('moniteur', {
      actif: true,
      createdAt: { lt: startOfMonth },
    });
    const actifsCurrent = actifs;
    const evolutionActifs =
      actifsLastMonth === 0
        ? actifsCurrent > 0
          ? 100
          : 0
        : ((actifsCurrent - actifsLastMonth) / actifsLastMonth) * 100;

    const moyenneHeuresParMoniteur = actifs > 0 ? totalHeuresLeçons / actifs : 0;

    return {
      totalMoniteurs,
      actifs,
      inactifs,
      totalHeuresLeçons,
      moyenneHeuresParMoniteur: parseFloat(moyenneHeuresParMoniteur.toFixed(1)),
      heuresMois,
      moyenneHeuresParMoniteurMois: parseFloat(moyenneHeuresParMoniteurMois.toFixed(1)),
      evolutionActifs: parseFloat(evolutionActifs.toFixed(1)),
    };
  }, 'Erreur lors du calcul des statistiques des moniteurs');
}

/**
 * Récupère les tendances évolutives (mois courant vs mois précédent).
 *
 * @returns {Promise<Object>} MoniteursTrends
 */
export async function getMoniteursTrends() {
  return executePrismaOperation(async () => {
    const now = new Date();
    const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endLastMonth = startThisMonth;

    const computeTrend = (current, prev) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return parseFloat((((current - prev) / prev) * 100).toFixed(1));
    };

    // Nombre total de moniteurs créés ce mois vs mois dernier
    const totalThis = await count('moniteur', { createdAt: { gte: startThisMonth } });
    const totalLast = await count('moniteur', {
      createdAt: { gte: startLastMonth, lt: endLastMonth },
    });
    const totalMoniteurs = computeTrend(totalThis, totalLast);

    // Actifs ce mois vs mois dernier (on compare les actifs à la fin de chaque mois)
    const actifsThis = await count('moniteur', { actif: true, createdAt: { lt: new Date() } });
    const actifsLast = await count('moniteur', { actif: true, createdAt: { lt: startThisMonth } });
    const actifs = computeTrend(actifsThis, actifsLast);

    // Heures de leçons ce mois vs mois dernier
    const leconsThis = await prisma.lecon.aggregate({
      where: { statut: 'EFFECTUEE', date: { gte: startThisMonth } },
      _sum: { duree: true },
    });
    const leconsLast = await prisma.lecon.aggregate({
      where: { statut: 'EFFECTUEE', date: { gte: startLastMonth, lt: endLastMonth } },
      _sum: { duree: true },
    });
    const totalHeuresLeçons = computeTrend(
      (leconsThis._sum.duree || 0) / 60,
      (leconsLast._sum.duree || 0) / 60
    );

    return {
      totalMoniteurs,
      actifs,
      totalHeuresLeçons,
    };
  }, 'Erreur lors du calcul des tendances des moniteurs');
}

/**
 * Récupère les données des sparklines pour les 12 derniers mois.
 *
 * @returns {Promise<Object>} MoniteursSparklineData
 */
export async function getMoniteursSparklines() {
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

    const actifsValues = [];
    const heuresValues = [];
    const moyenneHeuresValues = [];

    for (const m of months) {
      // Nombre de moniteurs actifs à la fin du mois
      const actifs = await count('moniteur', {
        actif: true,
        createdAt: { lte: m.end },
      });
      actifsValues.push(actifs);

      // Heures de leçons effectuées pendant le mois
      const lecons = await prisma.lecon.aggregate({
        where: { statut: 'EFFECTUEE', date: { gte: m.start, lte: m.end } },
        _sum: { duree: true },
      });
      const heures = (lecons._sum.duree || 0) / 60;
      heuresValues.push(heures);

      // Moyenne d'heures par moniteur actif pour ce mois
      const moyenne = actifs > 0 ? heures / actifs : 0;
      moyenneHeuresValues.push(moyenne);
    }

    return {
      actifsSparkline: { values: actifsValues, labels: months.map((m) => m.label) },
      heuresSparkline: { values: heuresValues, labels: months.map((m) => m.label) },
      moyenneHeuresSparkline: { values: moyenneHeuresValues, labels: months.map((m) => m.label) },
    };
  }, 'Erreur lors de la génération des sparklines des moniteurs');
}
