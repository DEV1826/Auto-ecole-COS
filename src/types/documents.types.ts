// src/types/documents.types.ts (version enrichie)

/**
 * @module types/documents.types
 * @description
 * Types complets pour la gestion des documents dans l’auto‑école COS.
 *
 * Ce module exporte :
 * - `Document` : le modèle principal (avec relations optionnelles)
 * - `DocumentsStats` : métriques agrégées pour les tableaux de bord
 * - `DocumentsTrends` : évolutions temporelles pour les cartes de statistiques
 * - `DocumentsColumnConfig` : contrôle de visibilité des colonnes dans les tableaux
 * - `DocumentsTableActions` : callbacks d’actions sur les lignes
 * - `DocumentsColumnsOptions` : options complètes pour la génération des colonnes
 * - `DocumentsEnrichments` : données calculées injectées (candidat, etc.)
 *
 * Ces types sont utilisés dans les composants `StatsCard`, `DataTable`,
 * `CandidatDetail`, `AdminDashboard`, etc.
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @see {@link Candidat} – Candidat propriétaire du document
 */

import type { Candidat } from '@/types/candidats.types';

// ============================================================
// MODÈLE PRINCIPAL
// ============================================================

/**
 * Document – correspond au modèle Prisma `Document`.
 *
 * @interface Document
 * @description
 * Un document représente un fichier scanné ou téléversé, associé à un candidat.
 * Les types possibles incluent : "permis", "carte_identite", "facture", "recu".
 * Le fichier est stocké physiquement sur le disque (chemin relatif ou absolu).
 * La taille et le type MIME sont facultatifs mais recommandés pour l’affichage.
 *
 * @property {number} id - Identifiant unique (auto-incrémenté)
 * @property {number} candidatId - Identifiant du candidat propriétaire du document
 * @property {string} type - Nature du document (ex: "permis", "carte_identite", "facture", "recu")
 * @property {string} nomFichier - Nom original du fichier (avec extension)
 * @property {string} chemin - Chemin d’accès au fichier (local ou serveur)
 * @property {number | null} [taille] - Taille du fichier en octets (optionnel)
 * @property {string | null} [mimeType] - Type MIME du fichier (ex: "application/pdf", "image/jpeg")
 * @property {Date | string} uploadedAt - Date et heure de téléversement (ISO 8601)
 *
 * // Relations (optionnelle, chargée selon les besoins)
 * @property {Candidat} [candidat] - Candidat associé (peut être chargé en détail)
 *
 * @example
 * ```ts
 * const document: Document = {
 *   id: 1,
 *   candidatId: 42,
 *   type: 'permis',
 *   nomFichier: 'permis_dupont_jean.pdf',
 *   chemin: '/uploads/documents/permis_dupont_jean.pdf',
 *   taille: 1250000,
 *   mimeType: 'application/pdf',
 *   uploadedAt: '2024-03-15T14:30:00Z',
 * };
 * ```
 */
export interface Document {
  id: number;
  candidatId: number;
  type: string; // "permis", "carte_identite", "facture", "recu"
  nomFichier: string;
  chemin: string;
  taille?: number | null;
  mimeType?: string | null;
  uploadedAt: Date | string;

  // Relation (optionnelle)
  candidat?: Candidat;
}

// ============================================================
// STATISTIQUES POUR LE DASHBOARD
// ============================================================

/**
 * Métriques statistiques agrégées pour les documents.
 * Utilisé dans les composants de cartes statistiques (`StatsCard`, `AdminStatsCards`, etc.)
 *
 * @interface DocumentsStats
 * @description Regroupe les indicateurs clés relatifs aux documents téléversés.
 *
 * @property {number} totalDocuments - Nombre total de documents stockés (tous types)
 * @property {number} totalTailleBytes - Taille totale cumulée des documents (en octets)
 * @property {number} documentsPermis - Nombre de documents de type "permis"
 * @property {number} documentsCarteIdentite - Nombre de pièces d’identité ("carte_identite")
 * @property {number} documentsFacture - Nombre de factures téléversées
 * @property {number} documentsRecu - Nombre de reçus téléversés
 *
 * @example
 * ```ts
 * const stats: DocumentsStats = {
 *   totalDocuments: 142,
 *   totalTailleBytes: 125000000,
 *   documentsPermis: 45,
 *   documentsCarteIdentite: 38,
 *   documentsFacture: 32,
 *   documentsRecu: 27,
 * };
 * ```
 */
export interface DocumentsStats {
  totalDocuments: number;
  totalTailleBytes: number;
  documentsCarteIdentite: number;
  documentsRecu: number;
}

