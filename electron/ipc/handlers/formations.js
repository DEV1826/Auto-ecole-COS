/**
 * Handlers IPC — formations.
 * Extrait de electron/main.js ; enregistrés via le wrapper sécurisé `handle`
 * (voir electron/ipc/security.js).
 *
 * @module electron/ipc/handlers/formations
 */

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
} from '../../services/formation.service.js';

/**
 * @param {(channel: string, handler: Function) => void} handle
 * @param {object} helpers - Utilitaires partagés fournis par main.js
 */
export function registerFormationsHandlers(handle) {
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
}
