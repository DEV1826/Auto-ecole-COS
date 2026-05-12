'use client';

/**
 * @module components/charts/pie/PieChart
 * @description
 * Composant de graphique en secteurs (pie / donut) ultra-complet.
 * Supporte les variantes : pie classique, donut, donut avec label central,
 * secteur actif animé (interactive), et mode "rose" (tailles variables).
 *
 * Pensé comme un élément de base réutilisable — ne contient pas de Card.
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @example
 * ```tsx
 * // Donut simple avec label central
 * <VitaPieChart
 *   data={[
 *     { name: "Hommes",  value: 420, color: "var(--chart-1)" },
 *     { name: "Femmes",  value: 380, color: "var(--chart-2)" },
 *     { name: "Enfants", value: 120, color: "var(--chart-3)" },
 *   ]}
 *   variant="donut"
 *   centerLabel="Patients"
 *   showLegend
 * />
 *
 * // Donut interactif (secteur sélectionnable)
 * <VitaPieChart
 *   data={data}
 *   variant="interactive"
 *   defaultActiveIndex={0}
 *   showLegend
 *   height={300}
 * />
 * ```
 */

import * as React from 'react';
import { Pie, PieChart, Cell, Sector, Label } from 'recharts';
import type { PieSectorDataItem } from 'recharts/types/polar/Pie';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @interface PieSlice
 * @description Entrée de données pour un secteur du graphique.
 */
export interface PieSlice {
  /** Libellé du secteur */
  name: string;
  /** Valeur numérique */
  value: number;
  /** Couleur CSS (variable ou hex/rgb) */
  color: string;
  /** Unité affichée dans le tooltip */
  unit?: string;
}

/**
 * @typedef {"pie" | "donut" | "interactive"} PieVariant
 * @description Variante visuelle.
 * - `pie`         : graphique en camembert plein
 * - `donut`       : anneau avec trou central (+ label central optionnel)
 * - `interactive` : anneau avec secteur sélectionnable (animation + double anneau)
 */
export type PieVariant = 'pie' | 'donut' | 'interactive';

/**
 * @interface VitaPieChartProps
 * @description Propriétés complètes du composant VitaPieChart.
 */
export interface VitaPieChartProps {
  // ── Données ────────────────────────────────────────────────
  /** Tableau des secteurs */
  data: PieSlice[];

  // ── Variante ───────────────────────────────────────────────
  /** Variante du graphique (défaut : "donut") */
  variant?: PieVariant;

  // ── Donut ──────────────────────────────────────────────────
  /** Rayon intérieur en % ou px (défaut : "55%" pour donut, 0 pour pie) */
  innerRadius?: number | string;
  /** Rayon extérieur en % ou px (défaut : "80%") */
  outerRadius?: number | string;
  /** Texte principal du label central (donut/interactive) */
  centerLabel?: string;
  /** Texte secondaire du label central */
  centerSubLabel?: string;
  /** Si true, affiche la somme totale au centre plutôt que la valeur du secteur actif */
  showTotalInCenter?: boolean;

  // ── Interactivité ──────────────────────────────────────────
  /** Index du secteur actif par défaut (variant="interactive") */
  defaultActiveIndex?: number;
  /** Sélecteur de secteur (variant="interactive") — affiche un <Select> au-dessus */
  showSliceSelector?: boolean;

  // ── Légende & Tooltip ──────────────────────────────────────
  /** Afficher la légende */
  showLegend?: boolean;
  /** Masquer le label dans le tooltip */
  hideTooltipLabel?: boolean;

  // ── Apparence ──────────────────────────────────────────────
  /** Épaisseur du trait entre les secteurs (défaut : 2) */
  strokeWidth?: number;
  /** Angle de début (défaut : -90 pour partir en haut) */
  startAngle?: number;
  /** Angle de fin (défaut : 270) */
  endAngle?: number;
  /** Padding entre les secteurs en degrés (défaut : 0) */
  paddingAngle?: number;

  // ── Dimensions ─────────────────────────────────────────────
  /** Hauteur en pixels (défaut : 250) */
  height?: number;

