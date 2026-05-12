// src/features/dashboard/pages/common/MoniteurDashboard.tsx

/**
 * @module features/dashboard/pages/common/MoniteurDashboard
 * @description Tableau de bord pour le moniteur (instructeur).
 */

import { useNavigate } from 'react-router-dom';
import { type Utilisateur } from '@/types/auth.types';
import { MoniteurWelcomeHeader } from '@/features/dashboard/components/moniteurs/MoniteurWelcomeHeader';
import { PROTECTED_ROUTES, route } from '@/config/routes';

interface MoniteurDashboardProps {
  user: Utilisateur;
}

export default function MoniteurDashboard({ user }: MoniteurDashboardProps) {
  const navigate = useNavigate();

  // Données mockées (à remplacer par des appels API)
  const metrics = {
    lessonsToday: 3,
    candidatsCount: 12,
    pendingExams: 2,
    missedLessons: 1,
    totalHoursThisMonth: 28,
    successRate: 82,
  };

  const moniteurId = user?.id;

  return (
    <div className="space-y-6">
      <MoniteurWelcomeHeader
        moniteurName={`${user?.prenom} ${user?.nom}`}
        moniteurTitle="Moniteur – Permis B"
        lessonsToday={metrics.lessonsToday}
        candidatsCount={metrics.candidatsCount}
        pendingExams={metrics.pendingExams}
        missedLessons={metrics.missedLessons}
        totalHoursThisMonth={metrics.totalHoursThisMonth}
        successRate={metrics.successRate}
        onManagePlanning={() =>
          navigate(
            route(PROTECTED_ROUTES.PLANNING.MONITEUR(user.id), { moniteurId: String(moniteurId) })
          )
        }
        onManageCandidats={() => navigate(PROTECTED_ROUTES.CANDIDATS.LIST)}
        onManageLessons={() => navigate(PROTECTED_ROUTES.PLANNING.CALENDAR)}
        onManageExamens={() => navigate(PROTECTED_ROUTES.EXAMENS.LIST)}
        onProfile={() => navigate(PROTECTED_ROUTES.PROFILE)}
        onHelp={() => navigate(PROTECTED_ROUTES.UTILS.HELP)}
      />
      {/* Autres widgets du dashboard moniteur */}
    </div>
  );
}
