// src/features/admin/components/AuthStatsCards.tsx

/**
 * @module features/admin/components/AuthStatsCards
 * @description
 * Grille de cartes statistiques pour l’administration système – affiche 4 métriques relatives aux utilisateurs et sessions.
 * Utilise les métriques étendues (`AuthStats`) pour afficher :
 * - **Total utilisateurs actifs** : nombre d’utilisateurs actifs
 * - **Administrateurs** : utilisateurs de rôle `ADMIN`
 * - **Secrétaires** : utilisateurs de rôle `SECRETAIRE`
 * - **Moniteurs** : utilisateurs de rôle `MONITEUR`
 *
 * Chaque carte supporte :
 * - Valeur formatée (nombre court)
 * - Tendance (évolution par rapport à la période précédente)
 * - Sparkline optionnelle (évolution sur plusieurs mois)
 * - Icône personnalisée avec fond coloré
 * - État de chargement (skeleton)
 * - Clic sur la carte (callback)
 *
 * @author Stive Junior
 * @version 2.0.0
 * @see {@link AuthStats} – Métriques agrégées
 * @see {@link AuthTrends} – Tendances évolutives
 * @see {@link AuthSparklineData} – Sparklines
 */

import { Users, ShieldCheck, CalendarCheck, UserRound } from 'lucide-react';
import {
  StatsGrid,
  type StatsCardProps,
  type StatsTrend,
  type SparklineData,
} from '@/features/dashboard/components/common/StatsCard';
import { EmptyState } from '@/features/dashboard/components/common/EmptyState';
import { cn } from '@/lib/utils';
import type { AuthStats, AuthTrends } from '@/types/auth.types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthStatsCardsProps {
  /** Métriques statistiques (peut être null pendant le chargement) */
  stats: AuthStats | null;
  /** Tendances évolutives (optionnelles) */
  trends?: Partial<AuthTrends>;

  /** Sparkline pour le total des utilisateurs actifs */
  totalUsersSparkline?: SparklineData;
  /** Sparkline pour les administrateurs */
  totalAdminsSparkline?: SparklineData;
  /** Sparkline pour les secrétaires */
  totalSecretairesSparkline?: SparklineData;
  /** Sparkline pour les moniteurs */
  totalMoniteursSparkline?: SparklineData;

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
 * Formate un nombre en notation courte (K, M) pour l’affichage.
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
 * Grille de cartes statistiques pour l’administration système.
 * Affiche 4 métriques sur les utilisateurs (total, administrateurs, secrétaires, moniteurs)
 * avec tendances et sparklines optionnelles.
 */
export function AuthStatsCards({
  stats,
  trends = {},
  totalUsersSparkline,
  totalAdminsSparkline,
  totalSecretairesSparkline,
  totalMoniteursSparkline,
  isLoading = false,
  onCardClick,
  className,
  customCards,
}: AuthStatsCardsProps): React.JSX.Element {
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
        cols={4}
        className={cn('w-full', className)}
        isLoading={true}
      />
    );
  }

  // Cartes par défaut (4 cartes avec métriques)
  const defaultCards: StatsCardProps[] = [
    {
      id: 'total-users',
      title: 'Utilisateurs actifs',
      value: formatCompactNumber(stats.totalUtilisateurs),
      secondaryValue: `${stats.utilisateursInactifs} inactif${stats.utilisateursInactifs > 1 ? 's' : ''}`,
      icon: <Users className="size-5" />,
      Color: 'blue-500',
      description: 'Tous rôles confondus',
      trend: buildTrend(trends.totalUtilisateurs),
      sparklineData: totalUsersSparkline
        ? { values: totalUsersSparkline.values, labels: totalUsersSparkline.labels }
        : undefined,
      onClick: () => handleCardClick('total-users'),
    },
    {
      id: 'total-admins',
      title: 'Administrateurs',
      value: formatCompactNumber(stats.totalAdmins),
      icon: <ShieldCheck className="size-5" />,
      Color: 'purple-500',
      description: 'Gestion système',
      trend: buildTrend(trends.totalAdmins),
      sparklineData: totalAdminsSparkline
        ? { values: totalAdminsSparkline.values, labels: totalAdminsSparkline.labels }
        : undefined,
      onClick: () => handleCardClick('total-admins'),
    },
    {
      id: 'total-secretaires',
      title: 'Secrétaires',
      value: formatCompactNumber(stats.totalSecretaires),
      icon: <CalendarCheck className="size-5" />,
      Color: 'emerald-500',
      description: 'Gestion quotidienne',
      trend: buildTrend(trends.totalSecretaires),
      sparklineData: totalSecretairesSparkline
        ? { values: totalSecretairesSparkline.values, labels: totalSecretairesSparkline.labels }
        : undefined,
      onClick: () => handleCardClick('total-secretaires'),
    },
    {
      id: 'total-moniteurs',
      title: 'Moniteurs',
      value: formatCompactNumber(stats.totalMoniteurs),
      icon: <UserRound className="size-5" />,
      Color: 'amber-500',
      description: 'Instructeurs',
      trend: buildTrend(trends.totalMoniteurs),
      sparklineData: totalMoniteursSparkline
        ? { values: totalMoniteursSparkline.values, labels: totalMoniteursSparkline.labels }
        : undefined,
      onClick: () => handleCardClick('total-moniteurs'),
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
          description="Les données des utilisateurs seront affichées ici une fois disponibles."
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
      cols={4}
      className={cn('w-full', className)}
      isLoading={isLoading}
    />
  );
}

export default AuthStatsCards;