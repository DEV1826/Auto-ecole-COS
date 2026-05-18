// src/features/examens/components/ExamensTable.tsx

/**
 * @module features/examens/components/ExamensTable
 * @description
 * Tableau des examens (code ou conduite) – version complète avec filtres, pagination, actions et enrichissements.
 * Permet de visualiser, filtrer et gérer les examens passés par les candidats.
 *
 * ## Fonctionnalités
 * - Colonnes adaptées selon la variante (admin / secretaire / moniteur)
 * - Filtre de période (Aujourd'hui / Cette semaine / Ce mois / Tous) basé sur la date d’examen
 * - Filtres facettés intégrés (type d’examen, résultat) via barre d’outils
 * - Recherche textuelle (candidat, centre)
 * - Pagination configurable ou limitation simple (`maxItems`)
 * - Bouton « Actualiser » et « Voir tout » optionnels
 * - Enrichissements pour afficher avatar, coordonnées du candidat
 * - Badges récapitulatifs : nombre total d’examens, réussites, échecs, en attente
 * - État de chargement (skeleton), état vide avec action
 * - Entièrement responsive via conteneur `@container`
 *
 * @see {@link getExamensColumns} – Définition des colonnes
 * @see {@link ExamensTableActions} – Callbacks d’actions
 * @see {@link ExamensEnrichments} – Enrichissements (candidat)
 *
 * @author Stive Junior
 * @version 2.0.0
 *
 * @example
 * ```tsx
 * // Dashboard admin
 * <ExamensTable
 *   examens={examens}
 *   variant="admin"
 *   enrichments={{
 *     getCandidatNomComplet: (e) => `${e.candidat?.prenom} ${e.candidat?.nom}`,
 *     getCandidatEmail: (e) => e.candidat?.email,
 *     getCandidatAvatarUrl: (e) => e.candidat?.avatarUrl,
 *   }}
 *   actions={{
 *     onView: (e) => navigate(`/examens/${e.id}`),
 *     onEdit: (e) => navigate(`/examens/${e.id}/edit`),
 *     onPrintCertificate: (e) => printCertificat(e),
 *   }}
 *   showViewAll
 *   onViewAll={() => navigate('/examens')}
 *   enableToolbar
 *   defaultPeriodFilter="month"
 *   title="Suivi des examens"
 * />
 *
 * // Dashboard moniteur (vue restreinte)
 * <ExamensTable
 *   examens={myExamens}
 *   variant="moniteur"
 *   enrichments={{ getCandidatNomComplet: (e) => `${e.candidat?.prenom} ${e.candidat?.nom}` }}
 *   actions={{ onView: (e) => navigate(`/examens/${e.id}`) }}
 *   maxItems={5}
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
import { RefreshCw, ChevronRight, PlusCircle, GraduationCap, Download } from 'lucide-react';
import { toast } from 'sonner';

import { DataTable } from '@/components/tables/data-table';
import {
    getExamensColumns,
    getAdminExamensColumns,
    getSecretaireExamensColumns,
    getMoniteurExamensColumns,
} from '@/components/tables/examens/examens-columns';
import type {
    Examen,
    ExamensEnrichments,
    ExamensTableActions,
    ExamensColumnConfig,
} from '@/types/examens.types';
import { TYPE_EXAMEN_CONFIG, RESULTAT_EXAMEN_CONFIG } from '@/types/enums';
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

export type ExamensPeriodFilter = 'today' | 'week' | 'month' | 'all';

/**
 * @interface ExamensTableProps
 * @description Propriétés du composant `ExamensTable`.
 */
export interface ExamensTableProps {
    /** Liste des examens à afficher */
    examens: Examen[];

    /** Variante d’affichage (influence les colonnes) */
    variant?: 'admin' | 'secretaire' | 'moniteur';

    /** Configuration fine des colonnes */
    columnConfig?: ExamensColumnConfig;

    /** Enrichissements optionnels (candidat) */
    enrichments?: ExamensEnrichments;

    /** Callbacks d’actions sur les lignes */
    actions?: ExamensTableActions;

    /** Filtre de période par défaut (défaut: 'month') */
    defaultPeriodFilter?: ExamensPeriodFilter;

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

    /** Afficher le bouton « Ajouter un examen » */
    showAddButton?: boolean;

    /** Callback du bouton « Ajouter un examen » */
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
    value: ExamensPeriodFilter;
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
 * Filtre les examens selon la période.
 * @internal
 */
function filterByPeriod(
    examens: Examen[],
    period: ExamensPeriodFilter
): Examen[] {
    if (period === 'all') return examens;

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
            return examens;
    }

    return examens.filter((e) => {
        const date = new Date(e.date);
        return isWithinInterval(date, { start: from, end: to });
    });
}

/**
 * Calcule le nombre d’examens réussis (RECU).
 * @internal
 */
function countReussis(examens: Examen[]): number {
    return examens.filter((e) => e.resultat === 'RECU').length;
}

/**
 * Calcule le nombre d’échecs (AJOURNE).
 * @internal
 */
function countEchecs(examens: Examen[]): number {
    return examens.filter((e) => e.resultat === 'AJOURNE').length;
}

/**
 * Calcule le nombre d’examens en attente (EN_ATTENTE).
 * @internal
 */
function countEnAttente(examens: Examen[]): number {
    return examens.filter((e) => e.resultat === 'EN_ATTENTE').length;
}

