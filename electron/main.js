// main.js
/**
 * @module main
 * @description Point d'entrée principal de l'application Electron.
 * Gère la fenêtre principale, les handlers IPC, l'initialisation de Prisma et l'authentification.
 * @author Stive Junior
 * @version 1.0.0
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { getPrismaClient, disconnectPrisma, initializePrisma } from './services/prisma.client.js';
import { createSecureIpc, assertSelfOrAdmin, isAdminLevel } from './ipc/security.js';
const { app, BrowserWindow, dialog, ipcMain, protocol, shell } = globalThis.__ELECTRON_MAIN__ ?? {};

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
} from './services/auth.service.js';

import {
  createCandidat,
  getAll as getAllCandidats,
  getById as getCandidatById,
  updateCandidat,
  remove as removeCandidat,
  search as searchCandidats,
  updateStatus as updateCandidatStatus,
  getStats as getCandidatsStats,
  getTrends as getCandidatsTrends,
  getPaiements as getCandidatPaiements,
  getLecons as getCandidatLecons,
  getExamens as getCandidatExamens,
  getFactures as getCandidatFactures,
  getDocuments as getCandidatDocuments,
  addDocument as addCandidatDocument,
  deleteDocument as deleteCandidatDocument,
} from './services/candidat.service.js';

import {
  getAllDocuments,
  getDocumentById,
  getDocumentsStats,
  getDocumentsTrends,
  getDocumentsSparklines,
  deleteDocument,
  downloadDocument,
  openDocument,
  uploadDocument,
} from './services/documents.service.js';

import {
  getAllFormations,
  getFormationById,
  createFormation,
  updateFormation,
  deleteFormation,
  getFormationsStats,
  getFormationsTrends,
  getFormationsSparklines,
  getMonthlyInscriptions,
  getCandidatsByFormation,
  getPopularityStats,
  getNbInscriptions,
} from './services/formation.service.js';

import {
  getAllPaiements,
  getPaiementById,
  createPaiement,
  updatePaiement,
  deletePaiement,
  getPaiementsStats,
  getPaiementsTrends,
  getPaiementsSparklines,
  getPaiementsByCandidat,
  getSoldeCandidat,
  getResumeMensuel,
  printReceipt,
  exportPaiementsReport,
} from './services/paiement.service.js';

import {
  getAllDepenses,
  getDepenseById,
  createDepense,
  updateDepense,
  deleteDepense,
  getDepensesStats,
  getDepensesTrends,
  getDepensesSparklines,
  getDepensesByVehicule,
  attachReceiptToDepense,
  getDepensesTrendChartData,
} from './services/depense.service.js';

import {
  getAllMouvements,
  getCaisseStats,
  getCaisseTrends,
  getCaisseSparklines,
  exportCaisseMouvementsFile,
} from './services/caisse.service.js';

import {
  getAllFactures,
  getFactureById,
  createFacture,
  updateFacture,
  deleteFacture,
  getFacturesStats,
  getFacturesTrends,
  getFacturesSparklines,
  getPaiementsByFacture,
  getFacturesByCandidat,
  sendFactureByEmail,
} from './services/facture.service.js';
import { generateFacturePDFDesktop } from './services/facture.pdf.service.js';

import {
  createVehicule,
  getAllVehicules,
  removeVehicule,
  updateVehicule,
  getVehiculeById,
  getVehiculesStats,
  getVehiculesTrends,
  getVehiculesSparklines,
  getEntretiensByVehicule,
  createEntretien,
  updateEntretien,
  deleteEntretien,
  updateVehiculeKilometrage,
  isImmatriculationUnique,
} from './services/vehicule.service.js';

import {
  getAllLecons,
  getLeconById,
  createLecon,
  updateLecon,
  deleteLecon,
  getLeconsStats,
  getLeconsTrends,
  getLeconsSparklines,
  getLeconsByCandidat,
  getLeconsByMoniteur,
  getLeconsByVehicule,
  getLeconsBetweenDates,
} from './services/planning.service.js';

// =============================
// MONITEURS
// =============================
import {
  getAllMoniteurs,
  getMoniteurById,
  createMoniteur,
  updateMoniteur,
  deleteMoniteur,
  getMoniteursStats,
  getMoniteursTrends,
  getMoniteursSparklines,
} from './services/moniteur.service.js';

import {
  getAllExamens,
  getExamenById,
  createExamen,
  updateExamen,
  deleteExamen,
  getExamensStats,
  getExamensTrends,
  getExamensSparklines,
  getExamensByCandidat,
  printCertificate,
  exportExamensReport,
} from './services/examen.service.js';

import {
  getAuditLogs,
  getAdminStats,
  getAdminTrends,
  getCompanyConfig,
  updateCompanyConfig,
} from './services/admin.service.js';

import { globalSearch } from './services/globalSearch.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const preloadPath = path.join(__dirname, 'preload.cjs');
const isDev = !app.isPackaged;
let assetProtocolIntercepted = false;

function getStartupLogPath() {
  try {
    const baseDir = app?.isPackaged
      ? app.getPath('userData')
      : path.join(process.cwd(), '.codex-run');
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
    return path.join(baseDir, 'electron-startup.log');
  } catch {
    return path.join(os.tmpdir(), 'autoecole-cos-startup.log');
  }
}

function serializeError(error) {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}\n${error.stack ?? ''}`;
  }
  return String(error);
}

function logStartup(message, error = null) {
  const timestamp = new Date().toISOString();
  const content = [`[${timestamp}] ${message}`];
  if (error) {
    content.push(serializeError(error));
  }
  const line = `${content.join('\n')}\n`;

  console.log(line.trim());

  try {
    fs.appendFileSync(getStartupLogPath(), line, 'utf8');
  } catch (writeError) {
    console.error('Impossible d ecrire le journal de demarrage', writeError);
  }
}

function showStartupError(error) {
  const details = serializeError(error);
  const logPath = getStartupLogPath();

  logStartup('Echec de demarrage detecte', error);

  try {
    dialog.showErrorBox(
      'Auto-Ecole COS - Erreur au demarrage',
      `L application n a pas pu demarrer.\n\n${details}\n\nJournal: ${logPath}`
    );
  } catch (dialogError) {
    console.error('Impossible d afficher la boite d erreur', dialogError);
  }
}

function normalizeFileProtocolPath(pathname) {
  const decoded = decodeURIComponent(pathname);
  if (process.platform === 'win32' && decoded.startsWith('/')) {
    return decoded.slice(1);
  }
  return decoded;
}

function registerFileAssetInterceptor() {
  if (isDev || assetProtocolIntercepted) return;

  const distRoot = path.resolve(path.join(__dirname, '../dist'));
  const rootAssetPrefixes = ['/assets/', '/icons/', '/images/', '/favicon.svg'];

  protocol.interceptFileProtocol('file', (request, callback) => {
    try {
      const url = new URL(request.url);
      const requestedPath = decodeURIComponent(url.pathname || '');
      const shouldResolveFromDist = rootAssetPrefixes.some((prefix) =>
        requestedPath.startsWith(prefix)
      );

      if (shouldResolveFromDist) {
        const relativeAssetPath = requestedPath.replace(/^\/+/, '');
        const redirectedPath = path.join(distRoot, relativeAssetPath);
        callback({ path: redirectedPath });
        return;
      }

      callback({ path: normalizeFileProtocolPath(url.pathname) });
    } catch (error) {
      logStartup('Interception fichier echouee', error);
      callback({ error: -6 });
    }
  });

  assetProtocolIntercepted = true;
  logStartup(`Interception des assets racine activee vers ${distRoot}`);
}

async function printPdfFile(filePath, title = 'Document') {
  if (!filePath) {
    throw new Error('Chemin de fichier PDF manquant.');
  }
  if (!fs.existsSync(filePath)) {
    throw new Error(`Fichier PDF introuvable : ${filePath}`);
  }

  const printWindow = new BrowserWindow({
    show: false,
    title,
    autoHideMenuBar: true,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const cleanup = () => {
    if (!printWindow.isDestroyed()) {
      printWindow.close();
    }
  };

  return new Promise((resolve, reject) => {
    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const fail = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    printWindow.webContents.once('did-fail-load', (_event, errorCode, errorDescription) => {
      fail(new Error(`Impossible de charger le PDF (${errorCode}): ${errorDescription}`));
      cleanup();
    });

    printWindow.webContents.once('did-finish-load', () => {
      setTimeout(() => {
        printWindow.webContents.print(
          {
            silent: false,
            printBackground: true,
          },
          (success, failureReason) => {
            if (!success) {
              if (failureReason && /cancel/i.test(failureReason)) {
                finish({
                  success: false,
                  cancelled: true,
                  message: "Impression annulée par l'utilisateur.",
                  path: filePath,
                });
              } else {
                fail(new Error(failureReason || "L'impression du PDF a échoué."));
              }
            } else {
              finish({ success: true, path: filePath });
            }
            cleanup();
          }
        );
      }, 500);
    });

    const pdfUrl = pathToFileURL(filePath);
    printWindow.loadURL(pdfUrl.toString()).catch((error) => {
      fail(error);
      cleanup();
    });
  });
}

if (isDev) {
  const localUserDataPath = path.join(os.tmpdir(), 'autoecole-cos-dev-user-data');
  app.setPath('userData', localUserDataPath);
}


/**
 * Crée et retourne la fenêtre principale de l'application.
 * @returns {BrowserWindow} La fenêtre créée.
 */
