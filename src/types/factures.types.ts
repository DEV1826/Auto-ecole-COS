// src/types/factures.types.ts

/**
 * @module types/factures.types
 * @description
 * Types complets pour la gestion des factures dans l’auto‑école COS.
 *
 * Ce module exporte :
 * - `Facture` : le modèle principal (avec relations)
 * - `FacturesStats` : métriques agrégées (montant total, impayées, etc.)
 * - `FacturesTrends` : évolutions temporelles
 * - `FacturesColumnConfig` : contrôle de visibilité des colonnes dans les tableaux
 * - `FacturesTableActions` : callbacks d’actions sur les lignes
 * - `FacturesColumnsOptions` : options complètes pour la génération des colonnes
 *
 * Ces types sont utilisés dans les composants `StatsCard`, `DataTable`,
 * `SecretaireStatsCards`, `AdminDashboard`, etc.
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @see {@link StatutFacture} – Énumération des statuts de facture
 * @see {@link Candidat} – Candidat destinataire
 * @see {@link Paiement} – Paiements associés
 */

import type { StatutFacture } from '@/types/enums';
import type { Candidat } from '@/types/candidats.types';
import type { Paiement } from '@/types/paiements.types';

// ============================================================
// MODÈLE PRINCIPAL
// ============================================================

/**
 * Facture – correspond au modèle Prisma `Facture`.
 *
 * @interface Facture
 * @description
 * Une facture est émise à l’inscription d’un candidat ou lors d’une prestation.
 * Elle peut être partiellement payée et comporte plusieurs paiements.
 * Le numéro de facture est unique.
 *
 * @property {number} id - Identifiant unique (auto-incrémenté)
 * @property {string} numero - Numéro unique de la facture (ex: "FAC-2024-001")
 * @property {number} montantTotal - Montant total de la facture (en FCFA)
 * @property {StatutFacture} statut - EN_ATTENTE, PARTIELLEMENT_PAYEE, PAYEE, ANNULEE
 * @property {Date | string} dateEmission - Date d’émission de la facture
 * @property {Date | string | null} [dateEcheance] - Date limite de paiement (optionnelle)
 * @property {string | null} [pdfPath] - Chemin du fichier PDF généré
 * @property {string | null} [notes] - Commentaires libres
 * @property {Date | string} createdAt - Horodatage de création
 * @property {number} candidatId - Identifiant du candidat destinataire
 *
 * // Relations (optionnelles, chargées selon les besoins)
 * @property {Candidat} [candidat] - Candidat associé
 * @property {Paiement[]} [paiements] - Liste des paiements effectués sur cette facture
 *
 * @example
 * ```ts
 * const facture: Facture = {
 *   id: 1,
 *   numero: 'FAC-2024-001',
 *   montantTotal: 250000,
 *   statut: 'PARTIELLEMENT_PAYEE',
 *   dateEmission: '2024-01-15T08:00:00Z',
 *   dateEcheance: '2024-02-15T23:59:59Z',
 *   pdfPath: '/factures/fac-2024-001.pdf',
 *   notes: 'Acompte de 100000 reçu',
 *   createdAt: '2024-01-15T08:00:00Z',
 *   candidatId: 42,
 * };
 * ```
 */
export interface Facture {
  id: number;
  numero: string;
  montantTotal: number;
  statut: StatutFacture;
  dateEmission: Date | string;
  dateEcheance?: Date | string | null;
  pdfPath?: string | null;
  notes?: string | null;
  createdAt: Date | string;
  candidatId: number;

  // Relations (optionnelles)
  candidat?: Candidat;
  paiements?: Paiement[];
}

// ============================================================
// STATISTIQUES POUR LE DASHBOARD
// ============================================================

