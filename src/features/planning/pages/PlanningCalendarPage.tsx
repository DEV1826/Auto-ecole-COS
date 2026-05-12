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
import { Navigate } from 'react-router-dom';
import { PUBLIC_ROUTES } from '@/config/routes';
import { useAuth } from '@/hooks/use.auth';
import { type Role as RoleType } from '@/types/enums';
import { AppCalendar } from '@/components/calendar/app-calendar';
import { getAvatarUrl } from '@/lib/utils';
import type {
  CalendarActions,
  CalendarEvent,
  CalendarEventFormData,
  CalendarEventType,
} from '@/components/calendar/types';

// ============================================================
// Configuration par rôle
// ============================================================

/**
 * Configuration des permissions et actions selon le rôle.
 * @param role - Rôle de l’utilisateur connecté
 * @returns Options de configuration
 */
function getRoleCalendarConfig(role: RoleType) {
  switch (role) {
    case 'ADMIN':
      return {
        canCreate: true,
        canEdit: true,
        canDelete: true,
        allowedEventTypes: [
          'lesson',
          'exam',
          'payment',
          'maintenance',
          'reminder',
        ] as CalendarEventType[],
        description: 'Gestion complète du planning auto‑école',
      };
    case 'SECRETAIRE':
      return {
        canCreate: true,
        canEdit: true,
        canDelete: true,
        allowedEventTypes: ['lesson', 'exam', 'payment', 'reminder'] as CalendarEventType[],
        description: 'Gestion des leçons, examens, paiements et rappels',
      };
    case 'MONITEUR':
      return {
        canCreate: true,
        canEdit: true,
        canDelete: false,
        allowedEventTypes: ['lesson'] as CalendarEventType[],
        description: 'Consultez votre planning et validez les présences',
      };
    default:
      return {
        canCreate: false,
        canEdit: false,
        canDelete: false,
        allowedEventTypes: [] as CalendarEventType[],
        description: 'Calendrier COS',
      };
  }
}

// ============================================================
// Données mockées (simulation d’API)
// ============================================================

/**
 * Génère un ensemble d’événements mockés pour le développement.
 * Ces données seront remplacées par des appels API réels.
 * @returns Tableau d’événements calendrier typés
 */
