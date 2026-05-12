/**
 * @module common/Maintenance/MaintenancePage
 * @description Page de maintenance élégante, sans Card, avec images SVG et GridShape.
 */

import * as React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CountdownTimer } from './CountdownTimer';
import { GridShape } from '@/components/layout';
import { appConfig } from '@/config';

export interface MaintenancePageProps {
  /** Date de fin estimée (timestamp millisecondes) – défaut +2 jours */
  estimatedEndTime?: number;
  /** Message personnalisé */
  message?: string;
  /** Titre */
  title?: string;

  /** Liens sociaux personnalisés */
  socialLinks?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };
}

/**
 * Page de maintenance avec compte à rebours et formulaire d'inscription autonome.
 * Intègre GridShape, images SVG (500.svg) et une mise en page responsive.
 */
export function Maintenance({
  estimatedEndTime = Date.now() + 2 * 24 * 60 * 60 * 1000,

  socialLinks = {
    twitter: 'https://twitter.com/ Auto-École COS',
    facebook: 'https://facebook.com/ Auto-École COS',
    instagram: 'https://instagram.com/ Auto-École COS',
    linkedin: 'https://linkedin.com/company/ Auto-École COS',
  },
}: MaintenancePageProps) {
  const [isCompleted, setIsCompleted] = React.useState(false);

  const handleCountdownComplete = () => {
    setIsCompleted(true);
  };

  return (
    <>
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
        {/* Éléments décoratifs */}
        <GridShape />
        <GridShape position="bottom-left" />

        <div className="relative z-10 mx-auto w-full max-w-2xl">
          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <img
              src="/images/error/500.svg"
              alt="Erreur serveur"
              className="block h-20 w-auto dark:hidden"
            />
            <img
              src="/images/error/500-dark.svg"
              alt="Erreur serveur"
              className="hidden h-20 w-auto dark:block"
            />
          </div>

          {/* Titre et message */}
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-bold text-foreground xl:text-5xl">
              Maintenance en cours
            </h1>
            <div className="mb-6 flex justify-center">
              <img
                src="/images/error/500.svg"
                alt="Maintenance"
                className="block h-24 w-auto dark:hidden"
              />
              <img
                src="/images/error/500-dark.svg"
                alt="Maintenance"
                className="hidden h-24 w-auto dark:block"
              />
            </div>
            <p className="mb-8 text-base text-muted-foreground sm:text-lg">
              Notre site est actuellement en maintenance. Nous revenons très bientôt !
            </p>
          </div>

          {/* Compte à rebours */}
          {!isCompleted && (
            <div className="mb-10 space-y-4 text-center">
              <CountdownTimer targetDate={estimatedEndTime} onComplete={handleCountdownComplete} />
              <p className="text-sm text-muted-foreground">
                avant la fin de la maintenance estimée
              </p>
            </div>
          )}

          {/* Formulaire de notification */}
          <div className="mb-10 space-y-4 text-center">
            <p className="text-sm">
              {isCompleted
                ? "La maintenance est terminée ! L'application va redémarrer."
                : "Soyez averti dès le retour de l'application :"}
            </p>

            {isCompleted && (
              <Button asChild size="lg" className="mt-4">
                <Link to="/">Accéder à l'application</Link>
              </Button>
            )}
          </div>

          {/* Liens sociaux */}
          {/* Liens sociaux */}
          <div className="space-y-2">
            <p className="text-center text-xs text-muted-foreground">Suivez-nous</p>
            <div className="flex justify-center gap-4">
              {socialLinks.twitter && (
                <a
                  href={socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              )}
              {socialLinks.facebook && (
                <a
                  href={socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879v-6.99h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.99C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                </a>
              )}
              {socialLinks.instagram && (
                <a
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* Footer */}
          <p className="mt-10 text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {appConfig.name}. Tous droits réservés.
          </p>
        </div>
      </div>
    </>
  );
}
