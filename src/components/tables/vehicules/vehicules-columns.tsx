// src/components/tables/vehicules/vehicules-columns.tsx

/**
 * @module tables/vehicules/vehicules-columns
 * @description
 * Colonnes pour le tableau des véhicules de l’auto‑école COS.
 * Deux variantes disponibles :
 *
 * - `admin`      : affichage complet (immatriculation, marque+modèle (avec avatar),
 *                  catégorie, kilométrage, statut (badge), prochaine révision, actions)
 * - `secretaire` : colonnes essentielles (immatriculation, marque+modèle, statut, actions)
 *
 * ## Architecture
 *
 * La colonne principale "Marque/Modèle" utilise `createAvatarWithTextColumn` pour afficher
 * un logo de marque (via enrichissement) ou une icône par défaut (`/images/icons/car-placeholder.svg`).
 * Le kilométrage est formaté avec séparateurs (ex: "12 500 km").
 * La prochaine révision est colorée en orange/rouge si échue (via enrichissement `isRevisionDue`).
 *
 * ## Colonnes disponibles
 *
 * | Colonne            | Variante        | Description                                      |
 * |--------------------|-----------------|--------------------------------------------------|
 * | `immatriculation`  | toutes          | Plaque d’immatriculation (en gras, mono)         |
 * | `marqueModele`     | toutes          | Logo + marque + modèle (admin) / texte seul (sec.)|
 * | `categorie`        | admin           | Badge catégorie de permis (A/B/C/D/BE)          |
 * | `kilometrage`      | admin           | Kilométrage actuel (formaté)                     |
 * | `statut`           | toutes          | Badge Disponible / En leçon / Entretien / HS     |
 * | `prochaineRevision`| admin           | Prochain kilométrage de révision (avec alerte)   |
 * | `actions`          | admin/secrétaire| Menu (voir, modifier, entretiens, ajouter dépense)|
 *
 * @see {@link VehiculesColumnsOptions}
 * @see {@link VehiculesEnrichments}
 * @see {@link VehiculesTableActions}
 *
 * @author Stive Junior
 * @version 2.0.0
 *
 * @example
 * ```tsx
 * const columns = getAdminVehiculesColumns(actions, {
 *   getMarqueModeleComplet: (v) => `${v.marque} ${v.modele}`,
 *   getAvatarUrl: (v) => `/images/brands/${v.marque.toLowerCase()}.svg`,
 *   getInitials: (v) => `${v.marque[0]}${v.modele[0]}`,
 *   isRevisionDue: (v) => v.kilometrage >= (v.prochaineRevisionKm ?? Infinity),
 * });
 * ```
 */

