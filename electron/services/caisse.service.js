// /home/stive-junior/Auto-ecole-COS/electron/services/caisse.service.js

/**
 * Service de gestion de la caisse (trésorerie)
 *
 * @module caisseService
 * @description
 * Fournit l'accès aux mouvements de caisse (entrées = paiements, sorties = dépenses),
 * les statistiques agrégées, les tendances et les sparklines pour le dashboard.
 *
 * Ce service ne crée pas de mouvements directement : ils sont générés à partir des
 * paiements (entrées) et des dépenses (sorties). Le solde est recalculé dynamiquement
 * en parcourant les mouvements dans l'ordre chronologique.
 *
 * Toutes les fonctions utilisent le wrapper `executePrismaOperation` pour une
 * gestion homogène des erreurs. Les dates sont manipulées au format ISO.
 *
 * @author Stive Junior
 * @version 2.0.0
 *
 * @see {@link prisma.client.js} – Utilitaires génériques Prisma
 */

import { executePrismaOperation, findMany } from './prisma.client.js';

// ===============================
// CONSTANTES & UTILITAIRES INTERNES
// ===============================

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
 * Construit l'objet `where` pour filtrer les paiements ou dépenses.
 * @param {Object} params
 * @param {Date|string} [params.dateDebut] - Date de début
 * @param {Date|string} [params.dateFin] - Date de fin
 * @returns {Object} Condition Prisma pour la date
 */
function buildDateWhereClause({ dateDebut, dateFin }) {
  if (dateDebut || dateFin) {
    const dateFilter = {};
    if (dateDebut) dateFilter.gte = toDate(dateDebut);
    if (dateFin) dateFilter.lte = toDate(dateFin);
    return { date: dateFilter };
  }
  return {};
}

/**
 * Récupère tous les paiements (entrées) et dépenses (sorties) dans une période,
 * les fusionne, calcule le solde courant et les trie.
 * Version enrichie avec les relations candidat et véhicule complètes.
 *
 * @param {Object} [params] - Paramètres de filtrage
 * @param {string} [params.search] - Recherche textuelle (description, référence)
 * @param {string} [params.type] - Filtrer par type ('ENTREE' ou 'SORTIE')
 * @param {Date|string} [params.dateDebut] - Date de début
 * @param {Date|string} [params.dateFin] - Date de fin
 * @param {string} [params.sortBy='date'] - Champ de tri (date, montant)
 * @param {'asc'|'desc'} [params.sortOrder='desc'] - Sens du tri
 * @returns {Promise<Array>} Liste des mouvements unifiés avec entree/sortie complets
 */
async function getMouvementsUnified(params = {}) {
  const { search, type, sortBy = 'date', sortOrder = 'desc' } = params;
  const dateWhere = buildDateWhereClause(params);

  // Construire la clause de recherche textuelle
  const searchWhere = {};
  if (search && search.trim().length > 0) {
    const term = search.trim();
    searchWhere.OR = [
      { description: { contains: term, mode: 'insensitive' } },
      { reference: { contains: term, mode: 'insensitive' } },
    ];
  }

  // Récupérer les paiements (entrées) avec les relations candidat
  const paiements = await findMany(
    'paiement',
    { ...dateWhere, ...searchWhere },
    {
      candidat: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          telephone: true,
          statut: true,
        },
      },
    },
    { date: 'asc' }
  );

  // Récupérer les dépenses (sorties) avec les relations véhicule
  const depenses = await findMany(
    'depense',
    { ...dateWhere, ...searchWhere },
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
    { date: 'asc' }
  );

  // Transformer en mouvements unifiés avec les relations enrichies
  let mouvements = [
    ...paiements.map((p) => ({
      id: p.id,
      type: 'ENTREE',
      montant: p.montant,
      date: p.date,
      description: p.note || `Paiement ${p.mode} - ${p.candidat?.prenom} ${p.candidat?.nom}`,
      reference: p.reference,
      createdAt: p.createdAt,
      entree: {
        id: p.id,
        candidat: p.candidat,
        montant: p.montant,
        mode: p.mode,
        reference: p.reference,
        note: p.note,
      },
      sortie: null,
    })),
    ...depenses.map((d) => ({
      id: d.id,
      type: 'SORTIE',
      montant: d.montant,
      date: d.date,
      description: d.description || `Dépense ${d.categorie}`,
      reference: d.reference,
      createdAt: d.createdAt,
      entree: null,
      sortie: {
        id: d.id,
        vehicule: d.vehicule,
        montant: d.montant,
        description: d.description,
        categorie: d.categorie,
        fournisseur: d.fournisseur,
        reference: d.reference,
      },
    })),
  ];

  // Filtrer par type si demandé
  if (type) {
    mouvements = mouvements.filter((m) => m.type === type);
  }

  // Trier par date (croissant d'abord pour calculer le solde)
  mouvements.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculer le solde courant (parcours chronologique)
  let solde = 0;
  for (const m of mouvements) {
    solde += m.type === 'ENTREE' ? m.montant : -m.montant;
    m.solde = solde;
  }

  // Retrier selon l'ordre demandé
  const orderDirection = sortOrder === 'asc' ? 1 : -1;
  mouvements.sort((a, b) => {
    let aVal, bVal;
    if (sortBy === 'date') {
      aVal = new Date(a.date).getTime();
      bVal = new Date(b.date).getTime();
    } else if (sortBy === 'montant') {
      aVal = a.montant;
      bVal = b.montant;
    } else {
      aVal = new Date(a.date).getTime();
      bVal = new Date(b.date).getTime();
    }
    return orderDirection === 1 ? aVal - bVal : bVal - aVal;
  });

  return mouvements;
}

