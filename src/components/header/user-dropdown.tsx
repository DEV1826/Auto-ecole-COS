'use client';

/**
 * @module features/auth/components/UserDropdown
 * @description
 * Menu déroulant utilisateur pour les comptes connectés  Auto-École COS.
 *
 * ## Fonctionnement
 * - Niveau principal : avatar, nom, email, rôle, puis les actions habituelles
 *   (profil, thème, langue, déconnexion).
 * - **Sous‑menus intégrés** : lorsque l’utilisateur clique sur «Thème» ou «Langue»,
 *   le contenu du dropdown bascule vers une vue secondaire listant les options,
 *   avec un bouton de retour (flèche). Aucun `DropdownMenuSub` ni popover
 *   supplémentaire n’est utilisé.
 * - Un clic en dehors du dropdown referme automatiquement le menu et réinitialise
 *   le niveau courant.
 *
 * ## Design
 * - Largeur fixe `w-72` (288px)
 * - Coins `rounded-md`, bordures émeraude légères
 * - Animation fluide lors du changement de niveau
 * - Thème émeraude cohérent, mode sombre pris en charge
 *
 * @see {@link useTheme} pour la gestion du thème
 * @see {@link LogoutDialog}
 * @see {@link PUBLIC_ROUTES.AUTH.LOGOUT}
 *
 * @author Stive Junior
 * @version 2.0.0
 */

import * as React from 'react';
import {
  UserIcon,
  LogOut,
  Moon,
  Sun,
  Laptop,
  ChevronsUpDown,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, getAvatarUrl } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { PROTECTED_ROUTES, PUBLIC_ROUTES } from '@/config/routes';
import { LogoutDialog } from '@/features/auth/components/LogoutDialog';
import type { Utilisateur } from '@/types/auth.types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface UserDropdownProps {
  /** Utilisateur (contient nom, email, avatar…) */
  user: Utilisateur | null;
  /** Callback pour afficher le profil (défaut : navigation vers `/profile`) */
  onProfile?: () => void;
  /** Classes CSS additionnelles */
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// En‑tête de sous‑menu
// ─────────────────────────────────────────────────────────────────────────────

export interface SubMenuHeaderProps {
  title: string;
  onBack: () => void;
}

/**
 * En‑tête d’une vue secondaire avec flèche de retour.
 */
export function SubMenuHeader({ title, onBack }: SubMenuHeaderProps) {
  return (
    <>
      <DropdownMenuLabel
        className="font-normal p-3 flex items-center gap-3 cursor-pointer"
        onClick={onBack}
      >
        <ArrowLeft className="size-4 text-blue-600" />
        <span className="text-sm font-semibold">{title}</span>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Menu principal
// ─────────────────────────────────────────────────────────────────────────────

export interface MainMenuProps {
  user: Utilisateur | null;
  onProfile: () => void;
  onThemeClick: () => void;
  onLogout: () => void;
  themeIcon: React.ReactNode;
}

/**
 * Vue principale du menu (actions de premier niveau).
 * @internal
 */
export function MainMenuView({
  user,
  onProfile,
  onThemeClick,
  onLogout,
  themeIcon,
}: MainMenuProps) {
  const firstName = user?.nom || '';
  const lastName = user?.prenom || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'Utilisateur';
  const email = user?.email;
  const role = user?.role;

  const getInitials = () => {
    if (!firstName && !lastName) return '?';
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <>
      {/* Bloc utilisateur */}
      <DropdownMenuLabel className="font-normal p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 rounded-md">
            <AvatarImage src={getAvatarUrl(fullName)} alt={fullName} />
            <AvatarFallback className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-lg font-semibold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-bold text-foreground">{fullName}</span>
            <span className="text-xs text-muted-foreground truncate">{email}</span>
            <span className="text-[10px] text-blue-700 dark:text-blue-400 font-medium capitalize mt-0.5">
              {role?.toLowerCase() || 'Invité'}
            </span>
          </div>
        </div>
      </DropdownMenuLabel>

      <DropdownMenuSeparator />

      {/* Actions principales */}
      <DropdownMenuGroup>
        <DropdownMenuItem onClick={onProfile} className="gap-3 px-3 py-2.5 cursor-pointer">
          <UserIcon className="size-4" />
          <span>Mon profil</span>
        </DropdownMenuItem>
      </DropdownMenuGroup>

      {/* Thème et Langue */}
      <DropdownMenuGroup>
        <DropdownMenuItem
          onClick={(e) => {
            e.preventDefault();
            onThemeClick();
          }}
          className="gap-3 px-3 py-2.5 cursor-pointer justify-between"
        >
          <div className="flex items-center gap-3">
            {themeIcon}
            <span>Thème</span>
          </div>
          <span className="text-xs text-muted-foreground">›</span>
        </DropdownMenuItem>
      </DropdownMenuGroup>

      <DropdownMenuSeparator />

      {/* Déconnexion */}
      <DropdownMenuItem
        onClick={onLogout}
        className="gap-3 px-3 py-2.5 cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400"
      >
        <LogOut className="size-4" />
        <span>Se déconnecter</span>
      </DropdownMenuItem>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal UserDropdown
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Menu utilisateur connecté avec navigation interne pour thème et langue.
 *
 * @example
 * ```tsx
 * <UserDropdown
 *   session={session}
 *   onLogout={handleLogout}
 *   currentLanguage="fr"
 *   onLanguageChange={setLanguage}
 * />
 * ```
 */
export function UserDropdown({ user, onProfile, className }: UserDropdownProps) {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const [activeSubMenu, setActiveSubMenu] = React.useState<'theme' | 'language' | null>(null);
  const [showLogoutDialog, setShowLogoutDialog] = React.useState(false);

  // Réinitialise le sous‑menu à chaque fermeture du dropdown
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className={cn('h-auto gap-2 rounded-md border p-1.5', className)}>
            <Avatar className="size-8">
              <AvatarImage
                src={getAvatarUrl(`${user?.nom} ${user?.prenom}`)}
                alt={user?.nom ?? ''}
              />
              <AvatarFallback className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 text-xs font-semibold">
                {user?.nom?.charAt(0)}
                {user?.nom?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block text-left text-sm leading-tight">
              <div className="truncate font-medium max-w-30">
                {user?.nom} {user?.prenom}
              </div>
              <div className="truncate text-xs text-muted-foreground max-w-30 capitalize">
                {user?.role?.toLowerCase() || 'Invité'}
              </div>
            </div>
            <ChevronsUpDown className="size-3 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-72 rounded-md shadow-lg dark:border-blue-900/30 p-1 max-h-[85vh] overflow-y-auto"
          align="end"
          sideOffset={8}
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

      {/* Dialogue de confirmation (en dehors du menu) */}
      <LogoutDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        onConfirm={handleLogoutConfirm}
      />
    </>
  );
}