import type { ColumnDef } from '@tanstack/react-table';
import { Car, Gauge, Calendar, Wrench, Eye, Pencil, History, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/tables/data-table-column-header';
import { DataTableRowActions } from '@/components/tables/data-table-row-actions';
import { createAvatarWithTextColumn } from '@/components/tables/factory';
import { cn } from '@/lib/utils';
import type { Vehicule, VehiculesEnrichments, VehiculesColumnsOptions, VehiculesTableActions } from '@/types/vehicules.types';
import type { CategoriePermis, StatutVehicule } from '@/types/enums';
import { CATEGORIE_PERMIS_CONFIG, STATUT_VEHICULE_CONFIG } from '@/types/enums';
import type { RowActionsConfig, CustomRowAction } from '@/components/tables/types';

// ─────────────────────────────────────────────────────────────────────────────
// UTILITAIRES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formate un kilométrage avec séparateurs de milliers (ex: "12 500 km").
 * @internal
 */
function formatKm(km: number): string {
  return km.toLocaleString('fr-FR') + ' km';
}

/**
 * Icône par défaut pour les véhicules (fallback).
 * @internal
 */
const DEFAULT_VEHICLE_ICON = '/images/icons/car-placeholder.svg';

// ─────────────────────────────────────────────────────────────────────────────
// COLONNES FIXES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Colonne "Immatriculation" – formatée en majuscules, police monospace.
 * @internal
 */
function colImmatriculation(): ColumnDef<Vehicule> {
  return {
    accessorKey: 'immatriculation',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Immatriculation" icon={Car} />,
    cell: ({ row }) => (
      <span className="text-sm font-mono font-semibold uppercase tracking-wide">
        {row.original.immatriculation}
      </span>
    ),
    enableSorting: true,
    size: 140,
  };
}

/**
 * Colonne "Marque / Modèle" – avec avatar (logo) pour admin, texte simple pour secrétaire.
 * @param enrichments - Enrichissements (logo, init, libellé complet)
 * @param variant - admin ou secretaire
 * @internal
 */
function colMarqueModele(enrichments: VehiculesEnrichments, variant: 'admin' | 'secretaire'): ColumnDef<Vehicule> {
  const { getMarqueModeleComplet, getAvatarUrl, getInitials } = enrichments;
  const defaultLibelle = (v: Vehicule) => `${v.marque} ${v.modele}`;
  const libelle = getMarqueModeleComplet ?? defaultLibelle;

  if (variant === 'admin' && (getAvatarUrl || getInitials)) {
    return createAvatarWithTextColumn<Vehicule>({
      accessorKey: 'marque',
      title: 'Marque / Modèle',
      icon: Car,
      getAvatarUrl: (v) => getAvatarUrl?.(v) ?? DEFAULT_VEHICLE_ICON,
      getInitials: (v) => getInitials?.(v) ?? `${v.marque[0]}${v.modele[0]}`,
      getPrimaryText: (v) => libelle(v),
      avatarSize: 'md',
      enableSorting: true,
      size: 240,
    });
  }
  // Version simplifiée (secrétaire)
  return {
    accessorKey: 'marque',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Marque / Modèle" />,
    cell: ({ row }) => <span className="text-sm font-medium">{libelle(row.original)}</span>,
    enableSorting: true,
    size: 180,
  };
}

/**
 * Colonne "Catégorie de permis" – badge.
 * @internal
 */
function colCategorie(): ColumnDef<Vehicule> {
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
    size: 100,
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
  };
}

/**
 * Colonne "Kilométrage" – formaté.
 * @internal
 */
function colKilometrage(): ColumnDef<Vehicule> {
  return {
    accessorKey: 'kilometrage',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Kilométrage" icon={Gauge} />,
    cell: ({ row }) => <span className="text-sm tabular-nums">{formatKm(row.original.kilometrage)}</span>,
    enableSorting: true,
    size: 120,
  };
}

/**
 * Colonne "Statut" – badge avec icône.
 * @internal
 */
