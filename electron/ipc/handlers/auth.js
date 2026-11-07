/**
 * Handlers IPC — auth.
 * Extrait de electron/main.js ; enregistrés via le wrapper sécurisé `handle`
 * (voir electron/ipc/security.js).
 *
 * @module electron/ipc/handlers/auth
 */

import { getPrismaClient } from '../../services/prisma.client.js';
import { assertSelfOrAdmin, isAdminLevel } from '../security.js';
import {
  login,
  logout,
  validateToken,
  refreshToken,
  createUser,
  updateUser,
  deleteUser,
  getAllUsers,
  getUserById,
  changePassword,
  assignPermission,
  revokePermission,
  getUserPermissions,
  checkPermission,
  getUserSessions,
  revokeSession,
  revokeAllUserSessions,
  requestPasswordResetByEmail,
  validateResetCode,
  resetPassword,
  getAllResetCodes,
  getUserStats,
  getUserTrends,
  getUserSparklines,
  verifyDeveloperSetupCode,
  createInitialSetup,
} from '../../services/auth.service.js';

/**
 * @param {(channel: string, handler: Function) => void} handle
 * @param {object} helpers - Utilitaires partagés fournis par main.js
 */
export function registerAuthHandlers(handle, { getClientInfo } = {}) {
  // =============================
  // AUTHENTIFICATION
  // =============================
  handle('auth:login', async (event, { email, password } = {}) => {
    const { ip, userAgent } = getClientInfo(event);
    return login({ email, password, ipAddress: ip, userAgent });
  });

  // Public : une déconnexion avec un token déjà expiré ne doit pas échouer.
  handle('auth:logout', async (event) => {
    const { auth } = event;
    if (!auth?.sessionId) {
      return { success: true, message: 'Déconnexion réussie' };
    }
    const { ip } = getClientInfo(event);
    return logout({ sessionId: auth.sessionId, userId: auth.userId, ipAddress: ip });
  });

  handle('auth:validate', async (event, { token } = {}) => validateToken(token));

  handle('auth:refresh', async (event, { refreshToken: rt } = {}) =>
    refreshToken({ refreshToken: rt })
  );

  // GESTION DES UTILISATEURS
  handle('auth:createUser', async (event, payload = {}) => {
    const { ip } = getClientInfo(event);
    return createUser({ ...payload, creeParId: event.auth.userId, ipAddress: ip });
  });

  handle('auth:verifyDeveloperSetupCode', async (event, { code } = {}) => {
    const { ip } = getClientInfo(event);
    return verifyDeveloperSetupCode({ code, ipAddress: ip });
  });

  handle('auth:createInitialSetup', async (event, payload = {}) => {
    const { ip } = getClientInfo(event);
    return createInitialSetup({ ...payload, ipAddress: ip });
  });

  handle('auth:updateUser', async (event, payload = {}) => {
    const { ip } = getClientInfo(event);
    return updateUser({ ...payload, updatedByUserId: event.auth.userId, ipAddress: ip });
  });

  handle('auth:deleteUser', async (event, { userId } = {}) => {
    const { ip } = getClientInfo(event);
    return deleteUser({ userId, deletedByUserId: event.auth.userId, ipAddress: ip });
  });

  handle('auth:getAllUsers', async (event, { page, limit } = {}) =>
    getAllUsers({ userId: event.auth.userId, page, limit })
  );

  handle('auth:getUserById', async (event, { userId } = {}) =>
    getUserById({ userId, requesterId: event.auth.userId })
  );

  // Un utilisateur ne peut changer que son propre mot de passe (l'ancien est exigé).
  handle('auth:changePassword', async (event, { oldPassword, newPassword } = {}) => {
    const { ip } = getClientInfo(event);
    return changePassword({
      userId: event.auth.userId,
      oldPassword,
      newPassword,
      ipAddress: ip,
    });
  });

  // PERMISSIONS
  handle('auth:assignPermission', async (event, payload = {}) => {
    const { ip } = getClientInfo(event);
    return assignPermission({ ...payload, assignedByUserId: event.auth.userId, ipAddress: ip });
  });

  handle('auth:revokePermission', async (event, { permissionId } = {}) => {
    const { ip } = getClientInfo(event);
    return revokePermission({ permissionId, revokedByUserId: event.auth.userId, ipAddress: ip });
  });

  handle('auth:getUserPermissions', async (event, { userId } = {}) => {
    assertSelfOrAdmin(event.auth, userId);
    return getUserPermissions({ userId });
  });

  handle('auth:checkPermission', async (event, { userId, ressource, action } = {}) => {
    assertSelfOrAdmin(event.auth, userId);
    return checkPermission({ userId, ressource, action });
  });

  // SESSIONS
  handle('auth:getUserSessions', async (event, { userId } = {}) => {
    assertSelfOrAdmin(event.auth, userId);
    return getUserSessions({ userId });
  });

  handle('auth:revokeSession', async (event, { sessionId } = {}) => {
    const session = await getPrismaClient().session.findUnique({
      where: { id: Number(sessionId) },
      select: { utilisateurId: true },
    });
    if (!session) {
      throw new Error('Session introuvable.');
    }
    assertSelfOrAdmin(event.auth, session.utilisateurId);
    const { ip } = getClientInfo(event);
    return revokeSession({ sessionId, revokedByUserId: event.auth.userId, ipAddress: ip });
  });

  handle('auth:revokeAllUserSessions', async (event, { userId } = {}) => {
    assertSelfOrAdmin(event.auth, userId);
    const { ip } = getClientInfo(event);
    return revokeAllUserSessions({ userId, revokedByUserId: event.auth.userId, ipAddress: ip });
  });

  // RÉINITIALISATION PAR CODE OTP
  // Le code n'est renvoyé que si l'appelant est un administrateur connecté.
  handle('auth:requestPasswordResetByEmail', async (event, { email, isAdmin } = {}) => {
    const { ip } = getClientInfo(event);
    const callerIsAdmin = Boolean(isAdmin) && isAdminLevel(event.auth);
    return requestPasswordResetByEmail({ email, isAdmin: callerIsAdmin, ipAddress: ip });
  });

  handle('auth:validateResetCode', async (event, payload) => {
    const code = payload && typeof payload === 'object' ? payload.code : payload;
    return validateResetCode({ code });
  });

  handle('auth:resetPassword', async (event, { code, newPassword } = {}) => {
    const { ip } = getClientInfo(event);
    return resetPassword({ code, newPassword, ipAddress: ip });
  });

  handle('auth:getAllResetCodes', async (event, { page, limit, onlyActive } = {}) => {
    return getAllResetCodes({ userId: event.auth.userId, page, limit, onlyActive });
  });

  /**
   * Récupère les statistiques agrégées des utilisateurs.
   * @route auth:getStats
   * @returns {Promise<AuthStats>} Statistiques des utilisateurs
   */
  handle('auth:getStats', async () => {
    return getUserStats();
  });

  /**
   * Récupère les tendances évolutives des utilisateurs.
   * Compare les 30 derniers jours avec la période précédente.
   * @route auth:getTrends
   * @returns {Promise<AuthTrends>} Variations en pourcentage
   */
  handle('auth:getTrends', async () => {
    return getUserTrends();
  });

  /**
   * Récupère les données des sparklines pour les 12 derniers mois.
   * Génère les mini-graphiques pour l'affichage des KPI.
   * @route auth:getSparklines
   * @returns {Promise<AuthSparklineData>} Données historiques mensuelles
   */
  handle('auth:getSparklines', async () => {
    return getUserSparklines();
  });
}