function createWindow() {
  logStartup('Creation de la fenetre principale');

  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: '#f4efe7',
    show: false,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  // Aucune nouvelle fenêtre : les liens http(s) s'ouvrent dans le navigateur système.
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url) && !isTrustedUrl(url)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // La fenêtre principale ne doit jamais quitter l'application.
  window.webContents.on('will-navigate', (event, url) => {
    if (!isTrustedUrl(url)) {
      event.preventDefault();
      if (/^https?:\/\//i.test(url)) {
        shell.openExternal(url);
      }
    }
  });

  
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    logStartup(`Chargement URL dev ${process.env.VITE_DEV_SERVER_URL}`);
    window.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    const htmlPath = path.join(__dirname, '../dist/index.html');
    logStartup(`Chargement HTML prod ${htmlPath}`);
    window.loadFile(htmlPath);
  }

  window.webContents.on('did-finish-load', () => {
    logStartup('Fenetre chargee, affichage');
    window.show();
  });

  window.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    logStartup(`Chargement echoue: ${errorDescription} (${errorCode})`);
  });

  window.webContents.on('crashed', () => {
    logStartup('Renderer process crashed');
  });

  return window;
}

/**
 * Récupère les informations client (IP et User-Agent) depuis l'événement IPC.
 * Dans une application de bureau, l'adresse IP est fixée à 127.0.0.1.
 * @param {Electron.IpcMainEvent} event - L'événement IPC.
 * @returns {{ ip: string, userAgent: string }} Les informations client.
 */
