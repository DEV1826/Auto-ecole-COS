'use client';

/**
 * @module components/charts/bar/BarChart
 * @description
 * Composant de graphique en barres ultra-complet et hautement personnalisable.
 * Supporte les variantes : standard, empilé (stacked), groupé, horizontal,
 * interactif (sélection de série active), avec icônes dans le tooltip.
 *
 * Pensé comme un élément de base réutilisable — ne contient pas de Card.
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @example
 * ```tsx
 * // Barres simples
 * <VitaBarChart
 *   data={data}
 *   series={[{ key: "consultations", label: "Consultations", color: "var(--chart-1)" }]}
 *   categoryKey="month"
 * />
 *
 * // Barres groupées avec axes, radius et filtre de période
 * <VitaBarChart
 *   data={data}
 *   series={[
 *     { key: "newPatients",      label: "Nouveaux patients",  color: "var(--chart-1)" },
 *     { key: "returnPatients",   label: "Patients récurrents",color: "var(--chart-2)" },
 *   ]}
 *   categoryKey="week"
 *   variant="grouped"
 *   showAxes
 *   showLegend
 *   barRadius={4}
 *   showPeriodFilter
 *   height={300}
 * />
 *
 * // Mode interactif (sélection de la série active via boutons)
 * <VitaBarChart
 *   data={data}
 *   series={series}
 *   categoryKey="date"
 *   variant="interactive"
 *   showPeriodFilter
 * />
 * ```
 */

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ReferenceLine } from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
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
import type { LucideIcon } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @interface BarSeries
 * @description Définition d'une série de barres.
 */
export interface BarSeries {
  /** Clé dans l'objet de données */
  key: string;
  /** Libellé affiché dans la légende et le tooltip */
  label: string;
  /** Couleur CSS (variable CSS ou valeur hex/rgb) */
  color: string;
  /** Unité affichée dans le tooltip (ex: "patients", "%") */
  unit?: string;
  /** Icône Lucide affichée dans le tooltip à côté du libellé */
  icon?: LucideIcon;
  /**
   * Identifiant de stack pour les barres empilées.
   * Les séries partageant le même stackId seront empilées.
   */
  stackId?: string;
  /** Rayon des coins des barres (surcharge le prop global) */
  radius?: number | [number, number, number, number];
}

/**
 * @typedef {"standard" | "grouped" | "stacked" | "horizontal" | "interactive"} BarVariant
 * @description Variante visuelle du graphique en barres.
 * - `standard`    : barres simples (une série)
 * - `grouped`     : barres côte à côte (multi-séries)
 * - `stacked`     : barres empilées (multi-séries, stackId auto-injecté)
 * - `horizontal`  : barres horizontales (layout="vertical" dans Recharts)
 * - `interactive` : une série active à la fois, sélectionnable via boutons avec totaux
 */
export type BarVariant = 'standard' | 'grouped' | 'stacked' | 'horizontal' | 'interactive';

/**
 * @interface BarReferenceLineConfig
 * @description Ligne de référence sur le graphique.
 */
export interface BarReferenceLineConfig {
  /** Valeur Y (ou X si horizontal) */
  value: number;
  /** Libellé affiché sur la ligne */
  label?: string;
  /** Couleur (défaut : var(--destructive)) */
  color?: string;
  /** Pointillés SVG (défaut : "4 4") */
  strokeDasharray?: string;
}

/**
 * @interface PeriodOption
 * @description Option du sélecteur de période.
 */
export interface PeriodOption {
  label: string;
  value: string;
}

/**
 * @interface VitaBarChartProps
 * @description Propriétés complètes du composant VitaBarChart.
 */
export interface VitaBarChartProps {
  // ── Données ────────────────────────────────────────────────
  /** Tableau de données brutes */
  data: Record<string, unknown>[];
  /** Définitions des séries */
  series: BarSeries[];
  /** Clé de catégorie pour l'axe X (ex: "month", "date", "week") */
  categoryKey?: string;

