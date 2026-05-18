/* eslint-disable react-hooks/set-state-in-effect */
// src/features/dashboard/pages/common/AdminDashboard.tsx

/**
 * @module features/dashboard/pages/common/AdminDashboard
 * @description
 * Tableau de bord principal de l’administrateur de l’auto‑école COS.
 * 
 * ## Correction Bug de Boucle Infinie (Recharts / Maximum Update Depth)
 * L'erreur provenait de la mise à jour asynchrone de l'état `soldeMap` qui recréait 
 * indirectement le tableau `activityData` transmis à Recharts à chaque rendu.
 * Recharts interceptait ce changement de référence, provoquant des re-renders en cascade.
 * 
 * Solutions appliquées :
 * 1. Mémorisation stricte de `activityData` via `React.useMemo`.
 * 2. Stabilisation des actions et enrichissements passés aux tableaux.
 * 3. Utilisation de structures figées pour les valeurs par défaut.
 * 
 * @author Stive Junior
 * @version 3.2.0
 */

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { PROTECTED_ROUTES, route } from '@/config/routes';
import { useAuth } from '@/hooks/use.auth';
import { useCandidats } from '@/hooks/use.candidats';
import { useMoniteurs } from '@/hooks/use.moniteurs';
import { useVehicules } from '@/hooks/use.vehicules';
import { usePaiements } from '@/hooks/use.paiements';
import { useCaisse } from '@/hooks/use.caisse';
import { usePlanning } from '@/hooks/use.planning';
import { useExamens } from '@/hooks/use.examens';
import { useDepenses } from '@/hooks/use.depenses';

import { AdminWelcomeHeader } from '@/features/dashboard/components/admin/AdminWelcomeHeader';
import { AdminStatsCards } from '@/features/dashboard/components/admin/AdminStatsCards';
import { CandidatsTable } from '@/features/candidats/components/CandidatsTable';
import { AuthStatsCards } from '@/features/admin/components/AuthStatsCards';
import { FinanceOverviewCard } from '@/features/dashboard/components/admin/FinanceOverviewCard';
import { CaisseMouvementsRecentCard } from '@/features/caisse/components/CaisseMouvementsRecentCard';
import { AppActivityChart, type AppActivityDataPoint } from '@/features/dashboard/components/admin/AppActivityChart';
import { Footer } from '@/components/footer';

import type { Candidat } from '@/types/candidats.types';
import { getAvatarUrl } from '@/lib/utils';

// Constantes globales gelées pour éviter les instanciations inutiles en mémoire
const STATIC_EMPTY_OBJECT = Object.freeze({});
const STATIC_SPARKLINE_DEFAULT = Object.freeze({
  values: [112, 118, 125, 132, 138, 148, 158],
  labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil']
});
const STATIC_COLUMN_CONFIG = Object.freeze({ showLeconsCount: false, showExamensCount: false });

