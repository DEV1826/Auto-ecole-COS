/**
 * @module features/auth/components/ResetPasswordForm
 * @description Formulaire de réinitialisation du mot de passe après validation du code OTP.
 * @see {@link useAuth} pour l'action resetPassword
 * @see {@link resetPasswordSchema} pour les règles de validation
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ChevronLeftIcon, KeyRound } from 'lucide-react';
import { Field, FieldGroup, FieldLabel, FieldDescription, FieldError } from '@/components/ui/field';
import { PasswordInput } from '@/components/forms/PasswordInput';
import { LoadingButton } from '@/components/forms/LoadingButton';
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validators/auth.validator';
import { useAuth } from '@/hooks/use.auth';
import { PUBLIC_ROUTES } from '@/config/routes';

/**
 * Formulaire de réinitialisation. Permet à l'utilisateur de définir un nouveau mot de passe.
 * Vérifie d'abord la validité du token via l'API.
 *
 * @example
 * ```tsx
 * <ResetPasswordForm />
 * ```
 */
export default function ResetPasswordForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Récupérer le code depuis le state (transmis par OtpForm)
  const stateCode = (location.state as { code?: string })?.code;
  const [code] = useState(stateCode || '');

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      code: code,
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const hasErrors = Object.keys(errors).length > 0;

  // Si aucun code n'est disponible, rediriger vers l'accueil ou afficher une erreur
  if (!code) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-destructive">Aucun code de réinitialisation valide trouvé.</p>
        <Link
          to={PUBLIC_ROUTES.AUTH.FORGOT_PASSWORD}
          className="text-primary underline underline-offset-4"
        >
          Retour à la demande de code
        </Link>
      </div>
    );
  }

  const onSubmit = async (data: ResetPasswordInput) => {
    setIsLoading(true);
    try {
      await resetPassword({ code: data.code, newPassword: data.newPassword });
      toast.success('Mot de passe réinitialisé avec succès');
      navigate(PUBLIC_ROUTES.AUTH.LOGIN);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Échec de la réinitialisation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeftIcon className="mr-1 h-4 w-4" />
          Retour à l'accueil
        </Link>
      </div>

      <FieldGroup>
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">Nouveau mot de passe</h1>
          <p className="text-sm text-muted-foreground">
            Choisissez un mot de passe sécurisé pour votre compte
          </p>
        </div>

        {/* Champ code masqué (utilisé pour la validation mais caché) */}
        <Controller
          name="code"
          control={control}
          render={({ field }) => <input type="hidden" {...field} />}
        />

        <Controller
          name="newPassword"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="newPassword">Nouveau mot de passe</FieldLabel>
              <PasswordInput {...field} id="newPassword" disabled={isLoading} />
              <FieldDescription>
                Minimum 8 caractères, une majuscule, une minuscule, un chiffre et un caractère
                spécial.
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

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

        <LoadingButton
          type="submit"
          isLoading={isLoading}
          loadingText="Réinitialisation..."
          icon={KeyRound}
          disabled={hasErrors || isSubmitting}
          className="w-full"
        >
          Réinitialiser le mot de passe
        </LoadingButton>

        <FieldDescription className="text-center">
          <Link
            to={PUBLIC_ROUTES.AUTH.LOGIN}
            className="inline-flex items-center text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            <ChevronLeftIcon className="mr-1 h-4 w-4" />
            Retour à la connexion
          </Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
