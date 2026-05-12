// src/components/calendar/calendar-event-chip.tsx

/**
 * @module components/calendar/calendar-event-chip
 * @description
 * Chips d'événements pour les vues mois et semaine du calendrier COS.
 * Version v2.0 — adaptée aux types d’événements de l’auto‑école :
 * - `lesson` (leçon)
 * - `exam` (examen)
 * - `payment` (paiement)
 * - `maintenance` (entretien véhicule)
 * - `reminder` (rappel)
 *
 * Design :
 * - Suppression des bordures box parasites : bande latérale gauche (2 px)
 * - Fond semi-transparent (couleur du type)
 * - Tooltip adaptatif (blanc light / noir dark)
 * - Avatars shadcn dans les tooltips
 * - `user-select: none` pour éviter la sélection accidentelle
 *
 * @author Stive Junior
 * @version 2.0.0
 *
 * @example
 * ```tsx
 * // Vue mois
 * <CalendarEventChip event={evt} onClick={openEventDialog} />
 *
 * // Vue semaine
 * <CalendarWeekEventChip
 *   event={evt}
 *   topPx={128}
 *   heightPx={64}
 *   onClick={openEventDialog}
 *   onResizeStart={startResizeEvent}
 * />
 * ```
 */

import * as React from 'react';
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
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  EVENT_STATUS_CONFIG,
  EVENT_TYPE_CONFIG,
  type CalendarEvent,
  type CalendarEventType,
} from './types';
// ─────────────────────────────────────────────────────────────────────────────
// Icône par type d'événement (COS)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mappe un type d’événement COS à son icône Lucide.
 */
const EVENT_ICON_MAP: Record<CalendarEventType, React.ElementType> = {
  lesson: Car,
  exam: GraduationCap,
  payment: CreditCard,
  maintenance: Wrench,
  reminder: Bell,
};

/**
 * Retourne l’icône Lucide associée à un type d’événement.
 *
 * @param type - Type d’événement calendrier
 * @param className - Classes CSS additionnelles
 * @returns Élément JSX de l’icône
 */
