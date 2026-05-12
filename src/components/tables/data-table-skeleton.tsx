// src/components/tables/data-table-skeleton.tsx

/**
 * @module tables/data-table-skeleton
 * @description Squelette de chargement pour un tableau
 */

import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface DataTableSkeletonProps {
  /** Nombre de colonnes */
  columns: number;
  /** Nombre de lignes à afficher */
  rows?: number;
  /** Classes additionnelles */
  className?: string;
}

/**
 * Affiche un squelette de tableau pendant le chargement des données.
 */
export function DataTableSkeleton({ columns, rows = 5, className }: DataTableSkeletonProps) {
  return (
    <div className={cn('rounded-xs border', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: columns }).map((_, i) => (
              <TableHead key={i}>
                <Skeleton className="h-6 w-24" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <TableRow key={rowIdx}>
              {Array.from({ length: columns }).map((_, colIdx) => (
                <TableCell key={colIdx}>
                  <Skeleton className="h-5 w-full max-w-50" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
