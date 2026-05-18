// /home/stive-junior/Auto-ecole-COS/electron/services/paiement.service.js

/**
 * Service de gestion des paiements (encaissements)
 *
 * @module paiementService
 * @description
 * Fournit toutes les opérations CRUD pour les paiements, les statistiques agrégées,
 * les tendances, les sparklines, ainsi que les calculs de solde candidat et résumés mensuels.
 * Gère également la synchronisation avec la caisse (mouvements d'entrée) et les factures.
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
  update,
  findUnique,
  findMany,
  count,
  transaction,
} from './prisma.client.js';
import { createPaiementWithCaisse } from './prisma.client.js';

// ===============================
// CONSTANTES & UTILITAIRES INTERNES
// ===============================

/** Liste des modes de paiement valides (basée sur l'énumération Prisma) */
const MODES_PAIEMENT = ['ESPECES', 'CHEQUE', 'VIREMENT', 'CARTE', 'MOBILE_MONEY'];

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
 * @param {string} [params.search] - Recherche sur référence, note, ou nom candidat
 * @param {string} [params.mode] - Mode de paiement
 * @param {number} [params.candidatId] - ID du candidat
 * @param {number} [params.factureId] - ID de la facture
 * @param {Date|string} [params.dateDebut] - Date début (inclus)
 * @param {Date|string} [params.dateFin] - Date fin (inclus)
 * @param {string} [params.period] - Période prédéfinie (today, week, month, all)
 * @returns {Object} Condition Prisma `where`
 */
function buildWhereClause({ search, mode, candidatId, factureId, dateDebut, dateFin, period }) {
  const where = {};

  if (mode && MODES_PAIEMENT.includes(mode)) {
    where.mode = mode;
  }

  if (candidatId && !isNaN(candidatId)) {
    where.candidatId = Number(candidatId);
  }

  if (factureId && !isNaN(factureId)) {
    where.factureId = Number(factureId);
  }

  if (search && search.trim().length > 0) {
    const term = search.trim();
    where.OR = [
      { reference: { contains: term, mode: 'insensitive' } },
      { note: { contains: term, mode: 'insensitive' } },
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

  // Gestion de la période
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
// FONCTIONS PRINCIPALES (exportées)
// ===============================

/**
 * Récupère la liste des paiements avec filtres optionnels.
 * Si `page` et `limit` sont fournis, la réponse est paginée.
 * Sinon, retourne tous les paiements correspondant aux filtres.
 *
 * @param {Object} [params] - Paramètres de pagination, filtres et tri
 * @param {number} [params.page] - Numéro de page (1-indexed) – optionnel
 * @param {number} [params.limit] - Nombre d'éléments par page – optionnel
 * @param {string} [params.search] - Recherche textuelle (référence, note, nom candidat)
 * @param {string} [params.mode] - Mode de paiement
 * @param {number} [params.candidatId] - Filtrer par candidat
 * @param {number} [params.factureId] - Filtrer par facture
 * @param {Date|string} [params.dateDebut] - Date de début
 * @param {Date|string} [params.dateFin] - Date de fin
 * @param {'today'|'week'|'month'|'all'} [params.period] - Période prédéfinie
 * @param {'date'|'montant'|'createdAt'} [params.sortBy='date'] - Champ de tri (si paginé)
 * @param {'asc'|'desc'} [params.sortOrder='desc'] - Sens du tri (si paginé)
 * @returns {Promise<Object|Array>} Si paginé : { paiements, total, page, limit, totalPages }
 *                                   Sinon : tableau direct de paiements.
 *
 * @example
 * // Paginé
 * const result = await getAllPaiements({ page: 2, limit: 20, mode: 'MOBILE_MONEY', period: 'month' });
 * // Non paginé
 * const all = await getAllPaiements({ mode: 'MOBILE_MONEY' });
 */
export async function getAllPaiements(params = {}) {
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
      const [paiements, total] = await Promise.all([
        findMany(
          'paiement',
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
            facture: {
              select: {
                id: true,
                numero: true,
                montantTotal: true,
                statut: true,
              },
            },
          },
          orderBy,
          skip,
          take
        ),
        count('paiement', where),
      ]);

      return {
        paiements,
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take),
      };
    }, 'Erreur lors de la récupération des paiements');
  } else {
    // Pas de pagination : retourner tous les paiements (triés par date décroissante par défaut)
    return executePrismaOperation(async () => {
      const paiements = await findMany(
        'paiement',
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
          facture: {
            select: {
              id: true,
              numero: true,
              montantTotal: true,
              statut: true,
            },
          },
        },
        { date: 'desc' } // tri par date décroissante
      );
      return paiements; // tableau direct
    }, 'Erreur lors de la récupération des paiements');
  }
}

