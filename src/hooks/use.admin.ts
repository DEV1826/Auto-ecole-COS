// src/hooks/use.admin.ts

/**
 * @module useAdmin
 * @description
 * Hook personnalisé pour l'administration (logs d'audit, statistiques, configuration entreprise).
 * Fournit un accès simplifié au store Zustand `useAdminStore`.
 * Expose l'état (logs paginés, stats, tendances, config) et toutes les actions.
 *
 * @example
 * ```tsx
 * const { logs, logsLoading, getAuditLogs, getAdminStats } = useAdmin();
 *
 * useEffect(() => {
 *   getAuditLogs({ page: 1, limit: 20, period: 'month' });
 *   getAdminStats();
 * }, []);
 *
 * // Utilisation de la configuration
 * const { companyConfig, updateCompanyConfig } = useAdmin();
 * await updateCompanyConfig({ nom: 'Nouveau nom' });
 * ```
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @see {@link useAdminStore} – Store Zustand sous‑jacent
 * @see {@link admin.types.ts} – Types associés
 */

import { useAdminStore } from '@/store/admin.store';
import type {
  AuditLog,
  AuditLogsPaginatedResponse,
  AuditLogsListParams,
  AdminStats,
  AdminTrends,
  CompanyConfig,
  UpdateCompanyConfigInput,
} from '@/types/admin.types';

// ===============================
// INTERFACE DE RETOUR DU HOOK
// ===============================

/**
 * @interface UseAdmin
 * @description Interface décrivant toutes les propriétés et méthodes retournées par le hook `useAdmin`.
 */
export interface UseAdmin {
  // ===== ÉTAT DES LOGS D’AUDIT =====
  /** Liste des logs d’audit de la page courante. */
  logs: AuditLog[];
  /** Pagination des logs (page, limit, total, totalPages). */
  logsPagination: { page: number; limit: number; total: number; totalPages: number };
  /** Indicateur de chargement des logs. */
  logsLoading: boolean;
  /** Erreur lors du chargement des logs. */
  logsError: string | null;

  // ===== STATISTIQUES ADMIN =====
  /** Métriques agrégées (logs, utilisateurs, sessions). */
  stats: AdminStats | null;
  /** Indicateur de chargement des statistiques. */
  statsLoading: boolean;
  /** Erreur lors du chargement des statistiques. */
  statsError: string | null;

  // ===== TENDANCES ADMIN =====
  /** Tendances évolutives (variations en pourcentage). */
  trends: AdminTrends | null;
  /** Indicateur de chargement des tendances. */
  trendsLoading: boolean;
  /** Erreur lors du chargement des tendances. */
  trendsError: string | null;

  // ===== CONFIGURATION ENTREPRISE =====
  /** Configuration actuelle de l’entreprise. */
  companyConfig: CompanyConfig | null;
  /** Indicateur de chargement de la configuration. */
  configLoading: boolean;
  /** Erreur lors du chargement ou de la mise à jour de la configuration. */
  configError: string | null;

  // ===== ACTIONS =====
  /**
   * Récupère la liste paginée des logs d’audit avec filtres optionnels.
   * @param params - Paramètres de pagination, filtres et tri.
   * @returns Réponse paginée.
   * @throws {Error} Si la validation échoue ou si l’API retourne une erreur.
   */
  getAuditLogs: (params?: AuditLogsListParams) => Promise<AuditLogsPaginatedResponse>;

  /**
   * Récupère les statistiques agrégées (logs, utilisateurs, sessions).
   * @returns Métriques étendues.
   * @throws {Error} Si l’API retourne une erreur.
   */
  getAdminStats: () => Promise<AdminStats>;

  /**
   * Récupère les tendances évolutives (mois en cours vs mois précédent).
   * @returns Variations en pourcentage.
   * @throws {Error} Si l’API retourne une erreur.
   */
  getAdminTrends: () => Promise<AdminTrends>;

  /**
   * Récupère la configuration actuelle de l’entreprise.
   * @returns Configuration complète.
   * @throws {Error} Si l’API retourne une erreur.
   */
  getCompanyConfig: () => Promise<CompanyConfig>;

  /**
   * Met à jour la configuration de l’entreprise (patch partiel).
   * @param data - Champs à modifier.
   * @returns Configuration mise à jour.
   * @throws {Error} Si la validation échoue ou si l’API retourne une erreur.
   */
  updateCompanyConfig: (data: UpdateCompanyConfigInput) => Promise<CompanyConfig>;

  /** Efface toutes les erreurs du store. */
  clearErrors: () => void;

  // ===== PROPRIÉTÉS DÉRIVÉES =====
  /** Indique si une opération est en cours (logs, stats, tendances, config). */
  isBusy: boolean;
}

// ===============================
// HOOK PRINCIPAL
// ===============================

/**
 * Hook d’accès complet à l’administration.
 *
 * @returns {UseAdmin} Toutes les propriétés et actions du store admin.
 */
export const useAdmin = (): UseAdmin => {
  const store = useAdminStore();

  // Propriété dérivée : busy si au moins un chargement est actif
  const isBusy =
    store.logsLoading || store.statsLoading || store.trendsLoading || store.configLoading;

  return {
    // État logs
    logs: store.logs,
    logsPagination: store.logsPagination,
    logsLoading: store.logsLoading,
    logsError: store.logsError,

    // Statistiques
    stats: store.stats,
    statsLoading: store.statsLoading,
    statsError: store.statsError,

    // Tendances
    trends: store.trends,
    trendsLoading: store.trendsLoading,
    trendsError: store.trendsError,

    // Configuration
    companyConfig: store.companyConfig,
    configLoading: store.configLoading,
    configError: store.configError,

    // Actions
    getAuditLogs: store.getAuditLogs,
    getAdminStats: store.getAdminStats,
    getAdminTrends: store.getAdminTrends,
    getCompanyConfig: store.getCompanyConfig,
    updateCompanyConfig: store.updateCompanyConfig,
    clearErrors: store.clearErrors,

    // Dérivée
    isBusy,
  };
};
