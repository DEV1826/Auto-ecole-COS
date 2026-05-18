// src/hooks/use.moniteurs.ts

/**
 * Hook personnalisé pour la gestion des moniteurs (instructeurs)
 *
 * @module useMoniteurs
 * @description
 * Fournit un accès simplifié au store Zustand des moniteurs.
 * Expose l’état (liste paginée, moniteur détaillé, statistiques, tendances, sparklines)
 * et toutes les actions (CRUD, chargement des statistiques, etc.).
 *
 * @example
 * ```tsx
 * const { moniteurs, loading, getAll, create, delete } = useMoniteurs();
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

import { useMoniteursStore } from '@/store/moniteurs.store';
import type {
  Moniteur,
  MoniteursStatsExtended,
  MoniteursTrends,
  MoniteursPaginatedResponse,
  MoniteursListParams,
  MoniteursSparklineData,
} from '@/types/moniteurs.types';

// ===============================
// INTERFACE DE RETOUR DU HOOK
// ===============================

/**
 * Interface décrivant toutes les propriétés et méthodes retournées par `useMoniteurs`
 */
export interface UseMoniteurs {
  // ===== ÉTAT DE LA LISTE PAGINÉE =====
  /** Liste des moniteurs de la page courante */
  moniteurs: Moniteur[];
  /** Pagination (page, limit, total, totalPages) */
  pagination: { page: number; limit: number; total: number; totalPages: number };
  /** Indicateur de chargement de la liste */
  loading: boolean;
  /** Erreur lors du chargement de la liste */
  error: string | null;

  // ===== MONITEUR DÉTAILLÉ =====
  /** Moniteur actuellement consulté (avec ses leçons) */
  currentMoniteur: Moniteur | null;
  /** Indicateur de chargement du détail */
  detailLoading: boolean;
  /** Erreur lors du chargement du détail */
  detailError: string | null;

  // ===== STATISTIQUES =====
  /** Métriques agrégées complètes des moniteurs */
  stats: MoniteursStatsExtended | null;
  /** Indicateur de chargement des statistiques */
  statsLoading: boolean;
  /** Erreur lors du chargement des statistiques */
  statsError: string | null;

  // ===== TENDANCES =====
  /** Tendances évolutives (mois vs précédent) */
  trends: MoniteursTrends | null;
  /** Indicateur de chargement des tendances */
  trendsLoading: boolean;
  /** Erreur lors du chargement des tendances */
  trendsError: string | null;

  // ===== SPARKLINES =====
  /** Données des sparklines (12 mois) */
  sparklines: MoniteursSparklineData | null;
  /** Indicateur de chargement des sparklines */
  sparklinesLoading: boolean;
  /** Erreur lors du chargement des sparklines */
  sparklinesError: string | null;

  // ===== OPÉRATIONS CRUD PRINCIPALES =====
  /**
   * Récupère la liste paginée des moniteurs avec filtres optionnels.
   * @param params - Pagination, filtres (search, actif) et tri
   */
  getAll: (params?: MoniteursListParams) => Promise<MoniteursPaginatedResponse>;
  /**
   * Récupère un moniteur par son ID avec ses leçons.
   * @param id - Identifiant du moniteur
   */
  getById: (id: number) => Promise<Moniteur>;
  /**
   * Crée un nouveau moniteur.
   * @param data - Données du moniteur (nom, prenom obligatoires)
   */
  create: (data: unknown) => Promise<Moniteur>;
  /**
   * Met à jour un moniteur existant (patch partiel).
   * @param id - Identifiant du moniteur
   * @param data - Champs à modifier
   */
  update: (id: number, data: unknown) => Promise<Moniteur>;
  /**
   * Désactive (soft delete) un moniteur.
   * @param id - Identifiant du moniteur
   */
  delete: (id: number) => Promise<{ success: boolean; message: string }>;

  // ===== STATISTIQUES, TENDANCES ET SPARKLINES =====
  /** Récupère les statistiques agrégées complètes des moniteurs */
  getStats: () => Promise<MoniteursStatsExtended>;
  /** Récupère les tendances évolutives */
  getTrends: () => Promise<MoniteursTrends>;
  /** Récupère les données des sparklines (12 mois) */
  getSparklines: () => Promise<MoniteursSparklineData>;

  // ===== UTILITAIRES =====
  /** Efface toutes les erreurs du store */
  clearErrors: () => void;
  /** Réinitialise le moniteur courant (ferme la vue détail) */
  resetCurrentMoniteur: () => void;

  // ===== PROPRIÉTÉS DÉRIVÉES (convenience) =====
  /** Premier moniteur de la liste courante */
  firstMoniteur: Moniteur | null;
  /** Nombre total de moniteurs */
  totalMoniteurs: number;
  /** Indique si une opération est en cours (loading global) */
  isBusy: boolean;
}

// ===============================
// HOOK PRINCIPAL
// ===============================

/**
 * Hook d’accès complet à la gestion des moniteurs.
 *
 * @returns {UseMoniteurs} Toutes les propriétés et actions du store moniteurs
 */
export const useMoniteurs = (): UseMoniteurs => {
  const store = useMoniteursStore();

  // Propriétés dérivées
  const firstMoniteur = store.moniteurs.length > 0 ? store.moniteurs[0] : null;
  const totalMoniteurs = store.pagination.total;
  const isBusy =
    store.loading ||
    store.detailLoading ||
    store.statsLoading ||
    store.trendsLoading ||
    store.sparklinesLoading;

  return {
    // État liste
    moniteurs: store.moniteurs,
    pagination: store.pagination,
    loading: store.loading,
    error: store.error,

    // Détail
    currentMoniteur: store.currentMoniteur,
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

    // Utilitaires
    clearErrors: store.clearErrors,
    resetCurrentMoniteur: store.resetCurrentMoniteur,

    // Dérivées
    firstMoniteur,
    totalMoniteurs,
    isBusy,
  };
};
