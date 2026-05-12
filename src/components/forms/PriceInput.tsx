'use client';

/**
 * @module components/forms/PriceInput
 * @description
 * Champ de saisie de prix/montant avec sélecteur de devise et boutons d'ajustement rapide.
 *
 * ## Fonctionnalités
 * - Saisie directe du montant avec formatage automatique (séparateurs de milliers)
 * - Boutons **−** / **+** pour ajuster le montant par pas configurable
 * - Sélecteur de devise intégré (FCFA, EUR, USD, GBP…)
 * - Validation visuelle des bornes min/max
 * - Icône contextuelle qui change selon le montant (pièce / billet)
 * - Support complet dark mode
 * - Hauteur fixe `h-10` pour un alignement parfait dans les formulaires
 * - Accessible (aria, rôles, labels)
 *
 * ## Utilisation
 * ```tsx
 * import { PriceInput } from '@/components/forms/PriceInput';
 *
 * const [price, setPrice] = useState<number>(5000);
 *
 * <PriceInput
 *   value={price}
 *   onChange={setPrice}
 *   currency="XAF"
 *   min={0}
 *   max={10000000}
 *   step={500}
 * />
 * ```
 *
 * @see {@link https://ui.shadcn.com/docs/components/input} Input ShadCN
 * @see {@link https://ui.shadcn.com/docs/components/button} Button ShadCN
 * @see {@link https://ui.shadcn.com/docs/components/select} Select ShadCN
 *
 * @author Stive Junior
 * @version 1.1.0
 */
