// src/types/paiements.types.ts

/**
 * @module types/paiements.types
 * @description
 * Types complets pour la gestion des paiements dans l’auto‑école COS.
 *
 * Ce module exporte :
 * - `Paiement` : le modèle principal (avec relations)
 * - `PaiementsStats` : métriques agrégées pour les tableaux de bord
 * - `PaiementsTrends` : évolutions temporelles pour les cartes de statistiques
 * - `PaiementsColumnConfig` : contrôle de visibilité des colonnes dans les tableaux
 * - `PaiementsTableActions` : callbacks d’actions sur les lignes
 * - `PaiementsColumnsOptions` : options complètes pour la génération des colonnes
 *
 * Ces types sont utilisés dans les composants `StatsCard`, `DataTable`,
 * `SecretaireStatsCards`, `AdminStatsCards`, etc.
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @see {@link ModePaiement} – Énumération des modes de paiement
 * @see {@link Candidat} – Candidat associé au paiement
 * @see {@link Facture} – Facture associée (si applicable)
 */

import type { ModePaiement } from '@/types/enums';
import type { Candidat } from '@/types/candidats.types';
import type { Facture } from '@/types/factures.types';

// ============================================================
// MODÈLE PRINCIPAL
// ============================================================

/**
 * Paiement – correspond au modèle Prisma `Paiement`.
 *
 * @interface Paiement
 * @description
 * Un paiement représente un encaissement effectué par un candidat, en liquide,
 * par chèque, virement, carte bancaire ou mobile money. Il peut être rattaché
 * à une facture (si le paiement correspond à tout ou partie d’une facture).
 *
 * @property {number} id - Identifiant unique (auto-incrémenté)
 * @property {number} montant - Montant encaissé (en FCFA)
 * @property {Date | string} date - Date du paiement (généralement la date réelle)
 * @property {ModePaiement} mode - Moyen de paiement utilisé
 * @property {string | null} [reference] - Référence externe (ex: numéro de chèque, ID de transaction mobile money)
 * @property {string | null} [note] - Commentaire libre (ex: "Acompte", "Solde")
 * @property {Date | string} createdAt - Horodatage de création dans le système
 * @property {number} candidatId - Identifiant du candidat ayant effectué le paiement
 * @property {number | null} [factureId] - Identifiant de la facture associée (si existante)
 *
 * // Relations (optionnelles, chargées selon les besoins)
 * @property {Candidat} [candidat] - Candidat qui a payé (peut être chargé en détail)
 * @property {Facture | null} [facture] - Facture correspondante
 *
 * @example
 * ```ts
 * const paiement: Paiement = {
 *   id: 1,
 *   montant: 50000,
 *   date: '2024-02-15T10:30:00Z',
 *   mode: 'MOBILE_MONEY',
 *   reference: 'TRX-123456',
 *   note: 'Acompte permis B',
 *   createdAt: '2024-02-15T10:30:00Z',
 *   candidatId: 42,
 *   factureId: 101,
 * };
 * ```
 */
export interface Paiement {
  id: number;
  montant: number;
  date: Date | string;
  mode: ModePaiement;
  reference?: string | null;
  note?: string | null;
  createdAt: Date | string;
  candidatId: number;
  factureId?: number | null;

  // Relations (optionnelles)
  candidat?: Candidat;
  facture?: Facture | null;
}

// ============================================================
// STATISTIQUES POUR LE DASHBOARD
// ============================================================

/**
 * Métriques statistiques agrégées pour les paiements.
 * Utilisé dans les composants de cartes statistiques.
 *
 * @interface PaiementsStats
 * @description Regroupe les indicateurs clés de l’activité financière.
 *
 * @property {number} totalEncaissements - Somme de tous les montants encaissés
 * @property {number} nombreTransactions - Nombre total de paiements
 * @property {number} encaissementsMois - Somme des paiements du mois en cours
 * @property {number} montantMoyen - Montant moyen par paiement
 *
 * @example
 * ```ts
 * const stats: PaiementsStats = {
 *   totalEncaissements: 1250000,
 *   nombreTransactions: 42,
 *   encaissementsMois: 320000,
 *   montantMoyen: 29761.9,
 * };
 * ```
 */