// ===============================
// FONCTIONS PRINCIPALES (exportées)
// ===============================

/**
 * Récupère la liste paginée des mouvements de caisse avec filtres optionnels.
 * Si `page` et `limit` ne sont pas fournis, retourne tous les mouvements.
 *
 * @param {Object} [params] - Paramètres de pagination, filtres et tri
 * @param {number} [params.page] - Numéro de page (1-indexed) – optionnel
 * @param {number} [params.limit] - Nombre d'éléments par page – optionnel
 * @param {string} [params.search] - Recherche textuelle (description, référence)
 * @param {string} [params.type] - Filtrer par type ('ENTREE' ou 'SORTIE')
 * @param {Date|string} [params.dateDebut] - Date de début
 * @param {Date|string} [params.dateFin] - Date de fin
 * @param {string} [params.sortBy='date'] - Champ de tri (date, montant)
 * @param {'asc'|'desc'} [params.sortOrder='desc'] - Sens du tri
 * @returns {Promise<Object>} Si paginé : { mouvements, total, page, limit, totalPages }
 *                                   Sinon : tableau direct de mouvements
 */
export async function getAllMouvements(params = {}) {
  const { page, limit, ...filters } = params;

  // Cas non paginé
  if (page === undefined || limit === undefined) {
    const mouvements = await getMouvementsUnified(filters);
    return mouvements;
  }

  // Cas paginé
  const skip = (Math.max(1, page) - 1) * Math.max(1, limit);
  const take = Math.max(1, limit);

  const allMouvements = await getMouvementsUnified(filters);
  const total = allMouvements.length;
  const mouvements = allMouvements.slice(skip, skip + take);

  return {
    mouvements,
    total,
    page,
    limit: take,
    totalPages: Math.ceil(total / take),
  };
}

/**
 * Récupère les statistiques agrégées de la caisse.
 * Le solde actuel est le solde du dernier mouvement (tous mouvements confondus).
 *
 * @returns {Promise<CaisseStatsExtended>} Métriques étendues
 */
export async function getCaisseStats() {
  return executePrismaOperation(async () => {
    // Récupérer tous les mouvements pour calculer les totaux
    const allMouvements = await getMouvementsUnified({});

    // Solde actuel = solde du dernier mouvement (le plus récent)
    const dernierMouvement = allMouvements.length ? allMouvements[0] : null;
    const soldeActuel = dernierMouvement ? dernierMouvement.solde : 0;

    // Totaux tous mouvements
    const totalEntrees = allMouvements
      .filter((m) => m.type === 'ENTREE')
      .reduce((s, m) => s + m.montant, 0);
    const totalSorties = allMouvements
      .filter((m) => m.type === 'SORTIE')
      .reduce((s, m) => s + m.montant, 0);
    const nombreMouvements = allMouvements.length;

    // Période du mois en cours
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const mouvementsMois = await getMouvementsUnified({ dateDebut: startOfMonth });
    const entreesMois = mouvementsMois
      .filter((m) => m.type === 'ENTREE')
      .reduce((s, m) => s + m.montant, 0);
    const sortiesMois = mouvementsMois
      .filter((m) => m.type === 'SORTIE')
      .reduce((s, m) => s + m.montant, 0);

    // Solde du mois précédent
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endLastMonth = startOfMonth;
    const mouvementsLastMonth = await getMouvementsUnified({
      dateDebut: startLastMonth,
      dateFin: endLastMonth,
    });
    const dernierLastMonth = mouvementsLastMonth.length
      ? mouvementsLastMonth[mouvementsLastMonth.length - 1]
      : null;
    const soldeMoisPrecedent = dernierLastMonth ? dernierLastMonth.solde : 0;

    // Évolution du solde
    const evolutionSolde =
      soldeMoisPrecedent === 0
        ? soldeActuel > 0
          ? 100
          : 0
        : ((soldeActuel - soldeMoisPrecedent) / soldeMoisPrecedent) * 100;

    return {
      soldeActuel,
      totalEntrees,
      totalSorties,
      nombreMouvements,
      entreesMois,
      sortiesMois,
      soldeMoisPrecedent,
      evolutionSolde: parseFloat(evolutionSolde.toFixed(1)),
    };
  }, 'Erreur lors du calcul des statistiques de caisse');
}

