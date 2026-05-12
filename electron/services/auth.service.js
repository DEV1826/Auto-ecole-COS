// /home/stive-junior/Auto-ecole-COS/electron/services/auth.service.js

/**
 * Service d'authentification et de gestion des utilisateurs
 * Gère les sessions, permissions, audit logs et sécurité
 *
 * @module authService
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import {
  prisma,
  executePrismaOperation,
  create,
  update,
  findUnique,
  findMany,
  count,
} from './prisma.client.js';

// ===============================
// VARIABLES D'ENVIRONNEMENT
// ===============================

const JWT_SECRET = process.env.JWT_SECRET || 'default-jwt-secret-change-me-please';
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-me-please';
const SESSION_DURATION_HOURS = parseInt(process.env.SESSION_DURATION_HOURS, 10) || 24;
const TOKEN_EXPIRATION_HOURS = parseInt(process.env.TOKEN_EXPIRATION_HOURS, 10) || 24;
const REFRESH_TOKEN_EXPIRATION_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRATION_DAYS, 10) || 7;

const SESSION_DURATION_MS = SESSION_DURATION_HOURS * 60 * 60 * 1000;

// ===============================
// UTILITAIRES DE HACHAGE ET TOKENS
// ===============================

/**
 * Hache un mot de passe avec SHA-256
 * @param {string} password - Mot de passe en clair
 * @returns {string} Hash hexadécimal
 */
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Vérifie un mot de passe par rapport à son hash
 * @param {string} password - Mot de passe en clair
 * @param {string} hash - Hash stocké
 * @returns {boolean}
 */
function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

/**
 * Génère un token JWT d'accès
 * @param {number} userId - ID utilisateur
 * @param {string} role - Rôle
 * @param {string} niveau - Niveau d'accès
 * @returns {string} Token JWT
 */
function generateAccessToken(userId, role, niveau) {
  return jwt.sign({ userId, role, niveau, type: 'access' }, JWT_SECRET, {
    expiresIn: `${TOKEN_EXPIRATION_HOURS}h`,
  });
}

/**
 * Génère un refresh token JWT
 * @param {number} userId - ID utilisateur
 * @returns {string} Refresh token
 */
function generateRefreshToken(userId) {
  return jwt.sign({ userId, type: 'refresh' }, JWT_REFRESH_SECRET, {
    expiresIn: `${REFRESH_TOKEN_EXPIRATION_DAYS}d`,
  });
}

/**
 * Vérifie et décode un token JWT (access)
 * @param {string} token - Token à vérifier
 * @returns {object|null} Payload décodé ou null
 */
function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Erreur lors de la vérification du token JWT (access):', error);
    return null;
  }
}

/**
 * Vérifie et décode un refresh token
 * @param {string} token - Refresh token
 * @returns {object|null} Payload décodé ou null
 */
function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    console.error('Erreur lors de la vérification du refresh token JWT:', error);
    return null;
  }
}

// ===============================
// AUDIT LOGS
// ===============================

/**
 * Enregistre un événement dans les logs d'audit
 * @param {number|null} utilisateurId - ID de l'utilisateur ayant effectué l'action
 * @param {string} action - Code de l'action (ex: LOGIN, CREATE_USER)
 * @param {string|null} ressource - Type de ressource concernée
 * @param {number|null} ressourceId - ID de la ressource concernée
 * @param {string|null} description - Description textuelle
 * @param {string|null} ipAddress - Adresse IP
 * @param {string} [statut='SUCCESS'] - SUCCESS ou FAILED
 * @returns {Promise<void>}
 */
async function logAudit(
  utilisateurId,
  action,
  ressource,
  ressourceId,
  description,
  ipAddress,
  statut = 'SUCCESS'
) {
  try {
    await create('auditLog', {
      utilisateurId: utilisateurId || null,
      action,
      ressource,
      ressourceId,
      description,
      ipAddress,
      statut,
    });
  } catch (error) {
    console.error("Erreur lors de la création du log d'audit:", error);
  }
}

// ===============================
// AUTHENTIFICATION
// ===============================

/**
 * Connecte un utilisateur et crée une session
 * @param {Object} params
 * @param {string} params.email - Email
 * @param {string} params.password - Mot de passe
 * @param {string} [params.ipAddress] - Adresse IP
 * @param {string} [params.userAgent] - User Agent
 * @returns {Promise<Object>} Informations de session
 * @throws {Error} Si authentification échoue
 */
