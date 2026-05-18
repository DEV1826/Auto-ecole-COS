// src/features/caisse/pages/CaisseIndexPage.tsx

/**
 * @module features/caisse/pages/CaisseIndexPage
 * @description
 * Page principale du relevé de caisse de l'auto‑école COS.
 * Thème : Bleu (accent blue‑700) / indicateurs Emerald/Red selon le flux.
 *
 * ## Layout
 * ```
 * ┌──────────────────────────────────────────────────────────────┐
 * │  En-tête : titre · badge mouvements · date · Export         │
 * ├────────────────────────────┬─────────────────────────────────┤
 * │  CaisseStatsCards (2 cols) │  RecentMouvementsCard           │
 * │  (solde, entrées, sorties, │  (5 derniers mouvements +       │
 * │   solde net)               │   solde courant + flux net)     │
 * ├────────────────────────────┴─────────────────────────────────┤
 * │  CaisseTable — historique complet paginé                     │
 * └──────────────────────────────────────────────────────────────┘
 * ```
 *
 * Les données sont chargées depuis l’API Electron via le store `useCaisse`.
 * Aucune donnée mockée n’est utilisée. Le tableau gère lui‑même la pagination.
 *
 * @author Stive Junior
 * @version 3.0.0
 */

import * as React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Wallet, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb';
import { cn, getAvatarUrl } from '@/lib/utils';

import { CaisseStatsCards } from '../components/CaisseStatsCards';
import { CaisseTable } from '../components/CaisseTable';
import { useAuth } from '@/hooks/use.auth';
import { useCaisse } from '@/hooks/use.caisse';
import CaisseMouvementsRecentCard from '@/features/caisse/components/CaisseMouvementsRecentCard';
import type { MouvementCaisse, CaisseEnrichments } from '@/types/caisse.types';
import { useNavigate } from 'react-router-dom';
import { PROTECTED_ROUTES } from '@/config';

