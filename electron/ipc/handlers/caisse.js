/**
 * Handlers IPC — caisse.
 * Extrait de electron/main.js ; enregistrés via le wrapper sécurisé `handle`
 * (voir electron/ipc/security.js).
 *
 * @module electron/ipc/handlers/caisse
 */

import {
  getAllMouvements,
  getCaisseStats,
  getCaisseTrends,
  getCaisseSparklines,
  exportCaisseMouvementsFile,
} from '../../services/caisse.service.js';

/**
 * @param {(channel: string, handler: Function) => void} handle
 * @param {object} helpers - Utilitaires partagés fournis par main.js
 */
export function registerCaisseHandlers(handle) {
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
}
