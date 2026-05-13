// src/features/admin/components/UsersTable.tsx

/**
 * @module features/admin/components/UsersTable
 * @description
 * Tableau des utilisateurs – version complète avec filtres, pagination, actions et enrichissements.
 * Permet de gérer les comptes utilisateurs (admins, secrétaires, moniteurs).
 *
 * ## Fonctionnalités
 * - Colonnes adaptées selon la variante (admin / secretaire)
 * - Filtres facettés intégrés (rôle, niveau d’accès, statut actif) via barre d’outils
 * - Recherche textuelle (email, nom, prénom)
 * - Pagination configurable ou limitation simple (`maxItems`)
 * - Bouton « Actualiser » et « Voir tout » optionnels
 * - Enrichissements pour afficher avatar, nombre de sessions, permissions
 * - Badges récapitulatifs : total utilisateurs, actifs, inactifs
 * - État de chargement (skeleton), état vide avec action
 * - Entièrement responsive via conteneur `@container`
 *
 * @see {@link getUsersColumns} – Définition des colonnes
 * @see {@link UtilisateursTableActions} – Callbacks d’actions
 * @see {@link UsersEnrichments} – Enrichissements (avatar, sessions, permissions)
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @example
 * ```tsx
 * <UsersTable
 *   users={users}
 *   variant="admin"
 *   enrichments={{
 *     getAvatarUrl: (u) => `/api/avatar/${u.id}`,
 *     getInitials: (u) => `${u.prenom[0]}${u.nom[0]}`,
 *     getSessionsCount: (u) => u.sessionsActives,
 *     getPermissionsCount: (u) => u.permissions?.length,
 *   }}
 *   actions={{
 *     onView: (u) => navigate(`/admin/users/${u.id}`),
 *     onEdit: (u) => navigate(`/admin/users/${u.id}/edit`),
 *     onResetPassword: (u) => resetPassword(u.email),
 *     onViewPermissions: (u) => navigate(`/admin/users/${u.id}/permissions`),
 *     onDelete: async (u) => deleteUser(u.id),
 *   }}
 *   showViewAll
 *   onViewAll={() => navigate('/admin/users')}
 *   enableToolbar
 *   title="Gestion des utilisateurs"
 * />
 * ```
 */

import * as React from 'react';
import { RefreshCw, ChevronRight, Users } from 'lucide-react';
import { toast } from 'sonner';

import { DataTable } from '@/components/tables/data-table';
import {
    getAdminUsersColumns,
    getSecretaireUsersColumns,
} from '@/components/tables/users/users-columns';
import type {
    Utilisateur,
    UtilisateursTableActions,
    UtilisateursColumnConfig,
    UsersEnrichments,
} from '@/types/auth.types';
import { ROLE_CONFIG, NIVEAU_ACCES_CONFIG } from '@/types/enums';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @interface UsersTableProps
 * @description Propriétés du composant `UsersTable`.
 */
export interface UsersTableProps {
    /** Liste des utilisateurs à afficher */
    users: Utilisateur[];

    /** Variante d’affichage (influence les colonnes) */
    variant?: 'admin' | 'secretaire';

    /** Configuration fine des colonnes */
    columnConfig?: UtilisateursColumnConfig;

    /** Enrichissements optionnels (avatar, sessions, permissions) */
    enrichments?: UsersEnrichments;

    /** Callbacks d’actions sur les lignes */
    actions?: UtilisateursTableActions;

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

    /** Callback du bouton « Ajouter un utilisateur » */
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
 * Calcule le nombre d’utilisateurs actifs.
 * @internal
 */
function countActifs(users: Utilisateur[]): number {
    return users.filter((u) => u.actif).length;
}

/**
 * Calcule le nombre d’utilisateurs inactifs.
 * @internal
 */
function countInactifs(users: Utilisateur[]): number {
    return users.filter((u) => !u.actif).length;
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tableau des utilisateurs – version complète avec filtres, pagination, actions.
 */
export function UsersTable({
    users,
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
    title = 'Utilisateurs',
    description,
    asCard = true,
    isLoading = false,
    onRefresh,
    emptyMessage = 'Aucun utilisateur trouvé.',
    className,
}: UsersTableProps): React.JSX.Element {
    const [refreshing, setRefreshing] = React.useState(false);

    // ── Données affichées (pagination ou limitation) ───────────────────────
    const displayData = React.useMemo(
        () => (enablePagination ? users : users.slice(0, maxItems)),
        [users, enablePagination, maxItems]
    );

    // ── Statistiques rapides ──────────────────────────────────────────────
    const totalCount = users.length;
    const actifsCount = React.useMemo(() => countActifs(users), [users]);
    const inactifsCount = React.useMemo(() => countInactifs(users), [users]);

    // ── Options pour les filtres facettés (rôle, niveau, actif) ───────────
    const roleOptions = React.useMemo(() => {
        return Object.entries(ROLE_CONFIG).map(([value, cfg]) => ({
            label: cfg.label,
            value,
            icon: cfg.icon,
        }));
    }, []);

    const niveauOptions = React.useMemo(() => {
        if (variant !== 'admin') return [];
        return Object.entries(NIVEAU_ACCES_CONFIG).map(([value, cfg]) => ({
            label: cfg.label,
            value,
            icon: cfg.icon,
        }));
    }, [variant]);

    // ── Colonnes ───────────────────────────────────────────────────────────
    const columns = React.useMemo(() => {
        if (variant === 'admin') {
            return getAdminUsersColumns(actions, enrichments, columnConfig);
        }
        return getSecretaireUsersColumns(actions, enrichments, columnConfig);
    }, [variant, actions, enrichments, columnConfig]);

    // ── Rafraîchissement ─────────────────────────────────────────────────
    const handleRefresh = React.useCallback(async () => {
        if (!onRefresh) return;
        setRefreshing(true);
        try {
            await onRefresh();
            toast.success('Utilisateurs actualisés');
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
                                {totalCount} utilisateur{totalCount > 1 ? 's' : ''}
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
                searchColumn="email"
                searchPlaceholder="Rechercher par email, nom ou prénom…"
                addButtonText="Nouvel utilisateur"
                onAddClick={onAddClick}
                onRowClick={(row) => actions.onView && actions.onView(row)}
                facetedFilters={
                    enableToolbar
                        ? [
                            {
                                columnId: 'role',
                                title: 'Rôle',
                                options: roleOptions,
                            },
                            ...(variant === 'admin'
                                ? [
                                    {
                                        columnId: 'niveau',
                                        title: "Niveau d'accès",
                                        options: niveauOptions,
                                    },
                                ]
                                : []),
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
            <Card className={cn('@container/user overflow-hidden shadow-sm rounded-md', className)}>
                <CardHeader className="pb-3 border-b">{header}</CardHeader>
                <CardContent className="pt-4">{tableContent}</CardContent>
            </Card>
        );
    }

    return (
        <div className={cn('@container/user w-full flex flex-col gap-4', className)}>
            {header}
            {tableContent}
        </div>
    );
}