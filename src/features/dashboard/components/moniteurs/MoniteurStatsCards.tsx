// src/features/dashboard/components/moniteurs/MoniteurStatsCards.tsx

/**
 * @module features/dashboard/components/moniteurs/MoniteurStatsCards
 * @description
 * Grille de cartes statistiques pour le tableau de bord du moniteur (instructeur).
 * Affiche les métriques clés liées à l’activité d’un moniteur.
 *
 * ## Métriques affichées
 * - **Mes candidats** : nombre de candidats actifs suivis par le moniteur
 * - **Leçons à venir** : nombre de leçons planifiées dans les 7 prochains jours
 * - **Heures de conduite ce mois** : total d’heures effectuées ce mois
 * - **Taux de réussite** : pourcentage de réussite aux examens de ses candidats
 *
 * Chaque carte supporte :
 * - Valeur formatée (nombre court ou pourcentage)
 * - Tendance (évolution par rapport à la période précédente)
 * - Sparkline optionnelle (évolution sur plusieurs mois/semaines)
 * - Icône personnalisée avec fond coloré
 * - État de chargement (skeleton)
 * - Clic sur la carte (callback)
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @example
 * ```tsx
 * <MoniteurStatsCards
 *   mesCandidats={12}
 *   mesCandidatsTrend={{ value: 2, isPositive: true, label: "vs mois dernier" }}
 *   mesCandidatsSparkline={{ values: [8, 10, 11, 12, 12, 12, 12], labels: ["Jan","Fév","Mar","Avr","Mai","Juin","Juil"] }}
 *   leconsAVenir={5}
 *   leconsAVenirTrend={{ value: -1, isPositive: false, label: "vs semaine dernière" }}
 *   heuresConduiteMois={28.5}
 *   heuresConduiteMoisTrend={{ value: 3.5, isPositive: true, label: "vs mois dernier" }}
 *   tauxReussite={82}
 *   tauxReussiteTrend={{ value: 5, isPositive: true, label: "vs mois dernier", isPercentage: true }}
 *   isLoading={false}
 *   onCardClick={(id) => console.log(id)}
 * />
 * ```
 */

import { Users, Calendar, Clock, TrendingUp } from 'lucide-react';
import {
  StatsGrid,
  type StatsCardProps,
  type StatsTrend,
} from '@/features/dashboard/components/common/StatsCard';
import { EmptyState } from '@/features/dashboard/components/common/EmptyState';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Données d'un sparkline (courbe miniature).
 */
export interface SparklineData {
  /** Liste des valeurs (ex: [120, 135, 140, 155]) */
  values: number[];
  /** Étiquettes associées aux valeurs (optionnelles) */
  labels?: string[];
}

/**
 * Propriétés du composant `MoniteurStatsCards`.
 */
export interface MoniteurStatsCardsProps {
  // ── Métrique 1 : Mes candidats ────────────────────────────────────────────
  /** Nombre de candidats actifs suivis par le moniteur */
  mesCandidats?: number;
  /** Tendance associée (évolution) */
  mesCandidatsTrend?: StatsTrend;
  /** Données sparkline pour l’évolution des candidats (optionnel) */
  mesCandidatsSparkline?: SparklineData;

  // ── Métrique 2 : Leçons à venir ───────────────────────────────────────────
  /** Nombre de leçons planifiées dans les 7 prochains jours */
  leconsAVenir?: number;
  /** Tendance des leçons à venir */
  leconsAVenirTrend?: StatsTrend;
  /** Sparkline pour l’évolution des leçons (optionnel) */
  leconsAVenirSparkline?: SparklineData;

  // ── Métrique 3 : Heures de conduite ce mois ───────────────────────────────
  /** Total d’heures de conduite effectuées ce mois */
  heuresConduiteMois?: number;
  /** Tendance des heures de conduite */
  heuresConduiteMoisTrend?: StatsTrend;
  /** Sparkline pour l’évolution des heures (optionnel) */
  heuresConduiteMoisSparkline?: SparklineData;

