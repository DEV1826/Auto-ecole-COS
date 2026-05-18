// src/components/tables/caisse/caisse-columns.tsx

/**
 * @module tables/caisse/caisse-columns
 * @description
 * Colonnes pour le tableau des mouvements de caisse de l’auto‑école COS.
 * Deux variantes disponibles :
 *
 * - `admin`      : affichage complet (date, type (ENTREE/SORTIE), montant, solde après,
 *                  description, référence, actions)
 * - `secretaire` : colonnes essentielles (date, type, montant, solde après, description)
 *
 * ## Architecture
 *
 * Les badges de type (`ENTREE` / `SORTIE`) utilisent `TYPE_MOUVEMENT_CONFIG` depuis `enums.ts`.
 * Le montant est coloré (vert pour les entrées, rouge pour les sorties).
 * Le solde après mouvement est affiché en format compact.
 *
 * ## Colonnes disponibles
 *
 * | Colonne         | Variante        | Description                                      |
 * |-----------------|-----------------|--------------------------------------------------|
 * | `date`          | toutes          | Date du mouvement (formatée avec tooltip)        |
 * | `type`          | toutes          | Badge Entrée / Sortie (avec icône)               |
 * | `montant`       | toutes          | Montant (formaté, vert/rouge selon le type)      |
 * | `soldeApres`    | toutes          | Solde après l’opération (format compact)         |
 * | `description`   | toutes          | Description enrichie (avatar + infos candidat/véhicule si disponible) |
 * | `reference`     | admin           | Référence externe (facture, paiement, etc.)      |
 * | `actions`       | admin           | Menu (voir détail, imprimer)                     |
 *
 * @see {@link CaisseColumnsOptions}
 * @see {@link CaisseTableActions}
 * @see {@link CaisseEnrichments}
 *
 * @author Stive Junior
 * @version 2.0.0
 */

import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    Calendar,
    Wallet,
    FileText,
    Receipt,
    Eye,
    Printer,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DataTableColumnHeader } from '@/components/tables/data-table-column-header';
import { DataTableRowActions } from '@/components/tables/data-table-row-actions';
import { cn } from '@/lib/utils';
import type { MouvementCaisse, CaisseEnrichments, CaisseColumnsOptions, CaisseTableActions } from '@/types/caisse.types';
import type { TypeMouvement } from '@/types/enums';
import { TYPE_MOUVEMENT_CONFIG } from '@/types/enums';
import type { RowActionsConfig, CustomRowAction } from '@/components/tables/types';
import { createAvatarWithTextColumn } from '../factory/column-factory';

// ─────────────────────────────────────────────────────────────────────────────
// UTILITAIRES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formate un montant en FCFA avec notation compacte.
 * @internal
 */
function formatMontant(montant: number): string {
    if (montant >= 1_000_000) return (montant / 1_000_000).toFixed(1) + 'M FCFA';
    if (montant >= 1_000) return (montant / 1_000).toFixed(1) + 'k FCFA';
    return montant.toLocaleString('fr-FR') + ' FCFA';
}

/**
 * Formate un nombre en compact (K, M) sans devise.
 * @internal
 */
function formatCompact(num: number): string {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
    return num.toLocaleString('fr-FR');
}

// ─────────────────────────────────────────────────────────────────────────────
// COLONNES FIXES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Colonne "Date" – formatée avec tooltip.
 * @internal
 */
