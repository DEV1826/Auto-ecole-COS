// src/features/moniteurs/components/MoniteursTable.tsx

/**
 * @module features/moniteurs/components/MoniteursTable
 * @description
 * Tableau des moniteurs (instructeurs) – version complète avec filtres, pagination, actions et enrichissements.
 * Permet de visualiser, filtrer et gérer les moniteurs de l’auto‑école.
 *
 * ## Fonctionnalités
 * - Colonnes adaptées selon la variante (admin / secretaire)
 * - Filtres facettés intégrés (spécialité, statut actif) via barre d’outils
 * - Recherche textuelle (nom, email, téléphone)
 * - Pagination configurable ou limitation simple (`maxItems`)
 * - Bouton « Actualiser » et « Voir tout » optionnels
 * - Enrichissements pour afficher avatar, nombre de leçons
 * - Badges récapitulatifs : total moniteurs, actifs, inactifs
 * - État de chargement (skeleton), état vide avec action
 * - Entièrement responsive via conteneur `@container`
 *
 * @see {@link getMoniteursColumns} – Définition des colonnes
 * @see {@link MoniteursTableActions} – Callbacks d’actions
 * @see {@link MoniteursEnrichments} – Enrichissements (avatar, leçons)
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @example
 * ```tsx
 * // Dashboard admin
 * <MoniteursTable
 *   moniteurs={moniteurs}
 *   variant="admin"
 *   enrichments={{
 *     getAvatarUrl: (m) => `/api/avatar/${m.id}`,
 *     getInitials: (m) => `${m.prenom[0]}${m.nom[0]}`,
 *     getLeconsCount: (m) => m.lecons?.length ?? 0,
 *   }}
 *   actions={{
 *     onView: (m) => navigate(`/moniteurs/${m.id}`),
 *     onEdit: (m) => navigate(`/moniteurs/${m.id}/edit`),
 *     onViewPlanning: (m) => navigate(`/planning?moniteurId=${m.id}`),
 *   }}
 *   showViewAll
 *   onViewAll={() => navigate('/moniteurs')}
 *   enableToolbar
 *   title="Équipe pédagogique"
 * />
 * ```
 */

import * as React from 'react';
import { RefreshCw, ChevronRight, PlusCircle, Users } from 'lucide-react';
import { toast } from 'sonner';

import { DataTable } from '@/components/tables/data-table';
import {
    getAdminMoniteursColumns,
    getSecretaireMoniteursColumns,
} from '@/components/tables/moniteurs/moniteurs-columns';
import type {
    Moniteur,
    MoniteursEnrichments,
    MoniteursTableActions,
    MoniteursColumnConfig,
} from '@/types/moniteurs.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @interface MoniteursTableProps
 * @description Propriétés du composant `MoniteursTable`.
 */
export interface MoniteursTableProps {
    /** Liste des moniteurs à afficher */
    moniteurs: Moniteur[];

    /** Variante d’affichage (influence les colonnes) */
    variant?: 'admin' | 'secretaire';

    /** Configuration fine des colonnes */
    columnConfig?: MoniteursColumnConfig;

    /** Enrichissements optionnels (avatar, leçons) */
    enrichments?: MoniteursEnrichments;

    /** Callbacks d’actions sur les lignes */
    actions?: MoniteursTableActions;

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

    /** Afficher le bouton « Ajouter un moniteur » */
    showAddButton?: boolean;

