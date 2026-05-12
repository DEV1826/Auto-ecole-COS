/**
 * @module common/OfflinePage
 * @description Page affichée lorsque l'utilisateur est hors ligne, avec design moderne.
 */

import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { GridShape } from '@/components/layout';
import { PUBLIC_ROUTES } from '@/config/routes';
import { useIsMobile } from '@/hooks/use-mobile';
import { Link } from 'react-router-dom';
import { appConfig } from '@/config/app.config';

export interface OfflinePageProps {
  /** Message personnalisé */
  message?: string;
}

/**
 * Page d'état hors ligne.
 * Affiche une illustration, un message, un bouton pour réessayer, et un sélecteur de thème en bas.
 *
 * @example
 * ```tsx
 * <OfflinePage />
 * ```
 */
export function OfflinePage({ message = 'Vous êtes actuellement hors ligne.' }: OfflinePageProps) {
  const isMobile = useIsMobile();

  const handleRetry = () => {
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
          <h1 className="mb-8 text-4xl font-bold text-foreground sm:text-4xl xl:text-6xl">
            Hors ligne
          </h1>

          {/* Illustration (claire/sombre) – utilisation d'une image générique "offline" */}
          <div className="flex justify-center">
            <img
              src="/images/error/offline.svg"
              alt="Hors ligne"
              className="block dark:hidden sm:w-sm"
            />
            <img
              src="/images/error/offline-dark.svg"
              alt="Hors ligne"
              className="hidden dark:block sm:w-sm"
            />
          </div>

          {/* Message */}
          <p className="mt-10 text-base text-muted-foreground sm:text-lg">{message}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Vérifiez votre connexion réseau et réessayez.
          </p>

          {/* Bouton d'action */}
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
            <Button onClick={handleRetry} size="lg" className="w-full sm:w-auto">
              Réessayer
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
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
