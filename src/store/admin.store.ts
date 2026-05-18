// src/store/admin.store.ts

/**
 * @module adminStore
 * @description
 * Store Zustand pour l’administration (logs d’audit, configuration entreprise, statistiques).
 * Gère l’état global des logs d’audit, des métriques admin et de la configuration de l’entreprise.
 *
 * Toutes les interactions avec l’API Electron passent par `window.api.admin`.
 * Les données entrantes sont validées avec Zod (`admin.validator.ts`).
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @see {@link admin.types.ts} – Types associés
 * @see {@link admin.validator.ts} – Schémas de validation
 */

import { create } from 'zustand';
import type {
  AuditLog,
  AuditLogsPaginatedResponse,
  AuditLogsListParams,
  AdminStats,
  AdminTrends,
  CompanyConfig,
  UpdateCompanyConfigInput,
} from '@/types/admin.types';
import { auditLogsListSchema, updateCompanyConfigSchema } from '@/lib/validators/admin.validator';
import { safeValidate, validateOrThrow } from '@/lib/validators/utils.validator';
import { formatErrorMessage } from '@/lib/helpers/error.helper';

// ===============================
// TYPES INTERNES DU STORE
// ===============================

/**
 * @interface AdminState
 * @description État du store d’administration.
 */
interface AdminState {
  // ===== LOGS D’AUDIT =====
  /** Liste des logs d’audit de la page courante. */
  logs: AuditLog[];
  /** Pagination des logs (page, limit, total, totalPages). */
  logsPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  /** Indicateur de chargement des logs. */
  logsLoading: boolean;
  /** Erreur lors du chargement des logs. */
  logsError: string | null;

  // ===== STATISTIQUES ADMIN =====
  /** Métriques agrégées des logs d’audit et utilisateurs. */
  stats: AdminStats | null;
  /** Indicateur de chargement des statistiques. */
  statsLoading: boolean;
  /** Erreur lors du chargement des statistiques. */
  statsError: string | null;

  // ===== TENDANCES ADMIN =====
  /** Tendances évolutives des métriques admin. */
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
}

/**
 * @interface AdminActions
 * @description Actions disponibles dans le store d’administration.
 */
interface AdminActions {
  // ===== LOGS D’AUDIT =====
  /**
   * Récupère la liste paginée des logs d’audit avec filtres optionnels.
   * @param params - Paramètres de pagination, filtres et tri.
   * @returns Réponse paginée.
   * @throws {Error} Si la validation échoue ou si l’API retourne une erreur.
   */
  getAuditLogs: (params?: AuditLogsListParams) => Promise<AuditLogsPaginatedResponse>;

  // ===== STATISTIQUES =====
  /**
   * Récupère les statistiques agrégées des logs d’audit et des utilisateurs.
   * @returns Métriques étendues.
   * @throws {Error} Si l’API retourne une erreur.
   */
  getAdminStats: () => Promise<AdminStats>;

  // ===== TENDANCES =====
  /**
   * Récupère les tendances évolutives (mois en cours vs mois précédent).
   * @returns Variations en pourcentage.
   * @throws {Error} Si l’API retourne une erreur.
   */
  getAdminTrends: () => Promise<AdminTrends>;

  // ===== CONFIGURATION ENTREPRISE =====
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

  // ===== UTILITAIRES =====
  /** Efface toutes les erreurs du store. */
  clearErrors: () => void;
}

type AdminStore = AdminState & AdminActions;

// ===============================
// ÉTAT INITIAL
// ===============================

/**
 * @description Valeurs par défaut du store.
 */
const initialState: AdminState = {
  logs: [],
  logsPagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  logsLoading: false,
  logsError: null,

  stats: null,
  statsLoading: false,
  statsError: null,

  trends: null,
  trendsLoading: false,
  trendsError: null,

  companyConfig: null,
  configLoading: false,
  configError: null,
};

// ===============================
// STORE PRINCIPAL
// ===============================

/**
 * Store Zustand pour l’administration.
 * Gère les logs d’audit, les statistiques, les tendances et la configuration entreprise.
 */
export const useAdminStore = create<AdminStore>()((set) => ({
  ...initialState,

  // ─────────────────────────────────────────────────────────────────────────
  // LOGS D’AUDIT
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * @inheritdoc
   */
  getAuditLogs: async (params = {}) => {
    // Validation des paramètres de liste
    const validation = safeValidate(auditLogsListSchema, params);
    if (!validation.success) {
      const message = formatErrorMessage(validation.error, 'Paramètres de liste invalides');
      set({ logsError: message });
      throw new Error(message);
    }

    set({ logsLoading: true, logsError: null });
    try {
      const response = await window.api.admin.getAuditLogs(validation.data);
      set({
        logs: response.logs,
        logsPagination: {
          page: response.page,
          limit: response.limit,
          total: response.total,
          totalPages: response.totalPages,
        },
        logsLoading: false,
      });
      return response;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors du chargement des logs d’audit');
      set({ logsLoading: false, logsError: message });
      throw new Error(message);
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // STATISTIQUES
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * @inheritdoc
   */
  getAdminStats: async () => {
    set({ statsLoading: true, statsError: null });
    try {
      const stats = await window.api.admin.getAdminStats();
      set({ stats, statsLoading: false });
      return stats;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors du chargement des statistiques');
      set({ statsLoading: false, statsError: message });
      throw new Error(message);
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // TENDANCES
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * @inheritdoc
   */
  getAdminTrends: async () => {
    set({ trendsLoading: true, trendsError: null });
    try {
      const trends = await window.api.admin.getAdminTrends();
      set({ trends, trendsLoading: false });
      return trends;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors du chargement des tendances');
      set({ trendsLoading: false, trendsError: message });
      throw new Error(message);
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CONFIGURATION ENTREPRISE
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * @inheritdoc
   */
  getCompanyConfig: async () => {
    set({ configLoading: true, configError: null });
    try {
      const config = await window.api.admin.getCompanyConfig();
      set({ companyConfig: config, configLoading: false });
      return config;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors du chargement de la configuration');
      set({ configLoading: false, configError: message });
      throw new Error(message);
    }
  },

  /**
   * @inheritdoc
   */
  updateCompanyConfig: async (data) => {
    // Validation des données de mise à jour
    const validated = validateOrThrow(updateCompanyConfigSchema, data);
    set({ configLoading: true, configError: null });
    try {
      const updated = await window.api.admin.updateCompanyConfig(validated);
      set({ companyConfig: updated, configLoading: false });
      return updated;
    } catch (error) {
      const message = formatErrorMessage(
        error,
        'Erreur lors de la mise à jour de la configuration'
      );
      set({ configLoading: false, configError: message });
      throw new Error(message);
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // UTILITAIRES
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * @inheritdoc
   */
  clearErrors: () => {
    set({
      logsError: null,
      statsError: null,
      trendsError: null,
      configError: null,
    });
  },
}));