export interface PaiementsStats {
  totalEncaissements: number;
  nombreTransactions: number;
  encaissementsMois: number;
  montantMoyen: number;
}

/**
 * Tendances évolutives des indicateurs financiers.
 *
 * @interface PaiementsTrends
 * @property {number} totalEncaissements - Variation (en pourcentage ou absolu)
 * @property {number} nombreTransactions - Variation
 * @property {number} encaissementsMois - Variation
 * @property {number} montantMoyen - Variation
 *
 * @example
 * ```ts
 * const trends: PaiementsTrends = {
 *   totalEncaissements: 12.5,
 *   nombreTransactions: 8,
 *   encaissementsMois: -3.2,
 *   montantMoyen: 4.1,
 * };
 * ```
 */
export interface PaiementsTrends {
  totalEncaissements: number;
  nombreTransactions: number;
  encaissementsMois: number;
  montantMoyen: number;
}

// ============================================================
// CONFIGURATION DES COLONNES DU TABLEAU DES PAIEMENTS
// ============================================================

/**
 * Configuration de visibilité des colonnes dans le tableau des paiements.
 *
 * @interface PaiementsColumnConfig
 * @property {boolean} [showDate] - Afficher la date du paiement (défaut : true)
 * @property {boolean} [showCandidat] - Afficher le nom du candidat (défaut : true)
 * @property {boolean} [showMontant] - Afficher le montant (défaut : true)
 * @property {boolean} [showMode] - Afficher le mode de paiement (badge) (défaut : true)
 * @property {boolean} [showReference] - Afficher la référence (défaut : false)
 * @property {boolean} [showFacture] - Afficher le numéro de facture associée (défaut : false)
 * @property {boolean} [showNote] - Afficher la note (défaut : false)
 * @property {boolean} [showActions] - Afficher le menu d’actions (défaut : true)
 *
 * @example
 * ```ts
 * const config: PaiementsColumnConfig = {
 *   showDate: true,
 *   showCandidat: true,
 *   showMontant: true,
 *   showMode: true,
 *   showReference: true,
 *   showFacture: true,
 *   showNote: false,
 *   showActions: true,
 * };
 * ```
 */
export interface PaiementsColumnConfig {
  showDate?: boolean;
  showCandidat?: boolean;
  showMontant?: boolean;
  showMode?: boolean;
  showReference?: boolean;
  showFacture?: boolean;
  showNote?: boolean;
  showActions?: boolean;
}

/**
 * Callbacks d’actions sur une ligne du tableau des paiements.
 *
 * @interface PaiementsTableActions
 * @property {(paiement: Paiement) => void} [onView] - Voir le détail du paiement
 * @property {(paiement: Paiement) => void} [onEdit] - Modifier le paiement
 * @property {(paiement: Paiement) => Promise<void>} [onDelete] - Supprimer le paiement
 * @property {(paiement: Paiement) => void} [onPrintReceipt] - Imprimer le reçu
 * @property {(paiement: Paiement) => void} [onViewFacture] - Voir la facture associée
 *
 * @example
 * ```ts
 * const actions: PaiementsTableActions = {
 *   onView: (p) => navigate(`/paiements/${p.id}`),
 *   onEdit: (p) => navigate(`/paiements/${p.id}/edit`),
 *   onDelete: async (p) => await deletePaiement(p.id),
 *   onPrintReceipt: (p) => window.print(),
 * };
 * ```
 */
export interface PaiementsTableActions {
  onView?: (paiement: Paiement) => void;
  onEdit?: (paiement: Paiement) => void;
  onDelete?: (paiement: Paiement) => Promise<void>;
  onPrintReceipt?: (paiement: Paiement) => void;
  onViewFacture?: (paiement: Paiement) => void;
}

