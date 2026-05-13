// src/features/paiements/components/PaiementsTable.tsx

/**
 * @module features/paiements/components/PaiementsTable
 * @description
 * Tableau des paiements – version complète avec filtres, pagination, actions et enrichissements.
 * Permet de visualiser, filtrer et gérer les encaissements de l’auto‑école.
 *
 * ## Fonctionnalités
 * - Colonnes adaptées selon la variante (admin / secretaire)
 * - Filtre de période (Aujourd'hui / Cette semaine / Ce mois / Tous) basé sur la date du paiement
 * - Filtres facettés intégrés (mode de paiement, candidat, etc.) via barre d’outils
 * - Pagination configurable ou limitation simple (`maxItems`)
 * - Bouton « Actualiser » et « Voir tout » optionnels
 * - Enrichissements pour afficher les informations du candidat (avatar, email) et le numéro de facture
 * - Badges récapitulatifs : nombre de transactions, montant total de la période
 * - État de chargement (skeleton), état vide avec action
 * - Entièrement responsive via conteneur `@container`
 *
 * @see {@link getPaiementsColumns} – Définition des colonnes
 * @see {@link PaiementsTableActions} – Callbacks d’actions
 * @see {@link PaiementsEnrichments} – Enrichissements (candidat, facture)
 *
 * @author Stive Junior
 * @version 2.0.0
 *
 * @example
 * ```tsx
 * // Dashboard admin
 * <PaiementsTable
 *   paiements={paiements}
 *   variant="admin"
 *   enrichments={{
 *     getCandidatNomComplet: (p) => `${p.candidat?.prenom} ${p.candidat?.nom}`,
 *     getCandidatEmail: (p) => p.candidat?.email,
 *     getCandidatAvatarUrl: (p) => p.candidat?.avatarUrl,
 *     getFactureNumero: (p) => p.facture?.numero,
 *   }}
 *   actions={{
 *     onView: (p) => navigate(`/paiements/${p.id}`),
 *     onEdit: (p) => navigate(`/paiements/${p.id}/edit`),
 *     onPrintReceipt: (p) => printReceipt(p),
 *     onDelete: async (p) => deletePaiement(p.id),
 *   }}
 *   showViewAll
 *   onViewAll={() => navigate('/paiements')}
 *   enableToolbar
 *   defaultPeriodFilter="month"
 *   title="Encaissements"
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
import { RefreshCw, ChevronRight, PlusCircle, Receipt } from 'lucide-react';
import { toast } from 'sonner';

import { DataTable } from '@/components/tables/data-table';
import {
    getAdminPaiementsColumns,
    getSecretairePaiementsColumns,
} from '@/components/tables/paiements/paiements-columns';
import type {
    Paiement,
    PaiementsEnrichments,
    PaiementsTableActions,
    PaiementsColumnConfig,
} from '@/types/paiements.types';
import { MODE_PAIEMENT_CONFIG } from '@/types/enums';
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

export type PaiementsPeriodFilter = 'today' | 'week' | 'month' | 'all';

/**
 * @interface PaiementsTableProps
 * @description Propriétés du composant `PaiementsTable`.
 */
export interface PaiementsTableProps {
    /** Liste des paiements à afficher */
    paiements: Paiement[];

    /** Variante d’affichage (influence les colonnes) */
    variant?: 'admin' | 'secretaire';

    /** Configuration fine des colonnes */
    columnConfig?: PaiementsColumnConfig;

    /** Enrichissements optionnels (candidat, facture) */
    enrichments?: PaiementsEnrichments;

    /** Callbacks d’actions sur les lignes */
    actions?: PaiementsTableActions;

    /** Filtre de période par défaut (défaut: 'month') */
    defaultPeriodFilter?: PaiementsPeriodFilter;

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

    /** Afficher le bouton « Ajouter un paiement » */
    showAddButton?: boolean;

    /** Callback du bouton « Ajouter un paiement » */
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
    value: PaiementsPeriodFilter;
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
 * Filtre les paiements selon la période.
 * @internal
 */
function filterByPeriod(
    paiements: Paiement[],
    period: PaiementsPeriodFilter
): Paiement[] {
    if (period === 'all') return paiements;

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
            return paiements;
    }

    return paiements.filter((p) => {
        const date = new Date(p.date);
        return isWithinInterval(date, { start: from, end: to });
    });
}

/**
 * Calcule le montant total des paiements filtrés.
 * @internal
 */
