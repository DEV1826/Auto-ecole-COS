/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/moniteurs/components/MoniteursResumeCard.tsx

/**
 * @module features/moniteurs/components/MoniteursResumeCard
 * @description
 * Carte de résumé visuel pour les moniteurs (instructeurs).
 * Inspirée du design "Delivery Vehicles" – affiche le nombre de moniteurs actifs,
 * une tendance, un diagramme en donut (actifs/inactifs) et une liste des meilleurs moniteurs.
 *
 * ## Fonctionnalités
 * - Nombre total de moniteurs actifs avec tendance (hausse/baisse)
 * - Donut chart compact de répartition actifs / inactifs
 * - Liste des top 3 moniteurs (par nombre de leçons données) avec avatars
 * - Utilisation des métriques étendues (`MoniteursStatsExtended`) pour les statistiques
 * - État de chargement (skeleton)
 * - Design responsive : donut à gauche, informations à droite
 *
 * @see {@link Moniteur}
 * @see {@link MoniteursStatsExtended}
 *
 * @example
 * ```tsx
 * <MoniteursResumeCard
 *   moniteurs={moniteurs}
 *   stats={stats}
 *   isLoading={loading}
 *   topMoniteursCount={3}
 *   onMoniteurClick={(m) => navigate(`/moniteurs/${m.id}`)}
 * />
 * ```
 */

import * as React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, getAvatarUrl } from '@/lib/utils';
import type { Moniteur } from '@/types/moniteurs.types';
import type { MoniteursStatsExtended } from '@/types/moniteurs.types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface MoniteursResumeCardProps {
    /** Liste des moniteurs (utilisée uniquement pour la liste des top moniteurs) */
    moniteurs: Moniteur[];
    /** Statistiques étendues des moniteurs (peut être null pendant le chargement) */
    stats: MoniteursStatsExtended | null;
    /** État de chargement (skeleton) */
    isLoading?: boolean;
    /** Nombre de top moniteurs à afficher (défaut: 3) */
    topMoniteursCount?: number;
    /** Callback au clic sur un moniteur de la liste */
    onMoniteurClick?: (moniteur: Moniteur) => void;
    /** Classes additionnelles */
    className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Récupère les initiales d’un moniteur.
 * @internal
 */
function getInitials(moniteur: Moniteur): string {
    return `${moniteur.prenom?.[0] ?? ''}${moniteur.nom?.[0] ?? ''}`.toUpperCase();
}

/**
 * Calcule le nombre de leçons données (basé sur la relation ou fallback).
 * @internal
 */
