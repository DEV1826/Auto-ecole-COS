/**
 * Handlers IPC — admin.
 * Extrait de electron/main.js ; enregistrés via le wrapper sécurisé `handle`
 * (voir electron/ipc/security.js).
 *
 * @module electron/ipc/handlers/admin
 */

import fs from 'node:fs';
import path from 'node:path';
import { exportPaiementsReport } from '../../services/paiement.service.js';
import { exportExamensReport } from '../../services/examen.service.js';
import {
  getAuditLogs,
  getAdminStats,
  getAdminTrends,
  getCompanyConfig,
  updateCompanyConfig,
} from '../../services/admin.service.js';
import { globalSearch } from '../../services/globalSearch.service.js';

const { app, shell } = globalThis.__ELECTRON_MAIN__ ?? {};

/**
 * @param {(channel: string, handler: Function) => void} handle
 * @param {object} helpers - Utilitaires partagés fournis par main.js
 */
export function registerAdminHandlers(
  handle,
  { getExportService, getRecuService, createExportTimestamp } = {}
) {
  // =============================
  // ADMIN — Logs d'audit & config entreprise
  // =============================

  /**
   * Handler : récupère la liste paginée des logs d'audit.
   * @param {Electron.IpcMainInvokeEvent} event - Événement IPC
   * @param {AuditLogsListParams} params - Paramètres de pagination/filtres
   * @returns {Promise<AuditLogsPaginatedResponse>}
   */
  handle('admin:getAuditLogs', async (event, params) => {
    return getAuditLogs(params);
  });

  /**
   * Handler : récupère les statistiques agrégées des logs d'audit.
   * @returns {Promise<AdminStats>}
   */
  handle('admin:getAdminStats', async () => {
    return getAdminStats();
  });

  /**
   * Handler : récupère les tendances évolutives des logs d'audit.
   * @returns {Promise<AdminTrends>}
   */
  handle('admin:getAdminTrends', async () => {
    return getAdminTrends();
  });

  /**
   * Handler : récupère la configuration de l'entreprise.
   * @returns {Promise<CompanyConfig>}
   */
  handle('admin:getCompanyConfig', async () => {
    return getCompanyConfig();
  });

  /**
   * Handler : met à jour la configuration de l'entreprise.
   * @param {Electron.IpcMainInvokeEvent} event
   * @param {UpdateCompanyConfigInput} data - Champs à modifier
   * @returns {Promise<CompanyConfig>}
   */
  handle('admin:updateCompanyConfig', async (event, data) => {
    return updateCompanyConfig(data);
  });

  handle('globalSearch:search', async (event, query) => {
    return globalSearch(query);
  });

  handle('recu:list', async () => {
    const recuService = await getRecuService();
    return recuService.getAll();
  });
  handle('recu:get', async (_event, id) => {
    const recuService = await getRecuService();
    return recuService.getById(id);
  });
  handle('recu:export', async (_event, id) => {
    const recuService = await getRecuService();
    return recuService.exportReceipt(id);
  });

  handle('export:recu', async (_event, payload) => {
    const exportService = await getExportService();
    return exportService.exportFactures(payload);
  });
  handle('export:bilan', async (_event, payload) => {
    const exportService = await getExportService();
    return exportService.exportDashboardSnapshot(payload);
  });
  handle('export:excel', async (_event, payload) => {
    const exportService = await getExportService();
    return exportService.exportFactures(payload);
  });
  handle('export:openFolder', async () => {
    const exportService = await getExportService();
    const exportDir = await exportService.getExportDirectory();
    await shell.openPath(exportDir);
    return { path: exportDir };
  });
  handle('exports:dashboard', async (_event, payload) => {
    const exportService = await getExportService();
    return exportService.exportDashboardSnapshot(payload);
  });
  handle('exports:saveFile', async (_event, payload = {}) => {
    const { folder = 'general', baseName = 'export', extension = 'csv', content = '' } = payload;

    // Le fichier est ensuite ouvert avec l'application associée : on n'autorise
    // que des formats de données et des noms sans séparateur de chemin.
    const ALLOWED_EXTENSIONS = new Set(['csv', 'txt', 'json', 'tsv']);
    const ext = String(extension).replace(/^\./, '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      throw new Error(`Format d'export non autorisé : ${ext}`);
    }
    const safe = (value, fallback) =>
      String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Za-z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60) || fallback;
    if (typeof content !== 'string' || content.length > 20 * 1024 * 1024) {
      throw new Error("Contenu d'export invalide.");
    }

    const exportDir = path.join(app.getPath('documents'), 'Auto-Ecole COS', 'exports', safe(folder, 'general'));
    await fs.promises.mkdir(exportDir, { recursive: true });

    const filePath = path.join(exportDir, `${safe(baseName, 'export')}-${createExportTimestamp()}.${ext}`);

    await fs.promises.writeFile(filePath, content, 'utf8');
    await shell.openPath(filePath);

    return { success: true, path: filePath };
  });
  handle('exports:factures', async (_event, payload) => {
    const exportService = await getExportService();
    return exportService.exportFactures(payload);
  });
  handle('exports:paiements', async (_event, payload) => {
    return exportPaiementsReport(payload);
  });
  handle('exports:examens', async (_event, payload) => {
    return exportExamensReport(payload);
  });
}
