/**
 * @module features/auth/components/RegisterForm
 * @description Formulaire d'inscription complet avec validation Zod, acceptation des CGU, et OAuth.
 * @see {@link useAuth} pour les actions d'authentification
 * @see {@link registerSchema} pour les règles de validation
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ChevronLeftIcon, UserPlus } from 'lucide-react';
import { Field, FieldGroup, FieldLabel, FieldDescription, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { EmailInput } from '@/components/forms/EmailInput';
import { PasswordInput } from '@/components/forms/PasswordInput';
import { LoadingButton } from '@/components/forms/LoadingButton';
import { createUserSchema, type CreateUserInput } from '@/lib/validators/auth.validator';
import { useAuth } from '@/hooks/use.auth';
import { PUBLIC_ROUTES } from '@/config/routes';
import { RegisterSuccess } from '../RegisterSuccess';

/**
 * Formulaire d'inscription. Gère la création de compte, la validation des champs,
 * l'acceptation des conditions générales, et l'affichage des erreurs via toast.promise.
 *
 * @example
 * ```tsx
 * <RegisterForm />
 * ```
 */
export default function RegisterForm() {
  const { createUser, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [registrationDone, setRegistrationDone] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const { control, handleSubmit } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      password: '',
      nom: '',
      prenom: '',
      niveau: 'STANDARD',
      role: 'SECRETAIRE',
      creeParId: user?.id,
    },
  });

  const onSubmit = async (data: CreateUserInput) => {
    setIsLoading(true);
    await toast.promise(
      async () => {
        await createUser(data);
        setRegisteredEmail(data.email);
        setRegistrationDone(true);
      },
      {
        loading: 'Inscription en cours...',
        success: 'Inscription réussie',
        error: (err) => (err instanceof Error ? err.message : 'Échec de l’inscription'),
        position: 'top-center',
      }
    );
    setIsLoading(false);
  };

  if (registrationDone) {
    return <RegisterSuccess email={registeredEmail} />;
  }

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
          <h1 className="text-3xl font-bold">Créer un compte</h1>
          <p className="text-sm text-muted-foreground">
            Remplissez le formulaire pour rejoindre Auto-École COS
          </p>
        </div>

        {/* Prénom et Nom (2 colonnes) */}
        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="prenom"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="firstName">Prénom</FieldLabel>
                <Input
                  {...field}
                  id="firstName"
                  placeholder="Jean"
                  aria-invalid={fieldState.invalid}
                  className="h-10"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="nom"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="lastName">Nom</FieldLabel>
                <Input
                  {...field}
                  id="lastName"
                  placeholder="Dupont"
                  aria-invalid={fieldState.invalid}
                  className="h-10"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        {/* Email */}
        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="register-email">Email</FieldLabel>
              <EmailInput {...field} id="register-email" error={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Mot de passe */}
        <Controller
          name="password"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="register-password">Mot de passe</FieldLabel>
              <PasswordInput {...field} id="register-password" disabled={isLoading} />
              <FieldDescription>
                Minimum 8 caractères, une majuscule, une minuscule, un chiffre, un caractère
                spécial.
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Bouton d'inscription avec icône */}
        <LoadingButton
          type="submit"
          isLoading={isLoading}
          loadingText="Création en cours..."
          icon={UserPlus}
          className="w-full"
        >
          Créer mon compte
        </LoadingButton>

        {/* Lien vers la connexion */}
        <FieldDescription className="text-center">
          Vous avez déjà un compte ?{' '}
          <Link to={PUBLIC_ROUTES.AUTH.LOGIN} className="underline underline-offset-4">
            Connectez-vous
          </Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
