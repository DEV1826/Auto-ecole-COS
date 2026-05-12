/**
 * @module features/auth/components/LoginForm
 * @description Formulaire de connexion utilisateur avec validation Zod, gestion des erreurs, et authentification OAuth.
 * @see {@link useAuth} pour les actions d'authentification
 * @see {@link loginSchema} pour les règles de validation
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ChevronLeftIcon, LogIn } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field';
import { EmailInput } from '@/components/forms/EmailInput';
import { PasswordInput } from '@/components/forms/PasswordInput';
import { LoadingButton } from '@/components/forms/LoadingButton';
import { loginSchema, type LoginInput } from '@/lib/validators/auth.validator';
import { useAuth } from '@/hooks/use.auth';
import { PROTECTED_ROUTES, PUBLIC_ROUTES } from '@/config/routes';

/**
 * Formulaire de connexion.
 * - Utilise `react-hook-form` et `zod` pour la validation.
 * - Affiche les erreurs de validation en temps réel.
 * - Gère l'état de chargement avec `toast.promise`.
 * - Intègre les boutons d'authentification sociale (Google, X).
 *
 * @example
 * ```tsx
 * <LoginForm />
 * ```
 */
export default function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { control, handleSubmit } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const redirect = () => {
    navigate(PROTECTED_ROUTES.DASHBOARD, {
      replace: true,
    });
  };

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      await login(data);
      redirect();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Échec de la connexion', {
        position: 'top-center',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <FieldGroup>
        <div className="w-full max-w-md pt-10 mx-auto">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ChevronLeftIcon className="size-5" />
            Retour à l'accueil
          </Link>
        </div>
        {/* Titre et description alignés à gauche */}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold ">Connexion</h1>
          <p className="text-sm text-muted-foreground">
            Entrez votre email et mot de passe pour accéder à votre compte
          </p>
        </div>

        {/* Champ Email */}
        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="login-email">Email</FieldLabel>
              <EmailInput {...field} id="login-email" error={fieldState.invalid} required />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Champ Mot de passe + lien "Mot de passe oublié" */}
        <Controller
          name="password"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="login-password">Mot de passe</FieldLabel>
                <Link
                  to={PUBLIC_ROUTES.AUTH.FORGOT_PASSWORD}
                  className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <PasswordInput {...field} id="login-password" autoComplete="" required />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Option "Se souvenir de moi" */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(!!checked)}
            />
            <label htmlFor="remember" className="text-sm cursor-pointer">
              Se souvenir de moi
            </label>
          </div>
        </div>

        {/* Bouton de connexion avec icône */}
        <LoadingButton
          type="submit"
          isLoading={isLoading}
          loadingText="Connexion en cours..."
          icon={LogIn}
          className="w-full"
        >
          Se connecter
        </LoadingButton>
      </FieldGroup>
    </form>
  );
}
