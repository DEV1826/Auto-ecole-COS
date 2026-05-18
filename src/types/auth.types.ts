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
 * - L’interface `AuthApi` pour l’exposition IPC dans Electron
 *
 * Toutes les dates sont représentées par `Date | string` (ISO 8601).
 *
 * @author Stive Junior
 * @version 3.0.0
 *
 * @see {@link enums.ts} – Énumérations globales (Role, NiveauAcces, etc.)
 * @see {@link admin.types.ts} – Types pour l’administration (logs d’audit, permissions)
 */

// ============================================================
// IMPORTS
// ============================================================

import type { Role, NiveauAcces } from '@/types/enums';
import type { Permission } from './admin.types';

// ============================================================
// MODÈLES PRINCIPAUX
// ============================================================

/**
 * Session utilisateur – correspond au modèle Prisma `Session`.
 *
 * @interface Session
 * @description
 * Enregistre une session active après connexion. Contient le token JWT, le refresh token,
 * l’adresse IP, l’agent utilisateur, la date d’expiration et le statut.
 *
 * @property {number} id - Identifiant unique de la session
 * @property {string | null} ipAddress - Adresse IP du client (null si non disponible)
 * @property {string | null} userAgent - Chaîne User‑Agent du navigateur/application
 * @property {boolean} actif - État de la session (true = active)
 * @property {Date} dernierAcces - Dernière activité enregistrée sur cette session
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
 * @property {number} id - Identifiant unique de l’utilisateur
 * @property {string} email - Adresse email (unique, utilisée pour la connexion)
 * @property {string} nom - Nom de famille
 * @property {string} prenom - Prénom
 * @property {Role} role - Rôle fonctionnel (ADMIN, SECRETAIRE, MONITEUR)
 * @property {NiveauAcces} niveau - Niveau hiérarchique (SUPER_ADMIN, ADMIN, MANAGER, STANDARD, GUEST)
 * @property {boolean} actif - État du compte (true = actif)
 * @property {Date | string} [createdAt] - Horodatage de création du compte (ISO 8601)
 * @property {Date | string} [updatedAt] - Horodatage de la dernière modification
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

  sessionsActivesCount?: number;
  permissionsCount?: number;
}

/**
 * Utilisateur avec détails supplémentaires (permissions + sessions actives).
 * Utilisé pour les vues détaillées d’administration.
 *
 * @interface UtilisateurDetail
 * @extends Utilisateur
 * @property {Permission[]} permissions - Liste des permissions actives de l’utilisateur
 * @property {number} sessionsActives - Nombre de sessions actives actuellement ouvertes
 */
export interface UtilisateurDetail extends Utilisateur {
  permissions: Permission[];
  sessionsActives: number;
}

// ============================================================
// STATISTIQUES, TENDANCES ET SPARKLINES POUR LE DASHBOARD ADMIN
// ============================================================

/**
 * Métriques statistiques agrégées pour les utilisateurs.
 */
export interface AuthStats {
  totalUtilisateurs: number;
  totalAdmins: number;
  totalSecretaires: number;
  totalMoniteurs: number;
  totalSessionsActives: number;
  utilisateursInactifs: number;
}

/**
 * Tendances évolutives des métriques utilisateurs (mois en cours vs mois précédent).
 */
export interface AuthTrends {
  totalUtilisateurs: number; // variation en pourcentage
  totalAdmins: number;
  totalSecretaires: number;
  totalMoniteurs: number;
  totalSessionsActives: number;
}

/**
 * Données des sparklines pour les 12 derniers mois.
 */
export interface AuthSparklineData {
  totalUtilisateursSparkline: { values: number[]; labels?: string[] };
  totalAdminsSparkline: { values: number[]; labels?: string[] };
  totalSecretairesSparkline: { values: number[]; labels?: string[] };
  totalMoniteursSparkline: { values: number[]; labels?: string[] };
}

// ============================================================
// RÉPONSES DES ENDPOINTS D’AUTHENTIFICATION
// ============================================================

