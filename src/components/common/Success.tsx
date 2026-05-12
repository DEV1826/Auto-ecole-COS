'use client';

/**
 * @module common/Success
 * @description Page de confirmation de succès avec animations fluides.
 *
 * ## Fonctionnalités
 * - Animation d'entrée en fondu (fade-in) pour le conteneur.
 * - Illustration de succès avec apparition progressive.
 * - Titre et message animés.
 * - Boutons d'action au design émeraude cohérent.
 * - Grilles décoratives animées en arrière-plan.
 * - Footer discret intégré.
 *
 * ## Utilisation
 * ```tsx
 * <Success
 *   title="Déconnexion réussie"
 *   message="Vous avez été déconnecté avec succès."
 *   buttonText="Retour à l'accueil"
 *   redirectTo="/"
 * />
 * ```
 *
 * @see {@link WelcomeSplash} pour un écran de bienvenue temporaire
 * @see {@link PUBLIC_ROUTES} pour les routes
 *
 * @author Stive Junior
 * @version 2.0.0
 */

import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { GridShape } from '@/components/layout';
import { PUBLIC_ROUTES } from '@/config/routes';
import { cn } from '@/lib/utils';
import { Footer } from '../footer';

export interface SuccessProps {
  /** Titre de la page */
  title?: string;
  /** Message de succès (texte ou JSX) */
  message?: React.ReactNode;
  /** Texte du bouton principal */
  buttonText?: string;
  /** Route de redirection du bouton principal */
  redirectTo?: string;
  /** Afficher un bouton "Retour à l'accueil" supplémentaire */
  showHomeButton?: boolean;
}

/**
 * Page de succès animée.
 *
 * Affiche une illustration légère (dark/light), un titre et un message,
 * ainsi que des boutons d'action. Le tout apparaît avec une animation douce.
 */
export function Success({
  title = 'Opération réussie',
  message = 'Votre demande a été traitée avec succès.',
  buttonText = 'Continuer',
  redirectTo = '/dashboard',
  showHomeButton = true,
}: SuccessProps) {
  return (
    <>
      <div className="relative flex min-h-screen bg-blue-50/70  dark:bg-blue-50/5 flex-col items-center justify-center overflow-hidden p-6">
        {/* Grilles décoratives animées */}
        <GridShape position="top-right" />
        <GridShape position="bottom-left" />

        {/* Conteneur principal avec animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative z-10 mx-auto w-full max-w-60.5 text-center sm:max-w-118"
        >
          {/* Titre animé */}
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl md:text-4xl"
          >
            {title}
          </motion.h1>

          {/* Illustration avec effet d'échelle */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2, type: 'spring', stiffness: 200 }}
            className="flex justify-center "
          >
            <img
              src="/images/error/success.svg"
              alt="Succès"
              className="block w-full dark:hidden"
            />
            <img
              src="/images/error/success-dark.svg"
              alt="Succès"
              className="hidden w-full dark:block"
            />
          </motion.div>

          {/* Message */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="mb-8 text-base text-muted-foreground sm:text-lg"
          >
            {typeof message === 'string' ? <p>{message}</p> : message}
          </motion.div>

          {/* Boutons d'action */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="flex w-full flex-col justify-center gap-3 sm:flex-row sm:gap-4"
          >
            <Button
              asChild
              size="lg"
              className={cn(
                'rounded-xs h-10 w-full sm:w-auto text-base font-semibold text-white',
                'bg-blue-700! hover:bg-blue-900'
              )}
            >
              <Link to={redirectTo}>{buttonText}</Link>
            </Button>

            {showHomeButton && (
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-xs h-10 text-base font-semibold w-full sm:w-auto"
              >
                <Link to={PUBLIC_ROUTES.HOME}>
                  <Home className="mr-2 size-4" />
                  Retour à l&apos;accueil
                </Link>
              </Button>
            )}
          </motion.div>
        </motion.div>

        {/* Footer avec copyright et sélecteur de thème */}
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center justify-center gap-2 text-center text-xs text-muted-foreground sm:gap-4">
          <Footer variant="form" />
        </div>
      </div>
    </>
  );
}
