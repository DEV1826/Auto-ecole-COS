// src/components/tables/data-table-drag-handle.tsx

/**
 * @module tables/data-table-drag-handle
 * @description Poignée pour le glisser-déposer d'une ligne de tableau (active)
 */

import { GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface DragHandleProps {
  /** Identifiant unique de la ligne (doit correspondre à celui du parent) */
  id: string | number;
  /** Classes additionnelles */
  className?: string;
}

/**
 * Poignée visuelle permettant de réorganiser les lignes par glisser-déposer.
 * Contient sa propre logique `useSortable` pour déclencher le drag.
 */
export function DragHandle({ id, className }: DragHandleProps) {
  const { attributes, listeners, isDragging } = useSortable({
    id,
  });

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className={cn(
        'size-7 text-muted-foreground cursor-grab hover:bg-transparent ',
        isDragging && 'cursor-grabbing opacity-50',
        className
      )}
    >
      <GripVertical className="h-4 w-4" />
      <span className="sr-only">Déplacer la ligne</span>
    </Button>
  );
}