/**
 * Réponse de l’API après une connexion réussie.
 *
 * @interface LoginResponse
 * @property {number} id - Identifiant de l’utilisateur connecté
 * @property {string} email - Adresse email de l’utilisateur
 * @property {string} nom - Nom de famille
 * @property {string} prenom - Prénom
 * @property {Role} role - Rôle fonctionnel
 * @property {NiveauAcces} niveau - Niveau d’accès
 * @property {string} displayName - Nom complet formaté (prenom + nom)
 * @property {string} token - JWT d’accès (à utiliser dans les requêtes authentifiées)
 * @property {string} refreshToken - Refresh token JWT (pour rafraîchir le token d’accès)
 * @property {number} sessionId - Identifiant de la session créée
 * @property {Permission[]} permissions - Liste des permissions actives de l’utilisateur
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
 * @property {object} [user] - Informations utilisateur (présent si valid = true)
 * @property {number} [user.id] - ID de l’utilisateur
 * @property {string} [user.email] - Email de l’utilisateur
 * @property {Role} [user.role] - Rôle
 * @property {NiveauAcces} [user.niveau] - Niveau d’accès
 * @property {string} [user.nom] - Nom (optionnel)
 * @property {string} [user.prenom] - Prénom (optionnel)
 * @property {Permission[]} [user.permissions] - Permissions actives
 * @property {number} [sessionId] - Identifiant de la session associée
 * @property {string} [error] - Message d’erreur (présent si valid = false)
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
 * @property {string} token - Nouveau token d’accès JWT
 * @property {string} refreshToken - Nouveau refresh token JWT
 * @property {number} sessionId - Identifiant de la session mise à jour
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
 * @property {number} total - Nombre total d’utilisateurs (tous filtres confondus)
 * @property {number} page - Page courante (1-indexed)
 * @property {number} limit - Nombre d’éléments par page
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
// PARAMÈTRES DES FONCTIONS (DTOs)
// ============================================================

/**
 * Paramètres de connexion.
 *
 * @interface LoginCredentials
 * @property {string} email - Adresse email de l’utilisateur
 * @property {string} password - Mot de passe en clair (sera haché côté serveur)
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Paramètres de création d’un nouvel utilisateur (admin).
 *
 * @interface CreateUserParams
 * @property {string} email - Adresse email unique
 * @property {string} nom - Nom de famille
 * @property {string} prenom - Prénom
 * @property {string} password - Mot de passe en clair
 * @property {Role} role - Rôle fonctionnel (ADMIN, SECRETAIRE, MONITEUR)
 * @property {NiveauAcces} niveau - Niveau d’accès hiérarchique
 * @property {number} [creeParId] - Identifiant de l’utilisateur créateur (optionnel, pour audit)
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

export interface DeveloperSetupAccessResponse {
  success: boolean;
  accessToken: string;
  expiresAt: number;
}

export interface InitialSetupParams {
  accessToken: string;
  company: {
    nom: string;
    adresse?: string | null;
    telephone?: string | null;
    email?: string | null;
    siteWeb?: string | null;
    numeroFiscal?: string | null;
    logoPath?: string | null;
  };
  admin: {
    email: string;
    nom: string;
    prenom: string;
    password: string;
  };
}

export interface InitialSetupResponse {
  success: boolean;
  company: {
    id: number;
    nom: string;
    adresse?: string | null;
    telephone?: string | null;
    email?: string | null;
    siteWeb?: string | null;
    numeroFiscal?: string | null;
    logoPath?: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
  };
  admin: Utilisateur;
}

/**
 * Paramètres de mise à jour d’un utilisateur.
 *
 * @interface UpdateUserParams
 * @property {number} userId - Identifiant de l’utilisateur à modifier
 * @property {string} [nom] - Nouveau nom de famille
 * @property {string} [prenom] - Nouveau prénom
 * @property {Role} [role] - Nouveau rôle
 * @property {NiveauAcces} [niveau] - Nouveau niveau d’accès
 * @property {boolean} [actif] - Nouvel état du compte (actif/inactif)
 * @property {number} updatedByUserId - Identifiant de l’utilisateur qui effectue la modification (pour audit)
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
 * @property {number} userId - Identifiant de l’utilisateur bénéficiaire
 * @property {string} ressource - Nom de la ressource (ex: "candidats", "paiements", "utilisateurs")
 * @property {string} action - Action autorisée (create, read, update, delete)
 * @property {number} assignedByUserId - Identifiant de l’utilisateur qui assigne la permission
 */
export interface AssignPermissionParams {
  userId: number;
  ressource: string;
  action: string;
  assignedByUserId: number;
}

// ============================================================
// CONFIGURATIONS DE COLONNES POUR LES TABLEAUX
// ============================================================

