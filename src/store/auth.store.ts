/* eslint-disable @typescript-eslint/no-explicit-any */
// /home/stive-junior/Auto-ecole-COS/src/store/auth.store.ts

/**
 * @module authStore
 * @description
 * Store Zustand pour l'authentification, les utilisateurs, les permissions,
 * les sessions et les codes OTP. Gère l'état de connexion, la persistance locale,
 * et toutes les interactions avec l'API Electron via `window.api.auth`.
 *
 * Toutes les données entrantes sont validées avec Zod avant utilisation.
 * Les erreurs sont formatées pour une meilleure expérience utilisateur.
 *
 * @author Stive Junior
 * @version 3.0.0
 *
 * @see {@link auth.types.ts} – Types associés
 * @see {@link auth.validator.ts} – Schémas de validation Zod
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  LoginCredentials,
  LoginResponse,
  Utilisateur,
  UtilisateurDetail,
  Session,
  UsersListResponse,
  CreateUserParams,
  UpdateUserParams,
  AuthStats,
  AuthTrends,
  AuthSparklineData,
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
} from '../lib/validators/auth.validator';
import { safeValidate, validateOrThrow } from '@/lib/validators/utils.validator';
import { formatErrorMessage } from '@/lib/helpers/error.helper';
import type { Permission } from '@/types/admin.types';

// ===============================
// TYPES INTERNES DU STORE
// ===============================

/**
 * @interface AuthState
 * @description État du store d'authentification.
 */
interface AuthState {
  /** Indique si l'utilisateur est actuellement authentifié. */
  isAuthenticated: boolean;
  /** Token JWT d'accès (stocké en mémoire et persistant). */
  token: string | null;
  /** Refresh token JWT (stocké en mémoire et persistant). */
  refreshToken: string | null;
  /** Identifiant de la session active (stocké en mémoire et persistant). */
  sessionId: number | null;
  /** Utilisateur courant (stocké en mémoire et persistant). */
  user: Utilisateur | null;
  /** Liste des permissions de l'utilisateur courant. */
  permissions: Permission[];

  /** Indicateur de chargement global (authentification, etc.). */
  isLoading: boolean;
  /** Indicateur de rafraîchissement du token. */
  isRefreshing: boolean;
  /** Dernière erreur survenue (message utilisateur). */
  lastError: string | null;

  /** Flag pour afficher un message de bienvenue après connexion. */
  showWelcome: boolean;

  /** Liste paginée de tous les utilisateurs (admin uniquement). */
  allUsers: Utilisateur[];
  /** Indicateur de chargement de la liste des utilisateurs. */
  usersLoading: boolean;
  /** Erreur lors du chargement des utilisateurs. */
  usersError: string | null;
  /** Informations de pagination pour la liste des utilisateurs. */
  usersPagination: { page: number; limit: number; total: number; totalPages: number };

  /** Erreur lors des opérations sur les permissions. */
  permissionsError: string | null;

  /** Liste des sessions actives de l'utilisateur courant. */
  userSessions: Session[];
  /** Indicateur de chargement des sessions. */
  sessionsLoading: boolean;
  /** Erreur lors du chargement des sessions. */
  sessionsError: string | null;

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
}

/**
 * @interface AuthActions
 * @description Actions disponibles dans le store d'authentification.
 */
interface AuthActions {
  // ───────────── Authentification ─────────────
  /**
   * Connecte un utilisateur avec ses identifiants.
   * @param credentials - Email et mot de passe.
   * @returns Réponse de l'API contenant le token et les infos utilisateur.
   * @throws {Error} Si la validation échoue ou si l'API retourne une erreur.
   */
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;

  /**
   * Déconnecte l'utilisateur courant (invalide la session côté serveur et efface l'état local).
   * @returns Promise résolue après la déconnexion.
   */
  logout: () => Promise<void>;

  /**
   * Rafraîchit le token d'accès à l'aide du refresh token stocké.
   * @returns Nouveau token, refresh token et identifiant de session.
   * @throws {Error} Si aucun refresh token n'est disponible ou si l'API échoue.
   */
  refreshTokenFn: () => Promise<{ token: string; refreshToken: string; sessionId: number }>;

  /**
   * Valide le token actuel et met à jour l'état utilisateur si nécessaire.
   * @returns Objet indiquant si le token est valide, avec un éventuel message d'erreur.
   */
  validateCurrentToken: () => Promise<{ valid: boolean; error?: string }>;

  /**
   * Vérifie si la session est encore valide (token non expiré) et tente un refresh si besoin.
   * @returns true si la session est valide, false sinon.
   */
  isSessionValid: () => Promise<boolean>;

