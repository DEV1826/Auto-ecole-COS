// src/features/moniteurs/components/MoniteursStatsCards.tsx

/**
 * @module features/moniteurs/components/MoniteursStatsCards
 * @description
 * Grille de cartes statistiques pour la gestion des moniteurs (instructeurs).
 * Utilisable par l'administrateur et le secrétariat.
 *
 * ## Métriques affichées (par défaut)
 * - **Total moniteurs** : effectif total (actifs + inactifs)
 * - **Moniteurs actifs** : instructeurs actuellement disponibles
 * - **Total heures de leçons** : cumul des heures de leçons données (tous moniteurs)
 * - **Moyenne heures / moniteur** : moyenne d'heures par moniteur actif
 *
 * Chaque carte supporte :
 * - Valeur formatée (nombre court, heures)
 * - Tendance (évolution par rapport à la période précédente)
 * - Sparkline optionnelle (évolution sur plusieurs mois)
 * - Icône personnalisée avec fond coloré
 * - État de chargement (skeleton)
 * - Clic sur la carte (callback)
 *
 * Le composant s'intègre au design system COS (gradient bleu, ombre subtile,
 * `backdrop-blur-2xl`, sans bordure). Il utilise `StatsGrid` et `StatsCard` du dossier commun.
 *
 * @example
 * ```tsx
 * <MoniteursStatsCards
 *   stats={{
 *     totalMoniteurs: 8,
 *     actifs: 6,
 *     inactifs: 2,
 *     totalHeuresLeçons: 1240,
 *     moyenneHeuresParMoniteur: 206.7,
 *   }}
 *   trends={{
 *     totalMoniteurs: 0,
 *     actifs: -1,
 *     totalHeuresLeçons: 8.5,
 *   }}
 *   totalHeuresSparkline={{
 *     values: [1100, 1150, 1180, 1200, 1220, 1240],
 *     labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
 *   }}
 *   isLoading={false}
 *   onCardClick={(id) => console.log(id)}
 * />
 * ```
 *
 * @author Stive Junior
 * @version 1.0.0
 * @see {@link MoniteursStats} – Métriques agrégées
 * @see {@link MoniteursTrends} – Tendances évolutives
 * @see {@link StatsCard} – Carte de statistique réutilisable
 * @see {@link StatsGrid} – Grille responsive
 */

import { Users, UserCheck, Clock, Gauge, School } from 'lucide-react';
import {
  StatsGrid,
  type StatsCardProps,
  type StatsTrend,
} from '@/features/dashboard/components/common/StatsCard';
import { EmptyState } from '@/features/dashboard/components/common/EmptyState';
import { cn } from '@/lib/utils';
import type { MoniteursStats, MoniteursTrends } from '@/types/moniteurs.types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Données d'un sparkline (courbe miniature) pour une métrique de moniteur.
 */
export interface MoniteursSparklineData {
  /** Liste des valeurs (ex: [1100, 1150, 1180]) */
  values: number[];
  /** Étiquettes associées aux valeurs (optionnelles) */
  labels?: string[];
}

/**
 * Propriétés du composant `MoniteursStatsCards`.
 */
export interface MoniteursStatsCardsProps {
  /** Métriques statistiques des moniteurs */
  stats: MoniteursStats;
  /** Tendances évolutives (optionnelles) */
  trends?: Partial<MoniteursTrends>;

  /** Sparkline pour le total des moniteurs */
  totalMoniteursSparkline?: MoniteursSparklineData;
  /** Sparkline pour les moniteurs actifs */
  actifsSparkline?: MoniteursSparklineData;
  /** Sparkline pour le total des heures de leçons */
  totalHeuresSparkline?: MoniteursSparklineData;
  /** Sparkline pour la moyenne d'heures par moniteur */
  moyenneHeuresSparkline?: MoniteursSparklineData;

  /** Afficher l’état de chargement (skeleton) */
  isLoading?: boolean;
  /** Callback déclenché au clic sur une carte (reçoit l’identifiant) */
  onCardClick?: (cardId: string) => void;
  /** Classes additionnelles pour la grille */
  className?: string;

