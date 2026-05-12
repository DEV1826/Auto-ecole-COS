/**
 * @module components/calendar/use-calendar
 * @description
 * Hook principal de gestion du calendrier pour l’auto‑école COS.
 * Intègre la navigation, les filtres, la sélection multiple (range),
 * le drag & drop d’événements, le redimensionnement, et les dialogues de création/édition.
 *
 * @author Stive Junior
 * @version 2.0.0
 *
 * @example
 * ```tsx
 * const calendar = useCalendar({
 *   events: myEvents,
 *   defaultView: 'week',
 *   actions: { onCreate, onUpdate, onDelete },
 * })
 * ```
 */

import * as React from 'react';
import {
  getWeekDays,
  getMonthDays,
  isSameDay,
  isToday,
  type CalendarActions,
  type CalendarEvent,
  type CalendarEventFormData,
  type CalendarFilters,
  type CalendarView,
} from './types';

// ============================================================
// TYPES INTERNES POUR LA SÉLECTION ET LE DRAG & DROP
// ============================================================

/**
 * Type de cellule sélectionnable dans le calendrier.
 * - `day` : un jour entier (vue mois)
 * - `timeslot` : un créneau horaire précis (vue semaine, ex: jour + heure)
 */
export type SelectableCellType = 'day' | 'timeslot';

/**
 * Représentation d'une cellule sélectionnable.
 * - Pour `day` : `date` est suffisant.
 * - Pour `timeslot` : `date` représente le début du créneau, `endDate` sa fin (1h plus tard par défaut).
 */
export interface SelectableCell {
  /** Type de cellule (jour ou créneau horaire) */
  type: SelectableCellType;
  /** Date de début (et heure pour un créneau) */
  date: Date;
  /** Date de fin (optionnelle, pour les créneaux) */
  endDate?: Date;
}

/**
 * État de sélection multiple (range) pour les vues mois/semaine.
 */
export interface SelectionRange {
  /** Cellule de début de sélection */
  start: SelectableCell;
  /** Cellule de fin de sélection */
  end: SelectableCell;
}

/**
 * État de glissement d'un événement existant.
 */
export interface DraggedEventState {
  /** Événement en cours de déplacement */
  event: CalendarEvent;
  /** Position X initiale de la souris */
  startX: number;
  /** Position Y initiale de la souris */
  startY: number;
  /** Date de début originale (avant déplacement) */
  originalStart: Date;
  /** Date de fin originale (avant déplacement) */
  originalEnd: Date;
  /** Décalage en pixels horizontal (optionnel) */
  deltaX?: number;
  /** Décalage en pixels vertical (optionnel) */
  deltaY?: number;
}

/**
 * État de redimensionnement d'un événement (par la bordure de début ou de fin).
 */
export interface ResizingEventState {
  /** Événement en cours de redimensionnement */
  event: CalendarEvent;
  /** Bordure redimensionnée (`start` pour début, `end` pour fin) */
  edge: 'start' | 'end';
  /** Date de début originale */
  originalStart: Date;
  /** Date de fin originale */
  originalEnd: Date;
  /** Position Y de la souris au début du redimensionnement */
  mouseStartY: number;
}

// ============================================================
// OPTIONS ET RETOUR DU HOOK
// ============================================================

/**
 * Options pour le hook `useCalendar`.
 */
export interface UseCalendarOptions {
  /** Événements à afficher (déjà convertis en `CalendarEvent`) */
  events?: CalendarEvent[];
  /** Vue par défaut (`week` ou `month`) */
  defaultView?: CalendarView;
  /** Date initiale (aujourd’hui par défaut) */
  defaultDate?: Date;
  /** Actions CRUD et métier */
  actions?: CalendarActions;
  /** Hauteur d’une heure en pixels (pour les calculs de drag & resize) – défaut : 60 */
  hourHeight?: number;
}

/**
 * Valeurs retournées par le hook `useCalendar`.
 */
export interface UseCalendarReturn {
  // ── État courant ──────────────────────────────────────────
  /** Date centrale (utilisée pour le calcul de la vue) */
  currentDate: Date;
  /** Vue active (semaine ou mois) */
  view: CalendarView;
  /** Date sélectionnée (pour affichage dans la sidebar) */
  selectedDate: Date | null;
  /** Événement sélectionné (pour le dialogue de détail) */
  selectedEvent: CalendarEvent | null;
  /** Filtres actifs */
  filters: CalendarFilters;
  /** Mettre à jour les filtres */
  setFilters: (filters: CalendarFilters) => void;

