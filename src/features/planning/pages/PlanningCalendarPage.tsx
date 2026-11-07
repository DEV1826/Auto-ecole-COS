// src/features/dashboard/pages/PlanningCalendarPage.tsx

/**
 * @module features/dashboard/pages/PlanningCalendarPage
 * @description
 * Page calendrier centralisée pour l’auto‑école COS — accessible à tous les rôles.
 * Permet de visualiser et gérer les événements (leçons, examens, paiements, entretiens, rappels).
 *
 * ## Layout
 * - Utilise le layout standard `AppLayout` (sidebar gauche + header)
 * - Zone principale : `AppCalendar` (grille calendrier + sidebar droite optionnelle)
 * - Sidebar droite visible sur écrans larges (lg+)
 *
 * ## Adaptation par rôle
 * | Rôle       | Création | Modification | Suppression | Actions spécifiques                     |
 * |------------|----------|--------------|-------------|------------------------------------------|
 * | ADMIN      | ✅       | ✅           | ✅          | Gestion complète de tous les événements |
 * | SECRETAIRE | ✅       | ✅           | ✅          | Gestion planning, examens, paiements     |
 * | MONITEUR   | ✅ (leçons uniquement) | ✅ (ses leçons) | ❌ | Consultation planning, marquer présence |
 *
 * ## Types d’événements intégrés
 * - `lesson`         : leçon de conduite / code
 * - `exam`           : examen (code ou conduite)
 * - `payment`        : rappel de paiement dû
 * - `maintenance`    : entretien véhicule
 * - `reminder`       : rappel personnalisé
 *
 * @see {@link AppCalendar} Composant calendrier réutilisable
 * @see {@link PROTECTED_ROUTES} Routes protégées
 * @see {@link useAuth} Hook d’authentification
 * @see {@link CalendarEvent} Type unifié des événements
 *
 * @author Stive Junior
 * @version 2.0.0 – intégration complète des types COS
 *
 * @example
 * ```tsx
 * // Dans le routeur
 * <Route path={PROTECTED_ROUTES.CALENDAR} element={<PlanningCalendarPage />} />
 * ```
 */

import * as React from 'react';
import { toast } from 'sonner';
import { Navigate, useNavigate } from 'react-router-dom';
import { usePlanning } from '@/hooks/use.planning';
import { useExamens } from '@/hooks/use.examens';
import { PUBLIC_ROUTES } from '@/config/routes';
import { PROTECTED_ROUTES } from '@/config/routes';
import { useAuth } from '@/hooks/use.auth';
import { type Role as RoleType } from '@/types/enums';
import { AppCalendar } from '@/components/calendar/app-calendar';
import type {
  CalendarActions,
  CalendarEvent,
  CalendarEventFormData,
  CalendarEventStatus,
} from '@/components/calendar/types';
import {
  convertExamenToCalendarEvent,
  convertLeconToCalendarEvent,
} from '@/components/calendar/types';

/**
 * Configuration des permissions et actions selon le rôle.
 * @param role - Rôle de l’utilisateur connecté
 * @returns Options de configuration
 */
function getRoleCalendarConfig(role: RoleType) {
  switch (role) {
    case 'ADMIN':
      return {
        canCreate: false,
        canEdit: true,
        canDelete: true,
        description: 'Gestion complète du planning auto‑école',
      };
    case 'SECRETAIRE':
      return {
        canCreate: false,
        canEdit: true,
        canDelete: true,
        description: 'Gestion des leçons, examens, paiements et rappels',
      };
    case 'MONITEUR':
      return {
        canCreate: false,
        canEdit: true,
        canDelete: false,
        description: 'Consultez votre planning et validez les présences',
      };
    default:
      return {
        canCreate: false,
        canEdit: false,
        canDelete: false,
        description: 'Calendrier COS',
      };
  }
}

function mapCalendarStatusToLeconStatus(status?: CalendarEventStatus) {
  switch (status) {
    case 'DONE':
      return 'EFFECTUEE';
    case 'CANCELLED':
      return 'ANNULEE';
    case 'MISSED':
      return 'ABSENCE';
    default:
      return 'PLANIFIEE';
  }
}

// ============================================================
// Composant principal
// ============================================================

/**
 * Page Calendrier de l’auto‑école COS.
 *
 * Affiche un calendrier interactif permettant de visualiser et gérer
 * les événements selon le rôle de l’utilisateur.
 *
 * @returns Élément React de la page
 */
