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
