// src/features/depenses/components/DepensesTable.tsx

/**
 * @module features/depenses/components/DepensesTable
 * @description
 * Tableau des dépenses – version optimisée pour les dashboards (admin, secrétaire).
 * Permet de visualiser, filtrer et gérer les dépenses de l’auto‑école.
 *
 * ## Fonctionnalités
 * - Colonnes adaptées selon la variante (admin / secretaire)
 * - Filtre de période (Aujourd'hui / Cette semaine / Ce mois / Tous)
 * - Filtres facettés intégrés (Catégorie de dépense, Fournisseur, Véhicule) via barre d’outils
 * - Pagination configurable ou limitation simple (`maxItems`)
 * - Bouton « Actualiser » et « Voir tout » optionnels
 * - Enrichissements pour afficher les informations du véhicule associé
 * - État de chargement (skeleton), état vide avec action
 * - Entièrement responsive via conteneur `@container`
 *
 * @see {@link getDepensesColumns} – Définition des colonnes
 * @see {@link DepensesTableActions} – Callbacks d’actions (voir, modifier, supprimer, joindre reçu)
 * @see {@link DepensesEnrichments} – Enrichissements (véhicule)
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @example
 * ```tsx
 * // Dashboard admin
 * <DepensesTable
 *   depenses={depenses}
 *   variant="admin"
 *   enrichments={{ getVehiculeLibelle: (d) => d.vehicule?.immatriculation ?? '—' }}
 *   actions={{
 *     onView: (d) => navigate(`/depenses/${d.id}`),
 *     onEdit: (d) => navigate(`/depenses/${d.id}/edit`),
 *     onDelete: async (d) => deleteDepense(d.id),
 *   }}
 *   showViewAll
 *   onViewAll={() => navigate('/depenses')}
 *   enableToolbar
 *   defaultPeriodFilter="month"
 *   title="Suivi des dépenses"
 * />
 * ```
 */

