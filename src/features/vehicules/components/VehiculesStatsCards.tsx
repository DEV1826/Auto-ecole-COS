// src/features/vehicules/components/VehiculesStatsCards.tsx

/**
 * @module features/vehicules/components/VehiculesStatsCards
 * @description
 * Grille de cartes statistiques pour la gestion des véhicules.
 * Utilisable par l'administrateur et le secrétariat.
 *
 * ## Métriques affichées (par défaut)
 * - **Total véhicules** : taille du parc
 * - **Véhicules disponibles** : libres pour les leçons
 * - **En leçon** : actuellement utilisés
 * - **En entretien** : en maintenance
 * - **Hors service** : indisponibles
 * - **Kilométrage moyen** : km moyen du parc
 * - **Entretiens (année)** : nombre d'interventions
 *
 * Chaque carte supporte :
 * - Valeur formatée (nombre, km)
 * - Tendance (évolution)
 * - Sparkline optionnelle
 * - Icône personnalisée
 * - État de chargement
 * - Clic sur la carte
 *
 * @example
 * ```tsx
 * <VehiculesStatsCards
 *   stats={{
 *     totalVehicules: 12,
 *     disponibles: 5,
 *     enLecon: 4,
 *     enEntretien: 2,
 *     horsService: 1,
 *     kilometrageMoyen: 24500,
 *     entretiensAnnee: 18,
 *   }}
 *   trends={{
 *     disponibles: -2,
 *     kilometrageMoyen: 5.3,
 *   }}
 *   disponiblesSparkline={{
 *     values: [7, 6, 5, 5, 5],
 *     labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai'],
 *   }}
 *   isLoading={false}
 * />
 * ```
 *
 * @author Stive Junior
 * @version 1.0.0
 * @see {@link VehiculesStats} – Métriques agrégées
 * @see {@link VehiculesTrends} – Tendances évolutives
 */

import { Car, CheckCircle, Clock, Gauge } from 'lucide-react';
import {
  StatsGrid,
  type StatsCardProps,
  type StatsTrend,
} from '@/features/dashboard/components/common/StatsCard';
import { EmptyState } from '@/features/dashboard/components/common/EmptyState';
import { cn } from '@/lib/utils';
import type { VehiculesStats, VehiculesTrends } from '@/types/vehicules.types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface VehiculesSparklineData {
  values: number[];
  labels?: string[];
}

export interface VehiculesStatsCardsProps {
  stats: VehiculesStats;
  trends?: Partial<VehiculesTrends>;
  totalSparkline?: VehiculesSparklineData;
  disponiblesSparkline?: VehiculesSparklineData;
  enLeconSparkline?: VehiculesSparklineData;
  kilometrageSparkline?: VehiculesSparklineData;
  entretiensSparkline?: VehiculesSparklineData;
  isLoading?: boolean;
  onCardClick?: (cardId: string) => void;
  className?: string;
  customCards?: StatsCardProps[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilitaires
// ─────────────────────────────────────────────────────────────────────────────

function formatCompact(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return num.toString();
}

function formatKm(km: number): string {
  return formatCompact(km) + ' km';
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

export function VehiculesStatsCards({
  stats,
  trends = {},
  totalSparkline,
  disponiblesSparkline,
  enLeconSparkline,
  kilometrageSparkline,
  isLoading = false,
  onCardClick,
  className,
  customCards,
}: VehiculesStatsCardsProps): React.JSX.Element {
  const handleClick = (id: string) => onCardClick?.(id);

  const defaultCards: StatsCardProps[] = [
    {
      id: 'total-vehicules',
      title: 'Total véhicules',
      value: formatCompact(stats.totalVehicules),
      icon: <Car className="size-5" />,
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
      description: 'Parc total',
      trend: buildTrend(trends.totalVehicules),
      sparklineData: totalSparkline
        ? { values: totalSparkline.values, labels: totalSparkline.labels }
        : undefined,
      onClick: () => handleClick('total-vehicules'),
    },
    {
      id: 'disponibles',
      title: 'Disponibles',
      value: formatCompact(stats.disponibles),
      icon: <CheckCircle className="size-5" />,
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-500',
      description: 'Prêts à rouler',
      trend: buildTrend(trends.disponibles),
      sparklineData: disponiblesSparkline
        ? { values: disponiblesSparkline.values, labels: disponiblesSparkline.labels }
        : undefined,
      onClick: () => handleClick('disponibles'),
    },
    {
      id: 'en-lecon',
      title: 'En leçon',
      value: formatCompact(stats.enLecon),
      icon: <Clock className="size-5" />,
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-500',
      description: 'Actuellement utilisés',
      sparklineData: enLeconSparkline
        ? { values: enLeconSparkline.values, labels: enLeconSparkline.labels }
        : undefined,
      onClick: () => handleClick('en-lecon'),
    },
    {
      id: 'kilometrage-moyen',
      title: 'Kilométrage moyen',
      value: formatKm(stats.kilometrageMoyen),
      icon: <Gauge className="size-5" />,
      iconBg: 'bg-indigo-500/10',
      iconColor: 'text-indigo-500',
      description: 'Moyenne du parc',
      trend: buildTrend(trends.kilometrageMoyen),
      sparklineData: kilometrageSparkline
        ? { values: kilometrageSparkline.values, labels: kilometrageSparkline.labels }
        : undefined,
      onClick: () => handleClick('kilometrage-moyen'),
    },
  ];

  const cards = customCards ?? defaultCards;

  const hasData = cards.some((card) => {
    const v =
      typeof card.value === 'number'
        ? card.value
        : parseFloat(String(card.value).replace(/\D/g, ''));
    return !isNaN(v) && v > 0;
  });

  if (!hasData && !isLoading) {
    return (
      <div className={cn('w-full', className)}>
        <EmptyState
          title="Aucune statistique disponible"
          description="Les données sur les véhicules seront affichées ici."
          icon={Car}
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

export default VehiculesStatsCards;
