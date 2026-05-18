// src/features/formations/components/FormationsTable.tsx

/**
 * @module features/formations/components/FormationsTable
 * @description
 * Tableau des formations (offres pédagogiques) – version complète avec filtres, pagination, actions et enrichissements.
 * Permet de gérer les formations proposées par l’auto‑école.
 *
 * ## Fonctionnalités
 * - Colonnes adaptées selon la variante (admin / secretaire)
 * - Filtres facettés intégrés (catégorie de permis, statut actif) via barre d’outils
 * - Recherche textuelle (nom, description)
 * - Pagination configurable ou limitation simple (`maxItems`)
 * - Bouton « Actualiser » et « Voir tout » optionnels
 * - Enrichissement pour formater les heures (code / conduite) personnalisable
 * - Badges récapitulatifs : total formations, actives, inactives
 * - État de chargement (skeleton), état vide avec action
 * - Entièrement responsive via conteneur `@container`
 *
 * @see {@link getFormationsColumns} – Définition des colonnes
 * @see {@link FormationsTableActions} – Callbacks d’actions
 * @see {@link FormationsEnrichments} – Enrichissements (formatage des heures)
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @example
 * ```tsx
 * // Dashboard admin
 * <FormationsTable
 *   formations={formations}
 *   variant="admin"
 *   enrichments={{
 *     getDureeFormatee: (f) => `${f.heuresCode}h code / ${f.heuresConduite}h conduite`,
 *   }}
 *   actions={{
 *     onView: (f) => navigate(`/formations/${f.id}`),
 *     onEdit: (f) => navigate(`/formations/${f.id}/edit`),
 *     onToggleActive: async (f) => updateFormation(f.id, { actif: !f.actif }),
 *     onViewTarifs: (f) => navigate(`/formations/${f.id}/tarifs`),
 *   }}
 *   showViewAll
 *   onViewAll={() => navigate('/formations')}
 *   enableToolbar
 *   title="Offres de formation"
 * />
 * ```
 */

import * as React from 'react';
import { RefreshCw, ChevronRight, GraduationCap, Download } from 'lucide-react';
import { toast } from 'sonner';

import { DataTable } from '@/components/tables/data-table';
import {
    getAdminFormationsColumns,
    getSecretaireFormationsColumns,
} from '@/components/tables/formations/formations-columns';
import type {
    Formation,
    FormationsEnrichments,
    FormationsTableActions,
    FormationsColumnConfig,
} from '@/types/formations.types';
import { CATEGORIE_PERMIS_CONFIG } from '@/types/enums';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @interface FormationsTableProps
 * @description Propriétés du composant `FormationsTable`.
 */
export interface FormationsTableProps {
    /** Liste des formations à afficher */
    formations: Formation[];

    /** Variante d’affichage (influence les colonnes) */
    variant?: 'admin' | 'secretaire';

    /** Configuration fine des colonnes */
    columnConfig?: FormationsColumnConfig;

    /** Enrichissements optionnels (formatage des heures) */
    enrichments?: FormationsEnrichments;

    /** Callbacks d’actions sur les lignes */
    actions?: FormationsTableActions;

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


    /** Callback du bouton « Ajouter une formation » */
    onAddClick?: () => void;

    /** Callback de l’action d’export */
    onExportClick?: () => void;

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
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcule le nombre de formations actives.
 * @internal
 */
function countActives(formations: Formation[]): number {
    return formations.filter((f) => f.actif).length;
}

/**
 * Calcule le nombre de formations inactives.
 * @internal
 */
function countInactives(formations: Formation[]): number {
    return formations.filter((f) => !f.actif).length;
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tableau des formations – version complète avec filtres, pagination, actions.
 */
export function FormationsTable({
    formations,
    variant = 'admin',
    columnConfig,
    enrichments = {},
    actions = {},
    maxItems = 5,
    enablePagination = false,
    defaultPageSize = 10,
    enableToolbar = false,
    showViewAll = false,
    onViewAll,
    onAddClick,
    onExportClick,
    title = 'Formations',
    description,
    asCard = true,
    isLoading = false,
    onRefresh,
    emptyMessage = 'Aucune formation trouvée.',
    className,
}: FormationsTableProps): React.JSX.Element {
    const [refreshing, setRefreshing] = React.useState(false);

    // ── Données affichées (pagination ou limitation) ───────────────────────
    const displayData = React.useMemo(
        () => (enablePagination ? formations : formations.slice(0, maxItems)),
        [formations, enablePagination, maxItems]
    );

    // ── Statistiques rapides ──────────────────────────────────────────────
    const totalCount = formations.length;
    const activesCount = React.useMemo(() => countActives(formations), [formations]);
    const inactivesCount = React.useMemo(() => countInactives(formations), [formations]);

    // ── Options pour les filtres facettés (catégories de permis) ───────────
    const categorieOptions = React.useMemo(() => {
        return Object.entries(CATEGORIE_PERMIS_CONFIG).map(([value, cfg]) => ({
            label: cfg.label,
            value,
            icon: cfg.icon,
        }));
    }, []);

    // ── Colonnes ───────────────────────────────────────────────────────────
    const columns = React.useMemo(() => {
        if (variant === 'admin') {
            return getAdminFormationsColumns(actions, enrichments, columnConfig);
        }
        return getSecretaireFormationsColumns(actions, columnConfig);
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

    // ── Actions en barre d’outils (optionnelle) ───────────────────────────
    const extraActions = (
        <div className="flex items-center gap-1.5 flex-wrap">
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
                            {title}
                        </h3>
                        {totalCount > 0 && (
                            <Badge
                                variant="outline"
                                className="text-[10px] h-4 px-1.5 border-0 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300"
                            >
                                {totalCount} formation{totalCount > 1 ? 's' : ''}
                            </Badge>
                        )}
                        {activesCount > 0 && (
                            <Badge
                                variant="outline"
                                className="text-[10px] h-4 px-1.5 border-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                            >
                                {activesCount} active{activesCount > 1 ? 's' : ''}
                            </Badge>
                        )}
                        {inactivesCount > 0 && (
                            <Badge
                                variant="outline"
                                className="text-[10px] h-4 px-1.5 border-0 bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            >
                                {inactivesCount} inactive{inactivesCount > 1 ? 's' : ''}
                            </Badge>
                        )}
                    </div>
                    {description && <p className="text-xs text-muted-foreground">{description}</p>}
                </div>
            </div>
            <div className="flex items-center gap-1">

                <Button variant="outline" size="sm" onClick={onExportClick} className="h-8 gap-1 text-xs">
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
                searchColumn="nom"
                searchPlaceholder="Rechercher par nom ou description…"
                addButtonText="Nouvelle formation"
                onAddClick={onAddClick}
                onRowClick={(row) => actions.onView && actions.onView(row)}
                facetedFilters={
                    enableToolbar
                        ? [
                            {
                                columnId: 'categorie',
                                title: 'Catégorie de permis',
                                options: categorieOptions,
                            },
                            {
                                columnId: 'actif',
                                title: 'Statut',
                                options: [
                                    { label: 'Actif', value: 'true' },
                                    { label: 'Inactif', value: 'false' },
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
            <Card className={cn('@container/for overflow-hidden shadow-sm rounded-md', className)}>
                <CardHeader className="pb-3 border-b">{header}</CardHeader>
                <CardContent className="pt-4">{tableContent}</CardContent>
            </Card>
        );
    }

    return (
        <div className={cn('@container/for w-full flex flex-col gap-4', className)}>
            {header}
            {tableContent}
        </div>
    );
}