// src/features/planning/components/LeconsStatsCards.tsx

/**
 * @module features/planning/components/LeconsStatsCards
 * @description
 * Grille de cartes statistiques pour la gestion des leçons (planning).
 * Utilisable par l'administrateur, le secrétariat et les moniteurs.
 *
 * ## Métriques affichées (par défaut)
 * - **Total leçons** : nombre total de leçons (tous statuts)
 * - **Leçons effectuées** : nombre de leçons réalisées (avec tendance)
 * - **Leçons planifiées** : leçons à venir (dans le futur)
 * - **Heures de conduite** : cumul des heures de conduite (code exclu)
 * - **Heures de code** : cumul des heures de code
 * - **Taux occupation véhicules** : % d’utilisation des véhicules sur les créneaux
 *
 * Chaque carte supporte :
 * - Valeur formatée (nombre, heures, pourcentage)
 * - Tendance (évolution par rapport à la période précédente)
 * - Sparkline optionnelle (évolution sur plusieurs mois/semaines)
 * - Icône personnalisée avec fond coloré
 * - État de chargement (skeleton)
 * - Clic sur la carte (callback)
 *
 * Le composant s'intègre au design system COS (gradient bleu, ombre subtile,
 * `backdrop-blur-2xl`, sans bordure). Il utilise `StatsGrid` et `StatsCard` du dossier commun.
 *
 * @example
 * ```tsx
 * <LeconsStatsCards
 *   stats={{
 *     totalLecons: 320,
 *     leconsEffectuees: 280,
 *     leconsPlanifiees: 40,
 *     heuresConduiteTotal: 240,
 *     heuresCodeTotal: 40,
 *     tauxOccupationVehicules: 68,
 *   }}
 *   trends={{
 *     leconsEffectuees: 12.5,
 *     leconsPlanifiees: -5,
 *     heuresConduiteTotal: 15,
 *     tauxOccupationVehicules: 3.2,
 *   }}
 *   leconsEffectueesSparkline={{
 *     values: [220, 240, 260, 270, 280],
 *     labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai'],
 *   }}
 *   isLoading={false}
 *   onCardClick={(id) => console.log(id)}
 * />
 * ```
 *
 * @author Stive Junior
 * @version 1.0.0
 * @see {@link LeconsStats} – Métriques agrégées
 * @see {@link LeconsTrends} – Tendances évolutives
 * @see {@link StatsCard} – Carte de statistique réutilisable
 * @see {@link StatsGrid} – Grille responsive
 */

import { CalendarCheck, CheckCircle, CalendarClock, Car, BookOpen, BarChart3 } from 'lucide-react';
import {
  StatsGrid,
  type StatsCardProps,
  type StatsTrend,
} from '@/features/dashboard/components/common/StatsCard';
import { EmptyState } from '@/features/dashboard/components/common/EmptyState';
import { cn } from '@/lib/utils';
import type { LeconsStats, LeconsTrends } from '@/types/planning.types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Données d'un sparkline (courbe miniature) pour une métrique de leçon.
 */
export interface LeconsSparklineData {
  /** Liste des valeurs (ex: [220, 240, 260]) */
  values: number[];
  /** Étiquettes associées aux valeurs (optionnelles) */
  labels?: string[];
}

/**
 * Propriétés du composant `LeconsStatsCards`.
 */
export interface LeconsStatsCardsProps {
  /** Métriques statistiques des leçons */
  stats: LeconsStats;
  /** Tendances évolutives (optionnelles) */
  trends?: Partial<LeconsTrends>;

