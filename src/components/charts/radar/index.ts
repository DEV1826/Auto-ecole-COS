/**
 * @module components/charts/radar
 * @description Exports du module de graphiques radar  Auto-École COS.
 *
 * `VitaRadarChart` supporte :
 * - Mono-série et multi-séries superposées
 * - Grille polygonale ou circulaire
 * - Axe radial avec valeurs numériques
 * - Remplissage configurable par série
 * - Points sur les sommets
 *
 * @example
 * ```tsx
 * import { VitaRadarChart } from "@/components/charts/radar"
 * ```
 */

export { VitaRadarChart } from './RadarChart';
export type { VitaRadarChartProps, RadarSeries } from './RadarChart';
