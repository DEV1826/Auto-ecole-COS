'use client';

/**
 * @module components/charts/area/AreaChart
 * @description
 * Composant de graphique en aire ultra-complet et hautement personnalisable.
 * Supporte les variantes : standard, linéaire, gradient, empilé, avec/sans axes,
 * interactif (filtre de période), icônes sur les points, et mode "All metrics"
 * (multi-séries sans axe Y commun).
 *
 * Pensé comme un élément de base réutilisable — ne contient pas de Card.
 * Le composant parent est libre de l'encapsuler dans n'importe quel layout.
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @example
 * ```tsx
 * // Utilisation minimale
 * <VitaAreaChart
 *   data={data}
 *   series={[{ key: "heartRate", label: "Fréquence cardiaque", color: "var(--chart-1)" }]}
 * />
 *
 * // Utilisation complète avec gradient + axes + filtre de période
 * <VitaAreaChart
 *   data={data}
 *   series={[
 *     { key: "heartRate", label: "Fréquence cardiaque", color: "var(--chart-1)", unit: "bpm" },
 *     { key: "spo2",      label: "SpO₂",               color: "var(--chart-2)", unit: "%" },
 *   ]}
 *   variant="gradient"
 *   showAxes
 *   showLegend
 *   showPeriodFilter
 *   periodOptions={[
 *     { label: "7 jours",  value: "7d"  },
 *     { label: "30 jours", value: "30d" },
 *     { label: "3 mois",   value: "90d" },
 *   ]}
 *   dateKey="date"
 *   stackId="vitals"
 *   height={280}
 *   className="w-full"
 * />
 * ```
 */

import * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ReferenceLine } from 'recharts';
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
 * @interface AreaSeries
 * @description Définition d'une série de données à afficher dans le graphique.
 */
export interface AreaSeries {
  /** Clé dans l'objet de données (ex: "heartRate") */
  key: string;
  /** Libellé affiché dans la légende et le tooltip */
  label: string;
  /** Couleur CSS (variable CSS ou valeur hex/rgb) */
  color: string;
  /** Unité affichée dans le tooltip (ex: "bpm", "%", "kg") */
  unit?: string;
  /**
   * Identifiant de stack pour les aires empilées.
   * Les séries partageant le même stackId seront empilées.
   */
  stackId?: string;
  /** Opacité du remplissage (0 à 1, défaut : 0.4) */
  fillOpacity?: number;
  /** Épaisseur du trait (défaut : 2) */
  strokeWidth?: number;
  /** Afficher les points sur la courbe (défaut : false) */
  showDots?: boolean;
}

/**
 * @interface PeriodOption
 * @description Option du sélecteur de période.
 */
export interface PeriodOption {
  /** Libellé affiché dans le select */
  label: string;
  /** Valeur utilisée pour filtrer les données */
  value: string;
}

/**
 * @interface ReferenceLine
 * @description Ligne de référence horizontale (ex: seuil critique).
 */
export interface ReferenceLineConfig {
  /** Valeur Y de la ligne */
  y: number;
  /** Libellé de la ligne */
  label?: string;
  /** Couleur de la ligne (défaut : var(--destructive)) */
  color?: string;
  /** Style du trait ("solid" | "dashed" | "dotted", défaut : "dashed") */
  strokeDasharray?: string;
}

/**
 * @typedef {"standard" | "gradient" | "linear" | "step"} AreaVariant
 * @description Variante visuelle du graphique.
 * - `standard`  : courbe naturelle (type "natural"), remplissage uniforme
 * - `gradient`  : courbe naturelle avec dégradé du haut vers le bas
 * - `linear`    : courbe linéaire (droites entre les points)
 * - `step`      : courbe en escalier
 */
export type AreaVariant = 'standard' | 'gradient' | 'linear' | 'step';

/**
 * @interface VitaAreaChartProps
 * @description Propriétés complètes du composant VitaAreaChart.
 */
