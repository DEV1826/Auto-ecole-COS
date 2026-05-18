// /home/stive-junior/Auto-ecole-COS/src/hooks/use.factures.ts

/**
 * Hook personnalisé pour la gestion des factures
 *
 * @module useFactures
 * @description
 * Fournit un accès simplifié au store Zustand des factures.
 * Expose l’état (liste paginée, facture détaillée, statistiques, tendances,
 * sparklines, paiements par facture, factures par candidat) et toutes les actions
 * (CRUD, génération PDF, envoi email, gestion des caches).
 *
 * @example
 * ```tsx
 * const { factures, loading, getAll, create, delete } = useFactures();
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

import { useFacturesStore } from '@/store/factures.store';
import type {
  Facture,
  FacturesStatsExtended,
  FacturesTrends,
  FacturesPaginatedResponse,
  FacturesListParams,
  FacturesSparklineData,
} from '@/types/factures.types';
import type { Paiement } from '@/types/paiements.types';

// ===============================
// INTERFACE DE RETOUR DU HOOK
// ===============================

/**
 * Interface décrivant toutes les propriétés et méthodes retournées par `useFactures`
 */
export interface UseFactures {
  // ===== ÉTAT DE LA LISTE PAGINÉE =====
  /** Liste des factures de la page courante */
  factures: Facture[];
  /** Pagination (page, limit, total, totalPages) */
  pagination: { page: number; limit: number; total: number; totalPages: number };
  /** Indicateur de chargement de la liste */
  loading: boolean;
  /** Erreur lors du chargement de la liste */
  error: string | null;

  // ===== FACTURE DÉTAILLÉE =====
  /** Facture actuellement consultée (avec candidat et paiements) */
  currentFacture: (Facture & { paiements?: Paiement[]; candidat?: any }) | null;
  /** Indicateur de chargement du détail */
  detailLoading: boolean;
  /** Erreur lors du chargement du détail */
  detailError: string | null;

  // ===== STATISTIQUES =====
  /** Métriques agrégées complètes des factures */
  stats: FacturesStatsExtended | null;
  /** Indicateur de chargement des statistiques */
  statsLoading: boolean;
  /** Erreur lors du chargement des statistiques */
  statsError: string | null;

  // ===== TENDANCES =====
  /** Tendances évolutives (mois vs précédent) */
  trends: FacturesTrends | null;
  /** Indicateur de chargement des tendances */
  trendsLoading: boolean;
  /** Erreur lors du chargement des tendances */
  trendsError: string | null;

  // ===== SPARKLINES =====
  /** Données des sparklines (12 mois) */
  sparklines: FacturesSparklineData | null;
  /** Indicateur de chargement des sparklines */
  sparklinesLoading: boolean;
  /** Erreur lors du chargement des sparklines */
  sparklinesError: string | null;

  // ===== RELATIONS =====
  /** Paiements d’une facture – état (loading/error) non stocké globalement, mais accessible */
  paiementsByFactureLoading: boolean;
  paiementsByFactureError: string | null;
  facturesByCandidatLoading: boolean;
  facturesByCandidatError: string | null;

  // ===== OPÉRATIONS CRUD PRINCIPALES =====
  /**
   * Récupère la liste paginée des factures avec filtres optionnels.
   * @param params - Pagination, filtres (statut, candidatId, period, search) et tri
   */
  getAll: (params?: FacturesListParams) => Promise<FacturesPaginatedResponse>;
  /**
   * Récupère une facture par son ID avec candidat et paiements.
   * @param id - Identifiant de la facture
   */
  getById: (id: number) => Promise<Facture & { paiements?: Paiement[]; candidat?: any }>;
  /**
   * Crée une nouvelle facture.
   * @param data - Données de la facture (candidatId, montantTotal obligatoires)
   */
  create: (data: unknown) => Promise<Facture>;
  /**
   * Met à jour une facture existante (patch partiel – statut, échéance, notes).
   * @param id - Identifiant de la facture
   * @param data - Champs à modifier
   */
  update: (id: number, data: unknown) => Promise<Facture>;
  /**
   * Supprime définitivement une facture (uniquement si aucun paiement associé).
   * @param id - Identifiant de la facture
   */
  delete: (id: number) => Promise<{ success: boolean; message: string }>;

  // ===== STATISTIQUES, TENDANCES ET SPARKLINES =====
  /** Récupère les statistiques agrégées complètes des factures */
  getStats: () => Promise<FacturesStatsExtended>;
  /** Récupère les tendances évolutives */
  getTrends: () => Promise<FacturesTrends>;
  /** Récupère les données des sparklines (12 mois) */
  getSparklines: () => Promise<FacturesSparklineData>;

  // ===== RELATIONS & UTILITAIRES =====
  /** Récupère tous les paiements associés à une facture (avec cache) */
  getPaiementsByFacture: (factureId: number) => Promise<Paiement[]>;
  /** Récupère toutes les factures d’un candidat (avec cache) */
  getFacturesByCandidat: (candidatId: number) => Promise<Facture[]>;
  /** Génère (ou régénère) le PDF d’une facture */
  generatePDF: (id: number) => Promise<{ success: boolean; path: string; message?: string }>;
  /** Envoie la facture par email au candidat */
  sendByEmail: (id: number) => Promise<{ success: boolean; message: string }>;

  // ===== UTILITAIRES =====
  /** Efface toutes les erreurs du store */
  clearErrors: () => void;
  /** Réinitialise la facture courante (ferme la vue détail) */
  resetCurrentFacture: () => void;
  /** Vide tous les caches (paiements par facture, factures par candidat) */
  clearCaches: () => void;

  // ===== PROPRIÉTÉS DÉRIVÉES (convenience) =====
  /** Première facture de la liste courante (utile pour certaines vues) */
  firstFacture: Facture | null;
  /** Nombre total de factures */
  totalFactures: number;
  /** Indique si une opération est en cours (loading global) */
  isBusy: boolean;
}

// ===============================
// HOOK PRINCIPAL
// ===============================

/**
 * Hook d’accès complet à la gestion des factures.
 *
 * @returns {UseFactures} Toutes les propriétés et actions du store factures
 */
export const useFactures = (): UseFactures => {
  const store = useFacturesStore();

  // Propriétés dérivées
  const firstFacture = store.factures.length > 0 ? store.factures[0] : null;
  const totalFactures = store.pagination.total;
  const isBusy =
    store.loading ||
    store.detailLoading ||
    store.statsLoading ||
    store.trendsLoading ||
    store.sparklinesLoading ||
    store.paiementsByFactureLoading ||
    store.facturesByCandidatLoading;

  return {
    // État liste
    factures: store.factures,
    pagination: store.pagination,
    loading: store.loading,
    error: store.error,

    // Détail
    currentFacture: store.currentFacture,
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

    // États des relations (non stockés dans l’état principal)
    paiementsByFactureLoading: store.paiementsByFactureLoading,
    paiementsByFactureError: store.paiementsByFactureError,
    facturesByCandidatLoading: store.facturesByCandidatLoading,
    facturesByCandidatError: store.facturesByCandidatError,

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
    getPaiementsByFacture: store.getPaiementsByFacture,
    getFacturesByCandidat: store.getFacturesByCandidat,
    generatePDF: store.generatePDF,
    sendByEmail: store.sendByEmail,

    // Utilitaires
    clearErrors: store.clearErrors,
    resetCurrentFacture: store.resetCurrentFacture,
    clearCaches: store.clearCaches,

    // Dérivées
    firstFacture,
    totalFactures,
    isBusy,
  };
};