/**
 * Métriques statistiques agrégées pour les factures.
 *
 * @interface FacturesStats
 * @description Indicateurs clés pour le suivi des factures.
 *
 * @property {number} totalFactures - Nombre total de factures émises
 * @property {number} montantTotal - Somme des montants de toutes les factures
 * @property {number} montantImpaye - Somme des montants impayés (factures non soldées)
 * @property {number} facturesPayees - Nombre de factures entièrement payées
 * @property {number} facturesImpayees - Nombre de factures en attente ou partiellement payées
 * @property {number} paiementsRecus - Somme des paiements reçus (toutes factures)
 *
 * @example
 * ```ts
 * const stats: FacturesStats = {
 *   totalFactures: 48,
 *   montantTotal: 4250000,
 *   montantImpaye: 1250000,
 *   facturesPayees: 32,
 *   facturesImpayees: 16,
 *   paiementsRecus: 3000000,
 * };
 * ```
 */
export interface FacturesStats {
  totalFactures: number;
  montantTotal: number;
  montantImpaye: number;
  facturesPayees: number;
  facturesImpayees: number;
  paiementsRecus: number;
}

/**
 * Tendances évolutives des indicateurs de factures.
 *
 * @interface FacturesTrends
 * @property {number} totalFactures - Variation (en pourcentage ou absolu)
 * @property {number} montantTotal - Variation
 * @property {number} montantImpaye - Variation
 * @property {number} paiementsRecus - Variation
 *
 * @example
 * ```ts
 * const trends: FacturesTrends = {
 *   totalFactures: 12,
 *   montantTotal: 15.3,
 *   montantImpaye: -8,
 *   paiementsRecus: 22,
 * };
 * ```
 */
export interface FacturesTrends {
  totalFactures: number;
  montantTotal: number;
  montantImpaye: number;
  paiementsRecus: number;
}

// ============================================================
// CONFIGURATION DES COLONNES DU TABLEAU DES FACTURES
// ============================================================

/**
 * Configuration de visibilité des colonnes dans le tableau des factures.
 *
 * @interface FacturesColumnConfig
 * @property {boolean} [showNumero] - Afficher le numéro de facture (défaut : true)
 * @property {boolean} [showCandidat] - Afficher le nom du candidat (défaut : true)
 * @property {boolean} [showMontant] - Afficher le montant total (défaut : true)
 * @property {boolean} [showStatut] - Afficher le badge de statut (défaut : true)
 * @property {boolean} [showDateEmission] - Afficher la date d’émission (défaut : true)
 * @property {boolean} [showDateEcheance] - Afficher la date d’échéance (défaut : false)
 * @property {boolean} [showMontantPaye] - Afficher le montant déjà payé (défaut : true)
 * @property {boolean} [showActions] - Afficher le menu d’actions (défaut : true)
 *
 * @example
 * ```ts
 * const config: FacturesColumnConfig = {
 *   showNumero: true,
 *   showCandidat: true,
 *   showMontant: true,
 *   showStatut: true,
 *   showDateEmission: true,
 *   showDateEcheance: true,
 *   showMontantPaye: true,
 *   showActions: true,
 * };
 * ```
 */
export interface FacturesColumnConfig {
  showNumero?: boolean;
  showCandidat?: boolean;
  showMontant?: boolean;
  showStatut?: boolean;
  showDateEmission?: boolean;
  showDateEcheance?: boolean;
  showMontantPaye?: boolean;
  showResteAPayer?: boolean;
  showActions?: boolean;
}

/**
 * Callbacks d’actions sur une ligne du tableau des factures.
 *
 * @interface FacturesTableActions
 * @property {(facture: Facture) => void} [onView] - Consulter le détail / PDF
 * @property {(facture: Facture) => void} [onEdit] - Modifier la facture (statut, notes)
 * @property {(facture: Facture) => Promise<void>} [onDelete] - Annuler / supprimer la facture
 * @property {(facture: Facture) => void} [onDownloadPDF] - Télécharger le PDF
 * @property {(facture: Facture) => void} [onAddPayment] - Enregistrer un paiement
 * @property {(facture: Facture) => void} [onViewPayments] - Voir l’historique des paiements
 *
 * @example
 * ```ts
 * const actions: FacturesTableActions = {
 *   onView: (f) => navigate(`/factures/${f.id}`),
 *   onDownloadPDF: (f) => download(f.pdfPath),
 *   onAddPayment: (f) => navigate(`/paiements/create?factureId=${f.id}`),
 * };
 * ```
 */
