// src/types/vehicules.types.ts

/**
 * @module types/vehicules.types
 * @description
 * Types complets pour la gestion des véhicules et de leurs entretiens dans l’auto‑école COS.
 *
 * Ce module exporte :
 * - `Vehicule` : le modèle principal du véhicule
 * - `Entretien` : historique des entretiens d’un véhicule
 * - `VehiculesStats` : métriques agrégées (disponibilité, kilométrage)
 * - `VehiculesStatsExtended` : métriques étendues (incluant tendances)
 * - `VehiculesTrends` : évolutions temporelles
 * - `VehiculesSparklineData` : données pour les graphiques sparkline
 * - `VehiculesColumnConfig` : contrôle de visibilité des colonnes dans les tableaux
 * - `VehiculesTableActions` : callbacks d’actions sur les lignes
 * - `VehiculesEnrichments` : enrichissements pour affichage (logo, révision due)
 * - `VehiculesColumnsOptions` : options pour la génération des colonnes
 * - `VehiculesListParams`, `CreateVehiculeInput`, `UpdateVehiculeInput` : DTOs
 * - `VehiculesPaginatedResponse` : réponse paginée
 * - `VehiculesApi` : interface API exposée au renderer via `window.api.vehicules`
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @see {@link CategoriePermis} – Catégorie de permis (A, B, C, D, BE)
 * @see {@link StatutVehicule} – DISPONIBLE, EN_LECON, EN_ENTRETIEN, HORS_SERVICE
 * @see {@link Lecon} – Leçons utilisant le véhicule
 * @see {@link Depense} – Dépenses liées (carburant, entretien)
 */

import type { CategoriePermis, StatutVehicule } from '@/types/enums';
import type { Lecon } from '@/types/planning.types';
import type { Depense } from '@/types/depenses.types';

// ============================================================
// MODÈLE ENTRETIEN
// ============================================================

/**
 * Entretien d’un véhicule – correspond au modèle Prisma `Entretien`.
 *
 * @interface Entretien
 * @description
 * Enregistre les opérations de maintenance (vidange, freins, révision, etc.)
 * avec le kilométrage au moment de l’intervention et le kilométrage recommandé
 * pour le prochain entretien.
 *
 * @property {number} id - Identifiant unique
 * @property {string} type - Type d’entretien (ex: "vidange", "freins", "révision générale")
 * @property {string | null} description - Détails supplémentaires
 * @property {number | null} cout - Coût de l’entretien (FCFA)
 * @property {number | null} kilometre - Kilométrage au moment de l’entretien
 * @property {Date | string} date - Date de l’entretien
 * @property {number | null} prochainKm - Kilométrage recommandé pour le prochain entretien
 * @property {Date | string} createdAt - Horodatage de création
 * @property {number} vehiculeId - Identifiant du véhicule concerné
 *
 * // Relation
 * @property {Vehicule} [vehicule] - Véhicule associé
 *
 * @example
 * ```ts
 * const entretien: Entretien = {
 *   id: 1,
 *   type: 'vidange',
 *   description: 'Vidange moteur + filtre à huile',
 *   cout: 25000,
 *   kilometre: 12500,
 *   date: '2024-03-10T10:00:00Z',
 *   prochainKm: 20000,
 *   createdAt: '2024-03-10T10:00:00Z',
 *   vehiculeId: 5,
 * };
 * ```
 */
export interface Entretien {
  id: number;
  type: string;
  description?: string | null;
  cout?: number | null;
  kilometre?: number | null;
  date: Date | string;
  prochainKm?: number | null;
  createdAt: Date | string;
  vehiculeId: number;

  // Relation
  vehicule?: Vehicule;
}

// ============================================================
// MODÈLE VÉHICULE
// ============================================================

