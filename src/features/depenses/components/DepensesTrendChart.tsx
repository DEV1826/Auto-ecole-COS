'use client';

/**
 * @module features/depenses/components/DepensesTrendChart
 * @description
 * Graphique évolutif pour les dépenses par catégorie.
 * - Vue barres empilées (stacked bar chart) : évolution mensuelle.
 * - Vue camembert (donut) : répartition totale via le composant optimisé VitaPieChart.
 * Bascule interactive entre les deux vues via un ToggleGroup.
 *
 * Données réelles depuis le service des dépenses.
 *
 * @author Stive Junior
 * @version 7.0.0
 */

import * as React from 'react';
import { TrendingUp, TrendingDown, BarChart3, PieChart } from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    XAxis,
} from 'recharts';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
    type ChartConfig,
} from '@/components/ui/chart';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Skeleton } from '@/components/ui/skeleton';
import { useDepenses } from '@/hooks/use.depenses';
import { VitaPieChart, type PieSlice } from '@/components/charts/pie/PieChart';
import type { DepensesTrendChartData } from '@/types/depenses.types';

// ─────────────────────────────────────────────────────────────────────────────
// Constantes & Helpers
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
    CARBURANT: 'Carburant',
    ENTRETIEN_VEHICULE: 'Entretien',
    SALAIRE: 'Salaires',
    LOYER: 'Loyer',
    ELECTRICITE: 'Électricité',
    TELEPHONE: 'Téléphone',
    ASSURANCE: 'Assurance',
    PUBLICITE: 'Publicité',
    FOURNITURES: 'Fournitures',
    TAXES: 'Taxes',
    AUTRE: 'Autre',
};

const DEFAULT_COLORS: Record<string, string> = {
    CARBURANT: '#465FFF',
    ENTRETIEN_VEHICULE: '#10B981',
    SALAIRE: '#F59E0B',
    LOYER: '#EF4444',
    ELECTRICITE: '#8B5CF6',
    TELEPHONE: '#06B6D4',
    ASSURANCE: '#F97316',
    PUBLICITE: '#EC4899',
    FOURNITURES: '#6366F1',
    TAXES: '#14B8A6',
    AUTRE: '#6B7280',
};

// Helper pour formater les montants en devise FCFA (non utilisé actuellement)
// const formatCurrency = (value: number): string => {
//   if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M FCFA`;
//   if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k FCFA`;
//   return `${value.toLocaleString('fr-FR')} FCFA`;
// };

type ChartView = 'bars' | 'pie';

// ─────────────────────────────────────────────────────────────────────────────
// Composant Principal
// ─────────────────────────────────────────────────────────────────────────────

