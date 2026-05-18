// src/store/vehicules.store.ts

/**
 * Store Zustand pour la gestion des véhicules et de leurs entretiens
 *
 * @module vehiculesStore
 * @description
 * Gère l'état global des véhicules : liste paginée, détail d’un véhicule,
 * statistiques, tendances, sparklines, entretiens par véhicule, kilométrage.
 *
 * Toutes les interactions avec l'API Electron passent par `window.api.vehicules`.
 * Les données entrantes sont validées avec Zod (`vehicules.validator.ts`).
 *
 * @author Stive Junior
 * @version 1.0.0
 */

import { create } from 'zustand';
import type {
  Vehicule,
  Entretien,
  VehiculesStatsExtended,
  VehiculesTrends,
  VehiculesPaginatedResponse,
  VehiculesListParams,
  VehiculesSparklineData,
  CreateVehiculeInput,
  UpdateVehiculeInput,
  CreateEntretienInput,
  UpdateEntretienInput,
  UpdateKilometrageInput,
} from '@/types/vehicules.types';
import {
  createVehiculeSchema,
  updateVehiculeSchema,
  deleteVehiculeSchema,
  vehiculesListSchema,
  createEntretienSchema,
  updateEntretienSchema,
  deleteEntretienSchema,
  updateKilometrageSchema,
} from '@/lib/validators/vehicules.validator';
import { validateOrThrow, safeValidate } from '@/lib/validators/utils.validator';
import { formatErrorMessage } from '@/lib/helpers/error.helper';

// ===============================
// TYPES INTERNES DU STORE
// ===============================

interface VehiculesState {
  // Liste paginée
  vehicules: Vehicule[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  loading: boolean;
  error: string | null;

  // Véhicule détaillé (avec entretiens, leçons, dépenses)
  currentVehicule: Vehicule | null;
  detailLoading: boolean;
  detailError: string | null;

  // Statistiques
  stats: VehiculesStatsExtended | null;
  statsLoading: boolean;
  statsError: string | null;

  // Tendances
  trends: VehiculesTrends | null;
  trendsLoading: boolean;
  trendsError: string | null;

  // Sparklines
  sparklines: VehiculesSparklineData | null;
  sparklinesLoading: boolean;
  sparklinesError: string | null;

  // Cache des entretiens par véhicule
  entretiensByVehiculeCache: Map<number, Entretien[]>;
  entretiensLoading: boolean;
  entretiensError: string | null;

  // Cache pour la vérification d'unicité (simple, optionnel)
  immatriculationCache: Map<string, boolean>;
}

interface VehiculesActions {
  // Opérations CRUD principales
  getAll: (params?: VehiculesListParams) => Promise<VehiculesPaginatedResponse>;
  getById: (id: number) => Promise<Vehicule>;
  create: (data: unknown) => Promise<Vehicule>;
  update: (id: number, data: unknown) => Promise<Vehicule>;
  delete: (id: number) => Promise<{ success: boolean; message: string }>;

  // Statistiques, tendances et sparklines
  getStats: () => Promise<VehiculesStatsExtended>;
  getTrends: () => Promise<VehiculesTrends>;
  getSparklines: () => Promise<VehiculesSparklineData>;

  // Gestion des entretiens
  getEntretiensByVehicule: (vehiculeId: number) => Promise<Entretien[]>;
  createEntretien: (data: unknown) => Promise<Entretien>;
  updateEntretien: (id: number, data: unknown) => Promise<Entretien>;
  deleteEntretien: (id: number) => Promise<{ success: boolean; message: string }>;

  // Mise à jour du kilométrage
  updateKilometrage: (data: unknown) => Promise<Vehicule>;

  // Utilitaires
  isImmatriculationUnique: (immatriculation: string, excludeId?: number) => Promise<boolean>;

