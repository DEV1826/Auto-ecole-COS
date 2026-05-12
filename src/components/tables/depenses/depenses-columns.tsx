// src/components/tables/depenses/depenses-columns.tsx

/**
 * @module tables/depenses/depenses-columns
 * @description
 * Colonnes pour le tableau des dépenses de l’auto‑école COS.
 * Deux variantes disponibles :
 *
 * - `admin`      : affichage complet (date, catégorie, montant, description, fournisseur, véhicule, actions)
 * - `secretaire` : colonnes adaptées à la gestion quotidienne (date, catégorie, montant, description, actions)
 *
 * ## Architecture
 *
 * Ce module suit exactement le même pattern que `candidats-columns.tsx`.
 *
 * ## Colonnes disponibles
 *
 * | Colonne       | Variante        | Description                                      |
 * |---------------|-----------------|--------------------------------------------------|
 * | `date`        | toutes          | Date de la dépense (formatée avec tooltip)       |
 * | `categorie`   | toutes          | Catégorie de dépense (badge coloré)              |
 * | `montant`     | toutes          | Montant en FCFA (formaté, rouge)                 |
 * | `description` | toutes          | Description (texte tronqué avec tooltip)         |
 * | `fournisseur` | admin           | Nom du fournisseur / prestataire                 |
 * | `vehicule`    | admin           | Véhicule associé (via enrichissement)            |
 * | `actions`     | toutes          | Menu d’actions contextuelles                     |
 *
 * @see {@link DepensesColumnsOptions} Options de configuration
 * @see {@link DepensesTableActions} Callbacks d’actions
 * @see {@link DepensesEnrichments} Enrichissements optionnels
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @example
 * ```tsx
 * // Variante admin
 * const columns = getDepensesColumns({
 *   variant: 'admin',
 *   actions: { onView: (d) => navigate(`/depenses/${d.id}`) },
 *   enrichments: { getVehiculeImmatriculation: (d) => d.vehicule?.immatriculation ?? '—' },
 * });
 *
 * // Variante secretaire
 * const columns = getDepensesColumns({
 *   variant: 'secretaire',
 *   actions: { onEdit: (d) => navigate(`/depenses/${d.id}/edit`) },
 * });
 * ```
 */

import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Calendar,
  Tag,
  DollarSign,
  FileText,
  Building,
  Car,
  Eye,
  Pencil,
  Paperclip,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DataTableColumnHeader } from '@/components/tables/data-table-column-header';
import { DataTableRowActions } from '@/components/tables/data-table-row-actions';
import { cn } from '@/lib/utils';
import type { CategorieDepense } from '@/types/enums';
import { CATEGORIE_DEPENSE_CONFIG } from '@/types/enums';
import type { Depense, DepensesEnrichments } from '@/types/depenses.types';
import type { DepensesTableActions, DepensesColumnsOptions } from '@/types/depenses.types';
import type { RowActionsConfig, CustomRowAction } from '@/components/tables/types';

// ─────────────────────────────────────────────────────────────────────────────
// UTILITAIRES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formate un montant en FCFA avec notation compacte (k, M) et couleur.
 * @internal
 */
function formatMontant(montant: number): string {
  if (montant >= 1_000_000) return (montant / 1_000_000).toFixed(1) + 'M FCFA';
  if (montant >= 1_000) return (montant / 1_000).toFixed(1) + 'k FCFA';
  return montant.toLocaleString('fr-FR') + ' FCFA';
}

// ─────────────────────────────────────────────────────────────────────────────
// COLONNES COMMUNES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Colonne "Date" – formatée avec tooltip.
 * @internal
 */
function colDate(): ColumnDef<Depense> {
  return {
    accessorKey: 'date',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" icon={Calendar} />,
    cell: ({ row }) => {
      const raw = row.original.date;
      const date = new Date(raw);
      if (isNaN(date.getTime())) return <span className="text-xs text-muted-foreground">—</span>;
      const formatted = format(date, 'd MMM yyyy', { locale: fr });
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 text-xs cursor-default">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="capitalize">{formatted}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="text-xs">
              {format(date, "d MMMM yyyy 'à' HH:mm", { locale: fr })}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
    enableSorting: true,
    size: 110,
  };
}

/**
 * Colonne "Catégorie" – badge coloré.
 * @internal
 */
function colCategorie(): ColumnDef<Depense> {
  return {
    accessorKey: 'categorie',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Catégorie" icon={Tag} />,
    cell: ({ row }) => {
      const categorie = row.original.categorie as CategorieDepense;
      const cfg = CATEGORIE_DEPENSE_CONFIG[categorie];
      if (!cfg) return <span className="text-xs text-muted-foreground">—</span>;
      const Icon = cfg.icon;
      return (
        <Badge
          variant="outline"
          className={cn('gap-1.5 text-xs font-medium border-0', cfg.bgColor, cfg.textColor)}
        >
          <Icon className={cn('h-3 w-3 shrink-0', cfg.textColor)} />
          {cfg.label}
        </Badge>
      );
    },
    enableSorting: true,
    size: 120,
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
  };
}

/**
 * Colonne "Montant" – formaté en FCFA avec couleur rouge.
 * @internal
 */
function colMontant(): ColumnDef<Depense> {
  return {
    accessorKey: 'montant',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Montant" icon={DollarSign} />
    ),
    cell: ({ row }) => {
      const montant = row.original.montant;
      return (
        <span className="text-xs font-semibold text-red-600 dark:text-red-400 tabular-nums">
          {formatMontant(montant)}
        </span>
      );
    },
    enableSorting: true,
    size: 110,
  };
}

