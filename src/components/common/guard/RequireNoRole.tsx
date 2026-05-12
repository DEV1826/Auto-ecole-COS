/**
 * @module common/guard/RequireNoRole
 * @description Guard qui interdit l'accès si l'utilisateur a un rôle spécifique.
 * Utile pour les pages d'onboarding qui ne doivent pas être vues par des utilisateurs déjà configurés.
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { PROTECTED_ROUTES } from '@/config/routes';
import type { Role } from '@/types/enums';

export interface RequireNoRoleProps {
  /** Rôle(s) interdits */
  forbiddenRoles: Role | Role[];
  /** Redirection si l'utilisateur a un rôle interdit */
  redirectTo?: string;
}

/**
 * Guard qui refuse l'accès si l'utilisateur possède un certain rôle.
 * Par exemple, empêcher un médecin d'accéder à la page d'inscription patient.
 *
 * @example
 * ```tsx
 * <Route element={<RequireNoRole forbiddenRoles={Role.DOCTOR} />}>
 *   <Route path="/patient/onboarding" element={<PatientOnboarding />} />
 * </Route>
 * ```
 */
export function RequireNoRole({
  forbiddenRoles,
  redirectTo = PROTECTED_ROUTES.DASHBOARD,
}: RequireNoRoleProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) return;

  if (!isAuthenticated || !user) {
    // Non authentifié : laisser passer (peut être une page publique)
    return <Outlet />;
  }

  const roles = Array.isArray(forbiddenRoles) ? forbiddenRoles : [forbiddenRoles];
  if (roles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
