'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/dashboard/components/common/StatsCard.tsx

/**
 * @module dashboard/components/common/StatsCard
 * @description
 * Carte de statistique pour les tableaux de bord  Auto-École COS.
 *
 * Design inspiré du maquette Figma (Frame 121) :
 * - Icône colorée à gauche (fond coloré, rx modéré "rounded-xl")
 * - Colonne droite : titre (description grisée), valeur principale en large,
 *   tendance inline en bas (icône + valeur colorée + label)
 * - Badge trend compact en haut à droite (CardAction)
 * - Mini graphique (sparkline) optionnel affichant l'évolution de la tendance (desktop uniquement)
 * - Pas de footer avec bordure — la tendance est intégrée sous la valeur
 * - Pas de dropdown d'actions
 * - Gradient subtil de fond (from-primary/5 to-card) comme le style ShadCN dashboard
 * - Responsive : s'adapte de 1 colonne (mobile) à 4 colonnes (@5xl)
 *
 * @author Stive Junior
 * @version 3.0.0
 *
 * @example
 * ```tsx
 * <StatsCard
 *   title="Nombres de patients"
 *   value={12}
 *   icon={<Users className="size-5" />}
 *   iconBg="bg-emerald-500"
 *   trend={{ value: 3, isPositive: true, label: "cette semaine", prefix: "+", suffix: " Patients" }}
 *   sparklineData={{ values: [10, 12, 15, 18, 20, 22, 24], labels: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"] }}
 * />
 * ```
 */

import * as React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { VitaAreaChart } from '@/components/charts';
import type { AreaSeries } from '@/components/charts/area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @interface StatsTrend
 * @description Configuration de la tendance affichée sous la valeur et dans le badge.
 */
export interface StatsTrend {
  /**
   * Valeur numérique de la tendance.
   * - Si `0`, affiche `neutralLabel` (ex: "Aucun changement").
   * - Si positif, affiche en vert avec TrendingUp.
   * - Si négatif, affiche en rouge avec TrendingDown.
   */
  value: number;

  /**
   * Direction explicite de la tendance.
   * Si non fournie, elle est déduite du signe de `value`.
   * Utile pour forcer une couleur indépendamment du signe
   * (ex: une baisse de dépenses = positif métier).
   */
  isPositive?: boolean;

  /**
   * Texte affiché après la valeur (ex: "cette semaine", "ce mois").
   */
  label?: string;

  /**
   * Texte affiché à la place de la valeur quand `value === 0`
   * (ex: "Aucun changement").
   * Défaut : "Stable"
   */
  neutralLabel?: string;

  /**
   * Si true, ajoute "%" à la valeur affichée.
   * Défaut : false
   */
  isPercentage?: boolean;

  /**
   * Préfixe ajouté avant la valeur (ex: "+", "−").
   * Si non fourni, le signe est automatiquement ajouté.
   */
  prefix?: string;

  /**
   * Suffixe ajouté après la valeur et avant le label
   * (ex: " Patients", " RDV").
   */
  suffix?: string;
}

/**
 * @interface SparklineData
 * @description Données pour le mini graphique d'évolution (sparkline).
 */
export interface SparklineData {
  /** Tableau des valeurs numériques (évolution dans le temps) */
  values: number[];
  /** Étiquettes optionnelles pour l'axe X (ex: jours, mois) */
  labels?: string[];
  /** Couleur personnalisée pour la ligne/zone (défaut : couleur de la tendance) */
  color?: string;
  /** Hauteur du graphique en pixels (défaut : 40) */
  height?: number;
}

/**
 * @interface StatsCardProps
 * @description Propriétés du composant StatsCard v2.
 */
export interface StatsCardProps {
  // ── Contenu ─────────────────────────────────────────────
  /**ID */
  id: string;

  /** Titre de la métrique (affiché en description grisée) */
  title: string;

  /** Description optionnelle (sous-titre) */
  description?: string;

  /** Valeur principale — nombre, chaîne formatée, pourcentage */
  value: string | number;

