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
 *   type: 'CONDUITE',
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

// ============================================================
// PARAMÈTRES & ENTRÉES (DTOs)
// ============================================================

/**
 * Paramètres de filtrage et pagination pour la liste des examens.
 *
 * @interface ExamensListParams
 * @description
 * Utilisé par `ExamensApi.getAll()` et le canal IPC `examens:getAll`.
 *
 * @property {number} [page=1] - Page courante (1-indexed)
 * @property {number} [limit=20] - Nombre d'éléments par page (max 200)
 * @property {string} [search] - Recherche textuelle : nom candidat, centre
 * @property {TypeExamen} [type] - Filtrer par type (CODE, CONDUIT)
 * @property {ResultatExamen} [resultat] - Filtrer par résultat
 * @property {number} [candidatId] - Filtrer par candidat
 * @property {string} [dateDebut] - Date de début (ISO 8601)
 * @property {string} [dateFin] - Date de fin (ISO 8601)
 * @property {'today' | 'week' | 'month' | 'all'} [period] - Période prédéfinie
 * @property {'date' | 'note' | 'createdAt'} [sortBy='date'] - Champ de tri
 * @property {'asc' | 'desc'} [sortOrder='desc'] - Sens du tri
 */
export interface ExamensListParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: TypeExamen;
  resultat?: ResultatExamen;
  candidatId?: number;
  dateDebut?: string;
  dateFin?: string;
  period?: 'today' | 'week' | 'month' | 'all';
  sortBy?: 'date' | 'note' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Données d'entrée pour créer un nouvel examen.
 *
 * @interface CreateExamenInput
 * @description
 * Tous les champs obligatoires doivent être fournis.
 *
 * @property {Date|string} date - Date et heure de l’examen
 * @property {TypeExamen} type - Type d’examen (CODE ou CONDUIT)
 * @property {number} candidatId - Identifiant du candidat
 * @property {string} [centre] - Lieu de passage (optionnel)
 * @property {string} [notes] - Commentaires (optionnels)
 */
export interface CreateExamenInput {
  date: Date | string;
  type: TypeExamen;
  candidatId: number;
  centre?: string | null;
  notes?: string | null;
}

/**
 * Données d'entrée pour mettre à jour un examen (patch partiel).
 *
 * @interface UpdateExamenInput
 * @description
 * Seuls certains champs peuvent être modifiés après création.
 *
 * @property {Date|string} [date] - Nouvelle date
 * @property {ResultatExamen} [resultat] - Nouveau résultat
 * @property {number} [note] - Note (sur 20, pour le conduite)
 * @property {string} [centre] - Nouveau centre
 * @property {string} [notes] - Nouvelles remarques
 */
export interface UpdateExamenInput {
  date?: Date | string;
  resultat?: ResultatExamen;
  note?: number | null;
  centre?: string | null;
  notes?: string | null;
}

// ============================================================
// RÉPONSES DE L'API
// ============================================================

/**
 * Réponse paginée pour la liste des examens.
 *
 * @interface ExamensPaginatedResponse
 * @property {Examen[]} examens - Examens de la page (avec candidat)
 * @property {number} total - Nombre total d’examens
 * @property {number} page - Page courante
 * @property {number} limit - Limite par page
 * @property {number} totalPages - Nombre total de pages
 */
