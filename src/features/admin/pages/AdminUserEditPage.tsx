// src/features/admin/pages/AdminUserEditPage.tsx

/**
 * @module features/admin/pages/AdminUserEditPage
 * @description Modification d'un compte utilisateur (administrateurs uniquement).
 */

import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { UserPen } from 'lucide-react';

import FormWrapper from '@/components/forms/FormWrapper';
import { FormPageSkeleton, PageHeader, errorMessage } from '@/components/forms/FormPageKit';
import { ErrorDialog } from '@/components/ui/error-dialog';
import UserForm from '../components/UserForm';
import UserPreviewCard, { type UserPreviewData } from '../components/UserPreviewCard';

import { useAuth } from '@/hooks/use.auth';
import { PROTECTED_ROUTES } from '@/config';
import type { UpdateUserParams, UtilisateurDetail } from '@/types/auth.types';

type EditData = Partial<UpdateUserParams> & { email?: string };

export default function AdminUserEditPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const userId = Number(id);
  const invalidId = !Number.isInteger(userId) || userId <= 0;
  const { getUserById, updateUser, user: currentUser } = useAuth();

  const [original, setOriginal] = React.useState<UtilisateurDetail | null>(null);
  const [initialData, setInitialData] = React.useState<EditData | null>(null);
  const [formData, setFormData] = React.useState<EditData>({});
  const [isFormValid, setIsFormValid] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const loadError = invalidId ? "Identifiant d'utilisateur invalide." : fetchError;

  React.useEffect(() => {
    if (invalidId) return;
    let cancelled = false;
    getUserById(userId)
      .then((u) => {
        if (cancelled) return;
        const data: EditData = {
          nom: u.nom,
          prenom: u.prenom,
          email: u.email,
          role: u.role,
          niveau: u.niveau,
          actif: u.actif,
        };
        setOriginal(u);
        setInitialData(data);
        setFormData(data);
      })
      .catch((err) => !cancelled && setFetchError(errorMessage(err, "Impossible de charger l'utilisateur.")));
    return () => {
      cancelled = true;
    };
  }, [userId, invalidId, getUserById]);

  const handleChange = React.useCallback((patch: EditData, valid: boolean) => {
    setFormData((prev) => ({ ...prev, ...patch }));
    setIsFormValid(valid);
  }, []);

  const dirty = initialData !== null && JSON.stringify(initialData) !== JSON.stringify({ ...initialData, ...formData });
  const isSelf = currentUser?.id === userId;

  const handleSubmit = React.useCallback(async () => {
    if (!isFormValid) {
      toast.error('Formulaire incomplet', { description: 'Veuillez corriger les champs signalés.' });
      return;
    }
    // L'e-mail n'est pas modifiable ; on ne modifie pas son propre niveau ni son activation.
    const payload: Partial<UpdateUserParams> = {
      nom: formData.nom,
      prenom: formData.prenom,
      role: formData.role,
      niveau: formData.niveau,
      actif: formData.actif,
    };
    if (isSelf) {
      delete payload.niveau;
      delete payload.actif;
    }
    setIsSubmitting(true);
    try {
      await updateUser(userId, payload);
      toast.success('Utilisateur mis à jour');
      navigate(PROTECTED_ROUTES.ADMIN.USERS.DETAIL(userId));
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }, [isFormValid, formData, isSelf, userId, updateUser, navigate]);

  if (loadError) {
    return (
      <ErrorDialog open onOpenChange={() => navigate(PROTECTED_ROUTES.ADMIN.USERS.LIST)} title="Erreur de chargement" message={loadError} closeText="Retour aux utilisateurs" />
    );
  }
  if (!initialData || !original) return <FormPageSkeleton />;

  return (
    <div className="space-y-5 p-4 md:p-1 pb-12">
      <PageHeader icon={UserPen} title={`Modifier ${original.prenom} ${original.nom}`} badge={original.email} accent="sky" />

      {isSelf && (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          Vous modifiez votre propre compte : votre niveau d'accès et l'activation du compte ne seront pas modifiés.
        </p>
      )}

      <FormWrapper
        title="Compte utilisateur"
        description="Le mot de passe se réinitialise par code depuis la fiche de l'utilisateur."
        icon={UserPen}
        onSubmit={handleSubmit}
        onCancel={() => navigate(-1)}
        isSubmitting={isSubmitting}
        isValid={isFormValid}
        isEditMode
        submitLabel="Mettre à jour"
        cancelLabel="Annuler"
        previewTitle="Aperçu du compte"
        preview={<UserPreviewCard data={formData as UserPreviewData} isEditMode dirty={dirty} />}
      >
        <UserForm data={initialData} onChange={handleChange} isSubmitting={isSubmitting} isEditMode />
      </FormWrapper>

      <ErrorDialog open={submitError !== null} onOpenChange={(open) => !open && setSubmitError(null)} title="Mise à jour impossible" message={submitError ?? ''} closeText="Fermer" />
    </div>
  );
}
