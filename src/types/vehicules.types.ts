// src/types/vehicules.types.ts

/**
 * @module types/vehicules.types
 * @description
 * Types complets pour la gestion des véhicules et des entretiens dans l’auto‑école COS.
 *
 * Ce module exporte :
 * - `Vehicule` : le modèle principal du véhicule
 * - `Entretien` : historique des entretiens d’un véhicule
 * - `VehiculesStats` : métriques agrégées (disponibilité, kilométrage)
 * - `VehiculesTrends` : évolutions temporelles
 * - `VehiculesColumnConfig` : contrôle de visibilité des colonnes
 * - `VehiculesTableActions` : actions sur les lignes
 * - `VehiculesColumnsOptions` : options pour la génération des colonnes
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
 * @property {number} entretiensAnnee - Nombre d’entretiens effectués dans l’année
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
 * Tendances évolutives pour les véhicules.
 *
 * @interface VehiculesTrends
 * @property {number} totalVehicules - Variation (en pourcentage ou absolu)
 * @property {number} disponibles - Variation des disponibles
 * @property {number} kilometrageMoyen - Variation du kilométrage moyen
 */
export interface VehiculesTrends {
  totalVehicules: number;
  disponibles: number;
  kilometrageMoyen: number;
}

// ============================================================
// CONFIGURATION DES COLONNES DU TABLEAU DES VEHICULES
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
 */
export interface VehiculesTableActions {
  onView?: (vehicule: Vehicule) => void;
  onEdit?: (vehicule: Vehicule) => void;
  onDelete?: (vehicule: Vehicule) => Promise<void>;
  onViewEntretiens?: (vehicule: Vehicule) => void;
  onRecordMaintenance?: (vehicule: Vehicule) => void;
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
