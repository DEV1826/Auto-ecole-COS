// src/types/moniteurs.types.ts

/**
 * @module types/moniteurs.types
 * @description
 * Types complets pour la gestion des moniteurs (instructeurs) dans l’auto‑école COS.
 *
 * Ce module exporte :
 * - `Moniteur` : le modèle principal
 * - `MoniteursStats` : métriques agrégées (actifs, heures de leçons)
 * - `MoniteursTrends` : évolutions temporelles
 * - `MoniteursColumnConfig` : contrôle de visibilité des colonnes
 * - `MoniteursTableActions` : actions sur les lignes
 * - `MoniteursColumnsOptions` : options pour la génération des colonnes
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @see {@link Lecon} – Leçons données par le moniteur
 */

import type { Lecon } from '@/types/planning.types';

// ============================================================
// MODÈLE PRINCIPAL
// ============================================================

/**
 * Moniteur (instructeur) – correspond au modèle Prisma `Moniteur`.
 *
 * @interface Moniteur
 * @description
 * Un moniteur est un employé de l’auto‑école chargé des leçons de conduite.
 * Il peut avoir une spécialité (permis B, moto, etc.) et une date d’embauche.
 *
 * @property {number} id - Identifiant unique
 * @property {string} nom - Nom de famille
 * @property {string} prenom - Prénom
 * @property {string | null} email - Adresse email (unique)
 * @property {string | null} telephone - Numéro de téléphone
 * @property {string | null} specialite - Domaine d’enseignement (ex: "Permis B", "Moto")
 * @property {Date | string | null} dateEmbauche - Date d’embauche
 * @property {boolean} actif - Statut actif (peut être désactivé pour congé ou départ)
 * @property {Date | string} createdAt - Date de création
 * @property {Date | string} updatedAt - Dernière modification
 *
 * // Relations
 * @property {Lecon[]} [lecons] - Leçons données par ce moniteur
 *
 * @example
 * ```ts
 * const moniteur: Moniteur = {
 *   id: 1,
 *   nom: 'Dubois',
 *   prenom: 'Marc',
 *   email: 'marc.dubois@cos.com',
 *   telephone: '691234567',
 *   specialite: 'Permis B, Conduite accompagnée',
 *   dateEmbauche: '2023-01-15',
 *   actif: true,
 *   createdAt: '2023-01-15T08:00:00Z',
 *   updatedAt: '2023-01-15T08:00:00Z',
 * };
 * ```
 */
export interface Moniteur {
  id: number;
  nom: string;
  prenom: string;
  email?: string | null;
  telephone?: string | null;
  specialite?: string | null;
  dateEmbauche?: Date | string | null;
  actif: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;

  // Relation
  lecons?: Lecon[];
}

// ============================================================
// STATISTIQUES POUR LE DASHBOARD
// ============================================================

/**
 * Métriques statistiques pour les moniteurs.
 *
 * @interface MoniteursStats
 * @property {number} totalMoniteurs - Nombre total de moniteurs (tous statuts)
 * @property {number} actifs - Nombre de moniteurs actifs
 * @property {number} inactifs - Nombre de moniteurs inactifs
 * @property {number} totalHeuresLeçons - Nombre total d’heures de leçons données (cumul)
 * @property {number} moyenneHeuresParMoniteur - Moyenne d’heures par moniteur actif
 */
export interface MoniteursStats {
  totalMoniteurs: number;
  actifs: number;
  inactifs: number;
  totalHeuresLeçons: number;
  moyenneHeuresParMoniteur: number;
}

/**
 * Tendances évolutives pour les moniteurs.
 *
 * @interface MoniteursTrends
 * @property {number} totalMoniteurs - Variation (en pourcentage ou absolu)
 * @property {number} actifs - Variation des actifs
 * @property {number} totalHeuresLeçons - Variation des heures
 */
export interface MoniteursTrends {
  totalMoniteurs: number;
  actifs: number;
  totalHeuresLeçons: number;
}

// ============================================================
// CONFIGURATION DES COLONNES DU TABLEAU DES MONITEURS
// ============================================================

/**
 * Configuration de visibilité des colonnes dans le tableau des moniteurs.
 *
 * @interface MoniteursColumnConfig
 * @property {boolean} [showFullName] - Afficher le nom complet (défaut : true)
 * @property {boolean} [showEmail] - Afficher l’email (défaut : true)
 * @property {boolean} [showTelephone] - Afficher le téléphone (défaut : true)
 * @property {boolean} [showSpecialite] - Afficher la spécialité (défaut : true)
 * @property {boolean} [showDateEmbauche] - Afficher la date d’embauche (défaut : true)
 * @property {boolean} [showActif] - Afficher le statut actif (badge) (défaut : true)
 * @property {boolean} [showLeconsCount] - Afficher le nombre de leçons données (défaut : false)
 * @property {boolean} [showActions] - Afficher le menu d’actions (défaut : true)
 */
