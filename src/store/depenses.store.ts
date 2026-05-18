// /home/stive-junior/Auto-ecole-COS/src/store/depenses.store.ts

/**
 * Store Zustand pour la gestion des dépenses (sorties d’argent)
 *
 * @module depensesStore
 * @description
 * Gère l'état global des dépenses : liste paginée, détail d'une dépense,
 * statistiques, tendances, sparklines, dépenses par véhicule.
 *
 * Toutes les interactions avec l'API Electron passent par `window.api.depenses`.
 * Les données entrantes sont validées avec Zod (`depenses.validator.ts`).
 *
 * @author Stive Junior
 * @version 1.0.0
 */

import { create } from 'zustand';
import type {
  Depense,
  DepensesStatsExtended,
  DepensesTrends,
  DepensesPaginatedResponse,
  DepensesListParams,
  DepensesSparklineData,
  DepensesTrendChartData,
} from '@/types/depenses.types';
import {
  createDepenseSchema,
  updateDepenseSchema,
  deleteDepenseSchema,
  depensesListSchema,
} from '@/lib/validators/depenses.validator';
import { validateOrThrow, safeValidate } from '@/lib/validators/utils.validator';
import { formatErrorMessage } from '@/lib/helpers/error.helper';

// ===============================
// TYPES INTERNES DU STORE
// ===============================

interface DepensesState {
  /** Liste des dépenses de la page courante */
  depenses: Depense[];
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

  /** Dépense actuellement consultée (détail) */
  currentDepense: Depense | null;
  /** Indicateur de chargement du détail */
  detailLoading: boolean;
  /** Erreur lors du chargement du détail */
  detailError: string | null;

  /** Statistiques agrégées (totaux, répartition) */
  stats: DepensesStatsExtended | null;
  /** Indicateur de chargement des statistiques */
  statsLoading: boolean;
  /** Erreur lors du chargement des statistiques */
  statsError: string | null;

  /** Tendances évolutives (mois vs précédent) */
  trends: DepensesTrends | null;
  /** Indicateur de chargement des tendances */
  trendsLoading: boolean;
  /** Erreur lors du chargement des tendances */
  trendsError: string | null;

  /** Sparklines (évolution sur 12 mois) */
  sparklines: DepensesSparklineData | null;
  /** Indicateur de chargement des sparklines */
  sparklinesLoading: boolean;
  /** Erreur lors du chargement des sparklines */
  sparklinesError: string | null;

  /** Cache des dépenses par véhicule (Map<vehiculeId, Depense[]>) */
  depensesByVehiculeCache: Map<number, Depense[]>;
  /** Indicateur de chargement des dépenses par véhicule */
  depensesByVehiculeLoading: boolean;
  /** Erreur lors du chargement des dépenses par véhicule */
  depensesByVehiculeError: string | null;
}

interface DepensesActions {
  /**
   * Récupère la liste paginée des dépenses avec filtres optionnels.
   * @param params - Pagination, filtres (categorie, vehiculeId, period, search) et tri
   * @returns Réponse paginée
   */
  getAll: (params?: DepensesListParams) => Promise<DepensesPaginatedResponse>;

  /**
   * Récupère une dépense par son identifiant (avec véhicule associé).
   * @param id - Identifiant de la dépense
   * @returns Dépense complète
   */
  getById: (id: number) => Promise<Depense>;

  /**
   * Crée une nouvelle dépense.
   * @param data - Données de la dépense
   * @returns Dépense créée
   */
  create: (data: unknown) => Promise<Depense>;

  /**
   * Met à jour une dépense existante (patch partiel).
   * @param id - Identifiant de la dépense
   * @param data - Champs à modifier
   * @returns Dépense mise à jour
   */
  update: (id: number, data: unknown) => Promise<Depense>;

  /**
   * Supprime définitivement une dépense.
   * @param id - Identifiant de la dépense
   * @returns Résultat de l'opération
   */
  delete: (id: number) => Promise<{ success: boolean; message: string }>;

  /**
   * Récupère les statistiques agrégées complètes des dépenses.
   * @returns Métriques étendues (total, mensuel, par catégorie, etc.)
   */
  getStats: () => Promise<DepensesStatsExtended>;

  /**
   * Récupère les tendances évolutives des dépenses (mois vs précédent).
   * @returns Variations en pourcentage pour chaque indicateur
   */
  getTrends: () => Promise<DepensesTrends>;

  /**
   * Récupère les données des sparklines pour les 12 derniers mois.
   * @returns Séries mensuelles (total, carburant, entretien)
   */
  getSparklines: () => Promise<DepensesSparklineData>;

  /**
   * Récupère les données des tendances évolutives des dépenses pour les graphiques.
   * @returns Données de tendance
   */
  getTrendChartData: () => Promise<DepensesTrendChartData>;

  /**
   * Récupère toutes les dépenses associées à un véhicule (avec cache).
   * @param vehiculeId - Identifiant du véhicule
   * @returns Liste des dépenses du véhicule
   */
  getByVehicule: (vehiculeId: number) => Promise<Depense[]>;