/**
 * Récupère un paiement par son identifiant avec candidat et facture associés.
 *
 * @param {number} id - Identifiant du paiement
 * @returns {Promise<Object>} Paiement complet avec relations
 * @throws {Error} Si le paiement n'existe pas
 */
export async function getPaiementById(id) {
  if (!id || isNaN(id)) {
    throw new Error('Identifiant paiement invalide.');
  }

  return executePrismaOperation(async () => {
    const paiement = await findUnique(
      'paiement',
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
            categorie: true,
            numeroPermis: true,
          },
        },
        facture: {
          include: {
            paiements: {
              // ⬅️ Inclure tous les paiements de la facture
              select: {
                id: true,
                montant: true,
                date: true,
                mode: true,
              },
              orderBy: { date: 'desc' },
            },
          },
        },
      }
    );
    if (!paiement) {
      throw new Error('Paiement non trouvé.');
    }
    return paiement;
  }, 'Erreur lors de la récupération du paiement');
}

/**
 * Crée un nouveau paiement, met à jour la caisse et le statut de la facture si nécessaire.
 * Si `factureId` n'est pas fourni, recherche automatiquement la facture la plus récente
 * du candidat (non annulée). Si aucune facture n'existe, en crée une automatiquement
 * à partir du montant total de la formation du candidat.
 *
 * @param {Object} data - Données du paiement
 * @param {number} data.montant - Montant en FCFA (>0)
 * @param {string} data.mode - Mode de paiement (ESPECES, CHEQUE, VIREMENT, CARTE, MOBILE_MONEY)
 * @param {number} data.candidatId - Identifiant du candidat
 * @param {Date|string} [data.date] - Date du paiement (défaut: maintenant)
 * @param {string|null} [data.reference] - Référence externe
 * @param {string|null} [data.note] - Note interne
 * @param {number|null} [data.factureId] - Identifiant de la facture associée (optionnel)
 * @returns {Promise<Object>} Paiement créé (avec relations candidat et facture)
 */
