// /home/stive-junior/Auto-ecole-COS/electron/services/depense.service.js

/**
 * Service de gestion des dépenses (sorties d’argent)
 *
 * @module depenseService
 * @description
 * Fournit toutes les opérations CRUD pour les dépenses, les statistiques agrégées,
 * les tendances, les sparklines, ainsi que l’accès aux dépenses par véhicule.
 * Gère également la synchronisation avec la caisse (mouvements de sortie) et les véhicules.
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
  update,
  findUnique,
  findMany,
  count,
  transaction,
} from './prisma.client.js';

// ===============================
// CONSTANTES & UTILITAIRES INTERNES
// ===============================

/**
 * Liste des catégories valides pour la vérification de cohérence applicative.
 */
const VALID_CATEGORIES = [
  'CARBURANT',
  'ENTRETIEN_VEHICULE',
  'SALAIRE',
  'LOYER',
  'ELECTRICITE',
  'TELEPHONE',
  'ASSURANCE',
  'PUBLICITE',
  'FOURNITURES',
  'TAXES',
  'AUTRE',
];

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
 * Construit l'objet `where` pour la liste paginée avec filtres.
 * @param {Object} params
 * @returns {Object}
 */
function buildWhereClause({ search, categorie, vehiculeId, period, dateDebut, dateFin }) {
  const where = {};

  if (categorie && VALID_CATEGORIES.includes(categorie)) {
    where.categorie = categorie;
  }

  if (vehiculeId && !isNaN(vehiculeId)) {
    where.vehiculeId = Number(vehiculeId);
  }

  if (search && search.trim().length > 0) {
    const term = search.trim();
    where.OR = [
      { description: { contains: term, mode: 'insensitive' } },
      { fournisseur: { contains: term, mode: 'insensitive' } },
      { reference: { contains: term, mode: 'insensitive' } },
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
// FONCTIONS DE SYNCHRONISATION CAISSE
// ===============================

/**
 * Enregistre une dépense et met à jour le solde de caisse (sortie).
 * @param {Object} depenseData - Données de la dépense (déjà construites)
 * @returns {Promise<Object>} Dépense créée
 */
async function createDepenseWithCaisse(depenseData) {
  return transaction(async (tx) => {
    // 1. Créer la dépense
    const depense = await tx.depense.create({ data: depenseData });

    // 2. Mettre à jour le solde de la caisse (SORTIE)
    const dernierMouvement = await tx.caisse.findFirst({
      orderBy: { date: 'desc' },
    });
    const nouveauSolde = (dernierMouvement?.solde || 0) - depense.montant;
    await tx.caisse.create({
      data: {
        type: 'SORTIE',
        montant: depense.montant,
        solde: nouveauSolde,
        description: depense.description || `Dépense #${depense.id} - ${depense.categorie}`,
        reference: depense.reference,
        date: depense.date,
      },
    });

    return depense;
  });
}

/**
 * Met à jour le solde de caisse lorsqu'une dépense est modifiée (changement de montant).
 * @param {Prisma.TransactionClient} tx - Client transactionnel
 * @param {number} oldMontant - Ancien montant
 * @param {number} newMontant - Nouveau montant
 * @param {string} reference - Référence de la dépense
 * @param {Date} date - Date de la dépense
 * @param {string} description - Description
 */
async function updateCaisseForDepense(tx, oldMontant, newMontant, reference, date, description) {
  if (oldMontant === newMontant) return;

  await tx.caisse.deleteMany({
    where: {
      reference: reference,
      type: 'SORTIE',
      montant: oldMontant,
      date: date,
    },
  });

  // Recalculer le solde après suppression
  const dernierApresSuppression = await tx.caisse.findFirst({
    orderBy: { date: 'desc' },
  });
  const nouveauSolde = (dernierApresSuppression?.solde || 0) - newMontant;

  await tx.caisse.create({
    data: {
      type: 'SORTIE',
      montant: newMontant,
      solde: nouveauSolde,
      description: description || `Dépense mise à jour`,
      reference: reference,
      date: date,
    },
  });
}

// ===============================
// FONCTIONS PRINCIPALES (exportées)
// ===============================

/**
 * Récupère la liste des dépenses avec filtres optionnels.
 * Si `page` et `limit` sont fournis, la réponse est paginée.
 * Sinon, retourne toutes les dépenses correspondant aux filtres.
 *
 * @param {Object} [params] - Paramètres de pagination, filtres et tri
 * @param {number} [params.page] - Numéro de page (optionnel)
 * @param {number} [params.limit] - Nombre d'éléments par page (optionnel)
 * @param {string} [params.search] - Recherche textuelle
 * @param {string} [params.categorie] - Catégorie de dépense
 * @param {number} [params.vehiculeId] - Filtrer par véhicule
 * @param {string} [params.period] - Période prédéfinie
 * @param {string} [params.sortBy='date'] - Champ de tri (si paginé)
 * @param {'asc'|'desc'} [params.sortOrder='desc'] - Sens du tri (si paginé)
 * @returns {Promise<Object|Array>} Si paginé : { depenses, total, page, limit, totalPages }
 *                                   Sinon : tableau direct de dépenses.
 */
export async function getAllDepenses(params = {}) {
  const { page, limit, sortBy = 'date', sortOrder = 'desc', ...filters } = params;
  const where = buildWhereClause(filters);

  // Cas paginé : page ET limit sont fournis
  if (page !== undefined && limit !== undefined) {
    const skip = (Math.max(1, page) - 1) * Math.max(1, limit);
    const take = Math.max(1, limit);
    const allowedSortFields = ['date', 'montant', 'createdAt'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'date';
    const orderDirection = sortOrder === 'asc' ? 'asc' : 'desc';
    const orderBy = { [orderField]: orderDirection };

    return executePrismaOperation(async () => {
      const [depenses, total] = await Promise.all([
        findMany(
          'depense',
          where,
          {
            vehicule: {
              select: {
                id: true,
                immatriculation: true,
                marque: true,
                modele: true,
              },
            },
          },
          orderBy,
          skip,
          take
        ),
        count('depense', where),
      ]);

      return {
        depenses,
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take),
      };
    }, 'Erreur lors de la récupération des dépenses');
  } else {
    // Pas de pagination : retourner tous les dépenses (triés par date décroissante)
    return executePrismaOperation(async () => {
      const depenses = await findMany(
        'depense',
        where,
        {
          vehicule: {
            select: {
              id: true,
              immatriculation: true,
              marque: true,
              modele: true,
            },
          },
        },
        { date: 'desc' }
      );
      return depenses;
    }, 'Erreur lors de la récupération des dépenses');
  }
}

/**
 * Récupère une dépense par son identifiant avec le véhicule associé.
 *
 * @param {number} id - Identifiant de la dépense
 * @returns {Promise<Depense>}
 */
export async function getDepenseById(id) {
  if (!id || isNaN(id)) throw new Error('Identifiant dépense invalide.');

  return executePrismaOperation(async () => {
    const depense = await findUnique(
      'depense',
      { id },
      {
        vehicule: {
          select: {
            id: true,
            immatriculation: true,
            marque: true,
            modele: true,
          },
        },
      }
    );
    if (!depense) throw new Error('Dépense non trouvée.');
    return depense;
  }, 'Erreur lors de la récupération de la dépense');
}

/**
 * Crée une nouvelle dépense et met à jour la caisse (sortie).
 *
 * @param {Object} data - Données de la dépense
 * @returns {Promise<Depense>}
 */
export async function createDepense(data) {
  if (!data.categorie || !VALID_CATEGORIES.includes(data.categorie)) {
    throw new Error(`Catégorie invalide. Valeurs autorisées : ${VALID_CATEGORIES.join(', ')}`);
  }
  if (!data.montant || data.montant <= 0) {
    throw new Error('Le montant doit être un nombre positif.');
  }

  // Vérifier l'existence du véhicule si fourni
  if (data.vehiculeId && !isNaN(data.vehiculeId)) {
    const vehicule = await findUnique('vehicule', { id: data.vehiculeId });
    if (!vehicule) throw new Error('Véhicule non trouvé.');
  }

  const depenseData = {
    categorie: data.categorie,
    montant: data.montant,
    description: data.description?.trim() || null,
    date: data.date ? toDate(data.date) : new Date(),
    fournisseur: data.fournisseur?.trim() || null,
    reference: data.reference?.trim() || null,
    vehiculeId: data.vehiculeId && !isNaN(data.vehiculeId) ? Number(data.vehiculeId) : null,
    createdAt: new Date(),
  };

  return executePrismaOperation(async () => {
    const newDepense = await createDepenseWithCaisse(depenseData);
    // Recharger avec relations
    return findUnique(
      'depense',
      { id: newDepense.id },
      {
        vehicule: {
          select: {
            id: true,
            immatriculation: true,
            marque: true,
            modele: true,
          },
        },
      }
    );
  }, 'Erreur lors de la création de la dépense');
}

/**
 * Met à jour une dépense existante (patch partiel) et ajuste la caisse si le montant change.
 * Seuls les champs non‑identifiants sont modifiables.
 *
 * @param {number} id - Identifiant de la dépense
 * @param {Object} data - Champs à modifier
 * @returns {Promise<Depense>}
 */
export async function updateDepense(id, data) {
  if (!id || isNaN(id)) throw new Error('Identifiant dépense invalide.');

  const existing = await findUnique('depense', { id });
  if (!existing) throw new Error('Dépense non trouvée.');

  const updateData = {};
  const updatableFields = [
    'categorie',
    'montant',
    'description',
    'date',
    'fournisseur',
    'reference',
    'vehiculeId',
  ];

  let montantChanged = false;
  let oldMontant = existing.montant;

  for (const field of updatableFields) {
    if (data[field] !== undefined) {
      if (field === 'montant') {
        if (data.montant !== existing.montant) {
          montantChanged = true;
        }
        updateData[field] = data.montant;
      } else if (field === 'date') {
        updateData[field] = data.date ? toDate(data.date) : null;
      } else if (typeof data[field] === 'string') {
        updateData[field] = data[field].trim() || null;
      } else {
        updateData[field] = data[field];
      }
    }
  }

  if (updateData.categorie && !VALID_CATEGORIES.includes(updateData.categorie)) {
    throw new Error(`Catégorie invalide. Valeurs autorisées : ${VALID_CATEGORIES.join(', ')}`);
  }

  // Vérifier le véhicule si modifié
  if (updateData.vehiculeId !== undefined && updateData.vehiculeId !== existing.vehiculeId) {
    if (updateData.vehiculeId) {
      const vehicule = await findUnique('vehicule', { id: updateData.vehiculeId });
      if (!vehicule) throw new Error('Véhicule non trouvé.');
    }
  }

  return executePrismaOperation(async () => {
    let updatedDepense;
    if (montantChanged) {
      await transaction(async (tx) => {
        // Mettre à jour la dépense
        updatedDepense = await tx.depense.update({
          where: { id },
          data: updateData,
        });
        // Mettre à jour la caisse
        await updateCaisseForDepense(
          tx,
          oldMontant,
          updatedDepense.montant,
          updatedDepense.reference || `DEP-${id}`,
          updatedDepense.date,
          updatedDepense.description
        );
      });
    } else {
      updatedDepense = await update('depense', { id }, updateData);
    }
    return findUnique(
      'depense',
      { id: updatedDepense.id },
      {
        vehicule: {
          select: {
            id: true,
            immatriculation: true,
            marque: true,
            modele: true,
          },
        },
      }
    );
  }, 'Erreur lors de la mise à jour de la dépense');
}

/**
 * Supprime définitivement une dépense et annule le mouvement en caisse.
 *
 * @param {number} id - Identifiant de la dépense
 * @returns {Promise<{ success: boolean; message: string }>}
 */
export async function deleteDepense(id) {
  if (!id || isNaN(id)) throw new Error('Identifiant dépense invalide.');

  const depense = await findUnique('depense', { id });
  if (!depense) throw new Error('Dépense non trouvée.');

  return executePrismaOperation(async () => {
    await transaction(async (tx) => {
      // Supprimer l'entrée de caisse correspondante
      await tx.caisse.deleteMany({
        where: {
          reference: depense.reference,
          type: 'SORTIE',
          montant: depense.montant,
          date: depense.date,
        },
      });
      // Supprimer la dépense
      await tx.depense.delete({ where: { id } });
    });
    return { success: true, message: 'Dépense supprimée avec succès.' };
  }, 'Erreur lors de la suppression de la dépense');
}

// ===============================
// STATISTIQUES, TENDANCES ET SPARKLINES
// ===============================

/**
 * Récupère les statistiques agrégées des dépenses.
 *
 * @returns {Promise<DepensesStatsExtended>}
 */
export async function getDepensesStats() {
  return executePrismaOperation(async () => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endLastMonth = startOfMonth;

    const [globalAgg, monthAgg, dayAgg, yearAgg, carburantAgg, entretienAgg, lastMonthAgg] =
      await Promise.all([
        prisma.depense.aggregate({ _sum: { montant: true }, _count: { id: true } }),
        prisma.depense.aggregate({
          where: { date: { gte: startOfMonth } },
          _sum: { montant: true },
        }),
        prisma.depense.aggregate({ where: { date: { gte: startOfDay } }, _sum: { montant: true } }),
        prisma.depense.aggregate({
          where: { date: { gte: startOfYear } },
          _sum: { montant: true },
        }),
        prisma.depense.aggregate({ where: { categorie: 'CARBURANT' }, _sum: { montant: true } }),
        prisma.depense.aggregate({
          where: { categorie: 'ENTRETIEN_VEHICULE' },
          _sum: { montant: true },
        }),
        prisma.depense.aggregate({
          where: { date: { gte: startLastMonth, lt: endLastMonth } },
          _sum: { montant: true },
        }),
      ]);

    const totalDepenses = globalAgg._sum.montant || 0;
    const prevTotal = lastMonthAgg._sum.montant || 0;
    const evolutionTotal =
      prevTotal === 0
        ? totalDepenses > 0
          ? 100
          : 0
        : ((totalDepenses - prevTotal) / prevTotal) * 100;

    return {
      totalDepenses,
      nombreTransactions: globalAgg._count.id || 0,
      depensesMois: monthAgg._sum.montant || 0,
      depensesCarburant: carburantAgg._sum.montant || 0,
      depensesEntretien: entretienAgg._sum.montant || 0,
      montantJour: dayAgg._sum.montant || 0,
      montantAnnee: yearAgg._sum.montant || 0,
      evolutionTotal: parseFloat(evolutionTotal.toFixed(1)),
    };
  }, 'Erreur lors du calcul des statistiques des dépenses');
}

/**
 * Récupère les tendances évolutives (mois courant vs mois précédent).
 *
 * @returns {Promise<DepensesTrends>}
 */
export async function getDepensesTrends() {
  return executePrismaOperation(async () => {
    const now = new Date();
    const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endLastMonth = startThisMonth;

    const [thisMonth, lastMonth] = await Promise.all([
      prisma.depense.aggregate({
        where: { date: { gte: startThisMonth } },
        _sum: { montant: true },
        _count: { id: true },
      }),
      prisma.depense.aggregate({
        where: { date: { gte: startLastMonth, lt: endLastMonth } },
        _sum: { montant: true },
        _count: { id: true },
      }),
    ]);

    const computeTrend = (current, prev) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return parseFloat((((current - prev) / prev) * 100).toFixed(1));
    };

    const [thisCarburant, lastCarburant, thisEntretien, lastEntretien] = await Promise.all([
      prisma.depense.aggregate({
        where: { date: { gte: startThisMonth }, categorie: 'CARBURANT' },
        _sum: { montant: true },
      }),
      prisma.depense.aggregate({
        where: { date: { gte: startLastMonth, lt: endLastMonth }, categorie: 'CARBURANT' },
        _sum: { montant: true },
      }),
      prisma.depense.aggregate({
        where: { date: { gte: startThisMonth }, categorie: 'ENTRETIEN_VEHICULE' },
        _sum: { montant: true },
      }),
      prisma.depense.aggregate({
        where: { date: { gte: startLastMonth, lt: endLastMonth }, categorie: 'ENTRETIEN_VEHICULE' },
        _sum: { montant: true },
      }),
    ]);

    return {
      totalDepenses: computeTrend(thisMonth._sum.montant || 0, lastMonth._sum.montant || 0),
      nombreTransactions: computeTrend(thisMonth._count.id || 0, lastMonth._count.id || 0),
      depensesMois: computeTrend(thisMonth._sum.montant || 0, lastMonth._sum.montant || 0),
      depensesCarburant: computeTrend(
        thisCarburant._sum.montant || 0,
        lastCarburant._sum.montant || 0
      ),
      depensesEntretien: computeTrend(
        thisEntretien._sum.montant || 0,
        lastEntretien._sum.montant || 0
      ),
    };
  }, 'Erreur lors du calcul des tendances des dépenses');
}

/**
 * Récupère les données des sparklines pour les 12 derniers mois.
 *
 * @returns {Promise<DepensesSparklineData>}
 */
export async function getDepensesSparklines() {
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

    const totalValues = [];
    const carburantValues = [];
    const entretienValues = [];

    for (const m of months) {
      const [totalAgg, carburantAgg, entretienAgg] = await Promise.all([
        prisma.depense.aggregate({
          where: { date: { gte: m.start, lte: m.end } },
          _sum: { montant: true },
        }),
        prisma.depense.aggregate({
          where: { date: { gte: m.start, lte: m.end }, categorie: 'CARBURANT' },
          _sum: { montant: true },
        }),
        prisma.depense.aggregate({
          where: { date: { gte: m.start, lte: m.end }, categorie: 'ENTRETIEN_VEHICULE' },
          _sum: { montant: true },
        }),
      ]);
      totalValues.push(totalAgg._sum.montant || 0);
      carburantValues.push(carburantAgg._sum.montant || 0);
      entretienValues.push(entretienAgg._sum.montant || 0);
    }

    return {
      totalSparkline: { values: totalValues, labels: months.map((m) => m.label) },
      carburantSparkline: { values: carburantValues, labels: months.map((m) => m.label) },
      entretienSparkline: { values: entretienValues, labels: months.map((m) => m.label) },
    };
  }, 'Erreur lors de la génération des sparklines');
}

