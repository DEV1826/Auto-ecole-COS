'use client';

/**
 * @module dashboard/components/common/ActivityChart
 * @description
 * Graphique d'activité interactif avec sélection de plage de dates (range picker).
 * Version 2.0.0 – remplace les périodes prédéfinies (7j, 30j, etc.) par un sélecteur de dates.
 *
 * Fonctionnalités :
 * - Sélection de plage de dates via calendrier ou boutons de présélection
 *   (Aujourd'hui, Cette semaine, Ce mois, Personnalisé)
 * - Sélecteur de type de graphique responsive (ToggleGroup sur desktop, Select sur mobile)
 * - Labels humainement lisibles pour les types de graphique ("Courbes", "Aires", "Barres")
 * - Transition CSS fluide entre les changements de graphique (opacity + translateY)
 * - Données formatées (dates en français, format court pour l'axe X)
 * - Réutilise exclusivement les composants  Auto-École COS Charts
 * - Support `@container` queries pour la responsive interne
 * - Accessible (aria-labels sur tous les contrôles)
 *
 * @author Stive Junior
 * @version 2.0.0
 *
 * @example
 * ```tsx
 * // Utilisation minimale (données mockées par défaut)
 * <ActivityChart />
 *
 * // Utilisation complète
 * <ActivityChart
 *   data={appointmentsByDay}
 *   series={[
 *     { key: "consultations", label: "Consultations", color: "var(--chart-1)" },
 *     { key: "teleconsultations", label: "Téléconsultations", color: "var(--chart-2)" },
 *   ]}
 *   title="Activité médicale"
 *   description="Évolution sur la période sélectionnée"
 *   defaultChartType="area"
 *   height={280}
 *   showAxes
 *   showLegend
 *   onDateRangeChange={(range) => console.log("Plage:", range)}
 *   onChartTypeChange={(t) => console.log("Type:", t)}
 * />
 * ```
 */

