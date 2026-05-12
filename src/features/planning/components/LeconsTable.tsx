// src/features/planning/components/LeconsTable.tsx

/**
 * @module features/planning/components/LeconsTable
 * @description
 * Tableau des leçons (planning) – version optimisée pour les dashboards (admin, secrétaire, moniteur).
 *
 * ## Caractéristiques
 * - Colonnes adaptées : date, candidat (avatar + nom), moniteur, type, statut, véhicule, durée, actions
 * - Pas de barre d’outils (recherche/filtres) par défaut, mais peut être activée via `enableToolbar`
 * - Pagination active (configurable) avec contrôle de taille
 * - Wrapper `Card` optionnel (`asCard`)
 * - État de chargement (skeleton personnalisé) et état vide avec action de rafraîchissement
 * - Bouton « Rafraîchir » et « Voir tout » optionnels
 * - Utilise les colonnes `getLeconsColumns` avec pré‑set selon le rôle
 * - Actions de ligne configurables : voir, modifier, annuler, marquer effectué, signaler absence
 *
 * @see {@link getLeconsColumns} – Définition des colonnes
 * @see {@link LeconsTableActions} – Callbacks d’actions
 * @see {@link LeconsEnrichments} – Données calculées (candidat, moniteur, véhicule)
 *
 * @example
 * ```tsx
 * // Dashboard admin
 * <LeconsTable
 *   lecons={lecons}
 *   isLoading={loading}
 *   onRefresh={refetchLecons}
 *   onView={(l) => navigate(`/planning/${l.id}`)}
 *   onEdit={(l) => navigate(`/planning/${l.id}/edit`)}
 *   onCancel={async (l) => updateLecon(l.id, { statut: 'ANNULEE' })}
 *   onMarkDone={async (l) => updateLecon(l.id, { statut: 'EFFECTUEE' })}
 *   title="Leçons à venir"
 *   showViewAll
 *   onViewAll={() => navigate('/planning')}
 *   variant="admin"
 * />
 *
 * // Dashboard moniteur (avec colonnes adaptées)
 * <LeconsTable
 *   lecons={lecons}
 *   variant="moniteur"
 *   enrichments={{ getCandidatNomComplet: (l) => `${l.candidat?.prenom} ${l.candidat?.nom}` }}
 *   actions={{ onMarkDone: (l) => updateLecon(l.id, { statut: 'EFFECTUEE' }), onReportAbsence: ... }}
 *   title="Mes leçons"
 *   maxItems={5}
 * />
 * ```
 *
 * @author Stive Junior
 * @version 1.0.0
 */

