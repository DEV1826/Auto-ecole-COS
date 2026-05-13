// src/features/admin/components/AuditLogsTable.tsx

/**
 * @module features/admin/components/AuditLogsTable
 * @description
 * Tableau des logs d’audit – version complète avec filtres, pagination, actions et enrichissements.
 * Permet de consulter l’historique des actions sensibles du système.
 *
 * ## Fonctionnalités
 * - Colonnes adaptées selon la variante (admin / auditor)
 * - Filtres facettés intégrés (action, statut, ressource) via barre d’outils
 * - Filtre de période (Aujourd'hui / Cette semaine / Ce mois / Tous)
 * - Recherche textuelle (description, action)
 * - Pagination configurable ou limitation simple (`maxItems`)
 * - Bouton « Actualiser » et « Voir tout » optionnels
 * - Enrichissements pour afficher avatar, nom complet, email de l’utilisateur
 * - Badges récapitulatifs : total logs, succès, échecs
 * - État de chargement (skeleton), état vide avec action
 * - Entièrement responsive via conteneur `@container`
 *
 * @see {@link getAuditLogsColumns} – Définition des colonnes
 * @see {@link AuditLogsTableActions} – Callbacks d’actions
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @example
 * ```tsx
 * <AuditLogsTable
 *   logs={auditLogs}
 *   variant="admin"
 *   enrichments={{
 *     getNomComplet: (log) => log.utilisateur ? `${log.utilisateur.prenom} ${log.utilisateur.nom}` : 'Anonyme',
 *     getEmail: (log) => log.utilisateur?.email,
 *     getAvatarUrl: (log) => `/api/avatar/${log.utilisateurId}`,
 *   }}
 *   actions={{
 *     onViewDetails: (log) => openModal(log),
 *     onFilterByUser: (userId) => setFilterUser(userId),
 *   }}
 *   showViewAll
 *   onViewAll={() => navigate('/admin/audit-logs')}
 *   enableToolbar
 *   defaultPeriodFilter="month"
 *   title="Journal d’audit"
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
import { RefreshCw, ChevronRight, FileText } from 'lucide-react';
import { toast } from 'sonner';

import { DataTable } from '@/components/tables/data-table';
import {
    getAdminAuditLogsColumns,
    getAuditorAuditLogsColumns,
} from '@/components/tables/audit-logs';
import type {
    AuditLog,
    AuditLogsTableActions,
    AuditLogsColumnConfig,
    AuditLogsEnrichments,
} from '@/types/admin.types';
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

export type AuditLogsPeriodFilter = 'today' | 'week' | 'month' | 'all';

/**
 * @interface AuditLogsTableProps
 * @description Propriétés du composant `AuditLogsTable`.
 */
export interface AuditLogsTableProps {
    /** Liste des logs d’audit à afficher */
    logs: AuditLog[];

    /** Variante d’affichage (influence les colonnes) */
    variant?: 'admin' | 'auditor';

    /** Configuration fine des colonnes */
    columnConfig?: AuditLogsColumnConfig;

    /** Enrichissements optionnels (utilisateur) */
    enrichments?: AuditLogsEnrichments;

    /** Callbacks d’actions sur les lignes */
    actions?: AuditLogsTableActions;

    /** Filtre de période par défaut (défaut: 'month') */
    defaultPeriodFilter?: AuditLogsPeriodFilter;

    /** Afficher le sélecteur de période (défaut: true) */
    showPeriodFilter?: boolean;

    /** Nombre maximal d’éléments sans pagination (défaut: 10) */
    maxItems?: number;

    /** Activer la pagination (défaut: true, car logs volumineux) */
    enablePagination?: boolean;

    /** Taille de page par défaut si pagination activée (défaut: 20) */
    defaultPageSize?: number;

    /** Activer la barre d’outils (recherche + filtres facettés) (défaut: true) */
    enableToolbar?: boolean;

    /** Afficher le bouton « Voir tout » */
    showViewAll?: boolean;

    /** Callback du bouton « Voir tout » */
    onViewAll?: () => void;

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
    value: AuditLogsPeriodFilter;
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
 * Filtre les logs selon la période.
 * @internal
 */
function filterByPeriod(
    logs: AuditLog[],
    period: AuditLogsPeriodFilter
): AuditLog[] {
    if (period === 'all') return logs;

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
            return logs;
    }

    return logs.filter((log) => {
        const date = new Date(log.createdAt);
        return isWithinInterval(date, { start: from, end: to });
    });
}

/**
 * Compte les logs en succès.
 * @internal
 */
function countSuccess(logs: AuditLog[]): number {
    return logs.filter((log) => log.statut === 'SUCCESS').length;
}

/**
 * Compte les logs en échec.
 * @internal
 */
function countFailed(logs: AuditLog[]): number {
    return logs.filter((log) => log.statut === 'FAILED').length;
}

/**
 * Extrait la liste unique des actions pour le filtre facetté.
 * @internal
 */
function getUniqueActions(logs: AuditLog[]): string[] {
    const actions = new Set<string>();
    logs.forEach((log) => actions.add(log.action));
    return Array.from(actions).sort();
}

