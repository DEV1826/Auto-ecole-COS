// src/components/tables/audit-logs/index.ts

/**
 * @module tables/audit-logs/index
 * @description
 * Point d’entrée pour les colonnes du tableau des logs d’audit.
 * Exporte les deux variantes (`admin`, `auditor`) ainsi que la fonction générique.
 *
 * @author Stive Junior
 * @version 1.0.0
 */

export {
  getAuditLogsColumns,
  getAdminAuditLogsColumns,
  getAuditorAuditLogsColumns,
} from './audit-logs-columns';
