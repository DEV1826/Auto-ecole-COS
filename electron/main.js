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
      sandbox: false,
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

function ensureProductionDatabase() {
  if (isDev) return;

  const userDataPath = app.getPath('userData');
  const targetDbPath = path.join(userDataPath, 'database.db');
  const bundledDbPath = path.join(process.resourcesPath, 'prisma', 'dev.db');

  if (fs.existsSync(targetDbPath)) return;

  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }

  if (!fs.existsSync(bundledDbPath)) {
    throw new Error(`Base SQLite embarquee introuvable : ${bundledDbPath}`);
  }

  fs.copyFileSync(bundledDbPath, targetDbPath);
  logStartup(`Base SQLite copiee vers ${targetDbPath}`);
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
      sandbox: false,
      enableRemoteModule: false,
    },
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
  // =============================
  // AUTHENTIFICATION
  // =============================
  ipcMain.handle('auth:login', async (event, { email, password }) => {
    const { ip, userAgent } = getClientInfo(event);
    return login({ email, password, ipAddress: ip, userAgent });
  });

  ipcMain.handle('auth:logout', async (event, { sessionId, userId }) => {
    const { ip } = getClientInfo(event);
    return logout({ sessionId, userId, ipAddress: ip });
  });

  ipcMain.handle('auth:validate', async (event, { token }) => validateToken(token));

  ipcMain.handle('auth:refresh', async (event, { refreshToken: rt }) =>
    refreshToken({ refreshToken: rt })
  );

  // GESTION DES UTILISATEURS
  ipcMain.handle('auth:createUser', async (event, payload) => {
    const { ip } = getClientInfo(event);
    return createUser({ ...payload, ipAddress: ip });
  });

  ipcMain.handle('auth:verifyDeveloperSetupCode', async (event, { code }) => {
    const { ip } = getClientInfo(event);
    return verifyDeveloperSetupCode({ code, ipAddress: ip });
  });

  ipcMain.handle('auth:createInitialSetup', async (event, payload) => {
    const { ip } = getClientInfo(event);
    return createInitialSetup({ ...payload, ipAddress: ip });
  });

  ipcMain.handle('auth:updateUser', async (event, payload) => {
    const { ip } = getClientInfo(event);
    return updateUser({ ...payload, ipAddress: ip });
  });

  ipcMain.handle('auth:deleteUser', async (event, { userId, deletedByUserId }) => {
    const { ip } = getClientInfo(event);
    return deleteUser({ userId, deletedByUserId, ipAddress: ip });
  });

  ipcMain.handle('auth:getAllUsers', async (event, { userId, page, limit }) =>
    getAllUsers({ userId, page, limit })
  );

  ipcMain.handle('auth:getUserById', async (event, { userId, requesterId }) =>
    getUserById({ userId, requesterId })
  );

  ipcMain.handle('auth:changePassword', async (event, { userId, oldPassword, newPassword }) => {
    const { ip } = getClientInfo(event);
    return changePassword({ userId, oldPassword, newPassword, ipAddress: ip });
  });

  // PERMISSIONS
  ipcMain.handle('auth:assignPermission', async (event, payload) => {
    const { ip } = getClientInfo(event);
    return assignPermission({ ...payload, ipAddress: ip });
  });

  ipcMain.handle('auth:revokePermission', async (event, { permissionId, revokedByUserId }) => {
    const { ip } = getClientInfo(event);
    return revokePermission({ permissionId, revokedByUserId, ipAddress: ip });
  });

  ipcMain.handle('auth:getUserPermissions', async (event, { userId }) =>
    getUserPermissions({ userId })
  );

  ipcMain.handle('auth:checkPermission', async (event, { userId, ressource, action }) =>
    checkPermission({ userId, ressource, action })
  );

  // SESSIONS
  ipcMain.handle('auth:getUserSessions', async (event, { userId }) => getUserSessions({ userId }));

  ipcMain.handle('auth:revokeSession', async (event, { sessionId, revokedByUserId }) => {
    const { ip } = getClientInfo(event);
    return revokeSession({ sessionId, revokedByUserId, ipAddress: ip });
  });

  ipcMain.handle('auth:revokeAllUserSessions', async (event, { userId, revokedByUserId }) => {
    const { ip } = getClientInfo(event);
    return revokeAllUserSessions({ userId, revokedByUserId, ipAddress: ip });
  });

  // RÉINITIALISATION PAR CODE OTP
  ipcMain.handle('auth:requestPasswordResetByEmail', async (event, email, isAdmin) => {
    const { ip } = getClientInfo(event);
    return requestPasswordResetByEmail({ email, isAdmin, ipAddress: ip });
  });

  ipcMain.handle('auth:validateResetCode', async (event, code) => {
    return validateResetCode({ code });
  });

  ipcMain.handle('auth:resetPassword', async (event, { code, newPassword }) => {
    const { ip } = getClientInfo(event);
    return resetPassword({ code, newPassword, ipAddress: ip });
  });

  ipcMain.handle('auth:getAllResetCodes', async (event, { userId, page, limit, onlyActive }) => {
    return getAllResetCodes({ userId, page, limit, onlyActive });
  });

  /**
   * Récupère les statistiques agrégées des utilisateurs.
   * @route auth:getStats
   * @returns {Promise<AuthStats>} Statistiques des utilisateurs
   */
  ipcMain.handle('auth:getStats', async () => {
    return getUserStats();
  });

  /**
   * Récupère les tendances évolutives des utilisateurs.
   * Compare les 30 derniers jours avec la période précédente.
   * @route auth:getTrends
   * @returns {Promise<AuthTrends>} Variations en pourcentage
   */
  ipcMain.handle('auth:getTrends', async () => {
    return getUserTrends();
  });

  /**
   * Récupère les données des sparklines pour les 12 derniers mois.
   * Génère les mini-graphiques pour l'affichage des KPI.
   * @route auth:getSparklines
   * @returns {Promise<AuthSparklineData>} Données historiques mensuelles
   */
  ipcMain.handle('auth:getSparklines', async () => {
    return getUserSparklines();
  });

  // =============================
  // CANDIDATS
  // =============================

  ipcMain.handle('candidats:getAll', async (event, params) => {
    return getAllCandidats(params);
  });

  ipcMain.handle('candidats:getById', async (event, id) => {
    return getCandidatById(id);
  });

  ipcMain.handle('candidats:create', async (event, data) => {
    return createCandidat(data);
  });

  ipcMain.handle('candidats:update', async (event, { id, data }) => {
    return updateCandidat(id, data);
  });

  ipcMain.handle('candidats:delete', async (event, id) => {
    return removeCandidat(id);
  });

  ipcMain.handle('candidats:search', async (event, query) => {
    return searchCandidats(query);
  });

  ipcMain.handle('candidats:updateStatus', async (event, params) => {
    return updateCandidatStatus(params);
  });

  ipcMain.handle('candidats:getStats', async () => {
    return getCandidatsStats();
  });

  ipcMain.handle('candidats:getTrends', async () => {
    return await getCandidatsTrends();
  });

  ipcMain.handle('candidats:getPaiements', async (event, candidatId) => {
    return getCandidatPaiements(candidatId);
  });

  ipcMain.handle('candidats:getLecons', async (event, candidatId) => {
    return getCandidatLecons(candidatId);
  });

  ipcMain.handle('candidats:getExamens', async (event, candidatId) => {
    return getCandidatExamens(candidatId);
  });

  ipcMain.handle('candidats:getFactures', async (event, candidatId) => {
    return getCandidatFactures(candidatId);
  });

  ipcMain.handle('candidats:getDocuments', async (event, candidatId) => {
    return getCandidatDocuments(candidatId);
  });

  ipcMain.handle('candidats:addDocument', async (event, data) => {
    return addCandidatDocument(data);
  });

  ipcMain.handle('candidats:deleteDocument', async (event, docId) => {
    return deleteCandidatDocument(docId);
  });

  // =============================
  // DOCUMENTS
  // =============================

  ipcMain.handle('documents:upload', async (event, payload) => {
    return uploadDocument(payload);
  });
  ipcMain.handle('documents:getAll', async (event, params) => {
    return getAllDocuments(params);
  });

  ipcMain.handle('documents:getById', async (event, id) => {
    return getDocumentById(id);
  });

  ipcMain.handle('documents:getStats', async () => {
    return getDocumentsStats();
  });

  ipcMain.handle('documents:getTrends', async () => {
    return getDocumentsTrends();
  });

  ipcMain.handle('documents:getSparklines', async () => {
    return getDocumentsSparklines();
  });

  ipcMain.handle('documents:delete', async (event, id) => {
    return deleteDocument(id);
  });

  ipcMain.handle('documents:download', async (event, id) => {
    return downloadDocument(id);
  });

  ipcMain.handle('documents:open', async (event, { chemin }) => {
    return openDocument(chemin);
  });

  ipcMain.handle('documents:print', async (_event, { chemin, title }) => {
    return printPdfFile(chemin, title);
  });

  // =============================
  // FORMATIONS
  // =============================

  ipcMain.handle('formations:getAll', async (event, params) => {
    return getAllFormations(params);
  });

  ipcMain.handle('formations:getById', async (event, id) => {
    return getFormationById(id);
  });

  ipcMain.handle('formations:create', async (event, data) => {
    return createFormation(data);
  });

  ipcMain.handle('formations:update', async (event, { id, data }) => {
    return updateFormation(id, data);
  });

  ipcMain.handle('formations:delete', async (event, id) => {
    return deleteFormation(id);
  });

  ipcMain.handle('formations:getStats', async () => {
    return getFormationsStats();
  });

  ipcMain.handle('formations:getTrends', async () => {
    return getFormationsTrends();
  });

  ipcMain.handle('formations:getSparklines', async () => {
    return getFormationsSparklines();
  });

  ipcMain.handle('formations:getMonthlyInscriptions', async (event, formationId) => {
    return getMonthlyInscriptions(formationId);
  });

  ipcMain.handle('formations:getCandidatsByFormation', async (event, formationId) => {
    return getCandidatsByFormation(formationId);
  });

  ipcMain.handle('formations:getPopularityStats', async () => {
    return getPopularityStats();
  });

  ipcMain.handle('formations:getNbInscriptions', async (event, formationId) => {
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
  ipcMain.handle('paiements:getAll', async (event, params) => {
    return getAllPaiements(params);
  });

  /**
   * Récupère un paiement par son identifiant (avec candidat et facture).
   * @param {Object} event
   * @param {number} id - Identifiant du paiement
   */
  ipcMain.handle('paiements:getById', async (event, id) => {
    return getPaiementById(id);
  });

  /**
   * Crée un nouveau paiement, met à jour la caisse et la facture associée.
   * @param {Object} event
   * @param {CreatePaiementInput} data - Données du paiement
   */
  ipcMain.handle('paiements:create', async (event, data) => {
    return createPaiement(data);
  });

  /**
   * Met à jour les champs non‑financiers d’un paiement (référence, note, factureId).
   * @param {Object} event
   * @param {number} id - Identifiant du paiement
   * @param {UpdatePaiementInput} data - Champs à modifier
   */
  ipcMain.handle('paiements:update', async (event, { id, data }) => {
    return updatePaiement(id, data);
  });

  /**
   * Supprime définitivement un paiement et annule l’entrée en caisse.
   * @param {Object} event
   * @param {number} id - Identifiant du paiement
   */
  ipcMain.handle('paiements:delete', async (event, id) => {
    return deletePaiement(id);
  });

  /**
   * Récupère les statistiques complètes des paiements (dashboard).
   * @param {Object} event
   */
  ipcMain.handle('paiements:getStats', async () => {
    return getPaiementsStats();
  });

  /**
   * Récupère les tendances évolutives des paiements (mois courant vs précédent).
   * @param {Object} event
   */
  ipcMain.handle('paiements:getTrends', async () => {
    return getPaiementsTrends();
  });

  /**
   * Récupère les sparklines des paiements pour les 12 derniers mois.
   * @param {Object} event
   */
  ipcMain.handle('paiements:getSparklines', async () => {
    return getPaiementsSparklines();
  });

  /**
   * Récupère tous les paiements d’un candidat spécifique.
   * @param {Object} event
   * @param {number} candidatId
   */
  ipcMain.handle('paiements:getByCandidat', async (event, candidatId) => {
    return getPaiementsByCandidat(candidatId);
  });

  /**
   * Calcule le solde d’un candidat (total facturé - total payé).
   * @param {Object} event
   * @param {number} candidatId
   */
  ipcMain.handle('paiements:getSoldeCandidat', async (event, candidatId) => {
    return getSoldeCandidat(candidatId);
  });

  /**
   * Récupère le résumé mensuel des paiements pour une année et un mois donnés.
   * @param {Object} event
   * @param {number} annee
   * @param {number} mois
   */
  ipcMain.handle('paiements:getResumeMensuel', async (event, annee, mois) => {
    return getResumeMensuel(annee, mois);
  });

  /**
   * Génère le reçu d’un paiement (export PDF – stub pour l’instant).
   * @param {Object} event
   * @param {number} id
   */
  ipcMain.handle('paiements:printReceipt', async (event, id) => {
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
  ipcMain.handle('depenses:getAll', async (event, params) => {
    return getAllDepenses(params);
  });

  /**
   * Récupère une dépense par son identifiant.
   * @param {Object} event
   * @param {number} id - Identifiant de la dépense
   */
  ipcMain.handle('depenses:getById', async (event, id) => {
    return getDepenseById(id);
  });

  /**
   * Crée une nouvelle dépense, enregistre la sortie en caisse et retourne la dépense créée.
   * @param {Object} event
   * @param {CreateDepenseInput} data - Données de la dépense
   */
  ipcMain.handle('depenses:create', async (event, data) => {
    return createDepense(data);
  });

  /**
   * Met à jour les champs modifiables d’une dépense (catégorie, montant, description, fournisseur, référence, véhicule, date).
   * Ne modifie pas les champs liés à la transaction de caisse (montant, date) pour éviter les incohérences.
   * @param {Object} event
   * @param {number} id - Identifiant de la dépense
   * @param {UpdateDepenseInput} data - Champs à modifier
   */
  ipcMain.handle('depenses:update', async (event, { id, data }) => {
    return updateDepense(id, data);
  });

  /**
   * Supprime une dépense et annule la sortie correspondante en caisse.
   * @param {Object} event
   * @param {number} id - Identifiant de la dépense
   */
  ipcMain.handle('depenses:delete', async (event, id) => {
    return deleteDepense(id);
  });

  /**
   * Récupère les statistiques agrégées des dépenses (total, moyenne, par catégorie, etc.).
   * @param {Object} event
   */
  ipcMain.handle('depenses:getStats', async () => {
    return getDepensesStats();
  });

  /**
   * Récupère les tendances évolutives des dépenses (mois courant vs précédent, catégories en hausse/baisse, etc.).
   * @param {Object} event
   */
  ipcMain.handle('depenses:getTrends', async () => {
    return getDepensesTrends();
  });

  /**
   * Récupère les données des tendances évolutives des dépenses pour les graphiques (évolution mensuelle, répartition par catégorie, etc.).
   * @param {Object} event
   */
  ipcMain.handle('depenses:getTrendChartData', async () => {
    return getDepensesTrendChartData();
  });

  /**
   * Récupère les données des sparklines (12 mois) pour les dépenses.
   * @param {Object} event
   */
  ipcMain.handle('depenses:getSparklines', async () => {
    return getDepensesSparklines();
  });

  /**
   * Récupère toutes les dépenses associées à un véhicule spécifique.
   * @param {Object} event
   * @param {number} vehiculeId
   */
  ipcMain.handle('depenses:getByVehicule', async (event, vehiculeId) => {
    return getDepensesByVehicule(vehiculeId);
  });

  /**
   * Attache un justificatif (chemin de fichier) à une dépense existante.
   * @param {Object} event
   * @param {number} id - Identifiant de la dépense
   * @param {string} filePath - Chemin du
   */
  ipcMain.handle('depenses:attachReceipt', async (event, { id, filePath }) => {
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
  ipcMain.handle('caisse:getAll', async (event, params) => {
    return getAllMouvements(params);
  });

  /**
   * Récupère les statistiques agrégées de la caisse.
   * @param {Object} event
   */
  ipcMain.handle('caisse:getStats', async () => {
    return getCaisseStats();
  });

  /**
   * Récupère les tendances évolutives (mois vs précédent).
   * @param {Object} event
   */
  ipcMain.handle('caisse:getTrends', async () => {
    return getCaisseTrends();
  });

  /**
   * Récupère les données des sparklines pour les 12 derniers mois.
   * @param {Object} event
   */
  ipcMain.handle('caisse:getSparklines', async () => {
    return getCaisseSparklines();
  });

  /**
   * Exporte l’historique des mouvements.
   * @param {Object} event
   * @param {CaisseListParams} params
   */
  ipcMain.handle('caisse:exportMouvements', async (event, params) => {
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
  ipcMain.handle('factures:getAll', async (event, params) => {
    return getAllFactures(params);
  });

  /**
   * Récupère une facture par son ID (avec candidat et paiements).
   * @param {Object} event
   * @param {number} id
   */
  ipcMain.handle('factures:getById', async (event, id) => {
    return getFactureById(id);
  });

  /**
   * Crée une nouvelle facture (génère le numéro et le PDF).
   * @param {Object} event
   * @param {CreateFactureInput} data
   */
  ipcMain.handle('factures:create', async (event, data) => {
    return createFacture(data);
  });

  /**
   * Met à jour une facture (statut, échéance, notes).
   * @param {Object} event
   * @param {number} id
   * @param {UpdateFactureInput} data
   */
  ipcMain.handle('factures:update', async (event, { id, data }) => {
    return updateFacture(id, data);
  });

  /**
   * Supprime une facture (si aucun paiement associé).
   * @param {Object} event
   * @param {number} id
   */
  ipcMain.handle('factures:delete', async (event, id) => {
    return deleteFacture(id);
  });

  /**
   * Récupère les statistiques agrégées des factures.
   * @param {Object} event
   */
  ipcMain.handle('factures:getStats', async () => {
    return getFacturesStats();
  });

  /**
   * Récupère les tendances évolutives des factures.
   * @param {Object} event
   */
  ipcMain.handle('factures:getTrends', async () => {
    return getFacturesTrends();
  });

  /**
   * Récupère les données des sparklines (12 mois) pour les factures.
   * @param {Object} event
   */
  ipcMain.handle('factures:getSparklines', async () => {
    return getFacturesSparklines();
  });

  /**
   * Récupère tous les paiements associés à une facture.
   * @param {Object} event
   * @param {number} factureId
   */
  ipcMain.handle('factures:getPaiements', async (event, factureId) => {
    return getPaiementsByFacture(factureId);
  });

  /**
   * Récupère toutes les factures d’un candidat.
   * @param {Object} event
   * @param {number} candidatId
   */
  ipcMain.handle('factures:getByCandidat', async (event, candidatId) => {
    return getFacturesByCandidat(candidatId);
  });

  /**
   * Génère (ou régénère) le PDF d’une facture.
   * @param {Object} event
   * @param {number} id
   */
  ipcMain.handle('factures:generatePDF', async (event, id) => {
    return generateFacturePDFDesktop(id);
  });

  /**
   * Envoie la facture par email au candidat.
   * @param {Object} event
   * @param {number} id
   */
  ipcMain.handle('factures:sendByEmail', async (event, id) => {
    return sendFactureByEmail(id);
  });

  // =============================
  // VEHICULES
  // =============================

  /**
   * Récupère la liste paginée des véhicules avec filtres.
   */
  ipcMain.handle('vehicules:getAll', async (event, params) => {
    return getAllVehicules(params);
  });

  /**
   * Récupère un véhicule par son identifiant avec toutes ses relations.
   */
  ipcMain.handle('vehicules:getById', async (event, id) => {
    return getVehiculeById(id);
  });

  /**
   * Crée un nouveau véhicule.
   */
  ipcMain.handle('vehicules:create', async (event, data) => {
    return createVehicule(data);
  });

  /**
   * Met à jour un véhicule existant (patch partiel).
   */
  ipcMain.handle('vehicules:update', async (event, { id, data }) => {
    return updateVehicule(id, data);
  });

  /**
   * Supprime (désactive) un véhicule.
   */
  ipcMain.handle('vehicules:delete', async (event, id) => {
    return removeVehicule(id);
  });

  /**
   * Récupère les statistiques agrégées des véhicules.
   */
  ipcMain.handle('vehicules:getStats', async () => {
    return getVehiculesStats();
  });

  /**
   * Récupère les tendances évolutives des véhicules.
   */
  ipcMain.handle('vehicules:getTrends', async () => {
    return getVehiculesTrends();
  });

  /**
   * Récupère les données des sparklines pour les 12 derniers mois.
   */
  ipcMain.handle('vehicules:getSparklines', async () => {
    return getVehiculesSparklines();
  });

  /**
   * Récupère tous les entretiens d’un véhicule.
   */
  ipcMain.handle('vehicules:getEntretiensByVehicule', async (event, vehiculeId) => {
    return getEntretiensByVehicule(vehiculeId);
  });

  /**
   * Enregistre un nouvel entretien pour un véhicule.
   */
  ipcMain.handle('vehicules:createEntretien', async (event, data) => {
    return createEntretien(data);
  });

  /**
   * Met à jour un entretien existant.
   */
  ipcMain.handle('vehicules:updateEntretien', async (event, { id, data }) => {
    return updateEntretien(id, data);
  });

  /**
   * Supprime un entretien.
   */
  ipcMain.handle('vehicules:deleteEntretien', async (event, id) => {
    return deleteEntretien(id);
  });

  /**
   * Met à jour le kilométrage d’un véhicule.
   */
  ipcMain.handle('vehicules:updateKilometrage', async (event, data) => {
    return updateVehiculeKilometrage(data);
  });

  /**
   * Vérifie si une immatriculation est unique.
   */
  ipcMain.handle(
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
  ipcMain.handle('planning:getAll', async (event, params) => {
    return getAllLecons(params);
  });

  /**
   * Récupère une leçon par son identifiant.
   */
  ipcMain.handle('planning:getById', async (event, id) => {
    return getLeconById(id);
  });

  /**
   * Crée une nouvelle leçon.
   */
  ipcMain.handle('planning:create', async (event, data) => {
    return createLecon(data);
  });

  /**
   * Met à jour une leçon existante.
   */
  ipcMain.handle('planning:update', async (event, { id, data }) => {
    return updateLecon(id, data);
  });

  /**
   * Supprime définitivement une leçon.
   */
  ipcMain.handle('planning:delete', async (event, id) => {
    return deleteLecon(id);
  });

  /**
   * Récupère les statistiques agrégées des leçons.
   */
  ipcMain.handle('planning:getStats', async () => {
    return getLeconsStats();
  });

  /**
   * Récupère les tendances évolutives des leçons.
   */
  ipcMain.handle('planning:getTrends', async () => {
    return getLeconsTrends();
  });

  /**
   * Récupère les données des sparklines (12 mois) pour les leçons.
   */
  ipcMain.handle('planning:getSparklines', async () => {
    return getLeconsSparklines();
  });

  /**
   * Récupère toutes les leçons d’un candidat.
   */
  ipcMain.handle('planning:getByCandidat', async (event, candidatId) => {
    return getLeconsByCandidat(candidatId);
  });

  /**
   * Récupère toutes les leçons d’un moniteur.
   */
  ipcMain.handle('planning:getByMoniteur', async (event, moniteurId) => {
    return getLeconsByMoniteur(moniteurId);
  });

  /**
   * Récupère toutes les leçons d’un véhicule.
   */
  ipcMain.handle('planning:getByVehicule', async (event, vehiculeId) => {
    return getLeconsByVehicule(vehiculeId);
  });

  /**
   * Récupère les leçons pour une période donnée.
   */
  ipcMain.handle('planning:getBetweenDates', async (event, { startDate, endDate, moniteurId }) => {
    return getLeconsBetweenDates(startDate, endDate, moniteurId);
  });

  // =============================
  // MONITEURS
  // =============================

  /**
   * Récupère la liste paginée des moniteurs avec filtres.
   */
  ipcMain.handle('moniteurs:getAll', async (event, params) => {
    return getAllMoniteurs(params);
  });

  /**
   * Récupère un moniteur par son identifiant.
   */
  ipcMain.handle('moniteurs:getById', async (event, id) => {
    return getMoniteurById(id);
  });

  /**
   * Crée un nouveau moniteur.
   */
  ipcMain.handle('moniteurs:create', async (event, data) => {
    return createMoniteur(data);
  });

  /**
   * Met à jour un moniteur existant.
   */
  ipcMain.handle('moniteurs:update', async (event, { id, data }) => {
    return updateMoniteur(id, data);
  });

  /**
   * Désactive (soft delete) un moniteur.
   */
  ipcMain.handle('moniteurs:delete', async (event, id) => {
    return deleteMoniteur(id);
  });

  /**
   * Récupère les statistiques agrégées des moniteurs.
   */
  ipcMain.handle('moniteurs:getStats', async () => {
    return getMoniteursStats();
  });

  /**
   * Récupère les tendances évolutives des moniteurs.
   */
  ipcMain.handle('moniteurs:getTrends', async () => {
    return getMoniteursTrends();
  });

  /**
   * Récupère les données des sparklines (12 mois) pour les moniteurs.
   */
  ipcMain.handle('moniteurs:getSparklines', async () => {
    return getMoniteursSparklines();
  });

  // =============================
  // EXAMENS
  // =============================

  /**
   * Récupère la liste paginée des examens avec filtres.
   */
  ipcMain.handle('examens:getAll', async (event, params) => {
    return getAllExamens(params);
  });

  /**
   * Récupère un examen par son identifiant.
   */
  ipcMain.handle('examens:getById', async (event, id) => {
    return getExamenById(id);
  });

  /**
   * Crée un nouvel examen.
   */
  ipcMain.handle('examens:create', async (event, data) => {
    return createExamen(data);
  });

  /**
   * Met à jour un examen existant.
   */
  ipcMain.handle('examens:update', async (event, { id, data }) => {
    return updateExamen(id, data);
  });

  /**
   * Supprime définitivement un examen.
   */
  ipcMain.handle('examens:delete', async (event, id) => {
    return deleteExamen(id);
  });

  /**
   * Récupère les statistiques agrégées des examens.
   */
  ipcMain.handle('examens:getStats', async () => {
    return getExamensStats();
  });

  /**
   * Récupère les tendances évolutives des examens.
   */
  ipcMain.handle('examens:getTrends', async () => {
    return getExamensTrends();
  });

  /**
   * Récupère les données des sparklines (12 mois) pour les examens.
   */
  ipcMain.handle('examens:getSparklines', async () => {
    return getExamensSparklines();
  });

  /**
   * Récupère tous les examens d’un candidat.
   */
  ipcMain.handle('examens:getByCandidat', async (event, candidatId) => {
    return getExamensByCandidat(candidatId);
  });

  /**
   * Génère l’attestation (PDF) pour un examen réussi.
   */
  ipcMain.handle('examens:printCertificate', async (event, id) => {
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
  ipcMain.handle('admin:getAuditLogs', async (event, params) => {
    return getAuditLogs(params);
  });

  /**
   * Handler : récupère les statistiques agrégées des logs d'audit.
   * @returns {Promise<AdminStats>}
   */
  ipcMain.handle('admin:getAdminStats', async () => {
    return getAdminStats();
  });

  /**
   * Handler : récupère les tendances évolutives des logs d'audit.
   * @returns {Promise<AdminTrends>}
   */
  ipcMain.handle('admin:getAdminTrends', async () => {
    return getAdminTrends();
  });

  /**
   * Handler : récupère la configuration de l'entreprise.
   * @returns {Promise<CompanyConfig>}
   */
  ipcMain.handle('admin:getCompanyConfig', async () => {
    return getCompanyConfig();
  });

  /**
   * Handler : met à jour la configuration de l'entreprise.
   * @param {Electron.IpcMainInvokeEvent} event
   * @param {UpdateCompanyConfigInput} data - Champs à modifier
   * @returns {Promise<CompanyConfig>}
   */
  ipcMain.handle('admin:updateCompanyConfig', async (event, data) => {
    return updateCompanyConfig(data);
  });

  ipcMain.handle('globalSearch:search', async (event, query) => {
    return globalSearch(query);
  });

  ipcMain.handle('recu:list', async () => {
    const recuService = await getRecuService();
    return recuService.getAll();
  });
  ipcMain.handle('recu:get', async (_event, id) => {
    const recuService = await getRecuService();
    return recuService.getById(id);
  });
  ipcMain.handle('recu:export', async (_event, id) => {
    const recuService = await getRecuService();
    return recuService.exportReceipt(id);
  });

  ipcMain.handle('export:recu', async (_event, payload) => {
    const exportService = await getExportService();
    return exportService.exportFactures(payload);
  });
  ipcMain.handle('export:bilan', async (_event, payload) => {
    const exportService = await getExportService();
    return exportService.exportDashboardSnapshot(payload);
  });
  ipcMain.handle('export:excel', async (_event, payload) => {
    const exportService = await getExportService();
    return exportService.exportFactures(payload);
  });
  ipcMain.handle('export:openFolder', async () => {
    const exportService = await getExportService();
    const exportDir = await exportService.getExportDirectory();
    await shell.openPath(exportDir);
    return { path: exportDir };
  });
  ipcMain.handle('exports:dashboard', async (_event, payload) => {
    const exportService = await getExportService();
    return exportService.exportDashboardSnapshot(payload);
  });
  ipcMain.handle('exports:saveFile', async (_event, payload = {}) => {
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
  ipcMain.handle('exports:factures', async (_event, payload) => {
    const exportService = await getExportService();
    return exportService.exportFactures(payload);
  });
  ipcMain.handle('exports:paiements', async (_event, payload) => {
    return exportPaiementsReport(payload);
  });
  ipcMain.handle('exports:examens', async (_event, payload) => {
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
    ensureProductionDatabase();
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
