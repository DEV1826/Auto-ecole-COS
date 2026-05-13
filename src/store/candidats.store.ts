// /home/stive-junior/Auto-ecole-COS/src/store/candidats.store.ts

/**
 * Store Zustand pour la gestion des candidats (élèves)
 *
 * @module candidatsStore
 * @description
 * Gère l'état global des candidats : liste paginée, candidat courant,
 * statistiques, documents, paiements, leçons, examens, factures.
 *
 * Toutes les interactions avec l'API Electron passent par `window.api.candidats`.
 * Les données entrantes sont validées avec Zod (`candidats.validator.ts`).
 *
 * @author Stive Junior
 * @version 1.0.0
 */

import { create } from 'zustand';
import type {
  Candidat,
  CandidatsStatsExtended,
  CandidatsPaginatedResponse,
  CandidatsListParams,
  UpdateCandidatStatusParams,
  CandidatDocumentInput,
} from '@/types/candidats.types';
import type { Paiement } from '@/types/paiements.types';
import type { Lecon } from '@/types/planning.types';
import type { Examen } from '@/types/examens.types';
import type { Facture } from '@/types/factures.types';
import type { Document } from '@/types/documents.types';
import {
  createCandidatSchema,
  updateCandidatSchema,
  deleteCandidatSchema,
  candidatsListSchema,
} from '@/lib/validators/candidats.validator';
import { validateOrThrow, safeValidate } from '@/lib/validators/utils.validator';
import { formatErrorMessage } from '@/lib/helpers/error.helper';

// ===============================
// TYPES INTERNES DU STORE
// ===============================

interface CandidatsState {
  // Liste paginée
  candidats: Candidat[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  loading: boolean;
  error: string | null;

  // Candidat détaillé (avec relations)
  currentCandidat: Candidat | null;
  detailLoading: boolean;
  detailError: string | null;

  // Statistiques
  stats: CandidatsStatsExtended | null;
  statsLoading: boolean;
  statsError: string | null;

  // Recherche rapide (optionnelle)
  searchResults: Candidat[];
  searchLoading: boolean;
  searchError: string | null;

  // Paiements (pour un candidat)
  paiements: Paiement[];
  paiementsLoading: boolean;
  paiementsError: string | null;

  // Leçons
  lecons: Lecon[];
  leconsLoading: boolean;
  leconsError: string | null;

  // Examens
  examens: Examen[];
  examensLoading: boolean;
  examensError: string | null;

  // Factures
  factures: Facture[];
  facturesLoading: boolean;
  facturesError: string | null;

  // Documents
  documents: Document[];
  documentsLoading: boolean;
  documentsError: string | null;
}

interface CandidatsActions {
  // Opérations CRUD principales
  getAll: (params?: CandidatsListParams) => Promise<CandidatsPaginatedResponse>;
  getById: (id: number) => Promise<Candidat>;
  create: (data: unknown) => Promise<Candidat>;
  update: (id: number, data: unknown) => Promise<Candidat>;
  delete: (id: number) => Promise<{ success: boolean; message: string }>;
  search: (query: string) => Promise<Candidat[]>;
  updateStatus: (params: UpdateCandidatStatusParams) => Promise<Candidat>;
  getStats: () => Promise<CandidatsStatsExtended>;

  // Accès aux relations
  getPaiements: (candidatId: number) => Promise<Paiement[]>;
  getLecons: (candidatId: number) => Promise<Lecon[]>;
  getExamens: (candidatId: number) => Promise<Examen[]>;
  getFactures: (candidatId: number) => Promise<Facture[]>;
  getDocuments: (candidatId: number) => Promise<Document[]>;

  // Gestion des documents
  addDocument: (data: CandidatDocumentInput) => Promise<Document>;
  deleteDocument: (docId: number) => Promise<{ success: boolean; message: string }>;

