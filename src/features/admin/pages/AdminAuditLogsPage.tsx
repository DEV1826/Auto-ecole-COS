// src/features/admin/pages/AuditLogsListPage.tsx

/**
 * @module features/admin/pages/AuditLogsListPage
 * @description
 * Page principale de la liste des logs d’audit pour l’administration système.
 * Thème : Slate (accent slate-700).
 *
 * Layout :
 * ─ En-tête : titre, nombre total de logs, date, bouton d’export (optionnel)
 * ─ Bloc statistiques (`StatsAuditLogs`) — repliable
 * ─ Tableau complet (`AuditLogsTable`) avec filtres, période, pagination
 *
 * Les données sont chargées depuis l’API Electron via le store `useAdmin`.
 * Aucune donnée mockée — appels réels via IPC.
 *
 * @author Stive Junior
 * @version 2.0.0
 *
 * @example
 * ```tsx
 * <Route path="/admin/audit-logs" element={<AuditLogsListPage />} />
 * ```
 */

import * as React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FileText, Download, RefreshCw, BarChart3, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb';
import { Skeleton } from '@/components/ui/skeleton';

import { StatsAuditLogs } from '../components/StatsAuditLogs';
import { AuditLogsTable } from '../components/AuditLogsTable';
import { useAdmin } from '@/hooks/use.admin';
import { useAuth } from '@/hooks/use.auth';
import { getAvatarUrl } from '@/lib/utils';
import type { AuditLog } from '@/types/admin.types';

// ─────────────────────────────────────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Page de consultation des logs d’audit.
 * Charge les données réelles depuis l’API, affiche les cartes de stats
 * et le tableau paginé avec filtres.
 */
