/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/formations/components/FormationTrendChart.tsx

/**
 * @module features/formations/components/FormationTrendChart
 * @description
 * Graphique d'analyse des tendances d'inscription aux formations.
 *
 * ## Mode multi‑formations (`type="multi"`)
 * - Affiche un **diagramme en donut** avec légende personnalisée (nom, inscriptions, tendance).
 * - Idéal pour comparer la répartition des inscriptions entre plusieurs formations.
 *
 * ## Mode mono‑formation (`type="single"`)
 * - Affiche un **bar chart horizontal** (évolution des inscriptions par mois).
 * - Permet de visualiser la tendance temporelle (hausse / baisse) pour une formation spécifique.
 *
 * ## Fonctionnalités communes
 * - Tooltips interactifs (survol)
 * - Indicateur de tendance globale (avec pourcentage et icône)
 * - Design responsive, thème bleu, intégration ShadCN
 * - État de chargement (`isLoading`) avec squelettes
 *
 * ## Dépendances
 * - `recharts` pour les graphiques
 * - `lucide-react` pour les icônes
 * - `class-variance-authority` pour le `cn`
 *
 * @see {@link FormationTrendDataPoint} – Structure pour mode multi
 * @see {@link MonthlyInscriptionData} – Structure pour mode single
 *
 * @author Stive Junior
 * @version 3.0.0
 *
 * @example
 * // Mode multi‑formations
 * <FormationTrendChart
 *   type="multi"
 *   data={[
 *     { name: "Permis B", inscriptions: 45, trend: 12 },
 *     { name: "Permis A", inscriptions: 32, trend: 5 },
 *   ]}
 *   totalLabel="Total inscriptions"
 *   totalValue={77}
 *   globalTrend={{ value: 8.5, isPositive: true }}
 * />
 *
 * @example
 * // Mode mono‑formation avec données mensuelles
 * <FormationTrendChart
 *   type="single"
 *   formationName="Permis B"
 *   monthlyData={[
 *     { month: "Jan 2024", inscriptions: 5 },
 *     { month: "Fév 2024", inscriptions: 7 },
 *     { month: "Mar 2024", inscriptions: 12 },
 *   ]}
 *   totalInscriptions={24}
 *   trendPercentage={15}
 *   isPositiveTrend={true}
 * />
 */

import * as React from 'react';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Legend,
    ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { MonthlyInscriptionData } from '@/types/formations.types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Point de données pour une formation (mode multi).
 */
export interface FormationTrendDataPoint {
    /** Nom de la formation */
    name: string;
    /** Nombre d'inscriptions */
    inscriptions: number;
    /** Variation en pourcentage (vs période précédente) */
    trend: number;
}


/**
 * Propriétés du composant `FormationTrendChart`.
 */
export interface FormationTrendChartProps {
    /** Type de graphique : 'multi' (plusieurs formations) ou 'single' (une seule formation) */
    type: 'multi' | 'single';

    // ---- Pour type="multi" ----
    /** Liste des formations avec leurs inscriptions et tendances (obligatoire si type="multi") */
    data?: FormationTrendDataPoint[];
    /** Libellé pour la valeur totale (ex: "Total inscriptions") */
    totalLabel?: string;
    /** Valeur totale (somme des inscriptions) */
    totalValue?: number;
    /** Tendance globale (affichée en haut à droite) */
    globalTrend?: {
        value: number;
        isPositive: boolean;
        label?: string;
    };
    /** Couleurs des secteurs (défaut: palette de 8 couleurs) */
    colors?: string[];

    // ---- Pour type="single" ----
    /** Nom de la formation (affiché dans le titre) */
    formationName?: string;
    /** Données mensuelles sur une période (ex: 12 derniers mois) */
    monthlyData?: MonthlyInscriptionData[];
    /** Total des inscriptions sur la période */
    totalInscriptions?: number;
    /** Pourcentage de variation global (par rapport à la période précédente) */
    trendPercentage?: number;
    /** Indique si la tendance est positive (sinon négative) */
    isPositiveTrend?: boolean;

    // ---- Props communes ----
    /** Titre du composant (défaut: "Tendances des formations" pour multi, ou "Évolution des inscriptions" pour single) */
    title?: string;
    /** Description optionnelle */
    description?: string;
    /** Classes additionnelles */
    className?: string;
    /** Afficher l’état de chargement (skeleton) */
    isLoading?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Palette de couleurs par défaut (style COS)
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_COLORS = [
    '#465FFF', // primary
    '#10B981', // emerald
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // violet
    '#06B6D4', // cyan
    '#F97316', // orange
    '#EC4899', // pink,
    '#6366F1', // indigo
    '#14B8A6', // teal
];

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composants internes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tooltip personnalisé pour le donut (multi-formations).
 * @internal
 */
const CustomDonutTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    const value = data.inscriptions;
    const total = data.totalInscriptions;
    const percentage = total ? ((value / total) * 100).toFixed(1) : '0';
    return (
        <div className="rounded-sm border border-border bg-card p-2 text-xs shadow-md">
            <p className="font-medium text-foreground">{data.name}</p>
            <p className="text-primary font-bold">{value} inscription{value > 1 ? 's' : ''}</p>
            <p className="text-muted-foreground">({percentage}% du total)</p>
        </div>
    );
};

