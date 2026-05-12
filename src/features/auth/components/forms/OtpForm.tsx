/**
 * @module features/auth/components/OtpForm
 * @description Formulaire de saisie du code OTP à 6 chiffres reçu par email.
 * @see {@link useAuth} pour l'action validateResetCode
 * @see {@link resetCodeSchema} pour la validation
 */

import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ChevronLeftIcon, MailWarning, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel, FieldDescription, FieldError } from '@/components/ui/field';
import { OtpInput } from '@/components/forms/OtpInput';
import { LoadingButton } from '@/components/forms/LoadingButton';
import { resetCodeSchema, type ResetCodeInput } from '@/lib/validators/auth.validator';
import { useAuth } from '@/hooks/use.auth';
import { PUBLIC_ROUTES } from '@/config/routes';

/**
 * Formulaire OTP. Récupère l'email depuis le state de navigation ou le store.
 * Permet de saisir un code à 6 chiffres, avec renvoi automatique après 60 secondes.
 * Si aucun email n'est disponible, affiche un dialogue invitant l'utilisateur à retourner à la page "Mot de passe oublié".
 */

export default function OtpForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const { validateResetCode } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const hasShownMissingEmailDialogRef = useRef(false);

  const emailFromState = (location.state as { email?: string })?.email;
  const email = emailFromState;

  const { control, handleSubmit } = useForm<ResetCodeInput>({
    resolver: zodResolver(resetCodeSchema),
    defaultValues: { code: '' },
  });

  // Stocker l'email dans un champ caché ou le passer via le contexte
  useEffect(() => {
    if (!email && !hasShownMissingEmailDialogRef.current) {
      hasShownMissingEmailDialogRef.current = true;
      Promise.resolve().then(() => setDialogOpen(true));
    }
  }, [email]);

  const onSubmit = async (data: ResetCodeInput) => {
    if (!email) {
      toast.error('Adresse email manquante, veuillez recommencer');
      navigate(PUBLIC_ROUTES.AUTH.FORGOT_PASSWORD);
      return;
    }
    setIsLoading(true);
    try {
      const result = await validateResetCode(data.code);
      if (result.valid && result.userId) {
        // Rediriger vers la réinitialisation avec le code et l'email ou userId
        navigate(PUBLIC_ROUTES.AUTH.RESET_PASSWORD, {
          state: { code: data.code, email, userId: result.userId },
        });
        toast.success('Code valide, veuillez définir un nouveau mot de passe');
      } else {
        toast.error(result.message || 'Code invalide ou expiré');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la validation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToForgot = () => {
    setDialogOpen(false);
    navigate(PUBLIC_ROUTES.AUTH.FORGOT_PASSWORD);
  };

  return (
    <>
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
            <h1 className="text-3xl font-bold">Code de réinitialisation</h1>
            <p className="text-sm text-muted-foreground">
              Entrez le code à 6 chiffres envoyé par email à{' '}
              {email ? (
                <span className="font-medium text-primary">{email}</span>
              ) : (
                <span className="font-medium text-destructive">adresse non disponible</span>
              )}
            </p>
          </div>

          <Controller
            name="code"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="otp-code">Code à 6 chiffres</FieldLabel>
                </div>
                <OtpInput
                  {...field}
                  id="otp-code"
                  length={6}
                  groups={[3, 3]}
                  disabled={isLoading || !email}
                  error={fieldState.invalid}
                  className="justify-center"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                <FieldDescription>
                  <Link
                    to={PUBLIC_ROUTES.AUTH.FORGOT_PASSWORD}
                    className="text-sm underline-offset-4 hover:underline"
                  >
                    Je n'ai pas reçu le code ou j'ai perdu l'accès à mon email
                  </Link>
                </FieldDescription>
              </Field>
            )}
          />

          <LoadingButton
            type="submit"
            isLoading={isLoading}
            loadingText="Vérification..."
            className="w-full"
            icon={Check}
          >
            Vérifier et continuer
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

      {/* Dialogue email manquant */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) return;
        }}
      >
        <DialogContent
          className="max-w-md"
          showCloseButton={false}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xs bg-muted">
              <MailWarning className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-center">Adresse email manquante</DialogTitle>
            <DialogDescription className="text-center">
              Pour recevoir un code de réinitialisation, veuillez d'abord renseigner votre email sur
              la page dédiée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleGoToForgot} className="w-full">
              Aller à la page "Mot de passe oublié"
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
