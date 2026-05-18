'use client';

/**
 * @module features/documents/components/DocumentsChart
 * @description
 * Composant graphique interactif pour visualiser la répartition des documents
 * par type, taille et évolution dans l'auto‑école COS.
 *
 * ## Visualisations
 * - **Donut chart** interactif : répartition par type de document (count)
 * - **Légende enrichie** : count, pourcentage et taille par type
 * - **Tooltip** : détails précis au survol (count, %, taille, mimeTypes)
 * - **Label central** : total ou valeur du type actif
 * - **Sélecteur** : mettre en évidence un type spécifique
 * - **Indicateurs latéraux** : top métriques (total, taille, taux le plus fréquent)
 *
 * ## Design
 * - Thème bleu / multi‑couleurs selon le chart‑config shadcn
 * - Secteur actif avec double anneau (outerRadius + 10 / + 25)
 * - Animations Framer Motion sur le montage des légendes
 * - `ChartContainer`, `ChartStyle`, `ChartTooltip` de shadcn/ui
 * - État de chargement (skeleton) complet
 *
 * @example
 * ```tsx
 * <DocumentsChart
 *   stats={documentStats}
 *   documents={rawDocuments}
 *   isLoading={false}
 * />
 * ```
 *
 * @author Stive Junior
 * @version 2.0.0
 */

import * as React from 'react';
import { Label, Pie, PieChart, Sector } from 'recharts';
import type { PieSectorShapeProps } from 'recharts/types/polar/Pie';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    FileCheck,
    IdCard,
    Receipt,
    File,
    Layers,
    Calendar,
    HardDrive,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    ChartContainer,
    ChartStyle,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import type { DocumentsStats, Document } from '@/types/documents.types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface DocumentsChartProps {
    /** Métriques statistiques agrégées (peut être null pendant le chargement) */
    stats: DocumentsStats | null;
    /** Documents bruts pour calculer les tailles par type */
    documents?: Document[];
    /** État de chargement */
    isLoading?: boolean;
    /** Classes CSS additionnelles */
    className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constantes & configuration du chart
// ─────────────────────────────────────────────────────────────────────────────

const CHART_ID = 'documents-donut-interactive';

/** Clés des types de documents */
const DOC_TYPES = ['permis', 'carteIdentite', 'facture', 'recu', 'autre'] as const;
type DocType = (typeof DOC_TYPES)[number];

/** Labels affichables par type */
const DOC_TYPE_LABELS: Record<DocType, string> = {
    permis: 'Permis',
    carteIdentite: "Carte d'identité",
    facture: 'Facture',
    recu: 'Reçu',
    autre: 'Autre',
};

/** Icônes par type */
const DOC_TYPE_ICONS: Record<DocType, React.ElementType> = {
    permis: FileCheck,
    carteIdentite: IdCard,
    facture: Receipt,
    recu: File,
    autre: FileText,
};

/** Configuration couleurs shadcn/ui chart */
const chartConfig: ChartConfig = {
    count: { label: 'Documents' },
    carteIdentite: { label: "Carte d'identité", color: 'var(--chart-1)' },
    recu: { label: 'Reçu', color: 'var(--chart-2)' },
    autre: { label: 'Autre', color: 'var(--chart-3)' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Fonctions utilitaires
// ─────────────────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 o';
    if (bytes >= 1_000_000) return (bytes / 1_000_000).toFixed(1) + ' Mo';
    if (bytes >= 1_000) return (bytes / 1_000).toFixed(1) + ' Ko';
    return bytes + ' o';
}

/**
 * Calcule la taille totale des documents pour un type donné.
 */
function sizeByType(documents: Document[], type: string): number {
    // Normalise carte_identite → carteIdentite pour la comparaison
    const normalize = (t: string) => (t === 'carte_identite' ? 'carteIdentite' : t);
    return documents
        .filter((d) => normalize(d.type) === type)
        .reduce((acc, d) => acc + (d.taille ?? 0), 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composant : ligne de légende
// ─────────────────────────────────────────────────────────────────────────────

interface LegendRowProps {
    type: DocType;
    count: number;
    total: number;
    tailleBytes: number;
    isActive: boolean;
    onClick: () => void;
    index: number;
}

function LegendRow({ type, count, total, tailleBytes, isActive, onClick, index }: LegendRowProps) {
    const Icon = DOC_TYPE_ICONS[type];
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    const colorVar = `var(--color-${type})`;

    return (
        <motion.button
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.06, duration: 0.2 }}
            onClick={onClick}
            className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left',
                'transition-all duration-150 group',
                isActive ? 'bg-muted/80 ring-1 ring-border/60' : 'hover:bg-muted/40'
            )}
        >
            {/* Pastille couleur + icône */}
            <div
                className="flex items-center justify-center h-8 w-8 rounded-lg shrink-0 transition-transform group-hover:scale-105"
                style={{ backgroundColor: colorVar + '22', border: `1.5px solid ${colorVar}44` }}
            >
                <Icon className="h-3.5 w-3.5" style={{ color: colorVar }} />
            </div>

            {/* Label + barre de progression */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <span
                        className={cn(
                            'text-xs font-semibold leading-none',
                            isActive ? 'text-foreground' : 'text-foreground/80'
                        )}
                    >
                        {DOC_TYPE_LABELS[type]}
                    </span>
                    <span className="text-xs font-bold tabular-nums" style={{ color: colorVar }}>
                        {count}
                    </span>
                </div>
                {/* Barre */}
                <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                    <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: colorVar }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5, delay: index * 0.06 + 0.2, ease: 'easeOut' }}
                    />
                </div>
                <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground">{pct}%</span>
                    {tailleBytes > 0 && (
                        <span className="text-[10px] text-muted-foreground">{formatBytes(tailleBytes)}</span>
                    )}
                </div>
            </div>
        </motion.button>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Squelette de chargement
