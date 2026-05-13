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
 * - Design responsive : donut à gauche, informations à droite
 *
 * @see {@link Moniteur}
 *
 * @example
 * ```tsx
 * <MoniteursResumeCard
 *   moniteurs={moniteurs}
 *   trend={{ value: 3.85, isPositive: true }}
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
import { cn, getAvatarUrl } from '@/lib/utils';
import type { Moniteur } from '@/types/moniteurs.types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface MoniteursResumeCardProps {
    /** Liste des moniteurs */
    moniteurs: Moniteur[];
    /** Tendance globale (ex: +3.85%) */
    trend?: {
        value: number;
        isPositive: boolean;
        label?: string;
    };
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
 * Calcule le nombre de leçons données (basé sur les relations ou simulation).
 * @internal
 */
function getLeconsCount(moniteur: Moniteur): number {
    // En production, utiliser moniteur.lecons?.length
    return moniteur.lecons?.length ?? Math.floor(Math.random() * 150) + 20;
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
 */
export function MoniteursResumeCard({
    moniteurs,
    trend,
    topMoniteursCount = 3,
    onMoniteurClick,
    className,
}: MoniteursResumeCardProps): React.JSX.Element {
    // Calcul des données pour le donut
    const actifsCount = moniteurs.filter((m) => m.actif).length;
    const inactifsCount = moniteurs.filter((m) => !m.actif).length;

    const pieData = React.useMemo(
        () => [
            { name: 'Actifs', value: actifsCount, color: '#10B981' },
            { name: 'Inactifs', value: inactifsCount, color: '#E4E7EC' },
        ],
        [actifsCount, inactifsCount]
    );

    // Top moniteurs par leçons (uniquement actifs)
    const topMoniteurs = React.useMemo(() => {
        return [...moniteurs]
            .filter((m) => m.actif)
            .sort((a, b) => getLeconsCount(b) - getLeconsCount(a))
            .slice(0, topMoniteursCount);
    }, [moniteurs, topMoniteursCount]);

    // Affichage de la tendance
    const renderTrend = () => {
        if (!trend) return null;
        const { value, isPositive, label } = trend;
        return (
            <div className="mt-1 flex items-center gap-1 text-xs">
                <span
                    className={cn(
                        'inline-flex items-center gap-0.5 font-medium',
                        isPositive ? 'text-emerald-600' : 'text-red-600'
                    )}
                >
                    {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {isPositive ? '+' : ''}{value}%
                </span>
                <span className="text-muted-foreground">{label || 'vs période précédente'}</span>
            </div>
        );
    };

    return (
        <Card className={cn('overflow-hidden shadow-sm rounded-md h-full flex justify-center', className)}>
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Moniteurs</CardTitle>
                <p className="text-xs text-muted-foreground">Instructeurs actifs</p>
            </CardHeader>
            <CardContent className="p-5">
                {/* Layout principal : donut à gauche, contenu à droite */}
                <div className="flex flex-col sm:flex-row items-stretch ">
                    {/* Donut chart (1/3) */}
                    {/* 1. Section Graphique (Centrée avec Valeur Interne) */}
                    <div className="md:col-span-6 flex-1 relative flex flex-col items-center justify-center">
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

                                        {/* Label Central : La Valeur Majestueuse */}
                                        <Label
                                            content={({ viewBox }) => {
                                                const { cx, cy } = viewBox as any;
                                                return (
                                                    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                                                        <tspan x={cx} y={cy - 5} className="fill-foreground text-3xl font-stats font-extrabold tracking-tighter">
                                                            {actifsCount}
                                                        </tspan>
                                                        <tspan x={cx} y={cy + 15} className="fill-muted-foreground text-[10px]  uppercase tracking-widest">
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
                                <span className="h-2.5 w-2.5 rounded-full bg-gray-200" />
                                <span className="text-[11px] text-muted-foreground">Inactifs</span>
                            </div>
                        </div>
                    </div>

                    {/* Contenu texte + liste top moniteurs (2/3) */}
                    <div className="flex-1 min-w-0">
                        {/* Total actifs avec tendance */}
                        <div className="mb-3">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Actifs</p>
                            <div className="flex items-baseline gap-2 flex-wrap">
                                <span className="text-3xl font-bold">{actifsCount}</span>
                                {renderTrend()}
                            </div>
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
                                                    <AvatarImage src={getAvatarUrl(moniteur.nom)} />
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