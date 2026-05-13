// src/features/admin/components/StatsAuditLogs.tsx

/**
 * @module features/admin/components/StatsAuditLogs
 * @description
 * Grille de cartes statistiques pour les logs d’audit.
 * Affiche : total d’événements, succès, échecs, actions les plus fréquentes.
 *
 * ## Métriques affichées
 * - **Total événements** : nombre total de logs sur la période sélectionnée
 * - **Succès** : nombre d’actions réussies (SUCCESS)
 * - **Échecs** : nombre d’actions en échec (FAILED)
 * - **Taux de succès** : (succès / total) * 100
 * - **Top 3 actions** : les trois actions les plus fréquentes (optionnel)
 *
 * Chaque carte supporte :
 * - Valeur formatée
 * - Tendance (évolution vs période précédente) optionnelle
 * - Icône personnalisée
 * - État de chargement (skeleton)
 * - Clic sur la carte (callback)
 *
 * @see {@link AuditLogsStats}
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @example
 * ```tsx
 * <StatsAuditLogs stats={stats} isLoading={false} showTrends />
 * ```
 */

import React from 'react';
import { TrendingUp, Activity, CheckCircle, XCircle, BarChart3 } from 'lucide-react';
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
 * Statistiques agrégées pour les logs d’audit.
 */
export interface AuditLogsStats {
    total: number;
    successCount: number;
    failedCount: number;
    last7Days: number;
    thisMonth: number;
}

export interface StatsAuditLogsProps {
    /** Statistiques des logs d’audit */
    stats: AuditLogsStats;
    /** Afficher les tendances (évolution) */
    showTrends?: boolean;
    /** État de chargement */
    isLoading?: boolean;
    /** Callback au clic sur une carte */
    onCardClick?: (cardId: string) => void;
    /** Classes additionnelles */
    className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilitaires
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formate un nombre.
 * @internal
 */
function formatNumber(num: number): string {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'k';
    return num.toString();
}

/**
 * Construit une tendance fictive (pour l’exemple).
 * @internal
 */
function buildTrend(value: number): StatsTrend {
    return {
        value,
        isPositive: value > 0,
        label: 'vs période précédente',
        neutralLabel: 'Stable',
        isPercentage: true,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

export function StatsAuditLogs({
    stats,
    showTrends = false,
    isLoading = false,
    onCardClick,
    className,
}: StatsAuditLogsProps): React.JSX.Element {
    const handleClick = (id: string) => onCardClick?.(id);

    const successRate = stats.total > 0 ? (stats.successCount / stats.total) * 100 : 0;


    const cards: StatsCardProps[] = [
        {
            id: 'total-events',
            title: 'Total événements',
            value: formatNumber(stats.total),
            icon: <Activity className="size-5" />,
            iconBg: 'bg-slate-500',
            description: 'Toutes actions confondues',
            trend: showTrends ? buildTrend(8.5) : undefined,
            onClick: () => handleClick('total-events'),
        },
        {
            id: 'success',
            title: 'Succès',
            value: formatNumber(stats.successCount),
            icon: <CheckCircle className="size-5" />,
            iconBg: 'bg-emerald-500',
            description: 'Actions réussies',
            trend: showTrends ? buildTrend(5.2) : undefined,
            onClick: () => handleClick('success'),
        },
        {
            id: 'failed',
            title: 'Échecs',
            value: formatNumber(stats.failedCount),
            icon: <XCircle className="size-5" />,
            iconBg: 'bg-red-500',
            description: 'Actions échouées',
            trend: showTrends ? buildTrend(-2.1) : undefined,
            onClick: () => handleClick('failed'),
        },
        {
            id: 'success-rate',
            title: 'Taux de succès',
            value: `${successRate.toFixed(1)}%`,
            icon: <TrendingUp className="size-5" />,
            iconBg: 'bg-blue-500',
            description: 'Réussite / total',
            trend: showTrends ? buildTrend(1.8) : undefined,
            onClick: () => handleClick('success-rate'),
        },
    ];


    if (!isLoading && stats.total === 0) {
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

    return <StatsGrid cards={cards} className={cn('w-full', className)} isLoading={isLoading} />;
}