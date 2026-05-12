// /src/features/auth/components/ForgotPasswordForm.tsx

/**
 * @module features/auth/components/ForgotPasswordForm
 * @description Formulaire de demande de code de réinitialisation (6 chiffres).
 * @see {@link useAuth} pour l'action requestPasswordResetByEmail
 * @see {@link requestResetCodeSchema} pour la validation
 */

import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ChevronLeftIcon, Send, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Field, FieldGroup, FieldLabel, FieldDescription, FieldError } from '@/components/ui/field';
import { EmailInput } from '@/components/forms/EmailInput';
import { LoadingButton } from '@/components/forms/LoadingButton';
import {
  requestResetCodeSchema,
  type RequestResetCodeInput,
} from '@/lib/validators/auth.validator';
import { useAuth } from '@/hooks/use.auth';
import { PUBLIC_ROUTES } from '@/config/routes';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const now = Date.now();

export default function ForgotPasswordForm() {
  const navigate = useNavigate();
  const { requestPasswordResetByEmail, user } = useAuth();
  const [adminCode, setAdminCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestResetCodeInput>({
    resolver: zodResolver(requestResetCodeSchema),
    mode: 'onChange',
    defaultValues: { email: '' },
  });

  const hasErrors = Object.keys(errors).length > 0;

  const onSubmit = async (data: RequestResetCodeInput) => {
    const isAdmin = user?.niveau === 'SUPER_ADMIN' || user?.niveau === 'ADMIN';
    const response = await requestPasswordResetByEmail(data.email, isAdmin);

    if (response.code) {
      setAdminCode(response.code);
      toast.success('Code généré avec succès', {
        description: `Code pour ${data.email} : ${response.code}`,
        duration: 10000,
      });
    } else {
      // Utilisateur normal : redirection vers la page OTP avec l'email et affichage d'un toast
      toast.success(response.message);
      navigate(PUBLIC_ROUTES.AUTH.VERIFY_OTP, {
        state: { email: data.email, timestamp: now },
      });
    }
  };

  const copyToClipboard = () => {
    if (adminCode) {
      navigator.clipboard.writeText(adminCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="w-full max-w-md">
        <Link
          to={PUBLIC_ROUTES.AUTH.LOGIN}
          className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeftIcon className="mr-1 h-4 w-4" />
          Retour à la connexion
        </Link>
      </div>

      <FieldGroup>
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">Mot de passe oublié</h1>
          <p className="text-sm text-muted-foreground">
            Entrez votre email pour recevoir un code de réinitialisation à 6 chiffres
          </p>
        </div>

        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="forgot-email">Email</FieldLabel>
              <EmailInput
                {...field}
                id="forgot-email"
                error={fieldState.invalid}
                disabled={isSubmitting}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {adminCode && (
          <Alert className="bg-muted">
            <AlertDescription className="flex items-center justify-between gap-2">
              <span className="font-mono text-lg tracking-wider">{adminCode}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="h-8 px-2"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copié' : 'Copier'}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <LoadingButton
          type="submit"
          isLoading={isSubmitting}
          loadingText="Vérification et envoi..."
          disabled={hasErrors || isSubmitting}
          className="w-full"
          icon={Send}
        >
          Envoyer le code
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
