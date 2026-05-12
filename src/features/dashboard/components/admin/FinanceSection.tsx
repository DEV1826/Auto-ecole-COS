// src/features/dashboard/components/admin/FinanceSection.tsx

/**
 * @module features/dashboard/components/admin/FinanceSection
 * @description
 * Section financière du tableau de bord administrateur de l'auto‑école COS.
 *
 * Compose les deux composants de finance sur une grille 12 colonnes :
 * - **Colonne gauche (7/12)** : `FinanceOverviewCard` – jauge demi-cercle + métriques
 * - **Colonne droite (5/12)** : `CaisseMouvementsRecentCard` – liste des transactions récentes
 *
 * ## Layout grille
 * ```
 * ┌──────────────────────────────┬──────────────────────┐
 * │  FinanceOverviewCard (xl:7)  │  CaisseMouvements    │
 * │  · Jauge taux santé          │  Récents (xl:5)      │
 * │  · Solde / Revenus / Auj.    │  · Liste entrées/    │
 * │  · Sélecteur de période      │    sorties           │
 * │                              │  · Résumé financier  │
 * └──────────────────────────────┴──────────────────────┘
 * ```
 *
 * @example
 * ```tsx
 * // Dans AdminDashboard.tsx
 * import { FinanceSection } from '@/features/dashboard/components/admin/FinanceSection';
 *
 * <div className="grid grid-cols-12 gap-4 md:gap-6">
 *   <AdminStatsCards ... />
 *   <FinanceSection
 *     caisseStats={caisseStats}
 *     caisseTrends={caisseTrends}
 *     mouvementsRecents={mouvementsRecents}
 *     paiementsStats={paiementsStats}
 *     entreesJour={entreesJour}
 *     isLoading={isLoading}
 *     onViewAllMouvements={() => navigate('/caisse')}
 *     onViewMouvement={(m) => navigate(`/caisse/${m.id}`)}
 *     onNouveauMouvement={() => navigate('/caisse/nouveau')}
 *     onPeriodeChange={(p) => refetchWithPeriode(p)}
 *   />
 * </div>
 * ```
 *
 * @author Stive Junior
 * @version 1.0.0
 */

'use client';

import React, { useCallback, useState } from 'react';
import { FinanceOverviewCard, type PeriodeFinance } from './FinanceOverviewCard';
import { CaisseMouvementsRecentCard } from './CaisseMouvementsRecentCard';
import type { CaisseStats, CaisseTrends, MouvementCaisse } from '@/types/caisse.types';
import type { PaiementsStats } from '@/types/paiements.types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Propriétés du composant `FinanceSection`.
 */
