// /home/stive-junior/Auto-ecole-COS/electron/services/planning.service.js

/**
 * Service de gestion des leçons (planning)
 *
 * @module planningService
 * @description
 * Fournit toutes les opérations CRUD pour les leçons, les statistiques agrégées,
 * les tendances, les sparklines, ainsi que l’accès aux leçons par candidat,
 * moniteur ou véhicule. Gère également la validation de disponibilité des ressources.
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

/** Liste des types de leçon valides (basée sur l'énumération Prisma) */
const VALID_TYPES = ['CODE', 'CONDUITE', 'CONDUITE_ACCOMPAGNEE'];

/** Liste des statuts de leçon valides */
const VALID_STATUTS = ['PLANIFIEE', 'EFFECTUEE', 'ANNULEE', 'ABSENCE'];

/** Défaut de période pour le filtre (en jours) */
const DEFAULT_PERIOD_MAP = {
  today: 1,
  week: 7,
  month: 30,
  all: null,
};

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
 * Construit l'objet `where` pour la liste paginée des leçons.
 * @param {Object} params
 * @param {string} [params.search] - Recherche textuelle (nom candidat ou moniteur)
 * @param {string} [params.type] - Type de leçon
 * @param {string} [params.statut] - Statut de leçon
 * @param {number} [params.candidatId] - ID du candidat
 * @param {number} [params.moniteurId] - ID du moniteur
 * @param {number} [params.vehiculeId] - ID du véhicule
 * @param {Date|string} [params.dateDebut] - Date de début
 * @param {Date|string} [params.dateFin] - Date de fin
 * @param {string} [params.period] - Période prédéfinie
 * @returns {Object}
 */
function buildWhereClause({
  search,
  type,
  statut,
  candidatId,
  moniteurId,
  vehiculeId,
  dateDebut,
  dateFin,
  period,
}) {
  const where = {};

  if (type && VALID_TYPES.includes(type)) {
    where.type = type;
  }

  if (statut && VALID_STATUTS.includes(statut)) {
    where.statut = statut;
  }

  if (candidatId && !isNaN(candidatId)) {
    where.candidatId = Number(candidatId);
  }

  if (moniteurId && !isNaN(moniteurId)) {
    where.moniteurId = Number(moniteurId);
  }

  if (vehiculeId && !isNaN(vehiculeId)) {
    where.vehiculeId = Number(vehiculeId);
  }

  if (search && search.trim().length > 0) {
    const term = search.trim();
    where.OR = [
      { notes: { contains: term, mode: 'insensitive' } },
      {
        candidat: {
          OR: [
            { nom: { contains: term, mode: 'insensitive' } },
            { prenom: { contains: term, mode: 'insensitive' } },
          ],
        },
      },
      {
        moniteur: {
          OR: [
            { nom: { contains: term, mode: 'insensitive' } },
            { prenom: { contains: term, mode: 'insensitive' } },
          ],
        },
      },
    ];
  }

  // Gestion de la période sur date
  if (period && period !== 'all') {
    const days = DEFAULT_PERIOD_MAP[period];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    where.date = { gte: startDate };
  } else if (dateDebut || dateFin) {
    where.date = {};
    if (dateDebut) where.date.gte = toDate(dateDebut);
    if (dateFin) where.date.lte = toDate(dateFin);
  }

  return where;
}

// ===============================
// FONCTIONS DE VÉRIFICATION (disponibilité)
// ===============================

/**
 * Vérifie la disponibilité d'un moniteur sur une plage horaire.
 * @param {number} moniteurId
 * @param {Date} start
 * @param {Date} end
 * @param {number} [excludeLeconId] - ID de leçon à exclure (pour mise à jour)
 * @returns {Promise<boolean>}
 */
