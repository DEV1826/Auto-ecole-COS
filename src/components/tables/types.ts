// src/components/tables/types.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ColumnDef, Table } from '@tanstack/react-table';
import type { LucideIcon } from 'lucide-react';
import type React from 'react';

/**
 * Option de filtre facetté
 */
export interface FacetedFilterOption {
  /** Libellé affiché */
  label: string;
  /** Valeur de filtrage */
  value: any;
  /** Icône optionnelle */
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * Configuration d'un filtre facetté
 */
export interface FacetedFilterConfig {
  /** Identifiant de la colonne cible */
  columnId: string;
  /** Titre du filtre */
  title: string;
  /** Liste des options */
  options: FacetedFilterOption[];
}

/**
 * Props de la barre d'outils
 * @template TData - Type des données de la table
 */
export interface DataTableToolbarProps<TData> {
  /** Instance de la table TanStack */
  table: Table<TData>;
  /** Colonne utilisée pour la recherche textuelle (défaut: 'title') */
  searchColumn?: string;
  /** Placeholder du champ de recherche */
  searchPlaceholder?: string;
  /** Filtres facettés à afficher */
  facetedFilters?: FacetedFilterConfig[];
  /** Texte du bouton d'ajout */
  addButtonText?: string;
  /** Action du bouton d'ajout */
  onAddClick?: () => void;
  /** Actions supplémentaires (éléments React) */
  extraActions?: React.ReactNode;
}

/**
 * Props des options d'affichage des colonnes
 */
export interface DataTableViewOptionsProps<TData> {
  /** Instance de la table */
  table: Table<TData>;
}

/**
 * Props de la pagination
 */
export interface DataTablePaginationProps<TData> {
  /** Instance de la table */
  table: Table<TData>;
  /** Options de tailles de page (défaut: [10,20,30,40,50]) */
  pageSizeOptions?: number[];
}

/**
 * Props de l'en-tête de colonne avec tri
 */
export interface DataTableColumnHeaderProps<TData, TValue> {
  /** Colonne concernée */
  column: ColumnDef<TData, TValue> & {
    getIsSorted?: () => string | false;
    toggleSorting?: (desc: boolean) => void;
    getCanSort?: () => boolean;
    toggleVisibility?: (visible: boolean) => void;
  };
  /** Titre affiché */
  title: string;
  /** Icône */
  icon?: React.ComponentType<{ className?: string }>;
  /** Classes CSS additionnelles */
  className?: string;
}

/**
 * Props du filtre facetté
 */
export interface DataTableFacetedFilterProps<TData, TValue> {
  /** Colonne concernée (optionnelle) */
  column?: ColumnDef<TData, TValue> & {
    getFilterValue?: () => any;
    setFilterValue?: (value: any) => void;
    getFacetedUniqueValues?: () => Map<any, number>;
  };
  /** Titre du filtre */
  title?: string;
  /** Options disponibles */
  options: FacetedFilterOption[];
}

export interface CustomRowAction<TData> {
  label: string;
  className?: string;
  icon?: React.ReactNode;
  onClick?: (row: TData) => void; // optionnel si sous-menu
  /** Sous‑menu imbriqué (ex: formats d’export). Si présent, `onClick` est ignoré. */
  submenu?: CustomRowAction<TData>[];
}

/**
 * Configuration des actions de ligne
 */
export interface RowActionsConfig<TData> {
  /** Action d'édition */
  onEdit?: (row: TData) => void;
  /** Action de suppression */
  onDelete?: (row: TData) => void;
  /** Action de duplication */
  onDuplicate?: (row: TData) => void;
  /** Actions personnalisées supplémentaires */
  customActions?: CustomRowAction<TData>[];
}

/**
 * Props du composant d'actions de ligne
 */
export interface DataTableRowActionsProps<TData> {
  /** Ligne concernée */
  row: TData;
  /** Configuration des actions */
  actions?: RowActionsConfig<TData>;
}

/**
 * Props du composant principal DataTable
 * @template TData - Type des données
 * @template TValue - Type des valeurs (générique)
 */
export interface DataTableProps<TData, TValue> {
  /**Icon */
  icon?: LucideIcon;
  /** Colonnes définies par l'utilisateur */
  columns: ColumnDef<TData, TValue>[];
  /** Données à afficher */
  data: TData[];
  /** Classes CSS additionnelles */
  className?: string;
  /** Activer la sélection des lignes */
  enableRowSelection?: boolean;
  /** Activer la pagination */
  enablePagination?: boolean;
  /** Activer la barre d'outils */
  enableToolbar?: boolean;
  /** Activer le glisser-déposer pour réordonner les lignes */
  enableDragAndDrop?: boolean;
  /** Taille de page par défaut */
  defaultPageSize?: number;
  /** Options de tailles de page disponibles */
  pageSizeOptions?: number[];
  /** Placeholder du champ de recherche */
  searchPlaceholder?: string;
  /** Colonne utilisée pour la recherche globale */
  searchColumn?: string;
  /** Filtres facettés personnalisés */
  facetedFilters?: FacetedFilterConfig[];
  /** Actions supplémentaires à afficher dans la barre d'outils */
  extraActions?: React.ReactNode;
  /** Texte du bouton d'ajout */
  addButtonText?: string;
  /** Action du bouton d'ajout */
  onAddClick?: () => void;
  /** Actions sur les lignes (éditer, supprimer, etc.) */
  rowActions?: RowActionsConfig<TData>;
  /** État initial de visibilité des colonnes */
  initialColumnVisibility?: Record<string, boolean>;
  /** Message affiché quand aucun résultat */
  emptyMessage?: string;
  /** Action affiché quand aucun résultat */
  onEmptyClick?: () => void;
  /** label de l'action */
  onEmptyActionLabel?: string;
  EmptyActionIcon?: LucideIcon;
  /** État de chargement */
  isLoading?: boolean;
  /** Nombre de lignes skeleton à afficher */
  skeletonRows?: number;
  /** Fonction appelée lorsque l'ordre des lignes change (drag & drop) */
  onReorder?: (newData: TData[]) => void;
  /** Fonction appelée lorsque l'utilisateur clique sur une ligne */
  onRowClick?: (row: TData) => void;
  /** Identifiant unique utilisé pour le drag & drop (défaut: 'id') */
  dragIdKey?: keyof TData;
}

export interface DragHandleProps {
  /** Attributs dnd‑kit (à passer depuis le parent sortable) */
  attributes?: any;
  /** Listeners dnd‑kit */
  listeners?: any;
  /** Classes additionnelles */
  className?: string;
}

export interface DataTableEmptyProps<TData> {
  /** Instance de la table TanStack */
  table: Table<TData>;
  /** Indique si des filtres sont actifs (détermine le message) */
  hasFilters?: boolean;
  /** Callback pour créer un nouvel élément */
  onCreateNew?: () => void;
  /** Afficher le bouton de création (si `onCreateNew` fourni) */
  canCreate?: boolean;
  /** Message personnalisé (remplace le message par défaut) */
  message?: string;
  /** Description supplémentaire */
  description?: string;
  /** Icône personnalisée (remplace l'icône par défaut) */
  icon?: LucideIcon;
  /**  Icône personnalisée (remplace l'icône par défaut) */
  EmptyActionIcon?: LucideIcon;
  /** Titre personnalisé */
  title?: string;
  /** Texte du bouton de création (défaut: "Créer") */
  createButtonText?: string;
  /** Texte du bouton de réinitialisation (défaut: "Effacer les filtres") */
  resetButtonText?: string;
  /** Classes additionnelles */
  className?: string;
}
