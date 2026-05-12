// src/components/tables/data-table-toolbar.tsx

/**
 * @module tables/data-table-toolbar
 * @description Barre d'outils du tableau avec recherche, filtres et actions
 */

import { X, Filter, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTableFacetedFilter } from './data-table-faceted-filter';
import { DataTableViewOptions } from './data-table-view-options';
import type { DataTableToolbarProps } from './types';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Barre d'outils complète pour le tableau :
 * - Champ de recherche textuelle
 * - Filtres facettés
 * - Bouton de réinitialisation des filtres
 * - Options d'affichage des colonnes
 * - Bouton d'ajout personnalisable
 * - Actions supplémentaires
 */
export function DataTableToolbar<TData>({
  table,
  searchColumn = 'title',
  searchPlaceholder = 'Rechercher...',
  facetedFilters = [],
  addButtonText = 'Ajouter',
  onAddClick,
  extraActions,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const isMobile = useIsMobile();
  const activeFiltersCount = table.getState().columnFilters.length;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {/* Champ de recherche avec icône */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={(table.getColumn(searchColumn)?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn(searchColumn)?.setFilterValue(event.target.value)}
            className="h-10 w-37.5 pl-8 lg:w-62.5"
          />
          {(table.getColumn(searchColumn)?.getFilterValue() as string) && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-1 h-8 w-8 "
              onClick={() => table.getColumn(searchColumn)?.setFilterValue('')}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Effacer la recherche</span>
            </Button>
          )}
        </div>

        {facetedFilters.map((filter) => (
          <DataTableFacetedFilter
            key={filter.columnId}
            column={table.getColumn(filter.columnId)}
            title={filter.title}
            options={filter.options}
          />
        ))}

        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.resetColumnFilters()}
            className="h-8 gap-1"
          >
            <Filter className="h-3 w-3" />
            Réinitialiser les filtres
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        )}
      </div>

      <div className="items-center gap-2 lg:flex hidden">
        {!isMobile && <DataTableViewOptions table={table} />}
        {extraActions}
        {addButtonText && onAddClick && (
          <Button
            size="sm"
            className="h-9 gap-1.5 text-xs bg-blue-700 hover:bg-blue-800 text-white shadow-sm"
            onClick={onAddClick}
          >
            <Plus className=" h-4 w-4" />
            <span className="lg:inline hidden ml-1">{addButtonText}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
