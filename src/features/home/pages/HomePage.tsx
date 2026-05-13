// src/features/home/pages/HomePage.tsx

/**
 * @module features/home/pages/HomePage
 * @description
 * Page d’accueil publique de l’application Auto‑école COS.
 * Présente un carrousel hero, une brève description et un bouton d’appel à l’action
 * vers la page de connexion. La page est conçue pour ne pas défiler (hauteur de la viewport)
 * et utilise le layout public.
 *
 * @example
 * ```tsx
 * <Route path={PUBLIC_ROUTES.HOME} element={<HomePage />} />
 * ```
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogIn, CarFront } from 'lucide-react';
import { PUBLIC_ROUTES } from '@/config/routes';
import { HeroCarousel } from '@/features/home/components';
import { GridShape } from '@/components/layout';

/**
 * Page d’accueil publique.
 * - Affiche un carrousel d’images attractif
 * - Titre et description de l’auto‑école
 * - Bouton « Se connecter » pour accéder à l’application
 */
export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-8 md:px-6 my-auto ">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Colonne droite : texte + bouton */}
          <div className="flex flex-1 flex-col items-center text-center lg:items-start lg:text-left">
            <div className="flex items-center gap-2 text-primary">
              <CarFront className="h-8 w-8" />
              <span className="text-sm font-semibold uppercase tracking-wide">COS Auto‑École</span>
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              La conduite <span className="text-primary">simplifiée</span>
            </h1>
            <p className="mt-4 max-w-md text-base text-muted-foreground">
              Gérez vos candidats, planning, paiements et examens en un seul endroit. Application
              intuitive pour administrateurs, secrétaires et moniteurs.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-6 h-12 px-8 text-base rounded-md bg-blue-500 hover:bg-blue-600! text-white dark:bg-blue-900 shadow-md"
            >
              <Link to={PUBLIC_ROUTES.AUTH.LOGIN}>
                <LogIn className="mr-2 h-5 w-5" />
                Se connecter
              </Link>
            </Button>
            <p className="mt-4 text-xs text-muted-foreground">
              Accès réservé au personnel de l’auto‑école.
            </p>
          </div>

          {/* Colonne gauche : carrousel */}
          <div className="w-full flex-1">
            <HeroCarousel className="shadow-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
