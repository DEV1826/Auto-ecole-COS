// /home/stive-junior/Auto-ecole-COS/src/hooks/use.caisse.ts

/**
 * Hook personnalisé pour la gestion de la caisse (trésorerie)
 *
 * @module useCaisse
 * @description
 * Fournit un accès simplifié au store Zustand de la caisse.
 * Expose l’état (mouvements paginés, statistiques, tendances, sparklines)
 * et toutes les actions (chargement, export).
 *
 * @example
 * ```tsx
 * const { mouvements, loading, getAll, getStats } = useCaisse();
 *
 * useEffect(() => {
 *   getAll({ page: 1, limit: 20 });
 *   getStats();
 * }, []);
 * ```
 *
 * @author Stive Junior
 * @version 1.0.0
 */

import { useCaisseStore } from '@/store/caisse.store';
import type {
  MouvementCaisse,
  CaisseStatsExtended,
  CaisseTrends,
  CaissePaginatedResponse,
  CaisseListParams,
  CaisseSparklineData,
} from '@/types/caisse.types';

// ===============================
// INTERFACE DE RETOUR DU HOOK
// ===============================

/**
 * Interface décrivant toutes les propriétés et méthodes retournées par `useCaisse`
 */
export interface UseCaisse {
  // ===== ÉTAT DE LA LISTE PAGINÉE =====
  /** Liste des mouvements de la page courante */
  mouvements: MouvementCaisse[];
  /** Pagination (page, limit, total, totalPages) */
  pagination: { page: number; limit: number; total: number; totalPages: number };
  /** Indicateur de chargement de la liste */
  loading: boolean;
  /** Erreur lors du chargement de la liste */
  error: string | null;

  // ===== STATISTIQUES =====
  /** Métriques agrégées complètes de la caisse */
  stats: CaisseStatsExtended | null;
  /** Indicateur de chargement des statistiques */
  statsLoading: boolean;
  /** Erreur lors du chargement des statistiques */
  statsError: string | null;

  // ===== TENDANCES =====
  /** Tendances évolutives (mois vs précédent) */
  trends: CaisseTrends | null;
  /** Indicateur de chargement des tendances */
  trendsLoading: boolean;
  /** Erreur lors du chargement des tendances */
  trendsError: string | null;

  // ===== SPARKLINES =====
  /** Données des sparklines (12 mois) */
  sparklines: CaisseSparklineData | null;
  /** Indicateur de chargement des sparklines */
  sparklinesLoading: boolean;
  /** Erreur lors du chargement des sparklines */
  sparklinesError: string | null;

  // ===== OPÉRATIONS =====
  /**
   * Récupère la liste paginée des mouvements de caisse avec filtres optionnels.
   * @param params - Pagination, filtres (type, period, search) et tri
   */
  getAll: (params?: CaisseListParams) => Promise<CaissePaginatedResponse>;
  /**
   * Récupère les statistiques agrégées complètes de la caisse.
   */
  getStats: () => Promise<CaisseStatsExtended>;
  /**
   * Récupère les tendances évolutives (mois vs précédent).
   */
  getTrends: () => Promise<CaisseTrends>;
  /**
   * Récupère les données des sparklines pour les 12 derniers mois.
   */
  getSparklines: () => Promise<CaisseSparklineData>;
  /**
   * Exporte l’historique des mouvements (CSV, Excel, PDF).
   * @param params - Filtres pour l’export
   */
  exportMouvements: (
    params?: CaisseListParams
  ) => Promise<{ success: boolean; path: string; message?: string }>;

  // ===== UTILITAIRES =====
  /** Efface toutes les erreurs du store */
  clearErrors: () => void;

  // ===== PROPRIÉTÉS DÉRIVÉES (convenience) =====
  /** Nombre total de mouvements (tous filtres) */
  totalMouvements: number;
  /** Indique si une opération est en cours (loading global) */
  isBusy: boolean;
}

// ===============================
// HOOK PRINCIPAL
// ===============================

/**
 * Hook d’accès complet à la gestion de la caisse.
 *
 * @returns {UseCaisse} Toutes les propriétés et actions du store caisse
 */
export const useCaisse = (): UseCaisse => {
  const store = useCaisseStore();

  // Propriétés dérivées
  const totalMouvements = store.pagination.total;
  const isBusy =
    store.loading || store.statsLoading || store.trendsLoading || store.sparklinesLoading;

  return {
    // État liste
    mouvements: store.mouvements,
    pagination: store.pagination,
    loading: store.loading,
    error: store.error,

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

    // Actions
    getAll: store.getAll,
    getStats: store.getStats,
    getTrends: store.getTrends,
    getSparklines: store.getSparklines,
    exportMouvements: store.exportMouvements,

    // Utilitaires
    clearErrors: store.clearErrors,

    // Dérivées
    totalMouvements,
    isBusy,
  };
};