export interface FacturesTableActions {
  onView?: (facture: Facture) => void;
  onEdit?: (facture: Facture) => void;
  onDelete?: (facture: Facture) => Promise<void>;
  onDownloadPDF?: (facture: Facture) => void;
  onAddPayment?: (facture: Facture) => void;
  onViewPayments?: (facture: Facture) => void;
}

/**
 * Enrichissements optionnels pour injecter des données calculées du candidat
 * sans modifier le modèle principal `Facture`.
 *
 * @interface FacturesEnrichments
 * @property {(facture: Facture) => string} [getCandidatNomComplet] - Nom complet (prenom + nom)
 * @property {(facture: Facture) => string} [getCandidatEmail] - Email du candidat
 * @property {(facture: Facture) => string} [getCandidatTelephone] - Téléphone
 * @property {(facture: Facture) => string} [getCandidatAvatarUrl] - URL de l’avatar
 * @property {(facture: Facture) => string} [getCandidatInitials] - Initiales
 * @property {(facture: Facture) => number} [getMontantPaye] - Montant déjà payé (somme des paiements)
 */
export interface FacturesEnrichments {
  getCandidatNomComplet?: (facture: Facture) => string;
  getCandidatEmail?: (facture: Facture) => string;
  getCandidatTelephone?: (facture: Facture) => string;
  getCandidatAvatarUrl?: (facture: Facture) => string;
  getCandidatInitials?: (facture: Facture) => string;
  getMontantPaye?: (facture: Facture) => number;
  getResteAPayer?: (facture: Facture) => number;
}

/**
 * Options complètes pour la génération des colonnes du tableau des factures.
 *
 * @interface FacturesColumnsOptions
 * @property {FacturesColumnConfig} [columnConfig] - Surcharge de la visibilité des colonnes
 * @property {FacturesEnrichments} [enrichments] - Données calculées pour enrichir les informations du candidat
 * @property {FacturesTableActions} [actions] - Callbacks d’actions sur les lignes
 * @property {'admin' | 'secretaire'} [variant] - Profil utilisateur
 *   - `admin` : toutes les colonnes (numéro, candidat, montant, statut, dates, échéance, actions)
 *   - `secretaire` : colonnes essentielles (numéro, candidat, montant, statut, actions)
 *
 * @example
 * ```ts
 * const options: FacturesColumnsOptions = {
 *   variant: 'secretaire',
 *   columnConfig: { showMontantPaye: true },
 *   actions: { onDownloadPDF: (f) => console.log(f) },
 *  enrichments: {
 *   getCandidatNomComplet: (f) => `${f.candidat?.prenom} ${f.candidat?.nom}`,
 *  getMontantPaye: (f) => f.paiements?.reduce((sum, p) => sum + p.montant, 0) || 0,
 * },
 * };
 * const columns = getFacturesColumns(options);
 * ```
 */
export interface FacturesColumnsOptions {
  columnConfig?: FacturesColumnConfig;
  actions?: FacturesTableActions;
  enrichments?: FacturesEnrichments;
  variant?: 'admin' | 'secretaire';
}

// ============================================================
// PARAMÈTRES & ENTRÉES (DTOs)
// ============================================================

/**
 * Paramètres de filtrage et pagination pour la liste des factures.
 *
 * @interface FacturesListParams
 * @description
 * Utilisé par `FacturesApi.getAll()` et le canal IPC `factures:getAll`.
 *
 * @property {number} [page=1] - Page courante (1-indexed)
 * @property {number} [limit=20] - Nombre d'éléments par page (max 200)
 * @property {string} [search] - Recherche textuelle : numéro de facture, nom candidat
 * @property {StatutFacture} [statut] - Filtrer par statut (EN_ATTENTE, PARTIELLEMENT_PAYEE, PAYEE, ANNULEE)
 * @property {number} [candidatId] - Filtrer par candidat
 * @property {string} [dateDebut] - Date d'émission début (ISO 8601)
 * @property {string} [dateFin] - Date d'émission fin
 * @property {'today' | 'week' | 'month' | 'all'} [period] - Période prédéfinie (remplace dateDebut/dateFin)
 * @property {'numero' | 'montantTotal' | 'dateEmission' | 'createdAt'} [sortBy='dateEmission'] - Champ de tri
 * @property {'asc' | 'desc'} [sortOrder='desc'] - Sens du tri
 */
