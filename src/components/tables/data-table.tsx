// src/components/tables/data-table.tsx

/**
 * @module tables/data-table
 * @description Tableau de données complet avec sélection, pagination, tri, filtres, drag & drop
 */

import * as React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { flexRender, type ColumnDef } from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DataTablePagination } from './data-table-pagination';
import { DataTableToolbar } from './data-table-toolbar';
import { DataTableSkeleton } from './data-table-skeleton';
import { DragHandle } from './data-table-drag-handle';
import { DataTableRowActions } from './data-table-row-actions';
import { useDataTable } from './use-data-table';
import { DataTableEmpty } from './data-table-empty';
import { cn } from '@/lib/utils';
import type { DataTableProps } from './types';
import { Checkbox } from '../ui/checkbox';
import { DraggableTableRow } from './data-table-draggable-row';

/**
 * Tableau de données complet avec toutes les fonctionnalités :
 * - Sélection des lignes (checkbox)
 * - Pagination
 * - Tri des colonnes
 * - Filtrage textuel et facetté
 * - Personnalisation des colonnes visibles
 * - Chargement squelette
 * - Glisser-déposer pour réordonner les lignes (optionnel)
 * - Actions contextuelles sur chaque ligne
 *
 * @example
 * ```tsx
 * const columns: ColumnDef<User>[] = [
 *   {
 *     accessorKey: "name",
 *     header: ({ column }) => <DataTableColumnHeader column={column} title="Nom" />,
 *   },
 *   {
 *     accessorKey: "email",
 *     header: "Email",
 *   },
 * ];
 *
 * <DataTable
 *   columns={columns}
 *   data={users}
 *   enableRowSelection
 *   enableDragAndDrop
 *   onReorder={(newData) => setUsers(newData)}
 *   rowActions={{
 *     onEdit: (user) => console.log(user),
 *     onDelete: (user) => console.log(user),
 *   }}
 * />
 * ```
 */
