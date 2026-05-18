// /home/stive-junior/Auto-ecole-COS/src/hooks/use.paiements.ts

/**
 * Hook personnalisé pour la gestion des paiements (encaissements)
 *
 * @module usePaiements
 * @description
 * Fournit un accès simplifié au store Zustand des paiements.
 * Expose l’état (liste paginée, paiement détaillé, statistiques, tendances,
 * sparklines, solde candidat, résumé mensuel) et toutes les actions
 * (CRUD, chargement des statistiques, gestion des caches, impression de reçu).
 *
 * @example
 * ```tsx
 * const { paiements, loading, getAll, create, delete } = usePaiements();
 *
 * useEffect(() => {
 *   getAll({ page: 1, limit: 10 });
 * }, []);
 *
 * const handleCreate = async (data) => {
 *   await create(data);
 * };
 * ```
 *
 * @author Stive Junior
 * @version 1.0.0
 */

import { usePaiementsStore } from '@/store/paiements.store';
import type {
  Paiement,
  PaiementsStatsExtended,
  PaiementsTrends,
  PaiementsPaginatedResponse,
  PaiementsListParams,
  PaiementsSparklineData,
  SoldeCandidat,
  ResumeMensuel,
} from '@/types/paiements.types';

// ===============================
// INTERFACE DE RETOUR DU HOOK
// ===============================

/**
 * Interface décrivant toutes les propriétés et méthodes retournées par `usePaiements`
 */
export interface UsePaiements {
  // ===== ÉTAT DE LA LISTE PAGINÉE =====
  /** Liste des paiements de la page courante */
  paiements: Paiement[];
  /** Pagination (page, limit, total, totalPages) */
  pagination: { page: number; limit: number; total: number; totalPages: number };
  /** Indicateur de chargement de la liste */
  loading: boolean;
  /** Erreur lors du chargement de la liste */
  error: string | null;

  // ===== PAIEMENT DÉTAILLÉ =====
  /** Paiement actuellement consulté (avec candidat et facture) */
  currentPaiement: Paiement | null;
  /** Indicateur de chargement du détail */
  detailLoading: boolean;
  /** Erreur lors du chargement du détail */
  detailError: string | null;

  // ===== STATISTIQUES =====
  /** Métriques agrégées complètes des paiements */
  stats: PaiementsStatsExtended | null;
  /** Indicateur de chargement des statistiques */
  statsLoading: boolean;
  /** Erreur lors du chargement des statistiques */
  statsError: string | null;

  // ===== TENDANCES =====
  /** Tendances évolutives (mois vs précédent) */
  trends: PaiementsTrends | null;
  /** Indicateur de chargement des tendances */
  trendsLoading: boolean;
  /** Erreur lors du chargement des tendances */
  trendsError: string | null;

  // ===== SPARKLINES =====
  /** Données des sparklines (12 mois) */
  sparklines: PaiementsSparklineData | null;
  /** Indicateur de chargement des sparklines */
  sparklinesLoading: boolean;
  /** Erreur lors du chargement des sparklines */
  sparklinesError: string | null;

  // ===== SOLDE CANDIDAT =====
  /** Solde d’un candidat (utilisé via `getSoldeCandidat`) – non stocké dans l’état, mais disponible via action */
  soldeLoading: boolean;
  soldeError: string | null;

  // ===== RÉSUMÉ MENSUEL =====
  resumeMensuelLoading: boolean;
  resumeMensuelError: string | null;

  // ===== PAIEMENTS PAR CANDIDAT =====
  paiementsByCandidatLoading: boolean;
  paiementsByCandidatError: string | null;

  // ===== OPÉRATIONS CRUD PRINCIPALES =====
  /**
   * Récupère la liste paginée des paiements avec filtres optionnels.
   * @param params - Pagination, filtres (mode, candidatId, period, search) et tri
   */
  getAll: (params?: PaiementsListParams) => Promise<PaiementsPaginatedResponse>;
  /**
   * Récupère un paiement par son ID avec candidat et facture.
   * @param id - Identifiant du paiement
   */
  getById: (id: number) => Promise<Paiement>;
  /**
   * Crée un nouveau paiement.
   * @param data - Données du paiement (montant, mode, candidatId obligatoires)
   */
  create: (data: unknown) => Promise<Paiement>;
  /**
   * Met à jour un paiement existant (patch partiel – note, référence, factureId).
   * @param id - Identifiant du paiement
   * @param data - Champs à modifier
   */
  update: (id: number, data: unknown) => Promise<Paiement>;
  /**
   * Supprime définitivement un paiement.
   * @param id - Identifiant du paiement
   */
  delete: (id: number) => Promise<{ success: boolean; message: string }>;

