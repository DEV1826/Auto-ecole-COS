// src/types/examens.types.ts

/**
 * @module types/examens.types
 * @description
 * Types complets pour la gestion des examens (code ou conduite) dans l’auto‑école COS.
 *
 * Ce module exporte :
 * - `Examen` : le modèle principal (avec relations)
 * - `ExamensStats` : métriques agrégées (taux de réussite, nombre d’examens passés, etc.)
 * - `ExamensTrends` : évolutions temporelles pour les cartes de statistiques
 * - `ExamensColumnConfig` : contrôle de visibilité des colonnes dans les tableaux
 * - `ExamensTableActions` : callbacks d’actions sur les lignes
 * - `ExamensColumnsOptions` : options complètes pour la génération des colonnes
 *
 * Ces types sont utilisés dans les composants `StatsCard`, `DataTable`,
 * `AdminStatsCards`, `SecretaireStatsCards`, `MoniteurStatsCards`, etc.
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @see {@link TypeExamen} – Énumération CODE / CONDUIT
 * @see {@link ResultatExamen} – Énumération EN_ATTENTE / RECU / AJOURNE
 * @see {@link Candidat} – Candidat ayant passé l’examen
 */

import type { TypeExamen, ResultatExamen } from '@/types/enums';
import type { Candidat } from '@/types/candidats.types';

// ============================================================
// MODÈLE PRINCIPAL
// ============================================================

/**
 * Examen – correspond au modèle Prisma `Examen`.
 *
 * @interface Examen
 * @description
 * Un examen représente une épreuve (code ou conduite) passée par un candidat.
 * Le résultat peut être en attente, reçu ou ajourné. Une note (sur 20) peut être
 * enregistrée pour l’examen pratique.
 *
 * @property {number} id - Identifiant unique (auto-incrémenté)
 * @property {Date | string} date - Date et heure de l’examen
 * @property {TypeExamen} type - `CODE` (théorique) ou `CONDUIT` (pratique)
 * @property {ResultatExamen} resultat - `EN_ATTENTE`, `RECU` ou `AJOURNE`
 * @property {number | null} [note] - Note obtenue (généralement pour l’examen pratique, sur 20)
 * @property {string | null} [centre] - Lieu de passage de l’examen
 * @property {string | null} [notes] - Commentaires libres (observations, raison de l’échec, etc.)
 * @property {Date | string} createdAt - Horodatage de création dans le système
 * @property {number} candidatId - Identifiant du candidat concerné
 *
 * // Relation (optionnelle, chargée selon les besoins)
 * @property {Candidat} [candidat] - Candidat ayant passé l’examen
 *
 * @example
 * ```ts
 * const examen: Examen = {
 *   id: 1,
 *   date: '2024-05-15T09:00:00Z',
 *   type: 'CONDUIT',
 *   resultat: 'RECU',
 *   note: 18.5,
 *   centre: 'Piste de Mvog-Mbi, Yaoundé',
 *   notes: 'Excellent parcours, stationnement maîtrisé.',
 *   createdAt: '2024-05-15T12:00:00Z',
 *   candidatId: 42,
 * };
 * ```
 */
export interface Examen {
  id: number;
  date: Date | string;
  type: TypeExamen;
  resultat: ResultatExamen;
  note?: number | null;
  centre?: string | null;
  notes?: string | null;
  createdAt: Date | string;
  candidatId: number;

  // Relation (optionnelle)
  candidat?: Candidat;
}

// ============================================================
// STATISTIQUES POUR LE DASHBOARD
// ============================================================

/**
 * Métriques statistiques agrégées pour les examens.
 * Utilisé dans les composants de cartes statistiques.
 *
 * @interface ExamensStats
 * @description Regroupe les indicateurs clés des examens.
 *
 * @property {number} totalExamens - Nombre total d’examens passés (tous types)
 * @property {number} examensCode - Nombre d’examens du code
 * @property {number} examensConduite - Nombre d’examens de conduite
 * @property {number} reussites - Nombre d’examens réussis (`RECU`)
 * @property {number} echecs - Nombre d’échecs (`AJOURNE`)
 * @property {number} tauxReussiteGlobal - Pourcentage de réussite (reçus / total)
 *
 * @example
 * ```ts
 * const stats: ExamensStats = {
 *   totalExamens: 84,
 *   examensCode: 45,
 *   examensConduite: 39,
 *   reussites: 62,
 *   echecs: 22,
 *   tauxReussiteGlobal: 73.8,
 * };
 * ```
 */
export interface ExamensStats {
  totalExamens: number;
  examensCode: number;
  examensConduite: number;
  reussites: number;
  echecs: number;
  tauxReussiteGlobal: number;
}

/**
 * Tendances évolutives des indicateurs d’examens.
 *
 * @interface ExamensTrends
 * @property {number} totalExamens - Variation (en pourcentage ou absolu)
 * @property {number} examensCode - Variation
 * @property {number} examensConduite - Variation
 * @property {number} reussites - Variation
 * @property {number} echecs - Variation
 * @property {number} tauxReussiteGlobal - Variation (en points de pourcentage)
 *
 * @example
 * ```ts
 * const trends: ExamensTrends = {
 *   totalExamens: 8,
 *   examensCode: 5,
 *   examensConduite: 12,
 *   reussites: 10,
 *   echecs: -2,
 *   tauxReussiteGlobal: 2.5,
 * };
 * ```
 */
