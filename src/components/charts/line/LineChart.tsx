'use client';

/**
 * @module components/charts/line/LineChart
 * @description
 * Composant de graphique en courbes ultra-complet et hautement personnalisable.
 * Supporte les variantes : standard (monotone), linéaire, step, multi-axes Y,
 * points interactifs, lignes de référence, filtre de période.
 *
 * Pensé comme un élément de base réutilisable — ne contient pas de Card.
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @example
 * ```tsx
 * // Courbe simple
 * <VitaLineChart
 *   data={data}
 *   series={[{ key: "weight", label: "Poids", color: "var(--chart-1)", unit: "kg" }]}
 *   dateKey="date"
 *   showAxes
 *   showDots
 * />
 *
 * // Multi-courbes avec légende et filtre de période
 * <VitaLineChart
 *   data={data}
 *   series={[
 *     { key: "systolic",  label: "Systolique",  color: "var(--chart-1)", unit: "mmHg" },
 *     { key: "diastolic", label: "Diastolique", color: "var(--chart-2)", unit: "mmHg" },
 *   ]}
 *   dateKey="date"
 *   variant="monotone"
 *   showAxes
 *   showLegend
 *   showPeriodFilter
 *   referenceLines={[{ y: 140, label: "Seuil critique", color: "var(--destructive)" }]}
 * />
 * ```
 */

import * as React from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis, ReferenceLine } from 'recharts';
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

// ─────────────────────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @interface LineSeries
 * @description Définition d'une courbe.
 */
export interface LineSeries {
  /** Clé dans les données */
  key: string;
  /** Libellé (légende + tooltip) */
  label: string;
  /** Couleur CSS */
  color: string;
  /** Unité affichée dans le tooltip */
  unit?: string;
  /** Épaisseur du trait (défaut : 2) */
  strokeWidth?: number;
  /** Afficher les points sur la courbe (défaut : false) */
  showDots?: boolean;
  /** Style du trait : "solid" | "dashed" | "dotted" (défaut : "solid") */
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  /**
   * Si true, cette série utilisera un axe Y secondaire (à droite).
   * Nécessite `showAxes: true` et `showSecondaryYAxis: true`.
   */
  yAxisId?: 'left' | 'right';
}

/**
 * @typedef {"monotone" | "linear" | "step" | "natural"} LineVariant
 * @description Type d'interpolation de la courbe.
 */
export type LineVariant = 'monotone' | 'linear' | 'step' | 'natural';

/**
 * @interface LineReferenceConfig
 * @description Ligne de référence horizontale.
 */
export interface LineReferenceConfig {
  y: number;
  label?: string;
  color?: string;
  strokeDasharray?: string;
  yAxisId?: 'left' | 'right';
}

/**
 * @interface PeriodOption
 */
export interface PeriodOption {
  label: string;
  value: string;
}

/**
 * @interface VitaLineChartProps
 * @description Propriétés complètes du composant VitaLineChart.
 */
export interface VitaLineChartProps {
  // ── Données ────────────────────────────────────────────────
  /** Tableau de données */
  data: Record<string, unknown>[];
  /** Définitions des séries */
  series: LineSeries[];
  /** Clé de l'axe X (défaut : "date") */
  dateKey?: string;

  // ── Variante ───────────────────────────────────────────────
  /** Type d'interpolation (défaut : "monotone") */
  variant?: LineVariant;

  // ── Axes ───────────────────────────────────────────────────
  /** Afficher les axes X et Y (défaut : false) */
  showAxes?: boolean;
  /** Afficher un axe Y secondaire à droite (défaut : false) */
  showSecondaryYAxis?: boolean;
  /** Nombre de graduations sur l'axe Y (défaut : 4) */
  yTickCount?: number;
  /** Formateur de l'axe X */
  xTickFormatter?: (value: string) => string;
  /** Formateur de l'axe Y gauche */
  yTickFormatter?: (value: number) => string;
  /** Formateur de l'axe Y droit */
  yRightTickFormatter?: (value: number) => string;
  /** Afficher la grille (défaut : true) */
  showGrid?: boolean;
  /** Grille horizontale uniquement */
  gridHorizontalOnly?: boolean;

  // ── Points ─────────────────────────────────────────────────
  /** Afficher les points sur toutes les courbes (défaut : false) */
  showDots?: boolean;
  /** Rayon des points (défaut : 3) */
  dotRadius?: number;

  // ── Légende & Tooltip ──────────────────────────────────────
  /** Afficher la légende */
  showLegend?: boolean;
  /** Formateur du label du tooltip */
  tooltipLabelFormatter?: (value: string) => string;
  /** Indicateur du tooltip */
  tooltipIndicator?: 'line' | 'dot' | 'dashed';
  /** Curseur vertical au survol (défaut : false) */
  showCursor?: boolean;

  // ── Filtre de période ──────────────────────────────────────
  /** Afficher le sélecteur de période */
  showPeriodFilter?: boolean;
  /** Options du sélecteur */
  periodOptions?: PeriodOption[];
  /** Période par défaut */
  defaultPeriod?: string;
  /** Filtre personnalisé */
  onPeriodChange?: (period: string, data: Record<string, unknown>[]) => Record<string, unknown>[];

  // ── Lignes de référence ────────────────────────────────────
  /** Lignes de référence */
  referenceLines?: LineReferenceConfig[];

  // ── Dimensions ─────────────────────────────────────────────
  /** Hauteur en pixels (défaut : 250) */
  height?: number;
  /** Marges internes */
  margin?: { top?: number; right?: number; bottom?: number; left?: number };

