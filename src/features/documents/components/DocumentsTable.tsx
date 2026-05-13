// src/features/documents/components/DocumentsTable.tsx

/**
 * @module features/documents/components/DocumentsTable
 * @description
 * Tableau des documents – version complète avec filtres, pagination, actions et enrichissements.
 * Permet de visualiser, filtrer et gérer les documents (permis, cartes d'identité, factures, reçus)
 * associés aux candidats.
 *
 * ## Fonctionnalités
 * - Colonnes adaptées selon la variante (admin / secretaire / candidat)
 * - Filtre de période (Aujourd'hui / Cette semaine / Ce mois / Tous) basé sur la date de téléversement
 * - Filtres facettés intégrés (type de document) via barre d’outils
 * - Recherche textuelle (nom du fichier, candidat)
 * - Pagination configurable ou limitation simple (`maxItems`)
 * - Bouton « Actualiser » et « Voir tout » optionnels
 * - Enrichissements pour afficher avatar, coordonnées du candidat
 * - Badges récapitulatifs : nombre total de documents, taille totale
 * - État de chargement (skeleton), état vide avec action
 * - Entièrement responsive via conteneur `@container`
 *
 * @see {@link getDocumentsColumns} – Définition des colonnes
 * @see {@link DocumentsTableActions} – Callbacks d’actions (télécharger, supprimer, aperçu, imprimer)
 * @see {@link DocumentsEnrichments} – Enrichissements (candidat)
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @example
 * ```tsx
 * <DocumentsTable
 *   documents={documents}
 *   variant="admin"
 *   enrichments={{
 *     getCandidatNomComplet: (doc) => `${doc.candidat?.prenom} ${doc.candidat?.nom}`,
 *     getCandidatEmail: (doc) => doc.candidat?.email,
 *     getCandidatAvatarUrl: (doc) => doc.candidat?.avatarUrl,
 *     getCandidatInitials: (doc) => `${doc.candidat?.prenom?.[0]}${doc.candidat?.nom?.[0]}`,
 *   }}
 *   actions={{
 *     onView: (doc) => window.open(doc.chemin),
 *     onDownload: (doc) => downloadFile(doc.chemin),
 *     onDelete: async (doc) => deleteDocument(doc.id),
 *     onPrint: (doc) => printDocument(doc),
 *   }}
 *   showViewAll
 *   onViewAll={() => navigate('/documents')}
 *   enableToolbar
 *   defaultPeriodFilter="month"
 *   title="Gestion documentaire"
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
    getDocumentsColumns,
    getAdminDocumentsColumns,
    getSecretaireDocumentsColumns,
    getCandidatDocumentsColumns,
} from '@/components/tables/documents/documents-columns';
import type {
    Document,
    DocumentsEnrichments,
    DocumentsTableActions,
    DocumentsColumnConfig,
} from '@/types/documents.types';
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

export type DocumentsPeriodFilter = 'today' | 'week' | 'month' | 'all';

/**
 * @interface DocumentsTableProps
 * @description Propriétés du composant `DocumentsTable`.
 */
export interface DocumentsTableProps {
    /** Liste des documents à afficher */
    documents: Document[];

    /** Variante d’affichage (influence les colonnes) */
    variant?: 'admin' | 'secretaire' | 'candidat';

    /** Configuration fine des colonnes */
    columnConfig?: DocumentsColumnConfig;

    /** Enrichissements optionnels (candidat) */
    enrichments?: DocumentsEnrichments;

    /** Callbacks d’actions sur les lignes */
    actions?: DocumentsTableActions;

    /** Filtre de période par défaut (défaut: 'month') */
    defaultPeriodFilter?: DocumentsPeriodFilter;

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

    /** Afficher le bouton « Ajouter un document » */
    showAddButton?: boolean;

    /** Callback du bouton « Ajouter un document » */
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
    value: DocumentsPeriodFilter;
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
 * Filtre les documents selon la période de téléversement.
 * @internal
 */
function filterByPeriod(
    documents: Document[],
    period: DocumentsPeriodFilter
): Document[] {
    if (period === 'all') return documents;

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
            return documents;
    }

    return documents.filter((doc) => {
        const date = new Date(doc.uploadedAt);
        return isWithinInterval(date, { start: from, end: to });
    });
}

/**
 * Calcule la taille totale des documents (en octets).
 * @internal
 */
