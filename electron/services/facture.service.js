// /home/stive-junior/Auto-ecole-COS/electron/services/facture.service.js

/**
 * Service de gestion des factures
 *
 * @module factureService
 * @description
 * Fournit toutes les opérations CRUD pour les factures, les statistiques agrégées,
 * les tendances, les sparklines, ainsi que l'accès aux paiements associés et aux
 * factures par candidat. Gère également la génération de PDF (stub) et l'envoi par email.
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

/** Liste des statuts valides pour une facture (basée sur l'énumération Prisma) */
const VALID_STATUTS = ['EN_ATTENTE', 'PARTIELLEMENT_PAYEE', 'PAYEE', 'ANNULEE'];

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
 * @param {string} [params.search] - Recherche sur numéro de facture ou nom candidat
 * @param {string} [params.statut] - Statut de la facture
 * @param {number} [params.candidatId] - ID du candidat
 * @param {string} [params.period] - Période prédéfinie (today, week, month, all)
 * @param {Date|string} [params.dateDebut] - Date de début
 * @param {Date|string} [params.dateFin] - Date de fin
 * @returns {Object} Condition Prisma `where`
 */
function buildWhereClause({ search, statut, candidatId, period, dateDebut, dateFin }) {
  const where = {};

  if (statut && VALID_STATUTS.includes(statut)) {
    where.statut = statut;
  }

  if (candidatId && !isNaN(candidatId)) {
    where.candidatId = Number(candidatId);
  }

  if (search && search.trim().length > 0) {
    const term = search.trim();
    where.OR = [
      { numero: { contains: term, mode: 'insensitive' } },
      {
        candidat: {
          OR: [
            { nom: { contains: term, mode: 'insensitive' } },
            { prenom: { contains: term, mode: 'insensitive' } },
          ],
        },
      },
    ];
  }

  // Gestion de la période sur dateEmission
  if (period && period !== 'all') {
    const days = DEFAULT_PERIOD_MAP[period];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    where.dateEmission = { gte: startDate };
  } else if (dateDebut || dateFin) {
    where.dateEmission = {};
    if (dateDebut) where.dateEmission.gte = toDate(dateDebut);
    if (dateFin) where.dateEmission.lte = toDate(dateFin);
  }

  return where;
}

/**
 * Génère un numéro de facture unique au format FAC-YYYY-XXXXX
 * @returns {Promise<string>}
 */
async function generateNumeroFacture() {
  const year = new Date().getFullYear();
  const prefix = `FAC-${year}-`;
  // Compter les factures de l'année courante
  const countThisYear = await prisma.facture.count({
    where: {
      numero: {
        startsWith: prefix,
      },
    },
  });
  const seq = String(countThisYear + 1).padStart(5, '0');
  return `${prefix}${seq}`;
}

// ===============================
// FONCTIONS PRINCIPALES (exportées)
// ===============================

/**
 * Récupère la liste paginée des factures avec filtres optionnels.
 *
 * @param {Object} [params] - Paramètres de pagination, filtres et tri
 * @param {number} [params.page=1] - Numéro de page (1-indexed)
 * @param {number} [params.limit=20] - Nombre d'éléments par page
 * @param {string} [params.search] - Recherche textuelle (numéro, nom candidat)
 * @param {string} [params.statut] - Statut de la facture
 * @param {number} [params.candidatId] - Filtrer par candidat
 * @param {string} [params.period] - Période prédéfinie
 * @param {string} [params.sortBy='dateEmission'] - Champ de tri
 * @param {'asc'|'desc'} [params.sortOrder='desc'] - Sens du tri
 * @returns {Promise<Object>} Réponse paginée avec factures, total, page, limit, totalPages
 */