/**
 * Enrichissements optionnels pour injecter des données calculées
 * sans modifier le modèle principal `Paiement`.
 *
 * @interface PaiementsEnrichments
 * @property {(paiement: Paiement) => string} [getCandidatNomComplet] - Nom complet du candidat
 * @property {(paiement: Paiement) => string} [getCandidatEmail] - Email du candidat
 * @property {(paiement: Paiement) => string} [getCandidatTelephone] - Téléphone
 * @property {(paiement: Paiement) => string} [getCandidatAvatarUrl] - URL de l’avatar
 * @property {(paiement: Paiement) => string} [getCandidatInitials] - Initiales pour fallback
 * @property {(paiement: Paiement) => string} [getFactureNumero] - Numéro de facture associée
 */
export interface PaiementsEnrichments {
  getCandidatNomComplet?: (paiement: Paiement) => string;
  getCandidatEmail?: (paiement: Paiement) => string;
  getCandidatTelephone?: (paiement: Paiement) => string;
  getCandidatAvatarUrl?: (paiement: Paiement) => string;
  getCandidatInitials?: (paiement: Paiement) => string;
  getFactureNumero?: (paiement: Paiement) => string;
}

/**
 * Options complètes pour la génération des colonnes du tableau des paiements.
 *
 * @interface PaiementsColumnsOptions
 * @property {PaiementsColumnConfig} [columnConfig] - Surcharge de la visibilité des colonnes
 * @property {PaiementsTableActions} [actions] - Callbacks d’actions sur les lignes
 * @property {'admin' | 'secretaire'} [variant] - Profil utilisateur
 *   - `admin` : affiche toutes les colonnes
 *   - `secretaire` : colonnes adaptées à la gestion quotidienne (date, candidat, montant, mode, actions)
 *
 * @example
 * ```ts
 * const options: PaiementsColumnsOptions = {
 *   variant: 'secretaire',
 *   columnConfig: { showReference: true },
 *   actions: { onView: (p) => console.log(p) },
 * };
 * const columns = getPaiementsColumns(options);
 * ```
 */
export interface PaiementsColumnsOptions {
  columnConfig?: PaiementsColumnConfig;
  actions?: PaiementsTableActions;
  enrichments?: PaiementsEnrichments;
  variant?: 'admin' | 'secretaire';
}

// ============================================================
// DTOs — PARAMÈTRES & ENTRÉES
// ============================================================

/**
 * Paramètres de filtrage et pagination pour la liste des paiements.
 *
 * @interface PaiementsListParams
 * @description
 * Utilisé par `PaiementsApi.getAll()` et le canal IPC `paiements:getAll`.
 * Tous les champs sont optionnels ; par défaut, retourne tous les paiements
 * triés par date décroissante.
 *
 * @property {number} [page=1] - Page courante (1-indexed)
 * @property {number} [limit=20] - Nombre d'éléments par page (max 200)
 * @property {string} [search] - Recherche textuelle : nom/prénom candidat, référence, note
 * @property {ModePaiement} [mode] - Filtrer par mode de paiement
 * @property {number} [candidatId] - Filtrer par candidat
 * @property {number} [factureId] - Filtrer par facture
 * @property {string} [dateDebut] - Date de début (ISO 8601, inclusif)
 * @property {string} [dateFin] - Date de fin (ISO 8601, inclusif)
 * @property {'today' | 'week' | 'month' | 'all'} [period] - Période prédéfinie (remplace dateDebut/dateFin)
 * @property {'date' | 'montant' | 'createdAt'} [sortBy='date'] - Champ de tri
 * @property {'asc' | 'desc'} [sortOrder='desc'] - Sens du tri
 *
 * @example
 * ```ts
 * const params: PaiementsListParams = {
 *   page: 1,
 *   limit: 20,
 *   mode: 'MOBILE_MONEY',
 *   period: 'month',
 *   sortBy: 'montant',
 *   sortOrder: 'desc',
 * };
 * const result = await window.api.paiements.getAll(params);
 * ```
 */
