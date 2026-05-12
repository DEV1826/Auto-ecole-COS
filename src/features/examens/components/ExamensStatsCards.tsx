// src/features/examens/components/ExamensStatsCards.tsx

/**
 * @module features/examens/components/ExamensStatsCards
 * @description
 * Grille de cartes statistiques pour la gestion des examens (code et conduite).
 * Utilisable par l'administrateur, le secrétariat et les moniteurs.
 *
 * ## Métriques affichées (par défaut)
 * - **Total examens** : nombre total d'examens passés (code + conduite)
 * - **Taux de réussite global** : pourcentage d'examens réussis (`RECU`)
 * - **Examens code** : nombre d'épreuves théoriques
 * - **Examens conduite** : nombre d'épreuves pratiques
 *
 * Chaque carte supporte :
 * - Valeur formatée (nombre court ou pourcentage)
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
 * <ExamensStatsCards
 *   stats={{
 *     totalExamens: 84,
 *     examensCode: 45,
 *     examensConduite: 39,
 *     reussites: 62,
 *     echecs: 22,
 *     tauxReussiteGlobal: 73.8,
 *   }}
 *   trends={{
 *     totalExamens: 8,
 *     examensCode: 5,
 *     examensConduite: 12,
 *     tauxReussiteGlobal: 2.5,
 *   }}
 *   isLoading={false}
 *   onCardClick={(id) => console.log(id)}
 * />
 * ```
 *
 * @author Stive Junior
 * @version 1.0.0
 * @see {@link ExamensStats} – Métriques agrégées
 * @see {@link ExamensTrends} – Tendances évolutives
 * @see {@link StatsCard} – Carte de statistique réutilisable
 * @see {@link StatsGrid} – Grille responsive
 */

import { ClipboardList, FileText, Car, Award } from 'lucide-react';
import {
  StatsGrid,
  type StatsCardProps,
  type StatsTrend,
} from '@/features/dashboard/components/common/StatsCard';
import { EmptyState } from '@/features/dashboard/components/common/EmptyState';
import { cn } from '@/lib/utils';
import type { ExamensStats, ExamensTrends } from '@/types/examens.types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Données d'un sparkline (courbe miniature) pour une métrique d'examen.
 */
export interface ExamensSparklineData {
  /** Liste des valeurs (ex: [120, 135, 140, 155]) */
  values: number[];
  /** Étiquettes associées aux valeurs (optionnelles) */
  labels?: string[];
}

/**
 * Propriétés du composant `ExamensStatsCards`.
 */
export interface ExamensStatsCardsProps {
  /** Métriques statistiques des examens */
  stats: ExamensStats;
  /** Tendances évolutives (optionnelles) */
  trends?: Partial<ExamensTrends>;

  /** Sparkline pour le total des examens */
  totalSparkline?: ExamensSparklineData;
  /** Sparkline pour le taux de réussite global */
  tauxReussiteSparkline?: ExamensSparklineData;
  /** Sparkline pour les examens code */
  codeSparkline?: ExamensSparklineData;
  /** Sparkline pour les examens conduite */
  conduiteSparkline?: ExamensSparklineData;

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
 * Grille de cartes statistiques pour les examens.
 * Affiche les indicateurs clés : total, taux de réussite, examens code, examens conduite.
 */
export function ExamensStatsCards({
  stats,
  trends = {},
  totalSparkline,
  tauxReussiteSparkline,
  codeSparkline,
  conduiteSparkline,
  isLoading = false,
  onCardClick,
  className,
  customCards,
}: ExamensStatsCardsProps): React.JSX.Element {
  const handleCardClick = (cardId: string) => {
    onCardClick?.(cardId);
  };

  // Cartes par défaut
  const defaultCards: StatsCardProps[] = [
    {
      id: 'total-examens',
      title: 'Total examens',
      value: formatCompactNumber(stats.totalExamens),
      icon: <ClipboardList className="size-5" />,
      iconBg: 'bg-blue-500',
      description: 'Code + Conduite',
      trend: buildTrend(trends.totalExamens, 'vs période précédente'),
      sparklineData: totalSparkline
        ? {
            values: totalSparkline.values,
            labels: totalSparkline.labels,
          }
        : undefined,
      onClick: () => handleCardClick('total-examens'),
    },
    {
      id: 'taux-reussite',
      title: 'Taux de réussite',
      value: `${stats.tauxReussiteGlobal}%`,
      icon: <Award className="size-5" />,
      iconBg: 'bg-emerald-500',
      description: 'Global (reçus)',
      trend: buildTrend(trends.tauxReussiteGlobal, 'vs période précédente'),
      sparklineData: tauxReussiteSparkline
        ? {
            values: tauxReussiteSparkline.values,
            labels: tauxReussiteSparkline.labels,
          }
        : undefined,
      onClick: () => handleCardClick('taux-reussite'),
    },
    {
      id: 'examens-code',
      title: 'Examens code',
      value: formatCompactNumber(stats.examensCode),
      icon: <FileText className="size-5" />,
      iconBg: 'bg-amber-500',
      description: 'Épreuves théoriques',
      trend: buildTrend(trends.examensCode, 'vs période précédente'),
      sparklineData: codeSparkline
        ? {
            values: codeSparkline.values,
            labels: codeSparkline.labels,
          }
        : undefined,
      onClick: () => handleCardClick('examens-code'),
    },
    {
      id: 'examens-conduite',
      title: 'Examens conduite',
      value: formatCompactNumber(stats.examensConduite),
      icon: <Car className="size-5" />,
      iconBg: 'bg-purple-500',
      description: 'Épreuves pratiques',
      trend: buildTrend(trends.examensConduite, 'vs période précédente'),
      sparklineData: conduiteSparkline
        ? {
            values: conduiteSparkline.values,
            labels: conduiteSparkline.labels,
          }
        : undefined,
      onClick: () => handleCardClick('examens-conduite'),
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
          description="Les données sur les examens seront affichées ici une fois disponibles."
          icon={ClipboardList}
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

export default ExamensStatsCards;
