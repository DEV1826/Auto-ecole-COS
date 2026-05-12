// src/features/dashboard/components/admin/AdminStatsCards.tsx

/**
 * @module features/dashboard/components/admin/AdminStatsCards
 * @description
 * Grille de cartes statistiques pour l’administrateur – affiche 4 métriques globales du système.
 *
 * ## Métriques affichées
 * - **Candidats actifs** : nombre de candidats en cours de formation
 * - **Moniteurs actifs** : instructeurs actifs dans l’auto‑école
 * - **Véhicules disponibles** : véhicules opérationnels (hors entretien / hors service)
 * - **Chiffre d’affaires** (total des paiements encaissés ce mois)
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
 * <AdminStatsCards
 *   totalCandidats={128}
 *   totalCandidatsTrend={{ value: 12, isPositive: true, label: "vs mois dernier" }}
 *   totalCandidatsSparkline={{ values: [98, 105, 112, 118, 122, 125, 128], labels: ["Jan","Fév","Mar","Avr","Mai","Juin","Juil"] }}
 *   totalMoniteurs={8}
 *   totalMoniteursTrend={{ value: 0, isPositive: false, label: "stable" }}
 *   totalVehiculesDisponibles={12}
 *   totalVehiculesDisponiblesTrend={{ value: -2, isPositive: false, label: "vs mois dernier" }}
 *   totalRevenusMois={8560000}
 *   totalRevenusMoisTrend={{ value: 8.5, isPositive: true, label: "vs mois dernier" }}
 *   isLoading={false}
 *   onCardClick={(id) => console.log(id)}
 * />
 * ```
 *
 * @author Stive Junior
 * @version 1.0.0
 */

import { Users, UserRound, Car, TrendingUp } from 'lucide-react';
import {
  StatsGrid,
  type SparklineData,
  type StatsCardProps,
  type StatsTrend,
} from '@/features/dashboard/components/common/StatsCard';
import { EmptyState } from '@/features/dashboard/components/common/EmptyState';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Propriétés du composant `AdminStatsCards`.
 */
export interface AdminStatsCardsProps {
  // ── Métrique 1 : Candidats actifs ─────────────────────────────────────────
  /** Nombre total de candidats actifs (en cours de formation) */
  totalCandidats?: number;
  /** Tendance associée (évolution) */
  totalCandidatsTrend?: StatsTrend;
  /** Données sparkline pour l’évolution des candidats (optionnel) */
  totalCandidatsSparkline?: SparklineData;

  // ── Métrique 2 : Moniteurs actifs ─────────────────────────────────────────
  /** Nombre de moniteurs actifs */
  totalMoniteurs?: number;
  /** Tendance des moniteurs actifs */
  totalMoniteursTrend?: StatsTrend;
  /** Sparkline pour l’évolution des moniteurs (optionnel) */
  totalMoniteursSparkline?: SparklineData;

  // ── Métrique 3 : Véhicules disponibles ────────────────────────────────────
  /** Nombre de véhicules disponibles (statut DISPONIBLE) */
  totalVehiculesDisponibles?: number;
  /** Tendance des véhicules disponibles */
  totalVehiculesDisponiblesTrend?: StatsTrend;
  /** Sparkline pour l’évolution des véhicules (optionnel) */
  totalVehiculesDisponiblesSparkline?: SparklineData;

  // ── Métrique 4 : Chiffre d’affaires du mois ───────────────────────────────
  /** Total des paiements encaissés ce mois (en FCFA) */
  totalRevenusMois?: number;
  /** Tendance des revenus (évolution) */
  totalRevenusMoisTrend?: StatsTrend;
  /** Sparkline pour l’évolution des revenus (optionnel) */
  totalRevenusMoisSparkline?: SparklineData;

  // ── Comportement ──────────────────────────────────────────────────────────
  /** Afficher l’état de chargement (skeleton) */
  isLoading?: boolean;
  /** Callback déclenché au clic sur une carte (reçoit l’identifiant de la carte) */
  onCardClick?: (cardId: string) => void;
  /** Classes additionnelles pour la grille */
  className?: string;