export async function getAllFactures(params = {}) {
  const { page = 1, limit = 20, sortBy = 'dateEmission', sortOrder = 'desc', ...filters } = params;
  const skip = (Math.max(1, page) - 1) * Math.max(1, limit);
  const take = Math.max(1, limit);
  const where = buildWhereClause(filters);

  const allowedSortFields = ['numero', 'montantTotal', 'dateEmission', 'createdAt'];
  const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'dateEmission';
  const orderDirection = sortOrder === 'asc' ? 'asc' : 'desc';
  const orderBy = { [orderField]: orderDirection };

  return executePrismaOperation(async () => {
    const [factures, total] = await Promise.all([
      findMany(
        'facture',
        where,
        {
          candidat: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
              telephone: true,
            },
          },
          paiements: {
            select: {
              id: true,
              montant: true,
              date: true,
              mode: true,
            },
            orderBy: { date: 'desc' },
          },
        },
        orderBy,
        skip,
        take
      ),
      count('facture', where),
    ]);

    return {
      factures,
      total,
      page,
      limit: take,
      totalPages: Math.ceil(total / take),
    };
  }, 'Erreur lors de la récupération des factures');
}

/**
 * Récupère une facture par son identifiant avec candidat et paiements.
 *
 * @param {number} id - Identifiant de la facture
 * @returns {Promise<Facture>} Facture complète (avec relations)
 */
export async function getFactureById(id) {
  if (!id || isNaN(id)) throw new Error('Identifiant facture invalide.');

  return executePrismaOperation(async () => {
    const facture = await findUnique(
      'facture',
      { id },
      {
        candidat: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            telephone: true,
            adresse: true,
          },
        },
        paiements: {
          select: {
            id: true,
            montant: true,
            date: true,
            mode: true,
            reference: true,
            note: true,
          },
          orderBy: { date: 'desc' },
        },
      }
    );
    if (!facture) throw new Error('Facture non trouvée.');
    return facture;
  }, 'Erreur lors de la récupération de la facture');
}

/**
 * Crée une nouvelle facture.
 * Génère automatiquement le numéro, enregistre en base et crée un PDF (stub).
 *
 * @param {Object} data - Données de la facture
 * @param {number} data.candidatId - Identifiant du candidat
 * @param {number} data.montantTotal - Montant total (FCFA)
 * @param {string} [data.dateEmission] - Date d'émission (ISO)
 * @param {string} [data.dateEcheance] - Date d'échéance (ISO)
 * @param {string} [data.notes] - Notes internes
 * @param {string} [data.numero] - Numéro personnalisé (sinon auto-généré)
 * @returns {Promise<Facture>} Facture créée
 */
export async function createFacture(data) {
  if (!data.candidatId || isNaN(data.candidatId)) throw new Error('Identifiant candidat invalide.');
  if (!data.montantTotal || data.montantTotal <= 0)
    throw new Error('Le montant total doit être un nombre positif.');

  // Vérifier l'existence du candidat
  const candidat = await findUnique('candidat', { id: data.candidatId, deletedAt: null });
  if (!candidat) throw new Error('Candidat non trouvé.');

  const numero = data.numero?.trim() || (await generateNumeroFacture());
  const dateEmission = data.dateEmission ? toDate(data.dateEmission) : new Date();
  const dateEcheance = data.dateEcheance ? toDate(data.dateEcheance) : null;

  return executePrismaOperation(async () => {
    const facture = await create('facture', {
      numero,
      montantTotal: data.montantTotal,
      statut: 'EN_ATTENTE',
      dateEmission,
      dateEcheance,
      notes: data.notes?.trim() || null,
      pdfPath: null,
      createdAt: new Date(),
      candidatId: data.candidatId,
    });
    // Génération du PDF en arrière‑plan (stub, ne pas bloquer)
    generateFacturePDF(facture.id).catch((err) => console.error('Erreur génération PDF:', err));
    return facture;
  }, 'Erreur lors de la création de la facture');
}

/**
 * Met à jour une facture existante (patch partiel).
 * Seuls le statut, la date d'échéance et les notes peuvent être modifiés.
 *
 * @param {number} id - Identifiant de la facture
 * @param {Object} data - Champs à modifier
 * @param {string} [data.statut] - Nouveau statut
 * @param {string} [data.dateEcheance] - Nouvelle date d'échéance
 * @param {string} [data.notes] - Nouvelles notes
 * @returns {Promise<Facture>} Facture mise à jour
 */
