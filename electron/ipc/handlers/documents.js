/**
 * Handlers IPC — documents.
 * Extrait de electron/main.js ; enregistrés via le wrapper sécurisé `handle`
 * (voir electron/ipc/security.js).
 *
 * @module electron/ipc/handlers/documents
 */

import {
  getAllDocuments,
  getDocumentById,
  getDocumentsStats,
  getDocumentsTrends,
  getDocumentsSparklines,
  deleteDocument,
  downloadDocument,
  openDocument,
  uploadDocument,
} from '../../services/documents.service.js';

/**
 * @param {(channel: string, handler: Function) => void} handle
 * @param {object} helpers - Utilitaires partagés fournis par main.js
 */
export function registerDocumentsHandlers(handle, { printPdfFile } = {}) {
  // =============================
  // DOCUMENTS
  // =============================

  handle('documents:upload', async (event, payload) => {
    return uploadDocument(payload);
  });
  handle('documents:getAll', async (event, params) => {
    return getAllDocuments(params);
  });

  handle('documents:getById', async (event, id) => {
    return getDocumentById(id);
  });

  handle('documents:getStats', async () => {
    return getDocumentsStats();
  });

  handle('documents:getTrends', async () => {
    return getDocumentsTrends();
  });

  handle('documents:getSparklines', async () => {
    return getDocumentsSparklines();
  });

  handle('documents:delete', async (event, id) => {
    return deleteDocument(id);
  });

  handle('documents:download', async (event, id) => {
    return downloadDocument(id);
  });

  handle('documents:open', async (event, { chemin }) => {
    return openDocument(chemin);
  });

  handle('documents:print', async (_event, { chemin, title }) => {
    return printPdfFile(chemin, title);
  });
}
