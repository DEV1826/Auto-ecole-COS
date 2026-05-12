/**
 * @module components/charts/area
 * @description Exports du module de graphiques en aire  Auto-École COS.
 *
 * Un seul composant `VitaAreaChart` couvre toutes les variantes :
 * - `standard`  : aire naturelle avec remplissage uni
 * - `gradient`  : aire avec dégradé vertical (du trait vers transparent)
 * - `linear`    : droites entre les points
 * - `step`      : escalier
 *
 * Toutes les options (axes, légende, filtre de période, empilage,
 * lignes de référence, multi-séries) sont contrôlées via les props.
 *
 * @example
 * ```tsx
 * import { VitaAreaChart } from "@/components/charts/area"
 * ```
 */

export { VitaAreaChart } from './AreaChart';
export type {
  VitaAreaChartProps,
  AreaSeries,
  AreaVariant,
  PeriodOption,
  ReferenceLineConfig,
} from './AreaChart';