async function isMoniteurDisponible(moniteurId, start, end, excludeLeconId = null) {
  const where = {
    moniteurId,
    date: { lt: end, gt: start },
    statut: { not: 'ANNULEE' },
  };
  if (excludeLeconId) where.id = { not: excludeLeconId };
  const overlapping = await count('lecon', where);
  return overlapping === 0;
}

/**
 * Vérifie la disponibilité d'un véhicule sur une plage horaire.
 * @param {number} vehiculeId
 * @param {Date} start
 * @param {Date} end
 * @param {number} [excludeLeconId] - ID de leçon à exclure (pour mise à jour)
 * @returns {Promise<boolean>}
 */
async function isVehiculeDisponible(vehiculeId, start, end, excludeLeconId = null) {
  const where = {
    vehiculeId,
    date: { lt: end, gt: start },
    statut: { not: 'ANNULEE' },
  };
  if (excludeLeconId) where.id = { not: excludeLeconId };
  const overlapping = await count('lecon', where);
  return overlapping === 0;
}

/**
 * Vérifie la disponibilité d'un candidat (pas de chevauchement de leçons).
 * @param {number} candidatId
 * @param {Date} start
 * @param {Date} end
 * @param {number} [excludeLeconId] - ID de leçon à exclure (pour mise à jour)
 * @returns {Promise<boolean>}
 */
async function isCandidatDisponible(candidatId, start, end, excludeLeconId = null) {
  const where = {
    candidatId,
    date: { lt: end, gt: start },
    statut: { not: 'ANNULEE' },
  };
  if (excludeLeconId) where.id = { not: excludeLeconId };
  const overlapping = await count('lecon', where);
  return overlapping === 0;
}

// ===============================
// FONCTIONS PRINCIPALES (exportées)
// ===============================

/**
 * Récupère la liste paginée des leçons avec filtres optionnels.
 * Si `page` et `limit` sont fournis, la réponse est paginée.
 * Sinon, retourne toutes les leçons correspondant aux filtres.
 *
 * @param {Object} [params] - Paramètres de pagination, filtres et tri
 * @param {number} [params.page] - Numéro de page (1-indexed) – optionnel
 * @param {number} [params.limit] - Nombre d'éléments par page – optionnel
 * @param {string} [params.search] - Recherche textuelle (candidat, moniteur, notes)
 * @param {string} [params.type] - Type de leçon
 * @param {string} [params.statut] - Statut
 * @param {number} [params.candidatId] - ID candidat
 * @param {number} [params.moniteurId] - ID moniteur
 * @param {number} [params.vehiculeId] - ID véhicule
 * @param {Date|string} [params.dateDebut] - Date de début
 * @param {Date|string} [params.dateFin] - Date de fin
 * @param {string} [params.period] - Période prédéfinie
 * @param {string} [params.sortBy='date'] - Champ de tri (date, duree, createdAt)
 * @param {'asc'|'desc'} [params.sortOrder='desc'] - Sens du tri
 * @returns {Promise<Object|Array>}
 */
export async function getAllLecons(params = {}) {
  const { page, limit, sortBy = 'date', sortOrder = 'desc', ...filters } = params;
  const where = buildWhereClause(filters);

  const include = {
    candidat: {
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
      },
    },
    moniteur: {
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
      },
    },
    vehicule: {
      select: {
        id: true,
        immatriculation: true,
        marque: true,
        modele: true,
      },
    },
  };

  // Cas paginé
  if (page !== undefined && limit !== undefined) {
    const skip = (Math.max(1, page) - 1) * Math.max(1, limit);
    const take = Math.max(1, limit);
    const allowedSortFields = ['date', 'duree', 'createdAt'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'date';
    const orderDirection = sortOrder === 'asc' ? 'asc' : 'desc';
    const orderBy = { [orderField]: orderDirection };

    return executePrismaOperation(async () => {
      const [lecons, total] = await Promise.all([
        findMany('lecon', where, include, orderBy, skip, take),
        count('lecon', where),
      ]);
      return {
        lecons,
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take),
      };
    }, 'Erreur lors de la récupération des leçons');
  } else {
    // Non paginé
    return executePrismaOperation(async () => {
      const lecons = await findMany('lecon', where, include, { date: 'desc' });
      return lecons;
    }, 'Erreur lors de la récupération des leçons');
  }
}