export async function updateFacture(id, data) {
  if (!id || isNaN(id)) throw new Error('Identifiant facture invalide.');

  const existing = await findUnique('facture', { id });
  if (!existing) throw new Error('Facture non trouvée.');

  const updateData = {};
  if (data.statut !== undefined) {
    if (!VALID_STATUTS.includes(data.statut))
      throw new Error(`Statut invalide. Valeurs autorisées : ${VALID_STATUTS.join(', ')}`);
    updateData.statut = data.statut;
  }
  if (data.dateEcheance !== undefined)
    updateData.dateEcheance = data.dateEcheance ? toDate(data.dateEcheance) : null;
  if (data.notes !== undefined) updateData.notes = data.notes?.trim() || null;

  return executePrismaOperation(async () => {
    const updated = await update('facture', { id }, updateData);
    return updated;
  }, 'Erreur lors de la mise à jour de la facture');
}

/**
 * Supprime définitivement une facture (uniquement si aucun paiement associé).
 *
 * @param {number} id - Identifiant de la facture
 * @returns {Promise<{ success: boolean; message: string }>}
 */
export async function deleteFacture(id) {
  if (!id || isNaN(id)) throw new Error('Identifiant facture invalide.');

  const facture = await findUnique('facture', { id }, { paiements: true });
  if (!facture) throw new Error('Facture non trouvée.');
  if (facture.paiements.length > 0) {
    throw new Error('Impossible de supprimer une facture qui a des paiements associés.');
  }

  return executePrismaOperation(async () => {
    await prisma.facture.delete({ where: { id } });
    return { success: true, message: 'Facture supprimée avec succès.' };
  }, 'Erreur lors de la suppression de la facture');
}

// ===============================
// STATISTIQUES, TENDANCES ET SPARKLINES
// ===============================

/**
 * Récupère les statistiques agrégées des factures.
 *
 * @returns {Promise<FacturesStatsExtended>} Métriques étendues
 */
export async function getFacturesStats() {
  return executePrismaOperation(async () => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [globalStats, dayStats, monthStats, yearStats, paiementsRecus] = await Promise.all([
      prisma.facture.aggregate({
        _count: { id: true },
        _sum: { montantTotal: true },
      }),
      prisma.facture.aggregate({
        where: { dateEmission: { gte: startOfDay } },
        _sum: { montantTotal: true },
      }),
      prisma.facture.aggregate({
        where: { dateEmission: { gte: startOfMonth } },
        _sum: { montantTotal: true },
      }),
      prisma.facture.aggregate({
        where: { dateEmission: { gte: startOfYear } },
        _sum: { montantTotal: true },
      }),
      prisma.paiement.aggregate({ _sum: { montant: true } }),
    ]);

    // 1. VRAI CALCUL DES IMPAYÉS : Prendre les factures valides (exclure PAYEE et ANNULEE)
    const facturesNonSoldees = await prisma.facture.findMany({
      where: {
        statut: { notIn: ['PAYEE', 'ANNULEE'] },
      },
      select: {
        id: true,
        montantTotal: true,
        // Inclure les paiements déjà faits pour calculer le reste à payer réel
        paiements: {
          select: { montant: true },
        },
      },
    });

    // Somme dynamique globale du reste à payer réel
    const montantImpaye = facturesNonSoldees.reduce((sum, f) => {
      const totalPayePourCetteFacture = f.paiements.reduce((pSum, p) => pSum + p.montant, 0);
      const resteAPayer = Math.max(0, f.montantTotal - totalPayePourCetteFacture);
      return sum + resteAPayer;
    }, 0);

    const totalFactures = globalStats._count.id;
    const montantTotal = globalStats._sum.montantTotal || 0;
    const facturesPayees = await count('facture', { statut: 'PAYEE' });
    const facturesImpayees = totalFactures - facturesPayees;
    const paiementsRecusTotal = paiementsRecus._sum.montant || 0;

    // 2. Évolution du montant impayé (comparaison mois précédent ajustée avec la même logique)
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endLastMonth = startOfMonth;

    const facturesLastMonth = await prisma.facture.findMany({
      where: {
        statut: { notIn: ['PAYEE', 'ANNULEE'] },
        dateEmission: { gte: startLastMonth, lt: endLastMonth },
      },
      select: {
        montantTotal: true,
        paiements: { select: { montant: true } },
      },
    });

    const impayeLastMonthValue = facturesLastMonth.reduce((sum, f) => {
      const totalPaye = f.paiements.reduce((pSum, p) => pSum + p.montant, 0);
      return sum + Math.max(0, f.montantTotal - totalPaye);
    }, 0);

    const montantImpayeEvolution =
      impayeLastMonthValue === 0
        ? montantImpaye > 0
          ? 100
          : 0
        : ((montantImpaye - impayeLastMonthValue) / impayeLastMonthValue) * 100;

    return {
      totalFactures,
      montantTotal,
      montantImpaye,
      facturesPayees,
      facturesImpayees,
      paiementsRecus: paiementsRecusTotal,
      montantJour: dayStats._sum.montantTotal || 0,
      montantMois: monthStats._sum.montantTotal || 0,
      montantAnnee: yearStats._sum.montantTotal || 0,
      montantImpayeEvolution: parseFloat(montantImpayeEvolution.toFixed(1)),
    };
  }, 'Erreur lors du calcul des statistiques des factures');
}

