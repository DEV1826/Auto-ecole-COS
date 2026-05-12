/* eslint-disable @typescript-eslint/no-explicit-any */
// /home/stive-junior/Auto-ecole-COS/src/hooks/use.auth.ts

/**
 * Hook personnalisé pour l'authentification et l'autorisation
 * Fournit un accès simplifié au store auth et des méthodes utiles.
 *
 * @module useAuth
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
 * ```
 */

import { useEffect, useCallback } from 'react';
import type {
  Utilisateur,
  Permission,
  Session,
  AuditLog,
  UsersListResponse,
  AuditLogsResponse,
  LoginCredentials,
} from '../types/auth.types';
import { useAuthStore } from '@/store/auth.store';

// ===============================
// INTERFACE DE RETOUR DU HOOK
// ===============================

/**
 * Interface décrivant toutes les propriétés et méthodes retournées par le hook `useAuth`
 */
export interface UseAuth {
  // ===== ÉTAT =====
  /** Indique si l'utilisateur est authentifié */
  isAuthenticated: boolean;

  sessionId: number | null;
  /** Utilisateur courant (connecté) */
  user: Utilisateur | null;
  /** Liste des permissions de l'utilisateur courant */
  permissions: Permission[];
  /** Indicateur de chargement global (connexion, etc.) */
  isLoading: boolean;
  /** Dernière erreur survenue (connexion, mot de passe, etc.) */
  lastError: string | null;

  showWelcome: boolean;

  // ===== GESTION DES UTILISATEURS (Admin) =====
  /** Liste paginée de tous les utilisateurs */
  allUsers: Utilisateur[];
  /** Indicateur de chargement des utilisateurs */
  usersLoading: boolean;
  /** Erreur lors du chargement/modification des utilisateurs */
  usersError: string | null;
  /** Pagination des utilisateurs */
  usersPagination: { page: number; limit: number; total: number; totalPages: number };

  // ===== SESSIONS (utilisateur courant) =====
  /** Toutes les sessions actives de l'utilisateur courant */
  userSessions: Session[];
  /** Dernière session active (la plus récente) */
  lastSession: Session | null;
  /** Indicateur de chargement des sessions */
  sessionsLoading: boolean;

  // ===== AUDIT LOGS =====
  /** Liste paginée des logs d'audit */
  auditLogs: AuditLog[];
  /** Indicateur de chargement des logs */
  auditLogsLoading: boolean;
  /** Pagination des logs */
  auditLogsPagination: { page: number; limit: number; total: number; totalPages: number };

  // ===== ACTIONS PRINCIPALES =====
  /** Connecter un utilisateur */
  login: (credentials: LoginCredentials) => Promise<import('../types/auth.types').LoginResponse>;
  /** Déconnecter l'utilisateur courant */
  logout: () => Promise<void>;

  /** Rafraîchir manuellement le token d'accès */
  refreshToken: () => Promise<{ token: string; refreshToken: string; sessionId: number }>;
  /** Valider le token actuel et re-synchroniser l'état */
  validateToken: () => Promise<{ valid: boolean; error?: string }>;
  /** Changer le mot de passe de l'utilisateur courant */
  changePassword: (data: {
    oldPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }) => Promise<{ success: boolean; message: string }>;
  /** Vérifier si la session est toujours valide (token non expiré) */
  isSessionValid: () => Promise<boolean>;

  setShowWelcome: (value: boolean) => void;
  /**
   * Demande un code de réinitialisation (envoi par email ou génération console)
   * @param email - Email de l'utilisateur
   * @param isAdmin - Si true, retourne le code dans la réponse (pour admin)
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
  /** Valide un code de réinitialisation (6 chiffres) */
  validateResetCode: (
    code: string
  ) => Promise<{ valid: boolean; message?: string; userId?: number }>;
  /** Réinitialise le mot de passe avec un code valide */
  resetPassword: (params: {
    code: string;
    newPassword: string;
  }) => Promise<{ success: boolean; message: string }>;
  /** Récupère tous les codes de réinitialisation (admin seulement) */
  getAllResetCodes: (
    page?: number,
    limit?: number,
    onlyActive?: boolean
  ) => Promise<{ codes: any[]; total: number; page: number; limit: number; totalPages: number }>;

  // ===== GESTION DES UTILISATEURS =====
  /** Récupérer la liste paginée des utilisateurs (admin) */
  getAllUsers: (page?: number, limit?: number) => Promise<UsersListResponse>;
  /** Récupérer un utilisateur par son ID (admin) */
  getUserById: (userId: number) => Promise<import('../types/auth.types').UtilisateurDetail>;
  /** Créer un nouvel utilisateur (admin) */
  createUser: (
    userData: Omit<import('../types/auth.types').CreateUserParams, 'creeParId'>
  ) => Promise<Utilisateur>;
  /** Mettre à jour un utilisateur (admin) */
  updateUser: (
    userId: number,
    updateData: Partial<
      Omit<import('../types/auth.types').UpdateUserParams, 'userId' | 'updatedByUserId'>
    >
  ) => Promise<Utilisateur>;
  /** Désactiver un utilisateur (admin) */
  deleteUser: (userId: number) => Promise<{ success: boolean; message: string }>;

