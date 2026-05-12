'use client';

/**
 * @module components/charts/radar/RadarChart
 * @description
 * Composant de graphique radar (toile d'araignée) ultra-complet.
 * Supporte les variantes : radar simple, multi-séries superposées, radar rempli,
 * avec ou sans points, personnalisation complète des axes et de la grille polaire.
 *
 * Idéal pour comparer plusieurs métriques de santé sur un même axe radial
 * (ex: bilan de santé multi-paramètres, comparaison avant/après traitement).
 *
 * Pensé comme un élément de base réutilisable — ne contient pas de Card.
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @example
 * ```tsx
 * // Radar simple
 * <VitaRadarChart
 *   data={[
 *     { metric: "Glycémie",      value: 75 },
 *     { metric: "Cholestérol",   value: 60 },
 *     { metric: "Tension",       value: 85 },
 *     { metric: "IMC",           value: 70 },
 *     { metric: "Fréq. cardiaque", value: 90 },
 *   ]}
 *   series={[{ key: "value", label: "Score santé", color: "var(--chart-1)" }]}
 *   metricKey="metric"
 * />
 *
 * // Radar multi-séries (avant / après)
 * <VitaRadarChart
 *   data={data}
 *   series={[
 *     { key: "before", label: "Avant traitement", color: "var(--chart-1)" },
 *     { key: "after",  label: "Après traitement", color: "var(--chart-2)" },
 *   ]}
 *   metricKey="metric"
 *   showLegend
 *   fillOpacity={0.3}
 * />
 * ```
 */

import * as React from 'react';
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart } from 'recharts';
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
 * @interface RadarSeries
 * @description Définition d'une série dans le graphique radar.
 */
export interface RadarSeries {
  /** Clé dans les données */
  key: string;
  /** Libellé (légende + tooltip) */
  label: string;
  /** Couleur CSS */
  color: string;
  /** Opacité du remplissage (0 à 1, défaut : 0.4) */
  fillOpacity?: number;
  /** Afficher les points sur les sommets (défaut : false) */
  showDots?: boolean;
  /** Épaisseur du trait (défaut : 2) */
  strokeWidth?: number;
}

/**
 * @interface VitaRadarChartProps
 * @description Propriétés complètes du composant VitaRadarChart.
 */
export interface VitaRadarChartProps {
  // ── Données ────────────────────────────────────────────────
  /** Tableau de données (une entrée = un axe du radar) */
  data: Record<string, unknown>[];
  /** Définitions des séries */
  series: RadarSeries[];
  /** Clé du libellé d'axe dans les données (défaut : "metric") */
  metricKey?: string;

  // ── Grille polaire ──────────────────────────────────────────
  /** Afficher la grille polaire (défaut : true) */
  showGrid?: boolean;
  /** Type de grille : "polygon" (étoile) | "circle" (défaut : "polygon") */
  gridType?: 'polygon' | 'circle';
  /** Nombre de niveaux de la grille (défaut : 5) */
  gridLevels?: number;
  /** Afficher l'axe radial avec les valeurs numériques (défaut : false) */
  showRadiusAxis?: boolean;
  /** Valeur max de l'axe radial (défaut : auto) */
  maxDomain?: number;

  // ── Apparence ──────────────────────────────────────────────
  /** Opacité globale du remplissage (surchargée par series[].fillOpacity) */
  fillOpacity?: number;
  /** Angle de départ en degrés (défaut : 90 pour commencer en haut) */
  startAngle?: number;

  // ── Légende & Tooltip ──────────────────────────────────────
  /** Afficher la légende */
  showLegend?: boolean;
  /** Masquer le label dans le tooltip */
  hideTooltipLabel?: boolean;

  // ── Dimensions ─────────────────────────────────────────────
  /** Hauteur en pixels (défaut : 300) */
  height?: number;
  /** Classes CSS additionnelles */
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Graphique radar  Auto-École COS — composant de base ultra-complet.
 *
 * @param props - {@link VitaRadarChartProps}
 */
export function VitaRadarChart({
  data,
  series,
  metricKey = 'metric',
  showGrid = true,
  gridType = 'polygon',
  gridLevels = 5,
  showRadiusAxis = false,
  maxDomain,
  fillOpacity = 0.4,
  startAngle = 90,
  showLegend = false,
  hideTooltipLabel = false,
  height = 300,
  className,
}: VitaRadarChartProps): React.JSX.Element {
  const chartConfig = React.useMemo<ChartConfig>(
    () =>
      series.reduce<ChartConfig>((acc, s) => {
        acc[s.key] = { label: s.label, color: s.color };
        return acc;
      }, {}),
    [series]
  );

  return (
    <div className={cn('w-full', className)}>
      <ChartContainer config={chartConfig} style={{ height }} className="w-full">
        <RadarChart
          data={data}
          startAngle={startAngle}
          margin={{ top: 16, right: 16, bottom: 16, left: 16 }}
        >
          {/* Grille polaire */}
          {showGrid && <PolarGrid gridType={gridType} radialLines className="stroke-border" />}

          {/* Libellés des axes */}
          <PolarAngleAxis
            dataKey={metricKey}
            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
          />

          {/* Axe radial (valeurs numériques) */}
          {showRadiusAxis && (
            <PolarRadiusAxis
              tickCount={gridLevels}
              domain={maxDomain ? [0, maxDomain] : undefined}
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              axisLine={false}
            />
          )}

          {/* Tooltip */}
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel={hideTooltipLabel} indicator="dot" />}
          />

          {/* Légende */}
          {showLegend && <ChartLegend content={<ChartLegendContent />} />}

          {/* Séries */}
          {series.map((s) => (
            <Radar
              key={s.key}
              name={s.label}
              dataKey={s.key}
              stroke={s.color}
              strokeWidth={s.strokeWidth ?? 2}
              fill={s.color}
              fillOpacity={s.fillOpacity ?? fillOpacity}
              dot={s.showDots ? { r: 3, fill: s.color, strokeWidth: 0 } : false}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          ))}
        </RadarChart>
      </ChartContainer>
    </div>
  );
}
