// src/features/formations/components/FormationTrendChart.tsx

/**
 * @module features/formations/components/FormationTrendChart
 * @description
 * Graphique d'analyse des tendances d'inscription aux formations.
 * Affiche un diagramme en donut avec une légende personnalisée sur la gauche
 * pour mettre en évidence la répartition des inscriptions et les tendances.
 *
 * ## Fonctionnalités
 * - Donut chart interactif (survol, tooltip)
 * - Légende personnalisée (couleur, nom de formation, nombre d'inscriptions, tendance)
 * - Indicateur de tendance globale (hausse / baisse) avec pourcentage
 * - Total des inscriptions central dans le donut
 * - Design responsive, thème bleu, intégration avec les cartes ShadCN
 *
 * @see {@link Formation} – Modèle de formation
 *
 * @author Stive Junior
 * @version 2.0.0
 *
 * @example
 * ```tsx
 * <FormationTrendChart
 *   data={[
 *     { name: "Permis B", inscriptions: 45, trend: 12 },
 *     { name: "Permis A", inscriptions: 32, trend: 5 },
 *     { name: "Permis C", inscriptions: 24, trend: -2 },
 *   ]}
 *   totalLabel="Total inscriptions"
 *   totalValue={158}
 *   globalTrend={{ value: 8.5, isPositive: true }}
 * />
 * ```
 */

import * as React from 'react';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Point de données pour une formation.
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
    /** Liste des formations avec leurs inscriptions et tendances */
    data: FormationTrendDataPoint[];
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
    /** Couleurs des secteurs (défaut: palette de 10 couleurs commence par primary) */
    colors?: string[];
    /** Titre du composant (défaut: "Tendances des formations") */
    title?: string;
    /** Description optionnelle */
    description?: string;
    /** Classes additionnelles */
    className?: string;
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
    '#EC4899', // pink
];

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tooltip personnalisé pour le donut.
 * @internal
 */
const CustomTooltip = ({ active, payload }: any) => {
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
 * Composant pour afficher la tendance d'une ligne de légende.
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
 * Légende personnalisée (côté gauche) avec nom, nombre et tendance.
 * Utilisée à la place de la légende Recharts.
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

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Graphique de tendances des formations (donut chart avec légende personnalisée).
 * Affiche la répartition des inscriptions par formation.
 */
export function FormationTrendChart({
    data,
    totalLabel = 'Total inscriptions',
    totalValue,
    globalTrend,
    colors = DEFAULT_COLORS,
    title = 'Tendances des formations',
    description,
    className,
}: FormationTrendChartProps): React.JSX.Element {
    // Trier les données par ordre décroissant pour la légende (optionnel)
    const sortedData = React.useMemo(() => {
        return [...data].sort((a, b) => b.inscriptions - a.inscriptions);
    }, [data]);

    // Calcul du total des inscriptions
    const computedTotal = totalValue ?? sortedData.reduce((acc, d) => acc + d.inscriptions, 0);

    // Préparer les données pour le donut (ajout du total pour le tooltip)
    const pieData = sortedData.map((item) => ({
        ...item,
        totalInscriptions: computedTotal,
    }));

    // Déterminer la tendance globale affichée
    const renderGlobalTrend = () => {
        if (!globalTrend) return null;
        const { value, isPositive, label } = globalTrend;
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
                        <CardTitle className="text-base font-semibold">{title}</CardTitle>
                        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
                    </div>
                    {renderGlobalTrend()}
                </div>
                {/* Indicateur de métrique globale */}
                <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{computedTotal}</span>
                    <span className="text-sm text-muted-foreground">{totalLabel}</span>
                    {globalTrend && (
                        <Badge variant="outline" className="ml-2 text-[10px] border-0 bg-muted/40">
                            {globalTrend.isPositive ? '+' : ''}{globalTrend.value}% vs période précédente
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                {/* Grille 2 colonnes : légende (gauche) + donut (droite) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    {/* Légende personnalisée à gauche */}
                    <div className="order-2 md:order-1">
                        {pieData.length > 0 ? (
                            <CustomLegend data={sortedData} colors={colors} />
                        ) : (
                            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                                Aucune donnée disponible
                            </div>
                        )}
                    </div>

                    {/* Donut chart à droite */}
                    <div className="order-1 md:order-2 flex justify-center">
                        {pieData.length > 0 ? (
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
                                        {pieData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={colors[index % colors.length]}
                                                stroke="transparent"
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    {/* Optionnel : un label central pour le total */}
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
                        ) : (
                            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                                Aucune donnée
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}