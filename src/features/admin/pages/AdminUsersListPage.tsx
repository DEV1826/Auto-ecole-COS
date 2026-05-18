// src/features/admin/pages/AdminUsersListPage.tsx

/**
 * @module features/admin/pages/AdminUsersListPage
 * @description
 * Page principale de gestion des utilisateurs (administration système) de l'auto‑école COS.
 * Thème : Bleu (accent blue-700).
 *
 * ## Données
 * Toutes les données sont chargées depuis l'API Electron via le hook `useAuth`.
 * Aucune donnée mockée — appels réels via IPC.
 *
 * ## Flux de données
 * ```
 * mount → Promise.all([getAllUsers, getStats, getTrends, getSparklines])
 *       → allUsers, stats, trends, sparklines (stores Zustand)
 *       → AuthStatsCards + UsersTable + UserFormDialog + UserDetailDialog
 * ```
 *
 * ## Layout
 * ```
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │  En-tête : icône, titre, badge total, date, Actualiser/Exporter/Ajouter│
 * ├────────────────────────────────────────────────────────────────────────┤
 * │  AuthStatsCards (repliable) — chargé via getStats() / getTrends()     │
 * ├────────────────────────────────────────────────────────────────────────┤
 * │  UsersTable — chargé via getAllUsers()                                  │
 * ├────────────────────────────────────────────────────────────────────────┤
 * │  UserFormDialog (modale create/edit) — UserDetailDialog (modale view)  │
 * └────────────────────────────────────────────────────────────────────────┘
 * ```
 *
 * @author Stive Junior
 * @version 3.0.0
 *
 * @example
 * ```tsx
 * <Route path="/admin/users" element={<AdminUsersListPage />} />
 * ```
 */

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Users,
  Download,
  RefreshCw,
  BarChart3,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb';

import { AuthStatsCards } from '../components/AuthStatsCards';
import { UsersTable } from '../components/UsersTable';
import { UserFormDialog } from '../components/UserFormDialog';
import { UserDetailDialog } from '../components/UserDetailDialog';

import { useAuth } from '@/hooks/use.auth';
import { getAvatarUrl } from '@/lib/utils';
import { PROTECTED_ROUTES, route } from '@/config/routes';

import type { Utilisateur } from '@/types/auth.types';

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Page de gestion des utilisateurs.
 *
 * Charge en parallèle la liste des utilisateurs et les statistiques (stats, tendances,
 * sparklines) dès le montage du composant. Intègre les dialogues de création/édition
 * et de consultation des détails.
 */
