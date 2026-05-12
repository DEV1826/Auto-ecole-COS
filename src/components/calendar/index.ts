/**
 * @module components/calendar
 * @description Point d'entrée du module calendrier  Auto-École COS
 * @author Stive Junior
 * @version 1.0.0
 *
 * @example
 * ```tsx
 * import { AppCalendar, useCalendar, type CalendarEvent } from '@/components/calendar'
 * ```
 */

// Composant principal
export { AppCalendar } from './app-calendar';

// Sous-composants (pour usage avancé)
export { CalendarHeader } from './calendar-header';
export { CalendarWeekView } from './calendar-week-view';
export { CalendarMonthView } from './calendar-month-view';
export { CalendarSidebar } from './calendar-sidebar';
export { CalendarEventChip, CalendarWeekEventChip } from './calendar-event-chip';
export { CalendarEventDialog, type CalendarEventDialogProps } from './calendar-event-dialog';

// Squelettes et états vides
export {
  CalendarWeekSkeleton,
  CalendarMonthSkeleton,
  CalendarHeaderSkeleton,
  CalendarSidebarSkeleton,
  CalendarFullSkeleton,
  CalendarEmpty,
} from './calendar-skeleton';

// Hooks
export { useCalendar } from './use-calendar';

// Types et utilitaires
export type {
  CalendarEvent,
  CalendarEventType,
  CalendarEventStatus,
  CalendarEventPriority,
  CalendarView,
  CalendarFilters,
  CalendarState,
  CalendarEventFormData,
  CalendarActions,
  AppCalendarProps,
  CalendarPersonInfo,
  EventTypeConfig,
} from './types';

export {
  EVENT_TYPE_CONFIG,
  EVENT_STATUS_CONFIG,
  HOURS,
  HALF_HOURS,
  FRENCH_DAYS_SHORT,
  FRENCH_DAYS_LONG,
  FRENCH_MONTHS,
  // Utilitaires de date
  isSameDay,
  isToday,
  getWeekDays,
  getMonthDays,
  getWeekNumber,
  getEventsForDay,
  getEventsForHour,
  formatHour,
  getEventTop,
  getEventHeight,
} from './types';
