// src/features/depenses/components/DepensesStatsCards.tsx

/**
 * @module features/depenses/components/DepensesStatsCards
 * @description
 * Grille de cartes statistiques pour la gestion des dépenses.
 * Utilisable par l'administrateur et le secrétariat.
 *
 * ## Métriques affichées (par défaut)
 * - **Total dépenses** : somme cumulée de toutes les dépenses (avec tendance)
 * - **Dépenses du mois** : total des dépenses du mois en cours
 * - **Carburant** : total des dépenses de carburant (avec tendance)
 * - **Entretien** : total des dépenses d’entretien véhicule
 *
 * Chaque carte supporte :
 * - Valeur formatée (notation compacte : K, M)
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
 * // Dashboard admin
 * <DepensesStatsCards
 *   stats={{
 *     totalDepenses: 850000,
 *     nombreTransactions: 24,
 *     depensesMois: 210000,
 *     depensesCarburant: 95000,
 *     depensesEntretien: 115000,
 *   }}
 *   trends={{
 *     totalDepenses: 5.2,
 *     depensesMois: -3,
 *     depensesCarburant: 12,
 *     depensesEntretien: 2.5,
 *   }}
 *   isLoading={false}
 *   onCardClick={(id) => console.log(id)}
 * />
 * ```
 *
 * @author Stive Junior
 * @version 1.0.0
 * @see {@link DepensesStats} – Métriques agrégées
 * @see {@link DepensesTrends} – Tendances évolutives
 * @see {@link StatsCard} – Carte de statistique réutilisable
 * @see {@link StatsGrid} – Grille responsive
 */

import { Fuel, Wrench, Calendar, Receipt } from 'lucide-react';
import {
  StatsGrid,
  type StatsCardProps,
  type StatsTrend,
} from '@/features/dashboard/components/common/StatsCard';
import { EmptyState } from '@/features/dashboard/components/common/EmptyState';
import { cn } from '@/lib/utils';
import type { DepensesStats, DepensesTrends } from '@/types/depenses.types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Données d'un sparkline (courbe miniature) pour une métrique de dépense.
 */
export interface DepensesSparklineData {
  /** Liste des valeurs (ex: [120000, 135000, 140000, 155000]) */
  values: number[];
  /** Étiquettes associées aux valeurs (optionnelles) */
  labels?: string[];
}

/**
 * Propriétés du composant `DepensesStatsCards`.
 */
export interface DepensesStatsCardsProps {
  /** Métriques statistiques des dépenses */
  stats: DepensesStats;
  /** Tendances évolutives (optionnelles) */
  trends?: Partial<DepensesTrends>;

  /** Sparkline pour le total des dépenses */
  totalSparkline?: DepensesSparklineData;
  /** Sparkline pour les dépenses du mois */
  moisSparkline?: DepensesSparklineData;
  /** Sparkline pour les dépenses de carburant */
  carburantSparkline?: DepensesSparklineData;
  /** Sparkline pour les dépenses d'entretien */
  entretienSparkline?: DepensesSparklineData;

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
 * Formate un montant en FCFA avec notation courte (K, M).
 * Exemples : 2 300 → "2.3k", 1 250 000 → "1.3M"
 * @param num - Montant en FCFA
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
 * Grille de cartes statistiques pour les dépenses.
 * Affiche les indicateurs clés : total, dépenses du mois, carburant, entretien
 * avec tendances et sparklines optionnelles.
 */
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
  const handleCardClick = (cardId: string) => {
    onCardClick?.(cardId);
  };

  // Cartes par défaut
  const defaultCards: StatsCardProps[] = [
    {
      id: 'total-depenses',
      title: 'Total dépenses',
      value: `${formatCompactNumber(stats.totalDepenses)} FCFA`,
      icon: <Receipt className="size-5" />,
      iconBg: 'bg-blue-500',
      description: 'Cumul depuis le début',
      trend: buildTrend(trends.totalDepenses, 'vs période précédente'),
      sparklineData: totalSparkline
        ? {
            values: totalSparkline.values,
            labels: totalSparkline.labels,
          }
        : undefined,
      onClick: () => handleCardClick('total-depenses'),
    },
    {
      id: 'depenses-mois',
      title: 'Dépenses du mois',
      value: `${formatCompactNumber(stats.depensesMois)} FCFA`,
      icon: <Calendar className="size-5" />,
      iconBg: 'bg-emerald-500',
      description: 'Mois en cours',
      trend: buildTrend(trends.depensesMois, 'vs mois dernier'),
      sparklineData: moisSparkline
        ? {
            values: moisSparkline.values,
            labels: moisSparkline.labels,
          }
        : undefined,
      onClick: () => handleCardClick('depenses-mois'),
    },
    {
      id: 'carburant',
      title: 'Carburant',
      value: `${formatCompactNumber(stats.depensesCarburant)} FCFA`,
      icon: <Fuel className="size-5" />,
      iconBg: 'bg-amber-500',
      description: 'Total carburant',
      trend: buildTrend(trends.depensesCarburant, 'vs période précédente'),
      sparklineData: carburantSparkline
        ? {
            values: carburantSparkline.values,
            labels: carburantSparkline.labels,
          }
        : undefined,
      onClick: () => handleCardClick('carburant'),
    },
    {
      id: 'entretien',
      title: 'Entretien',
      value: `${formatCompactNumber(stats.depensesEntretien)} FCFA`,
      icon: <Wrench className="size-5" />,
      iconBg: 'bg-purple-500',
      description: 'Réparations & maintenance',
      trend: buildTrend(trends.depensesEntretien, 'vs période précédente'),
      sparklineData: entretienSparkline
        ? {
            values: entretienSparkline.values,
            labels: entretienSparkline.labels,
          }
        : undefined,
      onClick: () => handleCardClick('entretien'),
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
          description="Les données sur les dépenses seront affichées ici une fois disponibles."
          icon={Receipt}
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

export default DepensesStatsCards;
