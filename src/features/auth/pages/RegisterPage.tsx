import { AuthLayout } from '@/components/layout/AuthLayout';
import { InitialSetupForm } from '@/features/auth/components';
import { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { PUBLIC_ROUTES } from '@/config/routes';

/**
 * @module features/auth/pages/RegisterPage
 * @description Page d'inscription utilisateur.
 * @see {@link PUBLIC_ROUTES.AUTH.REGISTER}
 *
 * @example
 * ```tsx
 * <Route path={PUBLIC_ROUTES.AUTH.REGISTER} element={<RegisterPage />} />
 * ```
 */
export default function RegisterPage() {
  const location = useLocation();
  const setupAccess = useMemo(() => {
    const stateAccess = location.state as
      | {
          developerSetupAccess?: boolean;
          setupAccessToken?: string;
          expiresAt?: number;
          timestamp?: number;
        }
      | null;

    if (stateAccess?.developerSetupAccess && stateAccess?.setupAccessToken) {
      return stateAccess;
    }

    try {
      const raw = window.sessionStorage.getItem('autoecole.setupAccess');
      if (!raw) return null;
      const parsed = JSON.parse(raw) as {
        developerSetupAccess?: boolean;
        setupAccessToken?: string;
        expiresAt?: number;
        timestamp?: number;
      };

      if (
        parsed?.developerSetupAccess &&
        typeof parsed.setupAccessToken === 'string' &&
        typeof parsed.expiresAt === 'number' &&
        parsed.expiresAt > Date.now()
      ) {
        return parsed;
      }

      window.sessionStorage.removeItem('autoecole.setupAccess');
      return null;
    } catch {
      window.sessionStorage.removeItem('autoecole.setupAccess');
      return null;
    }
  }, [location.state]);

  if (!setupAccess?.setupAccessToken) {
    return <Navigate to={PUBLIC_ROUTES.AUTH.REGISTER_ACCESS} replace />;
  }

  return (
    <>
      <AuthLayout>
        <InitialSetupForm accessToken={setupAccess.setupAccessToken} />
      </AuthLayout>
    </>
  );
}
