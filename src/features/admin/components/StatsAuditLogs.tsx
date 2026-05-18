// src/features/admin/components/StatsAuditLogs.tsx

/**
 * @module features/admin/components/StatsAuditLogs
 * @description
 * Grille de cartes statistiques pour les logs d’audit.
 * Utilise les métriques étendues (`AdminStats`) pour afficher :
 * - **Total événements** : nombre total de logs d’audit
 * - **Succès** : nombre d’actions réussies (SUCCESS)
 * - **Échecs** : nombre d’actions en échec (FAILED)
 * - **Taux de succès** : pourcentage de réussite (succès / total)
 *
 * Chaque carte supporte :
 * - Valeur formatée (nombre court K/M)
 * - Tendance (évolution par rapport à la période précédente) – via `AdminTrends`
 * - Icône personnalisée avec fond coloré
 * - État de chargement (skeleton)
 * - Clic sur la carte (callback)
 *
 * @author Stive Junior
 * @version 2.0.0
 * @see {@link AdminStats} – Métriques agrégées des logs d’audit
 * @see {@link AdminTrends} – Tendances évolutives
 */

import React from 'react';
import { TrendingUp, Activity, CheckCircle, XCircle } from 'lucide-react';
import {
    StatsGrid,
    type StatsCardProps,
    type StatsTrend,
} from '@/features/dashboard/components/common/StatsCard';
import { EmptyState } from '@/features/dashboard/components/common/EmptyState';
import { cn } from '@/lib/utils';
import type { AdminStats, AdminTrends } from '@/types/admin.types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface StatsAuditLogsProps {
    /** Métriques statistiques des logs d’audit (peut être null pendant le chargement) */
    stats: AdminStats | null;
    /** Tendances évolutives (optionnelles) */
    trends?: Partial<AdminTrends>;
    /** Afficher l’état de chargement (skeleton) */
    isLoading?: boolean;
    /** Callback déclenché au clic sur une carte (reçoit l’identifiant) */
    onCardClick?: (cardId: string) => void;
    /** Classes additionnelles pour la grille */
    className?: string;
    /** Permet de remplacer entièrement les cartes (utilisation avancée) */
    customCards?: StatsCardProps[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilitaires
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formate un nombre en notation courte (K, M) pour l’affichage.
 * @internal
 */
function formatNumber(num: number): string {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
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
 * Grille de cartes statistiques pour les logs d’audit.
 * Affiche : total événements, succès, échecs, taux de succès.
 */
export function StatsAuditLogs({
    stats,
    trends = {},
    isLoading = false,
    onCardClick,
    className,
    customCards,
}: StatsAuditLogsProps): React.JSX.Element {
    const handleClick = (id: string) => onCardClick?.(id);

    // Affichage des squelettes pendant le chargement ou si stats est null
    if (isLoading || !stats) {
        const skeletonCards: StatsCardProps[] = [
            { id: 'skeleton-1', title: '', value: '', icon: null, Color: 'gray' },
            { id: 'skeleton-2', title: '', value: '', icon: null, Color: 'gray' },
            { id: 'skeleton-3', title: '', value: '', icon: null, Color: 'gray' },
            { id: 'skeleton-4', title: '', value: '', icon: null, Color: 'gray' },
        ];
        return (
            <StatsGrid
                cards={skeletonCards}
                cols={4}
                className={cn('w-full', className)}
                isLoading={true}
            />
        );
    }

    const successRate = stats.logsTotal > 0 ? (stats.logsSuccess / stats.logsTotal) * 100 : 0;

    const defaultCards: StatsCardProps[] = [
        {
            id: 'total-events',
            title: 'Total événements',
            value: formatNumber(stats.logsTotal),
            icon: <Activity className="size-5" />,
            Color: 'slate-500',
            description: 'Toutes actions confondues',
            trend: buildTrend(trends.logsTotal, 'vs période précédente'),
            onClick: () => handleClick('total-events'),
        },
        {
            id: 'success',
            title: 'Succès',
            value: formatNumber(stats.logsSuccess),
            icon: <CheckCircle className="size-5" />,
            Color: 'emerald-500',
            description: 'Actions réussies',
            trend: buildTrend(trends.logsSuccess, 'vs période précédente'),
            onClick: () => handleClick('success'),
        },
        {
            id: 'failed',
            title: 'Échecs',
            value: formatNumber(stats.logsFailed),
            icon: <XCircle className="size-5" />,
            Color: 'red-500',
            description: 'Actions échouées',
            trend: buildTrend(trends.logsFailed, 'vs période précédente'),
            onClick: () => handleClick('failed'),
        },
        {
            id: 'success-rate',
            title: 'Taux de succès',
            value: `${successRate.toFixed(1)}%`,
            icon: <TrendingUp className="size-5" />,
            Color: 'blue-500',
            description: 'Réussite / total',
            trend: buildTrend(trends.logsSuccess, 'vs période précédente'), // réutilisation de logsSuccess pour la tendance
            onClick: () => handleClick('success-rate'),
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
                    title="Aucune donnée"
                    description="Aucun événement d’audit enregistré."
                    icon={Activity}
                    variant="dashed"
                    size="md"
                />
            </div>
        );
    }

    return (
        <StatsGrid
            cards={cards}
            cols={4}
            className={cn('w-full', className)}
            isLoading={isLoading}
        />
    );
}

export default StatsAuditLogs;