import { AuthLayout } from '@/components/layout/AuthLayout';
import { OtpForm } from '@/features/auth/components';

/**
 * @module features/auth/pages/OTPPage
 * @description Page de vérification par code OTP (2FA).
 * @see {@link PUBLIC_ROUTES.AUTH.VERIFY_OTP}
 *
 * @example
 * ```tsx
 * <Route path={PUBLIC_ROUTES.AUTH.VERIFY_OTP} element={<OTPPage />} />
 * ```
 */
export default function OTPPage() {
  return (
    <>
      <AuthLayout>
        <OtpForm />
      </AuthLayout>
    </>
  );
}