export async function login({ email, password, ipAddress, userAgent }) {
  return executePrismaOperation(async () => {
    if (!email || !password) {
      throw new Error('Email et mot de passe obligatoires.');
    }

    // Récupérer l'utilisateur avec ses permissions actives
    const user = await findUnique(
      'utilisateur',
      { email },
      {
        permissions: { where: { actif: true } },
      }
    );

    if (!user || !user.actif) {
      await logAudit(
        null,
        'LOGIN_FAILED',
        'Utilisateur',
        null,
        'Utilisateur non trouvé ou inactif',
        ipAddress,
        'FAILED'
      );
      throw new Error('Utilisateur introuvable ou inactif.');
    }

    if (!verifyPassword(password, user.passwordHash)) {
      await logAudit(
        user.id,
        'LOGIN_FAILED',
        'Utilisateur',
        user.id,
        'Mot de passe incorrect',
        ipAddress,
        'FAILED'
      );
      throw new Error('Identifiants invalides.');
    }

    // Créer la session
    const accessToken = generateAccessToken(user.id, user.role, user.niveau);
    const refreshToken = generateRefreshToken(user.id);
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    const session = await create('session', {
      utilisateurId: user.id,
      token: accessToken,
      refreshToken,
      expiresAt,
      ipAddress,
      userAgent,
      actif: true,
    });

    await logAudit(
      user.id,
      'LOGIN_SUCCESS',
      'Utilisateur',
      user.id,
      'Connexion réussie',
      ipAddress
    );

    return {
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role,
      niveau: user.niveau,
      displayName: `${user.prenom} ${user.nom}`,
      token: accessToken,
      refreshToken,
      sessionId: session.id,
      permissions: user.permissions.map((p) => ({
        ressource: p.ressource,
        action: p.action,
      })),
    };
  }, 'Erreur lors de la connexion');
}

/**
 * Déconnecte un utilisateur en désactivant sa session
 * @param {Object} params
 * @param {number} params.sessionId - ID de la session
 * @param {number} params.userId - ID de l'utilisateur
 * @param {string} [params.ipAddress] - Adresse IP
 * @returns {Promise<Object>}
 */
export async function logout({ sessionId, userId, ipAddress }) {
  return executePrismaOperation(async () => {
    if (!sessionId || !userId) {
      throw new Error('Session ou utilisateur manquant.');
    }

    await update('session', { id: sessionId }, { actif: false });

    await logAudit(userId, 'LOGOUT', 'Utilisateur', userId, 'Déconnexion', ipAddress);

    return { success: true, message: 'Déconnexion réussie' };
  }, 'Erreur lors de la déconnexion');
}

/**
 * Valide un token d'accès et retourne les informations utilisateur associées
 * @param {string} token - Token JWT
 * @returns {Promise<Object>} { valid, user, sessionId } ou { valid, error }
 */
export async function validateToken(token) {
  return executePrismaOperation(async () => {
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return { valid: false, error: 'Token invalide ou expiré' };
    }

    const session = await findUnique(
      'session',
      { token },
      {
        utilisateur: {
          include: { permissions: { where: { actif: true } } },
        },
      }
    );

    if (!session || !session.actif) {
      return { valid: false, error: 'Session inexistante ou désactivée' };
    }

    // Mettre à jour le dernier accès
    await update('session', { id: session.id }, { dernierAcces: new Date() });

    return {
      valid: true,
      user: {
        id: session.utilisateur.id,
        email: session.utilisateur.email,
        role: session.utilisateur.role,
        niveau: session.utilisateur.niveau,
        permissions: session.utilisateur.permissions.map((p) => ({
          ressource: p.ressource,
          action: p.action,
        })),
      },
      sessionId: session.id,
    };
  }, 'Erreur lors de la validation du token');
}

/**
 * Rafraîchit un token d'accès à l'aide d'un refresh token
 * @param {Object} params
 * @param {string} params.refreshToken - Refresh token
 * @returns {Promise<Object>} Nouveau token, refresh token et ID session
 */
export async function refreshToken({ refreshToken }) {
  return executePrismaOperation(async () => {
    if (!refreshToken) {
      throw new Error('Refresh token manquant.');
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      throw new Error('Refresh token invalide ou expiré.');
    }

    const session = await findUnique(
      'session',
      { refreshToken },
      {
        utilisateur: true,
      }
    );

    if (!session || !session.actif) {
      throw new Error('Session inexistante ou désactivée.');
    }

    // Générer un nouveau token d'accès et un nouveau refresh token
    const newAccessToken = generateAccessToken(
      session.utilisateur.id,
      session.utilisateur.role,
      session.utilisateur.niveau
    );
    const newRefreshToken = generateRefreshToken(session.utilisateur.id);

    await update(
      'session',
      { id: session.id },
      {
        token: newAccessToken,
        refreshToken: newRefreshToken,
        dernierAcces: new Date(),
      }
    );

    return {
      token: newAccessToken,
      refreshToken: newRefreshToken,
      sessionId: session.id,
    };
  }, 'Erreur lors du refresh token');
}