/**
 * Récupère une leçon par son identifiant avec toutes ses relations.
 *
 * @param {number} id - Identifiant de la leçon
 * @returns {Promise<Object>}
 * @throws {Error}
 */
export async function getLeconById(id) {
  if (!id || isNaN(id)) {
    throw new Error('Identifiant leçon invalide.');
  }

  return executePrismaOperation(async () => {
    const lecon = await findUnique(
      'lecon',
      { id },
      {
        candidat: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            telephone: true,
            numeroPermis: true,
          },
        },
        moniteur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            telephone: true,
          },
        },
        vehicule: {
          select: {
            id: true,
            immatriculation: true,
            marque: true,
            modele: true,
            kilometrage: true,
          },
        },
      }
    );
    if (!lecon) {
      throw new Error('Leçon non trouvée.');
    }
    return lecon;
  }, 'Erreur lors de la récupération de la leçon');
}

/**
 * Crée une nouvelle leçon.
 * Vérifie la disponibilité du moniteur, du véhicule et du candidat.
 *
 * @param {Object} data - Données de la leçon
 * @param {Date|string} data.date - Date et heure de début
 * @param {number} data.duree - Durée en minutes
 * @param {string} data.type - Type de leçon
 * @param {number} data.candidatId - ID candidat
 * @param {number} data.moniteurId - ID moniteur
 * @param {number|null} [data.vehiculeId] - ID véhicule (optionnel)
 * @param {string|null} [data.notes] - Remarques
 * @returns {Promise<Object>}
 */
