// /home/stive-junior/Auto-ecole-COS/src/store/paiements.store.ts

/**
 * Store Zustand pour la gestion des paiements (encaissements)
 *
 * @module paiementsStore
 * @description
 * Gère l'état global des paiements : liste paginée, détails d’un paiement,
 * statistiques, tendances, sparklines, résumés mensuels, soldes candidats.
 *
 * Toutes les interactions avec l'API Electron passent par `window.api.paiements`.
 * Les données entrantes sont validées avec Zod (`paiements.validator.ts`).
 *
 * @author Stive Junior
 * @version 1.0.0
 */

import { create } from 'zustand';
import type {
  Paiement,
  PaiementsStatsExtended,
  PaiementsTrends,
  PaiementsPaginatedResponse,
  PaiementsListParams,
  PaiementsSparklineData,
  SoldeCandidat,
  ResumeMensuel,
} from '@/types/paiements.types';
import {
  createPaiementSchema,
  updatePaiementSchema,
  deletePaiementSchema,
  paiementsListSchema,
} from '@/lib/validators/paiements.validator';
import { validateOrThrow, safeValidate } from '@/lib/validators/utils.validator';
import { formatErrorMessage } from '@/lib/helpers/error.helper';

// ===============================
// TYPES INTERNES DU STORE
// ===============================

interface PaiementsState {
  // Liste paginée
  paiements: Paiement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  loading: boolean;
  error: string | null;

  // Paiement détaillé (avec candidat et facture)
  currentPaiement: Paiement | null;
  detailLoading: boolean;
  detailError: string | null;

  // Statistiques
  stats: PaiementsStatsExtended | null;
  statsLoading: boolean;
  statsError: string | null;

  // Tendances
  trends: PaiementsTrends | null;
  trendsLoading: boolean;
  trendsError: string | null;

  // Sparklines
  sparklines: PaiementsSparklineData | null;
  sparklinesLoading: boolean;
  sparklinesError: string | null;

  // Solde d’un candidat (caché en cache)
  soldeCandidatCache: Map<number, SoldeCandidat>;
  soldeLoading: boolean;
  soldeError: string | null;

  // Résumé mensuel (cache par annee/mois)
  resumeMensuelCache: Map<string, ResumeMensuel>;
  resumeMensuelLoading: boolean;
  resumeMensuelError: string | null;

  // Paiements d’un candidat (cache)
  paiementsByCandidatCache: Map<number, Paiement[]>;
  paiementsByCandidatLoading: boolean;
  paiementsByCandidatError: string | null;
}

interface PaiementsActions {
  // Opérations CRUD principales
  getAll: (params?: PaiementsListParams) => Promise<PaiementsPaginatedResponse>;
  getById: (id: number) => Promise<Paiement>;
  create: (data: unknown) => Promise<Paiement>;
  update: (id: number, data: unknown) => Promise<Paiement>;
  delete: (id: number) => Promise<{ success: boolean; message: string }>;

  // Statistiques, tendances et sparklines
  getStats: () => Promise<PaiementsStatsExtended>;
  getTrends: () => Promise<PaiementsTrends>;
  getSparklines: () => Promise<PaiementsSparklineData>;

  // Relations & utilités
  getByCandidat: (candidatId: number) => Promise<Paiement[]>;
  getSoldeCandidat: (candidatId: number) => Promise<SoldeCandidat>;
  getResumeMensuel: (annee: number, mois: number) => Promise<ResumeMensuel>;
  printReceipt: (id: number) => Promise<{ success: boolean; path?: string; message?: string }>;

  // Utilitaires
  clearErrors: () => void;
  resetCurrentPaiement: () => void;
  clearCaches: () => void;
}

type PaiementsStore = PaiementsState & PaiementsActions;

// ===============================
// ÉTAT INITIAL
// ===============================

const initialState: PaiementsState = {
  paiements: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  loading: false,
  error: null,

  currentPaiement: null,
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

  soldeCandidatCache: new Map(),
  soldeLoading: false,
  soldeError: null,

  resumeMensuelCache: new Map(),
  resumeMensuelLoading: false,
  resumeMensuelError: null,

  paiementsByCandidatCache: new Map(),
  paiementsByCandidatLoading: false,
  paiementsByCandidatError: null,
};

// ===============================
// STORE PRINCIPAL
// ===============================

