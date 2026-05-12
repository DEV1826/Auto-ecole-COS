// src/types/depenses.types.ts

/**
 * @module types/depenses.types
 * @description
 * Types complets pour la gestion des dépenses dans l’auto‑école COS.
 *
 * Ce module exporte :
 * - `Depense` : le modèle principal (avec relations)
 * - `DepensesStats` : métriques agrégées pour les tableaux de bord
 * - `DepensesTrends` : évolutions temporelles pour les cartes de statistiques
 * - `DepensesColumnConfig` : contrôle de visibilité des colonnes dans les tableaux
 * - `DepensesTableActions` : callbacks d’actions sur les lignes
 * - `DepensesColumnsOptions` : options complètes pour la génération des colonnes
 *
 * Ces types sont utilisés dans les composants `StatsCard`, `DataTable`,
 * `AdminStatsCards`, `SecretaireStatsCards`, etc.
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @see {@link CategorieDepense} – Énumération des catégories de dépense
 * @see {@link Vehicule} – Véhicule associé (si applicable)
 */

import type { CategorieDepense } from '@/types/enums';
import type { Vehicule } from '@/types/vehicules.types';

// ============================================================
// MODÈLE PRINCIPAL
// ============================================================

/**
 * Depense – correspond au modèle Prisma `Depense`.
 *
 * @interface Depense
 * @description
 * Une dépense représente une sortie d’argent pour l’auto‑école : carburant,
 * entretien des véhicules, salaires, loyers, etc. Elle peut être optionnellement
 * liée à un véhicule (par exemple une réparation).
 *
 * @property {number} id - Identifiant unique (auto-incrémenté)
 * @property {CategorieDepense} categorie - Nature de la dépense (carburant, salaire, etc.)
 * @property {number} montant - Montant dépensé (en FCFA)
 * @property {string | null} [description] - Texte libre décrivant la dépense
 * @property {Date | string} date - Date de la dépense (généralement réelle)
 * @property {string | null} [fournisseur] - Nom du fournisseur / prestataire
 * @property {string | null} [reference] - Numéro de facture, bon de commande, etc.
 * @property {Date | string} createdAt - Horodatage de création dans le système
 * @property {number | null} [vehiculeId] - Identifiant du véhicule concerné (si applicable)
 *
 * // Relation (optionnelle, chargée selon les besoins)
 * @property {Vehicule | null} [vehicule] - Véhicule associé
 *
 * @example
 * ```ts
 * const depense: Depense = {
 *   id: 1,
 *   categorie: 'CARBURANT',
 *   montant: 45000,
 *   description: 'Plein de gasoil pour véhicule LT-123-AB',
 *   date: '2024-03-20T12:00:00Z',
 *   fournisseur: 'TotalEnergies',
 *   reference: 'FAC-9876',
 *   createdAt: '2024-03-20T12:00:00Z',
 *   vehiculeId: 5,
 * };
 * ```
 */
export interface Depense {
  id: number;
  categorie: CategorieDepense;
  montant: number;
  description?: string | null;
  date: Date | string;
  fournisseur?: string | null;
  reference?: string | null;
  createdAt: Date | string;
  vehiculeId?: number | null;

  // Relation (optionnelle)
  vehicule?: Vehicule | null;
}

// ============================================================
// STATISTIQUES POUR LE DASHBOARD
// ============================================================

/**
 * Métriques statistiques agrégées pour les dépenses.
 * Utilisé dans les composants de cartes statistiques.
 *
 * @interface DepensesStats
 * @description Regroupe les indicateurs clés des dépenses.
 *
 * @property {number} totalDepenses - Somme de toutes les dépenses
 * @property {number} nombreTransactions - Nombre total de dépenses enregistrées
 * @property {number} depensesMois - Somme des dépenses du mois en cours
 * @property {number} depensesCarburant - Total des dépenses de carburant
 * @property {number} depensesEntretien - Total des dépenses d’entretien véhicule
 *
 * @example
 * ```ts
 * const stats: DepensesStats = {
 *   totalDepenses: 850000,
 *   nombreTransactions: 24,
 *   depensesMois: 210000,
 *   depensesCarburant: 95000,
 *   depensesEntretien: 115000,
 * };
 * ```
 */
export interface DepensesStats {
  totalDepenses: number;
  nombreTransactions: number;
  depensesMois: number;
  depensesCarburant: number;
  depensesEntretien: number;
}

/**
 * Tendances évolutives des indicateurs de dépenses.
 *
 * @interface DepensesTrends
 * @property {number} totalDepenses - Variation (en pourcentage ou absolu)
 * @property {number} nombreTransactions - Variation
 * @property {number} depensesMois - Variation
 * @property {number} depensesCarburant - Variation
 * @property {number} depensesEntretien - Variation
 *
 * @example
 * ```ts
 * const trends: DepensesTrends = {
 *   totalDepenses: 5.2,
 *   nombreTransactions: 8,
 *   depensesMois: -3,
 *   depensesCarburant: 12,
 *   depensesEntretien: 2.5,
 * };
 * ```
 */
