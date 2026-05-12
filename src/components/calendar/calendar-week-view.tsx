// src/components/calendar/calendar-week-view.tsx

/**
 * @module components/calendar/calendar-week-view
 * @description
 * Vue semaine du calendrier COS — version adaptée à l’auto‑école.
 * Affiche les événements (leçons, examens, paiements, entretiens, rappels)
 * sur une grille horaire de 24 heures, avec redimensionnement, sélection multiple,
 * indicateur "maintenant" et en‑tête des jours.
 *
 * Améliorations :
 * - Grille sur 15 minutes avec lignes d’heure pleines, demi‑heure tiretées, quarts très légers.
 * - Chips d’événements : fond semi‑transparent, bande latérale gauche (couleur du type), poignées de redimensionnement.
 * - Indicateur "maintenant" rouge avec ligne pleine.
 * - Sélection multiple par glisser (créneaux horaires).
 * - En‑tête avec points de présence des événements.
 * - Pied de page : mois + numéro de semaine ISO.
 *
 * @author Stive Junior
 * @version 1.0.0 – COS
 *
 * @example
 * ```tsx
 * <CalendarWeekView
 *   currentDate={currentDate}
 *   weekDays={weekDays}
 *   events={filteredEvents}
 *   selectedDate={selectedDate}
 *   onDayClick={selectDate}
 *   onSlotClick={(date, hour) => openCreateDialog(date)}
 *   onEventClick={openEventDialog}
 *   selectionRange={selectionRange}
 *   isSelecting={isSelecting}
 *   onSelectionStart={startSelection}
 *   onSelectionMove={updateSelection}
 *   onSelectionEnd={endSelection}
 *   resizingEvent={resizingEvent}
 *   onResizeStart={startResizeEvent}
 *   onResizeMove={resizeEventMove}
 *   onResizeEnd={endResizeEvent}
 * />
 * ```
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Car,
  GraduationCap,
  CreditCard,
  Wrench,
  Bell,
  AlertTriangle,
  Clock,
  MapPin,
} from 'lucide-react';
import {
  type CalendarEvent,
  type CalendarEventType,
  getWeekNumber,
  isSameDay,
  isToday,
  FRENCH_DAYS_SHORT,
  FRENCH_MONTHS,
  EVENT_TYPE_CONFIG,
  EVENT_STATUS_CONFIG,
} from './types';
import type { SelectionRange, SelectableCell } from './use-calendar';

// ============================================================
// Constantes de rendu
// ============================================================

/** Hauteur d'une heure en pixels (base du positionnement vertical) */
const HOUR_HEIGHT = 64;

/** Nombre total d'heures affichées */
const TOTAL_HOURS = 24;

/** Résolution de la grille en minutes (slots de 15 min) */
const SLOT_MINUTES = 15;

/** Nombre de slots par heure */
const SLOTS_PER_HOUR = 60 / SLOT_MINUTES;

// ============================================================
// Helpers de positionnement
// ============================================================

/** Convertit une date en décalage vertical depuis le haut de la grille (pixels). */
const dateToPx = (d: Date): number => (d.getHours() + d.getMinutes() / 60) * HOUR_HEIGHT;

/** Calcule la hauteur en pixels d’un événement à partir de sa durée. */
const durationToPx = (start: Date, end: Date): number =>
  Math.max(((end.getTime() - start.getTime()) / 3_600_000) * HOUR_HEIGHT, 24);

/** Liste des heures (0 à 23) */
const HOUR_LABELS = Array.from({ length: TOTAL_HOURS }, (_, i) => i);

/** Description d’un créneau de 15 minutes dans la grille. */
interface TimeSlot {
  hour: number;
  minute: number;
  topPx: number;
  isHour: boolean; // heure pleine (0, 1, 2...)
  isHalf: boolean; // demi‑heure (30)
}

/** Génère tous les créneaux de 15 minutes. */
const TIME_SLOTS: TimeSlot[] = Array.from({ length: TOTAL_HOURS * SLOTS_PER_HOUR }, (_, i) => {
  const hour = Math.floor(i / SLOTS_PER_HOUR);
  const minute = (i % SLOTS_PER_HOUR) * SLOT_MINUTES;
  return {
    hour,
    minute,
    topPx: (hour + minute / 60) * HOUR_HEIGHT,
    isHour: minute === 0,
    isHalf: minute === 30,
  };
});

// ============================================================
// Formatage d’heure
// ============================================================

const formatTime = (d: Date) =>
  d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