/**
 * Configuration des colonnes visibles dans le tableau des utilisateurs.
 * Utilisé pour adapter l’affichage selon le rôle ou les préférences.
 *
 * @interface UtilisateursColumnConfig
 * @property {boolean} [showFullName] - Afficher le nom complet (défaut : true)
 * @property {boolean} [showEmail] - Afficher l’adresse email (défaut : true)
 * @property {boolean} [showRole] - Afficher le rôle (badge coloré) (défaut : true)
 * @property {boolean} [showNiveau] - Afficher le niveau d’accès (défaut : true)
 * @property {boolean} [showActif] - Afficher le statut actif/inactif (défaut : true)
 * @property {boolean} [showCreatedAt] - Afficher la date de création (défaut : true)
 * @property {boolean} [showActions] - Afficher le menu d’actions (défaut : true)
 * @property {boolean} [showSessionsActives] - Afficher le nombre de sessions actives (défaut : false)
 * @property {boolean} [showPermissions] - Afficher le nombre de permissions (défaut : false)
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

// ============================================================
// ACTIONS ET ENRICHISSEMENTS POUR LE TABLEAU DES UTILISATEURS
// ============================================================

/**
 * Callbacks d’actions sur une ligne du tableau des utilisateurs.
 *
 * @interface UtilisateursTableActions
 * @property {(user: Utilisateur) => void} [onView] - Naviguer vers le détail de l’utilisateur
 * @property {(user: Utilisateur) => void} [onEdit] - Ouvrir le formulaire de modification
 * @property {(user: Utilisateur) => Promise<void>} [onDelete] - Désactiver (soft delete) le compte
 * @property {(user: Utilisateur) => void} [onResetPassword] - Réinitialiser le mot de passe (génère un code OTP)
 * @property {(user: Utilisateur) => void} [onViewPermissions] - Gérer les permissions de l’utilisateur
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
 * @property {(user: Utilisateur) => string} [getAvatarUrl] - URL de l’avatar de l’utilisateur
 * @property {(user: Utilisateur) => string} [getInitials] - Initiales (fallback pour l’avatar)
 * @property {(user: Utilisateur) => number} [getSessionsCount] - Nombre de sessions actives de l’utilisateur
 * @property {(user: Utilisateur) => number} [getPermissionsCount] - Nombre de permissions actives
 * @property {(user: Utilisateur) => string} [getDisplayName] - Nom complet formaté (prenom + nom)
 */
export interface UsersEnrichments {
  getAvatarUrl?: (user: Utilisateur) => string;
  getInitials?: (user: Utilisateur) => string;
  getSessionsCount?: (user: Utilisateur) => number;
  getPermissionsCount?: (user: Utilisateur) => number;
  getDisplayName?: (user: Utilisateur) => string;
}

/**
 * Options complètes pour la génération des colonnes du tableau des utilisateurs.
 *
 * @interface UtilisateursColumnsOptions
 * @property {UtilisateursColumnConfig} [columnConfig] - Surcharge de la visibilité des colonnes
 * @property {UtilisateursTableActions} [actions] - Callbacks d’actions sur les lignes
 * @property {'admin' | 'secretaire'} [variant] - Profil utilisateur (admin affiche tout, secretaire restreint)
 * @property {UsersEnrichments} [enrichments] - Données calculées pour l’affichage (avatar, sessions, etc.)
 */
export interface UtilisateursColumnsOptions {
  columnConfig?: UtilisateursColumnConfig;
  actions?: UtilisateursTableActions;
  variant?: 'admin' | 'secretaire';
  enrichments?: UsersEnrichments;
}

// ============================================================
// API WINDOW — AUTH (exposée par le preload Electron)
// ============================================================

/**
 * Interface de l’API d’authentification exposée au renderer via `window.api.auth`.
 *
 * @interface AuthApi
 * @description Toutes les méthodes sont asynchrones et communiquent via IPC Electron.
 * Les canaux correspondants sont définis dans `preload.js` et `main.js`.
 *
 * ## Canaux IPC utilisés
 * | Méthode                      | Canal IPC                           |
 * |------------------------------|-------------------------------------|
 * | login                        | auth:login                          |
 * | logout                       | auth:logout                         |
 * | validate                     | auth:validate                       |
 * | refresh                      | auth:refresh                        |
 * | createUser                   | auth:createUser                     |
 * | updateUser                   | auth:updateUser                     |
 * | deleteUser                   | auth:deleteUser                     |
 * | getAllUsers                  | auth:getAllUsers                    |
 * | getUserById                  | auth:getUserById                    |
 * | changePassword               | auth:changePassword                 |
 * | assignPermission             | auth:assignPermission               |
 * | revokePermission             | auth:revokePermission               |
 * | getUserPermissions           | auth:getUserPermissions             |
 * | checkPermission              | auth:checkPermission                |
 * | getUserSessions              | auth:getUserSessions                |
 * | revokeSession                | auth:revokeSession                  |
 * | revokeAllUserSessions        | auth:revokeAllUserSessions          |
 * | requestPasswordResetByEmail  | auth:requestPasswordResetByEmail    |
 * | validateResetCode            | auth:validateResetCode              |
 * | resetPassword                | auth:resetPassword                  |
 * | getAllResetCodes             | auth:getAllResetCodes               |
 */
