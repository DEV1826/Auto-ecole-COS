/**
 * @module common/Status
 * @description Template générique pour afficher des pages de statut HTTP (500, 503, etc.) avec design moderne.
 */

import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { GridShape } from '@/components/layout';
import { PUBLIC_ROUTES } from '@/config/routes';
import { useIsMobile } from '@/hooks/use-mobile';
import { appConfig } from '@/config/app.config';

export interface StatusProps {
  /** Code HTTP (ex: 500, 503, etc.) */
  code: number;
  /** Description personnalisée */
  description?: string;
  /** Redirection par défaut */
  redirectTo?: string;
  /** Texte du bouton */
  buttonText?: string;
}

/**
 * Page générique pour afficher un code de statut HTTP (ex: 500, 503, 429).
 * Affiche une illustration, un message, un bouton d'action, et un sélecteur de thème en bas.
 *
 * @example
 * ```tsx
 * <Status code={500} description="Le serveur a rencontré une erreur." />
 * ```
 */
export function Status({
  code,
  description = "Une erreur s'est produite.",
  redirectTo = PUBLIC_ROUTES.HOME,
  buttonText = "Retour à l'accueil",
}: StatusProps) {
  const isMobile = useIsMobile();

  // Utiliser une illustration générique selon le code (500, 503, etc.)
  const getIllustration = () => {
    if (code === 500) {
      return {
        light: '/images/error/500.svg',
        dark: '/images/error/500-dark.svg',
        alt: 'Erreur serveur',
      };
    }
    if (code === 503) {
      return {
        light: '/images/error/503.svg',
        dark: '/images/error/503-dark.svg',
        alt: 'Service indisponible',
      };
    }
    // Illustration par défaut (404 ou autre)
    return {
      light: '/images/error/404.svg',
      dark: '/images/error/404-dark.svg',
      alt: 'Erreur',
    };
  };

  const illustration = getIllustration();

  return (
    <>
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
        {/* Éléments décoratifs (grilles) */}
        <GridShape position="top-right" />
        <GridShape position="bottom-left" />

        {/* Conteneur principal */}
        <div className="relative z-10 mx-auto w-full max-w-60.5 text-center sm:max-w-118">
          <h1 className="mb-8 text-4xl font-bold text-foreground sm:text-4xl xl:text-6xl">
            {code}
          </h1>

          {/* Illustration (claire/sombre) */}
          <div className="flex justify-center">
            <img
              src={illustration.light}
              alt={illustration.alt}
              className="block dark:hidden sm:w-sm"
            />
            <img
              src={illustration.dark}
              alt={illustration.alt}
              className="hidden dark:block sm:w-sm"
            />
          </div>

          {/* Message d'erreur */}
          <p className="mt-10 text-base text-muted-foreground sm:text-lg">{description}</p>

          {/* Bouton d'action */}
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to={redirectTo}>
                <Home className="mr-2 size-4" />
                {buttonText}
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
