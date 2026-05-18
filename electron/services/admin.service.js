// /home/stive-junior/Auto-ecole-COS/electron/services/admin.service.js

/**
 * @fileoverview Service d'administration – logs d'audit et configuration entreprise.
 *
 * @module adminService
 * @description
 * Fournit toutes les opérations de consultation des logs d'audit avec filtres,
 * statistiques et tendances, ainsi que la gestion de la configuration de l'entreprise.
 * Toutes les fonctions utilisent le wrapper `executePrismaOperation` pour une
 * gestion homogène des erreurs.
 *
 * @author Stive Junior
 * @version 2.0.0
 *
 * @see {@link prisma.client.js} – Utilitaires génériques Prisma
 */

import {
  prisma,
  executePrismaOperation,
  findMany,
  count,
  findUnique,
  update,
} from './prisma.client.js';

// ===============================
// CONSTANTES & UTILITAIRES INTERNES
// ===============================

/**
 * Convertit une date au format ISO string ou Date en objet Date.
 * @param {Date|string|null} date - Date à convertir
 * @returns {Date|null}
 * @internal
 */
function toDate(date) {
  if (!date) return null;
  return date instanceof Date ? date : new Date(date);
}

/**
 * Construit l'objet `where` pour la liste des logs d'audit avec filtres.
 * @param {AuditLogsListParams} params - Paramètres de filtrage
 * @param {number} [params.utilisateurId] - Filtrer par ID utilisateur
 * @param {string} [params.action] - Filtrer par action (recherche partielle insensible)
 * @param {string} [params.ressource] - Filtrer par ressource (recherche partielle insensible)
 * @param {'SUCCESS'|'FAILED'} [params.statut] - Filtrer par statut
 * @param {Date|string} [params.dateDebut] - Date de début (inclus)
 * @param {Date|string} [params.dateFin] - Date de fin (inclus)
 * @param {'today'|'week'|'month'|'all'} [params.period] - Période prédéfinie
 * @param {string} [params.search] - Recherche textuelle (action, ressource, description)
 * @returns {Object} Condition Prisma `where`
 * @internal
 */
function buildAuditLogWhereClause({
  utilisateurId,
  action,
  ressource,
  statut,
  dateDebut,
  dateFin,
  period,
  search,
}) {
  const where = {};

  // Filtre exact sur l'utilisateur
  if (utilisateurId && !isNaN(utilisateurId)) {
    where.utilisateurId = Number(utilisateurId);
  }

  // Filtre partiel sur l'action (insensible)
  if (action && action.trim().length > 0) {
    where.action = { contains: action.trim(), mode: 'insensitive' };
  }

  // Filtre partiel sur la ressource
  if (ressource && ressource.trim().length > 0) {
    where.ressource = { contains: ressource.trim(), mode: 'insensitive' };
  }

  // Filtre exact sur le statut
  if (statut) {
    where.statut = statut;
  }

  // Recherche textuelle sur action, ressource et description
  if (search && search.trim().length > 0) {
    const term = search.trim();
    where.OR = [
      { action: { contains: term, mode: 'insensitive' } },
      { ressource: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
    ];
  }

  // Gestion des dates / période
  if (period && period !== 'all') {
    const now = new Date();
    let startDate;

    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - diff);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = null;
    }
    if (startDate) {
      where.createdAt = { gte: startDate };
    }
  } else if (dateDebut || dateFin) {
    where.createdAt = {};
    if (dateDebut) where.createdAt.gte = toDate(dateDebut);
    if (dateFin) where.createdAt.lte = toDate(dateFin);
  }

  return where;
}

