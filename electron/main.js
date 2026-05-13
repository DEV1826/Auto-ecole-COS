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
import { getPrismaClient, disconnectPrisma } from './services/prisma.client.js';

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
  getAuditLogs,
  requestPasswordResetByEmail,
  validateResetCode,
  resetPassword,
  getAllResetCodes,
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
  getPaiements as getCandidatPaiements,
  getLecons as getCandidatLecons,
  getExamens as getCandidatExamens,
  getFactures as getCandidatFactures,
  getDocuments as getCandidatDocuments,
  addDocument as addCandidatDocument,
  deleteDocument as deleteCandidatDocument,
} from './services/candidat.service.js';

import { deleteLesson, getPlanning, saveLesson, updateLesson } from './services/planningService.js';
import {
  create as createPaiement,
  deletePaiement,
  getAll as getAllPaiements,
  getByCandidat,
  getPaiements,
  getResumeMensuel,
  getSolde,
  registerPaiement,
} from './services/paiementService.js';
import {
  create as createVehicule,
  getAll as getAllVehicules,
  getVehicules,
  remove as removeVehicule,
  update as updateVehicule,
  updateVehiculeStatus,
} from './services/vehiculeService.js';
import {
  create as createDepense,
  getAll as getAllDepenses,
  remove as removeDepense,
} from './services/depenseService.js';
import {
  entree,
  getMouvements,
  getSolde as getCaisseSolde,
  sortie,
} from './services/caisseService.js';
import {
  create as createMoniteur,
  getAll as getAllMoniteurs,
  remove as removeMoniteur,
  update as updateMoniteur,
} from './services/moniteurService.js';
import {
  exportDashboardSnapshot,
  exportFactures,
  getExportDirectory,
} from './services/exportService.js';
import { getDashboard, getMensuels } from './services/statsService.js';
import {
  create as createFacture,
  getAll as getAllFactures,
  remove as removeFacture,
  update as updateFacture,
} from './services/factureService.js';
import {
  create as createFormation,
  getAll as getAllFormations,
  remove as removeFormation,
  update as updateFormation,
} from './services/formationService.js';
import {
  create as createExamen,
  getAll as getAllExamens,
  remove as removeExamen,
  update as updateExamen,
} from './services/examenService.js';
import {
  exportReceipt,
  getAll as getAllRecus,
  getById as getRecuById,
} from './services/recuService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const preloadPath = path.join(__dirname, 'preload.js');
console.log('🔍 Tentative de chargement du preload depuis :', preloadPath);

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

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;

  if (devServerUrl) {
    window.loadURL(devServerUrl);
  } else {
    window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
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

  // AUDIT LOGS
  ipcMain.handle('auth:getAuditLogs', async (event, { userId, page, limit, filters }) =>
    getAuditLogs({ userId, page, limit, filters })
  );

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

  ipcMain.handle('planning:list', async () => getPlanning());
  ipcMain.handle('planning:saveLesson', async (_event, payload) => saveLesson(payload));
  ipcMain.handle('planning:updateLesson', async (_event, payload) =>
    updateLesson(payload.id, payload.data)
  );
  ipcMain.handle('planning:deleteLesson', async (_event, id) => deleteLesson(id));

  ipcMain.handle('formation:list', async () => getAllFormations());
  ipcMain.handle('formation:create', async (_event, payload) => createFormation(payload));
  ipcMain.handle('formation:update', async (_event, payload) =>
    updateFormation(payload.id, payload.data)
  );
  ipcMain.handle('formation:delete', async (_event, id) => removeFormation(id));

  ipcMain.handle('examen:list', async () => getAllExamens());
  ipcMain.handle('examen:create', async (_event, payload) => createExamen(payload));
  ipcMain.handle('examen:update', async (_event, payload) =>
    updateExamen(payload.id, payload.data)
  );
  ipcMain.handle('examen:delete', async (_event, id) => removeExamen(id));

  ipcMain.handle('paiement:list', async () => getAllPaiements());
  ipcMain.handle('paiement:byCandidat', async (_event, id) => getByCandidat(id));
  ipcMain.handle('paiement:create', async (_event, payload) => createPaiement(payload));
  ipcMain.handle('paiement:delete', async (_event, id) => deletePaiement(id));
  ipcMain.handle('paiement:soldeCandidat', async (_event, id) => getSolde(id));
  ipcMain.handle('paiement:resumeMensuel', async (_event, payload) =>
    getResumeMensuel(payload.annee, payload.mois)
  );

  ipcMain.handle('paiements:list', async () => getPaiements());
  ipcMain.handle('paiements:create', async (_event, payload) => registerPaiement(payload));

  ipcMain.handle('facture:list', async () => getAllFactures());
  ipcMain.handle('facture:create', async (_event, payload) => createFacture(payload));
  ipcMain.handle('facture:update', async (_event, payload) =>
    updateFacture(payload.id, payload.data)
  );
  ipcMain.handle('facture:delete', async (_event, id) => removeFacture(id));

  ipcMain.handle('recu:list', async () => getAllRecus());
  ipcMain.handle('recu:get', async (_event, id) => getRecuById(id));
  ipcMain.handle('recu:export', async (_event, id) => exportReceipt(id));

  ipcMain.handle('depense:list', async () => getAllDepenses());
  ipcMain.handle('depense:create', async (_event, payload) => createDepense(payload));
  ipcMain.handle('depense:delete', async (_event, id) => removeDepense(id));

  ipcMain.handle('caisse:solde', async () => getCaisseSolde());
  ipcMain.handle('caisse:mouvements', async () => getMouvements());
  ipcMain.handle('caisse:entree', async (_event, payload) => entree(payload));
  ipcMain.handle('caisse:sortie', async (_event, payload) => sortie(payload));

  ipcMain.handle('vehicule:list', async () => getAllVehicules());
  ipcMain.handle('vehicule:create', async (_event, payload) => createVehicule(payload));
  ipcMain.handle('vehicule:update', async (_event, payload) =>
    updateVehicule(payload.id, payload.data)
  );
  ipcMain.handle('vehicule:delete', async (_event, id) => removeVehicule(id));
  ipcMain.handle('vehicules:list', async () => getVehicules());
  ipcMain.handle('vehicules:updateStatus', async (_event, payload) =>
    updateVehiculeStatus(payload)
  );

  ipcMain.handle('moniteur:list', async () => getAllMoniteurs());
  ipcMain.handle('moniteur:create', async (_event, payload) => createMoniteur(payload));
  ipcMain.handle('moniteur:update', async (_event, payload) =>
    updateMoniteur(payload.id, payload.data)
  );
  ipcMain.handle('moniteur:delete', async (_event, id) => removeMoniteur(id));

  ipcMain.handle('stats:dashboard', async () => getDashboard());
  ipcMain.handle('stats:mensuels', async (_event, mois) => getMensuels(mois));

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
    const prisma = getPrismaClient();
    await prisma.$connect();
    console.log('✅ Base de données connectée avec succès');

    registerIpcHandlers();
    createWindow();
  } catch (err) {
    console.error('❌ Échec du démarrage de Prisma:', err);
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
