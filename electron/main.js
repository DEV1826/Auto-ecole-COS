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
import { createSecureIpc } from './ipc/security.js';
import { registerAuthHandlers } from './ipc/handlers/auth.js';
import { registerCandidatsHandlers } from './ipc/handlers/candidats.js';
import { registerDocumentsHandlers } from './ipc/handlers/documents.js';
import { registerFormationsHandlers } from './ipc/handlers/formations.js';
import { registerPaiementsHandlers } from './ipc/handlers/paiements.js';
import { registerDepensesHandlers } from './ipc/handlers/depenses.js';
import { registerCaisseHandlers } from './ipc/handlers/caisse.js';
import { registerFacturesHandlers } from './ipc/handlers/factures.js';
import { registerVehiculesHandlers } from './ipc/handlers/vehicules.js';
import { registerPlanningHandlers } from './ipc/handlers/planning.js';
import { registerMoniteursHandlers } from './ipc/handlers/moniteurs.js';
import { registerExamensHandlers } from './ipc/handlers/examens.js';
import { registerAdminHandlers } from './ipc/handlers/admin.js';
import { registerRapportsHandlers } from './ipc/handlers/rapports.js';
import { validateToken } from './services/auth.service.js';

const { app, BrowserWindow, dialog, ipcMain, protocol, shell } = globalThis.__ELECTRON_MAIN__ ?? {};

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

  const helpers = {
    getClientInfo,
    printPdfFile,
    getExportService,
    getRecuService,
    createExportTimestamp,
    logStartup,
    isDev,
  };

  registerAuthHandlers(handle, helpers);
  registerCandidatsHandlers(handle, helpers);
  registerDocumentsHandlers(handle, helpers);
  registerFormationsHandlers(handle, helpers);
  registerPaiementsHandlers(handle, helpers);
  registerDepensesHandlers(handle, helpers);
  registerCaisseHandlers(handle, helpers);
  registerFacturesHandlers(handle, helpers);
  registerVehiculesHandlers(handle, helpers);
  registerPlanningHandlers(handle, helpers);
  registerMoniteursHandlers(handle, helpers);
  registerExamensHandlers(handle, helpers);
  registerAdminHandlers(handle, helpers);
  registerRapportsHandlers(handle);
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