  /**
   * Permet de remplacer entièrement les cartes (utilisation avancée).
   * Si fourni, les props `stats` et `trends` sont ignorées.
   */
  customCards?: StatsCardProps[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Fonctions utilitaires
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formate un nombre en notation courte (K, M) pour l’affichage.
 * @param num - Nombre à formater
 * @returns Chaîne formatée
 * @internal
 */
function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}

/**
 * Formate un nombre d'heures (une décimale).
 * @internal
 */
function formatHours(num: number): string {
  return num % 1 === 0 ? num.toString() : num.toFixed(1);
}

/**
 * Construit un objet StatsTrend à partir d’une valeur et d’un label optionnel.
 * @internal
 */
function buildTrend(value: number | undefined, label?: string): StatsTrend | undefined {
  if (value === undefined) return undefined;
  return {
    value,
    isPositive: value > 0,
    label: label ?? 'vs période précédente',
    neutralLabel: 'Stable',
    isPercentage: true,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Grille de cartes statistiques pour les moniteurs.
 * Affiche les indicateurs clés : effectif total, actifs, total heures de leçons,
 * moyenne d'heures par moniteur, avec tendances et sparklines optionnelles.
 */
export function MoniteursStatsCards({
  stats,
  trends = {},
  totalMoniteursSparkline,
  actifsSparkline,
  totalHeuresSparkline,
  moyenneHeuresSparkline,
  isLoading = false,
  onCardClick,
  className,
  customCards,
}: MoniteursStatsCardsProps): React.JSX.Element {
  const handleCardClick = (cardId: string) => {
    onCardClick?.(cardId);
  };

  // Cartes par défaut
  const defaultCards: StatsCardProps[] = [
    {
      id: 'total-moniteurs',
      title: 'Total moniteurs',
      value: formatCompactNumber(stats.totalMoniteurs),
      icon: <Users className="size-5" />,
      iconBg: 'bg-blue-500',
      description: 'Effectif total',
      trend: buildTrend(trends.totalMoniteurs, 'vs période précédente'),
      sparklineData: totalMoniteursSparkline
        ? {
          values: totalMoniteursSparkline.values,
          labels: totalMoniteursSparkline.labels,
        }
        : undefined,
      onClick: () => handleCardClick('total-moniteurs'),
    },
    {
      id: 'moniteurs-actifs',
      title: 'Moniteurs actifs',
      value: formatCompactNumber(stats.actifs),
      icon: <UserCheck className="size-5" />,
      iconBg: 'bg-emerald-500',
      description: 'Disponibles',
      trend: buildTrend(trends.actifs, 'vs période précédente'),
      sparklineData: actifsSparkline
        ? {
          values: actifsSparkline.values,
          labels: actifsSparkline.labels,
        }
        : undefined,
      onClick: () => handleCardClick('moniteurs-actifs'),
    },
    {
      id: 'total-heures-lecons',
      title: 'Heures de leçons',
      value: `${formatCompactNumber(stats.totalHeuresLeçons)} h`,
      icon: <Clock className="size-5" />,
      iconBg: 'bg-amber-500',
      description: 'Cumul toutes périodes',
      trend: buildTrend(trends.totalHeuresLeçons, 'vs période précédente'),
      sparklineData: totalHeuresSparkline
        ? {
          values: totalHeuresSparkline.values,
          labels: totalHeuresSparkline.labels,
        }
        : undefined,
      onClick: () => handleCardClick('total-heures-lecons'),
    },
    {
      id: 'moyenne-heures',
      title: 'Moyenne / moniteur',
      value: `${formatHours(stats.moyenneHeuresParMoniteur)} h`,
      icon: <Gauge className="size-5" />,
      iconBg: 'bg-purple-500',
      description: 'Moyenne sur actifs',
      trend: undefined, // généralement pas de tendance directe, pourrait être ajoutée
      sparklineData: moyenneHeuresSparkline
        ? {
          values: moyenneHeuresSparkline.values,
          labels: moyenneHeuresSparkline.labels,
        }
        : undefined,
      onClick: () => handleCardClick('moyenne-heures'),
    },
  ];

  const cards = customCards ?? defaultCards;

  // Vérification de données significatives
  const hasData = cards.some((card) => {
    const numericValue =
      typeof card.value === 'number'
        ? card.value
        : parseFloat(String(card.value).replace(/[^0-9.-]/g, ''));
    return !isNaN(numericValue) && numericValue > 0;
  });

  if (!hasData && !isLoading) {
    return (
      <div className={cn('w-full', className)}>
        <EmptyState
          title="Aucune statistique disponible"
          description="Les données sur les moniteurs seront affichées ici une fois disponibles."
          icon={School}
          variant="dashed"
          size="md"
        />
      </div>
    );
  }

  return (
    <StatsGrid cards={cards} cols={2} className={cn('w-full', className)} isLoading={isLoading} />
  );
}

export default MoniteursStatsCards;
