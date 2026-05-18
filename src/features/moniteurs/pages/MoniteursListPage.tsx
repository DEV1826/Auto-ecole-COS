// src/features/moniteurs/pages/MoniteursListPage.tsx

/**
 * @module features/moniteurs/pages/MoniteursListPage
 * @description
 * Page principale de la gestion des moniteurs (instructeurs) de l’auto‑école COS.
 * Thème : Bleu (accent blue-700).
 *
 * Layout :
 * ─ En-tête : titre, nombre total de moniteurs, date, bouton d’export, breadcrumb
 * ─ Bloc supérieur : 2 colonnes (2/3 – statistiques, 1/3 – carte récapitulative)
 * ─ Tableau complet (`MoniteursTable`) avec filtres, pagination, actions
 *
 * Les données sont chargées depuis l’API Electron via le store `useMoniteurs`.
 * Aucune donnée mockée n’est utilisée.
 *
 * @author Stive Junior
 * @version 2.0.0
 */

import * as React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Users, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb';
import { useAuth } from '@/hooks/use.auth';
import { useMoniteurs } from '@/hooks/use.moniteurs';
import { useNavigate } from 'react-router-dom';
import { PROTECTED_ROUTES, route } from '@/config';
import { getAvatarUrl } from '@/lib/utils';
import { ErrorDialog } from '@/components/ui/error-dialog';

import { MoniteursStatsCards } from '../components/MoniteursStatsCards';
import { MoniteursTable } from '../components/MoniteursTable';
import { MoniteursResumeCard } from '../components/MoniteursResumeCard';
import type { Moniteur } from '@/types/moniteurs.types';

// ============================================================
// Page principale
// ============================================================

/**
 * Page de liste des moniteurs.
 * Affiche les statistiques, une carte récapitulative et le tableau des moniteurs.
 */
