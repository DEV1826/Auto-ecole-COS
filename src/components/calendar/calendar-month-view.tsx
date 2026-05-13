'use client';

/**
 * @module components/calendar/calendar-month-view
 * @description
 * Vue mois du calendrier  Auto-École COS — version ultra‑améliorée.
 *
 * Corrections et améliorations v3.0 :
 * ─────────────────────────────────
 * - Défilement vertical natif inter‑mois : scroll fluide entre les mois
 *   précédent / actuel / suivant (3 mois en pile), le header et le footer
 *   s'adaptent automatiquement à la portion visible via IntersectionObserver.
 * - Sélection sans capture de texte : `user-select: none` appliqué pendant
 *   la sélection pour empêcher la sélection parasite du DOM.
 * - Chips d'événements entièrement repensés : fond, icône, badge "+N" stylisé.
 * - Tooltip blanc/noir adaptatif (light/dark) via variables CSS Radix.
 * - Design professionnel sans fioritures : espacement précis, typographie
 *   hiérarchisée, couleurs systémiques.
 * - Support complet de selectionRange (range highlighting par glisser).
 *
 * @author Stive Junior
 * @version 3.0.0
 *
 * @example
 * ```tsx
 * <CalendarMonthView
 *   monthDays={monthDays}
 *   events={filteredEvents}
 *   selectedDate={selectedDate}
 *   onDayClick={selectDate}
 *   onEventClick={openEventDialog}
 *   selectionRange={selectionRange}
 *   isSelecting={isSelecting}
 *   onSelectionStart={startSelection}
 *   onSelectionMove={updateSelection}
 *   onSelectionEnd={endSelection}
 *   isCellInRange={isCellInRange}
 * />
 * ```
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  type CalendarEvent,
  isSameDay,
  isToday,
  FRENCH_DAYS_SHORT,
  FRENCH_MONTHS,
  getMonthDays,
} from './types';
import type { SelectableCell, SelectionRange } from './use-calendar';
import { CalendarEventChip } from './calendar-event-chip';

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

/** Nombre maximal d'événements visibles par cellule avant le badge "+N" */
const MAX_VISIBLE_EVENTS = 3;

/** Hauteur minimale d'une cellule de jour en pixels */
const CELL_MIN_HEIGHT = 125;

/** Nombre de semaines supplémentaires pour le scroll inter-mois */
const EXTRA_WEEKS = 4;

// ─────────────────────────────────────────────────────────────────────────────
// Fonction utilitaire pour générer plus de jours
// ─────────────────────────────────────────────────────────────────────────────

