/* eslint-disable react-hooks/set-state-in-effect */
// src/features/depenses/pages/DepensesListPage.tsx

/**
 * @module features/depenses/pages/DepensesListPage
 * @description
 * Page principale de la gestion des dépenses (sorties d’argent) de l’auto‑école COS.
 * Thème : Bleu (accent blue‑700) / indicateurs adaptés aux décaissements.
 *
 * ## Layout
 * ```
 * ─ En‑tête : titre, nombre total de dépenses, date, breadcrumb
 * ─ Bloc supérieur : statistiques (DepensesStatsCards) – 2 colonnes
 * ─ Graphique : DepensesTrendChart (stacked bar chart des dépenses par catégorie)
 * ─ Tableau complet : DepensesTable avec filtres, période, pagination
 * ```
 *
 * Les données sont chargées depuis l’API Electron via le store `useDepenses`.
 * Le graphique récupère ses propres données via `getTrendChartData`.
 *
 * @author Stive Junior
 * @version 3.0.0
 */

import * as React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb';
import { DepensesStatsCards } from '../components/DepensesStatsCards';
import { DepensesTable } from '../components/DepensesTable';
import { DepensesTrendChart } from '../components/DepensesTrendChart';
import { useAuth } from '@/hooks/use.auth';
import { useDepenses } from '@/hooks/use.depenses';
import { useVehicules } from '@/hooks/use.vehicules';
import { useNavigate } from 'react-router-dom';
import { PROTECTED_ROUTES, route } from '@/config';
import type { Depense } from '@/types/depenses.types';
import type { Vehicule } from '@/types/vehicules.types';

// ===============================
// COMPOSANT PRINCIPAL
// ===============================

/**
 * Page principale de gestion des dépenses.
 * Affiche les statistiques, le graphique de tendances et le tableau complet.
 */