export async function createLecon(data) {
  // Validation basique
  if (!data.date) throw new Error('La date de la leçon est obligatoire.');
  if (!data.duree || data.duree <= 0) throw new Error('La durée doit être positive.');
  if (!data.type || !VALID_TYPES.includes(data.type))
    throw new Error(`Type invalide. Valeurs autorisées : ${VALID_TYPES.join(', ')}`);
  if (!data.candidatId || isNaN(data.candidatId)) throw new Error('Identifiant candidat invalide.');
  if (!data.moniteurId || isNaN(data.moniteurId)) throw new Error('Identifiant moniteur invalide.');

  const start = toDate(data.date);
  const end = new Date(start.getTime() + data.duree * 60000);

  // Vérifier l'existence des entités
  const candidat = await findUnique('candidat', { id: data.candidatId, deletedAt: null });
  if (!candidat) throw new Error('Candidat non trouvé.');

  const moniteur = await findUnique('moniteur', { id: data.moniteurId });
  if (!moniteur) throw new Error('Moniteur non trouvé.');

  if (data.vehiculeId) {
    const vehicule = await findUnique('vehicule', { id: data.vehiculeId });
    if (!vehicule) throw new Error('Véhicule non trouvé.');
  }

  // Vérifier la disponibilité
  const [candidatDispo, moniteurDispo, vehiculeDispo] = await Promise.all([
    isCandidatDisponible(data.candidatId, start, end),
    isMoniteurDisponible(data.moniteurId, start, end),
    data.vehiculeId ? isVehiculeDisponible(data.vehiculeId, start, end) : Promise.resolve(true),
  ]);

  if (!candidatDispo) throw new Error('Le candidat a déjà une leçon sur ce créneau.');
  if (!moniteurDispo) throw new Error('Le moniteur n’est pas disponible sur ce créneau.');
  if (!vehiculeDispo) throw new Error('Le véhicule n’est pas disponible sur ce créneau.');

  const leconData = {
    date: start,
    duree: data.duree,
    type: data.type,
    statut: 'PLANIFIEE',
    notes: data.notes?.trim() || null,
    candidatId: data.candidatId,
    moniteurId: data.moniteurId,
    vehiculeId: data.vehiculeId && !isNaN(data.vehiculeId) ? Number(data.vehiculeId) : null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return executePrismaOperation(async () => {
    const newLecon = await create('lecon', leconData, {
      candidat: true,
      moniteur: true,
      vehicule: true,
    });
    return newLecon;
  }, 'Erreur lors de la création de la leçon');
}

/**
 * Met à jour une leçon existante (patch partiel).
 * Vérifie la disponibilité des ressources si la date, la durée ou les participants changent.
 *
 * @param {number} id - Identifiant de la leçon
 * @param {Object} data - Champs à modifier
 * @returns {Promise<Object>}
 */
export async function updateLecon(id, data) {
  if (!id || isNaN(id)) throw new Error('Identifiant leçon invalide.');

  const existing = await findUnique('lecon', { id });
  if (!existing) throw new Error('Leçon non trouvée.');

  const updateData = {};
  const updatableFields = [
    'date',
    'duree',
    'type',
    'statut',
    'notes',
    'candidatId',
    'moniteurId',
    'vehiculeId',
  ];

  let needsAvailabilityCheck = false;
  let newStart, newEnd;

  for (const field of updatableFields) {
    if (data[field] !== undefined) {
      if (field === 'date') {
        newStart = toDate(data[field]);
        // eslint-disable-next-line no-unused-vars
        newEnd = newStart
          ? new Date(newStart.getTime() + (data.duree || existing.duree) * 60000)
          : null;
        if (newStart && newStart.getTime() !== existing.date.getTime())
          needsAvailabilityCheck = true;
        updateData[field] = newStart;
      } else if (field === 'duree') {
        if (data.duree !== existing.duree) needsAvailabilityCheck = true;
        updateData[field] = data.duree;
      } else if (field === 'candidatId') {
        if (data.candidatId !== existing.candidatId) needsAvailabilityCheck = true;
        updateData[field] =
          data.candidatId && !isNaN(data.candidatId) ? Number(data.candidatId) : null;
      } else if (field === 'moniteurId') {
        if (data.moniteurId !== existing.moniteurId) needsAvailabilityCheck = true;
        updateData[field] =
          data.moniteurId && !isNaN(data.moniteurId) ? Number(data.moniteurId) : null;
      } else if (field === 'vehiculeId') {
        if (data.vehiculeId !== existing.vehiculeId) needsAvailabilityCheck = true;
        updateData[field] =
          data.vehiculeId && !isNaN(data.vehiculeId) ? Number(data.vehiculeId) : null;
      } else if (field === 'statut') {
        if (!VALID_STATUTS.includes(data.statut))
          throw new Error(`Statut invalide. Valeurs autorisées : ${VALID_STATUTS.join(', ')}`);
        updateData[field] = data.statut;
      } else if (field === 'type') {
        if (!VALID_TYPES.includes(data.type))
          throw new Error(`Type invalide. Valeurs autorisées : ${VALID_TYPES.join(', ')}`);
        updateData[field] = data.type;
      } else if (field === 'notes') {
        updateData[field] = data.notes?.trim() || null;
      }
    }
  }

  // Vérification des disponibilités si nécessaire
  if (needsAvailabilityCheck) {
    const start = updateData.date || existing.date;
    const duree = updateData.duree || existing.duree;
    const end = new Date(start.getTime() + duree * 60000);
    const candidatId =
      updateData.candidatId !== undefined ? updateData.candidatId : existing.candidatId;
    const moniteurId =
      updateData.moniteurId !== undefined ? updateData.moniteurId : existing.moniteurId;
    const vehiculeId =
      updateData.vehiculeId !== undefined ? updateData.vehiculeId : existing.vehiculeId;

    const [candidatDispo, moniteurDispo, vehiculeDispo] = await Promise.all([
      isCandidatDisponible(candidatId, start, end, id),
      isMoniteurDisponible(moniteurId, start, end, id),
      vehiculeId ? isVehiculeDisponible(vehiculeId, start, end, id) : Promise.resolve(true),
    ]);

    if (!candidatDispo) throw new Error('Le candidat a déjà une leçon sur ce créneau.');
    if (!moniteurDispo) throw new Error('Le moniteur n’est pas disponible sur ce créneau.');
    if (!vehiculeDispo) throw new Error('Le véhicule n’est pas disponible sur ce créneau.');
  }

  updateData.updatedAt = new Date();

  return executePrismaOperation(async () => {
    const updated = await update('lecon', { id }, updateData, {
      candidat: true,
      moniteur: true,
      vehicule: true,
    });
    return updated;
  }, 'Erreur lors de la mise à jour de la leçon');
}

/**
 * Supprime définitivement une leçon.
 *
 * @param {number} id - Identifiant de la leçon
 * @returns {Promise<{ success: boolean; message: string }>}
 */
export async function deleteLecon(id) {
  if (!id || isNaN(id)) throw new Error('Identifiant leçon invalide.');

  const existing = await findUnique('lecon', { id });
  if (!existing) throw new Error('Leçon non trouvée.');

  return executePrismaOperation(async () => {
    await remove('lecon', { id });
    return { success: true, message: 'Leçon supprimée avec succès.' };
  }, 'Erreur lors de la suppression de la leçon');
}

// ===============================
// STATISTIQUES, TENDANCES ET SPARKLINES
// ===============================

/**
 * Récupère les statistiques agrégées des leçons.
 *
 * @returns {Promise<Object>} LeconsStatsExtended
 */
export async function getLeconsStats() {
  return executePrismaOperation(async () => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - now.getDay() + 1
    );
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endLastMonth = startOfMonth;

    // Aggrégations globales
    const totalLecons = await count('lecon');
    const leconsEffectuees = await count('lecon', { statut: 'EFFECTUEE' });
    const leconsPlanifiees = await count('lecon', { statut: 'PLANIFIEE' });

    // Heures de conduite et code
    const conduiteLecons = await findMany('lecon', {
      OR: [{ type: 'CONDUITE' }, { type: 'CONDUITE_ACCOMPAGNEE' }],
      statut: 'EFFECTUEE',
    });
    const heuresConduiteTotal = conduiteLecons.reduce((sum, l) => sum + l.duree, 0) / 60;

    const codeLecons = await findMany('lecon', { type: 'CODE', statut: 'EFFECTUEE' });
    const heuresCodeTotal = codeLecons.reduce((sum, l) => sum + l.duree, 0) / 60;

    // Taux d'occupation des véhicules (pour les leçons planifiées de conduite sur les 30 derniers jours)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60000);
    const leconsConduiteLast30 = await findMany('lecon', {
      type: { in: ['CONDUITE', 'CONDUITE_ACCOMPAGNEE'] },
      date: { gte: thirtyDaysAgo },
      vehiculeId: { not: null },
    });
    const totalSlots = 30 * 8; // simplification : 8 créneaux de 1h par jour
    const usedSlots = leconsConduiteLast30.length;
    const tauxOccupationVehicules = totalSlots > 0 ? (usedSlots / totalSlots) * 100 : 0;

    // Métriques du jour et semaine
    const leconsAujourdHui = await count('lecon', { date: { gte: startOfDay } });
    const leconsSemaine = await count('lecon', { date: { gte: startOfWeek } });

    // Absentéisme
    const absences = await count('lecon', { statut: 'ABSENCE' });
    const tauxAbsenteisme = totalLecons > 0 ? (absences / totalLecons) * 100 : 0;

    // Évolution des planifiées
    const planifieesThis = await count('lecon', {
      statut: 'PLANIFIEE',
      date: { gte: startOfMonth },
    });
    const planifieesLast = await count('lecon', {
      statut: 'PLANIFIEE',
      date: { gte: startLastMonth, lt: endLastMonth },
    });
    const evolutionPlanifiees =
      planifieesLast === 0
        ? planifieesThis > 0
          ? 100
          : 0
        : ((planifieesThis - planifieesLast) / planifieesLast) * 100;

    return {
      totalLecons,
      leconsEffectuees,
      leconsPlanifiees,
      heuresConduiteTotal,
      heuresCodeTotal,
      tauxOccupationVehicules: parseFloat(tauxOccupationVehicules.toFixed(1)),
      leconsAujourdHui,
      leconsSemaine,
      tauxAbsenteisme: parseFloat(tauxAbsenteisme.toFixed(1)),
      evolutionPlanifiees: parseFloat(evolutionPlanifiees.toFixed(1)),
    };
  }, 'Erreur lors du calcul des statistiques des leçons');
}