function colStatut(): ColumnDef<Vehicule> {
  return {
    accessorKey: 'statut',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Statut" />,
    cell: ({ row }) => {
      const statut = row.original.statut as StatutVehicule;
      const cfg = STATUT_VEHICULE_CONFIG[statut];
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
    size: 120,
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
  };
}

/**
 * Colonne "Prochaine révision" – avec alerte si échue.
 * @param enrichments - Pour `getProchaineRevisionKm` et `isRevisionDue`
 * @internal
 */
function colProchaineRevision(enrichments: VehiculesEnrichments): ColumnDef<Vehicule> {
  const { getProchaineRevisionKm, isRevisionDue } = enrichments;
  if (!getProchaineRevisionKm) {
    return {
      id: 'prochaineRevision',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Prochaine révision" icon={Calendar} />,
      cell: () => <span className="text-xs text-muted-foreground">—</span>,
      enableSorting: false,
      size: 130,
    };
  }
  return {
    id: 'prochaineRevision',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Prochaine révision" icon={Calendar} />,
    cell: ({ row }) => {
      const km = getProchaineRevisionKm(row.original);
      if (!km) return <span className="text-xs text-muted-foreground">—</span>;
      const due = isRevisionDue?.(row.original) ?? false;
      return (
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className={cn('text-xs tabular-nums', due && 'text-amber-600 dark:text-amber-400 font-semibold')}>
            {formatKm(km)}
          </span>
          {due && <AlertCircle className="h-3 w-3 text-amber-500" aria-label="Révision due" />}
        </div>
      );
    },
    enableSorting: true,
    sortingFn: (a, b) => (getProchaineRevisionKm(a.original) ?? 0) - (getProchaineRevisionKm(b.original) ?? 0),
    size: 150,
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
function colActions(actions?: VehiculesTableActions, variant: 'admin' | 'secretaire' = 'admin'): ColumnDef<Vehicule> {
  return {
    id: 'actions',
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => {
      const vehicule = row.original;
      const customActions: CustomRowAction<Vehicule>[] = [];

      if (actions?.onView) {
        customActions.push({ label: 'Voir le détail', icon: <Eye className="mr-2 h-4 w-4" />, onClick: (v) => actions.onView!(v) });
      }
      if (actions?.onEdit && variant === 'admin') {
        customActions.push({ label: 'Modifier', icon: <Pencil className="mr-2 h-4 w-4" />, onClick: (v) => actions.onEdit!(v) });
      }
      if (actions?.onViewEntretiens && variant === 'admin') {
        customActions.push({ label: 'Historique des entretiens', icon: <History className="mr-2 h-4 w-4" />, onClick: (v) => actions.onViewEntretiens!(v) });
      }
      if (actions?.onRecordMaintenance && variant === 'admin') {
        customActions.push({ label: 'Enregistrer un entretien', icon: <Wrench className="mr-2 h-4 w-4" />, onClick: (v) => actions.onRecordMaintenance!(v) });
      }

      const rowActionsConfig: RowActionsConfig<Vehicule> = {
        customActions,
        onDelete: variant === 'admin' ? actions?.onDelete : undefined,
      };
      return <DataTableRowActions row={vehicule} actions={rowActionsConfig} />;
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
 * Génère le tableau de colonnes pour le tableau des véhicules.
 *
 * @param options - Configuration (variant, actions, enrichments, columnConfig)
 * @returns Tableau de colonnes TanStack Table
 */
export function getVehiculesColumns({
  variant = 'admin',
  actions,
  enrichments = {},
  columnConfig = {},
}: VehiculesColumnsOptions): ColumnDef<Vehicule>[] {
  const {
    showImmatriculation = true,
    showMarqueModele = true,
    showCategorie = true,
    showKilometrage = true,
    showStatut = true,
    showProchaineRevision = true,
    showActions = true,
  } = columnConfig;

  const cols: ColumnDef<Vehicule>[] = [];

  if (showImmatriculation) cols.push(colImmatriculation());
  if (showMarqueModele) cols.push(colMarqueModele(enrichments, variant));
  if (showCategorie && variant === 'admin') cols.push(colCategorie());
  if (showKilometrage && variant === 'admin') cols.push(colKilometrage());
  if (showStatut) cols.push(colStatut());
  if (showProchaineRevision && variant === 'admin') cols.push(colProchaineRevision(enrichments));
  if (showActions && actions && Object.keys(actions).length > 0) cols.push(colActions(actions, variant));

  return cols;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRÉ‑SETS PAR RÔLE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Colonnes pour la vue administrateur (toutes colonnes + avatar + révision due)
 */
export function getAdminVehiculesColumns(
  actions?: VehiculesTableActions,
  enrichments?: VehiculesEnrichments,
  columnConfig = {}
): ColumnDef<Vehicule>[] {
  return getVehiculesColumns({
    variant: 'admin',
    actions,
    enrichments,
    columnConfig: {
      showImmatriculation: true,
      showMarqueModele: true,
      showCategorie: true,
      showKilometrage: true,
      showStatut: true,
      showProchaineRevision: true,
      showActions: true,
      ...columnConfig,
    },
  });
}

/**
 * Colonnes pour la vue secrétaire (colonnes essentielles)
 */
export function getSecretaireVehiculesColumns(
  actions?: VehiculesTableActions,
  enrichments?: VehiculesEnrichments,
  columnConfig = {}
): ColumnDef<Vehicule>[] {
  return getVehiculesColumns({
    variant: 'secretaire',
    actions,
    enrichments,
    columnConfig: {
      showImmatriculation: true,
      showMarqueModele: true,
      showCategorie: false,
      showKilometrage: false,
      showStatut: true,
      showProchaineRevision: false,
      showActions: true,
      ...columnConfig,
    },
  });
}