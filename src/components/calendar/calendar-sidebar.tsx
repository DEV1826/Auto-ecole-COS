// src/components/calendar/calendar-sidebar.tsx

/**
 * @module components/calendar/calendar-sidebar
 * @description
 * Sidebar droite du calendrier COS – version ultra améliorée.
 * Intègre :
 * - Mini‑calendrier interactif (navigation mois, points de présence, sélection)
 * - Liste des événements du jour sélectionné en timeline verticale
 *   avec avatars professionnels (ou icône par défaut), badges de type et statut
 * - Bouton flottant d'ajout rapide (au survol d'une date dans le mini‑calendrier)
 * - Repliable (collapsible) pour économiser l'espace
 *
 * Tous les composants UI proviennent de shadcn/ui, icônes Lucide uniquement.
 *
 * @author Stive Junior
 * @version 2.0.0 – adapté aux types COS (lesson, exam, payment, maintenance, reminder)
 *
 * @example
 * ```tsx
 * <CalendarSidebar
 *   currentDate={currentDate}
 *   selectedDate={selectedDate}
 *   events={filteredEvents}
 *   onDateSelect={selectDate}
 *   onEventClick={openEventDialog}
 *   onNewEvent={openCreateDialog}
 *   collapsible
 * />
 * ```
 */

import * as React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  MapPin,
  ChevronRight as ChevronRightIcon,
  Plus,
  ChevronLeftIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  type CalendarEvent,
  EVENT_TYPE_CONFIG,
  EVENT_STATUS_CONFIG,
  isSameDay,
  isToday,
  getMonthDays,
  FRENCH_DAYS_SHORT,
  FRENCH_MONTHS,
} from './types';

// ============================================================
// Sous-composant : Mini‑calendrier avec ajout rapide
// ============================================================

interface MiniCalendarProps {
  date: Date;
  events: CalendarEvent[];
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  onNewEvent?: (date: Date) => void;
}

/**
 * Mini‑calendrier amélioré avec :
 * - Navigation mois
 * - Grille 7×6 (42 jours)
 * - Points indicateurs de présence d'événements (couleur config) et urgence (rouge)
 * - Surlignement du jour sélectionné et d'aujourd'hui
 * - Bouton flottant "+" au survol d'une date (si onNewEvent fourni)
 */
