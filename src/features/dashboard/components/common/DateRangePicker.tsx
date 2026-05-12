/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * @module dashboard/components/common/DateRangePicker
 * @description
 * Calendrier grand format ultra‑complet pour tableaux de bord  Auto-École COS.
 *
 * Améliorations v3 :
 * - Navigation mois précédent/suivant avec animation fluide
 * - Marqueurs d'événements enrichis par type (badge coloré avec compteur)
 * - Drawer adaptatif bottom (mobile) / right (desktop) avec liste CRUD complète
 * - Mode liste alternatif avec tri et recherche
 * - Footer avec statistiques du mois (par type, total)
 * - Mini-prévisualisation au survol d'une date (tooltip avec événements)
 * - Support `person` avec Avatar dans les lignes du drawer
 * - Variantes 'full' | 'widget' | 'compact'
 * - `renderDayContent` et `renderDayMarker` pour personnalisation totale
 * - Accessible (aria-labels, keyboard nav)
 *
 * @author Stive Junior
 * @version 3.0.0
 *
 * @example
 * ```tsx
 * <DateRangePicker
 *   events={calendarEvents}
 *   onAddEvent={handleAdd}
 *   onEditEvent={handleEdit}
 *   onDeleteEvent={handleDelete}
 *   withTime
 *   enableRangeSelection
 *   variant="full"
 *   cardTitle="Mon agenda"
 * />
 * ```
 */

