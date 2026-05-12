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
