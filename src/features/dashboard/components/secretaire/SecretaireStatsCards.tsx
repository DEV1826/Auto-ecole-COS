// src/features/dashboard/components/secretaire/SecretaireStatsCards.tsx

/**
 * @module features/dashboard/components/secretaire/SecretaireStatsCards
 * @description
 * Grille de cartes statistiques pour le tableau de bord du secrétaire.
 * Affiche les métriques clés que le secrétaire doit suivre au quotidien.
 *
 * ## Métriques affichées
 * - **Candidats actifs** : nombre de candidats en cours de formation
 * - **Factures impayées** : factures en attente de paiement
 * - **Leçons du jour** : nombre de leçons planifiées aujourd’hui
 * - **Examens programmés** : examens à venir (code / conduite)
 *
 * Chaque carte supporte :
 * - Valeur formatée (nombre court : 12.4K, 1.2M)
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
 * <SecretaireStatsCards
 *   totalCandidats={156}
 *   totalCandidatsTrend={{ value: 8, isPositive: true, label: "vs mois dernier" }}
 *   totalCandidatsSparkline={{ values: [120, 132, 140, 148, 152, 154, 156], labels: ["Jan","Fév","Mar","Avr","Mai","Juin","Juil"] }}
 *   facturesImpayees={12}
 *   facturesImpayeesTrend={{ value: -3, isPositive: true, label: "vs mois dernier" }}
 *   leconsAujourdhui={8}
 *   leconsAujourdhuiTrend={{ value: 2, isPositive: true, label: "vs hier" }}
 *   examensProgrammes={3}
 *   examensProgrammesTrend={{ value: 1, isPositive: false, label: "vs semaine dernière" }}
 *   isLoading={false}
 *   onCardClick={(id) => console.log(id)}
 * />
 * ```
 */

import { Users, FileText, Calendar, ClipboardList } from 'lucide-react';
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
 * Propriétés du composant `SecretaireStatsCards`.
 */
export interface SecretaireStatsCardsProps {
  // ── Métrique 1 : Candidats actifs ─────────────────────────────────────────
  /** Nombre total de candidats actifs (en cours de formation) */
  totalCandidats?: number;
  /** Tendance associée (évolution) */
  totalCandidatsTrend?: StatsTrend;
  /** Données sparkline pour l’évolution des candidats (optionnel) */
  totalCandidatsSparkline?: SparklineData;

  // ── Métrique 2 : Factures impayées ────────────────────────────────────────
  /** Nombre de factures en statut EN_ATTENTE ou PARTIELLEMENT_PAYEE */
  facturesImpayees?: number;
  /** Tendance des factures impayées */
  facturesImpayeesTrend?: StatsTrend;
  /** Sparkline pour l’évolution des impayés (optionnel) */
  facturesImpayeesSparkline?: SparklineData;

  // ── Métrique 3 : Leçons du jour ───────────────────────────────────────────
  /** Nombre de leçons planifiées aujourd’hui */
  leconsAujourdhui?: number;
  /** Tendance des leçons par rapport à hier ou à la moyenne */
  leconsAujourdhuiTrend?: StatsTrend;
  /** Sparkline pour l’évolution des leçons (optionnel) */
  leconsAujourdhuiSparkline?: SparklineData;

  // ── Métrique 4 : Examens programmés ───────────────────────────────────────
  /** Nombre d’examens (code ou conduite) programmés dans les 7 prochains jours */
  examensProgrammes?: number;
  /** Tendance des examens programmés */
  examensProgrammesTrend?: StatsTrend;
  /** Sparkline pour l’évolution des examens (optionnel) */
  examensProgrammesSparkline?: SparklineData;

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

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Grille de cartes statistiques pour le tableau de bord du secrétaire.
 * Affiche les métriques essentielles pour la gestion quotidienne : candidats,
 * factures impayées, planning des leçons et examens à venir.
 */
export function SecretaireStatsCards({
  totalCandidats = 0,
  totalCandidatsTrend,
  totalCandidatsSparkline,
  facturesImpayees = 0,
  facturesImpayeesTrend,
  facturesImpayeesSparkline,
  leconsAujourdhui = 0,
  leconsAujourdhuiTrend,
  leconsAujourdhuiSparkline,
  examensProgrammes = 0,
  examensProgrammesTrend,
  examensProgrammesSparkline,
  isLoading = false,
  onCardClick,
  className,
  customCards,
}: SecretaireStatsCardsProps): React.JSX.Element {
  // Gestionnaire de clic
  const handleCardClick = (cardId: string) => {
    onCardClick?.(cardId);
  };

  // Cartes par défaut
  const defaultCards: StatsCardProps[] = [
    {
      id: 'total-candidats',
      title: 'Candidats actifs',
      value: formatCompactNumber(totalCandidats),
      icon: <Users className="size-5" />,
      Color: 'blue-500',
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
      id: 'factures-impayees',
      title: 'Factures impayées',
      value: formatCompactNumber(facturesImpayees),
      icon: <FileText className="size-5" />,
      Color: 'rose-500',
      description: 'En attente de règlement',
      trend: facturesImpayeesTrend,
      sparklineData: facturesImpayeesSparkline
        ? {
          values: facturesImpayeesSparkline.values,
          labels: facturesImpayeesSparkline.labels,
        }
        : undefined,
      onClick: () => handleCardClick('factures-impayees'),
    },
    {
      id: 'lecons-aujourdhui',
      title: 'Leçons du jour',
      value: formatCompactNumber(leconsAujourdhui),
      icon: <Calendar className="size-5" />,
      Color: 'emerald-500',
      description: 'Programmées aujourd’hui',
      trend: leconsAujourdhuiTrend,
      sparklineData: leconsAujourdhuiSparkline
        ? {
          values: leconsAujourdhuiSparkline.values,
          labels: leconsAujourdhuiSparkline.labels,
        }
        : undefined,
      onClick: () => handleCardClick('lecons-aujourdhui'),
    },
    {
      id: 'examens-programmes',
      title: 'Examens programmés',
      value: formatCompactNumber(examensProgrammes),
      icon: <ClipboardList className="size-5" />,
      Color: 'purple-500',
      description: 'À venir (7 jours)',
      trend: examensProgrammesTrend,
      sparklineData: examensProgrammesSparkline
        ? {
          values: examensProgrammesSparkline.values,
          labels: examensProgrammesSparkline.labels,
        }
        : undefined,
      onClick: () => handleCardClick('examens-programmes'),
    },
  ];

  const cards = customCards ?? defaultCards;

  // Vérification de données significatives
  const hasData = cards.some((card) => {
    const numericValue =
      typeof card.value === 'number'
        ? card.value
        : parseInt(String(card.value).replace(/[^0-9.-]/g, ''), 10);
    return !isNaN(numericValue);
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
  return <StatsGrid cards={cards} cols={2} className={cn('w-full', className)} isLoading={isLoading} />;
}
