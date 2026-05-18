// src/features/formations/pages/FormationsListPage.tsx

/**
 * @module features/formations/pages/FormationsListPage
 * @description
 * Page principale de la gestion des formations (offres pédagogiques) de l’auto‑école COS.
 * Thème : Indigo (accent indigo-700).
 *
 * Layout :
 * ─ En-tête : titre, nombre total de formations, date, bouton d’export, breadcrumb
 * ─ Bloc statistiques (`FormationsStatsCards`) — repliable
 * ─ Tableau complet (`FormationsTable`) avec filtres, pagination, actions
 *
 * Les données sont chargées depuis l’API Electron via le store `useFormations`.
 * Aucune donnée mockée n’est utilisée. Le tableau gère lui‑même la pagination.
 *
 * Les squelettes sont gérés directement par les composants enfants
 * (`FormationsStatsCards` et `FormationTrendChart`) via leur prop `isLoading`.
 *
 * @author Stive Junior
 * @version 4.0.0
 */

import * as React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb';
import { useAuth } from '@/hooks/use.auth';
import { useFormations } from '@/hooks/use.formations';
import { useNavigate } from 'react-router-dom';
import { PROTECTED_ROUTES, route } from '@/config';

import { FormationsStatsCards } from '../components/FormationsStatsCards';
import { FormationsTable } from '../components/FormationsTable';
import { FormationTrendChart } from '../components/FormationTrendChart';

import type { Formation } from '@/types/formations.types';
import type { FormationTrendChartProps } from '../components/FormationTrendChart';

