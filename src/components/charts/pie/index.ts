/**
 * @module components/charts/pie
 * @description Exports du module de graphiques en secteurs  Auto-École COS.
 *
 * Un seul composant `VitaPieChart` couvre toutes les variantes :
 * - `"pie"`         : camembert plein
 * - `"donut"`       : anneau avec trou central et label optionnel
 * - `"interactive"` : anneau avec secteur actif animé (double anneau),
 *                     sélectable via clic ou `<Select>`
 *
 * @example
 * ```tsx
 * import { VitaPieChart } from "@/components/charts/pie"
 * ```
 */

export { VitaPieChart } from './PieChart';
export type { VitaPieChartProps, PieSlice, PieVariant } from './PieChart';
