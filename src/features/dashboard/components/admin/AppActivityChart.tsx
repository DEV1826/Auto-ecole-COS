// src/features/dashboard/components/admin/AppActivityChart.tsx

/**
 * @module features/dashboard/components/admin/AppActivityChart
 * @description
 * Graphique d'activité système global pour l'administrateur de l'auto‑école COS.
 * Visualise l'évolution des métriques clés sur une période sélectionnable.
 *
 * ## Métriques suivies (8 séries)
 *
 * | Série                | Couleur       | Description                                   |
 * |----------------------|---------------|-----------------------------------------------|
 * | `newCandidats`       | `--chart-1`   | Nouvelles inscriptions candidats              |
 * | `newMoniteurs`       | `--chart-2`   | Moniteurs recrutés                            |
 * | `newVehicules`       | `--chart-3`   | Véhicules ajoutés au parc                     |
 * | `lecons`             | `--chart-4`   | Leçons de conduite / code effectuées          |
 * | `examens`            | `--chart-5`   | Examens passés (code + conduite)              |
 * | `paiements`          | violet        | Paiements enregistrés (montant total)         |
 * | `depenses`           | ambre         | Dépenses enregistrées (montant total)         |
 * | `tauxReussite`       | bleu ciel     | Taux de réussite aux examens (en %)           |
 *
 * ## Fonctionnalités
 *
 * - Sélecteur de métriques : multi‑select pour choisir quelles séries afficher
 * - Sélecteur de plage de dates (via `ActivityChart`)
 * - Totaux dynamiques pour chaque métrique sur la période
 * - Badges de tendance (évolution en %) pour les métriques principales
 * - Export CSV / PNG (callbacks)
 * - Rafraîchissement manuel
 * - États : chargement (skeleton), erreur, vide
 *
 * ## Intégration
 *
 * ```tsx
 * import { AppActivityChart } from '@/features/dashboard/components/admin/AppActivityChart';
 *
 * <AppActivityChart
 *   data={systemActivityData}
 *   isLoading={isLoading}
 *   onRefresh={refetchData}
 * />
 * ```
 *
 * @see {@link ActivityChart} Composant graphique de base
 * @see {@link AdminStatsCards} Cartes statistiques (même page)
 *
 * @author Stive Junior
 * @version 1.0.0
 */

