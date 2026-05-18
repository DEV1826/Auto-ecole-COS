// src/components/tables/depenses/depenses-columns.tsx

/**
 * @module tables/depenses/depenses-columns
 * @description
 * Colonnes pour le tableau des dépenses de l’auto‑école COS.
 * Deux variantes disponibles :
 *
 * - `admin`      : affichage complet (date, catégorie, montant, description avec icône,
 *                  fournisseur, référence, véhicule, actions)
 * - `secretaire` : colonnes essentielles (date, catégorie, montant, description, actions)
 *
 * ## Architecture
 *
 * - La colonne "Description" affiche une icône contextuelle basée sur la catégorie,
 *   et peut être enrichie avec un avatar du fournisseur (optionnel).
 * - La colonne "Référence" est disponible en vue admin.
 * - La colonne "Véhicule" utilise un enrichissement pour afficher un libellé personnalisé.
 *
 * @see {@link DepensesColumnsOptions}
 * @see {@link DepensesTableActions}
 * @see {@link DepensesEnrichments}
 *
 * @author Stive Junior
 * @version 2.0.0
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
  Hash,
  Eye,
  Pencil,
  Paperclip,
  Fuel,
  Wrench,
  Briefcase,
  Building2,
  Zap,
  Phone,
  Shield,
  Megaphone,
  Package,
  Landmark,
  MoreHorizontal,
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
import { createAvatarWithTextColumn } from '../factory';

// ─────────────────────────────────────────────────────────────────────────────
// MAPPING ICÔNES PAR CATÉGORIE (sur mesure si besoin)
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_ICON_MAP: Record<CategorieDepense, React.ElementType> = {
  CARBURANT: Fuel,
  ENTRETIEN_VEHICULE: Wrench,
  SALAIRE: Briefcase,
  LOYER: Building2,
  ELECTRICITE: Zap,
  TELEPHONE: Phone,
  ASSURANCE: Shield,
  PUBLICITE: Megaphone,
  FOURNITURES: Package,
  TAXES: Landmark,
  AUTRE: MoreHorizontal,
};

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
 * Colonne "Catégorie" – badge coloré avec icône.
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
    size: 130,
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
 * Colonne "Description" enrichie – avec icône contextuelle (selon catégorie) et tooltip.
 * Optionnellement peut afficher un avatar du fournisseur si enrichi.
 * @param enrichments - Pour récupérer éventuellement un avatar du fournisseur
 * @internal
 */
function colDescription(): ColumnDef<Depense> {

  const getIconForCategory = (categorie: CategorieDepense) => {
    const Icon = CATEGORY_ICON_MAP[categorie] || MoreHorizontal;
    return <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />;
  };

  return {
    accessorKey: 'description',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" icon={FileText} />
    ),
    cell: ({ row }) => {
      const depense = row.original;
      const desc = depense.description || '—';
      const categorie = depense.categorie;
      const icon = getIconForCategory(categorie);

      // Texte secondaire éventuel : fournisseur ou référence (si on veut)
      const secondaryText = depense.fournisseur ? `Fournisseur : ${depense.fournisseur}` : null;

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 cursor-default group min-w-0">
                <div className="shrink-0">{icon}</div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs truncate">{desc.length > 40 ? desc.slice(0, 40) + '…' : desc}</span>
                  {secondaryText && (
                    <span className="text-[10px] text-muted-foreground truncate">{secondaryText}</span>
                  )}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">
              <div className="space-y-1">
                <p>{desc}</p>
                {depense.fournisseur && <p className="text-muted-foreground">Fournisseur : {depense.fournisseur}</p>}
                {depense.reference && <p className="text-muted-foreground">Réf : {depense.reference}</p>}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
    enableSorting: false,
    size: 220,
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
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs cursor-default">{fournisseur}</span>
            </TooltipTrigger>
            <TooltipContent className="text-xs">{fournisseur}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
    enableSorting: true,
    size: 150,
  };
}

/**
 * Colonne "Référence" – optionnelle (admin seulement).
 * @internal
 */
function colReference(): ColumnDef<Depense> {
  return {
    accessorKey: 'reference',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Référence" icon={Hash} />,
    cell: ({ row }) => {
      const ref = row.original.reference;
      if (!ref) return <span className="text-xs text-muted-foreground">—</span>;
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs font-mono cursor-default">{ref}</span>
            </TooltipTrigger>
            <TooltipContent className="text-xs">{ref}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
    enableSorting: true,
    size: 130,
  };
}

/**
 * Colonne "Véhicule" – via enrichissement (optionnelle, admin seulement).
 * @param getVehiculeLibelle - Fonction retournant le libellé du véhicule
 * @internal
 */
function colVehicule(getVehiculeLibelle: (d: Depense) => string): ColumnDef<Depense> {



  return createAvatarWithTextColumn<Depense>({
    accessorKey: 'marque',
    title: 'Véhicule',
    icon: Car,
    getAvatarUrl: (d) => '/images/brand/car.png',
    getInitials: (d) => `${d.vehicule?.marque[0]}${d.vehicule?.modele[0]}`,
    getPrimaryText: (d) => getVehiculeLibelle(d),
    avatarSize: 'md',

    img: true,
    enableSorting: true,
    size: 240,
    cellClassName: 'text-sm font-medium',
  });

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
    showReference = false,
    showVehicule = false,
    showActions = true,
  } = columnConfig;

  const cols: ColumnDef<Depense>[] = [];

  if (showDate) cols.push(colDate());
  if (showCategorie) cols.push(colCategorie());
  if (showMontant) cols.push(colMontant());
  if (showDescription) cols.push(colDescription());

  if (showFournisseur && variant === 'admin') cols.push(colFournisseur());
  if (showReference && variant === 'admin') cols.push(colReference());
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
 * Inclut : date, catégorie, montant, description enrichie, fournisseur, référence, véhicule (si enrichi), actions.
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
      showReference: true,
      showVehicule: !!enrichments?.getVehiculeLibelle,
      showActions: true,
      ...columnConfig,
    },
  });
}

/**
 * Colonnes pour le tableau des dépenses – vue secrétaire.
 * Inclut : date, catégorie, montant, description enrichie, actions.
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
      showReference: false,
      showVehicule: false,
      showActions: true,
      ...columnConfig,
    },
  });
}