  // ── Variante ───────────────────────────────────────────────
  /** Variante du graphique (défaut : "standard") */
  variant?: BarVariant;

  // ── Axes ───────────────────────────────────────────────────
  /** Afficher les axes (défaut : false) */
  showAxes?: boolean;
  /** Nombre de graduations sur l'axe Y (défaut : 4) */
  yTickCount?: number;
  /** Formateur pour les labels de l'axe X */
  xTickFormatter?: (value: string) => string;
  /** Formateur pour les labels de l'axe Y */
  yTickFormatter?: (value: number) => string;
  /** Afficher la grille (défaut : true) */
  showGrid?: boolean;
  /** Grille uniquement horizontale */
  gridHorizontalOnly?: boolean;

  // ── Barres ─────────────────────────────────────────────────
  /** Rayon des coins des barres (défaut : 4) */
  barRadius?: number | [number, number, number, number];
  /** Taille des barres en pixels (défaut : auto) */
  barSize?: number;
  /** Espacement entre les groupes de barres (défaut : 0.2) */
  barCategoryGap?: number | string;
  /** Espacement entre les barres d'un groupe (défaut : 4) */
  barGap?: number;

  // ── Légende & Tooltip ──────────────────────────────────────
  /** Afficher la légende (défaut : false) */
  showLegend?: boolean;
  /** Masquer le label dans le tooltip (utile pour variant="stacked") */
  hideTooltipLabel?: boolean;
  /** Formateur du label du tooltip */
  tooltipLabelFormatter?: (value: string) => string;
  /** Indicateur du tooltip */
  tooltipIndicator?: 'line' | 'dot' | 'dashed';

  // ── Filtre de période ──────────────────────────────────────
  /** Afficher le sélecteur de période */
  showPeriodFilter?: boolean;
  /** Options du sélecteur de période */
  periodOptions?: PeriodOption[];
  /** Période par défaut */
  defaultPeriod?: string;
  /** Fonction de filtrage personnalisée */
  onPeriodChange?: (period: string, data: Record<string, unknown>[]) => Record<string, unknown>[];

  // ── Lignes de référence ────────────────────────────────────
  /** Lignes de référence */
  referenceLines?: BarReferenceLineConfig[];

  // ── Mode interactif ────────────────────────────────────────
  /** Série active initialement (variant="interactive", défaut : première série) */
  defaultActiveSeries?: string;

  // ── Dimensions ─────────────────────────────────────────────
  /** Hauteur en pixels (défaut : 250) */
  height?: number;
  /** Marges internes */
  margin?: { top?: number; right?: number; bottom?: number; left?: number };

  // ── Style ──────────────────────────────────────────────────
  /** Classes CSS additionnelles */
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Filtre les données par période (N derniers jours depuis la dernière date).
 * @internal
 */
function filterByPeriod(
  data: Record<string, unknown>[],
  period: string,
  categoryKey: string
): Record<string, unknown>[] {
  const daysMap: Record<string, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '6m': 180,
    '1y': 365,
  };
  const days = daysMap[period];
  if (!days) return data;

  const dates = data
    .map((d) => new Date(d[categoryKey] as string))
    .filter((d) => !isNaN(d.getTime()));
  if (dates.length === 0) return data;

  const refDate = new Date(Math.max(...dates.map((d) => d.getTime())));
  const startDate = new Date(refDate);
  startDate.setDate(startDate.getDate() - days);

  return data.filter((d) => {
    const date = new Date(d[categoryKey] as string);
    return !isNaN(date.getTime()) && date >= startDate;
  });
}

/**
 * Retourne le radius de barre pour chaque position dans un stack ou une barre simple.
 * @internal
 */
