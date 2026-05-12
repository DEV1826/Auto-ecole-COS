'use client';

/**
 * @module components/calendar/app-calendar
 * @description
 * Composant principal du calendrier  Auto-École COS — version 1.2.0.
 *
 * Assemblage de :
 * ─ `CalendarHeader`   : navigation, filtres, recherche, toggle vue
 * ─ `CalendarWeekView` : grille horaire 24 h (v1.1), sélection, redimensionnement
 * ─ `CalendarMonthView`: grille 42 jours (v1.0), défilement inter-mois, sélection
 * ─ `CalendarSidebar`  : mini-calendrier + événements du jour sélectionné
 * ─ `CalendarEventDialog` : Dialog desktop / Drawer mobile (création + détail)
 *
 * Toute la logique d'état est déléguée à `useCalendar` (v2).
 * Les permissions sont adaptées par rôle utilisateur.
 *
 * @author Stive Junior
 * @version 1.2.0
 *
 * @example
 * ```tsx
 * <AppCalendar
 *   events={calendarEvents}
 *   Role={Role.DOCTOR}
 *   actions={{
 *     onCreate: async (data) => createEvent(data),
 *     onUpdate: async (id, data) => updateEvent(id, data),
 *     onDelete: async (id) => deleteEvent(id),
 *     onConfirm: async (evt) => confirmAppointment(evt.id),
 *     onCancel: async (evt) => cancelAppointment(evt.id),
 *   }}
 *   canCreate
 *   canEdit
 *   canDelete
 *   defaultView="week"
 * />
 * ```
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { CalendarHeader } from './calendar-header';
import { CalendarWeekView } from './calendar-week-view';
import { CalendarMonthView } from './calendar-month-view';
import { CalendarSidebar } from './calendar-sidebar';
import { CalendarEventDialog } from './calendar-event-dialog';
import { CalendarFullSkeleton } from './calendar-skeleton';
import { useCalendar } from './use-calendar';
import type { AppCalendarProps, CalendarEventFormData } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calendrier complet  Auto-École COS.
 *
 * Intègre toutes les vues (semaine, mois), la sidebar droite, les dialogs
 * de création / détail, et s'adapte au rôle de l'utilisateur.
 *
 * @param props - Voir `AppCalendarProps` dans `types.ts`
 */