/**
 * Vehicule – correspond au modèle Prisma `Vehicule`.
 *
 * @interface Vehicule
 * @description
 * Représente un véhicule du parc automobile (voiture, moto, camion).
 * Le kilométrage est mis à jour régulièrement.
 *
 * @property {number} id - Identifiant unique
 * @property {string} immatriculation - Plaque d’immatriculation (unique)
 * @property {string} marque - Marque du véhicule
 * @property {string} modele - Modèle
 * @property {number} annee - Année de fabrication
 * @property {CategoriePermis} categorie - Catégorie de permis requise
 * @property {number} kilometrage - Kilométrage actuel
 * @property {Date | string | null} dateAcquisition - Date d’achat / mise en service
 * @property {Date | string | null} dateDerniereRevision - Date de la dernière révision
 * @property {number | null} prochaineRevisionKm - Kilométrage recommandé pour la prochaine révision
 * @property {StatutVehicule} statut - Disponibilité actuelle
 * @property {Date | string} createdAt - Date de création
 * @property {Date | string} updatedAt - Dernière modification
 *
 * // Relations
 * @property {Lecon[]} [lecons] - Leçons utilisant ce véhicule
 * @property {Entretien[]} [entretiens] - Historique des entretiens
 * @property {Depense[]} [depenses] - Dépenses liées (carburant, réparations)
 *
 * @example
 * ```ts
 * const vehicule: Vehicule = {
 *   id: 1,
 *   immatriculation: 'LT-123-AB',
 *   marque: 'Toyota',
 *   modele: 'Yaris',
 *   annee: 2022,
 *   categorie: 'B',
 *   kilometrage: 12500,
 *   dateAcquisition: '2022-06-01',
 *   dateDerniereRevision: '2024-01-10',
 *   prochaineRevisionKm: 25000,
 *   statut: 'DISPONIBLE',
 *   createdAt: '2022-06-01T08:00:00Z',
 *   updatedAt: '2024-01-10T08:00:00Z',
 * };
 * ```
 */
export interface Vehicule {
  id: number;
  immatriculation: string;
  marque: string;
  modele: string;
  annee: number;
  categorie: CategoriePermis;
  kilometrage: number;
  dateAcquisition?: Date | string | null;
  dateDerniereRevision?: Date | string | null;
  prochaineRevisionKm?: number | null;
  statut: StatutVehicule;
  createdAt: Date | string;
  updatedAt: Date | string;

  // Relations
  lecons?: Lecon[];
  entretiens?: Entretien[];
  depenses?: Depense[];
}

// ============================================================
// STATISTIQUES POUR LE DASHBOARD
// ============================================================

/**
 * Métriques statistiques pour les véhicules.
 *
 * @interface VehiculesStats
 * @property {number} totalVehicules - Nombre total de véhicules dans le parc
 * @property {number} disponibles - Nombre de véhicules disponibles
 * @property {number} enLecon - Nombre de véhicules actuellement en leçon
 * @property {number} enEntretien - Nombre de véhicules en entretien
 * @property {number} horsService - Nombre de véhicules hors service
 * @property {number} kilometrageMoyen - Kilométrage moyen de l’ensemble du parc
 * @property {number} entretiensAnnee - Nombre d’entretiens réalisés dans l’année
 */
export interface VehiculesStats {
  totalVehicules: number;
  disponibles: number;
  enLecon: number;
  enEntretien: number;
  horsService: number;
  kilometrageMoyen: number;
  entretiensAnnee: number;
}

/**
 * Métriques étendues pour les véhicules (inclut les totaux pour la période).
 *
 * @interface VehiculesStatsExtended
 * @extends VehiculesStats
 * @property {number} totalEntretiens - Total des entretiens de l’année
 * @property {number} coutEntretiensAnnee - Coût total des entretiens de l’année (FCFA)
 * @property {number} kilometrageTotal - Kilométrage cumulé du parc
 * @property {number} evolutionDisponibles - Évolution du nombre de disponibles (en %)
 */
export interface VehiculesStatsExtended extends VehiculesStats {
  totalEntretiens: number;
  coutEntretiensAnnee: number;
  kilometrageTotal: number;
  evolutionDisponibles: number;
}

