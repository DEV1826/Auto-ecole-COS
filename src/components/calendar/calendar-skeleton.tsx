'use client';

/**
 * @module components/calendar/calendar-skeleton
 * @description
 * États de chargement et vides du module calendrier  Auto-École COS.
 * Propose des squelettes pour :
 * - Vue semaine (grille horaire avec slots 15 min)
 * - Vue mois (grille 42 cases)
 * - Header (navigation, filtres, recherche)
 * - Sidebar droite (mini‑calendrier + liste d’événements)
 * - Vue complète (header + semaine + sidebar)
 * - État vide avec icône et message personnalisable
 *
 * Tous les composants utilisent `Skeleton` de shadcn/ui.
 *
 * @author Stive Junior
 * @version 2.0.0
 *
 * @example
 * ```tsx
 * // Chargement d’une vue semaine
 * <CalendarWeekSkeleton />
 *
 * // Chargement complet du calendrier (header + semaine + sidebar)
 * <CalendarFullSkeleton />
 *
 * // État vide avec action
 * <CalendarEmpty
 *   message="Aucune prescription trouvée"
 *   actionLabel="Créer une prescription"
 *   onAction={() => navigate('/prescriptions/new')}
 * />
 * ```
 */

import { CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// ─────────────────────────────────────────────────────────────────────────────
// Vue semaine – grille horaire 24h avec intervalles 15 min
// ─────────────────────────────────────────────────────────────────────────────

interface CalendarWeekSkeletonProps {
  /** Hauteur d’une heure en pixels (défaut: 64) */
  hourHeight?: number;
  /** Classes additionnelles */
  className?: string;
}

/**
 * Squelette de la vue semaine.
 * Simule la colonne des heures, les 7 colonnes de jours, et quelques événements aléatoires.
 */
export function CalendarWeekSkeleton({
  hourHeight = 64,
  className,
}: CalendarWeekSkeletonProps): React.JSX.Element {
  const totalHeight = 24 * hourHeight;
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* En‑tête des jours */}
      <div className="flex border-b sticky top-0 z-10 bg-background">
        <div className="w-14 shrink-0 border-r" />
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex-1 flex flex-col items-center py-2 gap-1 border-r">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-7 w-7 rounded-xs" />
            <div className="flex gap-0.5">
              <Skeleton className="h-1.5 w-1.5 rounded-xs" />
              <Skeleton className="h-1.5 w-1.5 rounded-xs" />
              <Skeleton className="h-1.5 w-1.5 rounded-xs" />
            </div>
          </div>
        ))}
      </div>

      {/* Grille horaire défilable */}
      <div className="flex-1 overflow-auto">
        <div className="relative flex" style={{ height: `${totalHeight}px` }}>
          {/* Colonne heures fixes */}
          <div className="w-14 shrink-0 relative">
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute w-full border-t border-border/50"
                style={{ top: `${hour * hourHeight}px` }}
              >
                <Skeleton className="absolute -top-2 right-2 h-3 w-8" />
              </div>
            ))}
          </div>

          {/* Colonnes jours avec événements simulés */}
          {Array.from({ length: 7 }).map((_, dayIdx) => (
            <div key={dayIdx} className="flex-1 relative border-r border-border/30">
              {/* Slots de temps (toutes les heures, mais on simule des événements) */}
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="absolute left-0 right-0 border-t border-border/40"
                  style={{ top: `${hour * hourHeight}px`, height: `${hourHeight / 2}px` }}
                />
              ))}
              {/* Événements simulés */}
              {dayIdx % 2 === 0 && (
                <div
                  className="absolute left-0.5 right-0.5 rounded-xs border-l-2 bg-muted/50"
                  style={{ top: `${hourHeight * 2}px`, height: `${hourHeight * 1.5}px` }}
                />
              )}
              {dayIdx % 3 === 1 && (
                <div
                  className="absolute left-0.5 right-0.5 rounded-xs border-l-2 bg-muted/50"
                  style={{ top: `${hourHeight * 6}px`, height: `${hourHeight * 2}px` }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pied de page (semaine + mois) */}
      <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Vue mois – grille 42 cases
// ─────────────────────────────────────────────────────────────────────────────

interface CalendarMonthSkeletonProps {
  /** Nombre de lignes affichées (défaut: 6) */
  rows?: number;
  /** Classes additionnelles */
  className?: string;
}

/**
 * Squelette de la vue mois.
 * Grille 7 colonnes × 6 lignes, chaque cellule contient un jour et 1‑2 événements simulés.
 */
export function CalendarMonthSkeleton({
  rows = 6,
  className,
}: CalendarMonthSkeletonProps): React.JSX.Element {
  const days = Array.from({ length: 7 }, (_, i) => i);
  const cells = Array.from({ length: rows * 7 }, (_, i) => i);

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* En‑tête des jours */}
      <div className="grid grid-cols-7 border-b sticky top-0 z-10 bg-background">
        {days.map((i) => (
          <div key={i} className="py-2 text-center border-r last:border-r-0">
            <Skeleton className="h-3 w-8 mx-auto" />
          </div>
        ))}
      </div>

      {/* Grille défilable */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-7 auto-rows-fr">
          {cells.map((idx) => (
            <div
              key={idx}
              className={cn(
                'border-b border-r p-1.5 min-h-25 lg:min-h-30',
                idx >= 35 && 'border-b-0',
                (idx + 1) % 7 === 0 && 'border-r-0'
              )}
            >
              {/* Numéro du jour */}
              <div className="flex items-start justify-between mb-1">
                <Skeleton className="h-6 w-6 rounded-xs" />
                <Skeleton className="h-3 w-6" />
              </div>
              {/* Événements simulés */}
              <div className="space-y-1">
                {idx % 2 === 0 && <Skeleton className="h-5 w-full rounded-xs" />}
                {idx % 3 === 1 && <Skeleton className="h-5 w-3/4 rounded-xs" />}
                {idx % 5 === 2 && <Skeleton className="h-5 w-2/3 rounded-xs" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pied de page (plage de mois) */}
      <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Header du calendrier (navigation, filtres, recherche)
// ─────────────────────────────────────────────────────────────────────────────

interface CalendarHeaderSkeletonProps {
  /** Classes additionnelles */
  className?: string;
}

/**
 * Squelette de la barre d’en‑tête du calendrier.
 * Simule les boutons de navigation, le titre de période, la recherche, les filtres et le toggle vue.
 */
export function CalendarHeaderSkeleton({
  className,
}: CalendarHeaderSkeletonProps): React.JSX.Element {
  return (
    <div className={cn('flex items-center gap-2 px-4 py-3 border-b bg-background', className)}>
      {/* Navigation */}
      <div className="flex items-center gap-1">
        <Skeleton className="h-8 w-8 rounded-xs" />
        <Skeleton className="h-8 w-8 rounded-xs" />
        <Skeleton className="h-8 w-20 rounded-xs hidden sm:block" />
      </div>

      <Skeleton className="h-5 w-px hidden sm:block" />

      {/* Période */}
      <div className="flex flex-col">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-2 w-20 mt-0.5" />
      </div>

      <div className="flex-1" />

      {/* Recherche + filtres */}
      <Skeleton className="h-8 w-8 rounded-xs" />
      <Skeleton className="h-8 w-8 rounded-xs" />

      <Skeleton className="h-5 w-px hidden sm:block" />

      {/* Toggle vue */}
      <div className="flex items-center gap-0.5 rounded-xs border p-0.5">
        <Skeleton className="h-7 w-7 rounded" />
        <Skeleton className="h-7 w-7 rounded" />
      </div>

      {/* Bouton Ajouter */}
      <Skeleton className="h-8 w-16 rounded-xs hidden sm:block" />
      <Skeleton className="h-8 w-8 rounded-xs sm:hidden" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar droite (mini‑calendrier + liste d’événements)
// ─────────────────────────────────────────────────────────────────────────────

interface CalendarSidebarSkeletonProps {
  /** Classes additionnelles */
  className?: string;
}

/**
 * Squelette de la sidebar droite.
 * Simule le mini‑calendrier (grille 7×6) et la liste des événements du jour.
 */
export function CalendarSidebarSkeleton({
  className,
}: CalendarSidebarSkeletonProps): React.JSX.Element {
  const weekDays = Array.from({ length: 7 }, (_, i) => i);
  const monthCells = Array.from({ length: 42 }, (_, i) => i);

  return (
    <div className={cn('w-64 xl:w-72 h-full border-l flex flex-col bg-background', className)}>
      {/* Mini‑calendrier */}
      <div className="p-3 border-b">
        {/* En‑tête mois */}
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-20" />
          <div className="flex gap-1">
            <Skeleton className="h-6 w-6 rounded" />
            <Skeleton className="h-6 w-6 rounded" />
          </div>
        </div>
        {/* Jours de semaine */}
        <div className="grid grid-cols-7 mb-1">
          {weekDays.map((i) => (
            <Skeleton key={i} className="h-3 w-5 mx-auto" />
          ))}
        </div>
        {/* Grille jours */}
        <div className="grid grid-cols-7 gap-1">
          {monthCells.map((i) => (
            <Skeleton key={i} className="h-7 w-full rounded-xs" />
          ))}
        </div>
      </div>

      {/* Liste des événements du jour */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-3 py-2 border-b">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-xs" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <div className="flex-1 px-3 py-2 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="relative pl-6 pb-4">
              <div className="absolute left-0 top-0.5">
                <Skeleton className="h-8 w-8 rounded-xs" />
              </div>
              <div className="ml-10 space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Squelette du calendrier complet (header + semaine + sidebar)
// ─────────────────────────────────────────────────────────────────────────────

interface CalendarFullSkeletonProps {
  /** Hauteur d’une heure en pixels (défaut: 64) */
  hourHeight?: number;
  /** Classes additionnelles */
  className?: string;
}

/**
 * Squelette complet du calendrier avec header, vue semaine et sidebar (visible sur lg+).
 */
export function CalendarFullSkeleton({
  hourHeight = 30,
  className,
}: CalendarFullSkeletonProps): React.JSX.Element {
  return (
    <div className={cn('flex h-full ', className)}>
      <div className="flex flex-col flex-1 min-w-0">
        <CalendarHeaderSkeleton />
        <CalendarWeekSkeleton hourHeight={hourHeight} className="flex-1" />
      </div>
      <div className="hidden  lg:block">
        <CalendarSidebarSkeleton />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// État vide
// ─────────────────────────────────────────────────────────────────────────────

interface CalendarEmptyProps {
  /** Message principal */
  message?: string;
  /** Texte du bouton d’action (optionnel) */
  actionLabel?: string;
  /** Callback du bouton d’action */
  onAction?: () => void;
  /** Classes additionnelles */
  className?: string;
}

/**
 * État vide du calendrier.
 * Affiche une icône, un message et éventuellement une action.
 */
export function CalendarEmpty({
  message = 'Aucun événement pour cette période',
  actionLabel,
  onAction,
  className,
}: CalendarEmptyProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 text-muted-foreground gap-3',
        className
      )}
    >
      <CalendarDays className="h-12 w-12 opacity-20" />
      <p className="text-sm font-medium">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="text-xs text-primary hover:underline mt-1 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