// ===============================
// GESTION DES UTILISATEURS
// ===============================

/**
 * Crée un nouvel utilisateur (nécessite des droits suffisants)
 * @param {Object} params
 * @param {string} params.email - Email unique
 * @param {string} params.nom - Nom
 * @param {string} params.prenom - Prénom
 * @param {string} params.password - Mot de passe en clair
 * @param {string} params.role - Rôle (ADMIN, SECRETAIRE, MONITEUR)
 * @param {string} params.niveau - Niveau d'accès (SUPER_ADMIN, ADMIN, MANAGER, STANDARD, GUEST)
 * @param {number} [params.creeParId] - ID du créateur
 * @param {string} [params.ipAddress] - Adresse IP
 * @returns {Promise<Object>} Utilisateur créé (sans mot de passe)
 */
export async function createUser({
  email,
  nom,
  prenom,
  password,
  role,
  niveau,
  creeParId,
  ipAddress,
}) {
  return executePrismaOperation(async () => {
    // Validations
    if (!email || !nom || !prenom || !password) {
      throw new Error('Email, nom, prénom et mot de passe obligatoires.');
    }
    if (!role || !niveau) {
      throw new Error("Rôle et niveau d'accès obligatoires.");
    }

    // Vérifier les permissions du créateur
    if (creeParId) {
      await verifyPermissionToCreateUser(creeParId, niveau);
    }

    // Vérifier l'unicité de l'email
    const existing = await findUnique('utilisateur', { email });
    if (existing) {
      throw new Error('Un utilisateur avec cet email existe déjà.');
    }

    const passwordHash = hashPassword(password);
    const user = await create('utilisateur', {
      email,
      nom,
      prenom,
      passwordHash,
      role,
      niveau,
      creeParId: creeParId || null,
      actif: true,
    });

    await logAudit(
      creeParId || null,
      'CREATE_USER',
      'Utilisateur',
      user.id,
      `Création de l'utilisateur ${email}`,
      ipAddress
    );

    // Assigner les permissions par défaut
    await assignDefaultPermissions(user.id, role, niveau);

    return {
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role,
      niveau: user.niveau,
      displayName: `${user.prenom} ${user.nom}`,
      createdAt: user.createdAt,
    };
  }, "Erreur lors de la création de l'utilisateur");
}

/**
 * Met à jour un utilisateur existant
 * @param {Object} params
 * @param {number} params.userId - ID de l'utilisateur à modifier
 * @param {string} [params.nom] - Nouveau nom
 * @param {string} [params.prenom] - Nouveau prénom
 * @param {string} [params.role] - Nouveau rôle
 * @param {string} [params.niveau] - Nouveau niveau
 * @param {boolean} [params.actif] - Statut actif
 * @param {number} params.updatedByUserId - ID de l'utilisateur qui effectue la modification
 * @param {string} [params.ipAddress] - Adresse IP
 * @returns {Promise<Object>} Utilisateur mis à jour
 */
export async function updateUser({
  userId,
  nom,
  prenom,
  role,
  niveau,
  actif,
  updatedByUserId,
  ipAddress,
}) {
  return executePrismaOperation(async () => {
    if (!userId) {
      throw new Error('ID utilisateur obligatoire.');
    }

    // Vérifier les permissions du modifieur
    const updater = await findUnique('utilisateur', { id: updatedByUserId });
    if (!updater || (updater.niveau !== 'SUPER_ADMIN' && updater.niveau !== 'ADMIN')) {
      throw new Error('Permissions insuffisantes pour modifier cet utilisateur.');
    }
    if (updatedByUserId === userId && niveau) {
      throw new Error("Vous ne pouvez pas modifier votre propre niveau d'accès.");
    }

    const updateData = {};
    if (nom !== undefined) updateData.nom = nom;
    if (prenom !== undefined) updateData.prenom = prenom;
    if (role !== undefined) updateData.role = role;
    if (niveau !== undefined) updateData.niveau = niveau;
    if (actif !== undefined) updateData.actif = actif;

    const user = await update('utilisateur', { id: userId }, updateData);

    await logAudit(
      updatedByUserId,
      'UPDATE_USER',
      'Utilisateur',
      userId,
      `Modification de l'utilisateur ${user.email}`,
      ipAddress
    );

    return {
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role,
      niveau: user.niveau,
      actif: user.actif,
    };
  }, "Erreur lors de la mise à jour de l'utilisateur");
}