export interface AuthApi {
  /**
   * Connecte un utilisateur et crée une session JWT.
   * @param credentials - Email et mot de passe
   * @returns Informations de session + token
   */
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;

  /**
   * Déconnecte un utilisateur en invalidant sa session.
   * @param sessionId - Identifiant de la session à invalider
   * @param userId - Identifiant de l’utilisateur (pour audit)
   * @returns Résultat de l’opération
   */
  logout: (sessionId: number, userId: number) => Promise<{ success: boolean; message: string }>;

  /**
   * Valide un token d’accès JWT et retourne les informations utilisateur associées.
   * @param token - Token JWT à valider
   * @returns État de validité et détails utilisateur
   */
  validate: (token: string) => Promise<ValidateTokenResponse>;

  /**
   * Rafraîchit un token d’accès à l’aide d’un refresh token.
   * @param refreshToken - Refresh token JWT
   * @returns Nouveau token d’accès + nouveau refresh token + ID session
   */
  refresh: (refreshToken: string) => Promise<RefreshTokenResponse>;

  /**
   * Crée un nouvel utilisateur (droits admin requis).
   * @param params - Données du nouvel utilisateur + adresse IP (optionnelle)
   * @returns Utilisateur créé (sans mot de passe)
   */
  createUser: (params: CreateUserParams & { ipAddress?: string }) => Promise<Utilisateur>;

  verifyDeveloperSetupCode: (code: string) => Promise<DeveloperSetupAccessResponse>;

  createInitialSetup: (params: InitialSetupParams) => Promise<InitialSetupResponse>;

  /**
   * Met à jour les informations d’un utilisateur existant (patch partiel).
   * @param params - Identifiant + champs à modifier + adresse IP (pour audit)
   * @returns Utilisateur mis à jour
   */
  updateUser: (params: UpdateUserParams & { ipAddress?: string }) => Promise<Utilisateur>;

  /**
   * Désactive (soft-delete) un compte utilisateur.
   * @param userId - Identifiant de l’utilisateur à désactiver
   * @param deletedByUserId - Identifiant de l’utilisateur qui effectue la suppression
   * @returns Résultat de l’opération
   */
  deleteUser: (
    userId: number,
    deletedByUserId: number
  ) => Promise<{ success: boolean; message: string }>;

  /**
   * Récupère la liste paginée des utilisateurs (droits admin requis).
   * @param userId - Identifiant de l’utilisateur qui consulte (pour vérification des droits)
   * @param page - Numéro de page (1-indexed)
   * @param limit - Nombre d’éléments par page (max 200)
   * @returns Liste paginée des utilisateurs
   */
  getAllUsers: (userId: number, page: number, limit: number) => Promise<UsersListResponse>;

  /**
   * Récupère les détails complets d’un utilisateur (permissions + sessions actives).
   * @param userId - Identifiant de l’utilisateur à consulter
   * @param requesterId - Identifiant de l’utilisateur qui fait la demande (vérification des droits)
   * @returns Utilisateur détaillé
   */
  getUserById: (userId: number, requesterId: number) => Promise<UtilisateurDetail>;

  /**
   * Change le mot de passe d’un utilisateur (vérifie l’ancien mot de passe).
   * @param userId - Identifiant de l’utilisateur
   * @param oldPassword - Ancien mot de passe (en clair)
   * @param newPassword - Nouveau mot de passe (en clair)
   * @returns Résultat de l’opération
   */
  changePassword: (
    userId: number,
    oldPassword: string,
    newPassword: string
  ) => Promise<{ success: boolean; message: string }>;

