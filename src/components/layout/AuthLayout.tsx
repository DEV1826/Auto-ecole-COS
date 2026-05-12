// /src/components/layout/AuthLayout.tsx

/**
 * @module layout/AuthLayout
 * @description
 * Layout pour les pages d’authentification (login, mot de passe oublié, réinitialisation, etc.)
 * Design à deux colonnes :
 * - Colonne gauche : formulaire centré avec fond clair
 * - Colonne droite : grande image de l’auto‑école (ou logo) avec éventuel texte superposé
 * Responsive : sur mobile, seule la colonne gauche s’affiche.
 *
 * @author Stive Junior
 * @version 2.0.0
 *
 * @example
 * ```tsx
 * <AuthLayout>
 *   <LoginForm />
 * </AuthLayout>
 * ```
 */

import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { appConfig } from '@/config/app.config';

import { Footer } from '@/components/footer';
import { ThemeToggle } from '../theme';
import { Separator } from '../ui/separator';
import { GridShape } from './GridShape';

/**
 * Propriétés du composant AuthLayout.
 */
interface AuthLayoutProps {
  /** Contenu enfant (le formulaire d’authentification) */
  children?: React.ReactNode;
  /** URL d’une image personnalisée pour la colonne droite (optionnelle) */
  imageUrl?: string;
  /** Texte superposé sur l’image (optionnel, par exemple un slogan) */
  overlayText?: string;
}

/**
 * Layout d’authentification à deux colonnes.
 * Colonne gauche : formulaire centré.
 * Colonne droite : grande image de l’auto‑école.
 */
export function AuthLayout({ children, imageUrl, overlayText }: AuthLayoutProps) {
  const isMobile = useIsMobile();
  const defaultImage = appConfig.logo || '/images/driving-school.jpg';
  const finalImageUrl = imageUrl || defaultImage;

  return (
    <div className="relative min-h-svh  bg-blue-50/70  dark:bg-blue-50/5 z-0 ">
      <div className="grid min-h-svh lg:grid-cols-2">
        {/* Colonne gauche : formulaire */}

        <div className="flex flex-col items-center justify-center relative p-6 md:p-10">
          {/* Arrière‑plan décoratif */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <GridShape position="top-right" className="z-1" />
            <GridShape position="bottom-left" className="z-1 dark:opacity-50" />
          </div>
          <div className="w-full max-w-md flex-1  flex flex-col justify-center">{children}</div>
          {/* Footer discret en bas à droite */}
          <div className="flex  items-center justify-center gap-2 py-6 text-center text-xs text-muted-foreground flex-row sm:gap-4">
            {/* Footer léger avec copyright */}
            <p>
              &copy; {new Date().getFullYear()} {appConfig.name}. Tous droits réservés.
            </p>
            <Separator orientation="vertical" className="hidden h-full sm:inline" />
            <div className="flex items-center gap-4">
              <ThemeToggle
                variant={isMobile ? 'icon-only' : 'dropdown'}
                showText
                size="xs"
                rounded="full"
              />
            </div>
          </div>
        </div>

        {/* Colonne droite : grande image (desktop uniquement) */}
        {!isMobile && (
          <div className="relative hidden bg-linear-to-br from-primary/5 via-primary/10 to-transparent dark:bg-white/80! z-0  lg:flex lg:items-center lg:justify-center">
            <div className="relative flex h-full flex-col justify-between p-5">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="flex h-full w-full flex-col items-center justify-center p-6"
              >
                <img
                  src={finalImageUrl}
                  alt="Auto-école COS"
                  className="h-full w-full object-cover"
                />
                {overlayText && (
                  <div className="absolute inset-0 flex items-end justify-center p-8 bg-linear-to-t from-black/60 to-transparent">
                    <p className="text-white text-xl font-semibold text-center max-w-md">
                      {overlayText}
                    </p>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
