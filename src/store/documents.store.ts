// src/store/documents.store.ts

/**
 * Store Zustand pour la gestion des documents
 *
 * @module documentsStore
 * @description
 * Gère l'état global des documents : liste paginée, détail d'un document,
 * statistiques, tendances, sparklines.
 *
 * Toutes les interactions avec l'API Electron passent par `window.api.documents`.
 * Les données entrantes sont validées avec Zod (`documents.validator.ts`).
 *
 * @author Stive Junior
 * @version 1.0.0
 */

import { create } from 'zustand';
import type {
  Document,
  DocumentsStats,
  DocumentsTrends,
  DocumentsPaginatedResponse,
  DocumentsListParams,
  DocumentsSparklineData,
} from '@/types/documents.types';
import { deleteDocumentSchema, documentsListSchema } from '@/lib/validators/documents.validator';
import { validateOrThrow, safeValidate } from '@/lib/validators/utils.validator';
import { formatErrorMessage } from '@/lib/helpers/error.helper';

// ===============================
// TYPES INTERNES DU STORE
// ===============================

interface DocumentsState {
  /** Liste des documents de la page courante */
  documents: Document[];
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

  /** Document actuellement consulté */
  currentDocument: Document | null;
  /** Indicateur de chargement du détail */
  detailLoading: boolean;
  /** Erreur lors du chargement du détail */
  detailError: string | null;

  /** Statistiques agrégées des documents */
  stats: DocumentsStats | null;
  /** Indicateur de chargement des statistiques */
  statsLoading: boolean;
  /** Erreur lors du chargement des statistiques */
  statsError: string | null;

  /** Tendances évolutives */
  trends: DocumentsTrends | null;
  /** Indicateur de chargement des tendances */
  trendsLoading: boolean;
  /** Erreur lors du chargement des tendances */
  trendsError: string | null;

  /** Sparklines pour les graphiques du dashboard */
  sparklines: DocumentsSparklineData | null;
  /** Indicateur de chargement des sparklines */
  sparklinesLoading: boolean;
  /** Erreur lors du chargement des sparklines */
  sparklinesError: string | null;

  /** Cache des documents par candidat (Map<candidatId, Document[]>) */
  documentsByCandidatCache: Map<number, Document[]>;
  /** Indicateur de chargement des documents par candidat */
  documentsByCandidatLoading: boolean;
  /** Erreur lors du chargement des documents par candidat */
  documentsByCandidatError: string | null;
}

interface DocumentsActions {
  /**
   * Récupère la liste paginée des documents avec filtres.
   * @param params - Pagination et filtres (page, limit, type, candidatId, period, search)
   * @returns Réponse paginée
   */
  getAll: (params?: DocumentsListParams) => Promise<DocumentsPaginatedResponse>;

  /**
   * Récupère un document par son identifiant.
   * @param id - Identifiant du document
   * @returns Document complet (sans le candidat par défaut)
   */
  getById: (id: number) => Promise<Document>;

  /**
   * Récupère les statistiques agrégées des documents.
   * @returns Métriques statistiques
   */
  getStats: () => Promise<DocumentsStats>;

  /**
   * Récupère les tendances évolutives des documents.
   * @returns Variations en pourcentage
   */
  getTrends: () => Promise<DocumentsTrends>;

  /**
   * Récupère les données des sparklines pour les 12 derniers mois.
   * @returns Séries mensuelles (total, taille, etc.)
   */
  getSparklines: () => Promise<DocumentsSparklineData>;

  /**
   * Supprime définitivement un document (fichier + entrée base de données).
   * @param id - Identifiant du document
   * @returns Résultat de l’opération
   */
  delete: (id: number) => Promise<{ success: boolean; message: string }>;

  /**
   * Télécharge le fichier (déclenche le dialogue d’enregistrement).
   * @param id - Identifiant du document
   * @returns Résultat de l’opération
   */
  download: (id: number) => Promise<{ success: boolean; message: string }>;

  /**
   * Ouvre le document avec l’application par défaut du système.
   * @param chemin - Chemin absolu ou relatif du fichier
   */
  open: (chemin: string) => Promise<void>;

  /**
   * Téléverse un nouveau document.
   * @param data - Données du document (buffer, candidatId, type, etc.)
   * @returns Document créé
   */
  upload: (data: {
    candidatId: number;
    type: string;
    buffer: ArrayBuffer;
    originalName: string;
    mimeType?: string;
    description?: string;
  }) => Promise<Document>;

  /**
   * Récupère tous les documents d’un candidat (avec cache).
   * @param candidatId - Identifiant du candidat
   * @returns Liste des documents
   */
  getByCandidat: (candidatId: number) => Promise<Document[]>;

  /** Efface toutes les erreurs du store */
  clearErrors: () => void;

  /** Réinitialise le document courant (ferme la vue détail) */
  resetCurrentDocument: () => void;

  /** Vide le cache des documents par candidat */
  clearCaches: () => void;
}

type DocumentsStore = DocumentsState & DocumentsActions;

// ===============================
// ÉTAT INITIAL
// ===============================

const initialState: DocumentsState = {
  documents: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  loading: false,
  error: null,

  currentDocument: null,
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

  documentsByCandidatCache: new Map(),
  documentsByCandidatLoading: false,
  documentsByCandidatError: null,
};

// ===============================
// STORE PRINCIPAL
// ===============================

