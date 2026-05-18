// src/features/caisse/components/CaisseStatsCards.tsx

/**
 * @module features/caisse/components/CaisseStatsCards
 * @description
 * Grille de cartes statistiques pour la gestion de la caisse (trésorerie).
 * Affiche les indicateurs clés de la trésorerie de l’auto‑école.
 *
 * ## Métriques affichées
 * - **Solde actuel** : montant disponible en caisse (avec tendance)
 * - **Total entrées** : cumul de tous les encaissements (avec tendance)
 * - **Total sorties** : cumul de tous les décaissements (avec tendance)
 * - **Évolution du solde** : variation du solde (en %) entre le mois précédent et le mois courant,
 *   avec affichage du solde du mois précédent en valeur secondaire.
 *
 * Chaque carte supporte :
 * - Valeur formatée (notation compacte K/M, devise FCFA)
 * - Tendance (évolution par rapport à la période précédente)
 * - Sparkline optionnelle (évolution sur plusieurs mois)
 * - Icône personnalisée avec fond coloré
 * - État de chargement (skeleton)
 * - Clic sur la carte (callback)
 *
 * Le composant s'intègre au design system COS (gradient bleu, ombre subtile,
 * `backdrop-blur-2xl`, sans bordure). Il utilise `StatsGrid` et `StatsCard` du dossier commun.
 *
 * @author Stive Junior
 * @version 2.0.0
 * @see {@link CaisseStatsExtended} – Métriques étendues
 * @see {@link CaisseTrends} – Tendances évolutives
 */

import { Wallet, ArrowUpCircle, ArrowDownCircle, TrendingUp } from 'lucide-react';
import {
    StatsGrid,
    type StatsCardProps,
    type StatsTrend,
} from '@/features/dashboard/components/common/StatsCard';
import { EmptyState } from '@/features/dashboard/components/common/EmptyState';
import { cn } from '@/lib/utils';
import type { CaisseStatsExtended, CaisseTrends } from '@/types/caisse.types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Données d'un sparkline (courbe miniature) pour une métrique de caisse.
 */
export interface CaisseSparklineData {
    /** Liste des valeurs (ex: [250000, 280000, 300000]) */
    values: number[];
    /** Étiquettes associées aux valeurs (optionnelles) */
    labels?: string[];
}

/**
 * Propriétés du composant `CaisseStatsCards`.
 */
export interface CaisseStatsCardsProps {
    /** Métriques statistiques étendues de la caisse (inclut soldeMoisPrecedent et evolutionSolde) */
    stats: CaisseStatsExtended;
    /** Tendances évolutives (optionnelles) */
    trends?: Partial<CaisseTrends>;

    /** Sparkline pour le solde actuel */
    soldeSparkline?: CaisseSparklineData;
    /** Sparkline pour les entrées du mois (optionnel – non utilisé dans cette version, gardé pour compatibilité) */
    entreesMoisSparkline?: CaisseSparklineData;
    /** Sparkline pour les sorties du mois (optionnel) */
    sortiesMoisSparkline?: CaisseSparklineData;
    /** Sparkline pour l'évolution du solde (optionnel) */
    soldeNetSparkline?: CaisseSparklineData;

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

    /** Nombre de colonnes dans la grille (défaut: 2) */
    cols?: 2 | 3 | 4;
}

// ─────────────────────────────────────────────────────────────────────────────
// Fonctions utilitaires
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formate un montant en FCFA avec notation courte (K, M).
 * @param num - Montant en FCFA
 * @returns Chaîne formatée
 */
