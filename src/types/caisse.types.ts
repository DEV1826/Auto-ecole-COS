// src/types/caisse.types.ts

/**
 * @module types/caisse.types
 * @description
 * Types complets pour la gestion des mouvements de caisse dans l’auto‑école COS.
 *
 * Ce module exporte :
 * - `MouvementCaisse` : le modèle principal
 * - `CaisseStats` : métriques agrégées (solde, entrées/sorties)
 * - `CaisseTrends` : évolutions temporelles
 * - `CaisseColumnConfig` : contrôle de visibilité des colonnes dans les tableaux
 * - `CaisseTableActions` : callbacks d’actions sur les lignes
 * - `CaisseColumnsOptions` : options complètes pour la génération des colonnes
 *
 * Ces types sont utilisés dans les composants `StatsCard`, `DataTable`,
 * `AdminStatsCards`, `CaissePage`, etc.
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @see {@link TypeMouvement} – Énumération ENTREE / SORTIE
 */

import type { TypeMouvement } from '@/types/enums';
import type { Paiement } from './paiements.types';
import type { Depense } from './depenses.types';

// ============================================================
// MODÈLE PRINCIPAL
// ============================================================

/**
 * MouvementCaisse – correspond au modèle Prisma `Caisse`.
 *
 * @interface MouvementCaisse
 * @description
 * Un mouvement de caisse représente une entrée ou une sortie d’argent.
 * Le champ `solde` est le solde immédiatement après le mouvement,
 * ce qui permet de reconstituer l’historique des soldes.
 *
 * @property {number} id - Identifiant unique (auto-incrémenté)
 * @property {TypeMouvement} type - `ENTREE` (encaissement) ou `SORTIE` (décaissement)
 * @property {number} montant - Montant du mouvement (toujours positif)
 * @property {number} solde - Solde de la caisse après ce mouvement
 * @property {string | null} [description] - Raison / motif du mouvement
 * @property {string | null} [reference] - Référence externe (paiement, facture, etc.)
 * @property {Date | string} date - Date du mouvement (peut être différente de `createdAt`)
 * @property {Date | string} createdAt - Horodatage d’enregistrement dans le système
 *
 * @example
 * ```ts
 * const mouvement: MouvementCaisse = {
 *   id: 1,
 *   type: 'ENTREE',
 *   montant: 50000,
 *   solde: 150000,
 *   description: 'Paiement candidat Dupont',
 *   reference: 'PAY-100',
 *   date: '2024-03-25T09:30:00Z',
 *   createdAt: '2024-03-25T09:30:00Z',
 * };
 * ```
 */
export interface MouvementCaisse {
  id: number;
  type: TypeMouvement;
  montant: number;
  solde: number;
  description?: string | null;
  reference?: string | null;
  date: Date | string;
  createdAt: Date | string;

  entree?: Paiement;
  sortie?: Depense;
}

// ============================================================
// STATISTIQUES POUR LE DASHBOARD
// ============================================================

/**
 * Métriques statistiques agrégées pour la caisse.
 *
 * @interface CaisseStats
 * @description Indicateurs clés de la trésorerie.
 *
 * @property {number} soldeActuel - Solde actuel (dernier mouvement)
 * @property {number} totalEntrees - Cumul des entrées (tous mouvements)
 * @property {number} totalSorties - Cumul des sorties
 * @property {number} nombreMouvements - Nombre total de mouvements enregistrés
 * @property {number} entreesMois - Total des entrées du mois en cours
 * @property {number} sortiesMois - Total des sorties du mois en cours
 *
 * @example
 * ```ts
 * const stats: CaisseStats = {
 *   soldeActuel: 285000,
 *   totalEntrees: 1250000,
 *   totalSorties: 965000,
 *   nombreMouvements: 56,
 *   entreesMois: 320000,
 *   sortiesMois: 210000,
 * };
 * ```
 */
export interface CaisseStats {
  soldeActuel: number;
  totalEntrees: number;
  totalSorties: number;
  nombreMouvements: number;
  entreesMois: number;
  sortiesMois: number;
}

/**
 * Tendances évolutives des indicateurs de caisse.
 *
 * @interface CaisseTrends
 * @property {number} soldeActuel - Variation du solde (en pourcentage)
 * @property {number} totalEntrees - Variation
 * @property {number} totalSorties - Variation
 * @property {number} entreesMois - Variation
 * @property {number} sortiesMois - Variation
 *
 * @example
 * ```ts
 * const trends: CaisseTrends = {
 *   soldeActuel: 8.5,
 *   totalEntrees: 12,
 *   totalSorties: -3,
 *   entreesMois: 5.2,
 *   sortiesMois: 7.4,
 * };
 * ```
 */
