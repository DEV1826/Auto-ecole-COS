/* eslint-disable @typescript-eslint/no-explicit-any */
// src/types/auth.types.ts

/**
 * @module types/auth.types
 * @description
 * Types complets pour l’authentification, la gestion des utilisateurs, des sessions,
 * des permissions et des logs d’audit dans l’auto‑école COS.
 *
 * Ce module exporte :
 * - Les énumérations métier (Role, NiveauAcces, etc.) ré‑exportées depuis `enums.ts`
 * - `Utilisateur` et les DTOs associés
 * - `Session`, `Permission`, `AuditLog`
 * - Les réponses d’API (login, refresh, validation)
 * - Les configurations de colonnes pour les tableaux (utilisateurs, sessions, logs)
 * - Les statistiques pour le dashboard administrateur
 * - L’interface `WindowApi` pour l’exposition IPC dans Electron
 *
 * Toutes les dates sont représentées par `Date | string` (ISO 8601).
 *
 * @author Stive Junior
 * @version 2.0.0
 *
 * @see {@link enums.ts} – Énumérations globales (Role, NiveauAcces, etc.)
 */

// ============================================================
// ÉNUMÉRATIONS
// ============================================================

import type { Role, NiveauAcces } from '@/types/enums';
import type { Permission } from './admin.types';

/**
 * Session utilisateur – correspond au modèle Prisma `Session`.
 *
 * @interface Session
 * @description
 * Enregistre une session active après connexion. Contient le token JWT, le refresh token,
 * l’adresse IP, l’agent utilisateur, la date d’expiration et le statut.
 *
 * @property {number} id - Identifiant unique
 * @property {string | null} ipAddress - Adresse IP du client
 * @property {string | null} userAgent - Chaîne User‑Agent du navigateur/application
 * @property {boolean} actif - Si la session est encore valide
 * @property {Date} dernierAcces - Dernière activité sur cette session
 * @property {Date} createdAt - Date de création de la session
 * @property {Date} expiresAt - Date d’expiration du token d’accès
 *
 * @example
 * ```ts
 * const session: Session = {
 *   id: 1,
 *   ipAddress: '127.0.0.1',
 *   userAgent: 'Electron-App',
 *   actif: true,
 *   dernierAcces: new Date(),
 *   createdAt: new Date(),
 *   expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
 * };
 * ```
 */
export interface Session {
  id: number;
  ipAddress: string | null;
  userAgent: string | null;
  actif: boolean;
  dernierAcces: Date;
  createdAt: Date;
  expiresAt: Date;
}

/**
 * Utilisateur – correspond au modèle Prisma `Utilisateur` (sans le mot de passe).
 *
 * @interface Utilisateur
 * @description
 * Représente un utilisateur du système (admin, secrétaire, moniteur).
 * Le mot de passe n’est jamais exposé côté frontend.
 *
 * @property {number} id - Identifiant unique
 * @property {string} email - Adresse email (unique, utilisée pour la connexion)
 * @property {string} nom - Nom de famille
 * @property {string} prenom - Prénom
 * @property {Role} role - Rôle fonctionnel (ADMIN, SECRETAIRE, MONITEUR)
 * @property {NiveauAcces} niveau - Niveau hiérarchique (SUPER_ADMIN, etc.)
 * @property {boolean} actif - Compte actif (désactivé si false)
 * @property {Date | string} [createdAt] - Date de création du compte
 * @property {Date | string} [updatedAt] - Dernière modification
 * @property {string} [displayName] - Nom complet formaté (ex: "Jean Dupont")
 *
 * @example
 * ```ts
 * const user: Utilisateur = {
 *   id: 1,
 *   email: 'admin@cos-autoecole.com',
 *   nom: 'Admin',
 *   prenom: 'Super',
 *   role: 'ADMIN',
 *   niveau: 'SUPER_ADMIN',
 *   actif: true,
 *   createdAt: '2024-01-01T08:00:00Z',
 *   updatedAt: '2024-01-01T08:00:00Z',
 *   displayName: 'Super Admin',
 * };
 * ```
 */