import * as React from 'react';
import { Minus, Plus, Coins, Banknote, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// UI Components
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION & TYPES
// ─────────────────────────────────────────────────────────────────────────────

/** 🌍 Liste des devises supportées avec métadonnées pour la recherche */
const CURRENCIES = [
  { code: 'XAF', symbol: 'FCFA', label: 'Franc CFA', flag: '🇨🇲', search: 'CFA BEAC Cameroun' },
  { code: 'EUR', symbol: '€', label: 'Euro', flag: '🇪🇺', search: 'Europe Union' },
  { code: 'USD', symbol: '$', label: 'Dollar US', flag: '🇺🇸', search: 'United States America' },
  { code: 'GBP', symbol: '£', label: 'Livre Sterling', flag: '🇬🇧', search: 'Great Britain Pound' },
  { code: 'CAD', symbol: 'CA$', label: 'Dollar Canadien', flag: '🇨🇦', search: 'Canada' },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]['code'];

export interface PriceInputProps extends Omit<
  React.ComponentProps<typeof InputGroupInput>,
  'onChange' | 'value' | 'step'
> {
  /** 💵 Valeur numérique du montant */
  value: number;
  /** 🔄 Fonction de rappel lors de la modification du montant */
  onChange: (value: number) => void;
  /** 💱 Code ISO de la devise (défaut: "XAF") */
  currency?: CurrencyCode;
  /** 🔄 Fonction de rappel lors du changement de devise */
  onCurrencyChange?: (currency: CurrencyCode) => void;
  /** 📉 Borne minimale autorisée (défaut: 0) */
  min?: number;
  /** 📈 Borne maximale autorisée (défaut: 10 000 000) */
  max?: number;
  /** 📏 Pas d'incrémentation pour les boutons +/- (défaut: 500) */
  step?: number;
  /** 🚫 Masquer le sélecteur de devise si nécessaire */
  hideCurrency?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PriceInput - Composant de saisie financière avec recherche de devise intégrée.
 */
export function PriceInput({
  value,
  onChange,
  currency = 'XAF',
  onCurrencyChange,
  min = 0,
  max = 10000000,
  step = 500,
  disabled = false,
  className,
  hideCurrency = false,
  placeholder = '0',
  ...props
}: PriceInputProps) {
  // ── ÉTATS & REFS ──────────────────────────────────────────────────────────
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  /** Récupération des infos de la devise active */
  const currencyInfo = React.useMemo(
    () => CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0],
    [currency]
  );

  // ── LOGIQUE DE FORMATAGE ──────────────────────────────────────────────────

  /**
   * Formate le nombre pour l'affichage (ex: 15000 -> 15 000)
   * Utilise l'API Intl pour respecter les standards de séparation.
   */
  const formatDisplay = (val: number | string): string => {
    if (val === 0 || val === '0') return '';
    const num = typeof val === 'string' ? parseInt(val.replace(/\D/g, ''), 10) : val;
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  /** Nettoie les caractères non numériques avant traitement */
  const cleanInput = (val: string): string => val.replace(/\D/g, '');

  // ── GESTIONNAIRES D'ÉVÉNEMENTS ─────────────────────────────────────────────

  /** Gestion de la saisie manuelle au clavier */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = cleanInput(e.target.value);
    if (raw === '') {
      onChange(0);
      return;
    }
    const num = parseInt(raw, 10);
    if (!isNaN(num)) {
      const clamped = Math.min(max, Math.max(min, num));
      onChange(clamped);
    }
  };

  /** Ajustement via les boutons physiques +/- */
  const adjustValue = (delta: number) => {
    const newVal = Math.min(max, Math.max(min, value + delta));
    onChange(newVal);
    // On garde le focus pour permettre des clics successifs rapides
    inputRef.current?.focus();
  };

  /** Sélection d'une nouvelle devise via le CommandList */
  const handleCurrencySelect = (code: CurrencyCode) => {
    onCurrencyChange?.(code);
    setOpen(false);
  };

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <InputGroup
        className={cn(
          'h-10 group/price focus-within:ring-2 focus-within:ring-primary/20 rounded-xs border bg-background transition-all overflow-hidden',
          disabled && 'opacity-60 pointer-events-none grayscale-[0.5]'
        )}
      >
        {/* 1. SECTION : DÉCRÉMENTATION */}
        <TooltipProvider delayDuration={400}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-full rounded-none px-2.5 hover:bg-destructive/5 hover:text-destructive transition-colors shrink-0"
                disabled={disabled || value <= min}
                onClick={() => adjustValue(-step)}
              >
                <Minus className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px] font-bold">
              -{formatDisplay(step)}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Separator orientation="vertical" className="h-full" />

        {/* 2. SECTION : SÉLECTEUR DE DEVISE (COMBOBOX) */}
        {!hideCurrency && (
          <>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  role="combobox"
                  disabled={disabled}
                  className="h-full rounded-none px-3 border-none bg-muted/20 hover:bg-muted/40 transition-colors gap-2 w-auto min-w-22.5 focus-visible:ring-0"
                >
                  <span className="text-base leading-none">{currencyInfo.flag}</span>
                  <span className="text-xs font-black text-muted-foreground">
                    {currencyInfo.symbol}
                  </span>
                  <ChevronsUpDown className="size-3 opacity-30 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-62.5 max-w-[90vw] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Chercher une devise..." />

                  <CommandList>
                    <ScrollArea className="h-64">
                      <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                        Aucune devise trouvée.
                      </CommandEmpty>
                      <CommandGroup heading="Devises disponibles">
                        {CURRENCIES.map((c) => (
                          <CommandItem
                            key={c.code}
                            value={`${c.code} ${c.label} ${c.search}`}
                            onSelect={() => handleCurrencySelect(c.code as CurrencyCode)}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{c.flag}</span>
                              <div className="flex flex-col">
                                <span className="text-sm font-bold leading-tight">{c.code}</span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                                  {c.label}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-primary/60">
                                {c.symbol}
                              </span>
                              {currency === c.code && (
                                <Check className="size-3.5 text-primary animate-in zoom-in" />
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </ScrollArea>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Separator orientation="vertical" className="h-full" />
          </>
        )}

        {/* 3. SECTION : SAISIE DU MONTANT */}
        <InputGroupInput
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={formatDisplay(value)}
          onChange={handleInputChange}
          disabled={disabled}
          placeholder={placeholder}
          className="flex-1 h-full text-center font-black tabular-nums text-sm border-none focus-visible:ring-0 bg-transparent"
          {...props}
        />

        <Separator orientation="vertical" className="h-full" />

        {/* 4. SECTION : INCRÉMENTATION */}
        <TooltipProvider delayDuration={400}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-full rounded-none px-2.5 hover:bg-primary/5 hover:text-primary transition-colors shrink-0"
                disabled={disabled || value >= max}
                onClick={() => adjustValue(step)}
              >
                <Plus className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px] font-bold">
              +{formatDisplay(step)}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* 5. SECTION : INDICATEUR VISUEL DYNAMIQUE */}
        <InputGroupAddon align="inline-end" className="pr-3 pl-1">
          {value >= 100000 ? (
            <Banknote className="size-4 text-blue-500/60 group-focus-within/price:text-blue-500 transition-all scale-110 animate-in fade-in" />
          ) : (
            <Coins className="size-4 text-muted-foreground/30 group-focus-within/price:text-primary transition-all animate-in fade-in" />
          )}
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}