// ============================================================
// Icône par type d’événement (COS)
// ============================================================

const EVENT_ICONS: Record<CalendarEventType, React.ElementType> = {
  lesson: Car,
  exam: GraduationCap,
  payment: CreditCard,
  maintenance: Wrench,
  reminder: Bell,
};

function EventIcon({
  type,
  className,
}: {
  type: CalendarEventType;
  className?: string;
}): React.JSX.Element {
  const Icon = EVENT_ICONS[type] ?? Bell;
  return <Icon className={cn('shrink-0', className)} />;
}

// ============================================================
// Contenu du tooltip (unifié)
// ============================================================

interface EventTooltipProps {
  event: CalendarEvent;
}

function EventTooltip({ event }: EventTooltipProps): React.JSX.Element {
  const cfg = EVENT_TYPE_CONFIG[event.type];
  const status = EVENT_STATUS_CONFIG[event.status];
  const person = event.candidat ?? event.moniteur;

  return (
    <div className="space-y-2.5 min-w-50 max-w-65">
      {/* Titre + icône */}
      <div className="flex items-start gap-2">
        <EventIcon type={event.type} className={cn('h-4 w-4 mt-0.5', cfg.textColor)} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold leading-tight">{event.title}</p>
          {event.description && (
            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
              {event.description}
            </p>
          )}
        </div>
      </div>

      {/* Métadonnées */}
      <div className="space-y-1 text-xs">
        {/* Horaires */}
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-3 w-3 shrink-0" />
          <span>
            {formatTime(event.startDate)} – {formatTime(event.endDate)}
          </span>
        </div>

        {/* Lieu */}
        {event.location && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
        )}

        {/* Montant (paiement) */}
        {event.montant !== undefined && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <CreditCard className="h-3 w-3 shrink-0" />
            <span>{event.montant.toLocaleString('fr-FR')} FCFA</span>
          </div>
        )}

        {/* Véhicule (leçon / entretien) */}
        {event.vehicule && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Car className="h-3 w-3 shrink-0" />
            <span>Véhicule {event.vehicule}</span>
          </div>
        )}

        {/* Personne associée (candidat ou moniteur) */}
        {person && (
          <div className="flex items-center gap-2 mt-1.5">
            <Avatar className="h-5 w-5 shrink-0">
              <AvatarImage src={person.avatarUrl} />
              <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-bold">
                {person.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{person.name}</p>
              {person.role && <p className="text-[10px] text-muted-foreground">{person.role}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1">
        <Badge
          variant="outline"
          className={cn('text-[10px] h-4 px-1.5 border-0', status.bgColor, status.textColor)}
        >
          {status.label}
        </Badge>
        {event.isUrgent && (
          <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
            Urgent
          </Badge>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Événement redimensionnable (chip)
// ============================================================

interface WeekEventChipProps {
  event: CalendarEvent;
  topPx: number;
  heightPx: number;
  onClick: (event: CalendarEvent) => void;
  onResizeStart?: (event: CalendarEvent, edge: 'start' | 'end', mouseY: number) => void;
  isResizing?: boolean;
}

const WeekEventChip = React.memo(function WeekEventChip({
  event,
  topPx,
  heightPx,
  onClick,
  onResizeStart,
  isResizing,
}: WeekEventChipProps) {
  const cfg = EVENT_TYPE_CONFIG[event.type];
  const showDetails = heightPx >= 40;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'absolute left-0.75 right-0.75 rounded-xs overflow-hidden',
              cfg.bgColor,
              'shadow-sm',
              'transition-opacity duration-100 cursor-pointer select-none',
              'hover:opacity-90 hover:shadow-md hover:z-20',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50',
              isResizing && 'ring-1 ring-primary shadow-md z-30 opacity-90'
            )}
            style={{
              top: `${topPx}px`,
              height: `${heightPx}px`,
              minHeight: '22px',
              zIndex: isResizing ? 30 : 10,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onClick(event);
            }}
            role="button"
            tabIndex={0}
            aria-label={`${event.title} – ${formatTime(event.startDate)}`}
          >
            {/* Bande latérale gauche (couleur du type) */}
            <div
              className={cn('absolute left-0 top-0 bottom-0 w-0.5 rounded-l-md', cfg.dotColor)}
            />

            {/* Poignée supérieure (redimensionnement) */}
            {onResizeStart && (
              <div
                className="absolute top-0 left-0 right-0 h-1.5 cursor-ns-resize z-20 hover:bg-white/20 dark:hover:bg-black/20 transition-colors"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onResizeStart(event, 'start', e.clientY);
                }}
              />
            )}

            <div className="flex flex-col pl-2.5 pr-1.5 py-1 h-full overflow-hidden">
              <div className="flex items-center gap-1 min-w-0">
                <EventIcon type={event.type} className={cn('h-3 w-3 shrink-0', cfg.textColor)} />
                <span
                  className={cn(
                    'font-semibold leading-none truncate',
                    cfg.textColor,
                    heightPx < 32 ? 'text-[9px]' : 'text-[10px]'
                  )}
                >
                  {event.title}
                </span>
                {event.isUrgent && (
                  <AlertTriangle className="h-2.5 w-2.5 text-red-500 shrink-0 ml-auto" />
                )}
              </div>
              {showDetails && (
                <span
                  className={cn(
                    'text-[9px] mt-0.5 opacity-70 leading-none tabular-nums',
                    cfg.textColor
                  )}
                >
                  {formatTime(event.startDate)}
                  {heightPx >= 56 && ` – ${formatTime(event.endDate)}`}
                </span>
              )}
            </div>

            {/* Poignée inférieure (redimensionnement) */}
            {onResizeStart && (
              <div
                className="absolute bottom-0 left-0 right-0 h-1.5 cursor-ns-resize z-20 hover:bg-white/20 dark:hover:bg-black/20 transition-colors"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onResizeStart(event, 'end', e.clientY);
                }}
              />
            )}
          </div>
        </TooltipTrigger>

        <TooltipContent
          side="right"
          sideOffset={8}
          align="start"
          className={cn(
            'p-3 rounded-xs shadow-lg',
            'bg-white dark:bg-neutral-900',
            'text-neutral-900 dark:text-neutral-100',
            'border border-neutral-200 dark:border-neutral-800'
          )}
        >
          <EventTooltip event={event} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

// ============================================================
// Indicateur "maintenant"
// ============================================================

function NowIndicator({ weekDays }: { weekDays: Date[] }): React.JSX.Element | null {
  const [now, setNow] = React.useState(new Date());

  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const colIndex = weekDays.findIndex((d) => isSameDay(d, now));
  if (colIndex === -1) return null;

  const topPx = dateToPx(now);
  const colW = 100 / 7;

  return (
    <div
      aria-hidden="true"
      className="absolute left-0 right-0 z-25 pointer-events-none flex items-center"
      style={{ top: `${topPx}px` }}
    >
      <div className="w-14 shrink-0" />
      <div
        className="relative"
        style={{ marginLeft: `calc(${colIndex} * ${colW}%)`, width: `${colW - 3}%` }}
      >
        <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-red-500 shadow-sm" />
        <div className="h-0.5 bg-red-500 opacity-90" />
      </div>
    </div>
  );
}

// ============================================================
// Props du composant principal
// ============================================================

export interface CalendarWeekViewProps {
  /** Date de référence de la semaine (pour le footer) */
  currentDate: Date;
  /** Jours de la semaine (lundi → dimanche) calculés par `getWeekDays` */
  weekDays: Date[];
  /** Événements à afficher (filtrés) */
  events: CalendarEvent[];
  /** Date sélectionnée (surlignage dans l’en‑tête) */
  selectedDate: Date | null;
  /** Clic sur un en‑tête de jour */
  onDayClick?: (date: Date) => void;
  /** Clic sur un créneau vide (date + heure décimale) */
  onSlotClick?: (date: Date, hour: number) => void;
  /** Clic sur un événement */
  onEventClick?: (event: CalendarEvent) => void;

  // Sélection multiple
  selectionRange?: SelectionRange | null;
  isSelecting?: boolean;
  onSelectionStart?: (cell: SelectableCell) => void;
  onSelectionMove?: (cell: SelectableCell) => void;
  onSelectionEnd?: () => void;

  // Redimensionnement
  resizingEvent?: { event: CalendarEvent; edge: 'start' | 'end' } | null;
  onResizeStart?: (event: CalendarEvent, edge: 'start' | 'end', mouseY: number) => void;
  onResizeMove?: (mouseY: number, containerRef: React.RefObject<HTMLElement>) => void;
  onResizeEnd?: () => void;

  /** Classes additionnelles */
  className?: string;
}

// ============================================================
// Composant principal : CalendarWeekView
// ============================================================

/**
 * Vue semaine du calendrier COS.
 */
export function CalendarWeekView({
  currentDate,
  weekDays,
  events,
  selectedDate,
  onDayClick,
  onSlotClick,
  onEventClick,
  selectionRange,
  isSelecting = false,
  onSelectionStart,
  onSelectionMove,
  onSelectionEnd,
  resizingEvent,
  onResizeStart,
  onResizeMove,
  onResizeEnd,
  className,
}: CalendarWeekViewProps): React.JSX.Element {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Scroll initial vers 7h
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const root = scrollRef.current;
      if (!root) return;
      const vp = root.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
      const target = vp ?? root;
      target.scrollTo({ top: 7 * HOUR_HEIGHT - 32, behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Gestion globale mouse move/up pour le redimensionnement
  React.useEffect(() => {
    if (!resizingEvent) return;
    const onMove = (e: MouseEvent) => {
      onResizeMove?.(e.clientY, containerRef as React.RefObject<HTMLElement>);
    };
    const onUp = () => onResizeEnd?.();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [resizingEvent, onResizeMove, onResizeEnd]);

  // Événements par jour (pour l’en‑tête et les dots)
  const eventsByDay = React.useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const day of weekDays) {
      map.set(
        day.toDateString(),
        events.filter((e) => isSameDay(e.startDate, day))
      );
    }
    return map;
  }, [weekDays, events]);

  // Vérifie si un créneau fait partie de la sélection en cours
  const isSlotSelected = React.useCallback(
    (dayIndex: number, slot: TimeSlot): boolean => {
      if (!selectionRange || !isSelecting) return false;
      const { start, end } = selectionRange;
      if (start.type !== 'timeslot' || !end) return false;
      const cellDate = new Date(weekDays[dayIndex]);
      cellDate.setHours(slot.hour, slot.minute, 0, 0);
      const t = cellDate.getTime();
      const s = Math.min(start.date.getTime(), end.date.getTime());
      const e2 = Math.max(start.date.getTime(), end.date.getTime());
      return t >= s && t <= e2;
    },
    [selectionRange, isSelecting, weekDays]
  );

  const weekNum = getWeekNumber(weekDays[0] ?? currentDate);
  const monthLabel = FRENCH_MONTHS[currentDate.getMonth()];
  const yearLabel = currentDate.getFullYear();

  return (
    <div
      className={cn('flex flex-col h-full ', isSelecting && 'cursor-crosshair', className)}
      ref={containerRef}
    >
      {/* En‑tête des jours (sticky) */}
      <div className="flex border-b sticky top-0 z-30 bg-background">
        <div className="w-14 shrink-0 border-r" />
        {weekDays.map((day, i) => {
          const today = isToday(day);
          const selected = selectedDate ? isSameDay(day, selectedDate) : false;
          const dayEvts = eventsByDay.get(day.toDateString()) ?? [];
          const isWeekend = i >= 5;

          return (
            <button
              key={i}
              type="button"
              onClick={() => onDayClick?.(day)}
              className={cn(
                'flex-1 flex flex-col items-center py-2 gap-1 border-r transition-colors',
                'hover:bg-muted/40 min-w-0',
                isWeekend && 'bg-muted/3',
                selected && !today && 'bg-accent/30'
              )}
            >
              <span
                className={cn(
                  'text-[10px] font-semibold uppercase tracking-widest select-none',
                  today
                    ? 'text-primary'
                    : isWeekend
                      ? 'text-muted-foreground/60'
                      : 'text-muted-foreground'
                )}
              >
                {FRENCH_DAYS_SHORT[i]}
              </span>
              <div
                className={cn(
                  'flex items-center justify-center h-8 w-8 rounded-xs text-sm font-semibold select-none transition-colors',
                  today && 'bg-primary text-primary-foreground shadow-sm',
                  selected && !today && 'bg-primary/15 text-primary',
                  !today && !selected && 'text-foreground'
                )}
              >
                {day.getDate()}
              </div>
              {dayEvts.length > 0 && (
                <div className="flex items-center gap-0.5 flex-wrap justify-center max-w-10">
                  {dayEvts.slice(0, 4).map((e) => (
                    <span
                      key={e.id}
                      className={cn(
                        'h-1 w-1 rounded-full',
                        e.isUrgent
                          ? 'bg-red-500'
                          : (EVENT_TYPE_CONFIG[e.type]?.dotColor ?? 'bg-primary/50')
                      )}
                    />
                  ))}
                  {dayEvts.length > 4 && (
                    <span className="text-[8px] text-muted-foreground tabular-nums">
                      +{dayEvts.length - 4}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Grille horaire scrollable */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollRef as React.RefObject<HTMLDivElement>}>
          <div
            className="relative flex"
            style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}
            onMouseUp={() => isSelecting && onSelectionEnd?.()}
            onMouseLeave={() => isSelecting && onSelectionEnd?.()}
          >
            {/* Colonne des heures */}
            <div className="w-14 shrink-0 relative select-none">
              {HOUR_LABELS.map((h) => (
                <div key={h} className="absolute w-full" style={{ top: `${h * HOUR_HEIGHT}px` }}>
                  {h > 0 && (
                    <span className="absolute -top-2.5 right-2.5 text-[10px] font-medium text-muted-foreground/70 tabular-nums">
                      {String(h).padStart(2, '0')}:00
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Colonnes des jours */}
            {weekDays.map((day, dayIdx) => {
              const today = isToday(day);
              const dayEvts = eventsByDay.get(day.toDateString()) ?? [];
              const isWeekend = dayIdx >= 5;

              return (
                <div
                  key={dayIdx}
                  className={cn(
                    'flex-1 relative border-r border-border/40',
                    today && 'bg-primary/1.5',
                    isWeekend && 'bg-muted/2'
                  )}
                >
                  {TIME_SLOTS.map((slot, si) => {
                    const inSel = isSlotSelected(dayIdx, slot);
                    return (
                      <div
                        key={si}
                        className={cn(
                          'absolute left-0 right-0 transition-colors duration-75',
                          inSel ? 'bg-primary/15' : 'hover:bg-muted/30',
                          isSelecting ? 'cursor-crosshair' : 'cursor-pointer'
                        )}
                        style={{
                          top: `${slot.topPx}px`,
                          height: `${HOUR_HEIGHT / SLOTS_PER_HOUR}px`,
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          if (!onSelectionStart) return;
                          const date = new Date(day);
                          date.setHours(slot.hour, slot.minute, 0, 0);
                          const end = new Date(date.getTime() + SLOT_MINUTES * 60_000);
                          onSelectionStart({ type: 'timeslot', date, endDate: end });
                        }}
                        onMouseEnter={() => {
                          if (!isSelecting || !onSelectionMove) return;
                          const date = new Date(day);
                          date.setHours(slot.hour, slot.minute, 0, 0);
                          const end = new Date(date.getTime() + SLOT_MINUTES * 60_000);
                          onSelectionMove({ type: 'timeslot', date, endDate: end });
                        }}
                        onClick={() => {
                          if (isSelecting) return;
                          const date = new Date(day);
                          date.setHours(slot.hour, slot.minute, 0, 0);
                          onSlotClick?.(date, slot.hour + slot.minute / 60);
                        }}
                      >
                        {/* Lignes d’heure */}
                        {slot.isHour && (
                          <div className="absolute top-0 left-0 right-0 border-t border-border/50" />
                        )}
                        {slot.isHalf && (
                          <div className="absolute top-0 left-0 right-0 border-t border-dashed border-border/30" />
                        )}
                        {!slot.isHour && !slot.isHalf && (
                          <div className="absolute top-0 left-0 right-0 border-t border-border/10" />
                        )}
                      </div>
                    );
                  })}

                  {/* Événements du jour */}
                  {dayEvts.map((evt) => (
                    <WeekEventChip
                      key={evt.id}
                      event={evt}
                      topPx={dateToPx(evt.startDate)}
                      heightPx={durationToPx(evt.startDate, evt.endDate)}
                      onClick={onEventClick ?? (() => {})}
                      onResizeStart={onResizeStart}
                      isResizing={resizingEvent?.event.id === evt.id}
                    />
                  ))}
                </div>
              );
            })}

            {/* Indicateur "maintenant" */}
            <NowIndicator weekDays={weekDays} />
          </div>
        </ScrollArea>
      </div>

      {/* Pied de page */}
      <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/20 text-xs text-muted-foreground select-none">
        <span className="font-medium">
          {monthLabel} {yearLabel}
        </span>
        <div className="flex items-center gap-3">
          {selectionRange && isSelecting && (
            <span className="text-primary font-semibold tabular-nums animate-in fade-in duration-150">
              {formatTime(selectionRange.start.date)} – {formatTime(selectionRange.end.date)}
            </span>
          )}
          <span className="font-semibold tabular-nums">Semaine {weekNum}</span>
        </div>
      </div>
    </div>
  );
}