export default function CaisseIndexPage(): React.JSX.Element {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role;
  const isAdmin = role === 'ADMIN';
  const isSecretaire = role === 'SECRETAIRE';
  const variant: 'admin' | 'secretaire' = isAdmin ? 'admin' : 'secretaire';

  // Store caisse
  const {
    mouvements,
    stats,
    trends,
    sparklines,
    getAll,
    getStats,
    getTrends,
    getSparklines,
    exportMouvements,
    loading: listLoading,
    statsLoading,
    trendsLoading,
    sparklinesLoading,
  } = useCaisse();

  const [isLoading, setIsLoading] = React.useState(false);

  // Chargement initial : toutes les mouvements (non paginés)
  React.useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Récupérer tous les mouvements avec relations
        await getAll({});
        await getStats();
        await getTrends();
        await getSparklines();
      } catch {
        toast.error('Erreur lors du chargement des données');
      }
    };
    loadInitialData();
  }, [getAll, getStats, getTrends, getSparklines]);

  // Handlers
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await getAll({});
      await getStats();
      await getTrends();
      await getSparklines();
      toast.success('Données actualisées');
    } catch {
      toast.error('Erreur lors du rafraîchissement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const result = await exportMouvements({});
      if (result.success && result.path) {
        toast.success(`Export généré : ${result.path}`);
        window.open(result.path, '_blank');
      } else {
        toast.error(result.message || 'Erreur lors de l’export');
      }
    } catch {
      toast.error('Erreur lors de l’export');
    }
  };

  const handleViewMouvement = (m: MouvementCaisse) => {
    if (m.entree) {
      navigate(PROTECTED_ROUTES.PAIEMENTS.DETAIL(m.entree.id));
    } else if (m.sortie) {

      navigate(PROTECTED_ROUTES.DEPENSES.DETAIL(m.sortie.id));
    } else {
      toast.info(`Mouvement #${m.id} sans entrée ni sortie associée`);
    }

  };

  // Construction des enrichissements pour le tableau (avantages et textes secondaires)
  const enrichments: CaisseEnrichments = React.useMemo(
    () => ({
      getNomCandidat: (m: MouvementCaisse) => {
        if (m.entree?.candidat) {
          const c = m.entree.candidat;
          return `${c.prenom} ${c.nom}`;
        }
        return '';
      },
      getCandidatInitials: (m: MouvementCaisse) => {
        if (m.entree?.candidat) {
          const c = m.entree.candidat;
          return `${c.prenom?.[0] || ''}${c.nom?.[0] || ''}`.toUpperCase();
        }
        return '';
      },
      getCandidatAvatarUrl: (m: MouvementCaisse) => {
        if (m.entree?.candidat) {
          const c = m.entree.candidat;
          return getAvatarUrl(`${c.prenom} ${c.nom}`);
        }
        return '';
      },
      getVehiculeLibelle: (m: MouvementCaisse) => {
        if (m.sortie?.vehicule) {
          const v = m.sortie.vehicule;
          return `${v.marque} ${v.modele} — ${v.immatriculation}`.trim();
        }
        return '';
      },
    }),
    []
  );

  const isLoadingGlobal = listLoading || statsLoading || trendsLoading || sparklinesLoading || isLoading;

  return (
    <div className="space-y-6 p-4 md:p-1 pb-12">
      {/* En‑tête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-12 rounded-md bg-blue-700 text-white shadow-sm shrink-0">
            <Wallet className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight">Relevé de caisse</h1>
              <Badge
                variant="outline"
                className="text-[10px] h-5 px-1.5 border-0 bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-semibold"
              >
                {stats?.nombreMouvements ?? 0} mouvements
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <span className="capitalize">
                {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
              </span>
              <span>·</span>
              <span>Trésorerie de l'auto‑école</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <PageBreadcrumb className="hidden lg:flex" />
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoadingGlobal}
            className="h-8 gap-1.5 text-xs"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isLoadingGlobal && 'animate-spin')} />
            Actualiser
          </Button>
          {(isAdmin || isSecretaire) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="h-8 gap-1.5 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              Exporter
            </Button>
          )}
        </div>
      </div>

      {/* Bloc supérieur : statistiques (2/3) + mouvements récents (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2">
          <CaisseStatsCards
            stats={stats!}
            trends={trends || undefined}
            soldeSparkline={sparklines?.soldeSparkline}
            entreesMoisSparkline={sparklines?.entreesSparkline}
            sortiesMoisSparkline={sparklines?.sortiesSparkline}
            isLoading={isLoadingGlobal}
            cols={2}
            onCardClick={(id) => {
              if (id === 'solde-actuel') toast.info('Solde actuel');
              else if (id === 'entrees-mois') toast.info('Filtrer les entrées du mois');
              else if (id === 'sorties-mois') toast.info('Filtrer les sorties du mois');
              else if (id === 'solde-net') toast.info('Solde net du mois');
            }}
            className="h-full"
          />
        </div>
        <div className="lg:col-span-1">
          <CaisseMouvementsRecentCard
            mouvements={mouvements}
            caisseStats={stats!}
            maxItems={5}
            isLoading={isLoadingGlobal}
            className="col-span-12 xl:col-span-7 h-full"
          />
        </div>
      </div>

      {/* Tableau complet des mouvements (pagination interne) */}
      <CaisseTable
        mouvements={mouvements}
        variant={variant}
        enrichments={enrichments}
        actions={{
          onView: handleViewMouvement,
          onPrint: (m) => toast.info(`Impression du justificatif #${m.id} (simulé)`),
        }}
        showDateFilter
        enablePagination
        enableToolbar
        defaultPageSize={20}
        onRefresh={handleRefresh}
        isLoading={isLoadingGlobal}
        title="Historique des mouvements"
        description="Tous les encaissements et décaissements enregistrés"
        asCard
        emptyMessage="Aucun mouvement de caisse trouvé pour cette période."
        className="w-full"
      />
    </div>
  );
}