export default function FormationsListPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isSecretaire = user?.role === 'SECRETAIRE';
  const canEdit = isAdmin || isSecretaire;

  // Store
  const {
    isBusy,
    formations,
    stats,
    trends,
    sparklines,
    getAll,
    getStats,
    getTrends,
    getSparklines,
    getMonthlyInscriptions,
    getPopularityStats,
    getNbInscriptions,
    update: updateFormation,

  } = useFormations();

  // État local pour les données du graphique
  const [trendChartProps, setTrendChartProps] = React.useState<FormationTrendChartProps | null>(null);
  const [trendChartLoading, setTrendChartLoading] = React.useState(false);

  // Chargement initial : toutes les formations (sans pagination)
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
  }, [getAll, getSparklines, getStats, getTrends]);

  // Chargement des données pour le graphique de tendances
  React.useEffect(() => {
    const loadTrendData = async () => {
      if (!formations.length) {
        setTrendChartProps(null);
        setTrendChartLoading(false);
        return;
      }

      setTrendChartLoading(true);
      try {
        const activeFormations = formations.filter((f) => f.actif);
        if (activeFormations.length === 1) {
          // Mode mono‑formation
          const formation = activeFormations[0];
          const monthly = await getMonthlyInscriptions(formation.id);
          const total = monthly.reduce((sum, m) => sum + m.inscriptions, 0);
          let trend = 0;
          if (monthly.length >= 2) {
            const last = monthly[monthly.length - 1].inscriptions;
            const prev = monthly[monthly.length - 2].inscriptions;
            if (prev > 0) trend = ((last - prev) / prev) * 100;
            else if (last > 0) trend = 100;
          }
          setTrendChartProps({
            type: 'single',
            formationName: formation.nom,
            monthlyData: monthly,
            totalInscriptions: total,
            trendPercentage: Math.abs(Math.round(trend)),
            isPositiveTrend: trend >= 0,
          });
        } else if (activeFormations.length > 1) {
          // Mode multi‑formations
          const popularity = await getPopularityStats();
          const data = popularity
            .filter((p) => activeFormations.some((f) => f.id === p.formationId))
            .slice(0, 5)
            .map((p) => ({
              name: p.name,
              inscriptions: p.inscriptions,
              trend: p.trend,
            }));
          const total = data.reduce((sum, d) => sum + d.inscriptions, 0);
          const globalTrendValue = data.reduce((sum, d) => sum + d.trend, 0) / data.length || 0;
          setTrendChartProps({
            type: 'multi',
            data,
            totalLabel: 'Inscriptions totales',
            totalValue: total,
            globalTrend: {
              value: Math.abs(Math.round(globalTrendValue)),
              isPositive: globalTrendValue >= 0,
              label: 'vs période précédente',
            },
          });
        } else {
          setTrendChartProps(null);
        }
      } catch (err) {
        console.error(err);
        setTrendChartProps(null);
      } finally {
        setTrendChartLoading(false);
      }
    };
    loadTrendData();
  }, [formations, getMonthlyInscriptions, getPopularityStats]);

  // Handlers
  const handleRefresh = async () => {
    await getAll();
    await getStats();
    await getTrends();
    await getSparklines();
    toast.success('Données actualisées');
  };

  const handleAddFormation = () => navigate(PROTECTED_ROUTES.FORMATIONS.CREATE);
  const handleView = (formation: Formation) =>
    navigate(route(PROTECTED_ROUTES.FORMATIONS.DETAIL(formation.id), { id: formation.id }));
  const handleEdit = (formation: Formation) =>
    navigate(route(PROTECTED_ROUTES.FORMATIONS.EDIT(formation.id), { id: formation.id }));
  const handleToggleActive = async (formation: Formation) => {
    try {
      await updateFormation(formation.id, { actif: !formation.actif });
    } catch {
      toast.error('Erreur lors du changement de statut');
    }
  };
  const handleExport = () => toast.info('Export des formations (à implémenter)');

  // Actions du tableau
  const actions = {
    onView: handleView,
    onEdit: canEdit ? handleEdit : undefined,
    onToggleActive: isAdmin ? handleToggleActive : undefined,
  };

  // Chargement asynchrone du nombre d’inscriptions pour chaque formation
  const [inscriptionsMap, setInscriptionsMap] = React.useState<Map<number, number>>(new Map());

  React.useEffect(() => {
    const loadAllInscriptions = async () => {
      const map = new Map<number, number>();
      for (const f of formations) {
        try {
          const nb = await getNbInscriptions(f.id);
          map.set(f.id, nb);
        } catch {
          map.set(f.id, 0);
        }
      }
      setInscriptionsMap(map);
    };
    if (formations.length) {
      loadAllInscriptions();
    }
  }, [formations, getNbInscriptions]);

  // Enrichissements pour le tableau
  const enrichments = {
    getDureeFormatee: (f: Formation) => `${f.heuresCode}h code / ${f.heuresConduite}h conduite`,
    getNbInscriptions: (f: Formation) => inscriptionsMap.get(f.id) ?? 0,
  };

  // État de chargement global (tous les composants partagent le même indicateur)
  const isLoading = isBusy;

  return (
    <div className="space-y-5 p-4 md:p-1 pb-10">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-12 rounded-md bg-indigo-700 text-white shadow-sm shrink-0">
            <GraduationCap className="size-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Formations</h1>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <span className="capitalize">
                {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
              </span>
              <span>·</span>
              <Badge
                variant="outline"
                className="text-[10px] h-4 px-1.5 border-0 bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
              >
                {formations.length} formations
              </Badge>
            </p>
          </div>
        </div>
        <PageBreadcrumb className="hidden lg:flex" />
      </div>

      {/* Section Statistiques + Graphique */}
      <div className="space-y-2">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Cartes statistiques - 2/3 de la largeur */}
          <div className="lg:col-span-2">
            <FormationsStatsCards
              stats={stats!}
              trends={trends || undefined}
              formationsActivesSparkline={sparklines?.formationsActivesSparkline}
              prixMoyenSparkline={sparklines?.prixMoyenSparkline}
              totalInscriptionsSparkline={sparklines?.totalInscriptionsSparkline}
              inscriptionsMoisSparkline={sparklines?.inscriptionsMoisSparkline}
              isLoading={isLoading}
              className="h-full"
            />
          </div>
          {/* Graphique de tendances - 1/3 de la largeur */}
          <div className="lg:col-span-1">

            <FormationTrendChart
              {...trendChartProps!}
              title="Tendances des inscriptions"
              isLoading={isLoading}
            />


          </div>
        </div>
      </div>

      {/* Tableau des formations */}
      <FormationsTable
        formations={formations}
        variant={isAdmin ? 'admin' : 'secretaire'}
        enrichments={enrichments}
        actions={actions}
        enablePagination
        enableToolbar
        defaultPageSize={10}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        title="Catalogue des formations"
        description="Gérez les offres pédagogiques proposées"

        onAddClick={handleAddFormation}
        onExportClick={handleExport}
        asCard
        emptyMessage="Aucune formation trouvée."
      />
    </div>
  );
}