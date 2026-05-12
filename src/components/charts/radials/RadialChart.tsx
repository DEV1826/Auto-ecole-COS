'use client';

/**
 * @module components/charts/radials/RadialChart
 * @description
 * Composant de graphique radial (barres en arc) ultra-complet.
 * Idéal pour visualiser un taux, une progression, un score ou une comparaison
 * entre plusieurs catégories disposées en anneaux concentriques.
 *
 * Supporte les variantes :
 * - `"single"`  : un seul arc (ex: taux de remplissage, score global)
 * - `"stacked"` : plusieurs arcs concentriques (ex: comparaison multi-catégories)
 * - `"grid"`    : grille de petits graphiques radiaux individuels (mini-radials)
 *
 * Pensé comme un élément de base réutilisable — ne contient pas de Card.
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @example
 * ```tsx
 * // Radial simple — taux d'occupation
 * <VitaRadialChart
 *   data={[{ name: "Lits occupés", value: 73, color: "var(--chart-1)" }]}
 *   variant="single"
 *   maxValue={100}
 *   centerLabel="73%"
 *   centerSubLabel="Occupation"
 * />
 *
 * // Radial empilé — comparaison multi-services
 * <VitaRadialChart
 *   data={[
 *     { name: "Cardiologie",  value: 85, color: "var(--chart-1)" },
 *     { name: "Neurologie",   value: 62, color: "var(--chart-2)" },
 *     { name: "Pédiatrie",    value: 78, color: "var(--chart-3)" },
 *     { name: "Urgences",     value: 91, color: "var(--chart-4)" },
 *   ]}
 *   variant="stacked"
 *   maxValue={100}
 *   showLegend
 * />
 * ```
 */

import * as React from 'react';
import { RadialBar, RadialBarChart, PolarRadiusAxis, Label } from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @interface RadialSlice
 * @description Entrée de données pour un arc radial.
 */
export interface RadialSlice {
  /** Libellé de l'arc */
  name: string;
  /** Valeur (doit être dans [0, maxValue]) */
  value: number;
  /** Couleur CSS */
  color: string;
  /** Unité affichée dans le tooltip (ex: "%", "patients") */
  unit?: string;
}

/**
 * @typedef {"single" | "stacked" | "grid"} RadialVariant
 * @description Variante du graphique radial.
 */
export type RadialVariant = 'single' | 'stacked' | 'grid';

/**
 * @interface VitaRadialChartProps
 * @description Propriétés complètes du composant VitaRadialChart.
 */
export interface VitaRadialChartProps {
  // ── Données ────────────────────────────────────────────────
  /** Tableau des arcs */
  data: RadialSlice[];
  /** Valeur maximale de référence (défaut : 100) */
  maxValue?: number;

  // ── Variante ───────────────────────────────────────────────
  /** Variante du graphique (défaut : "single") */
  variant?: RadialVariant;

  // ── Label central ──────────────────────────────────────────
  /** Texte principal au centre (single uniquement) */
  centerLabel?: string;
  /** Texte secondaire au centre */
  centerSubLabel?: string;

  // ── Arc ────────────────────────────────────────────────────
  /** Rayon intérieur en % (défaut : "60%" pour single, "30%" pour stacked) */
  innerRadius?: number | string;
  /** Rayon extérieur en % (défaut : "90%") */
  outerRadius?: number | string;
  /** Angle de début en degrés (défaut : -90) */
  startAngle?: number;
  /** Angle de fin en degrés (défaut : 90) */
  endAngle?: number;
  /** Afficher l'arrière-plan des arcs (arc grisé) */
  showBackground?: boolean;
  /** Rayon des extrémités : "round" | "square" (défaut : "round") */
  cornerRadius?: number;

  // ── Légende & Tooltip ──────────────────────────────────────
  /** Afficher la légende */
  showLegend?: boolean;
  /** Masquer le label dans le tooltip */
  hideTooltipLabel?: boolean;

  // ── Grille (variant="grid") ────────────────────────────────
  /**
   * Nombre de colonnes dans la grille (variant="grid").
   * Défaut : 2 si data.length <= 4, sinon 3.
   */
  gridCols?: number;
  /** Hauteur des mini-graphiques dans la grille (défaut : 120) */
  gridItemHeight?: number;

