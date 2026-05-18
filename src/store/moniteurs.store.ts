// src/store/moniteurs.store.ts

/**
 * Store Zustand pour la gestion des moniteurs (instructeurs)
 *
 * @module moniteursStore
 * @description
 * Gère l'état global des moniteurs : liste paginée, détail d’un moniteur,
 * statistiques, tendances et sparklines.
 *
 * Toutes les interactions avec l'API Electron passent par `window.api.moniteurs`.
 * Les données entrantes sont validées avec Zod (`moniteurs.validator.ts`).
 *
 * @author Stive Junior
 * @version 1.0.0
 */

import { create } from 'zustand';
import type {
  Moniteur,
  MoniteursStatsExtended,
  MoniteursTrends,
  MoniteursPaginatedResponse,
  MoniteursListParams,
  MoniteursSparklineData,
} from '@/types/moniteurs.types';
import {
  createMoniteurSchema,
  updateMoniteurSchema,
  deleteMoniteurSchema,
  moniteursListSchema,
} from '@/lib/validators/moniteurs.validator';
import { validateOrThrow, safeValidate } from '@/lib/validators/utils.validator';
import { formatErrorMessage } from '@/lib/helpers/error.helper';

// ===============================
// TYPES INTERNES DU STORE
// ===============================

interface MoniteursState {
  /** Liste des moniteurs de la page courante */
  moniteurs: Moniteur[];
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

  /** Moniteur actuellement consulté (détail avec leçons) */
  currentMoniteur: Moniteur | null;
  /** Indicateur de chargement du détail */
  detailLoading: boolean;
  /** Erreur lors du chargement du détail */
  detailError: string | null;

  /** Statistiques agrégées (effectifs, heures) */
  stats: MoniteursStatsExtended | null;
  /** Indicateur de chargement des statistiques */
  statsLoading: boolean;
  /** Erreur lors du chargement des statistiques */
  statsError: string | null;

  /** Tendances évolutives (mois vs précédent) */
  trends: MoniteursTrends | null;
  /** Indicateur de chargement des tendances */
  trendsLoading: boolean;
  /** Erreur lors du chargement des tendances */
  trendsError: string | null;

  /** Sparklines (évolution sur 12 mois) */
  sparklines: MoniteursSparklineData | null;
  /** Indicateur de chargement des sparklines */
  sparklinesLoading: boolean;
  /** Erreur lors du chargement des sparklines */
  sparklinesError: string | null;
}

interface MoniteursActions {
  /**
   * Récupère la liste paginée des moniteurs avec filtres optionnels.
   * @param params - Pagination, filtres (search, actif) et tri
   * @returns Réponse paginée
   */
  getAll: (params?: MoniteursListParams) => Promise<MoniteursPaginatedResponse>;

  /**
   * Récupère un moniteur par son identifiant (avec ses leçons).
   * @param id - Identifiant du moniteur
   * @returns Moniteur complet
   */
  getById: (id: number) => Promise<Moniteur>;

  /**
   * Crée un nouveau moniteur.
   * @param data - Données du moniteur (nom, prenom obligatoires)
   * @returns Moniteur créé
   */
  create: (data: unknown) => Promise<Moniteur>;

  /**
   * Met à jour un moniteur existant (patch partiel).
   * @param id - Identifiant du moniteur
   * @param data - Champs à modifier
   * @returns Moniteur mis à jour
   */
  update: (id: number, data: unknown) => Promise<Moniteur>;

  /**
   * Désactive (soft delete) un moniteur.
   * @param id - Identifiant du moniteur
   * @returns Résultat de l'opération
   */
  delete: (id: number) => Promise<{ success: boolean; message: string }>;

  /**
   * Récupère les statistiques agrégées complètes des moniteurs.
   * @returns Métriques étendues
   */
  getStats: () => Promise<MoniteursStatsExtended>;

  /**
   * Récupère les tendances évolutives (mois vs précédent).
   * @returns Variations en pourcentage
   */
  getTrends: () => Promise<MoniteursTrends>;

  /**
   * Récupère les données des sparklines pour les 12 derniers mois.
   * @returns Séries mensuelles (actifs, heures, moyenne)
   */
  getSparklines: () => Promise<MoniteursSparklineData>;

  /** Efface toutes les erreurs du store */
  clearErrors: () => void;

  /** Réinitialise le moniteur courant (ferme la vue détail) */
  resetCurrentMoniteur: () => void;
}

type MoniteursStore = MoniteursState & MoniteursActions;

// ===============================
// ÉTAT INITIAL
// ===============================

