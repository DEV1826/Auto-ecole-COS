/**
 * Handlers IPC — rapports (lecture seule) et export des rapports.
 * Les restrictions de rôle sont déclarées dans electron/ipc/security.js (CHANNEL_ROLES).
 *
 * @module electron/ipc/handlers/rapports
 */

import {
  getRapportCandidats,
  getRapportFinancier,
  getRapportKPI,
  getRapportLecons,
  getRapportVehicules,
} from '../../services/rapports.service.js';
import { exportRapports } from '../../services/rapports.export.service.js';

/**
 * @param {(channel: string, handler: Function) => void} handle
 */
export function registerRapportsHandlers(handle) {
  handle('rapports:financier', async (_event, params) => getRapportFinancier(params ?? {}));
  handle('rapports:candidats', async (_event, params) => getRapportCandidats(params ?? {}));
  handle('rapports:lecons', async (_event, params) => getRapportLecons(params ?? {}));
  handle('rapports:vehicules', async (_event, params) => getRapportVehicules(params ?? {}));
  handle('rapports:kpi', async (_event, params) => getRapportKPI(params ?? {}));
  handle('rapports:export', async (_event, payload) => exportRapports(payload ?? {}));
}