export interface Utilisateur {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: Role;
  niveau: NiveauAcces;
  actif: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  displayName?: string;
}

/**
 * Utilisateur avec détails supplémentaires (permissions + sessions actives).
 * Utilisé pour les vues détaillées d’administration.
 *
 * @interface UtilisateurDetail
 * @extends Utilisateur
 * @property {Permission[]} permissions - Liste des permissions actives
 * @property {number} sessionsActives - Nombre de sessions actives pour cet utilisateur
 */
export interface UtilisateurDetail extends Utilisateur {
  permissions: Permission[];
  sessionsActives: number;
}

// ============================================================
// RÉPONSES DES ENDPOINTS D’AUTHENTIFICATION
// ============================================================

/**
 * Réponse de l’API après une connexion réussie.
 *
 * @interface LoginResponse
 * @property {number} id - ID utilisateur
 * @property {string} email - Email
 * @property {string} nom - Nom
 * @property {string} prenom - Prénom
 * @property {Role} role - Rôle
 * @property {NiveauAcces} niveau - Niveau d’accès
 * @property {string} displayName - Nom complet
 * @property {string} token - JWT d’accès
 * @property {string} refreshToken - Refresh token JWT
 * @property {number} sessionId - Identifiant de la session créée
 * @property {Permission[]} permissions - Permissions de l’utilisateur
 */
export interface LoginResponse {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: Role;
  niveau: NiveauAcces;
  displayName: string;
  token: string;
  refreshToken: string;
  sessionId: number;
  permissions: Permission[];
}

/**
 * Réponse de validation d’un token d’accès.
 *
 * @interface ValidateTokenResponse
 * @property {boolean} valid - true si le token est valide et la session active
 * @property {object} [user] - Informations utilisateur (si valide)
 * @property {number} [sessionId] - ID de la session associée
 * @property {string} [error] - Message d’erreur (si valide = false)
 */
export interface ValidateTokenResponse {
  valid: boolean;
  user?: {
    id: number;
    email: string;
    role: Role;
    niveau: NiveauAcces;
    nom?: string;
    prenom?: string;
    permissions: Permission[];
  };
  sessionId?: number;
  error?: string;
}

/**
 * Réponse de rafraîchissement du token d’accès.
 *
 * @interface RefreshTokenResponse
 * @property {string} token - Nouveau token d’accès
 * @property {string} refreshToken - Nouveau refresh token
 * @property {number} sessionId - ID de la session mise à jour
 */
export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
  sessionId: number;
}

/**
 * Liste paginée des utilisateurs.
 *
 * @interface UsersListResponse
 * @property {Utilisateur[]} users - Liste des utilisateurs (sans mot de passe)
 * @property {number} total - Nombre total d’utilisateurs
 * @property {number} page - Page courante
 * @property {number} limit - Éléments par page
 * @property {number} totalPages - Nombre total de pages
 */