import * as React from 'react';
import { BarChart2, LineChart, AreaChart } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { cn } from '@/lib/utils';
import { VitaAreaChart, VitaLineChart, VitaBarChart } from '@/components/charts';
import type { AreaSeries } from '@/components/charts/area';
import { format, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {"area" | "line" | "bar"} ActivityChartType
 * @description Type visuel du graphique.
 */
export type ActivityChartType = 'area' | 'line' | 'bar';

/**
 * @interface ActivitySeries
 * @description Définition d'une série de données.
 */
export interface ActivitySeries {
  /** Clé dans les données */
  key: string;
  /** Libellé affiché dans la légende et le tooltip */
  label: string;
  /** Couleur CSS */
  color: string;
  /** Unité affichée dans le tooltip */
  unit?: string;
}

/**
 * @interface ActivityChartTypeOption
 * @description Option de type de graphique.
 */
export interface ActivityChartTypeOption {
  value: ActivityChartType;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}

/**
 * @interface DateRange
 * @description Plage de dates (from, to).
 */
export interface DateRange {
  from: Date;
  to: Date;
}

/**
 * @interface ActivityChartProps
 * @description Propriétés complètes du composant ActivityChart v2.
 */
export interface ActivityChartProps {
  // ── Données ─────────────────────────────────────────────
  /**
   * Tableau de données brutes.
   * Chaque entrée doit avoir une clé de date (configurée via `dateKey`)
   * et les clés des séries.
   */
  data?: Record<string, string | number>[];

  /** Définitions des séries à afficher */
  series?: ActivitySeries[];

  /** Clé de la date dans les données (défaut : "date") */
  dateKey?: string;

  // ── Texte ────────────────────────────────────────────────
  /** Titre du graphique */
  title?: string;

  /** Description (sous-titre) */
  description?: string;

  // ── Plage de dates ───────────────────────────────────────
  /** Plage de dates sélectionnée (contrôlée) */
  dateRange?: DateRange;
  /** Callback lors du changement de plage */
  onDateRangeChange?: (range: DateRange) => void;

  // ── Types de graphique ───────────────────────────────────
  /** Options de type de graphique disponibles (défaut : Aires, Courbes, Barres) */
  chartTypeOptions?: ActivityChartTypeOption[];

  /** Type de graphique par défaut (défaut : "area") */
  defaultChartType?: ActivityChartType;

  // ── Apparence du graphique ────────────────────────────────
  /** Hauteur du graphique en pixels (défaut : 250) */
  height?: number;

  /** Afficher les axes X et Y (défaut : true) */
  showAxes?: boolean;

  /** Afficher la légende (défaut : false) */
  showLegend?: boolean;

  // ── Callbacks ────────────────────────────────────────────
  /** Appelé lors du changement de type de graphique */
  onChartTypeChange?: (type: ActivityChartType) => void;

  // ── Style ────────────────────────────────────────────────
  /** Classes CSS additionnelles sur la Card */
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constantes par défaut
// ─────────────────────────────────────────────────────────────────────────────

/** Données mockées représentatives du contexte médical */
const DEFAULT_DATA: Record<string, string | number>[] = [
  { date: '2025-03-19', consultations: 8, teleconsultations: 3 },
  { date: '2025-03-20', consultations: 12, teleconsultations: 5 },
  { date: '2025-03-21', consultations: 7, teleconsultations: 4 },
  { date: '2025-03-22', consultations: 0, teleconsultations: 0 },
  { date: '2025-03-23', consultations: 0, teleconsultations: 0 },
  { date: '2025-03-24', consultations: 15, teleconsultations: 7 },
  { date: '2025-03-25', consultations: 11, teleconsultations: 6 },
  { date: '2025-03-26', consultations: 13, teleconsultations: 8 },
  { date: '2025-03-27', consultations: 9, teleconsultations: 5 },
  { date: '2025-03-28', consultations: 14, teleconsultations: 9 },
  { date: '2025-03-29', consultations: 0, teleconsultations: 0 },
  { date: '2025-03-30', consultations: 0, teleconsultations: 0 },
  { date: '2025-03-31', consultations: 18, teleconsultations: 10 },
  { date: '2025-04-01', consultations: 16, teleconsultations: 8 },
  { date: '2025-04-02', consultations: 20, teleconsultations: 11 },
  { date: '2025-04-03', consultations: 12, teleconsultations: 7 },
  { date: '2025-04-04', consultations: 17, teleconsultations: 9 },
  { date: '2025-04-05', consultations: 0, teleconsultations: 0 },
  { date: '2025-04-06', consultations: 0, teleconsultations: 0 },
  { date: '2025-04-07', consultations: 22, teleconsultations: 13 },
  { date: '2025-04-08', consultations: 19, teleconsultations: 10 },
  { date: '2025-04-09', consultations: 24, teleconsultations: 14 },
  { date: '2025-04-10', consultations: 18, teleconsultations: 11 },
  { date: '2025-04-11', consultations: 21, teleconsultations: 12 },
  { date: '2025-04-12', consultations: 0, teleconsultations: 0 },
  { date: '2025-04-13', consultations: 0, teleconsultations: 0 },
  { date: '2025-04-14', consultations: 25, teleconsultations: 15 },
];

const DEFAULT_SERIES: ActivitySeries[] = [
  { key: 'consultations', label: 'Consultations', color: 'var(--chart-1)' },
  { key: 'teleconsultations', label: 'Téléconsultations', color: 'var(--chart-2)' },
];

const DEFAULT_CHART_TYPE_OPTIONS: ActivityChartTypeOption[] = [
  { value: 'area', label: 'Aires', shortLabel: 'Aires', icon: AreaChart },
  { value: 'line', label: 'Courbes', shortLabel: 'Courbes', icon: LineChart },
  { value: 'bar', label: 'Barres', shortLabel: 'Barres', icon: BarChart2 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retourne la plage de dates par défaut (les 30 derniers jours).
 */
function getDefaultDateRange(): DateRange {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 30);
  return { from, to };
}

/**
 * Filtre les données selon une plage de dates.
 */
function filterByDateRange(
  data: Record<string, string | number>[],
  range: DateRange,
  dateKey: string
): Record<string, string | number>[] {
  return data.filter((row) => {
    const d = new Date(row[dateKey] as string);
    return !isNaN(d.getTime()) && isWithinInterval(d, { start: range.from, end: range.to });
  });
}

/**
 * Génère un titre dynamique à partir de la plage de dates.
 */
function getDateRangeTitle(range: DateRange): string {
  const sameMonth =
    range.from.getMonth() === range.to.getMonth() &&
    range.from.getFullYear() === range.to.getFullYear();
  const sameDay = range.from.toDateString() === range.to.toDateString();

  if (sameDay) {
    return format(range.from, 'd MMMM yyyy', { locale: fr });
  }
  if (sameMonth) {
    return `Du ${format(range.from, 'd', { locale: fr })} au ${format(range.to, 'd MMMM yyyy', { locale: fr })}`;
  }
  return `Du ${format(range.from, 'd MMM yyyy', { locale: fr })} au ${format(range.to, 'd MMM yyyy', { locale: fr })}`;
}

/**
 * Formate une date ISO pour l'axe X.
 */
function formatXAxis(value: string): string {
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Graphique d'activité  Auto-École COS — v2 avec sélection de plage de dates.
 *
 * @param props - {@link ActivityChartProps}
 */
export function ActivityChart({
  data = DEFAULT_DATA,
  series = DEFAULT_SERIES,
  dateKey = 'date',
  title = 'Activité',
  description,
  dateRange: externalDateRange,
  onDateRangeChange,
  chartTypeOptions = DEFAULT_CHART_TYPE_OPTIONS,
  defaultChartType = 'area',
  height = 250,
  showAxes = true,
  showLegend = false,
  onChartTypeChange,
  className,
}: ActivityChartProps): React.JSX.Element {
  // ── État ───────────────────────────────────────────────
  const isMobile = useIsMobile();

  const [internalDateRange, setInternalDateRange] =
    React.useState<DateRange>(getDefaultDateRange());
  const [chartType, setChartType] = React.useState<ActivityChartType>(defaultChartType);
  const [visible, setVisible] = React.useState(true);

  // Utiliser la plage externe si fournie, sinon l'interne
  const dateRange = externalDateRange ?? internalDateRange;

  // Mettre à jour la plage interne si la plage externe change
  React.useEffect(() => {
    if (externalDateRange) {
      setInternalDateRange(externalDateRange);
    }
  }, [externalDateRange]);

  // ── Données filtrées ──────────────────────────────────
  const filteredData = React.useMemo(
    () => filterByDateRange(data, dateRange, dateKey),
    [data, dateRange, dateKey]
  );

  // ── Transition fluide lors du changement de type ──────
  const triggerTransition = React.useCallback((fn: () => void) => {
    setVisible(false);
    const timer = setTimeout(() => {
      fn();
      setVisible(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const handleChartTypeChange = React.useCallback(
    (value: string) => {
      if (!value || value === chartType) return;
      triggerTransition(() => {
        setChartType(value as ActivityChartType);
        onChartTypeChange?.(value as ActivityChartType);
      });
    },
    [chartType, triggerTransition, onChartTypeChange]
  );

  // ── Mise à jour de la plage (avec présélection) ───────
  const updateDateRange = React.useCallback(
    (newRange: DateRange) => {
      triggerTransition(() => {
        setInternalDateRange(newRange);
        onDateRangeChange?.(newRange);
      });
    },
    [triggerTransition, onDateRangeChange]
  );

  const handleCustomRangeSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      updateDateRange({ from: range.from, to: range.to });
    }
  };

  // ── Séries converties en format VitaChart ──────────────
  const vitaSeries: AreaSeries[] = series.map((s) => ({
    key: s.key,
    label: s.label,
    color: s.color,
    unit: s.unit,
  }));

  // ── Props communes aux 3 types de graphique ───────────
  const commonProps = {
    data: filteredData,
    series: vitaSeries,
    dateKey,
    height,
    showAxes,
    showLegend,
    showGrid: true,
    gridHorizontalOnly: true,
    tooltipIndicator: 'dot' as const,
    xTickFormatter: (v: string) => formatXAxis(v),
    tooltipLabelFormatter: (v: string) => {
      const d = new Date(v);
      return isNaN(d.getTime())
        ? v
        : d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    },
  };

  // ── Rendu du graphique selon le type ──────────────────
  const renderChart = (): React.JSX.Element => {
    switch (chartType) {
      case 'line':
        return (
          <VitaLineChart
            {...commonProps}
            variant="monotone"
            showDots={filteredData.length <= 14}
            dotRadius={3}
            showCursor
          />
        );
      case 'bar':
        return (
          <VitaBarChart
            {...commonProps}
            variant={series.length > 1 ? 'grouped' : 'standard'}
            barRadius={4}
            showGrid
          />
        );
      case 'area':
      default:
        return <VitaAreaChart {...commonProps} variant="gradient" showCursor />;
    }
  };

  const currentChartOption = chartTypeOptions.find((c) => c.value === chartType);
  const dynamicDescription =
    description ?? `${getDateRangeTitle(dateRange)} · ${currentChartOption?.label ?? chartType}`;

  return (
    <Card className={cn('@container/card w-full overflow-x-auto no-scrollbar', className)}>
      <CardHeader className="pb-0">
        <div className="flex flex-col gap-0.5">
          <CardTitle>{dynamicDescription}</CardTitle>
        </div>

        {/* ═══ Contrôles responsives ═══ */}
        <CardAction className="w-full mt-2 sm:mt-0">
          {/* Sur mobile : conteneur scrollable horizontalement */}
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar -mx-1 px-1">
            {/* DatePicker réduit sur mobile (1 mois) */}
            <DatePicker
              mode="range"
              dateRange={{ from: dateRange.from, to: dateRange.to }}
              onRangeSelect={handleCustomRangeSelect}
              numberOfMonths={isMobile ? 1 : 2}
              placeholder="Plage personnalisée"
              variant="default"
              className="w-auto shrink-0"
              showPresets
              showTimeSection={false}
            />

            {/* Séparateur visuel (caché sur très petit écran) */}
            <div className="w-px h-5 bg-border hidden @[540px]/card:block shrink-0" aria-hidden />

            {/* Sélecteur de type de graphique */}
            <Select value={chartType} onValueChange={handleChartTypeChange}>
              <SelectTrigger
                className="flex w-28 sm:w-32 shrink-0"
                size={isMobile ? 'sm' : 'default'}
                aria-label="Type de graphique"
              >
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="rounded-md">
                {chartTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="rounded-md">
                    <div className="flex items-center gap-2">
                      <opt.icon className="size-3.5" />
                      {isMobile ? opt.shortLabel : opt.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardAction>
      </CardHeader>

      {/* ── Graphique avec transition fluide ─────────── */}
      <CardContent className="px-2 pt-4 sm:px-4 sm:pt-5">
        <div
          className={cn(
            'w-full transition-all duration-150 ease-in-out',
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'
          )}
          style={{ minHeight: height }}
        >
          {renderChart()}
        </div>
      </CardContent>
    </Card>
  );
}