/**
 * Récupère les tendances évolutives (mois en cours vs mois précédent).
 *
 * @returns {Promise<FacturesTrends>} Tendances en pourcentage
 */
export async function getFacturesTrends() {
  return executePrismaOperation(async () => {
    const now = new Date();
    const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endLastMonth = startThisMonth;

    const [thisMonth, lastMonth] = await Promise.all([
      prisma.facture.aggregate({
        where: { dateEmission: { gte: startThisMonth } },
        _count: { id: true },
        _sum: { montantTotal: true },
      }),
      prisma.facture.aggregate({
        where: { dateEmission: { gte: startLastMonth, lt: endLastMonth } },
        _count: { id: true },
        _sum: { montantTotal: true },
      }),
    ]);

    const computeTrend = (current, prev) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return parseFloat((((current - prev) / prev) * 100).toFixed(1));
    };

    const currentCount = thisMonth._count.id || 0;
    const prevCount = lastMonth._count.id || 0;
    const currentTotal = thisMonth._sum.montantTotal || 0;
    const prevTotal = lastMonth._sum.montantTotal || 0;

    // Évolution du montant impayé (utiliser getFacturesStats)
    const stats = await getFacturesStats();
    const montantImpayeTrend = stats.montantImpayeEvolution;
    const paiementsRecusTrend = computeTrend(stats.paiementsRecus, 0); // simplifié

    return {
      totalFactures: computeTrend(currentCount, prevCount),
      montantTotal: computeTrend(currentTotal, prevTotal),
      montantImpaye: montantImpayeTrend,
      paiementsRecus: paiementsRecusTrend,
    };
  }, 'Erreur lors du calcul des tendances des factures');
}

/**
 * Récupère les données des sparklines pour les 12 derniers mois.
 *
 * @returns {Promise<FacturesSparklineData>} Sparklines
 */