  // ── Style ──────────────────────────────────────────────────
  /** Classes CSS additionnelles */
  className?: string;
  /** Connecter les points même si des données sont manquantes */
  connectNulls?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function filterByPeriod(
  data: Record<string, unknown>[],
  period: string,
  dateKey: string
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

  const dates = data.map((d) => new Date(d[dateKey] as string)).filter((d) => !isNaN(d.getTime()));
  if (!dates.length) return data;

  const refDate = new Date(Math.max(...dates.map((d) => d.getTime())));
  const start = new Date(refDate);
  start.setDate(start.getDate() - days);

  return data.filter((d) => {
    const date = new Date(d[dateKey] as string);
    return !isNaN(date.getTime()) && date >= start;
  });
}

/**
 * Retourne le strokeDasharray SVG selon le style.
 * @internal
 */
function strokeDasharray(style?: 'solid' | 'dashed' | 'dotted'): string | undefined {
  switch (style) {
    case 'dashed':
      return '6 4';
    case 'dotted':
      return '2 3';
    default:
      return undefined;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Graphique en courbes  Auto-École COS — composant de base ultra-complet.
 *
 * @param props - {@link VitaLineChartProps}
 */
export function VitaLineChart({
  data,
  series,
  dateKey = 'date',
  variant = 'monotone',
  showAxes = false,
  showSecondaryYAxis = false,
  yTickCount = 4,
  xTickFormatter,
  yTickFormatter,
  yRightTickFormatter,
  showGrid = true,
  gridHorizontalOnly = false,
  showDots = false,
  dotRadius = 3,
  showLegend = false,
  tooltipLabelFormatter,
  tooltipIndicator = 'dot',
  showCursor = false,
  showPeriodFilter = false,
  periodOptions = [
    { label: '7 jours', value: '7d' },
    { label: '30 jours', value: '30d' },
    { label: '3 mois', value: '90d' },
  ],
  defaultPeriod,
  onPeriodChange,
  referenceLines = [],
  height = 250,
  margin,
  className,
  connectNulls = false,
}: VitaLineChartProps): React.JSX.Element {
  const [period, setPeriod] = React.useState(defaultPeriod ?? periodOptions[0]?.value ?? '90d');

  const filteredData = React.useMemo(() => {
    if (!showPeriodFilter) return data;
    if (onPeriodChange) return onPeriodChange(period, data);
    return filterByPeriod(data, period, dateKey);
  }, [data, period, showPeriodFilter, onPeriodChange, dateKey]);

  const chartConfig = React.useMemo<ChartConfig>(
    () =>
      series.reduce<ChartConfig>((acc, s) => {
        acc[s.key] = { label: s.label, color: s.color };
        return acc;
      }, {}),
    [series]
  );

  const hasRightAxis = showSecondaryYAxis && series.some((s) => s.yAxisId === 'right');

  const defaultMargin = showAxes
    ? { left: -20, right: hasRightAxis ? 20 : 12, top: 8, bottom: 0 }
    : { left: 0, right: 0, top: 8, bottom: 0 };
  const resolvedMargin = { ...defaultMargin, ...margin };

  return (
    <div className={cn('w-full flex flex-col gap-2', className)}>
      {/* Filtre de période */}
      {showPeriodFilter && (
        <div className="flex justify-end">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-8 w-[140px] rounded-xs text-xs">
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

      <ChartContainer config={chartConfig} style={{ height }} className="w-full">
        <LineChart accessibilityLayer data={filteredData} margin={resolvedMargin}>
          {/* Grille */}
          {showGrid && (
            <CartesianGrid
              vertical={!gridHorizontalOnly}
              strokeDasharray="3 3"
              className="stroke-border"
            />
          )}

          {/* Axe X */}
          {showAxes && (
            <XAxis
              dataKey={dateKey}
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

          {/* Axe Y gauche */}
          {showAxes && (
            <YAxis
              yAxisId="left"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickCount={yTickCount}
              className="text-xs fill-muted-foreground"
              tickFormatter={yTickFormatter}
            />
          )}

          {/* Axe Y droit (optionnel) */}
          {showAxes && hasRightAxis && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickCount={yTickCount}
              className="text-xs fill-muted-foreground"
              tickFormatter={yRightTickFormatter ?? yTickFormatter}
            />
          )}

          {/* Tooltip */}
          <ChartTooltip
            cursor={showCursor}
            content={
              <ChartTooltipContent
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
          {showLegend && <ChartLegend content={<ChartLegendContent />} />}

          {/* Lignes de référence */}
          {referenceLines.map((ref, i) => (
            <ReferenceLine
              key={i}
              y={ref.y}
              yAxisId={ref.yAxisId ?? 'left'}
              label={{ value: ref.label ?? '', position: 'insideTopRight', fontSize: 11 }}
              stroke={ref.color ?? 'var(--destructive)'}
              strokeDasharray={ref.strokeDasharray ?? '4 4'}
            />
          ))}

          {/* Courbes */}
          {series.map((s) => (
            <Line
              key={s.key}
              dataKey={s.key}
              type={variant}
              stroke={s.color}
              strokeWidth={s.strokeWidth ?? 2}
              strokeDasharray={strokeDasharray(s.strokeStyle)}
              yAxisId={s.yAxisId ?? 'left'}
              dot={showDots || s.showDots ? { r: dotRadius, fill: s.color, strokeWidth: 0 } : false}
              activeDot={{ r: dotRadius + 2, strokeWidth: 0 }}
              connectNulls={connectNulls}
            />
          ))}
        </LineChart>
      </ChartContainer>
    </div>
  );
}
