// src/features/dashboard/components/admin/FinanceOverviewCard.tsx

/**
 * @module features/dashboard/components/admin/FinanceOverviewCard
 * @description
 * Carte de vue d'ensemble financière pour l'administrateur de l'auto‑école COS.
 *
 * **Design system** : cohérent avec `StatsCard` — thème bleu primaire,
 * `rounded-md`, `ring-0`, gradient `from-primary/5 to-card`, shadow subtile,
 * `backdrop-blur-2xl`. Aucune bordure visible.
 *
 * ## Métriques affichées
 * - **Jauge demi-cercle** (via `VitaRadialChart`) : taux de santé financière
 *   (entrées / flux total × 100). Couleur dynamique (vert ≥75 %, bleu ≥50 %,
 *   amber ≥30 %, rouge sinon).
 * - **Chips KPI** : entrées vs sorties de la période
 * - **Solde caisse** : valeur actuelle + tendance % mensuelle
 * - **Revenus** : encaissements de la période + tendance
 * - **Aujourd'hui** : montant encaissé dans la journée
 *
 * ## Indicateurs & améliorations
 * - Badge de tendance flottant (à côté du titre)
 * - Label de niveau de santé (Excellent / Bon / Équilibré / Critique)
 * - Illustration décorative en bas de la jauge
 * - Sélecteur de période (Aujourd'hui / Semaine / Ce mois / Cette année)
 * - Animation fluide de la jauge
 *
 * @example
 * ```tsx
 * <FinanceOverviewCard
 *   caisseStats={{
 *     soldeActuel: 285000,
 *     totalEntrees: 1250000,
 *     totalSorties: 965000,
 *     entreesMois: 320000,
 *     sortiesMois: 210000,
 *   }}
 *   caisseTrends={{ soldeActuel: 8.5, entreesMois: 5.2 }}
 *   entreesJour={45000}
 *   periode="mois"
 *   onPeriodeChange={(p) => refetch(p)}
 * />
 * ```
 *
 * @author Stive Junior
 * @version 3.1.0
 * @see {@link CaisseStats}    – Statistiques de la caisse
 * @see {@link CaisseTrends}   – Tendances de la caisse
 * @see {@link VitaRadialChart} – Composant radial sous‑jacent
 */

'use client';

