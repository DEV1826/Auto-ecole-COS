/**
 * @module common/guard/PublicRoute
 * @description Guard pour les routes publiques.
 * Redirige vers le dashboard si l'utilisateur est déjà connecté.
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { PROTECTED_ROUTES, PUBLIC_ROUTES } from '@/config/routes';

export interface PublicRouteProps {
  /** Redirection si déjà authentifié */
  redirectTo?: string;
}

/**
 * Guard pour les pages publiques (login, register, forgot password, etc.).
 * Si l'utilisateur est déjà connecté, le redirige vers le dashboard.
 *
 * @example
 * ```tsx
 * <Route element={<PublicRoute />}>
 *   <Route path="/auth/login" element={<Login />} />
 * </Route>
 * ```
 */
export function PublicRoute({ redirectTo = PROTECTED_ROUTES.DASHBOARD }: PublicRouteProps) {
  const { isAuthenticated } = useAuth();

  if (location.pathname === PUBLIC_ROUTES.AUTH.LOGOUT) {
    return <Outlet />;
  }
  // Si authentifié MAIS pas en train de se déconnecter → redirection
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
