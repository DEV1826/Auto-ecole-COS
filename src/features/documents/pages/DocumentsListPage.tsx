/* eslint-disable react-hooks/set-state-in-effect */
// src/features/documents/pages/DocumentsListPage.tsx

/**
 * @module features/documents/pages/DocumentsListPage
 * @description
 * Page principale de gestion des documents de l'auto‑école COS.
 * Thème : Bleu (accent blue‑700).
 *
 * ## Layout
 * ```
 * ┌─────────────────────────────────────────────────────────────┐
 * │  En-tête : icône, titre, date, badge total, breadcrumb      │
 * │  Actions  : Actualiser · Exporter · Ajouter                 │
 * ├────────────────────────────────┬────────────────────────────┤
 * │  DocumentsStatsCards           │  DocumentsChart            │
 * │  (grille 2 × 3 cartes stats)   │  (donut interactif + légende│
 * ├────────────────────────────────┴────────────────────────────┤
 * │  DocumentsTable (full-width, pagination, toolbar)           │
 * └─────────────────────────────────────────────────────────────┘
 * ```
 *
 * Les données sont chargées depuis l’API Electron via le store `useDocuments`.
 * Aucune donnée mockée n’est utilisée.
 *
 * @author Stive Junior
 * @version 2.0.0
 */

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FileText, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb';
import { useAuth } from '@/hooks/use.auth';
import { useDocuments } from '@/hooks/use.documents';
import { useCandidats } from '@/hooks/use.candidats';
import { DocumentsStatsCards } from '../components/DocumentsStatsCards';
import { DocumentsTable } from '../components/DocumentsTable';
import { DocumentsChart } from '../components/DocumentsChart';
import { getAvatarUrl } from '@/lib/utils';
import { PROTECTED_ROUTES } from '@/config/routes';
import type { Document } from '@/types/documents.types';
import type { Candidat } from '@/types/candidats.types';

// ============================================================
// Enrichissements pour le tableau (candidat)
// ============================================================

function buildEnrichments(candidatsMap: Map<number, Candidat>) {
  return {
    getCandidatNomComplet: (doc: Document) => {
      const c = candidatsMap.get(doc.candidatId);
      return c ? `${c.prenom} ${c.nom}` : `Candidat ${doc.candidatId}`;
    },
    getCandidatEmail: (doc: Document) => {
      const c = candidatsMap.get(doc.candidatId);
      return c?.email ?? '—';
    },
    getCandidatTelephone: (doc: Document) => {
      const c = candidatsMap.get(doc.candidatId);
      return c?.telephone ?? '—';
    },
    getCandidatAvatarUrl: (doc: Document) => {
      const c = candidatsMap.get(doc.candidatId);
      return c ? getAvatarUrl(`${c.prenom} ${c.nom}`) : getAvatarUrl('Inconnu');
    },
    getCandidatInitials: (doc: Document) => {
      const c = candidatsMap.get(doc.candidatId);
      return c ? `${c.prenom?.[0] ?? ''}${c.nom?.[0] ?? ''}`.toUpperCase() : `C${doc.candidatId}`;
    },
  };
}

// ============================================================
// Page principale
// ============================================================

