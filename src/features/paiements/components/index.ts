// src/features/paiements/components/index.ts

/**
 * @module features/paiements/components
 * @description
 * Composants pour la gestion des paiements : tableau, cartes statistiques.
 */

export { PaiementsStatsCards } from './PaiementsStatsCards';
export type { PaiementsStatsCardsProps, PaiementsSparklineData } from './PaiementsStatsCards';

export { PaiementsTable } from './PaiementsTable';
export type { PaiementsTableProps, PaiementsPeriodFilter } from './PaiementsTable';

export { PaiementsRecentCard } from './PaiementsRecentCard';
export type { PaiementsRecentCardProps } from './PaiementsRecentCard';
