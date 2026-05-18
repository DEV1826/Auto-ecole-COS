// src/features/formations/components/index.ts

import FormationCreateForm from './FormationCreateForm';

/**
 * @module features/formations/components
 * @description
 * Composants pour la gestion des formations : tableau, cartes statistiques.
 */

export { FormationsStatsCards } from './FormationsStatsCards';
export { FormationsTable } from './FormationsTable';
export type { FormationsTableProps } from './FormationsTable';

export type { FormationsStatsCardsProps, FormationsSparklineData } from './FormationsStatsCards';

export { FormationTrendChart } from './FormationTrendChart';
export type { FormationTrendChartProps, FormationTrendDataPoint } from './FormationTrendChart';

export type { FormationFormProps } from './FormationCreateForm';
