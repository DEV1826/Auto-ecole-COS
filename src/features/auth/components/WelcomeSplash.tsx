'use client';

import type { Utilisateur } from '@/types/auth.types';
/**
 * @module features/auth/components/WelcomeSplash
 * @description
 * Écran de bienvenue éphémère affiché après une connexion réussie.
 *
 * ## Fonctionnement
 * - Apparaît en fondu (fade-in) après l'authentification.
 * - Affiche un message personnalisé : « Bon retour, [prénom] » si
 *   une dernière connexion existe, sinon « Bienvenue, [prénom] ».
 * - Après 2,5 secondes, disparaît en fondu puis déclenche `onFinish`.
 *
 * ## Utilisation
 * ```tsx
 * const [showSplash, setShowSplash] = useState(false);
 * // après login réussi
 * setShowSplash(true);
 * // dans le rendu
 * {showSplash && <WelcomeSplash session={session} onFinish={() => navigate('/dashboard')} />}
 * ```
 *
 * @see {@link useAuth} pour récupérer la session
 *
 * @author Stive Junior
 * @version 1.0.0
 */

import { AnimatePresence, motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { useEffect } from 'react';

interface WelcomeSplashProps {
  /** Session utilisateur après connexion */
  sessionId: number;
  /** Utilisateur connectee */
  user: Utilisateur;
  /** Callback exécuté lorsque l'animation de sortie est terminée */
  onFinish: () => void;
  /** Contrôle la visibilité du splash (depuis le parent) */
  visible: boolean;
}

/**
 * Composant pour l'effet de frappe lettre par lettre
 */
const TypingText = ({ text }: { text: string }) => {
  const letters = Array.from(text);

  const container: Variants = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.3 * i },
    }),
  };

  const child: Variants = {
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', damping: 12, stiffness: 200 },
    },
    hidden: { opacity: 0, y: 20 },
  };

  return (
    <motion.h1
      className="text-4xl md:text-5xl font-extrabold tracking-tight text-blue-800 dark:text-blue-400"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {letters.map((letter, index) => (
        <motion.span key={index} variants={child}>
          {letter}
        </motion.span>
      ))}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        {' '}
        👋
      </motion.span>
    </motion.h1>
  );
};

export function WelcomeSplash({ user, sessionId, onFinish, visible }: WelcomeSplashProps) {
  const firstName = user?.nom || 'Utilisateur';
  const hasReturned = !!sessionId;
  const greeting = hasReturned ? `Bon retour, ${firstName}` : `Bienvenue, ${firstName}`;

  useEffect(() => {
    // 2.5s de lecture + 0.5s de marge
    const timer = setTimeout(() => {
      onFinish();
    }, 3500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <AnimatePresence onExitComplete={onFinish}>
      {visible && (
        <motion.div
          key="splash-container"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20, transition: { duration: 0.8 } }}
          className="fixed inset-0 z-999999999 bg-blue-50  dark:bg-blue-50/5 flex flex-col items-center justify-center  no-scrollbar! overflow-hidden"
        >
          <div className="text-center px-6">
            <TypingText text={greeting} />
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              className="mt-4 text-lg font-medium text-blue-600/80 dark:text-muted-foreground"
            >
              {hasReturned ? 'Heureux de vous revoir.' : 'Votre espace est prêt.'}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