/**
 * Colonne "Description" – texte tronqué avec tooltip.
 * @internal
 */
function colDescription(): ColumnDef<Depense> {
  return {
    accessorKey: 'description',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" icon={FileText} />
    ),
    cell: ({ row }) => {
      const desc = row.original.description;
      if (!desc) return <span className="text-xs text-muted-foreground">—</span>;
      const truncated = desc.length > 40 ? desc.slice(0, 40) + '…' : desc;
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
    size: 200,
  };
}

/**
 * Colonne "Fournisseur" – optionnelle (admin seulement).
 * @internal
 */
function colFournisseur(): ColumnDef<Depense> {
  return {
    accessorKey: 'fournisseur',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Fournisseur" icon={Building} />
    ),
    cell: ({ row }) => {
      const fournisseur = row.original.fournisseur;
      if (!fournisseur) return <span className="text-xs text-muted-foreground">—</span>;
      return <span className="text-xs">{fournisseur}</span>;
    },
    enableSorting: true,
    size: 150,
  };
}

/**
 * Colonne "Véhicule" – via enrichissement (optionnelle, admin seulement).
 * @param getVehiculeLibelle - Fonction retournant le libellé du véhicule
 * @internal
 */
function colVehicule(getVehiculeLibelle: (d: Depense) => string): ColumnDef<Depense> {
  return {
    id: 'vehicule',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Véhicule" icon={Car} />,
    cell: ({ row }) => {
      const libelle = getVehiculeLibelle(row.original);
      return <span className="text-xs">{libelle || '—'}</span>;
    },
    enableSorting: false,
    size: 130,
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
function colActions(actions?: DepensesTableActions): ColumnDef<Depense> {
  return {
    id: 'actions',
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => {
      const depense = row.original;
      const customActions: CustomRowAction<Depense>[] = [];

      if (actions?.onView) {
        customActions.push({
          label: 'Voir le détail',
          icon: <Eye className="mr-2 h-4 w-4" />,
          onClick: (d) => actions.onView!(d),
        });
      }
      if (actions?.onEdit) {
        customActions.push({
          label: 'Modifier',
          icon: <Pencil className="mr-2 h-4 w-4" />,
          onClick: (d) => actions.onEdit!(d),
        });
      }
      if (actions?.onAttachReceipt) {
        customActions.push({
          label: 'Joindre un reçu',
          icon: <Paperclip className="mr-2 h-4 w-4" />,
          onClick: (d) => actions.onAttachReceipt!(d),
        });
      }

      const rowActionsConfig: RowActionsConfig<Depense> = {
        customActions,
        onDelete: actions?.onDelete,
      };
      return <DataTableRowActions row={depense} actions={rowActionsConfig} />;
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
 * Génère le tableau de colonnes pour le tableau des dépenses COS.
 *
 * @param options - Options de configuration (variant, actions, enrichments, columnConfig)
 * @returns Tableau de `ColumnDef<Depense>` pour TanStack Table
 *
 * @example
 * ```tsx
 * const columns = getDepensesColumns({
 *   variant: 'admin',
 *   actions: { onView: (d) => console.log(d) },
 *   enrichments: { getVehiculeLibelle: (d) => d.vehicule?.immatriculation ?? '—' },
 * });
 * ```
 */
export function getDepensesColumns({
  variant = 'admin',
  actions,
  enrichments = {},
  columnConfig = {},
}: DepensesColumnsOptions): ColumnDef<Depense>[] {
  const { getVehiculeLibelle } = enrichments;

  const {
    showDate = true,
    showCategorie = true,
    showMontant = true,
    showDescription = true,
    showFournisseur = false,
    showVehicule = false,
    showActions = true,
  } = columnConfig;

  const cols: ColumnDef<Depense>[] = [];

  if (showDate) cols.push(colDate());
  if (showCategorie) cols.push(colCategorie());
  if (showMontant) cols.push(colMontant());
  if (showDescription) cols.push(colDescription());

  if (showFournisseur && variant === 'admin') cols.push(colFournisseur());
  if (showVehicule && getVehiculeLibelle && variant === 'admin')
    cols.push(colVehicule(getVehiculeLibelle));

  if (showActions && actions && Object.keys(actions).length > 0) cols.push(colActions(actions));

  return cols;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRÉ-SETS PAR RÔLE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Colonnes pour le tableau des dépenses – vue administrateur.
 *
 * Inclut : date, catégorie, montant, description, fournisseur, véhicule (si enrichi), actions.
 */
export function getAdminDepensesColumns(
  actions?: DepensesTableActions,
  enrichments?: DepensesEnrichments,
  columnConfig = {}
): ColumnDef<Depense>[] {
  return getDepensesColumns({
    variant: 'admin',
    actions,
    enrichments,
    columnConfig: {
      showDate: true,
      showCategorie: true,
      showMontant: true,
      showDescription: true,
      showFournisseur: true,
      showVehicule: !!enrichments?.getVehiculeLibelle,
      showActions: true,
      ...columnConfig,
    },
  });
}

/**
 * Colonnes pour le tableau des dépenses – vue secrétaire.
 *
 * Inclut : date, catégorie, montant, description, actions.
 */
export function getSecretaireDepensesColumns(
  actions?: DepensesTableActions,
  columnConfig = {}
): ColumnDef<Depense>[] {
  return getDepensesColumns({
    variant: 'secretaire',
    actions,
    columnConfig: {
      showDate: true,
      showCategorie: true,
      showMontant: true,
      showDescription: true,
      showFournisseur: false,
      showVehicule: false,
      showActions: true,
      ...columnConfig,
    },
  });
}
