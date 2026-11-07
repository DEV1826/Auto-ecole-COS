/**
 * Handlers IPC — moniteurs.
 * Extrait de electron/main.js ; enregistrés via le wrapper sécurisé `handle`
 * (voir electron/ipc/security.js).
 *
 * @module electron/ipc/handlers/moniteurs
 */

import {
  getAllMoniteurs,
  getMoniteurById,
  createMoniteur,
  updateMoniteur,
  deleteMoniteur,
  getMoniteursStats,
  getMoniteursTrends,
  getMoniteursSparklines,
} from '../../services/moniteur.service.js';

/**
 * @param {(channel: string, handler: Function) => void} handle
 * @param {object} helpers - Utilitaires partagés fournis par main.js
 */
export function registerMoniteursHandlers(handle) {
  // =============================
  // MONITEURS
  // =============================

  /**
   * Récupère la liste paginée des moniteurs avec filtres.
   */
  handle('moniteurs:getAll', async (event, params) => {
    return getAllMoniteurs(params);
  });

  /**
   * Récupère un moniteur par son identifiant.
   */
  handle('moniteurs:getById', async (event, id) => {
    return getMoniteurById(id);
  });

  /**
   * Crée un nouveau moniteur.
   */
  handle('moniteurs:create', async (event, data) => {
    return createMoniteur(data);
  });

  /**
   * Met à jour un moniteur existant.
   */
  handle('moniteurs:update', async (event, { id, data }) => {
    return updateMoniteur(id, data);
  });

  /**
   * Désactive (soft delete) un moniteur.
   */
  handle('moniteurs:delete', async (event, id) => {
    return deleteMoniteur(id);
  });

  /**
   * Récupère les statistiques agrégées des moniteurs.
   */
  handle('moniteurs:getStats', async () => {
    return getMoniteursStats();
  });

  /**
   * Récupère les tendances évolutives des moniteurs.
   */
  handle('moniteurs:getTrends', async () => {
    return getMoniteursTrends();
  });

  /**
   * Récupère les données des sparklines (12 mois) pour les moniteurs.
   */
  handle('moniteurs:getSparklines', async () => {
    return getMoniteursSparklines();
  });
}