/**
 * Tooltip personnalisé pour le bar chart (mono-formation).
 * @internal
 */
const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const value = payload[0].value;
    return (
        <div className="rounded-sm border border-border bg-card p-2 text-xs shadow-md">
            <p className="font-medium text-foreground">{label}</p>
            <p className="text-primary font-bold">{value} inscription{value > 1 ? 's' : ''}</p>
        </div>
    );
};

/**
 * Indicateur de tendance pour une ligne de légende (multi-formations).
 * @internal
 */
const TrendIndicator = ({ value }: { value: number }) => {
    const isPositive = value > 0;
    const isNeutral = value === 0;
    return (
        <span
            className={cn(
                'inline-flex items-center gap-0.5 text-[10px] font-semibold',
                isNeutral && 'text-muted-foreground',
                isPositive && 'text-emerald-600 dark:text-emerald-400',
                !isNeutral && !isPositive && 'text-red-600 dark:text-red-400'
            )}
        >
            {isNeutral ? null : isPositive ? (
                <TrendingUp className="h-3 w-3" />
            ) : (
                <TrendingDown className="h-3 w-3" />
            )}
            {isNeutral ? 'Stable' : `${isPositive ? '+' : ''}${value}%`}
        </span>
    );
};

/**
 * Légende personnalisée pour le donut (côté gauche).
 * @internal
 */
const CustomLegend = ({
    data,
    colors,
}: {
    data: FormationTrendDataPoint[];
    colors: string[];
}) => {
    return (
        <div className="space-y-2">
            {data.map((item, idx) => (
                <div
                    key={item.name}
                    className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/20"
                >
                    <div className="flex items-center gap-2 min-w-0">
                        <div
                            className="h-3 w-3 shrink-0 rounded-full"
                            style={{ backgroundColor: colors[idx % colors.length] }}
                        />
                        <span className="text-sm font-medium truncate">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-semibold tabular-nums">{item.inscriptions}</span>
                        <TrendIndicator value={item.trend} />
                    </div>
                </div>
            ))}
        </div>
    );
};

/**
 * Composant pour le graphique à barres horizontales (single formation).
 * Affiche l'évolution des inscriptions par mois.
 * @internal
 */