export interface MoniteursColumnConfig {
  showFullName?: boolean;
  showEmail?: boolean;
  showTelephone?: boolean;
  showSpecialite?: boolean;
  showDateEmbauche?: boolean;
  showActif?: boolean;
  showLeconsCount?: boolean;
  showActions?: boolean;
}

/**
 * Callbacks d’actions sur une ligne du tableau des moniteurs.
 *
 * @interface MoniteursTableActions
 * @property {(moniteur: Moniteur) => void} [onView] - Voir le détail du moniteur
 * @property {(moniteur: Moniteur) => void} [onEdit] - Modifier le moniteur
 * @property {(moniteur: Moniteur) => Promise<void>} [onDelete] - Désactiver le moniteur
 * @property {(moniteur: Moniteur) => void} [onViewPlanning] - Voir le planning du moniteur
 */
export interface MoniteursTableActions {
  onView?: (moniteur: Moniteur) => void;
  onEdit?: (moniteur: Moniteur) => void;
  onDelete?: (moniteur: Moniteur) => Promise<void>;
  onViewPlanning?: (moniteur: Moniteur) => void;
}

/**
 * Enrichissements optionnels pour injecter des données calculées
 * sans modifier le modèle principal `Moniteur`.
 *
 * @interface MoniteursEnrichments
 * @property {(moniteur: Moniteur) => number} [getLeconsCount] - Nombre de leçons données
 * @property {(moniteur: Moniteur) => number} [getHeuresTotales] - Nombre total d’heures de leçons
 * @property {(moniteur: Moniteur) => string} [getAvatarUrl] - URL de l’avatar (si existant)
 * @property {(moniteur: Moniteur) => string} [getInitials] - Initiales (fallback pour avatar)
 */
export interface MoniteursEnrichments {
  getLeconsCount?: (moniteur: Moniteur) => number;
  getHeuresTotales?: (moniteur: Moniteur) => number;
  getAvatarUrl?: (moniteur: Moniteur) => string;
  getInitials?: (moniteur: Moniteur) => string;
}

/**
 * Options complètes pour la génération des colonnes du tableau des moniteurs.
 *
 * @interface MoniteursColumnsOptions
 * @property {MoniteursColumnConfig} [columnConfig] - Surcharge de la visibilité des colonnes
 * @property {MoniteursTableActions} [actions] - Callbacks d’actions sur les lignes
 * @property {'admin' | 'secretaire'} [variant] - Profil utilisateur
 *   - `admin` : toutes les colonnes (gestion RH, leçons)
 *   - `secretaire` : colonnes essentielles (nom, spécialité, contact, actif)
 */
export interface MoniteursColumnsOptions {
  columnConfig?: MoniteursColumnConfig;
  actions?: MoniteursTableActions;
  enrichments?: MoniteursEnrichments;
  variant?: 'admin' | 'secretaire';
}

// ============================================================
// PARAMÈTRES & ENTRÉES (DTOs)
// ============================================================

/**
 * Paramètres de filtrage et pagination pour la liste des moniteurs.
 *
 * @interface MoniteursListParams
 * @description
 * Utilisé par `MoniteursApi.getAll()` et le canal IPC `moniteurs:getAll`.
 *
 * @property {number} [page=1] - Page courante (1-indexed)
 * @property {number} [limit=20] - Nombre d'éléments par page (max 200)
 * @property {string} [search] - Recherche textuelle : nom, prénom, email
 * @property {boolean} [actif] - Filtrer par statut actif/inactif
 * @property {'createdAt' | 'dateEmbauche'} [sortBy='createdAt'] - Champ de tri
 * @property {'asc' | 'desc'} [sortOrder='desc'] - Sens du tri
 */
