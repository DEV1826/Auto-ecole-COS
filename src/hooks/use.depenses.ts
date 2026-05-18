// /home/stive-junior/Auto-ecole-COS/src/hooks/use.depenses.ts

/**
 * Hook personnalisé pour la gestion des dépenses (sorties d’argent)
 *
 * @module useDepenses
 * @description
 * Fournit un accès simplifié au store Zustand des dépenses.
 * Expose l’état (liste paginée, dépense détaillée, statistiques, tendances,
 * sparklines, dépenses par véhicule) et toutes les actions
 * (CRUD, chargement des statistiques, gestion des caches, attachement de reçu).
 *
 * @example
 * ```tsx
 * const { depenses, loading, getAll, create, delete } = useDepenses();
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

import { useDepensesStore } from '@/store/depenses.store';
import type {
  Depense,
  DepensesStatsExtended,
  DepensesTrends,
  DepensesPaginatedResponse,
  DepensesListParams,
  DepensesSparklineData,
  DepensesTrendChartData,
} from '@/types/depenses.types';

// ===============================
// INTERFACE DE RETOUR DU HOOK
// ===============================

/**
 * Interface décrivant toutes les propriétés et méthodes retournées par `useDepenses`
 */
export interface UseDepenses {
  // ===== ÉTAT DE LA LISTE PAGINÉE =====
  /** Liste des dépenses de la page courante */
  depenses: Depense[];
  /** Pagination (page, limit, total, totalPages) */
  pagination: { page: number; limit: number; total: number; totalPages: number };
  /** Indicateur de chargement de la liste */
  loading: boolean;
  /** Erreur lors du chargement de la liste */
  error: string | null;

  // ===== DÉPENSE DÉTAILLÉE =====
  /** Dépense actuellement consultée (avec véhicule associé) */
  currentDepense: Depense | null;
  /** Indicateur de chargement du détail */
  detailLoading: boolean;
  /** Erreur lors du chargement du détail */
  detailError: string | null;

  // ===== STATISTIQUES =====
  /** Métriques agrégées complètes des dépenses */
  stats: DepensesStatsExtended | null;
  /** Indicateur de chargement des statistiques */
  statsLoading: boolean;
  /** Erreur lors du chargement des statistiques */
  statsError: string | null;

  // ===== TENDANCES =====
  /** Tendances évolutives (mois vs précédent) */
  trends: DepensesTrends | null;
  /** Indicateur de chargement des tendances */
  trendsLoading: boolean;
  /** Erreur lors du chargement des tendances */
  trendsError: string | null;

  // ===== SPARKLINES =====
  /** Données des sparklines (12 mois) */
  sparklines: DepensesSparklineData | null;
  /** Indicateur de chargement des sparklines */
  sparklinesLoading: boolean;
  /** Erreur lors du chargement des sparklines */
  sparklinesError: string | null;

  // ===== DÉPENSES PAR VÉHICULE =====
  depensesByVehiculeLoading: boolean;
  depensesByVehiculeError: string | null;

  // ===== OPÉRATIONS CRUD PRINCIPALES =====
  /**
   * Récupère la liste paginée des dépenses avec filtres optionnels.
   * @param params - Pagination, filtres (categorie, vehiculeId, period, search) et tri
   */
  getAll: (params?: DepensesListParams) => Promise<DepensesPaginatedResponse>;
  /**
   * Récupère une dépense par son ID avec véhicule associé.
   * @param id - Identifiant de la dépense
   */
  getById: (id: number) => Promise<Depense>;
  /**
   * Crée une nouvelle dépense.
   * @param data - Données de la dépense (categorie, montant obligatoires)
   */
  create: (data: unknown) => Promise<Depense>;
  /**
   * Met à jour une dépense existante (patch partiel).
   * @param id - Identifiant de la dépense
   * @param data - Champs à modifier
   */
  update: (id: number, data: unknown) => Promise<Depense>;
  /**
   * Supprime définitivement une dépense.
   * @param id - Identifiant de la dépense
   */
  delete: (id: number) => Promise<{ success: boolean; message: string }>;

  // ===== STATISTIQUES, TENDANCES ET SPARKLINES =====
  /** Récupère les statistiques agrégées complètes des dépenses */
  getStats: () => Promise<DepensesStatsExtended>;
  /** Récupère les tendances évolutives */
  getTrends: () => Promise<DepensesTrends>;
  /** Récupère les données des sparklines (12 mois) */
  getSparklines: () => Promise<DepensesSparklineData>;

  /** Récupère les données des tendances évolutives des dépenses pour les graphiques.
   * @returns Données de tendance
   *
   *
   */
  getTrendChartData: () => Promise<DepensesTrendChartData>;

  // ===== RELATIONS & UTILITAIRES =====
  /** Récupère toutes les dépenses d’un véhicule (avec cache) */
  getByVehicule: (vehiculeId: number) => Promise<Depense[]>;
  /** Attache un reçu (PDF) à une dépense (stub) */
  attachReceipt: (id: number, filePath: string) => Promise<{ success: boolean; message: string }>;

  // ===== UTILITAIRES =====
  /** Efface toutes les erreurs du store */
  clearErrors: () => void;
  /** Réinitialise la dépense courante (ferme la vue détail) */
  resetCurrentDepense: () => void;
  /** Vide tous les caches (dépenses par véhicule) */
  clearCaches: () => void;

  // ===== PROPRIÉTÉS DÉRIVÉES (convenience) =====
  /** Première dépense de la liste courante */
  firstDepense: Depense | null;
  /** Nombre total de dépenses */
  totalDepenses: number;
  /** Indique si une opération est en cours (loading global) */
  isBusy: boolean;
}

// ===============================
// HOOK PRINCIPAL
// ===============================

/**
 * Hook d’accès complet à la gestion des dépenses.
 *
 * @returns {UseDepenses} Toutes les propriétés et actions du store dépenses
 */
export const useDepenses = (): UseDepenses => {
  const store = useDepensesStore();

  // Propriétés dérivées
  const firstDepense = store.depenses.length > 0 ? store.depenses[0] : null;
  const totalDepenses = store.pagination.total;
  const isBusy =
    store.loading ||
    store.detailLoading ||
    store.statsLoading ||
    store.trendsLoading ||
    store.sparklinesLoading ||
    store.depensesByVehiculeLoading;

  return {
    // État liste
    depenses: store.depenses,
    pagination: store.pagination,
    loading: store.loading,
    error: store.error,

    // Détail
    currentDepense: store.currentDepense,
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

    // État des actions spécifiques
    depensesByVehiculeLoading: store.depensesByVehiculeLoading,
    depensesByVehiculeError: store.depensesByVehiculeError,

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

    getTrendChartData: store.getTrendChartData,

    // Relations & utilitaires
    getByVehicule: store.getByVehicule,
    attachReceipt: store.attachReceipt,

    // Utilitaires
    clearErrors: store.clearErrors,
    resetCurrentDepense: store.resetCurrentDepense,
    clearCaches: store.clearCaches,

    // Dérivées
    firstDepense,
    totalDepenses,
    isBusy,
  };
};