  /**
   * Valeur secondaire optionnelle (affichée en plus petit sous la valeur principale)
   * Exemple: pourcentage associé à une valeur absolue (18/24 + 75%)
   */
  secondaryValue?: string | number;

  /**
   * Icône affichée dans le bloc coloré à gauche.
   * Passer un `<Component className="size-5" />` directement.
   */
  icon?: React.ReactNode;

  // ── Icône ────────────────────────────────────────────────
  /**
   * Classe Tailwind du fond de l'icône.
   * Défaut : `"bg-primary"`
   * @example "bg-emerald-500" | "bg-amber-400" | "bg-slate-700"
   */
  iconBg?: string;

  /**
   * Classe Tailwind de la couleur de l'icône.
   * Défaut : `"text-white"`
   */
  iconColor?: string;

  /**
   * Configuration du badge affiché sous la valeur.
   */
  badge?: { label: string; colorClass: string };

  // ── Tendance ─────────────────────────────────────────────
  /** Configuration de la tendance (badge + ligne sous la valeur) */
  trend?: StatsTrend;

  // ── Mini graphique (sparkline) ───────────────────────────
  /** Données pour afficher un mini graphique d'évolution (visible sur desktop uniquement) */
  sparklineData?: SparklineData;

  // ── États ────────────────────────────────────────────────
  /** Affiche un squelette de chargement */
  isLoading?: boolean;

  /** Rend la carte cliquable */
  onClick?: () => void;

  // ── Style ────────────────────────────────────────────────
  /** Classes CSS additionnelles sur la Card */
  className?: string;

