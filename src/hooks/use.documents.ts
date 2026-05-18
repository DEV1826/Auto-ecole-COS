// src/hooks/use.documents.ts

/**
 * Hook personnalisé pour la gestion des documents
 *
 * @module useDocuments
 * @description
 * Fournit un accès simplifié au store Zustand des documents.
 * Expose l’état (liste paginée, document détaillé, statistiques, tendances,
 * sparklines, documents par candidat) et toutes les actions
 * (CRUD, téléchargement, ouverture, téléversement, gestion des caches).
 *
 * @example
 * ```tsx
 * const { documents, loading, getAll, upload, delete } = useDocuments();
 *
 * useEffect(() => {
 *   getAll({ page: 1, limit: 10 });
 * }, []);
 *
 * const handleUpload = async (file, candidatId) => {
 *   const buffer = await file.arrayBuffer();
 *   await upload({ candidatId, type: 'permis', buffer, originalName: file.name });
 * };
 * ```
 *
 * @author Stive Junior
 * @version 1.0.0
 */

import { useDocumentsStore } from '@/store/documents.store';
import type {
  Document,
  DocumentsStats,
  DocumentsTrends,
  DocumentsPaginatedResponse,
  DocumentsListParams,
  DocumentsSparklineData,
} from '@/types/documents.types';

// ===============================
// INTERFACE DE RETOUR DU HOOK
// ===============================

/**
 * Interface décrivant toutes les propriétés et méthodes retournées par `useDocuments`
 */
export interface UseDocuments {
  // ===== ÉTAT DE LA LISTE PAGINÉE =====
  /** Liste des documents de la page courante */
  documents: Document[];
  /** Pagination (page, limit, total, totalPages) */
  pagination: { page: number; limit: number; total: number; totalPages: number };
  /** Indicateur de chargement de la liste */
  loading: boolean;
  /** Erreur lors du chargement de la liste */
  error: string | null;

  // ===== DOCUMENT DÉTAILLÉ =====
  /** Document actuellement consulté */
  currentDocument: Document | null;
  /** Indicateur de chargement du détail */
  detailLoading: boolean;
  /** Erreur lors du chargement du détail */
  detailError: string | null;

  // ===== STATISTIQUES =====
  /** Métriques agrégées des documents */
  stats: DocumentsStats | null;
  /** Indicateur de chargement des statistiques */
  statsLoading: boolean;
  /** Erreur lors du chargement des statistiques */
  statsError: string | null;

  // ===== TENDANCES =====
  /** Tendances évolutives (mois vs précédent) */
  trends: DocumentsTrends | null;
  /** Indicateur de chargement des tendances */
  trendsLoading: boolean;
  /** Erreur lors du chargement des tendances */
  trendsError: string | null;

  // ===== SPARKLINES =====
  /** Données des sparklines (12 mois) */
  sparklines: DocumentsSparklineData | null;
  /** Indicateur de chargement des sparklines */
  sparklinesLoading: boolean;
  /** Erreur lors du chargement des sparklines */
  sparklinesError: string | null;

  // ===== DOCUMENTS PAR CANDIDAT =====
  documentsByCandidatLoading: boolean;
  documentsByCandidatError: string | null;

  // ===== OPÉRATIONS PRINCIPALES =====
  /**
   * Récupère la liste paginée des documents avec filtres optionnels.
   * @param params - Pagination et filtres (page, limit, type, candidatId, period, search)
   */
  getAll: (params?: DocumentsListParams) => Promise<DocumentsPaginatedResponse>;
  /**
   * Récupère un document par son ID.
   * @param id - Identifiant du document
   */
  getById: (id: number) => Promise<Document>;
  /**
   * Récupère les statistiques agrégées des documents.
   */
  getStats: () => Promise<DocumentsStats>;
  /**
   * Récupère les tendances évolutives.
   */
  getTrends: () => Promise<DocumentsTrends>;
  /**
   * Récupère les données des sparklines (12 mois).
   */
  getSparklines: () => Promise<DocumentsSparklineData>;
  /**
   * Supprime définitivement un document.
   * @param id - Identifiant du document
   */
  delete: (id: number) => Promise<{ success: boolean; message: string }>;
  /**
   * Télécharge le fichier (dialogue d’enregistrement).
   * @param id - Identifiant du document
   */
  download: (id: number) => Promise<{ success: boolean; message: string }>;
  /**
   * Ouvre le document avec l’application par défaut.
   * @param chemin - Chemin du fichier
   */
  open: (chemin: string) => Promise<void>;
  /**
   * Téléverse un nouveau document.
   * @param data - Données du document (buffer, candidatId, type, originalName, mimeType)
   */
  upload: (data: {
    candidatId: number;
    type: string;
    buffer: ArrayBuffer;
    originalName: string;
    mimeType?: string;
    description?: string;
  }) => Promise<Document>;

  // ===== RELATIONS & UTILITAIRES =====
  /** Récupère tous les documents d’un candidat (avec cache) */
  getByCandidat: (candidatId: number) => Promise<Document[]>;

  // ===== UTILITAIRES =====
  /** Efface toutes les erreurs du store */
  clearErrors: () => void;
  /** Réinitialise le document courant (ferme la vue détail) */
  resetCurrentDocument: () => void;
  /** Vide tous les caches (documents par candidat) */
  clearCaches: () => void;

  // ===== PROPRIÉTÉS DÉRIVÉES =====
  /** Premier document de la liste courante */
  firstDocument: Document | null;
  /** Nombre total de documents */
  totalDocuments: number;
  /** Indique si une opération est en cours (loading global) */
  isBusy: boolean;
}

// ===============================
// HOOK PRINCIPAL
// ===============================

/**
 * Hook d’accès complet à la gestion des documents.
 *
 * @returns {UseDocuments} Toutes les propriétés et actions du store documents
 */
export const useDocuments = (): UseDocuments => {
  const store = useDocumentsStore();

  // Propriétés dérivées
  const firstDocument = store.documents.length > 0 ? store.documents[0] : null;
  const totalDocuments = store.pagination.total;
  const isBusy =
    store.loading ||
    store.detailLoading ||
    store.statsLoading ||
    store.trendsLoading ||
    store.sparklinesLoading ||
    store.documentsByCandidatLoading;

  return {
    // État liste
    documents: store.documents,
    pagination: store.pagination,
    loading: store.loading,
    error: store.error,

    // Détail
    currentDocument: store.currentDocument,
    detailLoading: store.detailLoading,
    detailError: store.detailError,

    // Statistiques
    stats: store.stats,
    statsLoading: store.statsLoading,
    statsError: store.statsError,

    // Tendances
    trends: store.trends,
    trendsLoading: store.trendsLoading,
    trendsError: store.trendsError,

    // Sparklines
    sparklines: store.sparklines,
    sparklinesLoading: store.sparklinesLoading,
    sparklinesError: store.sparklinesError,

    // État des actions spécifiques
    documentsByCandidatLoading: store.documentsByCandidatLoading,
    documentsByCandidatError: store.documentsByCandidatError,

    // Actions CRUD
    getAll: store.getAll,
    getById: store.getById,
    getStats: store.getStats,
    getTrends: store.getTrends,
    getSparklines: store.getSparklines,
    delete: store.delete,
    download: store.download,
    open: store.open,
    upload: store.upload,

    // Relations & utilitaires
    getByCandidat: store.getByCandidat,

    // Utilitaires
    clearErrors: store.clearErrors,
    resetCurrentDocument: store.resetCurrentDocument,
    clearCaches: store.clearCaches,

    // Dérivées
    firstDocument,
    totalDocuments,
    isBusy,
  };
};