function totalTailleBytes(documents: Document[]): number {
    return documents.reduce((acc, doc) => acc + (doc.taille ?? 0), 0);
}

/**
 * Formate la taille en octets de façon lisible.
 * @internal
 */
function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 o';
    if (bytes >= 1_000_000) return (bytes / 1_000_000).toFixed(1) + ' Mo';
    if (bytes >= 1_000) return (bytes / 1_000).toFixed(1) + ' Ko';
    return bytes + ' o';
}

/**
 * Titre dynamique selon la période.
 * @internal
 */
function getPeriodTitle(period: DocumentsPeriodFilter, baseTitle: string): string {
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

/**
 * Extrait les types de documents uniques pour le filtre facetté.
 * @internal
 */
function getUniqueDocumentTypes(documents: Document[]): string[] {
    const types = new Set<string>();
    documents.forEach((doc) => types.add(doc.type));
    return Array.from(types).sort();
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tableau des documents – version complète avec filtres, pagination, actions.
 */
export function DocumentsTable({
    documents,
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
    title = 'Documents',
    description,
    asCard = true,
    isLoading = false,
    onRefresh,
    emptyMessage = 'Aucun document trouvé.',
    className,
}: DocumentsTableProps): React.JSX.Element {
    const isMobile = useIsMobile();
    const [periodFilter, setPeriodFilter] = React.useState<DocumentsPeriodFilter>(defaultPeriodFilter);
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
            triggerTransition(() => setPeriodFilter(value as DocumentsPeriodFilter));
        },
        [periodFilter, triggerTransition]
    );

    // ── Données filtrées et affichées ─────────────────────────────────────
    const filteredDocuments = React.useMemo(
        () => filterByPeriod(documents, periodFilter),
        [documents, periodFilter]
    );

    const displayData = React.useMemo(
        () => (enablePagination ? filteredDocuments : filteredDocuments.slice(0, maxItems)),
        [filteredDocuments, enablePagination, maxItems]
    );

    // ── Statistiques rapides ──────────────────────────────────────────────
    const totalCount = filteredDocuments.length;
    const totalTaille = React.useMemo(() => totalTailleBytes(filteredDocuments), [filteredDocuments]);

    // ── Options pour les filtres facettés (types de documents) ────────────
    const typeOptions = React.useMemo(() => {
        const types = getUniqueDocumentTypes(documents);
        return types.map((t) => ({ label: t, value: t }));
    }, [documents]);

    // ── Colonnes ───────────────────────────────────────────────────────────
    const columns = React.useMemo(() => {
        switch (variant) {
            case 'admin':
                return getAdminDocumentsColumns(actions, enrichments, columnConfig);
            case 'secretaire':
                return getSecretaireDocumentsColumns(actions, enrichments, columnConfig);
            case 'candidat':
                return getCandidatDocumentsColumns(actions, columnConfig);
            default:
                return getDocumentsColumns({ variant: 'admin', actions, enrichments, columnConfig });
        }
    }, [variant, actions, enrichments, columnConfig]);

    // ── Rafraîchissement ─────────────────────────────────────────────────
    const handleRefresh = React.useCallback(async () => {
        if (!onRefresh) return;
        setRefreshing(true);
        try {
            await onRefresh();
            toast.success('Documents actualisés');
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
                    <Separator orientation="vertical" className="h-6 hidden @[480px]/doc:block" />
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
                                {totalCount} document{totalCount > 1 ? 's' : ''}
                            </Badge>
                        )}
                        {totalTaille > 0 && (
                            <Badge
                                variant="outline"
                                className="text-[10px] h-4 px-1.5 border-0 bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            >
                                {formatBytes(totalTaille)}
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
                searchColumn="nomFichier"
                searchPlaceholder="Rechercher par nom de fichier…"
                addButtonText="Nouveau document"
                onAddClick={onAddClick}
                onRowClick={(row) => actions.onView && actions.onView(row)}
                facetedFilters={
                    enableToolbar
                        ? [
                            {
                                columnId: 'type',
                                title: 'Type de document',
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
            <Card className={cn('@container/doc overflow-hidden shadow-sm rounded-md', className)}>
                <CardHeader className="pb-3 border-b">{header}</CardHeader>
                <CardContent className="pt-4">{tableContent}</CardContent>
            </Card>
        );
    }

    return (
        <div className={cn('@container/doc w-full flex flex-col gap-4', className)}>
            {header}
            {tableContent}
        </div>
    );
}