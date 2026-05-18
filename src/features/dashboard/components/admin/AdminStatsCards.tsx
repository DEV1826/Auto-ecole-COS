// src/features/dashboard/components/admin/AdminStatsCards.tsx

/**
 * @module features/dashboard/components/admin/AdminStatsCards
 * @description
 * Grille de cartes statistiques pour l’administrateur – affiche 4 métriques globales du système.
 * Utilise les métriques réelles des stores :
 * - **Candidats actifs** : depuis `CandidatsStatsExtended`
 * - **Moniteurs actifs** : depuis `MoniteursStatsExtended`
 * - **Véhicules disponibles** : depuis `VehiculesStatsExtended`
 * - **Chiffre d’affaires** (paiements du mois) : depuis `PaiementsStatsExtended`
 *
 * Chaque carte supporte :
 * - Valeur formatée (nombre court : 12.4K, 1.2M)
 * - Tendance (augmentation / diminution) avec badge et pourcentage
 * - Sparkline optionnelle (évolution sur plusieurs mois)
 * - Icône personnalisée avec fond coloré
 * - État de chargement (skeleton)
 * - Clic sur la carte (callback)
 *
 * @author Stive Junior
 * @version 2.0.0
 */

import { Users, UserRound, Car, TrendingUp } from 'lucide-react';
import {
  StatsGrid,
  type StatsCardProps,
  type StatsTrend,
  type SparklineData,
} from '@/features/dashboard/components/common/StatsCard';
import { EmptyState } from '@/features/dashboard/components/common/EmptyState';
import { cn } from '@/lib/utils';
import type { CandidatsStatsExtended, CandidatsTrends } from '@/types/candidats.types';
import type { MoniteursStatsExtended, MoniteursTrends } from '@/types/moniteurs.types';
import type { VehiculesStatsExtended, VehiculesTrends } from '@/types/vehicules.types';
import type { PaiementsStatsExtended, PaiementsTrends } from '@/types/paiements.types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AdminStatsCardsProps {
  /** Statistiques étendues des candidats (peut être null pendant chargement) */
  candidatsStats: CandidatsStatsExtended | null;
  /** Tendances des candidats (optionnelles) */
  candidatsTrends?: Partial<CandidatsTrends>;

  /** Statistiques étendues des moniteurs (peut être null pendant chargement) */
  moniteursStats: MoniteursStatsExtended | null;
  /** Tendances des moniteurs (optionnelles) */
  moniteursTrends?: Partial<MoniteursTrends>;

  /** Statistiques étendues des véhicules (peut être null pendant chargement) */
  vehiculesStats: VehiculesStatsExtended | null;
  /** Tendances des véhicules (optionnelles) */
  vehiculesTrends?: Partial<VehiculesTrends>;

  /** Statistiques étendues des paiements (peut être null pendant chargement) */
  paiementsStats: PaiementsStatsExtended | null;
  /** Tendances des paiements (optionnelles) */
  paiementsTrends?: Partial<PaiementsTrends>;

  /** Sparkline pour l’évolution des candidats actifs */
  candidatsSparkline?: SparklineData;
  /** Sparkline pour l’évolution des moniteurs actifs */
  moniteursSparkline?: SparklineData;
  /** Sparkline pour l’évolution des véhicules disponibles */
  vehiculesSparkline?: SparklineData;
  /** Sparkline pour l’évolution du chiffre d’affaires mensuel */
  revenusSparkline?: SparklineData;

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
 * Formate un nombre en notation courte (K, M).
 * @internal
 */
function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return num.toString();
}

/**
 * Formate un montant en FCFA avec notation compacte.
 * @internal
 */
function formatCurrencyCompact(num: number): string {
  const formatted = formatCompactNumber(num);
  return `${formatted} FCFA`;
}

/**
 * Construit un objet StatsTrend à partir d’une valeur et d’un label.
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
 * Grille de cartes statistiques globales pour l’administrateur.
 * Affiche 4 métriques essentielles avec tendances et courbes miniatures.
 */
export function AdminStatsCards({
  candidatsStats,
  candidatsTrends = {},
  moniteursStats,
  moniteursTrends = {},
  vehiculesStats,
  vehiculesTrends = {},
  paiementsStats,
  paiementsTrends = {},
  candidatsSparkline,
  moniteursSparkline,
  vehiculesSparkline,
  revenusSparkline,
  isLoading = false,
  onCardClick,
  className,
  customCards,
}: AdminStatsCardsProps): React.JSX.Element {
  const handleCardClick = (cardId: string) => onCardClick?.(cardId);

  if (isLoading || (!candidatsStats && !moniteursStats && !vehiculesStats && !paiementsStats)) {
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

  // Cartes par défaut
  const defaultCards: StatsCardProps[] = [
    {
      id: 'total-candidats',
      title: 'Candidats actifs',
      value: formatCompactNumber(candidatsStats?.actifs ?? 0),
      secondaryValue: `${candidatsStats?.total ?? 0} inscrits`,
      icon: <Users className="size-5" />,
      Color: 'blue-800',
      description: 'En cours de formation',
      trend: buildTrend(candidatsTrends.actifs, 'vs période précédente'),
      sparklineData: candidatsSparkline
        ? { values: candidatsSparkline.values, labels: candidatsSparkline.labels }
        : undefined,
      onClick: () => handleCardClick('total-candidats'),
    },
    {
      id: 'total-moniteurs',
      title: 'Moniteurs actifs',
      value: formatCompactNumber(moniteursStats?.actifs ?? 0),
      icon: <UserRound className="size-5" />,
      Color: 'emerald-800',
      description: 'Instructeurs disponibles',
      trend: buildTrend(moniteursTrends.actifs, 'vs période précédente'),
      sparklineData: moniteursSparkline
        ? { values: moniteursSparkline.values, labels: moniteursSparkline.labels }
        : undefined,
      onClick: () => handleCardClick('total-moniteurs'),
    },
    {
      id: 'total-vehicules',
      title: 'Véhicules disponibles',
      value: formatCompactNumber(vehiculesStats?.disponibles ?? 0),
      secondaryValue: `${vehiculesStats?.totalVehicules ?? 0} au total`,
      icon: <Car className="size-5" />,
      Color: 'amber-600',
      description: 'Parc opérationnel',
      trend: buildTrend(vehiculesTrends.disponibles, 'vs période précédente'),
      sparklineData: vehiculesSparkline
        ? { values: vehiculesSparkline.values, labels: vehiculesSparkline.labels }
        : undefined,
      onClick: () => handleCardClick('total-vehicules'),
    },
    {
      id: 'total-revenus',
      title: 'Chiffre d’affaires',
      value: formatCurrencyCompact(paiementsStats?.totalEncaissements ?? 0),
      icon: <TrendingUp className="size-5" />,
      Color: 'purple-800',
      description: 'Paiements encaissés',
      trend: buildTrend(paiementsTrends.totalEncaissements, 'vs mois précédent'),
      sparklineData: revenusSparkline
        ? { values: revenusSparkline.values, labels: revenusSparkline.labels }
        : undefined,
      onClick: () => handleCardClick('total-revenus'),
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
          description="Les données seront affichées ici une fois disponibles."
          icon={Users}
          className='h-full justify-center'
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

export default AdminStatsCards;