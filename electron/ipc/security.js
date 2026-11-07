/**
 * Sécurisation des handlers IPC.
 *
 * Le preload envoie chaque appel sous la forme
 *   ipcRenderer.invoke(channel, { __auth: <token d'accès | null> }, ...args)
 * Le wrapper `handle()` :
 *   1. vérifie que l'appel provient bien de l'application (origine du frame) ;
 *   2. valide le token (signature JWT + session active en base) sauf pour les canaux publics ;
 *   3. applique les restrictions de rôle ;
 *   4. limite les tentatives sur les canaux sensibles (connexion, codes) ;
 *   5. expose l'utilisateur authentifié au handler via `event.auth`.
 *
 * L'identité de l'utilisateur ne doit JAMAIS être lue dans le payload envoyé par le
 * renderer : utiliser `event.auth.userId`.
 *
 * @module electron/ipc/security
 */

/** Canaux accessibles sans être connecté. */
export const PUBLIC_CHANNELS = new Set([
  'auth:login',
  'auth:logout',
  'auth:validate',
  'auth:refresh',
  'auth:verifyDeveloperSetupCode',
  'auth:createInitialSetup',
  'auth:requestPasswordResetByEmail',
  'auth:validateResetCode',
  'auth:resetPassword',
]);

const ADMIN = ['ADMIN'];
const ADMIN_SECRETAIRE = ['ADMIN', 'SECRETAIRE'];

/**
 * Restrictions de rôle (champ `role` de l'utilisateur), alignées sur les gardes de
 * routes de l'interface (src/App.tsx). Les canaux absents sont ouverts à tout
 * utilisateur connecté.
 */
export const CHANNEL_ROLES = {
  'admin:getAuditLogs': ADMIN,
  'admin:getAdminStats': ADMIN,
  'admin:getAdminTrends': ADMIN,
  'admin:updateCompanyConfig': ADMIN,

  'vehicules:create': ADMIN,
  'vehicules:update': ADMIN,
  'vehicules:delete': ADMIN,
  'vehicules:createEntretien': ADMIN,
  'vehicules:updateEntretien': ADMIN,
  'vehicules:deleteEntretien': ADMIN,

  'formations:create': ADMIN,
  'formations:delete': ADMIN,
  'formations:update': ADMIN_SECRETAIRE,

  'moniteurs:create': ADMIN_SECRETAIRE,
  'moniteurs:update': ADMIN_SECRETAIRE,
  'moniteurs:delete': ADMIN,

  'examens:create': ADMIN_SECRETAIRE,
  'examens:update': ADMIN_SECRETAIRE,
  'examens:delete': ADMIN_SECRETAIRE,
};

/** Canaux soumis à une limitation des tentatives échouées. */
const RATE_LIMITED = {
  'auth:login': { max: 5, windowMs: 5 * 60 * 1000 },
  'auth:verifyDeveloperSetupCode': { max: 5, windowMs: 15 * 60 * 1000 },
  'auth:validateResetCode': { max: 5, windowMs: 5 * 60 * 1000 },
  'auth:resetPassword': { max: 5, windowMs: 5 * 60 * 1000 },
};

/** Canaux après lesquels le cache des sessions doit être vidé. */
const INVALIDATING_CHANNELS = new Set([
  'auth:logout',
  'auth:updateUser',
  'auth:deleteUser',
  'auth:changePassword',
  'auth:resetPassword',
  'auth:revokeSession',
  'auth:revokeAllUserSessions',
  'auth:refresh',
]);

const AUTH_CACHE_TTL_MS = 30 * 1000;

export class IpcAuthError extends Error {
  constructor(code, message) {
    super(`${code}: ${message}`);
    this.code = code;
  }
}

export function isAdminLevel(auth) {
  return Boolean(auth && (auth.niveau === 'SUPER_ADMIN' || auth.niveau === 'ADMIN'));
}

/**
 * Lève une erreur si l'utilisateur connecté n'est ni la cible, ni administrateur.
 * @param {{ userId: number, niveau: string } | null} auth
 * @param {number|string} targetUserId
 */
export function assertSelfOrAdmin(auth, targetUserId) {
  if (!auth) throw new IpcAuthError('AUTH_REQUIRED', 'Veuillez vous reconnecter.');
  if (Number(targetUserId) === auth.userId || isAdminLevel(auth)) return;
  throw new IpcAuthError('FORBIDDEN', 'Permissions insuffisantes.');
}

