// src/features/dashboard/pages/common/MoniteursDashboard.tsx

/**
 * @module features/dashboard/pages/common/MoniteursDashboard
 * @description
 * Tableau de bord principal du moniteur (instructeur) de l’auto‑école COS.
 *
 * ## Architecture
 * 1. **En‑tête de bienvenue** (`MoniteurWelcomeHeader`)
 * 2. **Cartes de statistiques personnelles** (`MoniteurStatsCards`)
 * 3. **Tableau des candidats suivis** (`CandidatsTable` – vue moniteur)
 * 4. **Tableau des prochaines leçons** (`LeconsTable` – vue moniteur)
 * 5. **Graphique d’activité personnelle** (`AppActivityChart` filtré)
 *
 * @author Stive Junior
 * @version 1.0.0
 */

import { useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { PROTECTED_ROUTES, route } from '@/config/routes';
import { MoniteurWelcomeHeader } from '@/features/dashboard/components/moniteurs/MoniteurWelcomeHeader';
import { MoniteurStatsCards } from '@/features/dashboard/components/moniteurs/MoniteurStatsCards';
import { CandidatsTable } from '@/features/candidats/components/CandidatsTable';
import { LeconsTable } from '@/features/planning/components/LeconsTable';
import { AppActivityChart } from '@/features/dashboard/components/admin/AppActivityChart';
import type { Session, Utilisateur } from '@/types/auth.types';
import type { Candidat } from '@/types/candidats.types';
import type { Lecon } from '@/types/planning.types';
import { getAvatarUrl } from '@/lib';

// ============================================================
// Types
// ============================================================

export interface MoniteurDashboardProps {
  /** Session active (optionnelle) */
  session?: Session | null;
  /** Utilisateur connecté (moniteur) */
  user: Utilisateur;
  /** Callback de notification de prêt */
  onReady?: () => void;
}

// ============================================================
// Données mockées (à remplacer par des appels API réels)
// ============================================================

const MOCK_CANDIDATS: Candidat[] = [
  {
    id: 1,
    nom: 'Ndong',
    prenom: 'Charles',
    email: 'charles.ndong@example.com',
    telephone: '691234567',
    dateInscription: '2025-01-15T08:00:00Z',
    categorie: 'B',
    statut: 'EN_COURS',
    numeroPermis: null,
    dateNaissance: '1995-04-12',
    adresse: 'Rue 123, Omnisport, Yaoundé',
    notes: null,
    createdAt: '2025-01-15T08:00:00Z',
    updatedAt: '2025-01-15T08:00:00Z',
    deletedAt: null,
    paiements: [],
    lecons: [],
    examens: [],
    factures: [],
    formation: null,
    documents: [],
  },
  {
    id: 2,
    nom: 'Mbarga',
    prenom: 'Catherine',
    email: 'catherine.mbarga@example.com',
    telephone: '698765432',
    dateInscription: '2025-01-20T10:30:00Z',
    categorie: 'B',
    statut: 'EN_COURS',
    numeroPermis: null,
    dateNaissance: '1992-08-25',
    adresse: 'Avenue Mvog-Mbi, Yaoundé',
    notes: 'Premier paiement effectué',
    createdAt: '2025-01-20T10:30:00Z',
    updatedAt: '2025-01-20T10:30:00Z',
    deletedAt: null,
    paiements: [],
    lecons: [],
    examens: [],
    factures: [],
    formation: null,
    documents: [],
  },
];

const MOCK_LECONS: Lecon[] = [
  {
    id: 1,
    date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    duree: 60,
    type: 'CONDUITE',
    statut: 'PLANIFIEE',
    notes: 'Récupération stationnement',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    candidatId: 1,
    moniteurId: 10,
    vehiculeId: 3,
    candidat: MOCK_CANDIDATS[0],
    moniteur: undefined,
    vehicule: undefined,
  },
  {
    id: 2,
    date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    duree: 90,
    type: 'CONDUITE_ACCOMPAGNEE',
    statut: 'PLANIFIEE',
    notes: 'Parcours ville',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    candidatId: 2,
    moniteurId: 10,
    vehiculeId: 5,
    candidat: MOCK_CANDIDATS[1],
    moniteur: undefined,
    vehicule: undefined,
  },
];

// ============================================================
// Composant principal
// ============================================================

export default function MoniteurDashboard({
  session,
  user,
  onReady,
}: MoniteurDashboardProps): React.JSX.Element {
  const navigate = useNavigate();

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  // ── États ──────────────────────────────────────────────────────────────
  const [candidats, setCandidats] = useState<Candidat[]>([]);
  const [lecons, setLecons] = useState<Lecon[]>([]);
  const [isLoadingCandidats, setIsLoadingCandidats] = useState(true);
  const [isLoadingLecons, setIsLoadingLecons] = useState(true);

  // ── Chargement mock ────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setCandidats(MOCK_CANDIDATS);
      setLecons(MOCK_LECONS);
      setIsLoadingCandidats(false);
      setIsLoadingLecons(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleRefreshCandidats = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 600));
    setCandidats([...MOCK_CANDIDATS]);
  }, []);

  const handleRefreshLecons = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 600));
    setLecons([...MOCK_LECONS]);
  }, []);

  // ── Infos moniteur ─────────────────────────────────────────────────────
  const moniteurName = `${user?.prenom ?? ''} ${user?.nom ?? ''}`.trim() || 'Moniteur';
  const moniteurTitle = user?.role ?? 'MONITEUR';
  const avatarUrl = getAvatarUrl(moniteurName) ?? undefined;
  const avatarFallback = (user?.prenom?.[0] ?? user?.nom?.[0] ?? 'M').toUpperCase();

  // ── Métriques personnelles (mock) ──────────────────────────────────────
  const stats = {
    mesCandidats: candidats.length,
    mesCandidatsTrend: { value: 2, isPositive: true, label: 'vs mois dernier' },
    mesCandidatsSparkline: {
      values: [8, 10, 11, 12, 12, 12, 12],
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil'],
    },
    leconsAVenir: lecons.filter((l) => l.statut === 'PLANIFIEE').length,
    leconsAVenirTrend: { value: -1, isPositive: false, label: 'vs semaine dernière' },
    heuresConduiteMois: 28.5,
    heuresConduiteMoisTrend: { value: 3.5, isPositive: true, label: 'vs mois dernier' },
    tauxReussite: 82,
    tauxReussiteTrend: { value: 5, isPositive: true, label: 'vs mois dernier', isPercentage: true },
  };

  // ── Callbacks de navigation ───────────────────────────────────────────
  const handleManagePlanning = () => {
    navigate(route(PROTECTED_ROUTES.PLANNING.MONITEUR(user.id), { moniteurId: String(user.id) }));
  };
  const handleManageCandidats = () => navigate(PROTECTED_ROUTES.CANDIDATS.LIST);
  const handleManageLessons = () => navigate(PROTECTED_ROUTES.PLANNING.CALENDAR);
  const handleManageExamens = () => navigate(PROTECTED_ROUTES.EXAMENS.LIST);
  const handleProfile = () => navigate(PROTECTED_ROUTES.PROFILE);
  const handleHelp = () => navigate(PROTECTED_ROUTES.UTILS.HELP);

  // ── Actions sur les lignes du tableau des candidats ────────────────────
  const candidatsActions = {
    onView: (c: Candidat) => navigate(PROTECTED_ROUTES.CANDIDATS.DETAIL(c.id)),
    onAddLesson: (c: Candidat) =>
      navigate(`${PROTECTED_ROUTES.PLANNING.CREATE}?candidatId=${c.id}&moniteurId=${user.id}`),
    onRegisterExam: (c: Candidat) =>
      navigate(`${PROTECTED_ROUTES.EXAMENS.CREATE}?candidatId=${c.id}`),
  };

  const candidatsEnrichments = {
    getLeconsCount: (c: Candidat) => c.lecons?.length ?? 2,
    getExamensCount: (c: Candidat) => c.examens?.length ?? 1,
  };

  // ── Actions sur les lignes du tableau des leçons ───────────────────────
  const leconsActions = {
    onView: (l: Lecon) => navigate(PROTECTED_ROUTES.PLANNING.DETAIL(l.id)),
    onMarkDone: async (l: Lecon) => {
      // Simulation mise à jour
      setLecons((prev) =>
        prev.map((lecon) =>
          lecon.id === l.id ? { ...lecon, statut: 'EFFECTUEE' } : lecon
        )
      );
    },
    onReportAbsence: async (l: Lecon) => {
      setLecons((prev) =>
        prev.map((lecon) =>
          lecon.id === l.id ? { ...lecon, statut: 'ABSENCE' } : lecon
        )
      );
    },
  };

  const leconsEnrichments = {
    getCandidatNomComplet: (l: Lecon) =>
      l.candidat ? `${l.candidat.prenom} ${l.candidat.nom}` : '—',
  };

  return (
    <div className="space-y-4 pb-5">
      {/* En‑tête de bienvenue */}
      <MoniteurWelcomeHeader
        moniteurName={moniteurName}
        moniteurTitle={moniteurTitle}
        avatarUrl={avatarUrl}
        avatarFallback={avatarFallback}
        lessonsToday={stats.leconsAVenir}
        candidatsCount={stats.mesCandidats}
        lastLoginAt={session?.dernierAcces}
        pendingExams={2}
        missedLessons={0}
        totalHoursThisMonth={stats.heuresConduiteMois}
        successRate={stats.tauxReussite}
        onManagePlanning={handleManagePlanning}
        onManageCandidats={handleManageCandidats}
        onManageLessons={handleManageLessons}
        onManageExamens={handleManageExamens}
        onProfile={handleProfile}
        onHelp={handleHelp}
      />



      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="lg:col-span-1">
          {/* Cartes statistiques personnelles */}
          <MoniteurStatsCards
            mesCandidats={stats.mesCandidats}
            mesCandidatsTrend={stats.mesCandidatsTrend}
            mesCandidatsSparkline={stats.mesCandidatsSparkline}
            leconsAVenir={stats.leconsAVenir}
            leconsAVenirTrend={stats.leconsAVenirTrend}
            heuresConduiteMois={stats.heuresConduiteMois}
            heuresConduiteMoisTrend={stats.heuresConduiteMoisTrend}
            tauxReussite={stats.tauxReussite}
            tauxReussiteTrend={stats.tauxReussiteTrend}
            onCardClick={(id) => {
              if (id === 'mes-candidats') navigate(PROTECTED_ROUTES.CANDIDATS.LIST);
              else if (id === 'lecons-a-venir') navigate(PROTECTED_ROUTES.PLANNING.CALENDAR);
              else if (id === 'heures-mois') navigate(PROTECTED_ROUTES.PLANNING.CALENDAR);
              else if (id === 'taux-reussite') navigate(PROTECTED_ROUTES.EXAMENS.LIST);
            }}
            className='h-full'
          />
        </div>

        {/* Prochain événement (sidebar) */}
        <div className="lg:col-span-1">
          <LeconsTable
            lecons={lecons}
            isLoading={isLoadingLecons}
            onRefresh={handleRefreshLecons}
            actions={leconsActions}
            enrichments={leconsEnrichments}
            title="Prochaines leçons"
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
        candidats={candidats}
        isLoading={isLoadingCandidats}
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