  /**
   * Modifie l'état du flag d'affichage du message de bienvenue.
   * @param value - Nouvelle valeur du flag.
   */
  setShowWelcome: (value: boolean) => void;

  // ───────────── Gestion des utilisateurs (admin) ─────────────
  /**
   * Récupère la liste paginée de tous les utilisateurs (nécessite droits admin).
   * @param page - Numéro de page (défaut : 1).
   * @param limit - Nombre d'éléments par page (max 200).
   * @returns Réponse paginée contenant la liste des utilisateurs.
   * @throws {Error} Si l'utilisateur n'est pas authentifié ou si l'API échoue.
   */
  getAllUsers: (page?: number, limit?: number) => Promise<UsersListResponse>;

  /**
   * Récupère les détails complets d'un utilisateur (permissions + sessions actives).
   * @param userId - Identifiant de l'utilisateur à consulter.
   * @returns Utilisateur détaillé.
   * @throws {Error} Si l'utilisateur n'est pas authentifié ou si l'API échoue.
   */
  getUserById: (userId: number) => Promise<UtilisateurDetail>;

  /**
   * Crée un nouvel utilisateur (nécessite droits admin).
   * @param userData - Données du nouvel utilisateur (email, nom, prénom, mot de passe, rôle, niveau).
   * @returns Utilisateur créé (sans mot de passe).
   * @throws {Error} Si la validation échoue ou si l'API retourne une erreur.
   */
  createUser: (userData: Omit<CreateUserParams, 'creeParId'>) => Promise<Utilisateur>;

  /**
   * Met à jour les informations d'un utilisateur existant.
   * @param userId - Identifiant de l'utilisateur à modifier.
   * @param updateData - Champs à modifier (partiels).
   * @returns Utilisateur mis à jour.
   * @throws {Error} Si la validation échoue ou si l'API retourne une erreur.
   */
  updateUser: (
    userId: number,
    updateData: Partial<Omit<UpdateUserParams, 'userId' | 'updatedByUserId'>>
  ) => Promise<Utilisateur>;

  /**
   * Désactive (soft delete) un compte utilisateur.
   * @param userId - Identifiant de l'utilisateur à désactiver.
   * @returns Résultat de l'opération.
   * @throws {Error} Si l'utilisateur n'est pas authentifié ou si l'API échoue.
   */
  deleteUser: (userId: number) => Promise<{ success: boolean; message: string }>;

  /**
   * Change le mot de passe de l'utilisateur courant.
   * @param data - Ancien mot de passe, nouveau mot de passe et confirmation.
   * @returns Résultat de l'opération.
   * @throws {Error} Si la validation échoue ou si l'API retourne une erreur.
   */
  changePassword: (data: {
    oldPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }) => Promise<{ success: boolean; message: string }>;

  // ───────────── Permissions ─────────────
  /**
   * Récupère toutes les permissions actives d'un utilisateur.
   * @param userId - Identifiant de l'utilisateur.
   * @returns Liste des permissions.
   */
  getUserPermissions: (userId: number) => Promise<Permission[]>;

  /**
   * Assigne une permission à un utilisateur.
   * @param userId - Identifiant de l'utilisateur bénéficiaire.
   * @param ressource - Nom de la ressource (ex: "candidats").
   * @param action - Action autorisée (create, read, update, delete).
   * @returns Permission créée ou mise à jour.
   * @throws {Error} Si l'utilisateur n'est pas authentifié ou si l'API échoue.
   */
  assignPermission: (userId: number, ressource: string, action: string) => Promise<Permission>;

  /**
   * Révoque (désactive) une permission.
   * @param permissionId - Identifiant de la permission à révoquer.
   * @returns Résultat de l'opération.
   * @throws {Error} Si l'utilisateur n'est pas authentifié ou si l'API échoue.
   */
  revokePermission: (permissionId: number) => Promise<{ success: boolean; message: string }>;

  /**
   * Vérifie si l'utilisateur courant a une permission spécifique via l'API.
   * @param ressource - Nom de la ressource.
   * @param action - Action.
   * @returns true si la permission est active, false sinon.
   */
  checkPermission: (ressource: string, action: string) => Promise<boolean>;

  /**
   * Vérification synchrone basée sur les permissions stockées localement.
   * @param ressource - Nom de la ressource.
   * @param action - Action.
   * @returns true si la permission est présente dans l'état local.
   */
  hasPermission: (ressource: string, action: string) => boolean;

  /**
   * Vérifie si l'utilisateur courant a un niveau d'accès suffisant.
   * @param level - Niveau requis (SUPER_ADMIN, ADMIN, MANAGER, STANDARD, GUEST).
   * @returns true si le niveau de l'utilisateur est inférieur ou égal au niveau requis.
   */
  hasLevel: (level: string) => boolean;

