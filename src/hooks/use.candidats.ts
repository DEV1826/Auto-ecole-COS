// /home/stive-junior/Auto-ecole-COS/src/hooks/use.candidats.ts

/**
 * Hook personnalisé pour la gestion des candidats (élèves)
 *
 * @module useCandidats
 * @description
 * Fournit un accès simplifié au store Zustand des candidats.
 * Expose l'état (liste paginée, candidat courant, statistiques, relations)
 * et toutes les actions (CRUD, recherche, gestion des documents, etc.).
 *
 * @example
 * ```tsx
 * const { candidats, loading, getAll, create, delete } = useCandidats();
 *
 * useEffect(() => {
 *   getAll({ page: 1, limit: 10 });
 * }, []);
 *
 * const handleCreate = async (data) => {
 *   await create(data);
 * };
 * ```
 *
 * @author Stive Junior
 * @version 1.0.0
 */

import { useCandidatsStore } from '@/store/candidats.store';
import type {
  Candidat,
  CandidatsStatsExtended,
  CandidatsPaginatedResponse,
  CandidatsListParams,
  UpdateCandidatStatusParams,
  CandidatDocumentInput,
  CandidatsTrends,
} from '@/types/candidats.types';
import type { Paiement } from '@/types/paiements.types';
import type { Lecon } from '@/types/planning.types';
import type { Examen } from '@/types/examens.types';
import type { Facture } from '@/types/factures.types';
import type { Document } from '@/types/documents.types';

// ===============================
// INTERFACE DE RETOUR DU HOOK
// ===============================

/**
 * Interface décrivant toutes les propriétés et méthodes retournées par `useCandidats`
 */
export interface UseCandidats {
  // ===== ÉTAT DE LA LISTE PAGINÉE =====
  /** Liste des candidats de la page courante */
  candidats: Candidat[];
  /** Pagination (page, limit, total, totalPages) */
  pagination: { page: number; limit: number; total: number; totalPages: number };
  /** Indicateur de chargement de la liste */
  loading: boolean;
  /** Erreur lors du chargement de la liste */
  error: string | null;

  // ===== CANDIDAT DÉTAILLÉ =====
  /** Candidat actuellement consulté (avec toutes ses relations) */
  currentCandidat: Candidat | null;
  /** Indicateur de chargement du détail */
  detailLoading: boolean;
  /** Erreur lors du chargement du détail */
  detailError: string | null;

  // ===== STATISTIQUES =====
  /** Statistiques agrégées des candidats (étendues) */
  stats: CandidatsStatsExtended | null;
  /** Indicateur de chargement des statistiques */
  statsLoading: boolean;
  /** Erreur lors du chargement des statistiques */
  statsError: string | null;

  trends: CandidatsTrends | null;
  trendsLoading: boolean;
  trendsError: string | null;

  // ===== RECHERCHE RAPIDE =====
  /** Résultats de la dernière recherche */
  searchResults: Candidat[];
  /** Indicateur de chargement de la recherche */
  searchLoading: boolean;
  /** Erreur lors de la recherche */
  searchError: string | null;

  // ===== RELATIONS : PAIEMENTS =====
  /** Liste des paiements du candidat sélectionné */
  paiements: Paiement[];
  /** Indicateur de chargement des paiements */
  paiementsLoading: boolean;
  /** Erreur lors du chargement des paiements */
  paiementsError: string | null;

  // ===== RELATIONS : LEÇONS =====
  /** Liste des leçons du candidat sélectionné */
  lecons: Lecon[];
  /** Indicateur de chargement des leçons */
  leconsLoading: boolean;
  /** Erreur lors du chargement des leçons */
  leconsError: string | null;

  // ===== RELATIONS : EXAMENS =====
  /** Liste des examens du candidat sélectionné */
  examens: Examen[];
  /** Indicateur de chargement des examens */
  examensLoading: boolean;
  /** Erreur lors du chargement des examens */
  examensError: string | null;

  // ===== RELATIONS : FACTURES =====
  /** Liste des factures du candidat sélectionné */
  factures: Facture[];
  /** Indicateur de chargement des factures */
  facturesLoading: boolean;
  /** Erreur lors du chargement des factures */
  facturesError: string | null;

  // ===== RELATIONS : DOCUMENTS =====
  /** Liste des documents du candidat sélectionné */
  documents: Document[];
  /** Indicateur de chargement des documents */
  documentsLoading: boolean;
  /** Erreur lors du chargement des documents */
  documentsError: string | null;

  // ===== OPÉRATIONS CRUD PRINCIPALES =====
  /**
   * Récupère la liste paginée des candidats avec filtres optionnels.
   * @param params - Pagination et filtres (page, limit, search, statut, categorie, dateDebut, dateFin)
   */
  getAll: (params?: CandidatsListParams) => Promise<CandidatsPaginatedResponse>;
  /**
   * Récupère un candidat par son ID avec toutes ses relations.
   * @param id - Identifiant du candidat
   */
  getById: (id: number) => Promise<Candidat>;
  /**
   * Crée un nouveau candidat.
   * @param data - Données du candidat (conformes au schéma)
   */
  create: (data: unknown) => Promise<Candidat>;
  /**
   * Met à jour un candidat existant (patch partiel).
   * @param id - Identifiant du candidat
   * @param data - Champs à mettre à jour
   */
  update: (id: number, data: unknown) => Promise<Candidat>;
  /**
   * Supprime logiquement (soft delete) un candidat.
   * @param id - Identifiant du candidat
   */
  delete: (id: number) => Promise<{ success: boolean; message: string }>;
  /**
   * Recherche rapide de candidats par nom, prénom, email ou numéro de permis.
   * @param query - Terme de recherche (min 2 caractères)
   */
  search: (query: string) => Promise<Candidat[]>;
  /**
   * Met à jour le statut d’un candidat.
   * @param params - { id, statut }
   */
  updateStatus: (params: UpdateCandidatStatusParams) => Promise<Candidat>;
  /**
   * Récupère les statistiques étendues des candidats.
   */
  getStats: () => Promise<CandidatsStatsExtended>;

