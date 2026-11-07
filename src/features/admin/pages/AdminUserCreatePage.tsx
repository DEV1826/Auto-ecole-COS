// src/features/admin/pages/AdminUserCreatePage.tsx

/**
 * @module features/admin/pages/AdminUserCreatePage
 * @description Création d'un compte utilisateur (administrateurs uniquement).
 */

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';

import FormWrapper from '@/components/forms/FormWrapper';
import { PageHeader, errorMessage } from '@/components/forms/FormPageKit';
import { ErrorDialog } from '@/components/ui/error-dialog';
import UserForm from '../components/UserForm';
import UserPreviewCard, { type UserPreviewData } from '../components/UserPreviewCard';

import { useAuth } from '@/hooks/use.auth';
import { PROTECTED_ROUTES } from '@/config';
import type { CreateUserParams } from '@/types/auth.types';

export default function AdminUserCreatePage(): React.JSX.Element {
  const navigate = useNavigate();
  const { createUser } = useAuth();

  const [formData, setFormData] = React.useState<Partial<CreateUserParams>>({});
  const [isFormValid, setIsFormValid] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleChange = React.useCallback((patch: Partial<CreateUserParams>, valid: boolean) => {
    setFormData((prev) => ({ ...prev, ...patch }));
    setIsFormValid(valid);
  }, []);

  const handleSubmit = React.useCallback(async () => {
    if (!isFormValid) {
      toast.error('Formulaire incomplet', { description: 'Veuillez renseigner tous les champs obligatoires.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const user = await createUser(formData as CreateUserParams);
      toast.success('Utilisateur créé', { description: `${user.prenom} ${user.nom} peut maintenant se connecter.` });
      navigate(PROTECTED_ROUTES.ADMIN.USERS.DETAIL(user.id));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }, [isFormValid, formData, createUser, navigate]);

  return (
    <div className="space-y-5 p-4 md:p-1 pb-12">
      <PageHeader icon={UserPlus} title="Nouvel utilisateur" badge="Création" accent="sky" />

      <FormWrapper
        title="Compte utilisateur"
        description="Identité, rôle, niveau d'accès et mot de passe initial."
        icon={UserPlus}
        onSubmit={handleSubmit}
        onCancel={() => navigate(-1)}
        isSubmitting={isSubmitting}
        isValid={isFormValid}
        submitLabel="Créer le compte"
        cancelLabel="Annuler"
        previewTitle="Aperçu du compte"
        preview={<UserPreviewCard data={formData as UserPreviewData} />}
      >
        <UserForm data={formData} onChange={handleChange} isSubmitting={isSubmitting} />
      </FormWrapper>

      <ErrorDialog open={error !== null} onOpenChange={(open) => !open && setError(null)} title="Création impossible" message={error ?? ''} closeText="Fermer" />
    </div>
  );
}