  // ── Style ──────────────────────────────────────────────────
  /** Classes CSS additionnelles */
  className?: string;
  /** ID unique pour ChartStyle (requis si plusieurs PieChart sur la même page) */
  chartId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Graphique en secteurs  Auto-École COS — composant de base ultra-complet.
 *
 * @param props - {@link VitaPieChartProps}
 */
export function VitaPieChart({
  data,
  variant = 'donut',
  innerRadius,
  outerRadius = '80%',
  centerLabel,
  centerSubLabel,
  showTotalInCenter = false,
  defaultActiveIndex = 0,
  showSliceSelector = false,
  showLegend = false,
  hideTooltipLabel = true,
  strokeWidth = 2,
  startAngle = -90,
  endAngle = 270,
  paddingAngle = 0,
  height = 252,
  className,
  chartId,
}: VitaPieChartProps): React.JSX.Element {
  const generatedId = React.useId().replace(/:/g, '_');
  const id = chartId ?? generatedId;

  // ── Secteur actif (mode interactive) ────────────────────
  const [activeName, setActiveName] = React.useState<string>(
    data[defaultActiveIndex]?.name ?? data[0]?.name ?? ''
  );
  const activeIndex = React.useMemo(
    () => data.findIndex((d) => d.name === activeName),
    [data, activeName]
  );

  // ── Config ────────────────────────────────────────────────
  const chartConfig = React.useMemo<ChartConfig>(
    () =>
      data.reduce<ChartConfig>((acc, slice) => {
        const safeKey = slice.name.toLowerCase().replace(/\s+/g, '_');
        acc[safeKey] = { label: slice.name, color: slice.color };
        return acc;
      }, {}),
    [data]
  );

  // ── Rayons selon variante ─────────────────────────────────
  const isPie = variant === 'pie';
  const isInteractive = variant === 'interactive';

  const resolvedInnerRadius = innerRadius ?? (isPie ? 0 : '55%');

  // ── Shape du secteur actif (interactive) ──────────────────
  const renderActiveShape = React.useCallback(
    (sectorData: PieSectorDataItem & { index?: number }) => {
      const { outerRadius: or = 0, index, ...props } = sectorData;
      if (index !== activeIndex) {
        return <Sector {...props} outerRadius={or} />;
      }
      return (
        <g>
          <Sector {...props} outerRadius={(or as number) + 10} />
          <Sector {...props} outerRadius={(or as number) + 25} innerRadius={(or as number) + 12} />
        </g>
      );
    },
    [activeIndex]
  );

  return (
    <div className={cn('w-full flex flex-col gap-2', className)}>
      {/* Sélecteur de secteur (interactive) */}
      {showSliceSelector && isInteractive && (
        <div className="flex justify-end">
          <Select value={activeName} onValueChange={setActiveName}>
            <SelectTrigger className="h-8 w-40 rounded-xs text-xs">
              <SelectValue placeholder="Secteur" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {data.map((slice) => (
                <SelectItem key={slice.name} value={slice.name} className="rounded-xs text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-xs shrink-0"
                      style={{ backgroundColor: slice.color }}
                    />
                    {slice.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* ChartStyle requis pour les couleurs dynamiques */}
      <ChartStyle id={id} config={chartConfig} />

      <ChartContainer id={id} config={chartConfig} style={{ height }}>
        <PieChart>
          {/* Tooltip */}
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel={hideTooltipLabel} />}
          />

          {/* Légende */}
          {showLegend && <ChartLegend content={<ChartLegendContent />} />}

          {/* Pie / Donut */}
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={resolvedInnerRadius}
            outerRadius={outerRadius}
            strokeWidth={strokeWidth}
            startAngle={startAngle}
            endAngle={endAngle}
            paddingAngle={paddingAngle}
            shape={isInteractive ? renderActiveShape : undefined}
            onClick={
              isInteractive
                ? (entry) => {
                    if (entry?.name) setActiveName(entry.name as string);
                  }
                : undefined
            }
          >
            {/* Couleur de chaque secteur */}
            {data.map((slice, i) => (
              <Cell key={`cell-${i}`} fill={slice.color} />
            ))}

            {/* Label central (donut / interactive) */}
            {!isPie && (centerLabel || showTotalInCenter || isInteractive) && (
              <Label
                content={({ viewBox }) => {
                  if (!viewBox || !('cx' in viewBox) || !('cy' in viewBox)) return null;
                  const { cx, cy } = viewBox as { cx: number; cy: number };

                  // On récupère la tranche actuellement active ou la première par défaut
                  const currentSlice = isInteractive ? data[activeIndex] : data[0];

                  // On affiche la valeur de la tranche (formatée)
                  const displayValue = currentSlice?.value.toLocaleString('fr-FR');

                  // On affiche le nom de la tranche comme label principal
                  const displayLabel = currentSlice?.name ?? centerLabel;

                  // Priorité à l'unité de la tranche, sinon le subLabel global
                  const unitLabel = currentSlice?.unit ?? centerSubLabel ?? '';

                  return (
                    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                      {displayValue !== undefined && (
                        <tspan
                          x={cx}
                          y={cy - 5} // Ajustement vertical pour centrer l'ensemble
                          className="fill-foreground text-2xl font-extrabold"
                        >
                          {displayValue}{' '}
                          {/* Affichage de l'unité ou du nom du secteur juste en dessous */}
                          {(unitLabel || displayLabel) && (
                            <span className="fill-muted-foreground text-xs font-medium uppercase tracking-wider">
                              {unitLabel ? `${unitLabel}` : displayLabel}
                            </span>
                          )}
                        </tspan>
                      )}

                      {/* Affichage de l'unité ou du nom du secteur juste en dessous */}
                      {(unitLabel || displayLabel) && (
                        <tspan
                          x={cx}
                          y={cy + 20}
                          className="fill-muted-foreground text-xs font-medium uppercase tracking-wider"
                        >
                          {unitLabel ? `${unitLabel}` : displayLabel}
                        </tspan>
                      )}
                    </text>
                  );
                }}
              />
            )}
          </Pie>
        </PieChart>
      </ChartContainer>
    </div>
  );
}