    /** Callback du bouton « Ajouter un moniteur » */
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
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcule le nombre de moniteurs actifs.
 * @internal
 */
function countActifs(moniteurs: Moniteur[]): number {
    return moniteurs.filter((m) => m.actif).length;
}

/**
 * Calcule le nombre de moniteurs inactifs.
 * @internal
 */
function countInactifs(moniteurs: Moniteur[]): number {
    return moniteurs.filter((m) => !m.actif).length;
}

/**
 * Extrait la liste unique des spécialités pour le filtre facetté.
 * @internal
 */
function getUniqueSpecialites(moniteurs: Moniteur[]): string[] {
    const specialites = new Set<string>();
    moniteurs.forEach((m) => {
        if (m.specialite) specialites.add(m.specialite);
    });
    return Array.from(specialites).sort();
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tableau des moniteurs – version complète avec filtres, pagination, actions.
 */
export function MoniteursTable({
    moniteurs,
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
    showAddButton = false,
    onAddClick,
    title = 'Moniteurs',
    description,
    asCard = true,
    isLoading = false,
    onRefresh,
    emptyMessage = 'Aucun moniteur trouvé.',
    className,
}: MoniteursTableProps): React.JSX.Element {
    const [refreshing, setRefreshing] = React.useState(false);

    // ── Données affichées (pagination ou limitation) ───────────────────────
    const displayData = React.useMemo(
        () => (enablePagination ? moniteurs : moniteurs.slice(0, maxItems)),
        [moniteurs, enablePagination, maxItems]
    );

    // ── Statistiques rapides ──────────────────────────────────────────────
    const totalCount = moniteurs.length;
    const actifsCount = React.useMemo(() => countActifs(moniteurs), [moniteurs]);
    const inactifsCount = React.useMemo(() => countInactifs(moniteurs), [moniteurs]);

    // ── Options pour les filtres facettés (spécialités) ────────────────────
    const specialiteOptions = React.useMemo(() => {
        const specialites = getUniqueSpecialites(moniteurs);
        return specialites.map((spec) => ({ label: spec, value: spec }));
    }, [moniteurs]);

    // ── Colonnes ───────────────────────────────────────────────────────────
    const columns = React.useMemo(() => {
        if (variant === 'admin') {
            return getAdminMoniteursColumns(actions, enrichments, columnConfig);
        }
        return getSecretaireMoniteursColumns(actions, enrichments, columnConfig);
    }, [variant, actions, enrichments, columnConfig]);

    // ── Rafraîchissement ─────────────────────────────────────────────────
    const handleRefresh = React.useCallback(async () => {
        if (!onRefresh) return;
        setRefreshing(true);
        try {
            await onRefresh();
            toast.success('Moniteurs actualisés');
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
                <div className="flex items-center justify-center h-9 w-9 rounded-md bg-blue-700 text-white shrink-0">
                    <Users className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={cn('font-semibold leading-tight', asCard ? 'text-base' : 'text-lg')}>
                            {title}
                        </h3>
                        {totalCount > 0 && (
                            <Badge
                                variant="outline"
                                className="text-[10px] h-4 px-1.5 border-0 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300"
                            >
                                {totalCount} moniteur{totalCount > 1 ? 's' : ''}
                            </Badge>
                        )}
                        {actifsCount > 0 && (
                            <Badge
                                variant="outline"
                                className="text-[10px] h-4 px-1.5 border-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                            >
                                {actifsCount} actif{actifsCount > 1 ? 's' : ''}
                            </Badge>
                        )}
                        {inactifsCount > 0 && (
                            <Badge
                                variant="outline"
                                className="text-[10px] h-4 px-1.5 border-0 bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            >
                                {inactifsCount} inactif{inactifsCount > 1 ? 's' : ''}
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
                pageSizeOptions={[5, 10, 20, 30, 40, 50]}
                searchColumn="nom"
                searchPlaceholder="Rechercher par nom, email ou téléphone…"
                addButtonText="Nouveau moniteur"
                onAddClick={onAddClick}
                onRowClick={(row) => actions.onView && actions.onView(row)}
                facetedFilters={
                    enableToolbar
                        ? [
                            {
                                columnId: 'specialite',
                                title: 'Spécialité',
                                options: specialiteOptions,
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
            <Card className={cn('@container/mon overflow-hidden shadow-sm rounded-md', className)}>
                <CardHeader className="pb-3 border-b">{header}</CardHeader>
                <CardContent className="pt-4">{tableContent}</CardContent>
            </Card>
        );
    }

    return (
        <div className={cn('@container/mon w-full flex flex-col gap-4', className)}>
            {header}
            {tableContent}
        </div>
    );
}