  // ── Données calculées ────────────────────────────────────
  /** Jours de la semaine courante (lundi → dimanche) */
  weekDays: Date[];
  /** Jours du mois courant (grille 42 cases) */
  monthDays: Date[];
  /** Événements filtrés selon les critères actifs */
  filteredEvents: CalendarEvent[];
  /** Événements du jour sélectionné */
  eventsForSelectedDate: CalendarEvent[];

  // ── Navigation ───────────────────────────────────────────
  /** Aller à aujourd'hui */
  goToToday: () => void;
  /** Période précédente (semaine ou mois) */
  goToPrev: () => void;
  /** Période suivante */
  goToNext: () => void;
  /** Aller à une date précise */
  goToDate: (date: Date) => void;
  /** Changer la vue (semaine/mois) */
  setView: (view: CalendarView) => void;

  // ── Sélection simple ─────────────────────────────────────
  /** Sélectionner une date (jour) */
  selectDate: (date: Date | null) => void;
  /** Sélectionner un événement */
  selectEvent: (event: CalendarEvent | null) => void;

  // ── Sélection multiple (range) ───────────────────────────
  /** État de la sélection en cours */
  selectionRange: SelectionRange | null;
  /** Mode de sélection actif (pour le glisser de la souris) */
  isSelecting: boolean;
  /** Début d'une sélection (souris enfoncée) */
  startSelection: (cell: SelectableCell) => void;
  /** Mise à jour de la sélection (souris déplacée) */
  updateSelection: (cell: SelectableCell) => void;
  /** Fin de sélection (souris relâchée) – déclenche la création d'un événement */
  endSelection: () => void;
  /** Annuler la sélection en cours */
  clearSelection: () => void;

  // ── Drag & drop d'événements ─────────────────────────────
  /** État du déplacement d'un événement */
  draggedEvent: DraggedEventState | null;
  /** Début du glisser d'un événement */
  startDragEvent: (event: CalendarEvent, mouseX: number, mouseY: number) => void;
  /** Déplacement de la souris pendant le drag */
  dragEventMove: (
    mouseX: number,
    mouseY: number,
    containerRef: React.RefObject<HTMLElement>
  ) => void;
  /** Fin du glisser – mise à jour de la date de l'événement */
  endDragEvent: () => Promise<void>;

  // ── Redimensionnement d'événements ───────────────────────
  /** État du redimensionnement */
  resizingEvent: ResizingEventState | null;
  /** Début du redimensionnement (bordure début ou fin) */
  startResizeEvent: (event: CalendarEvent, edge: 'start' | 'end', mouseY: number) => void;
  /** Déplacement de la souris pendant le resize */
  resizeEventMove: (mouseY: number, containerRef: React.RefObject<HTMLElement>) => void;
  /** Fin du redimensionnement – mise à jour des dates */
  endResizeEvent: () => Promise<void>;

  // ── Dialogues ────────────────────────────────────────────
  /** Dialogue d'événement ouvert ? */
  isEventDialogOpen: boolean;
  /** Dialogue de création ouvert ? */
  isCreateDialogOpen: boolean;
  /** Date pré‑remplie pour le dialogue de création */
  createDialogDate: Date | null;
  /** Ouvrir le dialogue de détail d'un événement */
  openEventDialog: (event: CalendarEvent) => void;
  /** Fermer le dialogue d'événement */
  closeEventDialog: () => void;
  /** Ouvrir le dialogue de création (optionnel : pré‑remplir une date) */
  openCreateDialog: (date?: Date) => void;
  /** Fermer le dialogue de création */
  closeCreateDialog: () => void;

  // ── Actions CRUD ─────────────────────────────────────────
  /** Créer un événement */
  handleCreate: (data: CalendarEventFormData) => Promise<void>;
  /** Mettre à jour un événement */
  handleUpdate: (id: number, data: Partial<CalendarEventFormData>) => Promise<void>;
  /** Supprimer un événement */
  handleDelete: (id: number) => Promise<void>;

  // ── Utilitaires d'affichage ─────────────────────────────
  /** Événements pour un jour donné */
  getEventsForDay: (day: Date) => CalendarEvent[];
  /** Vérifie si une date est aujourd'hui */
  isCurrentDay: (day: Date) => boolean;
  /** Vérifie si une date est la date sélectionnée */
  isSelectedDay: (day: Date) => boolean;
  /** Vérifie si une cellule est dans la sélection range */
  isCellInRange: (cell: SelectableCell) => boolean;
  /** Convertit une cellule en plage de dates (début/fin) pour les actions */
  cellToDateRange: (cell: SelectableCell) => { start: Date; end: Date };
}

