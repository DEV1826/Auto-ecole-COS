// src/components/forms/EntityCombobox.tsx

/**
 * @module components/forms/EntityCombobox
 * @description
 * Liste déroulante avec recherche (Popover + Command), générique : candidats,
 * moniteurs, véhicules… Les options sont fournies par le parent.
 */

import * as React from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface EntityOption {
  id: number;
  /** Libellé principal */
  label: string;
  /** Ligne secondaire (email, immatriculation…) */
  sublabel?: string;
  /** Texte supplémentaire pris en compte par la recherche */
  keywords?: string;
  /** Élément affiché à droite (badge de statut…) */
  adornment?: React.ReactNode;
  /** Option affichée mais non sélectionnable */
  disabled?: boolean;
}

export interface EntityComboboxProps {
  id?: string;
  options: EntityOption[];
  value?: number | null;
  onChange: (id: number | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  loading?: boolean;
  disabled?: boolean;
  /** Affiche une croix pour vider la sélection */
  clearable?: boolean;
  invalid?: boolean;
  icon?: React.ElementType;
}

export function EntityCombobox({
  id,
  options,
  value,
  onChange,
  placeholder = 'Sélectionner…',
  searchPlaceholder = 'Rechercher…',
  emptyText = 'Aucun résultat.',
  loading = false,
  disabled = false,
  clearable = false,
  invalid = false,
  icon: Icon,
}: EntityComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((o) => o.id === value) ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid}
          disabled={disabled}
          className={cn(
            'h-12 w-full justify-between font-normal',
            invalid && 'border-destructive',
            !selected && 'text-muted-foreground'
          )}
        >
          <span className="flex items-center gap-2 min-w-0">
            {Icon && <Icon className="h-4 w-4 shrink-0 opacity-60" />}
            {loading ? (
              <Skeleton className="h-4 w-40" />
            ) : selected ? (
              <span className="truncate">
                <span className="text-foreground">{selected.label}</span>
                {selected.sublabel && (
                  <span className="text-muted-foreground text-xs"> · {selected.sublabel}</span>
                )}
              </span>
            ) : (
              <span className="truncate">{placeholder}</span>
            )}
          </span>
          <span className="flex items-center gap-1 shrink-0">
            {clearable && selected && !disabled && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Vider la sélection"
                className="rounded p-0.5 hover:bg-muted"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    onChange(null);
                  }
                }}
              >
                <X className="h-3.5 w-3.5 opacity-60" />
              </span>
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.id}
                  value={`${o.label} ${o.sublabel ?? ''} ${o.keywords ?? ''} #${o.id}`}
                  disabled={o.disabled}
                  onSelect={() => {
                    onChange(o.id);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <Check className={cn('h-4 w-4 shrink-0', o.id === value ? 'opacity-100' : 'opacity-0')} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{o.label}</p>
                    {o.sublabel && <p className="text-xs text-muted-foreground truncate">{o.sublabel}</p>}
                  </div>
                  {o.adornment}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