/**
 * Récupère les tendances évolutives (mois courant vs mois précédent).
 *
 * @returns {Promise<Object>} LeconsTrends
 */
export async function getLeconsTrends() {
  return executePrismaOperation(async () => {
    const now = new Date();
    const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endLastMonth = startThisMonth;

    const computeTrend = (current, prev) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return parseFloat((((current - prev) / prev) * 100).toFixed(1));
    };

    const [thisMonth, lastMonth] = await Promise.all([
      prisma.lecon.aggregate({
        where: { date: { gte: startThisMonth } },
        _count: { id: true },
      }),
      prisma.lecon.aggregate({
        where: { date: { gte: startLastMonth, lt: endLastMonth } },
        _count: { id: true },
      }),
    ]);

    const leconsEffectueesThis = await count('lecon', {
      statut: 'EFFECTUEE',
      date: { gte: startThisMonth },
    });
    const leconsEffectueesLast = await count('lecon', {
      statut: 'EFFECTUEE',
      date: { gte: startLastMonth, lt: endLastMonth },
    });

    const heuresConduiteThis =
      (
        await findMany('lecon', {
          OR: [{ type: 'CONDUITE' }, { type: 'CONDUITE_ACCOMPAGNEE' }],
          statut: 'EFFECTUEE',
          date: { gte: startThisMonth },
        })
      ).reduce((s, l) => s + l.duree, 0) / 60;
    const heuresConduiteLast =
      (
        await findMany('lecon', {
          OR: [{ type: 'CONDUITE' }, { type: 'CONDUITE_ACCOMPAGNEE' }],
          statut: 'EFFECTUEE',
          date: { gte: startLastMonth, lt: endLastMonth },
        })
      ).reduce((s, l) => s + l.duree, 0) / 60;

    return {
      leconsEffectuees: computeTrend(leconsEffectueesThis, leconsEffectueesLast),
      leconsPlanifiees: computeTrend(thisMonth._count.id || 0, lastMonth._count.id || 0),
      heuresConduiteTotal: computeTrend(heuresConduiteThis, heuresConduiteLast),
      tauxOccupationVehicules: 0, // non calculé par simplicité, mais peut être ajouté
    };
  }, 'Erreur lors du calcul des tendances des leçons');
}

