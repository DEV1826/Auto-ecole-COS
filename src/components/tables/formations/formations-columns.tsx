// src/components/tables/formations/formations-columns.tsx

/**
 * @module tables/formations/formations-columns
 * @description
 * Colonnes pour le tableau des formations (offres pédagogiques) de l’auto‑école COS.
 * Deux variantes disponibles :
 *
 * - `admin`      : affichage complet (nom, catégorie, prix, heures, actif, actions)
 * - `secretaire` : colonnes essentielles (nom, catégorie, prix, actif)
 *
 * ## Architecture
 *
 * La colonne "Catégorie" utilise `CATEGORIE_PERMIS_CONFIG` depuis `enums.ts`.
 * La colonne "Actif" affiche un badge (Actif / Inactif).
 * La colonne "Heures" affiche "Xh code / Yh conduite" (formatable via enrichissement).
 *
 * ## Colonnes disponibles
 *
 * | Colonne       | Variante        | Description                                      |
 * |---------------|-----------------|--------------------------------------------------|
 * | `nom`         | toutes          | Nom de la formation (avec description en tooltip)|
 * | `categorie`   | toutes          | Badge catégorie de permis (A/B/C/D/BE)           |
 * | `prix`        | toutes          | Prix total (formaté FCFA)                        |
 * | `heures`      | admin           | Heures de code / conduite                        |
 * | `actif`       | toutes          | Badge Actif / Inactif                            |
 * | `actions`     | admin/secrétaire| Menu (voir, modifier, activer/désactiver, tarifs)|
 *
 * @see {@link FormationsColumnsOptions}
 * @see {@link FormationsEnrichments}
 * @see {@link FormationsTableActions}
 *
 * @author Stive Junior
 * @version 2.0.0
 *
 * @example
 * ```tsx
 * const columns = getAdminFormationsColumns(actions, {
 *   getDureeFormatee: (f) => `${f.heuresCode}h code / ${f.heuresConduite}h conduite`,
 * });
 * ```
 */

import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DataTableColumnHeader } from '@/components/tables/data-table-column-header';
import { DataTableRowActions } from '@/components/tables/data-table-row-actions';
import { cn } from '@/lib/utils';
import type { Formation, FormationsEnrichments, FormationsColumnsOptions, FormationsTableActions } from '@/types/formations.types';
import type { CategoriePermis } from '@/types/enums';
import { CATEGORIE_PERMIS_CONFIG } from '@/types/enums';
import type { RowActionsConfig, CustomRowAction } from '@/components/tables/types';
import { Eye, Pencil, Power, History } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// UTILITAIRES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formate un montant en FCFA avec notation compacte.
 * @internal
 */
function formatCurrency(montant: number): string {
    if (montant >= 1_000_000) return (montant / 1_000_000).toFixed(1) + 'M FCFA';
    if (montant >= 1_000) return (montant / 1_000).toFixed(1) + 'k FCFA';
    return montant.toLocaleString('fr-FR') + ' FCFA';
}

// ─────────────────────────────────────────────────────────────────────────────
// COLONNES FIXES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Colonne "Nom" – avec tooltip pour la description.
 * @internal
 */