export interface ExamensPaginatedResponse {
  examens: Examen[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Statistiques étendues des examens pour le dashboard.
 *
 * @interface ExamensStatsExtended
 * @extends ExamensStats
 * @property {number} examensMois - Nombre d’examens passés ce mois
 * @property {number} reussitesMois - Nombre de réussites ce mois
 * @property {number} noteMoyenneConduite - Note moyenne des examens de conduite
 * @property {number} evolutionReussite - Évolution du taux de réussite (en points)
 */
export interface ExamensStatsExtended extends ExamensStats {
  examensMois: number;
  reussitesMois: number;
  noteMoyenneConduite: number;
  evolutionReussite: number;
}

/**
 * Données des sparklines pour les examens (12 derniers mois).
 *
 * @interface ExamensSparklineData
 * @property {{ values: number[]; labels?: string[] }} examensSparkline - Nombre d’examens par mois
 * @property {{ values: number[]; labels?: string[] }} reussitesSparkline - Réussites par mois
 * @property {{ values: number[]; labels?: string[] }} tauxReussiteSparkline - Taux de réussite mensuel (%)
 */
export interface ExamensSparklineData {
  examensSparkline: { values: number[]; labels?: string[] };
  reussitesSparkline: { values: number[]; labels?: string[] };
  tauxReussiteSparkline: { values: number[]; labels?: string[] };
}

// ============================================================
// API WINDOW — ExamensApi
// ============================================================

/**
 * Interface de l'API examens exposée au renderer via `window.api.examens`.
 *
 * @interface ExamensApi
 * @description
 * Toutes les méthodes sont asynchrones et communiquent via IPC Electron.
 *
 * ## Canaux IPC utilisés
 * | Méthode               | Canal IPC                     |
 * |-----------------------|-------------------------------|
 * | getAll                | examens:getAll                |
 * | getById               | examens:getById               |
 * | create                | examens:create                |
 * | update                | examens:update                |
 * | delete                | examens:delete                |
 * | getStats              | examens:getStats              |
 * | getTrends             | examens:getTrends             |
 * | getSparklines         | examens:getSparklines         |
 * | getByCandidat         | examens:getByCandidat         |
 * | printCertificate      | examens:printCertificate      |
 */
export interface ExamensApi {
  /**
   * Récupère la liste paginée des examens avec filtres.
   * @param params - Pagination, filtres et tri
   * @returns Liste paginée
   */
  getAll: (params?: ExamensListParams) => Promise<ExamensPaginatedResponse>;

  /**
   * Récupère un examen par son identifiant (avec candidat).
   * @param id - Identifiant de l’examen
   * @returns Examen complet
   */
  getById: (id: number) => Promise<Examen>;

  /**
   * Crée un nouvel examen.
   * @param data - Données de l’examen (date, type, candidatId)
   * @returns Examen créé
   */
  create: (data: CreateExamenInput) => Promise<Examen>;

  /**
   * Met à jour un examen existant (patch partiel – résultat, note, date, centre, notes).
   * @param id - Identifiant de l’examen
   * @param data - Champs à modifier
   * @returns Examen mis à jour
   */
  update: (id: number, data: UpdateExamenInput) => Promise<Examen>;

  /**
   * Supprime définitivement un examen.
   * @param id - Identifiant de l’examen
   * @returns Résultat de l’opération
   */
  delete: (id: number) => Promise<{ success: boolean; message: string }>;

  /**
   * Récupère les statistiques agrégées des examens.
   * @returns Métriques étendues
   */
  getStats: () => Promise<ExamensStatsExtended>;

  /**
   * Récupère les tendances évolutives (mois vs précédent).
   * @returns Variations en pourcentage
   */
  getTrends: () => Promise<ExamensTrends>;

  /**
   * Récupère les données des sparklines pour les 12 derniers mois.
   * @returns Sparklines (nombre, réussites, taux de réussite)
   */
  getSparklines: () => Promise<ExamensSparklineData>;

  /**
   * Récupère tous les examens d’un candidat spécifique.
   * @param candidatId - Identifiant du candidat
   * @returns Liste des examens (triés par date décroissante)
   */
  getByCandidat: (candidatId: number) => Promise<Examen[]>;

  /**
   * Génère / imprime l’attestation (ou certificat) pour un examen réussi.
   * @param id - Identifiant de l’examen
   * @returns Chemin du PDF généré
   */
  printCertificate: (id: number) => Promise<{ success: boolean; path?: string; message?: string }>;
}