function generateMockEvents(): CalendarEvent[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return [
    {
      id: 1,
      title: 'Leçon de conduite - Charles Ndong',
      type: 'lesson',
      status: 'CONFIRMED',
      startDate: new Date(today.getTime() + 9 * 3600000),
      endDate: new Date(today.getTime() + 10 * 3600000),
      allDay: false,
      location: 'Piste 1',
      description: 'Première leçon de conduite, prise en main du véhicule',
      notes: 'Candidat sérieux',
      priority: 'MEDIUM',
      isUrgent: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      candidat: {
        id: 1,
        name: 'Charles Ndong',
        avatarUrl: getAvatarUrl('Charles Ndong'),
        role: 'Candidat',
      },
      moniteur: {
        id: 1,
        name: 'Marc Dubois',
        avatarUrl: getAvatarUrl('Marc Dubois'),
        role: 'Moniteur',
      },
      vehicule: 'LT-123-AB',
    },
    {
      id: 2,
      title: 'Examen code - Catherine Mbarga',
      type: 'exam',
      status: 'CONFIRMED',
      startDate: new Date(today.getTime() + 14 * 3600000),
      endDate: new Date(today.getTime() + 15 * 3600000),
      allDay: false,
      location: 'Centre d’examen Ngoa-Ekelle',
      description: 'Examen du code de la route',
      notes: 'Résultats attendus dans la semaine',
      priority: 'HIGH',
      isUrgent: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      candidat: {
        id: 2,
        name: 'Catherine Mbarga',
        avatarUrl: getAvatarUrl('Catherine Mbarga'),
        role: 'Candidat',
      },
    },
    {
      id: 3,
      title: 'Rappel paiement - Jean Ewolo',
      type: 'payment',
      status: 'PLANIFIED',
      startDate: new Date(today.getTime() + 2 * 24 * 3600000),
      endDate: new Date(today.getTime() + 2 * 24 * 3600000 + 3600000),
      allDay: false,
      description: 'Deuxième versement dû pour la formation',
      notes: 'Acompte déjà versé, reste 150 000 FCFA',
      priority: 'MEDIUM',
      isUrgent: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      montant: 150000,
      candidat: {
        id: 3,
        name: 'Jean Ewolo',
        avatarUrl: getAvatarUrl('Jean Ewolo'),
        role: 'Candidat',
      },
    },
    {
      id: 4,
      title: 'Entretien véhicule LT-789-EF',
      type: 'maintenance',
      status: 'CONFIRMED',
      startDate: new Date(today.getTime() + 5 * 24 * 3600000),
      endDate: new Date(today.getTime() + 5 * 24 * 3600000 + 2 * 3600000),
      allDay: false,
      location: 'Garage du Centre',
      description: 'Révision générale + vidange',
      notes: 'Véhicule Peugeot 208',
      priority: 'HIGH',
      isUrgent: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      vehicule: 'LT-789-EF',
    },
    {
      id: 5,
      title: 'Leçon code - Anne Tchoffo',
      type: 'lesson',
      status: 'CONFIRMED',
      startDate: new Date(today.getTime() + 3 * 24 * 3600000 + 10 * 3600000),
      endDate: new Date(today.getTime() + 3 * 24 * 3600000 + 12 * 3600000),
      allDay: false,
      location: 'Salle de code',
      description: 'Révision des panneaux',
      priority: 'LOW',
      isUrgent: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      candidat: {
        id: 4,
        name: 'Anne Tchoffo',
        avatarUrl: getAvatarUrl('Anne Tchoffo'),
        role: 'Candidat',
      },
      moniteur: {
        id: 2,
        name: 'Sophie Martin',
        avatarUrl: getAvatarUrl('Sophie Martin'),
        role: 'Moniteur',
      },
      vehicule: 'LT-456-CD',
    },
    {
      id: 6,
      title: 'Rappel administratif - Réunion équipe',
      type: 'reminder',
      status: 'CONFIRMED',
      startDate: new Date(today.getTime() + 4 * 24 * 3600000 + 8 * 3600000),
      endDate: new Date(today.getTime() + 4 * 24 * 3600000 + 9 * 3600000),
      allDay: false,
      location: 'Salle de réunion',
      description: 'Point hebdomadaire avec les moniteurs',
      priority: 'MEDIUM',
      isUrgent: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
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
  const { user, isAuthenticated } = useAuth();

  // État des événements
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Chargement mocké (à remplacer par appel API réel)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setEvents(generateMockEvents());
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const role = user?.role as RoleType;
  const config = getRoleCalendarConfig(role);

  /**
   * Filtre les événements en fonction du rôle :
   * - ADMIN → tous les événements
   * - SECRETAIRE → tous mais sans maintenance (optionnel)
   * - MONITEUR → uniquement ses propres leçons
   */
  const filteredEvents = React.useMemo(() => {
    if (role === 'MONITEUR' && user?.id) {
      return events.filter((ev) => ev.type === 'lesson' && ev.moniteur?.id === user?.id);
    }
    if (role === 'SECRETAIRE') {
      // Le secrétaire peut voir les maintenances s’il le faut, mais on les garde
      return events;
    }
    return events;
  }, [events, role, user?.id]);

  // Garde d’authentification
  if (!isAuthenticated || !user) {
    return <Navigate to={PUBLIC_ROUTES.AUTH.LOGIN} replace />;
  }

  /**
   * Actions CRUD du calendrier.
   * Ces fonctions sont appelées par AppCalendar après validation.
   */
  const actions: CalendarActions = {
    onCreate: async (data: CalendarEventFormData) => {
      // Simulation d’envoi à l’API
      const newEvent: CalendarEvent = {
        id: Date.now(),
        title: data.title,
        type: data.type,
        status: data.status,
        startDate: data.startDate,
        endDate: data.endDate,
        allDay: data.allDay,
        location: data.location,
        description: data.description,
        notes: data.notes,
        priority: data.priority,
        isUrgent: data.isUrgent,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Les relations (candidat, moniteur) devraient être chargées depuis l’API
      };
      setEvents((prev) => [...prev, newEvent]);
      toast.success('Événement créé', {
        description: `"${data.title}" a été ajouté au planning`,
      });
    },

    onUpdate: async (id: number, data: Partial<CalendarEventFormData>) => {
      setEvents((prev) =>
        prev.map((ev) => (ev.id === id ? { ...ev, ...data, updatedAt: new Date() } : ev))
      );
      toast.success('Événement modifié');
    },

    onDelete: async (id: number) => {
      setEvents((prev) => prev.filter((ev) => ev.id !== id));
      toast.success('Événement supprimé');
    },

    onConfirm: async (event: CalendarEvent) => {
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === event.id
            ? {
                ...ev,
                status: 'CONFIRMED',
                notes: `${ev.notes || ''} [confirmée le ${new Date().toLocaleDateString('fr-FR')}]`,
                updatedAt: new Date(),
              }
            : ev
        )
      );
      toast.success('Confirmation enregistrée', {
        description: `"${event.title}" a été confirmé`,
      });
    },

    onCancel: async (event: CalendarEvent) => {
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === event.id ? { ...ev, status: 'CANCELLED', updatedAt: new Date() } : ev
        )
      );
      toast.info('Annulation enregistrée', {
        description: `"${event.title}" a été annulé`,
      });
    },

    onComplete: async (event: CalendarEvent) => {
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === event.id ? { ...ev, status: 'DONE', updatedAt: new Date() } : ev
        )
      );
      toast.success('Événement marqué comme effectué', {
        description: `"${event.title}" a été terminé`,
      });
    },

    onReschedule: (event: CalendarEvent) => {
      toast.info('Reprogrammation', {
        description: `Ouvrir le formulaire pour reprogrammer "${event.title}"`,
      });
    },

    onView: (event: CalendarEvent) => {
      console.log('Voir détails', event);
    },
  };

  return (
    <div className="h-[calc(100vh-var(--header-height)-2rem)] -m-4 md:-m-6">
      <AppCalendar
        events={filteredEvents}
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