export async function createPaiement(data) {
  // Validation
  if (!data.montant || data.montant <= 0) {
    throw new Error('Le montant doit être un nombre positif.');
  }
  if (!data.mode || !MODES_PAIEMENT.includes(data.mode)) {
    throw new Error(`Mode de paiement invalide. Valeurs autorisées : ${MODES_PAIEMENT.join(', ')}`);
  }
  if (!data.candidatId || isNaN(data.candidatId)) {
    throw new Error('Identifiant candidat invalide.');
  }

  // Vérifier l'existence du candidat
  const candidat = await findUnique('candidat', { id: data.candidatId, deletedAt: null });
  if (!candidat) {
    throw new Error('Candidat non trouvé.');
  }

  const paiementData = {
    montant: data.montant,
    mode: data.mode,
    candidatId: data.candidatId,
    date: data.date ? toDate(data.date) : new Date(),
    reference: data.reference?.trim() || null,
    note: data.note?.trim() || null,
    factureId: data.factureId && !isNaN(data.factureId) ? Number(data.factureId) : null,
    createdAt: new Date(),
  };

  return executePrismaOperation(async () => {
    let finalFactureId = paiementData.factureId;

    // 1. Si aucune facture n'est fournie, en rechercher une automatiquement
    if (!finalFactureId) {
      // Récupérer la facture la plus récente du candidat (non annulée)
      const latestFacture = await prisma.facture.findFirst({
        where: {
          candidatId: data.candidatId,
          statut: { not: 'ANNULEE' },
        },
        orderBy: { dateEmission: 'desc' },
      });

      if (latestFacture) {
        finalFactureId = latestFacture.id;
      } else {
        // Aucune facture existante : en créer une automatiquement
        // Récupérer la formation du candidat pour obtenir le montant total
        const formationCandidat = await prisma.formationCandidat.findUnique({
          where: { candidatId: data.candidatId },
          include: { formation: true },
        });
        let montantTotal = 0;
        if (formationCandidat) {
          montantTotal =
            formationCandidat.montantTotal ?? formationCandidat.formation?.prixTotal ?? 0;
        } else {
          // Fallback : chercher la formation par défaut via la catégorie du candidat
          const defaultFormation = await prisma.formation.findFirst({
            where: { categorie: candidat.categorie, actif: true },
            orderBy: { createdAt: 'desc' },
          });
          if (defaultFormation) {
            montantTotal = defaultFormation.prixTotal;
          }
        }

        if (montantTotal === 0) {
          throw new Error(
            'Impossible de créer une facture automatique : montant total de la formation introuvable.'
          );
        }

        // Générer un numéro de facture unique
        const factureNumber = await generateFactureNumber();
        const newFacture = await prisma.facture.create({
          data: {
            numero: factureNumber,
            montantTotal,
            statut: 'EN_ATTENTE',
            dateEmission: new Date(),
            candidatId: data.candidatId,
            notes: `Facture automatique générée pour le candidat ${candidat.nom} ${candidat.prenom}`,
          },
        });
        finalFactureId = newFacture.id;
      }
    }

    // 2. Mettre à jour les données du paiement avec la facture déterminée
    paiementData.factureId = finalFactureId;

    // 3. Créer le paiement via la transaction qui gère aussi la caisse
    const newPaiement = await createPaiementWithCaisse(paiementData);

    // 4. Mettre à jour le solde de la facture associée (recalcule le statut)
    await updateFactureSolde(prisma, finalFactureId);

    // 5. Recharger le paiement avec les relations pour le retour
    return findUnique(
      'paiement',
      { id: newPaiement.id },
      {
        candidat: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
        facture: {
          select: { id: true, numero: true, montantTotal: true, statut: true },
        },
      }
    );
  }, 'Erreur lors de la création du paiement');
}

/**
 * Génère un numéro de facture unique.
 * @returns {Promise<string>} Numéro de facture au format FAC-{année}{mois}-{compteur}
 */
async function generateFactureNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `FAC-${year}${month}`;

  // Compter les factures du mois courant
  const count = await prisma.facture.count({
    where: {
      numero: { startsWith: prefix },
    },
  });
  const counter = String(count + 1).padStart(3, '0');
  return `${prefix}-${counter}`;
}

/**
 * Met à jour un paiement existant (patch partiel).
 * Seuls les champs non financiers peuvent être modifiés (note, référence, factureId).
 * Le montant, le mode et la date ne sont pas modifiables pour garantir la cohérence de la caisse.
 *
 * @param {number} id - Identifiant du paiement
 * @param {Object} data - Champs à modifier
 * @param {string|null} [data.reference] - Nouvelle référence
 * @param {string|null} [data.note] - Nouvelle note
 * @param {number|null} [data.factureId] - Nouvelle facture associée
 * @returns {Promise<Object>} Paiement mis à jour
 */
