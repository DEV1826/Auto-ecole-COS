// /home/stive-junior/Auto-ecole-COS/src/store/planning.store.ts

/**
 * Store Zustand pour la gestion des leçons (planning)
 *
 * @module planningStore
 * @description
 * Gère l'état global des leçons : liste paginée, détail d'une leçon,
 * statistiques, tendances, sparklines, leçons par candidat/moniteur/véhicule,
 * et recherche par période.
 *
 * Toutes les interactions avec l'API Electron passent par `window.api.planning`.
 * Les données entrantes sont validées avec Zod (`planning.validator.ts`).
 *
 * @author Stive Junior
 * @version 1.0.0
 */

import { create } from 'zustand';
import type {
  Lecon,
  LeconsStatsExtended,
  LeconsTrends,
  LeconsPaginatedResponse,
  LeconsListParams,
  LeconsSparklineData,
} from '@/types/planning.types';
import {
  createLeconSchema,
  updateLeconSchema,
  deleteLeconSchema,
  leconsListSchema,
  leconsBetweenDatesSchema,
} from '@/lib/validators/planning.validator';
import { validateOrThrow, safeValidate } from '@/lib/validators/utils.validator';
import { formatErrorMessage } from '@/lib/helpers/error.helper';

// ===============================
// TYPES INTERNES DU STORE
// ===============================

interface PlanningState {
  /** Liste des leçons de la page courante */
  lecons: Lecon[];
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

  /** Leçon actuellement consultée (détail) */
  currentLecon: Lecon | null;
  /** Indicateur de chargement du détail */
  detailLoading: boolean;
  /** Erreur lors du chargement du détail */
  detailError: string | null;

  /** Statistiques agrégées (totaux, taux occupation) */
  stats: LeconsStatsExtended | null;
  /** Indicateur de chargement des statistiques */
  statsLoading: boolean;
  /** Erreur lors du chargement des statistiques */
  statsError: string | null;

  /** Tendances évolutives (mois vs précédent) */
  trends: LeconsTrends | null;
  /** Indicateur de chargement des tendances */
  trendsLoading: boolean;
  /** Erreur lors du chargement des tendances */
  trendsError: string | null;

  /** Sparklines (évolution sur 12 mois) */
  sparklines: LeconsSparklineData | null;
  /** Indicateur de chargement des sparklines */
  sparklinesLoading: boolean;
  /** Erreur lors du chargement des sparklines */
  sparklinesError: string | null;

  /** Cache des leçons par candidat (Map<candidatId, Lecon[]>) */
  leconsByCandidatCache: Map<number, Lecon[]>;
  /** Cache des leçons par moniteur (Map<moniteurId, Lecon[]>) */
  leconsByMoniteurCache: Map<number, Lecon[]>;
  /** Cache des leçons par véhicule (Map<vehiculeId, Lecon[]>) */
  leconsByVehiculeCache: Map<number, Lecon[]>;
  /** Indicateur de chargement des relations */
  relationsLoading: boolean;
  /** Erreur lors du chargement des relations */
  relationsError: string | null;
}

interface PlanningActions {
  /**
   * Récupère la liste paginée des leçons avec filtres optionnels.
   * @param params - Pagination, filtres (type, statut, candidatId, moniteurId, period, search) et tri
   * @returns Réponse paginée
   */
  getAll: (params?: LeconsListParams) => Promise<LeconsPaginatedResponse>;

  /**
   * Récupère une leçon par son identifiant (avec relations).
   * @param id - Identifiant de la leçon
   * @returns Leçon complète
   */
  getById: (id: number) => Promise<Lecon>;

  /**
   * Crée une nouvelle leçon.
   * @param data - Données de la leçon
   * @returns Leçon créée
   */
  create: (data: unknown) => Promise<Lecon>;

  /**
   * Met à jour une leçon existante (patch partiel).
   * @param id - Identifiant de la leçon
   * @param data - Champs à modifier
   * @returns Leçon mise à jour
   */
  update: (id: number, data: unknown) => Promise<Lecon>;

