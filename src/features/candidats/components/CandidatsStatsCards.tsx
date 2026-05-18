// src/features/candidats/components/CandidatsStatsCards.tsx

/**
 * @module features/candidats/components/CandidatsStatsCards
 * @description
 * Grille de cartes statistiques pour la gestion des candidats (élèves).
 * Utilisable par l'administrateur, le secrétariat et les moniteurs.
 *
 * ## Métriques affichées (par défaut)
 * - **Total candidats** : tous statuts confondus (avec tendance)
 * - **Candidats actifs** : en cours de formation (statut EN_COURS)
 * - **Taux de réussite** : pourcentage de candidats reçus (réussite code+conduite)
 * - **Candidats reçus** : nombre total de permis obtenus (avec tendance)
 *
 * Chaque carte supporte :
 * - Valeur formatée (nombre court ou pourcentage)
 * - Tendance (évolution par rapport à la période précédente)
 * - Sparkline optionnelle (évolution sur plusieurs mois/semaines)
 * - Icône personnalisée avec fond coloré
 * - État de chargement (skeleton)
 * - Clic sur la carte (callback)
 *
 * Le composant s'intègre au design system COS. Il utilise `StatsGrid` et `StatsCard` du dossier commun.
 *
 * @example
 * ```tsx
 * // Dashboard admin
 * <CandidatsStatsCards
 *   stats={{
 *     total: 156,
 *     actifs: 98,
 *     reçus: 45,
 *     echecs: 13,
 *     tauxReussite: 77.5,
 *     enAttente: 12,
 *     abandonnes: 5,
 *     inscritsAujourdHui: 2,
 *     inscritsCeMois: 18,
 *   }}
 *   trends={{
 *     total: 8.5,
 *     actifs: 12,
 *     reçus: 5.2,
 *     echecs: -2,
 *   }}
 *   totalSparkline={{ values: [120, 130, 140, 150, 156], labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai'] }}
 *   isLoading={false}
 *   onCardClick={(id) => console.log(id)}
 * />
 * ```
 *
 * @author Stive Junior
 * @version 2.0.0
 * @see {@link CandidatsStatsExtended} – Métriques agrégées étendues
 * @see {@link CandidatsTrends} – Tendances évolutives
 * @see {@link StatsCard} – Carte de statistique réutilisable
 * @see {@link StatsGrid} – Grille responsive
 */

import { Users, UserCheck, TrendingUp, Award } from 'lucide-react';
import {
  StatsGrid,
  type StatsCardProps,
  type StatsTrend,
} from '@/features/dashboard/components/common/StatsCard';
import { EmptyState } from '@/features/dashboard/components/common/EmptyState';
import { cn } from '@/lib/utils';
import type { CandidatsStatsExtended, CandidatsTrends } from '@/types/candidats.types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Données d'un sparkline (courbe miniature) pour une métrique.
 */
export interface CandidatsSparklineData {
  /** Liste des valeurs (ex: [120, 135, 140, 155]) */
  values: number[];
  /** Étiquettes associées aux valeurs (optionnelles) */
  labels?: string[];
}

/**
 * Propriétés du composant `CandidatsStatsCards`.
 */
export interface CandidatsStatsCardsProps {
  /** Métriques statistiques étendues des candidats (peut être null pendant le chargement) */
  stats: CandidatsStatsExtended | null;
  /** Tendances évolutives (optionnelles) */
  trends?: Partial<CandidatsTrends>;

  /** Sparkline pour le total des candidats */
  totalSparkline?: CandidatsSparklineData;
  /** Sparkline pour les candidats actifs */
  actifsSparkline?: CandidatsSparklineData;
  /** Sparkline pour le taux de réussite */
  tauxReussiteSparkline?: CandidatsSparklineData;
  /** Sparkline pour les reçus */
  recusSparkline?: CandidatsSparklineData;

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