/**
 * Tendances évolutives pour les véhicules.
 *
 * @interface VehiculesTrends
 * @property {number} totalVehicules - Variation (en pourcentage ou absolu)
 * @property {number} disponibles - Variation des disponibles
 * @property {number} kilometrageMoyen - Variation du kilométrage moyen
 * @property {number} entretiensAnnee - Variation du nombre d’entretiens
 * @property {number} coutEntretiensAnnee - Variation du coût des entretiens
 */
export interface VehiculesTrends {
  totalVehicules: number;
  disponibles: number;
  kilometrageMoyen: number;
  entretiensAnnee: number;
  coutEntretiensAnnee: number;
}

/**
 * Données des sparklines pour les véhicules (12 derniers mois).
 *
 * @interface VehiculesSparklineData
 * @property {{ values: number[]; labels?: string[] }} disponiblesSparkline - Nombre de disponibles par mois
 * @property {{ values: number[]; labels?: string[] }} enLeconSparkline - Nombre de véhicules en leçon par mois
 * @property {{ values: number[]; labels?: string[] }} entretiensSparkline - Nombre d’entretiens par mois
 * @property {{ values: number[]; labels?: string[] }} kilometrageSparkline - Kilométrage moyen par mois
 */
export interface VehiculesSparklineData {
  disponiblesSparkline: { values: number[]; labels?: string[] };
  enLeconSparkline: { values: number[]; labels?: string[] };
  entretiensSparkline: { values: number[]; labels?: string[] };
  kilometrageSparkline: { values: number[]; labels?: string[] };
}

// ============================================================
// CONFIGURATION DES COLONNES DU TABLEAU DES VÉHICULES
// ============================================================

/**
 * Configuration de visibilité des colonnes dans le tableau des véhicules.
 *
 * @interface VehiculesColumnConfig
 * @property {boolean} [showImmatriculation] - Afficher l’immatriculation (défaut : true)
 * @property {boolean} [showMarqueModele] - Afficher marque + modèle (défaut : true)
 * @property {boolean} [showCategorie] - Afficher la catégorie de permis (défaut : true)
 * @property {boolean} [showKilometrage] - Afficher le kilométrage (défaut : true)
 * @property {boolean} [showStatut] - Afficher le statut (badge) (défaut : true)
 * @property {boolean} [showProchaineRevision] - Afficher la prochaine révision (km) (défaut : true)
 * @property {boolean} [showActions] - Afficher le menu d’actions (défaut : true)
 */
export interface VehiculesColumnConfig {
  showImmatriculation?: boolean;
  showMarqueModele?: boolean;
  showCategorie?: boolean;
  showKilometrage?: boolean;
  showStatut?: boolean;
  showProchaineRevision?: boolean;
  showActions?: boolean;
}

/**
 * Callbacks d’actions sur une ligne du tableau des véhicules.
 *
 * @interface VehiculesTableActions
 * @property {(vehicule: Vehicule) => void} [onView] - Voir le détail du véhicule
 * @property {(vehicule: Vehicule) => void} [onEdit] - Modifier le véhicule
 * @property {(vehicule: Vehicule) => Promise<void>} [onDelete] - Supprimer (désactiver) le véhicule
 * @property {(vehicule: Vehicule) => void} [onViewEntretiens] - Voir l’historique des entretiens
 * @property {(vehicule: Vehicule) => void} [onRecordMaintenance] - Enregistrer un entretien
 * @property {(vehicule: Vehicule) => void} [onUpdateKilometrage] - Mettre à jour le kilométrage
 */
export interface VehiculesTableActions {
  onView?: (vehicule: Vehicule) => void;
  onEdit?: (vehicule: Vehicule) => void;
  onDelete?: (vehicule: Vehicule) => Promise<void>;
  onViewEntretiens?: (vehicule: Vehicule) => void;
  onRecordMaintenance?: (vehicule: Vehicule) => void;
  onUpdateKilometrage?: (vehicule: Vehicule) => void;
}

