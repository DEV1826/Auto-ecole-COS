import { useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useMemo } from 'react';
import { type Utilisateur, type Session } from '@/types/auth.types';
import { MoniteurWelcomeHeader } from '@/features/dashboard/components/moniteurs/MoniteurWelcomeHeader';
import { MoniteurStatsCards } from '@/features/dashboard/components/moniteurs/MoniteurStatsCards';
import { CandidatsTable } from '@/features/candidats/components/CandidatsTable';
import { LeconsTable } from '@/features/planning/components/LeconsTable';
import { PROTECTED_ROUTES, route } from '@/config/routes';
import { getAvatarUrl } from '@/lib';
import { usePlanning } from '@/hooks/use.planning';
import { useExamens } from '@/hooks/use.examens';
import { useCandidats } from '@/hooks/use.candidats';
import type { Candidat } from '@/types/candidats.types';
import type { Lecon } from '@/types/planning.types';

interface MoniteurDashboardProps {
  user: Utilisateur;
  session?: Session | null;
  onReady?: () => void;
}

export default function MoniteurDashboard({
  user,
  session,
  onReady,
}: MoniteurDashboardProps) {
  const navigate = useNavigate();
  const {
    lecons,
    loading: leconsLoading,
    stats: planningStats,
    trends: planningTrends,
    getAll: getLecons,
    getStats: getPlanningStats,
    getTrends: getPlanningTrends,
    update: updateLecon,
  } = usePlanning();
  const {
    examens,
    stats: examensStats,
    getAll: getExamens,
    loading: examensLoading,
  } = useExamens();
  const {
    candidats,
    loading: candidatsLoading,
    getAll: getCandidats,
  } = useCandidats();

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  useEffect(() => {
    void Promise.allSettled([
      getLecons({
        page: 1,
        limit: 50,
        moniteurId: user.id,
        sortBy: 'date',
        sortOrder: 'asc',
      }),
      getPlanningStats(),
      getPlanningTrends(),
      getExamens({ page: 1, limit: 100, sortBy: 'date', sortOrder: 'desc' }),
      getCandidats({ page: 1, limit: 100 }),
    ]);
  }, [
    getLecons,
    getPlanningStats,
    getPlanningTrends,
    getExamens,
    getCandidats,
    user.id,
  ]);

  const moniteurName = `${user?.prenom ?? ''} ${user?.nom ?? ''}`.trim() || 'Moniteur';
  const moniteurTitle = user?.role ?? 'MONITEUR';
  const avatarUrl = getAvatarUrl(moniteurName) ?? undefined;
  const avatarFallback = (user?.prenom?.[0] ?? user?.nom?.[0] ?? 'M').toUpperCase();

  const mesLecons = useMemo(
    () => lecons.filter((lecon) => lecon.moniteurId === user.id),
    [lecons, user.id]
  );
  const mesCandidats = useMemo(() => {
    const candidatIds = new Set(mesLecons.map((lecon) => lecon.candidatId));
    return candidats.filter((candidat) => candidatIds.has(candidat.id));
  }, [candidats, mesLecons]);
  const mesExamens = useMemo(() => {
    const candidatIds = new Set(mesCandidats.map((candidat) => candidat.id));
    return examens.filter((examen) => candidatIds.has(examen.candidatId));
  }, [examens, mesCandidats]);

  const lessonsToday = useMemo(() => {
    const today = new Date();
    return mesLecons.filter((lecon) => {
      const date = new Date(lecon.date);
      return (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
      );
    }).length;
  }, [mesLecons]);

  const upcomingLessons = useMemo(() => {
    const now = Date.now();
    const nextWeek = now + 7 * 24 * 60 * 60 * 1000;
    return mesLecons.filter((lecon) => {
      const date = new Date(lecon.date).getTime();
      return date >= now && date <= nextWeek && lecon.statut === 'PLANIFIEE';
    }).length;
  }, [mesLecons]);

  const totalHoursThisMonth = useMemo(() => {
    const now = new Date();
    return (
      mesLecons
        .filter((lecon) => {
          const date = new Date(lecon.date);
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        })
        .reduce((acc, lecon) => acc + lecon.duree, 0) / 60
    );
  }, [mesLecons]);

  const successRate = useMemo(() => {
    if (mesExamens.length === 0) {
      return examensStats?.tauxReussiteGlobal ?? 0;
    }
    const reussites = mesExamens.filter((examen) => examen.resultat === 'RECU').length;
    return Math.round((reussites / mesExamens.length) * 100);
  }, [examensStats?.tauxReussiteGlobal, mesExamens]);

  const handleRefreshCandidats = useCallback(async () => {
    await Promise.allSettled([
      getLecons({
        page: 1,
        limit: 50,
        moniteurId: user.id,
        sortBy: 'date',
        sortOrder: 'asc',
      }),
      getExamens({ page: 1, limit: 100, sortBy: 'date', sortOrder: 'desc' }),
      getCandidats({ page: 1, limit: 100 }),
    ]);
  }, [getLecons, getExamens, getCandidats, user.id]);

  const handleRefreshLecons = useCallback(async () => {
    await getLecons({
      page: 1,
      limit: 50,
      moniteurId: user.id,
      sortBy: 'date',
      sortOrder: 'asc',
    });
  }, [getLecons, user.id]);

  const candidatsActions = {
    onView: (c: Candidat) => navigate(PROTECTED_ROUTES.CANDIDATS.DETAIL(c.id)),
    onAddLesson: (c: Candidat) =>
      navigate(`${PROTECTED_ROUTES.PLANNING.CREATE}?candidatId=${c.id}&moniteurId=${user.id}`),
    onRegisterExam: (c: Candidat) =>
      navigate(`${PROTECTED_ROUTES.EXAMENS.CREATE}?candidatId=${c.id}`),
  };

  const candidatsEnrichments = {
    getLeconsCount: (c: Candidat) =>
      mesLecons.filter((lecon) => lecon.candidatId === c.id).length,
    getExamensCount: (c: Candidat) =>
      mesExamens.filter((examen) => examen.candidatId === c.id).length,
  };

  const leconsActions = {
    onView: (l: Lecon) => navigate(PROTECTED_ROUTES.PLANNING.DETAIL(l.id)),
    onMarkDone: async (l: Lecon) => {
      await updateLecon(l.id, { statut: 'EFFECTUEE' });
      await handleRefreshLecons();
    },
    onReportAbsence: async (l: Lecon) => {
      await updateLecon(l.id, { statut: 'ABSENCE' });
      await handleRefreshLecons();
    },
  };

  const leconsEnrichments = {
    getCandidatNomComplet: (l: Lecon) =>
      l.candidat ? `${l.candidat.prenom} ${l.candidat.nom}` : '—',
  };

  return (
    <div className="space-y-4 pb-5">
      <MoniteurWelcomeHeader
        moniteurName={moniteurName}
        moniteurTitle={moniteurTitle}
        avatarUrl={avatarUrl}
        avatarFallback={avatarFallback}
        lessonsToday={lessonsToday}
        candidatsCount={mesCandidats.length}
        lastLoginAt={session?.dernierAcces}
        pendingExams={mesExamens.filter((examen) => new Date(examen.date) >= new Date()).length}
        missedLessons={mesLecons.filter((lecon) => lecon.statut === 'ABSENCE').length}
        totalHoursThisMonth={totalHoursThisMonth}
        successRate={successRate}
        onManagePlanning={() =>
          navigate(route(PROTECTED_ROUTES.PLANNING.MONITEUR(user.id), { moniteurId: String(user.id) }))
        }
        onManageCandidats={() => navigate(PROTECTED_ROUTES.CANDIDATS.LIST)}
        onManageLessons={() => navigate(PROTECTED_ROUTES.PLANNING.CALENDAR)}
        onManageExamens={() => navigate(PROTECTED_ROUTES.EXAMENS.LIST)}
        onProfile={() => navigate(PROTECTED_ROUTES.PROFILE)}
        onHelp={() => navigate(PROTECTED_ROUTES.UTILS.HELP)}
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="lg:col-span-1">
          <MoniteurStatsCards
            mesCandidats={mesCandidats.length}
            mesCandidatsTrend={{
              value: 0,
              isPositive: true,
              label: 'suivis actuellement',
            }}
            leconsAVenir={upcomingLessons}
            leconsAVenirTrend={{
              value: Math.abs(planningTrends?.leconsPlanifiees ?? 0),
              isPositive: (planningTrends?.leconsPlanifiees ?? 0) >= 0,
              label: 'vs periode precedente',
            }}
            heuresConduiteMois={totalHoursThisMonth}
            heuresConduiteMoisTrend={{
              value: Math.abs(planningTrends?.heuresConduiteTotal ?? 0),
              isPositive: (planningTrends?.heuresConduiteTotal ?? 0) >= 0,
              label: 'vs mois dernier',
            }}
            tauxReussite={successRate}
            tauxReussiteTrend={{
              value: Math.abs((examensStats?.evolutionReussite ?? 0) || 0),
              isPositive: (examensStats?.evolutionReussite ?? 0) >= 0,
              label: 'vs mois dernier',
            }}
            onCardClick={(id) => {
              if (id === 'mes-candidats') navigate(PROTECTED_ROUTES.CANDIDATS.LIST);
              else if (id === 'lecons-a-venir') navigate(PROTECTED_ROUTES.PLANNING.CALENDAR);
              else if (id === 'heures-mois') navigate(PROTECTED_ROUTES.PLANNING.CALENDAR);
              else if (id === 'taux-reussite') navigate(PROTECTED_ROUTES.EXAMENS.LIST);
            }}
            className="h-full"
            isLoading={leconsLoading || examensLoading || candidatsLoading}
          />
        </div>

        <div className="lg:col-span-1">
          <LeconsTable
            lecons={mesLecons.slice(0, 5)}
            isLoading={leconsLoading}
            onRefresh={handleRefreshLecons}
            actions={leconsActions}
            enrichments={leconsEnrichments}
            title="Prochaines lecons"
            showViewAll
            onViewAll={() => navigate(PROTECTED_ROUTES.PLANNING.CALENDAR)}
            variant="moniteur"
            maxItems={5}
            asCard
            className="h-full"
            enablePagination
            defaultPageSize={5}
          />
        </div>
      </div>

      <CandidatsTable
        candidats={mesCandidats}
        isLoading={candidatsLoading || leconsLoading}
        onRefresh={handleRefreshCandidats}
        actions={candidatsActions}
        enrichments={candidatsEnrichments}
        title="Mes candidats"
        showViewAll
        onViewAll={() => navigate(PROTECTED_ROUTES.CANDIDATS.LIST)}
        variant="moniteur"
        enablePagination
        enableToolbar
        defaultPageSize={5}
        asCard
        className="h-full"
      />
    </div>
  );
}