export interface DepensesTrends {
  totalDepenses: number;
  nombreTransactions: number;
  depensesMois: number;
  depensesCarburant: number;
  depensesEntretien: number;
}

// ============================================================
// CONFIGURATION DES COLONNES DU TABLEAU DES DÉPENSES
// ============================================================

/**
 * Configuration de visibilité des colonnes dans le tableau des dépenses.
 *
 * @interface DepensesColumnConfig
 * @property {boolean} [showDate] - Afficher la date de la dépense (défaut : true)
 * @property {boolean} [showCategorie] - Afficher la catégorie (badge) (défaut : true)
 * @property {boolean} [showMontant] - Afficher le montant (défaut : true)
 * @property {boolean} [showDescription] - Afficher la description (défaut : true)
 * @property {boolean} [showFournisseur] - Afficher le fournisseur (défaut : false)
 * @property {boolean} [showVehicule] - Afficher l’immatriculation du véhicule (défaut : false)
 * @property {boolean} [showActions] - Afficher le menu d’actions (défaut : true)
 *
 * @example
 * ```ts
 * const config: DepensesColumnConfig = {
 *   showDate: true,
 *   showCategorie: true,
 *   showMontant: true,
 *   showDescription: true,
 *   showFournisseur: true,
 *   showVehicule: true,
 *   showActions: true,
 * };
 * ```
 */
export interface DepensesColumnConfig {
  showDate?: boolean;
  showCategorie?: boolean;
  showMontant?: boolean;
  showDescription?: boolean;
  showFournisseur?: boolean;
  showVehicule?: boolean;
  showActions?: boolean;
}

/**
 * Callbacks d’actions sur une ligne du tableau des dépenses.
 *
 * @interface DepensesTableActions
 * @property {(depense: Depense) => void} [onView] - Voir le détail de la dépense
 * @property {(depense: Depense) => void} [onEdit] - Modifier la dépense
 * @property {(depense: Depense) => Promise<void>} [onDelete] - Supprimer la dépense
 * @property {(depense: Depense) => void} [onAttachReceipt] - Joindre un reçu (PDF)
 *
 * @example
 * ```ts
 * const actions: DepensesTableActions = {
 *   onView: (d) => navigate(`/depenses/${d.id}`),
 *   onEdit: (d) => navigate(`/depenses/${d.id}/edit`),
 *   onDelete: async (d) => await deleteDepense(d.id),
 * };
 * ```
 */
export interface DepensesTableActions {
  onView?: (depense: Depense) => void;
  onEdit?: (depense: Depense) => void;
  onDelete?: (depense: Depense) => Promise<void>;
  onAttachReceipt?: (depense: Depense) => void;
}

/**
 * Enrichissements optionnels pour le tableau des dépenses.
 * Permet d’injecter des données calculées sans modifier le modèle.
 *
 * @interface DepensesEnrichments
 * @property {(depense: Depense) => string} [getVehiculeImmatriculation] - Retourne l’immatriculation du véhicule associé
 * @property {(depense: Depense) => string} [getVehiculeLibelle] - Retourne un libellé complet (marque + modèle + immatriculation)
 */
export interface DepensesEnrichments {
  getVehiculeImmatriculation?: (depense: Depense) => string;
  getVehiculeLibelle?: (depense: Depense) => string;
}

/**
 * Options complètes pour la génération des colonnes du tableau des dépenses.
 *
 * @interface DepensesColumnsOptions
 * @property {DepensesColumnConfig} [columnConfig] - Surcharge de la visibilité des colonnes
 * @property {DepensesTableActions} [actions] - Callbacks d’actions sur les lignes
 * @property {DepensesEnrichments} [enrichments] - Données calculées (véhicule)
 * @property {'admin' | 'secretaire'} [variant] - Profil utilisateur
 *   - `admin` : affiche toutes les colonnes (date, catégorie, montant, description, fournisseur, véhicule, actions)
 *   - `secretaire` : colonnes réduites (date, catégorie, montant, description, actions)
 *
 * @example
 * ```ts
 * const options: DepensesColumnsOptions = {
 *   variant: 'secretaire',
 *   columnConfig: { showFournisseur: true },
 *   actions: { onView: (d) => console.log(d) },
 * };
 * const columns = getDepensesColumns(options);
 * ```
 */
export interface DepensesColumnsOptions {
  columnConfig?: DepensesColumnConfig;
  actions?: DepensesTableActions;
  enrichments?: DepensesEnrichments;
  variant?: 'admin' | 'secretaire';
}
