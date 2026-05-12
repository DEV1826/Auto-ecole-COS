// src/features/dashboard/pages/common/SecretaireDashboard.tsx

/**
 * @module features/dashboard/pages/common/SecretaireDashboard
 * @description
 * Tableau de bord principal du secrétaire de l’auto‑école COS.
 *
 * ## Architecture
 * 1. **En‑tête de bienvenue** (`SecretaireWelcomeHeader`) : messages contextuels,
 *    actions rapides (planning, candidats, paiements, examens, factures, rapports).
 * 2. **Cartes de statistiques** (`SecretaireStatsCards`) : 4 KPI adaptés au secrétaire :
 *    - Candidats actifs
 *    - Factures impayées
 *    - Leçons du jour
 *    - Examens programmés
 * 3. **Tableau des candidats récents** (`CandidatsTable`) : dernières inscriptions,
 *    avec actions (voir, ajouter paiement) et lien vers la liste complète.
 *
 * ## Rôle
 * Accessible uniquement aux utilisateurs avec le rôle `SECRETAIRE`.
 *
 * @see {@link SecretaireWelcomeHeader}
 * @see {@link SecretaireStatsCards}
 * @see {@link CandidatsTable}
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @example
 * ```tsx
 * // Dans le routeur
 * <Route path={PROTECTED_ROUTES.DASHBOARD} element={<SecretaireDashboard />} />
 * ```
 */

import { useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { PROTECTED_ROUTES } from '@/config/routes';
import { SecretaireWelcomeHeader } from '@/features/dashboard/components/secretaire/SecretaireWelcomeHeader';
import { SecretaireStatsCards } from '@/features/dashboard/components/secretaire/SecretaireStatsCards';
import { CandidatsTable } from '@/features/candidats/components/CandidatsTable';
import type { Session, Utilisateur } from '@/types/auth.types';
import type { Candidat } from '@/types/candidats.types';
import { getAvatarUrl } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SecretaireDashboardProps {
  /** Session utilisateur (contenant éventuellement des infos supplémentaires) */
  session?: Session | null;
  /** Utilisateur courant (nécessaire pour l’affichage du nom, avatar, etc.) */
  user: Utilisateur;
}

// ─────────────────────────────────────────────────────────────────────────────
// Données mockées pour le développement
// ─────────────────────────────────────────────────────────────────────────────

/** Mock de quelques candidats récents (les mêmes que pour l’admin) */
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
];

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Page du tableau de bord du secrétaire.
 *
 * Affiche une vue d’ensemble des tâches quotidiennes :
 * - Salutation personnalisée et alertes,
 * - Indicateurs clés (candidats, factures, leçons, examens),
 * - Liste des dernières inscriptions.
 */
export default function SecretaireDashboard({
  session,
  user,
}: SecretaireDashboardProps): React.JSX.Element {
  const navigate = useNavigate();

  // ── Simulation d’un chargement de candidats ─────────────────────────────
  const [candidats, setCandidats] = useState<Candidat[]>([]);
  const [isLoadingCandidats, setIsLoadingCandidats] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCandidats(MOCK_CANDIDATS);
      setIsLoadingCandidats(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Rafraîchissement (simulation)
  const handleRefreshCandidats = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 600));
    setCandidats([...MOCK_CANDIDATS]);
  }, []);

  // ── Informations secrétaire ─────────────────────────────────────────────
  const secretaireName = `${user?.prenom ?? ''} ${user?.nom ?? ''}`.trim() || 'Secrétaire';
  const avatarUrl = getAvatarUrl(secretaireName);
  const avatarFallback = (user?.prenom?.[0] ?? user?.nom?.[0] ?? 'S').toUpperCase();

  // ── Données mockées pour les cartes de statistiques ────────────────────
  const stats = {
    totalCandidats: 156,
    totalCandidatsTrend: { value: 8, isPositive: true, label: 'vs mois dernier' },
    totalCandidatsSparkline: {
      values: [120, 132, 140, 148, 152, 154, 156],
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil'],
    },
    facturesImpayees: 12,
    facturesImpayeesTrend: { value: -3, isPositive: true, label: 'vs mois dernier' },
    leconsAujourdhui: 8,
    leconsAujourdhuiTrend: { value: 2, isPositive: true, label: 'vs hier' },
    examensProgrammes: 3,
    examensProgrammesTrend: { value: 1, isPositive: false, label: 'vs semaine dernière' },
  };

  // ── Callbacks de navigation depuis l’en‑tête ───────────────────────────
  const handleManagePlanning = () => navigate(PROTECTED_ROUTES.PLANNING.CALENDAR);
  const handleManageCandidats = () => navigate(PROTECTED_ROUTES.CANDIDATS.LIST);
  const handleManagePayments = () => navigate(PROTECTED_ROUTES.PAIEMENTS.LIST);
  const handleManageExamens = () => navigate(PROTECTED_ROUTES.EXAMENS.LIST);
  const handleManageFactures = () => navigate(PROTECTED_ROUTES.FACTURES.LIST);
  const handleManageRapports = () => navigate(PROTECTED_ROUTES.RAPPORTS.FINANCIER);
  const handleViewAllCandidats = () => navigate(PROTECTED_ROUTES.CANDIDATS.LIST);

  // ── Actions pour le tableau des candidats récents ──────────────────────
  const candidatsActions = {
    onView: (c: Candidat) => navigate(PROTECTED_ROUTES.CANDIDATS.DETAIL(c.id)),
    onAddPayment: (c: Candidat) =>
      navigate(`${PROTECTED_ROUTES.PAIEMENTS.CREATE}?candidatId=${c.id}`),
  };

  const candidatsEnrichments = {
    getSolde: (c: Candidat) =>
      (c.paiements?.reduce?.((acc, p) => acc + p.montant, 0) ?? 0) > 50000 ? 0 : 75000,
  };

  // ── Rendu principal ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-10">
      {/* En‑tête de bienvenue */}
      <SecretaireWelcomeHeader
        secretaireName={secretaireName}
        secretaireTitle={user.role}
        avatarUrl={avatarUrl}
        avatarFallback={avatarFallback}
        lastLoginAt={session?.dernierAcces ? new Date(session.dernierAcces) : undefined}
        lessonsToday={stats.leconsAujourdhui}
        pendingPayments={stats.facturesImpayees}
        pendingExams={stats.examensProgrammes}
        unconfirmedLessons={1}
        revenueToday={85000}
        lessonsThisWeek={18}
        remindersCount={3}
        onManagePlanning={handleManagePlanning}
        onManageCandidats={handleManageCandidats}
        onManagePayments={handleManagePayments}
        onManageExamens={handleManageExamens}
        onManageFactures={handleManageFactures}
        onManageRapports={handleManageRapports}
        showDate
      />

      {/* Cartes de statistiques */}
      <SecretaireStatsCards
        totalCandidats={stats.totalCandidats}
        totalCandidatsTrend={stats.totalCandidatsTrend}
        totalCandidatsSparkline={stats.totalCandidatsSparkline}
        facturesImpayees={stats.facturesImpayees}
        facturesImpayeesTrend={stats.facturesImpayeesTrend}
        leconsAujourdhui={stats.leconsAujourdhui}
        leconsAujourdhuiTrend={stats.leconsAujourdhuiTrend}
        examensProgrammes={stats.examensProgrammes}
        examensProgrammesTrend={stats.examensProgrammesTrend}
      />

      {/* Tableau des candidats récents */}
      <CandidatsTable
        candidats={candidats.slice(0, 5)}
        isLoading={isLoadingCandidats}
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
