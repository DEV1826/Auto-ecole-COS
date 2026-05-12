// src/components/tables/moniteurs/moniteurs-columns.tsx

/**
 * @module tables/moniteurs/moniteurs-columns
 * @description
 * Colonnes pour le tableau des moniteurs (instructeurs) de l’auto‑école COS.
 * Deux variantes disponibles :
 *
 * - `admin`      : affichage complet (avatar + nom, email, téléphone, spécialité,
 *                  date d’embauche, statut actif, nombre de leçons, actions)
 * - `secretaire` : colonnes essentielles (nom, spécialité, téléphone, actif, actions)
 *
 * ## Architecture
 *
 * La colonne principale utilise `createAvatarWithTextColumn` pour afficher
 * l’avatar (via enrichissement), le nom complet et l’email du moniteur.
 * Les badges d’activité (Actif / Inactif) sont intégrés.
 *
 * ## Colonnes disponibles
 *
 * | Colonne         | Variante        | Description                                      |
 * |-----------------|-----------------|--------------------------------------------------|
 * | `fullName`      | toutes          | Avatar + nom + email (admin) / nom seul (secr.)  |
 * | `specialite`    | admin/secrétaire| Spécialité (permis, accompagnement, etc.)        |
 * | `telephone`     | admin/secrétaire| Numéro de téléphone                              |
 * | `email`         | admin           | Adresse email                                    |
 * | `dateEmbauche`  | admin           | Date d’embauche                                  |
 * | `actif`         | toutes          | Badge Actif / Inactif                            |
 * | `leconsCount`   | admin           | Nombre de leçons données (via enrichissement)    |
 * | `actions`       | admin/secrétaire| Menu (voir, modifier, désactiver, planning)      |
 *
 * @see {@link MoniteursColumnsOptions}
 * @see {@link MoniteursEnrichments}
 * @see {@link MoniteursTableActions}
 *
 * @author Stive Junior
 * @version 2.0.0
 *
 * @example
 * ```tsx
 * const columns = getAdminMoniteursColumns(actions, {
 *   getLeconsCount: (m) => m.lecons?.length ?? 0,
 *   getAvatarUrl: (m) => `/api/avatar/${m.id}`,
 *   getInitials: (m) => `${m.prenom[0]}${m.nom[0]}`,
 * });
 * ```
 */

import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, Phone, Mail, Briefcase, Eye, Pencil, CalendarCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DataTableColumnHeader } from '@/components/tables/data-table-column-header';
import { DataTableRowActions } from '@/components/tables/data-table-row-actions';
import { createAvatarWithTextColumn } from '@/components/tables/factory';
import { cn } from '@/lib/utils';
import type { Moniteur, MoniteursEnrichments, MoniteursColumnsOptions, MoniteursTableActions } from '@/types/moniteurs.types';
import type { RowActionsConfig, CustomRowAction } from '@/components/tables/types';

// ─────────────────────────────────────────────────────────────────────────────
// UTILITAIRES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formate une date d’embauche (ex: "15 janv. 2023")
 * @internal
 */
function formatDateEmbauche(date: Date | string | null | undefined): string {
    if (!date) return '—';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '—';
    return format(d, 'd MMM yyyy', { locale: fr });
}

// ─────────────────────────────────────────────────────────────────────────────
// COLONNES FIXES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Colonne "Nom complet" avec avatar (admin) ou texte simple (secretaire)
 * @param enrichments - Pour l’avatar et les initiales
 * @param variant - Admin ou secretaire
 * @internal
 */
function colFullName(enrichments: MoniteursEnrichments, variant: 'admin' | 'secretaire'): ColumnDef<Moniteur> {
    if (variant === 'admin' && enrichments.getAvatarUrl && enrichments.getInitials) {
        return createAvatarWithTextColumn<Moniteur>({
            accessorKey: 'nom',
            title: 'Moniteur',
            getAvatarUrl: (m) => enrichments.getAvatarUrl!(m),
            getInitials: (m) => enrichments.getInitials!(m),
            getPrimaryText: (m) => `${m.prenom} ${m.nom}`,
            getSecondaryText: (m) => m.email ?? '',
            avatarSize: 'md',
            enableSorting: true,
            size: 280,
        });
    }
    // Version simplifiée pour secrétaire ou sans enrichissements
    return {
        id: 'fullName',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Moniteur" />,
        cell: ({ row }) => <span className="text-sm font-medium">{`${row.original.prenom} ${row.original.nom}`}</span>,
        enableSorting: true,
        size: 200,
    };
}