import React, { useMemo, useState, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Activity,
  BarChart3,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { VitaRadialChart, type RadialSlice } from '@/components/charts/radials/RadialChart';
import type { CaisseStats, CaisseTrends } from '@/types/caisse.types';

// ─────────────────────────────────────────────────────────────────────────────
// Types publics
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Période de filtrage pour les statistiques financières.
 * @public
 */
export type PeriodeFinance = 'jour' | 'semaine' | 'mois' | 'annee';

/** @internal */
interface PeriodeOption {
  value: PeriodeFinance;
  label: string;
}

/**
 * Propriétés du composant `FinanceOverviewCard`.
 * @public
 */
export interface FinanceOverviewCardProps {
  /**
   * Statistiques agrégées de la caisse.
   * Rechargées lors du changement de période via `onPeriodeChange`.
   */
  caisseStats?: CaisseStats;
  /**
   * Tendances évolutives (en %) des indicateurs de caisse.
   * Alimentent les flèches colorées des métriques footer.
   */
  caisseTrends?: Pick<CaisseTrends, 'soldeActuel' | 'entreesMois'>;
  /**
   * Montant des entrées du jour en cours (FCFA).
   * @default 0
   */
  entreesJour?: number;
  /**
   * Période active du sélecteur.
   * @default 'mois'
   */
  periode?: PeriodeFinance;
  /**
   * Callback lors du changement de période.
   * Doit déclencher un rechargement des données parent.
   */
  onPeriodeChange?: (periode: PeriodeFinance) => void;
  /**
   * Affiche le skeleton de chargement.
   * @default false
   */
  isLoading?: boolean;
  /** Classes CSS additionnelles sur le col-span wrapper. */
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

const PERIODE_OPTIONS: PeriodeOption[] = [
  { value: 'jour', label: "Aujourd'hui" },
  { value: 'semaine', label: 'Semaine' },
  { value: 'mois', label: 'Ce mois' },
  { value: 'annee', label: 'Année' },
];

/** Seuils de couleur pour la jauge */
const GAUGE_COLOR_SCALE = [
  { threshold: 75, color: '#10B981' }, // emerald-500
  { threshold: 50, color: '#10B981' }, // primary
  { threshold: 30, color: '#F59E0B' }, // amber-500
  { threshold: 0, color: '#EF4444' }, // red-500
];

// ─────────────────────────────────────────────────────────────────────────────
// Utilitaires internes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formate un montant en notation compacte sans unité.
 * @internal
 */
function formatCompact(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return num.toLocaleString('fr-FR');
}

/**
 * Calcule le taux de santé financière [0-100].
 * @internal
 */
function calculerTauxSante(entrees: number, sorties: number): number {
  const total = entrees + sorties;
  if (total === 0) return 0;
  return Math.min(100, Math.round((entrees / total) * 10000) / 100);
}

/**
 * Retourne la couleur hex de la jauge selon le taux.
 * @internal
 */
function getGaugeColor(taux: number): string {
  const level = GAUGE_COLOR_SCALE.find((item) => taux >= item.threshold);
  return level ? level.color : GAUGE_COLOR_SCALE[GAUGE_COLOR_SCALE.length - 1].color;
}

/**
 * Retourne le niveau de santé et ses attributs visuels.
 * @internal
 */
function getNiveauSante(taux: number): {
  label: string;
  description: string;
  textClass: string;
  badgeClass: string;
} {
  if (taux >= 80)
    return {
      label: 'Excellent',
      description: 'Les entrées dominent largement. Continue sur cette lancée !',
      textClass: 'text-emerald-600 dark:text-emerald-400',
      badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
    };
  if (taux >= 65)
    return {
      label: 'Bon',
      description: 'Bonne santé financière. Surveillez les sorties.',
      textClass: 'text-blue-600 dark:text-blue-400',
      badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
    };
  if (taux >= 50)
    return {
      label: 'Équilibré',
      description: 'Flux équilibré. Attention aux sorties importantes.',
      textClass: 'text-amber-600 dark:text-amber-400',
      badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    };
  return {
    label: 'Critique',
    description: 'Les sorties dépassent les entrées ce mois-ci.',
    textClass: 'text-red-600 dark:text-red-400',
    badgeClass: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
  };
}

/**
 * Prépare les données pour la jauge radial.
 * @internal
 */
function buildRadialSlice(tauxSante: number, color: string): RadialSlice[] {
  return [
    {
      name: 'Santé financière',
      value: tauxSante,
      color: color,
      unit: '%',
    },
    {
      name: 'Reste',
      value: 100 - tauxSante,
      color: '#E5E7EB', // gray-200
      unit: '%',
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composants
// ─────────────────────────────────────────────────────────────────────────────

/** Skeleton d'une métrique footer. @internal */
function MetricSkeleton(): React.JSX.Element {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <Skeleton className="h-3 w-14 rounded-md" />
      <Skeleton className="h-6 w-18 rounded-md" />
      <Skeleton className="h-2.5 w-10 rounded-md" />
    </div>
  );
}

/**
 * Badge de tendance (hausse / baisse / stable).
 * @internal
 */
function TrendBadge({ value }: { value: number }): React.JSX.Element {
  const isPositive = value > 0;
  const isNeutral = value === 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 ml-1 rounded-md px-2 py-0.5 text-[10px] font-semibold align-middle',
        'shadow-sm backdrop-blur-sm',
        isNeutral
          ? 'bg-muted text-muted-foreground'
          : isPositive
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
            : 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'
      )}
    >
      {isNeutral ? (
        <Minus className="size-2.5" />
      ) : isPositive ? (
        <TrendingUp className="size-2.5" />
      ) : (
        <TrendingDown className="size-2.5" />
      )}
      {isNeutral ? 'Stable' : `${isPositive ? '+' : ''}${value}%`}
    </span>
  );
}

/**
 * Métrique individuelle du footer.
 * @internal
 */
interface MetricFooterItemProps {
  label: string;
  value: string;
  subValue?: string;
  trend?: number;
  icon: React.ReactNode;
}

function MetricFooterItem({
  label,
  value,
  subValue,
  trend,
  icon,
}: MetricFooterItemProps): React.JSX.Element {
  const isPos = (trend ?? 0) > 0;
  const isNeutral = trend === undefined || trend === 0;
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-0">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <div className="flex items-center gap-1">
        <span className="text-muted-foreground/70">{icon}</span>
        <p className="text-base font-bold text-foreground sm:text-lg leading-tight">{value}</p>
        {!isNeutral &&
          (isPos ? (
            <TrendingUp className="size-3.5 text-emerald-500 shrink-0" />
          ) : (
            <TrendingDown className="size-3.5 text-red-500 shrink-0" />
          ))}
      </div>
      {subValue && (
        <p
          className={cn(
            'text-[10px] font-semibold',
            isNeutral
              ? 'text-muted-foreground'
              : isPos
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
          )}
        >
          {subValue}
        </p>
      )}
    </div>
  );
}

