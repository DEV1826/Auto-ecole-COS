// src/features/paiements/pages/PaiementsListPage.tsx

/**
 * @module features/paiements/pages/PaiementsListPage
 * @description
 * Page principale de la gestion des paiements (encaissements) de l’auto‑école COS.
 * Thème : Émeraude (accent emerald-700).
 *
 * Layout :
 * ─ En-tête : titre, nombre total de transactions, date, bouton d’export, breadcrumb
 * ─ Bloc supérieur : 2 colonnes (2/3 – statistiques, 1/3 – paiements récents)
 * ─ En dessous : tableau complet (`PaiementsTable`) avec filtres, période, pagination
 *
 * Les données sont chargées depuis l’API Electron via le store `usePaiements`.
 * Aucune donnée mockée n’est utilisée. Le tableau gère lui‑même la pagination
 * (il reçoit la liste complète, la pagination est effectuée en interne).
 *
 * @author Stive Junior
 * @version 2.0.0
 */

import * as React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb';
import { PaiementsStatsCards } from '../components/PaiementsStatsCards';
import { PaiementsTable } from '../components/PaiementsTable';
import { PaiementsRecentCard } from '../components/PaiementsRecentCard';
import { useAuth } from '@/hooks/use.auth';
import { usePaiements } from '@/hooks/use.paiements';
import { useNavigate } from 'react-router-dom';
import { PROTECTED_ROUTES, route } from '@/config';
import type { Paiement } from '@/types/paiements.types';
import { getAvatarUrl } from '@/lib';
import { useCandidats } from '@/hooks/use.candidats';
import type { Candidat } from '@/types/candidats.types';