  /**
   *
   * @returns
   */
  getTrends: () => Promise<CandidatsTrends>;

  // ===== ACTIONS SUR LES RELATIONS =====
  /** Récupère tous les paiements d’un candidat */
  getPaiements: (candidatId: number) => Promise<Paiement[]>;
  /** Récupère toutes les leçons d’un candidat */
  getLecons: (candidatId: number) => Promise<Lecon[]>;
  /** Récupère tous les examens d’un candidat */
  getExamens: (candidatId: number) => Promise<Examen[]>;
  /** Récupère toutes les factures d’un candidat */
  getFactures: (candidatId: number) => Promise<Facture[]>;
  /** Récupère tous les documents d’un candidat */
  getDocuments: (candidatId: number) => Promise<Document[]>;

  // ===== GESTION DES DOCUMENTS =====
  /** Ajoute un document à un candidat */
  addDocument: (data: CandidatDocumentInput) => Promise<Document>;
  /** Supprime définitivement un document */
  deleteDocument: (docId: number) => Promise<{ success: boolean; message: string }>;

  // ===== UTILITAIRES =====
  /** Efface toutes les erreurs du store */
  clearErrors: () => void;
  /** Réinitialise le candidat courant (ferme la vue détail) */
  resetCurrentCandidat: () => void;
  /** Réinitialise les résultats de recherche */
  resetSearch: () => void;

  // ===== PROPRIÉTÉS DÉRIVÉES (convenience) =====
  /** Premier candidat de la liste courante (utile pour certaines vues) */
  firstCandidat: Candidat | null;
  /** Nombre total de candidats */
  totalCandidats: number;
  /** Indique si une opération est en cours (loading global) */
  isBusy: boolean;
}

// ===============================
// HOOK PRINCIPAL
// ===============================

/**
 * Hook d’accès complet à la gestion des candidats.
 *
 * @returns {UseCandidats} Toutes les propriétés et actions du store candidats
 */
export const useCandidats = (): UseCandidats => {
  const store = useCandidatsStore();

  // Propriétés dérivées
  const firstCandidat = store.candidats.length > 0 ? store.candidats[0] : null;
  const totalCandidats = store.pagination.total;
  const isBusy =
    store.loading ||
    store.detailLoading ||
    store.statsLoading ||
    store.searchLoading ||
    store.paiementsLoading ||
    store.leconsLoading ||
    store.examensLoading ||
    store.facturesLoading ||
    store.documentsLoading;

  return {
    // État liste
    candidats: store.candidats,
    pagination: store.pagination,
    loading: store.loading,
    error: store.error,

    // Détail
    currentCandidat: store.currentCandidat,
    detailLoading: store.detailLoading,
    detailError: store.detailError,

    // Statistiques
    stats: store.stats,
    statsLoading: store.statsLoading,
    statsError: store.statsError,

    trends: store.trends,
    trendsLoading: store.trendsLoading,
    trendsError: store.trendsError,

    // Recherche
    searchResults: store.searchResults,
    searchLoading: store.searchLoading,
    searchError: store.searchError,

    // Paiements
    paiements: store.paiements,
    paiementsLoading: store.paiementsLoading,
    paiementsError: store.paiementsError,

    // Leçons
    lecons: store.lecons,
    leconsLoading: store.leconsLoading,
    leconsError: store.leconsError,

    // Examens
    examens: store.examens,
    examensLoading: store.examensLoading,
    examensError: store.examensError,

    // Factures
    factures: store.factures,
    facturesLoading: store.facturesLoading,
    facturesError: store.facturesError,

    // Documents
    documents: store.documents,
    documentsLoading: store.documentsLoading,
    documentsError: store.documentsError,

    // Actions CRUD
    getAll: store.getAll,
    getById: store.getById,
    create: store.create,
    update: store.update,
    delete: store.delete,
    search: store.search,
    updateStatus: store.updateStatus,
    getStats: store.getStats,
    getTrends: store.getTrends,

    // Actions relations
    getPaiements: store.getPaiements,
    getLecons: store.getLecons,
    getExamens: store.getExamens,
    getFactures: store.getFactures,
    getDocuments: store.getDocuments,

    // Gestion documents
    addDocument: store.addDocument,
    deleteDocument: store.deleteDocument,

    // Utilitaires
    clearErrors: store.clearErrors,
    resetCurrentCandidat: store.resetCurrentCandidat,
    resetSearch: store.resetSearch,

    // Dérivées
    firstCandidat,
    totalCandidats,
    isBusy,
  };
};
