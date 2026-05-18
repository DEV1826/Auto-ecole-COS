/**
 * @module features/documents/components
 * @description
 * Point d'entrée des composants du module Documents de l'auto-école COS.
 * Exporte tous les composants publics : table, statistiques et graphique.
 */

// ─── Table ────────────────────────────────────────────────────────────────────
export { DocumentsTable } from './DocumentsTable';
export type { DocumentsTableProps, DocumentsPeriodFilter } from './DocumentsTable';

// ─── Statistiques ─────────────────────────────────────────────────────────────
export { DocumentsStatsCards } from './DocumentsStatsCards';
export type { DocumentsStatsCardsProps, DocumentsSparklineData } from './DocumentsStatsCards';

// ─── Graphique interactif ─────────────────────────────────────────────────────
export { DocumentsChart } from './DocumentsChart';
export type { DocumentsChartProps } from './DocumentsChart';