export default function AuditLogsListPage(): React.JSX.Element {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // Store admin
  const {
    logs,
    logsPagination,
    logsLoading,
    logsError,
    stats,
    statsLoading,
    statsError,
    trends,
    getAuditLogs,
    getAdminStats,
    getAdminTrends,
  } = useAdmin();

  const [statsOpen, setStatsOpen] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [periodFilter] = React.useState<'today' | 'week' | 'month' | 'all'>('month');

  const isLoading = logsLoading || statsLoading || isRefreshing;

  // Chargement initial
  React.useEffect(() => {
    const loadInitialData = async () => {
      try {
        await Promise.all([
          getAuditLogs({ page: 1, limit: 20, period: periodFilter }),
          getAdminStats(),
          getAdminTrends(),
        ]);
      } catch (err) {
        console.error('Erreur chargement initial audit logs:', err);
        toast.error('Erreur lors du chargement des logs d’audit');
      }
    };
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rafraîchissement manuel
  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        getAuditLogs({ page: logsPagination.page, limit: logsPagination.limit, period: periodFilter }),
        getAdminStats(),
        getAdminTrends(),
      ]);
      toast.success('Logs actualisés');
    } catch {
      console.error('Erreur lors du rafraîchissement des logs d\'audit');
      toast.error('Erreur lors du rafraîchissement');
    } finally {
      setIsRefreshing(false);
    }
  }, [getAuditLogs, getAdminStats, getAdminTrends, logsPagination.page, logsPagination.limit, periodFilter]);

  const handleExport = () => {
    toast.info('Fonction d’export à implémenter');
  };



  // Actions sur les logs (tableau)
  const handleViewDetails = (log: AuditLog) => {
    // Afficher les détails du log (JSON) dans un modal ou un toast
    toast.info(`Log #${log.id} : ${log.action} - ${log.description}`);
  };

  const handleFilterByUser = (userId: number) => {
    getAuditLogs({ page: 1, limit: logsPagination.limit, utilisateurId: userId });
    toast.info(`Filtre appliqué : utilisateur ID ${userId}`);
  };

  // Enrichissements pour le tableau (avatar, nom complet)
  const enrichments = {
    getNomComplet: (log: AuditLog) => {
      const u = log.utilisateur;
      return u ? `${u.prenom} ${u.nom}`.trim() : 'Anonyme';
    },
    getEmail: (log: AuditLog) => log.utilisateur?.email ?? '',
    getAvatarUrl: (log: AuditLog) => {
      const u = log.utilisateur;
      return u ? getAvatarUrl(`${u.prenom} ${u.nom}`) : getAvatarUrl('Anonyme');
    },
    getInitials: (log: AuditLog) => {
      const u = log.utilisateur;
      return u ? `${u.prenom?.[0]}${u.nom?.[0]}`.toUpperCase() : '??';
    },
  };

  // Actions du tableau
  const tableActions = {
    onViewDetails: handleViewDetails,
    onFilterByUser: isAdmin ? handleFilterByUser : undefined,
  };

  // Affichage du chargement initial
  if (logsLoading && logs.length === 0) {
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
          </div>
        </div>
        <Skeleton className="h-40 w-full rounded-md" />
        <Skeleton className="h-96 w-full rounded-md" />
      </div>
    );
  }

  // Erreur critique
  if (logsError && logs.length === 0) {
    return (
      <div className="p-4 md:p-6">
        <Alert variant="destructive" className="max-w-xl mx-auto mt-12">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="space-y-2">
            <p className="font-semibold">Impossible de charger les logs d’audit</p>
            <p className="text-sm">{logsError}</p>
            <Button size="sm" variant="outline" onClick={handleRefresh} className="mt-2">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 p-4 md:p-1 pb-12">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-12 rounded-md bg-slate-700 text-white shadow-sm shrink-0">
              <FileText className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-3xl font-bold tracking-tight">Journal d’audit</h1>
                <Badge
                  variant="outline"
                  className="text-[10px] h-5 px-1.5 border-0 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-semibold"
                >
                  {logsPagination.total} événement{logsPagination.total > 1 ? 's' : ''}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <span className="capitalize">
                  {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
                </span>
                <span>·</span>
                <span>Traçabilité des actions système</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-8 gap-1.5 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} className="h-8 gap-1.5 text-xs">
              <Download className="h-3.5 w-3.5" />
              Exporter
            </Button>
            <PageBreadcrumb className="hidden lg:flex" />
          </div>
        </div>

        {/* Section statistiques repliable */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setStatsOpen(o => !o)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <BarChart3 className="h-4 w-4 text-slate-700" />
            Statistiques des logs
            {statsOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          <AnimatePresence initial={false}>
            {statsOpen && (
              <motion.div
                key="stats-audit"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                {statsError && !stats && (
                  <Alert variant="destructive" className="mb-3">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Statistiques indisponibles — {statsError}</AlertDescription>
                  </Alert>
                )}
                <StatsAuditLogs
                  stats={stats}
                  trends={trends ?? undefined}
                  isLoading={statsLoading}
                  onCardClick={(cardId) => {
                    if (cardId === 'total-events') toast.info('Total des événements');
                    else if (cardId === 'success') toast.info('Actions réussies');
                    else if (cardId === 'failed') toast.info('Actions échouées');
                    else if (cardId === 'success-rate') toast.info('Taux de succès');
                  }}
                  className="w-full"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tableau des logs d’audit */}
        <AuditLogsTable
          logs={logs}
          variant={isAdmin ? 'admin' : 'auditor'}
          enrichments={enrichments}
          actions={tableActions}

          defaultPeriodFilter={periodFilter}
          showPeriodFilter
          enablePagination
          enableToolbar
          defaultPageSize={logsPagination.limit}
          onRefresh={handleRefresh}
          isLoading={isLoading}
          title="Historique des événements"
          description="Actions sensibles, connexions, modifications, suppressions"
          asCard
          emptyMessage="Aucun log trouvé pour cette période."
          className="w-full"
        />
      </div>
    </>
  );
}