export interface FacturesListParams {
  page?: number;
  limit?: number;
  search?: string;
  statut?: StatutFacture;
  candidatId?: number;
  dateDebut?: string;
  dateFin?: string;
  period?: 'today' | 'week' | 'month' | 'all';
  sortBy?: 'numero' | 'montantTotal' | 'dateEmission' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Données d'entrée pour créer une nouvelle facture.
 *
 * @interface CreateFactureInput
 * @description
 * Utilisé par `FacturesApi.create()`.
 *
 * @property {number} candidatId - Identifiant du candidat
 * @property {number} montantTotal - Montant total de la facture (FCFA)
 * @property {string} [dateEmission] - Date d'émission (ISO 8601), défaut = maintenant
 * @property {string} [dateEcheance] - Date d'échéance (optionnelle)
 * @property {string} [notes] - Commentaires internes
 * @property {string} [numero] - Numéro de facture (si laissé vide, auto-généré)
 */
export interface CreateFactureInput {
  candidatId: number;
  montantTotal: number;
  dateEmission?: string;
  dateEcheance?: string | null;
  notes?: string | null;
  numero?: string; // auto-généré si absent
}

/**
 * Données d'entrée pour mettre à jour une facture.
 *
 * @interface UpdateFactureInput
 * @description
 * Tous les champs sont optionnels (patch partiel).
 *
 * @property {StatutFacture} [statut] - Nouveau statut
 * @property {string} [dateEcheance] - Nouvelle date d'échéance
 * @property {string} [notes] - Nouvelles notes
 * @property {string} [pdfPath] - Chemin du PDF (si régénéré)
 */
export interface UpdateFactureInput {
  statut?: StatutFacture;
  dateEcheance?: string | null;
  notes?: string | null;
  pdfPath?: string | null;
}

// ============================================================
// RÉPONSES DE L'API
// ============================================================

/**
 * Réponse paginée pour la liste des factures.
 *
 * @interface FacturesPaginatedResponse
 * @property {Facture[]} factures - Liste des factures de la page (avec relations candidat et paiements résumés)
 * @property {number} total - Nombre total de factures (tous filtres)
 * @property {number} page - Page courante
 * @property {number} limit - Limite par page
 * @property {number} totalPages - Nombre total de pages
 */
export interface FacturesPaginatedResponse {
  factures: Facture[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Statistiques étendues des factures pour le dashboard.
 *
 * @interface FacturesStatsExtended
 * @extends FacturesStats
 * @property {number} montantJour - Montant des factures émises aujourd'hui
 * @property {number} montantMois - Montant des factures émises ce mois-ci
 * @property {number} montantImpayeEvolution - Évolution du montant impayé (en %)
 */
export interface FacturesStatsExtended extends FacturesStats {
  montantJour: number;
  montantMois: number;
  montantImpayeEvolution: number;
}

/**
 * Données des sparklines pour les factures (12 derniers mois).
 *
 * @interface FacturesSparklineData
 * @property {{ values: number[]; labels?: string[] }} totalFacturesSparkline - Nombre de factures par mois
 * @property {{ values: number[]; labels?: string[] }} montantTotalSparkline - Montant total par mois
 * @property {{ values: number[]; labels?: string[] }} montantImpayeSparkline - Montant impayé par mois
 * @property {{ values: number[]; labels?: string[] }} paiementsRecusSparkline - Paiements reçus par mois
 */
export interface FacturesSparklineData {
  totalFacturesSparkline: { values: number[]; labels?: string[] };
  montantTotalSparkline: { values: number[]; labels?: string[] };
  montantImpayeSparkline: { values: number[]; labels?: string[] };
  paiementsRecusSparkline: { values: number[]; labels?: string[] };
}

// ============================================================
// API WINDOW — FacturesApi
// ============================================================

/**
 * Interface de l'API factures exposée au renderer via `window.api.factures`.
 *
 * @interface FacturesApi
 * @description
 * Toutes les méthodes sont asynchrones et communiquent via IPC Electron.
 *
 * ## Canaux IPC utilisés
 * | Méthode               | Canal IPC                         |
 * |-----------------------|-----------------------------------|
 * | getAll                | factures:getAll                   |
 * | getById               | factures:getById                  |
 * | create                | factures:create                   |
 * | update                | factures:update                   |
 * | delete                | factures:delete                   |
 * | getStats              | factures:getStats                 |
 * | getTrends             | factures:getTrends                |
 * | getSparklines         | factures:getSparklines            |
 * | getPaiements          | factures:getPaiements             |
 * | getByCandidat         | factures:getByCandidat            |
 * | generatePDF           | factures:generatePDF              |
 * | sendByEmail           | factures:sendByEmail              |
 */
export interface FacturesApi {
  /**
   * Récupère la liste paginée des factures avec filtres.
   * @param params - Paramètres de pagination, filtres et tri
   * @returns Liste paginée
   */
  getAll: (params?: FacturesListParams) => Promise<FacturesPaginatedResponse>;

  /**
   * Récupère une facture par son identifiant (avec candidat et paiements).
   * @param id - Identifiant de la facture
   * @returns Facture complète
   */
  getById: (id: number) => Promise<Facture & { paiements?: Paiement[]; candidat?: Candidat }>;

  /**
   * Crée une nouvelle facture (avec génération automatique du numéro et du PDF).
   * @param data - Données de la facture
   * @returns Facture créée
   */
  create: (data: CreateFactureInput) => Promise<Facture>;

  /**
   * Met à jour partiellement une facture (statut, échéance, notes).
   * @param id - Identifiant de la facture
   * @param data - Champs à modifier
   * @returns Facture mise à jour
   */
  update: (id: number, data: UpdateFactureInput) => Promise<Facture>;

  /**
   * Supprime définitivement une facture (uniquement si aucun paiement associé).
   * @param id - Identifiant de la facture
   * @returns Résultat de l'opération
   */
  delete: (id: number) => Promise<{ success: boolean; message: string }>;

  /**
   * Récupère les statistiques agrégées des factures.
   * @returns Métriques (total, montants, tendances)
   */
  getStats: () => Promise<FacturesStatsExtended>;

  /**
   * Récupère les tendances évolutives (mois en cours vs précédent).
   * @returns Variations en pourcentage
   */
  getTrends: () => Promise<FacturesTrends>;

  /**
   * Récupère les données des sparklines pour les 12 derniers mois.
   * @returns Sparklines (totaux, montants, impayés)
   */
  getSparklines: () => Promise<FacturesSparklineData>;

  /**
   * Récupère la liste des paiements associés à une facture.
   * @param factureId - Identifiant de la facture
   * @returns Liste des paiements
   */
  getPaiements: (factureId: number) => Promise<Paiement[]>;

  /**
   * Récupère toutes les factures d’un candidat spécifique.
   * @param candidatId - Identifiant du candidat
   * @returns Liste des factures du candidat (triées par date décroissante)
   */
  getByCandidat: (candidatId: number) => Promise<Facture[]>;

  /**
   * Génère (ou régénère) le PDF d’une facture et met à jour le chemin.
   * @param id - Identifiant de la facture
   * @returns Chemin du fichier PDF généré
   */
  generatePDF: (id: number) => Promise<{ success: boolean; path: string; message?: string }>;

  /**
   * Envoie la facture par email au candidat (si email connu).
   * @param id - Identifiant de la facture
   * @returns Résultat de l’envoi
   */
  sendByEmail: (id: number) => Promise<{ success: boolean; message: string }>;
}