/**
 * Enrichissements optionnels pour injecter des données calculées
 * ou des ressources visuelles sans modifier `Vehicule`.
 *
 * @interface VehiculesEnrichments
 * @property {(vehicule: Vehicule) => string} [getMarqueModeleComplet] - Marque + modèle (ex: "Toyota Yaris")
 * @property {(vehicule: Vehicule) => string} [getAvatarUrl] - URL du logo de la marque (ou image par défaut)
 * @property {(vehicule: Vehicule) => string} [getInitials] - Initiales pour fallback (ex: "TY")
 * @property {(vehicule: Vehicule) => number} [getProchaineRevisionKm] - Kilométrage recommandé pour la prochaine révision
 * @property {(vehicule: Vehicule) => boolean} [isRevisionDue] - Vrai si la révision est due (kilométrage >= prochaineRevisionKm)
 */
export interface VehiculesEnrichments {
  getMarqueModeleComplet?: (vehicule: Vehicule) => string;
  getAvatarUrl?: (vehicule: Vehicule) => string;
  getInitials?: (vehicule: Vehicule) => string;
  getProchaineRevisionKm?: (vehicule: Vehicule) => number;
  isRevisionDue?: (vehicule: Vehicule) => boolean;
}

/**
 * Options complètes pour la génération des colonnes du tableau des véhicules.
 *
 * @interface VehiculesColumnsOptions
 * @property {VehiculesColumnConfig} [columnConfig] - Surcharge de la visibilité des colonnes
 * @property {VehiculesTableActions} [actions] - Callbacks d’actions sur les lignes
 * @property {VehiculesEnrichments} [enrichments] - Enrichissements optionnels pour les données affichées
 * @property {'admin' | 'secretaire'} [variant] - Profil utilisateur
 *   - `admin` : toutes les colonnes (immatriculation, marque/modèle, catégorie, km, statut, révision, actions)
 *   - `secretaire` : colonnes essentielles (immatriculation, marque/modèle, statut, actions)
 */
export interface VehiculesColumnsOptions {
  columnConfig?: VehiculesColumnConfig;
  actions?: VehiculesTableActions;
  enrichments?: VehiculesEnrichments;
  variant?: 'admin' | 'secretaire';
}

// ============================================================
// PARAMÈTRES & ENTRÉES (DTOs)
// ============================================================

/**
 * Paramètres de filtrage et pagination pour la liste des véhicules.
 *
 * @interface VehiculesListParams
 * @description
 * Utilisé par `VehiculesApi.getAll()` et le canal IPC `vehicules:getAll`.
 *
 * @property {number} [page=1] - Page courante (1-indexed)
 * @property {number} [limit=20] - Nombre d'éléments par page (max 200)
 * @property {string} [search] - Recherche textuelle : immatriculation, marque, modèle
 * @property {CategoriePermis} [categorie] - Filtrer par catégorie de permis
 * @property {StatutVehicule} [statut] - Filtrer par statut
 * @property {string} [dateDebut] - Date de début (ISO 8601) pour `dateAcquisition`
 * @property {string} [dateFin] - Date de fin (ISO 8601)
 * @property {'dateAcquisition' | 'kilometrage' | 'createdAt'} [sortBy='createdAt'] - Champ de tri
 * @property {'asc' | 'desc'} [sortOrder='desc'] - Sens du tri
 */
