/**
 * @module components/charts
 * @description
 * Point d'entrée unique pour tous les composants de graphiques  Auto-École COS.
 *
 * Chaque composant est un élément de base réutilisable, sans Card ni layout.
 * Les données sont injectées entièrement via les props.
 *
 * ## Composants disponibles
 *
 * | Composant         | Module              | Variantes principales                                   |
 * |-------------------|---------------------|---------------------------------------------------------|
 * | `VitaAreaChart`   | `charts/area`       | `standard`, `gradient`, `linear`, `step`                |
 * | `VitaBarChart`    | `charts/bar`        | `standard`, `grouped`, `stacked`, `horizontal`, `interactive` |
 * | `VitaLineChart`   | `charts/line`       | `monotone`, `linear`, `step`, `natural`                 |
 * | `VitaPieChart`    | `charts/pie`        | `pie`, `donut`, `interactive`                           |
 * | `VitaRadarChart`  | `charts/radar`      | mono-série, multi-séries superposées                    |
 * | `VitaRadialChart` | `charts/radials`    | `single`, `stacked`, `grid`                             |
 *
 * ## Import recommandé
 *
 * ```tsx
 * // Import depuis le barrel (tous les charts)
 * import {
 *   VitaAreaChart,
 *   VitaBarChart,
 *   VitaLineChart,
 *   VitaPieChart,
 *   VitaRadarChart,
 *   VitaRadialChart,
 * } from "@/components/charts"
 *
 * // Import ciblé (tree-shaking optimal)
 * import { VitaAreaChart } from "@/components/charts/area"
 * import { VitaBarChart }  from "@/components/charts/bar"
 * ```
 *
 * ## Principe de conception
 *
 * Ces composants n'encapsulent **pas** de Card ShadCN.
 * Le composant parent (dashboard widget, page, modal) est libre
 * d'utiliser `<Card>`, un simple `<div>`, ou tout autre conteneur.
 *
 * Les couleurs utilisent exclusivement les variables CSS du thème
 * (`var(--chart-1)` … `var(--chart-5)`, `var(--muted)`, etc.)
 * pour s'adapter automatiquement au mode clair/sombre.
 */

// ── Area ──────────────────────────────────────────────────────────────────────
export { VitaAreaChart } from './area';
export type {
  VitaAreaChartProps,
  AreaSeries,
  AreaVariant,
  PeriodOption as AreaPeriodOption,
  ReferenceLineConfig as AreaReferenceLineConfig,
} from './area';

// ── Bar ───────────────────────────────────────────────────────────────────────
export { VitaBarChart } from './bar';
export type {
  VitaBarChartProps,
  BarSeries,
  BarVariant,
  BarReferenceLineConfig,
  PeriodOption as BarPeriodOption,
} from './bar';

// ── Line ──────────────────────────────────────────────────────────────────────
export { VitaLineChart } from './line';
export type {
  VitaLineChartProps,
  LineSeries,
  LineVariant,
  LineReferenceConfig,
  PeriodOption as LinePeriodOption,
} from './line';

// ── Pie ───────────────────────────────────────────────────────────────────────
export { VitaPieChart } from './pie';
export type { VitaPieChartProps, PieSlice, PieVariant } from './pie';

// ── Radar ─────────────────────────────────────────────────────────────────────
export { VitaRadarChart } from './radar';
export type { VitaRadarChartProps, RadarSeries } from './radar';

// ── Radials ───────────────────────────────────────────────────────────────────
export { VitaRadialChart } from './radials';
export type { VitaRadialChartProps, RadialSlice, RadialVariant } from './radials';