/**
 * Récupère les données des sparklines pour les 12 derniers mois.
 *
 * @returns {Promise<Object>} LeconsSparklineData
 */
export async function getLeconsSparklines() {
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

    const leconsEffectueesValues = [];
    const heuresConduiteValues = [];
    const tauxOccupationValues = [];

    for (const m of months) {
      const effectuees = await count('lecon', {
        statut: 'EFFECTUEE',
        date: { gte: m.start, lte: m.end },
      });
      leconsEffectueesValues.push(effectuees);

      const heures =
        (
          await findMany('lecon', {
            OR: [{ type: 'CONDUITE' }, { type: 'CONDUITE_ACCOMPAGNEE' }],
            statut: 'EFFECTUEE',
            date: { gte: m.start, lte: m.end },
          })
        ).reduce((s, l) => s + l.duree, 0) / 60;
      heuresConduiteValues.push(heures);

      // Taux d'occupation simplifié (nombre de leçons de conduite / (jours * 8))
      const daysInMonth = new Date(m.end.getFullYear(), m.end.getMonth() + 1, 0).getDate();
      const totalSlots = daysInMonth * 8;
      const usedSlots = await count('lecon', {
        type: { in: ['CONDUITE', 'CONDUITE_ACCOMPAGNEE'] },
        date: { gte: m.start, lte: m.end },
        vehiculeId: { not: null },
      });
      tauxOccupationValues.push(totalSlots > 0 ? (usedSlots / totalSlots) * 100 : 0);
    }

    return {
      leconsEffectueesSparkline: {
        values: leconsEffectueesValues,
        labels: months.map((m) => m.label),
      },
      heuresConduiteSparkline: { values: heuresConduiteValues, labels: months.map((m) => m.label) },
      tauxOccupationSparkline: { values: tauxOccupationValues, labels: months.map((m) => m.label) },
    };
  }, 'Erreur lors de la génération des sparklines des leçons');
}

