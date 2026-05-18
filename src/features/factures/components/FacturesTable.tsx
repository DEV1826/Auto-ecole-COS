// src/features/factures/components/FacturesTable.tsx

/**
 * @module features/factures/components/FacturesTable
 * @description
 * Tableau des factures – version complète avec filtres, pagination, actions et enrichissements.
 * Permet de visualiser, filtrer et gérer les factures émises aux candidats.
 *
 * ## Fonctionnalités
 * - Colonnes adaptées selon la variante (admin / secretaire)
 * - Filtre de période (Aujourd'hui / Cette semaine / Ce mois / Tous) basé sur la date d'émission
 * - Filtres facettés intégrés (statut de facture, candidat) via barre d’outils
 * - Recherche textuelle (numéro de facture, candidat)
 * - Pagination configurable ou limitation simple (`maxItems`)
 * - Bouton « Actualiser » et « Voir tout » optionnels
 * - Enrichissements pour afficher avatar du candidat, montant payé, etc.
 * - Badges récapitulatifs : nombre de factures, montant total impayé, factures en attente
 * - État de chargement (skeleton), état vide avec action
 * - Entièrement responsive via conteneur `@container`
 *
 * @see {@link getFacturesColumns} – Définition des colonnes
 * @see {@link FacturesTableActions} – Callbacks d’actions
 * @see {@link FacturesEnrichments} – Enrichissements (candidat, montant payé)
 *
 * @author Stive Junior
 * @version 2.0.0
 *
 * @example
 * ```tsx
 * // Dashboard admin
 * <FacturesTable
 *   factures={factures}
 *   variant="admin"
 *   enrichments={{
 *     getCandidatNomComplet: (f) => `${f.candidat?.prenom} ${f.candidat?.nom}`,
 *     getCandidatEmail: (f) => f.candidat?.email,
 *     getCandidatAvatarUrl: (f) => f.candidat?.avatarUrl,
 *     getMontantPaye: (f) => f.paiements?.reduce((sum, p) => sum + p.montant, 0) ?? 0,
 *   }}
 *   actions={{
 *     onView: (f) => navigate(`/factures/${f.id}`),
 *     onEdit: (f) => navigate(`/factures/${f.id}/edit`),
 *     onDownloadPDF: (f) => downloadPDF(f.pdfPath),
 *     onAddPayment: (f) => navigate(`/paiements/create?factureId=${f.id}`),
 *     onViewPayments: (f) => navigate(`/paiements?factureId=${f.id}`),
 *   }}
 *   showViewAll
 *   onViewAll={() => navigate('/factures')}
 *   enableToolbar
 *   defaultPeriodFilter="month"
 *   title="Facturation"
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
import { RefreshCw, ChevronRight, PlusCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';

import { DataTable } from '@/components/tables/data-table';
import {
    getAdminFacturesColumns,
    getSecretaireFacturesColumns,
} from '@/components/tables/factures/factures-columns';
import type {
    Facture,
    FacturesEnrichments,
    FacturesTableActions,
    FacturesColumnConfig,
    FacturesStatsExtended,
} from '@/types/factures.types';
import { STATUT_FACTURE_CONFIG } from '@/types/enums';
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

export type FacturesPeriodFilter = 'today' | 'week' | 'month' | 'all';

/**
 * @interface FacturesTableProps
 * @description Propriétés du composant `FacturesTable`.
 */
export interface FacturesTableProps {
    /** Liste des factures à afficher */
    factures: Facture[];

    /** Métriques statistiques des factures */
    stats?: FacturesStatsExtended;

    /** Variante d’affichage (influence les colonnes) */
    variant?: 'admin' | 'secretaire';

    /** Configuration fine des colonnes */
    columnConfig?: FacturesColumnConfig;

    /** Enrichissements optionnels (candidat, montant payé) */
    enrichments?: FacturesEnrichments;

    /** Callbacks d’actions sur les lignes */
    actions?: FacturesTableActions;

    /** Filtre de période par défaut (défaut: 'month') */
    defaultPeriodFilter?: FacturesPeriodFilter;

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

    /** Afficher le bouton « Ajouter une facture » */
    showAddButton?: boolean;

    /** Callback du bouton « Ajouter une facture » */
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
    value: FacturesPeriodFilter;
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
 * Filtre les factures selon la période d’émission.
 * @internal
 */
function filterByPeriod(
    factures: Facture[],
    period: FacturesPeriodFilter
): Facture[] {
    if (period === 'all') return factures;

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
            return factures;
    }