export interface ExamensTrends {
  totalExamens: number;
  examensCode: number;
  examensConduite: number;
  reussites: number;
  echecs: number;
  tauxReussiteGlobal: number;
}

// ============================================================
// CONFIGURATION DES COLONNES DU TABLEAU DES EXAMENS
// ============================================================

/**
 * Configuration de visibilité des colonnes dans le tableau des examens.
 *
 * @interface ExamensColumnConfig
 * @property {boolean} [showDate] - Afficher la date de l’examen (défaut : true)
 * @property {boolean} [showType] - Afficher le type (code/conduite) avec badge (défaut : true)
 * @property {boolean} [showCandidat] - Afficher le nom du candidat (défaut : true)
 * @property {boolean} [showResultat] - Afficher le résultat (badge) (défaut : true)
 * @property {boolean} [showNote] - Afficher la note (défaut : true)
 * @property {boolean} [showCentre] - Afficher le centre d’examen (défaut : false)
 * @property {boolean} [showActions] - Afficher le menu d’actions (défaut : true)
 *
 * @example
 * ```ts
 * const config: ExamensColumnConfig = {
 *   showDate: true,
 *   showType: true,
 *   showCandidat: true,
 *   showResultat: true,
 *   showNote: true,
 *   showCentre: true,
 *   showActions: true,
 * };
 * ```
 */
export interface ExamensColumnConfig {
  showDate?: boolean;
  showType?: boolean;
  showCandidat?: boolean;
  showResultat?: boolean;
  showNote?: boolean;
  showCentre?: boolean;
  showActions?: boolean;
}

/**
 * Callbacks d’actions sur une ligne du tableau des examens.
 *
 * @interface ExamensTableActions
 * @property {(examen: Examen) => void} [onView] - Voir le détail de l’examen
 * @property {(examen: Examen) => void} [onEdit] - Modifier l’examen (résultat, note)
 * @property {(examen: Examen) => Promise<void>} [onDelete] - Supprimer l’examen
 * @property {(examen: Examen) => void} [onPrintCertificate] - Imprimer l’attestation (reçu)
 *
 * @example
 * ```ts
 * const actions: ExamensTableActions = {
 *   onView: (e) => navigate(`/examens/${e.id}`),
 *   onEdit: (e) => navigate(`/examens/${e.id}/edit`),
 *   onDelete: async (e) => await deleteExamen(e.id),
 * };
 * ```
 */
export interface ExamensTableActions {
  onView?: (examen: Examen) => void;
  onEdit?: (examen: Examen) => void;
  onDelete?: (examen: Examen) => Promise<void>;
  onPrintCertificate?: (examen: Examen) => void;
}

/**
 * Enrichissements optionnels pour injecter des données calculées du candidat
 * sans modifier le modèle principal `Examen`.
 *
 * @interface ExamensEnrichments
 * @property {(examen: Examen) => string} [getCandidatNomComplet] - Nom complet (prenom + nom)
 * @property {(examen: Examen) => string} [getCandidatEmail] - Email du candidat
 * @property {(examen: Examen) => string} [getCandidatTelephone] - Téléphone
 * @property {(examen: Examen) => string} [getCandidatAvatarUrl] - URL de l’avatar
 * @property {(examen: Examen) => string} [getCandidatInitials] - Initiales (fallback)
 */
export interface ExamensEnrichments {
  getCandidatNomComplet?: (examen: Examen) => string;
  getCandidatEmail?: (examen: Examen) => string;
  getCandidatTelephone?: (examen: Examen) => string;
  getCandidatAvatarUrl?: (examen: Examen) => string;
  getCandidatInitials?: (examen: Examen) => string;
}

/**
 * Options complètes pour la génération des colonnes du tableau des examens.
 *
 * @interface ExamensColumnsOptions
 * @property {ExamensColumnConfig} [columnConfig] - Surcharge de la visibilité des colonnes
 * @property {ExamensTableActions} [actions] - Callbacks d’actions sur les lignes
 * @property {ExamensEnrichments} [enrichments] - Données calculées pour les colonnes (ex: nom complet du candidat)
 * @property {'admin' | 'secretaire' | 'moniteur'} [variant] - Profil utilisateur
 *   - `admin` : toutes les colonnes (date, type, candidat, résultat, note, centre, actions)
 *   - `secretaire` : colonnes essentielles (date, type, candidat, résultat, actions)
 *   - `moniteur` : vue restreinte (date, type, candidat, résultat, note)
 *
 * @example
 * ```ts
 * const options: ExamensColumnsOptions = {
 *   variant: 'secretaire',
 *  columnConfig: { showCentre: true },
 *  actions: { onView: (e) => console.log(e) },
 *  enrichments: {
 *    getCandidatNomComplet: (e) => `${e.candidat?.prenom} ${e.candidat?.nom}`,
 * },
 * };
 * const columns = getExamensColumns(options);
 * ```
 */
export interface ExamensColumnsOptions {
  columnConfig?: ExamensColumnConfig;
  actions?: ExamensTableActions;
  enrichments?: ExamensEnrichments;
  variant?: 'admin' | 'secretaire' | 'moniteur';
}
