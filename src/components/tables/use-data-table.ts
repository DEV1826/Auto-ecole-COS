// src/components/tables/use-data-table.ts

/**
 * @module tables/use-data-table
 * @description Hook personnalisé pour gérer l'état d'un tableau TanStack Table avec options avancées
 * @author Stive Junior
 * @version 1.0.0
 */

import * as React from 'react';
import {
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';

/**
 * Propriétés du hook useDataTable
 */
interface UseDataTableProps<TData, TValue> {
  /** Données du tableau */
  data: TData[];
  /** Colonnes définies */
  columns: ColumnDef<TData, TValue>[];
  /** Activer la sélection des lignes */
  enableRowSelection?: boolean;
  /** Taille de page par défaut */
  defaultPageSize?: number;
  /** Options de tailles de page */
  pageSizeOptions?: number[];
  /** Visibilité initiale des colonnes */
  initialColumnVisibility?: Record<string, boolean>;
  /** Fonction pour générer un identifiant unique pour chaque ligne (utilisé pour le drag & drop) */
  getRowId?: (row: TData) => string;
  /** Active la pagination côté serveur / manuelle */
  manualPagination?: boolean;
  /** Nombre de pages disponibles pour la pagination manuelle */
  pageCount?: number;
  /** État de pagination piloté par le parent */
  paginationState?: {
    pageIndex: number;
    pageSize: number;
  };
  /** Callback appelé lors d'un changement de pagination */
  onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void;
}

/**
 * Hook central pour la configuration d'une table TanStack
 *
 * @example
 * ```tsx
 * const { table, pageSizeOptions } = useDataTable({
 *   data: users,
 *   columns: userColumns,
 *   enableRowSelection: true,
 *   getRowId: (row) => row.id,
 *   defaultPageSize: 10,
 * });
 * ```
 */
export function useDataTable<TData, TValue>({
  data,
  columns,
  enableRowSelection = true,
  defaultPageSize = 10,
  pageSizeOptions = [10, 20, 30, 40, 50],
  initialColumnVisibility = {},
  getRowId,
  manualPagination = false,
  pageCount,
  paginationState,
  onPaginationChange,
}: UseDataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(initialColumnVisibility);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState(() => ({
    pageIndex: paginationState?.pageIndex ?? 0,
    pageSize: paginationState?.pageSize ?? defaultPageSize,
  }));

  // Sync controlled pagination state from parent when provided
  React.useEffect(() => {
    if (!paginationState) return;
    setPagination((prev) => {
      if (prev.pageIndex === paginationState.pageIndex && prev.pageSize === paginationState.pageSize) {
        return prev;
      }
      return { pageIndex: paginationState.pageIndex, pageSize: paginationState.pageSize };
    });
  }, [paginationState?.pageIndex, paginationState?.pageSize]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    initialState: {
      pagination: { pageSize: defaultPageSize },
    },
    enableRowSelection,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      // updater may be a function or value
      const newState = typeof updater === 'function' ? updater(pagination) : updater;
      setPagination(newState);
      if (onPaginationChange) onPaginationChange(newState);
    },
    manualPagination,
    pageCount: manualPagination && pageCount ? pageCount : undefined,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getRowId,
  });

  return {
    table,
    pageSizeOptions,
  };
}
