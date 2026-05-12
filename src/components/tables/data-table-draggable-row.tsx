// src/components/tables/data-table-draggable-row.tsx

/**
 * @module tables/data-table-draggable-row
 * @description Ligne de tableau réorganisable par glisser‑déposer avec animation
 *              La transformation visuelle est gérée ici, le drag est déclenché par la poignée.
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { flexRender, type Row } from '@tanstack/react-table';
import { TableRow, TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { DragHandle } from './data-table-drag-handle';

export interface DraggableTableRowProps<TData> {
  row: Row<TData>;
  isSelected?: boolean;
  onRowClick?: (rowData: TData) => void;
  className?: string;
}

export function DraggableTableRow<TData>({
  row,
  isSelected = false,
  onRowClick,
  className,
}: DraggableTableRowProps<TData>) {
  const { setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      data-state={isSelected ? 'selected' : undefined}
      data-dragging={isDragging}
      className={cn(
        'relative z-0 group/row cursor-pointer transition-colors',
        'hover:bg-blue-50/50 dark:hover:bg-blue-950/10',
        isDragging && 'z-10 opacity-80 cursor-grabbing',
        className
      )}
      onClick={() => onRowClick?.(row.original)}
    >
      {row.getVisibleCells().map((cell) => {
        // Pour la colonne 'drag', on passe l'id au DragHandle
        if (cell.column.id === 'drag') {
          return (
            <TableCell key={cell.id}>
              <DragHandle id={row.id} />
            </TableCell>
          );
        }
        return (
          <TableCell key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        );
      })}
    </TableRow>
  );
}