export interface MoniteursListParams {
  page?: number;
  limit?: number;
  search?: string;
  actif?: boolean;
  sortBy?: 'createdAt' | 'dateEmbauche';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Données d'entrée pour créer un nouveau moniteur.
 *
 * @interface CreateMoniteurInput
 * @description
 * Les champs `nom` et `prenom` sont obligatoires.
 *
 * @property {string} nom - Nom de famille
 * @property {string} prenom - Prénom
 * @property {string} [email] - Adresse email (doit être unique)
 * @property {string} [telephone] - Numéro de téléphone
 * @property {string} [specialite] - Spécialité (ex: "Permis B")
 * @property {Date|string} [dateEmbauche] - Date d’embauche (défaut: maintenant)
 * @property {boolean} [actif=true] - Statut actif
 */
export interface CreateMoniteurInput {
  nom: string;
  prenom: string;
  email?: string | null;
  telephone?: string | null;
  specialite?: string | null;
  dateEmbauche?: Date | string;
  actif?: boolean;
}

/**
 * Données d'entrée pour mettre à jour un moniteur (patch partiel).
 *
 * @interface UpdateMoniteurInput
 * @description
 * Tous les champs sont optionnels.
 */
export interface UpdateMoniteurInput {
  nom?: string;
  prenom?: string;
  email?: string | null;
  telephone?: string | null;
  specialite?: string | null;
  dateEmbauche?: Date | string | null;
  actif?: boolean;
}

// ============================================================
// RÉPONSES DE L'API
// ============================================================

/**
 * Réponse paginée pour la liste des moniteurs.
 *
 * @interface MoniteursPaginatedResponse
 * @property {Moniteur[]} moniteurs - Moniteurs de la page (avec leçons si demandées)
 * @property {number} total - Nombre total de moniteurs
 * @property {number} page - Page courante
 * @property {number} limit - Limite par page
 * @property {number} totalPages - Nombre total de pages
 */
export interface MoniteursPaginatedResponse {
  moniteurs: Moniteur[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Statistiques étendues des moniteurs pour le dashboard.
 *
 * @interface MoniteursStatsExtended
 * @extends MoniteursStats
 * @property {number} heuresMois - Heures de leçons données dans le mois en cours
 * @property {number} moyenneHeuresParMoniteurMois - Moyenne d’heures par moniteur actif ce mois
 * @property {number} evolutionActifs - Évolution du nombre d’actifs (en %)
 */
export interface MoniteursStatsExtended extends MoniteursStats {
  heuresMois: number;
  moyenneHeuresParMoniteurMois: number;
  evolutionActifs: number;
}

/**
 * Données des sparklines pour les moniteurs (12 derniers mois).
 *
 * @interface MoniteursSparklineData
 * @property {{ values: number[]; labels?: string[] }} actifsSparkline - Nombre d’actifs par mois
 * @property {{ values: number[]; labels?: string[] }} heuresSparkline - Heures de leçons par mois
 * @property {{ values: number[]; labels?: string[] }} moyenneHeuresSparkline - Moyenne d’heures par moniteur actif
 */
export interface MoniteursSparklineData {
  actifsSparkline: { values: number[]; labels?: string[] };
  heuresSparkline: { values: number[]; labels?: string[] };
  moyenneHeuresSparkline: { values: number[]; labels?: string[] };
}

// ============================================================
// API WINDOW — MoniteursApi
// ============================================================

/**
 * Interface de l'API moniteurs exposée au renderer via `window.api.moniteurs`.
 *
 * @interface MoniteursApi
 * @description
 * Toutes les méthodes sont asynchrones et communiquent via IPC Electron.
 *
 * ## Canaux IPC utilisés
 * | Méthode               | Canal IPC                         |
 * |-----------------------|-----------------------------------|
 * | getAll                | moniteurs:getAll                  |
 * | getById               | moniteurs:getById                 |
 * | create                | moniteurs:create                  |
 * | update                | moniteurs:update                  |
 * | delete                | moniteurs:delete                  |
 * | getStats              | moniteurs:getStats                |
 * | getTrends             | moniteurs:getTrends               |
 * | getSparklines         | moniteurs:getSparklines           |
 */
export interface MoniteursApi {
  /**
   * Récupère la liste paginée des moniteurs avec filtres.
   * @param params - Pagination, filtres et tri
   * @returns Liste paginée
   */
  getAll: (params?: MoniteursListParams) => Promise<MoniteursPaginatedResponse>;

  /**
   * Récupère un moniteur par son identifiant (avec ses leçons).
   * @param id - Identifiant du moniteur
   * @returns Moniteur complet
   */
  getById: (id: number) => Promise<Moniteur>;

  /**
   * Crée un nouveau moniteur.
   * @param data - Données du moniteur
   * @returns Moniteur créé
   */
  create: (data: CreateMoniteurInput) => Promise<Moniteur>;

  /**
   * Met à jour un moniteur existant (patch partiel).
   * @param id - Identifiant du moniteur
   * @param data - Champs à modifier
   * @returns Moniteur mis à jour
   */
  update: (id: number, data: UpdateMoniteurInput) => Promise<Moniteur>;

  /**
   * Désactive (soft delete) un moniteur.
   * @param id - Identifiant du moniteur
   * @returns Résultat de l'opération
   */
  delete: (id: number) => Promise<{ success: boolean; message: string }>;

  /**
   * Récupère les statistiques agrégées des moniteurs.
   * @returns Métriques étendues
   */
  getStats: () => Promise<MoniteursStatsExtended>;

  /**
   * Récupère les tendances évolutives (mois vs précédent).
   * @returns Variations en pourcentage
   */
  getTrends: () => Promise<MoniteursTrends>;

  /**
   * Récupère les données des sparklines pour les 12 derniers mois.
   * @returns Sparklines (actifs, heures, moyenne)
   */
  getSparklines: () => Promise<MoniteursSparklineData>;
}