function getClientInfo(event) {
  return {
    ip: '127.0.0.1',
    userAgent: event.sender.getUserAgent(),
  };
}

/**
 * Indique si une URL appartient à l'application (serveur Vite en dev, fichiers locaux en prod).
 * @param {string} url
 * @returns {boolean}
 */
function isTrustedUrl(url) {
  if (typeof url !== 'string' || url.length === 0) return false;
  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (isDev && devServerUrl && url.startsWith(devServerUrl.replace(/\/+$/, ''))) {
    return true;
  }
  return url.startsWith('file://');
}

async function getExportService() {
  return import('./services/exportService.js');
}

async function getRecuService() {
  return import('./services/recuService.js');
}

function createExportTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

/**
 * Enregistre tous les handlers IPC pour la communication entre le renderer et le main.
 */
function registerIpcHandlers() {
  const { handle } = createSecureIpc({
    ipcMain,
    validateToken,
    isTrustedUrl,
    log: logStartup,
  });

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

  // =============================
  // CANDIDATS
  // =============================

  handle('candidats:getAll', async (event, params) => {
    return getAllCandidats(params);
  });

  handle('candidats:getById', async (event, id) => {
    return getCandidatById(id);
  });

  handle('candidats:create', async (event, data) => {
    return createCandidat(data);
  });

  handle('candidats:update', async (event, { id, data }) => {
    return updateCandidat(id, data);
  });

  handle('candidats:delete', async (event, id) => {
    return removeCandidat(id);
  });

  handle('candidats:search', async (event, query) => {
    return searchCandidats(query);
  });

  handle('candidats:updateStatus', async (event, params) => {
    return updateCandidatStatus(params);
  });

  handle('candidats:getStats', async () => {
    return getCandidatsStats();
  });

  handle('candidats:getTrends', async () => {
    return await getCandidatsTrends();
  });

  handle('candidats:getPaiements', async (event, candidatId) => {
    return getCandidatPaiements(candidatId);
  });

  handle('candidats:getLecons', async (event, candidatId) => {
    return getCandidatLecons(candidatId);
  });

  handle('candidats:getExamens', async (event, candidatId) => {
    return getCandidatExamens(candidatId);
  });

  handle('candidats:getFactures', async (event, candidatId) => {
    return getCandidatFactures(candidatId);
  });

  handle('candidats:getDocuments', async (event, candidatId) => {
    return getCandidatDocuments(candidatId);
  });

  handle('candidats:addDocument', async (event, data) => {
    return addCandidatDocument(data);
  });

  handle('candidats:deleteDocument', async (event, docId) => {
    return deleteCandidatDocument(docId);
  });

  // =============================
  // DOCUMENTS
  // =============================

  handle('documents:upload', async (event, payload) => {
    return uploadDocument(payload);
  });
  handle('documents:getAll', async (event, params) => {
    return getAllDocuments(params);
  });

  handle('documents:getById', async (event, id) => {
    return getDocumentById(id);
  });

  handle('documents:getStats', async () => {
    return getDocumentsStats();
  });

  handle('documents:getTrends', async () => {
    return getDocumentsTrends();
  });

  handle('documents:getSparklines', async () => {
    return getDocumentsSparklines();
  });

  handle('documents:delete', async (event, id) => {
    return deleteDocument(id);
  });

  handle('documents:download', async (event, id) => {
    return downloadDocument(id);
  });

  handle('documents:open', async (event, { chemin }) => {
    return openDocument(chemin);
  });

  handle('documents:print', async (_event, { chemin, title }) => {
    return printPdfFile(chemin, title);
  });

  // =============================
  // FORMATIONS
  // =============================

  handle('formations:getAll', async (event, params) => {
    return getAllFormations(params);
  });

  handle('formations:getById', async (event, id) => {
    return getFormationById(id);
  });

  handle('formations:create', async (event, data) => {
    return createFormation(data);
  });

  handle('formations:update', async (event, { id, data }) => {
    return updateFormation(id, data);
  });

  handle('formations:delete', async (event, id) => {
    return deleteFormation(id);
  });

  handle('formations:getStats', async () => {
    return getFormationsStats();
  });

  handle('formations:getTrends', async () => {
    return getFormationsTrends();
  });

  handle('formations:getSparklines', async () => {
    return getFormationsSparklines();
  });

  handle('formations:getMonthlyInscriptions', async (event, formationId) => {
    return getMonthlyInscriptions(formationId);
  });

  handle('formations:getCandidatsByFormation', async (event, formationId) => {
    return getCandidatsByFormation(formationId);
  });

  handle('formations:getPopularityStats', async () => {
    return getPopularityStats();
  });

  handle('formations:getNbInscriptions', async (event, formationId) => {
    return getNbInscriptions(formationId);
  });

  // =============================
  // PAIEMENTS
  // =============================

  /**
   * Récupère la liste paginée des paiements avec filtres optionnels.
   * @param {Object} event - Objet IPC
   * @param {PaiementsListParams} params - Paramètres de pagination/filtres
   */
  handle('paiements:getAll', async (event, params) => {
    return getAllPaiements(params);
  });

  /**
   * Récupère un paiement par son identifiant (avec candidat et facture).
   * @param {Object} event
   * @param {number} id - Identifiant du paiement
   */
  handle('paiements:getById', async (event, id) => {
    return getPaiementById(id);
  });

  /**
   * Crée un nouveau paiement, met à jour la caisse et la facture associée.
   * @param {Object} event
   * @param {CreatePaiementInput} data - Données du paiement
   */
  handle('paiements:create', async (event, data) => {
    return createPaiement(data);
  });

  /**
   * Met à jour les champs non‑financiers d’un paiement (référence, note, factureId).
   * @param {Object} event
   * @param {number} id - Identifiant du paiement
   * @param {UpdatePaiementInput} data - Champs à modifier
   */
  handle('paiements:update', async (event, { id, data }) => {
    return updatePaiement(id, data);
  });

  /**
   * Supprime définitivement un paiement et annule l’entrée en caisse.
   * @param {Object} event
   * @param {number} id - Identifiant du paiement
   */
  handle('paiements:delete', async (event, id) => {
    return deletePaiement(id);
  });

  /**
   * Récupère les statistiques complètes des paiements (dashboard).
   * @param {Object} event
   */
  handle('paiements:getStats', async () => {
    return getPaiementsStats();
  });

  /**
   * Récupère les tendances évolutives des paiements (mois courant vs précédent).
   * @param {Object} event
   */
  handle('paiements:getTrends', async () => {
    return getPaiementsTrends();
  });

  /**
   * Récupère les sparklines des paiements pour les 12 derniers mois.
   * @param {Object} event
   */
  handle('paiements:getSparklines', async () => {
    return getPaiementsSparklines();
  });

  /**
   * Récupère tous les paiements d’un candidat spécifique.
   * @param {Object} event
   * @param {number} candidatId
   */
  handle('paiements:getByCandidat', async (event, candidatId) => {
    return getPaiementsByCandidat(candidatId);
  });

  /**
   * Calcule le solde d’un candidat (total facturé - total payé).
   * @param {Object} event
   * @param {number} candidatId
   */
  handle('paiements:getSoldeCandidat', async (event, candidatId) => {
    return getSoldeCandidat(candidatId);
  });

  /**
   * Récupère le résumé mensuel des paiements pour une année et un mois donnés.
   * @param {Object} event
   * @param {number} annee
   * @param {number} mois
   */
  handle('paiements:getResumeMensuel', async (event, annee, mois) => {
    return getResumeMensuel(annee, mois);
  });

  /**
   * Génère le reçu d’un paiement (export PDF – stub pour l’instant).
   * @param {Object} event
   * @param {number} id
   */
  handle('paiements:printReceipt', async (event, id) => {
    return printReceipt(id);
  });

  // =============================
  // DEPENSES
  // =============================

  /**
   * Récupère la liste paginée des dépenses avec filtres optionnels.
   * @param {Object} event - Objet IPC
   * @param {DepensesListParams} params - Paramètres de pagination/filtres
   */
  handle('depenses:getAll', async (event, params) => {
    return getAllDepenses(params);
  });

  /**
   * Récupère une dépense par son identifiant.
   * @param {Object} event
   * @param {number} id - Identifiant de la dépense
   */
  handle('depenses:getById', async (event, id) => {
    return getDepenseById(id);
  });

  /**
   * Crée une nouvelle dépense, enregistre la sortie en caisse et retourne la dépense créée.
   * @param {Object} event
   * @param {CreateDepenseInput} data - Données de la dépense
   */
  handle('depenses:create', async (event, data) => {
    return createDepense(data);
  });

  /**
   * Met à jour les champs modifiables d’une dépense (catégorie, montant, description, fournisseur, référence, véhicule, date).
   * Ne modifie pas les champs liés à la transaction de caisse (montant, date) pour éviter les incohérences.
   * @param {Object} event
   * @param {number} id - Identifiant de la dépense
   * @param {UpdateDepenseInput} data - Champs à modifier
   */
  handle('depenses:update', async (event, { id, data }) => {
    return updateDepense(id, data);
  });

  /**
   * Supprime une dépense et annule la sortie correspondante en caisse.
   * @param {Object} event
   * @param {number} id - Identifiant de la dépense
   */
  handle('depenses:delete', async (event, id) => {
    return deleteDepense(id);
  });

  /**
   * Récupère les statistiques agrégées des dépenses (total, moyenne, par catégorie, etc.).
   * @param {Object} event
   */
  handle('depenses:getStats', async () => {
    return getDepensesStats();
  });

  /**
   * Récupère les tendances évolutives des dépenses (mois courant vs précédent, catégories en hausse/baisse, etc.).
   * @param {Object} event
   */
  handle('depenses:getTrends', async () => {
    return getDepensesTrends();
  });

  /**
   * Récupère les données des tendances évolutives des dépenses pour les graphiques (évolution mensuelle, répartition par catégorie, etc.).
   * @param {Object} event
   */
  handle('depenses:getTrendChartData', async () => {
    return getDepensesTrendChartData();
  });

  /**
   * Récupère les données des sparklines (12 mois) pour les dépenses.
   * @param {Object} event
   */
  handle('depenses:getSparklines', async () => {
    return getDepensesSparklines();
  });

  /**
   * Récupère toutes les dépenses associées à un véhicule spécifique.
   * @param {Object} event
   * @param {number} vehiculeId
   */
  handle('depenses:getByVehicule', async (event, vehiculeId) => {
    return getDepensesByVehicule(vehiculeId);
  });

  /**
   * Attache un justificatif (chemin de fichier) à une dépense existante.
   * @param {Object} event
   * @param {number} id - Identifiant de la dépense
   * @param {string} filePath - Chemin du
   */
  handle('depenses:attachReceipt', async (event, { id, filePath }) => {
    return attachReceiptToDepense(id, filePath);
  });

  // =============================
  // CAISSE (consultation uniquement)
  // =============================

  /**
   * Récupère la liste paginée des mouvements de caisse avec filtres.
   * @param {Object} event
   * @param {CaisseListParams} params
   */
  handle('caisse:getAll', async (event, params) => {
    return getAllMouvements(params);
  });

  /**
   * Récupère les statistiques agrégées de la caisse.
   * @param {Object} event
   */
  handle('caisse:getStats', async () => {
    return getCaisseStats();
  });

  /**
   * Récupère les tendances évolutives (mois vs précédent).
   * @param {Object} event
   */
  handle('caisse:getTrends', async () => {
    return getCaisseTrends();
  });

  /**
   * Récupère les données des sparklines pour les 12 derniers mois.
   * @param {Object} event
   */
  handle('caisse:getSparklines', async () => {
    return getCaisseSparklines();
  });

  /**
   * Exporte l’historique des mouvements.
   * @param {Object} event
   * @param {CaisseListParams} params
   */
  handle('caisse:exportMouvements', async (event, params) => {
    return exportCaisseMouvementsFile(params);
  });

  // =============================
  // FACTURES
  // =============================

  /**
   * Récupère la liste paginée des factures avec filtres.
   * @param {Object} event
   * @param {FacturesListParams} params
   */
  handle('factures:getAll', async (event, params) => {
    return getAllFactures(params);
  });

  /**
   * Récupère une facture par son ID (avec candidat et paiements).
   * @param {Object} event
   * @param {number} id
   */
  handle('factures:getById', async (event, id) => {
    return getFactureById(id);
  });

  /**
   * Crée une nouvelle facture (génère le numéro et le PDF).
   * @param {Object} event
   * @param {CreateFactureInput} data
   */
  handle('factures:create', async (event, data) => {
    return createFacture(data);
  });

  /**
   * Met à jour une facture (statut, échéance, notes).
   * @param {Object} event
   * @param {number} id
   * @param {UpdateFactureInput} data
   */
  handle('factures:update', async (event, { id, data }) => {
    return updateFacture(id, data);
  });

  /**
   * Supprime une facture (si aucun paiement associé).
   * @param {Object} event
   * @param {number} id
   */
  handle('factures:delete', async (event, id) => {
    return deleteFacture(id);
  });

  /**
   * Récupère les statistiques agrégées des factures.
   * @param {Object} event
   */
  handle('factures:getStats', async () => {
    return getFacturesStats();
  });

  /**
   * Récupère les tendances évolutives des factures.
   * @param {Object} event
   */
  handle('factures:getTrends', async () => {
    return getFacturesTrends();
  });

  /**
   * Récupère les données des sparklines (12 mois) pour les factures.
   * @param {Object} event
   */
  handle('factures:getSparklines', async () => {
    return getFacturesSparklines();
  });

  /**
   * Récupère tous les paiements associés à une facture.
   * @param {Object} event
   * @param {number} factureId
   */
  handle('factures:getPaiements', async (event, factureId) => {
    return getPaiementsByFacture(factureId);
  });

  /**
   * Récupère toutes les factures d’un candidat.
   * @param {Object} event
   * @param {number} candidatId
   */
  handle('factures:getByCandidat', async (event, candidatId) => {
    return getFacturesByCandidat(candidatId);
  });

  /**
   * Génère (ou régénère) le PDF d’une facture.
   * @param {Object} event
   * @param {number} id
   */
  handle('factures:generatePDF', async (event, id) => {
    return generateFacturePDFDesktop(id);
  });

  /**
   * Envoie la facture par email au candidat.
   * @param {Object} event
   * @param {number} id
   */
  handle('factures:sendByEmail', async (event, id) => {
    return sendFactureByEmail(id);
  });

  // =============================
  // VEHICULES
  // =============================

  /**
   * Récupère la liste paginée des véhicules avec filtres.
   */
  handle('vehicules:getAll', async (event, params) => {
    return getAllVehicules(params);
  });

  /**
   * Récupère un véhicule par son identifiant avec toutes ses relations.
   */
  handle('vehicules:getById', async (event, id) => {
    return getVehiculeById(id);
  });

  /**
   * Crée un nouveau véhicule.
   */
  handle('vehicules:create', async (event, data) => {
    return createVehicule(data);
  });

  /**
   * Met à jour un véhicule existant (patch partiel).
   */
  handle('vehicules:update', async (event, { id, data }) => {
    return updateVehicule(id, data);
  });

  /**
   * Supprime (désactive) un véhicule.
   */
  handle('vehicules:delete', async (event, id) => {
    return removeVehicule(id);
  });

  /**
   * Récupère les statistiques agrégées des véhicules.
   */
  handle('vehicules:getStats', async () => {
    return getVehiculesStats();
  });

  /**
   * Récupère les tendances évolutives des véhicules.
   */
  handle('vehicules:getTrends', async () => {
    return getVehiculesTrends();
  });

  /**
   * Récupère les données des sparklines pour les 12 derniers mois.
   */
  handle('vehicules:getSparklines', async () => {
    return getVehiculesSparklines();
  });

  /**
   * Récupère tous les entretiens d’un véhicule.
   */
  handle('vehicules:getEntretiensByVehicule', async (event, vehiculeId) => {
    return getEntretiensByVehicule(vehiculeId);
  });

  /**
   * Enregistre un nouvel entretien pour un véhicule.
   */
  handle('vehicules:createEntretien', async (event, data) => {
    return createEntretien(data);
  });

  /**
   * Met à jour un entretien existant.
   */
  handle('vehicules:updateEntretien', async (event, { id, data }) => {
    return updateEntretien(id, data);
  });

  /**
   * Supprime un entretien.
   */
  handle('vehicules:deleteEntretien', async (event, id) => {
    return deleteEntretien(id);
  });

  /**
   * Met à jour le kilométrage d’un véhicule.
   */
  handle('vehicules:updateKilometrage', async (event, data) => {
    return updateVehiculeKilometrage(data);
  });

  /**
   * Vérifie si une immatriculation est unique.
   */
  handle(
    'vehicules:isImmatriculationUnique',
    async (event, { immatriculation, excludeId }) => {
      return isImmatriculationUnique(immatriculation, excludeId);
    }
  );

  // =============================
  // PLANNING (LEÇONS)
  // =============================

  /**
   * Récupère la liste paginée des leçons avec filtres.
   */
  handle('planning:getAll', async (event, params) => {
    return getAllLecons(params);
  });

  /**
   * Récupère une leçon par son identifiant.
   */
  handle('planning:getById', async (event, id) => {
    return getLeconById(id);
  });

  /**
   * Crée une nouvelle leçon.
   */
  handle('planning:create', async (event, data) => {
    return createLecon(data);
  });

  /**
   * Met à jour une leçon existante.
   */
  handle('planning:update', async (event, { id, data }) => {
    return updateLecon(id, data);
  });

  /**
   * Supprime définitivement une leçon.
   */
  handle('planning:delete', async (event, id) => {
    return deleteLecon(id);
  });

  /**
   * Récupère les statistiques agrégées des leçons.
   */
  handle('planning:getStats', async () => {
    return getLeconsStats();
  });

  /**
   * Récupère les tendances évolutives des leçons.
   */
  handle('planning:getTrends', async () => {
    return getLeconsTrends();
  });

  /**
   * Récupère les données des sparklines (12 mois) pour les leçons.
   */
  handle('planning:getSparklines', async () => {
    return getLeconsSparklines();
  });

  /**
   * Récupère toutes les leçons d’un candidat.
   */
  handle('planning:getByCandidat', async (event, candidatId) => {
    return getLeconsByCandidat(candidatId);
  });

  /**
   * Récupère toutes les leçons d’un moniteur.
   */
  handle('planning:getByMoniteur', async (event, moniteurId) => {
    return getLeconsByMoniteur(moniteurId);
  });

  /**
   * Récupère toutes les leçons d’un véhicule.
   */
  handle('planning:getByVehicule', async (event, vehiculeId) => {
    return getLeconsByVehicule(vehiculeId);
  });

  /**
   * Récupère les leçons pour une période donnée.
   */
  handle('planning:getBetweenDates', async (event, { startDate, endDate, moniteurId }) => {
    return getLeconsBetweenDates(startDate, endDate, moniteurId);
  });

  // =============================
  // MONITEURS
  // =============================

  /**
   * Récupère la liste paginée des moniteurs avec filtres.
   */
  handle('moniteurs:getAll', async (event, params) => {
    return getAllMoniteurs(params);
  });

  /**
   * Récupère un moniteur par son identifiant.
   */
  handle('moniteurs:getById', async (event, id) => {
    return getMoniteurById(id);
  });

  /**
   * Crée un nouveau moniteur.
   */
  handle('moniteurs:create', async (event, data) => {
    return createMoniteur(data);
  });

  /**
   * Met à jour un moniteur existant.
   */
  handle('moniteurs:update', async (event, { id, data }) => {
    return updateMoniteur(id, data);
  });

  /**
   * Désactive (soft delete) un moniteur.
   */
  handle('moniteurs:delete', async (event, id) => {
    return deleteMoniteur(id);
  });

  /**
   * Récupère les statistiques agrégées des moniteurs.
   */
  handle('moniteurs:getStats', async () => {
    return getMoniteursStats();
  });

  /**
   * Récupère les tendances évolutives des moniteurs.
   */
  handle('moniteurs:getTrends', async () => {
    return getMoniteursTrends();
  });

  /**
   * Récupère les données des sparklines (12 mois) pour les moniteurs.
   */
  handle('moniteurs:getSparklines', async () => {
    return getMoniteursSparklines();
  });

  // =============================
  // EXAMENS
  // =============================

  /**
   * Récupère la liste paginée des examens avec filtres.
   */
  handle('examens:getAll', async (event, params) => {
    return getAllExamens(params);
  });

  /**
   * Récupère un examen par son identifiant.
   */
  handle('examens:getById', async (event, id) => {
    return getExamenById(id);
  });

  /**
   * Crée un nouvel examen.
   */
  handle('examens:create', async (event, data) => {
    return createExamen(data);
  });

  /**
   * Met à jour un examen existant.
   */
  handle('examens:update', async (event, { id, data }) => {
    return updateExamen(id, data);
  });

  /**
   * Supprime définitivement un examen.
   */
  handle('examens:delete', async (event, id) => {
    return deleteExamen(id);
  });

  /**
   * Récupère les statistiques agrégées des examens.
   */
  handle('examens:getStats', async () => {
    return getExamensStats();
  });

  /**
   * Récupère les tendances évolutives des examens.
   */
  handle('examens:getTrends', async () => {
    return getExamensTrends();
  });

  /**
   * Récupère les données des sparklines (12 mois) pour les examens.
   */
  handle('examens:getSparklines', async () => {
    return getExamensSparklines();
  });

  /**
   * Récupère tous les examens d’un candidat.
   */
  handle('examens:getByCandidat', async (event, candidatId) => {
    return getExamensByCandidat(candidatId);
  });

  /**
   * Génère l’attestation (PDF) pour un examen réussi.
   */
  handle('examens:printCertificate', async (event, id) => {
    return printCertificate(id);
  });

  // =============================
  // ADMIN — Logs d'audit & config entreprise
  // =============================

  /**
   * Handler : récupère la liste paginée des logs d'audit.
   * @param {Electron.IpcMainInvokeEvent} event - Événement IPC
   * @param {AuditLogsListParams} params - Paramètres de pagination/filtres
   * @returns {Promise<AuditLogsPaginatedResponse>}
   */
  handle('admin:getAuditLogs', async (event, params) => {
    return getAuditLogs(params);
  });

  /**
   * Handler : récupère les statistiques agrégées des logs d'audit.
   * @returns {Promise<AdminStats>}
   */
  handle('admin:getAdminStats', async () => {
    return getAdminStats();
  });

  /**
   * Handler : récupère les tendances évolutives des logs d'audit.
   * @returns {Promise<AdminTrends>}
   */
  handle('admin:getAdminTrends', async () => {
    return getAdminTrends();
  });

  /**
   * Handler : récupère la configuration de l'entreprise.
   * @returns {Promise<CompanyConfig>}
   */
  handle('admin:getCompanyConfig', async () => {
    return getCompanyConfig();
  });

  /**
   * Handler : met à jour la configuration de l'entreprise.
   * @param {Electron.IpcMainInvokeEvent} event
   * @param {UpdateCompanyConfigInput} data - Champs à modifier
   * @returns {Promise<CompanyConfig>}
   */
  handle('admin:updateCompanyConfig', async (event, data) => {
    return updateCompanyConfig(data);
  });

  handle('globalSearch:search', async (event, query) => {
    return globalSearch(query);
  });

  handle('recu:list', async () => {
    const recuService = await getRecuService();
    return recuService.getAll();
  });
  handle('recu:get', async (_event, id) => {
    const recuService = await getRecuService();
    return recuService.getById(id);
  });
  handle('recu:export', async (_event, id) => {
    const recuService = await getRecuService();
    return recuService.exportReceipt(id);
  });

  handle('export:recu', async (_event, payload) => {
    const exportService = await getExportService();
    return exportService.exportFactures(payload);
  });
  handle('export:bilan', async (_event, payload) => {
    const exportService = await getExportService();
    return exportService.exportDashboardSnapshot(payload);
  });
  handle('export:excel', async (_event, payload) => {
    const exportService = await getExportService();
    return exportService.exportFactures(payload);
  });
  handle('export:openFolder', async () => {
    const exportService = await getExportService();
    const exportDir = await exportService.getExportDirectory();
    await shell.openPath(exportDir);
    return { path: exportDir };
  });
  handle('exports:dashboard', async (_event, payload) => {
    const exportService = await getExportService();
    return exportService.exportDashboardSnapshot(payload);
  });
  handle('exports:saveFile', async (_event, payload = {}) => {
    const {
      folder = 'general',
      baseName = 'export',
      extension = 'csv',
      content = '',
    } = payload;

    const exportDir = path.join(app.getPath('documents'), 'Auto-Ecole COS', 'exports', folder);
    await fs.promises.mkdir(exportDir, { recursive: true });

    const filePath = path.join(
      exportDir,
      `${baseName}-${createExportTimestamp()}.${String(extension).replace(/^\./, '')}`
    );

    await fs.promises.writeFile(filePath, content, 'utf8');
    await shell.openPath(filePath);

    return { success: true, path: filePath };
  });
  handle('exports:factures', async (_event, payload) => {
    const exportService = await getExportService();
    return exportService.exportFactures(payload);
  });
  handle('exports:paiements', async (_event, payload) => {
    return exportPaiementsReport(payload);
  });
  handle('exports:examens', async (_event, payload) => {
    return exportExamensReport(payload);
  });
}

// Initialisation au démarrage
process.on('uncaughtException', (error) => {
  showStartupError(error);
});

process.on('unhandledRejection', (reason) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  showStartupError(error);
});

app.whenReady().then(async () => {
  try {
    logStartup('Application prete, debut initialisation');
    registerFileAssetInterceptor();
    await initializePrisma();
    logStartup('Base de donnees prete');

    const prisma = getPrismaClient();
    await prisma.$connect();
    logStartup('Prisma connecte');

    registerIpcHandlers();
    logStartup('Handlers IPC enregistres');
    createWindow();
  } catch (err) {
    showStartupError(err);
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Fermeture propre
app.on('window-all-closed', async () => {
  await disconnectPrisma();
  logStartup('Prisma deconnecte');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