export interface UsersListResponse {
  users: Utilisateur[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================
// LOGS D’AUDIT
// ============================================================

/**
 * Entrée de log d’audit – correspond au modèle Prisma `AuditLog`.
 *
 * @interface AuditLog
 * @property {number} id - Identifiant unique
 * @property {number | null} utilisateurId - ID de l’utilisateur (null si anonyme)
 * @property {string} action - Code action (LOGIN, CREATE_USER, UPDATE_CANDIDAT, etc.)
 * @property {string | null} ressource - Type de ressource (Utilisateur, Candidat, etc.)
 * @property {number | null} ressourceId - ID de la ressource concernée
 * @property {string | null} description - Description textuelle
 * @property {string | null} ipAddress - Adresse IP de l’utilisateur
 * @property {'SUCCESS' | 'FAILED'} statut - Succès ou échec
 * @property {Date} createdAt - Date et heure
 * @property {object} utilisateur - Informations réduites de l’utilisateur (optionnel)
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
  utilisateur?: {
    id: number;
    email: string;
    nom: string;
    prenom: string;
  } | null;
}

/**
 * Réponse paginée pour les logs d’audit.
 *
 * @interface AuditLogsResponse
 * @property {AuditLog[]} logs - Liste des logs
 * @property {number} total - Nombre total
 * @property {number} page - Page courante
 * @property {number} limit - Limite par page
 * @property {number} totalPages - Nombre total de pages
 */
export interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================
// PARAMÈTRES DES FONCTIONS (DTOs)
// ============================================================

/**
 * Paramètres de connexion.
 *
 * @interface LoginCredentials
 * @property {string} email - Adresse email
 * @property {string} password - Mot de passe en clair
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Paramètres de création d’un nouvel utilisateur (admin).
 *
 * @interface CreateUserParams
 * @property {string} email - Email unique
 * @property {string} nom - Nom de famille
 * @property {string} prenom - Prénom
 * @property {string} password - Mot de passe en clair
 * @property {Role} role - Rôle
 * @property {NiveauAcces} niveau - Niveau d’accès
 * @property {number} [creeParId] - ID de l’utilisateur créateur (optionnel)
 */
export interface CreateUserParams {
  email: string;
  nom: string;
  prenom: string;
  password: string;
  role: Role;
  niveau: NiveauAcces;
  creeParId?: number;
}

/**
 * Paramètres de mise à jour d’un utilisateur.
 *
 * @interface UpdateUserParams
 * @property {number} userId - ID de l’utilisateur à modifier
 * @property {string} [nom] - Nouveau nom
 * @property {string} [prenom] - Nouveau prénom
 * @property {Role} [role] - Nouveau rôle
 * @property {NiveauAcces} [niveau] - Nouveau niveau
 * @property {boolean} [actif] - Activer/désactiver le compte
 * @property {number} updatedByUserId - ID de l’utilisateur qui effectue la modification (pour audit)
 */
export interface UpdateUserParams {
  userId: number;
  nom?: string;
  prenom?: string;
  role?: Role;
  niveau?: NiveauAcces;
  actif?: boolean;
  updatedByUserId: number;
}

/**
 * Paramètres d’assignation d’une permission.
 *
 * @interface AssignPermissionParams
 * @property {number} userId - ID de l’utilisateur bénéficiaire
 * @property {string} ressource - Ressource (ex: "candidats")
 * @property {string} action - Action (create, read, update, delete)
 * @property {number} assignedByUserId - ID de l’utilisateur qui assigne
 */
export interface AssignPermissionParams {
  userId: number;
  ressource: string;
  action: string;
  assignedByUserId: number;
}

/**
 * Filtres pour les logs d’audit.
 *
 * @interface AuditLogFilters
 * @property {number} [utilisateurId] - Filtrer par utilisateur
 * @property {string} [action] - Filtrer par action (ex: "LOGIN_SUCCESS")
 * @property {'SUCCESS' | 'FAILED'} [statut] - Filtrer par statut
 */
export interface AuditLogFilters {
  utilisateurId?: number;
  action?: string;
  statut?: 'SUCCESS' | 'FAILED';
}

// ============================================================
// STATISTIQUES ET TENDANCES POUR LE DASHBOARD ADMIN
// ============================================================

/**
 * Métriques statistiques pour le tableau de bord administrateur.
 *
 * @interface AuthStats
 * @property {number} totalUtilisateurs - Nombre total d’utilisateurs actifs
 * @property {number} totalAdmins - Nombre d’utilisateurs avec rôle ADMIN
 * @property {number} totalSecretaires - Nombre de SECRETAIRE
 * @property {number} totalMoniteurs - Nombre de MONITEUR
 * @property {number} totalSessionsActives - Nombre de sessions ouvertes
 * @property {number} logsErreur7j - Nombre de logs d’audit en échec ces 7 derniers jours
 */
export interface AuthStats {
  totalUtilisateurs: number;
  totalAdmins: number;
  totalSecretaires: number;
  totalMoniteurs: number;
  totalSessionsActives: number;
  logsErreur7j: number;
}

/**
 * Tendances évolutives pour les métriques d’administration.
 *
 * @interface AuthTrends
 * @property {number} totalUtilisateurs - Variation (en pourcentage ou valeur absolue)
 * @property {number} totalAdmins - Variation des administrateurs
 * @property {number} totalSecretaires - Variation des secrétaires
 * @property {number} totalMoniteurs - Variation des moniteurs
 * @property {number} totalSessionsActives - Variation des sessions actives
 * @property {number} logsErreur7j - Variation des logs d’erreur
 */
export interface AuthTrends {
  totalUtilisateurs: number;
  totalAdmins: number;
  totalSecretaires: number;
  totalMoniteurs: number;
  totalSessionsActives: number;
  logsErreur7j: number;
}

// ============================================================
// CONFIGURATIONS DE COLONNES POUR LES TABLEAUX
// ============================================================

/**
 * Configuration des colonnes visibles dans le tableau des utilisateurs.
 *
 * @interface UtilisateursColumnConfig
 * @property {boolean} [showFullName] - Afficher nom + prénom (défaut : true)
 * @property {boolean} [showEmail] - Afficher l’email (défaut : true)
 * @property {boolean} [showRole] - Afficher le rôle (badge) (défaut : true)
 * @property {boolean} [showNiveau] - Afficher le niveau d’accès (défaut : true)
 * @property {boolean} [showActif] - Afficher le statut actif (défaut : true)
 * @property {boolean} [showCreatedAt] - Afficher la date de création (défaut : true)
 * @property {boolean} [showActions] - Afficher le menu d’actions (défaut : true)
 */
export interface UtilisateursColumnConfig {
  showFullName?: boolean;
  showEmail?: boolean;
  showRole?: boolean;
  showNiveau?: boolean;
  showActif?: boolean;
  showCreatedAt?: boolean;
  showActions?: boolean;
  showSessionsActives?: boolean;
  showPermissions?: boolean;
}

/**
 * Callbacks d’actions sur les utilisateurs.
 *
 * @interface UtilisateursTableActions
 * @property {(user: Utilisateur) => void} [onView] - Voir le détail
 * @property {(user: Utilisateur) => void} [onEdit] - Modifier l’utilisateur
 * @property {(user: Utilisateur) => Promise<void>} [onDelete] - Désactiver le compte
 * @property {(user: Utilisateur) => void} [onResetPassword] - Réinitialiser le mot de passe (envoi d’un code)
 * @property {(user: Utilisateur) => void} [onViewPermissions] - Gérer les permissions
 */
export interface UtilisateursTableActions {
  onView?: (user: Utilisateur) => void;
  onEdit?: (user: Utilisateur) => void;
  onDelete?: (user: Utilisateur) => Promise<void>;
  onResetPassword?: (user: Utilisateur) => void;
  onViewPermissions?: (user: Utilisateur) => void;
}

/**
 * Enrichissements optionnels pour injecter des données calculées
 * sans modifier le modèle `Utilisateur`.
 *
 * @interface UsersEnrichments
 * @property {(user: Utilisateur) => string} [getAvatarUrl] - URL de l’avatar
 * @property {(user: Utilisateur) => string} [getInitials] - Initiales (fallback)
 * @property {(user: Utilisateur) => number} [getSessionsCount] - Nombre de sessions actives
 * @property {(user: Utilisateur) => number} [getPermissionsCount] - Nombre de permissions
 * @property {(user: Utilisateur) => string} [getDisplayName] - Nom complet formaté
 */
export interface UsersEnrichments {
  getAvatarUrl?: (user: Utilisateur) => string;
  getInitials?: (user: Utilisateur) => string;
  getSessionsCount?: (user: Utilisateur) => number;
  getPermissionsCount?: (user: Utilisateur) => number;
  getDisplayName?: (user: Utilisateur) => string;
}

/**
 * Options pour le tableau des utilisateurs.
 *
 * @interface UtilisateursColumnsOptions
 * @property {UtilisateursColumnConfig} [columnConfig] - Surcharge
 * @property {UtilisateursTableActions} [actions] - Actions
 * @property {'admin' | 'manager'} [variant] - Profil (admin affiche tout, manager restreint)
 */
export interface UtilisateursColumnsOptions {
  columnConfig?: UtilisateursColumnConfig;
  actions?: UtilisateursTableActions;
  variant?: 'admin' | 'secretaire';
  enrichments?: UsersEnrichments;
}

// ============================================================
// API WINDOW (exposée par le preload Electron)
// ============================================================

/**
 * Interface de l’API d’authentification exposée au renderer via `window.api.auth`.
 *
 * @interface AuthApi
 * @description Toutes les méthodes sont asynchrones et communiquent via IPC.
 */
export interface AuthApi {
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
  logout: (sessionId: number, userId: number) => Promise<{ success: boolean; message: string }>;
  validate: (token: string) => Promise<ValidateTokenResponse>;
  refresh: (refreshToken: string) => Promise<RefreshTokenResponse>;
  createUser: (params: CreateUserParams & { ipAddress?: string }) => Promise<Utilisateur>;
  updateUser: (params: UpdateUserParams & { ipAddress?: string }) => Promise<Utilisateur>;
  deleteUser: (
    userId: number,
    deletedByUserId: number
  ) => Promise<{ success: boolean; message: string }>;
  getAllUsers: (userId: number, page: number, limit: number) => Promise<UsersListResponse>;
  getUserById: (userId: number, requesterId: number) => Promise<UtilisateurDetail>;
  changePassword: (
    userId: number,
    oldPassword: string,
    newPassword: string
  ) => Promise<{ success: boolean; message: string }>;
  assignPermission: (
    params: AssignPermissionParams & { ipAddress?: string }
  ) => Promise<Permission>;
  revokePermission: (
    permissionId: number,
    revokedByUserId: number
  ) => Promise<{ success: boolean; message: string }>;
  getUserPermissions: (userId: number) => Promise<Permission[]>;
  checkPermission: (userId: number, ressource: string, action: string) => Promise<boolean>;
  getUserSessions: (userId: number) => Promise<Session[]>;
  revokeSession: (
    sessionId: number,
    revokedByUserId: number
  ) => Promise<{ success: boolean; message: string }>;
  revokeAllUserSessions: (
    userId: number,
    revokedByUserId: number
  ) => Promise<{ success: boolean; message: string }>;
  getAuditLogs: (
    userId: number,
    page: number,
    limit: number,
    filters: AuditLogFilters
  ) => Promise<AuditLogsResponse>;
  requestPasswordResetByEmail: (
    email: string,
    isAdmin?: boolean
  ) => Promise<{ success: boolean; message: string; code?: string; userId?: number }>;
  validateResetCode: (
    code: string
  ) => Promise<{ valid: boolean; message?: string; userId?: number }>;
  resetPassword: (params: {
    code: string;
    newPassword: string;
  }) => Promise<{ success: boolean; message: string }>;
  getAllResetCodes: (
    userId: number,
    page?: number,
    limit?: number,
    onlyActive?: boolean
  ) => Promise<{ codes: any[]; total: number; page: number; limit: number; totalPages: number }>;
}

/**
 * Interface complète de l’objet `window.api` exposé par Electron.
 *
 * @interface WindowApi
 * @property {AuthApi} auth - Méthodes d’authentification et gestion des utilisateurs
 * @property {object} enums - Énumérations pour le frontend (Role, NiveauAcces, etc.)
 */
export interface WindowApi {
  auth: AuthApi;
  enums: {
    Role: Record<string, Role>;
    NiveauAcces: Record<string, NiveauAcces>;
    // Les autres enums sont optionnels mais peuvent être exposés si nécessaire
  };
}

declare global {
  interface Window {
    api: WindowApi;
  }
}