  // ===== PERMISSIONS =====
  /** Récupérer les permissions d'un utilisateur */
  getUserPermissions: (userId: number) => Promise<Permission[]>;
  /** Assigner une permission à un utilisateur (admin) */
  assignPermission: (userId: number, ressource: string, action: string) => Promise<Permission>;
  /** Révoquer une permission (admin) */
  revokePermission: (permissionId: number) => Promise<{ success: boolean; message: string }>;
  /** Vérifier si l'utilisateur courant a une permission (appel API) */
  checkPermission: (ressource: string, action: string) => Promise<boolean>;
  /** Vérifier synchrone si l'utilisateur courant a une permission (basé sur l'état local) */
  hasPermission: (ressource: string, action: string) => boolean;
  /** Vérifier le niveau d'accès (ex: "ADMIN") */
  hasLevel: (level: string) => boolean;

  // ===== SESSIONS =====
  /** Récupérer les sessions d'un utilisateur */
  getUserSessions: (userId: number) => Promise<Session[]>;
  /** Révoquer une session spécifique (déconnexion forcée) */
  revokeSession: (sessionId: number) => Promise<{ success: boolean; message: string }>;
  /** Révoquer toutes les sessions d'un utilisateur (déconnexion forcée) */
  revokeAllUserSessions: (userId: number) => Promise<{ success: boolean; message: string }>;

  // ===== AUDIT =====
  /** Récupérer les logs d'audit paginés (admin) */
  getAuditLogs: (
    page?: number,
    limit?: number,
    filters?: import('../types/auth.types').AuditLogFilters
  ) => Promise<AuditLogsResponse>;

  // ===== UTILITAIRES =====
  /** Réinitialiser toutes les erreurs */
  clearErrors: () => void;
  /** Rafraîchir le token si nécessaire (basé sur l'expiration) */
  refreshIfNeeded: () => Promise<boolean>;
}

// ===============================
// HOOK PRINCIPAL
// ===============================

/**
 * Hook d'authentification complet
 * @returns {UseAuthReturn} Toutes les propriétés et actions du store auth
 */
export const useAuth = (): UseAuth => {
  const store = useAuthStore();

  /**
   * Vérifie si le token est sur le point d'expirer (moins de 5 minutes)
   * et le rafraîchit automatiquement si nécessaire.
   * @returns {Promise<boolean>} true si le token est valide (ou rafraîchi), false en cas d'erreur
   */
  const refreshIfNeeded = useCallback(async (): Promise<boolean> => {
    const { token, refreshTokenFn } = store;
    if (!token) return false;

    try {
      // Décoder le token (base64)
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

  // Vérification périodique de la session toutes les minutes
  useEffect(() => {
    if (!store.isAuthenticated) return undefined;

    const interval = setInterval(() => {
      refreshIfNeeded().catch((err) => console.error('Erreur périodique:', err));
    }, 60 * 1000); // 1 minute

    return () => clearInterval(interval);
  }, [store.isAuthenticated, refreshIfNeeded]);

  useEffect(() => {
    if (store.isAuthenticated && store.user?.id) {
      store.getUserSessions(store.user.id).catch(console.error);
    }
    // store is a stable Zustand reference, no need to include it in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.isAuthenticated, store.user?.id]);

  return {
    // État
    isAuthenticated: store.isAuthenticated,
    sessionId: store.sessionId,
    user: store.user,
    permissions: store.permissions,
    isLoading: store.isLoading,
    lastError: store.lastError,

    showWelcome: store.showWelcome,
    setShowWelcome: store.setShowWelcome,

    // Utilisateurs (admin)
    allUsers: store.allUsers,
    usersLoading: store.usersLoading,
    usersError: store.usersError,
    usersPagination: store.usersPagination,

    // Sessions
    userSessions: store.userSessions,
    lastSession: store.userSessions[0] || null,
    sessionsLoading: store.sessionsLoading,

    // Audit
    auditLogs: store.auditLogs,
    auditLogsLoading: store.auditLogsLoading,
    auditLogsPagination: store.auditLogsPagination,

    // Actions principales
    login: store.login,
    logout: store.logout,
    refreshToken: store.refreshTokenFn,
    validateToken: store.validateCurrentToken,
    changePassword: store.changePassword,
    isSessionValid: store.isSessionValid,

    // Réinitialisation par code OTP
    requestPasswordResetByEmail: store.requestPasswordResetByEmail,
    validateResetCode: store.validateResetCode,
    resetPassword: store.resetPassword,
    getAllResetCodes: store.getAllResetCodes,

    // Gestion utilisateurs
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

    // Sessions
    getUserSessions: store.getUserSessions,
    revokeSession: store.revokeSession,
    revokeAllUserSessions: store.revokeAllUserSessions,

    // Audit
    getAuditLogs: store.getAuditLogs,

    // Utilitaires
    clearErrors: store.clearErrors,
    refreshIfNeeded,
  };
};
