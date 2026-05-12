// src/components/ui/date-picker.tsx

/**
 * @module ui/date-picker
 * @description Composant DatePicker complet avec support de différentes variantes (simple, range, input, etc.)
 * @author Stive Junior
 * @version 3.0.0
 *
 * @example
 * ```tsx
 * // Variante par défaut (bouton simple)
 * <DatePicker date={date} onSelect={setDate} />
 *
 * // Variante range avec présélections
 * <DatePicker mode="range" dateRange={range} onRangeSelect={setRange} showPresets />
 *
 * // Variante avec heures (début et fin)
 * <DatePicker mode="range" withTime showPresets
 *   startTimeValue="09:00" endTimeValue="17:00"
 *   onStartTimeChange={(t) => console.log(t)}
 *   onEndTimeChange={(t) => console.log(t)}
 * />
 * ```
 */

'use client';

import * as React from 'react';
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import { Calendar as CalendarIcon, ChevronDownIcon, Clock2Icon } from 'lucide-react';
import { type DateRange } from 'react-day-picker';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';

const datePickerVariants = cva('', {
  variants: {
    variant: {
      default: '',
      range: '',
      input: '',
      natural: '',
      simple: '',
      time: '',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface DatePickerProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'>,
    VariantProps<typeof datePickerVariants> {
  /** Mode de sélection : 'single' ou 'range' */
  mode?: 'single' | 'range';
  /** Date sélectionnée (mode single) */
  date?: Date;
  /** Plage de dates (mode range) */
  dateRange?: DateRange;
  /** Callback lors de la sélection (mode single) */
  onSelect?: (date: Date | undefined) => void;
  /** Callback lors de la sélection (mode range) */
  onRangeSelect?: (range: DateRange | undefined) => void;
  /** Placeholder du champ (pour les variantes input) */
  placeholder?: string;
  /** Désactiver le composant */
  disabled?: boolean;
  /** Label du champ (pour variante field) */
  label?: string;
  /** Utiliser le champ avec Field (pour formulaire) */
  withField?: boolean;
  /** Nombre de mois affichés (pour mode range, défaut: 2) */
  numberOfMonths?: number;
  /** Afficher les dropdowns pour mois/année */
  captionLayout?: 'dropdown' | 'label' | 'dropdown-months' | 'dropdown-years';
  /** Format d'affichage de la date (par défaut 'PPP') */
  formatStr?: string;
  /** Valeur initiale pour l'input (variante input) */
  inputValue?: string;
  /** Gérer le langage naturel (variante natural) */
  naturalLanguage?: boolean;
  /** Inclure un sélecteur d'heure */
  withTime?: boolean;
  /** Afficher la section de sélection d'heure (pour mode range avec withTime) */
  showTimeSection?: boolean;
  /** Label pour le sélecteur d'heure */
  timeLabel?: string;
  /** Valeur de l'heure de début (format "HH:mm:ss") */
  startTimeValue?: string;
  /** Valeur de l'heure de fin (format "HH:mm:ss") */
  endTimeValue?: string;
  /** Callback pour changement d'heure de début */
  onStartTimeChange?: (time: string) => void;
  /** Callback pour changement d'heure de fin */
  onEndTimeChange?: (time: string) => void;
  /** Afficher les boutons de présélection (aujourd'hui, semaine, mois) */
  showPresets?: boolean;
  /** Classes additionnelles */
  className?: string;
}

/**
 * Composant DatePicker unifié supportant plusieurs variantes.
 * Amélioré avec présélections et gestion d'heure.
 */
export function DatePicker({
  variant = 'default',
  mode = 'single',
  date,
  dateRange,
  onSelect,
  onRangeSelect,
  placeholder = 'Sélectionner une date',
  disabled = false,
  label,
  withField = false,
  numberOfMonths = 2,
  captionLayout = 'dropdown',
  formatStr = 'PPP',
  inputValue: externalInputValue,
  naturalLanguage = false,
  withTime = false,
  showTimeSection,
  timeLabel = 'Heure',
  startTimeValue: externalStartTime,
  endTimeValue: externalEndTime,
  onStartTimeChange,
  onEndTimeChange,
  showPresets = false,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [internalDate, setInternalDate] = React.useState<Date | undefined>(date);
  const [internalRange, setInternalRange] = React.useState<DateRange | undefined>(dateRange);
  const [inputValue, setInputValue] = React.useState(externalInputValue ?? '');
  const [startTime, setStartTime] = React.useState(externalStartTime ?? '09:00:00');
  const [endTime, setEndTime] = React.useState(externalEndTime ?? '17:00:00');

  React.useEffect(() => {
    if (date !== undefined) setInternalDate(date);
  }, [date]);

  React.useEffect(() => {
    if (dateRange !== undefined) setInternalRange(dateRange);
  }, [dateRange]);

  const handleSelect = (selectedDate: Date | undefined) => {
    setInternalDate(selectedDate);
    onSelect?.(selectedDate);
    if (variant !== 'input' && variant !== 'natural') setOpen(false);
  };

  const handleRangeSelect = (range: DateRange | undefined) => {
    setInternalRange(range);
    onRangeSelect?.(range);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    if (naturalLanguage) {
      try {
        const parsed = new Date(val);
        if (!isNaN(parsed.getTime())) {
          setInternalDate(parsed);
          onSelect?.(parsed);
        }
      } catch {
        // Ignore parsing errors
      }
    }
  };

  const displayValue = () => {
    if (mode === 'single' && internalDate) return format(internalDate, formatStr);
    if (mode === 'range' && internalRange?.from) {
      if (internalRange.to)
        return `${format(internalRange.from, formatStr)} - ${format(internalRange.to, formatStr)}`;
      return format(internalRange.from, formatStr);
    }
    return '';
  };

  const renderCalendar = () => {
    const calendarProps = {
      mode,
      selected: mode === 'single' ? internalDate : internalRange,
      onSelect: mode === 'single' ? handleSelect : handleRangeSelect,
      captionLayout,
      defaultMonth: mode === 'single' ? internalDate : internalRange?.from,
      ...(mode === 'range' && { numberOfMonths }),
    };
    return <Calendar {...(calendarProps as any)} />;
  };

  // Présélections
  const applyPreset = (preset: 'today' | 'week' | 'month') => {
    const now = new Date();
    let range: DateRange;
    switch (preset) {
      case 'today':
        range = { from: startOfDay(now), to: endOfDay(now) };
        break;
      case 'week': {
        const start = startOfWeek(now, { weekStartsOn: 1 });
        const end = endOfWeek(now, { weekStartsOn: 1 });
        range = { from: start, to: end };
        break;
      }
      case 'month':
        range = { from: startOfMonth(now), to: endOfMonth(now) };
        break;
    }
    if (mode === 'range') {
      setInternalRange(range);
      onRangeSelect?.(range);
    } else {
      setInternalDate(range.from);
      onSelect?.(range.from);
    }
    setOpen(false);
  };

  // Fonction qui retourne un seul élément pour PopoverTrigger
  const renderTrigger = () => {
    switch (variant) {
      case 'default':
        return (
          <Button
            variant="outline"
            data-empty={!internalDate && !internalRange}
            className={cn(
              'w-[212px] justify-between text-left font-normal data-[empty=true]:text-muted-foreground',
              className
            )}
            disabled={disabled}
          >
            {displayValue() || <span>{placeholder}</span>}
            <ChevronDownIcon className="ml-2 h-4 w-4" />
          </Button>
        );
      case 'simple':
        return (
          <Button
            variant="outline"
            className={cn('justify-start font-normal', className)}
            disabled={disabled}
          >
            {internalDate ? format(internalDate, formatStr) : <span>{placeholder}</span>}
          </Button>
        );
      case 'input':
      case 'natural':
        return (
          <InputGroup>
            <InputGroupInput
              value={variant === 'input' ? inputValue || displayValue() : inputValue}
              placeholder={placeholder}
              onChange={handleInputChange}
              disabled={disabled}
              onKeyDown={(e) => e.key === 'ArrowDown' && setOpen(true)}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                variant="ghost"
                size="icon-xs"
                aria-label="Sélectionner une date"
                disabled={disabled}
              >
                <CalendarIcon className="h-4 w-4" />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        );
      default:
        return null;
    }
  };

  // Rendu du contenu du popover (calendrier + présélections + heures)
  const renderPopoverContent = () => {
    const showPresetsSection = showPresets && mode === 'range';

    return (
      <div className="flex flex-col">
        {/* Calendrier */}
        <div className="p-0">
          {withTime && variant !== 'time' ? (
            <FieldGroup className="mx-auto flex-row gap-0 overflow-hidden p-0">
              <Field className="flex-1 min-w-0">
                <FieldLabel htmlFor={`date-picker-${label || 'date'}`}>Date</FieldLabel>
                {renderCalendar()}
              </Field>
              <Field className="w-32">
                <FieldLabel htmlFor={`time-picker-${label || 'time'}`}>{timeLabel}</FieldLabel>
                <Input
                  id={`time-picker-${label || 'time'}`}
                  type="time"
                  step="1"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    onStartTimeChange?.(e.target.value);
                  }}
                  disabled={disabled}
                  className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden"
                />
              </Field>
            </FieldGroup>
          ) : variant === 'time' ? (
            <div className="flex flex-col gap-2 p-2">
              {renderCalendar()}
              <Input
                type="time"
                step="1"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  onStartTimeChange?.(e.target.value);
                }}
                className="w-full"
              />
            </div>
          ) : (
            renderCalendar()
          )}

          {/* Section présélections (footer) */}
          {showPresetsSection && (
            <div className="border-t p-2 flex flex-wrap gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyPreset('today')}
                className="text-xs h-7"
              >
                Aujourd'hui
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyPreset('week')}
                className="text-xs h-7"
              >
                Cette semaine
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyPreset('month')}
                className="text-xs h-7"
              >
                Ce mois
              </Button>
            </div>
          )}

          {/* Section heures (début + fin) pour mode range avec withTime */}
          {showTimeSection && (
            <div className="border-t p-2">
              <FieldGroup className="flex-row gap-2">
                <Field>
                  <FieldLabel htmlFor="time-from" className="text-xs">
                    Heure début
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      id="time-from"
                      type="time"
                      step="1"
                      value={startTime}
                      onChange={(e) => {
                        setStartTime(e.target.value);
                        onStartTimeChange?.(e.target.value);
                      }}
                      className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
                    />
                    <InputGroupAddon>
                      <Clock2Icon className="text-muted-foreground size-4" />
                    </InputGroupAddon>
                  </InputGroup>
                </Field>
                <Field>
                  <FieldLabel htmlFor="time-to" className="text-xs">
                    Heure fin
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      id="time-to"
                      type="time"
                      step="1"
                      value={endTime}
                      onChange={(e) => {
                        setEndTime(e.target.value);
                        onEndTimeChange?.(e.target.value);
                      }}
                      className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
                    />
                    <InputGroupAddon>
                      <Clock2Icon className="text-muted-foreground size-4" />
                    </InputGroupAddon>
                  </InputGroup>
                </Field>
              </FieldGroup>
            </div>
          )}
        </div>
      </div>
    );
  };

  const content = (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{renderTrigger()}</PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {renderPopoverContent()}
      </PopoverContent>
    </Popover>
  );

  if (withField && label) {
    return (
      <Field className={className}>
        <FieldLabel htmlFor="date-picker">{label}</FieldLabel>
        {content}
      </Field>
    );
  }

  return content;
}
