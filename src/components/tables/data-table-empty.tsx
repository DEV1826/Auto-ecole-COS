/**
 * @module tables/data-table-empty
 * @description
 * Composant d'état vide pour les tableaux de données.
 * Affiche un message, une icône, et des actions optionnelles.
 * Supporte la distinction entre "aucune donnée" et "aucun résultat après filtrage".
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @example
 * ```tsx
 * <DataTableEmpty
 *   hasFilters
 *   onReset={() => setFilters({})}
 *   onCreateNew={() => navigate('/create')}
 *   canCreate
 * />
 * ```
 */

import * as React from 'react';
import { X, Plus, Search, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DataTableEmptyProps } from './types';

/**
 * État vide personnalisable pour les tableaux de données.
 * Utilisé par `DataTable` lorsque la liste est vide.
 */
export function DataTableEmpty<TData>({
  table,
  hasFilters = false,
  onCreateNew,
  canCreate = true,
  message,
  description,
  icon: Icon,
  EmptyActionIcon,
  title,
  createButtonText = 'Créer',
  resetButtonText = 'Effacer les filtres',
  className,
}: DataTableEmptyProps<TData>): React.JSX.Element {
  const defaultIcon = hasFilters ? Search : Inbox;
  const DisplayIcon = Icon ?? defaultIcon;
  const ActionIcon = EmptyActionIcon ?? Plus;

  const defaultTitle = hasFilters ? 'Aucun résultat trouvé' : 'Aucune donnée';
  const defaultMessage = hasFilters
    ? 'Aucun élément ne correspond à vos critères de recherche.'
    : 'Aucun élément n’a été trouvé dans cette liste.';
  const defaultDescription = hasFilters
    ? 'Modifiez ou supprimez vos filtres pour afficher plus de résultats.'
    : 'Les éléments créés apparaîtront ici.';

  return (
    <div
      className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}
    >
      <div className="flex items-center justify-center h-16 w-16 rounded-xs bg-blue-50 dark:bg-blue-950/30 mb-4">
        <DisplayIcon className="h-7 w-7 text-blue-700 dark:text-blue-400" />
      </div>

      <h3 className="text-sm font-semibold mb-1">{title ?? defaultTitle}</h3>
      <p className="text-xs text-muted-foreground max-w-xs">
        {hasFilters && (
          <span className="block mt-1 text-muted-foreground/80">
            {description ?? defaultDescription}
          </span>
        )}
      </p>
      {!hasFilters && description && (
        <p className="text-xs text-muted-foreground max-w-xs mt-1">{description}</p>
      )}
      <div className="flex gap-2 mt-4">
        {hasFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.resetColumnFilters()}
            className="text-xs gap-1"
          >
            <X className="h-3.5 w-3.5" />
            {resetButtonText}
          </Button>
        )}
        {canCreate && onCreateNew && (
          <Button
            size="sm"
            onClick={onCreateNew}
            className="text-xs gap-1 bg-blue-700 hover:bg-blue-800 text-white"
          >
            <ActionIcon className="h-3.5 w-3.5" />
            {createButtonText}
          </Button>
        )}
      </div>
    </div>
  );
}