const SingleFormationBarChart = ({
    data,
    formationName,
    trendPercentage,
    isPositiveTrend,
}: {
    data: MonthlyInscriptionData[];
    formationName: string;
    trendPercentage?: number;
    isPositiveTrend?: boolean;
}) => {
    // Trier par date (croissant) si les mois sont au format texte standard
    const sortedData = React.useMemo(() => {
        return [...data].sort((a, b) => {
            const dateA = new Date(a.month);
            const dateB = new Date(b.month);
            if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
                return dateA.getTime() - dateB.getTime();
            }
            return a.month.localeCompare(b.month);
        });
    }, [data]);

    if (sortedData.length === 0) {
        return (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                Aucune donnée mensuelle disponible
            </div>
        );
    }

    const maxInscriptions = Math.max(...sortedData.map((d) => d.inscriptions), 0);
    const yAxisWidth = Math.max(60, sortedData.reduce((w, d) => Math.max(w, d.month.length * 6), 60));

    return (
        <div className="w-full">
            <ResponsiveContainer width="100%" height={320}>
                <BarChart
                    layout="vertical"
                    data={sortedData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" domain={[0, maxInscriptions + (maxInscriptions * 0.1)]} />
                    <YAxis
                        type="category"
                        dataKey="month"
                        width={yAxisWidth}
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                    />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        formatter={() => `Inscriptions - ${formationName}`}
                    />
                    <ReferenceLine x={0} stroke="#888" />
                    <Bar
                        dataKey="inscriptions"
                        fill={DEFAULT_COLORS[0]}
                        radius={[0, 4, 4, 0]}
                        barSize={24}
                        label={{
                            position: 'right',
                            fontSize: 11,
                            fill: '#6B7280',
                        }}
                    />
                </BarChart>
            </ResponsiveContainer>

            {/* Indicateur de tendance sous le graphique */}
            {trendPercentage !== undefined && (
                <div className="mt-3 flex justify-end items-center gap-2 text-xs text-muted-foreground">
                    <span>Tendance globale :</span>
                    <span
                        className={cn(
                            'inline-flex items-center gap-1 font-semibold',
                            isPositiveTrend ? 'text-emerald-600' : 'text-red-600'
                        )}
                    >
                        {isPositiveTrend ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {isPositiveTrend ? '+' : ''}{trendPercentage}%
                    </span>
                    <span>vs période précédente</span>
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Graphique de tendances des formations.
 * - Si `type="multi"` : donut chart avec légende (comparaison entre formations).
 * - Si `type="single"` : bar chart horizontal (évolution mensuelle d’une formation).
 *
 * @param props - Les propriétés du composant (voir {@link FormationTrendChartProps})
 * @returns Le graphique adapté
 */
export function FormationTrendChart({
    type,
    // multi
    data = [],
    totalLabel = 'Total inscriptions',
    totalValue,
    globalTrend,
    colors = DEFAULT_COLORS,
    // single
    formationName,
    monthlyData = [],
    totalInscriptions,
    trendPercentage,
    isPositiveTrend = true,
    // common
    title,
    description,
    className,
    isLoading = false,
}: FormationTrendChartProps): React.JSX.Element {

    if (isLoading) {
        return (
            <Card className={cn('shadow-sm rounded-md h-full', className)}>
                <CardHeader className="pb-3">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-64 mt-1" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-62.5 max-h-auto w-full" />
                </CardContent>
            </Card>
        );
    }


    description = type === 'multi'
        ? 'Répartition par formation'
        : 'Évolution mensuelle';



    // Mode mono‑formation
    if (type === 'single') {
        const computedTitle = title || `Évolution des inscriptions - ${formationName || 'Formation'}`;
        const computedTotal = totalInscriptions ?? monthlyData.reduce((sum, d) => sum + d.inscriptions, 0);
        return (
            <Card className={cn('shadow-sm rounded-md', className)}>
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <CardTitle className="text-base font-semibold">{computedTitle}</CardTitle>
                            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
                        </div>
                        {trendPercentage !== undefined && (
                            <Badge
                                variant="outline"
                                className={cn(
                                    'text-[10px] border-0',
                                    isPositiveTrend ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40' : 'bg-red-100 text-red-700 dark:bg-red-950/40'
                                )}
                            >
                                {isPositiveTrend ? '+' : ''}{trendPercentage}%
                            </Badge>
                        )}
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-3xl font-bold">{computedTotal}</span>
                        <span className="text-sm text-muted-foreground">inscriptions totales</span>
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    <SingleFormationBarChart
                        data={monthlyData}
                        formationName={formationName || 'Formation'}
                        trendPercentage={trendPercentage}
                        isPositiveTrend={isPositiveTrend}
                    />
                </CardContent>
            </Card>
        );
    }

    // Mode multi‑formations
    const sortedData = [...data].sort((a, b) => b.inscriptions - a.inscriptions);
    const computedTotal = totalValue ?? sortedData.reduce((acc, d) => acc + d.inscriptions, 0);
    const pieData = sortedData.map((item) => ({
        ...item,
        totalInscriptions: computedTotal,
    }));

    const defaultTitle = title || 'Tendances des formations';
    const renderGlobalTrend = () => {
        if (!globalTrend) return null;
        const { value, isPositive, label } = globalTrend;
        if (value === 0) {
            return (
                <div className="flex items-center gap-1.5 rounded-full bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3 text-muted-foreground" />
                    <span className="font-semibold text-muted-foreground">Stable</span>
                    <span className="text-muted-foreground">{label || 'vs période précédente'}</span>
                </div>
            );
        }
        return (
            <div className="flex items-center gap-1.5 rounded-full bg-muted/50 px-2 py-0.5 text-xs">
                {isPositive ? (
                    <TrendingUp className="h-3 w-3 text-emerald-600" />
                ) : (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                <span className={cn('font-semibold', isPositive ? 'text-emerald-600' : 'text-red-600')}>
                    {isPositive ? '+' : ''}{value}%
                </span>
                <span className="text-muted-foreground">{label || 'vs période précédente'}</span>
            </div>
        );
    };

    return (
        <Card className={cn('shadow-sm rounded-md', className)}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <CardTitle className="text-base font-semibold">{defaultTitle}</CardTitle>
                        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
                    </div>
                    {renderGlobalTrend()}
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{computedTotal}</span>
                    <span className="text-sm text-muted-foreground">{totalLabel}</span>
                    {globalTrend && globalTrend.value != 0 && (
                        <Badge variant="outline" className="ml-2 text-[10px] border-0 bg-muted/40">
                            {globalTrend.isPositive ? '+' : ''}{globalTrend.value}% vs période précédente
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                {pieData.length === 0 ? (
                    <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                        Aucune donnée disponible
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <div className="order-2 md:order-1">
                            <CustomLegend data={sortedData} colors={colors} />
                        </div>
                        <div className="order-1 md:order-2 flex justify-center">
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        dataKey="inscriptions"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={2}
                                        labelLine={false}
                                    >
                                        {pieData.map((_, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={colors[index % colors.length]}
                                                stroke="transparent"
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomDonutTooltip />} />
                                    <text
                                        x="50%"
                                        y="50%"
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="fill-foreground text-xl font-bold"
                                    >
                                        {computedTotal}
                                    </text>
                                    <text
                                        x="50%"
                                        y="65%"
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="fill-muted-foreground text-[10px]"
                                    >
                                        total
                                    </text>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}