// ===============================
// FONCTIONS PRINCIPALES (exportées)
// ===============================
/**
 * Récupère les logs d'audit avec filtres optionnels.
 * Si `page` et `limit` sont fournis, la réponse est paginée.
 * Sinon, retourne tous les logs correspondant aux filtres (triés par date décroissante).
 * La vérification des droits admin est effectuée si `userId` est fourni.
 *
 * @param {Object} [params] - Paramètres de la requête
 * @param {number} [params.userId] - ID de l'utilisateur qui consulte (optionnel). Si fourni, vérifie les droits admin.
 * @param {number} [params.page] - Numéro de page (optionnel, pour pagination)
 * @param {number} [params.limit] - Nombre d'éléments par page (optionnel, max 200)
 * @param {number} [params.utilisateurId] - Filtrer par ID utilisateur (log.utilisateurId)
 * @param {string} [params.action] - Filtrer par action (recherche partielle insensible à la casse)
 * @param {string} [params.ressource] - Filtrer par ressource (recherche partielle)
 * @param {'SUCCESS'|'FAILED'} [params.statut] - Filtrer par statut
 * @param {Date|string} [params.dateDebut] - Date de début (inclus)
 * @param {Date|string} [params.dateFin] - Date de fin (inclus)
 * @param {'today'|'week'|'month'|'all'} [params.period] - Période prédéfinie (remplace dateDebut/dateFin)
 * @param {string} [params.search] - Recherche textuelle (action, ressource, description)
 * @returns {Promise<Object|AuditLog[]>} Si paginé : { logs, total, page, limit, totalPages }
 *                                          Sinon : tableau direct de logs.
 * @throws {Error} Si l'utilisateur n'a pas les droits admin (SUPER_ADMIN ou ADMIN)
 */
export async function getAuditLogs(params = {}) {
  const { userId, page, limit, ...filters } = params;

  // Vérification des droits si userId est fourni
  if (userId !== undefined) {
    await checkAdminPermission(userId);
  }

  const where = buildAuditLogWhereClause(filters);

  // Cas paginé : page ET limit sont fournis
  if (page !== undefined && limit !== undefined) {
    const skip = (Math.max(1, page) - 1) * Math.max(1, limit);
    const take = Math.min(Math.max(1, limit), 200);

    return executePrismaOperation(async () => {
      const [logs, total] = await Promise.all([
        findMany(
          'auditLog',
          where,
          {
            utilisateur: {
              select: {
                id: true,
                email: true,
                nom: true,
                prenom: true,
              },
            },
          },
          { createdAt: 'desc' },
          skip,
          take
        ),
        count('auditLog', where),
      ]);

      return {
        logs,
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take),
      };
    }, 'Erreur lors de la récupération paginée des logs d’audit');
  }

  // Pas de pagination : retourner tous les logs (triés par date décroissante)
  return executePrismaOperation(async () => {
    const logs = await findMany(
      'auditLog',
      where,
      {
        utilisateur: {
          select: {
            id: true,
            email: true,
            nom: true,
            prenom: true,
          },
        },
      },
      { createdAt: 'desc' }
    );
    return logs;
  }, 'Erreur lors de la récupération des logs d’audit');
}

/**
 * Vérifie si un utilisateur a les droits admin (SUPER_ADMIN ou ADMIN).
 * @param {number} userId - ID de l'utilisateur à vérifier
 * @returns {Promise<void>}
 * @throws {Error} Si l'utilisateur n'existe pas ou n'a pas les droits
 * @internal
 */
async function checkAdminPermission(userId) {
  const requester = await findUnique('utilisateur', { id: userId });
  if (!requester || (requester.niveau !== 'SUPER_ADMIN' && requester.niveau !== 'ADMIN')) {
    throw new Error(
      'Permissions insuffisantes. Seul un administrateur peut consulter les logs d’audit.'
    );
  }
}