export interface VehiculesListParams {
  page?: number;
  limit?: number;
  search?: string;
  categorie?: CategoriePermis;
  statut?: StatutVehicule;
  dateDebut?: string;
  dateFin?: string;
  sortBy?: 'dateAcquisition' | 'kilometrage' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Données d'entrée pour créer un nouveau véhicule.
 *
 * @interface CreateVehiculeInput
 * @description
 * Tous les champs requis doivent être fournis.
 *
 * @property {string} immatriculation - Plaque d’immatriculation (unique)
 * @property {string} marque - Marque du véhicule
 * @property {string} modele - Modèle
 * @property {number} annee - Année de fabrication
 * @property {CategoriePermis} categorie - Catégorie de permis requise
 * @property {number} [kilometrage=0] - Kilométrage initial
 * @property {string} [dateAcquisition] - Date d’acquisition (ISO 8601, par défaut maintenant)
 * @property {string} [dateDerniereRevision] - Date de la dernière révision (optionnelle)
 * @property {number} [prochaineRevisionKm] - Kilométrage recommandé pour la prochaine révision
 * @property {StatutVehicule} [statut=DISPONIBLE] - Statut initial
 *
 * @example
 * ```ts
 * const input: CreateVehiculeInput = {
 *   immatriculation: 'LT-789-XY',
 *   marque: 'Renault',
 *   modele: 'Clio',
 *   annee: 2023,
 *   categorie: 'B',
 *   kilometrage: 1500,
 *   dateAcquisition: '2023-09-01',
 *   statut: 'DISPONIBLE',
 * };
 * const vehicule = await window.api.vehicules.create(input);
 * ```
 */
export interface CreateVehiculeInput {
  immatriculation: string;
  marque: string;
  modele: string;
  annee: number;
  categorie: CategoriePermis;
  kilometrage?: number;
  dateAcquisition?: string;
  dateDerniereRevision?: string | null;
  prochaineRevisionKm?: number | null;
  statut?: StatutVehicule;
}

/**
 * Données d'entrée pour mettre à jour un véhicule (patch partiel).
 *
 * @interface UpdateVehiculeInput
 * @description
 * Tous les champs sont optionnels.
 */
export interface UpdateVehiculeInput {
  immatriculation?: string;
  marque?: string;
  modele?: string;
  annee?: number;
  categorie?: CategoriePermis;
  kilometrage?: number;
  dateAcquisition?: string | null;
  dateDerniereRevision?: string | null;
  prochaineRevisionKm?: number | null;
  statut?: StatutVehicule;
}

/**
 * Données d'entrée pour enregistrer un entretien.
 *
 * @interface CreateEntretienInput
 * @property {string} type - Type d’entretien (ex: "vidange")
 * @property {string} [description] - Description
 * @property {number} [cout] - Coût en FCFA
 * @property {number} [kilometre] - Kilométrage actuel
 * @property {string} [date] - Date de l’entretien (ISO 8601, défaut maintenant)
 * @property {number} [prochainKm] - Kilométrage recommandé pour le prochain entretien
 * @property {number} vehiculeId - Identifiant du véhicule
 */
export interface CreateEntretienInput {
  type: string;
  description?: string;
  cout?: number;
  kilometre?: number;
  date?: string;
  prochainKm?: number;
  vehiculeId: number;
}

/**
 * Données d'entrée pour mettre à jour un entretien.
 */
export interface UpdateEntretienInput {
  type?: string;
  description?: string | null;
  cout?: number | null;
  kilometre?: number | null;
  date?: string;
  prochainKm?: number | null;
}

/**
 * Données d'entrée pour mettre à jour le kilométrage d’un véhicule.
 */
export interface UpdateKilometrageInput {
  vehiculeId: number;
  nouveauKilometrage: number;
  /** Optionnel : forcer la mise à jour même si le nouveau kilométrage est inférieur */
  force?: boolean;
}

// ============================================================
// RÉPONSES DE L'API
// ============================================================

/**
 * Réponse paginée pour la liste des véhicules.
 *
 * @interface VehiculesPaginatedResponse
 * @property {Vehicule[]} vehicules - Véhicules de la page (avec entretiens et dépenses si demandés)
 * @property {number} total - Nombre total de véhicules
 * @property {number} page - Page courante
 * @property {number} limit - Limite par page
 * @property {number} totalPages - Nombre total de pages
 */
export interface VehiculesPaginatedResponse {
  vehicules: Vehicule[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================
// API WINDOW — VehiculesApi
// ============================================================

/**
 * Interface de l'API véhicules exposée au renderer via `window.api.vehicules`.
 *
 * @interface VehiculesApi
 * @description
 * Toutes les méthodes sont asynchrones et communiquent via IPC Electron.
 *
 * ## Canaux IPC utilisés
 * | Méthème               | Canal IPC                         |
 * |-----------------------|-----------------------------------|
 * | getAll                | vehicules:getAll                  |
 * | getById               | vehicules:getById                 |
 * | create                | vehicules:create                  |
 * | update                | vehicules:update                  |
 * | delete                | vehicules:delete                  |
 * | getStats              | vehicules:getStats                |
 * | getTrends             | vehicules:getTrends               |
 * | getSparklines         | vehicules:getSparklines           |
 * | getEntretiensByVehicule| vehicules:getEntretiensByVehicule|
 * | createEntretien       | vehicules:createEntretien         |
 * | updateEntretien       | vehicules:updateEntretien         |
 * | deleteEntretien       | vehicules:deleteEntretien         |
 * | updateKilometrage     | vehicules:updateKilometrage       |
 * | isImmatriculationUnique| vehicules:isImmatriculationUnique|
 */
export interface VehiculesApi {
  /**
   * Récupère la liste paginée des véhicules avec filtres.
   * @param params - Pagination, filtres et tri
   * @returns Liste paginée
   */
  getAll: (params?: VehiculesListParams) => Promise<VehiculesPaginatedResponse>;

  /**
   * Récupère un véhicule par son identifiant avec ses relations.
   * @param id - Identifiant du véhicule
   * @returns Véhicule complet (entretiens, dépenses, leçons)
   */
  getById: (id: number) => Promise<Vehicule>;

  /**
   * Crée un nouveau véhicule.
   * @param data - Données du véhicule
   * @returns Véhicule créé
   */
  create: (data: CreateVehiculeInput) => Promise<Vehicule>;

  /**
   * Met à jour un véhicule existant (patch partiel).
   * @param id - Identifiant du véhicule
   * @param data - Champs à modifier
   * @returns Véhicule mis à jour
   */
  update: (id: number, data: UpdateVehiculeInput) => Promise<Vehicule>;

  /**
   * Supprime (désactive) un véhicule – en réalité on peut le passer en HORS_SERVICE
   * ou le supprimer physiquement selon la politique. Par défaut, on le désactive.
   * @param id - Identifiant du véhicule
   * @returns Résultat de l'opération
   */
  delete: (id: number) => Promise<{ success: boolean; message: string }>;

  /**
   * Récupère les statistiques agrégées des véhicules.
   * @returns Métriques étendues
   */
  getStats: () => Promise<VehiculesStatsExtended>;

  /**
   * Récupère les tendances évolutives (mois vs précédent).
   * @returns Variations en pourcentage
   */
  getTrends: () => Promise<VehiculesTrends>;

  /**
   * Récupère les données des sparklines pour les 12 derniers mois.
   * @returns Sparklines (disponibles, en leçon, entretiens, kilométrage)
   */
  getSparklines: () => Promise<VehiculesSparklineData>;

  /**
   * Récupère la liste des entretiens d’un véhicule.
   * @param vehiculeId - Identifiant du véhicule
   * @returns Liste des entretiens triés par date décroissante
   */
  getEntretiensByVehicule: (vehiculeId: number) => Promise<Entretien[]>;

  /**
   * Enregistre un nouvel entretien pour un véhicule.
   * @param data - Données de l’entretien
   * @returns Entretien créé
   */
  createEntretien: (data: CreateEntretienInput) => Promise<Entretien>;

  /**
   * Met à jour un entretien existant.
   * @param id - Identifiant de l’entretien
   * @param data - Champs à modifier
   * @returns Entretien mis à jour
   */
  updateEntretien: (id: number, data: UpdateEntretienInput) => Promise<Entretien>;

  /**
   * Supprime un entretien.
   * @param id - Identifiant de l’entretien
   * @returns Résultat de l’opération
   */
  deleteEntretien: (id: number) => Promise<{ success: boolean; message: string }>;

  /**
   * Met à jour le kilométrage d’un véhicule.
   * @param data - Identifiant du véhicule et nouveau kilométrage
   * @returns Véhicule mis à jour
   */
  updateKilometrage: (data: UpdateKilometrageInput) => Promise<Vehicule>;

  /**
   * Vérifie si une immatriculation est unique (pour validation formulaire).
   * @param immatriculation - Plaque à vérifier
   * @param excludeId - Identifiant du véhicule à exclure (pour modification)
   * @returns `true` si unique
   */
  isImmatriculationUnique: (immatriculation: string, excludeId?: number) => Promise<boolean>;
}
