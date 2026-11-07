/**
 * Secrets de l'application (clés JWT, code d'installation).
 *
 * Ordre de résolution des clés JWT :
 *   1. variables d'environnement `JWT_SECRET` / `JWT_REFRESH_SECRET` ;
 *   2. fichier `secrets.json` dans le dossier userData, généré aléatoirement au
 *      premier lancement (propre à chaque poste, jamais versionné).
 *
 * Code développeur d'installation :
 *   1. variable d'environnement `AUTO_ECOLE_SETUP_CODE` (ou `DEVELOPER_REGISTER_CODE`) ;
 *   2. fichier `setup-code.txt` embarqué dans les ressources de l'installeur
 *      (copié depuis `build/setup-code.txt` au moment du packaging) ;
 *   3. en développement uniquement : `COS-DEV-SETUP-2026`.
 *
 * @module electron/services/secrets
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const DEV_SETUP_CODE = 'COS-DEV-SETUP-2026';

let cachedSecrets = null;

function getApp() {
  return globalThis.__ELECTRON_MAIN__?.app ?? null;
}

export function isPackagedApp() {
  return Boolean(getApp()?.isPackaged);
}

function loadOrCreateSecretsFile() {
  if (cachedSecrets) return cachedSecrets;

  const app = getApp();
  if (!app) {
    throw new Error('Electron app indisponible : impossible de charger les secrets.');
  }

  const dir = app.getPath('userData');
  const file = path.join(dir, 'secrets.json');
  let secrets = {};

  try {
    if (fs.existsSync(file)) {
      secrets = JSON.parse(fs.readFileSync(file, 'utf8')) || {};
    }
  } catch (error) {
    console.error('[secrets] secrets.json illisible, régénération :', error);
    secrets = {};
  }

  let changed = false;
  for (const key of ['jwtSecret', 'jwtRefreshSecret']) {
    if (typeof secrets[key] !== 'string' || secrets[key].length < 32) {
      secrets[key] = crypto.randomBytes(48).toString('base64');
      changed = true;
    }
  }

  if (changed) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(secrets, null, 2), { encoding: 'utf8', mode: 0o600 });
  }

  cachedSecrets = secrets;
  return secrets;
}

export function getJwtSecret() {
  return process.env.JWT_SECRET || loadOrCreateSecretsFile().jwtSecret;
}

export function getJwtRefreshSecret() {
  return process.env.JWT_REFRESH_SECRET || loadOrCreateSecretsFile().jwtRefreshSecret;
}

/**
 * @returns {string} Code d'installation, ou chaîne vide si aucun n'est configuré.
 */
export function getDeveloperSetupCode() {
  const fromEnv = process.env.AUTO_ECOLE_SETUP_CODE || process.env.DEVELOPER_REGISTER_CODE;
  if (fromEnv) return fromEnv.trim();

  if (isPackagedApp()) {
    try {
      const file = path.join(process.resourcesPath, 'setup-code.txt');
      if (fs.existsSync(file)) {
        return fs.readFileSync(file, 'utf8').trim();
      }
    } catch (error) {
      console.error('[secrets] setup-code.txt illisible :', error);
    }
    return '';
  }

  return DEV_SETUP_CODE;
}

/**
 * Compare deux chaînes en temps constant.
 * @param {string} a
 * @param {string} b
 */
export function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}
