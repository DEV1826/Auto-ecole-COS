// src/types/planning.types.ts

/**
 * @module types/planning.types
 * @description
 * Types complets pour la gestion des leçons (planning) dans l’auto‑école COS.
 *
 * Ce module exporte :
 * - `Lecon` : le modèle principal (avec relations)
 * - `LeconsStats` : métriques agrégées (leçons effectuées, taux d’occupation, etc.)
 * - `LeconsTrends` : évolutions temporelles
 * - `LeconsColumnConfig` : contrôle de visibilité des colonnes dans les tableaux
 * - `LeconsTableActions` : callbacks d’actions sur les lignes
 * - `LeconsColumnsOptions` : options complètes pour la génération des colonnes
 * - `LeconFilters` : filtres pour le planning (date, moniteur, candidat, etc.)
 *
 * Ces types sont utilisés dans les composants `StatsCard`, `DataTable`,
 * `PlanningCalendar`, `AdminDashboard`, `MoniteurDashboard`, etc.
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @see {@link TypeLecon} – Énumération des types de leçon (CODE, CONDUITE, CONDUITE_ACCOMPAGNEE)
 * @see {@link StatutLecon} – Énumération PLANIFIEE, EFFECTUEE, ANNULEE, ABSENCE
 * @see {@link Candidat} – Candidat participant
 * @see {@link Moniteur} – Moniteur encadrant
 * @see {@link Vehicule} – Véhicule utilisé
 */

import type { TypeLecon, StatutLecon } from '@/types/enums';
import type { Candidat } from '@/types/candidats.types';
import type { Moniteur } from '@/types/moniteurs.types';
import type { Vehicule } from '@/types/vehicules.types';

// ============================================================
// MODÈLE PRINCIPAL
// ============================================================

/**
 * Lecon – correspond au modèle Prisma `Lecon`.
 *
 * @interface Lecon
 * @description
 * Une leçon représente une séance de formation (code ou conduite) planifiée.
 * Elle lie un candidat, un moniteur et optionnellement un véhicule.
 * La durée est exprimée en minutes (le plus souvent 60 ou 90).
 *
 * @property {number} id - Identifiant unique (auto-incrémenté)
 * @property {Date | string} date - Date et heure de début de la leçon
 * @property {number} duree - Durée en minutes (ex: 60 pour 1 heure)
 * @property {TypeLecon} type - `CODE`, `CONDUITE` ou `CONDUITE_ACCOMPAGNEE`
 * @property {StatutLecon} statut - État de la leçon
 * @property {string | null} [notes] - Remarques (appréciation du moniteur, difficultés, etc.)
 * @property {Date | string} createdAt - Horodatage de création
 * @property {Date | string} updatedAt - Dernière modification
 * @property {number} candidatId - Identifiant du candidat
 * @property {number} moniteurId - Identifiant du moniteur
 * @property {number | null} [vehiculeId] - Identifiant du véhicule (optionnel)
 *
 * // Relations (optionnelles, chargées selon les besoins)
 * @property {Candidat} [candidat] - Candidat participant
 * @property {Moniteur} [moniteur] - Moniteur encadrant
 * @property {Vehicule | null} [vehicule] - Véhicule utilisé
 *
 * @example
 * ```ts
 * const lecon: Lecon = {
 *   id: 1,
 *   date: '2024-03-25T10:00:00Z',
 *   duree: 60,
 *   type: 'CONDUITE',
 *   statut: 'PLANIFIEE',
 *   notes: 'Récupération des bases du stationnement.',
 *   createdAt: '2024-03-20T14:00:00Z',
 *   updatedAt: '2024-03-20T14:00:00Z',
 *   candidatId: 42,
 *   moniteurId: 5,
 *   vehiculeId: 3,
 * };
 * ```
 */
export interface Lecon {
  id: number;
  date: Date | string;
  duree: number; // minutes
  type: TypeLecon;
  statut: StatutLecon;
  notes?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  candidatId: number;
  moniteurId: number;
  vehiculeId?: number | null;

  // Relations (optionnelles)
  candidat?: Candidat;
  moniteur?: Moniteur;
  vehicule?: Vehicule | null;
}

// ============================================================
// FILTRES POUR LE PLANNING
// ============================================================