export interface CaisseTrends {
  soldeActuel: number;
  totalEntrees: number;
  totalSorties: number;
  entreesMois: number;
  sortiesMois: number;
}

// ============================================================
// CONFIGURATION DES COLONNES DU TABLEAU DE CAISSE
// ============================================================

/**
 * Configuration de visibilité des colonnes dans le tableau des mouvements de caisse.
 *
 * @interface CaisseColumnConfig
 * @property {boolean} [showDate] - Afficher la date du mouvement (défaut : true)
 * @property {boolean} [showType] - Afficher le type (entrée/sortie) avec badge (défaut : true)
 * @property {boolean} [showMontant] - Afficher le montant (défaut : true)
 * @property {boolean} [showSoldeApres] - Afficher le solde après le mouvement (défaut : true)
 * @property {boolean} [showDescription] - Afficher la description (défaut : true)
 * @property {boolean} [showReference] - Afficher la référence (défaut : false)
 * @property {boolean} [showActions] - Afficher le menu d’actions (défaut : false – la caisse est souvent non modifiable)
 *
 * @example
 * ```ts
 * const config: CaisseColumnConfig = {
 *   showDate: true,
 *   showType: true,
 *   showMontant: true,
 *   showSoldeApres: true,
 *   showDescription: true,
 *   showReference: true,
 *   showActions: false,
 * };
 * ```
 */
export interface CaisseColumnConfig {
  showDate?: boolean;
  showType?: boolean;
  showMontant?: boolean;
  showSoldeApres?: boolean;
  showDescription?: boolean;
  showReference?: boolean;
  showActions?: boolean;
}

/**
 * Callbacks d’actions sur une ligne du tableau de caisse.
 *
 * @interface CaisseTableActions
 * @property {(mouvement: MouvementCaisse) => void} [onView] - Voir le détail (lecture seule, pas d’édition)
 * @property {(mouvement: MouvementCaisse) => void} [onPrint] - Imprimer le reçu / justificatif
 *
 * @example
 * ```ts
 * const actions: CaisseTableActions = {
 *   onView: (m) => navigate(`/caisse/${m.id}`),
 *   onPrint: (m) => window.print(),
 * };
 * ```
 */
export interface CaisseTableActions {
  onView?: (mouvement: MouvementCaisse) => void;
  onPrint?: (mouvement: MouvementCaisse) => void;
}

/**
 * Enrichissements optionnels pour injecter des données calculées
 * sans modifier le modèle principal `MouvementCaisse`.
 *
 * @interface CaisseEnrichments
 * @property {(mouvement: MouvementCaisse) => string} [getVehiculeLibelle] - Retourne le libellé du véhicule associé (si applicable)
 * @property {(mouvement: MouvementCaisse) => string} [getNomCandidat] - Nom du candidat lié au mouvement (si applicable)
 * @property {(mouvement: MouvementCaisse) => string} [getCandidatAvatarUrl] - Avatar du candidat lié au mouvement (si applicable)
 * @property {(mouvement: MouvementCaisse) => string} [getCandidatInitials] - Initiaux du candidat lié au mouvement (si applicable)
 */
export interface CaisseEnrichments {
  getVehiculeLibelle?: (mouvement: MouvementCaisse) => string;
  getNomCandidat?: (mouvement: MouvementCaisse) => string;
  getCandidatAvatarUrl?: (mouvement: MouvementCaisse) => string;
  getCandidatInitials?: (mouvement: MouvementCaisse) => string;
}

/**
 * Options complètes pour la génération des colonnes du tableau de caisse.
 *
 * @interface CaisseColumnsOptions
 * @property {CaisseColumnConfig} [columnConfig] - Surcharge de la visibilité des colonnes
 * @property {CaisseEnrichments} [enrichments] - Enrichissements optionnels pour injecter des données calculées
 * @property {CaisseTableActions} [actions] - Callbacks d’actions sur les lignes (généralement limités)
 * @property {'admin' | 'secretaire'} [variant] - Profil utilisateur
 *   - `admin` : affiche toutes les colonnes (y compris références et actions)
 *   - `secretaire` : colonnes standard (date, type, montant, solde, description)
 *
 * @example
 * ```ts
 * const options: CaisseColumnsOptions = {
 *   variant: 'secretaire',
 *   columnConfig: { showReference: true },
 *   actions: { onView: (m) => console.log(m) },
 * };
 * const columns = getCaisseColumns(options);
 * ```
 */
export interface CaisseColumnsOptions {
  columnConfig?: CaisseColumnConfig;
  actions?: CaisseTableActions;
  enrichments?: CaisseEnrichments;
  variant?: 'admin' | 'secretaire';
}

// ============================================================
// PARAMÈTRES & ENTRÉES (DTOs)
// ============================================================