export interface FinanceSectionProps {
  /** Statistiques agrégées de la caisse */
  caisseStats?: CaisseStats;
  /** Tendances évolutives des indicateurs de caisse */
  caisseTrends?: CaisseTrends;
  /** Statistiques des paiements */
  paiementsStats?: PaiementsStats;
  /** Liste des mouvements récents (triée du plus récent au plus ancien) */
  mouvementsRecents?: MouvementCaisse[];
  /** Montant total des entrées du jour */
  entreesJour?: number;
  /** Afficher l'état de chargement global */
  isLoading?: boolean;
  /** Callback navigation vers la caisse complète */
  onViewAllMouvements?: () => void;
  /** Callback navigation vers le détail d'un mouvement */
  onViewMouvement?: (mouvement: MouvementCaisse) => void;
  /** Callback ouverture du formulaire de nouveau mouvement */
  onNouveauMouvement?: () => void;
  /**
   * Callback déclenché lors du changement de période sur la jauge.
   * Doit rafraîchir `caisseStats` et `caisseTrends` en fonction de la période.
   */
  onPeriodeChange?: (periode: PeriodeFinance) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Section financière complète du tableau de bord administrateur.
 * Place `FinanceOverviewCard` et `CaisseMouvementsRecentCard` côte à côte.
 */
export function FinanceSection({
  caisseStats,
  caisseTrends,
  paiementsStats,
  mouvementsRecents = [],
  entreesJour = 0,
  isLoading = false,
  onViewAllMouvements,
  onViewMouvement,
  onNouveauMouvement,
  onPeriodeChange,
}: FinanceSectionProps): React.JSX.Element {
  const [periode, setPeriode] = useState<PeriodeFinance>('mois');

  const handlePeriodeChange = useCallback(
    (p: PeriodeFinance) => {
      setPeriode(p);
      onPeriodeChange?.(p);
    },
    [onPeriodeChange]
  );

  return (
    <>
      {/* ── Colonne gauche : Vue d'ensemble financière ─────────────────────── */}
      <FinanceOverviewCard
        caisseStats={caisseStats}
        caisseTrends={caisseTrends}
        entreesJour={entreesJour}
        periode={periode}
        onPeriodeChange={handlePeriodeChange}
        isLoading={isLoading}
        // override col-span si besoin (xl:7 au lieu de xl:5 par défaut)
        className="col-span-12 xl:col-span-7"
      />

      {/* ── Colonne droite : Mouvements récents ────────────────────────────── */}
      <CaisseMouvementsRecentCard
        mouvements={mouvementsRecents}
        caisseStats={caisseStats}
        maxItems={5}
        isLoading={isLoading}
        onViewAll={onViewAllMouvements}
        onViewMouvement={onViewMouvement}
        className="col-span-12 xl:col-span-5"
      />
    </>
  );
}

export default FinanceSection;

// ─────────────────────────────────────────────────────────────────────────────
// EXEMPLE D'INTÉGRATION COMPLET DANS AdminDashboard.tsx
// ─────────────────────────────────────────────────────────────────────────────

/*
// src/features/dashboard/pages/AdminDashboard.tsx

import { useQuery } from '@tanstack/react-query';
import { FinanceSection } from '@/features/dashboard/components/admin/FinanceSection';
import { AdminStatsCards } from '@/features/dashboard/components/admin/AdminStatsCards';
import { getCaisseStats, getCaisseTrends, getMouvementsRecents } from '@/features/caisse/api/caisse.api';
import { getPaiementsStats } from '@/features/paiements/api/paiements.api';
import { useNavigate } from 'react-router-dom';
import type { PeriodeFinance } from '@/features/dashboard/components/admin/FinanceOverviewCard';

export function AdminDashboard() {
  const navigate = useNavigate();
  const [periode, setPeriode] = React.useState<PeriodeFinance>('mois');

  // ── Requêtes ────────────────────────────────────────────────────────────────
  const { data: caisseStats, isLoading: loadingCaisseStats } = useQuery({
    queryKey: ['caisseStats', periode],
    queryFn: () => getCaisseStats({ periode }),
  });

  const { data: caisseTrends } = useQuery({
    queryKey: ['caisseTrends', periode],
    queryFn: () => getCaisseTrends({ periode }),
  });

  const { data: mouvementsRecents = [], isLoading: loadingMouvements } = useQuery({
    queryKey: ['mouvementsRecents'],
    queryFn: () => getMouvementsRecents({ limit: 10 }),
  });

  const { data: paiementsStats } = useQuery({
    queryKey: ['paiementsStats'],
    queryFn: () => getPaiementsStats(),
  });

  // Encaissements du jour : filtrer les mouvements du jour
  const entreesJour = React.useMemo(() => {
    const today = new Date().toDateString();
    return mouvementsRecents
      .filter(
        (m) => m.type === 'ENTREE' && new Date(m.date).toDateString() === today,
      )
      .reduce((sum, m) => sum + m.montant, 0);
  }, [mouvementsRecents]);

  const isLoading = loadingCaisseStats || loadingMouvements;

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <AdminStatsCards
        totalCandidats={120}
        totalMoniteurs={8}
        totalVehiculesDisponibles={5}
        totalRevenusMois={caisseStats?.entreesMois ?? 0}
        isLoading={isLoading}
      />

      <FinanceSection
        caisseStats={caisseStats}
        caisseTrends={caisseTrends}
        paiementsStats={paiementsStats}
        mouvementsRecents={mouvementsRecents}
        entreesJour={entreesJour}
        isLoading={isLoading}
        onViewAllMouvements={() => navigate('/caisse')}
        onViewMouvement={(m) => navigate(`/caisse/${m.id}`)}
        onNouveauMouvement={() => navigate('/caisse/nouveau')}
        onPeriodeChange={setPeriode}
      />
    </div>
  );
}
*/

// ─────────────────────────────────────────────────────────────────────────────
// DONNÉES MOCK POUR STORYBOOK / TESTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Données de démonstration pour Storybook, tests unitaires, ou dev local.
 *
 * @example
 * ```tsx
 * // Dans une story Storybook
 * import { MOCK_FINANCE_DATA } from '@/features/dashboard/components/admin/FinanceSection';
 *
 * export const Default: Story = {
 *   args: {
 *     ...MOCK_FINANCE_DATA,
 *     isLoading: false,
 *   },
 * };
 * ```
 */
export const MOCK_FINANCE_DATA = {
  caisseStats: {
    soldeActuel: 285_000,
    totalEntrees: 1_250_000,
    totalSorties: 965_000,
    nombreMouvements: 56,
    entreesMois: 320_000,
    sortiesMois: 210_000,
  } satisfies CaisseStats,

  caisseTrends: {
    soldeActuel: 8.5,
    totalEntrees: 12,
    totalSorties: -3,
    entreesMois: 5.2,
    sortiesMois: 7.4,
  } satisfies CaisseTrends,

  paiementsStats: {
    totalEncaissements: 1_250_000,
    nombreTransactions: 42,
    encaissementsMois: 320_000,
    montantMoyen: 29_761.9,
  } satisfies PaiementsStats,

  mouvementsRecents: [
    {
      id: 1,
      type: 'ENTREE' as const,
      montant: 50_000,
      solde: 285_000,
      description: 'Paiement candidat Dupont Jean',
      reference: 'PAY-100',
      date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // il y a 2h
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      type: 'SORTIE' as const,
      montant: 15_000,
      solde: 235_000,
      description: 'Achat carburant – Toyota Corolla LT-456',
      reference: 'DEP-045',
      date: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // il y a 6h
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 3,
      type: 'ENTREE' as const,
      montant: 75_000,
      solde: 250_000,
      description: 'Inscription candidat Martin Sophie',
      reference: 'PAY-099',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // hier
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 4,
      type: 'SORTIE' as const,
      montant: 8_500,
      solde: 175_000,
      description: 'Fournitures de bureau',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 5,
      type: 'ENTREE' as const,
      montant: 100_000,
      solde: 183_500,
      description: 'Paiement candidat Kone Ibrahim',
      reference: 'PAY-098',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ] satisfies MouvementCaisse[],

  entreesJour: 50_000,
};
