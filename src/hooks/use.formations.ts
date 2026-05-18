// /home/stive-junior/Auto-ecole-COS/src/hooks/use.formations.ts

/**
 * Hook personnalisé pour la gestion des formations (offres pédagogiques)
 *
 * @module useFormations
 * @description
 * Fournit un accès simplifié au store Zustand des formations.
 * Expose l'état (liste paginée, formation détaillée, statistiques, tendances, sparklines,
 * inscriptions mensuelles, candidats inscrits) et toutes les actions
 * (CRUD, chargement des statistiques, tendances, etc.).
 *
 * @example
 * ```tsx
 * const { formations, loading, getAll, create, delete } = useFormations();
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

import { useFormationsStore } from '@/store/formations.store';
import type {
  Formation,
  FormationsStats,
  FormationsTrends,
  FormationsPaginatedResponse,
  FormationsListParams,
  MonthlyInscriptionData,
  FormationsSparklineData,
  PopularityStat,
} from '@/types/formations.types';
import type { Candidat } from '@/types/candidats.types';

// ===============================
// INTERFACE DE RETOUR DU HOOK
// ===============================

/**
 * Interface décrivant toutes les propriétés et méthodes retournées par `useFormations`
 */
export interface UseFormations {
  // ===== ÉTAT DE LA LISTE PAGINÉE =====
  /** Liste des formations de la page courante */
  formations: Formation[];
  /** Pagination (page, limit, total, totalPages) */
  pagination: { page: number; limit: number; total: number; totalPages: number };
  /** Indicateur de chargement de la liste */
  loading: boolean;
  /** Erreur lors du chargement de la liste */
  error: string | null;

  // ===== FORMATION DÉTAILLÉE =====
  /** Formation actuellement consultée (avec candidats inscrits et tarifs) */
  currentFormation: (Formation & { candidatsInscrits?: Candidat[] }) | null;
  /** Indicateur de chargement du détail */
  detailLoading: boolean;
  /** Erreur lors du chargement du détail */
  detailError: string | null;

  // ===== STATISTIQUES =====
  /** Métriques agrégées des formations */
  stats: FormationsStats | null;
  /** Indicateur de chargement des statistiques */
  statsLoading: boolean;
  /** Erreur lors du chargement des statistiques */
  statsError: string | null;

  // ===== TENDANCES =====
  /** Tendances évolutives des formations */
  trends: FormationsTrends | null;
  /** Indicateur de chargement des tendances */
  trendsLoading: boolean;
  /** Erreur lors du chargement des tendances */
  trendsError: string | null;

  // ===== SPARKLINES =====
  /** Données des sparklines (évolutions sur 12 mois) */
  sparklines: FormationsSparklineData | null;
  /** Indicateur de chargement des sparklines */
  sparklinesLoading: boolean;
  /** Erreur lors du chargement des sparklines */
  sparklinesError: string | null;

  // ===== INSCRIPTIONS MENSUELLES =====
  /** Inscriptions mensuelles pour la formation sélectionnée */
  monthlyInscriptions: MonthlyInscriptionData[];
  /** Indicateur de chargement des inscriptions mensuelles */
  monthlyInscriptionsLoading: boolean;
  /** Erreur lors du chargement des inscriptions mensuelles */
  monthlyInscriptionsError: string | null;

  // ===== CANDIDATS INSCRITS =====
  /** Candidats inscrits à la formation sélectionnée */
  candidatsInscrits: Candidat[];
  /** Indicateur de chargement des candidats inscrits */
  candidatsInscritsLoading: boolean;
  /** Erreur lors du chargement des candidats inscrits */
  candidatsInscritsError: string | null;

  // ===== OPÉRATIONS CRUD PRINCIPALES =====
  /**
   * Récupère la liste paginée des formations avec filtres optionnels.
   * @param params - Pagination et filtres (page, limit, search, categorie, actif)
   */
  getAll: (params?: FormationsListParams) => Promise<FormationsPaginatedResponse>;
  /**
   * Récupère une formation par son ID avec toutes ses relations.
   * @param id - Identifiant de la formation
   */
  getById: (id: number) => Promise<Formation & { candidatsInscrits?: Candidat[] }>;
  /**
   * Crée une nouvelle formation.
   * @param data - Données de la formation (conformes au schéma)
   */
  create: (data: unknown) => Promise<Formation>;
  /**
   * Met à jour une formation existante (patch partiel).
   * @param id - Identifiant de la formation
   * @param data - Champs à mettre à jour
   */
  update: (id: number, data: unknown) => Promise<Formation>;
  /**
   * Supprime (désactive) une formation.
   * @param id - Identifiant de la formation
   */
  delete: (id: number) => Promise<{ success: boolean; message: string }>;

