/* eslint-disable @typescript-eslint/no-explicit-any */
// /home/stive-junior/Auto-ecole-COS/src/hooks/use.auth.ts

/**
 * @module useAuth
 * @description
 * Hook personnalisé pour l'authentification et l'autorisation.
 * Fournit un accès simplifié au store Zustand d'authentification (`useAuthStore`).
 * Expose l’état (utilisateur, permissions, sessions, liste des utilisateurs, etc.)
 * et toutes les actions (connexion, gestion des utilisateurs, permissions, sessions,
 * réinitialisation par code OTP).
 *
 * @example
 * ```tsx
 * const { login, isAuthenticated, hasPermission } = useAuth();
 *
 * // Connexion
 * await login({ email, password });
 *
 * // Vérification de permission
 * if (hasPermission('candidats', 'create')) {
 *   // Afficher le bouton d'ajout
 * }
 *
 * // Rafraîchir périodiquement le token
 * const { refreshIfNeeded } = useAuth();
 * useEffect(() => {
 *   refreshIfNeeded();
 * }, []);
 * ```
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @see {@link useAuthStore} – Store Zustand sous‑jacent
 * @see {@link auth.types.ts} – Types associés
 */

import { useEffect, useCallback } from 'react';
import type {
  Utilisateur,
  Session,
  UsersListResponse,
  LoginCredentials,
  LoginResponse,
  UtilisateurDetail,
  CreateUserParams,
  UpdateUserParams,
  AuthStats,
  AuthTrends,
  AuthSparklineData,
} from '../types/auth.types';
import { useAuthStore } from '@/store/auth.store';
import type { Permission } from '@/types/admin.types';

// ===============================
// INTERFACE DE RETOUR DU HOOK
// ===============================

/**
 * @interface UseAuth
 * @description Interface décrivant toutes les propriétés et méthodes retournées par le hook `useAuth`.
 */
export interface UseAuth {
  // ===== ÉTAT GLOBAL D’AUTHENTIFICATION =====
  /** Indique si l'utilisateur est actuellement authentifié (token valide et session active). */
  isAuthenticated: boolean;
  /** Identifiant de la session active (stocké côté serveur). */
  sessionId: number | null;
  /** Utilisateur courant (connecté). Contient toutes les informations publiques. */
  user: Utilisateur | null;
  /** Liste des permissions actives de l'utilisateur courant (stockées localement). */
  permissions: Permission[];
  /** Indicateur de chargement global (connexion, rafraîchissement, etc.). */
  isLoading: boolean;
  /** Dernière erreur survenue (ex: "Identifiants invalides"). */
  lastError: string | null;
  /** Flag pour afficher un message de bienvenue après la connexion (réinitialisable). */
  showWelcome: boolean;

  // ===== GESTION DES UTILISATEURS (admin) =====
  /** Liste paginée de tous les utilisateurs (nécessite droits admin). */
  allUsers: Utilisateur[];
  /** Indicateur de chargement de la liste des utilisateurs. */
  usersLoading: boolean;
  /** Erreur lors du chargement ou de la modification des utilisateurs. */
  usersError: string | null;
  /** Informations de pagination pour la liste des utilisateurs. */
  usersPagination: { page: number; limit: number; total: number; totalPages: number };

  // ===== SESSIONS DE L’UTILISATEUR COURANT =====
  /** Liste des sessions actives de l'utilisateur courant. */
  userSessions: Session[];
  /** Dernière session active (la plus récente) – pratique pour l'affichage. */
  lastSession: Session | null;
  /** Indicateur de chargement des sessions. */
  sessionsLoading: boolean;
  // ===== STATISTIQUES, TENDANCES ET SPARKLINES =====
  /** Statistiques agrégées des utilisateurs pour le dashboard admin. */
  stats: AuthStats | null;
  /** Indicateur de chargement des statistiques utilisateurs. */
  statsLoading: boolean;
  /** Erreur lors du chargement des statistiques. */
  statsError: string | null;

