/**
 * Handlers IPC — examens.
 * Extrait de electron/main.js ; enregistrés via le wrapper sécurisé `handle`
 * (voir electron/ipc/security.js).
 *
 * @module electron/ipc/handlers/examens
 */

import {
  getAllExamens,
  getExamenById,
  createExamen,
  updateExamen,
  deleteExamen,
  getExamensStats,
  getExamensTrends,
  getExamensSparklines,
  getExamensByCandidat,
  printCertificate,
} from '../../services/examen.service.js';

/**
 * @param {(channel: string, handler: Function) => void} handle
 * @param {object} helpers - Utilitaires partagés fournis par main.js
 */
export function registerExamensHandlers(handle) {
  // =============================
  // EXAMENS
  // =============================

  /**
   * Récupère la liste paginée des examens avec filtres.
   */
  handle('examens:getAll', async (event, params) => {
    return getAllExamens(params);
  });

  /**
   * Récupère un examen par son identifiant.
   */
  handle('examens:getById', async (event, id) => {
    return getExamenById(id);
  });

  /**
   * Crée un nouvel examen.
   */
  handle('examens:create', async (event, data) => {
    return createExamen(data);
  });

  /**
   * Met à jour un examen existant.
   */
  handle('examens:update', async (event, { id, data }) => {
    return updateExamen(id, data);
  });

  /**
   * Supprime définitivement un examen.
   */
  handle('examens:delete', async (event, id) => {
    return deleteExamen(id);
  });

  /**
   * Récupère les statistiques agrégées des examens.
   */
  handle('examens:getStats', async () => {
    return getExamensStats();
  });

  /**
   * Récupère les tendances évolutives des examens.
   */
  handle('examens:getTrends', async () => {
    return getExamensTrends();
  });

  /**
   * Récupère les données des sparklines (12 mois) pour les examens.
   */
  handle('examens:getSparklines', async () => {
    return getExamensSparklines();
  });

  /**
   * Récupère tous les examens d’un candidat.
   */
  handle('examens:getByCandidat', async (event, candidatId) => {
    return getExamensByCandidat(candidatId);
  });

  /**
   * Génère l’attestation (PDF) pour un examen réussi.
   */
  handle('examens:printCertificate', async (event, id) => {
    return printCertificate(id);
  });
}