  // ───────────── Sessions ─────────────
  /**
   * Récupère toutes les sessions actives d'un utilisateur.
   * @param userId - Identifiant de l'utilisateur.
   * @returns Liste des sessions.
   * @throws {Error} Si la validation échoue ou si l'API échoue.
   */
  getUserSessions: (userId: number) => Promise<Session[]>;

  /**
   * Révoque une session spécifique (déconnexion forcée).
   * @param sessionId - Identifiant de la session à révoquer.
   * @returns Résultat de l'opération.
   * @throws {Error} Si l'utilisateur n'est pas authentifié ou si l'API échoue.
   */
  revokeSession: (sessionId: number) => Promise<{ success: boolean; message: string }>;

  /**
   * Révoque toutes les sessions actives d'un utilisateur.
   * @param userId - Identifiant de l'utilisateur.
   * @returns Résultat de l'opération.
   * @throws {Error} Si l'utilisateur n'est pas authentifié ou si l'API échoue.
   */
  revokeAllUserSessions: (userId: number) => Promise<{ success: boolean; message: string }>;

  // ───────────── Utilitaires ─────────────
  /**
   * Réinitialise toutes les erreurs du store.
   */
  clearErrors: () => void;

  // ───────────── Réinitialisation par code OTP ─────────────
  /**
   * Demande un code OTP de réinitialisation pour un email.
   * @param email - Adresse email de l'utilisateur.
   * @param isAdmin - Si true, le code est retourné directement (usage admin).
   * @returns Succès + message (et code + userId si isAdmin = true).
   */
  requestPasswordResetByEmail: (
    email: string,
    isAdmin?: boolean
  ) => Promise<{ success: boolean; message: string; code?: string; userId?: number }>;

  /**
   * Valide un code OTP de réinitialisation.
   * @param code - Code à 6 chiffres.
   * @returns Validité + userId si valide.
   */
  validateResetCode: (
    code: string
  ) => Promise<{ valid: boolean; message?: string; userId?: number }>;

  /**
   * Réinitialise le mot de passe à l'aide d'un code OTP valide.
   * @param params - Code OTP et nouveau mot de passe.
   * @returns Résultat de l'opération.
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

  // ───────────── Statistiques, tendances et sparklines ─────────────

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
}

type AuthStore = AuthState & AuthActions;

// ===============================
// ÉTAT INITIAL
// ===============================

/**
 * @description Valeurs par défaut du store.
 */
const initialState: AuthState = {
  isAuthenticated: false,
  token: null,
  refreshToken: null,
  sessionId: null,
  user: null,
  permissions: [],
  isLoading: false,
  isRefreshing: false,
  showWelcome: false,
  lastError: null,
  allUsers: [],
  usersLoading: false,
  usersError: null,
  usersPagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  permissionsError: null,
  userSessions: [],
  sessionsLoading: false,
  sessionsError: null,
  stats: null,
  statsLoading: false,
  statsError: null,
  trends: null,
  trendsLoading: false,
  trendsError: null,
  sparklines: null,
  sparklinesLoading: false,
  sparklinesError: null,
};

// ===============================
// STORE PRINCIPAL
// ===============================

/**
 * Store Zustand pour l'authentification.
 * Utilise le middleware `persist` pour conserver le token, l'utilisateur, etc. dans le localStorage.
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ─────────────────────────────────────────────────────────────────────────
      // AUTHENTIFICATION
      // ─────────────────────────────────────────────────────────────────────────

      /**
       * @inheritdoc
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
          throw new Error(message);
        }
      },

      /**
       * @inheritdoc
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
       * @inheritdoc
       */
      refreshTokenFn: async () => {
        const { refreshToken, isRefreshing } = get();
        if (!refreshToken) throw new Error('Aucun refresh token disponible');
        const validation = safeValidate(refreshTokenSchema, { refreshToken });
        if (!validation.success) {
          throw new Error(formatErrorMessage(validation.error, 'Refresh token invalide'));
        }

        if (isRefreshing) {
          // Attendre que le refresh en cours se termine
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
          throw new Error(message);
        }
      },

      /**
       * @inheritdoc
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
       * @inheritdoc
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

      /**
       * @inheritdoc
       */
      setShowWelcome: (value) => set({ showWelcome: value }),

      // ─────────────────────────────────────────────────────────────────────────
      // GESTION DES UTILISATEURS (Admin)
      // ─────────────────────────────────────────────────────────────────────────