export default function AdminUsersListPage(): React.JSX.Element {
  const navigate = useNavigate();

  // ── Hook d'authentification ──────────────────────────────────────────────
  const {
    user: currentUser,
    isAuthenticated,

    // Liste des utilisateurs
    allUsers,
    usersPagination,
    usersLoading,
    usersError,
    getAllUsers,
    deleteUser,
    requestPasswordResetByEmail,

    // Statistiques, tendances, sparklines
    stats,
    statsLoading,
    statsError,
    trends,
    trendsLoading,
    sparklines,
    sparklinesLoading,
    getStats,
    getTrends,
    getSparklines,

  } = useAuth();

  // ── État local de l'interface ────────────────────────────────────────────
  const [statsOpen, setStatsOpen] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Dialogues create / edit
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<Utilisateur | null>(null);

  // Dialogue de détail
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
  const [selectedUserId, setSelectedUserId] = React.useState<number | null>(null);

  const isAdmin = currentUser?.role === 'ADMIN';
  const isSecretaire = currentUser?.role === 'SECRETAIRE';
  const isBusy = usersLoading || statsLoading || sparklinesLoading || trendsLoading || isRefreshing;

  // ── Chargement initial ───────────────────────────────────────────────────
  React.useEffect(() => {
    if (!isAuthenticated) return;

    /**
     * Charge en parallèle la liste des utilisateurs et toutes les métriques.
     * Les erreurs individuelles sont gérées de manière non-bloquante.
     */
    const loadAll = async () => {
      const results = await Promise.allSettled([
        getAllUsers(),
        getStats(),
        getTrends(),
        getSparklines(),
      ]);

      // Afficher un toast si au moins une requête a échoué
      const failures = results.filter((r) => r.status === 'rejected');
      if (failures.length > 0) {
        toast.error('Certaines données n\'ont pas pu être chargées.', {
          description: 'Cliquez sur « Actualiser » pour réessayer.',
        });
      }
    };

    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // ── Handlers — navigation & données ─────────────────────────────────────

  /**
   * Rafraîchit la liste des utilisateurs et les statistiques.
   */
  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        getAllUsers(),
        getStats(),
        getTrends(),
        getSparklines(),
      ]);
      toast.success('Données actualisées');
    } catch {
      toast.error('Erreur lors du rafraîchissement');
    } finally {
      setIsRefreshing(false);
    }
  }, [getAllUsers, getStats, getTrends, getSparklines]);

  /**
   * Exporte la liste des utilisateurs (fonctionnalité à implémenter côté service).
   */
  const handleExport = React.useCallback(() => {
    toast.info('Export en cours de développement');
  }, []);

  // ── Handlers — dialogues ─────────────────────────────────────────────────

  /** Ouvre le dialogue de création d'utilisateur. */
  const handleAddUser = React.useCallback(() => {
    setSelectedUser(null);
    setFormDialogOpen(true);
  }, []);

  /** Ouvre le dialogue de consultation des détails d'un utilisateur. */
  const handleViewUser = React.useCallback((user: Utilisateur) => {
    setSelectedUserId(user.id);
    setDetailDialogOpen(true);
  }, []);

  /** Ouvre le dialogue d'édition d'un utilisateur. */
  const handleEditUser = React.useCallback((user: Utilisateur) => {
    setSelectedUser(user);
    setFormDialogOpen(true);
  }, []);

  // ── Handlers — actions métier ────────────────────────────────────────────

  /**
   * Désactive (soft-delete) un utilisateur après confirmation.
   * @param user - L'utilisateur à désactiver.
   */
  const handleDeleteUser = React.useCallback(
    async (user: Utilisateur) => {
      const confirmed = window.confirm(
        `Désactiver le compte de ${user.displayName || user.email} ?\n\nCette action peut être annulée en réactivant le compte.`
      );
      if (!confirmed) return;

      try {
        await deleteUser(user.id);
        toast.success(`Compte de ${user.displayName || user.email} désactivé`);
        await getAllUsers(usersPagination.page, usersPagination.limit);
        await getStats();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue';
        toast.error(`Impossible de désactiver : ${message}`);
      }
    },
    [deleteUser, getAllUsers, getStats, usersPagination.page, usersPagination.limit]
  );

  /**
   * Génère un code OTP de réinitialisation pour un utilisateur.
   * Affiche le code dans un toast (usage admin seulement).
   * @param user - L'utilisateur concerné.
   */
  const handleResetPassword = React.useCallback(
    async (user: Utilisateur) => {
      try {
        const result = await requestPasswordResetByEmail(user.email, true);
        if (result.success && result.code) {
          toast.info(`Code de réinitialisation pour ${user.email} : ${result.code}`, {
            duration: 15_000,
            description: 'Ce code expire dans 1 heure.',
          });
        } else {
          toast.success(result.message || 'Code généré avec succès');
        }
      } catch {
        toast.error('Erreur lors de la génération du code de réinitialisation');
      }
    },
    [requestPasswordResetByEmail]
  );

  /**
   * Navigue vers la page de gestion des permissions d'un utilisateur.
   * @param user - L'utilisateur dont on veut gérer les permissions.
   */
  const handleViewPermissions = React.useCallback(
    (user: Utilisateur) => {
      navigate(route(PROTECTED_ROUTES.ADMIN.USERS.PERMISSIONS(user.id), { id: user.id }));
    },
    [navigate]
  );

  // ── Actions du tableau ───────────────────────────────────────────────────
  const tableActions = React.useMemo(
    () => ({
      onView: handleViewUser,
      onEdit: isAdmin || isSecretaire ? handleEditUser : undefined,
      onDelete: isAdmin ? handleDeleteUser : undefined,
      onResetPassword: isAdmin ? handleResetPassword : undefined,
      onViewPermissions: isAdmin ? handleViewPermissions : undefined,
    }),
    [
      handleViewUser,
      handleEditUser,
      handleDeleteUser,
      handleResetPassword,
      handleViewPermissions,
      isAdmin,
      isSecretaire,
    ]
  );

  // ── Enrichissements du tableau ───────────────────────────────────────────
  const tableEnrichments = React.useMemo(
    () => ({
      getAvatarUrl: (u: Utilisateur) =>
        getAvatarUrl(u.displayName || `${u.prenom} ${u.nom}`),
      getInitials: (u: Utilisateur) =>
        `${u.prenom?.[0] ?? ''}${u.nom?.[0] ?? ''}`.toUpperCase() || '??',
      getSessionsCount: (u: Utilisateur) => u.sessionsActivesCount ?? 0, // synchrone
      getPermissionsCount: (u: Utilisateur) => u.permissionsCount ?? 0,   // synchrone
      getDisplayName: (u: Utilisateur) =>
        u.displayName || `${u.prenom} ${u.nom}`.trim(),
    }),
    []
  );


  // ── Rendu — erreur critique (liste vide + erreur) ────────────────────────
  if (usersError && allUsers.length === 0) {
    return (
      <div className="p-4 md:p-6">
        <Alert variant="destructive" className="max-w-xl mx-auto mt-12">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="space-y-2">
            <p className="font-semibold">Impossible de charger les utilisateurs</p>
            <p className="text-sm">{usersError}</p>
            <Button size="sm" variant="outline" onClick={handleRefresh} className="mt-2">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // ── Rendu principal ──────────────────────────────────────────────────────
  return (
    <>
      <div className="space-y-6 p-4 md:p-1 pb-12">

        {/* ── En-tête ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Icône */}
            <div className="flex items-center justify-center size-12 rounded-md bg-blue-700 text-white shadow-sm shrink-0">
              <Users className="size-6" />
            </div>

            {/* Titre + métadonnées */}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-3xl font-bold tracking-tight">Utilisateurs</h1>
                <Badge
                  variant="outline"
                  className="text-[10px] h-5 px-1.5 border-0 bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-semibold"
                >
                  {usersPagination.total} compte{usersPagination.total > 1 ? 's' : ''}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <span className="capitalize">
                  {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
                </span>
                <span>·</span>
                <span>Gestion des accès système</span>
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isBusy}
              className="h-8 gap-1.5 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isBusy ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>

            {isAdmin && (
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


            <PageBreadcrumb className="hidden lg:flex" />
          </div>
        </div>

        {/* ── Section statistiques repliable ──────────────────────────── */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setStatsOpen((o) => !o)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <BarChart3 className="h-4 w-4 text-blue-700" />
            Statistiques utilisateurs
            {statsOpen ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>

          <AnimatePresence initial={false}>
            {statsOpen && (
              <motion.div
                key="stats-users"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                {/* Erreur stats non bloquante */}
                {statsError && !stats && (
                  <Alert variant="destructive" className="mb-3">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Statistiques indisponibles — {statsError}
                    </AlertDescription>
                  </Alert>
                )}

                <AuthStatsCards
                  stats={stats}
                  trends={trends ?? undefined}
                  totalUsersSparkline={sparklines?.totalUtilisateursSparkline}
                  totalAdminsSparkline={sparklines?.totalAdminsSparkline}
                  totalSecretairesSparkline={sparklines?.totalSecretairesSparkline}
                  totalMoniteursSparkline={sparklines?.totalMoniteursSparkline}
                  isLoading={isBusy}
                  onCardClick={(cardId) => {
                    const labels: Record<string, string> = {
                      'total-users': 'Tous les utilisateurs actifs',
                      'total-admins': 'Comptes administrateurs',
                      'total-secretaires': 'Comptes secrétaires',
                      'total-moniteurs': 'Comptes moniteurs',
                    };
                    toast.info(labels[cardId] ?? cardId);
                  }}
                  className="w-full"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Tableau des utilisateurs ─────────────────────────────────── */}
        <UsersTable
          users={allUsers}
          variant={isAdmin ? 'admin' : 'secretaire'}
          enrichments={tableEnrichments}
          actions={tableActions}
          enablePagination
          enableToolbar
          defaultPageSize={usersPagination.limit}
          onRefresh={handleRefresh}
          isLoading={isBusy}
          title="Liste des utilisateurs"
          description="Gérez les comptes administrateurs, secrétaires et moniteurs du système"

          onAddClick={handleAddUser}
          showViewAll={false}
          asCard
          emptyMessage="Aucun utilisateur trouvé."
          className="w-full"
        />
      </div>

      {/* ── Dialogue de création / édition ──────────────────────────────── */}
      <UserFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        user={selectedUser}
        onSuccess={handleRefresh}
      />

      {/* ── Dialogue de consultation des détails ────────────────────────── */}
      <UserDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        userId={selectedUserId}
      />
    </>
  );
}