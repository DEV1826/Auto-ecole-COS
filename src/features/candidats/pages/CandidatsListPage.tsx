// src/features/candidats/pages/CandidatsListPage.tsx

/**
 * @module features/candidats/pages/CandidatsListPage
 * @description
 * Page principale de gestion des candidats (élèves) de l’auto‑école COS.
 * Thème : Bleu (accent blue-700).
 *
 * ## Architecture
 * ```
 * ┌─────────────────────────────────────────────────────────────┐
 * │  En-tête : icône, titre, date, badge total, breadcrumb      │
 * │  Actions  : Actualiser · Exporter · Ajouter                 │
 * ├─────────────────────────────────────────────────────────────┤
 * │  CandidatsStatsCards (grille 4 cartes avec sparklines)      │
 * ├─────────────────────────────────────────────────────────────┤
 * │  CandidatsTable (full-width, pagination, toolbar, filtres,  │
 * │  actions contextuelles, enrichissements dynamiques)         │
 * └─────────────────────────────────────────────────────────────┘
 * ```
 *
 * Les données sont chargées depuis l’API Electron via le store `useCandidats`.
 * Les enrichissements (solde, nombre de leçons, examens) sont calculés à partir
 * des stores `usePaiements`, `usePlanning`, `useExamens`.
 *
 * @author Stive Junior
 * @version 3.0.0
 *
 * @example
 * ```tsx
 * <Route path="/candidats" element={<CandidatsListPage />} />
 * ```
 */

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Users, PlusCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorDialog } from '@/components/ui/error-dialog';
import { useAuth } from '@/hooks/use.auth';
import { useCandidats } from '@/hooks/use.candidats';
import { usePaiements } from '@/hooks/use.paiements';
import { usePlanning } from '@/hooks/use.planning';
import { useExamens } from '@/hooks/use.examens';
import { CandidatsStatsCards, type CandidatsSparklineData } from '../components/CandidatsStatsCards';
import { CandidatsTable } from '../components/CandidatsTable';
import { PROTECTED_ROUTES, route } from '@/config/routes';
import type { Candidat } from '@/types/candidats.types';

// ============================================================
// Types pour les enrichissements (solde, leçons, examens)
// ============================================================

interface EnrichmentsData {
  soldeMap: Map<number, number>;
  leconsCountMap: Map<number, number>;
  examensCountMap: Map<number, number>;
}

// ============================================================
// Page principale
// ============================================================

/**
 * Page de liste des candidats.
 * Charge les données réelles depuis l’API, affiche les cartes de stats
 * et le tableau paginé avec toutes les actions.
 */
