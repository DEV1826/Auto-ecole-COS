/**
 * Handlers IPC — candidats.
 * Extrait de electron/main.js ; enregistrés via le wrapper sécurisé `handle`
 * (voir electron/ipc/security.js).
 *
 * @module electron/ipc/handlers/candidats
 */

import {
  createCandidat,
  getAll as getAllCandidats,
  getById as getCandidatById,
  updateCandidat,
  remove as removeCandidat,
  search as searchCandidats,
  updateStatus as updateCandidatStatus,
  getStats as getCandidatsStats,
  getTrends as getCandidatsTrends,
  getPaiements as getCandidatPaiements,
  getLecons as getCandidatLecons,
  getExamens as getCandidatExamens,
  getFactures as getCandidatFactures,
  getDocuments as getCandidatDocuments,
  addDocument as addCandidatDocument,
  deleteDocument as deleteCandidatDocument,
} from '../../services/candidat.service.js';

/**
 * @param {(channel: string, handler: Function) => void} handle
 * @param {object} helpers - Utilitaires partagés fournis par main.js
 */
export function registerCandidatsHandlers(handle) {
  // =============================
  // CANDIDATS
  // =============================

  handle('candidats:getAll', async (event, params) => {
    return getAllCandidats(params);
  });

  handle('candidats:getById', async (event, id) => {
    return getCandidatById(id);
  });

  handle('candidats:create', async (event, data) => {
    return createCandidat(data);
  });

  handle('candidats:update', async (event, { id, data }) => {
    return updateCandidat(id, data);
  });

  handle('candidats:delete', async (event, id) => {
    return removeCandidat(id);
  });

  handle('candidats:search', async (event, query) => {
    return searchCandidats(query);
  });

  handle('candidats:updateStatus', async (event, params) => {
    return updateCandidatStatus(params);
  });

  handle('candidats:getStats', async () => {
    return getCandidatsStats();
  });

  handle('candidats:getTrends', async () => {
    return await getCandidatsTrends();
  });

  handle('candidats:getPaiements', async (event, candidatId) => {
    return getCandidatPaiements(candidatId);
  });

  handle('candidats:getLecons', async (event, candidatId) => {
    return getCandidatLecons(candidatId);
  });

  handle('candidats:getExamens', async (event, candidatId) => {
    return getCandidatExamens(candidatId);
  });

  handle('candidats:getFactures', async (event, candidatId) => {
    return getCandidatFactures(candidatId);
  });

  handle('candidats:getDocuments', async (event, candidatId) => {
    return getCandidatDocuments(candidatId);
  });

  handle('candidats:addDocument', async (event, data) => {
    return addCandidatDocument(data);
  });

  handle('candidats:deleteDocument', async (event, docId) => {
    return deleteCandidatDocument(docId);
  });
}