export default function MoniteursListPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isSecretaire = user?.role === 'SECRETAIRE';
  const canEdit = isAdmin || isSecretaire;

  // Store moniteurs
  const {
    moniteurs,
    stats,
    trends,
    sparklines,
    getAll,
    getStats,
    getTrends,
    getSparklines,
    delete: deleteMoniteur,
    loading: listLoading,
    statsLoading,
    trendsLoading,
    sparklinesLoading,
  } = useMoniteurs();

  // État local pour la section repliable (statistiques)
  const [statsOpen, setStatsOpen] = React.useState(true);
  const [errorDialog, setErrorDialog] = React.useState<{
    open: boolean;
    title?: string;
    message: string;
    details?: string[];
  }>({ open: false, message: '' });

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

  // ── Handlers ──────────────────────────────────────────────────────
  const handleRefresh = async () => {
    try {
      await getAll();
      await getStats();
      await getTrends();
      await getSparklines();
      toast.success('Moniteurs actualisés');
    } catch {
      toast.error('Erreur lors de l’actualisation');
    }
  };

  const handleExport = () => {
    // TODO: implémenter l'export (CSV/Excel/PDF)
    toast.info('Fonction d’export à implémenter');
  };

  const handleAddMoniteur = () => {
    navigate(PROTECTED_ROUTES.MONITEURS.CREATE);
  };

  const handleView = (moniteur: Moniteur) => {
    navigate(route(PROTECTED_ROUTES.MONITEURS.DETAIL(moniteur.id), { id: moniteur.id }));
  };

  const handleEdit = (moniteur: Moniteur) => {
    navigate(route(PROTECTED_ROUTES.MONITEURS.EDIT(moniteur.id), { id: moniteur.id }));
  };

  const handleViewPlanning = (moniteur: Moniteur) => {
    navigate(route(PROTECTED_ROUTES.PLANNING.MONITEUR(moniteur.id), { id: moniteur.id }));
  };

  const handleDelete = async (moniteur: Moniteur) => {
    if (!isAdmin) return;
    if (window.confirm(`Désactiver le moniteur ${moniteur.prenom} ${moniteur.nom} ?`)) {
      try {
        await deleteMoniteur(moniteur.id);
        toast.success('Moniteur désactivé avec succès');
        await handleRefresh();
      } catch (err: any) {
        setErrorDialog({
          open: true,
          title: 'Erreur',
          message: err?.message || 'Impossible de désactiver le moniteur.',
          details: ['Vérifiez que le moniteur n’a pas de leçons planifiées.'],
        });
      }
    }
  };

  // ── Enrichissements pour le tableau ───────────────────────────────
  const enrichments = {
    getAvatarUrl: (m: Moniteur) => getAvatarUrl(`${m.prenom} ${m.nom}`),
    getInitials: (m: Moniteur) => `${m.prenom?.[0]}${m.nom?.[0]}`.toUpperCase(),
    getLeconsCount: (m: Moniteur) => {
      return m.lecons?.length ?? 0;
    },
    getHeuresTotales: (m: Moniteur) => (m.lecons?.length ?? 0) * 1.5,


  };

  // ── Actions du tableau ───────────────────────────────────────────
  const actions = {
    onView: handleView,
    onEdit: canEdit ? handleEdit : undefined,
    onDelete: isAdmin ? handleDelete : undefined,
    onViewPlanning: handleViewPlanning,
  };

  const variant = isAdmin ? 'admin' : 'secretaire';
  const isLoading = listLoading || statsLoading || trendsLoading || sparklinesLoading;

  return (
    <div className="space-y-5 p-4 md:p-1 pb-10">
      {/* ── EN‑TÊTE ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-12 rounded-md bg-blue-700 text-white shadow-sm shrink-0">
            <Users className="size-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Moniteurs</h1>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <span className="capitalize">
                {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
              </span>
              <span>·</span>
              <Badge
                variant="outline"
                className="text-[10px] h-4 px-1.5 border-0 bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
              >
                {stats?.totalMoniteurs ?? 0} moniteurs
              </Badge>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="h-8 gap-1 text-xs">
            <Download className="h-3.5 w-3.5" />
            Exporter
          </Button>

          <PageBreadcrumb className="hidden lg:flex" />
        </div>
      </div>

      {/* ── BLOC SUPÉRIEUR : STATISTIQUES + CARTE RÉCAPITULATIVE ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2">
          <MoniteursStatsCards
            stats={stats}
            trends={trends || undefined}
            totalMoniteursSparkline={sparklines?.actifsSparkline}
            actifsSparkline={sparklines?.actifsSparkline}
            totalHeuresSparkline={sparklines?.heuresSparkline}
            moyenneHeuresSparkline={sparklines?.moyenneHeuresSparkline}
            isLoading={isLoading}
            onCardClick={(id) => {
              if (id === 'total-moniteurs') toast.info('Voir tous les moniteurs');
              else if (id === 'moniteurs-actifs') toast.info('Filtrer les actifs');
              else if (id === 'total-heures-lecons') toast.info('Total des heures de leçons');
              else if (id === 'moyenne-heures') toast.info('Moyenne d’heures par moniteur');
            }}
            className='h-full'
          />
        </div>
        <div className="lg:col-span-1">
          <MoniteursResumeCard
            moniteurs={moniteurs}
            stats={stats}
            isLoading={isLoading}
            onMoniteurClick={handleView}
          />
        </div>
      </div>

      {/* ── TABLEAU DES MONITEURS ────────────────────────────────────── */}
      <MoniteursTable
        moniteurs={moniteurs}
        variant={variant}
        enrichments={enrichments}
        actions={actions}
        enablePagination
        enableToolbar
        defaultPageSize={10}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        title="Liste des moniteurs"
        description="Gérez l’équipe pédagogique de l’auto‑école"
        showAddButton={canEdit}
        onAddClick={handleAddMoniteur}
        showViewAll={false}
        asCard
        className="w-full"
        emptyMessage="Aucun moniteur trouvé."
      />

      {/* Dialogue d’erreur */}
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