export interface VitaAreaChartProps {
  // ── Données ────────────────────────────────────────────────
  /** Tableau de données brutes (chaque entrée est un point sur l'axe X) */
  data: Record<string, unknown>[];
  /** Définitions des séries à afficher */
  series: AreaSeries[];
  /** Clé de l'axe X dans les données (défaut : "date") */
  dateKey?: string;

  // ── Variante visuelle ──────────────────────────────────────
  /** Variante du graphique (défaut : "standard") */
  variant?: AreaVariant;

  // ── Axes ───────────────────────────────────────────────────
  /** Afficher les axes X et Y (défaut : false) */
  showAxes?: boolean;
  /** Nombre de graduations sur l'axe Y (défaut : 4) */
  yTickCount?: number;
  /** Formateur pour les labels de l'axe X */
  xTickFormatter?: (value: string) => string;
  /** Formateur pour les labels de l'axe Y */
  yTickFormatter?: (value: number) => string;
  /** Afficher la grille cartésienne (défaut : true) */
  showGrid?: boolean;
  /** Afficher uniquement les lignes horizontales de la grille */
  gridHorizontalOnly?: boolean;

  // ── Légende & Tooltip ──────────────────────────────────────
  /** Afficher la légende (défaut : false) */
  showLegend?: boolean;
  /** Afficher le tootlip (defautl : false) */
  showTootlip?: boolean;
  /** Formateur du label du tooltip (ex: formatage de date) */
  tooltipLabelFormatter?: (value: string) => string;
  /** Indicateur du tooltip ("line" | "dot" | "dashed", défaut : "dot") */
  tooltipIndicator?: 'line' | 'dot' | 'dashed';

  // ── Filtre de période ──────────────────────────────────────
  /** Afficher le sélecteur de période (défaut : false) */
  showPeriodFilter?: boolean;
  /** Options du sélecteur de période */
  periodOptions?: PeriodOption[];
  /** Période sélectionnée par défaut (valeur de PeriodOption) */
  defaultPeriod?: string;
  /**
   * Fonction de filtrage personnalisée.
   * Si non fournie, un filtre par date (N derniers jours) est appliqué automatiquement.
   */
  onPeriodChange?: (period: string, data: Record<string, unknown>[]) => Record<string, unknown>[];

  // ── Lignes de référence ────────────────────────────────────
  /** Lignes de référence horizontales (ex: seuils critiques) */
  referenceLines?: ReferenceLineConfig[];

  // ── Dimensions ─────────────────────────────────────────────
  /** Hauteur du graphique en pixels (défaut : 250) */
  height?: number;
  /** Marges internes du graphique */
  margin?: { top?: number; right?: number; bottom?: number; left?: number };

