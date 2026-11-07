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
