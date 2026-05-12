/**
 * @module common/Unauthorized
 * @description Page d'erreur 403 (Accès non autorisé) avec design moderne.
 */

import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { GridShape } from '@/components/layout';
import { PUBLIC_ROUTES } from '@/config/routes';
import { useIsMobile } from '@/hooks/use-mobile';
import { appConfig } from '@/config';

export interface UnauthorizedProps {
  /** Message personnalisé */
  message?: string;
  /** Redirection personnalisée */
  redirectTo?: string;
}

/**
 * Page d'erreur 403 – Accès non autorisé.
 * Affiche une illustration, un message, des boutons d'action, et un sélecteur de thème en bas.
 *
 * @example
 * ```tsx
 * <Unauthorized message="Vous n'avez pas les droits nécessaires." />
 * ```
 */
export function Unauthorized({
  message = "Vous n'avez pas les droits nécessaires pour accéder à cette page.",
  redirectTo = PUBLIC_ROUTES.HOME,
}: UnauthorizedProps) {
  const isMobile = useIsMobile();

  return (
    <>
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
        {/* Éléments décoratifs (grilles) */}
        <GridShape position="top-right" />
        <GridShape position="bottom-left" />

        {/* Conteneur principal */}
        <div className="relative z-10 mx-auto w-full max-w-60.5 text-center sm:max-w-118">
          <h1 className="mb-8 text-4xl font-bold text-gray-800 dark:text-white/90 xl:text-5xl">
            Oups !
          </h1>
          {/* Illustration d'erreur 403 (claire/sombre) */}
          <div className="flex justify-center">
            <img
              src="/images/error/403.svg"
              alt="Accès non autorisé"
              className="block dark:hidden sm:w-sm"
            />
            <img
              src="/images/error/403-dark.svg"
              alt="Accès non autorisé"
              className="hidden dark:block sm:w-sm"
            />
          </div>

          {/* Message d'erreur */}
          <p className="mt-10 text-base text-muted-foreground sm:text-lg">{message}</p>

          {/* Boutons d'action */}
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to={redirectTo}>
                <Home className="mr-2 size-4" />
                Retour à l'accueil
              </Link>
            </Button>
          </div>
        </div>

        {/* Footer avec copyright et sélecteur de thème */}
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center justify-center gap-2 text-center text-xs text-muted-foreground sm:gap-4">
          <p>
            &copy; {new Date().getFullYear()} {appConfig.name}. Tous droits réservés.
          </p>
          <Separator orientation="vertical" className="hidden h-6 sm:inline" />
          <div className="flex items-center gap-4">
            <ThemeToggle
              variant={isMobile ? 'icon-only' : 'dropdown'}
              showText={!isMobile}
              size="xs"
              rounded="full"
            />
          </div>
        </div>
      </div>
    </>
  );
}
