/**
 * @module components/charts/radials
 * @description Exports du module de graphiques radiaux  Auto-École COS.
 *
 * `VitaRadialChart` supporte trois variantes :
 *
 * - `"single"`  : un seul arc remplissant une portion du cercle.
 *   Parfait pour afficher un KPI unique (taux d'occupation, score, %).
 *   Supporte un label central personnalisé.
 *
 * - `"stacked"` : plusieurs arcs concentriques empilés.
 *   Idéal pour comparer plusieurs catégories sur la même échelle.
 *
 * - `"grid"`    : grille de mini-graphiques radiaux individuels.
 *   Chaque item affiche son propre pourcentage au centre.
 *   Pratique pour un aperçu multi-indicateurs compact.
 *
 * @example
 * ```tsx
 * import { VitaRadialChart } from "@/components/charts/radials"
 * ```
 */

export { VitaRadialChart } from './RadialChart';
export type { VitaRadialChartProps, RadialSlice, RadialVariant } from './RadialChart';