// ===============================
// GRAPHIQUE DE TENDANCES DES DÉPENSES
// ===============================

/**
 * Retourne le label lisible pour une catégorie.
 * @param {string} cat
 * @returns {string}
 */
function getCategoryLabel(cat) {
  const labels = {
    CARBURANT: 'Carburant',
    ENTRETIEN_VEHICULE: 'Entretien',
    SALAIRE: 'Salaires',
    LOYER: 'Loyer',
    ELECTRICITE: 'Électricité',
    TELEPHONE: 'Téléphone',
    ASSURANCE: 'Assurance',
    PUBLICITE: 'Publicité',
    FOURNITURES: 'Fournitures',
    TAXES: 'Taxes',
    AUTRE: 'Autre',
  };
  return labels[cat] || cat;
}

/**
 * Récupère les données agrégées pour le graphique des dépenses (stacked bar chart).
 * Groupe les dépenses par mois depuis le premier mois de la première dépense
 * jusqu'au mois en cours (inclus). Retourne uniquement les mois où il y a eu au moins une dépense.
 * L'étiquette de l'axe s'adapte dynamiquement : elle affiche uniquement le mois court s'il y a
 * plusieurs mois, ou le mois court suivi de l'année s'il n'y a qu'un seul mois dans l'ensemble de données.
 *
 * @returns {Promise<DepensesTrendChartData>} Données structurées pour le graphique de tendance
 */
