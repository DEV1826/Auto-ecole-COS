// /home/stive-junior/Auto-ecole-COS/src/store/caisse.store.ts

/**
 * Store Zustand pour la gestion de la caisse (trésorerie)
 *
 * @module caisseStore
 * @description
 * Gère l'état global de la caisse : mouvements paginés, statistiques, tendances, sparklines.
 * Toutes les interactions avec l'API Electron passent par `window.api.caisse`.
 * Les données entrantes sont validées avec Zod (`caisse.validator.ts`).
 *
 * @author Stive Junior
 * @version 1.0.0
 */

import { create } from 'zustand';
import type {
  MouvementCaisse,
  CaisseStatsExtended,
  CaisseTrends,
  CaissePaginatedResponse,
  CaisseListParams,
  CaisseSparklineData,
} from '@/types/caisse.types';
import { caisseListSchema } from '@/lib/validators/caisse.validator';
import { safeValidate } from '@/lib/validators/utils.validator';
import { formatErrorMessage } from '@/lib/helpers/error.helper';

// ===============================
// TYPES INTERNES DU STORE
// ===============================

interface CaisseState {
  /** Liste des mouvements de la page courante */
  mouvements: MouvementCaisse[];
  /** Pagination (page, limit, total, totalPages) */
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  /** Indicateur de chargement de la liste */
  loading: boolean;
  /** Erreur lors du chargement de la liste */
  error: string | null;

  /** Statistiques agrégées (solde, entrées/sorties, etc.) */
  stats: CaisseStatsExtended | null;
  /** Indicateur de chargement des statistiques */
  statsLoading: boolean;
  /** Erreur lors du chargement des statistiques */
  statsError: string | null;

  /** Tendances évolutives (mois vs précédent) */
  trends: CaisseTrends | null;
  /** Indicateur de chargement des tendances */
  trendsLoading: boolean;
  /** Erreur lors du chargement des tendances */
  trendsError: string | null;

  /** Sparklines (évolution sur 12 mois) */
  sparklines: CaisseSparklineData | null;
  /** Indicateur de chargement des sparklines */
  sparklinesLoading: boolean;
  /** Erreur lors du chargement des sparklines */
  sparklinesError: string | null;
}

interface CaisseActions {
  /**
   * Récupère la liste paginée des mouvements de caisse avec filtres optionnels.
   * @param params - Pagination, filtres (type, period, search) et tri
   * @returns Réponse paginée
   */
  getAll: (params?: CaisseListParams) => Promise<CaissePaginatedResponse>;

  /**
   * Récupère les statistiques agrégées complètes de la caisse.
   * @returns Métriques étendues (solde, totaux, évolutions)
   */
  getStats: () => Promise<CaisseStatsExtended>;

  /**
   * Récupère les tendances évolutives (mois courant vs mois précédent).
   * @returns Variations en pourcentage pour chaque indicateur
   */
  getTrends: () => Promise<CaisseTrends>;

  /**
   * Récupère les données des sparklines pour les 12 derniers mois.
   * @returns Séries mensuelles (solde, entrées, sorties, flux net)
   */
  getSparklines: () => Promise<CaisseSparklineData>;

  /**
   * Exporte l’historique des mouvements (CSV, Excel, PDF) – stub.
   * @param params - Filtres pour l’export
   * @returns Chemin du fichier exporté
   */
  exportMouvements: (
    params?: CaisseListParams
  ) => Promise<{ success: boolean; path: string; message?: string }>;

  /** Efface toutes les erreurs du store */
  clearErrors: () => void;
}

type CaisseStore = CaisseState & CaisseActions;

// ===============================
// ÉTAT INITIAL
// ===============================

const initialState: CaisseState = {
  mouvements: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  loading: false,
  error: null,

  stats: null,
  statsLoading: false,
  statsError: null,

  trends: null,
  trendsLoading: false,
  trendsError: null,

  sparklines: null,
  sparklinesLoading: false,
  sparklinesError: null,
};

// ===============================
// STORE PRINCIPAL
// ===============================

/**
 * Store Zustand pour la gestion de la caisse.
 * Utilisé par le hook `useCaisse`.
 */
export const useCaisseStore = create<CaisseStore>()((set) => ({
  ...initialState,

  // ===============================
  // OPÉRATIONS PRINCIPALES
  // ===============================

  /**
   * Récupère la liste paginée des mouvements de caisse avec filtres optionnels.
   * Valide les paramètres via `caisseListSchema`.
   *
   * @param params - Pagination, filtres (type, period, search) et tri
   * @returns Réponse paginée
   */
  getAll: async (params = {}) => {
    const validation = safeValidate(caisseListSchema, params);
    if (!validation.success) {
      const message = formatErrorMessage(validation.error, 'Paramètres de liste invalides');
      set({ error: message });
      throw new Error(message);
    }

    set({ loading: true, error: null });
    try {
      const response = await window.api.caisse.getAll(validation.data);
      set({
        mouvements: response.mouvements,
        pagination: {
          page: response.page,
          limit: response.limit,
          total: response.total,
          totalPages: response.totalPages,
        },
        loading: false,
      });
      return response;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors du chargement des mouvements');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  /**
   * Récupère les statistiques agrégées complètes de la caisse.
   *
   * @returns Métriques étendues (solde, totaux, évolutions)
   */
  getStats: async () => {
    set({ statsLoading: true, statsError: null });
    try {
      const stats = await window.api.caisse.getStats();
      set({ stats, statsLoading: false });
      return stats;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors du chargement des statistiques');
      set({ statsLoading: false, statsError: message });
      throw new Error(message);
    }
  },

  /**
   * Récupère les tendances évolutives (mois courant vs mois précédent).
   *
   * @returns Variations en pourcentage pour chaque indicateur
   */
  getTrends: async () => {
    set({ trendsLoading: true, trendsError: null });
    try {
      const trends = await window.api.caisse.getTrends();
      set({ trends, trendsLoading: false });
      return trends;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors du chargement des tendances');
      set({ trendsLoading: false, trendsError: message });
      throw new Error(message);
    }
  },

  /**
   * Récupère les données des sparklines pour les 12 derniers mois.
   *
   * @returns Séries mensuelles (solde, entrées, sorties, flux net)
   */
  getSparklines: async () => {
    set({ sparklinesLoading: true, sparklinesError: null });
    try {
      const sparklines = await window.api.caisse.getSparklines();
      set({ sparklines, sparklinesLoading: false });
      return sparklines;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors du chargement des sparklines');
      set({ sparklinesLoading: false, sparklinesError: message });
      throw new Error(message);
    }
  },

  /**
   * Exporte l’historique des mouvements (CSV, Excel, PDF) – stub.
   *
   * @param params - Filtres pour l’export
   * @returns Chemin du fichier exporté
   */
  exportMouvements: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const result = await window.api.caisse.exportMouvements(params);
      set({ loading: false });
      return result;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors de l’export');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  // ===============================
  // UTILITAIRES
  // ===============================

  /**
   * Efface toutes les erreurs du store.
   */
  clearErrors: () => {
    set({
      error: null,
      statsError: null,
      trendsError: null,
      sparklinesError: null,
    });
  },
}));
