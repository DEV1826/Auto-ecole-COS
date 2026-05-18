/* eslint-disable react-hooks/set-state-in-effect */
// src/features/factures/pages/FacturesListPage.tsx

/**
 * @module features/factures/pages/FacturesListPage
 * @description
 * Page principale de gestion des factures de l’auto‑école COS.
 * Thème : Bleu (accent blue-700).
 *
 * ## Architecture
 * ```
 * ┌─────────────────────────────────────────────────────────────┐
 * │  En-tête : icône, titre, date, badge total, breadcrumb      │
 * │  Actions  : Actualiser · Exporter · Ajouter                 │
 * ├─────────────────────────────────────────────────────────────┤
 * │  FacturesStatsCards (grille 4 cartes avec sparklines)       │
 * ├─────────────────────────────────────────────────────────────┤
 * │  FacturesTable (full-width, pagination, toolbar, filtres,   │
 * │  actions contextuelles, enrichissements dynamiques)         │
 * └─────────────────────────────────────────────────────────────┘
 * ```
 *
 * Les données sont chargées depuis l’API Electron via le store `useFactures`.
 * Les enrichissements (nom candidat, avatar, montant payé) sont calculés via `useCandidats` et `usePaiements`.
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @example
 * ```tsx
 * <Route path="/factures" element={<FacturesListPage />} />
 * ```
 */

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FileText, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorDialog } from '@/components/ui/error-dialog';
import { useAuth } from '@/hooks/use.auth';
import { useFactures } from '@/hooks/use.factures';
import { useCandidats } from '@/hooks/use.candidats';
import { FacturesStatsCards, type FacturesSparklineData } from '../components/FacturesStatsCards';
import { FacturesTable } from '../components/FacturesTable';
import { PROTECTED_ROUTES, route } from '@/config/routes';
import type { Facture } from '@/types/factures.types';
import type { Candidat } from '@/types/candidats.types';
import { getAvatarUrl } from '@/lib/utils';

// ============================================================
// Types pour les enrichissements (montant payé)
// ============================================================

interface EnrichmentsData {
  montantPayeMap: Map<number, number>;
}

// ============================================================
// Page principale
// ============================================================

/**
 * Page de liste des factures.
 * Charge les données réelles depuis l’API, affiche les cartes de stats
 * et le tableau paginé avec toutes les actions.
 */
