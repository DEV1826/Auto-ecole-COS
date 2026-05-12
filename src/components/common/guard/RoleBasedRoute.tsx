/**
 * @module common/guard/RoleBasedRoute
 * @description Guard spécifique pour la vérification des rôles, avec support de conditions multiples.
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { PUBLIC_ROUTES } from '@/config/routes';
import type { Role } from '@/types/enums';

export interface RoleBasedRouteProps {
  /** Rôle(s) autorisé(s) */
  allowedRoles: Role | Role[];
  /** Redirection en cas de rôle insuffisant */
  redirectTo?: string;
  /** Mode : 'any' (un des rôles suffit) ou 'all' (tous les rôles requis) */
  mode?: 'any' | 'all';
}

/**
 * Guard pour les routes basées sur les rôles.
 * Peut exiger qu'un utilisateur ait au moins un des rôles (mode 'any')
 * ou tous les rôles spécifiés (mode 'all').
 *
 * @example
 * ```tsx
 * // Docteur ou admin
 * <Route element={<RoleBasedRoute allowedRoles={[Role.DOCTOR, Role.ADMIN]} />}>
 *   <Route path="/reports" element={<Reports />} />
 * </Route>
 * ```
 */
export function RoleBasedRoute({
  allowedRoles,
  redirectTo = PUBLIC_ROUTES.STATUS.UNAUTHORIZED,
  mode = 'any',
}: RoleBasedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) return;

  if (!isAuthenticated || !user) {
    return <Navigate to={PUBLIC_ROUTES.AUTH.LOGIN} replace />;
  }

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const Role = user.role;

  let hasAccess = false;
  if (mode === 'any') {
    hasAccess = roles.includes(Role);
  } else {
    // mode 'all' : tous les rôles doivent être présents (rare, mais possible pour super admin)
    hasAccess = roles.every((role) => Role === role); // simplifié, car un seul rôle par utilisateur
  }

  if (!hasAccess) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