/**
 * Supprime (désactive) un utilisateur
 * @param {Object} params
 * @param {number} params.userId - ID de l'utilisateur à désactiver
 * @param {number} params.deletedByUserId - ID de l'utilisateur qui effectue la suppression
 * @param {string} [params.ipAddress] - Adresse IP
 * @returns {Promise<Object>}
 */
export async function deleteUser({ userId, deletedByUserId, ipAddress }) {
  return executePrismaOperation(async () => {
    if (!userId) {
      throw new Error('ID utilisateur obligatoire.');
    }

    const deleter = await findUnique('utilisateur', { id: deletedByUserId });
    if (!deleter || (deleter.niveau !== 'SUPER_ADMIN' && deleter.niveau !== 'ADMIN')) {
      throw new Error('Permissions insuffisantes pour supprimer cet utilisateur.');
    }
    if (deletedByUserId === userId) {
      throw new Error('Vous ne pouvez pas vous supprimer vous-même.');
    }

    // Désactivation au lieu de suppression physique
    await update('utilisateur', { id: userId }, { actif: false });

    await logAudit(
      deletedByUserId,
      'DELETE_USER',
      'Utilisateur',
      userId,
      `Désactivation de l'utilisateur`,
      ipAddress
    );

    return { success: true, message: 'Utilisateur désactivé avec succès' };
  }, "Erreur lors de la suppression de l'utilisateur");
}

/**
 * Récupère la liste des utilisateurs (avec pagination)
 * @param {Object} params
 * @param {number} params.userId - ID de l'utilisateur qui fait la demande (nécessite droits admin)
 * @param {number} [params.page=1] - Numéro de page
 * @param {number} [params.limit=20] - Nombre d'éléments par page
 * @returns {Promise<Object>} Liste paginée
 */
export async function getAllUsers({ userId, page = 1, limit = 20 }) {
  return executePrismaOperation(async () => {
    const requester = await findUnique('utilisateur', { id: userId });
    if (!requester || (requester.niveau !== 'SUPER_ADMIN' && requester.niveau !== 'ADMIN')) {
      throw new Error('Permissions insuffisantes.');
    }

    const skip = (page - 1) * limit;
    const [users, totalUsers] = await Promise.all([
      findMany(
        'utilisateur',
        {},
        {
          id: true,
          email: true,
          nom: true,
          prenom: true,
          role: true,
          niveau: true,
          actif: true,
          createdAt: true,
          updatedAt: true,
        },
        { createdAt: 'desc' },
        skip,
        limit
      ),
      count('utilisateur'),
    ]);

    return {
      users,
      total: totalUsers,
      page,
      limit,
      totalPages: Math.ceil(totalUsers / limit),
    };
  }, 'Erreur lors de la récupération des utilisateurs');
}

/**
 * Récupère les détails d'un utilisateur spécifique (inclut permissions et sessions actives)
 * @param {Object} params
 * @param {number} params.userId - ID de l'utilisateur à consulter
 * @param {number} params.requesterId - ID de l'utilisateur qui fait la demande
 * @returns {Promise<Object>}
 */