  /**
   * Joint un reçu (PDF) à une dépense (stub – à implémenter).
   * @param id - Identifiant de la dépense
   * @param filePath - Chemin du fichier PDF
   * @returns Résultat de l'opération
   */
  attachReceipt: (id: number, filePath: string) => Promise<{ success: boolean; message: string }>;

  /** Efface toutes les erreurs du store */
  clearErrors: () => void;

  /** Réinitialise la dépense courante (ferme la vue détail) */
  resetCurrentDepense: () => void;

  /** Vide tous les caches (dépenses par véhicule) */
  clearCaches: () => void;
}

type DepensesStore = DepensesState & DepensesActions;

// ===============================
// ÉTAT INITIAL
// ===============================

const initialState: DepensesState = {
  depenses: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  loading: false,
  error: null,

  currentDepense: null,
  detailLoading: false,
  detailError: null,

  stats: null,
  statsLoading: false,
  statsError: null,

  trends: null,
  trendsLoading: false,
  trendsError: null,

  sparklines: null,
  sparklinesLoading: false,
  sparklinesError: null,

  depensesByVehiculeCache: new Map(),
  depensesByVehiculeLoading: false,
  depensesByVehiculeError: null,
};

// ===============================
// STORE PRINCIPAL
// ===============================

export const useDepensesStore = create<DepensesStore>()((set, get) => ({
  ...initialState,

  // ===============================
  // OPÉRATIONS CRUD PRINCIPALES
  // ===============================

  /**
   * Récupère la liste paginée des dépenses avec filtres optionnels.
   * Valide les paramètres via `depensesListSchema`.
   *
   * @param params - Pagination, filtres (categorie, vehiculeId, period, search) et tri
   * @returns Réponse paginée
   */
  getAll: async (params = {}) => {
    const validation = safeValidate(depensesListSchema, params);
    if (!validation.success) {
      const message = formatErrorMessage(validation.error, 'Paramètres de liste invalides');
      set({ error: message });
      throw new Error(message);
    }

    set({ loading: true, error: null });
    try {
      const response = await window.api.depenses.getAll(validation.data);
      set({
        depenses: response.depenses,
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
      const message = formatErrorMessage(error, 'Erreur lors du chargement des dépenses');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  /**
   * Récupère une dépense par son identifiant (avec véhicule associé).
   * Valide l'ID.
   *
   * @param id - Identifiant de la dépense
   * @returns Dépense complète
   */
  getById: async (id) => {
    if (!id || isNaN(id)) {
      throw new Error('Identifiant dépense invalide');
    }
    set({ detailLoading: true, detailError: null });
    try {
      const depense = await window.api.depenses.getById(id);
      set({ currentDepense: depense, detailLoading: false });
      return depense;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors du chargement de la dépense');
      set({ detailLoading: false, detailError: message });
      throw new Error(message);
    }
  },

  /**
   * Crée une nouvelle dépense.
   * Valide les données avec `createDepenseSchema` avant l'appel.
   *
   * @param data - Données de la dépense
   * @returns Dépense créée
   */
  create: async (data) => {
    const validated = validateOrThrow(createDepenseSchema, data);
    set({ loading: true, error: null });
    try {
      const newDepense = await window.api.depenses.create(validated);
      // Invalider le cache des dépenses par véhicule si concerné
      const { depensesByVehiculeCache } = get();
      if (validated.vehiculeId) {
        depensesByVehiculeCache.delete(validated.vehiculeId);
        set({ depensesByVehiculeCache: new Map(depensesByVehiculeCache) });
      }
      // Recharger la liste courante
      await get().getAll({ page: get().pagination.page, limit: get().pagination.limit });
      set({ loading: false });
      return newDepense;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors de la création de la dépense');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  /**
   * Met à jour une dépense existante (patch partiel).
   * Valide les données avec `updateDepenseSchema`.
   *
   * @param id - Identifiant de la dépense
   * @param data - Champs à modifier
   * @returns Dépense mise à jour
   */
  update: async (id, data) => {
    const validated = validateOrThrow(updateDepenseSchema, Object.assign({ id }, data));
    set({ loading: true, error: null });
    try {
      const updated = await window.api.depenses.update(validated.id, validated);
      // Mettre à jour l'état local si la dépense est la courante
      const { currentDepense } = get();
      if (currentDepense?.id === updated.id) {
        set({ currentDepense: updated });
      }
      // Invalider le cache des dépenses par véhicule si le véhicule change
      if (currentDepense?.vehiculeId !== updated.vehiculeId) {
        const { depensesByVehiculeCache } = get();
        if (currentDepense?.vehiculeId) {
          depensesByVehiculeCache.delete(currentDepense.vehiculeId);
        }
        if (updated.vehiculeId) {
          depensesByVehiculeCache.delete(updated.vehiculeId);
        }
        set({ depensesByVehiculeCache: new Map(depensesByVehiculeCache) });
      }
      // Recharger la liste
      await get().getAll({ page: get().pagination.page, limit: get().pagination.limit });
      set({ loading: false });
      return updated;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors de la mise à jour');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  /**
   * Supprime définitivement une dépense.
   * Valide l'ID.
   *
   * @param id - Identifiant de la dépense
   * @returns Résultat de l'opération
   */
  delete: async (id) => {
    const validated = validateOrThrow(deleteDepenseSchema, { id });
    set({ loading: true, error: null });
    try {
      const result = await window.api.depenses.delete(validated.id);
      // Invalider le cache des dépenses par véhicule
      const { currentDepense, depensesByVehiculeCache } = get();
      if (currentDepense?.vehiculeId) {
        depensesByVehiculeCache.delete(currentDepense.vehiculeId);
        set({ depensesByVehiculeCache: new Map(depensesByVehiculeCache) });
      }
      // Recharger la liste
      await get().getAll({ page: get().pagination.page, limit: get().pagination.limit });
      if (currentDepense?.id === validated.id) {
        set({ currentDepense: null });
      }
      set({ loading: false });
      return result;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors de la suppression');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  // ===============================
  // STATISTIQUES, TENDANCES ET SPARKLINES
  // ===============================

  /**
   * Récupère les statistiques agrégées complètes des dépenses.
   *
   * @returns Métriques étendues (total, mensuel, par catégorie, évolutions)
   */
  getStats: async () => {
    set({ statsLoading: true, statsError: null });
    try {
      const stats = await window.api.depenses.getStats();
      set({ stats, statsLoading: false });
      return stats;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors du chargement des statistiques');
      set({ statsLoading: false, statsError: message });
      throw new Error(message);
    }
  },

  /**
   * Récupère les tendances évolutives des dépenses (mois vs précédent).
   *
   * @returns Tendances en pourcentage
   */
  getTrends: async () => {
    set({ trendsLoading: true, trendsError: null });
    try {
      const trends = await window.api.depenses.getTrends();
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
   * @returns Séries mensuelles (total, carburant, entretien)
   */
  getSparklines: async () => {
    set({ sparklinesLoading: true, sparklinesError: null });
    try {
      const sparklines = await window.api.depenses.getSparklines();
      set({ sparklines, sparklinesLoading: false });
      return sparklines;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors du chargement des sparklines');
      set({ sparklinesLoading: false, sparklinesError: message });
      throw new Error(message);
    }
  },

  /**
   * Récupère les données des tendances évolutives des dépenses pour les graphiques.
   * @returns Données de tendance
   */
  getTrendChartData: async () => {
    set({ loading: true, error: null });
    try {
      const data = await window.api.depenses.getTrendChartData();
      set({ loading: false });
      return data;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur chargement graphique');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  // ===============================
  // RELATIONS & UTILITAIRES
  // ===============================

  /**
   * Récupère toutes les dépenses associées à un véhicule (avec cache).
   *
   * @param vehiculeId - Identifiant du véhicule
   * @returns Liste des dépenses du véhicule
   */
  getByVehicule: async (vehiculeId) => {
    if (!vehiculeId || isNaN(vehiculeId)) {
      throw new Error('Identifiant véhicule invalide');
    }
    const cache = get().depensesByVehiculeCache;
    if (cache.has(vehiculeId)) {
      return cache.get(vehiculeId)!;
    }
    set({ depensesByVehiculeLoading: true, depensesByVehiculeError: null });
    try {
      const depenses = await window.api.depenses.getByVehicule(vehiculeId);
      set((state) => ({
        depensesByVehiculeCache: new Map(state.depensesByVehiculeCache).set(vehiculeId, depenses),
        depensesByVehiculeLoading: false,
      }));
      return depenses;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur chargement des dépenses du véhicule');
      set({ depensesByVehiculeLoading: false, depensesByVehiculeError: message });
      throw new Error(message);
    }
  },

  /**
   * Joint un reçu (PDF) à une dépense – stub (à implémenter avec un service réel).
   *
   * @param id - Identifiant de la dépense
   * @param filePath - Chemin du fichier PDF
   * @returns Résultat de l'opération
   */
  attachReceipt: async (id, filePath) => {
    if (!id || isNaN(id)) {
      throw new Error('Identifiant dépense invalide');
    }
    set({ loading: true, error: null });
    try {
      const result = await window.api.depenses.attachReceipt(id, filePath);
      set({ loading: false });
      return result;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors de l’attachement du reçu');
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
      detailError: null,
      statsError: null,
      trendsError: null,
      sparklinesError: null,
      depensesByVehiculeError: null,
    });
  },

  /**
   * Réinitialise la dépense courante (ferme la vue détail).
   */
  resetCurrentDepense: () => {
    set({ currentDepense: null, detailError: null, detailLoading: false });
  },

  /**
   * Vide tous les caches (dépenses par véhicule).
   * Utile après une déconnexion ou une mise à jour massive.
   */
  clearCaches: () => {
    set({ depensesByVehiculeCache: new Map() });
  },
}));