/**
 * Récupère les statistiques agrégées des logs d'audit.
 * @returns {Promise<AdminStats>} Métriques étendues
 * @property {number} totalUtilisateurs - Nombre total d'utilisateurs actifs
 * @property {number} totalAdmins - Nombre d'ADMIN
 * @property {number} totalSecretaires - Nombre de SECRETAIRE
 * @property {number} totalMoniteurs - Nombre de MONITEUR
 * @property {number} totalSessionsActives - Nombre de sessions actives
 * @property {number} logsErreur7j - Logs en échec des 7 derniers jours
 * @property {number} logsTotal - Nombre total de logs
 * @property {number} logsSuccess - Nombre de logs SUCCESS
 * @property {number} logsFailed - Nombre de logs FAILED
 */
export async function getAdminStats() {
  return executePrismaOperation(async () => {
    const [totalUtilisateurs, totalAdmins, totalSecretaires, totalMoniteurs, totalSessionsActives] =
      await Promise.all([
        count('utilisateur', { actif: true }),
        count('utilisateur', { actif: true, role: 'ADMIN' }),
        count('utilisateur', { actif: true, role: 'SECRETAIRE' }),
        count('utilisateur', { actif: true, role: 'MONITEUR' }),
        count('session', { actif: true }),
      ]);

    const [logsTotal, logsSuccess, logsFailed, logsErreur7j] = await Promise.all([
      count('auditLog'),
      count('auditLog', { statut: 'SUCCESS' }),
      count('auditLog', { statut: 'FAILED' }),
      count('auditLog', {
        statut: 'FAILED',
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
    ]);

    return {
      totalUtilisateurs,
      totalAdmins,
      totalSecretaires,
      totalMoniteurs,
      totalSessionsActives,
      logsErreur7j,
      logsTotal,
      logsSuccess,
      logsFailed,
    };
  }, 'Erreur lors du calcul des statistiques des logs d’audit');
}

/**
 * Récupère les tendances évolutives des logs d'audit (mois en cours vs mois précédent).
 * @returns {Promise<AdminTrends>} Variations en pourcentage
 */
export async function getAdminTrends() {
  return executePrismaOperation(async () => {
    const now = new Date();
    const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endLastMonth = startThisMonth;

    // Helper pour compter les utilisateurs actifs créés dans une période
    const countUsersInPeriod = async (start, end) => {
      const where = { actif: true, createdAt: { gte: start, lt: end } };
      const total = await count('utilisateur', where);
      const admins = await count('utilisateur', { ...where, role: 'ADMIN' });
      const secretaires = await count('utilisateur', { ...where, role: 'SECRETAIRE' });
      const moniteurs = await count('utilisateur', { ...where, role: 'MONITEUR' });
      return { total, admins, secretaires, moniteurs };
    };

    // Helper pour compter les logs d'audit dans une période
    const countLogsInPeriod = async (start, end, statut = null) => {
      const where = { createdAt: { gte: start, lt: end } };
      if (statut) where.statut = statut;
      return count('auditLog', where);
    };

    const [currentUsers, prevUsers, currentSessions, prevSessions] = await Promise.all([
      countUsersInPeriod(startThisMonth, now),
      countUsersInPeriod(startLastMonth, endLastMonth),
      count('session', { actif: true, createdAt: { gte: startThisMonth, lt: now } }),
      count('session', { actif: true, createdAt: { gte: startLastMonth, lt: endLastMonth } }),
    ]);

    // Logs totaux, succès, échecs
    const currentLogsTotal = await countLogsInPeriod(startThisMonth, now);
    const prevLogsTotal = await countLogsInPeriod(startLastMonth, endLastMonth);
    const currentLogsSuccess = await countLogsInPeriod(startThisMonth, now, 'SUCCESS');
    const prevLogsSuccess = await countLogsInPeriod(startLastMonth, endLastMonth, 'SUCCESS');
    const currentLogsFailed = await countLogsInPeriod(startThisMonth, now, 'FAILED');
    const prevLogsFailed = await countLogsInPeriod(startLastMonth, endLastMonth, 'FAILED');

    // Logs d'erreur 7 derniers jours (comparaison avec la période précédente de 7 jours)
    const now7 = new Date();
    const startCurrent7 = new Date(now7);
    startCurrent7.setDate(now7.getDate() - 7);
    const startPrev7 = new Date(startCurrent7);
    startPrev7.setDate(startCurrent7.getDate() - 7);
    const endPrev7 = startCurrent7;

    const currentErrors7 = await count('auditLog', {
      statut: 'FAILED',
      createdAt: { gte: startCurrent7, lt: now7 },
    });
    const prevErrors7 = await count('auditLog', {
      statut: 'FAILED',
      createdAt: { gte: startPrev7, lt: endPrev7 },
    });

    const calcVar = (curr, prev) => {
      if (prev === 0) return curr === 0 ? 0 : 100;
      return parseFloat((((curr - prev) / prev) * 100).toFixed(1));
    };

    return {
      totalUtilisateurs: calcVar(currentUsers.total, prevUsers.total),
      totalAdmins: calcVar(currentUsers.admins, prevUsers.admins),
      totalSecretaires: calcVar(currentUsers.secretaires, prevUsers.secretaires),
      totalMoniteurs: calcVar(currentUsers.moniteurs, prevUsers.moniteurs),
      totalSessionsActives: calcVar(currentSessions, prevSessions),
      logsTotal: calcVar(currentLogsTotal, prevLogsTotal),
      logsSuccess: calcVar(currentLogsSuccess, prevLogsSuccess),
      logsFailed: calcVar(currentLogsFailed, prevLogsFailed),
      logsErreur7j: calcVar(currentErrors7, prevErrors7),
    };
  }, 'Erreur lors du calcul des tendances des logs d’audit');
}

// ===============================
// CONFIGURATION DE L'ENTREPRISE
// ===============================

/**
 * Récupère la configuration actuelle de l'entreprise.
 * @returns {Promise<CompanyConfig>} Configuration complète
 * @throws {Error} Si la configuration n'existe pas (devrait être créée à l'initialisation)
 */
export async function getCompanyConfig() {
  return executePrismaOperation(async () => {
    let config = await findUnique('companyConfig', { id: 1 });
    if (!config) {
      config = await prisma.companyConfig.create({
        data: {
          id: 1,
          nom: 'Auto-École COS',
          adresse: null,
          telephone: null,
          email: null,
          siteWeb: null,
          numeroFiscal: null,
          logoPath: null,
        },
      });
    }
    return config;
  }, 'Erreur lors de la récupération de la configuration');
}

/**
 * Met à jour la configuration de l'entreprise (patch partiel).
 * @param {UpdateCompanyConfigInput} data - Champs à modifier (tous optionnels)
 * @param {string} [data.nom] - Nom officiel
 * @param {string|null} [data.adresse] - Adresse
 * @param {string|null} [data.telephone] - Téléphone
 * @param {string|null} [data.email] - Email
 * @param {string|null} [data.siteWeb] - Site web
 * @param {string|null} [data.numeroFiscal] - Numéro fiscal
 * @param {string|null} [data.logoPath] - Chemin du logo
 * @returns {Promise<CompanyConfig>} Configuration mise à jour
 */
export async function updateCompanyConfig(data) {
  if (!data || Object.keys(data).length === 0) {
    throw new Error('Au moins un champ doit être fourni pour la mise à jour.');
  }

  return executePrismaOperation(async () => {
    const existing = await findUnique('companyConfig', { id: 1 });
    if (!existing) {
      await prisma.companyConfig.create({
        data: {
          id: 1,
          nom: 'Auto-École COS',
        },
      });
    }

    const updateData = {};
    const allowedFields = [
      'nom',
      'adresse',
      'telephone',
      'email',
      'siteWeb',
      'numeroFiscal',
      'logoPath',
    ];
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field] === null ? null : String(data[field]).trim();
      }
    }
    updateData.updatedAt = new Date();

    const updated = await update('companyConfig', { id: 1 }, updateData);
    return updated;
  }, 'Erreur lors de la mise à jour de la configuration');
}