    return factures.filter((f) => {
        const date = new Date(f.dateEmission);
        return isWithinInterval(date, { start: from, end: to });
    });
}

/**
 * Calcule le nombre de factures en attente (EN_ATTENTE).
 * @internal
 */
function countEnAttente(factures: Facture[]): number {
    return factures.filter((f) => f.statut === 'EN_ATTENTE').length;
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
function getPeriodTitle(period: FacturesPeriodFilter, baseTitle: string): string {
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
 * Tableau des factures – version complète avec filtres, pagination, actions.
 */
export function FacturesTable({
    factures,
    stats,
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
    title = 'Factures',
    description,
    asCard = true,
    isLoading = false,
    onRefresh,
    emptyMessage = 'Aucune facture trouvée.',
    className,
}: FacturesTableProps): React.JSX.Element {
    const isMobile = useIsMobile();
    const [periodFilter, setPeriodFilter] = React.useState<FacturesPeriodFilter>(defaultPeriodFilter);
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
            triggerTransition(() => setPeriodFilter(value as FacturesPeriodFilter));
        },
        [periodFilter, triggerTransition]
    );

    // ── Données filtrées et affichées ─────────────────────────────────────
    const filteredFactures = React.useMemo(
        () => filterByPeriod(factures, periodFilter),
        [factures, periodFilter]
    );

    const displayData = React.useMemo(
        () => (enablePagination ? filteredFactures : filteredFactures.slice(0, maxItems)),
        [filteredFactures, enablePagination, maxItems]
    );

    // ── Statistiques rapides ──────────────────────────────────────────────
    const totalCount = filteredFactures.length;
    const enAttenteCount = React.useMemo(() => countEnAttente(filteredFactures), [filteredFactures]);
    const totalImpaye = stats?.montantImpaye || 0;

    // ── Colonnes ───────────────────────────────────────────────────────────
    const columns = React.useMemo(() => {
        if (variant === 'admin') {
            return getAdminFacturesColumns(actions, enrichments, columnConfig);
        }
        return getSecretaireFacturesColumns(actions, enrichments, columnConfig);
    }, [variant, actions, enrichments, columnConfig]);

    // ── Rafraîchissement ─────────────────────────────────────────────────
    const handleRefresh = React.useCallback(async () => {
        if (!onRefresh) return;
        setRefreshing(true);
        try {
            await onRefresh();
            toast.success('Factures actualisées');
        } catch {
            toast.error("Erreur lors de l'actualisation");
        } finally {
            setRefreshing(false);
        }
    }, [onRefresh]);

    // ── Options pour les filtres facettés (statuts) ───────────────────────
    const statutOptions = React.useMemo(() => {
        return Object.entries(STATUT_FACTURE_CONFIG).map(([value, cfg]) => ({
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
                    <Separator orientation="vertical" className="h-6 hidden @[480px]/fac:block" />
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
                    <FileText className="h-4.5 w-4.5" />
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
                                {totalCount} facture{totalCount > 1 ? 's' : ''}
                            </Badge>
                        )}
                        {enAttenteCount > 0 && (
                            <Badge
                                variant="outline"
                                className="text-[10px] h-4 px-1.5 border-0 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
                            >
                                {enAttenteCount} en attente
                            </Badge>
                        )}
                        {totalImpaye > 0 && (
                            <Badge
                                variant="outline"
                                className="text-[10px] h-4 px-1.5 border-0 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300"
                            >
                                {formatCurrency(totalImpaye)} impayé
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
                searchColumn="numero"
                searchPlaceholder="Rechercher par numéro ou candidat…"
                addButtonText="Nouvelle facture"
                onAddClick={onAddClick}
                onRowClick={(row) => actions.onView && actions.onView(row)}
                facetedFilters={
                    enableToolbar
                        ? [
                            {
                                columnId: 'statut',
                                title: 'Statut',
                                options: statutOptions,
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
            <Card className={cn('@container/fac overflow-hidden shadow-sm rounded-md', className)}>
                <CardHeader className="pb-3 border-b">{header}</CardHeader>
                <CardContent className="pt-4">{tableContent}</CardContent>
            </Card>
        );
    }

    return (
        <div className={cn('@container/fac w-full flex flex-col gap-4', className)}>
            {header}
            {tableContent}
        </div>
    );
}