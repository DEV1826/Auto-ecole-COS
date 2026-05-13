// src/components/tables/audit-logs/audit-logs-columns.tsx

/**
 * @module tables/audit-logs/audit-logs-columns
 * @description
 * Colonnes pour le tableau des logs d’audit de l’auto‑école COS.
 * Deux variantes disponibles :
 *
 * - `admin`      : affichage complet (utilisateur (avatar + nom + email), action, ressource,
 *                  description, adresse IP, statut (badge), date, actions)
 * - `auditor`    : colonnes essentielles (utilisateur, action, ressource, statut, date)
 *
 * ## Architecture
 *
 * La colonne utilisateur utilise `createAvatarWithTextColumn` pour afficher l’avatar,
 * le nom complet et l’email de l’utilisateur (via enrichissements).
 * Les badges de statut utilisent une configuration locale (SUCCESS / FAILED).
 * La date est formatée avec tooltip (relatif + absolu).
 *
 * ## Colonnes disponibles
 *
 * | Colonne       | Variante        | Description                                      |
 * |---------------|-----------------|--------------------------------------------------|
 * | `utilisateur` | toutes          | Avatar + nom + email (admin) / nom seul (auditor)|
 * | `action`      | toutes          | Code de l’action (ex: LOGIN_SUCCESS)             |
 * | `ressource`   | toutes          | Type de ressource concernée                      |
 * | `description` | admin           | Description textuelle                            |
 * | `ipAddress`   | admin           | Adresse IP                                       |
 * | `statut`      | toutes          | Badge SUCCÈS / ÉCHEC                             |
 * | `createdAt`   | toutes          | Date et heure (formatée)                         |
 * | `actions`     | admin           | Menu (voir détail, filtrer par utilisateur)      |
 *
 * @see {@link AuditLogsColumnsOptions}
 * @see {@link AuditLogsTableActions}
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @example
 * ```tsx
 * const columns = getAdminAuditLogsColumns(actions, {
 *   getAvatarUrl: (log) => `/api/avatar/${log.utilisateurId}`,
 *   getInitials: (log) => `${log.utilisateur?.prenom?.[0]}${log.utilisateur?.nom?.[0]}`,
 * });
 * ```
 */

import type { ColumnDef } from '@tanstack/react-table';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { User, ShieldCheck, ShieldAlert, Calendar, Eye, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DataTableColumnHeader } from '@/components/tables/data-table-column-header';
import { DataTableRowActions } from '@/components/tables/data-table-row-actions';
import { createAvatarWithTextColumn } from '@/components/tables/factory';
import { cn } from '@/lib/utils';
import type { AuditLog, AuditLogsEnrichments } from '@/types/admin.types';
import type { AuditLogsColumnsOptions, AuditLogsTableActions } from '@/types/admin.types';
import type { RowActionsConfig, CustomRowAction } from '@/components/tables/types';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION DES STATUTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Configuration d’affichage pour le statut d’un log.
 * @internal
 */
const STATUT_CONFIG = {
    SUCCESS: {
        label: 'Succès',
        bgColor: 'bg-emerald-100 dark:bg-emerald-500/20',
        textColor: 'text-emerald-700 dark:text-emerald-400',
        icon: ShieldCheck,
    },
    FAILED: {
        label: 'Échec',
        bgColor: 'bg-red-100 dark:bg-red-500/20',
        textColor: 'text-red-700 dark:text-red-400',
        icon: ShieldAlert,
    },
};


// ─────────────────────────────────────────────────────────────────────────────
// UTILITAIRES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formate la date de création du log.
 * - Tooltip : date absolue détaillée
 * - Affichage : temps relatif (ex: "il y a 2 heures")
 * @internal
 */
function formatCreatedAt(date: Date | string): { relative: string; absolute: string } {
    const d = new Date(date);
    if (isNaN(d.getTime())) return { relative: '—', absolute: '—' };
    const relative = formatDistanceToNow(d, { addSuffix: true, locale: fr });
    const absolute = format(d, "d MMMM yyyy 'à' HH:mm:ss", { locale: fr });
    return { relative, absolute };
}

// ─────────────────────────────────────────────────────────────────────────────
// COLONNES FIXES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Colonne "Utilisateur" – avatar + nom + email pour admin, texte simple pour auditor.
 * @param enrichments - Enrichissements pour l’avatar et le nom
 * @param variant - admin ou auditor
 * @internal
 */
