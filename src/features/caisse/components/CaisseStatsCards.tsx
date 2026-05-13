// src/features/caisse/components/CaisseStatsCards.tsx

/**
 * @module features/caisse/components/CaisseStatsCards
 * @description
 * Grille de cartes statistiques pour la gestion de la caisse (trésorerie).
 * Affiche les indicateurs clés de la trésorerie de l’auto‑école.
 *
 * ## Métriques affichées
 * - **Solde actuel** : montant disponible en caisse (avec tendance)
 * - **Entrées du mois** : total des encaissements du mois en cours (avec tendance)
 * - **Sorties du mois** : total des décaissements du mois en cours (avec tendance)
 * - **Solde net du mois** : entrées - sorties du mois (avec tendance)
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
 * @example
 * ```tsx
 * <CaisseStatsCards
 *   stats={{
 *     soldeActuel: 285000,
 *     totalEntrees: 1250000,
 *     totalSorties: 965000,
 *     entreesMois: 320000,
 *     sortiesMois: 210000,
 *   }}
 *   trends={{
 *     soldeActuel: 8.5,
 *     entreesMois: 5.2,
 *     sortiesMois: 7.4,
 *   }}
 *   entreesMoisSparkline={{
 *     values: [250000, 280000, 300000, 310000, 320000],
 *     labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai'],
 *   }}
 *   isLoading={false}
 *   onCardClick={(id) => console.log(id)}
 * />
 * ```
 *
 * @author Stive Junior
 * @version 1.0.0
 * @see {@link CaisseStats} – Métriques agrégées
 * @see {@link CaisseTrends} – Tendances évolutives
 * @see {@link StatsCard} – Carte de statistique réutilisable
 * @see {@link StatsGrid} – Grille responsive
 */

import { Wallet, ArrowUpCircle, ArrowDownCircle, Coins } from 'lucide-react';
import {
    StatsGrid,
    type StatsCardProps,
    type StatsTrend,
} from '@/features/dashboard/components/common/StatsCard';
import { EmptyState } from '@/features/dashboard/components/common/EmptyState';
import { cn } from '@/lib/utils';
import type { CaisseStats, CaisseTrends } from '@/types/caisse.types';

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
    /** Métriques statistiques de la caisse */
    stats: CaisseStats;
    /** Tendances évolutives (optionnelles) */
    trends?: Partial<CaisseTrends>;

    /** Sparkline pour le solde actuel */
    soldeSparkline?: CaisseSparklineData;
    /** Sparkline pour les entrées du mois */
    entreesMoisSparkline?: CaisseSparklineData;
    /** Sparkline pour les sorties du mois */
    sortiesMoisSparkline?: CaisseSparklineData;
    /** Sparkline pour le solde net du mois */
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


    /** Nombre de colonnes dans la grille */
    cols?: 2 | 3 | 4;
}

// ─────────────────────────────────────────────────────────────────────────────
// Fonctions utilitaires
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formate un montant en FCFA avec notation courte (K, M).
 * Exemples : 2 300 → "2.3k", 1 250 000 → "1.3M", 285 000 → "285k"
 * @param num - Montant en FCFA
 * @returns Chaîne formatée
 * @internal
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

    // Solde net du mois
    const soldeNet = stats.entreesMois - stats.sortiesMois;
    const soldeNetPositif = soldeNet >= 0;

    const defaultCards: StatsCardProps[] = [
        {
            id: 'solde-actuel',
            title: 'Solde actuel',
            value: formatCurrency(stats.soldeActuel),
            icon: <Wallet className="size-5" />,
            iconBg: 'bg-blue-500',
            description: 'Trésorerie disponible',
            trend: buildTrend(trends.soldeActuel, 'vs mois dernier'),
            sparklineData: soldeSparkline
                ? { values: soldeSparkline.values, labels: soldeSparkline.labels }
                : undefined,
            onClick: () => handleClick('solde-actuel'),
        },
        {
            id: 'entrees-mois',
            title: 'Entrées (mois)',
            value: formatCurrency(stats.entreesMois),
            icon: <ArrowUpCircle className="size-5" />,
            iconBg: 'bg-emerald-500',
            description: 'Encaissements',
            trend: buildTrend(trends.entreesMois, 'vs mois dernier'),
            sparklineData: entreesMoisSparkline
                ? { values: entreesMoisSparkline.values, labels: entreesMoisSparkline.labels }
                : undefined,
            onClick: () => handleClick('entrees-mois'),
        },
        {
            id: 'sorties-mois',
            title: 'Sorties (mois)',
            value: formatCurrency(stats.sortiesMois),
            icon: <ArrowDownCircle className="size-5" />,
            iconBg: 'bg-amber-500',
            description: 'Décaissements',
            trend: buildTrend(trends.sortiesMois, 'vs mois dernier'),
            sparklineData: sortiesMoisSparkline
                ? { values: sortiesMoisSparkline.values, labels: sortiesMoisSparkline.labels }
                : undefined,
            onClick: () => handleClick('sorties-mois'),
        },
        {
            id: 'solde-net',
            title: 'Solde net',
            value: `${soldeNetPositif ? '+' : ''}${formatCurrency(soldeNet)}`,
            icon: <Coins className="size-5" />,
            iconBg: soldeNetPositif ? 'bg-emerald-500' : 'bg-red-500',
            description: 'Entrées - Sorties',
            trend: undefined,
            sparklineData: soldeNetSparkline
                ? { values: soldeNetSparkline.values, labels: soldeNetSparkline.labels }
                : undefined,
            onClick: () => handleClick('solde-net'),
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
                    description="Les données de caisse seront affichées ici une fois disponibles."
                    icon={Wallet}
                    variant="dashed"
                    size="md"
                />
            </div>
        );
    }

    return (
        <StatsGrid cards={cards} cols={cols} className={cn('w-full', className)} isLoading={isLoading} />
    );
}

export default CaisseStatsCards;