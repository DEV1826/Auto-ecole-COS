// src/features/dashboard/pages/common/AdminDashboard.tsx

/**
 * @module features/dashboard/pages/common/AdminDashboard
 * @description
 * Tableau de bord principal de l’administrateur de l’auto‑école COS.
 *
 * ## Architecture
 * 1. **En‑tête de bienvenue** (`AdminWelcomeHeader`)
 * 2. **Cartes de statistiques métier** (`AdminStatsCards`)
 * 3. **Tableau des candidats récents** (`CandidatsTable`)
 * 4. **Cartes de statistiques système** (`AuthStatsCards`)
 * 5. **Section financière** (`FinanceOverviewCard` + `CaisseMouvementsRecentCard`)
 * 6. **Graphique d’activité globale** (`AppActivityChart`)
 *
 * @author Stive Junior
 * @version 2.0.0 (ajout de la section financière)
 */

import { useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { PROTECTED_ROUTES } from '@/config/routes';
import { AdminWelcomeHeader } from '@/features/dashboard/components/admin/AdminWelcomeHeader';
import { AdminStatsCards } from '@/features/dashboard/components/admin/AdminStatsCards';
import { AuthStatsCards } from '@/features/dashboard/components/admin/AuthStatsCards';
import { CandidatsTable } from '@/features/candidats/components/CandidatsTable';
import { AppActivityChart } from '@/features/dashboard/components/admin/AppActivityChart';
import { FinanceOverviewCard } from '@/features/dashboard/components/admin/FinanceOverviewCard';
import { CaisseMouvementsRecentCard } from '@/features/dashboard/components/admin/CaisseMouvementsRecentCard';
import type { Session, Utilisateur } from '@/types/auth.types';
import type { Candidat } from '@/types/candidats.types';
import type { CaisseStats, CaisseTrends, MouvementCaisse } from '@/types/caisse.types';
import { getAvatarUrl } from '@/lib';

// ============================================================
// Types
// ============================================================

export interface AdminDashboardProps {
  session?: Session | null;
  user: Utilisateur;
  onReady?: () => void;
}

// ============================================================
// Données mockées (finances)
// ============================================================

const MOCK_CAISSE_STATS: CaisseStats = {
  soldeActuel: 285_000,
  totalEntrees: 1_250_000,
  totalSorties: 965_000,
  nombreMouvements: 56,
  entreesMois: 320_000,
  sortiesMois: 210_000,
};

const MOCK_CAISSE_TRENDS: CaisseTrends = {
  soldeActuel: 8.5,
  totalEntrees: 12,
  totalSorties: -3,
  entreesMois: 5.2,
  sortiesMois: 7.4,
};

const MOCK_MOUVEMENTS_RECENTS: MouvementCaisse[] = [
  {
    id: 1,
    type: 'ENTREE',
    montant: 50_000,
    solde: 285_000,
    description: 'Paiement candidat Dupont Jean',
    reference: 'PAY-100',
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    type: 'SORTIE',
    montant: 15_000,
    solde: 235_000,
    description: 'Achat carburant – Toyota Corolla LT-456',
    reference: 'DEP-045',
    date: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    type: 'ENTREE',
    montant: 75_000,
    solde: 250_000,
    description: 'Inscription candidat Martin Sophie',
    reference: 'PAY-099',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    type: 'SORTIE',
    montant: 8_500,
    solde: 175_000,
    description: 'Fournitures de bureau',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 5,
    type: 'ENTREE',
    montant: 100_000,
    solde: 183_500,
    description: 'Paiement candidat Kone Ibrahim',
    reference: 'PAY-098',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ============================================================
// Composant principal
// ============================================================
// ── Candidats mockés ─────────────────────────────────────────────────────
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
  {
    id: 3,
    nom: 'Ewolo',
    prenom: 'Jean',
    email: 'jean.ewolo@example.com',
    telephone: '677889900',
    dateInscription: '2025-02-01T09:15:00Z',
    categorie: 'B',
    statut: 'EN_COURS',
    numeroPermis: null,
    dateNaissance: '2006-05-15',
    adresse: 'Bastos, Yaoundé',
    notes: 'Formation conduite accompagnée',
    createdAt: '2025-02-01T09:15:00Z',
    updatedAt: '2025-02-01T09:15:00Z',
    deletedAt: null,
    paiements: [],
    lecons: [],
    examens: [],
    factures: [],
    formation: null,
    documents: [],
  },
  {
    id: 4,
    nom: 'Tchoffo',
    prenom: 'Anne',
    email: 'anne.tchoffo@example.com',
    telephone: '688990011',
    dateInscription: '2025-02-05T14:00:00Z',
    categorie: 'B',
    statut: 'EN_COURS',
    numeroPermis: null,
    dateNaissance: '1998-11-30',
    adresse: 'Messa, Yaoundé',
    notes: 'Candidat sérieux',
    createdAt: '2025-02-05T14:00:00Z',
    updatedAt: '2025-02-05T14:00:00Z',
    deletedAt: null,
    paiements: [],
    lecons: [],
    examens: [],
    factures: [],
    formation: null,
    documents: [],
  },
  {
    id: 5,
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
    id: 6,
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
  {
    id: 7,
    nom: 'Ewolo',
    prenom: 'Jean',
    email: 'jean.ewolo@example.com',
    telephone: '677889900',
    dateInscription: '2025-02-01T09:15:00Z',
    categorie: 'B',
    statut: 'EN_COURS',
    numeroPermis: null,
    dateNaissance: '2006-05-15',
    adresse: 'Bastos, Yaoundé',
    notes: 'Formation conduite accompagnée',
    createdAt: '2025-02-01T09:15:00Z',
    updatedAt: '2025-02-01T09:15:00Z',
    deletedAt: null,
    paiements: [],
    lecons: [],
    examens: [],
    factures: [],
    formation: null,
    documents: [],
  },
  {
    id: 8,
    nom: 'Tchoffo',
    prenom: 'Anne',
    email: 'anne.tchoffo@example.com',
    telephone: '688990011',
    dateInscription: '2025-02-05T14:00:00Z',
    categorie: 'B',
    statut: 'EN_COURS',
    numeroPermis: null,
    dateNaissance: '1998-11-30',
    adresse: 'Messa, Yaoundé',
    notes: 'Candidat sérieux',
    createdAt: '2025-02-05T14:00:00Z',
    updatedAt: '2025-02-05T14:00:00Z',
    deletedAt: null,
    paiements: [],
    lecons: [],
    examens: [],
    factures: [],
    formation: null,
    documents: [],
  },
];

export default function AdminDashboard({
  session,
  user,
  onReady,
}: AdminDashboardProps): React.JSX.Element {
  const navigate = useNavigate();

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  const [candidats, setCandidats] = useState<Candidat[]>([]);
  const [isLoadingCandidats, setIsLoadingCandidats] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCandidats(MOCK_CANDIDATS);
      setIsLoadingCandidats(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleRefreshCandidats = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 600));
    setCandidats([...MOCK_CANDIDATS]);
  }, []);

  // ── Infos admin ─────────────────────────────────────────────────────────
  const adminName = `${user?.prenom ?? ''} ${user?.nom ?? ''}`.trim() || 'Administrateur';
  const adminTitle = user?.role;
  const avatarUrl = getAvatarUrl(`${user?.prenom ?? ''} ${user?.nom ?? ''}`.trim()) ?? undefined;
  const avatarFallback = (user?.prenom?.[0] ?? user?.nom?.[0] ?? 'A').toUpperCase();

  // ── Stats métier mockées ────────────────────────────────────────────────
  const businessStats = {
    totalCandidats: 158,
    totalCandidatsTrend: { value: 12, isPositive: true, label: 'vs mois dernier' },
    totalCandidatsSparkline: {
      values: [112, 118, 125, 132, 138, 148, 158],
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil'],
    },
    totalMoniteurs: 8,
    totalMoniteursTrend: { value: 2, label: 'vs 2 mois dernier' },
    totalMoniteursSparkline: {
      values: [52, 118, 425, 132, 538, 248, 158],
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil'],
    },
    totalVehiculesDisponibles: 12,
    totalVehiculesDisponiblesTrend: { value: 2, isPositive: true, label: 'vs mois dernier' },
    totalRevenusMois: 8750000,
    totalRevenusMoisTrend: {
      value: 8.5,
      isPositive: true,
      label: 'vs mois dernier',
      isPercentage: true,
    },
  };

  // ── Stats système mockées ───────────────────────────────────────────────
  const authStats = {
    totalUsers: 24,
    totalUsersTrend: { value: 4, isPositive: true, label: 'vs mois dernier' },
    totalUsersSparkline: {
      values: [18, 20, 21, 22, 23, 24, 24],
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil'],
    },
    totalAdmins: 2,
    totalAdminsTrend: { value: 0, label: 'stable' },
    totalSecretaires: 3,
    totalSecretairesTrend: { value: 1, isPositive: true, label: 'ce mois' },
    totalMoniteurs: 8,
    totalMoniteursTrend: { value: -1, isPositive: false, label: 'vs mois dernier' },
  };

  // ── Navigation ──────────────────────────────────────────────────────────
  const handleManageCandidats = () => navigate(PROTECTED_ROUTES.CANDIDATS.LIST);
  const handleSystemSettings = () => navigate(PROTECTED_ROUTES.SETTINGS);
  const handleViewAllCandidats = () => navigate(PROTECTED_ROUTES.CANDIDATS.LIST);

  const handleStatsCardClick = (cardId: string) => {
    if (cardId === 'total-candidats') navigate(PROTECTED_ROUTES.CANDIDATS.LIST);
    else if (cardId === 'total-moniteurs') navigate(PROTECTED_ROUTES.MONITEURS.LIST);
    else if (cardId === 'total-vehicules') navigate(PROTECTED_ROUTES.VEHICULES.LIST);
    else if (cardId === 'total-revenus') navigate(PROTECTED_ROUTES.PAIEMENTS.LIST);
    else if (cardId === 'total-users') navigate(PROTECTED_ROUTES.ADMIN.USERS.LIST);
    else if (cardId === 'total-admins') navigate(PROTECTED_ROUTES.ADMIN.USERS.LIST);
    else if (cardId === 'total-secretaires') navigate(PROTECTED_ROUTES.ADMIN.USERS.LIST);
  };

  const candidatsActions = {
    onView: (c: Candidat) => navigate(PROTECTED_ROUTES.CANDIDATS.DETAIL(c.id)),
    onEdit: (c: Candidat) => navigate(PROTECTED_ROUTES.CANDIDATS.EDIT(c.id)),
    onAddPayment: (c: Candidat) =>
      navigate(`${PROTECTED_ROUTES.PAIEMENTS.CREATE}?candidatId=${c.id}`),
    onAddLesson: (c: Candidat) =>
      navigate(`${PROTECTED_ROUTES.PLANNING.CREATE}?candidatId=${c.id}`),
    onRegisterExam: (c: Candidat) =>
      navigate(`${PROTECTED_ROUTES.EXAMENS.CREATE}?candidatId=${c.id}`),
    onViewDocuments: (c: Candidat) => navigate(`/documents?candidatId=${c.id}`),
  };

  const candidatsEnrichments = {
    getSolde: (c: Candidat) =>
      (c.paiements?.reduce?.((acc, p) => acc + p.montant, 0) ?? 0) > 50000 ? 0 : 75000,
    getLeconsCount: (c: Candidat) => c.lecons?.length ?? 2,
    getExamensCount: (c: Candidat) => c.examens?.length ?? 1,
  };

  // ── Entrées du jour (mock) ──────────────────────────────────────────────
  const entreesJour = MOCK_MOUVEMENTS_RECENTS.filter(
    (m) => m.type === 'ENTREE' && new Date(m.date).toDateString() === new Date().toDateString()
  ).reduce((sum, m) => sum + m.montant, 0);

  return (
    <div className="space-y-4 pb-10">
      {/* En‑tête de bienvenue */}
      <AdminWelcomeHeader
        adminName={adminName}
        adminTitle={adminTitle}
        avatarUrl={avatarUrl}
        avatarFallback={avatarFallback}
        lastLoginAt={session?.dernierAcces ? new Date(session.dernierAcces) : undefined}
        newCandidatsCount={4}
        pendingPayments={2}
        pendingMaintenances={1}
        lessonsToday={5}
        candidatsThisMonth={18}
        monthlyRevenue={8750000}
        vehicleOccupancyRate={78}
        onManageCandidats={handleManageCandidats}
        onSystemSettings={handleSystemSettings}
        showDate
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AdminStatsCards
            totalCandidats={businessStats.totalCandidats}
            totalCandidatsTrend={businessStats.totalCandidatsTrend}
            totalCandidatsSparkline={businessStats.totalCandidatsSparkline}
            totalMoniteursSparkline={businessStats.totalMoniteursSparkline}
            totalMoniteurs={businessStats.totalMoniteurs}
            totalMoniteursTrend={businessStats.totalMoniteursTrend}
            totalVehiculesDisponibles={businessStats.totalVehiculesDisponibles}
            totalVehiculesDisponiblesTrend={businessStats.totalVehiculesDisponiblesTrend}
            totalRevenusMois={businessStats.totalRevenusMois}
            totalRevenusMoisTrend={businessStats.totalRevenusMoisTrend}
            onCardClick={handleStatsCardClick}
            className="h-full"
          />
        </div>

        {/* Prochain événement (sidebar) */}
        <div className="lg:col-span-1">
          <CaisseMouvementsRecentCard
            mouvements={MOCK_MOUVEMENTS_RECENTS}
            caisseStats={MOCK_CAISSE_STATS}
            maxItems={5}
            isLoading={false}
            onViewAll={() => navigate('/caisse')}
            onViewMouvement={(m) => navigate(`/caisse/${m.id}`)}
            className="col-span-12 xl:col-span-5"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CandidatsTable
            candidats={candidats}
            isLoading={isLoadingCandidats}
            onRefresh={handleRefreshCandidats}
            actions={candidatsActions}
            enrichments={candidatsEnrichments}
            title="Derniers candidats inscrits"
            showViewAll
            columnConfig={{
              showLeconsCount: false,
              showExamensCount: false,
            }}
            onViewAll={handleViewAllCandidats}
            variant="admin"
            enablePagination={true}
            defaultPageSize={5}
            maxItems={5}
            asCard
            className="w-ful h-full"
          />
        </div>

        {/* Prochain événement (sidebar) */}
        <div className="lg:col-span-1">
          <FinanceOverviewCard
            caisseStats={MOCK_CAISSE_STATS}
            caisseTrends={MOCK_CAISSE_TRENDS}
            entreesJour={entreesJour}
            periode="mois"
            isLoading={false}
            className="col-span-12 xl:col-span-7"
          />
        </div>
      </div>

      {/* Graphique d’activité globale */}
      <AppActivityChart
        title="Activité de l’auto‑école"
        showComparison={false}
        showTrend
        defaultChartType="area"
        height={380}
        showLegend
        className="w-full"
      />
      {/* Cartes statistiques système (utilisateurs) */}
      <AuthStatsCards
        totalUsers={authStats.totalUsers}
        totalUsersTrend={authStats.totalUsersTrend}
        totalUsersSparkline={authStats.totalUsersSparkline}
        totalAdmins={authStats.totalAdmins}
        totalAdminsTrend={authStats.totalAdminsTrend}
        totalSecretaires={authStats.totalSecretaires}
        totalSecretairesTrend={authStats.totalSecretairesTrend}
        totalMoniteurs={authStats.totalMoniteurs}
        totalMoniteursTrend={authStats.totalMoniteursTrend}
        onCardClick={handleStatsCardClick}
      />
    </div>
  );
}