      /**
       * @inheritdoc
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
          throw new Error(message);
        }
      },

      /**
       * @inheritdoc
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
          throw new Error(message);
        }
      },

      /**
       * @inheritdoc
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
          throw new Error(message);
        }
      },

      /**
       * @inheritdoc
       */
      updateUser: async (userId, updateData) => {
        const { user } = get();
        if (!user) throw new Error('Non authentifié');
        const validated = validateOrThrow(updateUserSchema, { userId, ...updateData });
        set({ usersError: null });
        try {
          const response = await window.api.auth.updateUser(
            Object.assign({
              ...validated,
              updatedByUserId: user.id,
            })
          );
          await get().getAllUsers(get().usersPagination.page, get().usersPagination.limit);
          if (userId === user.id) {
            set({ user: { ...user, ...response } });
          }
          return response;
        } catch (error) {
          const message = formatErrorMessage(error, 'Erreur mise à jour utilisateur');
          set({ usersError: message });
          throw new Error(message);
        }
      },

      /**
       * @inheritdoc
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
          throw new Error(message);
        }
      },

      /**
       * @inheritdoc
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
          throw new Error(message);
        }
      },

      // ─────────────────────────────────────────────────────────────────────────
      // PERMISSIONS
      // ─────────────────────────────────────────────────────────────────────────

      /**
       * @inheritdoc
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
       * @inheritdoc
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
          throw new Error(message);
        }
      },

      /**
       * @inheritdoc
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
          throw new Error(message);
        }
      },

      /**
       * @inheritdoc
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
       * @inheritdoc
       */
      hasPermission: (ressource, action) => {
        const { permissions } = get();
        return permissions.some((p) => p.ressource === ressource && p.action === action);
      },

      /**
       * @inheritdoc
       */
      hasLevel: (level) => {
        const levels = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STANDARD', 'GUEST'];
        const userLevel = get().user?.niveau || 'GUEST';
        return levels.indexOf(userLevel) <= levels.indexOf(level);
      },

      // ─────────────────────────────────────────────────────────────────────────
      // SESSIONS
      // ─────────────────────────────────────────────────────────────────────────

      /**
       * @inheritdoc
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
          throw new Error(message);
        }
      },

      /**
       * @inheritdoc
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
          throw new Error(message);
        }
      },

      /**
       * @inheritdoc
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
          throw new Error(message);
        }
      },

      // ─────────────────────────────────────────────────────────────────────────
      // UTILITAIRES
      // ─────────────────────────────────────────────────────────────────────────

      /**
       * @inheritdoc
       */
      clearErrors: () => {
        set({
          lastError: null,
          usersError: null,
          permissionsError: null,
          sessionsError: null,
        });
      },

      // ─────────────────────────────────────────────────────────────────────────
      // RÉINITIALISATION PAR CODE OTP
      // ─────────────────────────────────────────────────────────────────────────

      /**
       * @inheritdoc
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
          throw new Error(message);
        }
      },

      /**
       * @inheritdoc
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
          throw new Error(message);
        }
      },

      /**
       * @inheritdoc
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
          throw new Error(message);
        }
      },

      /**
       * @inheritdoc
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
          throw new Error(message);
        }
      },

      /**
       * Récupère les statistiques agrégées des utilisateurs.
       * @inheritdoc
       */
      getStats: async () => {
        set({ statsLoading: true, statsError: null });
        try {
          const stats = await window.api.auth.getStats();
          set({ stats, statsLoading: false });
          return stats;
        } catch (error) {
          const message = formatErrorMessage(error, 'Erreur lors du chargement des statistiques');
          set({ statsLoading: false, statsError: message });
          throw new Error(message);
        }
      },

      /**
       * Récupère les tendances évolutives des utilisateurs.
       * @inheritdoc
       */
      getTrends: async () => {
        set({ trendsLoading: true, trendsError: null });
        try {
          const trends = await window.api.auth.getTrends();
          set({ trends, trendsLoading: false });
          return trends;
        } catch (error) {
          const message = formatErrorMessage(error, 'Erreur lors du chargement des tendances');
          set({ trendsLoading: false, trendsError: message });
          throw new Error(message);
        }
      },

      /**
       * Récupère les données des sparklines pour les 12 derniers mois.
       * @inheritdoc
       */
      getSparklines: async () => {
        set({ sparklinesLoading: true, sparklinesError: null });
        try {
          const sparklines = await window.api.auth.getSparklines();
          set({ sparklines, sparklinesLoading: false });
          return sparklines;
        } catch (error) {
          const message = formatErrorMessage(error, 'Erreur lors du chargement des sparklines');
          set({ sparklinesLoading: false, sparklinesError: message });
          throw new Error(message);
        }
      },
    }),
    {
      name: 'auth-storage',
      /**
       * Persiste uniquement les champs essentiels (token, refresh token, session, user, permissions, état d'authentification).
       * @param state - État complet du store.
       * @returns État partiel à sauvegarder dans localStorage.
       */
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