export const useDocumentsStore = create<DocumentsStore>()((set, get) => ({
  ...initialState,

  // ===============================
  // OPÉRATIONS PRINCIPALES
  // ===============================

  /**
   * Récupère la liste paginée des documents avec filtres optionnels.
   * Valide les paramètres via `documentsListSchema`.
   */
  getAll: async (params = {}) => {
    const validation = safeValidate(documentsListSchema, params);
    if (!validation.success) {
      const message = formatErrorMessage(validation.error, 'Paramètres de liste invalides');
      set({ error: message });
      throw new Error(message);
    }

    set({ loading: true, error: null });
    try {
      const response = await window.api.documents.getAll(validation.data);
      set({
        documents: response.documents,
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
      const message = formatErrorMessage(error, 'Erreur lors du chargement des documents');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  /**
   * Récupère un document par son identifiant.
   */
  getById: async (id) => {
    if (!id || isNaN(id)) {
      throw new Error('Identifiant document invalide');
    }
    set({ detailLoading: true, detailError: null });
    try {
      const document = await window.api.documents.getById(id);
      set({ currentDocument: document, detailLoading: false });
      return document;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors du chargement du document');
      set({ detailLoading: false, detailError: message });
      throw new Error(message);
    }
  },

  /**
   * Récupère les statistiques agrégées.
   */
  getStats: async () => {
    set({ statsLoading: true, statsError: null });
    try {
      const stats = await window.api.documents.getStats();
      set({ stats, statsLoading: false });
      return stats;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors du chargement des statistiques');
      set({ statsLoading: false, statsError: message });
      throw new Error(message);
    }
  },

  /**
   * Récupère les tendances évolutives.
   */
  getTrends: async () => {
    set({ trendsLoading: true, trendsError: null });
    try {
      const trends = await window.api.documents.getTrends();
      set({ trends, trendsLoading: false });
      return trends;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors du chargement des tendances');
      set({ trendsLoading: false, trendsError: message });
      throw new Error(message);
    }
  },

  /**
   * Récupère les données des sparklines (12 mois).
   */
  getSparklines: async () => {
    set({ sparklinesLoading: true, sparklinesError: null });
    try {
      const sparklines = await window.api.documents.getSparklines();
      set({ sparklines, sparklinesLoading: false });
      return sparklines;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors du chargement des sparklines');
      set({ sparklinesLoading: false, sparklinesError: message });
      throw new Error(message);
    }
  },

  /**
   * Supprime définitivement un document.
   */
  delete: async (id) => {
    const validated = validateOrThrow(deleteDocumentSchema, { id });
    set({ loading: true, error: null });
    try {
      const result = await window.api.documents.delete(validated.id);
      // Invalider le cache du candidat concerné (si connu)
      const { currentDocument, documentsByCandidatCache } = get();
      if (currentDocument?.candidatId) {
        documentsByCandidatCache.delete(currentDocument.candidatId);
        set({ documentsByCandidatCache: new Map(documentsByCandidatCache) });
      }
      // Recharger la liste courante
      await get().getAll({ page: get().pagination.page, limit: get().pagination.limit });
      if (currentDocument?.id === validated.id) {
        set({ currentDocument: null });
      }
      set({ loading: false });
      return result;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors de la suppression');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  /**
   * Télécharge le fichier (dialogue d’enregistrement).
   */
  download: async (id) => {
    const validated = validateOrThrow(deleteDocumentSchema, { id });
    set({ loading: true, error: null });
    try {
      const result = await window.api.documents.download(validated.id);
      set({ loading: false });
      return result;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors du téléchargement');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  /**
   * Ouvre le document avec l’application par défaut.
   */
  open: async (chemin) => {
    if (!chemin) throw new Error('Chemin du document manquant');
    try {
      await window.api.documents.open(chemin);
    } catch (error) {
      const message = formatErrorMessage(error, 'Impossible d’ouvrir le document');
      throw new Error(message);
    }
  },

  /**
   * Téléverse un nouveau document (upload).
   */
  upload: async (data) => {
    // Validation minimale des données d’entrée (sans Zod complet, car c’est un appel API direct)
    if (!data.candidatId || !data.type || !data.buffer || !data.originalName) {
      throw new Error('Données de téléversement incomplètes');
    }
    set({ loading: true, error: null });
    try {
      const newDocument = await window.api.documents.upload(data);
      // Invalider le cache du candidat
      const { documentsByCandidatCache } = get();
      documentsByCandidatCache.delete(data.candidatId);
      set({ documentsByCandidatCache: new Map(documentsByCandidatCache) });
      // Recharger la liste courante
      await get().getAll({ page: get().pagination.page, limit: get().pagination.limit });
      set({ loading: false });
      return newDocument;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors du téléversement');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  /**
   * Récupère tous les documents d’un candidat (avec cache).
   */
  getByCandidat: async (candidatId) => {
    if (!candidatId || isNaN(candidatId)) {
      throw new Error('Identifiant candidat invalide');
    }
    const cache = get().documentsByCandidatCache;
    if (cache.has(candidatId)) {
      return cache.get(candidatId)!;
    }
    set({ documentsByCandidatLoading: true, documentsByCandidatError: null });
    try {
      // Note : l'API window.api.documents pourrait ne pas avoir de méthode getByCandidat.
      // Dans ce cas, on utilise getAll avec le filtre candidatId.
      const response = await window.api.documents.getAll({ candidatId, limit: 1000 });
      const documents = response.documents;
      set((state) => ({
        documentsByCandidatCache: new Map(state.documentsByCandidatCache).set(
          candidatId,
          documents
        ),
        documentsByCandidatLoading: false,
      }));
      return documents;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur chargement des documents du candidat');
      set({ documentsByCandidatLoading: false, documentsByCandidatError: message });
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
      documentsByCandidatError: null,
    });
  },

  resetCurrentDocument: () => {
    set({ currentDocument: null, detailError: null, detailLoading: false });
  },

  clearCaches: () => {
    set({ documentsByCandidatCache: new Map() });
  },
}));