function resolveRadius(
  radius: number | [number, number, number, number] | undefined,
  isTop: boolean,
  isBottom: boolean,
  isStacked: boolean
): [number, number, number, number] {
  const r = typeof radius === 'number' ? radius : 4;
  if (!isStacked) {
    return [r, r, r, r];
  }
  // Empilé : arrondir seulement la top de la dernière barre et la bottom de la première
  return [isTop ? r : 0, isTop ? r : 0, isBottom ? r : 0, isBottom ? r : 0];
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Graphique en barres  Auto-École COS — composant de base ultra-complet.
 *
 * @param props - {@link VitaBarChartProps}
 */
export function VitaBarChart({
  data,
  series,
  categoryKey = 'date',
  variant = 'standard',
  showAxes = false,
  yTickCount = 4,
  xTickFormatter,
  yTickFormatter,
  showGrid = true,
  gridHorizontalOnly = false,
  barRadius = 4,
  barSize,
  barCategoryGap = '20%',
  barGap = 4,
  showLegend = false,
  hideTooltipLabel = false,
  tooltipLabelFormatter,
  tooltipIndicator = 'dot',
  showPeriodFilter = false,
  periodOptions = [
    { label: '7 jours', value: '7d' },
    { label: '30 jours', value: '30d' },
    { label: '3 mois', value: '90d' },
  ],
  defaultPeriod,
  onPeriodChange,
  referenceLines = [],
  defaultActiveSeries,
  height = 250,
  margin,
  className,
}: VitaBarChartProps): React.JSX.Element {
  // ── État ──────────────────────────────────────────────────
  const [period, setPeriod] = React.useState<string>(
    defaultPeriod ?? periodOptions[0]?.value ?? '90d'
  );
  const [activeSeries, setActiveSeries] = React.useState<string>(
    defaultActiveSeries ?? series[0]?.key ?? ''
  );

  // ── Données filtrées ──────────────────────────────────────
  const filteredData = React.useMemo(() => {
    if (!showPeriodFilter) return data;
    if (onPeriodChange) return onPeriodChange(period, data);
    return filterByPeriod(data, period, categoryKey);
  }, [data, period, showPeriodFilter, onPeriodChange, categoryKey]);

  // ── Totaux pour mode interactif ───────────────────────────
  const totals = React.useMemo(() => {
    return series.reduce<Record<string, number>>((acc, s) => {
      acc[s.key] = filteredData.reduce((sum, d) => sum + (Number(d[s.key]) || 0), 0);
      return acc;
    }, {});
  }, [series, filteredData]);

  // ── Config ────────────────────────────────────────────────
  const chartConfig = React.useMemo<ChartConfig>(() => {
    return series.reduce<ChartConfig>((acc, s) => {
      acc[s.key] = {
        label: s.label,
        color: s.color,
        ...(s.icon ? { icon: s.icon } : {}),
      };
      return acc;
    }, {});
  }, [series]);

  // ── Layout (horizontal = "vertical" dans Recharts) ────────
  const isHorizontal = variant === 'horizontal';
  const isStacked = variant === 'stacked';
  const isInteractive = variant === 'interactive';

  // ── Séries à afficher ─────────────────────────────────────
  const visibleSeries = isInteractive ? series.filter((s) => s.key === activeSeries) : series;

  // ── Marges ───────────────────────────────────────────────
  const defaultMargin = showAxes
    ? { left: isHorizontal ? 60 : -20, right: 12, top: 8, bottom: 0 }
    : { left: 12, right: 12, top: 8, bottom: 0 };
  const resolvedMargin = { ...defaultMargin, ...margin };

  return (
    <div className={cn('w-full flex flex-col gap-2', className)}>
      {/* ── Mode interactif : boutons de sélection ────────── */}
      {isInteractive && (
        <div className="flex border-b">
          {series.map((s) => (
            <button
              key={s.key}
              data-active={activeSeries === s.key}
              onClick={() => setActiveSeries(s.key)}
              className={cn(
                'flex flex-1 flex-col items-start gap-0.5 border-l px-4 py-3 text-left transition-colors',
                'first:border-l-0 hover:bg-muted/30',
                'data-[active=true]:bg-muted/50'
              )}
            >
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <span className="text-lg font-bold leading-none">
                {totals[s.key]?.toLocaleString('fr-FR')}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ── Filtre de période ────────────────────────────── */}
      {showPeriodFilter && !isInteractive && (
        <div className="flex justify-end">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-8 w-35 rounded-xs text-xs">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {periodOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="rounded-xs text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* ── Filtre de période (mode interactif) ────────── */}
      {showPeriodFilter && isInteractive && (
        <div className="flex justify-end px-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-8 w-35 rounded-xs text-xs">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {periodOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="rounded-xs text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* ── Graphique ────────────────────────────────────── */}
      <ChartContainer config={chartConfig} style={{ height }} className="w-full">
        <BarChart
          accessibilityLayer
          data={filteredData}
          layout={isHorizontal ? 'vertical' : 'horizontal'}
          margin={resolvedMargin}
          barCategoryGap={barCategoryGap}
          barGap={barGap}
        >
          {/* Grille */}
          {showGrid && (
            <CartesianGrid
              vertical={isHorizontal ? true : !gridHorizontalOnly}
              horizontal={!isHorizontal || !gridHorizontalOnly}
              strokeDasharray="3 3"
              className="stroke-border"
            />
          )}

          {/* Axes */}
          {showAxes && !isHorizontal && (
            <>
              <XAxis
                dataKey={categoryKey}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                className="text-xs fill-muted-foreground"
                tickFormatter={
                  xTickFormatter ??
                  ((v: string) => {
                    const d = new Date(v);
                    return isNaN(d.getTime())
                      ? v.slice(0, 3)
                      : d.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
                  })
                }
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickCount={yTickCount}
                className="text-xs fill-muted-foreground"
                tickFormatter={yTickFormatter}
              />
            </>
          )}

          {showAxes && isHorizontal && (
            <>
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickCount={yTickCount}
                className="text-xs fill-muted-foreground"
                tickFormatter={yTickFormatter}
              />
              <YAxis
                dataKey={categoryKey}
                type="category"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs fill-muted-foreground"
                width={80}
                tickFormatter={xTickFormatter}
              />
            </>
          )}

          {/* Axes sans labels (variant interactive) */}
          {!showAxes && isInteractive && (
            <XAxis
              dataKey={categoryKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              className="text-xs fill-muted-foreground"
              tickFormatter={
                xTickFormatter ??
                ((v: string) => {
                  const d = new Date(v);
                  return isNaN(d.getTime())
                    ? v.slice(0, 3)
                    : d.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
                })
              }
            />
          )}

          {/* Tooltip */}
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                hideLabel={hideTooltipLabel}
                indicator={tooltipIndicator}
                labelFormatter={(label: React.ReactNode) => {
                  const formatter =
                    tooltipLabelFormatter ??
                    ((value: string) => {
                      const d = new Date(value);
                      if (isNaN(d.getTime())) return value;
                      return d.toLocaleDateString('fr-FR', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      });
                    });
                  return formatter(String(label ?? ''));
                }}
              />
            }
          />

          {/* Légende */}
          {showLegend && !isInteractive && <ChartLegend content={<ChartLegendContent />} />}

          {/* Lignes de référence */}
          {referenceLines.map((ref, i) => (
            <ReferenceLine
              key={i}
              y={isHorizontal ? undefined : ref.value}
              x={isHorizontal ? ref.value : undefined}
              label={ref.label}
              stroke={ref.color ?? 'var(--destructive)'}
              strokeDasharray={ref.strokeDasharray ?? '4 4'}
            />
          ))}

          {/* Barres */}
          {visibleSeries.map((s, idx) => {
            const isTop = idx === visibleSeries.length - 1;
            const isBottom = idx === 0;
            const radius = s.radius ?? resolveRadius(barRadius, isTop, isBottom, isStacked);

            return (
              <Bar
                key={s.key}
                dataKey={s.key}
                fill={s.color}
                stackId={isStacked ? (s.stackId ?? 'stack') : s.stackId}
                radius={radius}
                maxBarSize={barSize ?? 60}
              />
            );
          })}
        </BarChart>
      </ChartContainer>
    </div>
  );
}
