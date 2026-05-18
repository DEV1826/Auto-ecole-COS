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
  showReference?: boolean;
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

// ============================================================
// PARAMÈTRES & ENTRÉES (DTOs)
// ============================================================

/**
 * Paramètres de filtrage et pagination pour la liste des dépenses.
 *
 * @interface DepensesListParams
 * @description
 * Utilisé par `DepensesApi.getAll()` et le canal IPC `depenses:getAll`.
 *
 * @property {number} [page=1] - Page courante (1-indexed)
 * @property {number} [limit=20] - Nombre d'éléments par page (max 200)
 * @property {string} [search] - Recherche textuelle : description, fournisseur, référence
 * @property {CategorieDepense} [categorie] - Filtrer par catégorie
 * @property {number} [vehiculeId] - Filtrer par véhicule
 * @property {string} [dateDebut] - Date de début (ISO 8601)
 * @property {string} [dateFin] - Date de fin (ISO 8601)
 * @property {'today' | 'week' | 'month' | 'all'} [period] - Période prédéfinie
 * @property {'date' | 'montant' | 'createdAt'} [sortBy='date'] - Champ de tri
 * @property {'asc' | 'desc'} [sortOrder='desc'] - Sens du tri
 */
export interface DepensesListParams {
  page?: number;
  limit?: number;
  search?: string;
  categorie?: CategorieDepense;
  vehiculeId?: number;
  dateDebut?: string;
  dateFin?: string;
  period?: 'today' | 'week' | 'month' | 'all';
  sortBy?: 'date' | 'montant' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Données d'entrée pour créer une nouvelle dépense.
 *
 * @interface CreateDepenseInput
 * @description
 * Tous les champs requis sont présents ; les champs optionnels sont optionnels.
 *
 * @property {CategorieDepense} categorie - Catégorie de la dépense
 * @property {number} montant - Montant en FCFA (>0)
 * @property {string} [description] - Description libre
 * @property {string} [date] - Date ISO 8601 (défaut : maintenant)
 * @property {string} [fournisseur] - Nom du fournisseur
 * @property {string} [reference] - Référence externe (facture, bon de commande)
 * @property {number|null} [vehiculeId] - Véhicule associé (optionnel)
 */
export interface CreateDepenseInput {
  categorie: CategorieDepense;
  montant: number;
  description?: string;
  date?: string;
  fournisseur?: string | null;
  reference?: string | null;
  vehiculeId?: number | null;
}

/**
 * Données d'entrée pour mettre à jour une dépense.
 *
 * @interface UpdateDepenseInput
 * @description
 * Tous les champs sont optionnels (patch partiel).
 */
export interface UpdateDepenseInput {
  categorie?: CategorieDepense;
  montant?: number;
  description?: string | null;
  date?: string;
  fournisseur?: string | null;
  reference?: string | null;
  vehiculeId?: number | null;
}

// ============================================================
// RÉPONSES DE L'API
// ============================================================

/**
 * Réponse paginée pour la liste des dépenses.
 *
 * @interface DepensesPaginatedResponse
 * @property {Depense[]} depenses - Liste des dépenses de la page (avec véhicule associé)
 * @property {number} total - Nombre total de dépenses
 * @property {number} page - Page courante
 * @property {number} limit - Limite par page
 * @property {number} totalPages - Nombre total de pages
 */
export interface DepensesPaginatedResponse {
  depenses: Depense[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Statistiques étendues des dépenses pour le dashboard.
 *
 * @interface DepensesStatsExtended
 * @extends DepensesStats
 * @property {number} montantJour - Total des dépenses d'aujourd'hui
 * @property {number} montantAnnee - Total des dépenses de l'année
 * @property {number} evolutionTotal - Évolution du total (en %)
 */
export interface DepensesStatsExtended extends DepensesStats {
  montantJour: number;
  montantAnnee: number;
  evolutionTotal: number;
}

/**
 * Données des sparklines pour les dépenses (12 derniers mois).
 *
 * @interface DepensesSparklineData
 * @property {{ values: number[]; labels?: string[] }} totalSparkline - Total des dépenses par mois
 * @property {{ values: number[]; labels?: string[] }} carburantSparkline - Dépenses carburant par mois
 * @property {{ values: number[]; labels?: string[] }} entretienSparkline - Dépenses entretien par mois
 */
export interface DepensesSparklineData {
  totalSparkline: { values: number[]; labels?: string[] };
  carburantSparkline: { values: number[]; labels?: string[] };
  entretienSparkline: { values: number[]; labels?: string[] };
}

// ============================================================
// DONNÉES POUR LE GRAPHIQUE DE TENDANCES (STACKED BAR CHART)
// ============================================================

/**
 * Point de données mensuel pour une catégorie de dépense.
 */
export interface MonthlyDepenseByCategory {
  /** Mois au format "MMM YYYY" (ex: "Mar 2024") */
  month: string;
  /** Montant total pour la catégorie CARBURANT */
  CARBURANT: number;
  /** Montant total pour la catégorie ENTRETIEN_VEHICULE */
  ENTRETIEN_VEHICULE: number;
  /** Montant total pour la catégorie SALAIRE */
  SALAIRE: number;
  /** Montant total pour la catégorie LOYER */
  LOYER: number;
  /** Montant total pour la catégorie ELECTRICITE */
  ELECTRICITE: number;
  /** Montant total pour la catégorie TELEPHONE */
  TELEPHONE: number;
  /** Montant total pour la catégorie ASSURANCE */
  ASSURANCE: number;
  /** Montant total pour la catégorie PUBLICITE */
  PUBLICITE: number;
  /** Montant total pour la catégorie FOURNITURES */
  FOURNITURES: number;
  /** Montant total pour la catégorie TAXES */
  TAXES: number;
  /** Montant total pour la catégorie AUTRE */
  AUTRE: number;
  [key: string]: string | number; // Permet d’accéder dynamiquement aux catégories
}

/**
 * Réponse de l'API pour le graphique des dépenses.
 */
export interface DepensesTrendChartData {
  /** Données mensuelles agrégées par catégorie (6 derniers mois) */
  data: MonthlyDepenseByCategory[];
  /** Configuration des couleurs et libellés par catégorie */
  config: Record<string, { label: string; color: string }>;
  /** Tendance globale en pourcentage (mois courant vs mois précédent) */
  globalTrend: number;
  /** Période affichée (ex: "Jan 2025 - Juin 2025") */
  periodLabel: string;
}

// ============================================================
// API WINDOW — DepensesApi
// ============================================================

/**
 * Interface de l'API dépenses exposée au renderer via `window.api.depenses`.
 *
 * @interface DepensesApi
 * @description
 * Toutes les méthodes sont asynchrones et communiquent via IPC Electron.
 *
 * ## Canaux IPC utilisés
 * | Méthode               | Canal IPC                         |
 * |-----------------------|-----------------------------------|
 * | getAll                | depenses:getAll                   |
 * | getById               | depenses:getById                  |
 * | create                | depenses:create                   |
 * | update                | depenses:update                   |
 * | delete                | depenses:delete                   |
 * | getStats              | depenses:getStats                 |
 * | getTrends             | depenses:getTrends                |
 * | getSparklines         | depenses:getSparklines            |
 * | getByVehicule         | depenses:getByVehicule            |
 * | attachReceipt         | depenses:attachReceipt            |
 */
export interface DepensesApi {
  /**
   * Récupère la liste paginée des dépenses avec filtres.
   * @param params - Pagination, filtres et tri
   * @returns Liste paginée
   */
  getAll: (params?: DepensesListParams) => Promise<DepensesPaginatedResponse>;

  /**
   * Récupère une dépense par son identifiant (avec véhicule associé).
   * @param id - Identifiant de la dépense
   * @returns Dépense complète
   */
  getById: (id: number) => Promise<Depense>;

  /**
   * Crée une nouvelle dépense.
   * @param data - Données de la dépense
   * @returns Dépense créée
   */
  create: (data: CreateDepenseInput) => Promise<Depense>;

  /**
   * Met à jour une dépense existante (patch partiel).
   * @param id - Identifiant de la dépense
   * @param data - Champs à modifier
   * @returns Dépense mise à jour
   */
  update: (id: number, data: UpdateDepenseInput) => Promise<Depense>;

  /**
   * Supprime définitivement une dépense.
   * @param id - Identifiant de la dépense
   * @returns Résultat de l'opération
   */
  delete: (id: number) => Promise<{ success: boolean; message: string }>;

  /**
   * Récupère les statistiques agrégées des dépenses.
   * @returns Métriques étendues
   */
  getStats: () => Promise<DepensesStatsExtended>;

  /**
   * Récupère les tendances évolutives (mois vs précédent).
   * @returns Variations en pourcentage
   */
  getTrends: () => Promise<DepensesTrends>;

  /**
   * Récupère les données des tendances évolutives des dépenses pour les graphiques.
   * @returns Données de tendance
   */
  getTrendChartData: () => Promise<DepensesTrendChartData>;

  /**
   * Récupère les données des sparklines pour les 12 derniers mois.
   * @returns Sparklines (total, carburant, entretien)
   */
  getSparklines: () => Promise<DepensesSparklineData>;

  /**
   * Récupère toutes les dépenses associées à un véhicule.
   * @param vehiculeId - Identifiant du véhicule
   * @returns Liste des dépenses du véhicule
   */
  getByVehicule: (vehiculeId: number) => Promise<Depense[]>;

  /**
   * Joint un reçu (PDF) à une dépense (stub – à implémenter).
   * @param id - Identifiant de la dépense
   * @param filePath - Chemin du fichier PDF
   * @returns Résultat de l'opération
   */
  attachReceipt: (id: number, filePath: string) => Promise<{ success: boolean; message: string }>;
}