// ─────────────────────────────────────────────────────────────────────────────
// Implémentation
// ─────────────────────────────────────────────────────────────────────────────

export function useCalendar({
  events = [],
  defaultView = 'week',
  defaultDate,
  actions,
  hourHeight = 60, // pixels par heure (pour les calculs de drag/resize)
}: UseCalendarOptions = {}): UseCalendarReturn {
  // ── États principaux ──────────────────────────────────────────
  const [currentDate, setCurrentDate] = React.useState<Date>(defaultDate ?? new Date());
  const [view, setViewState] = React.useState<CalendarView>(defaultView);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = React.useState<CalendarEvent | null>(null);
  const [filters, setFiltersState] = React.useState<CalendarFilters>({});

  const setFilters = React.useCallback((nextFilters: CalendarFilters) => {
    setFiltersState(nextFilters);
  }, []);

  // ============================================================
  // SÉLECTION MULTIPLE (RANGE)
  // ============================================================

  const [selectionRange, setSelectionRange] = React.useState<SelectionRange | null>(null);
  const [isSelecting, setIsSelecting] = React.useState(false);

  // ============================================================
  // DRAG & DROP D'ÉVÉNEMENTS
  // ============================================================

  const [draggedEvent, setDraggedEvent] = React.useState<DraggedEventState | null>(null);

  // ============================================================
  // REDIMENSIONNEMENT D'ÉVÉNEMENTS
  // ============================================================

  const [resizingEvent, setResizingEvent] = React.useState<ResizingEventState | null>(null);

  // ============================================================
  // DIALOGUES
  // ============================================================

  const [isEventDialogOpen, setIsEventDialogOpen] = React.useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [createDialogDate, setCreateDialogDate] = React.useState<Date | null>(null);

  // ============================================================
  // DONNÉES CALCULÉES
  // ============================================================

  const weekDays = React.useMemo(() => getWeekDays(currentDate), [currentDate]);
  const monthDays = React.useMemo(() => getMonthDays(currentDate), [currentDate]);

  const filteredEvents = React.useMemo(() => {
    let result = [...events];
    if (filters.types && filters.types.length > 0) {
      result = result.filter((e) => filters.types!.includes(e.type));
    }
    if (filters.statuses && filters.statuses.length > 0) {
      result = result.filter((e) => filters.statuses!.includes(e.status));
    }
    if (filters.priorities && filters.priorities.length > 0) {
      result = result.filter((e) => e.priority && filters.priorities!.includes(e.priority));
    }
    if (filters.candidatId) {
      result = result.filter((e) => e.candidat?.id === filters.candidatId);
    }
    if (filters.moniteurId) {
      result = result.filter((e) => e.moniteur?.id === filters.moniteurId);
    }
    if (filters.vehiculeId) {
      result = result.filter((e) => e.vehicule === filters.vehiculeId?.toString());
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(s) ||
          e.description?.toLowerCase().includes(s) ||
          e.location?.toLowerCase().includes(s) ||
          e.candidat?.name.toLowerCase().includes(s) ||
          e.moniteur?.name.toLowerCase().includes(s)
      );
    }
    return result;
  }, [events, filters]);

  const eventsForSelectedDate = React.useMemo(() => {
    if (!selectedDate) return [];
    return filteredEvents.filter((e) => isSameDay(e.startDate, selectedDate));
  }, [filteredEvents, selectedDate]);

  // ── Navigation ───────────────────────────────────────────────
  const goToToday = React.useCallback(() => setCurrentDate(new Date()), []);
  const goToPrev = React.useCallback(() => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (view === 'week') d.setDate(d.getDate() - 7);
      else d.setMonth(d.getMonth() - 1);
      return d;
    });
  }, [view]);
  const goToNext = React.useCallback(() => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (view === 'week') d.setDate(d.getDate() + 7);
      else d.setMonth(d.getMonth() + 1);
      return d;
    });
  }, [view]);
  const goToDate = React.useCallback((date: Date) => setCurrentDate(date), []);
  const setView = React.useCallback((v: CalendarView) => setViewState(v), []);

  // ── Sélection simple ─────────────────────────────────────────
  const selectDate = React.useCallback((date: Date | null) => setSelectedDate(date), []);
  const selectEvent = React.useCallback(
    (event: CalendarEvent | null) => setSelectedEvent(event),
    []
  );

  // ── Dialogues ───────────────────────────────────────────────
  const openEventDialog = React.useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventDialogOpen(true);
  }, []);
  const closeEventDialog = React.useCallback(() => {
    setIsEventDialogOpen(false);
    setSelectedEvent(null);
  }, []);
  const openCreateDialog = React.useCallback((date?: Date) => {
    setCreateDialogDate(date ?? null);
    setIsCreateDialogOpen(true);
  }, []);
  const closeCreateDialog = React.useCallback(() => {
    setIsCreateDialogOpen(false);
    setCreateDialogDate(null);
  }, []);

  // ── Gestion de la sélection multiple (range) ─────────────────
  const startSelection = React.useCallback((cell: SelectableCell) => {
    setSelectionRange({ start: cell, end: cell });
    setIsSelecting(true);
  }, []);

  const updateSelection = React.useCallback(
    (cell: SelectableCell) => {
      if (isSelecting && selectionRange) {
        setSelectionRange({ ...selectionRange, end: cell });
      }
    },
    [isSelecting, selectionRange]
  );

  const endSelection = React.useCallback(() => {
    if (selectionRange && selectionRange.start && selectionRange.end) {
      const { start } =
        selectionRange.start.type === 'day'
          ? { start: selectionRange.start.date }
          : {
              start: selectionRange.start.date,
            };
      openCreateDialog(start);
    }
    setIsSelecting(false);
    setSelectionRange(null);
  }, [openCreateDialog, selectionRange]);

  const clearSelection = React.useCallback(() => {
    setIsSelecting(false);
    setSelectionRange(null);
  }, []);

  const isCellInRange = React.useCallback(
    (cell: SelectableCell): boolean => {
      if (!selectionRange) return false;
      const { start, end } = selectionRange;
      if (cell.type === 'day' && start.type === 'day' && end.type === 'day') {
        const cellTime = cell.date.getTime();
        const startTime = start.date.getTime();
        const endTime = end.date.getTime();
        return cellTime >= Math.min(startTime, endTime) && cellTime <= Math.max(startTime, endTime);
      }
      if (cell.type === 'timeslot' && start.type === 'timeslot' && end.type === 'timeslot') {
        const cellTime = cell.date.getTime();
        const startTime = start.date.getTime();
        const endTime = end.date.getTime();
        return cellTime >= Math.min(startTime, endTime) && cellTime <= Math.max(startTime, endTime);
      }
      return false;
    },
    [selectionRange]
  );

  const cellToDateRange = React.useCallback((cell: SelectableCell): { start: Date; end: Date } => {
    if (cell.type === 'day') {
      const start = new Date(cell.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return { start, end };
    }
    // timeslot : durée par défaut 1 heure
    const start = new Date(cell.date);
    const end = new Date(cell.endDate || start.getTime() + 60 * 60 * 1000);
    return { start, end };
  }, []);

  // ── Drag & drop d'événements ────────────────────────────────
  const startDragEvent = React.useCallback(
    (event: CalendarEvent, mouseX: number, mouseY: number) => {
      setDraggedEvent({
        event,
        startX: mouseX,
        startY: mouseY,
        originalStart: new Date(event.startDate),
        originalEnd: new Date(event.endDate),
      });
    },
    []
  );

  const dragEventMove = React.useCallback(
    (mouseX: number, mouseY: number, containerRef: React.RefObject<HTMLElement>) => {
      if (!draggedEvent || !containerRef.current) return;
      const deltaX = mouseX - draggedEvent.startX;
      const deltaY = mouseY - draggedEvent.startY;
      setDraggedEvent((prev) => (prev ? { ...prev, deltaX, deltaY } : null));
    },
    [draggedEvent]
  );

  const endDragEvent = React.useCallback(async () => {
    if (!draggedEvent) return;
    // Calculer le décalage temporel en fonction du déplacement vertical
    // En pratique, on interrogerait la position de la souris par rapport à la grille horaire.
    // Ici, on utilise un deltaY et l'height par heure pour estimer le décalage en heures.
    const deltaHours = (draggedEvent.deltaY || 0) / hourHeight;
    const newStart = new Date(draggedEvent.originalStart);
    newStart.setHours(newStart.getHours() + deltaHours);
    const newEnd = new Date(draggedEvent.originalEnd);
    newEnd.setHours(newEnd.getHours() + deltaHours);

    // Mettre à jour via l'action
    await actions?.onUpdate?.(draggedEvent.event.id, {
      startDate: newStart,
      endDate: newEnd,
    });
    setDraggedEvent(null);
  }, [draggedEvent, hourHeight, actions]);

  // ── Redimensionnement d'événements ──────────────────────────
  const startResizeEvent = React.useCallback(
    (event: CalendarEvent, edge: 'start' | 'end', mouseY: number) => {
      setResizingEvent({
        event,
        edge,
        originalStart: new Date(event.startDate),
        originalEnd: new Date(event.endDate),
        mouseStartY: mouseY,
      });
    },
    []
  );

  const resizeEventMove = React.useCallback(
    (mouseY: number, containerRef: React.RefObject<HTMLElement>) => {
      if (!resizingEvent || !containerRef.current) return;
      const deltaY = mouseY - resizingEvent.mouseStartY;
      const deltaHours = deltaY / hourHeight;
      const newEvent = { ...resizingEvent.event };
      if (resizingEvent.edge === 'start') {
        const newStart = new Date(resizingEvent.originalStart);
        newStart.setHours(newStart.getHours() + deltaHours);
        if (newStart < newEvent.endDate) {
          newEvent.startDate = newStart;
        }
      } else {
        const newEnd = new Date(resizingEvent.originalEnd);
        newEnd.setHours(newEnd.getHours() + deltaHours);
        if (newEnd > newEvent.startDate) {
          newEvent.endDate = newEnd;
        }
      }
      // Optionnel : mettre à jour un état temporaire pour l'affichage
    },
    [resizingEvent, hourHeight]
  );

  const endResizeEvent = React.useCallback(async () => {
    if (!resizingEvent) return;
    const deltaHours = 0; // À recalculer correctement
    let newStart = resizingEvent.originalStart;
    let newEnd = resizingEvent.originalEnd;
    if (resizingEvent.edge === 'start') {
      newStart = new Date(resizingEvent.originalStart);
      newStart.setHours(newStart.getHours() + deltaHours);
    } else {
      newEnd = new Date(resizingEvent.originalEnd);
      newEnd.setHours(newEnd.getHours() + deltaHours);
    }
    await actions?.onUpdate?.(resizingEvent.event.id, { startDate: newStart, endDate: newEnd });
    setResizingEvent(null);
  }, [resizingEvent, actions]);

  // ── Actions CRUD ────────────────────────────────────────────

  const handleCreate = React.useCallback(
    async (data: CalendarEventFormData) => {
      await actions?.onCreate?.(data);
      closeCreateDialog();
    },
    [actions, closeCreateDialog]
  );

  const handleUpdate = React.useCallback(
    async (id: number, data: Partial<CalendarEventFormData>) => {
      await actions?.onUpdate?.(id, data);
      closeEventDialog();
    },
    [actions, closeEventDialog]
  );

  const handleDelete = React.useCallback(
    async (id: number) => {
      await actions?.onDelete?.(id);
      closeEventDialog();
    },
    [actions, closeEventDialog]
  );

  // ── Utilitaires d'affichage ─────────────────────────────────
  const getEventsForDayFn = React.useCallback(
    (day: Date) => filteredEvents.filter((e) => isSameDay(e.startDate, day)),
    [filteredEvents]
  );
  const isCurrentDay = React.useCallback((day: Date) => isToday(day), []);
  const isSelectedDay = React.useCallback(
    (day: Date) => (selectedDate ? isSameDay(day, selectedDate) : false),
    [selectedDate]
  );

  // ── Return final ────────────────────────────────────────────
  return {
    currentDate,
    view,
    selectedDate,
    selectedEvent,
    filters,
    weekDays,
    monthDays,
    filteredEvents,
    eventsForSelectedDate,
    goToToday,
    goToPrev,
    goToNext,
    goToDate,
    setView,
    selectDate,
    selectEvent,
    selectionRange,
    isSelecting,
    startSelection,
    updateSelection,
    endSelection,
    clearSelection,
    draggedEvent,
    setFilters,
    startDragEvent,
    dragEventMove,
    endDragEvent,
    resizingEvent,
    startResizeEvent,
    resizeEventMove,
    endResizeEvent,
    isEventDialogOpen,
    isCreateDialogOpen,
    createDialogDate,
    openEventDialog,
    closeEventDialog,
    openCreateDialog,
    closeCreateDialog,
    handleCreate,
    handleUpdate,
    handleDelete,
    getEventsForDay: getEventsForDayFn,
    isCurrentDay,
    isSelectedDay,
    isCellInRange,
    cellToDateRange,
  };
}
