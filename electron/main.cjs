const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const electronMain = require('electron');

globalThis.__ELECTRON_MAIN__ = electronMain;

function getBootstrapLogPath() {
  try {
    const appDataDir = process.env.APPDATA || os.tmpdir();
    const targetDir = path.join(appDataDir, 'autoecole-app');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    return path.join(targetDir, 'electron-bootstrap.log');
  } catch {
    return path.join(os.tmpdir(), 'autoecole-cos-bootstrap.log');
  }
}

function writeBootstrapLog(message, error = null) {
  const lines = [`[${new Date().toISOString()}] ${message}`];
  if (error) {
    lines.push(error && error.stack ? error.stack : String(error));
  }
  const content = `${lines.join('\n')}\n`;

  try {
    fs.appendFileSync(getBootstrapLogPath(), content, 'utf8');
  } catch {}
}

process.on('uncaughtException', (error) => {
  writeBootstrapLog('uncaughtException in main.cjs', error);
  try {
    electronMain.dialog.showErrorBox(
      'Auto-Ecole COS - Bootstrap error',
      `${error && error.message ? error.message : String(error)}\n\nLog: ${getBootstrapLogPath()}`
    );
  } catch {}
});

process.on('unhandledRejection', (reason) => {
  writeBootstrapLog('unhandledRejection in main.cjs', reason);
});

writeBootstrapLog('Bootstrap start');

// En développement uniquement : charge .env (JWT_SECRET, AUTO_ECOLE_SETUP_CODE, ...).
// L'application installée n'embarque pas de .env : les secrets JWT sont générés par
// poste (voir electron/services/secrets.js).
if (!electronMain.app.isPackaged) {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    try {
      // Les variables VITE_* et DATABASE_URL sont ignorées : elles concernent Vite
      // ou sont calculées par prisma.client.js.
      const parsed = require('node:util').parseEnv(fs.readFileSync(envPath, 'utf8'));
      for (const [key, value] of Object.entries(parsed)) {
        if (key.startsWith('VITE_') || key === 'DATABASE_URL') continue;
        if (process.env[key] === undefined) process.env[key] = value;
      }
    } catch (error) {
      writeBootstrapLog('Lecture de .env impossible', error);
    }
  }
}

import('./main.js').then(
  () => writeBootstrapLog('main.js imported successfully'),
  (error) => {
    writeBootstrapLog('main.js import failed', error);
    try {
      electronMain.dialog.showErrorBox(
        'Auto-Ecole COS - Startup error',
        `${error && error.message ? error.message : String(error)}\n\nLog: ${getBootstrapLogPath()}`
      );
    } catch {}
    process.exit(1);
  }
);
