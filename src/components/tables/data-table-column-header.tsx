// src/components/tables/data-table-column-header.tsx

/**
 * @module tables/data-table-column-header
 * @description En-tête de colonne avec tri et masquage
 */

import { ChevronsUpDown, EyeOff, SortAsc, SortDesc } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { DataTableColumnHeaderProps } from './types';

/**
 * Composant d'en-tête de colonne avec menu déroulant pour le tri et le masquage.
 * S'affiche uniquement si la colonne est triable.
 *
 * @example
 * ```tsx
 * {
 *   accessorKey: "email",
 *   header: ({ column }) => (
 *     <DataTableColumnHeader column={column} title="Email" />
 *   ),
 * }
 * ```
 */
export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  icon: Icon,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort?.()) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        <span>{title}</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="-ml-3 h-8 data-[state=open]:bg-accent">
            {Icon && <Icon className="mr-1 h-4 w-4" />}
            <span>{title}</span>
            {column.getIsSorted?.() === 'desc' ? (
              <SortDesc className="ml-2 h-4 w-4" />
            ) : column.getIsSorted?.() === 'asc' ? (
              <SortAsc className="ml-2 h-4 w-4" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => column.toggleSorting?.(false)}>
            <SortAsc className="mr-2 h-3.5 w-3.5" />
            Asc
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.toggleSorting?.(true)}>
            <SortDesc className="mr-2 h-3.5 w-3.5" />
            Desc
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => column.toggleVisibility?.(false)}>
            <EyeOff className="mr-2 h-3.5 w-3.5" />
            Masquer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
