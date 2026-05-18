// /home/stive-junior/Auto-ecole-COS/src/hooks/use.examens.ts

/**
 * Hook personnalisé pour la gestion des examens (code et conduite)
 *
 * @module useExamens
 * @description
 * Fournit un accès simplifié au store Zustand des examens.
 * Expose l’état (liste paginée, examen détaillé, statistiques, tendances,
 * sparklines, examens par candidat) et toutes les actions
 * (CRUD, chargement des statistiques, gestion des caches, impression d’attestation).
 *
 * @example
 * ```tsx
 * const { examens, loading, getAll, create, delete } = useExamens();
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

import { useExamensStore } from '@/store/examens.store';
import type {
  Examen,
  ExamensStatsExtended,
  ExamensTrends,
  ExamensPaginatedResponse,
  ExamensListParams,
  ExamensSparklineData,
} from '@/types/examens.types';

// ===============================
// INTERFACE DE RETOUR DU HOOK
// ===============================

/**
 * Interface décrivant toutes les propriétés et méthodes retournées par `useExamens`
 */
export interface UseExamens {
  // ===== ÉTAT DE LA LISTE PAGINÉE =====
  /** Liste des examens de la page courante */
  examens: Examen[];
  /** Pagination (page, limit, total, totalPages) */
  pagination: { page: number; limit: number; total: number; totalPages: number };
  /** Indicateur de chargement de la liste */
  loading: boolean;
  /** Erreur lors du chargement de la liste */
  error: string | null;

  // ===== EXAMEN DÉTAILLÉ =====
  /** Examen actuellement consulté (avec candidat) */
  currentExamen: Examen | null;
  /** Indicateur de chargement du détail */
  detailLoading: boolean;
  /** Erreur lors du chargement du détail */
  detailError: string | null;

  // ===== STATISTIQUES =====
  /** Métriques agrégées complètes des examens */
  stats: ExamensStatsExtended | null;
  /** Indicateur de chargement des statistiques */
  statsLoading: boolean;
  /** Erreur lors du chargement des statistiques */
  statsError: string | null;

  // ===== TENDANCES =====
  /** Tendances évolutives (mois vs précédent) */
  trends: ExamensTrends | null;
  /** Indicateur de chargement des tendances */
  trendsLoading: boolean;
  /** Erreur lors du chargement des tendances */
  trendsError: string | null;

  // ===== SPARKLINES =====
  /** Données des sparklines (12 mois) */
  sparklines: ExamensSparklineData | null;
  /** Indicateur de chargement des sparklines */
  sparklinesLoading: boolean;
  /** Erreur lors du chargement des sparklines */
  sparklinesError: string | null;

  // ===== EXAMENS PAR CANDIDAT =====
  examensByCandidatLoading: boolean;
  examensByCandidatError: string | null;

  // ===== OPÉRATIONS CRUD PRINCIPALES =====
  /**
   * Récupère la liste paginée des examens avec filtres optionnels.
   * @param params - Pagination, filtres (type, resultat, candidatId, period, search) et tri
   */
  getAll: (params?: ExamensListParams) => Promise<ExamensPaginatedResponse>;
  /**
   * Récupère un examen par son ID avec candidat associé.
   * @param id - Identifiant de l’examen
   */
  getById: (id: number) => Promise<Examen>;
  /**
   * Crée un nouvel examen.
   * @param data - Données de l’examen (date, type, candidatId obligatoires)
   */
  create: (data: unknown) => Promise<Examen>;
  /**
   * Met à jour un examen existant (patch partiel – résultat, note, date, centre, notes).
   * @param id - Identifiant de l’examen
   * @param data - Champs à modifier
   */
  update: (id: number, data: unknown) => Promise<Examen>;
  /**
   * Supprime définitivement un examen.
   * @param id - Identifiant de l’examen
   */
  delete: (id: number) => Promise<{ success: boolean; message: string }>;

  // ===== STATISTIQUES, TENDANCES ET SPARKLINES =====
  /** Récupère les statistiques agrégées complètes des examens */
  getStats: () => Promise<ExamensStatsExtended>;
  /** Récupère les tendances évolutives */
  getTrends: () => Promise<ExamensTrends>;
  /** Récupère les données des sparklines (12 mois) */
  getSparklines: () => Promise<ExamensSparklineData>;

  // ===== RELATIONS & UTILITAIRES =====
  /** Récupère tous les examens d’un candidat (avec cache) */
  getByCandidat: (candidatId: number) => Promise<Examen[]>;
  /** Génère l’attestation (PDF) pour un examen réussi */
  printCertificate: (id: number) => Promise<{ success: boolean; path?: string; message?: string }>;

  // ===== UTILITAIRES =====
  /** Efface toutes les erreurs du store */
  clearErrors: () => void;
  /** Réinitialise l’examen courant (ferme la vue détail) */
  resetCurrentExamen: () => void;
  /** Vide tous les caches (examens par candidat) */
  clearCaches: () => void;

  // ===== PROPRIÉTÉS DÉRIVÉES (convenience) =====
  /** Premier examen de la liste courante */
  firstExamen: Examen | null;
  /** Nombre total d’examens */
  totalExamens: number;
  /** Indique si une opération est en cours (loading global) */
  isBusy: boolean;
}

// ===============================
// HOOK PRINCIPAL
// ===============================

/**
 * Hook d’accès complet à la gestion des examens.
 *
 * @returns {UseExamens} Toutes les propriétés et actions du store examens
 */
export const useExamens = (): UseExamens => {
  const store = useExamensStore();

  // Propriétés dérivées
  const firstExamen = store.examens.length > 0 ? store.examens[0] : null;
  const totalExamens = store.pagination.total;
  const isBusy =
    store.loading ||
    store.detailLoading ||
    store.statsLoading ||
    store.trendsLoading ||
    store.sparklinesLoading ||
    store.examensByCandidatLoading;

  return {
    // État liste
    examens: store.examens,
    pagination: store.pagination,
    loading: store.loading,
    error: store.error,

    // Détail
    currentExamen: store.currentExamen,
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
    examensByCandidatLoading: store.examensByCandidatLoading,
    examensByCandidatError: store.examensByCandidatError,

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
    printCertificate: store.printCertificate,

    // Utilitaires
    clearErrors: store.clearErrors,
    resetCurrentExamen: store.resetCurrentExamen,
    clearCaches: store.clearCaches,

    // Dérivées
    firstExamen,
    totalExamens,
    isBusy,
  };
};