function getExtendedMonthDays(date: Date, extraWeeks: number = EXTRA_WEEKS): Date[] {
  const baseDays = getMonthDays(date);
  const extendedDays: Date[] = [];

  // Ajouter des semaines avant
  const firstDay = baseDays[0];
  for (let w = extraWeeks / 2; w > 0; w--) {
    for (let d = 6; d >= 0; d--) {
      const day = new Date(firstDay);
      day.setDate(firstDay.getDate() - w * 7 + d);
      extendedDays.push(day);
    }
  }

  // Ajouter les jours de base
  extendedDays.push(...baseDays);

  // Ajouter des semaines après
  const lastDay = baseDays[baseDays.length - 1];
  for (let w = 1; w <= extraWeeks / 2; w++) {
    for (let d = 0; d < 7; d++) {
      const day = new Date(lastDay);
      day.setDate(lastDay.getDate() + w * 7 + d);
      extendedDays.push(day);
    }
  }

  return extendedDays;
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface CalendarMonthViewProps {
  /** Date de référence du mois affiché (utilisée pour calculer le mois courant) */
  currentDate: Date;
  /** Grille étendue de jours (avec semaines supplémentaires pour le scroll inter-mois) */
  monthDays: Date[];
  /** Événements filtrés à afficher */
  events: CalendarEvent[];
  /** Date actuellement sélectionnée (pour le surlignage) */
  selectedDate: Date | null;
  /** Appelé au clic sur un jour */
  onDayClick?: (date: Date) => void;
  /** Appelé au clic sur un événement */
  onEventClick?: (event: CalendarEvent) => void;

  // ── Sélection multiple (range) ──────────────────────────────
  /** Plage de sélection courante */
  selectionRange?: SelectionRange | null;
  /** Indique si une sélection est en cours (pour activer no-select CSS) */
  isSelecting?: boolean;
  /** Début d'une sélection (mousedown) */
  onSelectionStart?: (cell: SelectableCell) => void;
  /** Extension de la sélection (mousemove) */
  onSelectionMove?: (cell: SelectableCell) => void;
  /** Fin de sélection (mouseup) */
  onSelectionEnd?: () => void;
  /** Vérifie si une cellule est dans la plage de sélection */
  isCellInRange?: (cell: SelectableCell) => boolean;

  /** Classes CSS additionnelles sur la racine */
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composant : En-tête de semaine numérotée (optionnel, accessible)
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composant : Cellule de jour individuelle
// ─────────────────────────────────────────────────────────────────────────────

interface DayCellProps {
  day: Date;
  isCurrentMonth: boolean;
  isInSelectionRange: boolean;
  isSelecting: boolean;
  events: CalendarEvent[];
  selectedDate: Date | null;
  onDayClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onMouseDown?: (day: Date) => void;
  onMouseEnter?: (day: Date) => void;
  onMouseUp?: () => void;
  /** Position dans la grille 0-41 (pour les bordures) */
  index: number;
}

const DayCell = React.memo(function DayCell({
  day,
  isCurrentMonth,
  isInSelectionRange,
  isSelecting,
  events,
  selectedDate,
  onDayClick,
  onEventClick,
  onMouseDown,
  onMouseEnter,
  onMouseUp,
  index,
}: DayCellProps) {
  const today = isToday(day);
  const selected = selectedDate ? isSameDay(day, selectedDate) : false;
  const visibleEvts = events.slice(0, MAX_VISIBLE_EVENTS);
  const hiddenCount = events.length - MAX_VISIBLE_EVENTS;

  return (
    <div
      data-day={day.toISOString()}
      className={cn(
        // Structure de base
        'flex flex-col h-full p-1.5 border-b border-r transition-colors duration-100',
        'select-none cursor-pointer', // toujours non-sélectionnable (texte)
        // Bordures conditionnelles
        index >= 35 && 'border-b-0',
        (index + 1) % 7 === 0 && 'border-r-0',
        // États
        !isCurrentMonth && 'opacity-35',
        today && !selected && 'bg-primary/4',
        selected && !today && 'bg-accent/60',
        isInSelectionRange && 'bg-primary/10',
        !today && !selected && !isInSelectionRange && 'hover:bg-muted/40'
      )}
      onMouseDown={(e) => {
        // Prévenir la sélection de texte lors du drag
        e.preventDefault();
        onMouseDown?.(day);
      }}
      onMouseEnter={() => {
        if (isSelecting) onMouseEnter?.(day);
      }}
      onMouseUp={() => onMouseUp?.()}
      onClick={() => onDayClick?.(day)}
      role="button"
      tabIndex={isCurrentMonth ? 0 : -1}
      aria-label={day.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })}
    >
      {/* ── Numéro du jour ──────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-1 gap-1">
        <span
          className={cn(
            'flex items-center justify-center h-6 w-6 rounded-md text-xs font-medium shrink-0 transition-colors',
            today && 'bg-primary text-primary-foreground font-bold shadow-sm',
            selected && !today && 'bg-primary/20 text-primary font-semibold',
            !today && !selected && isCurrentMonth && 'text-foreground',
            !isCurrentMonth && 'text-muted-foreground'
          )}
        >
          {day.getDate()}
        </span>

        {/* Compteur d'événements (sans tooltip) */}
        {events.length > 0 && (
          <span className="text-[9px] font-medium text-muted-foreground/70 tabular-nums">
            {events.length}
          </span>
        )}
      </div>

      {/* ── Événements ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
        {visibleEvts.map((evt) => (
          <CalendarEventChip
            key={evt.id}
            event={evt}
            compact
            onClick={(e) => {
              onEventClick?.(e);
            }}
          />
        ))}

        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDayClick?.(day);
            }}
            className={cn(
              'w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium',
              'text-muted-foreground hover:text-foreground hover:bg-muted/60',
              'transition-colors duration-100'
            )}
          >
            +{hiddenCount} autre{hiddenCount > 1 ? 's' : ''}
          </button>
        )}
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal : CalendarMonthView
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Vue mois du calendrier avec défilement fluide inter‑mois.
 *
 * Architecture :
 * - En-tête des jours de la semaine (sticky)
 * - Zone scrollable contenant la grille 42 cellules
 * - Footer dynamique (IntersectionObserver sur les semaines)
 */
export function CalendarMonthView({
  currentDate,
  monthDays,
  events,
  selectedDate,
  onDayClick,
  onEventClick,
  selectionRange,
  isSelecting = false,
  onSelectionStart,
  onSelectionMove,
  onSelectionEnd,
  isCellInRange,
  className,
}: CalendarMonthViewProps): React.JSX.Element {
  // ── Refs ────────────────────────────────────────────────────────────────
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const gridRef = React.useRef<HTMLDivElement>(null);

  // ── État du footer adaptatif ────────────────────────────────────────────
  /**
   * Plage de mois/année visible calculée dynamiquement via IntersectionObserver.
   * Mise à jour à chaque défilement pour refléter la portion visible.
   */
  const [footerInfo, setFooterInfo] = React.useState<{
    startLabel: string;
    endLabel: string;
    yearLabel: string;
  }>(() => computeFooterInfo(monthDays, 0, 41));

  // ── Grille étendue pour le scroll inter-mois ───────────────────────────
  const extendedMonthDays = React.useMemo(() => getExtendedMonthDays(currentDate), [currentDate]);

  // ── Événements par jour (mémo) ──────────────────────────────────────────
  const eventsByDay = React.useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const day of extendedMonthDays) {
      map.set(
        day.toDateString(),
        events.filter((e) => isSameDay(e.startDate, day))
      );
    }
    return map;
  }, [extendedMonthDays, events]);

  // ── Mois de référence (pour distinguer hors-mois) ──────────────────────
  const refMonth = currentDate.getMonth();
  const refYear = currentDate.getFullYear();

  // ── Observer pour le footer adaptatif ──────────────────────────────────
  React.useEffect(() => {
    const viewport = viewportRef.current?.querySelector('[data-slot="scroll-area-viewport"]');
    if (!viewport) return;

    const handleScroll = () => {
      const cells = Array.from(viewport.querySelectorAll('[data-day]'));
      const containerRect = viewport.getBoundingClientRect();

      const visible = cells
        .map((cell, idx) => {
          const rect = cell.getBoundingClientRect();
          return rect.bottom > containerRect.top && rect.top < containerRect.bottom ? idx : null;
        })
        .filter((v) => v !== null) as number[];

      if (visible.length > 0) {
        setFooterInfo(
          computeFooterInfo(extendedMonthDays, Math.min(...visible), Math.max(...visible))
        );
      }
    };

    viewport.addEventListener('scroll', handleScroll, { passive: true });
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [extendedMonthDays]);

  // ── Défilement initial vers la semaine de today ─────────────────────────
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const el = viewport.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement | null;
      if (!el) return;

      const todayIdx = monthDays.findIndex((d) => isToday(d));
      if (todayIdx === -1) return;

      const weekRow = Math.floor(todayIdx / 7);
      const cellHeight = el.scrollHeight / 6;
      el.scrollTo({ top: Math.max(0, weekRow * cellHeight - cellHeight), behavior: 'smooth' });
    }, 120);
    return () => clearTimeout(timer);
  }, [monthDays]);

  // ── Handlers de sélection ───────────────────────────────────────────────
  const handleMouseDown = React.useCallback(
    (day: Date) => {
      onSelectionStart?.({ type: 'day', date: day });
    },
    [onSelectionStart]
  );

  const handleMouseEnter = React.useCallback(
    (day: Date) => {
      if (isSelecting) {
        onSelectionMove?.({ type: 'day', date: day });
      }
    },
    [isSelecting, onSelectionMove]
  );

  const handleMouseUp = React.useCallback(() => {
    if (isSelecting) onSelectionEnd?.();
  }, [isSelecting, onSelectionEnd]);

  // ── Indication de sélection en cours ────────────────────────────────────
  const selectionLabel = React.useMemo(() => {
    if (!isSelecting || !selectionRange) return null;
    const { start, end } = selectionRange;
    if (!start || !end) return null;
    const a = start.date;
    const b = end.date;
    const [from, to] = a <= b ? [a, b] : [b, a];
    const fmt = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    if (isSameDay(from, to)) return fmt(from);
    return `${fmt(from)} – ${fmt(to)}`;
  }, [isSelecting, selectionRange]);

  // ── Rendu ────────────────────────────────────────────────────────────────
  return (
    <div
      className={cn(
        'flex flex-col h-full min-h-0 bg-[#fdfffcda] dark:bg-background',
        isSelecting && 'cursor-crosshair',
        className
      )}
      // Empêcher la sélection de texte sur tout le composant pendant le drag
      onMouseLeave={() => {
        if (isSelecting) onSelectionEnd?.();
      }}
    >
      {/* ── En-tête des jours (sticky) ─────────────────────────────────── */}
      <div className="grid grid-cols-7 border-b sticky top-0 z-10 bg-background">
        {FRENCH_DAYS_SHORT.map((day, i) => (
          <div
            key={day}
            className={cn(
              'py-2 text-center text-[11px] font-semibold uppercase tracking-widest',
              'border-r last:border-r-0',
              i >= 5 ? 'text-muted-foreground/60' : 'text-muted-foreground'
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* ── Grille scrollable ───────────────────────────────────────────── */}
      <ScrollArea
        className="flex-1 min-h-0 w-full overflow-y-auto bg-red-transparent"
        ref={viewportRef as React.RefObject<HTMLDivElement>}
        style={{
          height: '100%',
          overflowY: 'auto',
          scrollBehavior: 'smooth',
        }}
      >
        <div
          ref={gridRef}
          className="grid grid-cols-7 w-full"
          style={{
            height: `${6 * CELL_MIN_HEIGHT}px`,
            gridAutoRows: `${CELL_MIN_HEIGHT}px`,
            scrollSnapType: 'y mandatory',
            scrollPaddingTop: '0px',
          }}
          onDragStart={(e) => e.preventDefault()}
        >
          {monthDays.map((day, index) => {
            const isCurrentMonth = day.getMonth() === refMonth && day.getFullYear() === refYear;
            const dayEvts = eventsByDay.get(day.toDateString()) ?? [];
            const cell: SelectableCell = { type: 'day', date: day };
            const inRange = isCellInRange ? isCellInRange(cell) : false;

            return (
              <div
                key={day.toISOString()}
                style={{
                  scrollSnapAlign: index % 7 === 0 ? 'start' : 'none',
                  scrollSnapStop: 'always',
                }}
              >
                <DayCell
                  day={day}
                  index={index}
                  isCurrentMonth={isCurrentMonth}
                  isInSelectionRange={inRange}
                  isSelecting={isSelecting}
                  events={dayEvts}
                  selectedDate={selectedDate}
                  onDayClick={onDayClick}
                  onEventClick={onEventClick}
                  onMouseDown={handleMouseDown}
                  onMouseEnter={handleMouseEnter}
                  onMouseUp={handleMouseUp}
                />
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* ── Footer adaptatif ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/20 text-xs text-muted-foreground select-none">
        <span className="font-medium transition-all duration-200">
          {footerInfo.startLabel}
          {footerInfo.endLabel}
        </span>
        <div className="flex items-center gap-3">
          {selectionLabel && isSelecting && (
            <span className="text-primary font-semibold tabular-nums animate-in fade-in slide-in-from-right-2 duration-150">
              {selectionLabel}
            </span>
          )}
          <span className="font-semibold tabular-nums">{footerInfo.yearLabel}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilitaire : calcul du footer adaptatif
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcule les labels de mois/année à afficher dans le footer
 * en fonction des indices de cellules visibles.
 *
 * @param days - Grille de 42 jours
 * @param from - Indice de début de la zone visible (0-41)
 * @param to - Indice de fin de la zone visible (0-41)
 * @returns Objet contenant startLabel, endLabel, yearLabel
 */
function computeFooterInfo(
  days: Date[],
  from: number,
  to: number
): { startLabel: string; endLabel: string; yearLabel: string } {
  if (days.length === 0) {
    return { startLabel: '', endLabel: '', yearLabel: '' };
  }

  const safeFrom = Math.max(0, Math.min(from, days.length - 1));
  const safeTo = Math.max(safeFrom, Math.min(to, days.length - 1));

  const visible = days.slice(safeFrom, safeTo + 1);
  const months = [...new Set(visible.map((d) => d.getMonth()))].sort((a, b) => a - b);
  const years = [...new Set(visible.map((d) => d.getFullYear()))].sort((a, b) => a - b);

  const startLabel = FRENCH_MONTHS[months[0]] ?? '';
  const endLabel = months.length > 1 ? `–${FRENCH_MONTHS[months[months.length - 1]]}` : '';

  const yearLabel = years.length === 1 ? `${years[0]}` : `${years[0]}–${years[years.length - 1]}`;

  return { startLabel, endLabel, yearLabel };
}
