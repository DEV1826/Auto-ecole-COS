// src/features/candidats/pages/CandidatsListPage.tsx

/**
 * @module features/candidats/pages/CandidatsListPage
 * @description
 * Page principale de la liste des candidats (élèves) de l’auto‑école COS.
 * Thème : Bleu (accent blue-700).
 *
 * Layout :
 * ─ En-tête : titre, nombre total de candidats, date, bouton d’ajout, breadcrumb
 * ─ Bloc statistiques (`CandidatsStatsCards`) — repliable
 * ─ Tableau complet (`CandidatsTable`) avec filtres, pagination, actions
 *
 * Les données sont chargées depuis l’API Electron via le store `useCandidats`.
 * La pagination, les filtres et les statistiques sont gérés par le store.
 * Les colonnes "solde", "leçons" et "examens" sont enrichies via les relations
 * du candidat (appels `getPaiements`, `getLecons`, `getExamens`).
 *
 * @author Stive Junior
 * @version 3.0.0
 */

import * as React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Users, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { CandidatsStatsCards } from '../components/CandidatsStatsCards';
import { CandidatsTable } from '../components/CandidatsTable';
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb';
import { useAuth } from '@/hooks/use.auth';
import { useCandidats } from '@/hooks/use.candidats';
import type { Candidat, CandidatsListParams } from '@/types/candidats.types';
import { useNavigate } from 'react-router-dom';
import { PROTECTED_ROUTES, route } from '@/config';

// ============================================================
// Types internes pour l'enrichissement
// ============================================================

interface EnrichedCandidat extends Candidat {
  solde: number;
  leconsCount: number;
  examensCount: number;
}

// ============================================================
// Page principale
// ============================================================

