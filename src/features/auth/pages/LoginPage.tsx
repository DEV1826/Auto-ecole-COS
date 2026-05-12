import { AuthLayout } from '@/components/layout/AuthLayout';
import { LoginForm } from '@/features/auth/components';

/**
 * @module features/auth/pages/LoginPage
 * @description Page de connexion utilisateur.
 * @see {@link PUBLIC_ROUTES.AUTH.LOGIN}
 *
 * @example
 * ```tsx
 * <Route path={PUBLIC_ROUTES.AUTH.LOGIN} element={<LoginPage />} />
 * ```
 */
export default function LoginPage() {
  return (
    <>
      <AuthLayout>
        <LoginForm />
      </AuthLayout>
    </>
  );
}