/**
 * Tendances évolutives des indicateurs documents.
 * Permet d’afficher les variations (par exemple « +12 % ce mois ») dans les cartes.
 *
 * @interface DocumentsTrends
 * @property {number} totalDocuments - Variation du nombre total (en pourcentage ou valeur absolue)
 * @property {number} totalTailleBytes - Variation de la taille cumulée
 * @property {number} documentsPermis - Variation des permis
 * @property {number} documentsCarteIdentite - Variation des cartes d’identité
 * @property {number} documentsFacture - Variation des factures
 * @property {number} documentsRecu - Variation des reçus
 *
 * @example
 * ```ts
 * const trends: DocumentsTrends = {
 *   totalDocuments: 8.2,
 *   totalTailleBytes: 12.5,
 *   documentsPermis: 5,
 *   documentsCarteIdentite: 3,
 *   documentsFacture: 10,
 *   documentsRecu: -2,
 * };
 * ```
 */
export interface DocumentsTrends {
  totalDocuments: number;
  totalTailleBytes: number;
  documentsCarteIdentite: number;
  documentsRecu: number;
}

// ============================================================
// CONFIGURATION DES COLONNES DU TABLEAU DES DOCUMENTS
// ============================================================

/**
 * Configuration de visibilité des colonnes dans le tableau des documents.
 * Permet d’adapter dynamiquement l’interface selon le rôle de l’utilisateur
 * (admin, secrétaire, candidat) ou selon les préférences personnelles.
 *
 * @interface DocumentsColumnConfig
 * @property {boolean} [showNomFichier] - Afficher le nom du fichier (défaut : true)
 * @property {boolean} [showType] - Afficher le type de document (badge) (défaut : true)
 * @property {boolean} [showTaille] - Afficher la taille formatée (Ko/Mo) (défaut : false)
 * @property {boolean} [showUploadedAt] - Afficher la date de téléversement (défaut : true)
 * @property {boolean} [showCandidat] - Afficher le nom du candidat (défaut : vrai pour admin/secrétaire)
 * @property {boolean} [showActions] - Afficher le menu d’actions (télécharger, supprimer, etc.) (défaut : true)
 *
 * @example
 * ```ts
 * const config: DocumentsColumnConfig = {
 *   showNomFichier: true,
 *   showType: true,
 *   showTaille: true,
 *   showUploadedAt: true,
 *   showCandidat: true,
 *   showActions: true,
 * };
 * ```
 */
export interface DocumentsColumnConfig {
  showNomFichier?: boolean;
  showType?: boolean;
  showTaille?: boolean;
  showUploadedAt?: boolean;
  showCandidat?: boolean;
  showActions?: boolean;
}

/**
 * Callbacks d’actions sur une ligne du tableau des documents.
 * Ces fonctions sont appelées lorsque l’utilisateur clique sur un bouton d’action
 * (voir, télécharger, supprimer, imprimer) ou sur un élément du menu contextuel.
 *
 * @interface DocumentsTableActions
 * @property {(document: Document) => void} [onView] - Afficher l’aperçu / ouvrir le document dans une nouvelle fenêtre
 * @property {(document: Document) => void} [onDownload] - Télécharger le fichier localement
 * @property {(document: Document) => Promise<void>} [onDelete] - Supprimer définitivement le document (avec confirmation)
 * @property {(document: Document) => void} [onPrint] - Imprimer le document (si imprimable)
 *
 * @example
 * ```ts
 * const actions: DocumentsTableActions = {
 *   onView: (doc) => window.open(doc.chemin),
 *   onDownload: (doc) => downloadFile(doc.chemin),
 *   onDelete: async (doc) => await deleteDocument(doc.id),
 *   onPrint: (doc) => window.print(),
 * };
 * ```
 */
export interface DocumentsTableActions {
  onView?: (document: Document) => void;
  onDownload?: (document: Document) => void;
  onDelete?: (document: Document) => Promise<void>;
  onPrint?: (document: Document) => void;
}

/**
 * Enrichissements optionnels pour injecter des données calculées du candidat
 * sans modifier le modèle principal `Document`.
 *
 * @interface DocumentsEnrichments
 * @property {(document: Document) => string} [getCandidatNomComplet] - Nom complet du candidat (prenom + nom)
 * @property {(document: Document) => string} [getCandidatEmail] - Email du candidat
 * @property {(document: Document) => string} [getCandidatTelephone] - Téléphone du candidat
 * @property {(document: Document) => string} [getCandidatAvatarUrl] - URL de l’avatar du candidat
 * @property {(document: Document) => string} [getCandidatInitials] - Initiales du candidat (pour fallback avatar)
 *
 * @example
 * ```ts
 * const enrichments: DocumentsEnrichments = {
 *   getCandidatNomComplet: (doc) => `${doc.candidat?.prenom} ${doc.candidat?.nom}`,
 *   getCandidatEmail: (doc) => doc.candidat?.email ?? '',
 *   getCandidatTelephone: (doc) => doc.candidat?.telephone ?? '',
 *   getCandidatAvatarUrl: (doc) => doc.candidat?.avatarUrl,
 *   getCandidatInitials: (doc) => `${doc.candidat?.prenom?.[0]}${doc.candidat?.nom?.[0]}`,
 * };
 * ```
 */
