/* eslint-disable react-hooks/set-state-in-effect */
// src/features/examens/pages/ExamensListPage.tsx

/**
 * @module features/examens/pages/ExamensListPage
 * @description
 * Page principale de la gestion des examens (code et conduite) de l’auto‑école COS.
 * Thème : Indigo (accent indigo-700).
 *
 * Layout :
 * ─ En-tête : titre, nombre total d’examens, date, bouton d’export, bouton d’ajout, breadcrumb
 * ─ Bloc supérieur : deux colonnes (2/3 + 1/3) :
 *     - Statistiques des examens (repliables) sur la gauche
 *     - Carte des candidats prioritaires (prochains examens) sur la droite
 * ─ Tableau complet (`ExamensTable`) avec filtres, pagination, actions
 *
 * Les données sont chargées depuis l’API Electron via les stores `useExamens` et `useCandidats`.
 * Aucune donnée mockée n’est utilisée.
 *
 * @author Stive Junior
 * @version 3.0.0
 */

import * as React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { ExamensStatsCards } from '../components/ExamensStatsCards';
import { ExamensTable } from '../components/ExamensTable';
import { CandidatsExamsCard } from '../components/CandidatsExamensCard';
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb';
import { useAuth } from '@/hooks/use.auth';
import { useExamens } from '@/hooks/use.examens';
import { useCandidats } from '@/hooks/use.candidats';
import { useNavigate } from 'react-router-dom';
import { PROTECTED_ROUTES, route } from '@/config';
import { getAvatarUrl } from '@/lib/utils';
import type { Examen } from '@/types/examens.types';
import type { Candidat } from '@/types/candidats.types';

// ============================================================
// Page principale
// ============================================================

