/**
 * @module features/auth/components/ChangePasswordForm
 * @description Formulaire de changement de mot de passe pour utilisateur authentifié.
 * @see {@link useAuth} pour l'action changePassword
 * @see {@link changePasswordSchema} pour les règles de validation
 */

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Field, FieldGroup, FieldLabel, FieldDescription, FieldError } from '@/components/ui/field';
import { PasswordInput } from '@/components/forms/PasswordInput';
import { LoadingButton } from '@/components/forms/LoadingButton';
import { changePasswordSchema, type ChangePasswordInput } from '@/lib/validators/auth.validator';
import { useAuth } from '@/hooks/use.auth';
import { PROTECTED_ROUTES } from '@/config/routes';

/**
 * Formulaire de changement de mot de passe pour utilisateur authentifié.
 * Redirige vers le profil après succès.
 *
 * @example
 * ```tsx
 * <ChangePasswordForm />
 * ```
 */
export default function ChangePasswordForm() {
  const { changePassword } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit, reset } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { oldPassword: '', newPassword: '', confirmNewPassword: '' },
  });

  const onSubmit = async (data: ChangePasswordInput) => {
    setIsLoading(true);
    await toast.promise(changePassword(data), {
      loading: 'Mise à jour...',
      success: () => {
        reset();
        navigate(PROTECTED_ROUTES.PROFILE);
        return 'Mot de passe modifié avec succès';
      },
      error: (err) =>
        err instanceof Error ? err.message : 'Impossible de changer le mot de passe',
      position: 'top-center',
    });
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <FieldGroup>
        {/* Titre et description alignés à gauche */}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">Changer mon mot de passe</h1>
          <p className="text-sm text-muted-foreground">
            Pour votre sécurité, choisissez un mot de passe fort.
          </p>
        </div>

        {/* Mot de passe actuel */}
        <Controller
          name="oldPassword"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="currentPassword">Mot de passe actuel</FieldLabel>
              <PasswordInput {...field} id="currentPassword" disabled={isLoading} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Nouveau mot de passe */}
        <Controller
          name="newPassword"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="newPassword">Nouveau mot de passe</FieldLabel>
              <PasswordInput {...field} id="newPassword" disabled={isLoading} />
              <FieldDescription>
                Minimum 8 caractères, une majuscule, une minuscule, un chiffre, un caractère
                spécial.
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Confirmation du nouveau mot de passe */}
        <Controller
          name="confirmNewPassword"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="confirmNewPassword">Confirmer le mot de passe</FieldLabel>
              <PasswordInput {...field} id="confirmNewPassword" disabled={isLoading} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Bouton de mise à jour avec icône */}
        <LoadingButton
          type="submit"
          isLoading={isLoading}
          loadingText="Mise à jour..."
          icon={Lock}
          className="w-full"
        >
          Mettre à jour
        </LoadingButton>
      </FieldGroup>
    </form>
  );
}