export async function updatePaiement(id, data) {
  if (!id || isNaN(id)) {
    throw new Error('Identifiant paiement invalide.');
  }

  const existing = await findUnique('paiement', { id });
  if (!existing) {
    throw new Error('Paiement non trouvé.');
  }

  const updateData = {};
  if (data.reference !== undefined) updateData.reference = data.reference?.trim() || null;
  if (data.note !== undefined) updateData.note = data.note?.trim() || null;
  if (data.factureId !== undefined) {
    updateData.factureId = data.factureId && !isNaN(data.factureId) ? Number(data.factureId) : null;
  }

  // Si le champ factureId change, il faudra peut-être recalculer le statut de la facture
  // On le fera dans une transaction pour mettre à jour les deux factures (ancienne et nouvelle)
  const needFactureUpdate = data.factureId !== undefined && data.factureId !== existing.factureId;

  return executePrismaOperation(async () => {
    let updatedPaiement;
    if (needFactureUpdate) {
      await transaction(async (tx) => {
        // Détacher de l'ancienne facture si elle existe
        if (existing.factureId) {
          await updateFactureSolde(tx, existing.factureId);
        }
        // Mettre à jour le paiement
        updatedPaiement = await tx.paiement.update({
          where: { id },
          data: updateData,
        });
        // Mettre à jour la nouvelle facture
        if (updateData.factureId) {
          await updateFactureSolde(tx, updateData.factureId);
        }
      });
    } else {
      updatedPaiement = await update('paiement', { id }, updateData);
    }

    return findUnique(
      'paiement',
      { id: updatedPaiement.id },
      {
        candidat: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
        facture: {
          select: { id: true, numero: true, montantTotal: true, statut: true },
        },
      }
    );
  }, 'Erreur lors de la mise à jour du paiement');
}

/**
 * Supprime définitivement un paiement. Annule également l'entrée en caisse correspondante.
 *
 * @param {number} id - Identifiant du paiement
 * @returns {Promise<{ success: boolean; message: string }>}
 */
export async function deletePaiement(id) {
  if (!id || isNaN(id)) {
    throw new Error('Identifiant paiement invalide.');
  }

  const paiement = await findUnique('paiement', { id });
  if (!paiement) {
    throw new Error('Paiement non trouvé.');
  }

  return executePrismaOperation(async () => {
    await transaction(async (tx) => {
      // Supprimer l'entrée de caisse correspondante (chercher le mouvement avec la même référence ou description)
      // On suppose que le mouvement de caisse a été créé avec la référence du paiement ou une description contenant l'id
      await tx.caisse.deleteMany({
        where: {
          reference: paiement.reference,
          type: 'ENTREE',
          montant: paiement.montant,
        },
      });
      // Supprimer le paiement
      await tx.paiement.delete({ where: { id } });
      // Mettre à jour la facture associée si elle existe
      if (paiement.factureId) {
        await updateFactureSolde(tx, paiement.factureId);
      }
    });
    return { success: true, message: 'Paiement supprimé avec succès.' };
  }, 'Erreur lors de la suppression du paiement');
}

// ===============================
// STATISTIQUES, TENDANCES ET SPARKLINES
// ===============================

/**
 * Récupère les statistiques agrégées complètes des paiements.
 *
 * @returns {Promise<Object>} Statistiques étendues
 * @property {number} totalEncaissements - Somme de tous les paiements
 * @property {number} nombreTransactions - Nombre total de paiements
 * @property {number} encaissementsMois - Encaissements du mois en cours
 * @property {number} montantMoyen - Montant moyen par paiement
 * @property {number} montantJour - Encaissements du jour
 * @property {number} nombreTransactionsJour - Nombre de paiements du jour
 * @property {number} encaissementsAnnee - Encaissements de l'année civile
 * @property {number} nombreTransactionsAnnee - Nombre de paiements de l'année
 * @property {Array} repartitionModes - Répartition par mode de paiement
 */
