/**
 * @module components/charts/bar
 * @description Exports du module de graphiques en barres  Auto-École COS.
 *
 * Un seul composant `VitaBarChart` couvre toutes les variantes :
 * - `standard`    : barres simples
 * - `grouped`     : barres groupées côte à côte (multi-séries)
 * - `stacked`     : barres empilées (stackId auto-injecté)
 * - `horizontal`  : barres horizontales
 * - `interactive` : une série active à la fois avec totaux cliquables
 *
 * @example
 * ```tsx
 * import { VitaBarChart } from "@/components/charts/bar"
 * ```
 */

export { VitaBarChart } from './BarChart';
export type {
  VitaBarChartProps,
  BarSeries,
  BarVariant,
  BarReferenceLineConfig,
  PeriodOption,
} from './BarChart';