  // ── Métrique 4 : Taux de réussite ─────────────────────────────────────────
  /** Pourcentage de réussite aux examens des candidats suivis */
  tauxReussite?: number;
  /** Tendance du taux de réussite */
  tauxReussiteTrend?: StatsTrend;
  /** Sparkline pour l’évolution du taux (optionnel) */
  tauxReussiteSparkline?: SparklineData;

  // ── Comportement ──────────────────────────────────────────────────────────
  /** Afficher l’état de chargement (skeleton) */
  isLoading?: boolean;
  /** Callback déclenché au clic sur une carte (reçoit l’identifiant de la carte) */
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

/**
 * Formate une durée en heures (une décimale).
 * @internal
 */
function formatHours(num: number): string {
  return num % 1 === 0 ? num.toString() : num.toFixed(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Grille de cartes statistiques pour le tableau de bord du moniteur.
 * Affiche les métriques essentielles pour l’instructeur : ses candidats,
 * ses leçons à venir, ses heures de conduite et son taux de réussite.
 */
export function MoniteurStatsCards({
  mesCandidats = 0,
  mesCandidatsTrend,
  mesCandidatsSparkline,
  leconsAVenir = 0,
  leconsAVenirTrend,
  leconsAVenirSparkline,
  heuresConduiteMois = 0,
  heuresConduiteMoisTrend,
  heuresConduiteMoisSparkline,
  tauxReussite = 0,
  tauxReussiteTrend,
  tauxReussiteSparkline,
  isLoading = false,
  onCardClick,
  className,
  customCards,
}: MoniteurStatsCardsProps): React.JSX.Element {
  const handleCardClick = (cardId: string) => {
    onCardClick?.(cardId);
  };

  const defaultCards: StatsCardProps[] = [
    {
      id: 'mes-candidats',
      title: 'Mes candidats',
      value: formatCompactNumber(mesCandidats),
      icon: <Users className="size-5" />,
      iconBg: 'bg-blue-500',
      description: 'Actifs',
      trend: mesCandidatsTrend,
      sparklineData: mesCandidatsSparkline
        ? {
          values: mesCandidatsSparkline.values,
          labels: mesCandidatsSparkline.labels,
        }
        : undefined,
      onClick: () => handleCardClick('mes-candidats'),
    },
    {
      id: 'lecons-a-venir',
      title: 'Leçons à venir',
      value: formatCompactNumber(leconsAVenir),
      icon: <Calendar className="size-5" />,
      iconBg: 'bg-emerald-500',
      description: 'Prochains 7 jours',
      trend: leconsAVenirTrend,
      sparklineData: leconsAVenirSparkline
        ? {
          values: leconsAVenirSparkline.values,
          labels: leconsAVenirSparkline.labels,
        }
        : undefined,
      onClick: () => handleCardClick('lecons-a-venir'),
    },
    {
      id: 'heures-mois',
      title: 'Heures de conduite',
      value: `${formatHours(heuresConduiteMois)} h`,
      icon: <Clock className="size-5" />,
      iconBg: 'bg-amber-500',
      description: 'Ce mois',
      trend: heuresConduiteMoisTrend,
      sparklineData: heuresConduiteMoisSparkline
        ? {
          values: heuresConduiteMoisSparkline.values,
          labels: heuresConduiteMoisSparkline.labels,
        }
        : undefined,
      onClick: () => handleCardClick('heures-mois'),
    },
    {
      id: 'taux-reussite',
      title: 'Taux de réussite',
      value: `${tauxReussite}%`,
      icon: <TrendingUp className="size-5" />,
      iconBg: 'bg-purple-500',
      description: 'Moyenne candidats suivis',
      trend: tauxReussiteTrend,
      sparklineData: tauxReussiteSparkline
        ? {
          values: tauxReussiteSparkline.values,
          labels: tauxReussiteSparkline.labels,
        }
        : undefined,
      onClick: () => handleCardClick('taux-reussite'),
    },
  ];

  const cards = customCards ?? defaultCards;

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
          description="Les données seront affichées ici une fois disponibles."
          icon={Users}
          variant="dashed"
          size="md"
        />
      </div>
    );
  }

  return <StatsGrid cards={cards} cols={2} className={cn('w-full', className)} isLoading={isLoading} />;
}