export interface PaiementsListParams {
  page?: number;
  limit?: number;
  search?: string;
  mode?: ModePaiement;
  candidatId?: number;
  factureId?: number;
  dateDebut?: string;
  dateFin?: string;
  period?: 'today' | 'week' | 'month' | 'all';
  sortBy?: 'date' | 'montant' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Données d'entrée pour créer un nouveau paiement.
 *
 * @interface CreatePaiementInput
 * @description
 * Tous les champs obligatoires doivent être fournis. `date` est optionnel
 * (la date courante est utilisée si non spécifiée).
 *
 * @property {number} montant - Montant en FCFA (doit être > 0)
 * @property {ModePaiement} mode - Mode de paiement
 * @property {number} candidatId - Identifiant du candidat qui paie
 * @property {string} [date] - Date ISO 8601 (par défaut : maintenant)
 * @property {string | null} [reference] - Référence externe (numéro de chèque, transaction)
 * @property {string | null} [note] - Note interne libre (ex: "Acompte", "Solde")
 * @property {number | null} [factureId] - Facture à laquelle rattacher ce paiement
 *
 * @example
 * ```ts
 * const input: CreatePaiementInput = {
 *   montant: 50000,
 *   mode: 'MOBILE_MONEY',
 *   candidatId: 42,
 *   reference: 'MTN-789456',
 *   note: 'Acompte permis B',
 *   factureId: 101,
 * };
 * const paiement = await window.api.paiements.create(input);
 * ```
 */
export interface CreatePaiementInput {
  montant: number;
  mode: ModePaiement;
  candidatId: number;
  date?: string;
  reference?: string | null;
  note?: string | null;
  factureId?: number | null;
}

/**
 * Données d'entrée pour mettre à jour un paiement (patch partiel).
 *
 * @interface UpdatePaiementInput
 * @description
 * Tous les champs sont optionnels. Seuls les champs fournis sont mis à jour.
 * Note : `candidatId` n'est pas modifiable après création.
 *
 * @property {number} [montant] - Nouveau montant
 * @property {ModePaiement} [mode] - Nouveau mode
 * @property {string} [date] - Nouvelle date ISO 8601
 * @property {string | null} [reference] - Nouvelle référence
 * @property {string | null} [note] - Nouvelle note
 * @property {number | null} [factureId] - Nouvelle facture associée
 *
 * @example
 * ```ts
 * const update: UpdatePaiementInput = {
 *   note: 'Solde définitif',
 *   reference: 'MTN-123456-REV',
 * };
 * const updated = await window.api.paiements.update(paiementId, update);
 * ```
 */
export interface UpdatePaiementInput {
  montant?: number;
  mode?: ModePaiement;
  date?: string;
  reference?: string | null;
  note?: string | null;
  factureId?: number | null;
}

// ============================================================
// DTOs — RÉPONSES
// ============================================================

/**
 * Réponse paginée pour la liste des paiements.
 *
 * @interface PaiementsPaginatedResponse
 * @property {Paiement[]} paiements - Paiements de la page courante (avec relations candidat + facture)
 * @property {number} total - Nombre total de paiements (tous filtres confondus)
 * @property {number} page - Page courante (1-indexed)
 * @property {number} limit - Nombre d'éléments par page demandé
 * @property {number} totalPages - Nombre total de pages
 *
 * @example
 * ```ts
 * const response: PaiementsPaginatedResponse = {
 *   paiements: [...],
 *   total: 248,
 *   page: 2,
 *   limit: 20,
 *   totalPages: 13,
 * };
 * ```
 */
export interface PaiementsPaginatedResponse {
  paiements: Paiement[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Répartition d'un mode de paiement dans les statistiques.
 *
 * @interface ModeDistribution
 * @property {ModePaiement} mode - Code du mode
 * @property {number} count - Nombre de transactions
 * @property {number} total - Montant total cumulé pour ce mode
 * @property {number} pct - Pourcentage du total global (0–100)
 *
 * @example
 * ```ts
 * const dist: ModeDistribution = { mode: 'MOBILE_MONEY', count: 18, total: 540000, pct: 42.3 };
 * ```
 */
export interface ModeDistribution {
  mode: ModePaiement;
  count: number;
  total: number;
  pct: number;
}

/**
 * Statistiques étendues des paiements pour le dashboard.
 *
 * @interface PaiementsStatsExtended
 * @extends PaiementsStats
 * @description
 * Complète `PaiementsStats` avec des métriques additionnelles :
 * données du jour, de l'année et la répartition par mode.
 *
 * @property {number} montantJour - Total encaissé aujourd'hui
 * @property {number} nombreTransactionsJour - Nombre de transactions aujourd'hui
 * @property {number} encaissementsAnnee - Total encaissé sur l'année civile
 * @property {number} nombreTransactionsAnnee - Nombre de transactions sur l'année
 * @property {ModeDistribution[]} repartitionModes - Répartition par mode de paiement
 *
 * @example
 * ```ts
 * const stats: PaiementsStatsExtended = {
 *   totalEncaissements: 1250000,
 *   nombreTransactions: 42,
 *   encaissementsMois: 320000,
 *   montantMoyen: 29761,
 *   montantJour: 75000,
 *   nombreTransactionsJour: 3,
 *   encaissementsAnnee: 3800000,
 *   nombreTransactionsAnnee: 128,
 *   repartitionModes: [
 *     { mode: 'MOBILE_MONEY', count: 22, total: 660000, pct: 52.8 },
 *     { mode: 'ESPECES', count: 14, total: 350000, pct: 28.0 },
 *   ],
 * };
 * ```
 */
export interface PaiementsStatsExtended extends PaiementsStats {
  montantJour: number;
  nombreTransactionsJour: number;
  encaissementsAnnee: number;
  nombreTransactionsAnnee: number;
  repartitionModes: ModeDistribution[];
}

/**
 * Données des sparklines (évolutions sur 12 mois) pour le dashboard paiements.
 *
 * @interface PaiementsSparklineData
 * @description
 * Chaque propriété est un tableau de 12 valeurs (un par mois, du plus ancien au plus récent)
 * accompagné de leurs étiquettes (ex: ["Jan", "Fév", ..., "Déc"]).
 *
 * @property {{ values: number[]; labels?: string[] }} totalEncaissementsSparkline - Total encaissé par mois
 * @property {{ values: number[]; labels?: string[] }} nombreTransactionsSparkline - Nombre de transactions par mois
 * @property {{ values: number[]; labels?: string[] }} encaissementsMoisSparkline - Encaissements du mois courant (progression)
 * @property {{ values: number[]; labels?: string[] }} montantMoyenSparkline - Montant moyen par mois
 *
 * @example
 * ```ts
 * const sparklines: PaiementsSparklineData = {
 *   totalEncaissementsSparkline: {
 *     values: [980000, 1020000, 1100000, 1150000, 1180000, 1220000, 1250000, ...],
 *     labels: ['Jan', 'Fév', 'Mar', ...],
 *   },
 *   nombreTransactionsSparkline: { values: [28, 32, 35, ...], labels: [...] },
 *   encaissementsMoisSparkline: { values: [210000, 235000, ...], labels: [...] },
 *   montantMoyenSparkline: { values: [28500, 29500, ...], labels: [...] },
 * };
 * ```
 */
export interface PaiementsSparklineData {
  totalEncaissementsSparkline: { values: number[]; labels?: string[] };
  nombreTransactionsSparkline: { values: number[]; labels?: string[] };
  encaissementsMoisSparkline: { values: number[]; labels?: string[] };
  montantMoyenSparkline: { values: number[]; labels?: string[] };
}

/**
 * Solde d'un candidat (total facturé - total payé).
 *
 * @interface SoldeCandidat
 * @property {number} candidatId - Identifiant du candidat
 * @property {number} totalPaye - Somme de tous ses paiements (en FCFA)
 * @property {number} totalFacture - Montant total de toutes ses factures (en FCFA)
 * @property {number} solde - Montant restant dû = totalFacture - totalPaye (positif = dette, négatif = crédit)
 * @property {boolean} estSolde - `true` si totalPaye >= totalFacture
 *
 * @example
 * ```ts
 * const solde: SoldeCandidat = {
 *   candidatId: 42,
 *   totalPaye: 75000,
 *   totalFacture: 175000,
 *   solde: 100000,  // 100 000 FCFA restant à payer
 *   estSolde: false,
 * };
 * ```
 */
export interface SoldeCandidat {
  candidatId: number;
  montantTotalFormation: number;
  totalPaye: number;
  solde: number;
  estSolde: boolean;
  tropPerçu: boolean;
  formationNom?: string | null;
}

/**
 * Résumé mensuel des paiements (pour un mois et une année donnés).
 *
 * @interface ResumeMensuel
 * @property {number} annee - Année (ex: 2025)
 * @property {number} mois - Mois (1 = Janvier, 12 = Décembre)
 * @property {number} totalEncaissements - Total encaissé pendant le mois
 * @property {number} nombreTransactions - Nombre de transactions
 * @property {number} montantMoyen - Montant moyen par transaction
 * @property {ModeDistribution[]} repartitionModes - Répartition par mode de paiement
 * @property {number} evolutions - Variation en % par rapport au mois précédent
 *
 * @example
 * ```ts
 * const resume: ResumeMensuel = {
 *   annee: 2025,
 *   mois: 5,
 *   totalEncaissements: 340000,
 *   nombreTransactions: 11,
 *   montantMoyen: 30909,
 *   repartitionModes: [
 *     { mode: 'MOBILE_MONEY', count: 6, total: 180000, pct: 52.9 },
 *     { mode: 'ESPECES', count: 5, total: 160000, pct: 47.1 },
 *   ],
 *   evolution: 8.5,
 * };
 * ```
 */
export interface ResumeMensuel {
  annee: number;
  mois: number;
  totalEncaissements: number;
  nombreTransactions: number;
  montantMoyen: number;
  repartitionModes: ModeDistribution[];
  evolution: number;
}

// ============================================================
// API WINDOW — PaiementsApi
// ============================================================

/**
 * Interface de l'API paiements exposée au renderer via `window.api.paiements`.
 *
 * @interface PaiementsApi
 * @description
 * Toutes les méthodes sont asynchrones et communiquent via IPC Electron.
 *
 * ## Canaux IPC utilisés
 * | Méthode               | Canal IPC                     |
 * |-----------------------|-------------------------------|
 * | getAll                | paiements:getAll              |
 * | getById               | paiements:getById             |
 * | create                | paiements:create              |
 * | update                | paiements:update              |
 * | delete                | paiements:delete              |
 * | getStats              | paiements:getStats            |
 * | getTrends             | paiements:getTrends           |
 * | getSparklines         | paiements:getSparklines       |
 * | getByCandidat         | paiements:getByCandidat       |
 * | getSoldeCandidat      | paiements:getSoldeCandidat    |
 * | getResumeMensuel      | paiements:getResumeMensuel    |
 * | printReceipt          | paiements:printReceipt        |
 *
 * @see {@link PaiementsListParams} – Paramètres de filtrage
 * @see {@link PaiementsPaginatedResponse} – Réponse paginée
 * @see {@link CreatePaiementInput} – Données de création
 * @see {@link UpdatePaiementInput} – Données de mise à jour
 * @see {@link PaiementsStatsExtended} – Statistiques complètes
 * @see {@link PaiementsSparklineData} – Données sparklines
 * @see {@link SoldeCandidat} – Solde d'un candidat
 * @see {@link ResumeMensuel} – Résumé mensuel
 *
 * @example
 * ```ts
 * // Liste paginée avec filtres
 * const { paiements, total } = await window.api.paiements.getAll({
 *   page: 1, limit: 20, period: 'month', mode: 'MOBILE_MONEY',
 * });
 *
 * // Créer un paiement
 * const nouveau = await window.api.paiements.create({
 *   montant: 50000, mode: 'MOBILE_MONEY', candidatId: 42,
 *   reference: 'MTN-789456', note: 'Acompte permis B',
 * });
 *
 * // Solde d'un candidat
 * const { solde, estSolde } = await window.api.paiements.getSoldeCandidat(42);
 * ```
 */
export interface PaiementsApi {
  /**
   * Récupère la liste paginée des paiements avec filtres optionnels.
   * @param params - Paramètres de pagination, filtres et tri
   * @returns Liste paginée avec total et métadonnées
   */
  getAll: (params?: PaiementsListParams) => Promise<PaiementsPaginatedResponse>;

  /**
   * Récupère un paiement par son identifiant avec toutes ses relations.
   * @param id - Identifiant du paiement
   * @returns Paiement complet (avec candidat et facture chargés)
   */
  getById: (id: number) => Promise<Paiement>;

  /**
   * Crée un nouveau paiement et met à jour la caisse automatiquement.
   * @param data - Données du paiement (montant, mode, candidatId requis)
   * @returns Paiement créé
   */
  create: (data: CreatePaiementInput) => Promise<Paiement>;

  /**
   * Met à jour un paiement existant (patch partiel).
   * @param id - Identifiant du paiement
   * @param data - Champs à modifier
   * @returns Paiement mis à jour
   */
  update: (id: number, data: UpdatePaiementInput) => Promise<Paiement>;

  /**
   * Supprime définitivement un paiement.
   * @param id - Identifiant du paiement
   * @returns Résultat de l'opération
   */
  delete: (id: number) => Promise<{ success: boolean; message: string }>;

  /**
   * Récupère les statistiques agrégées complètes des paiements.
   * @returns Métriques (totaux, montants du jour, mois, année, répartition modes)
   */
  getStats: () => Promise<PaiementsStatsExtended>;

  /**
   * Récupère les tendances évolutives (mois courant vs mois précédent).
   * @returns Variations en pourcentage pour chaque indicateur
   */
  getTrends: () => Promise<PaiementsTrends>;

  /**
   * Récupère les données des sparklines pour les 12 derniers mois.
   * @returns 4 séries de 12 valeurs mensuelles avec étiquettes
   */
  getSparklines: () => Promise<PaiementsSparklineData>;

  /**
   * Récupère tous les paiements d'un candidat spécifique.
   * @param candidatId - Identifiant du candidat
   * @returns Liste de ses paiements triés par date décroissante
   */
  getByCandidat: (candidatId: number) => Promise<Paiement[]>;

  /**
   * Calcule le solde d'un candidat (total facturé - total payé).
   * @param candidatId - Identifiant du candidat
   * @returns Solde détaillé (totalPaye, totalFacture, solde, estSolde)
   */
  getSoldeCandidat: (candidatId: number) => Promise<SoldeCandidat>;

  /**
   * Récupère le résumé mensuel des paiements pour un mois/année donnés.
   * @param annee - Année (ex: 2025)
   * @param mois - Mois (1 = Janvier, 12 = Décembre)
   * @returns Résumé avec totaux, moyenne et répartition par mode
   */
  getResumeMensuel: (annee: number, mois: number) => Promise<ResumeMensuel>;

  /**
   * Exporte / imprime le reçu d'un paiement (génère un PDF).
   * @param id - Identifiant du paiement
   * @returns Chemin du PDF généré (si succès)
   */
  printReceipt: (id: number) => Promise<{ success: boolean; path?: string; message?: string }>;
}