// ===============================
// RELATIONS SPÉCIFIQUES
// ===============================

/**
 * Récupère toutes les leçons d’un candidat.
 *
 * @param {number} candidatId
 * @returns {Promise<Lecon[]>}
 */
export async function getLeconsByCandidat(candidatId) {
  if (!candidatId || isNaN(candidatId)) throw new Error('ID candidat invalide.');
  return executePrismaOperation(async () => {
    return findMany('lecon', { candidatId }, { moniteur: true, vehicule: true }, { date: 'desc' });
  }, 'Erreur lors de la récupération des leçons du candidat');
}

/**
 * Récupère toutes les leçons d’un moniteur.
 *
 * @param {number} moniteurId
 * @returns {Promise<Lecon[]>}
 */
export async function getLeconsByMoniteur(moniteurId) {
  if (!moniteurId || isNaN(moniteurId)) throw new Error('ID moniteur invalide.');
  return executePrismaOperation(async () => {
    return findMany('lecon', { moniteurId }, { candidat: true, vehicule: true }, { date: 'desc' });
  }, 'Erreur lors de la récupération des leçons du moniteur');
}

/**
 * Récupère toutes les leçons d’un véhicule.
 *
 * @param {number} vehiculeId
 * @returns {Promise<Lecon[]>}
 */
export async function getLeconsByVehicule(vehiculeId) {
  if (!vehiculeId || isNaN(vehiculeId)) throw new Error('ID véhicule invalide.');
  return executePrismaOperation(async () => {
    return findMany('lecon', { vehiculeId }, { candidat: true, moniteur: true }, { date: 'desc' });
  }, 'Erreur lors de la récupération des leçons du véhicule');
}

/**
 * Récupère les leçons pour une période donnée (calendrier).
 *
 * @param {Date|string} startDate - Date de début (inclus)
 * @param {Date|string} endDate - Date de fin (inclus)
 * @param {number} [moniteurId] - Optionnel : filtrer par moniteur
 * @returns {Promise<Lecon[]>}
 */
export async function getLeconsBetweenDates(startDate, endDate, moniteurId = null) {
  const start = toDate(startDate);
  const end = toDate(endDate);
  if (!start || !end) throw new Error('Dates invalides.');
  if (start > end) throw new Error('La date de début doit être antérieure à la date de fin.');

  const where = {
    date: { gte: start, lte: end },
  };
  if (moniteurId && !isNaN(moniteurId)) where.moniteurId = Number(moniteurId);

  return executePrismaOperation(async () => {
    return findMany(
      'lecon',
      where,
      { candidat: true, moniteur: true, vehicule: true },
      { date: 'asc' }
    );
  }, 'Erreur lors de la récupération des leçons entre dates');
}
