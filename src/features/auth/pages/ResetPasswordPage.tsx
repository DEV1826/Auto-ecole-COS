/**
 * @module features/auth/pages/ResetPasswordPage
 * @description Page de réinitialisation du mot de passe (avec token).
 */

import { AuthLayout } from '@/components/layout/AuthLayout';
import { ResetPasswordForm } from '@/features/auth/components';

/**
 * Page de réinitialisation du mot de passe (avec token).
 * @see {@link PUBLIC_ROUTES.AUTH.RESET_PASSWORD}
 *
 * @example
 * ```tsx
 * <Route path={PUBLIC_ROUTES.AUTH.RESET_PASSWORD} element={<ResetPasswordPage />} />
 * ```
 */
export default function ResetPasswordPage() {
  return (
    <>
      <AuthLayout>
        <ResetPasswordForm />
      </AuthLayout>
    </>
  );
}