function formatCurrency(num: number): string {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M FCFA';
    if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k FCFA';
    return `${num.toLocaleString('fr-FR')} FCFA`;
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

export function CaisseStatsCards({
    stats,
    trends = {},
    soldeSparkline,
    entreesMoisSparkline,
    sortiesMoisSparkline,
    soldeNetSparkline,
    isLoading = false,
    onCardClick,
    className,
    customCards,
    cols = 2,
}: CaisseStatsCardsProps): React.JSX.Element {
    const handleClick = (id: string) => onCardClick?.(id);

    // Affichage des squelettes en cas de chargement
    if (isLoading) {
        const skeletonCards: StatsCardProps[] = [
            { id: 'skeleton-1', title: '', value: '', icon: null, Color: 'gray' },
            { id: 'skeleton-2', title: '', value: '', icon: null, Color: 'gray' },
            { id: 'skeleton-3', title: '', value: '', icon: null, Color: 'gray' },
            { id: 'skeleton-4', title: '', value: '', icon: null, Color: 'gray' },
        ];
        return (
            <StatsGrid
                cards={skeletonCards}
                cols={cols}
                className={cn('w-full', className)}
                isLoading={true}
            />
        );
    }

    // Si pas de stats (et pas en chargement), afficher l'état vide
    if (!stats) {
        return (
            <div className={cn('w-full', className)}>
                <EmptyState
                    title="Aucune statistique disponible"
                    description="Les données de caisse seront affichées ici une fois disponibles."
                    icon={Wallet}
                    variant="dashed"
                    size="md"
                    className="h-full"
                />
            </div>
        );
    }

    // Cartes par défaut (4 métriques)
    const defaultCards: StatsCardProps[] = [
        {
            id: 'solde-actuel',
            title: 'Solde actuel',
            value: formatCurrency(stats.soldeActuel),
            icon: <Wallet className="size-5" />,
            Color: 'blue-500',
            description: 'Trésorerie disponible',
            trend: buildTrend(trends.soldeActuel, 'vs mois dernier'),
            sparklineData: soldeSparkline
                ? { values: soldeSparkline.values, labels: soldeSparkline.labels }
                : undefined,
            onClick: () => handleClick('solde-actuel'),
        },
        {
            id: 'total-entrees',
            title: 'Total entrées',
            value: formatCurrency(stats.totalEntrees),
            icon: <ArrowUpCircle className="size-5" />,
            Color: 'emerald-500',
            description: 'Cumul des encaissements',
            trend: buildTrend(trends.totalEntrees, 'vs période précédente'),
            sparklineData: entreesMoisSparkline
                ? { values: entreesMoisSparkline.values, labels: entreesMoisSparkline.labels }
                : undefined,
            onClick: () => handleClick('total-entrees'),
        },
        {
            id: 'total-sorties',
            title: 'Total sorties',
            value: formatCurrency(stats.totalSorties),
            icon: <ArrowDownCircle className="size-5" />,
            Color: 'amber-500',
            description: 'Cumul des décaissements',
            trend: buildTrend(trends.totalSorties, 'vs période précédente'),
            sparklineData: sortiesMoisSparkline
                ? { values: sortiesMoisSparkline.values, labels: sortiesMoisSparkline.labels }
                : undefined,
            onClick: () => handleClick('total-sorties'),
        },
        {
            id: 'evolution-solde',
            title: 'Évolution du solde',
            value: `${stats.evolutionSolde >= 0 ? '+' : ''}${stats.evolutionSolde.toFixed(1)}%`,
            icon: <TrendingUp className="size-5" />,
            Color: stats.evolutionSolde >= 0 ? 'emerald-500' : 'red-500',
            description: `Solde mois précédent : ${formatCurrency(stats.soldeMoisPrecedent)}`,
            trend: undefined,
            sparklineData: soldeNetSparkline
                ? { values: soldeNetSparkline.values, labels: soldeNetSparkline.labels }
                : undefined,
            onClick: () => handleClick('evolution-solde'),
        },
    ];

    const cards = customCards ?? defaultCards;

    // Vérification que les données sont significatives
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
                    description="Les données de caisse seront affichées ici une fois disponibles."
                    icon={Wallet}
                    variant="dashed"
                    size="md"
                />
            </div>
        );
    }

    return (
        <StatsGrid
            cards={cards}
            cols={cols}
            className={cn('w-full', className)}
            isLoading={isLoading}
        />
    );
}

export default CaisseStatsCards;