  /** Classes CSS additionnelles sur la valeur */
  ClassValue?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers internes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Résout la direction de la tendance.
 * @internal
 */
function resolveTrendDirection(trend: StatsTrend): 'positive' | 'negative' | 'neutral' {
  if (trend.value === 0) return 'neutral';
  if (trend.isPositive !== undefined) return trend.isPositive ? 'positive' : 'negative';
  return trend.value > 0 ? 'positive' : 'negative';
}

/**
 * Formate la valeur de tendance affichée.
 * @internal
 */
function formatTrendValue(trend: StatsTrend): string {
  if (trend.value === 0) return trend.neutralLabel ?? 'Stable';

  const abs = Math.abs(trend.value);
  const display = trend.isPercentage ? `${abs}%` : `${abs}`;
  const defaultPrefix =
    trend.isPositive !== undefined ? (trend.isPositive ? '+' : '−') : trend.value > 0 ? '+' : '−';
  const prefix = trend.prefix ?? defaultPrefix;
  const suffix = trend.suffix ?? '';

  return `${prefix}${display}${suffix}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composant : Icône de tendance
// ─────────────────────────────────────────────────────────────────────────────

interface TrendIconProps {
  direction: 'positive' | 'negative' | 'neutral';
  className?: string;
}

function TrendIcon({ direction, className }: TrendIconProps): React.JSX.Element | null {
  const base = cn('size-3.5 shrink-0', className);
  switch (direction) {
    case 'positive':
      return <TrendingUp className={cn(base, 'text-emerald-500')} />;
    case 'negative':
      return <TrendingDown className={cn(base, 'text-red-500')} />;
    default:
      return <Minus className={cn(base, 'text-muted-foreground')} />;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composant : Sparkline (mini graphique)
// ─────────────────────────────────────────────────────────────────────────────

interface SparklineProps {
  data: SparklineData;
  trendDirection: 'positive' | 'negative' | 'neutral';
}

function Sparkline({ data, trendDirection }: SparklineProps): React.JSX.Element | null {
  const { values, labels, color, height = 40 } = data;
  const uniqueId = React.useId();

  if (!values || values.length < 2) return null;

  // Convertir les données pour le graphique
  const chartData = values.map((val, idx) => ({
    date: labels?.[idx] || `P${idx + 1}`,
    [uniqueId]: val,
  }));

  // Déterminer la couleur par défaut selon la tendance
  let defaultColor = 'var(--chart-1)';
  if (trendDirection === 'positive') defaultColor = 'var(--chart-2)';
  if (trendDirection === 'negative') defaultColor = 'var(--destructive)';
  const lineColor = color || defaultColor;

  const series: AreaSeries[] = [
    {
      key: uniqueId,
      label: 'Évolution',
      color: lineColor,
      unit: '',
    },
  ];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="cursor-help">
          <VitaAreaChart
            data={chartData as any}
            series={series}
            dateKey="date"
            height={height}
            showAxes={false}
            showLegend={false}
            showGrid={false}
            variant="gradient"
            tooltipIndicator="dot"
            showTootlip={false}
            xTickFormatter={() => ''}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="p-2 text-xs bg-foreground text-background">
        <div className="space-y-1">
          {values.map((v, i) => (
            <div key={i} className="flex justify-between gap-4">
              <span className="text-muted-foreground">{labels?.[i] || `Jour ${i + 1}`}</span>
              <span className="font-medium">{v}</span>
            </div>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Carte de statistique  Auto-École COS — v3.
 * Layout : icône à gauche, infos à droite, badge trend en haut-droite,
 * tendance inline sous la valeur, et mini graphique optionnel (desktop).
 */
export function StatsCard({
  title,
  description,
  value,
  secondaryValue,
  icon,
  iconBg = 'bg-primary',
  iconColor = 'text-white',
  trend,
  sparklineData,
  badge,
  isLoading = false,
  onClick,
  className,
  ClassValue,
}: StatsCardProps): React.JSX.Element {
  // ── Squelette ────────────────────────────────────────────
  if (isLoading) {
    return (
      <Card className={cn('overflow-hidden @container/card flex flex-col rounded-xs ', className)}>
        <CardHeader className="flex flex-row items-center gap-4 p-2">
          <Skeleton className="size-12 rounded-xl shrink-0" />
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-3.5 w-36" />
          </div>
        </CardHeader>
      </Card>
    );
  }

  // ── Tendance ─────────────────────────────────────────────
  const direction = trend ? resolveTrendDirection(trend) : undefined;
  const trendText = trend ? formatTrendValue(trend) : undefined;
  const isNeutral = direction === 'neutral';
  const isPositive = direction === 'positive';

  const trendValueClass = cn(
    'font-semibold',
    isNeutral && 'text-muted-foreground',
    isPositive && 'text-emerald-600 dark:text-emerald-400',
    !isNeutral && !isPositive && 'text-red-500 dark:text-red-400'
  );

  return (
    <Card
      className={cn(
        '@container/card rounded-xs p-5! ',
        'flex flex-col justify-between ',
        'group relative overflow-hidden h-full transition-all duration-300',
        'backdrop-blur-2xl',
        onClick && 'cursor-pointer hover:shadow-md hover:border-border/80 gap-1',
        className
      )}
      onClick={onClick}
    >
      {/* En-tête : infos + icône */}
      <div className="mb-2 flex items-center justify-between">
        {/* Bloc texte (titre + tendance) */}
        <div>
          {title && (
            <h3 className="text-base font-semibold text-gray-700 dark:text-gray-400">{title}</h3>
          )}
          {/* Tendance inline - uniquement si toutes les données sont présentes */}
          {trend?.value != null && direction && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              {!isNeutral && <TrendIcon direction={direction} />}
              {trendText && <span className={cn('text-xs', trendValueClass)}>{trendText}</span>}
              {trend.label && <span className="text-xs text-muted-foreground">{trend.label}</span>}
            </div>
          )}
          {/* Valeur secondaire */}
          {secondaryValue && (
            <div className="mt-0.5 text-xs text-muted-foreground">{secondaryValue}</div>
          )}
        </div>

        {/* Icône (optionnelle) */}
        {icon && (
          <div
            className={cn(
              'flex size-12 shrink-0 items-center justify-center rounded-xs',
              iconBg,
              iconColor
            )}
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
      </div>

      {/* Partie basse : valeur principale + secondaire + sparkline */}
      <div className="flex items-end justify-between">
        {/* Valeur principale - rendue uniquement si elle existe */}
        {value !== undefined && value !== null && (
          <h2
            className={cn(
              'w-1/2 text-3xl font-semibold text-gray-800 dark:text-white/90',
              ClassValue
            )}
          >
            {value}
          </h2>
        )}

        {/* Sparkline : seulement sur desktop, et si toutes les données nécessaires existent */}
        {sparklineData && direction && !isNeutral && (
          <div className="h-11 w-1/2 max-w-full">
            <Sparkline data={sparklineData} trendDirection={direction} />
          </div>
        )}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Grille de cartes (wrapper prêt à l'emploi)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @interface StatsGridProps
 * @description Propriétés du wrapper de grille de StatsCard.
 */
export interface StatsGridProps {
  /** Tableau de propriétés de cartes à rendre */
  cards: StatsCardProps[];
  /** Classes CSS additionnelles sur le conteneur */
  className?: string;
  /** Affiche un squelette de chargement */
  isLoading?: boolean;
  /**
   * Nombre de colonnes max.
   * Défaut : adaptatif (1 → 2 → 4 selon la largeur du conteneur).
   */
  cols?: 2 | 3 | 4;
}

/**
 * Grille responsive de StatsCard avec carrousel horizontal sur mobile.
 *
 * - **Mobile** : les cartes défilent horizontalement dans un `ScrollArea`
 *   avec un effet de flou progressif sur les bords (`mask-image`).
 * - **Desktop** : grille classique (2, 3 ou 4 colonnes selon la prop `cols`).
 *
 * @example
 * ```tsx
 * <StatsGrid
 *   cards={[
 *     { title: "Patients", value: 12, icon: <Users />, iconBg: "bg-emerald-500", trend: {...}, sparklineData: {...} },
 *     { title: "Rendez-vous", value: 7, icon: <Calendar />, iconBg: "bg-amber-400", trend: {...} },
 *     { title: "Observances", value: "19.6%", icon: <Activity />, iconBg: "bg-slate-700", trend: {...} },
 *   ]}
 * />
 * ```
 */

/**
 * Grille responsive de StatsCard avec carrousel horizontal sur mobile.
 *
 * - **Mobile** : les cartes défilent horizontalement dans un `ScrollArea`
 *   avec un effet de flou progressif sur les bords (`mask-image`).
 * - **Desktop** : grille classique (2, 3 ou 4 colonnes selon la prop `cols`).
 *
 * @example
 * ```tsx
 * <StatsGrid
 *   cards={[
 *     { title: "Patients", value: 12, icon: <Users />, iconBg: "bg-emerald-500", trend: {...}, sparklineData: {...} },
 *     { title: "Rendez-vous", value: 7, icon: <Calendar />, iconBg: "bg-amber-400", trend: {...} },
 *     { title: "Observances", value: "19.6%", icon: <Activity />, iconBg: "bg-slate-700", trend: {...} },
 *   ]}
 * />
 * ```
 */
export function StatsGrid({
  cards,
  className,
  cols = 4,
  isLoading = false,
}: StatsGridProps): React.JSX.Element {
  const isMobile = useIsMobile();

  const desktopColsClass = isMobile
    ? 'sm:grid-cols-2'
    : cols === 2
      ? 'md:grid-cols-2'
      : cols === 3
        ? 'md:grid-cols-2 xl:grid-cols-3'
        : 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

  return (
    <Card className="rounded-xs bg-blue-500/10 p-1 dark:bg-white/3 h-full">
      {/* ═══ Desktop : grille standard ═══ */}
      <div
        className={cn(
          'grid gap-2 ',
          desktopColsClass,
          !isLoading &&
            '*:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs dark:*:data-[slot=card]:bg-card',
          className
        )}
      >
        {cards.map((card, i) => (
          <StatsCard key={i} {...card} isLoading={isLoading} />
        ))}
      </div>
    </Card>
  );
}
