// /home/stive-junior/Auto-ecole-COS/src/store/factures.store.ts

/**
 * Store Zustand pour la gestion des factures
 *
 * @module facturesStore
 * @description
 * Gère l'état global des factures : liste paginée, détails d’une facture,
 * statistiques, tendances, sparklines, paiements associés, factures par candidat.
 *
 * Toutes les interactions avec l'API Electron passent par `window.api.factures`.
 * Les données entrantes sont validées avec Zod (`factures.validator.ts`).
 *
 * @author Stive Junior
 * @version 1.0.0
 */

import { create } from 'zustand';
import type {
  Facture,
  FacturesStatsExtended,
  FacturesTrends,
  FacturesPaginatedResponse,
  FacturesListParams,
  FacturesSparklineData,
} from '@/types/factures.types';
import type { Paiement } from '@/types/paiements.types';
import {
  createFactureSchema,
  updateFactureSchema,
  deleteFactureSchema,
  facturesListSchema,
} from '@/lib/validators/factures.validator';
import { validateOrThrow, safeValidate } from '@/lib/validators/utils.validator';
import { formatErrorMessage } from '@/lib/helpers/error.helper';
import type { Candidat } from '@/types/candidats.types';

// ===============================
// TYPES INTERNES DU STORE
// ===============================

interface FacturesState {
  // Liste paginée
  factures: Facture[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  loading: boolean;
  error: string | null;

  // Facture détaillée (avec candidat et paiements)
  currentFacture: (Facture & { paiements?: Paiement[]; candidat?: Candidat }) | null;
  detailLoading: boolean;
  detailError: string | null;

  // Statistiques
  stats: FacturesStatsExtended | null;
  statsLoading: boolean;
  statsError: string | null;

  // Tendances
  trends: FacturesTrends | null;
  trendsLoading: boolean;
  trendsError: string | null;

  // Sparklines
  sparklines: FacturesSparklineData | null;
  sparklinesLoading: boolean;
  sparklinesError: string | null;

  // Paiements d’une facture (cache par factureId)
  paiementsByFactureCache: Map<number, Paiement[]>;
  paiementsByFactureLoading: boolean;
  paiementsByFactureError: string | null;

  // Factures d’un candidat (cache par candidatId)
  facturesByCandidatCache: Map<number, Facture[]>;
  facturesByCandidatLoading: boolean;
  facturesByCandidatError: string | null;
}

interface FacturesActions {
  // Opérations CRUD principales
  getAll: (params?: FacturesListParams) => Promise<FacturesPaginatedResponse>;
  getById: (id: number) => Promise<Facture & { paiements?: Paiement[]; candidat?: Candidat }>;
  create: (data: unknown) => Promise<Facture>;
  update: (id: number, data: unknown) => Promise<Facture>;
  delete: (id: number) => Promise<{ success: boolean; message: string }>;

  // Statistiques, tendances et sparklines
  getStats: () => Promise<FacturesStatsExtended>;
  getTrends: () => Promise<FacturesTrends>;
  getSparklines: () => Promise<FacturesSparklineData>;

  // Relations & utilitaires
  getPaiementsByFacture: (factureId: number) => Promise<Paiement[]>;
  getFacturesByCandidat: (candidatId: number) => Promise<Facture[]>;
  generatePDF: (id: number) => Promise<{ success: boolean; path: string; message?: string }>;
  sendByEmail: (id: number) => Promise<{ success: boolean; message: string }>;