  /**
   * Assigne une permission à un utilisateur.
   * @param params - Identifiant de l’utilisateur, ressource, action, adresse IP, etc.
   * @returns Permission créée ou mise à jour
   */
  assignPermission: (
    params: AssignPermissionParams & { ipAddress?: string }
  ) => Promise<Permission>;

  /**
   * Révoque (désactive) une permission.
   * @param permissionId - Identifiant de la permission à révoquer
   * @param revokedByUserId - Identifiant de l’utilisateur qui révoque (pour audit)
   * @returns Résultat de l’opération
   */
  revokePermission: (
    permissionId: number,
    revokedByUserId: number
  ) => Promise<{ success: boolean; message: string }>;

  /**
   * Récupère toutes les permissions actives d’un utilisateur.
   * @param userId - Identifiant de l’utilisateur
   * @returns Liste des permissions
   */
  getUserPermissions: (userId: number) => Promise<Permission[]>;

  /**
   * Vérifie si un utilisateur possède une permission spécifique (ressource + action).
   * @param userId - Identifiant de l’utilisateur
   * @param ressource - Nom de la ressource (ex: "candidats")
   * @param action - Action (create, read, update, delete)
   * @returns true si la permission est active, false sinon
   */
  checkPermission: (userId: number, ressource: string, action: string) => Promise<boolean>;

  /**
   * Récupère toutes les sessions actives d’un utilisateur.
   * @param userId - Identifiant de l’utilisateur
   * @returns Liste des sessions (avec IP, userAgent, dates)
   */
  getUserSessions: (userId: number) => Promise<Session[]>;

  /**
   * Révoque (invalide) une session spécifique (déconnexion forcée).
   * @param sessionId - Identifiant de la session à révoquer
   * @param revokedByUserId - Identifiant de l’utilisateur qui effectue la révocation
   * @returns Résultat de l’opération
   */
  revokeSession: (
    sessionId: number,
    revokedByUserId: number
  ) => Promise<{ success: boolean; message: string }>;

  /**
   * Révoque toutes les sessions actives d’un utilisateur (déconnexion forcée).
   * @param userId - Identifiant de l’utilisateur
   * @param revokedByUserId - Identifiant de l’utilisateur qui effectue la révocation
   * @returns Résultat de l’opération
   */
  revokeAllUserSessions: (
    userId: number,
    revokedByUserId: number
  ) => Promise<{ success: boolean; message: string }>;

  /**
   * Demande un code OTP de réinitialisation de mot de passe pour un email.
   * Si `isAdmin` est true, le code est retourné directement (usage admin).
   * @param email - Adresse email de l’utilisateur
   * @param isAdmin - Indique si la demande provient d’un administrateur (retourne le code)
   * @returns Succès + message (et code + userId si isAdmin = true)
   */
  requestPasswordResetByEmail: (
    email: string,
    isAdmin?: boolean
  ) => Promise<{ success: boolean; message: string; code?: string; userId?: number }>;

  /**
   * Valide un code OTP de réinitialisation.
   * @param code - Code à 6 chiffres
   * @returns Validité + userId si valide
   */
  validateResetCode: (
    code: string
  ) => Promise<{ valid: boolean; message?: string; userId?: number }>;

  /**
   * Réinitialise le mot de passe à l’aide d’un code OTP valide.
   * @param params - Code OTP et nouveau mot de passe
   * @returns Résultat de l’opération
   */
  resetPassword: (params: {
    code: string;
    newPassword: string;
  }) => Promise<{ success: boolean; message: string }>;

  /**
   * Récupère tous les codes de réinitialisation générés (admin uniquement).
   * @param userId - Identifiant de l’administrateur qui consulte
   * @param page - Page courante (optionnel)
   * @param limit - Éléments par page (optionnel)
   * @param onlyActive - Ne retourner que les codes non utilisés et non expirés (optionnel)
   * @returns Liste paginée des codes
   */
  getAllResetCodes: (
    userId: number,
    page?: number,
    limit?: number,
    onlyActive?: boolean
  ) => Promise<{ codes: any[]; total: number; page: number; limit: number; totalPages: number }>;

  /**
   * Récupère les statistiques agrégées des utilisateurs.
   *
   */
  getStats: () => Promise<AuthStats>;

  /**
   * Récupère les tendances évolutives des utilisateurs.
   */
  getTrends: () => Promise<AuthTrends>;

  /**
   * Récupère les données des sparklines pour les 12 derniers mois.
   */
  getSparklines: () => Promise<AuthSparklineData>;
}
