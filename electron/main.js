// main.js
/**
 * @module main
 * @description Point d'entrée principal de l'application Electron.
 * Gère la fenêtre principale, les handlers IPC, l'initialisation de Prisma et l'authentification.
 * @author Stive Junior
 * @version 1.0.0
 */

import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPrismaClient, disconnectPrisma, initializePrisma } from './services/prisma.client.js';

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
  exportCaisseMouvements,
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
  generateFacturePDF,
  sendFactureByEmail,
} from './services/facture.service.js';

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
} from './services/examen.service.js';

import {
  getAuditLogs,
  getAdminStats,
  getAdminTrends,
  getCompanyConfig,
  updateCompanyConfig,
} from './services/admin.service.js';

import {
  exportDashboardSnapshot,
  exportFactures,
  getExportDirectory,
} from './services/exportService.js';

import {
  exportReceipt,
  getAll as getAllRecus,
  getById as getRecuById,
} from './services/recuService.js';
import { globalSearch } from './services/globalSearch.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const preloadPath = path.join(__dirname, 'preload.js');
const isDev = !app.isPackaged;

/**
 * Crée et retourne la fenêtre principale de l'application.
 * @returns {BrowserWindow} La fenêtre créée.
 */
function createWindow() {
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
    window.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    // En prod : charge le HTML construit par Vite
    window.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  window.webContents.on('did-finish-load', () => {
    window.show();
  });

  window.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error(`❌ Failed to load: ${errorDescription} (${errorCode})`);
  });

  window.webContents.on('crashed', () => {
    console.error('❌ Renderer process crashed');
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
    return exportCaisseMouvements(params);
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
    return generateFacturePDF(id);
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

  ipcMain.handle('recu:list', async () => getAllRecus());
  ipcMain.handle('recu:get', async (_event, id) => getRecuById(id));
  ipcMain.handle('recu:export', async (_event, id) => exportReceipt(id));

  ipcMain.handle('export:recu', async (_event, payload) => exportFactures(payload));
  ipcMain.handle('export:bilan', async (_event, payload) => exportDashboardSnapshot(payload));
  ipcMain.handle('export:excel', async (_event, payload) => exportFactures(payload));
  ipcMain.handle('export:openFolder', async () => {
    const exportDir = await getExportDirectory();
    await shell.openPath(exportDir);
    return { path: exportDir };
  });
  ipcMain.handle('exports:dashboard', async (_event, payload) => exportDashboardSnapshot(payload));
  ipcMain.handle('exports:factures', async (_event, payload) => exportFactures(payload));
}

// Initialisation au démarrage
app.whenReady().then(async () => {
  try {
    await initializePrisma();
    console.log('✅ Base de données prête.');

    // Maintenant seulement, on peut utiliser getPrismaClient()
    const prisma = getPrismaClient();
    await prisma.$connect();
    console.log('✅ Prisma connecté.');

    registerIpcHandlers();
    createWindow();
  } catch (err) {
    console.error('❌ Échec du démarrage :', err);
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
  console.log('🔌 Prisma déconnecté');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
