'use client';

/**
 * @module components/forms/MultiSelect
 * @description
 * Sélecteur multiple générique avec recherche, chips intégrés dans le champ.
 *
 * ## Fonctionnalités
 * - Recherche textuelle instantanée via `Command`
 * - Sélection / désélection par clic ou Entrée
 * - **Badges intégrés dans le déclencheur** (coins `rounded-md`)
 * - Suppression individuelle via bouton `✕`
 * - Résumé ``+x`` quand le nombre de badges dépasse `maxDisplayed`
 * - Bouton «Effacer tout» dans le popover
 * - Groupes d’options configurables
 * - Accessible (aria, rôles)
 * - Thème émeraude, coins adoucis
 *
 * ## Utilisation
 * ```tsx
 * <MultiSelect
 *   options={ALL_LANGUAGES}
 *   value={selected}
 *   onChange={setSelected}
 *   placeholder="Choisissez des langues..."
 *   maxDisplayed={4}
 * />
 * ```
 *
 * @see {@link https://ui.shadcn.com/docs/components/command} Command ShadCN
 * @see {@link https://ui.shadcn.com/docs/components/popover} Popover ShadCN
 * @see {@link https://ui.shadcn.com/docs/components/badge} Badge ShadCN
 *
 * @author Stive Junior
 * @version 2.0.0
 */

import * as React from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface MultiSelectOption {
  value: string;
  label: string;
  flag?: string;
  category?: string;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  maxDisplayed?: number;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/* Composant principal                                                        */
/* -------------------------------------------------------------------------- */

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Sélectionner…',
  disabled = false,
  maxDisplayed = 3,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (optionValue: string) => {
    if (value.includes(optionValue)) onChange(value.filter((v) => v !== optionValue));
    else onChange([...value, optionValue]);
  };

  const handleRemove = (optionValue: string) => {
    onChange(value.filter((v) => v !== optionValue));
  };

  const handleClearAll = () => onChange([]);

  const selectedOptions = options.filter((o) => value.includes(o.value));
  const displayed = selectedOptions.slice(0, maxDisplayed);
  const remaining = selectedOptions.length - displayed.length;

  const grouped = React.useMemo(() => {
    const map = new Map<string, MultiSelectOption[]>();
    for (const o of options) {
      const k = o.category ?? 'Autres';
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(o);
    }
    return Array.from(map.entries());
  }, [options]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          role="combobox"
          aria-expanded={open}
          aria-disabled={disabled}
          tabIndex={0}
          className={cn(
            'flex flex-wrap items-center gap-1.5 min-h-10 w-full  rounded-md border border-input  p-1 text-sm',

            disabled && 'opacity-50 cursor-not-allowed bg-muted',
            ' transition-colors',
            className
          )}
          onClick={() => !disabled && setOpen(true)}
        >
          {selectedOptions.length > 0 ? (
            <>
              {displayed.map((opt) => (
                <Badge
                  key={opt.value}
                  variant="secondary"
                  className="gap-1 py-4 rounded-md bg-blue-50  dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800"
                >
                  {opt.label}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(opt.value);
                    }}
                    className="ml-1 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 "
                    aria-label={`Supprimer ${opt.label}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {remaining > 0 && (
                <Badge variant="outline" className="rounded-md text-xs">
                  +{remaining}
                </Badge>
              )}
            </>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </div>
      </PopoverTrigger>

      <PopoverContent className="w-100 max-w-[90vw] p-0" align="start">
        <Command>
          <div className="flex items-center  justify-between">
            <CommandInput placeholder="Rechercher…" />
            {selectedOptions.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground underline whitespace-nowrap"
                onClick={handleClearAll}
              >
                Effacer tout
              </Button>
            )}
          </div>
          <CommandList>
            <CommandEmpty>Aucun résultat.</CommandEmpty>
            {grouped.map(([category, items]) => (
              <CommandGroup key={category} heading={category}>
                {items.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={opt.label}
                    onSelect={() => handleSelect(opt.value)}
                    className="cursor-pointer flex items-center gap-2"
                  >
                    {opt.flag && <span className="text-lg leading-none">{opt.flag}</span>}
                    <span className="flex-1">{opt.label}</span>
                    <Check
                      className={cn(
                        'h-4 w-4 shrink-0',
                        value.includes(opt.value) ? 'opacity-100 text-blue-600' : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