export async function getPaiementsStats() {
  return executePrismaOperation(async () => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Agrégations globales
    const globalAgg = await prisma.paiement.aggregate({
      _sum: { montant: true },
      _count: { id: true },
      _avg: { montant: true },
    });

    // Mois en cours
    const monthAgg = await prisma.paiement.aggregate({
      where: { date: { gte: startOfMonth } },
      _sum: { montant: true },
      _count: { id: true },
    });

    // Jour
    const dayAgg = await prisma.paiement.aggregate({
      where: { date: { gte: startOfDay } },
      _sum: { montant: true },
      _count: { id: true },
    });

    // Année
    const yearAgg = await prisma.paiement.aggregate({
      where: { date: { gte: startOfYear } },
      _sum: { montant: true },
      _count: { id: true },
    });

    // Répartition par mode
    const modeRepartition = await prisma.paiement.groupBy({
      by: ['mode'],
      _count: { mode: true },
      _sum: { montant: true },
    });

    const totalEncaissements = globalAgg._sum.montant || 0;
    const repartitionModes = modeRepartition.map((r) => ({
      mode: r.mode,
      count: r._count.mode,
      total: r._sum.montant || 0,
      pct: totalEncaissements > 0 ? (r._sum.montant / totalEncaissements) * 100 : 0,
    }));

    return {
      totalEncaissements,
      nombreTransactions: globalAgg._count.id || 0,
      encaissementsMois: monthAgg._sum.montant || 0,
      montantMoyen: Math.round(globalAgg._avg.montant || 0),
      montantJour: dayAgg._sum.montant || 0,
      nombreTransactionsJour: dayAgg._count.id || 0,
      encaissementsAnnee: yearAgg._sum.montant || 0,
      nombreTransactionsAnnee: yearAgg._count.id || 0,
      repartitionModes,
    };
  }, 'Erreur lors du calcul des statistiques des paiements');
}

/**
 * Récupère les tendances évolutives (mois courant vs mois précédent).
 *
 * @returns {Promise<Object>} Tendances en pourcentage
 * @property {number} totalEncaissements - Variation des encaissements
 * @property {number} nombreTransactions - Variation du nombre de transactions
 * @property {number} encaissementsMois - Variation du montant mensuel (utilisée pour la carte)
 * @property {number} montantMoyen - Variation du montant moyen
 */
export async function getPaiementsTrends() {
  return executePrismaOperation(async () => {
    const now = new Date();
    const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endLastMonth = startThisMonth;

    const [thisMonth, lastMonth] = await Promise.all([
      prisma.paiement.aggregate({
        where: { date: { gte: startThisMonth } },
        _sum: { montant: true },
        _count: { id: true },
        _avg: { montant: true },
      }),
      prisma.paiement.aggregate({
        where: { date: { gte: startLastMonth, lt: endLastMonth } },
        _sum: { montant: true },
        _count: { id: true },
        _avg: { montant: true },
      }),
    ]);

    const computeTrend = (current, prev) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return parseFloat((((current - prev) / prev) * 100).toFixed(1));
    };

    const currentTotal = thisMonth._sum.montant || 0;
    const prevTotal = lastMonth._sum.montant || 0;
    const currentCount = thisMonth._count.id || 0;
    const prevCount = lastMonth._count.id || 0;
    const currentAvg = thisMonth._avg.montant || 0;
    const prevAvg = lastMonth._avg.montant || 0;

    return {
      totalEncaissements: computeTrend(currentTotal, prevTotal),
      nombreTransactions: computeTrend(currentCount, prevCount),
      encaissementsMois: computeTrend(currentTotal, prevTotal),
      montantMoyen: computeTrend(currentAvg, prevAvg),
    };
  }, 'Erreur lors du calcul des tendances des paiements');
}

/**
 * Récupère les données des sparklines pour les 12 derniers mois.
 *
 * @returns {Promise<Object>} Sparklines pour total, nombre, montant moyen
 */
export async function getPaiementsSparklines() {
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
    const countValues = [];
    const avgValues = [];

    for (const m of months) {
      const agg = await prisma.paiement.aggregate({
        where: { date: { gte: m.start, lte: m.end } },
        _sum: { montant: true },
        _count: { id: true },
        _avg: { montant: true },
      });
      totalValues.push(agg._sum.montant || 0);
      countValues.push(agg._count.id || 0);
      avgValues.push(Math.round(agg._avg.montant || 0));
    }

    return {
      totalEncaissementsSparkline: { values: totalValues, labels: months.map((m) => m.label) },
      nombreTransactionsSparkline: { values: countValues, labels: months.map((m) => m.label) },
      encaissementsMoisSparkline: { values: totalValues, labels: months.map((m) => m.label) }, // identique pour l'instant
      montantMoyenSparkline: { values: avgValues, labels: months.map((m) => m.label) },
    };
  }, 'Erreur lors de la génération des sparklines');
}

// ===============================
// FONCTIONS SPÉCIFIQUES (candidat, solde, résumé mensuel)
// ===============================

