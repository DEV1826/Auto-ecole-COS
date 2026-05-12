'use client';

/**
 * @module features/auth/pages/LogoutPage
 * @description
 * Page de déconnexion – exécute la déconnexion puis redirige vers la page
 * de succès protégée par `RequireState`.
 *
 * ## Comportement
 * - Vérifie d’abord que l’utilisateur est authentifié.
 *   - Si **non authentifié** → redirection immédiate vers l’accueil.
 * - Si authentifié, exécute `logout()`.
 * - Affiche un indicateur de progression pendant l’opération.
 * - Une fois terminé, redirige vers `/auth/logout-success` avec l’état
 *   `{ fromLogout: true }` pour satisfaire le guard `RequireState`.
 *
 * ## Sécurité
 * - Un `useRef` empêche les appels multiples à `logout()`.
 * - Les dépendances du `useEffect` sont stables (`logout` et `navigate`
 *   sont des fonctions mémoïsées).
 *
 * @see {@link useAuth} pour la fonction `logout`
 * @see {@link RequireState} pour la page de succès
 *
 * @author Stive Junior
 * @version 1.3.0
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use.auth';
import { PUBLIC_ROUTES } from '@/config/routes';

export default function LogoutPage() {
  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const logoutStarted = useRef(false);
  const [isLoggingOut, setIsLoggingOut] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) navigate(PUBLIC_ROUTES.HOME, { replace: true });

    if (logoutStarted.current) return;
    logoutStarted.current = true;

    const performLogout = async () => {
      try {
        await logout();
      } catch {
        // Même en cas d'erreur, on redirige pour ne pas bloquer l'utilisateur
      } finally {
        setIsLoggingOut(false);
        navigate(PUBLIC_ROUTES.AUTH.LOGOUT_SUCCESS, {
          state: {
            fromLogout: true,
            timestamp: Date.now(),
          },
          replace: true,
        });
      }
    };

    performLogout();
  }, [isAuthenticated, logout, navigate]);

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          {isLoggingOut ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-blue-700 mx-auto" />
              <p className="text-lg font-semibold text-muted-foreground">Déconnexion en cours…</p>
            </>
          ) : (
            <>
              <Loader2 className="h-10 w-10 text-blue-500/50 mx-auto" />
              <p className="text-lg font-semibold text-muted-foreground">Redirection…</p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
