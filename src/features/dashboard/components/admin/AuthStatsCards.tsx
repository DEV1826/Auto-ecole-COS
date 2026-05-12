// src/features/dashboard/components/admin/AuthStatsCards.tsx

/**
 * @module features/dashboard/components/admin/AuthStatsCards
 * @description
 * Grille de cartes statistiques pour l’administration système – affiche 4 métriques relatives aux utilisateurs et sessions.
 *
 * ## Métriques affichées
 * - **Total utilisateurs actifs** : nombre d’utilisateurs avec `actif = true`
 * - **Administrateurs** : utilisateurs de rôle `ADMIN`
 * - **Secrétaires** : utilisateurs de rôle `SECRETAIRE`
 * - **Moniteurs** : utilisateurs de rôle `MONITEUR`
 *
 * Chaque carte supporte :
 * - Valeur formatée (nombre court : 12.4K, 1.2M)
 * - Tendance (augmentation / diminution) avec badge et pourcentage
 * - Sparkline optionnelle (évolution sur plusieurs mois)
 * - Icône personnalisée avec fond coloré
 * - État de chargement (skeleton)
 * - Clic sur la carte (callback)
 *
 * Le composant utilise les sous‑composants `StatsGrid` et `StatsCard` (définis dans `common/StatsCard`).
 *
 * @example
 * ```tsx
 * <AuthStatsCards
 *   totalUsers={24}
 *   totalUsersTrend={{ value: 4, isPositive: true, label: "vs mois dernier" }}
 *   totalUsersSparkline={{ values: [18, 20, 21, 23, 24, 24, 24], labels: ["Jan","Fév","Mar","Avr","Mai","Juin","Juil"] }}
 *   totalAdmins={2}
 *   totalAdminsTrend={{ value: 0, label: "stable" }}
 *   totalSecretaires={3}
 *   totalSecretairesTrend={{ value: 1, isPositive: true, label: "ce mois" }}
 *   totalMoniteurs={6}
 *   totalMoniteursTrend={{ value: -1, isPositive: false, label: "vs mois dernier" }}
 *   isLoading={false}
 *   onCardClick={(id) => console.log(id)}
 * />
 * ```
 *
 * @author Stive Junior
 * @version 1.0.0
 */

import { Users, ShieldCheck, CalendarCheck, UserRound } from 'lucide-react';
import {
  StatsGrid,
  type SparklineData,
  type StatsCardProps,
  type StatsTrend,
} from '@/features/dashboard/components/common/StatsCard';
import { EmptyState } from '@/features/dashboard/components/common/EmptyState';
import { cn } from '@/lib/utils';

/**
 * Propriétés du composant `AuthStatsCards`.
 */
export interface AuthStatsCardsProps {
  // ── Métrique 1 : Total utilisateurs actifs ────────────────────────────────
  /** Nombre total d’utilisateurs actifs */
  totalUsers?: number;
  /** Tendance associée (évolution) */
  totalUsersTrend?: StatsTrend;
  /** Données sparkline pour l’évolution totale (optionnel) */
  totalUsersSparkline?: SparklineData;

  // ── Métrique 2 : Administrateurs ─────────────────────────────────────────
  /** Nombre d’utilisateurs avec rôle ADMIN */
  totalAdmins?: number;
  /** Tendance des administrateurs */
  totalAdminsTrend?: StatsTrend;
  /** Sparkline pour l’évolution des admins (optionnel) */
  totalAdminsSparkline?: SparklineData;

  // ── Métrique 3 : Secrétaires ─────────────────────────────────────────────
  /** Nombre d’utilisateurs avec rôle SECRETAIRE */
  totalSecretaires?: number;
  /** Tendance des secrétaires */
  totalSecretairesTrend?: StatsTrend;
  /** Sparkline pour l’évolution des secrétaires (optionnel) */
  totalSecretairesSparkline?: SparklineData;

  // ── Métrique 4 : Moniteurs ────────────────────────────────────────────────
  /** Nombre d’utilisateurs avec rôle MONITEUR */
  totalMoniteurs?: number;
  /** Tendance des moniteurs */
  totalMoniteursTrend?: StatsTrend;
  /** Sparkline pour l’évolution des moniteurs (optionnel) */
  totalMoniteursSparkline?: SparklineData;