/**
 * Récupère les tendances évolutives (mois courant vs mois précédent).
 *
 * @returns {Promise<CaisseTrends>} Variations en pourcentage
 */
export async function getCaisseTrends() {
  return executePrismaOperation(async () => {
    const now = new Date();
    const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endLastMonth = startThisMonth;

    const mouvementsThis = await getMouvementsUnified({ dateDebut: startThisMonth });
    const mouvementsLast = await getMouvementsUnified({
      dateDebut: startLastMonth,
      dateFin: endLastMonth,
    });

    const computeTrend = (current, prev) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return parseFloat((((current - prev) / prev) * 100).toFixed(1));
    };

    const soldeThis = mouvementsThis.length
      ? mouvementsThis[mouvementsThis.length - 1]?.solde || 0
      : 0;
    const soldeLast = mouvementsLast.length
      ? mouvementsLast[mouvementsLast.length - 1]?.solde || 0
      : 0;

    const totalEntreesThis = mouvementsThis
      .filter((m) => m.type === 'ENTREE')
      .reduce((s, m) => s + m.montant, 0);
    const totalEntreesLast = mouvementsLast
      .filter((m) => m.type === 'ENTREE')
      .reduce((s, m) => s + m.montant, 0);
    const totalSortiesThis = mouvementsThis
      .filter((m) => m.type === 'SORTIE')
      .reduce((s, m) => s + m.montant, 0);
    const totalSortiesLast = mouvementsLast
      .filter((m) => m.type === 'SORTIE')
      .reduce((s, m) => s + m.montant, 0);

    return {
      soldeActuel: computeTrend(soldeThis, soldeLast),
      totalEntrees: computeTrend(totalEntreesThis, totalEntreesLast),
      totalSorties: computeTrend(totalSortiesThis, totalSortiesLast),
      entreesMois: computeTrend(totalEntreesThis, totalEntreesLast),
      sortiesMois: computeTrend(totalSortiesThis, totalSortiesLast),
    };
  }, 'Erreur lors du calcul des tendances de caisse');
}

/**
 * Récupère les données des sparklines pour les 12 derniers mois.
 *
 * @returns {Promise<CaisseSparklineData>} Sparklines (solde, entrées, sorties, flux net)
 */
export async function getCaisseSparklines() {
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

    const soldeValues = [];
    const entreesValues = [];
    const sortiesValues = [];
    const fluxNetValues = [];

    for (const m of months) {
      const mouvements = await getMouvementsUnified({ dateDebut: m.start, dateFin: m.end });
      const totalEntrees = mouvements
        .filter((mv) => mv.type === 'ENTREE')
        .reduce((s, mv) => s + mv.montant, 0);
      const totalSorties = mouvements
        .filter((mv) => mv.type === 'SORTIE')
        .reduce((s, mv) => s + mv.montant, 0);
      const soldeFinMois = mouvements.length ? mouvements[mouvements.length - 1]?.solde || 0 : 0;
      soldeValues.push(soldeFinMois);
      entreesValues.push(totalEntrees);
      sortiesValues.push(totalSorties);
      fluxNetValues.push(totalEntrees - totalSorties);
    }

    return {
      soldeSparkline: { values: soldeValues, labels: months.map((m) => m.label) },
      entreesSparkline: { values: entreesValues, labels: months.map((m) => m.label) },
      sortiesSparkline: { values: sortiesValues, labels: months.map((m) => m.label) },
      fluxNetSparkline: { values: fluxNetValues, labels: months.map((m) => m.label) },
    };
  }, 'Erreur lors de la génération des sparklines de caisse');
}

/**
 * Exporte l’historique des mouvements (CSV, Excel, PDF) – stub.
 * @param {Object} [params] - Filtres pour l’export (mêmes que getAllMouvements)
 * @returns {Promise<{ success: boolean; path: string; message?: string }>}
 */
export async function exportCaisseMouvements(params = {}) {
  const mouvements = await getAllMouvements(params);
  const filename = `caisse_export_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
  const filePath = `/exports/${filename}`;
  console.log(
    `[exportCaisseMouvements] Export de ${Array.isArray(mouvements) ? mouvements.length : mouvements.mouvements?.length || 0} mouvements vers ${filePath}`
  );
  return { success: true, path: filePath, message: 'Export généré (simulation)' };
}