function colNom(): ColumnDef<Formation> {
    return {
        accessorKey: 'nom',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Formation" />,
        cell: ({ row }) => {
            const nom = row.original.nom;
            const description = row.original.description;
            if (!description) return <span className="text-sm font-medium">{nom}</span>;
            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="text-sm font-medium cursor-help underline decoration-dotted">{nom}</span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-xs">{description}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        },
        enableSorting: true,
        size: 220,
    };
}

/**
 * Colonne "Catégorie de permis" – badge depuis enums.ts
 * @internal
 */
function colCategorie(): ColumnDef<Formation> {
    return {
        accessorKey: 'categorie',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Permis" />,
        cell: ({ row }) => {
            const categorie = row.original.categorie as CategoriePermis;
            const cfg = CATEGORIE_PERMIS_CONFIG[categorie];
            if (!cfg) return <span className="text-xs text-muted-foreground">—</span>;
            const Icon = cfg.icon;
            return (
                <Badge variant="outline" className={cn('gap-1.5 text-xs font-medium border-0', cfg.bgColor, cfg.textColor)}>
                    <Icon className={cn('h-3 w-3 shrink-0', cfg.textColor)} />
                    {cfg.label}
                </Badge>
            );
        },
        enableSorting: true,
        size: 110,
        filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    };
}

/**
 * Colonne "Prix total" – formaté FCFA.
 * @internal
 */
function colPrix(): ColumnDef<Formation> {
    return {
        accessorKey: 'prixTotal',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Prix" />,
        cell: ({ row }) => <span className="text-sm font-semibold tabular-nums">{formatCurrency(row.original.prixTotal)}</span>,
        enableSorting: true,
        size: 120,
    };
}

/**
 * Colonne "Heures" – code / conduite (personnalisable via enrichissement)
 * @param getDureeFormatee - Fonction optionnelle pour formater les heures
 * @internal
 */
function colHeures(getDureeFormatee?: (f: Formation) => string): ColumnDef<Formation> {
    return {
        id: 'heures',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Heures" />,
        cell: ({ row }) => {
            const f = row.original;
            if (getDureeFormatee) {
                return <span className="text-xs">{getDureeFormatee(f)}</span>;
            }
            return <span className="text-xs">{f.heuresCode}h code / {f.heuresConduite}h conduite</span>;
        },
        enableSorting: false,
        size: 140,
    };
}

/**
 * Colonne "Nombre d’inscriptions" – personnalisable via enrichissement
 * @param getNbInscriptions - Fonction pour obtenir le nombre d’inscriptions
 * @internal
 */
function colNbInscriptions(getNbInscriptions?: (f: Formation) => number): ColumnDef<Formation> {
    return {
        id: 'nbInscriptions',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Inscriptions" />,
        cell: ({ row }) => {
            const f = row.original;
            const nb = getNbInscriptions ? getNbInscriptions(f) : 0;
            return <span className="text-sm font-medium">{nb}</span>;
        },
        enableSorting: true,
        size: 120,
    };
}


/**
 * Colonne "Actif" – badge Actif / Inactif
 * @internal
 */
function colActif(): ColumnDef<Formation> {
    return {
        accessorKey: 'actif',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Statut" />,
        cell: ({ row }) => {
            const actif = row.original.actif;
            return (
                <Badge variant="outline" className={cn(
                    'gap-1.5 text-xs font-medium border-0',
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

// ─────────────────────────────────────────────────────────────────────────────
// COLONNE D’ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Génère la colonne d’actions selon la variante.
 * @param actions - Callbacks d’actions
 * @param variant - Rôle
 * @internal
 */
function colActions(actions?: FormationsTableActions, variant: 'admin' | 'secretaire' = 'admin'): ColumnDef<Formation> {
    return {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
            const formation = row.original;
            const customActions: CustomRowAction<Formation>[] = [];

            if (actions?.onView) {
                customActions.push({ label: 'Voir le détail', icon: <Eye className="mr-2 h-4 w-4" />, onClick: (f) => actions.onView!(f) });
            }
            if (actions?.onEdit && variant === 'admin') {
                customActions.push({ label: 'Modifier', icon: <Pencil className="mr-2 h-4 w-4" />, onClick: (f) => actions.onEdit!(f) });
            }
            if (actions?.onToggleActive && variant === 'admin') {
                customActions.push({
                    label: formation.actif ? 'Désactiver' : 'Activer',
                    icon: <Power className="mr-2 h-4 w-4" />,
                    onClick: (f) => actions.onToggleActive!(f),
                });
            }
            if (actions?.onViewTarifs && variant === 'admin') {
                customActions.push({ label: 'Historique des tarifs', icon: <History className="mr-2 h-4 w-4" />, onClick: (f) => actions.onViewTarifs!(f) });
            }

            const rowActionsConfig: RowActionsConfig<Formation> = {
                customActions,
                // Pas de suppression directe des formations (sauf désactivation)
            };
            return <DataTableRowActions row={formation} actions={rowActionsConfig} />;
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
 * Génère le tableau de colonnes pour le tableau des formations.
 *
 * @param options - Configuration (variant, actions, enrichments, columnConfig)
 * @returns Tableau de colonnes TanStack Table
 */
export function getFormationsColumns({
    variant = 'admin',
    actions,
    enrichments = {},
    columnConfig = {},
}: FormationsColumnsOptions): ColumnDef<Formation>[] {
    const {
        showNom = true,
        showCategorie = true,
        showPrix = true,
        showHeures = true,
        showNbInscriptions = true,
        showActif = true,
        showActions = true,
    } = columnConfig;

    const { getDureeFormatee, getNbInscriptions } = enrichments;

    const cols: ColumnDef<Formation>[] = [];

    if (showNom) cols.push(colNom());
    if (showCategorie) cols.push(colCategorie());
    if (showPrix) cols.push(colPrix());
    if (showHeures && variant === 'admin') cols.push(colHeures(getDureeFormatee));
    if (showNbInscriptions) cols.push(colNbInscriptions(getNbInscriptions));
    if (showActif) cols.push(colActif());
    if (showActions && actions && Object.keys(actions).length > 0) cols.push(colActions(actions, variant));

    return cols;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRÉ‑SETS PAR RÔLE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Colonnes pour la vue administrateur (toutes colonnes)
 */
export function getAdminFormationsColumns(
    actions?: FormationsTableActions,
    enrichments?: FormationsEnrichments,
    columnConfig = {}
): ColumnDef<Formation>[] {
    return getFormationsColumns({
        variant: 'admin',
        actions,
        enrichments,
        columnConfig: {
            showNom: true,
            showNbInscriptions: true,
            showCategorie: true,
            showPrix: true,
            showHeures: true,
            showActif: true,
            showActions: true,
            ...columnConfig,
        },
    });
}

/**
 * Colonnes pour la vue secrétaire (nom, catégorie, prix, actif)
 */
export function getSecretaireFormationsColumns(
    actions?: FormationsTableActions,
    columnConfig = {}
): ColumnDef<Formation>[] {
    return getFormationsColumns({
        variant: 'secretaire',
        actions,
        columnConfig: {
            showNom: true,
            showCategorie: true,
            showPrix: true,
            showNbInscriptions: true,
            showHeures: false,
            showActif: true,
            showActions: true,
            ...columnConfig,
        },
    });
}