  /**
   * Permet de remplacer entièrement les cartes (utilisation avancée).
   * Si fourni, les props individuelles (`totalCandidats`, etc.) sont ignorées.
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

/**
 * Formate un montant en FCFA avec notation compacte.
 * @internal
 */
function formatCurrencyCompact(num: number): string {
  const formatted = formatCompactNumber(num);
  return `${formatted} FCFA`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Grille de cartes statistiques globales pour l’administrateur.
 * Affiche 4 métriques essentielles avec tendances et courbes miniatures.
 */
export function AdminStatsCards({
  totalCandidats = 0,
  totalCandidatsTrend,
  totalCandidatsSparkline,
  totalMoniteurs = 0,
  totalMoniteursTrend,
  totalMoniteursSparkline,
  totalVehiculesDisponibles = 0,
  totalVehiculesDisponiblesTrend,
  totalVehiculesDisponiblesSparkline,
  totalRevenusMois = 0,
  totalRevenusMoisTrend,
  totalRevenusMoisSparkline,
  isLoading = false,
  onCardClick,
  className,
  customCards,
}: AdminStatsCardsProps): React.JSX.Element {
  // Gestionnaire de clic
  const handleCardClick = (cardId: string) => {
    onCardClick?.(cardId);
  };

  // Cartes par défaut (adaptées à l’auto‑école)
  const defaultCards: StatsCardProps[] = [
    {
      id: 'total-candidats',
      title: 'Candidats actifs',
      value: formatCompactNumber(totalCandidats),
      icon: <Users className="size-5" />,
      iconBg: 'bg-blue-500',
      description: 'En cours de formation',
      trend: totalCandidatsTrend,
      sparklineData: totalCandidatsSparkline
        ? {
            values: totalCandidatsSparkline.values,
            labels: totalCandidatsSparkline.labels,
          }
        : undefined,
      onClick: () => handleCardClick('total-candidats'),
    },
    {
      id: 'total-moniteurs',
      title: 'Moniteurs actifs',
      value: formatCompactNumber(totalMoniteurs),
      icon: <UserRound className="size-5" />,
      iconBg: 'bg-emerald-500',
      description: 'Instructeurs disponibles',
      trend: totalMoniteursTrend,
      sparklineData: totalMoniteursSparkline
        ? {
            values: totalMoniteursSparkline.values,
            labels: totalMoniteursSparkline.labels,
          }
        : undefined,
      onClick: () => handleCardClick('total-moniteurs'),
    },
    {
      id: 'total-vehicules',
      title: 'Véhicules disponibles',
      value: formatCompactNumber(totalVehiculesDisponibles),
      icon: <Car className="size-5" />,
      iconBg: 'bg-amber-500',
      description: 'Parc opérationnel',
      trend: totalVehiculesDisponiblesTrend,
      sparklineData: totalVehiculesDisponiblesSparkline
        ? {
            values: totalVehiculesDisponiblesSparkline.values,
            labels: totalVehiculesDisponiblesSparkline.labels,
          }
        : undefined,
      onClick: () => handleCardClick('total-vehicules'),
    },
    {
      id: 'total-revenus',
      title: 'Chiffre d’affaires (mois)',
      value: formatCurrencyCompact(totalRevenusMois),
      icon: <TrendingUp className="size-5" />,
      iconBg: 'bg-purple-500',
      description: 'Paiements encaissés',
      trend: totalRevenusMoisTrend,
      sparklineData: totalRevenusMoisSparkline
        ? {
            values: totalRevenusMoisSparkline.values,
            labels: totalRevenusMoisSparkline.labels,
          }
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
        : parseInt(String(card.value).replace(/[^0-9.-]/g, ''), 10);
    return !isNaN(numericValue) && numericValue > 0;
  });

  // État vide
  if (!hasData && !isLoading) {
    return (
      <div className={cn('w-full', className)}>
        <EmptyState
          title="Aucune statistique disponible"
          description="Les données seront affichées ici une fois disponibles."
          icon={Users}
          variant="dashed"
          size="md"
        />
      </div>
    );
  }

  // Rendu de la grille
  return (
    <StatsGrid cards={cards} cols={2} className={cn('w-full', className)} isLoading={isLoading} />
  );
}
