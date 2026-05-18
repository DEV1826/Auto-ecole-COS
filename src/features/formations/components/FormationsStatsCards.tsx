// src/features/formations/components/FormationsStatsCards.tsx

/**
 * @module features/formations/components/FormationsStatsCards
 * @description
 * Grille de cartes statistiques pour la gestion des formations (offres pédagogiques).
 * Utilisable par l’administrateur et le secrétariat.
 *
 * ## Métriques affichées (par défaut)
 * - **Formations actives** : nombre de formations actuellement proposées
 * - **Prix moyen** : prix moyen des formations actives (en FCFA)
 * - **Total inscriptions** : nombre total d’inscriptions (candidats inscrits à une formation)
 * - **Inscriptions du mois** : inscriptions réalisées ce mois‑ci
 *
 * Chaque carte supporte :
 * - Valeur formatée (nombre court, avec devise pour le prix)
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
 * <FormationsStatsCards
 *   stats={{
 *     totalFormations: 6,
 *     formationsActives: 4,
 *     prixMoyen: 245000,
 *     dureeMoyenneConduite: 20,
 *     totalInscriptions: 158,
 *     inscriptionsMois: 12,
 *   }}
 *   trends={{
 *     formationsActives: 0,
 *     prixMoyen: 2.5,
 *     totalInscriptions: 8,
 *     inscriptionsMois: -3,
 *   }}
 *   inscriptionsMoisSparkline={{
 *     values: [8, 10, 11, 12, 9, 14, 12],
 *     labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil'],
 *   }}
 *   isLoading={false}
 *   onCardClick={(id) => console.log(id)}
 * />
 * ```
 *
 * @author Stive Junior
 * @version 1.1.0
 * @see {@link FormationsStats} – Métriques agrégées
 * @see {@link FormationsTrends} – Tendances évolutives
 * @see {@link StatsCard} – Carte de statistique réutilisable
 * @see {@link StatsGrid} – Grille responsive
 */

import { BookOpen, Wallet, Users, CalendarCheck, GraduationCap } from 'lucide-react';
import {
  StatsGrid,
  type StatsCardProps,
  type StatsTrend,
} from '@/features/dashboard/components/common/StatsCard';
import { EmptyState } from '@/features/dashboard/components/common/EmptyState';
import { cn } from '@/lib/utils';
import type { FormationsStats, FormationsTrends } from '@/types/formations.types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Données d'un sparkline (courbe miniature) pour une métrique de formation.
 */
export interface FormationsSparklineData {
  /** Liste des valeurs (ex: [8, 10, 11, 12]) */
  values: number[];
  /** Étiquettes associées aux valeurs (optionnelles) */
  labels?: string[];
}

/**
 * Propriétés du composant `FormationsStatsCards`.
 */
export interface FormationsStatsCardsProps {
  /** Métriques statistiques des formations */
  stats: FormationsStats | null; // Accepte null pendant le chargement
  /** Tendances évolutives (optionnelles) */
  trends?: Partial<FormationsTrends> | null;

  /** Sparkline pour le nombre de formations actives */
  formationsActivesSparkline?: FormationsSparklineData;
  /** Sparkline pour le prix moyen */
  prixMoyenSparkline?: FormationsSparklineData;
  /** Sparkline pour le total des inscriptions */
  totalInscriptionsSparkline?: FormationsSparklineData;
  /** Sparkline pour les inscriptions du mois */
  inscriptionsMoisSparkline?: FormationsSparklineData;

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
 * Grille de cartes statistiques pour les formations.
 * Affiche les indicateurs clés : formations actives, prix moyen, total des inscriptions,
 * inscriptions du mois, avec tendances et sparklines optionnelles.
 */
export function FormationsStatsCards({
  stats,
  trends = {},
  formationsActivesSparkline,
  prixMoyenSparkline,
  totalInscriptionsSparkline,
  inscriptionsMoisSparkline,
  isLoading = false,
  onCardClick,
  className,
  customCards,
}: FormationsStatsCardsProps): React.JSX.Element {
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
          description="Les données sur les formations seront affichées ici une fois disponibles."
          icon={GraduationCap}
          variant="dashed"
          size="md"
        />
      </div>
    );
  }

  // Cartes par défaut
  const defaultCards: StatsCardProps[] = [
    {
      id: 'formations-actives',
      title: 'Formations actives',
      value: formatCompactNumber(stats.formationsActives),
      icon: <BookOpen className="size-5" />,
      Color: 'blue-500',
      description: 'Offres disponibles',
      trend: buildTrend(trends?.formationsActives, 'vs période précédente'),
      sparklineData: formationsActivesSparkline
        ? {
          values: formationsActivesSparkline.values,
          labels: formationsActivesSparkline.labels,
        }
        : undefined,
      onClick: () => handleCardClick('formations-actives'),
    },
    {
      id: 'prix-moyen',
      title: 'Prix moyen',
      value: formatCurrency(stats.prixMoyen),
      icon: <Wallet className="size-5" />,
      Color: 'emerald-500',
      description: 'Moyenne des formations actives',
      trend: buildTrend(trends?.prixMoyen, 'vs période précédente'),
      sparklineData: prixMoyenSparkline
        ? {
          values: prixMoyenSparkline.values,
          labels: prixMoyenSparkline.labels,
        }
        : undefined,
      onClick: () => handleCardClick('prix-moyen'),
    },
    {
      id: 'total-inscriptions',
      title: 'Total inscriptions',
      value: formatCompactNumber(stats.totalInscriptions),
      icon: <Users className="size-5" />,
      Color: 'amber-500',
      description: 'Candidats inscrits',
      trend: buildTrend(trends?.totalInscriptions, 'vs période précédente'),
      sparklineData: totalInscriptionsSparkline
        ? {
          values: totalInscriptionsSparkline.values,
          labels: totalInscriptionsSparkline.labels,
        }
        : undefined,
      onClick: () => handleCardClick('total-inscriptions'),
    },
    {
      id: 'inscriptions-mois',
      title: 'Inscriptions du mois',
      value: formatCompactNumber(stats.inscriptionsMois),
      icon: <CalendarCheck className="size-5" />,
      Color: 'purple-500',
      description: 'Nouvelles inscriptions',
      trend: buildTrend(trends?.inscriptionsMois, 'vs mois dernier'),
      sparklineData: inscriptionsMoisSparkline
        ? {
          values: inscriptionsMoisSparkline.values,
          labels: inscriptionsMoisSparkline.labels,
        }
        : undefined,
      onClick: () => handleCardClick('inscriptions-mois'),
    },
  ];

  const cards = customCards ?? defaultCards;

  // Vérification de données significatives (uniquement si stats existe)
  const hasData = cards.some((card) => {
    const numericValue =
      typeof card.value === 'number'
        ? card.value
        : parseFloat(String(card.value).replace(/[^0-9.-]/g, ''));
    return !isNaN(numericValue);
  });

  if (!hasData) {
    return (
      <div className={cn('w-full', className)}>
        <EmptyState
          title="Aucune statistique disponible"
          description="Les données sur les formations seront affichées ici une fois disponibles."
          icon={GraduationCap}
          variant="dashed"
          size="md"
        />
      </div>
    );
  }

  return (
    <StatsGrid cards={cards} cols={2} className={cn('w-full', className)} isLoading={false} />
  );
}

export default FormationsStatsCards;