  // ===== STATISTIQUES, TENDANCES ET SPARKLINES =====
  /** Récupère les statistiques agrégées complètes des paiements */
  getStats: () => Promise<PaiementsStatsExtended>;
  /** Récupère les tendances évolutives */
  getTrends: () => Promise<PaiementsTrends>;
  /** Récupère les données des sparklines (12 mois) */
  getSparklines: () => Promise<PaiementsSparklineData>;

  // ===== RELATIONS & UTILITAIRES =====
  /** Récupère tous les paiements d’un candidat (avec cache) */
  getByCandidat: (candidatId: number) => Promise<Paiement[]>;
  /** Calcule le solde d’un candidat (total facturé - total payé) */
  getSoldeCandidat: (candidatId: number) => Promise<SoldeCandidat>;
  /** Récupère le résumé mensuel des paiements pour un mois/année donnés */
  getResumeMensuel: (annee: number, mois: number) => Promise<ResumeMensuel>;
  /** Génère / imprime le reçu d’un paiement (export PDF) */
  printReceipt: (id: number) => Promise<{ success: boolean; path?: string; message?: string }>;

  // ===== UTILITAIRES =====
  /** Efface toutes les erreurs du store */
  clearErrors: () => void;
  /** Réinitialise le paiement courant (ferme la vue détail) */
  resetCurrentPaiement: () => void;
  /** Vide tous les caches (solde, résumés, paiements par candidat) */
  clearCaches: () => void;

  // ===== PROPRIÉTÉS DÉRIVÉES (convenience) =====
  /** Premier paiement de la liste courante (utile pour certaines vues) */
  firstPaiement: Paiement | null;
  /** Nombre total de paiements */
  totalPaiements: number;
  /** Indique si une opération est en cours (loading global) */
  isBusy: boolean;
}

// ===============================
// HOOK PRINCIPAL
// ===============================

/**
 * Hook d’accès complet à la gestion des paiements.
 *
 * @returns {UsePaiements} Toutes les propriétés et actions du store paiements
 */
export const usePaiements = (): UsePaiements => {
  const store = usePaiementsStore();

  // Propriétés dérivées
  const firstPaiement = store.paiements.length > 0 ? store.paiements[0] : null;
  const totalPaiements = store.pagination.total;
  const isBusy =
    store.loading ||
    store.detailLoading ||
    store.statsLoading ||
    store.trendsLoading ||
    store.sparklinesLoading ||
    store.soldeLoading ||
    store.resumeMensuelLoading ||
    store.paiementsByCandidatLoading;

  return {
    // État liste
    paiements: store.paiements,
    pagination: store.pagination,
    loading: store.loading,
    error: store.error,

    // Détail
    currentPaiement: store.currentPaiement,
    detailLoading: store.detailLoading,
    detailError: store.detailError,

    // Statistiques
    stats: store.stats,
    statsLoading: store.statsLoading,
    statsError: store.statsError,

    // Tendances
    trends: store.trends,
    trendsLoading: store.trendsLoading,
    trendsError: store.trendsError,

    // Sparklines
    sparklines: store.sparklines,
    sparklinesLoading: store.sparklinesLoading,
    sparklinesError: store.sparklinesError,

    // État des actions spécifiques (non stockés dans l’état principal)
    soldeLoading: store.soldeLoading,
    soldeError: store.soldeError,
    resumeMensuelLoading: store.resumeMensuelLoading,
    resumeMensuelError: store.resumeMensuelError,
    paiementsByCandidatLoading: store.paiementsByCandidatLoading,
    paiementsByCandidatError: store.paiementsByCandidatError,

    // Actions CRUD
    getAll: store.getAll,
    getById: store.getById,
    create: store.create,
    update: store.update,
    delete: store.delete,

    // Statistiques, tendances, sparklines
    getStats: store.getStats,
    getTrends: store.getTrends,
    getSparklines: store.getSparklines,

    // Relations & utilitaires
    getByCandidat: store.getByCandidat,
    getSoldeCandidat: store.getSoldeCandidat,
    getResumeMensuel: store.getResumeMensuel,
    printReceipt: store.printReceipt,

    // Utilitaires
    clearErrors: store.clearErrors,
    resetCurrentPaiement: store.resetCurrentPaiement,
    clearCaches: store.clearCaches,

    // Dérivées
    firstPaiement,
    totalPaiements,
    isBusy,
  };
};