import * as React from 'react';
import {
  Users,
  UserRound,
  Car,
  Calendar,
  ClipboardList,
  CreditCard,
  TrendingDown,
  TrendingUp,
  Activity,
  BarChart2,
  Download,
  RefreshCw,
  GitCompare,
  FileText,
} from 'lucide-react';
import { format, subDays, parseISO, isWithinInterval, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

import {
  ActivityChart,
  type ActivityChartType,
  type ActivitySeries,
  type DateRange,
} from '@/features/dashboard/components/common/ActivityChart';
import { LoadingSkeleton } from '@/features/dashboard/components/common/LoadingSkeleton';
import { EmptyState } from '@/features/dashboard/components/common/EmptyState';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Point de données quotidien pour l'activité globale du système auto‑école.
 * @interface AppActivityDataPoint
 * @property date               - Date au format YYYY-MM-DD
 * @property newCandidats       - Nombre de nouvelles inscriptions candidats
 * @property newMoniteurs       - Nombre de moniteurs recrutés
 * @property newVehicules       - Nombre de véhicules ajoutés au parc
 * @property lecons             - Nombre de leçons effectuées (code + conduite)
 * @property examens            - Nombre d'examens passés
 * @property paiements          - Montant total des paiements (FCFA)
 * @property depenses           - Montant total des dépenses (FCFA)
 * @property tauxReussite       - Taux de réussite aux examens (en %)
 */
export interface AppActivityDataPoint {
  date: string;
  newCandidats: number;
  newMoniteurs: number;
  newVehicules: number;
  lecons: number;
  examens: number;
  paiements: number;
  depenses: number;
  tauxReussite: number;
}

/**
 * Identifiants des métriques disponibles.
 * @typedef {keyof Omit<AppActivityDataPoint, 'date'>} AppMetricKey
 */
export type AppMetricKey = Exclude<keyof AppActivityDataPoint, 'date'>;

/**
 * @interface AppActivityChartProps
 * @description Propriétés du composant `AppActivityChart`.
 */
export interface AppActivityChartProps {
  /**
   * Données d'activité système par jour.
   * Si absent, des données mockées internes sont utilisées.
   */
  data?: AppActivityDataPoint[];

  /**
   * Activer le mode comparaison (période courante vs précédente).
   * @default false
   */
  showComparison?: boolean;

  /**
   * Afficher les badges de tendance dans l'en-tête.
   * @default true
   */
  showTrend?: boolean;

  /**
   * Métriques visibles par défaut.
   * @default ['newCandidats', 'lecons', 'paiements', 'depenses', 'tauxReussite']
   */
  defaultVisibleMetrics?: AppMetricKey[];

  /**
   * Titre affiché dans le CardHeader.
   * @default 'Activité du système'
   */
  title?: string;

  /**
   * Description sous le titre (si absent, génération dynamique).
   */
  description?: string;

  /**
   * Type de graphique par défaut.
   * @default 'area'
   */
  defaultChartType?: ActivityChartType;

  /**
   * Hauteur du graphique en pixels.
   * @default 300
   */
  height?: number;

  /**
   * Afficher la légende des séries.
   * @default true
   */
  showLegend?: boolean;

  // ── État ──────────────────────────────────────────────────────────────────
  /**
   * Afficher le squelette de chargement.
   * @default false
   */
  isLoading?: boolean;

  /**
   * Message d'erreur (null = pas d'erreur).
   * @default null
   */
  error?: string | null;

  // ── Callbacks ─────────────────────────────────────────────────────────────
  /**
   * Callback déclenché lors du changement de plage de dates.
   * @param range - Nouvelle plage
   */
  onDateRangeChange?: (range: DateRange) => void;

  /**
   * Callback déclenché lors du changement de type de graphique.
   * @param type - Nouveau type
   */
  onChartTypeChange?: (type: ActivityChartType) => void;

  /**
   * Callback d'export (CSV ou PNG).
   * @param format - Format d'export
   */
  onExport?: (format: 'csv' | 'png') => void;

  /**
   * Callback de rafraîchissement manuel.
   */
  onRefresh?: () => void;

  // ── Style ─────────────────────────────────────────────────────────────────
  /** Classes CSS additionnelles sur la Card racine */
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION DES MÉTRIQUES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Configuration visuelle d'une métrique.
 * @internal
 */
interface MetricConfig {
  key: AppMetricKey;
  label: string;
  fullLabel: string;
  icon: React.FC<{ className?: string }>;
  color: string;
  description: string;
  group: 'candidats' | 'personnel' | 'finances' | 'performance';
  /** Préfixe pour l'affichage des totaux (ex: "FCFA") */
  prefix?: string;
  /** Suffixe pour l'affichage des totaux (ex: "%") */
  suffix?: string;
}

/**
 * Configuration de toutes les métriques.
 * @constant METRICS_CONFIG
 */
const METRICS_CONFIG: MetricConfig[] = [
  {
    key: 'newCandidats',
    label: 'Candidats',
    fullLabel: 'Nouvelles inscriptions',
    icon: ({ className }) => <Users className={className} />,
    color: 'var(--chart-1)',
    description: 'Nombre de candidats inscrits',
    group: 'candidats',
  },
  {
    key: 'newMoniteurs',
    label: 'Moniteurs',
    fullLabel: 'Moniteurs recrutés',
    icon: ({ className }) => <UserRound className={className} />,
    color: 'var(--chart-2)',
    description: 'Nouveaux moniteurs embauchés',
    group: 'personnel',
  },
  {
    key: 'newVehicules',
    label: 'Véhicules',
    fullLabel: 'Véhicules ajoutés',
    icon: ({ className }) => <Car className={className} />,
    color: 'var(--chart-3)',
    description: 'Véhicules intégrés au parc',
    group: 'personnel',
  },
  {
    key: 'lecons',
    label: 'Leçons',
    fullLabel: 'Leçons effectuées',
    icon: ({ className }) => <Calendar className={className} />,
    color: 'var(--chart-4)',
    description: 'Nombre de leçons de conduite/code',
    group: 'candidats',
  },
  {
    key: 'examens',
    label: 'Examens',
    fullLabel: 'Examens passés',
    icon: ({ className }) => <ClipboardList className={className} />,
    color: 'var(--chart-5)',
    description: 'Nombre d’examens (code + conduite)',
    group: 'performance',
  },
  {
    key: 'paiements',
    label: 'Paiements',
    fullLabel: 'Paiements encaissés',
    icon: ({ className }) => <CreditCard className={className} />,
    color: '#7c3aed', // violet
    description: 'Montant total des paiements (FCFA)',
    group: 'finances',
    suffix: ' FCFA',
  },
  {
    key: 'depenses',
    label: 'Dépenses',
    fullLabel: 'Dépenses',
    icon: ({ className }) => <TrendingDown className={className} />,
    color: '#d97706',
    description: 'Montant total des dépenses (FCFA)',
    group: 'finances',
    suffix: ' FCFA',
  },
  {
    key: 'tauxReussite',
    label: 'Réussite',
    fullLabel: 'Taux de réussite',
    icon: ({ className }) => <Activity className={className} />,
    color: '#0ea5e9',
    description: 'Pourcentage de réussite',
    group: 'performance',
    suffix: '%',
  },
];

/** Métriques visibles par défaut (5 principales) */
const DEFAULT_VISIBLE: AppMetricKey[] = [
  'newCandidats',
  'lecons',
  'paiements',
  'depenses',
  'tauxReussite',
];

// ─────────────────────────────────────────────────────────────────────────────
// DONNÉES MOCKÉES (60 jours)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Génère 60 jours de données d'activité mockées.
 * Tendance réaliste avec weekends plus calmes.
 * @internal
 */
function generateMockData(): AppActivityDataPoint[] {
  const data: AppActivityDataPoint[] = [];
  const now = new Date();

  for (let i = 59; i >= 0; i--) {
    const date = subDays(now, i);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const factor = isWeekend ? 0.4 : 1;
    const growth = 1 + ((59 - i) / 59) * 0.3; // croissance sur la période

    data.push({
      date: format(date, 'yyyy-MM-dd'),
      newCandidats: Math.round((2 + Math.random() * 6) * factor * growth),
      newMoniteurs: Math.round((0.2 + Math.random() * 1.5) * factor),
      newVehicules: Math.round((0.2 + Math.random() * 1.2) * factor),
      lecons: Math.round((8 + Math.random() * 20) * factor * growth),
      examens: Math.round((2 + Math.random() * 6) * factor * growth),
      paiements: Math.round((100000 + Math.random() * 300000) * factor * growth),
      depenses: Math.round(
        (50000 + Math.random() * 150000) * factor * (1 + (Math.random() - 0.5) * 0.2)
      ),
      tauxReussite: Math.round((65 + Math.random() * 25) * factor),
    });
  }

  return data;
}

const DEFAULT_DATA = generateMockData();

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Filtre les données sur une plage de dates. */
function filterByDateRange(data: AppActivityDataPoint[], range: DateRange): AppActivityDataPoint[] {
  return data.filter((d) => {
    const date = parseISO(d.date);
    return isWithinInterval(date, { start: range.from, end: range.to });
  });
}

/** Calcule la plage précédente (même durée). */
function getPreviousRange(range: DateRange): DateRange {
  const dur = differenceInDays(range.to, range.from);
  const prevTo = subDays(range.from, 1);
  const prevFrom = subDays(prevTo, dur);
  return { from: prevFrom, to: prevTo };
}

/** Calcule la tendance entre deux périodes pour une métrique. */
function computeTrend(
  current: AppActivityDataPoint[],
  previous: AppActivityDataPoint[],
  key: AppMetricKey
): { value: number; isPositive: boolean } | null {
  if (!current.length || !previous.length) return null;
  const cur = current.reduce((s, d) => s + d[key], 0);
  const prev = previous.reduce((s, d) => s + d[key], 0);
  if (prev === 0) return null;
  const pct = ((cur - prev) / prev) * 100;
  return { value: Math.abs(pct), isPositive: pct >= 0 };
}

/** Format compact (1.2k, 3.4M, etc.). */
function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return n.toString();
}

/** Formate un montant monétaire en FCFA compact. */
function formatCurrency(n: number): string {
  return `${formatCompact(n)} FCFA`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SOUS-COMPOSANT : Bouton toggle de métrique
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Bouton toggle individuel pour activer/désactiver une métrique.
 * @internal
 */
interface MetricToggleButtonProps {
  metric: MetricConfig;
  isActive: boolean;
  onToggle: (key: AppMetricKey) => void;
}

function MetricToggleButton({
  metric,
  isActive,
  onToggle,
}: MetricToggleButtonProps): React.JSX.Element {
  const Icon = metric.icon;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onToggle(metric.key)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
              'border transition-all duration-150',
              'hover:shadow-sm',
              isActive
                ? 'bg-background text-foreground border-border shadow-sm'
                : 'bg-muted/30 text-muted-foreground border-transparent hover:border-border hover:text-foreground'
            )}
            aria-pressed={isActive}
            aria-label={`${isActive ? 'Masquer' : 'Afficher'} : ${metric.fullLabel}`}
          >
            <span
              className="h-2 w-2 rounded-full shrink-0 transition-opacity"
              style={{ backgroundColor: metric.color, opacity: isActive ? 1 : 0.3 }}
              aria-hidden="true"
            />
            <Icon className="h-3 w-3 shrink-0" />
            <span className="hidden sm:inline">{metric.label}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent className="text-xs">
          <p className="font-medium">{metric.fullLabel}</p>
          <p className="text-muted-foreground">{metric.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Graphique d'activité système global pour l'administrateur de l'auto‑école COS.
 *
 * @param props - {@link AppActivityChartProps}
 * @returns Carte graphique
 */
export function AppActivityChart({
  data: externalData,
  showComparison: initShowComparison = false,
  showTrend = true,
  defaultVisibleMetrics = DEFAULT_VISIBLE,
  title = 'Activité du système',
  description,
  defaultChartType = 'area',
  height = 300,
  showLegend = true,
  isLoading = false,
  error = null,
  onDateRangeChange,
  onChartTypeChange,
  onExport,
  onRefresh,
  className,
}: AppActivityChartProps): React.JSX.Element {
  const data = externalData ?? DEFAULT_DATA;

  // États
  const [showComparison, setShowComparison] = React.useState(initShowComparison);
  const [visibleMetrics, setVisibleMetrics] = React.useState<Set<AppMetricKey>>(
    new Set(defaultVisibleMetrics)
  );
  const [dateRange, setDateRange] = React.useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Données filtrées
  const prevRange = React.useMemo(() => getPreviousRange(dateRange), [dateRange]);
  const currentData = React.useMemo(() => filterByDateRange(data, dateRange), [data, dateRange]);
  const previousData = React.useMemo(() => filterByDateRange(data, prevRange), [data, prevRange]);

  // Totaux pour la période courante
  const totals = React.useMemo(() => {
    const t: Record<AppMetricKey, number> = {} as any;
    for (const m of METRICS_CONFIG) {
      t[m.key] = currentData.reduce((s, d) => s + d[m.key], 0);
    }
    return t;
  }, [currentData]);

  // Tendances des métriques principales
  const candidatsTrend = React.useMemo(
    () => computeTrend(currentData, previousData, 'newCandidats'),
    [currentData, previousData]
  );
  const leconsTrend = React.useMemo(
    () => computeTrend(currentData, previousData, 'lecons'),
    [currentData, previousData]
  );
  const paiementsTrend = React.useMemo(
    () => computeTrend(currentData, previousData, 'paiements'),
    [currentData, previousData]
  );
  const tauxReussiteTrend = React.useMemo(
    () => computeTrend(currentData, previousData, 'tauxReussite'),
    [currentData, previousData]
  );

  // Séries pour ActivityChart
  const activeSeries: ActivitySeries[] = React.useMemo(() => {
    const base = METRICS_CONFIG.filter((m) => visibleMetrics.has(m.key)).map((m) => ({
      key: m.key,
      label: m.fullLabel,
      color: m.color,
      unit: m.suffix ?? '',
    }));
    if (!showComparison) return base;
    // Mode comparaison : dupliquer avec suffixe _prev
    const withPrev: ActivitySeries[] = [];
    base.forEach((s) => {
      withPrev.push({ ...s, label: `${s.label} (période)` });
      withPrev.push({
        ...s,
        key: `${s.key}_prev`,
        label: `${s.label} (précédente)`,
        color: s.color,
        unit: s.unit,
      });
    });
    return withPrev;
  }, [visibleMetrics, showComparison]);

  // Données combinées pour le mode comparaison
  const chartData = React.useMemo(() => {
    if (!showComparison) return currentData as any[];
    const maxLen = Math.max(currentData.length, previousData.length);
    return Array.from({ length: maxLen }, (_, i) => {
      const cur = currentData[i];
      const prev = previousData[i];
      const entry: Record<string, string | number> = { date: cur?.date ?? prev?.date ?? '' };
      if (cur) {
        METRICS_CONFIG.forEach((m) => {
          entry[m.key] = cur[m.key];
        });
      }
      if (prev) {
        METRICS_CONFIG.forEach((m) => {
          entry[`${m.key}_prev`] = prev[m.key];
        });
      }
      return entry;
    });
  }, [currentData, previousData, showComparison]);

  // Description dynamique
  const dynamicDescription =
    description ??
    [
      `${formatCompact(totals.newCandidats)} inscrits`,
      `${formatCompact(totals.lecons)} leçons`,
      `${formatCurrency(totals.paiements)} encaissés`,
    ].join(' · ');

  // Handlers
  const toggleMetric = React.useCallback((key: AppMetricKey) => {
    setVisibleMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size === 1) return prev;
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const handleDateRangeChange = React.useCallback(
    (range: DateRange) => {
      setDateRange(range);
      onDateRangeChange?.(range);
    },
    [onDateRangeChange]
  );

  const handleChartTypeChange = React.useCallback(
    (type: ActivityChartType) => {
      onChartTypeChange?.(type);
    },
    [onChartTypeChange]
  );

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  const handleSelectAllMetrics = () => setVisibleMetrics(new Set(METRICS_CONFIG.map((m) => m.key)));
  const handleSelectDefaultMetrics = () => setVisibleMetrics(new Set(DEFAULT_VISIBLE));

  // États alternatifs
  if (isLoading) {
    return <LoadingSkeleton type="card" count={1} className={cn('h-105', className)} />;
  }
  if (error) {
    return (
      <EmptyState
        title="Erreur de chargement"
        description={error}
        icon={Activity}
        action={{ label: 'Réessayer', onClick: handleRefresh, variant: 'outline' }}
        variant="dashed"
        className={cn('w-full', className)}
      />
    );
  }
  if (!data.length) {
    return (
      <EmptyState
        title="Aucune donnée système"
        description="Aucune activité enregistrée dans le système."
        icon={BarChart2}
        variant="dashed"
        className={cn('w-full', className)}
      />
    );
  }
  if (!chartData.length) {
    return (
      <EmptyState
        title="Aucune activité sur cette période"
        description="Aucune donnée disponible pour la plage sélectionnée."
        icon={Calendar}
        action={{
          label: 'Voir les 30 derniers jours',
          onClick: () => handleDateRangeChange({ from: subDays(new Date(), 30), to: new Date() }),
          variant: 'outline',
        }}
        variant="dashed"
        className={cn('w-full', className)}
      />
    );
  }

  // Rendu principal
  return (
    <Card className={cn('w-full @container/card overflow-hidden rounded-md', className)}>
      <CardHeader className="pb-3 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex items-center justify-center h-7 w-7 rounded-md bg-emerald-700 text-white shrink-0">
                <Activity className="h-4 w-4" />
              </div>
              {title}
            </CardTitle>
            <CardDescription className="text-xs">{dynamicDescription}</CardDescription>

            {showTrend && (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {candidatsTrend && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="outline"
                          className={cn(
                            'gap-1 text-[10px] h-5 px-1.5 border-0 cursor-default rounded-md',
                            candidatsTrend.isPositive
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-700'
                          )}
                        >
                          {candidatsTrend.isPositive ? (
                            <TrendingUp className="h-2.5 w-2.5" />
                          ) : (
                            <TrendingDown className="h-2.5 w-2.5" />
                          )}
                          Inscrits {candidatsTrend.isPositive ? '+' : '-'}
                          {candidatsTrend.value.toFixed(0)}%
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">
                        Évolution des inscriptions
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {leconsTrend && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="outline"
                          className={cn(
                            'gap-1 text-[10px] h-5 px-1.5 border-0 cursor-default rounded-md',
                            leconsTrend.isPositive
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-700'
                          )}
                        >
                          {leconsTrend.isPositive ? (
                            <TrendingUp className="h-2.5 w-2.5" />
                          ) : (
                            <TrendingDown className="h-2.5 w-2.5" />
                          )}
                          Leçons {leconsTrend.isPositive ? '+' : '-'}
                          {leconsTrend.value.toFixed(0)}%
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">Évolution des leçons</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {paiementsTrend && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="outline"
                          className={cn(
                            'gap-1 text-[10px] h-5 px-1.5 border-0 cursor-default rounded-md',
                            paiementsTrend.isPositive
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-700'
                          )}
                        >
                          {paiementsTrend.isPositive ? (
                            <TrendingUp className="h-2.5 w-2.5" />
                          ) : (
                            <TrendingDown className="h-2.5 w-2.5" />
                          )}
                          Paiements {paiementsTrend.isPositive ? '+' : '-'}
                          {paiementsTrend.value.toFixed(0)}%
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">
                        Évolution des encaissements
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Toggle
              aria-label="Mode comparaison"
              size="sm"
              variant="outline"
              pressed={showComparison}
              onPressedChange={setShowComparison}
              className="h-8 text-xs rounded-md"
            >
              <GitCompare className="mr-1 h-3.5 w-3.5" />
              <span className="hidden sm:inline">Comparer</span>
            </Toggle>
            {onExport && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-md">
                    <Download className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline text-xs">Export</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-md">
                  <DropdownMenuItem onClick={() => onExport('csv')} className="gap-2 text-xs">
                    CSV
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onExport('png')} className="gap-2 text-xs">
                    PNG
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 rounded-md"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
              </Button>
            )}
          </div>
        </div>

        {/* Sélecteur de métriques */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
              Métriques affichées
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={handleSelectDefaultMetrics}
                className="text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                Défaut
              </button>
              <span className="text-muted-foreground/50">·</span>
              <button
                onClick={handleSelectAllMetrics}
                className="text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                Tout
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(['candidats', 'personnel', 'finances', 'performance'] as const).map((group, gi) => (
              <React.Fragment key={group}>
                {gi > 0 && (
                  <Separator orientation="vertical" className="h-6 self-center hidden sm:block" />
                )}
                {METRICS_CONFIG.filter((m) => m.group === group).map((metric) => (
                  <MetricToggleButton
                    key={metric.key}
                    metric={metric}
                    isActive={visibleMetrics.has(metric.key)}
                    onToggle={toggleMetric}
                  />
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Totaux rapides (chips) */}
        <div className="flex flex-wrap gap-2">
          {METRICS_CONFIG.filter((m) => visibleMetrics.has(m.key))
            .slice(0, 5)
            .map((m) => (
              <div
                key={m.key}
                className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 rounded-md px-2 py-1"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: m.color }}
                />
                <span className="font-mono font-bold text-foreground tabular-nums">
                  {formatCompact(totals[m.key])}
                  {m.suffix ?? ''}
                </span>
                <span className="hidden sm:inline">{m.label}</span>
              </div>
            ))}
        </div>
      </CardHeader>

      <CardContent className="px-2 pb-2 pt-0 sm:px-4">
        <ActivityChart
          data={chartData}
          series={activeSeries}
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
          defaultChartType={defaultChartType}
          height={height}
          showAxes
          showLegend={showLegend}
          onChartTypeChange={handleChartTypeChange}
          dateKey="date"
          className="border-0 shadow-none rounded-md"
        />
      </CardContent>

      <CardFooter className="border-t border-border/50 px-4 py-3">
        <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
          <span>
            Mis à jour le{' '}
            <span className="font-medium text-foreground">
              {format(new Date(), "d MMM yyyy 'à' HH:mm", { locale: fr })}
            </span>
          </span>
          {tauxReussiteTrend && showTrend && (
            <span className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Taux réussite :{' '}
              <span
                className={cn(
                  'font-medium',
                  tauxReussiteTrend.isPositive ? 'text-emerald-600' : 'text-red-600'
                )}
              >
                {tauxReussiteTrend.isPositive ? '+' : '-'}
                {tauxReussiteTrend.value.toFixed(1)}%
              </span>
            </span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
