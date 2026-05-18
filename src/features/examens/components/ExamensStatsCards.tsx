// src/features/examens/components/ExamensStatsCards.tsx

/**
 * @module features/examens/components/ExamensStatsCards
 * @description
 * Grille de cartes statistiques pour la gestion des examens (code et conduite).
 * Utilise les métriques étendues (`ExamensStatsExtended`) pour afficher :
 * - **Total examens** : nombre total d'examens passés (avec tendance)
 * - **Taux de réussite global** : pourcentage d'examens réussis (`RECU`)
 * - **Examens du mois** : nombre d'examens passés ce mois-ci
 * - **Note moyenne conduite** : moyenne des notes des examens pratiques
 *
 * Chaque carte supporte :
 * - Valeur formatée (nombre court ou pourcentage)
 * - Tendance (évolution par rapport à la période précédente)
 * - Sparkline optionnelle (évolution sur plusieurs mois)
 * - Icône personnalisée avec fond coloré
 * - État de chargement (skeleton)
 * - Clic sur la carte (callback)
 *
 * @author Stive Junior
 * @version 2.0.0
 * @see {@link ExamensStatsExtended} – Métriques étendues
 * @see {@link ExamensTrends} – Tendances évolutives
 */

import { ClipboardList, Award, Calendar, TrendingUp } from 'lucide-react';
import {
  StatsGrid,
  type StatsCardProps,
  type StatsTrend,
} from '@/features/dashboard/components/common/StatsCard';
import { EmptyState } from '@/features/dashboard/components/common/EmptyState';
import { cn } from '@/lib/utils';
import type { ExamensStatsExtended, ExamensTrends } from '@/types/examens.types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ExamensSparklineData {
  values: number[];
  labels?: string[];
}

export interface ExamensStatsCardsProps {
  /** Métriques statistiques étendues des examens (peut être null pendant le chargement) */
  stats: ExamensStatsExtended | null;
  /** Tendances évolutives (optionnelles) */
  trends?: Partial<ExamensTrends>;

  totalSparkline?: ExamensSparklineData;
  tauxReussiteSparkline?: ExamensSparklineData;
  examensMoisSparkline?: ExamensSparklineData;
  noteMoyenneSparkline?: ExamensSparklineData;

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

function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return num.toString();
}

function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatNote(value: number): string {
  return value.toFixed(1);
}

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

export function ExamensStatsCards({
  stats,
  trends = {},
  totalSparkline,
  tauxReussiteSparkline,
  examensMoisSparkline,
  noteMoyenneSparkline,
  isLoading = false,
  onCardClick,
  className,
  customCards,
}: ExamensStatsCardsProps): React.JSX.Element {
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

  // Cartes par défaut (4 cartes avec métriques étendues)
  const defaultCards: StatsCardProps[] = [
    {
      id: 'total-examens',
      title: 'Total examens',
      value: formatCompactNumber(stats.totalExamens),
      secondaryValue: `${stats.examensMois} ce mois`,
      icon: <ClipboardList className="size-5" />,
      Color: 'blue-500',
      trend: buildTrend(trends.totalExamens, 'vs période précédente'),
      sparklineData: totalSparkline
        ? { values: totalSparkline.values, labels: totalSparkline.labels }
        : undefined,
      onClick: () => handleCardClick('total-examens'),
    },
    {
      id: 'taux-reussite',
      title: 'Taux de réussite',
      value: formatPercentage(stats.tauxReussiteGlobal),
      secondaryValue: `Évolution : ${stats.evolutionReussite >= 0 ? '+' : ''}${stats.evolutionReussite.toFixed(1)} pts`,
      icon: <Award className="size-5" />,
      Color: 'emerald-500',
      trend: buildTrend(trends.tauxReussiteGlobal, 'vs période précédente'),
      sparklineData: tauxReussiteSparkline
        ? { values: tauxReussiteSparkline.values, labels: tauxReussiteSparkline.labels }
        : undefined,
      onClick: () => handleCardClick('taux-reussite'),
    },
    {
      id: 'examens-mois',
      title: 'Examens du mois',
      value: formatCompactNumber(stats.examensMois),
      secondaryValue: `${stats.reussitesMois} réussites`,
      icon: <Calendar className="size-5" />,
      Color: 'amber-500',
      sparklineData: examensMoisSparkline
        ? { values: examensMoisSparkline.values, labels: examensMoisSparkline.labels }
        : undefined,
      onClick: () => handleCardClick('examens-mois'),
    },
    {
      id: 'note-moyenne',
      title: 'Note moyenne conduite',
      value: formatNote(stats.noteMoyenneConduite),
      secondaryValue: 'Moyenne sur 20',
      icon: <TrendingUp className="size-5" />,
      Color: 'purple-500',
      trend: buildTrend(trends.tauxReussiteGlobal, 'vs période précédente'),
      sparklineData: noteMoyenneSparkline
        ? { values: noteMoyenneSparkline.values, labels: noteMoyenneSparkline.labels }
        : undefined,
      onClick: () => handleCardClick('note-moyenne'),
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
          description="Les données sur les examens seront affichées ici une fois disponibles."
          icon={ClipboardList}
          variant="dashed"
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

export default ExamensStatsCards;