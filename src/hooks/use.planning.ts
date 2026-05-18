// /home/stive-junior/Auto-ecole-COS/src/hooks/use.planning.ts

/**
 * Hook personnalisé pour la gestion des leçons (planning)
 *
 * @module usePlanning
 * @description
 * Fournit un accès simplifié au store Zustand des leçons.
 * Expose l’état (liste paginée, leçon détaillée, statistiques, tendances,
 * sparklines, leçons par candidat/moniteur/véhicule) et toutes les actions
 * (CRUD, chargement des statistiques, gestion des caches).
 *
 * @example
 * ```tsx
 * const { lecons, loading, getAll, create, delete } = usePlanning();
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

import { usePlanningStore } from '@/store/planning.store';
import type {
  Lecon,
  LeconsStatsExtended,
  LeconsTrends,
  LeconsPaginatedResponse,
  LeconsListParams,
  LeconsSparklineData,
} from '@/types/planning.types';

// ===============================
// INTERFACE DE RETOUR DU HOOK
// ===============================

/**
 * Interface décrivant toutes les propriétés et méthodes retournées par `usePlanning`
 */
export interface UsePlanning {
  // ===== ÉTAT DE LA LISTE PAGINÉE =====
  /** Liste des leçons de la page courante */
  lecons: Lecon[];
  /** Pagination (page, limit, total, totalPages) */
  pagination: { page: number; limit: number; total: number; totalPages: number };
  /** Indicateur de chargement de la liste */
  loading: boolean;
  /** Erreur lors du chargement de la liste */
  error: string | null;

  // ===== LEÇON DÉTAILLÉE =====
  /** Leçon actuellement consultée (avec relations) */
  currentLecon: Lecon | null;
  /** Indicateur de chargement du détail */
  detailLoading: boolean;
  /** Erreur lors du chargement du détail */
  detailError: string | null;

  // ===== STATISTIQUES =====
  /** Métriques agrégées complètes des leçons */
  stats: LeconsStatsExtended | null;
  /** Indicateur de chargement des statistiques */
  statsLoading: boolean;
  /** Erreur lors du chargement des statistiques */
  statsError: string | null;

  // ===== TENDANCES =====
  /** Tendances évolutives (mois vs précédent) */
  trends: LeconsTrends | null;
  /** Indicateur de chargement des tendances */
  trendsLoading: boolean;
  /** Erreur lors du chargement des tendances */
  trendsError: string | null;

  // ===== SPARKLINES =====
  /** Données des sparklines (12 mois) */
  sparklines: LeconsSparklineData | null;
  /** Indicateur de chargement des sparklines */
  sparklinesLoading: boolean;
  /** Erreur lors du chargement des sparklines */
  sparklinesError: string | null;

  // ===== ÉTATS DES RELATIONS =====
  relationsLoading: boolean;
  relationsError: string | null;

  // ===== OPÉRATIONS CRUD PRINCIPALES =====
  /**
   * Récupère la liste paginée des leçons avec filtres optionnels.
   * @param params - Pagination, filtres (type, statut, candidatId, moniteurId, period, search) et tri
   */
  getAll: (params?: LeconsListParams) => Promise<LeconsPaginatedResponse>;
  /**
   * Récupère une leçon par son ID avec ses relations.
   * @param id - Identifiant de la leçon
   */
  getById: (id: number) => Promise<Lecon>;
  /**
   * Crée une nouvelle leçon.
   * @param data - Données de la leçon (date, duree, type, candidatId, moniteurId obligatoires)
   */
  create: (data: unknown) => Promise<Lecon>;
  /**
   * Met à jour une leçon existante (patch partiel).
   * @param id - Identifiant de la leçon
   * @param data - Champs à modifier
   */
  update: (id: number, data: unknown) => Promise<Lecon>;
  /**
   * Supprime définitivement une leçon.
   * @param id - Identifiant de la leçon
   */
  delete: (id: number) => Promise<{ success: boolean; message: string }>;

  // ===== STATISTIQUES, TENDANCES ET SPARKLINES =====
  /** Récupère les statistiques agrégées complètes des leçons */
  getStats: () => Promise<LeconsStatsExtended>;
  /** Récupère les tendances évolutives */
  getTrends: () => Promise<LeconsTrends>;
  /** Récupère les données des sparklines (12 mois) */
  getSparklines: () => Promise<LeconsSparklineData>;

  // ===== RELATIONS & UTILITAIRES (AVEC CACHE) =====
  /** Récupère toutes les leçons d’un candidat (avec cache) */
  getByCandidat: (candidatId: number) => Promise<Lecon[]>;
  /** Récupère toutes les leçons d’un moniteur (avec cache) */
  getByMoniteur: (moniteurId: number) => Promise<Lecon[]>;
  /** Récupère toutes les leçons d’un véhicule (avec cache) */
  getByVehicule: (vehiculeId: number) => Promise<Lecon[]>;
  /**
   * Récupère les leçons pour une période donnée (calendrier).
   * @param startDate - Date de début (inclus)
   * @param endDate - Date de fin (inclus)
   * @param moniteurId - Optionnel : filtrer par moniteur
   */
  getBetweenDates: (
    startDate: Date | string,
    endDate: Date | string,
    moniteurId?: number
  ) => Promise<Lecon[]>;

  // ===== UTILITAIRES =====
  /** Efface toutes les erreurs du store */
  clearErrors: () => void;
  /** Réinitialise la leçon courante (ferme la vue détail) */
  resetCurrentLecon: () => void;
  /** Vide tous les caches (leçons par candidat/moniteur/véhicule) */
  clearCaches: () => void;

  // ===== PROPRIÉTÉS DÉRIVÉES (convenience) =====
  /** Première leçon de la liste courante */
  firstLecon: Lecon | null;
  /** Nombre total de leçons */
  totalLecons: number;
  /** Indique si une opération est en cours (loading global) */
  isBusy: boolean;
}

// ===============================
// HOOK PRINCIPAL
// ===============================

/**
 * Hook d’accès complet à la gestion des leçons (planning).
 *
 * @returns {UsePlanning} Toutes les propriétés et actions du store planning
 */
export const usePlanning = (): UsePlanning => {
  const store = usePlanningStore();

  // Propriétés dérivées
  const firstLecon = store.lecons.length > 0 ? store.lecons[0] : null;
  const totalLecons = store.pagination.total;
  const isBusy =
    store.loading ||
    store.detailLoading ||
    store.statsLoading ||
    store.trendsLoading ||
    store.sparklinesLoading ||
    store.relationsLoading;

  return {
    // État liste
    lecons: store.lecons,
    pagination: store.pagination,
    loading: store.loading,
    error: store.error,

    // Détail
    currentLecon: store.currentLecon,
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
    relationsLoading: store.relationsLoading,
    relationsError: store.relationsError,

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
    getByMoniteur: store.getByMoniteur,
    getByVehicule: store.getByVehicule,
    getBetweenDates: store.getBetweenDates,

    // Utilitaires
    clearErrors: store.clearErrors,
    resetCurrentLecon: store.resetCurrentLecon,
    clearCaches: store.clearCaches,

    // Dérivées
    firstLecon,
    totalLecons,
    isBusy,
  };
};