  // ── Style ──────────────────────────────────────────────────
  /** Classes CSS additionnelles sur le conteneur */
  className?: string;
  /** Curseur affiché au survol (défaut : false) */
  showCursor?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers internes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retourne le type Recharts correspondant à la variante.
 * @internal
 */
function getAreaType(variant: AreaVariant): 'natural' | 'linear' | 'step' | 'monotone' {
  switch (variant) {
    case 'linear':
      return 'linear';
    case 'step':
      return 'step';
    default:
      return 'natural';
  }
}

/**
 * Filtre les données selon le nombre de jours à soustraire depuis la dernière date.
 * Suppose que `dateKey` contient une chaîne parseable par `new Date()`.
 * @internal
 */
function defaultPeriodFilter(
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
  if (!days || data.length === 0) return data;

  // Référence = dernière date du tableau
  const dates = data.map((d) => new Date(d[dateKey] as string)).filter((d) => !isNaN(d.getTime()));
  if (dates.length === 0) return data;

  const refDate = new Date(Math.max(...dates.map((d) => d.getTime())));
  const startDate = new Date(refDate);
  startDate.setDate(startDate.getDate() - days);

  return data.filter((d) => {
    const date = new Date(d[dateKey] as string);
    return date >= startDate;
  });
}

/**
 * Génère l'id du dégradé SVG pour une série.
 * @internal
 */
function gradientId(key: string): string {
  return `vitaGradient_${key}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Graphique en aire  Auto-École COS — composant de base ultra-complet.
 *
 * Ne contient pas de Card. À encapsuler dans le layout de votre choix.
 *
 * @param props - {@link VitaAreaChartProps}
 * @returns JSX.Element
 */
export function VitaAreaChart({
  data,
  series,
  dateKey = 'date',
  variant = 'standard',
  showAxes = false,
  yTickCount = 4,
  xTickFormatter,
  yTickFormatter,
  showGrid = true,
  gridHorizontalOnly = false,
  showLegend = false,
  showTootlip = true,
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
  height = 250,
  margin,
  className,
  showCursor = false,
}: VitaAreaChartProps): React.JSX.Element {
  // ── État période ──────────────────────────────────────────
  const [period, setPeriod] = React.useState<string>(
    defaultPeriod ?? periodOptions[0]?.value ?? '90d'
  );

  // ── Données filtrées ──────────────────────────────────────
  const filteredData = React.useMemo(() => {
    if (!showPeriodFilter) return data;
    if (onPeriodChange) return onPeriodChange(period, data);
    return defaultPeriodFilter(data, period, dateKey);
  }, [data, period, showPeriodFilter, onPeriodChange, dateKey]);

  // ── Config Recharts ───────────────────────────────────────
  const chartConfig = React.useMemo<ChartConfig>(() => {
    return series.reduce<ChartConfig>((acc, s) => {
      acc[s.key] = { label: s.label, color: s.color };
      return acc;
    }, {});
  }, [series]);

  // ── Type de courbe ────────────────────────────────────────
  const areaType = getAreaType(variant);
  const isGradient = variant === 'gradient';

  // ── Marges par défaut (espace pour l'axe Y si affiché) ───
  const defaultMargin = showAxes
    ? { left: -20, right: 12, top: 8, bottom: 0 }
    : { left: 0, right: 0, top: 8, bottom: 0 };
  const resolvedMargin = { ...defaultMargin, ...margin };

  return (
    <div className={cn('w-full flex flex-col gap-2', className)}>
      {/* ── Filtre de période ────────────────────────────── */}
      {showPeriodFilter && (
        <div className="flex justify-end">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger
              className="h-8 w-35 rounded-xs text-xs"
              aria-label="Sélectionner une période"
            >
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
      <ChartContainer config={chartConfig} className={cn('w-full')} style={{ height }}>
        <AreaChart data={filteredData} margin={resolvedMargin}>
          {/* Dégradés SVG (variant gradient uniquement) */}
          {isGradient && (
            <defs>
              {series.map((s) => (
                <linearGradient key={s.key} id={gradientId(s.key)} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={s.color} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={s.color} stopOpacity={0.05} />
                </linearGradient>
              ))}
            </defs>
          )}

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
                ((value: string) => {
                  const d = new Date(value);
                  if (isNaN(d.getTime())) return value;
                  return d.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
                })
              }
            />
          )}

          {/* Axe Y */}
          {showAxes && (
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickCount={yTickCount}
              className="text-xs fill-muted-foreground"
              tickFormatter={yTickFormatter}
            />
          )}

          {/* Tooltip */}
          {showTootlip && (
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
          )}

          {/* Légende */}
          {showLegend && <ChartLegend content={<ChartLegendContent />} />}

          {/* Lignes de référence */}
          {referenceLines.map((ref, i) => (
            <ReferenceLine
              key={i}
              y={ref.y}
              label={ref.label}
              stroke={ref.color ?? 'var(--destructive)'}
              strokeDasharray={ref.strokeDasharray ?? '4 4'}
            />
          ))}

          {/* Séries */}
          {series.map((s) => (
            <Area
              key={s.key}
              dataKey={s.key}
              type={areaType}
              stroke={s.color}
              strokeWidth={s.strokeWidth ?? 2}
              fill={isGradient ? `url(#${gradientId(s.key)})` : s.color}
              fillOpacity={isGradient ? 1 : (s.fillOpacity ?? 0.4)}
              stackId={s.stackId}
              dot={s.showDots ? { r: 3, fill: s.color, strokeWidth: 0 } : false}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          ))}
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
