'use client';

/**
 * @module components/calendar/calendar-header
 * @description
 * Barre d'en-tête du calendrier  Auto-École COS.
 * Intègre :
 * - Navigation (précédent, suivant, aujourd'hui)
 * - Affichage de la période (mois ou intervalle de mois)
 * - Numéro de semaine (en vue semaine)
 * - Compteur d'événements (optionnel)
 * - Recherche textuelle (avec bouton d'activation)
 * - Filtres par type d'événement (menu déroulant avec checkboxes)
 * - Toggle entre vue semaine et vue mois
 * - Bouton de création d'événement
 *
 * Tous les composants UI proviennent de shadcn/ui.
 * Les icônes sont exclusivement issues de Lucide.
 *
 * @author Stive Junior
 * @version 2.0.0
 *
 * @example
 * ```tsx
 * <CalendarHeader
 *   currentDate={currentDate}
 *   view={view}
 *   weekDays={weekDays}
 *   filters={filters}
 *   eventCount={filteredEvents.length}
 *   canCreate={canCreate}
 *   onPrev={goToPrev}
 *   onNext={goToNext}
 *   onToday={goToToday}
 *   onViewChange={setView}
 *   onCreateClick={openCreateDialog}
 *   onFiltersChange={setFilters}
 * />
 * ```
 */

import * as React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  RotateCcw,
  Filter,
  CalendarDays,
  LayoutGrid,
  Search,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { CalendarView, CalendarFilters, CalendarEventType } from './types';
import { EVENT_TYPE_CONFIG, getWeekNumber, FRENCH_MONTHS } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Props du composant
// ─────────────────────────────────────────────────────────────────────────────

export interface CalendarHeaderProps {
  /** Date centrale (utilisée pour calculer la période affichée) */
  currentDate: Date;
  /** Vue active (semaine ou mois) */
  view: CalendarView;
  /** Jours de la semaine courante (pour calculer l'intervalle et le numéro de semaine) */
  weekDays?: Date[];
  /** Filtres actifs */
  filters: CalendarFilters;
  /** Nombre total d'événements après filtrage (affiché dans un badge) */
  eventCount?: number;
  /** L'utilisateur a-t-il le droit de créer un événement ? */
  canCreate?: boolean;
  /** Naviguer vers la période précédente */
  onPrev: () => void;
  /** Naviguer vers la période suivante */
  onNext: () => void;
  /** Revenir à aujourd'hui */
  onToday: () => void;
  /** Changer la vue (semaine/mois) */
  onViewChange: (view: CalendarView) => void;
  /** Ouvrir le dialogue de création d'événement */
  onCreateClick: () => void;
  /** Modifier les filtres */
  onFiltersChange: (filters: CalendarFilters) => void;
  /** Classes CSS additionnelles */
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers d'affichage de la période
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Génère le libellé de la période affichée dans l'en-tête.
 * - En vue mois : "Mars 2025"
 * - En vue semaine : "3–9 mars 2025" ou "31 mars–6 avril 2025" selon chevauchement de mois/année.
 *
 * @param date - Date de référence
 * @param view - Vue active
 * @param weekDays - Jours de la semaine (pour la vue semaine)
 * @returns Libellé formaté
 */
function getPeriodLabel(date: Date, view: CalendarView, weekDays?: Date[]): string {
  if (view === 'week' && weekDays && weekDays.length === 7) {
    const first = weekDays[0];
    const last = weekDays[6];
    const firstMonth = FRENCH_MONTHS[first.getMonth()];
    const lastMonth = FRENCH_MONTHS[last.getMonth()];
    const year = first.getFullYear();
    const lastYear = last.getFullYear();

    if (first.getMonth() === last.getMonth()) {
      return `${first.getDate()}–${last.getDate()} ${firstMonth} ${year}`;
    }
    if (year === lastYear) {
      return `${first.getDate()} ${firstMonth} – ${last.getDate()} ${lastMonth} ${year}`;
    }
    return `${first.getDate()} ${firstMonth} ${year} – ${last.getDate()} ${lastMonth} ${lastYear}`;
  }

  return `${FRENCH_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Retourne le libellé de la semaine (ex: "Semaine 14") pour la vue semaine.
 * @param weekDays - Jours de la semaine (le premier jour suffit)
 * @returns Libellé ou null si non disponible
 */
function getWeekLabel(weekDays?: Date[]): string | null {
  if (!weekDays || weekDays.length === 0) return null;
  return `Semaine ${getWeekNumber(weekDays[0])}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * En-tête du calendrier avec navigation, filtres, recherche et actions.
 */
export function CalendarHeader({
  currentDate,
  view,
  weekDays,
  filters,
  eventCount = 0,
  canCreate = true,
  onPrev,
  onNext,
  onToday,
  onViewChange,
  onCreateClick,
  onFiltersChange,
  className,
}: CalendarHeaderProps): React.JSX.Element {
  const [searchOpen, setSearchOpen] = React.useState(false);

  const periodLabel = getPeriodLabel(currentDate, view, weekDays);
  const weekLabel = view === 'week' ? getWeekLabel(weekDays) : null;

  const activeTypeFilters = filters.types ?? [];
  const hasActiveFilters = activeTypeFilters.length > 0 || !!filters.search;

  // Bascule d'un filtre de type
  const toggleTypeFilter = (type: CalendarEventType) => {
    const current = filters.types ?? [];
    const updated = current.includes(type) ? current.filter((t) => t !== type) : [...current, type];
    onFiltersChange({ ...filters, types: updated.length === 0 ? undefined : updated });
  };

  // Réinitialiser tous les filtres
  const resetFilters = () => {
    onFiltersChange({});
    setSearchOpen(false);
  };

  // Mise à jour de la recherche
  const updateSearch = (value: string) => {
    onFiltersChange({ ...filters, search: value || undefined });
  };

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 px-4 py-3 border-b bg-background',
        className
      )}
    >
      {/* ── Navigation ─────────────────────────────────────────── */}
      <div className="flex items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPrev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">Précédent</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">Suivant</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Bouton "Aujourd'hui" desktop */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs hidden rounded-md sm:inline-flex"
                onClick={onToday}
              >
                <RotateCcw className="h-3 w-3 mr-1.5" />
                Aujourd'hui
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">Revenir à aujourd'hui</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Version mobile : icône seule */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-md sm:hidden"
          onClick={onToday}
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-full hidden sm:block" />