  /** Tendances évolutives des utilisateurs (30j vs 30j précédents). */
  trends: AuthTrends | null;
  /** Indicateur de chargement des tendances. */
  trendsLoading: boolean;
  /** Erreur lors du chargement des tendances. */
  trendsError: string | null;

  /** Données des sparklines pour les 12 derniers mois. */
  sparklines: AuthSparklineData | null;
  /** Indicateur de chargement des sparklines. */
  sparklinesLoading: boolean;
  /** Erreur lors du chargement des sparklines. */
  sparklinesError: string | null;
  // ===== ACTIONS PRINCIPALES D’AUTHENTIFICATION =====
  /**
   * Connecte un utilisateur avec ses identifiants.
   * @param credentials - Email et mot de passe.
   * @returns Réponse de l’API contenant le token et les informations utilisateur.
   * @throws {Error} Si la validation échoue ou si l’API retourne une erreur.
   */
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;

  /**
   * Déconnecte l’utilisateur courant (invalide la session côté serveur et efface l’état local).
   * @returns Promise résolue après la déconnexion.
   */
  logout: () => Promise<void>;

  /**
   * Rafraîchit manuellement le token d’accès à l’aide du refresh token stocké.
   * @returns Nouveau token, refresh token et identifiant de session.
   * @throws {Error} Si aucun refresh token n’est disponible ou si l’API échoue.
   */
  refreshToken: () => Promise<{ token: string; refreshToken: string; sessionId: number }>;

  /**
   * Valide le token actuel et resynchronise l’état utilisateur si nécessaire.
   * @returns Objet indiquant si le token est valide, avec un éventuel message d’erreur.
   */
  validateToken: () => Promise<{ valid: boolean; error?: string }>;

  /**
   * Change le mot de passe de l’utilisateur courant (vérifie l’ancien mot de passe).
   * @param data - Ancien mot de passe, nouveau mot de passe et confirmation.
   * @returns Résultat de l’opération.
   * @throws {Error} Si la validation échoue ou si l’API retourne une erreur.
   */
  changePassword: (data: {
    oldPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }) => Promise<{ success: boolean; message: string }>;

  /**
   * Vérifie si la session est encore valide (token non expiré) et tente un refresh automatique.
   * @returns true si la session est valide, false sinon.
   */
  isSessionValid: () => Promise<boolean>;

  /**
   * Modifie l’état du flag d’affichage du message de bienvenue.
   * @param value - Nouvelle valeur.
   */
  setShowWelcome: (value: boolean) => void;

  // ===== RÉINITIALISATION PAR CODE OTP =====
  /**
   * Demande un code OTP de réinitialisation pour un email.
   * @param email - Adresse email de l’utilisateur.
   * @param isAdmin - Si true, le code est retourné directement dans la réponse (usage admin).
   * @returns Succès + message (et code + userId si isAdmin = true).
   */
  requestPasswordResetByEmail: (
    email: string,
    isAdmin?: boolean
  ) => Promise<{
    success: boolean;
    message: string;
    code?: string;
    userId?: number;
  }>;

  /**
   * Valide un code OTP de réinitialisation.
   * @param code - Code à 6 chiffres.
   * @returns Validité + userId si valide.
   */
  validateResetCode: (
    code: string
  ) => Promise<{ valid: boolean; message?: string; userId?: number }>;

  /**
   * Réinitialise le mot de passe à l’aide d’un code OTP valide.
   * @param params - Code OTP et nouveau mot de passe.
   * @returns Résultat de l’opération.
   */
  resetPassword: (params: {
    code: string;
    newPassword: string;
  }) => Promise<{ success: boolean; message: string }>;

