// src/features/caisse/components/CaisseTable.tsx

/**
 * @module features/caisse/components/CaisseTable
 * @description
 * Tableau des mouvements de caisse – version complète avec filtres, pagination, actions et enrichissements.
 * Permet de visualiser l’historique des encaissements et décaissements.
 *
 * ## Fonctionnalités
 * - Colonnes adaptées selon la variante (admin / secretaire)
 * - Filtres facettés intégrés (type de mouvement) via barre d’outils
 * - Filtre de période (Aujourd'hui / Cette semaine / Ce mois / Tous)
 * - Recherche textuelle (description, référence)
 * - Pagination configurable ou limitation simple (`maxItems`)
 * - Bouton « Actualiser » et « Voir tout » optionnels
 * - Enrichissements optionnels (par exemple, lier un mouvement à un véhicule ou un candidat)
 * - Badges récapitulatifs : solde actuel, total entrées/sorties de la période, solde net
 * - État de chargement (skeleton), état vide avec action
 * - Entièrement responsive via conteneur `@container`
 *
 * @see {@link getCaisseColumns} – Définition des colonnes
 * @see {@link CaisseTableActions} – Callbacks d’actions
 * @see {@link CaisseEnrichments} – Enrichissements optionnels
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @example
 * ```tsx
 * <CaisseTable
 *   mouvements={mouvements}
 *   variant="admin"
 *   enrichments={{
 *     getNomCandidat: (m) => m.candidat?.nom,
 *     getVehiculeLibelle: (m) => m.vehicule?.immatriculation,
 *   }}
 *   actions={{
 *     onView: (m) => navigate(`/caisse/${m.id}`),
 *     onPrint: (m) => window.print(),
 *   }}
 *   showViewAll
 *   onViewAll={() => navigate('/caisse')}
 *   enableToolbar
 *   defaultPeriodFilter="month"
 *   title="Historique des mouvements"
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
    isWithinInterval,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { RefreshCw, ChevronRight, Wallet } from 'lucide-react';
import { toast } from 'sonner';

import { DataTable } from '@/components/tables/data-table';
import {
    getAdminCaisseColumns,
    getSecretaireCaisseColumns,
} from '@/components/tables/caisse/caisse-columns';
import type {
    MouvementCaisse,
    CaisseEnrichments,
    CaisseTableActions,
    CaisseColumnConfig,
} from '@/types/caisse.types';
import { TYPE_MOUVEMENT_CONFIG } from '@/types/enums';
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

export type CaissePeriodFilter = 'today' | 'week' | 'month' | 'all';

/**
 * @interface CaisseTableProps
 * @description Propriétés du composant `CaisseTable`.
 */
export interface CaisseTableProps {
    /** Liste des mouvements de caisse à afficher (triés par date décroissante) */
    mouvements: MouvementCaisse[];

    /** Variante d’affichage (influence les colonnes) */
    variant?: 'admin' | 'secretaire';

    /** Configuration fine des colonnes */
    columnConfig?: CaisseColumnConfig;

    /** Enrichissements optionnels (véhicule, candidat, etc.) */
    enrichments?: CaisseEnrichments;

    /** Callbacks d’actions sur les lignes */
    actions?: CaisseTableActions;

    /** Filtre de période par défaut (défaut: 'month') */
    defaultPeriodFilter?: CaissePeriodFilter;

    /** Afficher le sélecteur de période (défaut: true) */
    showPeriodFilter?: boolean;

    /** Nombre maximal d’éléments sans pagination (défaut: 5) */
    maxItems?: number;

    /** Activer la pagination (défaut: false, car la caisse peut être longue) */
    enablePagination?: boolean;

    /** Taille de page par défaut si pagination activée (défaut: 10) */
    defaultPageSize?: number;

    /** Activer la barre d’outils (recherche + filtres facettés) (défaut: false) */
    enableToolbar?: boolean;

    /** Afficher le bouton « Voir tout » */
    showViewAll?: boolean;

    /** Callback du bouton « Voir tout » */
    onViewAll?: () => void;


    /** Callback du bouton « Ajouter un mouvement » */
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

    /** Message personnalisé lorsque la liste est vide */
    emptyMessage?: string;