function colDate(): ColumnDef<MouvementCaisse> {
    return {
        accessorKey: 'date',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Date" icon={Calendar} />,
        cell: ({ row }) => {
            const raw = row.original.date;
            const date = new Date(raw);
            if (isNaN(date.getTime())) return <span className="text-xs text-muted-foreground">—</span>;
            const formatted = format(date, 'd MMM yyyy', { locale: fr });
            const full = format(date, "d MMMM yyyy 'à' HH:mm", { locale: fr });
            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 text-xs cursor-default">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span className="capitalize">{formatted}</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>{full}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        },
        enableSorting: true,
        size: 110,
    };
}

/**
 * Colonne "Type" – badge Entrée / Sortie (depuis enums.ts)
 * @internal
 */
function colType(): ColumnDef<MouvementCaisse> {
    return {
        accessorKey: 'type',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
        cell: ({ row }) => {
            const type = row.original.type as TypeMouvement;
            const cfg = TYPE_MOUVEMENT_CONFIG[type];
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
 * Colonne "Montant" – formaté, vert pour entrée, rouge pour sortie.
 * @internal
 */
function colMontant(): ColumnDef<MouvementCaisse> {
    return {
        accessorKey: 'montant',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Montant (fcfa)" icon={Wallet} />,
        cell: ({ row }) => {
            const mouvement = row.original;
            const isEntree = mouvement.type === 'ENTREE';
            return (
                <span className={cn('text-sm font-semibold tabular-nums', isEntree ? 'text-emerald-600' : 'text-red-600')}>
                    {isEntree ? '+' : '−'}{mouvement.montant}
                </span>
            );
        },
        enableSorting: true,
        size: 130,
    };
}

/**
 * Colonne "Solde après" – formaté compact.
 * @internal
 */
function colSoldeApres(): ColumnDef<MouvementCaisse> {
    return {
        accessorKey: 'solde',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Solde après" icon={Receipt} />,
        cell: ({ row }) => {
            const solde = row.original.solde;
            return <span className="text-xs tabular-nums">{formatCompact(solde)} FCFA</span>;
        },
        enableSorting: true,
        size: 120,
    };
}

/**
 * Colonne "Description" – enrichie avec avatar + texte principal + texte secondaire (candidat/véhicule).
 * @param enrichments - Fonctions d’enrichissement pour obtenir les noms et avatars
 * @internal
 */
function colDescription(enrichments?: CaisseEnrichments): ColumnDef<MouvementCaisse> {

    const hasCandidateEnrichment = enrichments?.getNomCandidat || enrichments?.getCandidatAvatarUrl;


    // Construction du texte principal : la description originale ou une description générique
    const getPrimaryText = (mouvement: MouvementCaisse) => {
        if (mouvement.description) return mouvement.description;
        if (mouvement.type === 'ENTREE') return 'Encaissement';
        return 'Décaissement';
    };

    // Texte secondaire : nom du candidat ou véhicule
    const getSecondaryText = (mouvement: MouvementCaisse) => {
        if (enrichments?.getNomCandidat) {
            const nom = enrichments.getNomCandidat(mouvement);
            if (nom) return `Candidat : ${nom}`;
        }
        if (enrichments?.getVehiculeLibelle) {
            const vehicule = enrichments.getVehiculeLibelle(mouvement);
            if (vehicule) return `Véhicule : ${vehicule}`;
        }
        return '';
    };

    // Avatar : uniquement si on a des données candidat
    const getAvatarUrl = (mouvement: MouvementCaisse) => enrichments?.getCandidatAvatarUrl?.(mouvement) ?? '';
    const getInitials = (mouvement: MouvementCaisse) => {
        if (enrichments?.getCandidatInitials) return enrichments.getCandidatInitials(mouvement);
        const nom = enrichments?.getNomCandidat?.(mouvement) || enrichments?.getVehiculeLibelle?.(mouvement);
        if (nom) return nom.slice(0, 2).toUpperCase();
        return '?';
    };

    const hasAvatar = hasCandidateEnrichment && (getAvatarUrl({} as MouvementCaisse) || getInitials({} as MouvementCaisse));

    if (hasAvatar && enrichments) {
        return createAvatarWithTextColumn<MouvementCaisse>({
            accessorKey: 'description',
            title: 'Description',
            icon: FileText,
            getAvatarUrl,
            getInitials,
            getPrimaryText,
            getSecondaryText,
            avatarSize: 'md',
            img: false,
            enableSorting: false,
            size: 300,
        });
    }

    // Fallback : colonne texte simple avec tooltip
    return {
        accessorKey: 'description',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Description" icon={FileText} />,
        cell: ({ row }) => {
            const mouvement = row.original;
            const primary = getPrimaryText(mouvement);
            const secondary = getSecondaryText(mouvement);
            const fullText = secondary ? `${primary} (${secondary})` : primary;
            const truncated = fullText.length > 40 ? fullText.slice(0, 40) + '…' : fullText;
            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="text-xs cursor-default">{truncated}</span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">{fullText}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        },
        enableSorting: false,
        size: 200,
    };
}

/**
 * Colonne "Référence" – admin seulement.
 * @internal
 */
function colReference(): ColumnDef<MouvementCaisse> {
    return {
        accessorKey: 'reference',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Référence" icon={FileText} />,
        cell: ({ row }) => {
            const ref = row.original.reference;
            if (!ref) return <span className="text-xs text-muted-foreground">—</span>;
            return <span className="text-xs font-mono">{ref}</span>;
        },
        enableSorting: true,
        size: 140,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// COLONNE D’ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

function colActions(actions?: CaisseTableActions, variant: 'admin' | 'secretaire' = 'admin'): ColumnDef<MouvementCaisse> {
    if (variant !== 'admin') {
        return {
            id: 'actions',
            header: () => <span className="sr-only">Actions</span>,
            cell: () => null,
            enableSorting: false,
            enableHiding: false,
            size: 0,
        };
    }
    return {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
            const mouvement = row.original;
            const customActions: CustomRowAction<MouvementCaisse>[] = [];

            if (actions?.onView) {
                customActions.push({
                    label: 'Voir le détail',
                    icon: <Eye className="mr-2 h-4 w-4" />,
                    onClick: (m) => actions.onView!(m),
                });
            }
            if (actions?.onPrint) {
                customActions.push({
                    label: 'Imprimer',
                    icon: <Printer className="mr-2 h-4 w-4" />,
                    onClick: (m) => actions.onPrint!(m),
                });
            }

            const rowActionsConfig: RowActionsConfig<MouvementCaisse> = {
                customActions,
            };
            return <DataTableRowActions row={mouvement} actions={rowActionsConfig} />;
        },
        enableSorting: false,
        enableHiding: false,
        size: 50,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// FONCTION PRINCIPALE
// ─────────────────────────────────────────────────────────────────────────────

export function getCaisseColumns({
    variant = 'admin',
    actions,
    enrichments,
    columnConfig = {},
}: CaisseColumnsOptions): ColumnDef<MouvementCaisse>[] {
    const {
        showDate = true,
        showType = true,
        showMontant = true,
        showSoldeApres = true,
        showDescription = true,
        showReference = false,
        showActions = true,
    } = columnConfig;

    const cols: ColumnDef<MouvementCaisse>[] = [];

    if (showDate) cols.push(colDate());
    if (showType) cols.push(colType());
    if (showMontant) cols.push(colMontant());
    if (showSoldeApres) cols.push(colSoldeApres());
    if (showDescription) cols.push(colDescription(enrichments));
    if (showReference && variant === 'admin') cols.push(colReference());
    if (showActions && actions && Object.keys(actions).length > 0) cols.push(colActions(actions, variant));

    return cols;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRÉ‑SETS PAR RÔLE
// ─────────────────────────────────────────────────────────────────────────────

export function getAdminCaisseColumns(
    actions?: CaisseTableActions,
    enrichments?: CaisseEnrichments,
    columnConfig = {}
): ColumnDef<MouvementCaisse>[] {
    return getCaisseColumns({
        variant: 'admin',
        actions,
        enrichments,
        columnConfig: {
            showDate: true,
            showType: true,
            showMontant: true,
            showSoldeApres: true,
            showDescription: true,
            showReference: true,
            showActions: true,
            ...columnConfig,
        },
    });
}

export function getSecretaireCaisseColumns(
    actions?: CaisseTableActions,
    enrichments?: CaisseEnrichments,
    columnConfig = {}
): ColumnDef<MouvementCaisse>[] {
    return getCaisseColumns({
        variant: 'secretaire',
        actions,
        enrichments,
        columnConfig: {
            showDate: true,
            showType: true,
            showMontant: true,
            showSoldeApres: true,
            showDescription: true,
            showReference: false,
            showActions: false,
            ...columnConfig,
        },
    });
}