export async function getDepensesTrendChartData() {
  return executePrismaOperation(async () => {
    // 1. Détermination de la date de la toute première dépense enregistrée en base de données
    const firstDepense = await prisma.depense.findFirst({
      orderBy: { date: 'asc' },
      select: { date: true },
    });

    // Si aucune dépense n'existe, retourner immédiatement une structure de données vide
    if (!firstDepense) {
      return {
        data: [],
        config: {},
        globalTrend: 0,
        periodLabel: 'Aucune dépense',
      };
    }

    const now = new Date();
    let startDate = new Date(firstDepense.date);
    // Normalisation de la date de départ au premier jour de son mois à 00:00:00
    startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

    // 2. Génération de la liste de tous les intervalles de mois entre la première dépense et aujourd'hui
    const monthsIntervals = [];
    let currentCursor = new Date(startDate);

    while (currentCursor <= now) {
      const startOfMonth = new Date(currentCursor.getFullYear(), currentCursor.getMonth(), 1);
      let endOfMonth;

      // Si le curseur correspond au mois et à l'année en cours, on borne à la seconde près actuelle
      if (
        currentCursor.getFullYear() === now.getFullYear() &&
        currentCursor.getMonth() === now.getMonth()
      ) {
        endOfMonth = now;
      } else {
        // Sinon, on extrait le tout dernier jour du mois en cours de traitement
        endOfMonth = new Date(
          currentCursor.getFullYear(),
          currentCursor.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        );
      }

      // Extraction des composants linguistiques de la date en français
      const shortMonthStr = startOfMonth
        .toLocaleDateString('fr-FR', { month: 'short' })
        .replace('.', '');
      const fullYearStr = startOfMonth.toLocaleDateString('fr-FR', { year: 'numeric' });

      monthsIntervals.push({
        start: startOfMonth,
        end: endOfMonth,
        shortLabel: shortMonthStr, // Exemple : "mai"
        fullLabel: `${shortMonthStr} ${fullYearStr}`, // Exemple : "mai 2026"
      });

      // Progression du curseur vers le mois suivant
      currentCursor.setMonth(currentCursor.getMonth() + 1);
    }

    // 3. Configuration de la palette de couleurs pour le Stacked Bar Chart
    const colorPalette = [
      '#465FFF', // Bleu royal
      '#10B981', // Émeraude
      '#F59E0B', // Ambre
      '#EF4444', // Rouge
      '#8B5CF6', // Violet
      '#06B6D4', // Cyan
      '#F97316', // Orange
      '#EC4899', // Rose
      '#6366F1', // Indigo
      '#14B8A6', // Sarcelle
      '#6B7280', // Gris
    ];

    const config = {};
    VALID_CATEGORIES.forEach((categorieUnique, index) => {
      config[categorieUnique] = {
        label: getCategoryLabel(categorieUnique),
        color: colorPalette[index % colorPalette.length],
      };
    });

    // 4. Agrégation des données financières mois par mois (Requêtes groupées optimisées)
    const rawMonthlyCalculations = [];

    for (const interval of monthsIntervals) {
      // Initialisation de la ligne de données pour le mois courant
      const dataRow = {
        _metaShortLabel: interval.shortLabel,
        _metaFullLabel: interval.fullLabel,
      };

      // Initialisation par défaut de toutes les catégories à zéro pour éviter les valeurs undefined
      VALID_CATEGORIES.forEach((cat) => {
        dataRow[cat] = 0;
      });

      // Exécution d'un GroupBy Prisma pour récupérer la somme de toutes les catégories d'un coup pour ce mois
      const groupedSums = await prisma.depense.groupBy({
        by: ['categorie'],
        where: {
          date: {
            gte: interval.start,
            lte: interval.end,
          },
          categorie: {
            in: VALID_CATEGORIES,
          },
        },
        _sum: {
          montant: true,
        },
      });

      // Injection des résultats de la somme dans l'objet de données du mois
      let totalForThisMonth = 0;
      groupedSums.forEach((result) => {
        const montantSomme = result._sum.montant || 0;
        dataRow[result.categorie] = montantSomme;
        totalForThisMonth += montantSomme;
      });

      // On n'ajoute le mois que s'il contient au moins une dépense supérieure à 0
      if (totalForThisMonth > 0) {
        rawMonthlyCalculations.push(dataRow);
      }
    }

    // Si après filtrage aucun mois ne possède de dépenses, retourner la structure à vide
    if (rawMonthlyCalculations.length === 0) {
      return {
        data: [],
        config,
        globalTrend: 0,
        periodLabel: 'Aucune dépense',
      };
    }

    // 5. Application de la règle d'affichage conditionnelle sur les étiquettes de l'axe horizontal
    // S'il y a strictement PLUS d'un mois de données, on utilise uniquement le short label du mois ("mai")
    // S'il n'y a qu'un seul mois de données au total, on affiche le label complet avec l'année ("mai 2026")
    const useShortOnly = rawMonthlyCalculations.length > 1;

    const finalChartData = rawMonthlyCalculations.map((row) => {
      const { _metaShortLabel, _metaFullLabel, ...categoriesData } = row;

      return {
        month: useShortOnly ? _metaShortLabel : _metaFullLabel,
        ...categoriesData,
      };
    });

    // 6. Calcul de la tendance globale entre le dernier mois et l'avant-dernier mois filtré
    let globalTrendPercentage = 0;
    if (finalChartData.length >= 2) {
      const lastMonthData = finalChartData[finalChartData.length - 1];
      const previousMonthData = finalChartData[finalChartData.length - 2];

      const lastMonthTotal = VALID_CATEGORIES.reduce(
        (accumulateur, cat) => accumulateur + lastMonthData[cat],
        0
      );
      const previousMonthTotal = VALID_CATEGORIES.reduce(
        (accumulateur, cat) => accumulateur + previousMonthData[cat],
        0
      );

      if (previousMonthTotal !== 0) {
        globalTrendPercentage = ((lastMonthTotal - previousMonthTotal) / previousMonthTotal) * 100;
      }
    }

    // Construction du libellé de la période globale (toujours basé sur le format complet pour plus de clarté dans le titre)
    const firstMonthFullLabel = rawMonthlyCalculations[0]._metaFullLabel;
    const lastMonthFullLabel =
      rawMonthlyCalculations[rawMonthlyCalculations.length - 1]._metaFullLabel;
    const periodLabel = `${firstMonthFullLabel} - ${lastMonthFullLabel}`;

    return {
      data: finalChartData,
      config,
      globalTrend: parseFloat(globalTrendPercentage.toFixed(1)),
      periodLabel,
    };
  }, 'Erreur lors de la récupération des données du graphique des dépenses');
}

// ===============================
// FONCTIONS SPÉCIFIQUES
// ===============================

/**
 * Récupère toutes les dépenses associées à un véhicule.
 *
 * @param {number} vehiculeId - Identifiant du véhicule
 * @returns {Promise<Depense[]>}
 */
export async function getDepensesByVehicule(vehiculeId) {
  if (!vehiculeId || isNaN(vehiculeId)) throw new Error('Identifiant véhicule invalide.');
  return executePrismaOperation(async () => {
    return findMany('depense', { vehiculeId }, {}, { date: 'desc' });
  }, 'Erreur lors de la récupération des dépenses du véhicule');
}

/**
 * Joint un reçu (PDF) à une dépense – stub.
 *
 * @param {number} id - Identifiant de la dépense
 * @param {string} filePath - Chemin du fichier PDF
 * @returns {Promise<{ success: boolean; message: string }>}
 */
export async function attachReceiptToDepense(id, filePath) {
  if (!id || isNaN(id)) throw new Error('Identifiant dépense invalide.');
  // Dans une vraie implémentation, on enregistrerait le chemin dans la base.
  console.log(`[attachReceipt] Dépense #${id} – reçu : ${filePath}`);
  return { success: true, message: 'Reçu attaché avec succès (simulation).' };
}