export default function AdminDashboard(): React.JSX.Element {
  const navigate = useNavigate();

  // ── Stores Zustand ──────────────────────────────────────────────────────
  const { user, lastSession: session, getStats: getAuthStats, getTrends: getAuthTrends, getSparklines: getAuthSparklines } = useAuth();
  const { candidats, getAll: getAllCandidats, stats: candidatsStats, trends: candidatsTrends, getStats: getCandidatsStats, getTrends: getCandidatsTrends } = useCandidats();
  const { moniteurs, getAll: getAllMoniteurs, stats: moniteursStats, trends: moniteursTrends, sparklines: moniteursSparkline, getStats: getMoniteursStats } = useMoniteurs();
  const { vehicules, getAll: getAllVehicules, stats: vehiculesStats, trends: vehiculesTrends, sparklines: vehiculesSparkline, getStats: getVehiculesStats } = useVehicules();
  const { getSoldeCandidat, paiements, getAll: getAllPaiements, stats: paiementsStats, trends: paiementsTrends, sparklines: paiementsSparkline, getStats: getPaiementsStats, getTrends: getPaiementsTrends } = usePaiements();
  const { stats: caisseStats, trends: caisseTrends, mouvements, getAll: getAllMouvements, getStats: getCaisseStats, getTrends: getCaisseTrends } = useCaisse();
  const { lecons, getAll: getAllLecons, getStats: getLeconsStats } = usePlanning();
  const { examens, getAll: getAllExamens, getStats: getExamensStats } = useExamens();
  const { depenses, getAll: getAllDepenses, getStats: getDepensesStats } = useDepenses();

  // ── États locaux légitimes ──────────────────────────────────────────────
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [soldeMap, setSoldeMap] = React.useState<Map<number, number>>(new Map());

  // ── Chargement initial de toutes les données au montage ─────────────────
  React.useEffect(() => {
    let isMounted = true;

    const loadAllData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          getAuthStats(),
          getAuthTrends(),
          getAuthSparklines(),
          getAllCandidats(),
          getCandidatsStats(),
          getCandidatsTrends(),
          getAllMoniteurs(),
          getMoniteursStats(),
          getAllVehicules(),
          getVehiculesStats(),
          getAllPaiements(),
          getPaiementsStats(),
          getPaiementsTrends(),
          getAllMouvements(),
          getCaisseStats(),
          getCaisseTrends(),
          getAllLecons(),
          getLeconsStats(),
          getAllExamens(),
          getExamensStats(),
          getAllDepenses(),
          getDepensesStats(),
        ]);
      } catch (err) {
        console.error('Erreur chargement magasins du dashboard:', err);
        if (isMounted) {
          toast.error('Erreur lors du chargement des données du tableau de bord');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadAllData();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Mémorisation des valeurs dérivées pour bloquer les re-renders inutiles ──

  const candidatsRecents = React.useMemo<Candidat[]>(() => {
    if (!candidats || candidats.length === 0) return [];
    return [...candidats]
      .sort((a, b) => new Date(b.dateInscription).getTime() - new Date(a.dateInscription).getTime())
      .slice(0, 5);
  }, [candidats]);

  const leconsAujourdHui = React.useMemo<number>(() => {
    if (!lecons || lecons.length === 0) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    return lecons.filter(l => {
      const d = new Date(l.date);
      return d >= today && d < tomorrow;
    }).length;
  }, [lecons]);

  const candidatsInscritsMois = React.useMemo<number>(() => {
    if (candidatsStats?.inscritsCeMois !== undefined) {
      return candidatsStats.inscritsCeMois;
    }
    if (!candidats || candidats.length === 0) return 0;
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    return candidats.filter(c => new Date(c.dateInscription) >= startOfMonth).length;
  }, [candidats, candidatsStats]);

  const revenusMois = React.useMemo<number>(() => {
    return paiementsStats?.totalEncaissements || 0;
  }, [paiementsStats]);

  // ── Chargement asynchrone sécurisé des soldes via l'API ────────────────
  React.useEffect(() => {
    if (candidatsRecents.length === 0) return;

    let isMounted = true;

    const loadSoldesCandidats = async () => {
      const temporaryMap = new Map<number, number>();

      await Promise.all(
        candidatsRecents.map(async (c) => {
          try {
            const soldeData = await getSoldeCandidat(c.id);
            temporaryMap.set(c.id, soldeData.solde);
          } catch {
            temporaryMap.set(c.id, 0);
          }
        })
      );

      if (isMounted) {
        setSoldeMap(prev => {
          // Vérification de contenu pour éviter de casser la référence si les soldes sont identiques
          let hasChanged = prev.size !== temporaryMap.size;
          if (!hasChanged) {
            for (const [key, val] of temporaryMap.entries()) {
              if (prev.get(key) !== val) {
                hasChanged = true;
                break;
              }
            }
          }
          return hasChanged ? temporaryMap : prev;
        });
      }
    };

    loadSoldesCandidats();

    return () => {
      isMounted = false;
    };
  }, [candidatsRecents, getSoldeCandidat]);

  // ── Handlers de navigation mémorisés ────────────────────────────────────
  const handleManageCandidats = React.useCallback(() => navigate(PROTECTED_ROUTES.CANDIDATS.LIST), [navigate]);
  const handleViewAllCandidats = React.useCallback(() => navigate(PROTECTED_ROUTES.CANDIDATS.LIST), [navigate]);

  const handleStatsCardClick = React.useCallback((cardId: string) => {
    switch (cardId) {
      case 'total-candidats':
        navigate(PROTECTED_ROUTES.CANDIDATS.LIST);
        break;
      case 'total-moniteurs':
        navigate(PROTECTED_ROUTES.MONITEURS.LIST);
        break;
      case 'total-vehicules':
        navigate(PROTECTED_ROUTES.VEHICULES.LIST);
        break;
      case 'total-revenus':
        navigate(PROTECTED_ROUTES.PAIEMENTS.LIST);
        break;
      case 'total-users':
      case 'total-admins':
      case 'total-secretaires':
        navigate(PROTECTED_ROUTES.ADMIN.USERS.LIST);
        break;
      default:
        break;
    }
  }, [navigate]);

  // ── Identité utilisateur connecté mémorisée ──────────────────────────────
  const adminName = React.useMemo(() => user ? `${user.prenom} ${user.nom}`.trim() : 'Administrateur', [user]);
  const adminTitle = user?.role;
  const avatarUrl = React.useMemo(() => user ? getAvatarUrl(`${user.prenom} ${user.nom}`.trim()) : undefined, [user]);
  const avatarFallback = React.useMemo(() => user ? (user.prenom?.[0] || user.nom?.[0] || 'A').toUpperCase() : 'A', [user]);

  // ── Actions et enrichissements stabilisés pour le tableau ────────────────
  const candidatsActions = React.useMemo(() => ({
    onView: (c: Candidat) => navigate(route(PROTECTED_ROUTES.CANDIDATS.DETAIL(c.id), { id: c.id })),
    onEdit: (c: Candidat) => navigate(route(PROTECTED_ROUTES.CANDIDATS.EDIT(c.id), { id: c.id })),
    onAddPayment: (c: Candidat) => navigate(`${PROTECTED_ROUTES.PAIEMENTS.CREATE}?candidatId=${c.id}`),
    onAddLesson: (c: Candidat) => navigate(`${PROTECTED_ROUTES.PLANNING.CREATE}?candidatId=${c.id}`),
    onRegisterExam: (c: Candidat) => navigate(`${PROTECTED_ROUTES.EXAMENS.CREATE}?candidatId=${c.id}`),
    onViewDocuments: (c: Candidat) => navigate(`${PROTECTED_ROUTES.DOCUMENTS.PAR_CANDIDAT(c.id)}?candidatId=${c.id}`),
  }), [navigate]);

  const candidatsEnrichments = React.useMemo(() => ({
    getSolde: (c: Candidat) => soldeMap.get(c.id) ?? 0,
    getLeconsCount: (c: Candidat) => c.lecons?.length ?? 0,
    getExamensCount: (c: Candidat) => c.examens?.length ?? 0,
  }), [soldeMap]);

  // ── Extraction des sous-états auth ──────────────────────────────────────
  const authStats = useAuth().stats;
  const authTrends = useAuth().trends;
  const authSparklines = useAuth().sparklines;

  // ── Mouvements financiers mémorisés ─────────────────────────────────────
  const recentMouvements = React.useMemo(() => {
    if (!mouvements) return [];
    return [...mouvements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [mouvements]);

  const entreesJour = React.useMemo(() => {
    if (!mouvements) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return mouvements
      .filter(m => m.type === 'ENTREE' && new Date(m.date) >= today)
      .reduce((sum, m) => sum + m.montant, 0);
  }, [mouvements]);

  // ── Graphique d’activité : Mémorisation ultra-stricte anti-boucle ──────────
  const activityData = React.useMemo((): AppActivityDataPoint[] => {
    const now = new Date();
    const dataPoints: AppActivityDataPoint[] = [];

    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const dateStr = format(monthStart, 'yyyy-MM-dd');

      const newCandidats = candidats.filter(c => {
        const d = new Date(c.dateInscription);
        return d >= monthStart && d <= monthEnd;
      }).length;

      const newMoniteurs = moniteurs.filter(m => {
        if (!m.createdAt) return false;
        const d = new Date(m.createdAt);
        return d >= monthStart && d <= monthEnd;
      }).length;

      const newVehicules = vehicules.filter(v => {
        if (!v.createdAt) return false;
        const d = new Date(v.createdAt);
        return d >= monthStart && d <= monthEnd;
      }).length;

      const leconsCount = lecons.filter(l => {
        const d = new Date(l.date);
        return d >= monthStart && d <= monthEnd;
      }).length;

      const examensCount = examens.filter(e => {
        const d = new Date(e.date);
        return d >= monthStart && d <= monthEnd;
      }).length;

      const paiementsTotal = paiements.filter(p => {
        const d = new Date(p.date);
        return d >= monthStart && d <= monthEnd;
      }).reduce((sum, p) => sum + p.montant, 0);

      const depensesTotal = depenses.filter(d => {
        const dDate = new Date(d.date);
        return dDate >= monthStart && dDate <= monthEnd;
      }).reduce((sum, d) => sum + d.montant, 0);

      const examensMois = examens.filter(e => {
        const d = new Date(e.date);
        return d >= monthStart && d <= monthEnd;
      });
      const reussis = examensMois.filter(e => e.resultat === 'RECU').length;
      const tauxReussite = examensMois.length > 0 ? (reussis / examensMois.length) * 100 : 0;

      dataPoints.push({
        date: dateStr,
        newCandidats,
        newMoniteurs,
        newVehicules,
        lecons: leconsCount,
        examens: examensCount,
        paiements: paiementsTotal,
        depenses: depensesTotal,
        tauxReussite: parseFloat(tauxReussite.toFixed(1)),
      });
    }

    return dataPoints;
  }, [candidats, moniteurs, vehicules, lecons, examens, paiements, depenses]);

  return (
    <div className="space-y-5 pb-8">
      {/* En‑tête de bienvenue */}
      <AdminWelcomeHeader
        adminName={adminName}
        isLoading={isLoading}
        adminTitle={adminTitle}
        avatarUrl={avatarUrl}
        avatarFallback={avatarFallback}
        lastLoginAt={session?.dernierAcces}
        newCandidatsCount={candidatsInscritsMois}
        pendingPayments={0}
        pendingMaintenances={vehicules.filter(v => v.statut === 'EN_ENTRETIEN').length}
        lessonsToday={leconsAujourdHui}
        candidatsThisMonth={candidatsInscritsMois}
        monthlyRevenue={revenusMois}
        vehicleOccupancyRate={
          vehicules.length ? (vehicules.filter(v => v.statut === 'EN_LECON').length / vehicules.length) * 100 : 0
        }
        onManageCandidats={handleManageCandidats}
        showDate
      />

      {/* Bloc supérieur : cartes métier + sidebar financière */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AdminStatsCards
            candidatsStats={candidatsStats}
            candidatsTrends={candidatsTrends ?? STATIC_EMPTY_OBJECT}
            moniteursStats={moniteursStats}
            moniteursTrends={moniteursTrends ?? STATIC_EMPTY_OBJECT}
            vehiculesStats={vehiculesStats}
            vehiculesTrends={vehiculesTrends ?? STATIC_EMPTY_OBJECT}
            paiementsStats={paiementsStats}
            paiementsTrends={paiementsTrends ?? STATIC_EMPTY_OBJECT}
            candidatsSparkline={STATIC_SPARKLINE_DEFAULT}
            moniteursSparkline={moniteursSparkline?.actifsSparkline}
            vehiculesSparkline={vehiculesSparkline?.disponiblesSparkline}
            revenusSparkline={paiementsSparkline?.totalEncaissementsSparkline}
            isLoading={isLoading}
            onCardClick={handleStatsCardClick}
            className="h-full"
          />
        </div>
        <div className="lg:col-span-1">
          <CaisseMouvementsRecentCard
            mouvements={recentMouvements}
            caisseStats={caisseStats!}
            maxItems={5}
            isLoading={isLoading}
            onViewAll={() => navigate(PROTECTED_ROUTES.CAISSE.INDEX)}
            className="h-full"
          />
        </div>
      </div>

      {/* Deuxième ligne : candidats récents + aperçu financier */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CandidatsTable
            candidats={candidatsRecents}
            isLoading={isLoading}
            actions={candidatsActions}
            enrichments={candidatsEnrichments}
            title="Derniers candidats inscrits"
            showViewAll
            columnConfig={STATIC_COLUMN_CONFIG}
            onViewAll={handleViewAllCandidats}
            variant="admin"
            enablePagination={false}
            maxItems={5}
            asCard
            description="Consultez et gérez l’ensemble des élèves inscrits"
            emptyMessage="Aucun candidat trouvé pour cette période."
            className="w-full h-full"
          />
        </div>
        <div className="lg:col-span-1">
          <FinanceOverviewCard
            caisseStats={caisseStats!}
            caisseTrends={caisseTrends!}
            entreesJour={entreesJour}
            periode="mois"
            isLoading={isLoading}
            className="h-full"
          />
        </div>
      </div>

      {/* Graphique d’activité globale stabilisé */}
      <AppActivityChart
        title="Activité de l’auto‑école"
        data={activityData}
        showComparison={false}
        showTrend
        defaultChartType="area"
        height={380}
        showLegend
        className="w-full"
      />

      {/* Statistiques système (utilisateurs) */}
      <AuthStatsCards
        stats={authStats}
        trends={authTrends ?? STATIC_EMPTY_OBJECT}
        totalUsersSparkline={authSparklines?.totalUtilisateursSparkline}
        totalAdminsSparkline={authSparklines?.totalAdminsSparkline}
        totalSecretairesSparkline={authSparklines?.totalSecretairesSparkline}
        totalMoniteursSparkline={authSparklines?.totalMoniteursSparkline}
        isLoading={isLoading}
        onCardClick={handleStatsCardClick}
        className="w-full"
      />

      <Footer variant="minim" />
    </div>
  );
}