/**
 * Récupère tous les paiements d'un candidat spécifique.
 *
 * @param {number} candidatId - Identifiant du candidat
 * @returns {Promise<Array>} Liste des paiements triés par date décroissante
 */
export async function getPaiementsByCandidat(candidatId) {
  if (!candidatId || isNaN(candidatId)) {
    throw new Error('Identifiant candidat invalide.');
  }
  return executePrismaOperation(async () => {
    const paiements = await findMany(
      'paiement',
      { candidatId },
      {
        facture: {
          select: { id: true, numero: true, montantTotal: true, statut: true },
        },
      },
      { date: 'desc' }
    );
    return paiements;
  }, 'Erreur lors de la récupération des paiements du candidat');
}

/**
 * Calcule le solde d'un candidat (montant total de la formation - total payé).
 *
 * La logique repose sur :
 * - Le montant total à payer = montantTotal de FormationCandidat (ou prix total de la formation associée si absent)
 * - Le total payé = somme de tous les paiements du candidat (peu importe qu'ils soient rattachés à une facture ou non)
 *
 * @param {number} candidatId - Identifiant du candidat
 * @returns {Promise<Object>} Solde détaillé
 * @property {number} candidatId
 * @property {number} montantTotalFormation - Montant total de la formation (prix à payer)
 * @property {number} totalPaye - Somme de tous les paiements effectués
 * @property {number} solde - Reste à payer (montantTotalFormation - totalPaye) jamais négatif
 * @property {boolean} estSolde - Vrai si totalPaye >= montantTotalFormation
 * @property {boolean} tropPerçu - Vrai si totalPaye > montantTotalFormation (crédit)
 */
export async function getSoldeCandidat(candidatId) {
  if (!candidatId || isNaN(candidatId)) {
    throw new Error('Identifiant candidat invalide.');
  }

  return executePrismaOperation(async () => {
    // 1. Récupérer la formation associée au candidat
    const formationCandidat = await prisma.formationCandidat.findUnique({
      where: { candidatId },
      include: { formation: true },
    });

    let montantTotalFormation = 0;
    let formationNom = null;

    if (formationCandidat) {
      // Priorité au montantTotal personnalisé (remise possible)
      montantTotalFormation =
        formationCandidat.montantTotal ?? formationCandidat.formation?.prixTotal ?? 0;
      formationNom = formationCandidat.formation?.nom;
    } else {
      // Fallback : chercher une formation par défaut via candidat.categorie (optionnel)
      const candidat = await prisma.candidat.findUnique({
        where: { id: candidatId },
        select: { categorie: true },
      });
      if (candidat) {
        const defaultFormation = await prisma.formation.findFirst({
          where: { categorie: candidat.categorie, actif: true },
          orderBy: { createdAt: 'desc' },
        });
        if (defaultFormation) {
          montantTotalFormation = defaultFormation.prixTotal;
          formationNom = defaultFormation.nom;
        }
      }
    }

    // 2. Somme de tous les paiements du candidat (indépendamment des factures)
    const paiementsAgg = await prisma.paiement.aggregate({
      where: { candidatId },
      _sum: { montant: true },
    });
    const totalPaye = paiementsAgg._sum.montant || 0;

    const solde = Math.max(0, montantTotalFormation - totalPaye);
    const estSolde = totalPaye >= montantTotalFormation;
    const tropPerçu = totalPaye > montantTotalFormation;

    return {
      candidatId,
      montantTotalFormation,
      totalPaye,
      solde,
      estSolde,
      tropPerçu,
      formationNom,
    };
  }, 'Erreur lors du calcul du solde du candidat');
}

/**
 * Récupère le résumé mensuel des paiements pour un mois/année donnés.
 *
 * @param {number} annee - Année (ex: 2025)
 * @param {number} mois - Mois (1 = Janvier, 12 = Décembre)
 * @returns {Promise<Object>} Résumé mensuel (totaux, moyenne, répartition modes, évolution)
 */