export function DataTable<TData, TValue>({
  icon,
  columns,
  data,
  className,
  enableRowSelection = true,
  enablePagination = true,
  enableToolbar = true,
  enableDragAndDrop = false,
  defaultPageSize = 5,
  pageSizeOptions = [5, 10, 20, 30, 40, 50],
  searchPlaceholder = 'Rechercher...',
  searchColumn = 'title',
  facetedFilters = [],
  addButtonText = 'Ajouter',
  extraActions = [],
  onAddClick,
  onRowClick,
  rowActions,
  initialColumnVisibility = {},
  emptyMessage = 'Aucun résultat.',
  onEmptyClick,
  onEmptyActionLabel,
  EmptyActionIcon,
  isLoading = false,
  skeletonRows = 5,
  onReorder,
  dragIdKey = 'id' as keyof TData,
}: DataTableProps<TData, TValue>) {
  const [localData, setLocalData] = React.useState(data);
  React.useEffect(() => setLocalData(data), [data]);

  const enhancedColumns = React.useMemo(() => {
    let enhanced: ColumnDef<TData, TValue>[] = [...columns];

    // Colonne de sélection en deuxième
    if (enableRowSelection) {
      enhanced = [
        {
          id: 'select',
          header: ({ table }) => (
            <div className="flex items-center justify-center">
              <Checkbox
                checked={
                  table.getIsAllPageRowsSelected() ||
                  (table.getIsSomePageRowsSelected() && 'indeterminate')
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Tout sélectionner"
                className="translate-y-0.5"
              />
            </div>
          ),
          cell: ({ row }) => (
            <div className="flex items-center justify-center">
              <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Sélectionner la ligne"
                className="translate-y-0.5"
              />
            </div>
          ),
          enableSorting: false,
          enableHiding: false,
          size: 40,
        },

        ...enhanced,
      ];
    }

    // Colonne de glissement (drag handle) en premier
    if (enableDragAndDrop) {
      enhanced = [
        {
          id: 'drag',
          header: () => null,
          cell: ({ row }) => <DragHandle id={row.id} />,
          enableSorting: false,
          enableHiding: false,
          size: 40,
        },
        ...enhanced,
      ];
    }

    const actionsIndex = enhanced.findIndex((col) => col.id === 'actions');
    let actionsColumn: ColumnDef<TData, TValue> | undefined;
    if (actionsIndex !== -1) {
      actionsColumn = enhanced[actionsIndex];
      enhanced.splice(actionsIndex, 1);
    }

    // Ajouter la colonne d'actions à la fin
    if (actionsColumn) {
      enhanced = [...enhanced, actionsColumn];
    } else if (rowActions) {
      enhanced = [
        ...enhanced,
        {
          id: 'actions',
          cell: ({ row }: { row: { original: TData } }) => (
            <DataTableRowActions row={row.original} actions={rowActions} />
          ),
          enableSorting: false,
          enableHiding: false,
          size: 50,
        },
      ];
    }

    return enhanced;
  }, [columns, enableDragAndDrop, enableRowSelection, rowActions]);

  // Fonction pour générer un identifiant unique pour chaque ligne (nécessaire pour le drag & drop)
  const getRowId = React.useCallback(
    (row: TData) => {
      const id = row[dragIdKey];
      return id != null ? String(id) : crypto.randomUUID?.() || Math.random().toString();
    },
    [dragIdKey]
  );

  const { table, pageSizeOptions: psOptions } = useDataTable({
    data: localData,
    columns: enhancedColumns,
    enableRowSelection,
    defaultPageSize,
    pageSizeOptions,
    initialColumnVisibility,
    getRowId: enableDragAndDrop ? getRowId : undefined,
  });

  // Dans le composant DataTable, après la déclaration de table
  const hasActiveFilters =
    table.getState().columnFilters.length > 0 || !!table.getState().globalFilter;

  // 2. Mémoïsation des IDs pour éviter les re-calculs qui font ramer dnd-kit

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => localData.map((item) => String(item[dragIdKey] ?? '')),
    [localData, dragIdKey]
  );

  // 3. Capteurs optimisés
  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  // Gestionnaire de fin de glissement
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = dataIds.indexOf(String(active.id));
      const newIndex = dataIds.indexOf(String(over.id));
      const newData = arrayMove(localData, oldIndex, newIndex);
      setLocalData(newData);
      onReorder?.(newData);
    }
  }

  if (isLoading) {
    return <DataTableSkeleton columns={enhancedColumns.length} rows={skeletonRows} />;
  }

  // Rendu du tableau avec Drag & Drop amélioré
  const tableContent = enableDragAndDrop ? (
    <DndContext
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
      sensors={sensors}
      id={sortableId}
    >
      <div className="overflow-hidden rounded-xs border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) =>
                  enableDragAndDrop ? (
                    <DraggableTableRow
                      key={row.id}
                      row={row}
                      isSelected={row.getIsSelected()}
                      onRowClick={onRowClick}
                    />
                  ) : (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      className={cn(
                        'group/row cursor-pointer transition-colors',
                        'hover:bg-blue-50/50 dark:hover:bg-blue-950/10'
                      )}
                      onClick={() => onRowClick?.(row.original)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  )
                )
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <DataTableEmpty
                      table={table}
                      icon={icon}
                      hasFilters={hasActiveFilters}
                      title={emptyMessage}
                      onCreateNew={onEmptyClick}
                      createButtonText={onEmptyActionLabel}
                      EmptyActionIcon={EmptyActionIcon}
                    />
                  </TableCell>
                </TableRow>
              )}
            </SortableContext>
          </TableBody>
        </Table>
      </div>
    </DndContext>
  ) : (
    <div className="overflow-hidden rounded-xs border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  colSpan={header.colSpan}
                  style={{ width: header.getSize() }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={cn(
                  'group/row cursor-pointer transition-colors',
                  'hover:bg-blue-50/50 dark:hover:bg-blue-950/10',
                  row.getIsSelected() && 'bg-blue-50 dark:bg-blue-950/20'
                )}
                onClick={() => onRowClick?.(row.original)}
                data-state={row.getIsSelected() && 'selected'}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={enhancedColumns.length} className="h-24 text-center">
                <DataTableEmpty
                  table={table}
                  icon={icon}
                  hasFilters={hasActiveFilters}
                  title={emptyMessage}
                  onCreateNew={onEmptyClick || onAddClick}
                  createButtonText={onEmptyActionLabel || addButtonText}
                  EmptyActionIcon={EmptyActionIcon}
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {enableToolbar && (
        <DataTableToolbar
          table={table}
          searchColumn={searchColumn}
          searchPlaceholder={searchPlaceholder}
          extraActions={extraActions}
          facetedFilters={facetedFilters}
          addButtonText={addButtonText}
          onAddClick={onAddClick}
        />
      )}
      {tableContent}
      {enablePagination && <DataTablePagination table={table} pageSizeOptions={psOptions} />}
    </div>
  );
}
