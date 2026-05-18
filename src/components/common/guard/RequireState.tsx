/**
 * @module common/guard/RequireState
 * @description Guard qui exige qu'un état spécifique soit présent dans la location (react-router state).
 * Utile pour les pages de succès ou d'erreur qui ne doivent pas être accessibles directement.
 */

import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { PUBLIC_ROUTES } from '@/config/routes';

export interface RequireStateProps {
  /** Clé(s) requise(s) dans le state de la navigation */
  requiredStateKeys: string | string[];
  /** Redirection si les clés sont absentes */
  redirectTo?: string;
  /** Durée de validité du state en millisecondes (ex: 15000 pour 15s) */
  maxAge?: number;
  /** Vérification personnalisée (fonction) */
  customValidation?: (state: unknown) => boolean;
}

/**
 * Guard pour les pages qui doivent être atteintes uniquement via une redirection avec state.
 * Exemple : page de succès après paiement, page d'erreur spécifique.
 *
 * @example
 * ```tsx
 * <Route element={<RequireState requiredStateKeys="fromPayment" />}>
 *   <Route path="/success" element={<PaymentSuccess />} />
 * </Route>
 * ```
 */
export function RequireState({
  requiredStateKeys,
  redirectTo = PUBLIC_ROUTES.HOME,
  maxAge = 10000,
  customValidation,
}: RequireStateProps) {
  const location = useLocation();
  const state = location.state;
  const [currentTime, setCurrentTime] = useState<number | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => setCurrentTime(Date.now()), 0);
    return () => window.clearTimeout(timeout);
  }, [state]);

  if (currentTime === null) {
    return null;
  }

  const keys = Array.isArray(requiredStateKeys) ? requiredStateKeys : [requiredStateKeys];
  let isValid = true;

  // 1. Vérification de la présence du state et des clés
  if (!state) {
    isValid = false;
  } else {
    for (const key of keys) {
      if (!(key in state)) {
        isValid = false;
        break;
      }
    }
  }

  // 2. Vérification de l'expiration (Timestamp)
  if (isValid && state?.timestamp) {
    const elapsed = currentTime - state.timestamp;

    if (elapsed > maxAge) {
      isValid = false;
    }
  } else if (isValid && !state?.timestamp) {
    isValid = false;
  }

  // 3. Validation personnalisée
  if (isValid && customValidation) {
    isValid = customValidation(state);
  }

  if (!isValid) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
