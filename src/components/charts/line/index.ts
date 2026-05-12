/**
 * @module components/charts/line
 * @description Exports du module de graphiques en courbes  Auto-École COS.
 *
 * Un seul composant `VitaLineChart` couvre toutes les variantes via la prop `variant` :
 * - `"monotone"` : courbe lisse (Catmull-Rom, par défaut)
 * - `"linear"`   : droites entre les points
 * - `"step"`     : escalier
 * - `"natural"`  : spline naturelle
 *
 * Fonctionnalités avancées disponibles via les props :
 * - Double axe Y (gauche + droite) pour métriques d'unités différentes
 * - Affichage des points (`showDots`)
 * - Traits en pointillés ou tirets par série (`strokeStyle`)
 * - Lignes de référence horizontales
 * - Filtre de période intégré
 * - Connexion des valeurs nulles (`connectNulls`)
 *
 * @example
 * ```tsx
 * import { VitaLineChart } from "@/components/charts/line"
 * ```
 */

export { VitaLineChart } from './LineChart';
export type {
  VitaLineChartProps,
  LineSeries,
  LineVariant,
  LineReferenceConfig,
  PeriodOption,
} from './LineChart';