/**
 * Colonne "Spécialité"
 * @internal
 */
function colSpecialite(): ColumnDef<Moniteur> {
    return {
        accessorKey: 'specialite',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Spécialité" icon={Briefcase} />,
        cell: ({ row }) => {
            const spec = row.original.specialite;
            if (!spec) return <span className="text-xs text-muted-foreground">—</span>;
            return <span className="text-xs">{spec}</span>;
        },
        enableSorting: true,
        size: 160,
    };
}

/**
 * Colonne "Téléphone"
 * @internal
 */
function colTelephone(): ColumnDef<Moniteur> {
    return {
        accessorKey: 'telephone',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Téléphone" icon={Phone} />,
        cell: ({ row }) => {
            const phone = row.original.telephone;
            if (!phone) return <span className="text-xs text-muted-foreground">—</span>;
            return (
                <div className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <a href={`tel:${phone}`} className="text-xs hover:text-primary transition-colors">{phone}</a>
                </div>
            );
        },
        enableSorting: false,
        size: 130,
    };
}

/**
 * Colonne "Email" (admin seulement)
 * @internal
 */
function colEmail(): ColumnDef<Moniteur> {
    return {
        accessorKey: 'email',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Email" icon={Mail} />,
        cell: ({ row }) => {
            const email = row.original.email;
            if (!email) return <span className="text-xs text-muted-foreground">—</span>;
            return (
                <div className="flex items-center gap-1.5">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <a href={`mailto:${email}`} className="text-xs hover:text-primary transition-colors">{email}</a>
                </div>
            );
        },
        enableSorting: true,
        size: 180,
    };
}

/**
 * Colonne "Date d’embauche" (admin seulement)
 * @internal
 */
function colDateEmbauche(): ColumnDef<Moniteur> {
    return {
        accessorKey: 'dateEmbauche',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Embauché le" icon={Calendar} />,
        cell: ({ row }) => {
            const date = row.original.dateEmbauche;
            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 text-xs cursor-default">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span>{formatDateEmbauche(date)}</span>
                            </div>
                        </TooltipTrigger>
                        {date && <TooltipContent>{format(new Date(date), 'd MMMM yyyy', { locale: fr })}</TooltipContent>}
                    </Tooltip>
                </TooltipProvider>
            );
        },
        enableSorting: true,
        size: 120,
    };
}

/**
 * Colonne "Actif" – badge
 * @internal
 */
function colActif(): ColumnDef<Moniteur> {
    return {
        accessorKey: 'actif',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Statut" />,
        cell: ({ row }) => {
            const actif = row.original.actif;
            return (
                <Badge variant="outline" className={cn('gap-1.5 text-xs font-medium border-0',
                    actif ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                )}>
                    {actif ? 'Actif' : 'Inactif'}
                </Badge>
            );
        },
        enableSorting: true,
        size: 100,
        filterFn: (row, id, value: boolean | string) => {
            const actif = row.getValue(id);
            if (typeof value === 'boolean') return actif === value;
            return value === 'true' ? actif === true : actif === false;
        },
    };
}

/**
 * Colonne "Nombre de leçons" (via enrichissement)
 * @param getLeconsCount - Fonction retournant le nombre de leçons
 * @internal
 */
