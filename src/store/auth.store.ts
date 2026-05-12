/* eslint-disable @typescript-eslint/no-explicit-any */
// /home/stive-junior/Auto-ecole-COS/src/store/auth.store.ts

/**
 * Store d'authentification et d'autorisation Zustand (TypeScript)
 * Gère l'état de connexion, les utilisateurs, permissions, sessions et audit logs.
 * Communique avec l'API Electron via window.api (exposée par preload).
 *
 * Toutes les données entrantes sont validées avec Zod avant d'être utilisées.
 * Les erreurs de validation sont capturées et formatées.
 *
 * @module authStore
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  LoginCredentials,
  LoginResponse,
  Utilisateur,
  UtilisateurDetail,
  Permission,
  Session,
  UsersListResponse,
  AuditLog,
  AuditLogFilters,
  AuditLogsResponse,
  CreateUserParams,
  UpdateUserParams,
} from '../types/auth.types';
import {
  loginSchema,
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
  refreshTokenSchema,
  validateTokenSchema,
  assignPermissionSchema,
  revokePermissionSchema,
  checkPermissionSchema,
  getUserSessionsSchema,
  revokeSessionSchema,
  revokeAllSessionsSchema,
  getAuditLogsSchema,
} from '../lib/validators/auth.validator';
import { safeValidate, validateOrThrow } from '@/lib/validators/utils.validator';
import { formatErrorMessage } from '@/lib/helpers/error.helper';

// ===============================
// TYPES INTERNES DU STORE
// ===============================

interface AuthState {
  // Authentification
  isAuthenticated: boolean;
  token: string | null;
  refreshToken: string | null;
  sessionId: number | null;
  user: Utilisateur | null;
  permissions: Permission[];

  // États de chargement et erreurs
  isLoading: boolean;
  isRefreshing: boolean;
  lastError: string | null;

  showWelcome: boolean;

  // Gestion des utilisateurs
  allUsers: Utilisateur[];
  usersLoading: boolean;
  usersError: string | null;
  usersPagination: { page: number; limit: number; total: number; totalPages: number };

  // Gestion des permissions
  permissionsError: string | null;

  // Gestion des sessions
  userSessions: Session[];
  sessionsLoading: boolean;
  sessionsError: string | null;

  // Audit logs
  auditLogs: AuditLog[];
  auditLogsLoading: boolean;
  auditLogsError: string | null;
  auditLogsPagination: { page: number; limit: number; total: number; totalPages: number };
}

interface AuthActions {
  // Authentification
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  refreshTokenFn: () => Promise<{ token: string; refreshToken: string; sessionId: number }>;
  validateCurrentToken: () => Promise<{ valid: boolean; error?: string }>;
  isSessionValid: () => Promise<boolean>;

  setShowWelcome: (value: boolean) => void;

  // Gestion des utilisateurs
  getAllUsers: (page?: number, limit?: number) => Promise<UsersListResponse>;
  getUserById: (userId: number) => Promise<UtilisateurDetail>;
  createUser: (userData: Omit<CreateUserParams, 'creeParId'>) => Promise<Utilisateur>;
  updateUser: (
    userId: number,
    updateData: Partial<Omit<UpdateUserParams, 'userId' | 'updatedByUserId'>>
  ) => Promise<Utilisateur>;
  deleteUser: (userId: number) => Promise<{ success: boolean; message: string }>;
  changePassword: (data: {
    oldPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }) => Promise<{ success: boolean; message: string }>;

  // Permissions
  getUserPermissions: (userId: number) => Promise<Permission[]>;
  assignPermission: (userId: number, ressource: string, action: string) => Promise<Permission>;
  revokePermission: (permissionId: number) => Promise<{ success: boolean; message: string }>;
  checkPermission: (ressource: string, action: string) => Promise<boolean>;
  hasPermission: (ressource: string, action: string) => boolean;
  hasLevel: (level: string) => boolean;

  // Sessions
  getUserSessions: (userId: number) => Promise<Session[]>;
  revokeSession: (sessionId: number) => Promise<{ success: boolean; message: string }>;
  revokeAllUserSessions: (userId: number) => Promise<{ success: boolean; message: string }>;

  // Audit
  getAuditLogs: (
    page?: number,
    limit?: number,
    filters?: AuditLogFilters
  ) => Promise<AuditLogsResponse>;

  // Utilitaires
  clearErrors: () => void;

  // Réinitialisation par code OTP
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
    page?: number,
    limit?: number,
    onlyActive?: boolean
  ) => Promise<{ codes: any[]; total: number; page: number; limit: number; totalPages: number }>;
}

type AuthStore = AuthState & AuthActions;

// ===============================
// ÉTAT INITIAL
// ===============================

const initialState: AuthState = {
  isAuthenticated: false,
  token: null,
  refreshToken: null,
  sessionId: null,
  user: null,
  permissions: [],
  isLoading: false,
  isRefreshing: false,
  showWelcome: true,
  lastError: null,
  allUsers: [],
  usersLoading: false,
  usersError: null,
  usersPagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  permissionsError: null,
  userSessions: [],
  sessionsLoading: false,
  sessionsError: null,
  auditLogs: [],
  auditLogsLoading: false,
  auditLogsError: null,
  auditLogsPagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
};

// ===============================
// STORE PRINCIPAL
// ===============================

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ===============================
      // AUTHENTIFICATION
      // ===============================

      /**
       * Connecte un utilisateur.
       * Valide les credentials avec `loginSchema` avant l'appel API.
       * Utilise `formatErrorMessage` pour rendre les erreurs compréhensibles.
       */
      login: async (credentials) => {
        const validated = validateOrThrow(loginSchema, credentials);
        set({ isLoading: true, lastError: null });
        try {
          const response = await window.api.auth.login(validated);
          set({
            isAuthenticated: true,
            token: response.token,
            showWelcome: true,
            refreshToken: response.refreshToken,
            sessionId: response.sessionId,
            user: {
              id: response.id,
              email: response.email,
              nom: response.nom,
              prenom: response.prenom,
              role: response.role,
              niveau: response.niveau,
              actif: true,
              displayName: response.displayName,
            },
            permissions: response.permissions,
            isLoading: false,
          });
          await get().getUserSessions(response.id);
          return response;
        } catch (error) {
          const message = formatErrorMessage(error, 'Échec de la connexion');
          set({ isLoading: false, showWelcome: false, lastError: message });
          throw new Error(message, { cause: error });
        }
      },

      /**
       * Déconnecte l'utilisateur courant.
       * Les erreurs sont formatées et loguées mais ne sont pas propagées à l'utilisateur.
       */
      logout: async () => {
        const { sessionId, user } = get();
        if (sessionId && user?.id) {
          try {
            await window.api.auth.logout(sessionId, user.id);
          } catch (error) {
            console.error('Erreur lors de la déconnexion côté serveur:', formatErrorMessage(error));
          }
        }
        set(initialState);
        localStorage.removeItem('auth-storage');
      },

      /**
       * Rafraîchit le token d'accès à l'aide du refresh token.
       * Valide le refresh token avant la requête.
       */
      refreshTokenFn: async () => {
        const { refreshToken, isRefreshing } = get();
        if (!refreshToken) {
          throw new Error('Aucun refresh token disponible');
        }
        const validation = safeValidate(refreshTokenSchema, { refreshToken });
        if (!validation.success) {
          throw new Error(formatErrorMessage(validation.error, 'Refresh token invalide'));
        }

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            const interval = setInterval(() => {
              if (!get().isRefreshing) {
                clearInterval(interval);
                const state = get();
                if (state.token && state.refreshToken) {
                  resolve({
                    token: state.token,
                    refreshToken: state.refreshToken,
                    sessionId: state.sessionId!,
                  });
                } else {
                  reject(new Error('Refresh échoué'));
                }
              }
            }, 100);
          });
        }
        set({ isRefreshing: true, lastError: null });
        try {
          const response = await window.api.auth.refresh(validation.data.refreshToken);
          set({
            token: response.token,
            refreshToken: response.refreshToken,
            sessionId: response.sessionId,
            isRefreshing: false,
          });
          return response;
        } catch (error) {
          const message = formatErrorMessage(error, 'Session expirée, veuillez vous reconnecter');
          set({ lastError: message, isRefreshing: false });
          await get().logout();
          throw new Error(message, { cause: error });
        }
      },

      /**
       * Valide le token actuel et met à jour l'état utilisateur.
       * Valide le token avant l'appel API.
       */
      validateCurrentToken: async () => {
        const { token } = get();
        if (!token) return { valid: false, error: 'Aucun token' };
        const validation = safeValidate(validateTokenSchema, { token });
        if (!validation.success) {
          return { valid: false, error: formatErrorMessage(validation.error, 'Token invalide') };
        }
        try {
          const response = await window.api.auth.validate(validation.data.token);
          if (response.valid && response.user) {
            set({
              user: {
                id: response.user.id,
                email: response.user.email,
                role: response.user.role,
                niveau: response.user.niveau,
                nom: response.user.nom || '',
                prenom: response.user.prenom || '',
                actif: true,
                displayName:
                  response.user.nom && response.user.prenom
                    ? `${response.user.prenom} ${response.user.nom}`
                    : response.user.email,
              },
              permissions: response.user.permissions,
              sessionId: response.sessionId || null,
              isAuthenticated: true,
            });
          } else if (!response.valid) {
            await get().refreshTokenFn();
          }
          return response;
        } catch (error) {
          console.error('Erreur validation token:', error);
          const msg = formatErrorMessage(error, 'Erreur lors de la validation du token');
          return { valid: false, error: msg };
        }
      },

      /**
       * Vérifie si la session est encore valide (token non expiré).
       * Tente un refresh si nécessaire.
       */
      isSessionValid: async () => {
        const { token, refreshTokenFn } = get();
        if (!token) return false;
        try {
          const response = await window.api.auth.validate(token);
          if (response.valid) return true;
          await refreshTokenFn();
          return true;
        } catch (error) {
          console.error('Erreur validation session:', formatErrorMessage(error));
          return false;
        }
      },

      // ===============================
      // GESTION DES UTILISATEURS (Admin)
      // ===============================

      /**
       * Récupère la liste paginée des utilisateurs.
       * Valide les paramètres page et limit.
       */
      getAllUsers: async (page = 1, limit = 20) => {
        const { user } = get();
        if (!user) throw new Error('Non authentifié');
        const validatedPage = Math.max(1, page);
        const validatedLimit = Math.min(200, Math.max(1, limit));
        set({ usersLoading: true, usersError: null });
        try {
          const response = await window.api.auth.getAllUsers(
            user.id,
            validatedPage,
            validatedLimit
          );
          set({
            allUsers: response.users,
            usersPagination: {
              page: response.page,
              limit: response.limit,
              total: response.total,
              totalPages: response.totalPages,
            },
            usersLoading: false,
          });
          return response;
        } catch (error) {
          const message = formatErrorMessage(error, 'Erreur récupération utilisateurs');
          set({ usersLoading: false, usersError: message });
          throw new Error(message, { cause: error });
        }
      },

      /**
       * Récupère un utilisateur par son ID.
       * Valide l'ID avant l'appel.
       */
      getUserById: async (userId) => {
        const { user } = get();
        if (!user) throw new Error('Non authentifié');
        const validation = validateOrThrow(getUserSessionsSchema, { userId });
        try {
          return await window.api.auth.getUserById(validation.userId, user.id);
        } catch (error) {
          const message = formatErrorMessage(error, 'Erreur lors de la récupération');
          console.error(message, error);
          throw new Error(message, { cause: error });
        }
      },

      /**
       * Crée un nouvel utilisateur.
       * Valide les données avec `createUserSchema` avant l'envoi.
       */
      createUser: async (userData) => {
        const { user } = get();
        if (!user) throw new Error('Non authentifié');
        const validated = validateOrThrow(createUserSchema, userData);
        set({ usersError: null });
        try {
          const response = await window.api.auth.createUser({ ...validated, creeParId: user.id });
          await get().getAllUsers(get().usersPagination.page, get().usersPagination.limit);
          return response;
        } catch (error) {
          const message = formatErrorMessage(error, 'Erreur création utilisateur');
          set({ usersError: message });
          throw new Error(message, { cause: error });
        }
      },

      /**
       * Met à jour un utilisateur.
       * Valide les données avec `updateUserSchema`.
       */
      updateUser: async (userId, updateData) => {
        const { user } = get();
        if (!user) throw new Error('Non authentifié');
        const validated = validateOrThrow(updateUserSchema, { userId, ...updateData });
        set({ usersError: null });
        try {
          const response = await window.api.auth.updateUser({
            ...validated,
            updatedByUserId: user.id,
          });
          await get().getAllUsers(get().usersPagination.page, get().usersPagination.limit);
          if (userId === user.id) {
            set({ user: { ...user, ...response } });
          }
          return response;
        } catch (error) {
          const message = formatErrorMessage(error, 'Erreur mise à jour utilisateur');
          set({ usersError: message });
          throw new Error(message, { cause: error });
        }
      },

      /**
       * Désactive un utilisateur.
       * Valide l'ID avant l'appel.
       */
      deleteUser: async (userId) => {
        const { user } = get();
        if (!user) throw new Error('Non authentifié');
        const validation = validateOrThrow(revokeAllSessionsSchema, { userId });
        set({ usersError: null });
        try {
          const response = await window.api.auth.deleteUser(validation.userId, user.id);
          await get().getAllUsers(get().usersPagination.page, get().usersPagination.limit);
          return response;
        } catch (error) {
          const message = formatErrorMessage(error, 'Erreur désactivation utilisateur');
          set({ usersError: message });
          throw new Error(message, { cause: error });
        }
      },

      /**
       * Change le mot de passe de l'utilisateur courant.
       * Valide les mots de passe avec `changePasswordSchema`.
       */
      changePassword: async (data) => {
        const { user } = get();
        if (!user) throw new Error('Non authentifié');
        const validated = validateOrThrow(changePasswordSchema, data);
        set({ lastError: null });
        try {
          return await window.api.auth.changePassword(
            user.id,
            validated.oldPassword,
            validated.newPassword
          );
        } catch (error) {
          const message = formatErrorMessage(error, 'Erreur changement mot de passe');
          set({ lastError: message });
          throw new Error(message, { cause: error });
        }
      },

      // ===============================
      // PERMISSIONS
      // ===============================

      /**
       * Récupère les permissions d'un utilisateur.
       * Valide l'ID utilisateur.
       */
      getUserPermissions: async (userId) => {
        const validation = validateOrThrow(getUserSessionsSchema, { userId });
        try {
          return await window.api.auth.getUserPermissions(validation.userId);
        } catch (error) {
          console.error('Erreur getUserPermissions:', formatErrorMessage(error));
          return [];
        }
      },

      /**
       * Assigne une permission à un utilisateur.
       * Valide les paramètres avec `assignPermissionSchema`.
       */
      assignPermission: async (userId, ressource, action) => {
        const { user } = get();
        if (!user) throw new Error('Non authentifié');
        const validated = validateOrThrow(assignPermissionSchema, { userId, ressource, action });
        set({ permissionsError: null });
        try {
          const response = await window.api.auth.assignPermission({
            ...validated,
            assignedByUserId: user.id,
          });
          if (userId === user.id) {
            const newPerms = await get().getUserPermissions(userId);
            set({ permissions: newPerms });
          }
          return response;
        } catch (error) {
          const message = formatErrorMessage(error, 'Erreur assignation permission');
          set({ permissionsError: message });
          throw new Error(message, { cause: error });
        }
      },

      /**
       * Révoque une permission.
       * Valide l'ID permission.
       */
      revokePermission: async (permissionId) => {
        const { user } = get();
        if (!user) throw new Error('Non authentifié');
        const validated = validateOrThrow(revokePermissionSchema, { permissionId });
        set({ permissionsError: null });
        try {
          const response = await window.api.auth.revokePermission(validated.permissionId, user.id);
          const newPerms = await get().getUserPermissions(user.id);
          set({ permissions: newPerms });
          return response;
        } catch (error) {
          const message = formatErrorMessage(error, 'Erreur révocation permission');
          set({ permissionsError: message });
          throw new Error(message, { cause: error });
        }
      },

      /**
       * Vérifie si l'utilisateur courant a une permission (via API).
       * Valide les paramètres.
       */
      checkPermission: async (ressource, action) => {
        const { user } = get();
        if (!user) return false;
        const validated = validateOrThrow(checkPermissionSchema, {
          userId: user.id,
          ressource,
          action,
        });
        try {
          return await window.api.auth.checkPermission(
            validated.userId,
            validated.ressource,
            validated.action
          );
        } catch (error) {
          console.error('Erreur checkPermission:', formatErrorMessage(error));
          return false;
        }
      },

      /**
       * Vérification synchrone basée sur les permissions locales.
       */
      hasPermission: (ressource, action) => {
        const { permissions } = get();
        return permissions.some((p) => p.ressource === ressource && p.action === action);
      },

      /**
       * Vérifie le niveau d'accès.
       */
      hasLevel: (level) => {
        const levels = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STANDARD', 'GUEST'];
        const userLevel = get().user?.niveau || 'GUEST';
        return levels.indexOf(userLevel) <= levels.indexOf(level);
      },

      // ===============================
      // SESSIONS
      // ===============================

      /**
       * Récupère les sessions d'un utilisateur.
       * Valide l'ID utilisateur.
       */
      getUserSessions: async (userId) => {
        const validated = validateOrThrow(getUserSessionsSchema, { userId });
        set({ sessionsLoading: true, sessionsError: null });
        try {
          const sessions = await window.api.auth.getUserSessions(validated.userId);
          set({ userSessions: sessions, sessionsLoading: false });
          return sessions;
        } catch (error) {
          const message = formatErrorMessage(error, 'Erreur récupération sessions');
          set({ sessionsLoading: false, sessionsError: message });
          throw new Error(message, { cause: error });
        }
      },

      /**
       * Révoque une session spécifique.
       * Valide l'ID session.
       */
      revokeSession: async (sessionId) => {
        const { user } = get();
        if (!user) throw new Error('Non authentifié');
        const validated = validateOrThrow(revokeSessionSchema, { sessionId });
        set({ sessionsError: null });
        try {
          const response = await window.api.auth.revokeSession(validated.sessionId, user.id);
          await get().getUserSessions(user.id);
          return response;
        } catch (error) {
          const message = formatErrorMessage(error, 'Erreur révocation session');
          set({ sessionsError: message });
          throw new Error(message, { cause: error });
        }
      },

      /**
       * Révoque toutes les sessions d'un utilisateur.
       * Valide l'ID utilisateur.
       */
      revokeAllUserSessions: async (userId) => {
        const { user } = get();
        if (!user) throw new Error('Non authentifié');
        const validated = validateOrThrow(revokeAllSessionsSchema, { userId });
        set({ sessionsError: null });
        try {
          const response = await window.api.auth.revokeAllUserSessions(validated.userId, user.id);
          if (userId === user.id) set({ userSessions: [] });
          return response;
        } catch (error) {
          const message = formatErrorMessage(error, 'Erreur révocation toutes sessions');
          set({ sessionsError: message });
          throw new Error(message, { cause: error });
        }
      },

      // ===============================
      // AUDIT LOGS
      // ===============================

      /**
       * Récupère les logs d'audit paginés.
       * Valide les paramètres avec `getAuditLogsSchema`.
       */
      getAuditLogs: async (page = 1, limit = 50, filters = {}) => {
        const { user } = get();
        if (!user) throw new Error('Non authentifié');
        const validated = validateOrThrow(getAuditLogsSchema, { page, limit, filters });
        set({ auditLogsLoading: true, auditLogsError: null });
        try {
          const response = await window.api.auth.getAuditLogs(
            user.id,
            validated.page!,
            validated.limit!,
            validated.filters || {}
          );
          set({
            auditLogs: response.logs,
            auditLogsPagination: {
              page: response.page,
              limit: response.limit,
              total: response.total,
              totalPages: response.totalPages,
            },
            auditLogsLoading: false,
          });
          return response;
        } catch (error) {
          const message = formatErrorMessage(error, 'Erreur récupération logs audit');
          set({ auditLogsLoading: false, auditLogsError: message });
          throw new Error(message, { cause: error });
        }
      },

      // ===============================
      // UTILITAIRES
      // ===============================

      /**
       * Réinitialise toutes les erreurs du store.
       */
      clearErrors: () => {
        set({
          lastError: null,
          usersError: null,
          permissionsError: null,
          sessionsError: null,
          auditLogsError: null,
        });
      },

      // ===============================
      // RÉINITIALISATION PAR CODE OTP
      // ===============================

      /**
       * Demande un code de réinitialisation pour un email.
       * Si l'utilisateur est admin, le code est retourné directement.
       */
      requestPasswordResetByEmail: async (email, isAdmin = false) => {
        set({ isLoading: true, lastError: null });
        try {
          const response = await window.api.auth.requestPasswordResetByEmail(email, isAdmin);
          set({ isLoading: false });
          return response;
        } catch (error) {
          const message = formatErrorMessage(
            error,
            'Erreur lors de la demande de réinitialisation'
          );
          set({ isLoading: false, lastError: message });
          throw new Error(message, { cause: error });
        }
      },

      /**
       * Valide un code OTP de réinitialisation.
       */
      validateResetCode: async (code) => {
        set({ isLoading: true, lastError: null });
        try {
          const response = await window.api.auth.validateResetCode(code);
          set({ isLoading: false });
          return response;
        } catch (error) {
          const message = formatErrorMessage(error, 'Erreur lors de la validation du code');
          set({ isLoading: false, lastError: message });
          throw new Error(message, { cause: error });
        }
      },

      /**
       * Réinitialise le mot de passe avec un code OTP valide.
       */
      resetPassword: async ({ code, newPassword }) => {
        set({ isLoading: true, lastError: null });
        try {
          const response = await window.api.auth.resetPassword({ code, newPassword });
          set({ isLoading: false });
          return response;
        } catch (error) {
          const message = formatErrorMessage(
            error,
            'Erreur lors de la réinitialisation du mot de passe'
          );
          set({ isLoading: false, lastError: message });
          throw new Error(message, { cause: error });
        }
      },

      /**
       * Récupère tous les codes de réinitialisation (admin uniquement).
       */
      getAllResetCodes: async (page = 1, limit = 20, onlyActive = false) => {
        const { user } = get();
        if (!user) throw new Error('Non authentifié');
        set({ isLoading: true });
        try {
          const response = await window.api.auth.getAllResetCodes(user.id, page, limit, onlyActive);
          set({ isLoading: false });
          return response;
        } catch (error) {
          const message = formatErrorMessage(error, 'Erreur récupération des codes');
          set({ isLoading: false, lastError: message });
          throw new Error(message, { cause: error });
        }
      },

      setShowWelcome: (value) => set({ showWelcome: value }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        sessionId: state.sessionId,
        user: state.user,
        permissions: state.permissions,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
