/**
 * @module common/NotFound
 * @description Page d'erreur 404 (Page non trouvée) avec design moderne, GridShape, deux boutons d'action et sélecteur de thème en bas.
 */

import { Link } from 'react-router-dom';
import { RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { GridShape } from '@/components/layout';
import { PUBLIC_ROUTES } from '@/config/routes';
import { useIsMobile } from '@/hooks/use-mobile';
import { appConfig } from '@/config';

/**
 * Page d'erreur 404 – Page introuvable.
 * Affiche une illustration, un message, un bouton d'actualisation, un bouton de retour à l'accueil,
 * et un sélecteur de thème en bas (responsive).
 *
 * @example
 * ```tsx
 * <NotFound />
 * ```
 */
export function NotFound() {
  const isMobile = useIsMobile();

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <>
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
        {/* Éléments décoratifs (grilles) */}
        <GridShape position="top-right" />
        <GridShape position="bottom-left" />

        {/* Conteneur principal */}
        <div className="relative z-10 mx-auto w-full max-w-60.5 text-center sm:max-w-118">
          <h1 className="mb-8 text-4xl font-bold text-foreground sm:text-4xl xl:text-6xl">ERROR</h1>

          {/* Illustration 404 (thème clair/sombre) */}
          <div className="flex justify-center">
            <img src="/images/error/404.svg" alt="404" className="block dark:hidden sm:w-sm" />
            <img src="/images/error/404-dark.svg" alt="404" className="hidden dark:block sm:w-sm" />
          </div>

          {/* Message d'erreur */}
          <p className="mt-10 text-base text-muted-foreground sm:text-lg">
            Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
          </p>

          {/* Boutons d'action */}
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
            <Button onClick={handleReload} variant="outline" size="lg" className="w-full sm:w-auto">
              <RefreshCcw className="mr-2 size-4" />
              Actualiser
            </Button>
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to={PUBLIC_ROUTES.HOME}>
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