/**
 * @param {object} deps
 * @param {Electron.IpcMain} deps.ipcMain
 * @param {(token: string) => Promise<{ valid: boolean, user?: any, sessionId?: number }>} deps.validateToken
 * @param {(url: string) => boolean} deps.isTrustedUrl
 * @param {(message: string, error?: unknown) => void} [deps.log]
 */
export function createSecureIpc({ ipcMain, validateToken, isTrustedUrl, log = () => {} }) {
  const authCache = new Map();
  const failures = new Map();

  async function resolveAuth(token) {
    if (typeof token !== 'string' || token.length === 0) return null;

    const cached = authCache.get(token);
    if (cached && cached.expiresAt > Date.now()) return cached.auth;

    let result;
    try {
      result = await validateToken(token);
    } catch (error) {
      log('Validation du token impossible', error);
      return null;
    }
    if (!result?.valid || !result.user) {
      authCache.delete(token);
      return null;
    }

    const auth = {
      userId: result.user.id,
      role: result.user.role,
      niveau: result.user.niveau,
      sessionId: result.sessionId ?? null,
      token,
    };
    authCache.set(token, { auth, expiresAt: Date.now() + AUTH_CACHE_TTL_MS });
    return auth;
  }

  function rateKey(channel, args) {
    const email = args[0] && typeof args[0] === 'object' ? args[0].email : undefined;
    return email ? `${channel}:${String(email).trim().toLowerCase()}` : channel;
  }

  function checkRateLimit(channel, key) {
    const rule = RATE_LIMITED[channel];
    if (!rule) return;
    const now = Date.now();
    const recent = (failures.get(key) || []).filter((t) => now - t < rule.windowMs);
    failures.set(key, recent);
    if (recent.length >= rule.max) {
      const waitMin = Math.ceil((rule.windowMs - (now - recent[0])) / 60000);
      throw new IpcAuthError(
        'RATE_LIMITED',
        `Trop de tentatives. Réessayez dans ${waitMin} minute${waitMin > 1 ? 's' : ''}.`
      );
    }
  }

  function recordOutcome(channel, key, failed) {
    if (!RATE_LIMITED[channel]) return;
    if (failed) {
      failures.set(key, [...(failures.get(key) || []), Date.now()]);
    } else {
      failures.delete(key);
    }
  }

  /**
   * Enregistre un handler IPC sécurisé.
   * @param {string} channel
   * @param {(event: Electron.IpcMainInvokeEvent & { auth: object|null }, ...args: any[]) => any} handler
   */
  function handle(channel, handler) {
    ipcMain.handle(channel, async (event, envelope, ...rest) => {
      const senderUrl = event.senderFrame?.url ?? '';
      if (!isTrustedUrl(senderUrl)) {
        log(`Appel IPC refusé depuis une origine non autorisée (${channel}) : ${senderUrl}`);
        throw new IpcAuthError('FORBIDDEN', 'Origine non autorisée.');
      }

      const hasEnvelope =
        envelope !== null && typeof envelope === 'object' && Object.hasOwn(envelope, '__auth');
      const args = hasEnvelope ? rest : [envelope, ...rest];
      const token = hasEnvelope ? envelope.__auth : null;

      const auth = await resolveAuth(token);

      if (!PUBLIC_CHANNELS.has(channel)) {
        if (!auth) {
          throw new IpcAuthError('AUTH_REQUIRED', 'Session expirée ou invalide. Veuillez vous reconnecter.');
        }
        const roles = CHANNEL_ROLES[channel];
        if (roles && !roles.includes(auth.role)) {
          throw new IpcAuthError('FORBIDDEN', "Vous n'avez pas les droits pour cette action.");
        }
      }

      const key = rateKey(channel, args);
      checkRateLimit(channel, key);

      event.auth = auth;
      try {
        const result = await handler(event, ...args);
        recordOutcome(channel, key, result && typeof result === 'object' && result.valid === false);
        return result;
      } catch (error) {
        recordOutcome(channel, key, true);
        throw error;
      } finally {
        if (INVALIDATING_CHANNELS.has(channel)) authCache.clear();
      }
    });
  }

  return { handle, clearAuthCache: () => authCache.clear() };
}
