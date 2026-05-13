// src/features/admin/pages/AdminUsersListPage.tsx

/**
 * @module features/admin/pages/AdminUsersListPage
 * @description
 * Page principale de la gestion des utilisateurs (administration système).
 * Thème : Bleu (accent blue-700).
 *
 * Layout :
 * ─ En-tête : titre, nombre total d'utilisateurs, date, bouton d'export, bouton d'ajout, breadcrumb
 * ─ Bloc statistiques (`AuthStatsCards`) — repliable
 * ─ Tableau complet (`UsersTable`) avec filtres, pagination, actions
 *
 * Données mockées (à remplacer par des appels API réels).
 * Les appels d’API doivent être filtrés selon les permissions (seul l’admin peut tout voir).
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @example
 * ```tsx
 * <AdminUsersListPage />
 * ```
 */

import * as React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Users, PlusCircle, Download, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AuthStatsCards } from '../components/AuthStatsCards';
import { UsersTable } from '../components/UsersTable';
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb';
import { useAuth } from '@/hooks/use.auth';
import type { Utilisateur } from '@/types/auth.types';
import type { Role, NiveauAcces } from '@/types/enums';
import { getAvatarUrl } from '@/lib';

// ============================================================
// Données mockées (à remplacer par des appels API réels)
// ============================================================

/**
 * Génère une liste aléatoire d’utilisateurs.
 */
function generateMockUsers(count: number = 35): Utilisateur[] {
  const prenoms = ['Super', 'Marie', 'Jean', 'Sophie', 'Marc', 'Julie', 'Pierre', 'Anne', 'Paul', 'Claire'];
  const noms = ['Admin', 'Dupont', 'Martin', 'Durand', 'Ndong', 'Mbarga', 'Ewolo', 'Tchoffo', 'Biyong', 'Ngono'];
  const roles: Role[] = ['ADMIN', 'SECRETAIRE', 'MONITEUR'];
  const now = new Date();

  const users: Utilisateur[] = [];

  for (let i = 1; i <= count; i++) {
    const role = roles[i % roles.length];
    const niveau = role === 'ADMIN' ? (i % 2 === 0 ? 'SUPER_ADMIN' : 'ADMIN') : (i % 3 === 0 ? 'MANAGER' : 'STANDARD');
    const actif = Math.random() > 0.2;
    const createdAt = new Date(now);
    createdAt.setDate(now.getDate() - Math.floor(Math.random() * 180));

    users.push({
      id: i,
      email: `user${i}@cos-autoecole.com`,
      nom: noms[i % noms.length],
      prenom: prenoms[i % prenoms.length],
      role,
      niveau: niveau as NiveauAcces,
      actif,
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
      displayName: `${prenoms[i % prenoms.length]} ${noms[i % noms.length]}`,
    });
  }

  return users;
}

/**
 * Calcule les statistiques agrégées à partir de la liste des utilisateurs.
 */
function computeStats(users: Utilisateur[]) {
  const totalUsers = users.filter(u => u.actif).length;
  const totalAdmins = users.filter(u => u.role === 'ADMIN' && u.actif).length;
  const totalSecretaires = users.filter(u => u.role === 'SECRETAIRE' && u.actif).length;
  const totalMoniteurs = users.filter(u => u.role === 'MONITEUR' && u.actif).length;
  return { totalUsers, totalAdmins, totalSecretaires, totalMoniteurs };
}

/**
 * Génère des tendances fictives (évolution) pour les cartes.
 */
function generateMockTrends() {
  return {
    totalUsers: { value: 8.2, isPositive: true, label: 'vs mois dernier' },
    totalAdmins: { value: 0.0, label: 'stable' },
    totalSecretaires: { value: 1.0, isPositive: true, label: 'ce mois' },
    totalMoniteurs: { value: -2.0, isPositive: false, label: 'vs mois dernier' },
  };
}

/**
 * Génère des sparklines pour l’évolution des métriques.
 */