  // Utilitaires
  clearErrors: () => void;
  resetCurrentCandidat: () => void;
  resetSearch: () => void;
}

type CandidatsStore = CandidatsState & CandidatsActions;

// ===============================
// ÉTAT INITIAL
// ===============================

const initialState: CandidatsState = {
  candidats: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  loading: false,
  error: null,

  currentCandidat: null,
  detailLoading: false,
  detailError: null,

  stats: null,
  statsLoading: false,
  statsError: null,

  searchResults: [],
  searchLoading: false,
  searchError: null,

  paiements: [],
  paiementsLoading: false,
  paiementsError: null,

  lecons: [],
  leconsLoading: false,
  leconsError: null,

  examens: [],
  examensLoading: false,
  examensError: null,

  factures: [],
  facturesLoading: false,
  facturesError: null,

  documents: [],
  documentsLoading: false,
  documentsError: null,
};

// ===============================
// STORE PRINCIPAL
// ===============================

export const useCandidatsStore = create<CandidatsStore>()((set, get) => ({
  ...initialState,

  // ===============================
  // OPÉRATIONS CRUD PRINCIPALES
  // ===============================

  /**
   * Récupère la liste paginée des candidats avec filtres optionnels.
   * Valide les paramètres via `candidatsListSchema`.
   *
   * @param params - Pagination et filtres (page, limit, search, statut, categorie, dateDebut, dateFin)
   * @returns Réponse paginée
   */
  getAll: async (params = {}) => {
    const validation = safeValidate(candidatsListSchema, params);
    if (!validation.success) {
      const message = formatErrorMessage(validation.error, 'Paramètres de liste invalides');
      set({ error: message });
      throw new Error(message);
    }

    set({ loading: true, error: null });
    try {
      const response = await window.api.candidats.getAll(validation.data);
      set({
        candidats: response.candidats,
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
      const message = formatErrorMessage(error, 'Erreur lors du chargement des candidats');
      set({ loading: false, error: message });
      throw new Error(message, { cause: error });
    }
  },

  /**
   * Récupère un candidat par son identifiant avec toutes ses relations.
   * Valide l'ID.
   *
   * @param id - Identifiant du candidat
   * @returns Candidat complet
   */
  getById: async (id) => {
    if (!id || isNaN(id)) {
      throw new Error('Identifiant candidat invalide');
    }
    set({ detailLoading: true, detailError: null });
    try {
      const candidat = await window.api.candidats.getById(id);
      set({ currentCandidat: candidat, detailLoading: false });
      return candidat;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors du chargement du candidat');
      set({ detailLoading: false, detailError: message });
      throw new Error(message, { cause: error });
    }
  },

  /**
   * Crée un nouveau candidat.
   * Valide les données avec `createCandidatSchema` avant l'appel.
   *
   * @param data - Données du candidat (conformes au schéma)
   * @returns Candidat créé
   */
  create: async (data) => {
    const validated = validateOrThrow(createCandidatSchema, data);
    set({ loading: true, error: null });
    try {
      const newCandidat = await window.api.candidats.create(validated);
      // Optionnel : recharger la liste courante
      await get().getAll({ page: get().pagination.page, limit: get().pagination.limit });
      set({ loading: false });
      return newCandidat;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors de la création du candidat');
      set({ loading: false, error: message });
      throw new Error(message, { cause: error });
    }
  },

  /**
   * Met à jour un candidat existant (patch partiel).
   * Valide les données avec `updateCandidatSchema`.
   *
   * @param id - Identifiant du candidat
   * @param data - Champs à mettre à jour
   * @returns Candidat mis à jour
   */
  update: async (id, data) => {
    const validated = validateOrThrow(updateCandidatSchema, Object.assign({ id }, data));
    set({ loading: true, error: null });
    try {
      const updated = await window.api.candidats.update(validated.id, validated);
      // Mettre à jour l'état local si le candidat est le courant
      const { currentCandidat } = get();
      if (currentCandidat?.id === updated.id) {
        set({ currentCandidat: updated });
      }
      // Recharger la liste
      await get().getAll({ page: get().pagination.page, limit: get().pagination.limit });
      set({ loading: false });
      return updated;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors de la mise à jour');
      set({ loading: false, error: message });
      throw new Error(message, { cause: error });
    }
  },

  /**
   * Supprime logiquement (soft delete) un candidat.
   * Valide l'ID.
   *
   * @param id - Identifiant du candidat
   * @returns Résultat de l'opération
   */
  delete: async (id) => {
    const validated = validateOrThrow(deleteCandidatSchema, { id });
    set({ loading: true, error: null });
    try {
      const result = await window.api.candidats.delete(validated.id);
      // Recharger la liste après suppression
      await get().getAll({ page: get().pagination.page, limit: get().pagination.limit });
      // Si le candidat supprimé était celui affiché en détail, le vider
      const { currentCandidat } = get();
      if (currentCandidat?.id === validated.id) {
        set({ currentCandidat: null });
      }
      set({ loading: false });
      return result;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors de la suppression');
      set({ loading: false, error: message });
      throw new Error(message, { cause: error });
    }
  },

  /**
   * Recherche rapide de candidats (nom, prénom, email, numéro permis).
   * Valide la requête (min 2 caractères).
   *
   * @param query - Terme de recherche
   * @returns Liste des candidats trouvés
   */
  search: async (query) => {
    if (!query || query.trim().length < 2) {
      throw new Error('Le terme de recherche doit contenir au moins 2 caractères');
    }
    set({ searchLoading: true, searchError: null });
    try {
      const results = await window.api.candidats.search(query.trim());
      set({ searchResults: results, searchLoading: false });
      return results;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors de la recherche');
      set({ searchLoading: false, searchError: message });
      throw new Error(message, { cause: error });
    }
  },

  /**
   * Met à jour uniquement le statut d'un candidat.
   *
   * @param params - { id, statut }
   * @returns Candidat mis à jour
   */
  updateStatus: async (params) => {
    if (!params.id || !params.statut) {
      throw new Error('ID et statut requis');
    }
    set({ loading: true, error: null });
    try {
      const updated = await window.api.candidats.updateStatus(params);
      // Mettre à jour dans la liste et le currentCandidat
      const { candidats, currentCandidat } = get();
      const updatedList = candidats.map((c) => (c.id === updated.id ? updated : c));
      set({ candidats: updatedList, loading: false });
      if (currentCandidat?.id === updated.id) {
        set({ currentCandidat: updated });
      }
      return updated;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors du changement de statut');
      set({ loading: false, error: message });
      throw new Error(message, { cause: error });
    }
  },

  /**
   * Récupère les statistiques étendues des candidats.
   *
   * @returns Statistiques agrégées
   */
  getStats: async () => {
    set({ statsLoading: true, statsError: null });
    try {
      const stats = await window.api.candidats.getStats();
      set({ stats, statsLoading: false });
      return stats;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors du chargement des statistiques');
      set({ statsLoading: false, statsError: message });
      throw new Error(message, { cause: error });
    }
  },

  // ===============================
  // ACCÈS AUX RELATIONS
  // ===============================

  /**
   * Récupère tous les paiements d'un candidat.
   *
   * @param candidatId - Identifiant du candidat
   * @returns Liste des paiements
   */
  getPaiements: async (candidatId) => {
    if (!candidatId || isNaN(candidatId)) throw new Error('ID candidat invalide');
    set({ paiementsLoading: true, paiementsError: null });
    try {
      const paiements = await window.api.candidats.getPaiements(candidatId);
      set({ paiements, paiementsLoading: false });
      return paiements;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur chargement des paiements');
      set({ paiementsLoading: false, paiementsError: message });
      throw new Error(message, { cause: error });
    }
  },

  /**
   * Récupère toutes les leçons d'un candidat.
   *
   * @param candidatId - Identifiant du candidat
   * @returns Liste des leçons
   */
  getLecons: async (candidatId) => {
    if (!candidatId || isNaN(candidatId)) throw new Error('ID candidat invalide');
    set({ leconsLoading: true, leconsError: null });
    try {
      const lecons = await window.api.candidats.getLecons(candidatId);
      set({ lecons, leconsLoading: false });
      return lecons;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur chargement des leçons');
      set({ leconsLoading: false, leconsError: message });
      throw new Error(message, { cause: error });
    }
  },

  /**
   * Récupère tous les examens d'un candidat.
   *
   * @param candidatId - Identifiant du candidat
   * @returns Liste des examens
   */
  getExamens: async (candidatId) => {
    if (!candidatId || isNaN(candidatId)) throw new Error('ID candidat invalide');
    set({ examensLoading: true, examensError: null });
    try {
      const examens = await window.api.candidats.getExamens(candidatId);
      set({ examens, examensLoading: false });
      return examens;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur chargement des examens');
      set({ examensLoading: false, examensError: message });
      throw new Error(message, { cause: error });
    }
  },

  /**
   * Récupère toutes les factures d'un candidat.
   *
   * @param candidatId - Identifiant du candidat
   * @returns Liste des factures
   */
  getFactures: async (candidatId) => {
    if (!candidatId || isNaN(candidatId)) throw new Error('ID candidat invalide');
    set({ facturesLoading: true, facturesError: null });
    try {
      const factures = await window.api.candidats.getFactures(candidatId);
      set({ factures, facturesLoading: false });
      return factures;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur chargement des factures');
      set({ facturesLoading: false, facturesError: message });
      throw new Error(message, { cause: error });
    }
  },

  /**
   * Récupère tous les documents d'un candidat.
   *
   * @param candidatId - Identifiant du candidat
   * @returns Liste des documents
   */
  getDocuments: async (candidatId) => {
    if (!candidatId || isNaN(candidatId)) throw new Error('ID candidat invalide');
    set({ documentsLoading: true, documentsError: null });
    try {
      const documents = await window.api.candidats.getDocuments(candidatId);
      set({ documents, documentsLoading: false });
      return documents;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur chargement des documents');
      set({ documentsLoading: false, documentsError: message });
      throw new Error(message, { cause: error });
    }
  },

  // ===============================
  // GESTION DES DOCUMENTS
  // ===============================

  /**
   * Ajoute un document à un candidat.
   *
   * @param data - Informations du document
   * @returns Document créé
   */
  addDocument: async (data) => {
    if (!data.candidatId || !data.type || !data.nomFichier || !data.chemin) {
      throw new Error('Données document incomplètes');
    }
    set({ documentsLoading: true, documentsError: null });
    try {
      const newDoc = await window.api.candidats.addDocument(data);
      // Recharger la liste des documents du candidat
      await get().getDocuments(data.candidatId);
      set({ documentsLoading: false });
      return newDoc;
    } catch (error) {
      const message = formatErrorMessage(error, "Erreur lors de l'ajout du document");
      set({ documentsLoading: false, documentsError: message });
      throw new Error(message, { cause: error });
    }
  },

  /**
   * Supprime définitivement un document.
   *
   * @param docId - Identifiant du document
   * @returns Résultat de l'opération
   */
  deleteDocument: async (docId) => {
    if (!docId || isNaN(docId)) throw new Error('ID document invalide');
    set({ documentsLoading: true, documentsError: null });
    try {
      const result = await window.api.candidats.deleteDocument(docId);
      // Recharger la liste des documents du candidat courant (si un candidat est ouvert)
      const { currentCandidat } = get();
      if (currentCandidat?.id) {
        await get().getDocuments(currentCandidat.id);
      }
      set({ documentsLoading: false });
      return result;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors de la suppression du document');
      set({ documentsLoading: false, documentsError: message });
      throw new Error(message, { cause: error });
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
      searchError: null,
      paiementsError: null,
      leconsError: null,
      examensError: null,
      facturesError: null,
      documentsError: null,
    });
  },

  /**
   * Réinitialise le candidat courant (pour fermer la vue détail).
   */
  resetCurrentCandidat: () => {
    set({ currentCandidat: null, detailError: null, detailLoading: false });
  },

  /**
   * Réinitialise les résultats de recherche.
   */
  resetSearch: () => {
    set({ searchResults: [], searchError: null, searchLoading: false });
  },
}));
