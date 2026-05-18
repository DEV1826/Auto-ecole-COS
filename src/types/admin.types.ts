// src/types/admin.types.ts

/**
 * @module types/admin.types
 * @description
 * Types complets pour l’administration du système Auto‑école COS.
 *
 * Ce module exporte :
 * - `Permission` : permissions individuelles (ressource + action)
 * - `AuditLog` : entrée de log d’audit
 * - `CompanyConfig` : configuration de l’entreprise
 * - `AdminStats` : métriques pour le dashboard admin
 * - `AdminTrends` : tendances évolutives
 * - `AuditLogsColumnConfig` : configuration des colonnes pour les logs
 * - `AuditLogsTableActions` : actions sur les logs
 * - `AuditLogsColumnsOptions` : options pour la génération des colonnes
 * - `AuditLogsApi` : API pour les logs d’audit
 * - `CompanyApi` : API pour la configuration entreprise
 *
 * @author Stive Junior
 * @version 2.0.0
 *
 * @see {@link Utilisateur} – Utilisateurs du système
 * @see {@link Role} – Rôles utilisateur
 * @see {@link NiveauAcces} – Niveaux d’accès
 */

import type { Utilisateur } from '@/types/auth.types';

// ============================================================
// MODÈLES PRINCIPAUX
// ============================================================

/**
 * Permission individuelle – correspond au modèle Prisma `Permission`.
 *
 * @interface Permission
 * @description
 * Une permission associe un utilisateur à une ressource (ex: "candidats")
 * et une action (ex: "create", "read", "update", "delete").
 *
 * @property {number} id - Identifiant unique
 * @property {number} utilisateurId - Identifiant de l’utilisateur bénéficiaire
 * @property {string} ressource - Nom de la ressource (ex: "candidats", "paiements", "utilisateurs")
 * @property {string} action - Action autorisée (ex: "create", "read", "update", "delete")
 * @property {boolean} actif - Si la permission est active
 *
 * @example
 * ```ts
 * const perm: Permission = {
 *   id: 10,
 *   utilisateurId: 5,
 *   ressource: 'candidats',
 *   action: 'update',
 *   actif: true,
 * };
 * ```
 */
export interface Permission {
  id: number;
  utilisateurId: number;
  ressource: string;
  action: string;
  actif: boolean;
}

/**
 * Entrée de log d’audit – correspond au modèle Prisma `AuditLog`.
 *
 * @interface AuditLog
 * @description
 * Enregistre toute action sensible effectuée par un utilisateur (connexion,
 * création, modification, suppression) avec son adresse IP et le résultat.
 *
 * @property {number} id - Identifiant unique
 * @property {number | null} utilisateurId - ID de l’utilisateur (null si anonyme)
 * @property {string} action - Code de l’action (ex: "LOGIN", "CREATE_CANDIDAT")
 * @property {string | null} ressource - Type de ressource concernée
 * @property {number | null} ressourceId - ID de la ressource
 * @property {string | null} description - Texte descriptif
 * @property {string | null} ipAddress - Adresse IP de l’utilisateur
 * @property {'SUCCESS' | 'FAILED'} statut - Succès ou échec
 * @property {Date} createdAt - Horodatage
 * @property {Pick<Utilisateur, 'id' | 'email' | 'nom' | 'prenom'> | null} utilisateur - Informations réduites de l’utilisateur
 *
 * @example
 * ```ts
 * const log: AuditLog = {
 *   id: 100,
 *   utilisateurId: 5,
 *   action: 'LOGIN_SUCCESS',
 *   ressource: 'Utilisateur',
 *   ressourceId: 5,
 *   description: 'Connexion réussie depuis 192.168.1.1',
 *   ipAddress: '192.168.1.1',
 *   statut: 'SUCCESS',
 *   createdAt: new Date(),
 *   utilisateur: { id: 5, email: 'admin@cos.com', nom: 'Admin', prenom: 'Super' },
 * };
 * ```
 */