export async function getResumeMensuel(annee, mois) {
  if (!annee || !mois || mois < 1 || mois > 12) {
    throw new Error('Année et mois valides requis.');
  }

  const startDate = new Date(annee, mois - 1, 1);
  const endDate = new Date(annee, mois, 0);

  const startPrev = new Date(annee, mois - 2, 1);
  const endPrev = new Date(annee, mois - 1, 0);

  return executePrismaOperation(async () => {
    const [currentAgg, prevAgg, modeRepartition] = await Promise.all([
      prisma.paiement.aggregate({
        where: { date: { gte: startDate, lte: endDate } },
        _sum: { montant: true },
        _count: { id: true },
        _avg: { montant: true },
      }),
      prisma.paiement.aggregate({
        where: { date: { gte: startPrev, lte: endPrev } },
        _sum: { montant: true },
        _count: { id: true },
      }),
      prisma.paiement.groupBy({
        by: ['mode'],
        where: { date: { gte: startDate, lte: endDate } },
        _count: { mode: true },
        _sum: { montant: true },
      }),
    ]);

    const totalEncaissements = currentAgg._sum.montant || 0;
    const nombreTransactions = currentAgg._count.id || 0;
    const montantMoyen = currentAgg._avg.montant || 0;
    const prevTotal = prevAgg._sum.montant || 0;
    const evolution =
      prevTotal === 0
        ? totalEncaissements > 0
          ? 100
          : 0
        : ((totalEncaissements - prevTotal) / prevTotal) * 100;

    const repartitionModes = modeRepartition.map((r) => ({
      mode: r.mode,
      count: r._count.mode,
      total: r._sum.montant || 0,
      pct: totalEncaissements > 0 ? (r._sum.montant / totalEncaissements) * 100 : 0,
    }));

    return {
      annee,
      mois,
      totalEncaissements,
      nombreTransactions,
      montantMoyen: Math.round(montantMoyen),
      repartitionModes,
      evolution: parseFloat(evolution.toFixed(1)),
    };
  }, 'Erreur lors de la génération du résumé mensuel');
}

// ===============================
// FONCTION D'IMPRESSION (STUB)
// ===============================

/**
 * Exporte / imprime le reçu d'un paiement (génère un PDF).
 * Pour l'instant, cette fonction renvoie un chemin fictif.
 * Une véritable implémentation nécessiterait une librairie comme pdfkit ou html-to-pdf.
 *
 * @param {number} id - Identifiant du paiement
 * @returns {Promise<{ success: boolean; path?: string; message?: string }>}
 */
export async function printReceipt(id) {
  if (!id || isNaN(id)) {
    throw new Error('Identifiant paiement invalide.');
  }

  const paiement = await getPaiementById(id);
  if (!paiement) {
    throw new Error('Paiement non trouvé.');
  }

  // Simuler la génération d'un PDF
  // Dans la réalité, on utiliserait `pdfkit` ou `electron.print`
  console.log(`[printReceipt] Génération du reçu pour le paiement #${id}`);
  const fakePath = `/receipts/paiement_${id}.pdf`;
  return {
    success: true,
    path: fakePath,
    message: `Reçu généré : ${fakePath}`,
  };
}

// ===============================
// FONCTION INTERNE DE MISE À JOUR DE FACTURE
// ===============================

/**
 * Recalcule le statut d'une facture en fonction de ses paiements.
 * Utilisé en interne dans les transactions.
 * @param {Prisma.TransactionClient} tx - Client Prisma transactionnel
 * @param {number} factureId
 * @returns {Promise<void>}
 */
async function updateFactureSolde(tx, factureId) {
  const facture = await tx.facture.findUnique({
    where: { id: factureId },
    include: { paiements: true },
  });
  if (!facture) return;

  const totalPaye = facture.paiements.reduce((sum, p) => sum + p.montant, 0);
  let nouveauStatut = 'EN_ATTENTE';
  if (totalPaye >= facture.montantTotal) {
    nouveauStatut = 'PAYEE';
  } else if (totalPaye > 0) {
    nouveauStatut = 'PARTIELLEMENT_PAYEE';
  }
  await tx.facture.update({
    where: { id: factureId },
    data: { statut: nouveauStatut },
  });
}
