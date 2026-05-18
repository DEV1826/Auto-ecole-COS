// src/features/moniteurs/components/MoniteursStatsCards.tsx

/**
 * @module features/moniteurs/components/MoniteursStatsCards
 * @description
 * Grille de 4 cartes statistiques pour la gestion des moniteurs (instructeurs).
 * Utilise les métriques étendues (`MoniteursStatsExtended`) pour afficher :
 * - **Total moniteurs** : effectif total, avec en valeur secondaire le nombre d’inactifs.
 * - **Moniteurs actifs** : instructeurs disponibles, avec en valeur secondaire l’évolution des actifs.
 * - **Total heures de leçons** : cumul des heures de leçons données, avec en valeur secondaire les heures du mois.
 * - **Moyenne heures / moniteur** : moyenne d’heures par moniteur actif, avec en valeur secondaire la moyenne du mois.
 *
 * Chaque carte supporte :
 * - Valeur formatée (nombre court, heures)
 * - Tendance (évolution par rapport à la période précédente)
 * - Sparkline optionnelle (évolution sur plusieurs mois)
 * - Icône personnalisée avec fond coloré
 * - État de chargement (skeleton)
 * - Clic sur la carte (callback)
 *
 * @author Stive Junior
 * @version 2.0.0
 * @see {@link MoniteursStatsExtended} – Métriques étendues
 * @see {@link MoniteursTrends} – Tendances évolutives
 */

import { Users, UserCheck, Clock, Gauge, School } from 'lucide-react';
import {
  StatsGrid,
  type StatsCardProps,
  type StatsTrend,
} from '@/features/dashboard/components/common/StatsCard';
import { EmptyState } from '@/features/dashboard/components/common/EmptyState';
import { cn } from '@/lib/utils';
import type { MoniteursStatsExtended, MoniteursTrends } from '@/types/moniteurs.types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface MoniteursSparklineData {
  values: number[];
  labels?: string[];
}

export interface MoniteursStatsCardsProps {
  /** Métriques statistiques étendues des moniteurs (peut être null pendant le chargement) */
  stats: MoniteursStatsExtended | null;
  /** Tendances évolutives (optionnelles) */
  trends?: Partial<MoniteursTrends>;

  totalMoniteursSparkline?: MoniteursSparklineData;
  actifsSparkline?: MoniteursSparklineData;
  totalHeuresSparkline?: MoniteursSparklineData;
  moyenneHeuresSparkline?: MoniteursSparklineData;

  /** Afficher l’état de chargement (skeleton) */
  isLoading?: boolean;
  /** Callback déclenché au clic sur une carte (reçoit l’identifiant) */
  onCardClick?: (cardId: string) => void;
  /** Classes additionnelles pour la grille */
  className?: string;
  /** Permet de remplacer entièrement les cartes (utilisation avancée) */
  customCards?: StatsCardProps[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilitaires
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formate un nombre en notation compacte (k, M).
 * @internal
 */
function formatCompact(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return num.toString();
}

/**
 * Formate un nombre d’heures avec une décimale si nécessaire.
 * @internal
 */
function formatHours(hours: number): string {
  return hours % 1 === 0 ? hours.toString() : hours.toFixed(1);
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
 * Grille de 4 cartes statistiques pour les moniteurs.
 * Affiche les indicateurs clés : total, actifs, total heures, moyenne d’heures.
 * Les métriques secondaires sont placées dans `secondaryValue`.
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
  const handleCardClick = (cardId: string) => onCardClick?.(cardId);

  // Affichage des squelettes pendant le chargement ou si stats est null
  if (isLoading || !stats) {
    const skeletonCards: StatsCardProps[] = [
      { id: 'skeleton-1', title: '', value: '', icon: null, Color: 'gray' },
      { id: 'skeleton-2', title: '', value: '', icon: null, Color: 'gray' },
      { id: 'skeleton-3', title: '', value: '', icon: null, Color: 'gray' },
      { id: 'skeleton-4', title: '', value: '', icon: null, Color: 'gray' },
    ];
    return (
      <StatsGrid
        cards={skeletonCards}
        cols={2}
        className={cn('w-full', className)}
        isLoading={true}
      />
    );
  }

  // Cartes par défaut (4 cartes)
  const defaultCards: StatsCardProps[] = [
    {
      id: 'total-moniteurs',
      title: 'Total moniteurs',
      value: formatCompact(stats.totalMoniteurs),
      secondaryValue: `${stats.inactifs} inactifs`,
      icon: <Users className="size-5" />,
      Color: 'blue-500',
      trend: buildTrend(trends.totalMoniteurs),
      sparklineData: totalMoniteursSparkline
        ? { values: totalMoniteursSparkline.values, labels: totalMoniteursSparkline.labels }
        : undefined,
      onClick: () => handleCardClick('total-moniteurs'),
    },
    {
      id: 'moniteurs-actifs',
      title: 'Moniteurs actifs',
      value: formatCompact(stats.actifs),
      secondaryValue: `Évolution : ${stats.evolutionActifs >= 0 ? '+' : ''}${stats.evolutionActifs.toFixed(1)}%`,
      icon: <UserCheck className="size-5" />,
      Color: 'emerald-500',
      trend: buildTrend(trends.actifs),
      sparklineData: actifsSparkline
        ? { values: actifsSparkline.values, labels: actifsSparkline.labels }
        : undefined,
      onClick: () => handleCardClick('moniteurs-actifs'),
    },
    {
      id: 'total-heures-lecons',
      title: 'Heures de leçons',
      value: `${formatCompact(stats.totalHeuresLeçons)} h`,
      secondaryValue: `Dont ${formatCompact(stats.heuresMois)} h ce mois`,
      icon: <Clock className="size-5" />,
      Color: 'amber-500',
      trend: buildTrend(trends.totalHeuresLeçons),
      sparklineData: totalHeuresSparkline
        ? { values: totalHeuresSparkline.values, labels: totalHeuresSparkline.labels }
        : undefined,
      onClick: () => handleCardClick('total-heures-lecons'),
    },
    {
      id: 'moyenne-heures',
      title: 'Moyenne / moniteur',
      value: `${formatHours(stats.moyenneHeuresParMoniteur)} h`,
      secondaryValue: `${formatHours(stats.moyenneHeuresParMoniteurMois)} h ce mois`,
      icon: <Gauge className="size-5" />,
      Color: 'purple-500',
      trend: buildTrend(stats.moyenneHeuresParMoniteur),
      sparklineData: moyenneHeuresSparkline
        ? { values: moyenneHeuresSparkline.values, labels: moyenneHeuresSparkline.labels }
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
    return !isNaN(numericValue);
  });

  if (!hasData && !isLoading) {
    return (
      <div className={cn('w-full', className)}>
        <EmptyState
          title="Aucune statistique disponible"
          description="Les données sur les moniteurs seront affichées ici une fois disponibles."
          icon={School}
          variant="dashed"
          className='h-full justify-center'
          size="md"
        />
      </div>
    );
  }

  return (
    <StatsGrid
      cards={cards}
      cols={2}
      className={cn('w-full', className)}
      isLoading={isLoading}
    />
  );
}

export default MoniteursStatsCards;