  /** Nombre de colonnes dans la grille (défaut : 4) */
  cols?: 2 | 3 | 4;
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
 * Grille de cartes statistiques pour les candidats.
 * Affiche les indicateurs clés (total, actifs, taux de réussite, reçus)
 * avec tendances et sparklines optionnelles.
 */
export function CandidatsStatsCards({
  stats,
  trends = {},
  totalSparkline,
  actifsSparkline,
  tauxReussiteSparkline,
  recusSparkline,
  isLoading = false,
  onCardClick,
  className,
  customCards,
  cols = 4,
}: CandidatsStatsCardsProps): React.JSX.Element {
  const handleCardClick = (cardId: string) => {
    onCardClick?.(cardId);
  };

  // Affichage des squelettes pendant le chargement ou si stats est null
  if (isLoading || !stats) {
    const skeletonCards: StatsCardProps[] = Array.from({ length: cols }, (_, i) => ({
      id: `skeleton-${i + 1}`,
      title: '',
      value: '',
      icon: null,
      Color: 'gray',
    }));
    return (
      <StatsGrid
        cards={skeletonCards}
        cols={cols}
        className={cn('w-full', className)}
        isLoading={true}
        classGrid='h-auto'
      />
    );
  }

  // Cartes par défaut (4 cartes avec métriques étendues)
  const defaultCards: StatsCardProps[] = [
    {
      id: 'total-candidats',
      title: 'Total candidats',
      value: formatCompactNumber(stats.total),
      icon: <Users className="size-5" />,
      Color: 'blue-500',
      description: `${stats.inscritsCeMois} ce mois`,
      trend: buildTrend(trends.total, 'vs période précédente'),
      sparklineData: totalSparkline
        ? { values: totalSparkline.values, labels: totalSparkline.labels }
        : undefined,
      onClick: () => handleCardClick('total-candidats'),
    },
    {
      id: 'actifs-candidats',
      title: 'Candidats actifs',
      value: formatCompactNumber(stats.actifs),
      icon: <UserCheck className="size-5" />,
      Color: 'emerald-500',
      description: 'En cours de formation',
      trend: buildTrend(trends.actifs, 'vs période précédente'),
      sparklineData: actifsSparkline
        ? { values: actifsSparkline.values, labels: actifsSparkline.labels }
        : undefined,
      onClick: () => handleCardClick('actifs-candidats'),
    },
    {
      id: 'taux-reussite',
      title: 'Taux de réussite',
      value: `${stats.tauxReussite.toFixed(1)}%`,
      icon: <TrendingUp className="size-5" />,
      Color: 'amber-500',
      description: `Évolution : ${trends.echecs ? (trends.echecs > 0 ? '+' : '') + trends.echecs + ' pts' : 'stable'}`,
      trend: trends.echecs
        ? {
          value: trends.echecs,
          isPositive: trends.echecs > 0,
          label: 'vs période précédente',
          isPercentage: false,
        }
        : undefined,
      sparklineData: tauxReussiteSparkline
        ? { values: tauxReussiteSparkline.values, labels: tauxReussiteSparkline.labels }
        : undefined,
      onClick: () => handleCardClick('taux-reussite'),
    },
    {
      id: 'recus-candidats',
      title: 'Candidats reçus',
      value: formatCompactNumber(stats.reçus),
      icon: <Award className="size-5" />,
      Color: 'purple-500',
      description: 'Permis obtenu',
      trend: buildTrend(trends.reçus, 'vs période précédente'),
      sparklineData: recusSparkline
        ? { values: recusSparkline.values, labels: recusSparkline.labels }
        : undefined,
      onClick: () => handleCardClick('recus-candidats'),
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
          description="Les données sur les candidats seront affichées ici une fois disponibles."
          icon={Users}
          variant="dashed"
          size="md"
        />
      </div>
    );
  }

  return (
    <StatsGrid
      cards={cards}
      cols={cols}
      className={cn('w-full', className)}
      isLoading={isLoading}

      classGrid='h-auto'
    />
  );
}

export default CandidatsStatsCards;