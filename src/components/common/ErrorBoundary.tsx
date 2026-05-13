/**
 * @module common/ErrorBoundary
 * @description Gestion des erreurs React avec affichage technique en développement.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { GridShape } from '@/components/layout';
import { cn } from '@/lib/utils';
import { Home, RefreshCcw } from 'lucide-react';
import { appConfig } from '@/config';

interface ErrorBoundaryProps {
  /** Contenu enfant */
  children: React.ReactNode;
  /** Fallback personnalisé */
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Composant ErrorBoundary qui capture les erreurs de rendu.
 * Affiche une page d'erreur élégante avec détails techniques en mode développement.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    // Envoyer l'erreur à un service de monitoring
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDebug = import.meta.env.VITE_DEBUG && this.state.error;
      const error = this.state.error;

      return (
        <>
          <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4 sm:p-6 md:p-8">
            {/* Éléments décoratifs */}
            <GridShape />
            <div className="relative w-full max-w-6xl mx-auto">
              {/* Layout conditionnel : deux colonnes en debug, une seule sinon */}
              <div
                className={cn('flex flex-col gap-6 md:gap-8', isDebug && 'lg:flex-row lg:gap-12')}
              >
                {/* Colonne gauche / principale : message utilisateur */}
                <div
                  className={cn('flex flex-col items-center text-center', isDebug && 'lg:flex-1')}
                >
                  <h1 className="mb-4 text-3xl font-bold text-gray-800 dark:text-white/90 sm:text-4xl xl:text-5xl">
                    Oups !
                  </h1>
                  <div className="mb-6 flex justify-center">
                    <img
                      src="/images/error/500.svg"
                      alt="Erreur serveur"
                      className="block h-16 w-auto dark:hidden sm:h-20"
                    />
                    <img
                      src="/images/error/500-dark.svg"
                      alt="Erreur serveur"
                      className="hidden h-16 w-auto dark:block sm:h-20"
                    />
                  </div>
                  <p className="mb-6 text-sm text-gray-700 dark:text-gray-400 sm:text-base md:text-lg">
                    Une erreur inattendue s'est produite. Notre équipe technique a été notifiée.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <Button onClick={this.handleReset} size="default" variant="default">
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      Recharger
                    </Button>
                    <Button variant="outline" size="default" asChild>
                      <Link to="/">
                        <Home className="mr-2 h-4 w-4" />
                        Accueil
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Colonne droite : détails techniques (uniquement en debug) */}
                {isDebug && (
                  <div className="w-full lg:flex-1">
                    <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 sm:p-4 text-left">
                      <h2 className="mb-2 font-mono text-xs font-semibold text-destructive sm:text-sm">
                        Détails techniques
                      </h2>
                      <div className="overflow-x-auto rounded bg-black/80 p-2 sm:p-3">
                        <pre className="whitespace-pre-wrap wrap-break-word font-mono text-[10px] text-red-400 sm:text-xs max-h-48 sm:max-h-64 md:max-h-80 overflow-y-auto">
                          {error?.message}
                          {'\n\n'}
                          {error?.stack}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Footer léger */}
            <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} {appConfig.name}. Tous droits réservés.
            </p>
          </div>
        </>
      );
    }

    return this.props.children;
  }
}