export function DepensesTrendChart() {
    const { getTrendChartData, loading } = useDepenses();
    const [data, setData] = React.useState<DepensesTrendChartData | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [view, setView] = React.useState<ChartView>('bars');

    // ID stable unique pour éviter les désynchronisations de buckets de graphiques Recharts
    const chartId = React.useId().replace(/:/g, '_');

    React.useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const chartData = await getTrendChartData();
                setData(chartData);
            } catch (error) {
                console.error("Erreur lors de la récupération des tendances:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [getTrendChartData]);

    // Extraction mémoïsée des catégories contenant des valeurs réelles significatives
    const categoriesWithData = React.useMemo(() => {
        if (!data) return [];
        return Object.keys(data.config).filter((cat) =>
            data.data.some((month) => (month as Record<string, number>)[cat] > 0)
        );
    }, [data]);

    // Construction mémoïsée du dictionnaire de configuration du graphique (ChartConfig)
    const chartConfig = React.useMemo<ChartConfig>(() => {
        const config: ChartConfig = {};
        categoriesWithData.forEach((cat) => {
            config[cat] = {
                label: CATEGORY_LABELS[cat] || cat,
                color: data?.config[cat]?.color || DEFAULT_COLORS[cat] || '#888888',
            };
        });
        return config;
    }, [categoriesWithData, data]);

    // Transformation des données cumulées globales pour alimenter le VitaPieChart
    const pieChartData = React.useMemo<PieSlice[]>(() => {
        if (!data || categoriesWithData.length === 0) return [];

        const totals: Record<string, number> = {};
        categoriesWithData.forEach((cat) => (totals[cat] = 0));

        data.data.forEach((month) => {
            categoriesWithData.forEach((cat) => {
                totals[cat] += (month as Record<string, number>)[cat] || 0;
            });
        });

        return categoriesWithData
            .filter((cat) => totals[cat] > 0)
            .map((cat) => ({
                name: CATEGORY_LABELS[cat] || cat,
                value: totals[cat],
                color: chartConfig[cat].color as string,
                unit: 'FCFA'
            }))
            .sort((a, b) => b.value - a.value); // Tri décroissant visuellement équilibré
    }, [data, categoriesWithData, chartConfig]);

    // Rendu de l'état de chargement asynchrone (Squelette UI)
    if (isLoading || loading) {
        return (
            <Card className="rounded-md shadow-sm">
                <CardHeader>
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-3 w-64" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-72 w-full rounded-md" />
                </CardContent>
                <CardFooter>
                    <Skeleton className="h-8 w-full" />
                </CardFooter>
            </Card>
        );
    }

    // Protection si aucune donnée disponible
    if (!data || data.data.length === 0 || categoriesWithData.length === 0) {
        return (
            <Card className="rounded-md shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base font-semibold">Tendances des dépenses</CardTitle>
                    <CardDescription>Aucune donnée disponible</CardDescription>
                </CardHeader>
                <CardContent className="flex h-72 items-center justify-center">
                    <p className="text-sm text-muted-foreground">Aucune dépense enregistrée sur la période.</p>
                </CardContent>
            </Card>
        );
    }

    const isDecreasing = data.globalTrend < 0;
    const trendColor = isDecreasing ? 'text-emerald-600' : 'text-red-600';
    const TrendIcon = isDecreasing ? TrendingDown : TrendingUp;
    const sign = data.globalTrend > 0 ? '+' : '';


    return (
        <Card className="rounded-md shadow-sm overflow-hidden">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-base font-semibold">Évolution des dépenses</CardTitle>
                        <CardDescription className="text-xs">{data.periodLabel}</CardDescription>
                    </div>

                    {/* Sélecteur de vue (Boutons Toggle) */}
                    <ToggleGroup
                        type="single"
                        value={view}
                        onValueChange={(val) => val && setView(val as ChartView)}
                        className="bg-muted p-0.5 rounded-lg border shrink-0"
                    >
                        <ToggleGroupItem value="bars" aria-label="Vue barres" size="sm" className="data-[state=active]:bg-blue-500 rounded-md text-xs gap-1">
                            <BarChart3 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Évolution</span>
                        </ToggleGroupItem>
                        <ToggleGroupItem value="pie" aria-label="Vue camembert" size="sm" className="data-[state=active]:bg-background rounded-md text-xs gap-1">
                            <PieChart className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Répartition</span>
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>
            </CardHeader>

            <CardContent className="pt-0 pb-2">
                <div className=" w-full flex flex-col justify-center">
                    {view === 'bars' ? (
                        <ChartContainer config={chartConfig} id={chartId} >
                            <BarChart
                                accessibilityLayer
                                data={data.data}
                            >
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="month"
                                    tickLine={false}
                                    tickMargin={10}
                                    axisLine={false}
                                    tickFormatter={(value) => String(value).slice(0, 3)}
                                />
                                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                <ChartLegend content={<ChartLegendContent />} />
                                {categoriesWithData.map((cat, index) => {
                                    const isFirst = index === 0;
                                    const isLast = index === categoriesWithData.length - 1;
                                    const radius: [number, number, number, number] = isFirst ? [0, 0, 4, 4] : isLast ? [4, 4, 0, 0] : [0, 0, 0, 0];
                                    return (
                                        <Bar
                                            key={cat}
                                            dataKey={cat}
                                            stackId="depenses_stack"
                                            fill={chartConfig[cat].color as string}
                                            radius={radius}
                                            stroke="none"
                                        />
                                    );
                                })}
                            </BarChart>
                        </ChartContainer>
                    ) : (
                        /* 
                          Remplacement par ton composant VitaPieChart réutilisable.
                          Il supprime le déséquilibre de hooks internes et gère les étiquettes dynamiquement.
                        */
                        <VitaPieChart
                            data={pieChartData}
                            variant="interactive"
                            showSliceSelector
                            innerRadius="60%"
                            outerRadius="85%"
                            showLegend={false}
                            chartId={`${chartId}_pie`}
                        />
                    )}
                </div>
            </CardContent>

            <CardFooter className="flex-col items-start gap-1 border-t pt-3 bg-muted/10">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <span className="text-muted-foreground font-normal">Tendance globale :</span>
                    <span className={`flex items-center font-bold ${trendColor}`}>
                        <TrendIcon className="h-4 w-4 mr-1 shrink-0" />
                        {sign}{data.globalTrend}%
                    </span>
                    <span className="text-muted-foreground text-xs font-normal">vs période précédente</span>
                </div>
            </CardFooter>
        </Card>
    );
}