function sumMontant(paiements: Paiement[]): number {
    return paiements.reduce((acc, p) => acc + p.montant, 0);
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
function getPeriodTitle(period: PaiementsPeriodFilter, baseTitle: string): string {
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
 * Tableau des paiements – version complète avec filtres, pagination, actions.
 */
export function PaiementsTable({
    paiements,
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
    showAddButton = false,
    onAddClick,
    title = 'Paiements',
    description,
    asCard = true,
    isLoading = false,
    onRefresh,
    emptyMessage = 'Aucun paiement trouvé.',
    className,
}: PaiementsTableProps): React.JSX.Element {
    const isMobile = useIsMobile();
    const [periodFilter, setPeriodFilter] = React.useState<PaiementsPeriodFilter>(defaultPeriodFilter);
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
            triggerTransition(() => setPeriodFilter(value as PaiementsPeriodFilter));
        },
        [periodFilter, triggerTransition]
    );

    // ── Données filtrées et affichées ─────────────────────────────────────
    const filteredPaiements = React.useMemo(
        () => filterByPeriod(paiements, periodFilter),
        [paiements, periodFilter]
    );

    const displayData = React.useMemo(
        () => (enablePagination ? filteredPaiements : filteredPaiements.slice(0, maxItems)),
        [filteredPaiements, enablePagination, maxItems]
    );

    // ── Statistiques rapides ──────────────────────────────────────────────
    const totalCount = filteredPaiements.length;
    const totalMontant = React.useMemo(() => sumMontant(filteredPaiements), [filteredPaiements]);

    // ── Colonnes ───────────────────────────────────────────────────────────
    const columns = React.useMemo(() => {
        if (variant === 'admin') {
            return getAdminPaiementsColumns(actions, enrichments, columnConfig);
        }
        return getSecretairePaiementsColumns(actions, enrichments, columnConfig);
    }, [variant, actions, enrichments, columnConfig]);

    // ── Rafraîchissement ─────────────────────────────────────────────────
    const handleRefresh = React.useCallback(async () => {
        if (!onRefresh) return;
        setRefreshing(true);
        try {
            await onRefresh();
            toast.success('Paiements actualisés');
        } catch {
            toast.error("Erreur lors de l'actualisation");
        } finally {
            setRefreshing(false);
        }
    }, [onRefresh]);

    // ── Options pour les filtres facettés (mode de paiement) ──────────────
    const modeOptions = React.useMemo(() => {
        return Object.entries(MODE_PAIEMENT_CONFIG).map(([value, cfg]) => ({
            label: cfg.label,
            value,
            icon: cfg.icon,
        }));
    }, []);

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
                    <Separator orientation="vertical" className="h-6 hidden @[480px]/pai:block" />
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
                <div className="flex items-center justify-center h-9 w-9 rounded-md bg-emerald-700 text-white shrink-0">
                    <Receipt className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={cn('font-semibold leading-tight', asCard ? 'text-base' : 'text-lg')}>
                            {getPeriodTitle(periodFilter, title)}
                        </h3>
                        {totalCount > 0 && (
                            <Badge
                                variant="outline"
                                className="text-[10px] h-4 px-1.5 border-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                            >
                                {totalCount} transaction{totalCount > 1 ? 's' : ''}
                            </Badge>
                        )}
                        {totalMontant > 0 && (
                            <Badge
                                variant="outline"
                                className="text-[10px] h-4 px-1.5 border-0 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300"
                            >
                                {formatCurrency(totalMontant)}
                            </Badge>
                        )}
                    </div>
                    {description && <p className="text-xs text-muted-foreground">{description}</p>}
                </div>
            </div>
            <div className="flex items-center gap-1">
                {showAddButton && onAddClick && (
                    <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={onAddClick}>
                        <PlusCircle className="h-3.5 w-3.5" />
                        Ajouter
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
                searchColumn="candidatId"
                searchPlaceholder="Rechercher par candidat…"
                addButtonText="Nouveau paiement"
                onAddClick={onAddClick}
                onRowClick={(row) => actions.onView && actions.onView(row)}
                facetedFilters={
                    enableToolbar
                        ? [
                            {
                                columnId: 'mode',
                                title: 'Mode de paiement',
                                options: modeOptions,
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
            <Card id='paiements' className={cn('@container/pai overflow-hidden shadow-sm rounded-md', className)}>
                <CardHeader className="pb-3 border-b">{header}</CardHeader>
                <CardContent className="pt-4">{tableContent}</CardContent>
            </Card>
        );
    }

    return (
        <div className={cn('@container/pai w-full flex flex-col gap-4', className)}>
            {header}
            {tableContent}
        </div>
    );
}