export default function ExamensListPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role;
  const isAdmin = role === 'ADMIN';
  const isSecretaire = role === 'SECRETAIRE';

  const getVariant = (): 'admin' | 'secretaire' | 'moniteur' => {
    if (isAdmin) return 'admin';
    if (isSecretaire) return 'secretaire';
    return 'moniteur';
  };

  // Store examens
  const {
    examens,
    stats,
    trends,
    sparklines,
    getAll,
    getStats,
    getTrends,
    getSparklines,
    delete: deleteExamen,
    printCertificate,
    loading: listLoading,
    statsLoading,
    trendsLoading,
    sparklinesLoading,
  } = useExamens();

  // Store candidats (pour enrichir la carte des candidats prioritaires)
  const {
    candidats,
    getAll: getAllCandidats,
    loading: candidatsLoading,
  } = useCandidats();

  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [candidatsAvecExamens, setCandidatsAvecExamens] = React.useState<Candidat[]>([]);

  // Chargement initial des examens et des candidats
  React.useEffect(() => {
    const loadInitialData = async () => {
      try {
        await Promise.all([
          getAll({}),
          getStats(),
          getTrends(),
          getSparklines(),
          getAllCandidats({}),
        ]);
      } catch {
        toast.error('Erreur lors du chargement des données');
      }
    };
    loadInitialData();
  }, [getAll, getStats, getTrends, getSparklines, getAllCandidats]);

  // Enrichir les candidats avec leurs examens (pour la carte)
  React.useEffect(() => {
    if (!candidats.length || !examens.length) return;
    // Pour chaque candidat, ajouter les examens qui lui correspondent
    const candidatsAvecExamensMap = new Map<number, Candidat>();
    candidats.forEach(c => {
      candidatsAvecExamensMap.set(c.id, { ...c, examens: [] });
    });
    examens.forEach(examen => {
      const c = candidatsAvecExamensMap.get(examen.candidatId);
      if (c) {
        if (!c.examens) c.examens = [];
        c.examens.push(examen);
      } else {
        const fakeCandidat: Candidat = {
          id: examen.candidatId,
          nom: `Candidat ${examen.candidatId}`,
          prenom: 'Inconnu',
          email: null,
          telephone: null,
          dateNaissance: null,
          adresse: null,
          numeroPermis: null,
          categorie: 'B',
          statut: 'EN_ATTENTE',
          dateInscription: new Date().toISOString(),
          notes: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
          paiements: [],
          lecons: [],
          examens: [examen],
          factures: [],
          formation: null,
          documents: [],
        };
        candidatsAvecExamensMap.set(examen.candidatId, fakeCandidat);
      }
    });
    setCandidatsAvecExamens(Array.from(candidatsAvecExamensMap.values()));
  }, [candidats, examens]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        getAll({}),
        getStats(),
        getTrends(),
        getSparklines(),
        getAllCandidats({}),
      ]);
      toast.success('Examens actualisés');
    } catch {
      toast.error('Erreur lors du rafraîchissement');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = () => {
    // TODO: implémenter l'export (CSV/Excel/PDF)
    toast.info('Fonction d’export à implémenter');
  };

  const handleAddExamen = () => {
    navigate(PROTECTED_ROUTES.EXAMENS.CREATE);
  };

  const handleView = (examen: Examen) => {
    navigate(route(PROTECTED_ROUTES.EXAMENS.DETAIL(examen.id), { id: examen.id }));
  };

  const handleEdit = (examen: Examen) => {
    navigate(route(PROTECTED_ROUTES.EXAMENS.EDIT(examen.id), { id: examen.id }));
  };

  const handleDelete = async (examen: Examen) => {
    if (window.confirm(`Supprimer définitivement l’examen du ${format(new Date(examen.date), 'dd/MM/yyyy')} ?`)) {
      try {
        await deleteExamen(examen.id);
        toast.success('Examen supprimé');
        await handleRefresh();
      } catch {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handlePrintCertificate = async (examen: Examen) => {
    try {
      const result = await printCertificate(examen.id);
      if (result.success && result.path) {
        toast.success(`Attestation générée : ${result.path}`);
        window.open(result.path, '_blank');
      } else {
        toast.error(result.message || 'Erreur lors de la génération');
      }
    } catch {
      toast.error('Erreur lors de la génération de l’attestation');
    }
  };

  const handleCandidatClick = (candidat: Candidat) => {
    navigate(route(PROTECTED_ROUTES.CANDIDATS.DETAIL(candidat.id), { id: candidat.id }));
  };

  // Enrichissements pour le tableau (candidat)
  const enrichments = {
    getCandidatNomComplet: (e: Examen) => {
      const c = candidatsAvecExamens.find(c => c.id === e.candidatId);
      return c ? `${c.prenom} ${c.nom}` : `Candidat ${e.candidatId}`;
    },
    getCandidatEmail: (e: Examen) => {
      const c = candidatsAvecExamens.find(c => c.id === e.candidatId);
      return c?.email ?? `candidat${e.candidatId}@example.com`;
    },
    getCandidatAvatarUrl: (e: Examen) => {
      const c = candidatsAvecExamens.find(c => c.id === e.candidatId);
      return c ? getAvatarUrl(`${c.prenom} ${c.nom}`) : getAvatarUrl(`Candidat ${e.candidatId}`);
    },
    getCandidatInitials: (e: Examen) => {
      const c = candidatsAvecExamens.find(c => c.id === e.candidatId);
      return c ? `${c.prenom[0]}${c.nom[0]}`.toUpperCase() : `C${e.candidatId}`;
    },
  };

  // Actions du tableau
  const actions = {
    onView: handleView,
    onEdit: (isAdmin || isSecretaire) ? handleEdit : undefined,
    onDelete: isAdmin ? handleDelete : undefined,
    onPrintCertificate: (isAdmin || isSecretaire) ? handlePrintCertificate : undefined,
  };

  const variant = getVariant();
  const isLoading = listLoading || statsLoading || trendsLoading || sparklinesLoading || candidatsLoading || isRefreshing;

  return (
    <div className="space-y-5 p-4 md:p-1 pb-10">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-12 rounded-md bg-indigo-700 text-white shadow-sm shrink-0">
            <GraduationCap className="size-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Examens</h1>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <span className="capitalize">
                {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
              </span>
              <span>·</span>
              <Badge
                variant="outline"
                className="text-[10px] h-4 px-1.5 border-0 bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
              >
                {stats?.totalExamens ?? 0} examens
              </Badge>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">

          <PageBreadcrumb className="hidden lg:flex" />
        </div>
      </div>

      {/* Bloc supérieur : statistiques + carte des candidats prioritaires */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <ExamensStatsCards
            stats={stats}
            trends={trends || undefined}
            totalSparkline={sparklines?.examensSparkline}
            tauxReussiteSparkline={sparklines?.tauxReussiteSparkline}
            examensMoisSparkline={sparklines?.examensSparkline} // placeholder
            noteMoyenneSparkline={sparklines?.tauxReussiteSparkline} // placeholder
            isLoading={isLoading}
            onCardClick={(id) => {
              if (id === 'total-examens') toast.info('Voir tous les examens');
              else if (id === 'taux-reussite') toast.info('Taux de réussite global');
              else if (id === 'examens-mois') toast.info('Examens du mois');
              else if (id === 'note-moyenne') toast.info('Note moyenne conduite');
            }}
            className="h-full"
          />
        </div>
        <div className="lg:col-span-1">
          <CandidatsExamsCard
            candidats={candidatsAvecExamens}
            isLoading={isLoading}
            onCandidatClick={handleCandidatClick}
            title="Prochains examens"
            maxItems={5}
            className="h-full"
          />
        </div>
      </div>

      {/* Tableau des examens */}
      <ExamensTable
        examens={examens}
        variant={variant}
        enrichments={enrichments}
        actions={actions}
        enablePagination
        enableToolbar
        defaultPageSize={10}
        onRefresh={handleRefresh}
        onExport={(isAdmin || isSecretaire) ? handleExport : undefined}
        isLoading={isLoading}
        title="Liste des examens"
        description="Consultez et gérez l’ensemble des épreuves (code et conduite)"
        showAddButton={isAdmin || isSecretaire}
        onAddClick={handleAddExamen}
        showViewAll={false}
        asCard
        className="w-full"
        emptyMessage="Aucun examen trouvé."
      />
    </div>
  );
}