  // ===== STATISTIQUES, TENDANCES ET SPARKLINES =====
  /** Récupère les statistiques agrégées des formations */
  getStats: () => Promise<FormationsStats>;
  /** Récupère les tendances évolutives */
  getTrends: () => Promise<FormationsTrends>;
  /** Récupère les données des sparklines (12 mois) */
  getSparklines: () => Promise<FormationsSparklineData>;

  /**
   *
   * @returns
   */
  getPopularityStats: () => Promise<PopularityStat[]>;

  getNbInscriptions: (formationId: number) => Promise<number>;

  // ===== RELATIONS SPÉCIFIQUES =====
  /** Récupère le nombre d’inscriptions par mois pour une formation */
  getMonthlyInscriptions: (formationId: number) => Promise<MonthlyInscriptionData[]>;
  /** Récupère la liste des candidats inscrits à une formation */
  getCandidatsByFormation: (formationId: number) => Promise<Candidat[]>;

  // ===== UTILITAIRES =====
  /** Efface toutes les erreurs du store */
  clearErrors: () => void;
  /** Réinitialise la formation courante (ferme la vue détail) */
  resetCurrentFormation: () => void;
  /** Réinitialise les données d’inscriptions mensuelles */
  resetMonthlyInscriptions: () => void;
  /** Réinitialise la liste des candidats inscrits */
  resetCandidatsInscrits: () => void;

  // ===== PROPRIÉTÉS DÉRIVÉES (convenience) =====
  /** Première formation de la liste courante (utile pour certaines vues) */
  firstFormation: Formation | null;
  /** Nombre total de formations */
  totalFormations: number;
  /** Indique si une opération est en cours (loading global) */
  isBusy: boolean;
}

// ===============================
// HOOK PRINCIPAL
// ===============================

/**
 * Hook d’accès complet à la gestion des formations.
 *
 * @returns {UseFormations} Toutes les propriétés et actions du store formations
 */
export const useFormations = (): UseFormations => {
  const store = useFormationsStore();

  // Propriétés dérivées
  const firstFormation = store.formations.length > 0 ? store.formations[0] : null;
  const totalFormations = store.pagination.total;
  const isBusy =
    store.loading ||
    store.detailLoading ||
    store.statsLoading ||
    store.trendsLoading ||
    store.sparklinesLoading ||
    store.monthlyInscriptionsLoading ||
    store.candidatsInscritsLoading;

  return {
    // État liste
    formations: store.formations,
    pagination: store.pagination,
    loading: store.loading,
    error: store.error,

    // Détail
    currentFormation: store.currentFormation,
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

    // Inscriptions mensuelles
    monthlyInscriptions: store.monthlyInscriptions,
    monthlyInscriptionsLoading: store.monthlyInscriptionsLoading,
    monthlyInscriptionsError: store.monthlyInscriptionsError,

    // Candidats inscrits
    candidatsInscrits: store.candidatsInscrits,
    candidatsInscritsLoading: store.candidatsInscritsLoading,
    candidatsInscritsError: store.candidatsInscritsError,

    // Actions CRUD
    getAll: store.getAll,
    getById: store.getById,
    create: store.create,
    update: store.update,
    delete: store.delete,

    // Statistiques, tendances et sparklines
    getStats: store.getStats,
    getTrends: store.getTrends,
    getSparklines: store.getSparklines,
    getPopularityStats: store.getPopularityStats,
    getNbInscriptions: store.getNbInscriptions,

    // Relations spécifiques
    getMonthlyInscriptions: store.getMonthlyInscriptions,
    getCandidatsByFormation: store.getCandidatsByFormation,

    // Utilitaires
    clearErrors: store.clearErrors,
    resetCurrentFormation: store.resetCurrentFormation,
    resetMonthlyInscriptions: store.resetMonthlyInscriptions,
    resetCandidatsInscrits: store.resetCandidatsInscrits,

    // Dérivées
    firstFormation,
    totalFormations,
    isBusy,
  };
};