export function getEventIcon(
  type: CalendarEventType,
  className = 'h-2.5 w-2.5'
): React.JSX.Element {
  const Icon = EVENT_ICON_MAP[type] ?? Bell;
  return <Icon className={className} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Formatage d'heure
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formate une date en heure courte (HH:MM) en français.
 *
 * @param date - Date à formater
 * @returns Chaîne au format "HH:MM"
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

// ─────────────────────────────────────────────────────────────────────────────
// Tooltip unifié (partagé entre les deux variantes de chip)
// ─────────────────────────────────────────────────────────────────────────────

interface EventTooltipBodyProps {
  /** Événement dont afficher les détails */
  event: CalendarEvent;
}

/**
 * Contenu du tooltip d’un événement calendrier (COS).
 *
 * Affiche : titre, description, heure, lieu, candidat/moniteur,
 * badges de statut et d’urgence.
 */
function EventTooltipBody({ event }: EventTooltipBodyProps): React.JSX.Element {
  const cfg = EVENT_TYPE_CONFIG[event.type];
  const status = EVENT_STATUS_CONFIG[event.status];
  const person = event.candidat ?? event.moniteur;

  return (
    <div className="space-y-2.5 max-w-65 select-none">
      {/* Titre + description */}
      <div className="flex items-start gap-2">
        {getEventIcon(event.type, cn('h-4 w-4 mt-0.5 shrink-0', cfg.textColor))}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-snug">{event.title}</p>
          {event.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
              {event.description}
            </p>
          )}
        </div>
      </div>

      {/* Métadonnées */}
      <div className="space-y-1.5 text-xs">
        {/* Heure */}
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-3 w-3 shrink-0" />
          <span className="tabular-nums">
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

        {/* Personne (candidat ou moniteur) */}
        {person && (
          <div className="flex items-center gap-2 pt-0.5">
            <Avatar className="h-5 w-5 shrink-0">
              <AvatarImage src={person.avatarUrl} alt={person.name} />
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
              <p className="text-xs font-medium truncate leading-none">{person.name}</p>
              {person.role && (
                <p className="text-[10px] text-muted-foreground mt-0.5">{person.role}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Badges statut / urgence */}
      <div className="flex flex-wrap gap-1">
        <Badge
          variant="outline"
          className={cn(
            'text-[10px] h-4 px-1.5 border-0 font-normal',
            status.bgColor,
            status.textColor
          )}
        >
          {status.label}
        </Badge>
        {event.isUrgent && (
          <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
            Urgent
          </Badge>
        )}
        {event.priority && event.priority !== 'MEDIUM' && (
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
            {event.priority === 'URGENT'
              ? 'Urgence'
              : event.priority === 'HIGH'
                ? 'Priorité haute'
                : 'Faible'}
          </Badge>
        )}
      </div>
    </div>
  );
}

/**
 * Wrapper TooltipContent adaptatif blanc/noir selon le thème.
 */
function AdaptiveTooltipContent({
  children,
  side = 'right',
  sideOffset = 6,
  align = 'start',
}: {
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
  align?: 'start' | 'center' | 'end';
}): React.JSX.Element {
  return (
    <TooltipContent
      side={side}
      sideOffset={sideOffset}
      align={align}
      className={cn(
        'p-3 rounded-xs shadow-lg border',
        'bg-white text-neutral-900 border-neutral-200',
        'dark:bg-neutral-900 dark:text-neutral-50 dark:border-neutral-800'
      )}
    >
      {children}
    </TooltipContent>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CalendarEventChip — vue mois (compacte)
// ─────────────────────────────────────────────────────────────────────────────

interface CalendarEventChipProps {
  /** Événement à afficher */
  event: CalendarEvent;
  /** Mode compact (réduit le padding vertical) */
  compact?: boolean;
  /** Callback au clic sur le chip */
  onClick?: (event: CalendarEvent) => void;
  /** Classes CSS additionnelles */
  className?: string;
}

/**
 * Chip compact pour la vue mois.
 *
 * Design :
 * - Bande latérale gauche (2 px) de la couleur du type
 * - Fond coloré semi-transparent
 * - Icône + titre tronqué + indicateur urgent
 * - Tooltip adaptatif sur hover
 */
export function CalendarEventChip({
  event,
  compact = false,
  onClick,
  className,
}: CalendarEventChipProps): React.JSX.Element {
  const cfg = EVENT_TYPE_CONFIG[event.type];

  return (
    <TooltipProvider>
      <Tooltip delayDuration={400}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.(event);
            }}
            className={cn(
              'w-full text-left rounded-[3px] overflow-hidden select-none',
              cfg.bgColor,
              compact ? 'px-1.5 py-0.5' : 'px-1.5 py-1',
              'border-l-2',
              cfg.borderColor,
              'transition-opacity duration-100 hover:opacity-80',
              'focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/50',
              event.isUrgent && 'ring-1 ring-inset ring-red-400/50',
              className
            )}
          >
            <div className="flex items-center gap-1 min-w-0">
              {getEventIcon(event.type, cn('shrink-0', cfg.textColor, 'h-2.5 w-2.5'))}
              <span
                className={cn(
                  'truncate font-medium leading-none',
                  cfg.textColor,
                  compact ? 'text-[10px]' : 'text-xs'
                )}
              >
                {event.title}
              </span>
              {event.isUrgent && (
                <AlertTriangle className="h-2.5 w-2.5 text-red-500 shrink-0 ml-auto" />
              )}
            </div>
            {!compact && (
              <span className={cn('block text-[10px] mt-0.5 opacity-70', cfg.textColor)}>
                {formatTime(event.startDate)} – {formatTime(event.endDate)}
              </span>
            )}
          </button>
        </TooltipTrigger>
        <AdaptiveTooltipContent side="right" sideOffset={8} align="start">
          <EventTooltipBody event={event} />
        </AdaptiveTooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CalendarWeekEventChip — vue semaine (absolu dans la grille horaire)
// ─────────────────────────────────────────────────────────────────────────────

interface CalendarWeekEventChipProps {
  /** Événement à afficher */
  event: CalendarEvent;
  /** Décalage depuis le haut de la colonne (pixels) */
  topPx: number;
  /** Hauteur du chip (pixels) */
  heightPx: number;
  /** Callback au clic */
  onClick?: (event: CalendarEvent) => void;
  /** Début du redimensionnement (haut/bas) */
  onResizeStart?: (event: CalendarEvent, edge: 'start' | 'end', mouseY: number) => void;
  /** Indique si cet événement est en cours de redimensionnement */
  isResizing?: boolean;
}

/**
 * Chip pour la vue semaine, positionné absolument dans la colonne du jour.
 *
 * Design :
 * - Fond semi-transparent
 * - Bande latérale gauche via `border-l-2`
 * - Poignées de redimensionnement haut/bas
 * - Titre + heure en fonction de la hauteur disponible
 * - Tooltip adaptatif à droite
 */
export function CalendarWeekEventChip({
  event,
  topPx,
  heightPx,
  onClick,
  onResizeStart,
  isResizing,
}: CalendarWeekEventChipProps): React.JSX.Element {
  const cfg = EVENT_TYPE_CONFIG[event.type];
  const safeHeight = Math.max(heightPx, 22);
  const showTime = safeHeight >= 44;
  const showDuration = safeHeight >= 60;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={500}>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'absolute left-1 right-1 rounded-[3px] overflow-hidden select-none',
              cfg.bgColor,
              'border-l-2',
              cfg.borderColor,
              'shadow-sm',
              'cursor-pointer transition-all duration-100',
              'hover:opacity-90 hover:shadow-md hover:z-20',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/60',
              isResizing && 'z-30 ring-1 ring-primary shadow-md opacity-95'
            )}
            style={{
              top: `${topPx}px`,
              height: `${safeHeight}px`,
              zIndex: isResizing ? 30 : 10,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onClick?.(event);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.(event);
              }
            }}
            aria-label={`${event.title}, ${formatTime(event.startDate)} – ${formatTime(event.endDate)}`}
          >
            {/* Poignée supérieure */}
            {onResizeStart && (
              <div
                className="absolute top-0 left-0 right-0 h-1.5 cursor-ns-resize z-10 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onResizeStart(event, 'start', e.clientY);
                }}
              />
            )}

            <div className="flex flex-col pl-2 pr-1.5 py-0.5 h-full overflow-hidden">
              <div className="flex items-center gap-1 min-w-0 mt-0.5">
                {getEventIcon(event.type, cn('h-3 w-3 shrink-0', cfg.textColor))}
                <span
                  className={cn(
                    'font-semibold leading-none truncate',
                    cfg.textColor,
                    safeHeight < 32 ? 'text-[9px]' : 'text-[10px]'
                  )}
                >
                  {event.title}
                </span>
                {event.isUrgent && (
                  <AlertTriangle className="h-2.5 w-2.5 text-red-500 shrink-0 ml-auto" />
                )}
              </div>
              {showTime && (
                <span
                  className={cn(
                    'tabular-nums leading-none mt-0.5',
                    cfg.textColor,
                    'text-[9px] opacity-70'
                  )}
                >
                  {formatTime(event.startDate)}
                  {showDuration && ` – ${formatTime(event.endDate)}`}
                </span>
              )}
            </div>

            {/* Poignée inférieure */}
            {onResizeStart && (
              <div
                className="absolute bottom-0 left-0 right-0 h-1.5 cursor-ns-resize z-10 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onResizeStart(event, 'end', e.clientY);
                }}
              />
            )}
          </div>
        </TooltipTrigger>
        <AdaptiveTooltipContent side="right" sideOffset={10} align="start">
          <EventTooltipBody event={event} />
        </AdaptiveTooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Réexport du wrapper tooltip adaptatif pour usage externe
// ─────────────────────────────────────────────────────────────────────────────
export { AdaptiveTooltipContent };