export function AppCalendar({
  events = [],
  actions,
  defaultView = 'week',
  defaultDate,
  className,
  isLoading = false,
  canCreate: propCanCreate = true,
  canEdit: propCanEdit = true,
  canDelete: propCanDelete = false,
}: AppCalendarProps): React.JSX.Element {
  const isMobile = useIsMobile();

  // ── État complet du calendrier ─────────────────────────────────────────
  const calendar = useCalendar({
    events,
    defaultView,
    defaultDate,
    actions,
    hourHeight: 64,
  });

  // ── Permissions effectives ─────────────────────────────────────────────
  // En production, on affinerait selon Role et allowedEventTypes.
  const canCreate = propCanCreate;
  const canEdit = propCanEdit;
  const canDelete = propCanDelete;

  // ── Callback de sauvegarde unifié (création ou mise à jour) ───────────
  const handleSaveEvent = React.useCallback(
    async (data: CalendarEventFormData) => {
      if (calendar.selectedEvent && !calendar.isCreateDialogOpen) {
        // Mode édition
        await calendar.handleUpdate(calendar.selectedEvent.id, data);
      } else {
        // Mode création
        await calendar.handleCreate(data);
      }
    },
    [calendar]
  );

  // ── Squelette de chargement ────────────────────────────────────────────
  if (isLoading) {
    return <CalendarFullSkeleton className={className} />;
  }

  // ── Rendu ──────────────────────────────────────────────────────────────
  return (
    <>
      <div className={cn('flex h-full overflow-hidden ', className)}>
        {/* ── Zone principale : header + vue calendrier ─────────────── */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* Header */}
          <CalendarHeader
            currentDate={calendar.currentDate}
            view={calendar.view}
            weekDays={calendar.weekDays}
            filters={calendar.filters}
            eventCount={calendar.filteredEvents.length}
            canCreate={canCreate}
            onPrev={calendar.goToPrev}
            onNext={calendar.goToNext}
            onToday={calendar.goToToday}
            onViewChange={calendar.setView}
            onCreateClick={() => calendar.openCreateDialog(calendar.currentDate)}
            onFiltersChange={calendar.setFilters}
          />

          {/* Vue active */}
          <div className="flex-1 overflow-hidden">
            {calendar.view === 'week' ? (
              <CalendarWeekView
                currentDate={calendar.currentDate}
                weekDays={calendar.weekDays}
                events={calendar.filteredEvents}
                selectedDate={calendar.selectedDate}
                onDayClick={(date) => {
                  calendar.selectDate(date);
                  calendar.goToDate(date);
                }}
                onSlotClick={(date, hour) => {
                  // Ouvrir le formulaire de création pré-rempli avec la date/heure du slot
                  const d = new Date(date);
                  d.setHours(Math.floor(hour), Math.round((hour % 1) * 60), 0, 0);
                  calendar.openCreateDialog(d);
                }}
                onEventClick={calendar.openEventDialog}
                // Sélection multiple
                selectionRange={calendar.selectionRange}
                isSelecting={calendar.isSelecting}
                onSelectionStart={calendar.startSelection}
                onSelectionMove={calendar.updateSelection}
                onSelectionEnd={calendar.endSelection}
                // Redimensionnement
                resizingEvent={calendar.resizingEvent}
                onResizeStart={calendar.startResizeEvent}
                onResizeMove={calendar.resizeEventMove}
                onResizeEnd={calendar.endResizeEvent}
              />
            ) : (
              <CalendarMonthView
                currentDate={calendar.currentDate}
                monthDays={calendar.monthDays}
                events={calendar.filteredEvents}
                selectedDate={calendar.selectedDate}
                onDayClick={(date) => {
                  calendar.selectDate(date);
                  calendar.goToDate(date);
                  // Sur mobile : ouvrir directement le formulaire de création
                  if (isMobile) {
                    calendar.openCreateDialog(date);
                  }
                }}
                onEventClick={calendar.openEventDialog}
                // Sélection multiple
                selectionRange={calendar.selectionRange}
                isSelecting={calendar.isSelecting}
                onSelectionStart={calendar.startSelection}
                onSelectionMove={calendar.updateSelection}
                onSelectionEnd={calendar.endSelection}
                isCellInRange={calendar.isCellInRange}
              />
            )}
          </div>
        </div>

        {/* ── Sidebar droite (lg+) ────────────────────────────────────── */}
        <div className="hidden lg:flex">
          <CalendarSidebar
            currentDate={calendar.currentDate}
            selectedDate={calendar.selectedDate}
            events={calendar.filteredEvents}
            onDateSelect={(date) => {
              calendar.selectDate(date);
              calendar.goToDate(date);
            }}
            onEventClick={calendar.openEventDialog}
            onNewEvent={calendar.openCreateDialog}
            collapsible
            defaultCollapsed={false}
          />
        </div>
      </div>

      {/* ── Dialog unifié (vue / création) ──────────────────────────────── */}
      <CalendarEventDialog
        open={calendar.isEventDialogOpen || calendar.isCreateDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            if (calendar.isEventDialogOpen) calendar.closeEventDialog();
            if (calendar.isCreateDialogOpen) calendar.closeCreateDialog();
          }
        }}
        mode={calendar.isCreateDialogOpen ? 'create' : calendar.selectedEvent ? 'view' : 'view'}
        event={calendar.selectedEvent ?? undefined}
        defaultDate={calendar.createDialogDate ?? undefined}
        onSave={handleSaveEvent}
        onDelete={calendar.handleDelete}
        canEdit={canEdit}
        canDelete={canDelete}
        onConfirm={actions?.onConfirm}
        onCancel={actions?.onCancel}
      />
    </>
  );
}