/**
 * Filtres pour la recherche / affichage des leçons.
 *
 * @interface LeconFilters
 * @property {Date | string} [startDate] - Date de début (inclusive)
 * @property {Date | string} [endDate] - Date de fin (inclusive)
 * @property {number} [candidatId] - Filtrer par candidat
 * @property {number} [moniteurId] - Filtrer par moniteur
 * @property {number} [vehiculeId] - Filtrer par véhicule
 * @property {TypeLecon} [type] - Filtrer par type de leçon
 * @property {StatutLecon} [statut] - Filtrer par statut
 *
 * @example
 * ```ts
 * const filters: LeconFilters = {
 *   startDate: '2024-03-01',
 *   endDate: '2024-03-31',
 *   moniteurId: 5,
 *   statut: 'PLANIFIEE',
 * };
 * ```
 */
export interface LeconFilters {
  startDate?: Date | string;
  endDate?: Date | string;
  candidatId?: number;
  moniteurId?: number;
  vehiculeId?: number;
  type?: TypeLecon;
  statut?: StatutLecon;
}

// ============================================================
// STATISTIQUES POUR LE DASHBOARD
// ============================================================

/**
 * Métriques statistiques agrégées pour les leçons.
 *
 * @interface LeconsStats
 * @property {number} totalLecons - Nombre total de leçons (tous statuts)
 * @property {number} leconsEffectuees - Leçons effectuées (EFFECTUEE)
 * @property {number} leconsPlanifiees - Leçons planifiées à venir
 * @property {number} heuresConduiteTotal - Heures de conduite cumulées (Conduite + Conduite accompagnée)
 * @property {number} heuresCodeTotal - Heures de code cumulées
 * @property {number} tauxOccupationVehicules - Pourcentage d’utilisation des véhicules (sur les créneaux)
 *
 * @example
 * ```ts
 * const stats: LeconsStats = {
 *   totalLecons: 320,
 *   leconsEffectuees: 280,
 *   leconsPlanifiees: 40,
 *   heuresConduiteTotal: 240,
 *   heuresCodeTotal: 40,
 *   tauxOccupationVehicules: 68,
 * };
 * ```
 */
export interface LeconsStats {
  totalLecons: number;
  leconsEffectuees: number;
  leconsPlanifiees: number;
  heuresConduiteTotal: number;
  heuresCodeTotal: number;
  tauxOccupationVehicules: number;
}

/**
 * Tendances évolutives des indicateurs de leçons.
 *
 * @interface LeconsTrends
 * @property {number} leconsEffectuees - Variation (en pourcentage ou absolu)
 * @property {number} leconsPlanifiees - Variation
 * @property {number} heuresConduiteTotal - Variation
 * @property {number} tauxOccupationVehicules - Variation (en points de pourcentage)
 *
 * @example
 * ```ts
 * const trends: LeconsTrends = {
 *   leconsEffectuees: 12.5,
 *   leconsPlanifiees: -5,
 *   heuresConduiteTotal: 15,
 *   tauxOccupationVehicules: 3.2,
 * };
 * ```
 */
export interface LeconsTrends {
  leconsEffectuees: number;
  leconsPlanifiees: number;
  heuresConduiteTotal: number;
  tauxOccupationVehicules: number;
}

// ============================================================
// CONFIGURATION DES COLONNES DU TABLEAU DES LEÇONS
// ============================================================

/**
 * Configuration de visibilité des colonnes dans le tableau des leçons.
 *
 * @interface LeconsColumnConfig
 * @property {boolean} [showDate] - Afficher la date et heure (défaut : true)
 * @property {boolean} [showCandidat] - Afficher le nom du candidat (défaut : true)
 * @property {boolean} [showMoniteur] - Afficher le nom du moniteur (défaut : true)
 * @property {boolean} [showType] - Afficher le type de leçon (badge) (défaut : true)
 * @property {boolean} [showStatut] - Afficher le statut (badge) (défaut : true)
 * @property {boolean} [showVehicule] - Afficher l’immatriculation du véhicule (défaut : false)
 * @property {boolean} [showDuree] - Afficher la durée (minutes) (défaut : false)
 * @property {boolean} [showActions] - Afficher le menu d’actions (défaut : true)
 *
 * @example
 * ```ts
 * const config: LeconsColumnConfig = {
 *   showDate: true,
 *   showCandidat: true,
 *   showMoniteur: true,
 *   showType: true,
 *   showStatut: true,
 *   showVehicule: true,
 *   showDuree: true,
 *   showActions: true,
 * };
 * ```
 */
export interface LeconsColumnConfig {
  showDate?: boolean;
  showCandidat?: boolean;
  showMoniteur?: boolean;
  showType?: boolean;
  showStatut?: boolean;
  showVehicule?: boolean;
  showDuree?: boolean;
  showActions?: boolean;
}