export interface AuditLog {
  id: number;
  utilisateurId: number | null;
  action: string;
  ressource: string | null;
  ressourceId: number | null;
  description: string | null;
  ipAddress: string | null;
  statut: 'SUCCESS' | 'FAILED';
  createdAt: Date;
  utilisateur?: Pick<Utilisateur, 'id' | 'email' | 'nom' | 'prenom'> | null;
}

/**
 * Configuration de l’entreprise – correspond au modèle Prisma `CompanyConfig`.
 *
 * @interface CompanyConfig
 * @description
 * Paramètres généraux de l’auto‑école : nom, adresse, contact,
 * informations fiscales, logo.
 *
 * @property {number} id - Identifiant unique
 * @property {string} nom - Nom officiel de l’auto‑école
 * @property {string | null} adresse - Adresse postale
 * @property {string | null} telephone - Numéro de téléphone principal
 * @property {string | null} email - Email de contact
 * @property {string | null} siteWeb - Site internet
 * @property {string | null} numeroFiscal - Numéro d’identification fiscale
 * @property {string | null} logoPath - Chemin du logo (stocké localement)
 * @property {Date} createdAt - Date de création
 * @property {Date} updatedAt - Dernière mise à jour
 *
 * @example
 * ```ts
 * const config: CompanyConfig = {
 *   id: 1,
 *   nom: 'COS Auto-École',
 *   adresse: '123 Avenue de la Conduite, Yaoundé',
 *   telephone: '+237 6 00 00 00 00',
 *   email: 'contact@cos-autoecole.com',
 *   siteWeb: 'https://www.cos-autoecole.com',
 *   numeroFiscal: 'CI-2025-001234',
 *   logoPath: '/images/logo-cos.png',
 *   createdAt: new Date('2024-01-01'),
 *   updatedAt: new Date('2024-01-01'),
 * };
 * ```
 */
