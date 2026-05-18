// /home/stive-junior/Auto-ecole-COS/src/store/examens.store.ts

/**
 * Store Zustand pour la gestion des examens (code et conduite)
 *
 * @module examensStore
 * @description
 * Gère l'état global des examens : liste paginée, détail d'un examen,
 * statistiques, tendances, sparklines, examens par candidat.
 *
 * Toutes les interactions avec l'API Electron passent par `window.api.examens`.
 * Les données entrantes sont validées avec Zod (`examens.validator.ts`).
 *
 * @author Stive Junior
 * @version 1.0.0
 */

import { create } from 'zustand';
import type {
  Examen,
  ExamensStatsExtended,
  ExamensTrends,
  ExamensPaginatedResponse,
  ExamensListParams,
  ExamensSparklineData,
} from '@/types/examens.types';
import {
  createExamenSchema,
  updateExamenSchema,
  deleteExamenSchema,
  examensListSchema,
} from '@/lib/validators/examens.validator';
import { validateOrThrow, safeValidate } from '@/lib/validators/utils.validator';
import { formatErrorMessage } from '@/lib/helpers/error.helper';

// ===============================
// TYPES INTERNES DU STORE
// ===============================

interface ExamensState {
  /** Liste des examens de la page courante */
  examens: Examen[];
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

  /** Examen actuellement consulté (détail) */
  currentExamen: Examen | null;
  /** Indicateur de chargement du détail */
  detailLoading: boolean;
  /** Erreur lors du chargement du détail */
  detailError: string | null;

  /** Statistiques agrégées (totaux, taux de réussite) */
  stats: ExamensStatsExtended | null;
  /** Indicateur de chargement des statistiques */
  statsLoading: boolean;
  /** Erreur lors du chargement des statistiques */
  statsError: string | null;

  /** Tendances évolutives (mois vs précédent) */
  trends: ExamensTrends | null;
  /** Indicateur de chargement des tendances */
  trendsLoading: boolean;
  /** Erreur lors du chargement des tendances */
  trendsError: string | null;

  /** Sparklines (évolution sur 12 mois) */
  sparklines: ExamensSparklineData | null;
  /** Indicateur de chargement des sparklines */
  sparklinesLoading: boolean;
  /** Erreur lors du chargement des sparklines */
  sparklinesError: string | null;

  /** Cache des examens par candidat (Map<candidatId, Examen[]>) */
  examensByCandidatCache: Map<number, Examen[]>;
  /** Indicateur de chargement des examens par candidat */
  examensByCandidatLoading: boolean;
  /** Erreur lors du chargement des examens par candidat */
  examensByCandidatError: string | null;
}

interface ExamensActions {
  /**
   * Récupère la liste paginée des examens avec filtres optionnels.
   * @param params - Pagination, filtres (type, resultat, candidatId, period, search) et tri
   * @returns Réponse paginée
   */
  getAll: (params?: ExamensListParams) => Promise<ExamensPaginatedResponse>;

  /**
   * Récupère un examen par son identifiant (avec candidat).
   * @param id - Identifiant de l'examen
   * @returns Examen complet
   */
  getById: (id: number) => Promise<Examen>;

  /**
   * Crée un nouvel examen.
   * @param data - Données de l'examen
   * @returns Examen créé
   */
  create: (data: unknown) => Promise<Examen>;

  /**
   * Met à jour un examen existant (patch partiel).
   * @param id - Identifiant de l'examen
   * @param data - Champs à modifier
   * @returns Examen mis à jour
   */
  update: (id: number, data: unknown) => Promise<Examen>;

  /**
   * Supprime définitivement un examen.
   * @param id - Identifiant de l'examen
   * @returns Résultat de l'opération
   */
  delete: (id: number) => Promise<{ success: boolean; message: string }>;

  /**
   * Récupère les statistiques agrégées complètes des examens.
   * @returns Métriques étendues
   */
  getStats: () => Promise<ExamensStatsExtended>;

  /**
   * Récupère les tendances évolutives des examens (mois vs précédent).
   * @returns Variations en pourcentage
   */
  getTrends: () => Promise<ExamensTrends>;

  /**
   * Récupère les données des sparklines pour les 12 derniers mois.
   * @returns Séries mensuelles (nombre, réussites, taux de réussite)
   */
  getSparklines: () => Promise<ExamensSparklineData>;

  /**
   * Récupère tous les examens d’un candidat (avec cache).
   * @param candidatId - Identifiant du candidat
   * @returns Liste des examens
   */
  getByCandidat: (candidatId: number) => Promise<Examen[]>;

  /**
   * Génère l’attestation (PDF) pour un examen réussi.
   * @param id - Identifiant de l'examen
   * @returns Chemin du PDF généré
   */
  printCertificate: (id: number) => Promise<{ success: boolean; path?: string; message?: string }>;

  /** Efface toutes les erreurs du store */
  clearErrors: () => void;

  /** Réinitialise l'examen courant (ferme la vue détail) */
  resetCurrentExamen: () => void;

  /** Vide le cache des examens par candidat */
  clearCaches: () => void;
}

type ExamensStore = ExamensState & ExamensActions;

// ===============================
// ÉTAT INITIAL
// ===============================

const initialState: ExamensState = {
  examens: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  loading: false,
  error: null,

  currentExamen: null,
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

  examensByCandidatCache: new Map(),
  examensByCandidatLoading: false,
  examensByCandidatError: null,
};

// ===============================
// STORE PRINCIPAL
// ===============================