const initialState: MoniteursState = {
  moniteurs: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  loading: false,
  error: null,

  currentMoniteur: null,
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
};

// ===============================
// STORE PRINCIPAL
// ===============================

export const useMoniteursStore = create<MoniteursStore>()((set, get) => ({
  ...initialState,

  // ===============================
  // OPÉRATIONS CRUD PRINCIPALES
  // ===============================

  /**
   * Récupère la liste paginée des moniteurs avec filtres optionnels.
   * Valide les paramètres via `moniteursListSchema`.
   */
  getAll: async (params = {}) => {
    const validation = safeValidate(moniteursListSchema, params);
    if (!validation.success) {
      const message = formatErrorMessage(validation.error, 'Paramètres de liste invalides');
      set({ error: message });
      throw new Error(message);
    }

    set({ loading: true, error: null });
    try {
      const response = await window.api.moniteurs.getAll(validation.data);
      set({
        moniteurs: response.moniteurs,
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
      const message = formatErrorMessage(error, 'Erreur lors du chargement des moniteurs');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  /**
   * Récupère un moniteur par son identifiant (avec ses leçons).
   */
  getById: async (id) => {
    if (!id || isNaN(id)) {
      throw new Error('Identifiant moniteur invalide');
    }
    set({ detailLoading: true, detailError: null });
    try {
      const moniteur = await window.api.moniteurs.getById(id);
      set({ currentMoniteur: moniteur, detailLoading: false });
      return moniteur;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors du chargement du moniteur');
      set({ detailLoading: false, detailError: message });
      throw new Error(message);
    }
  },

  /**
   * Crée un nouveau moniteur.
   * Valide les données avec `createMoniteurSchema`.
   */
  create: async (data) => {
    const validated = validateOrThrow(createMoniteurSchema, data);
    set({ loading: true, error: null });
    try {
      const newMoniteur = await window.api.moniteurs.create(validated);
      // Recharger la liste courante
      await get().getAll({ page: get().pagination.page, limit: get().pagination.limit });
      set({ loading: false });
      return newMoniteur;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors de la création du moniteur');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  /**
   * Met à jour un moniteur existant (patch partiel).
   * Valide les données avec `updateMoniteurSchema`.
   */
  update: async (id, data) => {
    const validated = validateOrThrow(updateMoniteurSchema, Object.assign({ id }, data));
    set({ loading: true, error: null });
    try {
      const updated = await window.api.moniteurs.update(validated.id, validated);
      // Mettre à jour l'état local si le moniteur est le courant
      const { currentMoniteur } = get();
      if (currentMoniteur?.id === updated.id) {
        set({ currentMoniteur: updated });
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
   * Désactive (soft delete) un moniteur.
   * Valide l'ID.
   */
  delete: async (id) => {
    const validated = validateOrThrow(deleteMoniteurSchema, { id });
    set({ loading: true, error: null });
    try {
      const result = await window.api.moniteurs.delete(validated.id);
      // Recharger la liste
      await get().getAll({ page: get().pagination.page, limit: get().pagination.limit });
      if (get().currentMoniteur?.id === validated.id) {
        set({ currentMoniteur: null });
      }
      set({ loading: false });
      return result;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors de la désactivation');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  // ===============================
  // STATISTIQUES, TENDANCES ET SPARKLINES
  // ===============================

  /**
   * Récupère les statistiques agrégées complètes des moniteurs.
   */
  getStats: async () => {
    set({ statsLoading: true, statsError: null });
    try {
      const stats = await window.api.moniteurs.getStats();
      set({ stats, statsLoading: false });
      return stats;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors du chargement des statistiques');
      set({ statsLoading: false, statsError: message });
      throw new Error(message);
    }
  },

  /**
   * Récupère les tendances évolutives (mois vs précédent).
   */
  getTrends: async () => {
    set({ trendsLoading: true, trendsError: null });
    try {
      const trends = await window.api.moniteurs.getTrends();
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
   */
  getSparklines: async () => {
    set({ sparklinesLoading: true, sparklinesError: null });
    try {
      const sparklines = await window.api.moniteurs.getSparklines();
      set({ sparklines, sparklinesLoading: false });
      return sparklines;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors du chargement des sparklines');
      set({ sparklinesLoading: false, sparklinesError: message });
      throw new Error(message);
    }
  },

  // ===============================
  // UTILITAIRES
  // ===============================

  clearErrors: () => {
    set({
      error: null,
      detailError: null,
      statsError: null,
      trendsError: null,
      sparklinesError: null,
    });
  },

  resetCurrentMoniteur: () => {
    set({ currentMoniteur: null, detailError: null, detailLoading: false });
  },
}));