export async function getUserById({ userId, requesterId }) {
  return executePrismaOperation(async () => {
    const requester = await findUnique('utilisateur', { id: requesterId });
    if (
      !requester ||
      (requester.niveau !== 'SUPER_ADMIN' && requester.niveau !== 'ADMIN' && requesterId !== userId)
    ) {
      throw new Error('Permissions insuffisantes.');
    }

    const user = await findUnique(
      'utilisateur',
      { id: userId },
      {
        permissions: { where: { actif: true } },
        sessions: { where: { actif: true } },
      }
    );

    if (!user) {
      throw new Error('Utilisateur non trouvé.');
    }

    return {
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role,
      niveau: user.niveau,
      actif: user.actif,
      permissions: user.permissions.map((p) => ({ ressource: p.ressource, action: p.action })),
      sessionsActives: user.sessions.length,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }, "Erreur lors de la récupération de l'utilisateur");
}

/**
 * Change le mot de passe d'un utilisateur
 * @param {Object} params
 * @param {number} params.userId - ID de l'utilisateur
 * @param {string} params.oldPassword - Ancien mot de passe
 * @param {string} params.newPassword - Nouveau mot de passe
 * @param {string} [params.ipAddress] - Adresse IP
 * @returns {Promise<Object>}
 */
export async function changePassword({ userId, oldPassword, newPassword, ipAddress }) {
  return executePrismaOperation(async () => {
    if (!userId || !oldPassword || !newPassword) {
      throw new Error('ID utilisateur, ancien mot de passe et nouveau mot de passe obligatoires.');
    }
    if (oldPassword === newPassword) {
      throw new Error("Le nouveau mot de passe doit être différent de l'ancien.");
    }

    const user = await findUnique('utilisateur', { id: userId });
    if (!user) {
      throw new Error('Utilisateur non trouvé.');
    }
    if (!verifyPassword(oldPassword, user.passwordHash)) {
      await logAudit(
        userId,
        'CHANGE_PASSWORD_FAILED',
        'Utilisateur',
        userId,
        'Ancien mot de passe incorrect',
        ipAddress,
        'FAILED'
      );
      throw new Error('Ancien mot de passe incorrect.');
    }

    const newHash = hashPassword(newPassword);
    await update('utilisateur', { id: userId }, { passwordHash: newHash });

    await logAudit(
      userId,
      'CHANGE_PASSWORD',
      'Utilisateur',
      userId,
      'Changement de mot de passe',
      ipAddress
    );

    return { success: true, message: 'Mot de passe changé avec succès' };
  }, 'Erreur lors du changement de mot de passe');
}

// ===============================
// GESTION DES PERMISSIONS
// ===============================

/**
 * Assigne une permission à un utilisateur
 * @param {Object} params
 * @param {number} params.userId - ID de l'utilisateur
 * @param {string} params.ressource - Nom de la ressource
 * @param {string} params.action - Action autorisée (create, read, update, delete)
 * @param {number} params.assignedByUserId - ID de l'utilisateur qui assigne
 * @param {string} [params.ipAddress] - Adresse IP
 * @returns {Promise<Object>} Permission créée ou mise à jour
 */
export async function assignPermission({ userId, ressource, action, assignedByUserId, ipAddress }) {
  return executePrismaOperation(async () => {
    if (!userId || !ressource || !action) {
      throw new Error('ID utilisateur, ressource et action obligatoires.');
    }

    const assigner = await findUnique('utilisateur', { id: assignedByUserId });
    if (!assigner || (assigner.niveau !== 'SUPER_ADMIN' && assigner.niveau !== 'ADMIN')) {
      throw new Error('Permissions insuffisantes pour assigner des permissions.');
    }

    const permission = await prisma.permission.upsert({
      where: {
        utilisateurId_ressource_action: { utilisateurId: userId, ressource, action },
      },
      update: { actif: true },
      create: { utilisateurId: userId, ressource, action, actif: true },
    });

    await logAudit(
      assignedByUserId,
      'ASSIGN_PERMISSION',
      'Permission',
      permission.id,
      `Permission ${action} sur ${ressource}`,
      ipAddress
    );

    return permission;
  }, "Erreur lors de l'assignation de la permission");
}

/**
 * Révoque une permission (désactivation)
 * @param {Object} params
 * @param {number} params.permissionId - ID de la permission
 * @param {number} params.revokedByUserId - ID de l'utilisateur qui révoque
 * @param {string} [params.ipAddress] - Adresse IP
 * @returns {Promise<Object>}
 */
export async function revokePermission({ permissionId, revokedByUserId, ipAddress }) {
  return executePrismaOperation(async () => {
    if (!permissionId) {
      throw new Error('ID permission obligatoire.');
    }

    const revoker = await findUnique('utilisateur', { id: revokedByUserId });
    if (!revoker || (revoker.niveau !== 'SUPER_ADMIN' && revoker.niveau !== 'ADMIN')) {
      throw new Error('Permissions insuffisantes pour révoquer des permissions.');
    }

    await update('permission', { id: permissionId }, { actif: false });

    await logAudit(
      revokedByUserId,
      'REVOKE_PERMISSION',
      'Permission',
      permissionId,
      `Révocation de permission`,
      ipAddress
    );

    return { success: true, message: 'Permission révoquée avec succès' };
  }, 'Erreur lors de la révocation de la permission');
}

/**
 * Récupère toutes les permissions actives d'un utilisateur
 * @param {Object} params
 * @param {number} params.userId - ID de l'utilisateur
 * @returns {Promise<Array>} Liste des permissions
 */
export async function getUserPermissions({ userId }) {
  return executePrismaOperation(async () => {
    if (!userId) {
      throw new Error('ID utilisateur obligatoire.');
    }
    const permissions = await findMany('permission', { utilisateurId: userId, actif: true });
    return permissions.map((p) => ({ ressource: p.ressource, action: p.action }));
  }, 'Erreur lors de la récupération des permissions');
}

/**
 * Vérifie si un utilisateur a une permission spécifique
 * @param {Object} params
 * @param {number} params.userId - ID de l'utilisateur
 * @param {string} params.ressource - Ressource
 * @param {string} params.action - Action
 * @returns {Promise<boolean>}
 */
export async function checkPermission({ userId, ressource, action }) {
  return executePrismaOperation(async () => {
    if (!userId || !ressource || !action) return false;
    const permission = await findUnique('permission', {
      utilisateurId_ressource_action: { utilisateurId: userId, ressource, action },
    });
    return permission ? permission.actif : false;
  }, 'Erreur lors de la vérification de permission');
}

// ===============================
// GESTION DES SESSIONS
// ===============================

/**
 * Récupère toutes les sessions d'un utilisateur
 * @param {Object} params
 * @param {number} params.userId - ID de l'utilisateur
 * @returns {Promise<Array>} Liste des sessions
 */
export async function getUserSessions({ userId }) {
  return executePrismaOperation(async () => {
    if (!userId) {
      throw new Error('ID utilisateur obligatoire.');
    }
    const sessions = await findMany(
      'session',
      { utilisateurId: userId },
      {},
      { createdAt: 'desc' }
    );
    return sessions.map((s) => ({
      id: s.id,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      actif: s.actif,
      dernierAcces: s.dernierAcces,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    }));
  }, 'Erreur lors de la récupération des sessions');
}

/**
 * Révoque une session spécifique (déconnexion forcée)
 * @param {Object} params
 * @param {number} params.sessionId - ID de la session
 * @param {number} params.revokedByUserId - ID de l'utilisateur qui révoque
 * @param {string} [params.ipAddress] - Adresse IP
 * @returns {Promise<Object>}
 */
export async function revokeSession({ sessionId, revokedByUserId, ipAddress }) {
  return executePrismaOperation(async () => {
    if (!sessionId) {
      throw new Error('ID session obligatoire.');
    }
    await update('session', { id: sessionId }, { actif: false });
    await logAudit(
      revokedByUserId,
      'REVOKE_SESSION',
      'Session',
      sessionId,
      `Révocation de session`,
      ipAddress
    );
    return { success: true, message: 'Session révoquée avec succès' };
  }, 'Erreur lors de la révocation de la session');
}

/**
 * Révoque toutes les sessions actives d'un utilisateur
 * @param {Object} params
 * @param {number} params.userId - ID de l'utilisateur
 * @param {number} params.revokedByUserId - ID de l'utilisateur qui révoque
 * @param {string} [params.ipAddress] - Adresse IP
 * @returns {Promise<Object>}
 */
export async function revokeAllUserSessions({ userId, revokedByUserId, ipAddress }) {
  return executePrismaOperation(async () => {
    if (!userId) {
      throw new Error('ID utilisateur obligatoire.');
    }
    await prisma.session.updateMany({
      where: { utilisateurId: userId },
      data: { actif: false },
    });
    await logAudit(
      revokedByUserId,
      'REVOKE_ALL_SESSIONS',
      'Utilisateur',
      userId,
      `Révocation de toutes les sessions`,
      ipAddress
    );
    return { success: true, message: 'Toutes les sessions ont été révoquées' };
  }, 'Erreur lors de la révocation des sessions');
}

// ===============================
// AUDIT LOGS (lecture)
// ===============================

/**
 * Récupère les logs d'audit avec pagination et filtres
 * @param {Object} params
 * @param {number} params.userId - ID de l'utilisateur qui consulte (nécessite droits admin)
 * @param {number} [params.page=1] - Page
 * @param {number} [params.limit=50] - Limite
 * @param {Object} [params.filters={}] - Filtres (utilisateurId, action, statut)
 * @returns {Promise<Object>} Logs paginés
 */
export async function getAuditLogs({ userId, page = 1, limit = 50, filters = {} }) {
  return executePrismaOperation(async () => {
    const requester = await findUnique('utilisateur', { id: userId });
    if (!requester || (requester.niveau !== 'SUPER_ADMIN' && requester.niveau !== 'ADMIN')) {
      throw new Error('Permissions insuffisantes.');
    }

    const skip = (page - 1) * limit;
    const where = {};
    if (filters.utilisateurId) where.utilisateurId = filters.utilisateurId;
    if (filters.action) where.action = filters.action;
    if (filters.statut) where.statut = filters.statut;

    const [logs, totalLogs] = await Promise.all([
      findMany(
        'auditLog',
        where,
        { utilisateur: { select: { id: true, email: true, nom: true, prenom: true } } },
        { createdAt: 'desc' },
        skip,
        limit
      ),
      count('auditLog', where),
    ]);

    return {
      logs,
      total: totalLogs,
      page,
      limit,
      totalPages: Math.ceil(totalLogs / limit),
    };
  }, "Erreur lors de la récupération des logs d'audit");
}

// ===============================
// UTILITAIRES INTERNES (non exportés)
// ===============================

/**
 * Vérifie qu'un créateur a le droit de créer un utilisateur d'un certain niveau
 * @param {number} creatorId - ID du créateur
 * @param {string} userLevel - Niveau de l'utilisateur à créer
 * @returns {Promise<void>}
 */
async function verifyPermissionToCreateUser(creatorId, userLevel) {
  const creator = await findUnique('utilisateur', { id: creatorId });
  if (!creator) {
    throw new Error('Créateur non trouvé.');
  }
  if (userLevel === 'SUPER_ADMIN' && creator.niveau !== 'SUPER_ADMIN') {
    throw new Error('Seul un SUPER_ADMIN peut créer un SUPER_ADMIN.');
  }
  if (creator.niveau !== 'ADMIN' && creator.niveau !== 'SUPER_ADMIN') {
    throw new Error('Permissions insuffisantes pour créer un utilisateur.');
  }
}

/**
 * Assigne un ensemble de permissions par défaut selon le rôle et le niveau
 * @param {number} userId - ID de l'utilisateur
 * @param {string} role - Rôle (ADMIN, SECRETAIRE, MONITEUR)
 * @param {string} niveau - Niveau d'accès
 * @returns {Promise<void>}
 */
async function assignDefaultPermissions(userId, role, niveau) {
  // Permissions de base par rôle
  const rolePermissionsMap = {
    ADMIN: [
      { ressource: 'utilisateurs', action: 'read' },
      { ressource: 'utilisateurs', action: 'create' },
      { ressource: 'utilisateurs', action: 'update' },
      { ressource: 'candidats', action: 'read' },
      { ressource: 'candidats', action: 'create' },
      { ressource: 'candidats', action: 'update' },
      { ressource: 'paiements', action: 'read' },
      { ressource: 'formations', action: 'read' },
    ],
    SECRETAIRE: [
      { ressource: 'candidats', action: 'read' },
      { ressource: 'candidats', action: 'create' },
      { ressource: 'candidats', action: 'update' },
      { ressource: 'paiements', action: 'read' },
      { ressource: 'paiements', action: 'create' },
    ],
    MONITEUR: [
      { ressource: 'candidats', action: 'read' },
      { ressource: 'formations', action: 'read' },
    ],
  };

  // Permissions supplémentaires selon le niveau
  const niveauResourcesMap = {
    SUPER_ADMIN: ['utilisateurs', 'candidats', 'paiements', 'formations', 'vehicules'],
    ADMIN: ['candidats', 'paiements', 'formations', 'vehicules'],
    MANAGER: ['candidats', 'paiements'],
    STANDARD: ['candidats'],
    GUEST: [],
  };

  let permissions = [...(rolePermissionsMap[role] || [])];
  const extraResources = niveauResourcesMap[niveau] || [];
  for (const ressource of extraResources) {
    if (!permissions.some((p) => p.ressource === ressource)) {
      permissions.push({ ressource, action: 'read' });
    }
  }

  // Insérer les permissions en évitant les doublons
  for (const perm of permissions) {
    try {
      await prisma.permission.upsert({
        where: {
          utilisateurId_ressource_action: {
            utilisateurId: userId,
            ressource: perm.ressource,
            action: perm.action,
          },
        },
        update: { actif: true },
        create: {
          utilisateurId: userId,
          ressource: perm.ressource,
          action: perm.action,
          actif: true,
        },
      });
    } catch (error) {
      console.error(
        `Erreur lors de l'assignation de la permission ${perm.ressource}:${perm.action}`,
        error
      );
    }
  }
}

/**
 * Génère un code OTP à 6 chiffres aléatoire.
 * @returns {string} Code à 6 chiffres
 */
function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Demande un code de réinitialisation pour un utilisateur (génère et stocke le code).
 * L'administrateur peut consulter ce code via l'interface admin.
 * @param {Object} params
 * @param {string} params.email - Email de l'utilisateur
 * @returns {Promise<Object>} { success, message, code? } (code uniquement si admin ou en développement)
 */
export async function requestPasswordResetByEmail({ email, isAdmin = false }) {
  return executePrismaOperation(async () => {
    if (!email) throw new Error('Email requis.');

    const user = await findUnique('utilisateur', { email });
    if (!user) {
      // Sécurité : ne pas révéler l'existence de l'email
      return {
        success: true,
        message: 'Si cet email existe, un code de réinitialisation a été généré.',
      };
    }

    // Supprimer les anciens codes non utilisés expirés pour cet utilisateur
    await prisma.passwordResetCode.deleteMany({
      where: {
        utilisateurId: user.id,
        used: false,
        expiresAt: { lt: new Date() },
      },
    });

    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await create('passwordResetCode', {
      code,
      utilisateurId: user.id,
      expiresAt,
      used: false,
    });

    // Log l'action
    await logAudit(
      isAdmin ? user.id : null,
      'REQUEST_PASSWORD_RESET',
      'Utilisateur',
      user.id,
      `Demande de réinitialisation de mot de passe${isAdmin ? ' (par admin)' : ''}`,
      null
    );

    if (isAdmin) {
      return {
        success: true,
        message: `Code de réinitialisation généré : ${code}`,
        code,
        userId: user.id,
      };
    }

    return {
      success: true,
      message: 'Veuillez contacter votre administrateur pour obtenir le code de réinitialisation.',
    };
  }, 'Erreur lors de la demande de réinitialisation');
}

/**
 * Valide un code OTP de réinitialisation.
 * @param {Object} params
 * @param {string} params.code - Code à 6 chiffres
 * @returns {Promise<Object>} { valid, message, userId? }
 */
export async function validateResetCode({ code }) {
  return executePrismaOperation(async () => {
    if (!code) throw new Error('Code manquant.');

    const resetCode = await findUnique('passwordResetCode', { code }, { utilisateur: true });
    if (!resetCode) {
      return { valid: false, message: 'Code invalide.' };
    }
    if (resetCode.used) {
      return { valid: false, message: 'Ce code a déjà été utilisé.' };
    }
    if (resetCode.expiresAt < new Date()) {
      return { valid: false, message: 'Ce code a expiré.' };
    }

    return { valid: true, userId: resetCode.utilisateurId };
  }, 'Erreur lors de la validation du code');
}

/**
 * Réinitialise le mot de passe à l'aide d'un code OTP valide.
 * @param {Object} params
 * @param {string} params.code - Code OTP
 * @param {string} params.newPassword - Nouveau mot de passe
 * @returns {Promise<Object>} { success, message }
 */
export async function resetPassword({ code, newPassword }) {
  return executePrismaOperation(async () => {
    if (!code || !newPassword) throw new Error('Code et nouveau mot de passe requis.');

    // 1. Valider le code
    const validation = await validateResetCode({ code });
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    // 2. Récupérer le token et l'utilisateur
    const resetCode = await findUnique('passwordResetCode', { code });
    const user = await findUnique('utilisateur', { id: resetCode.utilisateurId });

    // 3. Hacher le nouveau mot de passe
    const newHash = hashPassword(newPassword);

    // 4. Mettre à jour l'utilisateur
    await update('utilisateur', { id: user.id }, { passwordHash: newHash });

    // 5. Marquer le code comme utilisé
    await update('passwordResetCode', { id: resetCode.id }, { used: true });

    // 6. Désactiver toutes les sessions actives de l'utilisateur
    await prisma.session.updateMany({
      where: { utilisateurId: user.id, actif: true },
      data: { actif: false },
    });

    // 7. Logger l'action
    await logAudit(
      user.id,
      'PASSWORD_RESET',
      'Utilisateur',
      user.id,
      'Réinitialisation du mot de passe via code OTP',
      null
    );

    return { success: true, message: 'Mot de passe réinitialisé avec succès.' };
  }, 'Erreur lors de la réinitialisation du mot de passe');
}

/**
 * Récupère tous les codes de réinitialisation générés (pour admin, avec filtres optionnels)
 * @param {Object} params
 * @param {number} [page=1]
 * @param {number} [limit=20]
 * @param {boolean} [onlyActive=false] - codes non utilisés et non expirés
 * @returns {Promise<Object>} Liste paginée
 */
export async function getAllResetCodes({ userId, page = 1, limit = 20, onlyActive = false }) {
  return executePrismaOperation(async () => {
    const requester = await findUnique('utilisateur', { id: userId });
    if (!requester || (requester.niveau !== 'SUPER_ADMIN' && requester.niveau !== 'ADMIN')) {
      throw new Error('Permissions insuffisantes.');
    }

    const skip = (page - 1) * limit;
    const where = {};
    if (onlyActive) {
      where.used = false;
      where.expiresAt = { gt: new Date() };
    }

    const [codes, total] = await Promise.all([
      findMany(
        'passwordResetCode',
        where,
        { utilisateur: true },
        { createdAt: 'desc' },
        skip,
        limit
      ),
      count('passwordResetCode', where),
    ]);

    return {
      codes: codes.map((c) => ({
        id: c.id,
        code: c.code,
        utilisateur: {
          id: c.utilisateur.id,
          email: c.utilisateur.email,
          nom: c.utilisateur.nom,
          prenom: c.utilisateur.prenom,
        },
        expiresAt: c.expiresAt,
        used: c.used,
        createdAt: c.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }, 'Erreur lors de la récupération des codes');
}