export async function getFacturesSparklines() {
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

    const totalFacturesValues = [];
    const montantTotalValues = [];
    const montantImpayeValues = [];
    const paiementsRecusValues = [];

    for (const m of months) {
      const [facturesAgg, paiementsAgg] = await Promise.all([
        prisma.facture.aggregate({
          where: { dateEmission: { gte: m.start, lte: m.end } },
          _count: { id: true },
          _sum: { montantTotal: true },
        }),
        prisma.paiement.aggregate({
          where: { date: { gte: m.start, lte: m.end } },
          _sum: { montant: true },
        }),
      ]);
      totalFacturesValues.push(facturesAgg._count.id || 0);
      montantTotalValues.push(facturesAgg._sum.montantTotal || 0);
      paiementsRecusValues.push(paiementsAgg._sum.montant || 0);

      // Montant impayé : somme des montants des factures non soldées créées pendant ce mois
      const impaye = await prisma.facture.aggregate({
        where: {
          statut: { not: 'PAYEE' },
          dateEmission: { gte: m.start, lte: m.end },
        },
        _sum: { montantTotal: true },
      });
      montantImpayeValues.push(impaye._sum.montantTotal || 0);
    }

    return {
      totalFacturesSparkline: { values: totalFacturesValues, labels: months.map((m) => m.label) },
      montantTotalSparkline: { values: montantTotalValues, labels: months.map((m) => m.label) },
      montantImpayeSparkline: { values: montantImpayeValues, labels: months.map((m) => m.label) },
      paiementsRecusSparkline: { values: paiementsRecusValues, labels: months.map((m) => m.label) },
    };
  }, 'Erreur lors de la génération des sparklines');
}

// ===============================
// FONCTIONS SPÉCIFIQUES
// ===============================

/**
 * Récupère tous les paiements associés à une facture.
 *
 * @param {number} factureId - Identifiant de la facture
 * @returns {Promise<Paiement[]>} Liste des paiements
 */
export async function getPaiementsByFacture(factureId) {
  if (!factureId || isNaN(factureId)) throw new Error('Identifiant facture invalide.');
  return executePrismaOperation(async () => {
    return findMany('paiement', { factureId }, {}, { date: 'desc' });
  }, 'Erreur lors de la récupération des paiements de la facture');
}

/**
 * Récupère toutes les factures d’un candidat spécifique.
 *
 * @param {number} candidatId - Identifiant du candidat
 * @returns {Promise<Facture[]>} Liste des factures du candidat
 */
export async function getFacturesByCandidat(candidatId) {
  if (!candidatId || isNaN(candidatId)) throw new Error('Identifiant candidat invalide.');
  return executePrismaOperation(async () => {
    return findMany(
      'facture',
      { candidatId },
      {
        paiements: {
          select: { id: true, montant: true, date: true, mode: true },
          orderBy: { date: 'desc' },
        },
      },
      { dateEmission: 'desc' }
    );
  }, 'Erreur lors de la récupération des factures du candidat');
}

// ===============================
// GÉNÉRATION PDF & ENVOI EMAIL (STUBS)
// ===============================

/**
 * Génère (ou régénère) le PDF d’une facture.
 * Pour l’instant, un stub qui simule la création et retourne un chemin fictif.
 *
 * @param {number} id - Identifiant de la facture
 * @returns {Promise<{ success: boolean; path: string; message?: string }>}
 */
export async function generateFacturePDF(id) {
  if (!id || isNaN(id)) throw new Error('Identifiant facture invalide.');
  const facture = await getFactureById(id);
  if (!facture) throw new Error('Facture non trouvée.');

  // Simulation : chemin fictif basé sur le numéro
  const fakePath = `/pdfs/factures/${facture.numero}.pdf`;
  // Mettre à jour le chemin PDF dans la base (optionnel)
  await updateFacture(id, { pdfPath: fakePath });
  return { success: true, path: fakePath, message: 'PDF généré (simulation)' };
}

/**
 * Envoie la facture par email au candidat.
 * Stub – nécessite une intégration réelle avec nodemailer ou autre.
 *
 * @param {number} id - Identifiant de la facture
 * @returns {Promise<{ success: boolean; message: string }>}
 */
export async function sendFactureByEmail(id) {
  if (!id || isNaN(id)) throw new Error('Identifiant facture invalide.');
  const facture = await getFactureById(id);
  if (!facture) throw new Error('Facture non trouvée.');
  if (!facture.candidat?.email) throw new Error('Le candidat n’a pas d’adresse email.');

  // Simuler l’envoi
  console.log(
    `[sendFactureByEmail] Envoi de la facture ${facture.numero} à ${facture.candidat.email}`
  );
  return { success: true, message: `Email envoyé à ${facture.candidat.email} (simulation)` };
}
