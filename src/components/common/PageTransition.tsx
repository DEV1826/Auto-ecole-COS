/**
 * @module common/PageTransition
 * @description Animation de transition entre les pages avec Framer Motion.
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Propriétés du composant PageTransition.
 */
export interface PageTransitionProps {
  /** Contenu à animer */
  children: ReactNode;
  /** Durée de l'animation en secondes (défaut: 0.2) */
  duration?: number;
  /** Animation d'entrée (opacity par défaut) */
  initial?: object;
  /** Animation de sortie */
  exit?: object;
}

/**
 * Composant qui anime l'apparition et la disparition du contenu.
 * À utiliser autour des routes.
 *
 * @example
 * ```tsx
 * <PageTransition>
 *   <Routes>...</Routes>
 * </PageTransition>
 * ```
 */
export function PageTransition({ children, duration = 0.2 }: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={typeof window !== 'undefined' ? window.location.pathname : 'page'}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
