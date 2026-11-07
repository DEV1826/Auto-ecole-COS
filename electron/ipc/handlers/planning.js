/**
 * Handlers IPC — planning.
 * Extrait de electron/main.js ; enregistrés via le wrapper sécurisé `handle`
 * (voir electron/ipc/security.js).
 *
 * @module electron/ipc/handlers/planning
 */

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
} from '../../services/planning.service.js';

/**
 * @param {(channel: string, handler: Function) => void} handle
 * @param {object} helpers - Utilitaires partagés fournis par main.js
 */
export function registerPlanningHandlers(handle) {
  // =============================
  // PLANNING (LEÇONS)
  // =============================

  /**
   * Récupère la liste paginée des leçons avec filtres.
   */
  handle('planning:getAll', async (event, params) => {
    return getAllLecons(params);
  });

  /**
   * Récupère une leçon par son identifiant.
   */
  handle('planning:getById', async (event, id) => {
    return getLeconById(id);
  });

  /**
   * Crée une nouvelle leçon.
   */
  handle('planning:create', async (event, data) => {
    return createLecon(data);
  });

  /**
   * Met à jour une leçon existante.
   */
  handle('planning:update', async (event, { id, data }) => {
    return updateLecon(id, data);
  });

  /**
   * Supprime définitivement une leçon.
   */
  handle('planning:delete', async (event, id) => {
    return deleteLecon(id);
  });

  /**
   * Récupère les statistiques agrégées des leçons.
   */
  handle('planning:getStats', async () => {
    return getLeconsStats();
  });

  /**
   * Récupère les tendances évolutives des leçons.
   */
  handle('planning:getTrends', async () => {
    return getLeconsTrends();
  });

  /**
   * Récupère les données des sparklines (12 mois) pour les leçons.
   */
  handle('planning:getSparklines', async () => {
    return getLeconsSparklines();
  });

  /**
   * Récupère toutes les leçons d’un candidat.
   */
  handle('planning:getByCandidat', async (event, candidatId) => {
    return getLeconsByCandidat(candidatId);
  });

  /**
   * Récupère toutes les leçons d’un moniteur.
   */
  handle('planning:getByMoniteur', async (event, moniteurId) => {
    return getLeconsByMoniteur(moniteurId);
  });

  /**
   * Récupère toutes les leçons d’un véhicule.
   */
  handle('planning:getByVehicule', async (event, vehiculeId) => {
    return getLeconsByVehicule(vehiculeId);
  });

  /**
   * Récupère les leçons pour une période donnée.
   */
  handle('planning:getBetweenDates', async (event, { startDate, endDate, moniteurId }) => {
    return getLeconsBetweenDates(startDate, endDate, moniteurId);
  });
}