  /**
   * Récupère tous les codes de réinitialisation générés (admin uniquement).
   * @param page - Page courante (défaut : 1).
   * @param limit - Éléments par page (défaut : 20).
   * @param onlyActive - Ne retourner que les codes non utilisés et non expirés (défaut : false).
   * @returns Liste paginée des codes.
   */
  getAllResetCodes: (
    page?: number,
    limit?: number,
    onlyActive?: boolean
  ) => Promise<{ codes: any[]; total: number; page: number; limit: number; totalPages: number }>;

  // ═════ STATISTIQUES, TENDANCES ET SPARKLINES ═════

  /**
   * Récupère les statistiques agrégées des utilisateurs.
   * @returns Objet contenant les statistiques (total par rôle, sessions actives, inactifs).
   * @throws {Error} Si l'API échoue.
   */
  getStats: () => Promise<AuthStats>;

  /**
   * Récupère les tendances évolutives des utilisateurs.
   * Compare les 30 derniers jours avec la période précédente.
   * @returns Objet contenant les variations en pourcentage.
   * @throws {Error} Si l'API échoue.
   */
  getTrends: () => Promise<AuthTrends>;

  /**
   * Récupère les données des sparklines pour les 12 derniers mois.
   * Génère les mini-graphiques pour l'affichage des KPI.
   * @returns Objet contenant les données historiques mensuelles par rôle.
   * @throws {Error} Si l'API échoue.
   */
  getSparklines: () => Promise<AuthSparklineData>;

  // ===== GESTION DES UTILISATEURS (admin) =====
  /**
   * Récupère la liste paginée de tous les utilisateurs (nécessite droits admin).
   * @param page - Numéro de page (défaut : 1).
   * @param limit - Nombre d’éléments par page (max 200, défaut : 20).
   * @returns Réponse paginée contenant la liste des utilisateurs.
   * @throws {Error} Si l’utilisateur n’est pas authentifié ou si l’API échoue.
   */
  getAllUsers: (page?: number, limit?: number) => Promise<UsersListResponse>;

  /**
   * Récupère les détails complets d’un utilisateur (permissions + sessions actives).
   * @param userId - Identifiant de l’utilisateur à consulter.
   * @returns Utilisateur détaillé.
   * @throws {Error} Si l’utilisateur n’est pas authentifié ou si l’API échoue.
   */
  getUserById: (userId: number) => Promise<UtilisateurDetail>;

  /**
   * Crée un nouvel utilisateur (nécessite droits admin).
   * @param userData - Données du nouvel utilisateur (email, nom, prénom, mot de passe, rôle, niveau).
   * @returns Utilisateur créé (sans mot de passe).
   * @throws {Error} Si la validation échoue ou si l’API retourne une erreur.
   */
  createUser: (userData: Omit<CreateUserParams, 'creeParId'>) => Promise<Utilisateur>;

  /**
   * Met à jour les informations d’un utilisateur existant.
   * @param userId - Identifiant de l’utilisateur à modifier.
   * @param updateData - Champs à modifier (partiels).
   * @returns Utilisateur mis à jour.
   * @throws {Error} Si la validation échoue ou si l’API retourne une erreur.
   */
  updateUser: (
    userId: number,
    updateData: Partial<Omit<UpdateUserParams, 'userId' | 'updatedByUserId'>>
  ) => Promise<Utilisateur>;

  /**
   * Désactive (soft delete) un compte utilisateur.
   * @param userId - Identifiant de l’utilisateur à désactiver.
   * @returns Résultat de l’opération.
   * @throws {Error} Si l’utilisateur n’est pas authentifié ou si l’API échoue.
   */
  deleteUser: (userId: number) => Promise<{ success: boolean; message: string }>;

  // ===== PERMISSIONS =====
  /**
   * Récupère toutes les permissions actives d’un utilisateur.
   * @param userId - Identifiant de l’utilisateur.
   * @returns Liste des permissions.
   */
  getUserPermissions: (userId: number) => Promise<Permission[]>;