export default function PlanningCalendarPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const planning = usePlanning();
  const examens = useExamens();

  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const role = user?.role as RoleType;
  const config = getRoleCalendarConfig(role);
  const moniteurId = role === 'MONITEUR' ? user?.id : undefined;

  const loadEvents = React.useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 2);
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 4);

      const lessonPromise = planning.getBetweenDates(
        startDate.toISOString(),
        endDate.toISOString(),
        moniteurId
      );

      const examPromise =
        role === 'MONITEUR'
          ? Promise.resolve({ examens: [] })
          : examens.getAll({
              page: 1,
              limit: 500,
              dateDebut: startDate.toISOString(),
              dateFin: endDate.toISOString(),
              sortBy: 'date',
              sortOrder: 'asc',
            });

      const [lecons, examensResponse] = await Promise.all([lessonPromise, examPromise]);
      const nextEvents = [
        ...lecons.map(convertLeconToCalendarEvent),
        ...(examensResponse.examens ?? []).map(convertExamenToCalendarEvent),
      ].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

      setEvents(nextEvents);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Impossible de charger le planning réel'
      );
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [examens, moniteurId, planning, role, user]);

  React.useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  if (!isAuthenticated || !user) {
    return <Navigate to={PUBLIC_ROUTES.AUTH.LOGIN} replace />;
  }

  const actions: CalendarActions = {
    onCreate: async (_data: CalendarEventFormData) => {
      toast.info(
        'Utilisez les formulaires dédiés pour créer une leçon ou un examen. Le calendrier affiche désormais les données réelles.'
      );
    },

    onUpdate: async (id: number, data: Partial<CalendarEventFormData>) => {
      const target = events.find((event) => event.id === id);
      if (!target) return;

      if (target.type === 'lesson') {
        const durationMinutes =
          data.startDate && data.endDate
            ? Math.max(
                30,
                Math.round((data.endDate.getTime() - data.startDate.getTime()) / 60000)
              )
            : undefined;

        await planning.update(id, {
          date: data.startDate?.toISOString(),
          duree: durationMinutes,
          notes: data.notes,
          statut: mapCalendarStatusToLeconStatus(data.status),
        });
      } else if (target.type === 'exam') {
        await examens.update(id, {
          date: data.startDate?.toISOString(),
          centre: data.location,
          notes: data.notes,
        });
      }

      await loadEvents();
      toast.success('Événement mis à jour');
    },

    onDelete: async (id: number) => {
      const target = events.find((event) => event.id === id);
      if (!target) return;

      if (target.type === 'lesson') {
        await planning.delete(id);
      } else if (target.type === 'exam') {
        await examens.delete(id);
      } else {
        toast.info("Ce type d'événement n'est pas supprimable depuis le calendrier.");
        return;
      }

      await loadEvents();
      toast.success('Événement supprimé');
    },

    onConfirm: async (event: CalendarEvent) => {
      if (event.type !== 'lesson') {
        toast.info("La confirmation dédiée n'est disponible que pour les leçons.");
        return;
      }

      await planning.update(event.id, {
        statut: 'PLANIFIEE',
        notes: event.notes,
      });
      await loadEvents();
      toast.success('Leçon confirmée');
    },

    onCancel: async (event: CalendarEvent) => {
      if (event.type !== 'lesson') {
        toast.info("L'annulation depuis le calendrier est gérée uniquement pour les leçons.");
        return;
      }

      await planning.update(event.id, { statut: 'ANNULEE' });
      await loadEvents();
      toast.info('Leçon annulée');
    },

    onComplete: async (event: CalendarEvent) => {
      if (event.type !== 'lesson') {
        toast.info("La validation d'achèvement est réservée aux leçons.");
        return;
      }

      await planning.update(event.id, { statut: 'EFFECTUEE' });
      await loadEvents();
      toast.success('Leçon marquée comme effectuée');
    },

    onReschedule: (event: CalendarEvent) => {
      toast.info('Astuce', {
        description: `Ouvrez "${event.title}" puis utilisez la modification pour reprogrammer ce créneau.`,
      });
    },

    onView: (event: CalendarEvent) => {
      if (event.type === 'lesson') {
        navigate(PROTECTED_ROUTES.PLANNING.DETAIL(event.id));
        return;
      }
      if (event.type === 'exam') {
        navigate(PROTECTED_ROUTES.EXAMENS.DETAIL(event.id));
      }
    },
  };

  return (
    <div className="h-[calc(100vh-var(--header-height)-2rem)] -m-4 md:-m-6">
      <AppCalendar
        events={events}
        actions={actions}
        defaultView="week"
        isLoading={isLoading}
        canCreate={config.canCreate}
        canEdit={config.canEdit}
        canDelete={config.canDelete}
      />
    </div>
  );
}