function colUtilisateur(
    enrichments: AuditLogsEnrichments,
    variant: 'admin' | 'auditor'
): ColumnDef<AuditLog> {
    const { getAvatarUrl, getInitials, getNomComplet, getEmail } = enrichments;
    const hasAvatarData = !!(getAvatarUrl && getInitials && getNomComplet && getEmail);

    if (variant === 'admin' && hasAvatarData) {
        return createAvatarWithTextColumn<AuditLog>({
            accessorKey: 'utilisateurId',
            title: 'Utilisateur',
            icon: User,
            getAvatarUrl: (log) => getAvatarUrl!(log),
            getInitials: (log) => getInitials!(log),
            getPrimaryText: (log) => getNomComplet!(log) || 'Anonyme',
            getSecondaryText: (log) => getEmail!(log) || '',
            avatarSize: 'md',
            enableSorting: true,
            size: 280,
        });
    }
    // Version simplifiée (auditor ou sans enrichissements)
    const getNom = getNomComplet ?? ((log: AuditLog) => {
        const user = log.utilisateur;
        return user ? `${user.prenom} ${user.nom}`.trim() : 'Anonyme';
    });
    return {
        id: 'utilisateur',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Utilisateur" icon={User} />,
        cell: ({ row }) => <span className="text-sm">{getNom(row.original)}</span>,
        enableSorting: true,
        size: 200,
    };
}

/**
 * Colonne "Action" – code de l’action (ex: LOGIN_SUCCESS)
 * @internal
 */
function colAction(): ColumnDef<AuditLog> {
    return {
        accessorKey: 'action',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Action" />,
        cell: ({ row }) => {
            const action = row.original.action;
            return <span className="text-xs font-mono">{action}</span>;
        },
        enableSorting: true,
        size: 150,
    };
}

/**
 * Colonne "Ressource" – type de ressource (candidats, utilisateurs, etc.)
 * @internal
 */
function colRessource(): ColumnDef<AuditLog> {
    return {
        accessorKey: 'ressource',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Ressource" />,
        cell: ({ row }) => {
            const ressource = row.original.ressource;
            if (!ressource) return <span className="text-xs text-muted-foreground">—</span>;
            return <span className="text-xs">{ressource}</span>;
        },
        enableSorting: true,
        size: 140,
    };
}

/**
 * Colonne "Description" – texte tronqué avec tooltip.
 * @internal
 */