  // ── Dimensions ─────────────────────────────────────────────
  /** Hauteur en pixels (défaut : 250, ignoré en mode "grid") */
  height?: number;
  /** Classes CSS additionnelles */
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composant : mini radial pour le mode "grid"
// ─────────────────────────────────────────────────────────────────────────────

interface MiniRadialProps {
  slice: RadialSlice;
  maxValue: number;
  height: number;
  cornerRadius: number;
  showBackground: boolean;
}

/**
 * Mini graphique radial individuel (utilisé dans le mode "grid").
 * @internal
 */
function MiniRadial({
  slice,
  maxValue,
  height,
  cornerRadius,
  showBackground,
}: MiniRadialProps): React.JSX.Element {
  const config: ChartConfig = {
    [slice.name]: { label: slice.name, color: slice.color },
  };
  const percentage = Math.round((slice.value / maxValue) * 100);

  return (
    <div className="flex flex-col items-center gap-1">
      <ChartContainer config={config} style={{ height, width: height }} className="mx-auto">
        <RadialBarChart
          data={[{ ...slice, fill: slice.color }]}
          startAngle={90}
          endAngle={90 - 360 * (slice.value / maxValue)}
          innerRadius="60%"
          outerRadius="90%"
        >
          <RadialBar
            dataKey="value"
            background={showBackground ? { fill: 'var(--muted)' } : false}
            cornerRadius={cornerRadius}
          />
          <PolarRadiusAxis tick={false} axisLine={false} />
          <Label
            content={({ viewBox }) => {
              if (!viewBox || !('cx' in viewBox) || !('cy' in viewBox)) return null;
              const { cx, cy } = viewBox as { cx: number; cy: number };
              return (
                <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                  <tspan x={cx} y={cy} className="fill-foreground text-sm font-bold">
                    {percentage}%
                  </tspan>
                </text>
              );
            }}
          />
        </RadialBarChart>
      </ChartContainer>
      <span className="text-xs text-muted-foreground text-center leading-tight">{slice.name}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Graphique radial  Auto-École COS — composant de base ultra-complet.
 *
 * @param props - {@link VitaRadialChartProps}
 */
export function VitaRadialChart({
  data,
  maxValue = 100,
  variant = 'single',
  centerLabel,
  centerSubLabel,
  innerRadius,
  outerRadius = '90%',
  startAngle = 90,
  endAngle,
  showBackground = true,
  cornerRadius = 8,
  showLegend = false,
  hideTooltipLabel = true,
  gridCols,
  gridItemHeight = 120,
  height = 250,
  className,
}: VitaRadialChartProps): React.JSX.Element {
  // ── Config ────────────────────────────────────────────────
  const chartConfig = React.useMemo<ChartConfig>(
    () =>
      data.reduce<ChartConfig>((acc, s) => {
        acc[s.name] = { label: s.name, color: s.color };
        return acc;
      }, {}),
    [data]
  );

  // ── Mode GRID ─────────────────────────────────────────────
  if (variant === 'grid') {
    const cols = gridCols ?? (data.length <= 4 ? 2 : 3);
    return (
      <div
        className={cn('w-full grid gap-4', className)}
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {data.map((slice) => (
          <MiniRadial
            key={slice.name}
            slice={slice}
            maxValue={maxValue}
            height={gridItemHeight}
            cornerRadius={cornerRadius}
            showBackground={showBackground}
          />
        ))}
      </div>
    );
  }

  // ── Mode SINGLE ───────────────────────────────────────────
  if (variant === 'single') {
    const slice = data[0];
    if (!slice) return <div />;

    const pct = Math.round((slice.value / maxValue) * 100);
    const resolvedEnd = endAngle ?? 90 - 360 * (slice.value / maxValue);
    const resolvedInner = innerRadius ?? '60%';
    const singleConfig: ChartConfig = {
      [slice.name]: { label: slice.name, color: slice.color },
    };

    return (
      <div className={cn('w-full', className)}>
        <ChartContainer config={singleConfig} style={{ height }} className="w-full">
          <RadialBarChart
            data={[{ ...slice, fill: slice.color }]}
            startAngle={startAngle}
            endAngle={resolvedEnd}
            innerRadius={resolvedInner}
            outerRadius={outerRadius}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel={hideTooltipLabel} indicator="dot" />}
            />
            <RadialBar
              dataKey="value"
              background={showBackground ? { fill: 'var(--muted)' } : false}
              cornerRadius={cornerRadius}
            />
            <PolarRadiusAxis tick={false} axisLine={false} />
            {(centerLabel || centerSubLabel) && (
              <Label
                content={({ viewBox }) => {
                  if (!viewBox || !('cx' in viewBox) || !('cy' in viewBox)) return null;
                  const { cx, cy } = viewBox as { cx: number; cy: number };
                  return (
                    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                      <tspan
                        x={cx}
                        y={centerSubLabel ? cy - 10 : cy}
                        className="fill-foreground text-2xl font-bold"
                      >
                        {centerLabel ?? `${pct}%`}
                      </tspan>
                      {centerSubLabel && (
                        <tspan x={cx} y={cy + 16} className="fill-muted-foreground text-xs">
                          {centerSubLabel}
                        </tspan>
                      )}
                    </text>
                  );
                }}
              />
            )}
          </RadialBarChart>
        </ChartContainer>
      </div>
    );
  }

  // ── Mode STACKED ──────────────────────────────────────────
  const resolvedInner = innerRadius ?? '30%';
  const resolvedEnd = endAngle ?? -90;

  // Recharts RadialBarChart empilé : chaque entrée est un arc
  const stackedData = data.map((s) => ({
    ...s,
    fill: s.color,
    max: maxValue,
  }));

  return (
    <div className={cn('w-full', className)}>
      <ChartContainer config={chartConfig} style={{ height }} className="w-full">
        <RadialBarChart
          data={stackedData}
          startAngle={startAngle}
          endAngle={resolvedEnd}
          innerRadius={resolvedInner}
          outerRadius={outerRadius}
          barSize={12}
        >
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel={hideTooltipLabel} indicator="dot" />}
          />
          {showLegend && <ChartLegend content={<ChartLegendContent />} />}
          <PolarRadiusAxis tick={false} axisLine={false} domain={[0, maxValue]} />
          <RadialBar
            dataKey="value"
            background={showBackground ? { fill: 'var(--muted)' } : false}
            cornerRadius={cornerRadius}
          />
        </RadialBarChart>
      </ChartContainer>
    </div>
  );
}