/**
 * Enrichissements optionnels pour injecter des données calculées
 * (candidat, moniteur, véhicule) sans modifier `Lecon`.
 *
 * @interface LeconsEnrichments
 * @property {(lecon: Lecon) => string} [getCandidatNomComplet] - Nom complet du candidat
 * @property {(lecon: Lecon) => string} [getCandidatEmail] - Email du candidat
 * @property {(lecon: Lecon) => string} [getCandidatTelephone] - Téléphone du candidat
 * @property {(lecon: Lecon) => string} [getCandidatAvatarUrl] - Avatar du candidat
 * @property {(lecon: Lecon) => string} [getCandidatInitials] - Initiales du candidat
 * @property {(lecon: Lecon) => string} [getMoniteurNomComplet] - Nom complet du moniteur
 * @property {(lecon: Lecon) => string} [getMoniteurAvatarUrl] - Avatar du moniteur
 * @property {(lecon: Lecon) => string} [getMoniteurInitials] - Initiales du moniteur
 * @property {(lecon: Lecon) => string} [getVehiculeImmatriculation] - Immatriculation
 * @property {(lecon: Lecon) => string} [getVehiculeLibelle] - Marque + modèle + immatriculation
 * @property {(lecon: Lecon) => string} [getVehiculeAvatarUrl] - Icône du véhicule (marque)
 */
export interface LeconsEnrichments {
  getCandidatNomComplet?: (lecon: Lecon) => string;
  getCandidatEmail?: (lecon: Lecon) => string;
  getCandidatTelephone?: (lecon: Lecon) => string;
  getCandidatAvatarUrl?: (lecon: Lecon) => string;
  getCandidatInitials?: (lecon: Lecon) => string;
  getMoniteurNomComplet?: (lecon: Lecon) => string;
  getMoniteurAvatarUrl?: (lecon: Lecon) => string;
  getMoniteurInitials?: (lecon: Lecon) => string;
  getVehiculeImmatriculation?: (lecon: Lecon) => string;
  getVehiculeLibelle?: (lecon: Lecon) => string;
  getVehiculeAvatarUrl?: (lecon: Lecon) => string;
}

/**
 * Callbacks d’actions sur une ligne du tableau des leçons.
 *
 * @interface LeconsTableActions
 * @property {(lecon: Lecon) => void} [onView] - Voir le détail de la leçon
 * @property {(lecon: Lecon) => void} [onEdit] - Modifier la leçon (date, type, etc.)
 * @property {(lecon: Lecon) => Promise<void>} [onCancel] - Annuler la leçon
 * @property {(lecon: Lecon) => Promise<void>} [onMarkDone] - Marquer comme effectuée
 * @property {(lecon: Lecon) => Promise<void>} [onReportAbsence] - Signaler l’absence du candidat
 *
 * @example
 * ```ts
 * const actions: LeconsTableActions = {
 *   onView: (l) => navigate(`/planning/${l.id}`),
 *   onEdit: (l) => navigate(`/planning/${l.id}/edit`),
 *   onCancel: async (l) => await updateLecon(l.id, { statut: 'ANNULEE' }),
 * };
 * ```
 */
export interface LeconsTableActions {
  onView?: (lecon: Lecon) => void;
  onEdit?: (lecon: Lecon) => void;
  onCancel?: (lecon: Lecon) => Promise<void>;
  onMarkDone?: (lecon: Lecon) => Promise<void>;
  onReportAbsence?: (lecon: Lecon) => Promise<void>;
}

/**
 * Options complètes pour la génération des colonnes du tableau des leçons.
 *
 * @interface LeconsColumnsOptions
 * @property {LeconsColumnConfig} [columnConfig] - Surcharge de la visibilité des colonnes
 * @property {LeconsTableActions} [actions] - Callbacks d’actions sur les lignes
 * @property {'admin' | 'secretaire' | 'moniteur'} [variant] - Profil utilisateur
 *   - `admin` : toutes les colonnes (date, candidat, moniteur, type, statut, véhicule, durée, actions)
 *   - `secretaire` : colonnes de gestion quotidienne (date, candidat, moniteur, type, statut, actions)
 *   - `moniteur` : vue restreinte (date, candidat, type, statut, actions limitées)
 *
 * @example
 * ```ts
 * const options: LeconsColumnsOptions = {
 *   variant: 'moniteur',
 *   actions: { onMarkDone: (l) => console.log(l) },
 * };
 * const columns = getLeconsColumns(options);
 * ```
 */
export interface LeconsColumnsOptions {
  columnConfig?: LeconsColumnConfig;
  actions?: LeconsTableActions;
  enrichments?: LeconsEnrichments;
  variant?: 'admin' | 'secretaire' | 'moniteur';
}