function colDescription(): ColumnDef<AuditLog> {
    return {
        accessorKey: 'description',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
        cell: ({ row }) => {
            const desc = row.original.description;
            if (!desc) return <span className="text-xs text-muted-foreground">—</span>;
            const truncated = desc.length > 60 ? desc.slice(0, 60) + '…' : desc;
            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="text-xs cursor-default">{truncated}</span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-xs">{desc}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        },
        enableSorting: false,
        size: 220,
    };
}

/**
 * Colonne "Adresse IP" – admin seulement.
 * @internal
 */
function colIpAddress(): ColumnDef<AuditLog> {
    return {
        accessorKey: 'ipAddress',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Adresse IP" />,
        cell: ({ row }) => {
            const ip = row.original.ipAddress;
            if (!ip) return <span className="text-xs text-muted-foreground">—</span>;
            return <span className="text-xs font-mono">{ip}</span>;
        },
        enableSorting: false,
        size: 140,
    };
}

/**
 * Colonne "Statut" – badge SUCCÈS / ÉCHEC.
 * @internal
 */
function colStatut(): ColumnDef<AuditLog> {
    return {
        accessorKey: 'statut',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Statut" />,
        cell: ({ row }) => {
            const statut = row.original.statut as 'SUCCESS' | 'FAILED';
            const cfg = STATUT_CONFIG[statut] ?? { label: statut, bgColor: 'bg-gray-100 dark:bg-gray-800', textColor: 'text-gray-700', icon: ShieldAlert };
            const Icon = cfg.icon;
            return (
                <Badge variant="outline" className={cn('gap-1.5 text-xs font-medium border-0', cfg.bgColor, cfg.textColor)}>
                    <Icon className={cn('h-3 w-3 shrink-0', cfg.textColor)} />
                    {cfg.label}
                </Badge>
            );
        },
        enableSorting: true,
        size: 100,
        filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    };
}

/**
 * Colonne "Date" – formatée (relatif + absolu dans tooltip).
 * @internal
 */
function colCreatedAt(): ColumnDef<AuditLog> {
    return {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Date" icon={Calendar} />,
        cell: ({ row }) => {
            const raw = row.original.createdAt;
            const { relative, absolute } = formatCreatedAt(raw);
            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 text-xs cursor-default">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span className="capitalize">{relative}</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">{absolute}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        },
        enableSorting: true,
        size: 140,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// COLONNE D’ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Génère la colonne d’actions.
 * @param actions - Callbacks d’actions
 * @internal
 */
function colActions(actions?: AuditLogsTableActions): ColumnDef<AuditLog> {
    return {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
            const log = row.original;
            const customActions: CustomRowAction<AuditLog>[] = [];

            if (actions?.onViewDetails) {
                customActions.push({
                    label: 'Voir les détails',
                    icon: <Eye className="mr-2 h-4 w-4" />,
                    onClick: (l) => actions.onViewDetails!(l),
                });
            }
            if (actions?.onFilterByUser && log.utilisateurId) {
                customActions.push({
                    label: 'Filtrer par cet utilisateur',
                    icon: <Filter className="mr-2 h-4 w-4" />,
                    onClick: () => actions.onFilterByUser!(log.utilisateurId!),
                });
            }

            const rowActionsConfig: RowActionsConfig<AuditLog> = {
                customActions,
                // Pas de suppression / modification sur les logs
            };
            return <DataTableRowActions row={log} actions={rowActionsConfig} />;
        },
        enableSorting: false,
        enableHiding: false,
        size: 50,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// FONCTION PRINCIPALE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Génère le tableau de colonnes pour le tableau des logs d’audit.
 *
 * @param options - Options de configuration (variant, actions, enrichments, columnConfig)
 * @returns Tableau de colonnes TanStack Table
 *
 * @example
 * ```tsx
 * const columns = getAuditLogsColumns({
 *   variant: 'admin',
 *   actions: { onViewDetails: (log) => console.log(log) },
 *   enrichments: {
 *     getNomComplet: (log) => `${log.utilisateur?.prenom} ${log.utilisateur?.nom}`,
 *     getEmail: (log) => log.utilisateur?.email,
 *   },
 * });
 * ```
 */
export function getAuditLogsColumns({
    variant = 'admin',
    actions,
    enrichments = {},
    columnConfig = {},
}: AuditLogsColumnsOptions): ColumnDef<AuditLog>[] {
    const {
        showUtilisateur = true,
        showAction = true,
        showRessource = true,
        showDescription = true,
        showIpAddress = false,
        showStatut = true,
        showCreatedAt = true,
        showActions = false,
    } = columnConfig;

    const cols: ColumnDef<AuditLog>[] = [];

    if (showUtilisateur) cols.push(colUtilisateur(enrichments, variant));
    if (showAction) cols.push(colAction());
    if (showRessource) cols.push(colRessource());
    if (showDescription && variant === 'admin') cols.push(colDescription());
    if (showIpAddress && variant === 'admin') cols.push(colIpAddress());
    if (showStatut) cols.push(colStatut());
    if (showCreatedAt) cols.push(colCreatedAt());
    if (showActions && actions && Object.keys(actions).length > 0) cols.push(colActions(actions));

    return cols;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRÉ‑SETS PAR RÔLE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Colonnes pour la vue administrateur (toutes colonnes)
 */
export function getAdminAuditLogsColumns(
    actions?: AuditLogsTableActions,
    enrichments?: AuditLogsEnrichments,
    columnConfig = {}
): ColumnDef<AuditLog>[] {
    return getAuditLogsColumns({
        variant: 'admin',
        actions,
        enrichments,
        columnConfig: {
            showUtilisateur: true,
            showAction: true,
            showRessource: true,
            showDescription: true,
            showIpAddress: true,
            showStatut: true,
            showCreatedAt: true,
            showActions: true,
            ...columnConfig,
        },
    });
}

/**
 * Colonnes pour la vue auditeur (colonnes essentielles)
 */
export function getAuditorAuditLogsColumns(
    actions?: AuditLogsTableActions,
    enrichments?: AuditLogsEnrichments,
    columnConfig = {}
): ColumnDef<AuditLog>[] {
    return getAuditLogsColumns({
        variant: 'auditor',
        actions,
        enrichments,
        columnConfig: {
            showUtilisateur: true,
            showAction: true,
            showRessource: true,
            showDescription: false,
            showIpAddress: false,
            showStatut: true,
            showCreatedAt: true,
            showActions: false,
            ...columnConfig,
        },
    });
}