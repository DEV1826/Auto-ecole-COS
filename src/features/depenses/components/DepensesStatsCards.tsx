// src/features/depenses/components/DepensesStatsCards.tsx

/**
 * @module features/depenses/components/DepensesStatsCards
 * @description
 * Grille de cartes statistiques pour la gestion des dépenses.
 * Utilise les métriques étendues (`DepensesStatsExtended`) pour afficher :
 * - **Total dépenses** : cumul depuis le début (avec évolution et total annuel)
 * - **Dépenses du mois** : total du mois en cours (avec montant du jour en sous‑titre)
 * - **Carburant** : total des dépenses de carburant (avec tendance)
 * - **Entretien** : total des dépenses d’entretien véhicule (avec tendance)
 *
 * Chaque carte supporte :
 * - Valeur formatée (notation compacte : K, M)
 * - Tendance (évolution par rapport à la période précédente)
 * - Sparkline optionnelle (évolution sur plusieurs mois)
 * - Icône personnalisée avec fond coloré
 * - État de chargement (skeleton)
 * - Clic sur la carte (callback)
 *
 * @author Stive Junior
 * @version 2.0.0
 * @see {@link DepensesStatsExtended} – Métriques étendues
 * @see {@link DepensesTrends} – Tendances évolutives
 */

import { Fuel, Wrench, Calendar, Receipt } from 'lucide-react';
import {
  StatsGrid,
  type StatsCardProps,
  type StatsTrend,
} from '@/features/dashboard/components/common/StatsCard';
import { EmptyState } from '@/features/dashboard/components/common/EmptyState';
import { cn } from '@/lib/utils';
import type { DepensesStatsExtended, DepensesTrends } from '@/types/depenses.types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface DepensesSparklineData {
  values: number[];
  labels?: string[];
}

export interface DepensesStatsCardsProps {
  /** Métriques statistiques étendues des dépenses (peut être null pendant le chargement) */
  stats: DepensesStatsExtended | null;
  /** Tendances évolutives (optionnelles) */
  trends?: Partial<DepensesTrends>;

  totalSparkline?: DepensesSparklineData;
  moisSparkline?: DepensesSparklineData;
  carburantSparkline?: DepensesSparklineData;
  entretienSparkline?: DepensesSparklineData;

  isLoading?: boolean;
  onCardClick?: (cardId: string) => void;
  className?: string;
  customCards?: StatsCardProps[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilitaires
// ─────────────────────────────────────────────────────────────────────────────

function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
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

export function DepensesStatsCards({
  stats,
  trends = {},
  totalSparkline,
  moisSparkline,
  carburantSparkline,
  entretienSparkline,
  isLoading = false,
  onCardClick,
  className,
  customCards,
}: DepensesStatsCardsProps): React.JSX.Element {
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

  // Cartes par défaut avec les métriques étendues
  const defaultCards: StatsCardProps[] = [
    {
      id: 'total-depenses',
      title: 'Total dépenses',
      value: `${formatCompactNumber(stats.totalDepenses)} FCFA`,
      icon: <Receipt className="size-5" />,
      Color: 'blue-500',
      description: `Cumul depuis le début · ${formatCompactNumber(stats.montantAnnee)} FCFA cette année`,
      trend: buildTrend(trends.totalDepenses ?? stats.evolutionTotal, 'vs période précédente'),
      sparklineData: totalSparkline
        ? { values: totalSparkline.values, labels: totalSparkline.labels }
        : undefined,
      onClick: () => handleCardClick('total-depenses'),
    },
    {
      id: 'depenses-mois',
      title: 'Dépenses du mois',
      value: `${formatCompactNumber(stats.depensesMois)} FCFA`,
      icon: <Calendar className="size-5" />,
      Color: 'emerald-500',
      description: `Aujourd'hui : ${formatCompactNumber(stats.montantJour)} FCFA`,
      trend: buildTrend(trends.depensesMois, 'vs mois dernier'),
      sparklineData: moisSparkline
        ? { values: moisSparkline.values, labels: moisSparkline.labels }
        : undefined,
      onClick: () => handleCardClick('depenses-mois'),
    },
    {
      id: 'carburant',
      title: 'Carburant',
      value: `${formatCompactNumber(stats.depensesCarburant)} FCFA`,
      icon: <Fuel className="size-5" />,
      Color: 'amber-500',
      description: 'Total carburant',
      trend: buildTrend(trends.depensesCarburant, 'vs période précédente'),
      sparklineData: carburantSparkline
        ? { values: carburantSparkline.values, labels: carburantSparkline.labels }
        : undefined,
      onClick: () => handleCardClick('carburant'),
    },
    {
      id: 'entretien',
      title: 'Entretien',
      value: `${formatCompactNumber(stats.depensesEntretien)} FCFA`,
      icon: <Wrench className="size-5" />,
      Color: 'purple-500',
      description: 'Réparations & maintenance',
      trend: buildTrend(trends.depensesEntretien, 'vs période précédente'),
      sparklineData: entretienSparkline
        ? { values: entretienSparkline.values, labels: entretienSparkline.labels }
        : undefined,
      onClick: () => handleCardClick('entretien'),
    },
  ];

  const cards = customCards ?? defaultCards;

  // Vérification de données significatives (optionnelle, car stats existe)
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
          description="Les données sur les dépenses seront affichées ici une fois disponibles."
          icon={Receipt}

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

export default DepensesStatsCards;