  // Utilitaires
  clearErrors: () => void;
  resetCurrentFacture: () => void;
  clearCaches: () => void;
}

type FacturesStore = FacturesState & FacturesActions;

// ===============================
// ÉTAT INITIAL
// ===============================

const initialState: FacturesState = {
  factures: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  loading: false,
  error: null,

  currentFacture: null,
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

  paiementsByFactureCache: new Map(),
  paiementsByFactureLoading: false,
  paiementsByFactureError: null,

  facturesByCandidatCache: new Map(),
  facturesByCandidatLoading: false,
  facturesByCandidatError: null,
};

// ===============================
// STORE PRINCIPAL
// ===============================

export const useFacturesStore = create<FacturesStore>()((set, get) => ({
  ...initialState,

  // ===============================
  // OPÉRATIONS CRUD PRINCIPALES
  // ===============================

  /**
   * Récupère la liste paginée des factures avec filtres optionnels.
   * Valide les paramètres via `facturesListSchema`.
   *
   * @param params - Pagination, filtres (statut, candidatId, period, search) et tri
   * @returns Réponse paginée
   */
  getAll: async (params = {}) => {
    const validation = safeValidate(facturesListSchema, params);
    if (!validation.success) {
      const message = formatErrorMessage(validation.error, 'Paramètres de liste invalides');
      set({ error: message });
      throw new Error(message);
    }

    set({ loading: true, error: null });
    try {
      const response = await window.api.factures.getAll(validation.data);
      set({
        factures: response.factures,
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
      const message = formatErrorMessage(error, 'Erreur lors du chargement des factures');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  /**
   * Récupère une facture par son identifiant avec candidat et paiements.
   * Valide l'ID.
   *
   * @param id - Identifiant de la facture
   * @returns Facture complète
   */
  getById: async (id) => {
    if (!id || isNaN(id)) {
      throw new Error('Identifiant facture invalide');
    }
    set({ detailLoading: true, detailError: null });
    try {
      const facture = await window.api.factures.getById(id);
      set({ currentFacture: facture, detailLoading: false });
      return facture;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors du chargement de la facture');
      set({ detailLoading: false, detailError: message });
      throw new Error(message);
    }
  },

  /**
   * Crée une nouvelle facture.
   * Valide les données avec `createFactureSchema` avant l'appel.
   *
   * @param data - Données de la facture
   * @returns Facture créée
   */
  create: async (data) => {
    const validated = validateOrThrow(createFactureSchema, data);
    set({ loading: true, error: null });
    try {
      const newFacture = await window.api.factures.create(validated);
      // Invalider le cache des factures du candidat concerné
      const { facturesByCandidatCache } = get();
      if (validated.candidatId) {
        facturesByCandidatCache.delete(validated.candidatId);
        set({ facturesByCandidatCache: new Map(facturesByCandidatCache) });
      }
      // Recharger la liste courante
      await get().getAll({ page: get().pagination.page, limit: get().pagination.limit });
      set({ loading: false });
      return newFacture;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors de la création de la facture');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  /**
   * Met à jour une facture existante (patch partiel – statut, échéance, notes).
   * Valide les données avec `updateFactureSchema`.
   *
   * @param id - Identifiant de la facture
   * @param data - Champs à modifier
   * @returns Facture mise à jour
   */
  update: async (id, data) => {
    const validated = validateOrThrow(updateFactureSchema, Object.assign({ id }, data));
    set({ loading: true, error: null });
    try {
      const updated = await window.api.factures.update(validated.id, validated);
      // Mettre à jour l'état local si la facture est la courante
      const { currentFacture } = get();
      if (currentFacture?.id === updated.id) {
        set({ currentFacture: { ...currentFacture, ...updated } });
      }
      // Invalider les caches liés au candidat
      const { facturesByCandidatCache } = get();
      if (currentFacture?.candidatId) {
        facturesByCandidatCache.delete(currentFacture.candidatId);
        set({ facturesByCandidatCache: new Map(facturesByCandidatCache) });
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
   * Supprime définitivement une facture (uniquement si aucun paiement associé).
   * Valide l'ID.
   *
   * @param id - Identifiant de la facture
   * @returns Résultat de l'opération
   */
  delete: async (id) => {
    const validated = validateOrThrow(deleteFactureSchema, { id });
    set({ loading: true, error: null });
    try {
      const result = await window.api.factures.delete(validated.id);
      // Invalider les caches du candidat concerné
      const { currentFacture, facturesByCandidatCache } = get();
      const toDelete = currentFacture?.id === validated.id ? currentFacture : null;
      if (toDelete?.candidatId) {
        facturesByCandidatCache.delete(toDelete.candidatId);
        set({ facturesByCandidatCache: new Map(facturesByCandidatCache) });
      }
      // Recharger la liste
      await get().getAll({ page: get().pagination.page, limit: get().pagination.limit });
      if (currentFacture?.id === validated.id) {
        set({ currentFacture: null });
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
   * Récupère les statistiques agrégées complètes des factures.
   *
   * @returns Métriques étendues (total, montants, impayé, évolutions)
   */
  getStats: async () => {
    set({ statsLoading: true, statsError: null });
    try {
      const stats = await window.api.factures.getStats();
      set({ stats, statsLoading: false });
      return stats;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors du chargement des statistiques');
      set({ statsLoading: false, statsError: message });
      throw new Error(message);
    }
  },

  /**
   * Récupère les tendances évolutives des factures (mois vs précédent).
   *
   * @returns Tendances en pourcentage
   */
  getTrends: async () => {
    set({ trendsLoading: true, trendsError: null });
    try {
      const trends = await window.api.factures.getTrends();
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
   * @returns Sparklines (nombre de factures, montants, impayés, paiements reçus)
   */
  getSparklines: async () => {
    set({ sparklinesLoading: true, sparklinesError: null });
    try {
      const sparklines = await window.api.factures.getSparklines();
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
   * Récupère tous les paiements associés à une facture (avec cache).
   *
   * @param factureId - Identifiant de la facture
   * @returns Liste des paiements
   */
  getPaiementsByFacture: async (factureId) => {
    if (!factureId || isNaN(factureId)) throw new Error('ID facture invalide');
    const cache = get().paiementsByFactureCache;
    if (cache.has(factureId)) {
      return cache.get(factureId)!;
    }
    set({ paiementsByFactureLoading: true, paiementsByFactureError: null });
    try {
      const paiements = await window.api.factures.getPaiements(factureId);
      set((state) => ({
        paiementsByFactureCache: new Map(state.paiementsByFactureCache).set(factureId, paiements),
        paiementsByFactureLoading: false,
      }));
      return paiements;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur chargement des paiements de la facture');
      set({ paiementsByFactureLoading: false, paiementsByFactureError: message });
      throw new Error(message);
    }
  },

  /**
   * Récupère toutes les factures d’un candidat (avec cache).
   *
   * @param candidatId - Identifiant du candidat
   * @returns Liste des factures du candidat
   */
  getFacturesByCandidat: async (candidatId) => {
    if (!candidatId || isNaN(candidatId)) throw new Error('ID candidat invalide');
    const cache = get().facturesByCandidatCache;
    if (cache.has(candidatId)) {
      return cache.get(candidatId)!;
    }
    set({ facturesByCandidatLoading: true, facturesByCandidatError: null });
    try {
      const factures = await window.api.factures.getByCandidat(candidatId);
      set((state) => ({
        facturesByCandidatCache: new Map(state.facturesByCandidatCache).set(candidatId, factures),
        facturesByCandidatLoading: false,
      }));
      return factures;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur chargement des factures du candidat');
      set({ facturesByCandidatLoading: false, facturesByCandidatError: message });
      throw new Error(message);
    }
  },

  /**
   * Génère (ou régénère) le PDF d’une facture.
   *
   * @param id - Identifiant de la facture
   * @returns Chemin du PDF généré
   */
  generatePDF: async (id) => {
    if (!id || isNaN(id)) throw new Error('ID facture invalide');
    set({ loading: true, error: null });
    try {
      const result = await window.api.factures.generatePDF(id);
      // Mettre à jour le champ pdfPath dans la facture courante si elle est chargée
      const { currentFacture } = get();
      if (currentFacture?.id === id && result.path) {
        set({ currentFacture: { ...currentFacture, pdfPath: result.path } });
      }
      set({ loading: false });
      return result;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors de la génération du PDF');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  /**
   * Envoie la facture par email au candidat.
   *
   * @param id - Identifiant de la facture
   * @returns Résultat de l’envoi
   */
  sendByEmail: async (id) => {
    if (!id || isNaN(id)) throw new Error('ID facture invalide');
    set({ loading: true, error: null });
    try {
      const result = await window.api.factures.sendByEmail(id);
      set({ loading: false });
      return result;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors de l’envoi de l’email');
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
      paiementsByFactureError: null,
      facturesByCandidatError: null,
    });
  },

  /**
   * Réinitialise la facture courante (ferme la vue détail).
   */
  resetCurrentFacture: () => {
    set({ currentFacture: null, detailError: null, detailLoading: false });
  },

  /**
   * Vide tous les caches (paiements par facture, factures par candidat).
   */
  clearCaches: () => {
    set({
      paiementsByFactureCache: new Map(),
      facturesByCandidatCache: new Map(),
    });
  },
}));