  // ── Comportement ──────────────────────────────────────────────────────────
  /** Afficher l’état de chargement (skeleton) */
  isLoading?: boolean;
  /** Callback déclenché au clic sur une carte (reçoit l’identifiant) */
  onCardClick?: (cardId: string) => void;
  /** Classes additionnelles pour la grille */
  className?: string;

  /**
   * Permet de remplacer entièrement les cartes (utilisation avancée).
   * Si fourni, les props individuelles sont ignorées.
   */
  customCards?: StatsCardProps[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Fonction utilitaire : formater un nombre en K/M
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formate un nombre en notation courte (K, M) pour l’affichage.
 * Exemples : 2 300 → "2.3k", 1 250 000 → "1.3M"
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

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Grille de cartes statistiques pour l’administration système.
 * Affiche 4 métriques sur les utilisateurs (total, administrateurs, secrétaires, moniteurs)
 * avec tendances et courbes miniatures optionnelles.
 */
export function AuthStatsCards({
  totalUsers = 0,
  totalUsersTrend,
  totalUsersSparkline,
  totalAdmins = 0,
  totalAdminsTrend,
  totalAdminsSparkline,
  totalSecretaires = 0,
  totalSecretairesTrend,
  totalSecretairesSparkline,
  totalMoniteurs = 0,
  totalMoniteursTrend,
  totalMoniteursSparkline,
  isLoading = false,
  onCardClick,
  className,
  customCards,
}: AuthStatsCardsProps): React.JSX.Element {
  const handleCardClick = (cardId: string) => {
    onCardClick?.(cardId);
  };

  const defaultCards: StatsCardProps[] = [
    {
      id: 'total-users',
      title: 'Utilisateurs actifs',
      value: formatCompactNumber(totalUsers),
      icon: <Users className="size-5" />,
      iconBg: 'bg-blue-500',
      description: 'Tous rôles confondus',
      trend: totalUsersTrend,
      sparklineData: totalUsersSparkline
        ? {
            values: totalUsersSparkline.values,
            labels: totalUsersSparkline.labels,
          }
        : undefined,
      onClick: () => handleCardClick('total-users'),
    },
    {
      id: 'total-admins',
      title: 'Administrateurs',
      value: formatCompactNumber(totalAdmins),
      icon: <ShieldCheck className="size-5" />,
      iconBg: 'bg-purple-500',
      description: 'Gestion système',
      trend: totalAdminsTrend,
      sparklineData: totalAdminsSparkline
        ? {
            values: totalAdminsSparkline.values,
            labels: totalAdminsSparkline.labels,
          }
        : undefined,
      onClick: () => handleCardClick('total-admins'),
    },
    {
      id: 'total-secretaires',
      title: 'Secrétaires',
      value: formatCompactNumber(totalSecretaires),
      icon: <CalendarCheck className="size-5" />,
      iconBg: 'bg-emerald-500',
      description: 'Gestion quotidienne',
      trend: totalSecretairesTrend,
      sparklineData: totalSecretairesSparkline
        ? {
            values: totalSecretairesSparkline.values,
            labels: totalSecretairesSparkline.labels,
          }
        : undefined,
      onClick: () => handleCardClick('total-secretaires'),
    },
    {
      id: 'total-moniteurs',
      title: 'Moniteurs',
      value: formatCompactNumber(totalMoniteurs),
      icon: <UserRound className="size-5" />,
      iconBg: 'bg-amber-500',
      description: 'Instructeurs',
      trend: totalMoniteursTrend,
      sparklineData: totalMoniteursSparkline
        ? {
            values: totalMoniteursSparkline.values,
            labels: totalMoniteursSparkline.labels,
          }
        : undefined,
      onClick: () => handleCardClick('total-moniteurs'),
    },
  ];

  const cards = customCards ?? defaultCards;

  const hasData = cards.some((card) => {
    const numericValue =
      typeof card.value === 'number'
        ? card.value
        : parseInt(String(card.value).replace(/[^0-9.-]/g, ''), 10);
    return !isNaN(numericValue) && numericValue > 0;
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

  return <StatsGrid cards={cards} className={cn('w-full', className)} isLoading={isLoading} />;
}