export const useExamensStore = create<ExamensStore>()((set, get) => ({
  ...initialState,

  // ===============================
  // OPÉRATIONS CRUD PRINCIPALES
  // ===============================

  /**
   * Récupère la liste paginée des examens avec filtres optionnels.
   * Valide les paramètres via `examensListSchema`.
   */
  getAll: async (params = {}) => {
    const validation = safeValidate(examensListSchema, params);
    if (!validation.success) {
      const message = formatErrorMessage(validation.error, 'Paramètres de liste invalides');
      set({ error: message });
      throw new Error(message);
    }

    set({ loading: true, error: null });
    try {
      const response = await window.api.examens.getAll(validation.data);
      set({
        examens: response.examens,
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
      const message = formatErrorMessage(error, 'Erreur lors du chargement des examens');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  /**
   * Récupère un examen par son identifiant (avec candidat).
   */
  getById: async (id) => {
    if (!id || isNaN(id)) {
      throw new Error('Identifiant examen invalide');
    }
    set({ detailLoading: true, detailError: null });
    try {
      const examen = await window.api.examens.getById(id);
      set({ currentExamen: examen, detailLoading: false });
      return examen;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors du chargement de l’examen');
      set({ detailLoading: false, detailError: message });
      throw new Error(message);
    }
  },

  /**
   * Crée un nouvel examen.
   * Valide les données avec `createExamenSchema`.
   */
  create: async (data) => {
    const validated = validateOrThrow(createExamenSchema, data);
    set({ loading: true, error: null });
    try {
      const newExamen = await window.api.examens.create(validated);
      // Invalider le cache du candidat concerné
      const { examensByCandidatCache } = get();
      if (validated.candidatId) {
        examensByCandidatCache.delete(validated.candidatId);
        set({ examensByCandidatCache: new Map(examensByCandidatCache) });
      }
      // Recharger la liste courante
      await get().getAll({ page: get().pagination.page, limit: get().pagination.limit });
      set({ loading: false });
      return newExamen;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors de la création de l’examen');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  /**
   * Met à jour un examen existant (patch partiel).
   * Valide les données avec `updateExamenSchema`.
   */
  update: async (id, data) => {
    const validated = validateOrThrow(updateExamenSchema, Object.assign({ id }, data));
    set({ loading: true, error: null });
    try {
      const updated = await window.api.examens.update(validated.id, validated);
      // Mettre à jour l'état local si l'examen est le courant
      const { currentExamen } = get();
      if (currentExamen?.id === updated.id) {
        set({ currentExamen: updated });
      }
      // Invalider le cache du candidat si le candidatId a changé
      const { examensByCandidatCache } = get();
      if (currentExamen?.candidatId) {
        examensByCandidatCache.delete(currentExamen.candidatId);
      }
      if (updated.candidatId) {
        examensByCandidatCache.delete(updated.candidatId);
      }
      set({ examensByCandidatCache: new Map(examensByCandidatCache) });
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
   * Supprime définitivement un examen.
   * Valide l'ID.
   */
  delete: async (id) => {
    const validated = validateOrThrow(deleteExamenSchema, { id });
    set({ loading: true, error: null });
    try {
      const result = await window.api.examens.delete(validated.id);
      // Invalider le cache du candidat concerné
      const { currentExamen, examensByCandidatCache } = get();
      if (currentExamen?.candidatId) {
        examensByCandidatCache.delete(currentExamen.candidatId);
        set({ examensByCandidatCache: new Map(examensByCandidatCache) });
      }
      // Recharger la liste
      await get().getAll({ page: get().pagination.page, limit: get().pagination.limit });
      if (currentExamen?.id === validated.id) {
        set({ currentExamen: null });
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
      const stats = await window.api.examens.getStats();
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
      const trends = await window.api.examens.getTrends();
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
      const sparklines = await window.api.examens.getSparklines();
      set({ sparklines, sparklinesLoading: false });
      return sparklines;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors du chargement des sparklines');
      set({ sparklinesLoading: false, sparklinesError: message });
      throw new Error(message);
    }
  },

  // ===============================
  // RELATIONS & UTILITAIRES
  // ===============================

  /**
   * Récupère tous les examens d’un candidat (avec cache).
   */
  getByCandidat: async (candidatId) => {
    if (!candidatId || isNaN(candidatId)) {
      throw new Error('Identifiant candidat invalide');
    }
    const cache = get().examensByCandidatCache;
    if (cache.has(candidatId)) {
      return cache.get(candidatId)!;
    }
    set({ examensByCandidatLoading: true, examensByCandidatError: null });
    try {
      const examens = await window.api.examens.getByCandidat(candidatId);
      set((state) => ({
        examensByCandidatCache: new Map(state.examensByCandidatCache).set(candidatId, examens),
        examensByCandidatLoading: false,
      }));
      return examens;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur chargement des examens du candidat');
      set({ examensByCandidatLoading: false, examensByCandidatError: message });
      throw new Error(message);
    }
  },

  /**
   * Génère l’attestation (PDF) pour un examen réussi.
   */
  printCertificate: async (id) => {
    if (!id || isNaN(id)) {
      throw new Error('Identifiant examen invalide');
    }
    set({ loading: true, error: null });
    try {
      const result = await window.api.examens.printCertificate(id);
      set({ loading: false });
      return result;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors de la génération de l’attestation');
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
      examensByCandidatError: null,
    });
  },

  resetCurrentExamen: () => {
    set({ currentExamen: null, detailError: null, detailLoading: false });
  },

  clearCaches: () => {
    set({ examensByCandidatCache: new Map() });
  },
}));