  /**
   * Assigne une permission à un utilisateur (nécessite droits admin).
   * @param userId - Identifiant de l’utilisateur bénéficiaire.
   * @param ressource - Nom de la ressource (ex: "candidats").
   * @param action - Action autorisée (create, read, update, delete).
   * @returns Permission créée ou mise à jour.
   * @throws {Error} Si l’utilisateur n’est pas authentifié ou si l’API échoue.
   */
  assignPermission: (userId: number, ressource: string, action: string) => Promise<Permission>;

  /**
   * Révoque (désactive) une permission.
   * @param permissionId - Identifiant de la permission à révoquer.
   * @returns Résultat de l’opération.
   * @throws {Error} Si l’utilisateur n’est pas authentifié ou si l’API échoue.
   */
  revokePermission: (permissionId: number) => Promise<{ success: boolean; message: string }>;

  /**
   * Vérifie si l’utilisateur courant possède une permission spécifique (appel API).
   * @param ressource - Nom de la ressource.
   * @param action - Action.
   * @returns true si la permission est active, false sinon.
   */
  checkPermission: (ressource: string, action: string) => Promise<boolean>;

  /**
   * Vérification synchrone basée sur les permissions stockées localement.
   * @param ressource - Nom de la ressource.
   * @param action - Action.
   * @returns true si la permission est présente dans l’état local.
   */
  hasPermission: (ressource: string, action: string) => boolean;

  /**
   * Vérifie si l’utilisateur courant a un niveau d’accès suffisant.
   * @param level - Niveau requis (SUPER_ADMIN, ADMIN, MANAGER, STANDARD, GUEST).
   * @returns true si le niveau de l’utilisateur est inférieur ou égal au niveau requis.
   */
  hasLevel: (level: string) => boolean;

  // ===== SESSIONS (admin) =====
  /**
   * Récupère toutes les sessions actives d’un utilisateur.
   * @param userId - Identifiant de l’utilisateur.
   * @returns Liste des sessions.
   * @throws {Error} Si la validation échoue ou si l’API échoue.
   */
  getUserSessions: (userId: number) => Promise<Session[]>;

  /**
   * Révoque une session spécifique (déconnexion forcée).
   * @param sessionId - Identifiant de la session à révoquer.
   * @returns Résultat de l’opération.
   * @throws {Error} Si l’utilisateur n’est pas authentifié ou si l’API échoue.
   */
  revokeSession: (sessionId: number) => Promise<{ success: boolean; message: string }>;

  /**
   * Révoque toutes les sessions actives d’un utilisateur.
   * @param userId - Identifiant de l’utilisateur.
   * @returns Résultat de l’opération.
   * @throws {Error} Si l’utilisateur n’est pas authentifié ou si l’API échoue.
   */
  revokeAllUserSessions: (userId: number) => Promise<{ success: boolean; message: string }>;

  // ===== UTILITAIRES =====
  /** Réinitialise toutes les erreurs du store. */
  clearErrors: () => void;

  /**
   * Rafraîchit le token si nécessaire (basé sur la date d’expiration – moins de 5 minutes restantes).
   * @returns true si le token est valide (ou a été rafraîchi), false en cas d’erreur.
   */
  refreshIfNeeded: () => Promise<boolean>;
}

// ===============================
// HOOK PRINCIPAL
// ===============================

/**
 * Hook d’authentification complet.
 * Expose l’état du store `useAuthStore` ainsi que des méthodes utilitaires,
 * dont une vérification automatique périodique du token.
 *
 * @returns {UseAuth} Toutes les propriétés et actions du store auth, enrichies.
 *
 * @example
 * ```tsx
 * const { user, login, logout, hasPermission } = useAuth();
 *
 * if (user) {
 *   console.log(`Connecté : ${user.displayName}`);
 * }
 * ```
 */