  /** Sparkline pour le total des leçons */
  totalLeconsSparkline?: LeconsSparklineData;
  /** Sparkline pour les leçons effectuées */
  leconsEffectueesSparkline?: LeconsSparklineData;
  /** Sparkline pour les leçons planifiées */
  leconsPlanifieesSparkline?: LeconsSparklineData;
  /** Sparkline pour les heures de conduite total */
  heuresConduiteSparkline?: LeconsSparklineData;
  /** Sparkline pour les heures de code total */
  heuresCodeSparkline?: LeconsSparklineData;
  /** Sparkline pour le taux d'occupation des véhicules */
  tauxOccupationSparkline?: LeconsSparklineData;

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
 * Formate un nombre d'heures (une décimale).
 * @internal
 */
function formatHours(num: number): string {
  return num % 1 === 0 ? num.toString() : num.toFixed(1);
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
 * Grille de cartes statistiques pour les leçons.
 * Affiche les indicateurs clés du planning : total, effectuées, planifiées,
 * heures de conduite, heures de code, taux d'occupation des véhicules.
 */
export function LeconsStatsCards({
  stats,
  trends = {},
  totalLeconsSparkline,
  leconsEffectueesSparkline,
  leconsPlanifieesSparkline,
  heuresConduiteSparkline,
  heuresCodeSparkline,
  tauxOccupationSparkline,
  isLoading = false,
  onCardClick,
  className,
  customCards,
}: LeconsStatsCardsProps): React.JSX.Element {
  const handleCardClick = (cardId: string) => {
    onCardClick?.(cardId);
  };

  // Cartes par défaut (6 cartes → grille 2 colonnes = 3 lignes)
  const defaultCards: StatsCardProps[] = [
    {
      id: 'total-lecons',
      title: 'Total leçons',
      value: formatCompactNumber(stats.totalLecons),
      icon: <CalendarCheck className="size-5" />,
      iconBg: 'bg-blue-500',
      description: 'Tous statuts',
      trend: undefined, // pas de tendance directe
      sparklineData: totalLeconsSparkline
        ? { values: totalLeconsSparkline.values, labels: totalLeconsSparkline.labels }
        : undefined,
      onClick: () => handleCardClick('total-lecons'),
    },
    {
      id: 'lecons-effectuees',
      title: 'Leçons effectuées',
      value: formatCompactNumber(stats.leconsEffectuees),
      icon: <CheckCircle className="size-5" />,
      iconBg: 'bg-emerald-500',
      description: 'Réalisées',
      trend: buildTrend(trends.leconsEffectuees, 'vs période précédente'),
      sparklineData: leconsEffectueesSparkline
        ? { values: leconsEffectueesSparkline.values, labels: leconsEffectueesSparkline.labels }
        : undefined,
      onClick: () => handleCardClick('lecons-effectuees'),
    },
    {
      id: 'lecons-planifiees',
      title: 'Leçons planifiées',
      value: formatCompactNumber(stats.leconsPlanifiees),
      icon: <CalendarClock className="size-5" />,
      iconBg: 'bg-amber-500',
      description: 'À venir',
      trend: buildTrend(trends.leconsPlanifiees, 'vs période précédente'),
      sparklineData: leconsPlanifieesSparkline
        ? { values: leconsPlanifieesSparkline.values, labels: leconsPlanifieesSparkline.labels }
        : undefined,
      onClick: () => handleCardClick('lecons-planifiees'),
    },
    {
      id: 'heures-conduite',
      title: 'Heures de conduite',
      value: `${formatHours(stats.heuresConduiteTotal)} h`,
      icon: <Car className="size-5" />,
      iconBg: 'bg-purple-500',
      description: 'Conduite + accompagnée',
      trend: buildTrend(trends.heuresConduiteTotal, 'vs période précédente'),
      sparklineData: heuresConduiteSparkline
        ? { values: heuresConduiteSparkline.values, labels: heuresConduiteSparkline.labels }
        : undefined,
      onClick: () => handleCardClick('heures-conduite'),
    },
    {
      id: 'heures-code',
      title: 'Heures de code',
      value: `${formatHours(stats.heuresCodeTotal)} h`,
      icon: <BookOpen className="size-5" />,
      iconBg: 'bg-indigo-500',
      description: 'Heures théoriques',
      trend: undefined,
      sparklineData: heuresCodeSparkline
        ? { values: heuresCodeSparkline.values, labels: heuresCodeSparkline.labels }
        : undefined,
      onClick: () => handleCardClick('heures-code'),
    },
    {
      id: 'taux-occupation',
      title: 'Occupation véhicules',
      value: `${stats.tauxOccupationVehicules}%`,
      icon: <BarChart3 className="size-5" />,
      iconBg: 'bg-rose-500',
      description: 'Taux d’utilisation',
      trend: buildTrend(trends.tauxOccupationVehicules, 'vs période précédente'),
      sparklineData: tauxOccupationSparkline
        ? { values: tauxOccupationSparkline.values, labels: tauxOccupationSparkline.labels }
        : undefined,
      onClick: () => handleCardClick('taux-occupation'),
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
          description="Les données sur les leçons seront affichées ici une fois disponibles."
          icon={CalendarCheck}
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

export default LeconsStatsCards;
