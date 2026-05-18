// src/features/vehicules/components/VehiculesStatsCards.tsx

/**
 * @module features/vehicules/components/VehiculesStatsCards
 * @description
 * Grille de 4 cartes statistiques pour la gestion des véhicules.
 * Utilise les métriques étendues (`VehiculesStatsExtended`) pour afficher :
 * - **Total véhicules** : taille du parc, avec en valeur secondaire le détail des véhicules en entretien et hors service.
 * - **Disponibles** : véhicules libres, avec en valeur secondaire le nombre de véhicules actuellement en leçon.
 * - **Entretiens (année)** : nombre d’interventions, avec en valeur secondaire le coût total des entretiens.
 * - **Kilométrage moyen** : km moyen du parc, avec en valeur secondaire le kilométrage total cumulé.
 *
 * Chaque carte supporte :
 * - Valeur formatée (nombre, km, FCFA)
 * - Tendance (évolution par rapport à la période précédente)
 * - Sparkline optionnelle (évolution sur plusieurs mois)
 * - Icône personnalisée avec fond coloré
 * - État de chargement (skeleton)
 * - Clic sur la carte (callback)
 *
 * @author Stive Junior
 * @version 3.0.0
 * @see {@link VehiculesStatsExtended} – Métriques étendues
 * @see {@link VehiculesTrends} – Tendances évolutives
 */

import { Car, CheckCircle, Wrench, Gauge } from 'lucide-react';
import {
  StatsGrid,
  type StatsCardProps,
  type StatsTrend,
} from '@/features/dashboard/components/common/StatsCard';
import { EmptyState } from '@/features/dashboard/components/common/EmptyState';
import { cn } from '@/lib/utils';
import type { VehiculesStatsExtended, VehiculesTrends } from '@/types/vehicules.types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface VehiculesSparklineData {
  values: number[];
  labels?: string[];
}

export interface VehiculesStatsCardsProps {
  /** Métriques statistiques étendues des véhicules (peut être null pendant le chargement) */
  stats: VehiculesStatsExtended | null;
  /** Tendances évolutives (optionnelles) */
  trends?: Partial<VehiculesTrends>;

  totalSparkline?: VehiculesSparklineData;
  disponiblesSparkline?: VehiculesSparklineData;
  entretiensSparkline?: VehiculesSparklineData;
  kilometrageSparkline?: VehiculesSparklineData;

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
 * Formate un kilométrage (ex: "12 500 km").
 * @internal
 */
function formatKm(km: number): string {
  return km.toLocaleString('fr-FR') + ' km';
}

/**
 * Formate un montant en FCFA (ex: "2.5M FCFA").
 * @internal
 */
function formatCurrency(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M FCFA';
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k FCFA';
  return num.toLocaleString('fr-FR') + ' FCFA';
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
 * Grille de 4 cartes statistiques pour les véhicules.
 * Affiche les indicateurs clés : total, disponibles, entretiens (année), kilométrage moyen.
 * Les métriques secondaires sont placées dans `secondaryValue`.
 */
export function VehiculesStatsCards({
  stats,
  trends = {},
  totalSparkline,
  disponiblesSparkline,
  entretiensSparkline,
  kilometrageSparkline,
  isLoading = false,
  onCardClick,
  className,
  customCards,
}: VehiculesStatsCardsProps): React.JSX.Element {
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
      id: 'total-vehicules',
      title: 'Total véhicules',
      value: formatCompact(stats.totalVehicules),
      secondaryValue: `${stats.enEntretien} en entretien · ${stats.horsService} hors service`,
      icon: <Car className="size-5" />,
      Color: 'blue-500',
      trend: buildTrend(trends.totalVehicules),
      sparklineData: totalSparkline
        ? { values: totalSparkline.values, labels: totalSparkline.labels }
        : undefined,
      onClick: () => handleCardClick('total-vehicules'),
    },
    {
      id: 'disponibles',
      title: 'Disponibles',
      value: formatCompact(stats.disponibles),
      secondaryValue: `${stats.enLecon} en leçon actuellement`,
      icon: <CheckCircle className="size-5" />,
      Color: 'emerald-500',
      trend: buildTrend(trends.disponibles),
      sparklineData: disponiblesSparkline
        ? { values: disponiblesSparkline.values, labels: disponiblesSparkline.labels }
        : undefined,
      onClick: () => handleCardClick('disponibles'),
    },
    {
      id: 'entretiens-annee',
      title: 'Entretiens (année)',
      value: formatCompact(stats.totalEntretiens),
      secondaryValue: `Coût total : ${formatCurrency(stats.coutEntretiensAnnee)}`,
      icon: <Wrench className="size-5" />,
      Color: 'purple-500',
      trend: buildTrend(trends.entretiensAnnee),
      sparklineData: entretiensSparkline
        ? { values: entretiensSparkline.values, labels: entretiensSparkline.labels }
        : undefined,
      onClick: () => handleCardClick('entretiens-annee'),
    },
    {
      id: 'kilometrage-moyen',
      title: 'Kilométrage moyen',
      value: formatKm(stats.kilometrageMoyen),
      secondaryValue: `Total parc : ${formatKm(stats.kilometrageTotal)}`,
      icon: <Gauge className="size-5" />,
      Color: 'indigo-500',
      trend: buildTrend(trends.kilometrageMoyen),
      sparklineData: kilometrageSparkline
        ? { values: kilometrageSparkline.values, labels: kilometrageSparkline.labels }
        : undefined,
      onClick: () => handleCardClick('kilometrage-moyen'),
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
          description="Les données sur les véhicules seront affichées ici une fois disponibles."
          icon={Car}
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

export default VehiculesStatsCards;