      {/* ── Période et numéro de semaine ──────────────────────── */}
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-semibold">{periodLabel}</span>
        {weekLabel && <span className="text-[10px] text-muted-foreground">{weekLabel}</span>}
      </div>

      {/* Compteur d'événements (optionnel) */}
      {eventCount > 0 && (
        <Badge variant="secondary" className="text-xs h-5 px-1.5 hidden sm:flex">
          {eventCount}
        </Badge>
      )}

      {/* Espace flexible */}
      <div className="flex-1" />

      {/* ── Recherche ─────────────────────────────────────────── */}
      {searchOpen ? (
        <div className="flex items-center gap-1">
          <Input
            autoFocus
            placeholder="Rechercher titre, patient, médecin..."
            value={filters.search ?? ''}
            onChange={(e) => updateSearch(e.target.value)}
            className="h-7 w-48 text-xs"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => {
              setSearchOpen(false);
              updateSearch('');
            }}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">Rechercher</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* ── Filtres par type ─────────────────────────────────── */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={hasActiveFilters ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8 relative"
          >
            <Filter className="h-3.5 w-3.5" />
            {hasActiveFilters && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-md bg-blue-800" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="text-xs">Types d'événements</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {(
            Object.entries(EVENT_TYPE_CONFIG) as [
              CalendarEventType,
              (typeof EVENT_TYPE_CONFIG)[CalendarEventType],
            ][]
          ).map(([type, config]) => (
            <DropdownMenuCheckboxItem
              key={type}
              checked={activeTypeFilters.includes(type)}
              onCheckedChange={() => toggleTypeFilter(type)}
              className="text-xs"
            >
              <div className="flex items-center gap-2">
                <span className={cn('h-2 w-2 rounded-md shrink-0', config.dotColor)} />
                {config.label}
              </div>
            </DropdownMenuCheckboxItem>
          ))}
          {hasActiveFilters && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={false}
                onCheckedChange={resetFilters}
                className="text-xs text-muted-foreground"
              >
                Réinitialiser les filtres
              </DropdownMenuCheckboxItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-5" />

      {/* ── Toggle vue (semaine / mois) ──────────────────────── */}
      <div className="flex items-center gap-0.5 rounded-md border p-0.5 bg-muted/50">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={view === 'week' ? 'default' : 'ghost'}
                size="icon"
                className={cn(
                  'h-7 w-7 ',
                  view === 'week' ? 'bg-blue-800 dark:bg-blue-800 text text-white' : 'bg-muted/50'
                )}
                onClick={() => onViewChange('week')}
              >
                <CalendarDays className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">Vue semaine</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={view === 'month' ? 'default' : 'ghost'}
                size="icon"
                className={cn(
                  'h-7 w-7 ',
                  view === 'month' ? 'bg-blue-800 dark:bg-blue-800 text-white' : 'bg-muted/50'
                )}
                onClick={() => onViewChange('month')}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">Vue mois</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* ── Bouton Créer ─────────────────────────────────────── */}
      {canCreate && (
        <Button
          size="sm"
          className="h-8 gap-1.5 text-xs rounded-md bg-blue-800 text-white dark:bg-blue-600"
          onClick={onCreateClick}
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline ">Ajouter</span>
        </Button>
      )}
    </div>
  );
}
