// src/features/paiements/components/PaiementsStatsCards.tsx

/**
 * @module features/paiements/components/PaiementsStatsCards
 * @description
 * Grille de cartes statistiques pour la gestion des paiements (encaissements).
 * Utilisable par l'administrateur et le secrétariat.
 *
 * ## Métriques affichées (par défaut)
 * - **Total encaissements** : somme cumulée de tous les paiements (en FCFA)
 * - **Nombre transactions** : nombre total de paiements enregistrés
 * - **Encaissements du mois** : total des paiements du mois en cours
 * - **Montant moyen** : moyenne par transaction (en FCFA)
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
 * <PaiementsStatsCards
 *   stats={{
 *     totalEncaissements: 1250000,
 *     nombreTransactions: 42,
 *     encaissementsMois: 320000,
 *     montantMoyen: 29761.9,
 *   }}
 *   trends={{
 *     totalEncaissements: 12.5,
 *     nombreTransactions: 8,
 *     encaissementsMois: -3.2,
 *     montantMoyen: 4.1,
 *   }}
 *   encaissementsMoisSparkline={{
 *     values: [280000, 295000, 310000, 305000, 320000],
 *     labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai'],
 *   }}
 *   isLoading={false}
 *   onCardClick={(id) => console.log(id)}
 * />
 * ```
 *
 * @author Stive Junior
 * @version 1.0.0
 * @see {@link PaiementsStats} – Métriques agrégées
 * @see {@link PaiementsTrends} – Tendances évolutives
 * @see {@link StatsCard} – Carte de statistique réutilisable
 * @see {@link StatsGrid} – Grille responsive
 */

import { TrendingUp, Calendar, Receipt, Wallet, Landmark } from 'lucide-react';
import {
  StatsGrid,
  type StatsCardProps,
  type StatsTrend,
} from '@/features/dashboard/components/common/StatsCard';
import { EmptyState } from '@/features/dashboard/components/common/EmptyState';
import { cn } from '@/lib/utils';
import type { PaiementsStats, PaiementsTrends } from '@/types/paiements.types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Données d'un sparkline (courbe miniature) pour une métrique de paiement.
 */
export interface PaiementsSparklineData {
  /** Liste des valeurs (ex: [280000, 295000, 310000]) */
  values: number[];
  /** Étiquettes associées aux valeurs (optionnelles) */
  labels?: string[];
}

/**
 * Propriétés du composant `PaiementsStatsCards`.
 */
export interface PaiementsStatsCardsProps {
  /** Métriques statistiques des paiements */
  stats: PaiementsStats;
  /** Tendances évolutives (optionnelles) */
  trends?: Partial<PaiementsTrends>;

  /** Sparkline pour le total des encaissements */
  totalEncaissementsSparkline?: PaiementsSparklineData;
  /** Sparkline pour le nombre de transactions */
  nombreTransactionsSparkline?: PaiementsSparklineData;
  /** Sparkline pour les encaissements du mois */
  encaissementsMoisSparkline?: PaiementsSparklineData;
  /** Sparkline pour le montant moyen */
  montantMoyenSparkline?: PaiementsSparklineData;

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
 * Grille de cartes statistiques pour les paiements.
 * Affiche les indicateurs clés : total encaissements, nombre de transactions,
 * encaissements du mois, montant moyen, avec tendances et sparklines optionnelles.
 */
export function PaiementsStatsCards({
  stats,
  trends = {},
  totalEncaissementsSparkline,
  nombreTransactionsSparkline,
  encaissementsMoisSparkline,
  montantMoyenSparkline,
  isLoading = false,
  onCardClick,
  className,
  customCards,
}: PaiementsStatsCardsProps): React.JSX.Element {
  const handleCardClick = (cardId: string) => {
    onCardClick?.(cardId);
  };



  if (isLoading) {
    const skeletonCards: StatsCardProps[] = [
      { id: 'skeleton-1', title: '', value: '', icon: null, Color: 'gray' },
      { id: 'skeleton-2', title: '', value: '', icon: null, Color: 'gray' },
      { id: 'skeleton-3', title: '', value: '', icon: null, Color: 'gray' },
      { id: 'skeleton-4', title: '', value: '', icon: null, Color: 'gray' },
    ];
    return <StatsGrid cards={skeletonCards} cols={2} className={cn('w-full', className)} isLoading={true} />;
  }

  // Si pas de stats (et pas en chargement), afficher l'état vide
  if (!stats) {
    return (
      <div className={cn('w-full', className)}>
        <EmptyState
          title="Aucune statistique disponible"
          description="Les données sur les paiements seront affichées ici une fois disponibles."
          icon={Landmark}

          variant="dashed"
          className='h-full justify-center'
          size="md"
        />
      </div>
    );
  }

  // Cartes par défaut
  const defaultCards: StatsCardProps[] = [
    {
      id: 'total-encaissements',
      title: 'Total encaissements',
      value: formatCurrency(stats.totalEncaissements),
      icon: <Receipt className="size-5" />,
      Color: 'blue-500',
      description: 'Cumul depuis le début',
      trend: buildTrend(trends.totalEncaissements, 'vs période précédente'),
      sparklineData: totalEncaissementsSparkline
        ? {
          values: totalEncaissementsSparkline.values,
          labels: totalEncaissementsSparkline.labels,
        }
        : undefined,
      onClick: () => handleCardClick('total-encaissements'),
    },
    {
      id: 'nombre-transactions',
      title: 'Nombre de transactions',
      value: formatCompactNumber(stats.nombreTransactions),
      icon: <TrendingUp className="size-5" />,
      Color: 'emerald-500',
      description: 'Paiements enregistrés',
      trend: buildTrend(trends.nombreTransactions, 'vs période précédente'),
      sparklineData: nombreTransactionsSparkline
        ? {
          values: nombreTransactionsSparkline.values,
          labels: nombreTransactionsSparkline.labels,
        }
        : undefined,
      onClick: () => handleCardClick('nombre-transactions'),
    },
    {
      id: 'encaissements-mois',
      title: 'Encaissements du mois',
      value: formatCurrency(stats.encaissementsMois),
      icon: <Calendar className="size-5" />,
      Color: 'amber-500',
      description: 'Mois en cours',
      trend: buildTrend(trends.encaissementsMois, 'vs mois dernier'),
      sparklineData: encaissementsMoisSparkline
        ? {
          values: encaissementsMoisSparkline.values,
          labels: encaissementsMoisSparkline.labels,
        }
        : undefined,
      onClick: () => handleCardClick('encaissements-mois'),
    },
    {
      id: 'montant-moyen',
      title: 'Montant moyen',
      value: formatCurrency(stats.montantMoyen),
      icon: <Wallet className="size-5" />,
      Color: 'purple-500',
      description: 'Par transaction',
      trend: buildTrend(trends.montantMoyen, 'vs période précédente'),
      sparklineData: montantMoyenSparkline
        ? {
          values: montantMoyenSparkline.values,
          labels: montantMoyenSparkline.labels,
        }
        : undefined,
      onClick: () => handleCardClick('montant-moyen'),
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
          description="Les données sur les paiements seront affichées ici une fois disponibles."
          icon={Landmark}
          className='h-full justify-center'
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

export default PaiementsStatsCards;
