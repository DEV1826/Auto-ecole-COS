'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar';
import { MainNav } from './main-nav';
import { ProjectsNav } from './projects-nav';
import { AccountSwitcher, type Account } from './account-switcher';
import { MAIN_NAV_ITEMS, PROJECTS, type ProjectItem } from './constants';
import { useAuth } from '@/hooks/use.auth';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PUBLIC_ROUTES } from '@/config/routes';
import { LogoutDialog } from '@/features/auth/components/LogoutDialog';
import { UserNav } from './user-nav';
import { type Utilisateur } from '@/types/auth.types';
import { getAvatarUrl } from '@/lib/utils';
import type { Role } from '@/types/enums';

/**
 * Données de compte simulées pour le switcher.
 */
const getMockAccounts = (user: Utilisateur | null): Account[] => {
  if (!user) return [];
  return [
    {
      id: user.id.toString(),
      name: `${user.nom} ${user.prenom}`,
      email: user.email,
      avatarUrl: getAvatarUrl(`${user.nom} ${user.prenom}`) ?? undefined,
      isCurrent: true,
    },
  ];
};

/**
 * Barre latérale principale de l'application.
 * Autonome : récupère les données depuis les stores.
 */
export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();

  // État pour le dialogue de confirmation
  const [showLogoutDialog, setShowLogoutDialog] = React.useState(false);

  // --- Détermination du rôle ---
  const Role: Role = authUser?.role || 'SECRETAIRE';

  const accounts = getMockAccounts(authUser);
  const activeAccount = accounts[0];

  // --- Callbacks ---
  const handleSwitchAccount = (account: Account) => {
    toast.info(`Changement de compte vers "${account.name}"`, {
      description: 'Fonctionnalité à implémenter',
    });
  };

  const handleAddAccount = () => {
    toast.info('Ajouter un compte', { description: 'Fonctionnalité à implémenter' });
  };

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutDialog(false);
    navigate(PUBLIC_ROUTES.AUTH.LOGOUT, {
      state: { fromLogout: true, timestamp: Date.now() },
      replace: true,
    });
  };
  // --- Navigation ---
  const mainNavItems = MAIN_NAV_ITEMS[Role] || [];

  const projects: ProjectItem[] = [
    ...PROJECTS[Role],
    {
      name: 'Se déconnecter',
      url: '',
      onClick: handleLogout,
      icon: LogOut,
      className: 'text-red-600 focus:text-red-600',
    },
  ];
  return (
    <>
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <AccountSwitcher
            accounts={accounts}
            activeAccount={activeAccount}
            onSwitchAccount={handleSwitchAccount}
            onAddAccount={handleAddAccount}
          />
        </SidebarHeader>

        <SidebarContent>
          <MainNav items={mainNavItems} />
          <ProjectsNav projects={projects} title="Mon activité" />
        </SidebarContent>

        {/* NOUVEAU FOOTER : Carte de téléchargement de l'app */}

        <SidebarFooter>
          <UserNav user={authUser} />
        </SidebarFooter>
      </Sidebar>

      {/* Dialogue de confirmation en dehors de la sidebar */}
      <LogoutDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        onConfirm={handleLogoutConfirm}
      />
    </>
  );
}