export interface DocumentsEnrichments {
  getCandidatNomComplet?: (doc: Document) => string;
  getCandidatEmail?: (doc: Document) => string;
  getCandidatTelephone?: (doc: Document) => string;
  getCandidatAvatarUrl?: (doc: Document) => string;
  getCandidatInitials?: (doc: Document) => string;
}

/**
 * Options complètes pour la génération des colonnes du tableau des documents.
 * Utilisé par la fonction `getDocumentsColumns` pour construire dynamiquement
 * les colonnes en fonction du rôle de l’utilisateur et des personnalisations.
 *
 * @interface DocumentsColumnsOptions
 *  * @property {DocumentsColumnConfig} [columnConfig] - Surcharge de la visibilité des colonnes
 * @property {DocumentsTableActions} [actions] - Callbacks d’actions sur les lignes
 * @property {DocumentsEnrichments} [enrichments] - Données calculées
 * @property {'admin' | 'secretaire' | 'candidat'} [variant] - Profil utilisateur
 *   - `admin` : affiche toutes les colonnes (nom, type, taille, upload, candidat, actions)
 *   - `secretaire` : colonnes adaptées à la gestion quotidienne (nom, type, candidat, actions)
 *   - `candidat` : vue restreinte (nom, type, date, actions limitées à télécharger)
 *
 * @example
 * ```ts
 * const options: DocumentsColumnsOptions = {
 *   variant: 'secretaire',
 *   columnConfig: { showTaille: true },
 *   actions: { onDownload: (doc) => console.log('download', doc) },
 * };
 * const columns = getDocumentsColumns(options);
 * ```
 */
export interface DocumentsColumnsOptions {
  columnConfig?: DocumentsColumnConfig;
  actions?: DocumentsTableActions;
  enrichments?: DocumentsEnrichments;
  variant?: 'admin' | 'secretaire' | 'candidat';
}

// ============================================================
// PARAMÈTRES ET RÉPONSES POUR L'API
// ============================================================

/**
 * Paramètres pour la liste paginée des documents.
 */
export interface DocumentsListParams {
  /** Page courante (1-indexed) */
  page?: number;
  /** Nombre d'éléments par page */
  limit?: number;
  /** Type de document (permis, carte_identite, facture, recu) */
  type?: string;
  /** ID du candidat (pour filtrer par candidat) */
  candidatId?: number;
  /** Période de filtre ('today', 'week', 'month', 'all') */
  period?: 'today' | 'week' | 'month' | 'all';
  /** Terme de recherche (nomFichier ou nom candidat) */
  search?: string;
}

/**
 * Réponse paginée pour la liste des documents.
 */
export interface DocumentsPaginatedResponse {
  documents: Document[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Données des sparklines pour le dashboard documents.
 */
export interface DocumentsSparklineData {
  totalSparkline: { values: number[]; labels?: string[] };
  carteIdentiteSparkline: { values: number[]; labels?: string[] };
  recusSparkline: { values: number[]; labels?: string[] };
  tailleSparkline: { values: number[]; labels?: string[] };
}

// ============================================================
// API WINDOW (exposée par le preload Electron)
// ============================================================

/**
 * Interface de l’API documents exposée au renderer via `window.api.documents`.
 */
export interface DocumentsApi {
  /**
   * Récupère la liste paginée des documents avec filtres.
   */
  getAll: (params?: DocumentsListParams) => Promise<DocumentsPaginatedResponse>;

  /**
   * Récupère un document par son ID.
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
   * Récupère les données des sparklines (évolutions sur 12 mois).
   */
  getSparklines: () => Promise<DocumentsSparklineData>;

  /**
   * Supprime définitivement un document.
   */
  delete: (id: number) => Promise<{ success: boolean; message: string }>;

  /**
   * Télécharge le fichier (déclenche le dialogue d’enregistrement).
   */
  download: (id: number) => Promise<{ success: boolean; message: string }>;

  /**
   * Ouvre le document avec l’application par défaut du système.
   */
  open: (chemin: string) => Promise<void>;

  /**
   * Televerser un document
   */
  upload: (data: {
    candidatId: number;
    type: string;
    buffer: ArrayBuffer;
    originalName: string;
    mimeType?: string;
    description?: string;
  }) => Promise<Document>;
}
