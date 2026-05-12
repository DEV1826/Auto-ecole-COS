// src/features/factures/components/FacturesStatsCards.tsx

/**
 * @module features/factures/components/FacturesStatsCards
 * @description
 * Grille de cartes statistiques pour la gestion des factures.
 * Utilisable par l'administrateur et le secrétariat.
 *
 * ## Métriques affichées (par défaut)
 * - **Total factures** : nombre de factures émises
 * - **Montant total** : somme de toutes les factures (en FCFA)
 * - **Montant impayé** : somme des montants restant à payer (en FCFA)
 * - **Paiements reçus** : total des paiements encaissés (toutes factures)
 *
 * Chaque carte supporte :
 * - Valeur formatée (notation compacte K/M, avec devise)
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
 * <FacturesStatsCards
 *   stats={{
 *     totalFactures: 48,
 *     montantTotal: 4250000,
 *     montantImpaye: 1250000,
 *     facturesPayees: 32,
 *     facturesImpayees: 16,
 *     paiementsRecus: 3000000,
 *   }}
 *   trends={{
 *     totalFactures: 12,
 *     montantTotal: 15.3,
 *     montantImpaye: -8,
 *     paiementsRecus: 22,
 *   }}
 *   isLoading={false}
 *   onCardClick={(id) => console.log(id)}
 * />
 * ```
 *
 * @author Stive Junior
 * @version 1.0.0
 * @see {@link FacturesStats} – Métriques agrégées
 * @see {@link FacturesTrends} – Tendances évolutives
 * @see {@link StatsCard} – Carte de statistique réutilisable
 * @see {@link StatsGrid} – Grille responsive
 */

import { FileText, Receipt, Clock, CheckCircle } from 'lucide-react';
import {
  StatsGrid,
  type StatsCardProps,
  type StatsTrend,
} from '@/features/dashboard/components/common/StatsCard';
import { EmptyState } from '@/features/dashboard/components/common/EmptyState';
import { cn } from '@/lib/utils';
import type { FacturesStats, FacturesTrends } from '@/types/factures.types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Données d'un sparkline (courbe miniature) pour une métrique de facture.
 */
export interface FacturesSparklineData {
  /** Liste des valeurs (ex: [120000, 135000, 140000, 155000]) */
  values: number[];
  /** Étiquettes associées aux valeurs (optionnelles) */
  labels?: string[];
}

/**
 * Propriétés du composant `FacturesStatsCards`.
 */
export interface FacturesStatsCardsProps {
  /** Métriques statistiques des factures */
  stats: FacturesStats;
  /** Tendances évolutives (optionnelles) */
  trends?: Partial<FacturesTrends>;

  /** Sparkline pour le total des factures */
  totalFacturesSparkline?: FacturesSparklineData;
  /** Sparkline pour le montant total */
  montantTotalSparkline?: FacturesSparklineData;
  /** Sparkline pour le montant impayé */
  montantImpayeSparkline?: FacturesSparklineData;
  /** Sparkline pour les paiements reçus */
  paiementsRecusSparkline?: FacturesSparklineData;

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
 * Formate un montant en FCFA avec notation compacte.
 * @internal
 */
function formatCurrency(num: number): string {
  return `${formatCompactNumber(num)} FCFA`;
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
 * Grille de cartes statistiques pour les factures.
 * Affiche les indicateurs clés : total factures, montant total, montant impayé, paiements reçus.
 */
export function FacturesStatsCards({
  stats,
  trends = {},
  totalFacturesSparkline,
  montantTotalSparkline,
  montantImpayeSparkline,
  paiementsRecusSparkline,
  isLoading = false,
  onCardClick,
  className,
  customCards,
}: FacturesStatsCardsProps): React.JSX.Element {
  const handleCardClick = (cardId: string) => {
    onCardClick?.(cardId);
  };

  // Cartes par défaut
  const defaultCards: StatsCardProps[] = [
    {
      id: 'total-factures',
      title: 'Total factures',
      value: formatCompactNumber(stats.totalFactures),
      icon: <FileText className="size-5" />,
      iconBg: 'bg-blue-500',
      description: 'Factures émises',
      trend: buildTrend(trends.totalFactures, 'vs période précédente'),
      sparklineData: totalFacturesSparkline
        ? {
            values: totalFacturesSparkline.values,
            labels: totalFacturesSparkline.labels,
          }
        : undefined,
      onClick: () => handleCardClick('total-factures'),
    },
    {
      id: 'montant-total',
      title: 'Montant total',
      value: formatCurrency(stats.montantTotal),
      icon: <Receipt className="size-5" />,
      iconBg: 'bg-emerald-500',
      description: 'Cumul des factures',
      trend: buildTrend(trends.montantTotal, 'vs période précédente'),
      sparklineData: montantTotalSparkline
        ? {
            values: montantTotalSparkline.values,
            labels: montantTotalSparkline.labels,
          }
        : undefined,
      onClick: () => handleCardClick('montant-total'),
    },
    {
      id: 'montant-impaye',
      title: 'Montant impayé',
      value: formatCurrency(stats.montantImpaye),
      icon: <Clock className="size-5" />,
      iconBg: 'bg-amber-500',
      description: 'Restant à payer',
      trend: buildTrend(trends.montantImpaye, 'vs période précédente'),
      sparklineData: montantImpayeSparkline
        ? {
            values: montantImpayeSparkline.values,
            labels: montantImpayeSparkline.labels,
          }
        : undefined,
      onClick: () => handleCardClick('montant-impaye'),
    },
    {
      id: 'paiements-recus',
      title: 'Paiements reçus',
      value: formatCurrency(stats.paiementsRecus),
      icon: <CheckCircle className="size-5" />,
      iconBg: 'bg-purple-500',
      description: 'Total encaissé',
      trend: buildTrend(trends.paiementsRecus, 'vs période précédente'),
      sparklineData: paiementsRecusSparkline
        ? {
            values: paiementsRecusSparkline.values,
            labels: paiementsRecusSparkline.labels,
          }
        : undefined,
      onClick: () => handleCardClick('paiements-recus'),
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
          description="Les données sur les factures seront affichées ici une fois disponibles."
          icon={FileText}
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

export default FacturesStatsCards;