  /**
   * Supprime définitivement une leçon.
   * @param id - Identifiant de la leçon
   * @returns Résultat de l'opération
   */
  delete: (id: number) => Promise<{ success: boolean; message: string }>;

  /**
   * Récupère les statistiques agrégées complètes des leçons.
   * @returns Métriques étendues
   */
  getStats: () => Promise<LeconsStatsExtended>;

  /**
   * Récupère les tendances évolutives des leçons (mois vs précédent).
   * @returns Variations en pourcentage
   */
  getTrends: () => Promise<LeconsTrends>;

  /**
   * Récupère les données des sparklines pour les 12 derniers mois.
   * @returns Séries mensuelles (leçons effectuées, heures conduite, taux occupation)
   */
  getSparklines: () => Promise<LeconsSparklineData>;

  /**
   * Récupère toutes les leçons d’un candidat (avec cache).
   * @param candidatId - Identifiant du candidat
   * @returns Liste des leçons
   */
  getByCandidat: (candidatId: number) => Promise<Lecon[]>;

  /**
   * Récupère toutes les leçons d’un moniteur (avec cache).
   * @param moniteurId - Identifiant du moniteur
   * @returns Liste des leçons
   */
  getByMoniteur: (moniteurId: number) => Promise<Lecon[]>;

  /**
   * Récupère toutes les leçons d’un véhicule (avec cache).
   * @param vehiculeId - Identifiant du véhicule
   * @returns Liste des leçons
   */
  getByVehicule: (vehiculeId: number) => Promise<Lecon[]>;

  /**
   * Récupère les leçons pour une période donnée (calendrier).
   * @param startDate - Date de début (inclus)
   * @param endDate - Date de fin (inclus)
   * @param moniteurId - Optionnel : filtrer par moniteur
   * @returns Liste des leçons dans l’intervalle
   */
  getBetweenDates: (
    startDate: Date | string,
    endDate: Date | string,
    moniteurId?: number
  ) => Promise<Lecon[]>;

  /** Efface toutes les erreurs du store */
  clearErrors: () => void;

  /** Réinitialise la leçon courante (ferme la vue détail) */
  resetCurrentLecon: () => void;

  /** Vide tous les caches (leçons par candidat/moniteur/véhicule) */
  clearCaches: () => void;
}

type PlanningStore = PlanningState & PlanningActions;

// ===============================
// ÉTAT INITIAL
// ===============================

const initialState: PlanningState = {
  lecons: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  loading: false,
  error: null,

  currentLecon: null,
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

  leconsByCandidatCache: new Map(),
  leconsByMoniteurCache: new Map(),
  leconsByVehiculeCache: new Map(),
  relationsLoading: false,
  relationsError: null,
};

// ===============================
// STORE PRINCIPAL
// ===============================