/**
 * Extrait la liste unique des ressources pour le filtre facetté.
 * @internal
 */
function getUniqueRessources(logs: AuditLog[]): string[] {
    const ressources = new Set<string>();
    logs.forEach((log) => {
        if (log.ressource) ressources.add(log.ressource);
    });
    return Array.from(ressources).sort();
}

/**
 * Titre dynamique selon la période.
 * @internal
 */
function getPeriodTitle(period: AuditLogsPeriodFilter, baseTitle: string): string {
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
 * Tableau des logs d’audit – version complète avec filtres, pagination, actions.
 */
export function AuditLogsTable({
    logs,
    variant = 'admin',
    columnConfig,
    enrichments = {},
    actions = {},
    defaultPeriodFilter = 'month',
    showPeriodFilter = true,
    maxItems = 10,
    enablePagination = true,
    defaultPageSize = 20,
    enableToolbar = true,
    showViewAll = false,
    onViewAll,
    title = "Journal d'audit",
    description,
    asCard = true,
    isLoading = false,
    onRefresh,
    emptyMessage = 'Aucun log trouvé.',
    className,
}: AuditLogsTableProps): React.JSX.Element {
    const isMobile = useIsMobile();
    const [periodFilter, setPeriodFilter] = React.useState<AuditLogsPeriodFilter>(defaultPeriodFilter);
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
            triggerTransition(() => setPeriodFilter(value as AuditLogsPeriodFilter));
        },
        [periodFilter, triggerTransition]
    );

    // ── Données filtrées et affichées ─────────────────────────────────────
    const filteredLogs = React.useMemo(
        () => filterByPeriod(logs, periodFilter),
        [logs, periodFilter]
    );

    const displayData = React.useMemo(
        () => (enablePagination ? filteredLogs : filteredLogs.slice(0, maxItems)),
        [filteredLogs, enablePagination, maxItems]
    );

    // ── Statistiques rapides ──────────────────────────────────────────────
    const totalCount = filteredLogs.length;
    const successCount = React.useMemo(() => countSuccess(filteredLogs), [filteredLogs]);
    const failedCount = React.useMemo(() => countFailed(filteredLogs), [filteredLogs]);

    // ── Options pour les filtres facettés ─────────────────────────────────
    const actionOptions = React.useMemo(() => {
        const actionsList = getUniqueActions(logs);
        return actionsList.map((a) => ({ label: a, value: a }));
    }, [logs]);

    const ressourceOptions = React.useMemo(() => {
        const ressources = getUniqueRessources(logs);
        return ressources.map((r) => ({ label: r, value: r }));
    }, [logs]);

    // ── Colonnes ───────────────────────────────────────────────────────────
    const columns = React.useMemo(() => {
        if (variant === 'admin') {
            return getAdminAuditLogsColumns(actions, enrichments, columnConfig);
        }
        return getAuditorAuditLogsColumns(actions, enrichments, columnConfig);
    }, [variant, actions, enrichments, columnConfig]);

    // ── Rafraîchissement ─────────────────────────────────────────────────
    const handleRefresh = React.useCallback(async () => {
        if (!onRefresh) return;
        setRefreshing(true);
        try {
            await onRefresh();
            toast.success('Logs actualisés');
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
                    <Separator orientation="vertical" className="h-6 hidden @[480px]/audit:block" />
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
                <div className="flex items-center justify-center h-9 w-9 rounded-md bg-slate-700 text-white shrink-0">
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
                                className="text-[10px] h-4 px-1.5 border-0 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            >
                                {totalCount} événement{totalCount > 1 ? 's' : ''}
                            </Badge>
                        )}
                        {successCount > 0 && (
                            <Badge
                                variant="outline"
                                className="text-[10px] h-4 px-1.5 border-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                            >
                                {successCount} succès
                            </Badge>
                        )}
                        {failedCount > 0 && (
                            <Badge
                                variant="outline"
                                className="text-[10px] h-4 px-1.5 border-0 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300"
                            >
                                {failedCount} échec{failedCount > 1 ? 's' : ''}
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
                pageSizeOptions={[10, 20, 50, 100]}
                searchColumn="action"
                searchPlaceholder="Rechercher par action, ressource ou description…"
                facetedFilters={
                    enableToolbar
                        ? [
                            {
                                columnId: 'action',
                                title: 'Action',
                                options: actionOptions,
                            },
                            {
                                columnId: 'ressource',
                                title: 'Ressource',
                                options: ressourceOptions,
                            },
                            {
                                columnId: 'statut',
                                title: 'Statut',
                                options: [
                                    { label: 'Succès', value: 'SUCCESS' },
                                    { label: 'Échec', value: 'FAILED' },
                                ],
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
            <Card className={cn('@container/audit overflow-hidden shadow-sm rounded-md', className)}>
                <CardHeader className="pb-3 border-b">{header}</CardHeader>
                <CardContent className="pt-4">{tableContent}</CardContent>
            </Card>
        );
    }

    return (
        <div className={cn('@container/audit w-full flex flex-col gap-4', className)}>
            {header}
            {tableContent}
        </div>
    );
}



