/**
 * @module header/header
 * @description Header principal de l'application – deux variantes :
 * - 'app' : pour les pages authentifiées (avec SidebarTrigger, recherche, notifications, user dropdown)
 * - 'landing' : pour les pages publiques (navigation, avatar dropdown avec thème/langue, actions)
 *
 * Le composant est autonome : il récupère les données depuis les stores (auth, notifications, langue).
 */

'use client';

import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, ChevronsUpDown, Sun, Moon, Monitor } from 'lucide-react';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { SearchCommand, type SearchResult } from './search-command';
import { UserDropdown } from './user-dropdown';
import { useAuth } from '@/hooks/use.auth';
import { PUBLIC_ROUTES, PROTECTED_ROUTES } from '@/config/routes';
import { cn, getAvatarUrl } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTheme } from 'next-themes';
import { appConfig } from '@/config';

// ============================================================
// INTERFACES ET TYPES
// ============================================================

export interface HeaderProps {
  /** Variante : 'app' (authentifié) ou 'landing' (public) */
  variant?: 'app' | 'landing';
  /** Classes supplémentaires */
  className?: string;
}

export interface UserMenuDropdownProps {
  /** Élément enfant qui sert de déclencheur (généralement un bouton) */
  children: React.ReactNode;
  /** Thème actuel : 'light', 'dark', 'system' */
  theme?: string;
  /** Callback pour changer le thème */
  onThemeChange: (theme: string) => void;
  /** Fonction retournant l'URL de l'avatar (ou chaîne) */
  getAvatarUrl: (name: string) => string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Menu déroulant utilisateur avec thème émeraude et design optimisé.
 */
export const UserMenuDropdown = React.memo(
  ({ children, theme, onThemeChange, getAvatarUrl }: UserMenuDropdownProps) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-70 rounded-md shadow-lg  dark:border-blue-900/30 p-1 max-h-[85vh] overflow-y-auto "
          align="end"
          sideOffset={2}
        >
          {/* En-tête utilisateur */}
          <DropdownMenuLabel className="p-3 pb-2">
            <div className="flex items-center gap-3">
              <Avatar className="size-12 rounded-md ">
                <AvatarImage src={getAvatarUrl('Visiteur')} alt="Avatar visiteur" />
                <AvatarFallback className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 text-lg font-semibold">
                  V
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold text-foreground">Bienvenue</span>
                <span className="text-xs text-muted-foreground">
                  Connectez-vous pour accéder à votre espace.
                </span>
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {/* Section Mon compte */}
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-3 py-1.5">
              Mon compte
            </DropdownMenuLabel>
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link to={PUBLIC_ROUTES.AUTH.LOGIN} className="gap-3 px-3 py-2 rounded-md">
                <LogIn className="size-4" />
                <span>Connexion</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          {/* Section Préférences */}
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-3 py-1.5">
              Préférences
            </DropdownMenuLabel>

            {/* Thème */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="rounded-md px-3 py-2 data-[state=open]:bg-blue-50 dark:data-[state=open]:bg-blue-950/30 focus:bg-blue-50 dark:focus:bg-blue-950/30">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? (
                    <Moon className="size-4 text-blue-600" />
                  ) : theme === 'light' ? (
                    <Sun className="size-4 text-blue-600" />
                  ) : (
                    <Monitor className="size-4 text-blue-600" />
                  )}
                  <span>Thème</span>
                </div>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="rounded-md border-blue-200 dark:border-blue-900/50 p-1 min-w-40">
                  <DropdownMenuRadioGroup value={theme} onValueChange={onThemeChange}>
                    <DropdownMenuRadioItem
                      value="light"
                      className="gap-3 cursor-pointer rounded-md focus:bg-blue-50 dark:focus:bg-blue-950/30"
                    >
                      <Sun className="size-4 text-blue-600" />
                      Clair
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="dark"
                      className="gap-3 cursor-pointer rounded-md focus:bg-blue-50 dark:focus:bg-blue-950/30"
                    >
                      <Moon className="size-4 text-blue-600" />
                      Sombre
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="system"
                      className="gap-3 cursor-pointer rounded-md focus:bg-blue-50 dark:focus:bg-blue-950/30"
                    >
                      <Monitor className="size-4 text-blue-600" />
                      Système
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
);

/**
 * Header principal de l'application.
 * - Variante 'app' : affiche SidebarTrigger, barre de recherche, notifications, dropdown utilisateur.
 * - Variante 'landing' : affiche navigation, avatar dropdown avec thème/langue/actions.
 */
export function Header({ variant = 'app', className }: HeaderProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // Stores
  const { isAuthenticated, user } = useAuth();
  const { theme, setTheme } = useTheme();

  const handleProfile = () => {
    if (isAuthenticated) {
      navigate(PROTECTED_ROUTES.PROFILE);
    } else {
      navigate(PUBLIC_ROUTES.AUTH.LOGIN);
    }
  };

  const handleThemeChange = (value: string) => {
    setTheme(value as 'light' | 'dark' | 'system');
  };

  // Recherche avec filtrage réel
  const handleSearch = async (query: string): Promise<SearchResult[]> => {
    // Données mock de recherche
    const allSearchData: SearchResult[] = [
      {
        id: '1',
        title: 'Consultation Dr. Martin',
        description: '15 avril 2025 à 14h00',
        type: 'appointment',
        url: '/appointments/1',
      },
      {
        id: '2',
        title: 'Nana Junior',
        description: 'Patient, âge 45',
        type: 'patient',
        url: '/patients/2',
      },
      {
        id: '3',
        title: 'Dr. Sophie Laurent',
        description: 'Cardiologue',
        type: 'doctor',
        url: '/doctors/3',
      },
      {
        id: '4',
        title: 'Visite de contrôle',
        description: '20 avril 2025 à 10h00',
        type: 'appointment',
        url: '/appointments/4',
      },
      {
        id: '5',
        title: 'Pierre Dupont',
        description: 'Patient, âge 58',
        type: 'patient',
        url: '/patients/5',
      },
      {
        id: '6',
        title: 'Paracétamol 500mg',
        description: 'Médicament anti-douleur',
        type: 'medication',
        url: '/medications/6',
      },
    ];

    const lowerQuery = query.toLowerCase().trim();

    if (!lowerQuery) {
      return [];
    }

    // Filtrer les résultats basé sur la query
    const filtered = allSearchData.filter((item) => {
      const titleMatch = item.title.toLowerCase().includes(lowerQuery);
      const descriptionMatch = item.description?.toLowerCase().includes(lowerQuery) || false;
      return titleMatch || descriptionMatch;
    });

    console.log(`Recherche: "${query}" → ${filtered.length} résultat(s)`);
    return filtered;
  };

  const getRecent = async (): Promise<SearchResult[]> => [
    {
      id: 'rec-1',
      title: 'Consultation Dr. Martin',
      description: 'Récent',
      type: 'appointment',
      url: '/appointments/1',
    },
  ];

  const getFavorites = async (): Promise<SearchResult[]> => [
    {
      id: 'fav-1',
      title: 'Dr. Sophie Laurent',
      description: 'Favori',
      type: 'doctor',
      url: '/doctors/5',
    },
  ];

  const logoSrc = '/icons/hero.png';

  // ============================================================
  // VARIANTE : APPLICATION (AUTHENTIFIÉE)
  // ============================================================
  if (variant === 'app') {
    return (
      <header
        className={cn(
          'sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60',
          className
        )}
      >
        <div className="flex h-14 items-center justify-between px-4 md:px-2">
          {/* Gauche */}
          <div className="flex items-center gap-2 px-2">
            <SidebarTrigger className="lg:flex -ml-1" />

            {/* Séparateur : On s'assure qu'il ne prend pas toute la hauteur par erreur */}

            {!isMobile && (
              <>
                <div className="flex h-full items-center">
                  <Separator orientation="vertical" className="h-6 mx-1" />
                </div>
                <SearchCommand
                  onSearch={handleSearch}
                  onGetRecent={getRecent}
                  onGetFavorites={getFavorites}
                  placeholder="Rechercher..."
                  showSuggestions
                  className="hidden lg:flex"
                />
              </>
            )}
          </div>

          {/* Logo mobile */}
          {isMobile && (
            <Link to={PUBLIC_ROUTES.HOME} className="font-semibold">
              <img src={logoSrc} alt={appConfig.name} className="h-6 w-auto" />
            </Link>
          )}

          {/* Droite */}
          <div className="flex items-center gap-2">
            {!isMobile && <ThemeToggle variant="icon-only" />}
            <UserDropdown user={user} onProfile={handleProfile} />
          </div>
        </div>
      </header>
    );
  }

  // ============================================================
  // VARIANTE : LANDING PAGE (PUBLIQUE)
  // ============================================================

  const AvatarTriggerDesktop = (
    <Button
      variant="ghost"
      className="h-auto gap-2  rounded-md border border-primary/10 p-1.5 bg-muted"
    >
      <Avatar className="size-8">
        <AvatarImage src={getAvatarUrl('Visiteur')} />
        <AvatarFallback className="bg-primary/10 text-primary text-xs">V</AvatarFallback>
      </Avatar>
      {'Compte'}
      <ChevronsUpDown className="size-3 text-muted-foreground" />
    </Button>
  );

  return (
    <header
      className={cn('sticky top-0 z-50 bg-blue-50/70 p-10 dark:bg-blue-50/5 w-full', className)}
    >
      <div className="flex h-14 items-center justify-between px-4 md:px-6 lg:px-8">
        {/* Logo (mobile et desktop) */}
        <Link to={PUBLIC_ROUTES.HOME} className="font-semibold text-lg">
          <img src={logoSrc} alt={appConfig.name} className="size-30" />
        </Link>

        {/* Actions droite */}
        <div className="flex items-center gap-2">
          {!isMobile && (
            <UserMenuDropdown
              theme={theme}
              onThemeChange={handleThemeChange}
              getAvatarUrl={getAvatarUrl}
            >
              {AvatarTriggerDesktop}
            </UserMenuDropdown>
          )}
        </div>
      </div>
    </header>
  );
}