export default function CandidatsListPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role;
  const isAdmin = role === 'ADMIN';
  const isSecretaire = role === 'SECRETAIRE';

  // Stores principaux
  const {
    candidats,
    pagination,
    stats,
    trends,
    loading: candidatsLoading,
    getAll,
    getStats,
    getTrends,
    delete: deleteCandidat,
  } = useCandidats();

  // Stores pour enrichissements
  const { getSoldeCandidat } = usePaiements();
  const { getByCandidat: getLeconsByCandidat } = usePlanning();
  const { getByCandidat: getExamensByCandidat } = useExamens();

  // États locaux
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [enrichments, setEnrichments] = React.useState<EnrichmentsData>({
    soldeMap: new Map(),
    leconsCountMap: new Map(),
    examensCountMap: new Map(),
  });
  const [errorDialog, setErrorDialog] = React.useState<{
    open: boolean;
    title?: string;
    message: string;
    details?: string[];
  }>({ open: false, message: '' });

  // Chargement initial des données (candidats + stats + tendances)
  React.useEffect(() => {
    const loadInitialData = async () => {
      try {
        await Promise.all([
          getAll(),
          getStats(),
          getTrends(),
        ]);
      } catch (err) {
        console.error('Erreur chargement initial:', err);
        setErrorDialog({
          open: true,
          title: 'Erreur de chargement',
          message: 'Impossible de charger les données des candidats. Veuillez réessayer.',
        });
      }
    };
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Chargement des enrichissements (solde, leçons, examens) pour chaque candidat
  React.useEffect(() => {
    if (candidats.length === 0) return;

    const loadEnrichments = async () => {
      const soldeMap = new Map<number, number>();
      const leconsCountMap = new Map<number, number>();
      const examensCountMap = new Map<number, number>();

      await Promise.all(
        candidats.map(async (candidat) => {
          try {
            // Solde (via paiements/factures)
            const soldeData = await getSoldeCandidat(candidat.id);
            soldeMap.set(candidat.id, soldeData.solde);

            // Nombre de leçons
            const lecons = await getLeconsByCandidat(candidat.id);
            leconsCountMap.set(candidat.id, lecons.length);

            // Nombre d'examens
            const examens = await getExamensByCandidat(candidat.id);
            examensCountMap.set(candidat.id, examens.length);
          } catch (err) {
            console.error(`Erreur enrichissements pour candidat ${candidat.id}:`, err);
            // Valeurs par défaut en cas d'erreur
            if (!soldeMap.has(candidat.id)) soldeMap.set(candidat.id, 0);
            if (!leconsCountMap.has(candidat.id)) leconsCountMap.set(candidat.id, 0);
            if (!examensCountMap.has(candidat.id)) examensCountMap.set(candidat.id, 0);
          }
        })
      );

      setEnrichments({ soldeMap, leconsCountMap, examensCountMap });
    };

    loadEnrichments();
  }, [candidats, getSoldeCandidat, getLeconsByCandidat, getExamensByCandidat]);

  // Rafraîchissement manuel (toutes les données)
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        getAll({ page: pagination.page, limit: pagination.limit }),
        getStats(),
        getTrends(),
      ]);
      toast.success('Données actualisées');
    } catch {
      toast.error('Erreur lors du rafraîchissement');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = () => {
    // Export CSV ou Excel (simulé pour l’exemple)
    toast.info('Fonction d’export à implémenter');
  };

  const handleAddCandidat = () => {
    navigate(PROTECTED_ROUTES.CANDIDATS.CREATE);
  };

  // Actions sur chaque ligne du tableau
  const handleView = (candidat: Candidat) => {
    navigate(route(PROTECTED_ROUTES.CANDIDATS.DETAIL(candidat.id), { id: candidat.id }));
  };

  const handleEdit = (candidat: Candidat) => {
    navigate(route(PROTECTED_ROUTES.CANDIDATS.EDIT(candidat.id), { id: candidat.id }));
  };

  const handleDelete = async (candidat: Candidat) => {
    if (window.confirm(`Supprimer définitivement le candidat ${candidat.prenom} ${candidat.nom} ?`)) {
      try {
        await deleteCandidat(candidat.id);
        toast.success('Candidat supprimé');
        await handleRefresh();
      } catch {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleAddPayment = (candidat: Candidat) => {
    navigate(route(PROTECTED_ROUTES.PAIEMENTS.CREATE, { candidatId: candidat.id }));
  };

  const handleAddLesson = (candidat: Candidat) => {
    navigate(route(PROTECTED_ROUTES.PLANNING.CREATE, { candidatId: candidat.id }));
  };

  const handleRegisterExam = (candidat: Candidat) => {
    navigate(route(PROTECTED_ROUTES.EXAMENS.CREATE, { candidatId: candidat.id }));
  };

  const handleViewDocuments = (candidat: Candidat) => {
    navigate(route(PROTECTED_ROUTES.CANDIDATS.DOCUMENTS(candidat.id), { id: candidat.id }));
  };

  // Actions du tableau (props pour CandidatsTable)
  const tableActions = {
    onView: handleView,
    onEdit: isAdmin || isSecretaire ? handleEdit : undefined,
    onDelete: isAdmin ? handleDelete : undefined,
    onAddPayment: isAdmin || isSecretaire ? handleAddPayment : undefined,
    onAddLesson: isAdmin || isSecretaire ? handleAddLesson : undefined,
    onRegisterExam: isAdmin || isSecretaire ? handleRegisterExam : undefined,
    onViewDocuments: isAdmin || isSecretaire ? handleViewDocuments : undefined,
  };

  // Enrichissements pour le tableau (solde, nb leçons, nb examens)
  const tableEnrichments = {
    getSolde: (candidat: Candidat) => enrichments.soldeMap.get(candidat.id) ?? 0,
    getLeconsCount: (candidat: Candidat) => enrichments.leconsCountMap.get(candidat.id) ?? 0,
    getExamensCount: (candidat: Candidat) => enrichments.examensCountMap.get(candidat.id) ?? 0,
  };

  // Variante selon le rôle
  const variant = isAdmin ? 'admin' : isSecretaire ? 'secretaire' : 'moniteur';

  // Sparklines factices (à remplacer par des données réelles via getSparklines)
  // Pour l’exemple, on génère des séries vides – dans la vraie vie, on appellerait getSparklines().
  const mockSparklines: Record<string, CandidatsSparklineData> = {
    totalSparkline: { values: [], labels: [] },
    actifsSparkline: { values: [], labels: [] },
    tauxReussiteSparkline: { values: [], labels: [] },
    recusSparkline: { values: [], labels: [] },
  };

  const isLoading = candidatsLoading || isRefreshing;

  if (candidatsLoading && candidats.length === 0) {
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

  if (!stats && !candidatsLoading) {
    return (
      <ErrorDialog
        open={true}
        onOpenChange={() => { }}
        title="Données indisponibles"
        message="Impossible de charger les statistiques des candidats. Veuillez réessayer plus tard."
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
            <Users className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight">Candidats</h1>
              <Badge
                variant="outline"
                className="text-[10px] h-5 px-1.5 border-0 bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-semibold"
              >
                {pagination.total} inscrit{pagination.total > 1 ? 's' : ''}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <span className="capitalize">
                {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
              </span>
              <span>·</span>
              <span>Gestion des élèves de l'auto‑école</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleRefresh} className="h-8 gap-1 text-xs">
            <RefreshCw className="h-3.5 w-3.5" />
            Actualiser
          </Button>

          {(isAdmin || isSecretaire) && (
            <Button size="sm" onClick={handleAddCandidat} className="h-8 gap-1 text-xs bg-blue-700 hover:bg-blue-800">
              <PlusCircle className="h-3.5 w-3.5" />
              Ajouter
            </Button>
          )}
          <PageBreadcrumb className="hidden lg:flex" />
        </div>
      </div>

      {/* Cartes statistiques */}
      {stats && (
        <CandidatsStatsCards
          stats={stats}
          trends={trends ?? {}}
          totalSparkline={mockSparklines.totalSparkline}
          actifsSparkline={mockSparklines.actifsSparkline}
          tauxReussiteSparkline={mockSparklines.tauxReussiteSparkline}
          recusSparkline={mockSparklines.recusSparkline}
          isLoading={isLoading}
          onCardClick={(cardId) => {
            // Navigation rapide selon la carte cliquée
            if (cardId === 'total-candidats') {
              getAll({});
            } else if (cardId === 'actifs-candidats') {
              getAll({ statut: 'EN_COURS' });
            } else if (cardId === 'recus-candidats') {
              getAll({ statut: 'RECU' });
            } else if (cardId === 'taux-reussite') {
              toast.info('Taux de réussite global');
            }
          }}
        />
      )}

      {/* Tableau des candidats */}
      <CandidatsTable
        candidats={candidats}
        variant={variant}
        actions={tableActions}
        enrichments={tableEnrichments}
        enablePagination
        enableToolbar
        defaultPageSize={pagination.limit}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        title="Liste des candidats"
        description="Consultez et gérez l’ensemble des élèves inscrits"

        onAddClick={handleAddCandidat}
        onExport={handleExport}
        showViewAll={false}
        asCard
        emptyMessage="Aucun candidat trouvé pour cette période."
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