function MiniCalendar({
  date,
  events,
  selectedDate,
  onDateSelect,
  onNewEvent,
}: MiniCalendarProps): React.JSX.Element {
  const [viewDate, setViewDate] = React.useState(new Date(date));
  const [hoveredDate, setHoveredDate] = React.useState<Date | null>(null);
  const days = React.useMemo(() => getMonthDays(viewDate), [viewDate]);
  const currentMonth = viewDate.getMonth();

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setViewDate(new Date(date));
  }, [date]);

  const goPrev = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goNext = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  return (
    <div className="px-3 py-2">
      {/* En‑tête avec navigation */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold">
          {FRENCH_MONTHS[viewDate.getMonth()].slice(0, 4)}. {viewDate.getFullYear()}
        </span>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={goPrev}>
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={goNext}>
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Jours de la semaine (abrégés) */}
      <div className="grid grid-cols-7 mb-1">
        {FRENCH_DAYS_SHORT.map((d) => (
          <div key={d} className="text-center text-[9px] font-medium text-muted-foreground py-0.5">
            {d[0]}
          </div>
        ))}
      </div>

      {/* Grille des jours */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((day, i) => {
          const isCurrentMonth = day.getMonth() === currentMonth;
          const today = isToday(day);
          const selected = selectedDate ? isSameDay(day, selectedDate) : false;
          const hasEvents = events.some((e) => isSameDay(e.startDate, day));
          const hasUrgent = events.some((e) => isSameDay(e.startDate, day) && e.isUrgent);
          const isHovered = hoveredDate && isSameDay(day, hoveredDate);

          return (
            <div
              key={i}
              className="relative"
              onMouseEnter={() => setHoveredDate(day)}
              onMouseLeave={() => setHoveredDate(null)}
            >
              <button
                onClick={() => onDateSelect(day)}
                className={cn(
                  'relative flex flex-col items-center justify-center w-7 h-7 text-[10px] rounded-xs',
                  'hover:bg-accent focus:outline-none focus:ring-1 focus:ring-primary/50',
                  !isCurrentMonth && 'opacity-30',
                  today && 'bg-blue-800 text-white font-bold hover:bg-blue-900',
                  selected && !today && 'bg-accent text-accent-foreground font-semibold',
                  !today && !selected && 'text-foreground'
                )}
              >
                <span>{day.getDate()}</span>
                {hasEvents && !today && (
                  <span
                    className={cn(
                      'absolute bottom-0.5 h-0.5 w-3 rounded-xs',
                      hasUrgent ? 'bg-red-500' : 'bg-primary/60'
                    )}
                  />
                )}
              </button>
              {/* Bouton flottant "+" au survol */}
              {onNewEvent && isHovered && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-xs shadow-md z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNewEvent(day);
                  }}
                >
                  <Plus className="h-2.5 w-2.5" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Sous-composant : élément d’événement dans la timeline
// ============================================================

interface SidebarEventItemProps {
  event: CalendarEvent;
  onClick: (event: CalendarEvent) => void;
  isLast?: boolean;
}

/**
 * Affiche un événement dans la timeline verticale.
 * - Avatar de la personne associée (candidat ou moniteur) ou icône de type
 * - Titre, badge type, badge urgence
 * - Horaires, lieu, personne
 * - Badge de statut
 * - Ligne pointillée à gauche (sauf pour le dernier)
 *
 * Gestion du débordement : `min-w-0`, `truncate`, `overflow-hidden` sur chaque zone de texte.
 */
function SidebarEventItem({
  event,
  onClick,
  isLast = false,
}: SidebarEventItemProps): React.JSX.Element {
  const config = EVENT_TYPE_CONFIG[event.type];
  const statusConfig = EVENT_STATUS_CONFIG[event.status];
  const person = event.candidat ?? event.moniteur;
  const DefaultIcon = config.icon;

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="relative pl-6 pb-5 last:pb-0 group">
      {/* Ligne verticale pointillée (sauf dernier) */}
      {!isLast && (
        <div className="absolute left-3.5 top-5 bottom-0 w-px border-l-2 border-dashed border-gray-200 dark:border-gray-800" />
      )}

      {/* Cercle / Avatar à gauche */}
      <div className="absolute left-0 top-0.5 z-10">
        {person?.avatarUrl ? (
          <Avatar className="h-8 w-8 border-2 border-white ring-2 ring-gray-200 dark:border-gray-800 dark:ring-gray-800">
            <AvatarImage src={person.avatarUrl} alt={person.name} />
            <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
              {getInitials(person.name)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-xs border-2 border-white bg-gray-100 text-gray-500 ring-2 ring-gray-200 dark:border-gray-800 dark:bg-gray-900 dark:ring-gray-800',
              config.textColor
            )}
          >
            <DefaultIcon className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Contenu principal – container avec `min-w-0` pour permettre le truncation */}
      <div
        className="ml-5 min-w-0 cursor-pointer p-2.5 transition-all hover:brightness-95"
        onClick={() => onClick(event)}
      >
        {/* En‑tête : titre + badges */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className={cn('shrink-0', config.textColor)}>
              <DefaultIcon className="h-3.5 w-3.5" />
            </span>
            <span className={cn('text-sm font-semibold truncate min-w-0 flex-1', config.textColor)}>
              {event.title}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Badge
              variant="outline"
              className={cn('text-[10px] h-5 px-1.5 border-0', config.bgColor, config.textColor)}
            >
              {config.label}
            </Badge>
            {event.isUrgent && (
              <Badge variant="destructive" className="text-[10px] h-5 px-1.5">
                Urgent
              </Badge>
            )}
          </div>
        </div>

        {/* Détails : horaire, lieu, personne */}
        <div className="mt-1.5 space-y-1 text-xs text-muted-foreground">
          {!event.allDay && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {formatTime(event.startDate)} – {formatTime(event.endDate)}
              </span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-1.5 truncate min-w-0">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          {person && (
            <div className="flex items-center gap-1.5 min-w-0">
              <Avatar className="h-5 w-5 border-2 border-white ring-2 ring-gray-200 dark:border-gray-800 dark:ring-gray-800 shrink-0">
                <AvatarImage src={person.avatarUrl} alt={person.name} />
                <AvatarFallback className="text-[5px] bg-primary/10 text-primary font-semibold">
                  {getInitials(person.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <span className="truncate block">{person.name}</span>
                {person.role && (
                  <span className="text-[10px] text-muted-foreground/70">{person.role}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Badge de statut */}
        <div className="mt-2">
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] h-5 px-2 border-0',
              statusConfig.bgColor,
              statusConfig.textColor
            )}
          >
            {statusConfig.label}
          </Badge>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Composant principal CalendarSidebar
// ============================================================

export interface CalendarSidebarProps {
  /** Date courante (synchronise le mini‑calendrier avec la vue principale) */
  currentDate: Date;
  /** Date sélectionnée (pour surligner le jour et afficher ses événements) */
  selectedDate: Date | null;
  /** Liste des événements (déjà filtrés) */
  events: CalendarEvent[];
  /** Callback lorsqu'une date est sélectionnée (clic dans le mini‑calendrier) */
  onDateSelect: (date: Date) => void;
  /** Callback lorsqu'un événement est cliqué (ouvre le dialogue de détail) */
  onEventClick: (event: CalendarEvent) => void;
  /** Callback pour créer un événement à une date donnée (optionnel) */
  onNewEvent?: (date: Date) => void;
  /** Permet de rendre la sidebar repliable (défaut : false) */
  collapsible?: boolean;
  /** État initial replié (défaut : false) */
  defaultCollapsed?: boolean;
  /** Classes CSS additionnelles */
  className?: string;
}

/**
 * Sidebar droite du calendrier – version ultra améliorée.
 * - Mini‑calendrier avec navigation et ajout rapide
 * - Timeline verticale des événements du jour sélectionné
 * - Repliable (collapsible)
 * - Gestion du débordement de texte (truncate, min-width)
 */
export function CalendarSidebar({
  currentDate,
  selectedDate,
  events,
  onDateSelect,
  onEventClick,
  onNewEvent,
  collapsible = false,
  defaultCollapsed = false,
  className,
}: CalendarSidebarProps): React.JSX.Element {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);

  // Date effective pour l’affichage des événements
  const displayDate = selectedDate ?? new Date();
  const dayEvents = events
    .filter((e) => isSameDay(e.startDate, displayDate))
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  const todayLabel = isToday(displayDate)
    ? "Aujourd'hui"
    : displayDate.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });

  // Mode replié
  if (collapsible && collapsed) {
    return (
      <aside
        className={cn(
          'flex flex-col border-l bg-background w-10 shrink-0 items-center py-2',
          className
        )}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCollapsed(false)}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs">
              Afficher la sidebar
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </aside>
    );
  }

  // Mode déplié
  return (
    <aside
      className={cn(
        'flex flex-col border-l bg-background w-64 xl:w-80 shrink-0 relative',
        className
      )}
    >
      {/* Bouton de repli (si collapsible) */}
      {collapsible && (
        <div className="absolute top-2 -left-3 z-20">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 rounded-xs bg-background border-gray-700 hover:bg-gray-100 focus:ring-1 focus:ring-primary/50"
            onClick={() => setCollapsed(true)}
          >
            <ChevronRightIcon className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Mini‑calendrier */}
      <div className="border-b">
        <MiniCalendar
          date={currentDate}
          events={events}
          selectedDate={selectedDate}
          onDateSelect={onDateSelect}
          onNewEvent={onNewEvent}
        />
      </div>

      {/* Liste des événements du jour */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-4 py-2 border-b">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-semibold capitalize truncate">{todayLabel}</span>
            {dayEvents.length > 0 && (
              <Badge variant="secondary" className="ml-auto text-[10px] h-5 px-1.5 shrink-0">
                {dayEvents.length}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex-1 px-1 py-2 overflow-x-auto">
          {dayEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <CalendarDays className="h-10 w-10 opacity-20 mb-2" />
              <p className="text-xs font-medium">Aucun événement</p>
              <p className="text-[10px] mt-0.5">Cliquez sur une date pour voir ses événements</p>
            </div>
          ) : (
            <div className="space-y-1 px-1 w-aut">
              {dayEvents.map((event, idx) => (
                <SidebarEventItem
                  key={event.id}
                  event={event}
                  onClick={onEventClick}
                  isLast={idx === dayEvents.length - 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
