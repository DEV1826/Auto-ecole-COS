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