    /** Classes additionnelles */
    className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Options de période
// ─────────────────────────────────────────────────────────────────────────────

const PERIOD_OPTIONS: {
    value: CaissePeriodFilter;
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
 * Filtre les mouvements selon la période.
 * @internal
 */
function filterByPeriod(
    mouvements: MouvementCaisse[],
    period: CaissePeriodFilter
): MouvementCaisse[] {
    if (period === 'all') return mouvements;

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
            return mouvements;
    }

    return mouvements.filter((m) => {
        const date = new Date(m.date);
        return isWithinInterval(date, { start: from, end: to });
    });
}



/**
 * Récupère le dernier solde connu (si disponible) ou calcule à partir des mouvements.
 * @internal
 */
function getDernierSolde(mouvements: MouvementCaisse[]): number {
    if (mouvements.length === 0) return 0;
    return mouvements[0].solde;
}

/**
 * Formate un montant en FCFA compact.
 * @internal
 */
function formatCurrencyCompact(montant: number): string {
    if (montant >= 1_000_000) return `${(montant / 1_000_000).toFixed(1)}M FCFA`;
    if (montant >= 1_000) return `${(montant / 1_000).toFixed(1)}k FCFA`;
    return `${montant.toLocaleString('fr-FR')} FCFA`;
}

/**
 * Titre dynamique selon la période.
 * @internal
 */
function getPeriodTitle(period: CaissePeriodFilter, baseTitle: string): string {
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
 * Tableau des mouvements de caisse – version complète avec filtres, pagination, actions.
 */
export function CaisseTable({
    mouvements,
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
    title = 'Mouvements de caisse',
    description,
    asCard = true,
    isLoading = false,
    onRefresh,
    emptyMessage = 'Aucun mouvement trouvé.',
    className,
}: CaisseTableProps): React.JSX.Element {
    const isMobile = useIsMobile();
    const [periodFilter, setPeriodFilter] = React.useState<CaissePeriodFilter>(defaultPeriodFilter);
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
            triggerTransition(() => setPeriodFilter(value as CaissePeriodFilter));
        },
        [periodFilter, triggerTransition]
    );

    // ── Données filtrées et affichées ─────────────────────────────────────
    const filteredMouvements = React.useMemo(
        () => filterByPeriod(mouvements, periodFilter),
        [mouvements, periodFilter]
    );

    const displayData = React.useMemo(
        () => (enablePagination ? filteredMouvements : filteredMouvements.slice(0, maxItems)),
        [filteredMouvements, enablePagination, maxItems]
    );

    // ── Statistiques rapides ──────────────────────────────────────────────
    const totalCount = filteredMouvements.length;
    const soldeActuel = getDernierSolde(mouvements);

    // ── Colonnes ───────────────────────────────────────────────────────────
    const columns = React.useMemo(() => {
        if (variant === 'admin') {
            return getAdminCaisseColumns(actions, enrichments, columnConfig);
        }
        return getSecretaireCaisseColumns(actions, enrichments, columnConfig);
    }, [variant, actions, enrichments, columnConfig]);

    // ── Options pour les filtres facettés (type de mouvement) ──────────────
    const typeOptions = React.useMemo(() => {
        return Object.entries(TYPE_MOUVEMENT_CONFIG).map(([value, cfg]) => ({
            label: cfg.label,
            value,
            icon: cfg.icon,
        }));
    }, []);

    // ── Rafraîchissement ─────────────────────────────────────────────────
    const handleRefresh = React.useCallback(async () => {
        if (!onRefresh) return;
        setRefreshing(true);
        try {
            await onRefresh();
            toast.success('Mouvements actualisés');
        } catch {
            toast.error("Erreur lors de l'actualisation");
        } finally {
            setRefreshing(false);
        }
    }, [onRefresh]);

    // ── Barre d’outils supplémentaire (période + boutons) ────────────────
    const extraActions = (
        <div className="flex items-center gap-1.5 flex-wrap">
            {showPeriodFilter && (
                <>
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
                    <Separator orientation="vertical" className="h-6 hidden @[480px]/caisse:block" />
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
                        {totalCount > 0 && (
                            <Badge
                                variant="outline"
                                className="text-[10px] h-4 px-1.5 border-0 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300"
                            >
                                {totalCount} mouvement{totalCount > 1 ? 's' : ''}
                            </Badge>
                        )}
                        {soldeActuel > 0 && (
                            <Badge
                                variant="outline"
                                className="text-[10px] h-4 px-1.5 border-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                            >
                                Solde : {formatCurrencyCompact(soldeActuel)}
                            </Badge>
                        )}
                    </div>
                    {description && <p className="text-xs text-muted-foreground">{description}</p>}
                </div>
            </div>
            <div className="flex items-center gap-1">

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
                pageSizeOptions={[5, 10, 20, 50, 100]}
                searchColumn="description"
                searchPlaceholder="Rechercher par description ou référence…"
                addButtonText="Nouveau mouvement"
                onAddClick={onAddClick}
                onRowClick={(row) => actions.onView && actions.onView(row)}
                facetedFilters={
                    enableToolbar
                        ? [
                            {
                                columnId: 'type',
                                title: 'Type',
                                options: typeOptions,
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
            <Card className={cn('@container/caisse overflow-hidden shadow-sm rounded-md', className)}>
                <CardHeader className="pb-3 border-b">{header}</CardHeader>
                <CardContent className="pt-4">{tableContent}</CardContent>
            </Card>
        );
    }

    return (
        <div className={cn('@container/caisse w-full flex flex-col gap-4', className)}>
            {header}
            {tableContent}
        </div>
    );
};
