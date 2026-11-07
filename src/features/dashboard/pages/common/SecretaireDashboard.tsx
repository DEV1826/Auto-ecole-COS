import { useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useMemo } from 'react';
import { PROTECTED_ROUTES } from '@/config/routes';
import { SecretaireWelcomeHeader } from '@/features/dashboard/components/secretaire/SecretaireWelcomeHeader';
import { SecretaireStatsCards } from '@/features/dashboard/components/secretaire/SecretaireStatsCards';
import { CandidatsTable } from '@/features/candidats/components/CandidatsTable';
import type { Session, Utilisateur } from '@/types/auth.types';
import type { Candidat } from '@/types/candidats.types';
import { getAvatarUrl } from '@/lib/utils';
import { CaisseMouvementsRecentCard } from '../../../caisse/components/CaisseMouvementsRecentCard';
import { useCandidats } from '@/hooks/use.candidats';
import { useFactures } from '@/hooks/use.factures';
import { usePlanning } from '@/hooks/use.planning';
import { useExamens } from '@/hooks/use.examens';
import { useCaisse } from '@/hooks/use.caisse';

export interface SecretaireDashboardProps {
  session?: Session | null;
  user: Utilisateur;
}

export default function SecretaireDashboard({
  session,
  user,
}: SecretaireDashboardProps): React.JSX.Element {
  const navigate = useNavigate();

  const {
    candidats,
    loading: candidatsLoading,
    stats: candidatsStats,
    trends: candidatsTrends,
    getAll: getCandidats,
    getStats: getCandidatsStats,
    getTrends: getCandidatsTrends,
  } = useCandidats();
  const {
    stats: facturesStats,
    trends: facturesTrends,
    getStats: getFacturesStats,
    loading: facturesLoading,
  } = useFactures();
  const {
    stats: planningStats,
    getStats: getPlanningStats,
    loading: planningLoading,
  } = usePlanning();
  const {
    examens,
    trends: examensTrends,
    getAll: getExamens,
    loading: examensLoading,
  } = useExamens();
  const {
    mouvements,
    stats: caisseStats,
    getAll: getMouvements,
    getStats: getCaisseStats,
    loading: caisseLoading,
  } = useCaisse();

  useEffect(() => {
    void Promise.allSettled([
      getCandidats({ page: 1, limit: 5 }),
      getCandidatsStats(),
      getCandidatsTrends(),
      getFacturesStats(),
      getPlanningStats(),
      getExamens({ page: 1, limit: 50, period: 'week', sortBy: 'date', sortOrder: 'asc' }),
      getMouvements({ page: 1, limit: 5, sortBy: 'date', sortOrder: 'desc' }),
      getCaisseStats(),
    ]);
  }, [
    getCandidats,
    getCandidatsStats,
    getCandidatsTrends,
    getFacturesStats,
    getPlanningStats,
    getExamens,
    getMouvements,
    getCaisseStats,
  ]);

  const handleRefreshCandidats = useCallback(async () => {
    await Promise.allSettled([
      getCandidats({ page: 1, limit: 5 }),
      getCandidatsStats(),
      getCandidatsTrends(),
      getFacturesStats(),
      getPlanningStats(),
      getExamens({ page: 1, limit: 50, period: 'week', sortBy: 'date', sortOrder: 'asc' }),
      getMouvements({ page: 1, limit: 5, sortBy: 'date', sortOrder: 'desc' }),
      getCaisseStats(),
    ]);
  }, [
    getCandidats,
    getCandidatsStats,
    getCandidatsTrends,
    getFacturesStats,
    getPlanningStats,
    getExamens,
    getMouvements,
    getCaisseStats,
  ]);

  const secretaireName = `${user?.prenom ?? ''} ${user?.nom ?? ''}`.trim() || 'Secretaire';
  const avatarUrl = getAvatarUrl(secretaireName);
  const avatarFallback = (user?.prenom?.[0] ?? user?.nom?.[0] ?? 'S').toUpperCase();

  const examensProgrammes = useMemo(() => {
    const now = Date.now();
    const sevenDays = now + 7 * 24 * 60 * 60 * 1000;
    return examens.filter((examen) => {
      const date = new Date(examen.date).getTime();
      return date >= now && date <= sevenDays;
    }).length;
  }, [examens]);

  const stats = {
    totalCandidats: candidatsStats?.actifs ?? candidats.length,
    totalCandidatsTrend: {
      value: Math.abs(candidatsTrends?.actifs ?? 0),
      isPositive: (candidatsTrends?.actifs ?? 0) >= 0,
      label: 'vs mois dernier',
    },
    facturesImpayees: facturesStats?.facturesImpayees ?? 0,
    facturesImpayeesTrend: {
      value: Math.abs(facturesTrends?.montantImpaye ?? 0),
      isPositive: (facturesTrends?.montantImpaye ?? 0) <= 0,
      label: 'vs mois dernier',
    },
    leconsAujourdhui: planningStats?.leconsAujourdHui ?? 0,
    leconsAujourdhuiTrend: {
      value: Math.abs(planningStats?.evolutionPlanifiees ?? 0),
      isPositive: (planningStats?.evolutionPlanifiees ?? 0) >= 0,
      label: 'vs periode precedente',
    },
    examensProgrammes,
    examensProgrammesTrend: {
      value: Math.abs(examensTrends?.totalExamens ?? 0),
      isPositive: (examensTrends?.totalExamens ?? 0) >= 0,
      label: 'vs semaine derniere',
    },
  };

  const handleManagePlanning = () => navigate(PROTECTED_ROUTES.PLANNING.CALENDAR);
  const handleManageCandidats = () => navigate(PROTECTED_ROUTES.CANDIDATS.LIST);
  const handleManagePayments = () => navigate(PROTECTED_ROUTES.PAIEMENTS.LIST);
  const handleManageFactures = () => navigate(PROTECTED_ROUTES.FACTURES.LIST);
  const handleManageRapports = () => navigate(PROTECTED_ROUTES.RAPPORTS.FINANCIER);
  const handleViewAllCandidats = () => navigate(PROTECTED_ROUTES.CANDIDATS.LIST);

  const candidatsActions = {
    onView: (c: Candidat) => navigate(PROTECTED_ROUTES.CANDIDATS.DETAIL(c.id)),
    onAddPayment: (c: Candidat) =>
      navigate(`${PROTECTED_ROUTES.PAIEMENTS.CREATE}?candidatId=${c.id}`),
  };

  const candidatsEnrichments = {
    getSolde: (c: Candidat) => {
      const totalPaye = c.paiements?.reduce((acc, paiement) => acc + paiement.montant, 0) ?? 0;
      const totalFacture =
        c.factures?.reduce((acc, facture) => acc + facture.montantTotal, 0) ?? 0;
      return Math.max(totalFacture - totalPaye, 0);
    },
  };

  return (
    <div className="space-y-6 pb-10">
      <SecretaireWelcomeHeader
        secretaireName={secretaireName}
        secretaireTitle={user.role}
        avatarUrl={avatarUrl}
        avatarFallback={avatarFallback}
        lastLoginAt={session?.dernierAcces ? new Date(session.dernierAcces) : undefined}
        lessonsToday={stats.leconsAujourdhui}
        pendingPayments={stats.facturesImpayees}
        pendingExams={stats.examensProgrammes}
        unconfirmedLessons={0}
        revenueToday={facturesStats?.montantJour ?? 0}
        lessonsThisWeek={planningStats?.leconsSemaine ?? 0}
        remindersCount={0}
        onManagePlanning={handleManagePlanning}
        onManageCandidats={handleManageCandidats}
        onManagePayments={handleManagePayments}
        onManageFactures={handleManageFactures}
        onManageRapports={handleManageRapports}
        showDate
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SecretaireStatsCards
            totalCandidats={stats.totalCandidats}
            totalCandidatsTrend={stats.totalCandidatsTrend}
            facturesImpayees={stats.facturesImpayees}
            facturesImpayeesTrend={stats.facturesImpayeesTrend}
            leconsAujourdhui={stats.leconsAujourdhui}
            leconsAujourdhuiTrend={stats.leconsAujourdhuiTrend}
            examensProgrammes={stats.examensProgrammes}
            examensProgrammesTrend={stats.examensProgrammesTrend}
            className="h-full"
            isLoading={
              candidatsLoading || facturesLoading || planningLoading || examensLoading
            }
          />
        </div>

        <div className="lg:col-span-1">
          <CaisseMouvementsRecentCard
            mouvements={mouvements}
            maxItems={5}
            isLoading={caisseLoading}
            onViewAll={() => navigate('/caisse')}
            onViewMouvement={(m) => navigate(`/caisse/${m.id}`)}
            className="col-span-12 xl:col-span-5"
          />
        </div>
      </div>

      <CandidatsTable
        candidats={candidats.slice(0, 5)}
        isLoading={candidatsLoading}
        onRefresh={handleRefreshCandidats}
        actions={candidatsActions}
        enrichments={candidatsEnrichments}
        title="Derniers candidats inscrits"
        showViewAll
        onViewAll={handleViewAllCandidats}
        variant="secretaire"
        enablePagination={false}
        maxItems={5}
        asCard
        className="w-full"
      />
    </div>
  );
}
