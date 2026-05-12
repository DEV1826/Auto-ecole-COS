import { AuthLayout } from '@/components/layout/AuthLayout';
import { ForgotPasswordForm } from '@/features/auth/components';

/**
 * @module features/auth/pages/ForgotPasswordPage
 * @description Page de demande de réinitialisation du mot de passe.
 * @see {@link PUBLIC_ROUTES.AUTH.FORGOT_PASSWORD}
 *
 * @example
 * ```tsx
 * <Route path={PUBLIC_ROUTES.AUTH.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
 * ```
 */
export default function ForgotPasswordPage() {
  return (
    <>
      <AuthLayout>
        <ForgotPasswordForm />
      </AuthLayout>
    </>
  );
}
