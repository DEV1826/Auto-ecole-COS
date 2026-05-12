/**
 * @module common/ScrollToTop
 * @description Remonte automatiquement la page en haut à chaque changement de route.
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Composant qui écoute les changements de route et remonte la fenêtre en haut.
 * À placer une fois dans le layout principal.
 *
 * @example
 * ```tsx
 * <ScrollToTop />
 * ```
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }, [pathname]);

  return null;
}