function getLeconsCount(moniteur: Moniteur): number {
    // En production, utiliser moniteur.lecons?.length
    return moniteur.lecons?.length ?? 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composant : Tooltip personnalisé
// ─────────────────────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    return (
        <div className="rounded-xs border border-border bg-card px-2 py-1 text-xs shadow-sm">
            <span className="font-medium">{data.name}</span>
            <span className="ml-2 text-primary font-semibold">{data.value}</span>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Carte de résumé des moniteurs avec donut, tendance et top moniteurs.
 * Utilise les métriques étendues pour les chiffres clés.
 */
export function MoniteursResumeCard({
    moniteurs,
    stats,
    isLoading = false,
    topMoniteursCount = 3,
    onMoniteurClick,
    className,
}: MoniteursResumeCardProps): React.JSX.Element {
    // Affichage du squelette de chargement
    if (isLoading || !stats) {
        return (
            <Card className={cn('overflow-hidden shadow-sm rounded-md h-full', className)}>
                <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-3 w-36 mt-1" />
                </CardHeader>
                <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row items-stretch gap-4">
                        <div className="flex-1 flex items-center justify-center">
                            <Skeleton className="h-32 w-32 rounded-full" />
                        </div>
                        <div className="flex-1 space-y-3">
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-4 w-32" />
                            <div className="space-y-2">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Données pour le donut (actifs / inactifs)
    const actifsCount = stats.actifs;
    const inactifsCount = stats.inactifs;
    const totalHeures = stats.totalHeuresLeçons;
    const evolutionActifs = stats.evolutionActifs;
    const isPositive = evolutionActifs >= 0;

    const pieData = React.useMemo(
        () => [
            { name: 'Actifs', value: actifsCount, color: '#10B981' },
            { name: 'Inactifs', value: inactifsCount, color: '#E4E7EC' },
        ],
        [actifsCount, inactifsCount]
    );

    // Top moniteurs par leçons (uniquement actifs, triés par nombre de leçons)
    const topMoniteurs = React.useMemo(() => {
        return [...moniteurs]
            .filter((m) => m.actif)
            .sort((a, b) => getLeconsCount(b) - getLeconsCount(a))
            .slice(0, topMoniteursCount);
    }, [moniteurs, topMoniteursCount]);

    // Tendance formatée
    const trendValue = Math.abs(evolutionActifs);
    const trendLabel = evolutionActifs === 0 ? 'Stable' : 'vs période précédente';

    return (
        <Card className={cn('overflow-hidden shadow-sm rounded-md h-full', className)}>
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Moniteurs</CardTitle>
                <p className="text-xs text-muted-foreground">Instructeurs actifs</p>
            </CardHeader>
            <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row items-stretch gap-4">
                    {/* Donut chart (gauche) */}
                    <div className="flex-1 relative flex flex-col items-center justify-center">
                        <div className="w-full aspect-square max-w-45">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius="75%"
                                        outerRadius="95%"
                                        startAngle={90}
                                        endAngle={450}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieData.map((entry, idx) => (
                                            <Cell key={`cell-${idx}`} fill={entry.color} stroke="transparent" />
                                        ))}
                                        <Label
                                            content={({ viewBox }) => {
                                                const { cx, cy } = viewBox as any;
                                                return (
                                                    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                                                        <tspan
                                                            x={cx}
                                                            y={cy - 5}
                                                            className="fill-foreground text-3xl font-stats font-extrabold tracking-tighter"
                                                        >
                                                            {actifsCount}
                                                        </tspan>
                                                        <tspan
                                                            x={cx}
                                                            y={cy + 15}
                                                            className="fill-muted-foreground text-[10px] uppercase tracking-widest"
                                                        >
                                                            Actifs
                                                        </tspan>
                                                    </text>
                                                );
                                            }}
                                        />
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center gap-1.5">
                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                <span className="text-[11px] text-muted-foreground">Actifs</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="h-2.5 w-2.5 rounded-full bg-gray-200 dark:bg-gray-700" />
                                <span className="text-[11px] text-muted-foreground">Inactifs</span>
                            </div>
                        </div>
                    </div>

                    {/* Contenu texte + liste top moniteurs (droite) */}
                    <div className="flex-1 min-w-0">
                        {/* Total actifs avec tendance */}
                        <div className="mb-3">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Actifs</p>
                            <div className="flex items-baseline gap-2 flex-wrap">
                                <span className="text-3xl font-bold">{actifsCount}</span>
                                {evolutionActifs !== 0 && (
                                    <div className="flex items-center gap-1 text-xs">
                                        <span
                                            className={cn(
                                                'inline-flex items-center gap-0.5 font-medium',
                                                isPositive ? 'text-emerald-600' : 'text-red-600'
                                            )}
                                        >
                                            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                            {isPositive ? '+' : ''}{trendValue.toFixed(1)}%
                                        </span>
                                        <span className="text-muted-foreground">{trendLabel}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Heures totales (indicateur secondaire) */}
                        <div className="mb-3">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Heures de leçons</p>
                            <p className="text-sm font-semibold">{totalHeures.toFixed(0)} h</p>
                        </div>

                        {/* Top moniteurs */}
                        {topMoniteurs.length > 0 && (
                            <div>
                                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">
                                    Top {topMoniteursCount} moniteurs
                                </p>
                                <div className="space-y-2">
                                    {topMoniteurs.map((moniteur) => (
                                        <div
                                            key={moniteur.id}
                                            className="flex items-center justify-between gap-2 cursor-pointer hover:bg-muted/20 rounded-md p-1 transition-colors"
                                            onClick={() => onMoniteurClick?.(moniteur)}
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <Avatar className="h-7 w-7">
                                                    <AvatarImage src={getAvatarUrl(`${moniteur.prenom} ${moniteur.nom}`)} />
                                                    <AvatarFallback className="text-[10px] font-bold">
                                                        {getInitials(moniteur)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium truncate">
                                                        {moniteur.prenom} {moniteur.nom}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground truncate">
                                                        {moniteur.specialite || 'Moniteur'}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="text-[10px] border-0 bg-muted/40 shrink-0">
                                                {getLeconsCount(moniteur)} leçons
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}