/**
 * Titre dynamique selon la période.
 * @internal
 */
function getPeriodTitle(period: ExamensPeriodFilter, baseTitle: string): string {
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
 * Tableau des examens – version complète avec filtres, pagination, actions.
 */
export function ExamensTable({
    examens,
    variant = 'admin',
    columnConfig,
    enrichments = {},
    actions = {},
    defaultPeriodFilter = 'all',
    showPeriodFilter = true,
    maxItems = 5,
    enablePagination = false,
    defaultPageSize = 10,
    enableToolbar = false,
    showViewAll = false,
    onViewAll,
    showAddButton = false,
    onAddClick,
    onExport,
    title = 'Examens',
    description,
    asCard = true,
    isLoading = false,
    onRefresh,
    emptyMessage = 'Aucun examen trouvé.',
    className,
}: ExamensTableProps): React.JSX.Element {
    const isMobile = useIsMobile();
    const [periodFilter, setPeriodFilter] = React.useState<ExamensPeriodFilter>(defaultPeriodFilter);
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
            triggerTransition(() => setPeriodFilter(value as ExamensPeriodFilter));
        },
        [periodFilter, triggerTransition]
    );

    // ── Données filtrées et affichées ─────────────────────────────────────
    const filteredExamens = React.useMemo(
        () => filterByPeriod(examens, periodFilter),
        [examens, periodFilter]
    );

    const displayData = React.useMemo(
        () => (enablePagination ? filteredExamens : filteredExamens.slice(0, maxItems)),
        [filteredExamens, enablePagination, maxItems]
    );

    // ── Statistiques rapides ──────────────────────────────────────────────
    const totalCount = filteredExamens.length;
    const reussisCount = React.useMemo(() => countReussis(filteredExamens), [filteredExamens]);
    const echecsCount = React.useMemo(() => countEchecs(filteredExamens), [filteredExamens]);
    const enAttenteCount = React.useMemo(() => countEnAttente(filteredExamens), [filteredExamens]);

    // ── Colonnes ───────────────────────────────────────────────────────────
    const columns = React.useMemo(() => {
        switch (variant) {
            case 'admin':
                return getAdminExamensColumns(actions, enrichments, columnConfig);
            case 'secretaire':
                return getSecretaireExamensColumns(actions, enrichments, columnConfig);
            case 'moniteur':
                return getMoniteurExamensColumns(actions, enrichments, columnConfig);
            default:
                return getExamensColumns({ variant: 'admin', actions, enrichments, columnConfig });
        }
    }, [variant, actions, enrichments, columnConfig]);

    // ── Rafraîchissement ─────────────────────────────────────────────────
    const handleRefresh = React.useCallback(async () => {
        if (!onRefresh) return;
        setRefreshing(true);
        try {
            await onRefresh();
            toast.success('Examens actualisés');
        } catch {
            toast.error("Erreur lors de l'actualisation");
        } finally {
            setRefreshing(false);
        }
    }, [onRefresh]);

    // ── Options pour les filtres facettés (type et résultat) ──────────────
    const typeOptions = React.useMemo(() => {
        return Object.entries(TYPE_EXAMEN_CONFIG).map(([value, cfg]) => ({
            label: cfg.label,
            value,
            icon: cfg.icon,
        }));
    }, []);

    const resultatOptions = React.useMemo(() => {
        return Object.entries(RESULTAT_EXAMEN_CONFIG).map(([value, cfg]) => ({
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
                    <Separator orientation="vertical" className="h-6 hidden @[480px]/exa:block" />
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
                <div className="flex items-center justify-center h-9 w-9 rounded-md bg-indigo-700 text-white shrink-0">
                    <GraduationCap className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={cn('font-semibold leading-tight', asCard ? 'text-base' : 'text-lg')}>
                            {getPeriodTitle(periodFilter, title)}
                        </h3>
                        {totalCount > 0 && (
                            <Badge
                                variant="outline"
                                className="text-[10px] h-4 px-1.5 border-0 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300"
                            >
                                {totalCount} examen{totalCount > 1 ? 's' : ''}
                            </Badge>
                        )}
                        {reussisCount > 0 && (
                            <Badge
                                variant="outline"
                                className="text-[10px] h-4 px-1.5 border-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                            >
                                {reussisCount} réussi{reussisCount > 1 ? 's' : ''}
                            </Badge>
                        )}
                        {echecsCount > 0 && (
                            <Badge
                                variant="outline"
                                className="text-[10px] h-4 px-1.5 border-0 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300"
                            >
                                {echecsCount} échec{echecsCount > 1 ? 's' : ''}
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
                    </div>
                    {description && <p className="text-xs text-muted-foreground">{description}</p>}
                </div>
            </div>
            <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={onExport} className="h-8 gap-1 text-xs">
                    <Download className="h-3.5 w-3.5" />
                    Exporter
                </Button>

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
                addButtonText="Nouvel examen"
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
                            {
                                columnId: 'resultat',
                                title: 'Résultat',
                                options: resultatOptions,
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
            <Card className={cn('@container/exa overflow-hidden shadow-sm rounded-md', className)}>
                <CardHeader className="pb-3 border-b">{header}</CardHeader>
                <CardContent className="pt-4">{tableContent}</CardContent>
            </Card>
        );
    }

    return (
        <div className={cn('@container/exa w-full flex flex-col gap-4', className)}>
            {header}
            {tableContent}
        </div>
    );
}