  // Nettoyage
  clearErrors: () => void;
  resetCurrentVehicule: () => void;
  clearCaches: () => void;
}

type VehiculesStore = VehiculesState & VehiculesActions;

// ===============================
// ÉTAT INITIAL
// ===============================

const initialState: VehiculesState = {
  vehicules: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  loading: false,
  error: null,

  currentVehicule: null,
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

  entretiensByVehiculeCache: new Map(),
  entretiensLoading: false,
  entretiensError: null,

  immatriculationCache: new Map(),
};

// ===============================
// STORE PRINCIPAL
// ===============================

export const useVehiculesStore = create<VehiculesStore>()((set, get) => ({
  ...initialState,

  // ===============================
  // OPÉRATIONS CRUD PRINCIPALES
  // ===============================

  /**
   * Récupère la liste paginée des véhicules avec filtres optionnels.
   * Valide les paramètres via `vehiculesListSchema`.
   *
   * @param params - Pagination, filtres (categorie, statut, search) et tri
   * @returns Réponse paginée
   */
  getAll: async (params = {}) => {
    const validation = safeValidate(vehiculesListSchema, params);
    if (!validation.success) {
      const message = formatErrorMessage(validation.error, 'Paramètres de liste invalides');
      set({ error: message });
      throw new Error(message);
    }

    set({ loading: true, error: null });
    try {
      const response = await window.api.vehicules.getAll(validation.data);
      set({
        vehicules: response.vehicules,
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
      const message = formatErrorMessage(error, 'Erreur lors du chargement des véhicules');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  /**
   * Récupère un véhicule par son identifiant avec ses relations.
   * Valide l'ID.
   *
   * @param id - Identifiant du véhicule
   * @returns Véhicule complet (entretiens, dépenses, leçons)
   */
  getById: async (id) => {
    if (!id || isNaN(id)) {
      throw new Error('Identifiant véhicule invalide');
    }
    set({ detailLoading: true, detailError: null });
    try {
      const vehicule = await window.api.vehicules.getById(id);
      set({ currentVehicule: vehicule, detailLoading: false });
      return vehicule;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors du chargement du véhicule');
      set({ detailLoading: false, detailError: message });
      throw new Error(message);
    }
  },

  /**
   * Crée un nouveau véhicule.
   * Valide les données avec `createVehiculeSchema` avant l'appel.
   *
   * @param data - Données du véhicule
   * @returns Véhicule créé
   */
  create: async (data) => {
    const validated = validateOrThrow(createVehiculeSchema, data);
    set({ loading: true, error: null });
    try {
      const newVehicule = await window.api.vehicules.create(validated);
      // Invalider le cache d'unicité
      const { immatriculationCache } = get();
      immatriculationCache.delete(validated.immatriculation);
      set({ immatriculationCache: new Map(immatriculationCache) });
      // Recharger la liste courante
      await get().getAll({ page: get().pagination.page, limit: get().pagination.limit });
      set({ loading: false });
      return newVehicule;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors de la création du véhicule');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  /**
   * Met à jour un véhicule existant (patch partiel).
   * Valide les données avec `updateVehiculeSchema`.
   *
   * @param id - Identifiant du véhicule
   * @param data - Champs à modifier
   * @returns Véhicule mis à jour
   */
  update: async (id, data) => {
    const validated = validateOrThrow(updateVehiculeSchema, Object.assign({ id }, data));
    set({ loading: true, error: null });
    try {
      const updated = await window.api.vehicules.update(validated.id, validated);
      // Mettre à jour l'état local si le véhicule est le courant
      const { currentVehicule } = get();
      if (currentVehicule?.id === updated.id) {
        set({ currentVehicule: updated });
      }
      // Invalider le cache d'unicité si l'immatriculation a changé
      if (
        validated.immatriculation &&
        currentVehicule?.immatriculation !== validated.immatriculation
      ) {
        const { immatriculationCache } = get();
        if (currentVehicule?.immatriculation) {
          immatriculationCache.delete(currentVehicule.immatriculation);
        }
        immatriculationCache.delete(validated.immatriculation);
        set({ immatriculationCache: new Map(immatriculationCache) });
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
   * Supprime (désactive) un véhicule.
   * Valide l'ID.
   *
   * @param id - Identifiant du véhicule
   * @returns Résultat de l'opération
   */
  delete: async (id) => {
    const validated = validateOrThrow(deleteVehiculeSchema, { id });
    set({ loading: true, error: null });
    try {
      const result = await window.api.vehicules.delete(validated.id);
      // Invalider les caches
      const { currentVehicule, immatriculationCache } = get();
      if (currentVehicule?.id === validated.id) {
        set({ currentVehicule: null });
      }
      if (currentVehicule?.immatriculation) {
        immatriculationCache.delete(currentVehicule.immatriculation);
        set({ immatriculationCache: new Map(immatriculationCache) });
      }
      // Recharger la liste
      await get().getAll({ page: get().pagination.page, limit: get().pagination.limit });
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
   * Récupère les statistiques agrégées complètes des véhicules.
   *
   * @returns Métriques étendues (total, disponibles, entretiens, kilométrage, etc.)
   */
  getStats: async () => {
    set({ statsLoading: true, statsError: null });
    try {
      const stats = await window.api.vehicules.getStats();
      set({ stats, statsLoading: false });
      return stats;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors du chargement des statistiques');
      set({ statsLoading: false, statsError: message });
      throw new Error(message);
    }
  },

  /**
   * Récupère les tendances évolutives des véhicules (mois vs précédent).
   *
   * @returns Tendances en pourcentage
   */
  getTrends: async () => {
    set({ trendsLoading: true, trendsError: null });
    try {
      const trends = await window.api.vehicules.getTrends();
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
   * @returns Séries mensuelles (disponibles, en leçon, entretiens, kilométrage)
   */
  getSparklines: async () => {
    set({ sparklinesLoading: true, sparklinesError: null });
    try {
      const sparklines = await window.api.vehicules.getSparklines();
      set({ sparklines, sparklinesLoading: false });
      return sparklines;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors du chargement des sparklines');
      set({ sparklinesLoading: false, sparklinesError: message });
      throw new Error(message);
    }
  },

  // ===============================
  // GESTION DES ENTRETIENS
  // ===============================

  /**
   * Récupère tous les entretiens d’un véhicule (avec cache).
   *
   * @param vehiculeId - Identifiant du véhicule
   * @returns Liste des entretiens triés par date décroissante
   */
  getEntretiensByVehicule: async (vehiculeId) => {
    if (!vehiculeId || isNaN(vehiculeId)) throw new Error('ID véhicule invalide');
    const cache = get().entretiensByVehiculeCache;
    if (cache.has(vehiculeId)) {
      return cache.get(vehiculeId)!;
    }
    set({ entretiensLoading: true, entretiensError: null });
    try {
      const entretiens = await window.api.vehicules.getEntretiensByVehicule(vehiculeId);
      set((state) => ({
        entretiensByVehiculeCache: new Map(state.entretiensByVehiculeCache).set(
          vehiculeId,
          entretiens
        ),
        entretiensLoading: false,
      }));
      return entretiens;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur chargement des entretiens');
      set({ entretiensLoading: false, entretiensError: message });
      throw new Error(message);
    }
  },

  /**
   * Crée un nouvel entretien pour un véhicule.
   * Valide les données avec `createEntretienSchema`.
   *
   * @param data - Données de l’entretien
   * @returns Entretien créé
   */
  createEntretien: async (data) => {
    const validated = validateOrThrow(createEntretienSchema, data);
    set({ loading: true, error: null });
    try {
      const newEntretien = await window.api.vehicules.createEntretien(validated);
      // Invalider le cache des entretiens du véhicule concerné
      const { entretiensByVehiculeCache } = get();
      entretiensByVehiculeCache.delete(validated.vehiculeId);
      set({ entretiensByVehiculeCache: new Map(entretiensByVehiculeCache) });
      // Recharger le détail du véhicule si c'est le courant
      const { currentVehicule } = get();
      if (currentVehicule?.id === validated.vehiculeId) {
        await get().getById(validated.vehiculeId);
      }
      set({ loading: false });
      return newEntretien;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors de la création de l’entretien');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  /**
   * Met à jour un entretien existant.
   * Valide les données avec `updateEntretienSchema`.
   *
   * @param id - Identifiant de l’entretien
   * @param data - Champs à modifier
   * @returns Entretien mis à jour
   */
  updateEntretien: async (id, data) => {
    const validated = validateOrThrow(updateEntretienSchema, Object.assign({ id }, data));
    set({ loading: true, error: null });
    try {
      const updated = await window.api.vehicules.updateEntretien(validated.id, validated);
      // Invalider le cache des entretiens du véhicule
      const { entretiensByVehiculeCache, currentVehicule } = get();
      if (currentVehicule?.id === updated.vehiculeId) {
        entretiensByVehiculeCache.delete(updated.vehiculeId);
        set({ entretiensByVehiculeCache: new Map(entretiensByVehiculeCache) });
        await get().getById(updated.vehiculeId);
      }
      set({ loading: false });
      return updated;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors de la mise à jour de l’entretien');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  /**
   * Supprime un entretien.
   * Valide l'ID.
   *
   * @param id - Identifiant de l’entretien
   * @returns Résultat de l'opération
   */
  deleteEntretien: async (id) => {
    const validated = validateOrThrow(deleteEntretienSchema, { id });
    set({ loading: true, error: null });
    try {
      // Récupérer le vehiculeId avant suppression pour invalider le cache
      const entretiens = Array.from(get().entretiensByVehiculeCache.values()).flat();
      const entretien = entretiens.find((e) => e.id === validated.id);
      const vehiculeId = entretien?.vehiculeId;
      const result = await window.api.vehicules.deleteEntretien(validated.id);
      if (vehiculeId) {
        const { entretiensByVehiculeCache } = get();
        entretiensByVehiculeCache.delete(vehiculeId);
        set({ entretiensByVehiculeCache: new Map(entretiensByVehiculeCache) });
        // Recharger le détail du véhicule si c'est le courant
        const { currentVehicule } = get();
        if (currentVehicule?.id === vehiculeId) {
          await get().getById(vehiculeId);
        }
      }
      set({ loading: false });
      return result;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors de la suppression de l’entretien');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  // ===============================
  // MISE À JOUR DU KILOMÉTRAGE
  // ===============================

  /**
   * Met à jour le kilométrage d’un véhicule.
   * Valide les données avec `updateKilometrageSchema`.
   *
   * @param data - Identifiant du véhicule et nouveau kilométrage
   * @returns Véhicule mis à jour
   */
  updateKilometrage: async (data) => {
    const validated = validateOrThrow(updateKilometrageSchema, data);
    set({ loading: true, error: null });
    try {
      const updated = await window.api.vehicules.updateKilometrage(validated);
      // Mettre à jour l'état local si le véhicule est le courant
      const { currentVehicule } = get();
      if (currentVehicule?.id === updated.id) {
        set({ currentVehicule: updated });
      }
      // Recharger la liste courante
      await get().getAll({ page: get().pagination.page, limit: get().pagination.limit });
      set({ loading: false });
      return updated;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors de la mise à jour du kilométrage');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  // ===============================
  // UTILITAIRES
  // ===============================

  /**
   * Vérifie si une immatriculation est unique (avec cache simple).
   *
   * @param immatriculation - Plaque à vérifier
   * @param excludeId - Identifiant du véhicule à exclure (pour modification)
   * @returns `true` si unique
   */
  isImmatriculationUnique: async (immatriculation, excludeId) => {
    const cacheKey = `${immatriculation}|${excludeId ?? ''}`;
    const cache = get().immatriculationCache;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)!;
    }
    try {
      const isUnique = await window.api.vehicules.isImmatriculationUnique(
        immatriculation,
        excludeId
      );
      set((state) => ({
        immatriculationCache: new Map(state.immatriculationCache).set(cacheKey, isUnique),
      }));
      return isUnique;
    } catch (error) {
      console.error('Erreur vérification immatriculation:', error);
      return true; // par défaut, on suppose unique
    }
  },

  // ===============================
  // UTILITAIRES DE NETTOYAGE
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
      entretiensError: null,
    });
  },

  /**
   * Réinitialise le véhicule courant (ferme la vue détail).
   */
  resetCurrentVehicule: () => {
    set({ currentVehicule: null, detailError: null, detailLoading: false });
  },

  /**
   * Vide tous les caches (entretiens, immatriculation).
   * Utile après une déconnexion ou une mise à jour massive.
   */
  clearCaches: () => {
    set({
      entretiensByVehiculeCache: new Map(),
      immatriculationCache: new Map(),
    });
  },
}));