export interface CompanyConfig {
  id: number;
  nom: string;
  adresse?: string | null;
  telephone?: string | null;
  email?: string | null;
  siteWeb?: string | null;
  numeroFiscal?: string | null;
  logoPath?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// STATISTIQUES POUR LE DASHBOARD ADMIN
// ============================================================

/**
 * Métriques statistiques pour le tableau de bord administrateur.
 *
 * @interface AdminStats
 * @property {number} totalUtilisateurs - Nombre total d’utilisateurs actifs
 * @property {number} totalAdmins - Nombre d’utilisateurs avec rôle ADMIN
 * @property {number} totalSecretaires - Nombre de SECRETAIRE
 * @property {number} totalMoniteurs - Nombre de MONITEUR
 * @property {number} totalSessionsActives - Nombre de sessions ouvertes
 * @property {number} logsErreur7j - Nombre de logs d’audit en échec ces 7 derniers jours
 * @property {number} logsTotal - Nombre total de logs d’audit
 * @property {number} logsSuccess - Nombre de logs en succès
 * @property {number} logsFailed - Nombre de logs en échec
 */
export interface AdminStats {
  totalUtilisateurs: number;
  totalAdmins: number;
  totalSecretaires: number;
  totalMoniteurs: number;
  totalSessionsActives: number;
  logsErreur7j: number;
  logsTotal: number;
  logsSuccess: number;
  logsFailed: number;
}

// src/types/admin.types.ts (extrait modifié)

/**
 * Tendances évolutives pour les métriques d’administration.
 * Inclut les variations des utilisateurs, sessions et logs d’audit.
 *
 * @interface AdminTrends
 * @property {number} totalUtilisateurs - Variation du nombre d'utilisateurs actifs
 * @property {number} totalAdmins - Variation des administrateurs
 * @property {number} totalSecretaires - Variation des secrétaires
 * @property {number} totalMoniteurs - Variation des moniteurs
 * @property {number} totalSessionsActives - Variation des sessions actives
 * @property {number} logsTotal - Variation du nombre total de logs d’audit
 * @property {number} logsSuccess - Variation du nombre de logs en succès
 * @property {number} logsFailed - Variation du nombre de logs en échec
 * @property {number} logsErreur7j - Variation des logs d’erreur (7 jours glissants) – conservé pour compatibilité
 */
export interface AdminTrends {
  totalUtilisateurs: number;
  totalAdmins: number;
  totalSecretaires: number;
  totalMoniteurs: number;
  totalSessionsActives: number;
  logsTotal: number;
  logsSuccess: number;
  logsFailed: number;
  logsErreur7j: number;
}

// ============================================================
// CONFIGURATION DES COLONNES POUR LE TABLEAU DES LOGS D’AUDIT
// ============================================================

/**
 * Configuration de visibilité des colonnes dans le tableau des logs d’audit.
 *
 * @interface AuditLogsColumnConfig
 * @property {boolean} [showUtilisateur] - Afficher le nom de l’utilisateur (défaut : true)
 * @property {boolean} [showAction] - Afficher l’action (défaut : true)
 * @property {boolean} [showRessource] - Afficher la ressource (défaut : true)
 * @property {boolean} [showDescription] - Afficher la description (défaut : true)
 * @property {boolean} [showIpAddress] - Afficher l’adresse IP (défaut : false)
 * @property {boolean} [showStatut] - Afficher le statut (badge) (défaut : true)
 * @property {boolean} [showCreatedAt] - Afficher la date de création (défaut : true)
 * @property {boolean} [showActions] - Afficher le menu d’actions (défaut : false)
 */
export interface AuditLogsColumnConfig {
  showUtilisateur?: boolean;
  showAction?: boolean;
  showRessource?: boolean;
  showDescription?: boolean;
  showIpAddress?: boolean;
  showStatut?: boolean;
  showCreatedAt?: boolean;
  showActions?: boolean;
}

/**
 * Callbacks d’actions pour le tableau des logs d’audit.
 *
 * @interface AuditLogsTableActions
 * @property {(log: AuditLog) => void} [onViewDetails] - Voir les détails complets (JSON)
 * @property {(userId: number) => void} [onFilterByUser] - Filtrer par cet utilisateur
 */
export interface AuditLogsTableActions {
  onViewDetails?: (log: AuditLog) => void;
  onFilterByUser?: (userId: number) => void;
}

/**
 * Enrichissements optionnels pour injecter les données de l’utilisateur
 * (avatar, nom complet, email) sans modifier le modèle `AuditLog`.
 *
 * @interface AuditLogsEnrichments
 * @property {(log: AuditLog) => string} [getAvatarUrl] - URL de l’avatar de l’utilisateur
 * @property {(log: AuditLog) => string} [getInitials] - Initiales (fallback)
 * @property {(log: AuditLog) => string} [getNomComplet] - Nom complet de l’utilisateur
 * @property {(log: AuditLog) => string} [getEmail] - Email de l’utilisateur
 */
export interface AuditLogsEnrichments {
  getAvatarUrl?: (log: AuditLog) => string;
  getInitials?: (log: AuditLog) => string;
  getNomComplet?: (log: AuditLog) => string;
  getEmail?: (log: AuditLog) => string;
}

/**
 * Options pour la génération des colonnes du tableau des logs d’audit.
 *
 * @interface AuditLogsColumnsOptions
 * @property {AuditLogsColumnConfig} [columnConfig] - Surcharge de la visibilité des colonnes
 * @property {AuditLogsEnrichments} [enrichments] - Données calculées
 * @property {AuditLogsTableActions} [actions] - Callbacks d’actions
 * @property {'admin' | 'auditor'} [variant] - Profil utilisateur
 *   - `admin` : toutes les colonnes, y compris IP et actions
 *   - `auditor` : colonnes essentielles (utilisateur, action, ressource, statut, date)
 */
export interface AuditLogsColumnsOptions {
  columnConfig?: AuditLogsColumnConfig;
  enrichments?: AuditLogsEnrichments;
  actions?: AuditLogsTableActions;
  variant?: 'admin' | 'auditor';
}

// ============================================================
// API ADMIN (logs + company config)
// ============================================================

/**
 * Réponse paginée pour les logs d’audit.
 *
 * @interface AuditLogsPaginatedResponse
 * @property {AuditLog[]} logs - Liste des logs
 * @property {number} total - Nombre total
 * @property {number} page - Page courante
 * @property {number} limit - Limite par page
 * @property {number} totalPages - Nombre total de pages
 */
export interface AuditLogsPaginatedResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Paramètres pour la récupération des logs d’audit paginés.
 *
 * @interface AuditLogsListParams
 * @property {number} [page=1] - Page courante (1-indexed)
 * @property {number} [limit=20] - Nombre d’éléments par page
 * @property {number} [utilisateurId] - Filtrer par utilisateur
 * @property {string} [action] - Filtrer par action (ex: "LOGIN_SUCCESS")
 * @property {string} [ressource] - Filtrer par ressource (ex: "Candidat")
 * @property {'SUCCESS' | 'FAILED'} [statut] - Filtrer par statut
 * @property {string} [dateDebut] - Date de début (ISO 8601)
 * @property {string} [dateFin] - Date de fin (ISO 8601)
 * @property {'today' | 'week' | 'month' | 'all'} [period] - Période prédéfinie
 * @property {string} [search] - Recherche textuelle (action, ressource, description)
 */
export interface AuditLogsListParams {
  page?: number;
  limit?: number;
  utilisateurId?: number;
  action?: string;
  ressource?: string;
  statut?: 'SUCCESS' | 'FAILED';
  dateDebut?: string;
  dateFin?: string;
  period?: 'today' | 'week' | 'month' | 'all';
  search?: string;
}

/**
 * Données d’entrée pour mettre à jour la configuration de l’entreprise.
 *
 * @interface UpdateCompanyConfigInput
 * @property {string} [nom] - Nom de l’auto‑école
 * @property {string | null} [adresse] - Adresse
 * @property {string | null} [telephone] - Téléphone
 * @property {string | null} [email] - Email
 * @property {string | null} [siteWeb] - Site web
 * @property {string | null} [numeroFiscal] - Numéro fiscal
 * @property {string | null} [logoPath] - Chemin du logo
 */
export interface UpdateCompanyConfigInput {
  nom?: string;
  adresse?: string | null;
  telephone?: string | null;
  email?: string | null;
  siteWeb?: string | null;
  numeroFiscal?: string | null;
  logoPath?: string | null;
}

/**
 * Interface de l’API d’administration exposée au renderer via `window.api.admin`.
 *
 * @interface AdminApi
 * @description Toutes les méthodes sont asynchrones et communiquent via IPC.
 *
 * ## Canaux IPC utilisés
 * | Méthode               | Canal IPC                         |
 * |-----------------------|-----------------------------------|
 * | getAuditLogs          | admin:getAuditLogs                |
 * | getAdminStats     | admin:getAdminStats           |
 * | getAdminTrends    | admin:getAdminTrends          |
 * | getCompanyConfig      | admin:getCompanyConfig            |
 * | updateCompanyConfig   | admin:updateCompanyConfig         |
 */
export interface AdminApi {
  /**
   * Récupère la liste paginée des logs d’audit avec filtres.
   * @param params - Paramètres de pagination, filtres et tri
   * @returns Réponse paginée
   */
  getAuditLogs: (params?: AuditLogsListParams) => Promise<AuditLogsPaginatedResponse>;

  /**
   * Récupère les statistiques agrégées des logs d’audit (total, succès, échecs, etc.).
   * @returns Métriques étendues
   */
  getAdminStats: () => Promise<AdminStats>;

  /**
   * Récupère les tendances évolutives des logs d’audit.
   * @returns Variations en pourcentage (mois en cours vs précédent)
   */
  getAdminTrends: () => Promise<AdminTrends>;

  /**
   * Récupère la configuration actuelle de l’entreprise.
   * @returns Configuration complète
   */
  getCompanyConfig: () => Promise<CompanyConfig>;

  /**
   * Met à jour la configuration de l’entreprise.
   * @param data - Champs à modifier (tous optionnels)
   * @returns Configuration mise à jour
   */
  updateCompanyConfig: (data: UpdateCompanyConfigInput) => Promise<CompanyConfig>;
}