/**
 * Illustration SVG décorative de micro-barres (finance).
 * @internal
 */
export function FinanceMicroBars(): React.JSX.Element {
  const heights = [6, 12, 8, 18, 14, 22, 16, 26, 20, 24, 18, 28];
  return (
    <svg
      viewBox="0 0 144 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-8"
      aria-hidden="true"
    >
      {heights.map((h, i) => (
        <rect
          key={i}
          x={i * 12 + 2}
          y={32 - h}
          width="8"
          height={h}
          rx="2"
          className="fill-emerald-600"
          opacity={0.12 + i * 0.065}
        />
      ))}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Carte de vue d'ensemble financière – version optimisée avec jauge radiale.
 */
export function FinanceOverviewCard({
  caisseStats,
  caisseTrends,
  entreesJour = 0,
  periode: periodeProp = 'mois',
  onPeriodeChange,
  isLoading = false,
  className,
}: FinanceOverviewCardProps): React.JSX.Element {
  // ── État local ──────────────────────────────────────────────────────────
  const [periodeActive, setPeriodeActive] = useState<PeriodeFinance>(periodeProp);
  const [showDropdown, setShowDropdown] = useState(false);

  // ── Données calculées ───────────────────────────────────────────────────
  const entrees = useMemo(
    () =>
      !caisseStats
        ? 0
        : periodeActive === 'mois'
          ? caisseStats.entreesMois
          : caisseStats.totalEntrees,
    [caisseStats, periodeActive]
  );

  const sorties = useMemo(
    () =>
      !caisseStats
        ? 0
        : periodeActive === 'mois'
          ? caisseStats.sortiesMois
          : caisseStats.totalSorties,
    [caisseStats, periodeActive]
  );

  const tauxSante = useMemo(() => calculerTauxSante(entrees, sorties), [entrees, sorties]);
  const gaugeColor = useMemo(() => getGaugeColor(tauxSante), [tauxSante]);
  const niveau = useMemo(() => getNiveauSante(tauxSante), [tauxSante]);

  const radialSlice = useMemo(
    () => buildRadialSlice(tauxSante, gaugeColor),
    [tauxSante, gaugeColor]
  );

  const periodeLabel = PERIODE_OPTIONS.find((o) => o.value === periodeActive)?.label ?? 'Ce mois';
  const tendanceSolde = caisseTrends?.soldeActuel ?? 0;
  const tendanceEntrees = caisseTrends?.entreesMois ?? 0;

  // ── Handlers ────────────────────────────────────────────────────────────
  const handlePeriodeChange = useCallback(
    (p: PeriodeFinance) => {
      setPeriodeActive(p);
      setShowDropdown(false);
      onPeriodeChange?.(p);
    },
    [onPeriodeChange]
  );

  // ── Rendu ───────────────────────────────────────────────────────────────
  return (
    <div className={cn('col-span-12 xl:col-span-5', className)}>
      <Card className={cn('rounded-md overflow-hidden flex flex-col h-full', 'backdrop-blur-2xl')}>
        {/* ════ EN-TÊTE ════════════════════════════════════════════════════ */}
        <div className="px-5 pt-5 sm:px-6 sm:pt-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white">
                <BarChart3 className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground leading-tight">
                  Flux Financier
                  <TrendBadge value={tendanceEntrees} />
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Trésorerie · {periodeLabel}</p>
              </div>
            </div>

            {/* Sélecteur de période */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowDropdown((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={showDropdown}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-1.5',
                  'text-xs font-medium text-muted-foreground',
                  'border border-border/50 hover:bg-muted/50 transition-colors'
                )}
              >
                {periodeLabel}
                <ChevronDown
                  className={cn(
                    'size-3.5 transition-transform duration-200',
                    showDropdown && 'rotate-180'
                  )}
                />
              </button>

              {showDropdown && (
                <div className="absolute right-0 z-20 mt-1.5 w-32 rounded-md border border-border bg-card shadow-lg py-1">
                  {PERIODE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handlePeriodeChange(opt.value)}
                      className={cn(
                        'w-full px-3 py-2 text-left text-xs font-medium transition-colors',
                        periodeActive === opt.value
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chips KPI : Entrées vs Sorties */}
          <div className="mt-4 flex flex-wrap gap-2">
            {isLoading ? (
              <>
                <Skeleton className="h-7 w-28 rounded-md" />
                <Skeleton className="h-7 w-24 rounded-md" />
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2.5 py-1">
                  <ArrowDownLeft className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    +{formatCompact(entrees)} FCFA
                  </span>
                  <span className="text-[10px] text-emerald-600/60 dark:text-emerald-500/60 uppercase tracking-wide">
                    entrées
                  </span>
                </div>
                <div className="flex items-center gap-1.5 rounded-md bg-red-500/10 px-2.5 py-1">
                  <ArrowUpRight className="size-3.5 text-red-600 dark:text-red-400 shrink-0" />
                  <span className="text-xs font-bold text-red-700 dark:text-red-400">
                    −{formatCompact(sorties)} FCFA
                  </span>
                  <span className="text-[10px] text-red-600/60 dark:text-red-500/60 uppercase tracking-wide">
                    sorties
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ════ JAUGE RADIAL (VitaRadialChart) ═══════════════════════════════ */}
        <div className="relative flex-1 px-5 pt-3 sm:px-6">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="h-40 w-40 rounded-full" />
            </div>
          ) : (
            <div
              className="relative flex flex-col items-center w-full transition-all duration-130 ease-in-out"
              style={{ minHeight: 180 }}
            >
              {/* Graphique radial demi‑cercle */}
              <VitaRadialChart
                data={radialSlice}
                variant="single"
                maxValue={100}
                centerLabel={`${tauxSante.toFixed(1)}%`}
                centerSubLabel={niveau.label}
                showBackground
                showLegend={true}
                cornerRadius={8}
                className="w-full"
                height={200}
              />
            </div>
          )}

          {/* Message contextuel */}
          {!isLoading ? (
            <p className="mx-auto mt-2 max-w-64 text-center text-[11px] leading-relaxed text-muted-foreground">
              {niveau.description}
            </p>
          ) : (
            <Skeleton className="mx-auto mt-2 h-3.5 w-56" />
          )}
        </div>

        {/* ════ FOOTER MÉTRIQUES ═════════════════════════════════════════════ */}
        <div className="mt-2 border-t border-border/30">
          <div className="flex items-center justify-around px-4 py-4 gap-1">
            {isLoading ? (
              <>
                <MetricSkeleton />
                <div className="h-10 w-px bg-border/40 shrink-0" />
                <MetricSkeleton />
                <div className="h-10 w-px bg-border/40 shrink-0" />
                <MetricSkeleton />
              </>
            ) : (
              <>
                <MetricFooterItem
                  label="Solde"
                  value={formatCompact(caisseStats?.soldeActuel ?? 0)}
                  subValue={
                    tendanceSolde !== 0
                      ? `${tendanceSolde > 0 ? '+' : ''}${tendanceSolde}% /mois`
                      : 'stable'
                  }
                  trend={tendanceSolde}
                  icon={<Wallet className="size-3.5" />}
                />
                <div className="h-10 w-px bg-border/40 shrink-0" />
                <MetricFooterItem
                  label="Revenus"
                  value={formatCompact(entrees)}
                  subValue={
                    tendanceEntrees !== 0
                      ? `${tendanceEntrees > 0 ? '+' : ''}${tendanceEntrees}%`
                      : 'stable'
                  }
                  trend={tendanceEntrees}
                  icon={<ArrowDownLeft className="size-3.5" />}
                />
                <div className="h-10 w-px bg-border/40 shrink-0" />
                <MetricFooterItem
                  label="Auj."
                  value={formatCompact(entreesJour)}
                  subValue={entreesJour > 0 ? 'FCFA' : 'Aucune'}
                  icon={<Activity className="size-3.5" />}
                />
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

export default FinanceOverviewCard;