/**
 * Paramètres de filtrage et pagination pour la liste des mouvements de caisse.
 *
 * @interface CaisseListParams
 * @description
 * Utilisé par `CaisseApi.getAll()` et le canal IPC `caisse:getAll`.
 *
 * @property {number} [page=1] - Page courante (1-indexed)
 * @property {number} [limit=20] - Nombre d'éléments par page (max 200)
 * @property {string} [search] - Recherche textuelle : description, référence
 * @property {TypeMouvement} [type] - Filtrer par type (ENTREE ou SORTIE)
 * @property {string} [dateDebut] - Date de début (ISO 8601)
 * @property {string} [dateFin] - Date de fin (ISO 8601)
 * @property {'today' | 'week' | 'month' | 'all'} [period] - Période prédéfinie
 * @property {'date' | 'montant' | 'solde'} [sortBy='date'] - Champ de tri
 * @property {'asc' | 'desc'} [sortOrder='desc'] - Sens du tri
 */
export interface CaisseListParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: TypeMouvement;
  dateDebut?: string;
  dateFin?: string;
  period?: 'today' | 'week' | 'month' | 'all';
  sortBy?: 'date' | 'montant' | 'solde';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================
// RÉPONSES DE L'API
// ============================================================

/**
 * Réponse paginée pour la liste des mouvements de caisse.
 *
 * @interface CaissePaginatedResponse
 * @property {MouvementCaisse[]} mouvements - Mouvements de la page (avec enrichissements optionnels)
 * @property {number} total - Nombre total de mouvements
 * @property {number} page - Page courante
 * @property {number} limit - Limite par page
 * @property {number} totalPages - Nombre total de pages
 */
export interface CaissePaginatedResponse {
  mouvements: MouvementCaisse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Statistiques étendues de la caisse pour le dashboard.
 *
 * @interface CaisseStatsExtended
 * @extends CaisseStats
 * @property {number} soldeMoisPrecedent - Solde à la fin du mois précédent
 * @property {number} evolutionSolde - Évolution du solde (en %)
 */
export interface CaisseStatsExtended extends CaisseStats {
  soldeMoisPrecedent: number;
  evolutionSolde: number;
}

/**
 * Données des sparklines pour la caisse (12 derniers mois).
 *
 * @interface CaisseSparklineData
 * @property {{ values: number[]; labels?: string[] }} soldeSparkline - Solde en fin de mois
 * @property {{ values: number[]; labels?: string[] }} entreesSparkline - Entrées par mois
 * @property {{ values: number[]; labels?: string[] }} sortiesSparkline - Sorties par mois
 * @property {{ values: number[]; labels?: string[] }} fluxNetSparkline - Flux net (entrées - sorties) par mois
 */
export interface CaisseSparklineData {
  soldeSparkline: { values: number[]; labels?: string[] };
  entreesSparkline: { values: number[]; labels?: string[] };
  sortiesSparkline: { values: number[]; labels?: string[] };
  fluxNetSparkline: { values: number[]; labels?: string[] };
}

// ============================================================
// API WINDOW — CaisseApi
// ============================================================

/**
 * Interface de l'API caisse exposée au renderer via `window.api.caisse`.
 *
 * @interface CaisseApi
 * @description
 * Toutes les méthodes sont asynchrones et communiquent via IPC Electron.
 *
 * ## Canaux IPC utilisés
 * | Méthode               | Canal IPC                     |
 * |-----------------------|-------------------------------|
 * | getAll                | caisse:getAll                 |
 * | getStats              | caisse:getStats               |
 * | getTrends             | caisse:getTrends              |
 * | getSparklines         | caisse:getSparklines          |
 * | exportMouvements      | caisse:exportMouvements       |
 */
export interface CaisseApi {
  /**
   * Récupère la liste paginée des mouvements de caisse avec filtres.
   * @param params - Pagination, filtres et tri
   * @returns Liste paginée
   */
  getAll: (params?: CaisseListParams) => Promise<CaissePaginatedResponse>;

  /**
   * Récupère les statistiques agrégées de la caisse.
   * @returns Métriques étendues
   */
  getStats: () => Promise<CaisseStatsExtended>;

  /**
   * Récupère les tendances évolutives (mois vs précédent).
   * @returns Variations en pourcentage
   */
  getTrends: () => Promise<CaisseTrends>;

  /**
   * Récupère les données des sparklines pour les 12 derniers mois.
   * @returns Sparklines (solde, entrées, sorties, flux net)
   */
  getSparklines: () => Promise<CaisseSparklineData>;

  /**
   * Exporte l’historique des mouvements (CSV, Excel, PDF).
   * @param params - Filtres pour l’export
   * @returns Chemin du fichier exporté
   */
  exportMouvements: (
    params?: CaisseListParams
  ) => Promise<{ success: boolean; path: string; message?: string }>;
}
