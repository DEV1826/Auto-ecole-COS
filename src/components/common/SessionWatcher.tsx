/**
 * @module SessionWatcher
 * @description Garde la session côté interface synchronisée avec le main process.
 *
 * - Au démarrage, si un token est persisté, il est revalidé (et rafraîchi si besoin).
 * - Quand le preload émet `cos:auth-expired` (le main process a refusé un appel
 *   faute de session valide), un refresh est tenté ; en cas d'échec l'utilisateur
 *   est déconnecté et les gardes de routes le renvoient vers la page de connexion.
 */

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth.store';

export function SessionWatcher() {
  const checking = useRef(false);

  useEffect(() => {
    const check = async () => {
      if (checking.current) return;
      const { token, isAuthenticated, isSessionValid, logout } = useAuthStore.getState();
      if (!token && !isAuthenticated) return;

      checking.current = true;
      try {
        const valid = token ? await isSessionValid() : false;
        if (!valid && useAuthStore.getState().isAuthenticated) {
          await logout();
        }
      } finally {
        checking.current = false;
      }
    };

    void check();
    window.addEventListener('cos:auth-expired', check);
    return () => window.removeEventListener('cos:auth-expired', check);
  }, []);

  return null;
}