import * as React from 'react';
import { Calendar, RefreshCw, ChevronRight, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';

import { DataTable } from '@/components/tables/data-table';
import {
    getLeconsColumns,
    getAdminLeconsColumns,
    getSecretaireLeconsColumns,
    getMoniteurLeconsColumns,
} from '@/components/tables/planning/lecons-columns';
import type {
    LeconsTableActions,
    LeconsColumnConfig,
    LeconsEnrichments,
} from '@/types/planning.types';
import type { Lecon } from '@/types/planning.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @interface LeconsTableProps
 * @description Propriétés du composant `LeconsTable`.
 */
export interface LeconsTableProps {
    /** Liste des leçons à afficher */
    lecons: Lecon[];

    /** État de chargement principal (affiche skeleton) */
    isLoading?: boolean;

    /** Callback de rafraîchissement des données (affiche un bouton rafraîchir) */
    onRefresh?: () => Promise<void>;

    /** Callbacks pour les actions de ligne (voir, modifier, annuler, marquer effectué, absence) */
    actions?: LeconsTableActions;

    /** Enrichissements optionnels (candidat, moniteur, véhicule) */
    enrichments?: LeconsEnrichments;

    /** Nombre maximal d’éléments affichés sans pagination (défaut: 5) */
    maxItems?: number;

    /** Activer la pagination complète (défaut: false) */
    enablePagination?: boolean;

    /** Taille de page par défaut (si pagination activée, défaut: 10) */
    defaultPageSize?: number;

    /** Options de taille de page disponibles */
    pageSizeOptions?: number[];

    /** Activer la barre d’outils (recherche/filtres) – défaut: false */
    enableToolbar?: boolean;

    /** Encapsuler dans une `Card` (défaut: true) */
    asCard?: boolean;

    /** Titre affiché dans l’en-tête */
    title?: string;

    /** Description sous le titre */
    description?: string;

    /** Afficher le bouton « Voir tout » */
    showViewAll?: boolean;

    /** Callback du bouton « Voir tout » */
    onViewAll?: () => void;

    /** Afficher le bouton « Ajouter leçon » */
    showAddButton?: boolean;

    /** Callback du bouton « Ajouter leçon » */
    onAddClick?: () => void;

    /** Variante d’affichage (influence les colonnes visibles) */
    variant?: 'admin' | 'secretaire' | 'moniteur';

    /** Configuration fine des colonnes (surcharge les valeurs par défaut) */
    columnConfig?: LeconsColumnConfig;

    /** Classes CSS additionnelles sur le conteneur racine */
    className?: string;

    /** Message personnalisé lorsque la liste est vide */
    emptyMessage?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers internes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcule le nombre de leçons planifiées (statut PLANIFIEE) pour le badge.
 * @internal
 */
function countPlanifiees(lecons: Lecon[]): number {
    return lecons.filter((l) => l.statut === 'PLANIFIEE').length;
}

/**
 * Calcule le nombre de leçons effectuées ce mois (statut EFFECTUEE et date >= début mois).
 * @internal
 */
function countEffectueesCeMois(lecons: Lecon[]): number {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return lecons.filter(
        (l) => l.statut === 'EFFECTUEE' && new Date(l.date) >= startOfMonth
    ).length;
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tableau des leçons (planning) pour les dashboards admin/secrétaire/moniteur.
 *
 * Affiche les colonnes essentielles, avec la possibilité de paginer, de rafraîchir,
 * de voir tout, et d’ajouter une leçon. Les colonnes s’adaptent au rôle.
 */
export function LeconsTable({
    lecons,
    isLoading = false,
    onRefresh,
    actions = {},
    enrichments = {},
    maxItems = 5,
    enablePagination = false,
    defaultPageSize = 10,
    pageSizeOptions = [5, 10, 20, 50],
    enableToolbar = false,
    asCard = true,
    title = 'Leçons récentes',
    description,
    showViewAll = false,
    onViewAll,
    showAddButton = false,
    onAddClick,
    variant = 'admin',
    columnConfig,
    className,
    emptyMessage = 'Aucune leçon trouvée.',
}: LeconsTableProps): React.JSX.Element {
    const isMobile = useIsMobile();
    const [refreshing, setRefreshing] = React.useState(false);

    // Limitation des données si pas de pagination
    const displayData = React.useMemo(
        () => (enablePagination ? lecons : lecons.slice(0, maxItems)),
        [lecons, enablePagination, maxItems]
    );

    // Métriques de résumé
    const planifieesCount = React.useMemo(() => countPlanifiees(lecons), [lecons]);
    const effectueesMoisCount = React.useMemo(() => countEffectueesCeMois(lecons), [lecons]);

    // Génération des colonnes selon la variante
    const columns = React.useMemo(() => {
        switch (variant) {
            case 'admin':
                return getAdminLeconsColumns(actions, enrichments, columnConfig);
            case 'secretaire':
                return getSecretaireLeconsColumns(actions, enrichments, columnConfig);
            case 'moniteur':
                return getMoniteurLeconsColumns(actions, enrichments, columnConfig);
            default:
                return getLeconsColumns({ variant: 'admin', actions, enrichments, columnConfig });
        }
    }, [variant, actions, enrichments, columnConfig]);

    // Rafraîchissement
    const handleRefresh = React.useCallback(async () => {
        if (!onRefresh) return;
        setRefreshing(true);
        try {
            await onRefresh();
            toast.success('Leçons actualisées');
        } catch {
            toast.error("Erreur lors de l'actualisation");
        } finally {
            setRefreshing(false);
        }
    }, [onRefresh]);

    // Actions extra dans la toolbar
    const extraActions = React.useMemo(
        () => (
            <div className="flex items-center gap-1.5 flex-wrap">
                {onRefresh && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        aria-label="Rafraîchir les leçons"
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
        ),
        [onRefresh, handleRefresh, refreshing, showViewAll, onViewAll]
    );

    // En-tête de la carte
    const header = (
        <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
                {/* Icône */}
                <div className="flex items-center justify-center h-9 w-9 rounded-xs bg-blue-700 text-white shrink-0">
                    <Calendar className="h-4.5 w-4.5" />
                </div>
                {/* Titre + badges */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={cn('font-semibold leading-tight', asCard ? 'text-base' : 'text-lg')}>
                            {title}
                        </h3>
                        {/* Badge total */}
                        {lecons.length > 0 && (
                            <Badge
                                variant="outline"
                                className="text-[10px] h-4 px-1.5 border-0 bg-primary/10 text-primary dark:bg-primary/20"
                            >
                                {lecons.length} leçon{lecons.length > 1 ? 's' : ''}
                            </Badge>
                        )}
                        {!isMobile && (
                            <>
                                {planifieesCount > 0 && (
                                    <Badge
                                        variant="outline"
                                        className="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-0 text-[10px] h-4 gap-0.5"
                                    >
                                        {planifieesCount} planifiée{planifieesCount > 1 ? 's' : ''}
                                    </Badge>
                                )}
                                {effectueesMoisCount > 0 && (
                                    <Badge
                                        variant="outline"
                                        className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-0 text-[10px] h-4 gap-0.5"
                                    >
                                        {effectueesMoisCount} effectuée{effectueesMoisCount > 1 ? 's' : ''} ce mois
                                    </Badge>
                                )}
                            </>
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

    // Contenu du tableau
    const tableContent = (
        <div
            className={cn('transition-all duration-100', refreshing && 'opacity-60 pointer-events-none')}
        >
            <DataTable
                columns={columns}
                data={displayData}
                isLoading={isLoading || refreshing}
                enableRowSelection={false}
                enablePagination={enablePagination}
                enableToolbar={enableToolbar}
                defaultPageSize={defaultPageSize}
                pageSizeOptions={enablePagination ? pageSizeOptions : undefined}
                searchColumn="candidatId"
                searchPlaceholder="Rechercher par candidat…"
                extraActions={undefined}
                onRowClick={actions.onView}
                emptyMessage={emptyMessage}
                onEmptyActionLabel="Actualiser"
                onEmptyClick={handleRefresh}
                EmptyActionIcon={RefreshCw}
                className="border-0 shadow-none"
            />
        </div>
    );

    // Rendu final
    if (asCard) {
        return (
            <Card className={cn('overflow-hidden shadow-sm rounded-xs', className)}>
                <CardHeader className="pb-3 border-b">{header}</CardHeader>
                <CardContent className="pt-4">{tableContent}</CardContent>
            </Card>
        );
    }

    return (
        <div className={cn('w-full flex flex-col gap-4', className)}>
            {header}
            {tableContent}
        </div>
    );
}