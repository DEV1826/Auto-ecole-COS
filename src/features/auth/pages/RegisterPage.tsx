import { AuthLayout } from '@/components/layout/AuthLayout';
import { RegisterForm } from '@/features/auth/components';

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
  return (
    <>
      <AuthLayout>
        <RegisterForm />
      </AuthLayout>
    </>
  );
}
