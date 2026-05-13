// src/features/rapports/components/RapportStatsCards.tsx

/**
 * @module features/rapports/components/RapportStatsCards
 * @description
 * Carte de statistiques multi‑rapports pour l’auto‑école COS.
 * Affiche des indicateurs clés selon le type de rapport sélectionné.
 *
 * ## Types de rapports supportés
 * - `financier` : total paiements, total dépenses, bénéfice (en FCFA)
 * - `candidats` : total inscrits, répartition par statut, taux de réussite
 * - `lecons` : total heures, heures par type (code, conduite), top moniteurs
 * - `vehicules` : disponibilité, kilométrage moyen, entretiens
 *
 * Chaque métrique est affichée dans une `StatsCard` (design system COS),
 * avec tendance optionnelle et sparkline.
 *
 * @example
 * ```tsx
 * <RapportStatsCards
 *   type="financier"
 *   data={{
 *     totalPaiements: 4250000,
 *     totalDepenses: 1875000,
 *     benefice: 2375000,
 *     periode: '2025-03',
 *   }}
 *   trends={{
 *     totalPaiements: 12.5,
 *     totalDepenses: 3.2,
 *   }}
 * />
 * ```
 *
 * @author Stive Junior
 * @version 1.0.0
 */

import {
  TrendingUp,
  Users,
  GraduationCap,
  Car,
  Receipt,
  Wallet,
  BarChart3,
  Award,
  BookOpen,
  CheckCircle,
  Gauge,
  Wrench,
} from 'lucide-react';
import {
  StatsGrid,
  type StatsCardProps,
  type StatsTrend,
} from '@/features/dashboard/components/common/StatsCard';
import { EmptyState } from '@/features/dashboard/components/common/EmptyState';
import { cn } from '@/lib/utils';
import type {
  RapportFinancier,
  RapportCandidats,
  RapportLecons,
  RapportVehicules,
} from '@/types/rapports.types';
import type { RapportType } from '@/components/tables/rapports';