function colLeconsCount(getLeconsCount: (m: Moniteur) => number): ColumnDef<Moniteur> {
    return {
        id: 'leconsCount',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Leçons" />,
        cell: ({ row }) => <span className="text-xs tabular-nums">{getLeconsCount(row.original)}</span>,
        enableSorting: true,
        sortingFn: (a, b) => getLeconsCount(a.original) - getLeconsCount(b.original),
        size: 80,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// COLONNE D’ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Génère la colonne d’actions.
 * @param actions - Callbacks d’actions
 * @param variant - Rôle
 * @internal
 */
function colActions(actions?: MoniteursTableActions, variant: 'admin' | 'secretaire' = 'admin'): ColumnDef<Moniteur> {
    return {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
            const moniteur = row.original;
            const customActions: CustomRowAction<Moniteur>[] = [];

            if (actions?.onView) {
                customActions.push({ label: 'Voir le détail', icon: <Eye className="mr-2 h-4 w-4" />, onClick: (m) => actions.onView!(m) });
            }
            if (actions?.onEdit && variant === 'admin') {
                customActions.push({ label: 'Modifier', icon: <Pencil className="mr-2 h-4 w-4" />, onClick: (m) => actions.onEdit!(m) });
            }
            if (actions?.onViewPlanning) {
                customActions.push({ label: 'Voir le planning', icon: <CalendarCheck className="mr-2 h-4 w-4" />, onClick: (m) => actions.onViewPlanning!(m) });
            }

            const rowActionsConfig: RowActionsConfig<Moniteur> = {
                customActions,
                onDelete: variant === 'admin' ? actions?.onDelete : undefined,
            };
            return <DataTableRowActions row={moniteur} actions={rowActionsConfig} />;
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
 * Génère le tableau de colonnes pour le tableau des moniteurs.
 *
 * @param options - Configuration (variant, actions, enrichments, columnConfig)
 * @returns Tableau de colonnes TanStack Table
 */
export function getMoniteursColumns({
    variant = 'admin',
    actions,
    enrichments = {},
    columnConfig = {},
}: MoniteursColumnsOptions): ColumnDef<Moniteur>[] {
    const {
        showFullName = true,
        showEmail = true,
        showTelephone = true,
        showSpecialite = true,
        showDateEmbauche = true,
        showActif = true,
        showLeconsCount = false,
        showActions = true,
    } = columnConfig;

    const cols: ColumnDef<Moniteur>[] = [];

    if (showFullName) cols.push(colFullName(enrichments, variant));
    if (showSpecialite) cols.push(colSpecialite());
    if (showTelephone) cols.push(colTelephone());
    if (showEmail && variant === 'admin') cols.push(colEmail());
    if (showDateEmbauche && variant === 'admin') cols.push(colDateEmbauche());
    if (showActif) cols.push(colActif());
    if (showLeconsCount && enrichments.getLeconsCount && variant === 'admin')
        cols.push(colLeconsCount(enrichments.getLeconsCount));
    if (showActions && actions && Object.keys(actions).length > 0)
        cols.push(colActions(actions, variant));

    return cols;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRÉ‑SETS PAR RÔLE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Colonnes pour la vue administrateur (toutes colonnes + avatar + leçons)
 */
export function getAdminMoniteursColumns(
    actions?: MoniteursTableActions,
    enrichments?: MoniteursEnrichments,
    columnConfig = {}
): ColumnDef<Moniteur>[] {
    return getMoniteursColumns({
        variant: 'admin',
        actions,
        enrichments,
        columnConfig: {
            showFullName: true,
            showEmail: true,
            showTelephone: true,
            showSpecialite: true,
            showDateEmbauche: true,
            showActif: true,
            showLeconsCount: !!enrichments?.getLeconsCount,
            showActions: true,
            ...columnConfig,
        },
    });
}

/**
 * Colonnes pour la vue secrétaire (nom, spécialité, téléphone, actif, actions)
 */
export function getSecretaireMoniteursColumns(
    actions?: MoniteursTableActions,
    enrichments?: MoniteursEnrichments,
    columnConfig = {}
): ColumnDef<Moniteur>[] {
    return getMoniteursColumns({
        variant: 'secretaire',
        actions,
        enrichments,
        columnConfig: {
            showFullName: true,
            showEmail: false,
            showTelephone: true,
            showSpecialite: true,
            showDateEmbauche: false,
            showActif: true,
            showLeconsCount: false,
            showActions: true,
            ...columnConfig,
        },
    });
}