export const useAuth = (): UseAuth => {
  const store = useAuthStore();

  /**
   * Vérifie si le token est sur le point d’expirer (moins de 5 minutes)
   * et le rafraîchit automatiquement si nécessaire.
   * @returns true si le token est valide (ou rafraîchi), false en cas d’erreur.
   */
  const refreshIfNeeded = useCallback(async (): Promise<boolean> => {
    const { token, refreshTokenFn } = store;
    if (!token) return false;

    try {
      // Décoder le token JWT (format base64)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      const exp = payload.exp * 1000; // expiration en millisecondes

      // Rafraîchir si moins de 5 minutes restantes
      if (Date.now() >= exp - 5 * 60 * 1000) {
        await refreshTokenFn();
      }
      return true;
    } catch (error) {
      console.error('Erreur lors du rafraîchissement automatique du token:', error);
      return false;
    }
  }, [store]);

  // Vérification périodique de la session toutes les minutes (rafraîchissement automatique)
  useEffect(() => {
    if (!store.isAuthenticated) return;

    const interval = setInterval(() => {
      refreshIfNeeded().catch((err) => console.error('Erreur périodique:', err));
    }, 60 * 1000); // 1 minute

    return () => clearInterval(interval);
  }, [store.isAuthenticated, refreshIfNeeded]);

  // Chargement automatique des sessions de l’utilisateur courant
  useEffect(() => {
    if (store.isAuthenticated && store.user?.id) {
      store.getUserSessions(store.user.id).catch(console.error);
    }
    // store est une référence stable, pas besoin de l’ajouter aux dépendances
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.isAuthenticated, store.user?.id]);

  return {
    // État global
    isAuthenticated: store.isAuthenticated,
    sessionId: store.sessionId,
    user: store.user,
    permissions: store.permissions,
    isLoading: store.isLoading,
    lastError: store.lastError,
    showWelcome: store.showWelcome,

    // Utilisateurs (admin)
    allUsers: store.allUsers,
    usersLoading: store.usersLoading,
    usersError: store.usersError,
    usersPagination: store.usersPagination,

    // Sessions personnelles
    userSessions: store.userSessions,
    lastSession: store.userSessions[0] || null,
    sessionsLoading: store.sessionsLoading,

    // Actions principales
    login: store.login,
    logout: store.logout,
    refreshToken: store.refreshTokenFn,
    validateToken: store.validateCurrentToken,
    changePassword: store.changePassword,
    isSessionValid: store.isSessionValid,
    setShowWelcome: store.setShowWelcome,

    // Réinitialisation par code OTP
    requestPasswordResetByEmail: store.requestPasswordResetByEmail,
    validateResetCode: store.validateResetCode,
    resetPassword: store.resetPassword,
    getAllResetCodes: store.getAllResetCodes,

    // Gestion des utilisateurs (CRUD)
    getAllUsers: store.getAllUsers,
    getUserById: store.getUserById,
    createUser: store.createUser,
    updateUser: store.updateUser,
    deleteUser: store.deleteUser,

    // Permissions
    getUserPermissions: store.getUserPermissions,
    assignPermission: store.assignPermission,
    revokePermission: store.revokePermission,
    checkPermission: store.checkPermission,
    hasPermission: store.hasPermission,
    hasLevel: store.hasLevel,

    // Sessions (admin)
    getUserSessions: store.getUserSessions,
    revokeSession: store.revokeSession,
    revokeAllUserSessions: store.revokeAllUserSessions,

    // Statistiques, tendances et sparklines
    stats: store.stats,
    statsLoading: store.statsLoading,
    statsError: store.statsError,
    trends: store.trends,
    trendsLoading: store.trendsLoading,
    trendsError: store.trendsError,
    sparklines: store.sparklines,
    sparklinesLoading: store.sparklinesLoading,
    sparklinesError: store.sparklinesError,
    getStats: store.getStats,
    getTrends: store.getTrends,
    getSparklines: store.getSparklines,

    // Utilitaires
    clearErrors: store.clearErrors,
    refreshIfNeeded,
  };
};