function generateMockSparklines() {
  return {
    totalUsersSparkline: {
      values: [18, 20, 22, 24, 25, 27, 28, 30, 32, 33, 34, 35],
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
    },
    totalAdminsSparkline: {
      values: [1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
    },
    totalSecretairesSparkline: {
      values: [1, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3],
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
    },
    totalMoniteursSparkline: {
      values: [3, 4, 5, 6, 6, 7, 8, 8, 9, 9, 10, 10],
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
    },
  };
}

// ============================================================
// Page principale
// ============================================================

export default function AdminUsersListPage(): React.JSX.Element {
  const { user } = useAuth();
  const role = user?.role;
  const isAdmin = role === 'ADMIN';

  // Données mockées
  const [users, setUsers] = React.useState<Utilisateur[]>(() => generateMockUsers(35));
  const [stats, setStats] = React.useState(() => computeStats(users));
  const [trends] = React.useState(() => generateMockTrends());
  const [isLoading, setIsLoading] = React.useState(false);
  const [statsOpen, setStatsOpen] = React.useState(true);
  const sparklines = generateMockSparklines();

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    const fresh = generateMockUsers(35);
    setUsers(fresh);
    setStats(computeStats(fresh));
    setIsLoading(false);
    toast.success('Utilisateurs actualisés');
  };

  const handleExport = () => {
    toast.success('Export des utilisateurs (simulé)');
  };

  const handleAddUser = () => {
    toast.info('Formulaire d’ajout d’utilisateur (à connecter)');
  };

  const handleView = (user: Utilisateur) => {
    toast.info(`Voir utilisateur : ${user.displayName} (${user.email})`);
  };

  const handleEdit = (user: Utilisateur) => {
    toast.info(`Modifier utilisateur : ${user.displayName}`);
  };

  const handleResetPassword = (user: Utilisateur) => {
    toast.info(`Réinitialisation du mot de passe pour ${user.email}`);
  };

  const handleViewPermissions = (user: Utilisateur) => {
    toast.info(`Gestion des permissions de ${user.displayName}`);
  };

  const handleDelete = async (user: Utilisateur) => {
    toast.info(`Suppression (désactivation) de ${user.displayName}`);
  };

  // ── Enrichissements pour le tableau ───────────────────────────────────────
  const enrichments = {
    getAvatarUrl: (u: Utilisateur) => getAvatarUrl(u.displayName || `${u.prenom} ${u.nom}`),
    getInitials: (u: Utilisateur) => `${u.prenom?.[0]}${u.nom?.[0]}`.toUpperCase(),
    getSessionsCount: (u: Utilisateur) => Math.floor(Math.random() * 3),
    getPermissionsCount: (u: Utilisateur) => Math.floor(Math.random() * 10),
    getDisplayName: (u: Utilisateur) => u.displayName || `${u.prenom} ${u.nom}`,
  };

  // ── Actions du tableau ───────────────────────────────────────────────────
  const actions = {
    onView: handleView,
    onEdit: isAdmin ? handleEdit : undefined,
    onDelete: isAdmin ? handleDelete : undefined,
    onResetPassword: isAdmin ? handleResetPassword : undefined,
    onViewPermissions: isAdmin ? handleViewPermissions : undefined,
  };

  const variant = isAdmin ? 'admin' : 'secretaire';

  return (
    <div className="space-y-5 p-4 md:p-1 pb-10">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-12 rounded-md bg-blue-700 text-white shadow-sm shrink-0">
            <Users className="size-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Utilisateurs</h1>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <span className="capitalize">
                {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
              </span>
              <span>·</span>
              <Badge
                variant="outline"
                className="text-[10px] h-4 px-1.5 border-0 bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
              >
                {users.length} comptes
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

      {/* Statistiques repliables */}
      <div className="space-y-2">
        <button
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
        {statsOpen && (
          <AuthStatsCards
            totalUsers={stats.totalUsers}
            totalUsersTrend={trends.totalUsers}
            totalUsersSparkline={sparklines.totalUsersSparkline}
            totalAdmins={stats.totalAdmins}
            totalAdminsTrend={trends.totalAdmins}
            totalAdminsSparkline={sparklines.totalAdminsSparkline}
            totalSecretaires={stats.totalSecretaires}
            totalSecretairesTrend={trends.totalSecretaires}
            totalSecretairesSparkline={sparklines.totalSecretairesSparkline}
            totalMoniteurs={stats.totalMoniteurs}
            totalMoniteursTrend={trends.totalMoniteurs}
            totalMoniteursSparkline={sparklines.totalMoniteursSparkline}
            isLoading={isLoading}
            onCardClick={(id) => {
              if (id === 'total-users') toast.info('Tous les utilisateurs actifs');
              else if (id === 'total-admins') toast.info('Administrateurs');
              else if (id === 'total-secretaires') toast.info('Secrétaires');
              else if (id === 'total-moniteurs') toast.info('Moniteurs');
            }}
          />
        )}
      </div>

      {/* Tableau des utilisateurs */}
      <UsersTable
        users={users}
        variant={variant}
        enrichments={enrichments}
        actions={actions}
        enablePagination
        enableToolbar
        defaultPageSize={5}
        maxItems={5}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        title="Gestion des comptes"
        description="Consultez et administrez les utilisateurs du système"
        onAddClick={isAdmin ? handleAddUser : undefined}
        showViewAll={false}
        asCard
        className="w-full"
        emptyMessage="Aucun utilisateur trouvé."
      />
    </div>
  );
}