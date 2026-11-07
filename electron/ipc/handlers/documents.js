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

  // Le renderer envoie un ArrayBuffer (clonage IPC) : le service attend un Buffer Node.
  const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
  handle('documents:upload', async (event, payload = {}) => {
    const raw = payload.buffer;
    let buffer;
    if (Buffer.isBuffer(raw)) buffer = raw;
    else if (raw instanceof ArrayBuffer) buffer = Buffer.from(raw);
    else if (ArrayBuffer.isView(raw)) buffer = Buffer.from(raw.buffer, raw.byteOffset, raw.byteLength);
    else throw new Error('Contenu du fichier invalide ou vide.');
    if (buffer.length === 0) throw new Error('Le fichier est vide.');
    if (buffer.length > MAX_UPLOAD_BYTES) throw new Error('Fichier trop volumineux (15 Mo maximum).');
    return uploadDocument({
      candidatId: Number(payload.candidatId),
      type: payload.type,
      buffer,
      originalName: String(payload.originalName ?? ''),
      mimeType: payload.mimeType,
    });
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