export const usePlanningStore = create<PlanningStore>()((set, get) => ({
  ...initialState,

  // ===============================
  // OPÉRATIONS CRUD PRINCIPALES
  // ===============================

  /**
   * Récupère la liste paginée des leçons avec filtres optionnels.
   * Valide les paramètres via `leconsListSchema`.
   */
  getAll: async (params = {}) => {
    const validation = safeValidate(leconsListSchema, params);
    if (!validation.success) {
      const message = formatErrorMessage(validation.error, 'Paramètres de liste invalides');
      set({ error: message });
      throw new Error(message);
    }

    set({ loading: true, error: null });
    try {
      const response = await window.api.planning.getAll(validation.data);
      set({
        lecons: response.lecons,
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
      const message = formatErrorMessage(error, 'Erreur lors du chargement des leçons');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  /**
   * Récupère une leçon par son identifiant (avec relations).
   */
  getById: async (id) => {
    if (!id || isNaN(id)) {
      throw new Error('Identifiant leçon invalide');
    }
    set({ detailLoading: true, detailError: null });
    try {
      const lecon = await window.api.planning.getById(id);
      set({ currentLecon: lecon, detailLoading: false });
      return lecon;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors du chargement de la leçon');
      set({ detailLoading: false, detailError: message });
      throw new Error(message);
    }
  },

  /**
   * Crée une nouvelle leçon.
   * Valide les données avec `createLeconSchema`.
   */
  create: async (data) => {
    const validated = validateOrThrow(createLeconSchema, data);
    set({ loading: true, error: null });
    try {
      const newLecon = await window.api.planning.create(validated);
      // Invalider les caches concernés
      const { leconsByCandidatCache, leconsByMoniteurCache, leconsByVehiculeCache } = get();
      if (validated.candidatId) leconsByCandidatCache.delete(validated.candidatId);
      if (validated.moniteurId) leconsByMoniteurCache.delete(validated.moniteurId);
      if (validated.vehiculeId) leconsByVehiculeCache.delete(validated.vehiculeId);
      set({
        leconsByCandidatCache: new Map(leconsByCandidatCache),
        leconsByMoniteurCache: new Map(leconsByMoniteurCache),
        leconsByVehiculeCache: new Map(leconsByVehiculeCache),
      });
      // Recharger la liste courante
      await get().getAll({ page: get().pagination.page, limit: get().pagination.limit });
      set({ loading: false });
      return newLecon;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors de la création de la leçon');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  /**
   * Met à jour une leçon existante (patch partiel).
   * Valide les données avec `updateLeconSchema`.
   */
  update: async (id, data) => {
    const validated = validateOrThrow(updateLeconSchema, Object.assign({ id }, data));
    set({ loading: true, error: null });
    try {
      const updated = await window.api.planning.update(validated.id, validated);
      // Mettre à jour l'état local si la leçon est la courante
      const { currentLecon } = get();
      if (currentLecon?.id === updated.id) {
        set({ currentLecon: updated });
      }
      // Invalider les caches
      const { leconsByCandidatCache, leconsByMoniteurCache, leconsByVehiculeCache } = get();
      if (currentLecon?.candidatId) leconsByCandidatCache.delete(currentLecon.candidatId);
      if (currentLecon?.moniteurId) leconsByMoniteurCache.delete(currentLecon.moniteurId);
      if (currentLecon?.vehiculeId) leconsByVehiculeCache.delete(currentLecon.vehiculeId);
      if (updated.candidatId) leconsByCandidatCache.delete(updated.candidatId);
      if (updated.moniteurId) leconsByMoniteurCache.delete(updated.moniteurId);
      if (updated.vehiculeId) leconsByVehiculeCache.delete(updated.vehiculeId);
      set({
        leconsByCandidatCache: new Map(leconsByCandidatCache),
        leconsByMoniteurCache: new Map(leconsByMoniteurCache),
        leconsByVehiculeCache: new Map(leconsByVehiculeCache),
      });
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
   * Supprime définitivement une leçon.
   * Valide l'ID.
   */
  delete: async (id) => {
    const validated = validateOrThrow(deleteLeconSchema, { id });
    set({ loading: true, error: null });
    try {
      const result = await window.api.planning.delete(validated.id);
      // Invalider les caches
      const { currentLecon, leconsByCandidatCache, leconsByMoniteurCache, leconsByVehiculeCache } =
        get();
      if (currentLecon?.candidatId) leconsByCandidatCache.delete(currentLecon.candidatId);
      if (currentLecon?.moniteurId) leconsByMoniteurCache.delete(currentLecon.moniteurId);
      if (currentLecon?.vehiculeId) leconsByVehiculeCache.delete(currentLecon.vehiculeId);
      set({
        leconsByCandidatCache: new Map(leconsByCandidatCache),
        leconsByMoniteurCache: new Map(leconsByMoniteurCache),
        leconsByVehiculeCache: new Map(leconsByVehiculeCache),
      });
      // Recharger la liste
      await get().getAll({ page: get().pagination.page, limit: get().pagination.limit });
      if (currentLecon?.id === validated.id) {
        set({ currentLecon: null });
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

  getStats: async () => {
    set({ statsLoading: true, statsError: null });
    try {
      const stats = await window.api.planning.getStats();
      set({ stats, statsLoading: false });
      return stats;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors du chargement des statistiques');
      set({ statsLoading: false, statsError: message });
      throw new Error(message);
    }
  },

  getTrends: async () => {
    set({ trendsLoading: true, trendsError: null });
    try {
      const trends = await window.api.planning.getTrends();
      set({ trends, trendsLoading: false });
      return trends;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors du chargement des tendances');
      set({ trendsLoading: false, trendsError: message });
      throw new Error(message);
    }
  },

  getSparklines: async () => {
    set({ sparklinesLoading: true, sparklinesError: null });
    try {
      const sparklines = await window.api.planning.getSparklines();
      set({ sparklines, sparklinesLoading: false });
      return sparklines;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors du chargement des sparklines');
      set({ sparklinesLoading: false, sparklinesError: message });
      throw new Error(message);
    }
  },

  // ===============================
  // RELATIONS & UTILITAIRES (AVEC CACHE)
  // ===============================

  getByCandidat: async (candidatId) => {
    if (!candidatId || isNaN(candidatId)) throw new Error('ID candidat invalide');
    const cache = get().leconsByCandidatCache;
    if (cache.has(candidatId)) {
      return cache.get(candidatId)!;
    }
    set({ relationsLoading: true, relationsError: null });
    try {
      const lecons = await window.api.planning.getByCandidat(candidatId);
      set((state) => ({
        leconsByCandidatCache: new Map(state.leconsByCandidatCache).set(candidatId, lecons),
        relationsLoading: false,
      }));
      return lecons;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur chargement leçons du candidat');
      set({ relationsLoading: false, relationsError: message });
      throw new Error(message);
    }
  },

  getByMoniteur: async (moniteurId) => {
    if (!moniteurId || isNaN(moniteurId)) throw new Error('ID moniteur invalide');
    const cache = get().leconsByMoniteurCache;
    if (cache.has(moniteurId)) {
      return cache.get(moniteurId)!;
    }
    set({ relationsLoading: true, relationsError: null });
    try {
      const lecons = await window.api.planning.getByMoniteur(moniteurId);
      set((state) => ({
        leconsByMoniteurCache: new Map(state.leconsByMoniteurCache).set(moniteurId, lecons),
        relationsLoading: false,
      }));
      return lecons;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur chargement leçons du moniteur');
      set({ relationsLoading: false, relationsError: message });
      throw new Error(message);
    }
  },

  getByVehicule: async (vehiculeId) => {
    if (!vehiculeId || isNaN(vehiculeId)) throw new Error('ID véhicule invalide');
    const cache = get().leconsByVehiculeCache;
    if (cache.has(vehiculeId)) {
      return cache.get(vehiculeId)!;
    }
    set({ relationsLoading: true, relationsError: null });
    try {
      const lecons = await window.api.planning.getByVehicule(vehiculeId);
      set((state) => ({
        leconsByVehiculeCache: new Map(state.leconsByVehiculeCache).set(vehiculeId, lecons),
        relationsLoading: false,
      }));
      return lecons;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur chargement leçons du véhicule');
      set({ relationsLoading: false, relationsError: message });
      throw new Error(message);
    }
  },

  getBetweenDates: async (startDate, endDate, moniteurId) => {
    const validation = safeValidate(leconsBetweenDatesSchema, { startDate, endDate, moniteurId });
    if (!validation.success) {
      const message = formatErrorMessage(validation.error, 'Paramètres de dates invalides');
      set({ error: message });
      throw new Error(message);
    }
    set({ loading: true, error: null });
    try {
      const lecons = await window.api.planning.getBetweenDates(
        validation.data.startDate,
        validation.data.endDate,
        validation.data.moniteurId
      );
      set({ loading: false });
      return lecons;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors du chargement des leçons');
      set({ loading: false, error: message });
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
      relationsError: null,
    });
  },

  resetCurrentLecon: () => {
    set({ currentLecon: null, detailError: null, detailLoading: false });
  },

  clearCaches: () => {
    set({
      leconsByCandidatCache: new Map(),
      leconsByMoniteurCache: new Map(),
      leconsByVehiculeCache: new Map(),
    });
  },
}));