export default function DocumentsListPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role;
  const isAdmin = role === 'ADMIN';
  const isSecretaire = role === 'SECRETAIRE';

  // Stores
  const {
    documents,
    stats,
    trends,
    sparklines,
    pagination,
    loading,
    getAll,
    getStats,
    getTrends,
    getSparklines,
    delete: deleteDocument,
    download: downloadDocument,
    open: openDocument,
  } = useDocuments();

  const { candidats, getAll: getAllCandidats, loading: candidatsLoading } = useCandidats();

  const [statsOpen, setStatsOpen] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [candidatsMap, setCandidatsMap] = React.useState<Map<number, Candidat>>(new Map());

  // Chargement initial des documents et des candidats
  React.useEffect(() => {
    const loadInitialData = async () => {
      try {
        await Promise.all([
          getAll({}), // Charger tous les documents (ou paginés)
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

  // Construire un Map candidatId -> Candidat pour un accès rapide
  React.useEffect(() => {
    const map = new Map<number, Candidat>();
    candidats.forEach((c) => map.set(c.id, c));
    setCandidatsMap(map);
  }, [candidats]);

  const enrichments = React.useMemo(() => buildEnrichments(candidatsMap), [candidatsMap]);

  // Rafraîchissement manuel
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        getAll({ limit: 100 }),
        getStats(),
        getTrends(),
        getSparklines(),
        getAllCandidats({ limit: 200 }),
      ]);
      toast.success('Documents actualisés');
    } catch {
      toast.error('Erreur lors du rafraîchissement');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = () => {
    // TODO: exporter en CSV/Excel (via l'API ou conversion côté client)
    toast.info('Fonction d’export à implémenter');
  };

  const handleAddDocument = () => {
    navigate(PROTECTED_ROUTES.DOCUMENTS.UPLOAD);
  };

  // Actions du tableau
  const actions = {
    onView: async (doc: Document) => {
      await openDocument(doc.chemin);
    },
    onDownload: async (doc: Document) => {
      try {
        await downloadDocument(doc.id);
        toast.success(`Téléchargement de ${doc.nomFichier} démarré`);
      } catch {
        toast.error('Erreur lors du téléchargement');
      }
    },
    onDelete: async (doc: Document) => {
      if (window.confirm(`Supprimer définitivement ${doc.nomFichier} ?`)) {
        try {
          await deleteDocument(doc.id);
          toast.success('Document supprimé');
          await handleRefresh();
        } catch {
          toast.error('Erreur lors de la suppression');
        }
      }
    },
    onPrint: (doc: Document) => {
      // Impression du document (ouvrir et imprimer)
      window.open(doc.chemin, '_blank');
    },
  };

  const variant: 'admin' | 'secretaire' | 'candidat' = isAdmin ? 'admin' : isSecretaire ? 'secretaire' : 'candidat';
  const isLoading = loading || candidatsLoading || isRefreshing;

  return (
    <div className="space-y-6 p-4 md:p-1 pb-12">
      {/* En-tête de page */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-12 rounded-md bg-blue-700 text-white shadow-sm shrink-0">
            <FileText className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
              <Badge
                variant="outline"
                className="text-[10px] h-5 px-1.5 border-0 bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-semibold"
              >
                {pagination.total} fichier{pagination.total > 1 ? 's' : ''}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <span className="capitalize">
                {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
              </span>
              <span>·</span>
              <span>Gestion documentaire de l'auto‑école</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleRefresh} className="h-8 gap-1 text-xs">
            <BarChart3 className="h-3.5 w-3.5" />
            Actualiser
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="h-8 gap-1 text-xs">
            <FileText className="h-3.5 w-3.5" />
            Exporter
          </Button>
          {(isAdmin || isSecretaire) && (
            <Button size="sm" onClick={handleAddDocument} className="h-8 gap-1 text-xs bg-blue-700 hover:bg-blue-800">
              <FileText className="h-3.5 w-3.5" />
              Ajouter
            </Button>
          )}
          <PageBreadcrumb className="hidden lg:flex" />
        </div>
      </div>

      {/* Section statistiques repliable */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setStatsOpen((o) => !o)}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <BarChart3 className="h-4 w-4 text-blue-700" />
          Aperçu & statistiques
          {statsOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        <AnimatePresence initial={false}>
          {statsOpen && trends && (
            <motion.div
              key="stats-section"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <DocumentsStatsCards
                    stats={stats}
                    trends={trends}
                    totalDocumentsSparkline={sparklines?.totalSparkline}
                    carteIdentiteSparkline={sparklines?.carteIdentiteSparkline}
                    recusSparkline={sparklines?.recusSparkline}
                    tailleSparkline={sparklines?.tailleSparkline}
                    isLoading={isLoading}
                    onCardClick={(id) => {
                      const labels: Record<string, string> = {
                        'total-documents': 'Voir tous les documents',
                        'documents-permis': 'Filtrer les permis',
                        'documents-carte-identite': "Filtrer les cartes d'identité",
                        'documents-facture': 'Filtrer les factures',
                        'documents-recu': 'Filtrer les reçus',
                        'taille-totale': 'Informations stockage',
                      };
                      toast.info(labels[id] ?? id);
                    }}

                  />
                </div>
                <div className="lg:col-span-1">
                  <DocumentsChart
                    stats={stats}
                    documents={documents}
                    isLoading={isLoading}
                    className="h-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tableau des documents */}
      <DocumentsTable
        documents={documents}
        variant={variant}
        enrichments={enrichments}
        actions={actions}
        enablePagination
        enableToolbar
        defaultPeriodFilter="all"
        showPeriodFilter
        defaultPageSize={10}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        title="Gestion documentaire"
        description="Tous les fichiers téléversés et associés aux candidats"
        showAddButton={isAdmin || isSecretaire}
        onAddClick={handleAddDocument}
        onExport={handleExport}
        showViewAll={false}
        asCard
        emptyMessage="Aucun document trouvé pour cette période."
        className="w-full"
      />
    </div>
  );
}