export default function FacturesListPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role;
  const isAdmin = role === 'ADMIN';
  const isSecretaire = role === 'SECRETAIRE';

  // Stores principaux
  const {
    factures,
    pagination,
    stats,
    trends,
    sparklines,
    loading: facturesLoading,
    getAll,
    getStats,
    getTrends,
    getSparklines,
    delete: deleteFacture,
    getPaiementsByFacture,
    generatePDF,
    sendByEmail,
  } = useFactures();

  const { candidats, getAll: getAllCandidats, loading: candidatsLoading } = useCandidats();


  // États locaux
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [enrichments, setEnrichments] = React.useState<EnrichmentsData>({
    montantPayeMap: new Map(),
  });
  const [candidatsMap, setCandidatsMap] = React.useState<Map<number, Candidat>>(new Map());
  const [errorDialog, setErrorDialog] = React.useState<{
    open: boolean;
    title?: string;
    message: string;
    details?: string[];
  }>({ open: false, message: '' });

  // Chargement initial des données
  React.useEffect(() => {
    const loadInitialData = async () => {
      try {
        await Promise.all([
          getAll({ limit: 20 }),      // première page, 20 éléments
          getStats(),
          getTrends(),
          getSparklines(),
          getAllCandidats({ limit: 200 }), // pour les enrichissements
        ]);
      } catch (err) {
        console.error('Erreur chargement initial:', err);
        setErrorDialog({
          open: true,
          title: 'Erreur de chargement',
          message: 'Impossible de charger les données des factures. Veuillez réessayer.',
        });
      }
    };
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Construire un Map candidatId → Candidat
  React.useEffect(() => {
    const map = new Map<number, Candidat>();
    candidats.forEach((c) => map.set(c.id, c));
    setCandidatsMap(map);
  }, [candidats]);

  // Chargement des montants payés pour chaque facture
  React.useEffect(() => {
    if (factures.length === 0) return;

    const loadMontantPaye = async () => {
      const map = new Map<number, number>();
      await Promise.all(
        factures.map(async (facture) => {
          try {
            const paiements = await getPaiementsByFacture(facture.id);
            const totalPaye = paiements.reduce((sum, p) => sum + p.montant, 0);
            map.set(facture.id, totalPaye);
          } catch (err) {
            console.error(`Erreur chargement paiements facture ${facture.id}:`, err);
            map.set(facture.id, 0);
          }
        })
      );
      setEnrichments({ montantPayeMap: map });
    };

    loadMontantPaye();
  }, [factures, getPaiementsByFacture]);

  // Rafraîchissement manuel
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        getAll({}),
        getStats(),
        getTrends(),
        getSparklines(),
        getAllCandidats(),
      ]);
      toast.success('Données actualisées');
    } catch (err) {
      toast.error('Erreur lors du rafraîchissement', {
        description: 'Veuillez réessayer de rafraîchir les données.',
      });
      console.error('Erreur lors du rafraîchissement:', err);
      setErrorDialog({
        open: true,
        title: 'Erreur de rafraîchissement',
        message: 'Impossible de rafraîchir les données des factures. Veuillez réessayer.',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = () => {
    toast.info('Fonction d’export à implémenter');
  };

  const handleAddFacture = () => {
    navigate(PROTECTED_ROUTES.FACTURES.CREATE);
  };

  // Actions sur chaque ligne du tableau
  const handleView = (facture: Facture) => {
    navigate(route(PROTECTED_ROUTES.FACTURES.DETAIL(facture.id), { id: facture.id }));
  };

  const handleEdit = (facture: Facture) => {
    navigate(route(PROTECTED_ROUTES.FACTURES.EDIT(facture.id), { id: facture.id }));
  };

  const handleDelete = async (facture: Facture) => {
    if (window.confirm(`Supprimer définitivement la facture ${facture.numero} ?`)) {
      try {
        await deleteFacture(facture.id);
        toast.success('Facture supprimée');
        await handleRefresh();
      } catch {
        toast.error('Erreur lors de la suppression', {
          description: 'Veuillez réessayer de supprimer la facture.',
        });
      }
    }
  };

  const handleDownloadPDF = async (facture: Facture) => {
    try {
      const result = await generatePDF(facture.id);
      if (result.success && result.path) {
        toast.success(`PDF généré : ${result.path}`);
        window.open(result.path, '_blank');
      } else {
        toast.error(result.message || 'Erreur lors de la génération du PDF');
      }
    } catch {
      toast.error('Erreur lors du téléchargement');
    }
  };

  const handleAddPayment = (facture: Facture) => {
    navigate(route(PROTECTED_ROUTES.PAIEMENTS.CREATE, { factureId: facture.id, candidatId: facture.candidatId }));
  };

  const handleViewPayments = (facture: Facture) => {
    navigate(route(PROTECTED_ROUTES.PAIEMENTS.LIST, { factureId: facture.id }));
  };

  const handleSendByEmail = async (facture: Facture) => {
    try {
      const result = await sendByEmail(facture.id);
      if (result.success) {
        toast.success(`Facture envoyée par email à ${facture.candidat?.email || 'le candidat'}`);
      } else {
        toast.error(result.message || "Erreur lors de l'envoi");
      }
    } catch {
      toast.error('Erreur lors de l’envoi par email');
    }
  };

  // Actions du tableau
  const tableActions = {
    onView: handleView,
    onEdit: isAdmin || isSecretaire ? handleEdit : undefined,
    onDelete: isAdmin ? handleDelete : undefined,
    onDownloadPDF: handleDownloadPDF,
    onAddPayment: isAdmin || isSecretaire ? handleAddPayment : undefined,
    onViewPayments: isAdmin || isSecretaire ? handleViewPayments : undefined,
    onSendByEmail: isAdmin ? handleSendByEmail : undefined,
  };

  // Enrichissements pour le tableau (candidat, montant payé)
  const tableEnrichments = {
    getCandidatNomComplet: (facture: Facture) => {
      const c = candidatsMap.get(facture.candidatId);
      return c ? `${c.prenom} ${c.nom}` : `Candidat ${facture.candidatId}`;
    },
    getCandidatEmail: (facture: Facture) => {
      const c = candidatsMap.get(facture.candidatId);
      return c?.email ?? '—';
    },
    getCandidatTelephone: (facture: Facture) => {
      const c = candidatsMap.get(facture.candidatId);
      return c?.telephone ?? '—';
    },
    getCandidatAvatarUrl: (facture: Facture) => {
      const c = candidatsMap.get(facture.candidatId);
      return c ? getAvatarUrl(`${c.prenom} ${c.nom}`) : getAvatarUrl('Inconnu');
    },
    getCandidatInitials: (facture: Facture) => {
      const c = candidatsMap.get(facture.candidatId);
      return c ? `${c.prenom?.[0] ?? ''}${c.nom?.[0] ?? ''}`.toUpperCase() : `C${facture.candidatId}`;
    },
    getMontantPaye: (facture: Facture) => enrichments.montantPayeMap.get(facture.id) ?? 0,

    getResteAPayer: (facture: Facture) => {
      const montantTotal = facture.montantTotal;
      const montantPaye = enrichments.montantPayeMap.get(facture.id) ?? 0;
      return Math.max(0, montantTotal - montantPaye);
    }

  };

  const variant = isAdmin ? 'admin' : 'secretaire';

  // Sparklines (données réelles du store)
  const sparklinesData: {
    totalFacturesSparkline?: FacturesSparklineData;
    montantTotalSparkline?: FacturesSparklineData;
    montantImpayeSparkline?: FacturesSparklineData;
    paiementsRecusSparkline?: FacturesSparklineData;
  } = {
    totalFacturesSparkline: sparklines?.totalFacturesSparkline,
    montantTotalSparkline: sparklines?.montantTotalSparkline,
    montantImpayeSparkline: sparklines?.montantImpayeSparkline,
    paiementsRecusSparkline: sparklines?.paiementsRecusSparkline,
  };

  const isLoading = facturesLoading || candidatsLoading || isRefreshing;

  // État de chargement initial
  if (facturesLoading && factures.length === 0) {
    return (
      <div className="space-y-5 p-4 md:p-1 pb-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-md" />
            <div>
              <Skeleton className="h-6 w-48 mb-1" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
        <Skeleton className="h-40 w-full rounded-md" />
        <Skeleton className="h-96 w-full rounded-md" />
      </div>
    );
  }

  if (!stats && !facturesLoading) {
    return (
      <ErrorDialog
        open={true}
        onOpenChange={() => { }}
        title="Données indisponibles"
        message="Impossible de charger les statistiques des factures. Veuillez réessayer plus tard."
        closeText="Recharger"
        onAction={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-1 pb-12">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-12 rounded-md bg-blue-700 text-white shadow-sm shrink-0">
            <FileText className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight">Factures</h1>
              <Badge
                variant="outline"
                className="text-[10px] h-5 px-1.5 border-0 bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-semibold"
              >
                {pagination.total} facture{pagination.total > 1 ? 's' : ''}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <span className="capitalize">
                {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
              </span>
              <span>·</span>
              <span>Gestion des factures émises aux candidats</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleRefresh} className="h-8 gap-1 text-xs">
            <RefreshCw className="h-3.5 w-3.5" />
            Actualiser
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="h-8 gap-1 text-xs">
            <Download className="h-3.5 w-3.5" />
            Exporter
          </Button>

          <PageBreadcrumb className="hidden lg:flex" />
        </div>
      </div>

      {/* Cartes statistiques */}
      {stats && (
        <FacturesStatsCards
          stats={stats}
          trends={trends ?? {}}
          totalFacturesSparkline={sparklinesData.totalFacturesSparkline}
          montantTotalSparkline={sparklinesData.montantTotalSparkline}
          montantImpayeSparkline={sparklinesData.montantImpayeSparkline}
          paiementsRecusSparkline={sparklinesData.paiementsRecusSparkline}
          isLoading={isLoading}
          onCardClick={(cardId) => {
            if (cardId === 'total-factures') toast.info('Voir toutes les factures');
            else if (cardId === 'montant-total') toast.info('Montant total facturé');
            else if (cardId === 'montant-impaye') toast.info('Montant restant dû');
            else if (cardId === 'paiements-recus') toast.info('Total des paiements reçus');
          }}
          className="w-full"
        />
      )}

      {/* Tableau des factures */}
      <FacturesTable
        stats={stats!}
        factures={factures}
        variant={variant}
        actions={tableActions}
        enrichments={tableEnrichments}
        enablePagination
        enableToolbar
        showPeriodFilter
        defaultPeriodFilter="all"
        defaultPageSize={pagination.limit}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        title="Factures émises"
        description="Consultez et gérez l’ensemble des factures des candidats"
        showAddButton={isAdmin || isSecretaire}
        onAddClick={handleAddFacture}
        showViewAll={false}
        asCard
        emptyMessage="Aucune facture trouvée pour cette période."
        className="w-full"
      />

      {/* Dialogue d’erreur global */}
      <ErrorDialog
        open={errorDialog.open}
        onOpenChange={(open) => setErrorDialog((prev) => ({ ...prev, open }))}
        title={errorDialog.title}
        message={errorDialog.message}
        details={errorDialog.details}
        closeText="Fermer"
      />
    </div>
  );
}