export default function PaiementsListPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isSecretaire = user?.role === 'SECRETAIRE';

  // Store paiements
  const {
    paiements,
    stats,
    trends,
    sparklines,
    getAll,
    getStats,
    getTrends,
    getSparklines,
    printReceipt,
    delete: deletePaiement,

    loading: listLoading,
    statsLoading,
    trendsLoading,
    sparklinesLoading,
  } = usePaiements();

  const {
    getById: getCandidatById,
  } = useCandidats();

  // État local pour l’enrichissement (avatar, nom complet, etc.)
  const [candidatMap, setCandidatMap] = React.useState<Map<number, Candidat>>(new Map());

  // Chargement initial : toutes les paiements (sans pagination)
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

  // Chargement des informations candidats pour enrichir l’affichage
  React.useEffect(() => {
    const loadCandidats = async () => {
      const map = new Map();
      // Récupérer les candidats uniques depuis les paiements
      const candidatIds = [...new Set(paiements.map(p => p.candidatId))];
      for (const id of candidatIds) {
        try {
          const candidat = await getCandidatById(id);
          map.set(id, candidat);
        } catch {
          // fallback
          map.set(id, { id, nom: `Candidat ${id}`, prenom: '' });
        }
      }
      setCandidatMap(map);
    };
    if (paiements.length) loadCandidats();
  }, [getCandidatById, paiements]);

  // Handlers
  const handleRefresh = async () => {
    await getAll();
    await getStats();
    await getTrends();
    await getSparklines();
    toast.success('Données actualisées');
  };

  const handleExport = () => {
    printReceipt(0) // 0 ou un ID spécial pour exporter tous les paiements
      .then(result => {
        if (result.success && result.path) {
          toast.success(`Export généré : ${result.path}`);
          window.open(result.path, '_blank');
        } else {
          toast.error(result.message || 'Erreur lors de l’export');
        }
      })
      .catch(() => {
        toast.error('Erreur lors de l’export');
      });
  };

  const handleAddPaiement = () => {
    navigate(PROTECTED_ROUTES.PAIEMENTS.CREATE);
  };

  const handleViewPaiement = (paiement: Paiement) => {
    navigate(route(PROTECTED_ROUTES.PAIEMENTS.DETAIL(paiement.id), { id: paiement.id }));
  };

  const handlePrintReceipt = async (paiement: Paiement) => {
    try {
      const result = await printReceipt(paiement.id);
      if (result.success && result.path) {
        toast.success(`Reçu généré : ${result.path}`);
        window.open(result.path, '_blank');
      } else {
        toast.error(result.message || 'Erreur lors de la génération du reçu');
      }
    } catch {
      toast.error('Erreur lors de l’impression du reçu');
    }
  };

  const handleDelete = async (paiement: Paiement) => {
    if (window.confirm(`Supprimer définitivement le paiement #${paiement.id} ?`)) {
      try {
        await deletePaiement(paiement.id);
        toast.success('Paiement supprimé');
        await handleRefresh();
      } catch {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  // Actions du tableau
  const actions = {
    onView: handleViewPaiement,
    onDelete: isAdmin ? handleDelete : undefined,
    onPrintReceipt: handlePrintReceipt,
    onViewFacture: (p: Paiement) => {
      if (p.factureId) navigate(route(PROTECTED_ROUTES.FACTURES.DETAIL(p.factureId), { id: p.factureId }));
      else toast.info('Aucune facture associée');
    },
  };

  // Enrichissements pour le tableau
  const enrichments = {
    getCandidatNomComplet: (p: Paiement) => {
      const c = candidatMap.get(p.candidatId);
      return c ? `${c.prenom} ${c.nom}` : `Candidat ${p.candidatId}`;
    },
    getCandidatEmail: (p: Paiement) => candidatMap.get(p.candidatId)?.email ?? '',
    getCandidatTelephone: (p: Paiement) => candidatMap.get(p.candidatId)?.telephone ?? '',
    getCandidatAvatarUrl: (p: Paiement) => {
      const c = candidatMap.get(p.candidatId);
      return c ? getAvatarUrl(`${c.prenom} ${c.nom}`) : '';
    },
    getCandidatInitials: (p: Paiement) => {
      const c = candidatMap.get(p.candidatId);
      return c ? `${c.prenom?.[0] || ''}${c.nom?.[0] || ''}`.toUpperCase() : `C${p.candidatId}`;
    },
    getFactureNumero: (p: Paiement) => p.facture?.numero || '',
  };

  const variant = isAdmin ? 'admin' : 'secretaire';
  const isLoading = listLoading || statsLoading || trendsLoading || sparklinesLoading;

  // Préparation des 6 derniers paiements pour la carte récente
  const recentPaiements = React.useMemo(() => {
    return [...paiements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);
  }, [paiements]);

  return (
    <div className="space-y-6 p-4 md:p-1 pb-10">
      {/* En‑tête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-12 rounded-md bg-emerald-700 text-white shadow-sm shrink-0">
            <Receipt className="size-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Paiements</h1>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <span className="capitalize">
                {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
              </span>
              <span>·</span>
              <Badge
                variant="outline"
                className="text-[10px] h-4 px-1.5 border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
              >
                {paiements.length} transactions
              </Badge>
            </p>
          </div>
        </div>
        <PageBreadcrumb className="hidden lg:flex" />
      </div>

      {/* Bloc supérieur : statistiques (2/3) + paiements récents (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <PaiementsStatsCards
            stats={stats!}
            trends={trends || undefined}
            totalEncaissementsSparkline={sparklines?.totalEncaissementsSparkline}
            nombreTransactionsSparkline={sparklines?.nombreTransactionsSparkline}
            encaissementsMoisSparkline={sparklines?.encaissementsMoisSparkline}
            montantMoyenSparkline={sparklines?.montantMoyenSparkline}
            isLoading={isLoading}
            onCardClick={(id) => {
              if (id === 'total-encaissements') toast.info('Total des encaissements');
              else if (id === 'nombre-transactions') toast.info('Nombre de transactions');
              else if (id === 'encaissements-mois') toast.info('Encaissements du mois');
              else if (id === 'montant-moyen') toast.info('Montant moyen par transaction');
            }}
            className="h-full"
          />
        </div>
        <div className="lg:col-span-1">
          <PaiementsRecentCard
            paiements={recentPaiements}
            maxItems={5}
            isLoading={isLoading}
            onViewPaiement={handleViewPaiement}
            className="h-full"
          />
        </div>
      </div>

      {/* Tableau complet des paiements (pagination interne) */}
      <PaiementsTable
        paiements={paiements}
        variant={variant}
        enrichments={enrichments}
        actions={actions}
        defaultPeriodFilter="all"
        showPeriodFilter
        enablePagination
        enableToolbar
        defaultPageSize={20}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        title="Historique des paiements"
        description="Liste de tous les encaissements (espèces, chèque, virement, carte, mobile money)"
        onAddClick={(isAdmin || isSecretaire) ? handleAddPaiement : undefined}
        onExport={handleExport}
        asCard
        className="w-full"
        emptyMessage="Aucun paiement trouvé."
      />
    </div>
  );
}