export const usePaiementsStore = create<PaiementsStore>()((set, get) => ({
  ...initialState,

  // ===============================
  // OPÉRATIONS CRUD PRINCIPALES
  // ===============================

  /**
   * Récupère la liste paginée des paiements avec filtres optionnels.
   * Valide les paramètres via `paiementsListSchema`.
   *
   * @param params - Pagination, filtres (mode, candidatId, period, search) et tri
   * @returns Réponse paginée
   */
  getAll: async (params = {}) => {
    const validation = safeValidate(paiementsListSchema, params);
    if (!validation.success) {
      const message = formatErrorMessage(validation.error, 'Paramètres de liste invalides');
      set({ error: message });
      throw new Error(message);
    }

    set({ loading: true, error: null });
    try {
      const response = await window.api.paiements.getAll(validation.data);
      set({
        paiements: response.paiements,
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
      const message = formatErrorMessage(error, 'Erreur lors du chargement des paiements');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  /**
   * Récupère un paiement par son identifiant avec candidat et facture.
   * Valide l'ID.
   *
   * @param id - Identifiant du paiement
   * @returns Paiement complet
   */
  getById: async (id) => {
    if (!id || isNaN(id)) {
      throw new Error('Identifiant paiement invalide');
    }
    set({ detailLoading: true, detailError: null });
    try {
      const paiement = await window.api.paiements.getById(id);
      set({ currentPaiement: paiement, detailLoading: false });
      return paiement;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors du chargement du paiement');
      set({ detailLoading: false, detailError: message });
      throw new Error(message);
    }
  },

  /**
   * Crée un nouveau paiement.
   * Valide les données avec `createPaiementSchema` avant l'appel.
   *
   * @param data - Données du paiement
   * @returns Paiement créé
   */
  create: async (data) => {
    const validated = validateOrThrow(createPaiementSchema, data);
    set({ loading: true, error: null });
    try {
      const newPaiement = await window.api.paiements.create(validated);
      // Invalider le cache du solde et des paiements du candidat concerné
      const { soldeCandidatCache, paiementsByCandidatCache } = get();
      if (validated.candidatId) {
        soldeCandidatCache.delete(validated.candidatId);
        paiementsByCandidatCache.delete(validated.candidatId);
        set({
          soldeCandidatCache: new Map(soldeCandidatCache),
          paiementsByCandidatCache: new Map(paiementsByCandidatCache),
        });
      }
      // Recharger la liste courante
      await get().getAll({ page: get().pagination.page, limit: get().pagination.limit });
      set({ loading: false });
      return newPaiement;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors de la création du paiement');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  /**
   * Met à jour un paiement existant (patch partiel – seuls note, référence, factureId).
   * Valide les données avec `updatePaiementSchema`.
   *
   * @param id - Identifiant du paiement
   * @param data - Champs à modifier
   * @returns Paiement mis à jour
   */
  update: async (id, data) => {
    const validated = validateOrThrow(updatePaiementSchema, Object.assign({ id }, data));
    set({ loading: true, error: null });
    try {
      const updated = await window.api.paiements.update(validated.id, validated);
      // Mettre à jour l'état local si le paiement est le courant
      const { currentPaiement } = get();
      if (currentPaiement?.id === updated.id) {
        set({ currentPaiement: updated });
      }
      // Invalider les caches liés au candidat (si candidatId change – rare)
      if (validated.factureId !== undefined) {
        const old = currentPaiement;
        if (old?.candidatId) {
          get().soldeCandidatCache.delete(old.candidatId);
          get().paiementsByCandidatCache.delete(old.candidatId);
        }
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
   * Supprime définitivement un paiement.
   * Valide l'ID.
   *
   * @param id - Identifiant du paiement
   * @returns Résultat de l'opération
   */
  delete: async (id) => {
    const validated = validateOrThrow(deletePaiementSchema, { id });
    set({ loading: true, error: null });
    try {
      const result = await window.api.paiements.delete(validated.id);
      // Invalider les caches du candidat concerné (récupérer l'info avant suppression)
      const { paiements, currentPaiement } = get();
      const toDelete = paiements.find((p) => p.id === validated.id) || currentPaiement;
      if (toDelete?.candidatId) {
        const { soldeCandidatCache, paiementsByCandidatCache } = get();
        soldeCandidatCache.delete(toDelete.candidatId);
        paiementsByCandidatCache.delete(toDelete.candidatId);
        set({
          soldeCandidatCache: new Map(soldeCandidatCache),
          paiementsByCandidatCache: new Map(paiementsByCandidatCache),
        });
      }
      // Recharger la liste
      await get().getAll({ page: get().pagination.page, limit: get().pagination.limit });
      if (currentPaiement?.id === validated.id) {
        set({ currentPaiement: null });
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
   * Récupère les statistiques agrégées complètes des paiements.
   *
   * @returns Métriques étendues (totaux, répartition modes, etc.)
   */
  getStats: async () => {
    set({ statsLoading: true, statsError: null });
    try {
      const stats = await window.api.paiements.getStats();
      set({ stats, statsLoading: false });
      return stats;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors du chargement des statistiques');
      set({ statsLoading: false, statsError: message });
      throw new Error(message);
    }
  },

  /**
   * Récupère les tendances évolutives des paiements (mois vs précédent).
   *
   * @returns Tendances en pourcentage
   */
  getTrends: async () => {
    set({ trendsLoading: true, trendsError: null });
    try {
      const trends = await window.api.paiements.getTrends();
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
   * @returns Séries mensuelles (encaissements, nombre, montant moyen)
   */
  getSparklines: async () => {
    set({ sparklinesLoading: true, sparklinesError: null });
    try {
      const sparklines = await window.api.paiements.getSparklines();
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
   * Récupère tous les paiements d’un candidat (avec cache).
   *
   * @param candidatId - Identifiant du candidat
   * @returns Liste des paiements
   */
  getByCandidat: async (candidatId) => {
    if (!candidatId || isNaN(candidatId)) throw new Error('ID candidat invalide');
    const cache = get().paiementsByCandidatCache;
    if (cache.has(candidatId)) {
      return cache.get(candidatId)!;
    }
    set({ paiementsByCandidatLoading: true, paiementsByCandidatError: null });
    try {
      const paiements = await window.api.paiements.getByCandidat(candidatId);
      set((state) => ({
        paiementsByCandidatCache: new Map(state.paiementsByCandidatCache).set(
          candidatId,
          paiements
        ),
        paiementsByCandidatLoading: false,
      }));
      return paiements;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur chargement paiements candidat');
      set({ paiementsByCandidatLoading: false, paiementsByCandidatError: message });
      throw new Error(message);
    }
  },

  /**
   * Calcule le solde d’un candidat (avec cache).
   *
   * @param candidatId - Identifiant du candidat
   * @returns Solde détaillé (totalPaye, totalFacture, solde, estSolde)
   */
  getSoldeCandidat: async (candidatId) => {
    if (!candidatId || isNaN(candidatId)) throw new Error('ID candidat invalide');
    const cache = get().soldeCandidatCache;
    if (cache.has(candidatId)) {
      return cache.get(candidatId)!;
    }
    set({ soldeLoading: true, soldeError: null });
    try {
      const solde = await window.api.paiements.getSoldeCandidat(candidatId);
      set((state) => ({
        soldeCandidatCache: new Map(state.soldeCandidatCache).set(candidatId, solde),
        soldeLoading: false,
      }));
      return solde;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur calcul solde candidat');
      set({ soldeLoading: false, soldeError: message });
      throw new Error(message);
    }
  },

  /**
   * Récupère le résumé mensuel des paiements (avec cache).
   *
   * @param annee - Année (ex: 2025)
   * @param mois - Mois (1-12)
   * @returns Résumé mensuel (totaux, répartition modes, évolution)
   */
  getResumeMensuel: async (annee, mois) => {
    if (!annee || !mois || mois < 1 || mois > 12) throw new Error('Année et mois invalides');
    const key = `${annee}-${mois}`;
    const cache = get().resumeMensuelCache;
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    set({ resumeMensuelLoading: true, resumeMensuelError: null });
    try {
      const resume = await window.api.paiements.getResumeMensuel(annee, mois);
      set((state) => ({
        resumeMensuelCache: new Map(state.resumeMensuelCache).set(key, resume),
        resumeMensuelLoading: false,
      }));
      return resume;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur chargement résumé mensuel');
      set({ resumeMensuelLoading: false, resumeMensuelError: message });
      throw new Error(message);
    }
  },

  /**
   * Imprime / génère le reçu d’un paiement.
   *
   * @param id - Identifiant du paiement
   * @returns Chemin du PDF ou message
   */
  printReceipt: async (id) => {
    if (!id || isNaN(id)) throw new Error('ID paiement invalide');
    set({ loading: true, error: null });
    try {
      const result = await window.api.paiements.printReceipt(id);
      set({ loading: false });
      return result;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors de la génération du reçu');
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
      soldeError: null,
      resumeMensuelError: null,
      paiementsByCandidatError: null,
    });
  },

  /**
   * Réinitialise le paiement courant (ferme la vue détail).
   */
  resetCurrentPaiement: () => {
    set({ currentPaiement: null, detailError: null, detailLoading: false });
  },

  /**
   * Vide tous les caches (solde, résumés, paiements par candidat).
   * Utile après une mise à jour massive ou une déconnexion.
   */
  clearCaches: () => {
    set({
      soldeCandidatCache: new Map(),
      resumeMensuelCache: new Map(),
      paiementsByCandidatCache: new Map(),
    });
  },
}));