export default function DepensesListPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isSecretaire = user?.role === 'SECRETAIRE';
  const canManage = isAdmin || isSecretaire;

  // Store dépenses
  const {
    depenses,
    stats,
    trends,
    sparklines,
    getAll,
    getStats,
    getTrends,
    getSparklines,
    delete: deleteDepense,
    attachReceipt,
    loading: listLoading,
    statsLoading,
    trendsLoading,
    sparklinesLoading,
  } = useDepenses();

  const { getAll: getAllVehicules, vehicules } = useVehicules();

  // État local pour les enrichissements (libellé véhicule)
  const [vehiculeMap, setVehiculeMap] = React.useState<Map<number, Vehicule>>(new Map());

  // ── Chargement initial ──────────────────────────────────────────────
  React.useEffect(() => {
    const loadInitialData = async () => {
      try {
        await getAll();
        await getStats();
        await getTrends();
        await getSparklines();
      } catch {
        toast.error('Erreur lors du chargement des données');
      }
    };
    loadInitialData();
  }, [getAll, getStats, getTrends, getSparklines]);

  // ── Chargement des véhicules ──────────────────────────────────────
  React.useEffect(() => {
    if (vehicules.length === 0) {
      getAllVehicules({});
    }
  }, [getAllVehicules, vehicules.length]);

  // ── Mise à jour de la map des véhicules ───────────────────────────
  React.useEffect(() => {
    const map = new Map<number, Vehicule>();
    vehicules.forEach((v) => map.set(v.id, v));
    setVehiculeMap(map);
  }, [vehicules]);

  // ── Handlers ──────────────────────────────────────────────────────
  const handleRefresh = async () => {
    try {
      await getAll();
      await getStats();
      await getTrends();
      await getSparklines();
      toast.success('Données actualisées');
    } catch {
      toast.error('Erreur lors du rafraîchissement');
    }
  };

  const handleExport = () => {
    // TODO: implémenter l'export des dépenses (CSV/Excel/PDF)
    toast.info('Fonction d’export à implémenter');
  };

  const handleAddDepense = () => {
    navigate(PROTECTED_ROUTES.DEPENSES.CREATE);
  };

  const handleViewDepense = (depense: Depense) => {
    navigate(route(PROTECTED_ROUTES.DEPENSES.DETAIL(depense.id)));
  };

  const handleEditDepense = (depense: Depense) => {
    navigate(route(PROTECTED_ROUTES.DEPENSES.EDIT(depense.id), { id: depense.id }));
  };

  const handleDeleteDepense = async (depense: Depense) => {
    if (!canManage) return;
    if (window.confirm(`Supprimer définitivement la dépense #${depense.id} ?`)) {
      try {
        await deleteDepense(depense.id);
        toast.success('Dépense supprimée');
        await handleRefresh();
      } catch {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleAttachReceipt = (depense: Depense) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const result = await attachReceipt(depense.id, file.name || file.name);
          if (result.success) {
            toast.success('Reçu attaché avec succès');
          } else {
            toast.error(result.message || 'Erreur lors de l’attachement');
          }
        } catch {
          toast.error('Erreur lors de l’attachement du reçu');
        }
      }
    };
    input.click();
  };

  // ── Configuration du tableau ──────────────────────────────────────
  const actions = {
    onView: handleViewDepense,
    onEdit: canManage ? handleEditDepense : undefined,
    onDelete: canManage ? handleDeleteDepense : undefined,
    onAttachReceipt: canManage ? handleAttachReceipt : undefined,
  };

  const enrichments = {
    getVehiculeImmatriculation: (d: Depense) => {
      if (d.vehiculeId && vehiculeMap.has(d.vehiculeId)) {
        return vehiculeMap.get(d.vehiculeId)?.immatriculation ?? '';
      }
      return '';
    },
    getVehiculeLibelle: (d: Depense) => {
      if (d.vehiculeId && vehiculeMap.has(d.vehiculeId)) {
        const v = vehiculeMap.get(d.vehiculeId)!;
        return `${v.marque} ${v.modele} (${v.immatriculation})`;
      }
      return '';
    },
  };

  const variant = isAdmin ? 'admin' : 'secretaire';
  const isLoading = listLoading || statsLoading || trendsLoading || sparklinesLoading;

  return (
    <div className="space-y-6 p-4 md:p-1 pb-10">
      {/* ── EN‑TÊTE ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-12 rounded-md bg-blue-700 text-white shadow-sm shrink-0">
            <TrendingDown className="size-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dépenses</h1>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <span className="capitalize">
                {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
              </span>
              <span>·</span>
              <Badge
                variant="outline"
                className="text-[10px] h-4 px-1.5 border-0 bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
              >
                {depenses.length} dépenses
              </Badge>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <PageBreadcrumb className="hidden lg:flex" />


        </div>
      </div>

      {/* Bloc supérieur : statistiques (2/3) + pGRAPHIQUE DE TENDANCES (STACKED BAR CHART) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <DepensesStatsCards
            stats={stats}
            trends={trends || undefined}
            totalSparkline={sparklines?.totalSparkline}
            moisSparkline={sparklines?.entretienSparkline} // placeholder
            carburantSparkline={sparklines?.carburantSparkline}
            entretienSparkline={sparklines?.entretienSparkline}
            isLoading={isLoading}
            onCardClick={(id) => {
              if (id === 'total-depenses') toast.info('Total des dépenses');
              else if (id === 'depenses-mois') toast.info('Dépenses du mois');
              else if (id === 'carburant') toast.info('Dépenses carburant');
              else if (id === 'entretien') toast.info('Dépenses entretien');
            }}
            className="w-full h-full"
          />
        </div>
        <div className="lg:col-span-1">

          <DepensesTrendChart />
        </div>
      </div>

      {/* ── TABLEAU COMPLET DES DÉPENSES ─────────────────────────────── */}
      <DepensesTable
        depenses={depenses}
        variant={variant}
        enrichments={enrichments}
        actions={actions}
        defaultPeriodFilter="all"
        showPeriodFilter
        enablePagination
        enableToolbar
        defaultPageSize={20}
        onRefresh={handleRefresh}
        onExport={(isAdmin || isSecretaire) ? handleExport : undefined}
        isLoading={isLoading}
        title="Historique des dépenses"
        description="Liste de toutes les sorties d’argent (carburant, entretien, salaires, etc.)"
        onAddClick={canManage ? handleAddDepense : undefined}
        asCard
        className="w-full"
        emptyMessage="Aucune dépense enregistrée."
      />
    </div>
  );
}