// ─────────────────────────────────────────────────────────────────────────────

function ChartSkeleton() {
    return (
        <Card className="overflow-hidden">

            <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="w-full md:w-1/2 space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Skeleton className="h-8 w-8 rounded-lg" />
                                <div className="flex-1 space-y-1">
                                    <Skeleton className="h-3 w-20" />
                                    <Skeleton className="h-2 w-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="w-full md:w-1/2 flex justify-center">
                        <Skeleton className="h-52 w-52 rounded-full" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal : DocumentsChart
// ─────────────────────────────────────────────────────────────────────────────

export function DocumentsChart({
    stats,
    documents = [],
    isLoading = false,
    className,
}: DocumentsChartProps): React.JSX.Element {
    const [activeType, setActiveType] = React.useState<DocType>('carteIdentite');

    // Si en chargement, afficher le squelette
    if (isLoading) {
        return <ChartSkeleton />;
    }

    // Si stats est null ou totalDocuments === 0, afficher l'état vide
    if (!stats || stats.totalDocuments === 0) {
        return (
            <Card className={cn('overflow-hidden flex flex-col items-center justify-center min-h-70', className)}>
                <div className="text-center p-6">
                    <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Aucun document à afficher</p>
                </div>
            </Card>
        );
    }

    // ── Calcul des données du chart ───────────────────────────────────────────
    const autre = stats.totalDocuments - stats.documentsCarteIdentite - stats.documentsRecu;

    const chartData = React.useMemo(
        () =>
            [
                {
                    type: 'carteIdentite' as DocType,
                    count: stats.documentsCarteIdentite,
                    fill: `var(--color-carteIdentite)`,
                    tailleBytes: documents.length > 0 ? sizeByType(documents, 'carteIdentite') : 0,
                },
                {
                    type: 'recu' as DocType,
                    count: stats.documentsRecu,
                    fill: `var(--color-recu)`,
                    tailleBytes: documents.length > 0 ? sizeByType(documents, 'recu') : 0,
                },
                {
                    type: 'autre' as DocType,
                    count: Math.max(0, autre),
                    fill: `var(--color-autre)`,
                    tailleBytes: documents.length > 0 ? sizeByType(documents, 'autre') : 0,
                },
            ].filter((d) => d.count > 0),
        [stats, documents, autre]
    );

    const activeIndex = React.useMemo(
        () => chartData.findIndex((d) => d.type === activeType),
        [chartData, activeType]
    );

    const activeItem = chartData[activeIndex] ?? chartData[0];

    // Si après filtrage il n'y a plus de données, afficher l'état vide
    if (chartData.length === 0) {
        return (
            <Card className={cn('overflow-hidden flex flex-col items-center justify-center min-h-70', className)}>
                <div className="text-center p-6">
                    <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Données insuffisantes pour le graphique</p>
                </div>
            </Card>
        );
    }

    // ── Rendu du secteur personnalisé ─────────────────────────────────────────
    const renderPieShape = React.useCallback(
        ({ index, outerRadius = 0, ...props }: PieSectorShapeProps) => {
            if (index === activeIndex) {
                return (
                    <g>
                        <Sector {...props} outerRadius={outerRadius + 8} />
                        <Sector {...props} outerRadius={outerRadius + 20} innerRadius={outerRadius + 10} opacity={0.35} />
                    </g>
                );
            }
            return <Sector {...props} outerRadius={outerRadius} />;
        },
        [activeIndex]
    );

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <Card data-chart={CHART_ID} className={cn('overflow-hidden flex flex-col rounded-md', className)}>
            <ChartStyle id={CHART_ID} config={chartConfig} />

            {/* ── En-tête ──────────────────────────────────────────────────────── */}
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-10 w-10 rounded-md bg-blue-700 text-white shadow-md shrink-0">
                            <Layers className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-base font-bold">Répartition documentaire</CardTitle>
                            <CardDescription className="text-xs mt-0.5">
                                {stats.totalDocuments} document{stats.totalDocuments > 1 ? 's' : ''} ·{' '}
                                {formatBytes(stats.totalTailleBytes)}
                            </CardDescription>
                        </div>
                    </div>
                </div>
            </CardHeader>

            {/* ── Contenu ──────────────────────────────────────────────────────── */}
            <CardContent className="flex-1 pt-2">
                <div className="flex flex-col gap-4 justify-center">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <div className="order-2 md:order-1">
                            {/* Légende enrichie */}
                            <div className="space-y-1">
                                <AnimatePresence>
                                    {chartData.map((item, idx) => (
                                        <LegendRow
                                            key={item.type}
                                            type={item.type}
                                            count={item.count}
                                            total={stats.totalDocuments}
                                            tailleBytes={item.tailleBytes}
                                            isActive={item.type === activeType}
                                            onClick={() => setActiveType(item.type)}
                                            index={idx}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                        <div className="order-1 md:order-2 flex justify-center">
                            {/* Donut chart */}
                            <ChartContainer
                                id={CHART_ID}
                                config={chartConfig}
                                className="mx-auto aspect-square w-full max-w-55"
                            >
                                <PieChart>
                                    <ChartTooltip
                                        cursor={false}
                                        content={
                                            <ChartTooltipContent
                                                hideLabel
                                                formatter={(value, name) => {
                                                    const item = chartData.find((d) => d.type === name);
                                                    const pct =
                                                        stats.totalDocuments > 0
                                                            ? Math.round(((value as number) / stats.totalDocuments) * 100)
                                                            : 0;
                                                    return (
                                                        <div className="flex flex-col gap-0.5 min-w-30">
                                                            <span className="font-semibold text-foreground">
                                                                {DOC_TYPE_LABELS[name as DocType] ?? name}
                                                            </span>
                                                            <span className="text-muted-foreground text-xs">
                                                                {value as number} doc{(value as number) > 1 ? 's' : ''} · {pct}%
                                                            </span>
                                                            {item && item.tailleBytes > 0 && (
                                                                <span className="text-muted-foreground text-xs">
                                                                    {formatBytes(item.tailleBytes)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                }}
                                            />
                                        }
                                    />
                                    <Pie
                                        data={chartData}
                                        dataKey="count"
                                        nameKey="type"
                                        innerRadius={55}
                                        outerRadius={82}
                                        strokeWidth={3}
                                        stroke="hsl(var(--background))"
                                        shape={renderPieShape}
                                        onClick={(_, index) => {
                                            const item = chartData[index];
                                            if (item) setActiveType(item.type);
                                        }}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {/* Label central */}
                                        <Label
                                            content={({ viewBox }) => {
                                                if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                                                    const cx = viewBox.cx ?? 0;
                                                    const cy = viewBox.cy ?? 0;
                                                    return (
                                                        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                                                            <tspan
                                                                x={cx}
                                                                y={cy - 8}
                                                                className="fill-foreground text-3xl font-black"
                                                                fontSize="26"
                                                                fontWeight="800"
                                                            >
                                                                {activeItem?.count ?? stats.totalDocuments}
                                                            </tspan>
                                                            <tspan
                                                                x={cx}
                                                                y={cy + 14}
                                                                className="fill-muted-foreground"
                                                                fontSize="10"
                                                            >
                                                                {activeItem ? DOC_TYPE_LABELS[activeItem.type] : 'Total'}
                                                            </tspan>
                                                        </text>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                    </Pie>
                                </PieChart>
                            </ChartContainer>
                        </div>
                    </div>
                </div>
            </CardContent>

            {/* Pied de carte : indicateur de période */}
            <div className="mt-4 flex justify-center text-[10px] text-muted-foreground border-t pt-3">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Données basées sur {documents.length} document(s)
                    </span>
                    <span className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3" />
                        Taille totale : {formatBytes(documents.reduce((s, d) => s + (d.taille ?? 0), 0))}
                    </span>
                </div>
            </div>
        </Card>
    );
}

export default DocumentsChart;