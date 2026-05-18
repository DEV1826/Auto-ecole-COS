import { AuthLayout } from '@/components/layout/AuthLayout';
import { InitialSetupForm } from '@/features/auth/components';
import { useLocation } from 'react-router-dom';

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
  const setupAccessToken = (location.state as { setupAccessToken?: string } | null)
    ?.setupAccessToken;

  return (
    <>
      <AuthLayout>
        <InitialSetupForm accessToken={setupAccessToken ?? ''} />
      </AuthLayout>
    </>
  );
}