import * as React from 'react';
import {
    format,
    startOfDay,
    endOfDay,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { RefreshCw, ChevronRight, Wallet, Download } from 'lucide-react';
import { toast } from 'sonner';

import { DataTable } from '@/components/tables/data-table';
import {
    getAdminDepensesColumns,
    getSecretaireDepensesColumns,
} from '@/components/tables/depenses/depenses-columns';
import type {
    Depense,
    DepensesEnrichments,
    DepensesTableActions,
    DepensesColumnConfig,
} from '@/types/depenses.types';
import { CATEGORIE_DEPENSE_CONFIG } from '@/types/enums';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type DepensesPeriodFilter = 'today' | 'week' | 'month' | 'all';

/**
 * @interface DepensesTableProps
 * @description Propriétés du composant `DepensesTable`.
 */
export interface DepensesTableProps {
    /** Liste des dépenses à afficher */
    depenses: Depense[];

    /** Variante d’affichage (influence les colonnes) */
    variant?: 'admin' | 'secretaire';

    /** Configuration fine des colonnes */
    columnConfig?: DepensesColumnConfig;

    /** Enrichissements optionnels (véhicule) */
    enrichments?: DepensesEnrichments;

    /** Callbacks d’actions sur les lignes */
    actions?: DepensesTableActions;

    /** Filtre de période par défaut */
    defaultPeriodFilter?: DepensesPeriodFilter;

    /** Afficher le sélecteur de période (défaut: true) */
    showPeriodFilter?: boolean;

    /** Nombre maximal d’éléments sans pagination (défaut: 5) */
    maxItems?: number;

    /** Activer la pagination (défaut: false) */
    enablePagination?: boolean;

    /** Taille de page par défaut si pagination activée (défaut: 10) */
    defaultPageSize?: number;

    /** Activer la barre d’outils (recherche + filtres facettés) (défaut: false) */
    enableToolbar?: boolean;

    /** Afficher le bouton « Voir tout » */
    showViewAll?: boolean;

    /** Callback du bouton « Voir tout » */
    onViewAll?: () => void;


    /** Callback du bouton « Ajouter une dépense » */
    onAddClick?: () => void;

    /** En‑tête : titre principal */
    title?: string;

    /** Description sous le titre */
    description?: string;

    /** Encapsuler dans une `Card` (défaut: true) */
    asCard?: boolean;

    /** État de chargement principal */
    isLoading?: boolean;

    /** Callback de rafraîchissement (affiche un bouton) */
    onRefresh?: () => Promise<void>;

    onExport?: () => void;

    /** Message personnalisé lorsque la liste est vide */
    emptyMessage?: string;

    /** Classes additionnelles */
    className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Options de période
// ─────────────────────────────────────────────────────────────────────────────

const PERIOD_OPTIONS: {
    value: DepensesPeriodFilter;
    label: string;
    short: string;
}[] = [
        { value: 'today', label: "Aujourd'hui", short: 'Auj.' },
        { value: 'week', label: 'Cette semaine', short: 'Sem.' },
        { value: 'month', label: 'Ce mois', short: 'Mois' },
        { value: 'all', label: 'Tous', short: 'Tous' },
    ];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Filtre les dépenses selon la période.
 * @internal
 */
function filterByPeriod(
    depenses: Depense[],
    period: DepensesPeriodFilter
): Depense[] {
    if (period === 'all') return depenses;

    const now = new Date();
    let from: Date;
    let to: Date;

    switch (period) {
        case 'today':
            from = startOfDay(now);
            to = endOfDay(now);
            break;
        case 'week':
            from = startOfWeek(now, { weekStartsOn: 1 });
            to = endOfWeek(now, { weekStartsOn: 1 });
            break;
        case 'month':
            from = startOfMonth(now);
            to = endOfMonth(now);
            break;
        default:
            return depenses;
    }

    return depenses.filter((d) => {
        const date = new Date(d.date);
        return date >= from && date <= to;
    });
}

/**
 * Calcule le montant total des dépenses filtrées (pour affichage en badge).
 * @internal
 */
function sumMontant(depenses: Depense[]): number {
    return depenses.reduce((acc, d) => acc + d.montant, 0);
}

/**
 * Formate un montant en FCFA compact.
 * @internal
 */
function formatCurrency(montant: number): string {
    if (montant >= 1_000_000) return `${(montant / 1_000_000).toFixed(1)}M FCFA`;
    if (montant >= 1_000) return `${(montant / 1_000).toFixed(1)}k FCFA`;
    return `${montant.toLocaleString('fr-FR')} FCFA`;
}

/**
 * Titre dynamique selon la période.
 * @internal
 */
function getPeriodTitle(period: DepensesPeriodFilter, baseTitle: string): string {
    if (period === 'all') return baseTitle;
    const today = new Date();
    switch (period) {
        case 'today':
            return `${baseTitle} — ${format(today, 'd MMMM yyyy', { locale: fr })}`;
        case 'week':
            return `${baseTitle} — Semaine du ${format(startOfWeek(today, { weekStartsOn: 1 }), 'd MMM', { locale: fr })}`;
        case 'month':
            return `${baseTitle} — ${format(today, 'MMMM yyyy', { locale: fr })}`;
        default:
            return baseTitle;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tableau des dépenses – version complète avec filtres, pagination, actions.
 */
export function DepensesTable({
    depenses,
    variant = 'admin',
    columnConfig,
    enrichments = {},
    actions = {},
    defaultPeriodFilter = 'month',
    showPeriodFilter = true,
    maxItems = 5,
    enablePagination = false,
    defaultPageSize = 10,
    enableToolbar = false,
    showViewAll = false,
    onViewAll,
    onAddClick,
    onExport,
    title = 'Dépenses',
    description,
    asCard = true,
    isLoading = false,
    onRefresh,
    emptyMessage = 'Aucune dépense trouvée.',
    className,
}: DepensesTableProps): React.JSX.Element {
    const isMobile = useIsMobile();
    const [periodFilter, setPeriodFilter] = React.useState<DepensesPeriodFilter>(defaultPeriodFilter);
    const [refreshing, setRefreshing] = React.useState(false);

    // ── Filtrage avec transition ───────────────────────────────────────────
    const triggerTransition = React.useCallback((fn: () => void) => {
        setRefreshing(true);
        const t = setTimeout(() => {
            fn();
            setRefreshing(false);
        }, 120);
        return () => clearTimeout(t);
    }, []);

    const handlePeriodChange = React.useCallback(
        (value: string) => {
            if (!value || value === periodFilter) return;
            triggerTransition(() => setPeriodFilter(value as DepensesPeriodFilter));
        },
        [periodFilter, triggerTransition]
    );

    // ── Données filtrées et affichées ─────────────────────────────────────
    const filteredDepenses = React.useMemo(
        () => filterByPeriod(depenses, periodFilter),
        [depenses, periodFilter]
    );

    const displayData = React.useMemo(
        () => (enablePagination ? filteredDepenses : filteredDepenses.slice(0, maxItems)),
        [filteredDepenses, enablePagination, maxItems]
    );

    // ── Statistiques rapides ──────────────────────────────────────────────
    const totalFiltered = React.useMemo(() => sumMontant(filteredDepenses), [filteredDepenses]);

    // ── Colonnes ───────────────────────────────────────────────────────────
    const columns = React.useMemo(() => {
        if (variant === 'admin') {
            return getAdminDepensesColumns(actions, enrichments, columnConfig);
        }
        return getSecretaireDepensesColumns(actions, columnConfig);
    }, [variant, actions, enrichments, columnConfig]);

    // ── Rafraîchissement ─────────────────────────────────────────────────
    const handleRefresh = React.useCallback(async () => {
        if (!onRefresh) return;
        setRefreshing(true);
        try {
            await onRefresh();
        } catch {
            toast.error("Erreur lors de l'actualisation");
        } finally {
            setRefreshing(false);
        }
    }, [onRefresh]);

    // ── Options pour les filtres facettés (catégories) ────────────────────
    const categoryOptions = React.useMemo(() => {
        return Object.entries(CATEGORIE_DEPENSE_CONFIG).map(([value, cfg]) => ({
            label: cfg.label,
            icon: cfg.icon,
            value,
        }));
    }, []);

    // ── Barre d’outils supplémentaire (période + boutons) ────────────────
    const extraActions = (
        <div className="flex items-center gap-1.5 flex-wrap">
            {showPeriodFilter && (
                <>
                    {/* Version desktop : on utilise un Select (simplifié) */}
                    <Select value={periodFilter} onValueChange={handlePeriodChange}>
                        <SelectTrigger className="h-8 w-28 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {PERIOD_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                    {isMobile ? opt.short : opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Separator orientation="vertical" className="h-6 hidden @[480px]/dep:block" />
                </>
            )}
            {onRefresh && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    aria-label="Rafraîchir"
                >
                    <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
                </Button>
            )}
            {showViewAll && onViewAll && (
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={onViewAll}>
                    Voir tout
                    <ChevronRight className="h-3.5 w-3.5" />
                </Button>
            )}
        </div>
    );

    // ── En‑tête de la carte ──────────────────────────────────────────────
    const header = (
        <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center h-9 w-9 rounded-md bg-blue-700 text-white shrink-0">
                    <Wallet className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={cn('font-semibold leading-tight', asCard ? 'text-base' : 'text-lg')}>
                            {getPeriodTitle(periodFilter, title)}
                        </h3>
                        {filteredDepenses.length > 0 && (
                            <Badge
                                variant="outline"
                                className="text-[10px] h-4 px-1.5 border-0 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300"
                            >
                                {filteredDepenses.length} dépense{filteredDepenses.length > 1 ? 's' : ''}
                            </Badge>
                        )}
                        {totalFiltered > 0 && (
                            <Badge
                                variant="outline"
                                className="text-[10px] h-4 px-1.5 border-0 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300"
                            >
                                {formatCurrency(totalFiltered)}
                            </Badge>
                        )}
                    </div>
                    {description && <p className="text-xs text-muted-foreground">{description}</p>}
                </div>
            </div>
            <div className="flex items-center gap-1">

                {onExport && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onExport}
                        className="h-8 gap-1.5 text-xs"
                    >
                        <Download className="h-3.5 w-3.5" />
                        Exporter
                    </Button>
                )}
                {extraActions}
            </div>
        </div>
    );

    // ── Contenu du tableau ───────────────────────────────────────────────
    const tableContent = (
        <div className={cn('transition-all duration-120 ease-in-out')}>
            <DataTable
                columns={columns}
                data={displayData}
                isLoading={isLoading || refreshing}
                enableRowSelection={false}
                enablePagination={enablePagination}
                enableToolbar={enableToolbar}
                defaultPageSize={defaultPageSize}
                pageSizeOptions={[5, 10, 20, 50]}
                searchColumn="description"
                searchPlaceholder="Rechercher par description…"
                addButtonText="Nouvelle dépense"
                onAddClick={onAddClick}
                onRowClick={(row) => actions.onView && actions.onView(row)}
                facetedFilters={
                    enableToolbar
                        ? [
                            {
                                columnId: 'categorie',
                                title: 'Catégorie',
                                options: categoryOptions,
                            },
                            {
                                columnId: 'fournisseur',
                                title: 'Fournisseur',
                                options: [],
                            },
                        ]
                        : []
                }
                emptyMessage={emptyMessage}
                onEmptyActionLabel="Actualiser"
                onEmptyClick={handleRefresh}
                EmptyActionIcon={RefreshCw}
                className="border-0 shadow-none"
            />
        </div>
    );

    // ── Rendu final ──────────────────────────────────────────────────────
    if (asCard) {
        return (
            <Card className={cn('@container/dep overflow-hidden shadow-sm rounded-md', className)}>
                <CardHeader className="pb-3 border-b">{header}</CardHeader>
                <CardContent className="pt-4">{tableContent}</CardContent>
            </Card>
        );
    }

    return (
        <div className={cn('@container/dep w-full flex flex-col gap-4', className)}>
            {header}
            {tableContent}
        </div>
    );
}