export interface RapportStatsCardsProps {
  /** Type de rapport à afficher */
  type: RapportType;
  /** Données du rapport (selon le type) */
  data: RapportFinancier | RapportCandidats | RapportLecons | RapportVehicules;
  /** Tendances optionnelles (selon le type) */
  trends?: Partial<Record<string, number>>;
  /** Afficher l’état de chargement */
  isLoading?: boolean;
  /** Callback au clic sur une carte (reçoit l’identifiant) */
  onCardClick?: (cardId: string) => void;
  /** Classes additionnelles */
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilitaires
// ─────────────────────────────────────────────────────────────────────────────

function formatCurrency(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M FCFA';
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k FCFA';
  return `${num.toLocaleString('fr-FR')} FCFA`;
}

function formatCompact(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return num.toString();
}

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

export function RapportStatsCards({
  type,
  data,
  trends = {},
  isLoading = false,
  onCardClick,
  className,
}: RapportStatsCardsProps): React.JSX.Element {
  const handleClick = (id: string) => onCardClick?.(id);

  let cards: StatsCardProps[] = [];

  // Construction des cartes selon le type
  if (type === 'financier') {
    const d = data as RapportFinancier;
    cards = [
      {
        id: 'total-paiements',
        title: 'Total paiements',
        value: formatCurrency(d.totalPaiements),
        icon: <Receipt className="size-5" />,
        iconBg: 'bg-emerald-500',
        description: `Période : ${d.periode}`,
        trend: buildTrend(trends.totalPaiements),
        onClick: () => handleClick('total-paiements'),
      },
      {
        id: 'total-depenses',
        title: 'Total dépenses',
        value: formatCurrency(d.totalDepenses),
        icon: <Wallet className="size-5" />,
        iconBg: 'bg-amber-500',
        description: `Période : ${d.periode}`,
        trend: buildTrend(trends.totalDepenses),
        onClick: () => handleClick('total-depenses'),
      },
      {
        id: 'benefice',
        title: 'Bénéfice',
        value: formatCurrency(d.benefice),
        icon: <TrendingUp className="size-5" />,
        iconBg: 'bg-blue-500',
        description: 'Paiements - Dépenses',
        trend: buildTrend(trends.benefice),
        onClick: () => handleClick('benefice'),
      },
    ];
  } else if (type === 'candidats') {
    const d = data as RapportCandidats;
    const actifs = d.parStatut['EN_COURS'] ?? 0;
    const recus = d.parStatut['RECU'] ?? 0;
    cards = [
      {
        id: 'total-inscrits',
        title: 'Total inscrits',
        value: formatCompact(d.totalInscrits),
        icon: <Users className="size-5" />,
        iconBg: 'bg-blue-500',
        description: 'Tous statuts',
        onClick: () => handleClick('total-inscrits'),
      },
      {
        id: 'actifs',
        title: 'Actifs',
        value: formatCompact(actifs),
        icon: <GraduationCap className="size-5" />,
        iconBg: 'bg-emerald-500',
        description: 'En cours',
        onClick: () => handleClick('actifs'),
      },
      {
        id: 'taux-reussite',
        title: 'Taux de réussite',
        value: `${d.tauxReussite}%`,
        icon: <TrendingUp className="size-5" />,
        iconBg: 'bg-amber-500',
        description: 'Reçus / terminés',
        trend: buildTrend(trends.tauxReussite),
        onClick: () => handleClick('taux-reussite'),
      },
      {
        id: 'recus',
        title: 'Candidats reçus',
        value: formatCompact(recus),
        icon: <Award className="size-5" />,
        iconBg: 'bg-purple-500',
        description: 'Permis obtenu',
        onClick: () => handleClick('recus'),
      },
    ];
  } else if (type === 'lecons_parType') {
    const d = data as RapportLecons;
    const heuresConduite = d.parType['CONDUITE'] ?? 0;
    const heuresCode = d.parType['CODE'] ?? 0;
    cards = [
      {
        id: 'total-heures',
        title: 'Total heures',
        value: `${formatCompact(d.totalHeures)} h`,
        icon: <BarChart3 className="size-5" />,
        iconBg: 'bg-blue-500',
        description: 'Code + Conduite',
        onClick: () => handleClick('total-heures'),
      },
      {
        id: 'heures-conduite',
        title: 'Heures conduite',
        value: `${formatCompact(heuresConduite)} h`,
        icon: <Car className="size-5" />,
        iconBg: 'bg-emerald-500',
        description: 'Pratique',
        onClick: () => handleClick('heures-conduite'),
      },
      {
        id: 'heures-code',
        title: 'Heures code',
        value: `${formatCompact(heuresCode)} h`,
        icon: <BookOpen className="size-5" />,
        iconBg: 'bg-amber-500',
        description: 'Théorique',
        onClick: () => handleClick('heures-code'),
      },
    ];
  } else if (type === 'vehicules') {
    const d = data as RapportVehicules;
    cards = [
      {
        id: 'total-vehicules',
        title: 'Total véhicules',
        value: formatCompact(d.totalVehicules),
        icon: <Car className="size-5" />,
        iconBg: 'bg-blue-500',
        description: 'Parc',
        onClick: () => handleClick('total-vehicules'),
      },
      {
        id: 'disponibles',
        title: 'Disponibles',
        value: formatCompact(d.disponibles),
        icon: <CheckCircle className="size-5" />,
        iconBg: 'bg-emerald-500',
        description: 'Opérationnels',
        onClick: () => handleClick('disponibles'),
      },
      {
        id: 'en-entretien',
        title: 'En entretien',
        value: formatCompact(d.enEntretien),
        icon: <Wrench className="size-5" />,
        iconBg: 'bg-amber-500',
        description: 'Maintenance',
        onClick: () => handleClick('en-entretien'),
      },
      {
        id: 'kilometrage-moyen',
        title: 'Kilométrage moyen',
        value: `${formatCompact(d.kilometrageMoyen)} km`,
        icon: <Gauge className="size-5" />,
        iconBg: 'bg-purple-500',
        description: 'Tous véhicules',
        onClick: () => handleClick('kilometrage-moyen'),
      },
    ];
  }

  if (cards.length === 0 && !isLoading) {
    return (
      <div className={cn('w-full', className)}>
        <EmptyState
          title="Aucune donnée"
          description="Aucune statistique disponible pour ce rapport."
          icon={BarChart3}
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

export default RapportStatsCards;
