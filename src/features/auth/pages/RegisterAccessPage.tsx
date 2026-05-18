import { AuthLayout } from '@/components/layout/AuthLayout';
import { DeveloperSetupAccessForm } from '@/features/auth/components';

/**
 * @module features/auth/pages/RegisterAccessPage
 * @description Page de validation du code développeur avant initialisation.
 */
export default function RegisterAccessPage() {
  return (
    <AuthLayout>
      <DeveloperSetupAccessForm />
    </AuthLayout>
  );
}