export default function CandidatsListPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role;
  const isAdmin = role === 'ADMIN';
  const isSecretaire = role === 'SECRETAIRE';

  // Store candidats
  const {
    candidats,
    pagination,
    loading,
    error,
    stats,
    statsLoading,
    getAll,
    getStats,
    delete: deleteCandidat,
    getPaiements,
    getLecons,
    getExamens,
  } = useCandidats();

  // État local pour les filtres
  const [filters, setFilters] = React.useState<Omit<CandidatsListParams, 'page' | 'limit'>>({
    search: '',
    statut: undefined,
    categorie: undefined,
    dateDebut: undefined,
    dateFin: undefined,
  });

  // Pagination
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(10);

  // État pour l'affichage des stats (repliable)
  const [statsOpen, setStatsOpen] = React.useState(true);

  // Cache pour les enrichissements (évite de recharger les données à chaque rendu)
  const [enrichedMap, setEnrichedMap] = React.useState<Map<number, Omit<EnrichedCandidat, keyof Candidat>>>(new Map());

  // Liste finale enrichie
  const enrichedCandidats: EnrichedCandidat[] = React.useMemo(() => {
    return candidats.map((c) => {
      const enrichment = enrichedMap.get(c.id) || { solde: 0, leconsCount: 0, examensCount: 0 };
      return { ...c, ...enrichment };
    });
  }, [candidats, enrichedMap]);

  // Fonction pour charger les données (déclarée avant son utilisation dans useEffect)
  const loadData = React.useCallback(async () => {
    try {
      await getAll({ page, limit, ...filters });
      await getStats();
    } catch {
      toast.error(error || 'Erreur lors du chargement des données');
    }
  }, [getAll, getStats, error, page, limit, filters]);

  // Chargement initial de la liste et des stats
  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Chargement des enrichissements (solde, leçons, examens) pour les candidats affichés
  React.useEffect(() => {
    const loadEnrichments = async () => {
      // Ne rien faire si la liste est vide ou en cours de chargement
      if (candidats.length === 0 || loading) return;

      // Pour chaque candidat, charger ses relations si pas déjà en cache
      const newEnrichedMap = new Map(enrichedMap);
      let hasChanges = false;

      await Promise.all(
        candidats.map(async (candidat) => {
          if (enrichedMap.has(candidat.id)) return;

          try {
            // Récupérer les paiements, leçons et examens en parallèle
            const [paiements, lecons, examens] = await Promise.all([
              getPaiements(candidat.id),
              getLecons(candidat.id),
              getExamens(candidat.id),
            ]);

            // Calculer le solde (total des paiements reçus)
            // Ici, on suppose que le solde est le montant total des paiements.
            // Si vous avez un champ "montantRestant" dans le candidat, adaptez.
            const totalPaiements = paiements.reduce((sum, p) => sum + p.montant, 0);
            // Si vous avez des factures, vous pouvez calculer le montant dû différemment.
            // Pour l'exemple, on utilise simplement le total des paiements comme solde.
            // À adapter selon votre logique métier.
            const solde = totalPaiements; // ou bien montantTotalFormation - totalPaiements

            const leconsCount = lecons.filter((l) => l.statut === 'EFFECTUEE').length;
            const examensCount = examens.length;

            newEnrichedMap.set(candidat.id, { solde, leconsCount, examensCount });
            hasChanges = true;
          } catch (err) {
            console.error(`Erreur chargement enrichissements pour candidat ${candidat.id}`, err);
            // En cas d'erreur, on met des valeurs par défaut pour ne pas bloquer l'affichage
            newEnrichedMap.set(candidat.id, { solde: 0, leconsCount: 0, examensCount: 0 });
            hasChanges = true;
          }
        })
      );

      if (hasChanges) {
        setEnrichedMap(newEnrichedMap);
      }
    };

    loadEnrichments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidats, loading]);

  // Déterminer la variante du tableau selon le rôle
  const getVariant = (): 'admin' | 'secretaire' | 'moniteur' => {
    if (isAdmin) return 'admin';
    if (isSecretaire) return 'secretaire';
    return 'moniteur';
  };

  // Handlers
  const handleRefresh = async () => {
    // Réinitialiser le cache pour forcer un rechargement des enrichissements
    setEnrichedMap(new Map());
    await loadData();
    toast.success('Candidats actualisés');
  };

  const handleAddCandidat = () => {
    navigate(PROTECTED_ROUTES.CANDIDATS.CREATE);
  };

  const handleView = (candidat: Candidat) => {
    navigate(route(PROTECTED_ROUTES.CANDIDATS.DETAIL(candidat.id), { id: candidat.id }));
  };

  const handleEdit = (candidat: Candidat) => {
    navigate(route(PROTECTED_ROUTES.CANDIDATS.EDIT(candidat.id), { id: candidat.id }));
  };

  const handleDelete = async (candidat: Candidat) => {
    if (window.confirm(`Supprimer définitivement ${candidat.prenom} ${candidat.nom} ?`)) {
      try {
        await deleteCandidat(candidat.id);
        // Nettoyer le cache
        setEnrichedMap((prev) => {
          const newMap = new Map(prev);
          newMap.delete(candidat.id);
          return newMap;
        });
        toast.success('Candidat supprimé');
        await loadData();
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

  // Actions du tableau
  const actions = {
    onView: handleView,
    onEdit: isAdmin || isSecretaire ? handleEdit : undefined,
    onDelete: isAdmin ? handleDelete : undefined,
    onAddPayment: isAdmin || isSecretaire ? handleAddPayment : undefined,
    onAddLesson: handleAddLesson,
    onRegisterExam: handleRegisterExam,
    onViewDocuments: handleViewDocuments,
  };

  // Configuration des colonnes : toutes les colonnes sont activées
  const columnConfig = {
    showFullName: true,
    showEmail: true,
    showPhone: true,
    showDateInscription: true,
    showCategorie: true,
    showStatut: true,
    showSolde: true,
    showLeconsCount: true,
    showExamensCount: true,
    showActions: true,
  };

  // Enrichissements : fonctions qui lisent les valeurs calculées dans l'objet enrichi
  const enrichments = {
    getSolde: (candidat: Candidat) => {
      const enriched = enrichedCandidats.find((ec) => ec.id === candidat.id);
      return enriched?.solde ?? 0;
    },
    getLeconsCount: (candidat: Candidat) => {
      const enriched = enrichedCandidats.find((ec) => ec.id === candidat.id);
      return enriched?.leconsCount ?? 0;
    },
    getExamensCount: (candidat: Candidat) => {
      const enriched = enrichedCandidats.find((ec) => ec.id === candidat.id);
      return enriched?.examensCount ?? 0;
    },
  };

  return (
    <div className="space-y-5 p-4 md:p-1 pb-10">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-12 rounded-md bg-blue-700 text-white shadow-sm shrink-0">
            <Users className="size-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Candidats</h1>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <span className="capitalize">
                {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
              </span>
              <span>·</span>
              <Badge
                variant="outline"
                className="text-[10px] h-4 px-1.5 border-0 bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
              >
                {pagination.total} candidats
              </Badge>
            </p>
          </div>
        </div>
        <PageBreadcrumb className="hidden lg:flex" />
      </div>

      {/* Statistiques repliables */}
      <div className="space-y-2">
        <button
          onClick={() => setStatsOpen((o) => !o)}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <BarChart3 className="h-4 w-4 text-blue-700" />
          Statistiques globales
          {statsOpen ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
        {statsOpen && stats && (
          <CandidatsStatsCards
            stats={{
              total: stats.total,
              actifs: stats.actifs,
              reçus: stats.reçus,
              echecs: stats.echecs,
              tauxReussite: stats.tauxReussite,
            }}
            trends={undefined}
            totalSparkline={undefined}
            actifsSparkline={undefined}
            recusSparkline={undefined}
            isLoading={statsLoading}
            cols={4}
            onCardClick={(id) => {
              if (id === 'total-candidats') {
                setFilters((prev) => ({ ...prev, search: '', statut: undefined }));
                setPage(1);
              } else if (id === 'actifs-candidats') {
                setFilters((prev) => ({ ...prev, statut: 'EN_COURS' }));
                setPage(1);
              } else if (id === 'taux-reussite') {
                toast.info('Statistiques de réussite');
              } else if (id === 'recus-candidats') {
                setFilters((prev) => ({ ...prev, statut: 'RECU' }));
                setPage(1);
              }
            }}
          />
        )}
        {statsOpen && !stats && !statsLoading && (
          <div className="text-muted-foreground text-sm">Aucune statistique disponible</div>
        )}
      </div>

      {/* Tableau des candidats enrichi */}
      <CandidatsTable
        candidats={enrichedCandidats}
        variant={getVariant()}
        columnConfig={columnConfig}
        enrichments={enrichments}
        actions={actions}
        enablePagination
        enableToolbar
        defaultPageSize={limit}
        maxItems={pagination.total}

        pageSizeOptions={[5, 10, 20, 50, 100]}
        onRefresh={handleRefresh}
        isLoading={loading}
        title="Liste des candidats"
        description="Gérez l’ensemble des élèves inscrits à l’auto‑école"
        onAddClick={handleAddCandidat}
        showViewAll={false}
        asCard
        className="w-full"
        emptyMessage="Aucun candidat trouvé."

      />
    </div>
  );
}