import * as React from 'react';
import { format, isSameDay, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Clock,
  Plus,
  Edit2,
  Trash2,
  CalendarDays,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  List,
  Grid3x3,
  Users,
  Pill,
  Briefcase,
  MoreHorizontal,
  Search,
  X,
} from 'lucide-react';
import type { DateRange, Matcher, Locale } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type CalendarEventType = 'appointment' | 'reminder' | 'task' | 'other';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date | string;
  endDate?: Date | string;
  startTime?: string;
  endTime?: string;
  type?: CalendarEventType;
  color?: string;
  person?: {
    id: string;
    name: string;
    avatarUrl?: string;
    role?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface DateRangePickerProps {
  events?: CalendarEvent[];
  enableRangeSelection?: boolean;
  dateRange?: DateRange;
  onRangeSelect?: (range: DateRange | undefined) => void;
  onAddEvent?: (date: Date, eventData: Partial<CalendarEvent>) => Promise<void>;
  onEditEvent?: (event: CalendarEvent) => Promise<void>;
  onDeleteEvent?: (event: CalendarEvent) => Promise<void>;
  onDateClick?: (date: Date, events: CalendarEvent[]) => void;
  withTime?: boolean;
  numberOfMonths?: number;
  captionLayout?: 'label' | 'dropdown' | 'dropdown-months' | 'dropdown-years';
  disabledDates?: Matcher | Matcher[];
  locale?: Locale;
  renderDayContent?: (date: Date, events: CalendarEvent[]) => React.ReactNode;
  renderDayMarker?: (date: Date, events: CalendarEvent[]) => React.ReactNode;
  variant?: 'full' | 'compact' | 'widget';
  cardTitle?: string;
  cardDescription?: string;
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

const EVENT_COLORS: Record<
  CalendarEventType,
  { dot: string; badge: string; label: string; icon: React.ElementType }
> = {
  appointment: {
    dot: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 font-semibold',
    label: 'Rendez-vous',
    icon: Users,
  },
  reminder: {
    dot: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 font-semibold',
    label: 'Rappel',
    icon: Pill,
  },
  task: {
    dot: 'bg-emerald-500',
    badge:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 font-semibold',
    label: 'Tâche',
    icon: Briefcase,
  },
  other: {
    dot: 'bg-slate-400',
    badge: 'bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-200 font-semibold',
    label: 'Autre',
    icon: MoreHorizontal,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getEventsForDate(events: CalendarEvent[], date: Date): CalendarEvent[] {
  return events.filter((ev) => {
    const d = new Date(ev.startDate);
    return !isNaN(d.getTime()) && isSameDay(d, date);
  });
}

function emptyForm(withTime: boolean): Partial<CalendarEvent> {
  return {
    title: '',
    description: '',
    type: 'appointment',
    startTime: withTime ? '09:00' : undefined,
    endTime: withTime ? '10:00' : undefined,
  };
}

function getMonthStats(events: CalendarEvent[], month: Date) {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const monthEvs = events.filter((ev) => {
    const d = new Date(ev.startDate);
    return d >= start && d <= end;
  });
  const byType = { appointment: 0, reminder: 0, task: 0, other: 0 } as Record<
    CalendarEventType,
    number
  >;
  monthEvs.forEach((ev) => {
    byType[ev.type ?? 'other']++;
  });
  return { total: monthEvs.length, byType };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composant : marqueur de jour
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composant : ligne d'événement dans le drawer
// ─────────────────────────────────────────────────────────────────────────────

interface EventRowProps {
  event: CalendarEvent;
  onEdit: (e: CalendarEvent) => void;
  onDelete: (e: CalendarEvent) => void;
  canEdit: boolean;
  canDelete: boolean;
}

function EventRow({
  event,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: EventRowProps): React.JSX.Element {
  const type = event.type ?? 'other';
  const cfg = EVENT_COLORS[type];
  const TypeIcon = cfg.icon;
  const person = event.person;

  const eventContent = (
    <div
      className={cn(
        'group flex items-start gap-3 rounded-xl border max-w-xl border-border/50 p-3 transition-all duration-150',
        (canEdit || canDelete) && 'hover:border-border hover:bg-muted/40 cursor-pointer'
      )}
      onClick={() => canEdit && onEdit(event)}
      role={canEdit ? 'button' : undefined}
      tabIndex={canEdit ? 0 : undefined}
      onKeyDown={(e) => e.key === 'Enter' && canEdit && onEdit(event)}
    >
      {/* Avatar ou icône */}
      {person ? (
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarImage src={person.avatarUrl} alt={person.name} />
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {person.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div
          className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xs', cfg.badge)}
        >
          <TypeIcon className="size-4" />
        </div>
      )}

      {/* Contenu */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <span className="font-medium text-sm leading-tight truncate">{event.title}</span>

          <Badge
            variant="outline"
            className={cn(
              'text-[10px] h-5 px-1.5 py-0 shrink-0 rounded-full border-0 font-medium',
              cfg.badge
            )}
          >
            <TypeIcon className="size-2.5 mr-1" />
            {cfg.label}
          </Badge>
        </div>

        {(event.startTime || event.endTime) && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3 shrink-0" />
            <span>
              {event.startTime}
              {event.endTime && ` – ${event.endTime}`}
            </span>
          </div>
        )}

        {event.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{event.description}</p>
        )}

        {person?.role && <span className="text-[10px] text-muted-foreground">{person.role}</span>}
      </div>

      {/* Actions (visibles au hover) */}
      {(canEdit || canDelete) && (
        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {canEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(event);
              }}
            >
              <Edit2 className="size-3" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(event);
              }}
            >
              <Trash2 className="size-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  );

  // ── Tooltip enrichi ──
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>{eventContent}</TooltipTrigger>
      <TooltipContent side="right" className="p-0 border-0 bg-transparent shadow-none">
        <div className="rounded-xs border border-border bg-popover p-3 shadow-md max-w-xs space-y-2.5">
          {/* En-tête avec type et badge */}
          <div className="flex items-start justify-between gap-2 border-b pb-2">
            <div className="flex items-center gap-2 flex-1">
              <div className={cn('h-6 w-6 rounded flex items-center justify-center', cfg.badge)}>
                <TypeIcon className="size-3" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground leading-tight truncate">
                  {event.title}
                </p>
                <Badge
                  variant="outline"
                  className={cn('text-[9px] h-3 px-1 mt-1 border-0', cfg.badge)}
                >
                  {cfg.label}
                </Badge>
              </div>
            </div>
          </div>

          {/* Info personnelle */}
          {person && (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={person.avatarUrl} alt={person.name} />
                <AvatarFallback className="text-[9px]">
                  {person.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-foreground truncate">{person.name}</p>
                {person.role && <p className="text-[9px] text-muted-foreground">{person.role}</p>}
              </div>
            </div>
          )}

          {/* Horaires */}
          {(event.startTime || event.endTime) && (
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Clock className="size-3.5 shrink-0" />
              <span>
                {event.startTime}
                {event.endTime && ` → ${event.endTime}`}
              </span>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="border-t pt-2">
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                {event.description}
              </p>
            </div>
          )}

          {/* Métadonnées */}
          {event.metadata && Object.keys(event.metadata).length > 0 && (
            <div className="border-t pt-2 space-y-1">
              {Object.entries(event.metadata)
                .slice(0, 3)
                .map(([key, value], idx) => (
                  <div key={idx} className="flex justify-between gap-2 text-[9px]">
                    <span className="font-medium text-muted-foreground capitalize">{key}:</span>
                    <span className="text-foreground">{String(value)}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

export function DateRangePicker({
  events = [],
  enableRangeSelection = true,
  dateRange,
  onRangeSelect,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
  onDateClick,
  withTime = false,
  numberOfMonths = 1,
  captionLayout = 'dropdown',
  disabledDates,
  locale = fr,
  variant = 'full',
  cardTitle = 'Calendrier',
  cardDescription,
  className,
}: DateRangePickerProps): React.JSX.Element {
  const isMobile = useIsMobile();

  // ── États ─────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [formData, setFormData] = React.useState<Partial<CalendarEvent>>(emptyForm(withTime));
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'calendar' | 'list'>('calendar');
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());
  const [listSearch, setListSearch] = React.useState('');

  // ── Dérivés ───────────────────────────────────────────
  const dayEvents = React.useMemo(
    () => (selectedDate ? getEventsForDate(events, selectedDate) : []),
    [events, selectedDate]
  );

  const monthStats = React.useMemo(
    () => getMonthStats(events, currentMonth),
    [events, currentMonth]
  );

  const filteredListEvents = React.useMemo(() => {
    const sorted = [...events].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
    if (!listSearch.trim()) return sorted;
    const q = listSearch.toLowerCase();
    return sorted.filter(
      (ev) => ev.title.toLowerCase().includes(q) || ev.description?.toLowerCase().includes(q)
    );
  }, [events, listSearch]);

  const modifiers = React.useMemo(
    () => ({
      hasEvents: (date: Date) => getEventsForDate(events, date).length > 0,
    }),
    [events]
  );

  // ── Handlers ─────────────────────────────────────────
  const handleDayClick = React.useCallback(
    (day: Date) => {
      setSelectedDate(day);
      const dayEvs = getEventsForDate(events, day);
      onDateClick?.(day, dayEvs);
      if (dayEvs.length > 0 || onAddEvent) {
        setDrawerOpen(true);
      }
    },
    [events, onDateClick, onAddEvent]
  );

  const openAddDialog = React.useCallback(() => {
    setIsEditing(false);
    setFormData(emptyForm(withTime));
    setDialogOpen(true);
    setDrawerOpen(false);
  }, [withTime]);

  const openEditDialog = React.useCallback((event: CalendarEvent) => {
    setIsEditing(true);
    setFormData({ ...event });
    setDialogOpen(true);
    setDrawerOpen(false);
  }, []);

  const handleDeleteEvent = React.useCallback(
    async (event: CalendarEvent) => {
      await onDeleteEvent?.(event);
      setDrawerOpen(false);
    },
    [onDeleteEvent]
  );

  const handleSubmit = React.useCallback(async () => {
    if (!formData.title?.trim()) return;
    setIsSubmitting(true);
    try {
      if (isEditing && onEditEvent) {
        await onEditEvent(formData as CalendarEvent);
      } else if (!isEditing && onAddEvent && selectedDate) {
        await onAddEvent(selectedDate, formData);
      }
      setDialogOpen(false);
      setFormData(emptyForm(withTime));
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isEditing, onEditEvent, onAddEvent, selectedDate, withTime]);

  const update = React.useCallback((key: keyof CalendarEvent, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  // ── Composant jour personnalisé (version ronde, sans marqueur bas, indicateur haut) ──
  const CustomDayButton = React.useCallback(
    ({ day, ...props }: any) => {
      const dayEvs = getEventsForDate(events, day.date);
      const hasEvents = dayEvs.length > 0;
      const isSelected = dateRange?.from && isSameDay(day.date, dateRange.from);
      const isInRange =
        dateRange?.from && dateRange?.to && day.date > dateRange.from && day.date < dateRange.to;
      const isToday = isSameDay(day.date, new Date());

      // Indicateur haut (petit point ou ligne)
      const topIndicator = hasEvents && (
        <div className="absolute top-1 left-1/2 -translate-x-1/2">
          <div className="h-1 w-1 rounded-full bg-emerald-500" />
        </div>
      );

      // Le bouton lui-même, rond
      const button = (
        <button
          {...props}
          className={cn(
            'relative flex h-10! w-10! flex-col items-center justify-center rounded-full transition-all',
            'hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            // Fond pour les événements (léger)
            hasEvents && !isSelected && !isToday && 'bg-primary/5 hover:bg-primary/10 ',
            isSelected && 'bg-primary text-primary-foreground shadow-md scale-105',
            isInRange && 'bg-primary/20',
            isToday && 'bg-emerald-500 hover:bg-emerald-500/20',
            // Bordure subtile pour les jours hors mois
            day.outside && 'opacity-40'
          )}
        >
          {topIndicator}
          <span className="text-sm font-medium">{format(day.date, 'd')}</span>
        </button>
      );

      // Tooltip (conservé)
      if (dayEvs.length === 0) return button;

      return (
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="top" className="p-0 border-0 bg-transparent shadow-none">
            <div className="rounded-xs border border-border bg-popover p-3 shadow-md max-w-xs space-y-2">
              <div className="flex items-center gap-2 border-b pb-2">
                <CalendarDays className="size-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs font-semibold capitalize text-foreground">
                  {format(day.date, 'EEEE d MMMM', { locale })}
                </span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {dayEvs.slice(0, 5).map((ev, idx) => {
                  const type = ev.type ?? 'other';
                  const cfg = EVENT_COLORS[type];
                  const TypeIcon = cfg.icon;
                  return (
                    <div key={idx} className="flex items-start gap-2 text-[11px]">
                      <div
                        className={cn(
                          'h-5 w-5 rounded flex items-center justify-center shrink-0',
                          cfg.badge
                        )}
                      >
                        <TypeIcon className="size-2.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{ev.title}</p>
                        {ev.startTime && (
                          <p className="text-muted-foreground">
                            {ev.startTime}
                            {ev.endTime && ` – ${ev.endTime}`}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {dayEvs.length > 5 && (
                  <div className="text-[10px] text-muted-foreground italic pt-1">
                    +{dayEvs.length - 5} autre{dayEvs.length - 5 > 1 ? 's' : ''}
                  </div>
                )}
              </div>
              <div className="border-t pt-1.5 flex items-center justify-between">
                <span className="text-[10px] font-medium text-muted-foreground">
                  {dayEvs.length} événement{dayEvs.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      );
    },
    [events, dateRange, locale]
  );

  const CustomDay = ({ day, children, ...props }: any) => {
    const isInRange =
      dateRange?.from && dateRange?.to && day.date > dateRange.from && day.date < dateRange.to;
    const isStart = dateRange?.from && isSameDay(day.date, dateRange.from);
    const isEnd = dateRange?.to && isSameDay(day.date, dateRange.to);

    return (
      <td className={cn('p-0 bg-transaprent h-10 w-10')} {...props}>
        <div
          className={cn(
            'relative flex h-10 w-full items-center justify-center transition-all duration-150',
            isInRange && 'bg-primary/10',
            isStart && 'rounded-l-full bg-primary/15',
            isEnd && 'rounded-r-full bg-primary/15',
            (isStart || isEnd) && 'bg-primary/20'
          )}
        >
          {/* ⚠️ Il faut absolument rendre les enfants (le DayButton) */}
          {children}
        </div>
      </td>
    );
  };
  /**
   * Objet de tous les composants personnalisés disponibles
   * pour une personnalisation maximale du calendrier react-day-picker
   */
  const customDayPickerComponents = {
    // ── Contenu et cellules des jours ──
    DayButton: CustomDayButton,
    Day: CustomDay,
  };

  // ── Mode liste ────────────────────────────────────────
  const ListMode = () => (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          value={listSearch}
          onChange={(e) => setListSearch(e.target.value)}
          placeholder="Rechercher un événement…"
          className="pl-8 h-8 text-xs"
        />
        {listSearch && (
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setListSearch('')}
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <ScrollArea className="h-[380px]">
        <div className="space-y-2 pr-2">
          {filteredListEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <AlertCircle className="size-8 mb-2 opacity-30" />
              <p className="text-xs">Aucun événement trouvé</p>
            </div>
          ) : (
            filteredListEvents.map((ev) => {
              const evDate = new Date(ev.startDate);
              return (
                <div key={ev.id}>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide px-1 mb-1">
                    {format(evDate, 'EEEE d MMMM', { locale })}
                  </p>
                  <EventRow
                    event={ev}
                    onEdit={openEditDialog}
                    onDelete={handleDeleteEvent}
                    canEdit={!!onEditEvent}
                    canDelete={!!onDeleteEvent}
                  />
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );

  // ── Drawer du jour ────────────────────────────────────
  const drawerNode = selectedDate && (
    <Drawer
      open={drawerOpen}
      onOpenChange={setDrawerOpen}
      direction={isMobile ? 'bottom' : 'right'}
    >
      <DrawerContent className={cn(isMobile ? 'h-[85vh]' : 'w-[420px]')}>
        <DrawerHeader className="border-b pb-4">
          <DrawerTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="size-4 shrink-0 text-primary" />
            <span className="capitalize">
              {format(selectedDate, 'EEEE d MMMM yyyy', { locale })}
            </span>
          </DrawerTitle>
          <DrawerDescription className="text-xs">
            {dayEvents.length} événement{dayEvents.length > 1 ? 's' : ''} programmé
            {dayEvents.length > 1 ? 's' : ''}
          </DrawerDescription>
        </DrawerHeader>

        <ScrollArea className="flex-1 px-4 py-3">
          <div className="space-y-2">
            {dayEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <AlertCircle className="size-8 mb-2 opacity-30" />
                <p className="text-sm">Aucun événement ce jour</p>
                {onAddEvent && (
                  <p className="text-xs mt-1">Cliquez sur "Ajouter" pour en créer un</p>
                )}
              </div>
            ) : (
              dayEvents.map((ev) => (
                <EventRow
                  key={ev.id}
                  event={ev}
                  onEdit={openEditDialog}
                  onDelete={handleDeleteEvent}
                  canEdit={!!onEditEvent}
                  canDelete={!!onDeleteEvent}
                />
              ))
            )}
          </div>
        </ScrollArea>

        <DrawerFooter className="border-t pt-3 flex-row justify-between gap-2">
          {onAddEvent && (
            <Button onClick={openAddDialog} className="gap-2 flex-1">
              <Plus className="size-4" />
              Ajouter un événement
            </Button>
          )}
          <DrawerClose asChild>
            <Button variant="outline" className={cn(!onAddEvent && 'flex-1')}>
              Fermer
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );

  // ── Dialogue CRUD ─────────────────────────────────────
  const dialogNode = (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modifier l'événement" : 'Nouvel événement'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifiez les informations ci-dessous.'
              : selectedDate
                ? `Ajout pour le ${format(selectedDate, 'dd MMMM yyyy', { locale })}.`
                : "Remplissez les informations de l'événement."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="ev-title">
              Titre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ev-title"
              value={(formData.title as string) ?? ''}
              onChange={(e) => update('title', e.target.value)}
              placeholder="Ex: Consultation Dr. Martin"
              autoFocus
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="ev-type">Type</Label>
            <Select
              value={(formData.type as string) ?? 'appointment'}
              onValueChange={(v) => update('type', v)}
            >
              <SelectTrigger id="ev-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EVENT_COLORS).map(([val, cfg]) => (
                  <SelectItem key={val} value={val}>
                    <div className="flex items-center gap-2">
                      <span className={cn('h-2 w-2 rounded-full', cfg.dot)} />
                      {cfg.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {withTime && (
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="ev-start">Début</Label>
                <Input
                  id="ev-start"
                  type="time"
                  value={(formData.startTime as string) ?? '09:00'}
                  onChange={(e) => update('startTime', e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ev-end">Fin</Label>
                <Input
                  id="ev-end"
                  type="time"
                  value={(formData.endTime as string) ?? '10:00'}
                  onChange={(e) => update('endTime', e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="ev-desc">Description</Label>
            <Textarea
              id="ev-desc"
              rows={2}
              className="resize-none"
              value={(formData.description as string) ?? ''}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Détails, notes, instructions…"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!(formData.title as string)?.trim() || isSubmitting}
          >
            {isSubmitting ? 'Enregistrement…' : isEditing ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // ── Contenu principal ─────────────────────────────────
  const mainContent = (
    <div className="flex h-full w-full flex-col">
      {/* Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5">
        <div className="flex items-center gap-0.5">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-full hover:bg-primary/10 hover:text-primary"
            onClick={() => {
              const d = new Date(currentMonth);
              d.setMonth(d.getMonth() - 1);
              setCurrentMonth(d);
            }}
          >
            <ChevronLeft className="size-4" />
          </Button>

          <span className="min-w-[130px] text-center text-sm font-semibold capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale })}
          </span>

          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-full hover:bg-primary/10 hover:text-primary"
            onClick={() => {
              const d = new Date(currentMonth);
              d.setMonth(d.getMonth() + 1);
              setCurrentMonth(d);
            }}
          >
            <ChevronRight className="size-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 rounded-full px-2 text-xs font-normal hover:bg-primary/10 hover:text-primary"
            onClick={() => setCurrentMonth(new Date())}
          >
            Aujourd'hui
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode('calendar')}
            title="Vue calendrier"
          >
            <Grid3x3 className="size-3.5" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode('list')}
            title="Vue liste"
          >
            <List className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Calendrier ou liste */}
      <div className="flex-1 overflow-auto p-3">
        {viewMode === 'calendar' ? (
          <TooltipProvider>
            {enableRangeSelection ? (
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={onRangeSelect}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                numberOfMonths={numberOfMonths}
                captionLayout={captionLayout}
                disabled={disabledDates}
                locale={locale}
                modifiers={modifiers}
                onDayClick={handleDayClick}
                components={customDayPickerComponents as any}
                className="w-full [&_table]:w-full [&_td]:h-14"
                showOutsideDays
                required
              />
            ) : (
              <Calendar
                mode="single"
                selected={dateRange?.from}
                onSelect={(date) => onRangeSelect?.({ from: date, to: date })}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                numberOfMonths={numberOfMonths}
                captionLayout={captionLayout}
                disabled={disabledDates}
                locale={locale}
                modifiers={modifiers}
                onDayClick={handleDayClick}
                components={customDayPickerComponents as any}
                className="w-full [&_table]:w-full [&_td]:h-14"
                showOutsideDays
              />
            )}
          </TooltipProvider>
        ) : (
          <ListMode />
        )}
      </div>

      {/* Footer statistiques */}
      <div className="border-t px-4 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground">
              {monthStats.total} événement{monthStats.total > 1 ? 's' : ''} ce mois
            </span>
            <Separator orientation="vertical" className="h-3.5 hidden sm:block" />
            <div className="flex items-center gap-2 flex-wrap">
              {(Object.entries(monthStats.byType) as [CalendarEventType, number][]).map(
                ([type, count]) =>
                  count > 0 ? (
                    <div key={type} className="flex items-center gap-1">
                      <span className={cn('h-1.5 w-1.5 rounded-full', EVENT_COLORS[type].dot)} />
                      <span className="text-[10px] text-muted-foreground">
                        {EVENT_COLORS[type].label} {count}
                      </span>
                    </div>
                  ) : null
              )}
            </div>
          </div>

          {onAddEvent && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1.5"
              onClick={() => {
                setSelectedDate(new Date());
                openAddDialog();
              }}
            >
              <Plus className="size-3.5" />
              Ajouter
            </Button>
          )}
        </div>
      </div>

      {drawerNode}
      {dialogNode}
    </div>
  );

  // ── Rendu selon variante ──────────────────────────────
  if (variant === 'compact') {
    return <div className={cn('h-full w-full', className)}>{mainContent}</div>;
  }

  if (variant === 'widget') {
    return (
      <Card className={cn('h-full w-full overflow-hidden', className)}>
        <CardContent className="h-full p-0">{mainContent}</CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('flex h-full w-full flex-col overflow-hidden', className)}>
      {(cardTitle || cardDescription) && (
        <CardHeader className="shrink-0 pb-0">
          {cardTitle && <CardTitle className="text-base">{cardTitle}</CardTitle>}
          {cardDescription && <CardDescription>{cardDescription}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="flex-1 p-0">{mainContent}</CardContent>
    </Card>
  );
}
