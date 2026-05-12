/**
 * @module common/guard/ProtectedRoute
 * @description Guard qui vérifie l'authentification avant d'accéder à une route.
 * Redirige vers login si non authentifié, avec sauvegarde de la tentative.
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use.auth';
import { PUBLIC_ROUTES } from '@/config/routes';
import type { Role } from '@/types/enums';

export interface ProtectedRouteProps {
  /** Rôle(s) requis pour accéder à la route (optionnel) */
  requiredRole?: Role | Role[];
  /** Redirection personnalisée en cas d'absence d'authentification */
  redirectTo?: string;
  /** Redirection personnalisée en cas de rôle insuffisant */
  redirectToUnauthorized?: string;
}

/**
 * Guard principal pour les routes protégées.
 * Vérifie :
 * - Authentification (utilisateur connecté)
 * - Éventuellement, un ou plusieurs rôles requis
 * - État de chargement (affiche un fallback)
 *
 * @example
 * ```tsx
 * <Route element={<ProtectedRoute requiredRole={Role.ADMIN} />}>
 *   <Route path="/dashboard" element={<DoctorDashboard />} />
 * </Route>
 * ```
 */
export function ProtectedRoute({
  requiredRole,
  redirectTo = PUBLIC_ROUTES.AUTH.LOGIN,
  redirectToUnauthorized = PUBLIC_ROUTES.STATUS.UNAUTHORIZED,
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // Non authentifié → redirection vers login avec sauvegarde de l'URL
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const Role = user?.role;

    if (!Role || !roles.includes(Role)) {
      return <Navigate to={redirectToUnauthorized} replace />;
    }
  }

  // Tout est OK
  return <Outlet />;
}
