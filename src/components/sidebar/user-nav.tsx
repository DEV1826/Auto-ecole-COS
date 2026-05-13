'use client';

import * as React from 'react';
import { Moon, Sun, Laptop, ChevronsUpDown, Check } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, getAvatarUrl } from '@/lib/utils';
import { PROTECTED_ROUTES, PUBLIC_ROUTES } from '@/config/routes';
import { MainMenuView, SubMenuHeader } from '../header/user-dropdown';
import { LogoutDialog } from '@/features/auth/components/LogoutDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Utilisateur } from '@/types/auth.types';

/**
 * Langues disponibles.
 */
export interface Language {
  /** Code de la langue (ex: 'fr', 'en') */
  code: string;
  /** Nom affiché */
  name: string;
  /** Drapeau ou emoji */
  flag?: string;
}

/**
 * Propriétés du composant UserNav.
 */
export interface UserNavProps {
  /** Utilisateur */
  user: Utilisateur | null;
  /** Fonction de déconnexion */
  onLogout?: () => void;
  /** Fonction pour ouvrir le profil */
  onProfile?: () => void;
  /** Classes CSS supplémentaires */
  className?: string;
}

/**
 * Composant utilisateur en pied de page de la sidebar.
 * Affiche l'avatar et le nom, avec un menu déroulant complet incluant :
 * - Profil, paramètres, facturation, notifications
 * - Sélecteur de thème (clair, sombre, système)
 * - Sélecteur de langue
 * - Aide & support, documentation
 * - Sous‑menu "Télécharger l'app" avec une carte de téléchargement
 * - Déconnexion
 *
 * Le composant s'adapte automatiquement au mode mobile pour afficher les options
 * dans un ordre optimisé.
 *
 * @example
 * ```tsx
 * <UserNav
 *   session={session}
 *   onLogout={logout}
 *   onProfile={goToProfile}
 *   currentLanguage="fr"
 *   onLanguageChange={setLanguage}
 *   unreadCount={3}
 * />
 * ```
 */
export function UserNav({ user, onProfile, className }: UserNavProps) {
  const getInitials = () => {
    if (!user) return '?';
    const parts = user.nom.split(' ');
    const first = parts[0]?.[0] || '';
    const last = parts[1]?.[0] || '';
    return (first + last).toUpperCase();
  };

  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const [activeSubMenu, setActiveSubMenu] = React.useState<'theme' | 'language' | null>(null);
  const [showLogoutDialog, setShowLogoutDialog] = React.useState(false);
  const isMobile = useIsMobile();

  // Réinitialise le sous‑menu à chaque fermeture du dropdown
  React.useEffect(() => {
    if (!open) setActiveSubMenu(null);
  }, [open]);

  // Icône du thème actuel
  const themeIcon =
    theme === 'dark' ? (
      <Moon className="size-4 text-blue-600" />
    ) : theme === 'light' ? (
      <Sun className="size-4 text-blue-600" />
    ) : (
      <Laptop className="size-4 text-blue-600" />
    );

  const handleProfile = () => {
    if (onProfile) onProfile();
    else navigate(PROTECTED_ROUTES.PROFILE);
    setOpen(false);
  };

  const handleLogout = () => {
    setOpen(false);
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutDialog(false);
    navigate(PUBLIC_ROUTES.AUTH.LOGOUT, {
      state: { fromLogout: true, timestamp: Date.now() },
      replace: true,
    });
  };

  return (
    <>
      <SidebarMenu className={className}>
        <SidebarMenuItem>
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-md">
                  <AvatarImage src={getAvatarUrl(`${user?.nom} ${user?.prenom}`)} alt={user?.nom} />
                  <AvatarFallback className="rounded-md">{getInitials()}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user?.nom || 'Invité'}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user?.email || 'Aucun email'}
                  </span>
                </div>

                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-md"
              side={isMobile ? 'bottom' : 'right'}
              align="end"
              sideOffset={4}
            >
              {/* Menu principal */}
              {activeSubMenu === null && (
                <MainMenuView
                  user={user}
                  onProfile={handleProfile}
                  onThemeClick={() => setActiveSubMenu('theme')}
                  onLogout={handleLogout}
                  themeIcon={themeIcon}
                />
              )}

              {/* Sous‑menu Thème */}
              {activeSubMenu === 'theme' && (
                <>
                  <div onClick={(e) => e.preventDefault()}>
                    <SubMenuHeader title="Thème" onBack={() => setActiveSubMenu(null)} />
                  </div>
                  <DropdownMenuGroup>
                    {[
                      {
                        value: 'light',
                        icon: <Sun className="size-4 text-blue-600" />,
                        label: 'Clair',
                      },
                      {
                        value: 'dark',
                        icon: <Moon className="size-4 text-blue-600" />,
                        label: 'Sombre',
                      },
                      {
                        value: 'system',
                        icon: <Laptop className="size-4 text-blue-600" />,
                        label: 'Système',
                      },
                    ].map((item) => (
                      <DropdownMenuItem
                        key={item.value}
                        onClick={() => setTheme(item.value)}
                        className={cn(
                          'gap-3 px-3 py-2.5 cursor-pointer rounded-md',
                          theme === item.value &&
                          'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300'
                        )}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                        {theme === item.value && <Check className="size-4 ml-auto text-blue-600" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Dialogue de confirmation (en dehors du menu) */}
      <LogoutDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        onConfirm={handleLogoutConfirm}
      />
    </>
  );
}
