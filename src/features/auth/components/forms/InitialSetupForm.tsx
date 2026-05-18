/**
 * @module features/auth/components/InitialSetupForm
 * @description Formulaire d'initialisation: configuration entreprise et premier administrateur.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, ChevronLeftIcon, Crown, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import { EmailInput } from '@/components/forms/EmailInput';
import { LoadingButton } from '@/components/forms/LoadingButton';
import { PasswordInput } from '@/components/forms/PasswordInput';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { PUBLIC_ROUTES } from '@/config/routes';
import { initialSetupSchema, type InitialSetupInput } from '@/lib/validators/auth.validator';

interface InitialSetupFormProps {
  accessToken: string;
}

export default function InitialSetupForm({ accessToken }: InitialSetupFormProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit } = useForm<InitialSetupInput>({
    resolver: zodResolver(initialSetupSchema),
    defaultValues: {
      accessToken,
      company: {
        nom: 'Auto-École',
        adresse: '',
        telephone: '',
        email: '',
        siteWeb: '',
        numeroFiscal: '',
        logoPath: '',
      },
      admin: {
        prenom: '',
        nom: '',
        email: '',
        password: '',
        confirmPassword: '',
      },
    },
  });

  const onSubmit = async (data: InitialSetupInput) => {
    setIsLoading(true);
    try {
      await window.api.auth.createInitialSetup({
        accessToken: data.accessToken,
        company: data.company,
        admin: {
          prenom: data.admin.prenom,
          nom: data.admin.nom,
          email: data.admin.email,
          password: data.admin.password,
        },
      });
      toast.success('Initialisation terminée. Connectez-vous avec le compte administrateur.', {
        position: 'top-center',
      });
      navigate(PUBLIC_ROUTES.AUTH.LOGIN, { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Échec de l'initialisation", {
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
            to={PUBLIC_ROUTES.AUTH.REGISTER_ACCESS}
            className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeftIcon className="size-5" />
            Retour au code développeur
          </Link>
        </div>

        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">Initialiser l'application</h1>
          <p className="text-sm text-muted-foreground">
            Créez l'entreprise et le premier administrateur du système.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm font-semibold">
          <Building2 className="size-4 text-primary" />
          Entreprise
        </div>

        <Controller
          name="company.nom"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="company-name">Nom de l'entreprise</FieldLabel>
              <Input {...field} id="company-name" className="h-10" disabled={isLoading} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="company.adresse"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="company-address">Adresse</FieldLabel>
              <Input {...field} id="company-address" className="h-10" disabled={isLoading} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            name="company.telephone"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="company-phone">Téléphone</FieldLabel>
                <Input {...field} id="company-phone" className="h-10" disabled={isLoading} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="company.email"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="company-email">Email entreprise</FieldLabel>
                <Input
                  {...field}
                  id="company-email"
                  type="email"
                  className="h-10"
                  disabled={isLoading}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            name="company.siteWeb"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="company-website">Site web</FieldLabel>
                <Input {...field} id="company-website" className="h-10" disabled={isLoading} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="company.numeroFiscal"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="company-tax">Numéro fiscal</FieldLabel>
                <Input {...field} id="company-tax" className="h-10" disabled={isLoading} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        <Separator />

        <div className="flex items-center gap-2 text-sm font-semibold">
          <Crown className="size-4 text-primary" />
          Administrateur principal
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            name="admin.prenom"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="admin-firstname">Prénom</FieldLabel>
                <Input {...field} id="admin-firstname" className="h-10" disabled={isLoading} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="admin.nom"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="admin-lastname">Nom</FieldLabel>
                <Input {...field} id="admin-lastname" className="h-10" disabled={isLoading} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        <Controller
          name="admin.email"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="admin-email">Email administrateur</FieldLabel>
              <EmailInput
                {...field}
                id="admin-email"
                disabled={isLoading}
                error={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="admin.password"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="admin-password">Mot de passe</FieldLabel>
              <PasswordInput {...field} id="admin-password" disabled={isLoading} />
              <FieldDescription>
                Minimum 8 caractères, avec majuscule, minuscule, chiffre et caractère spécial.
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="admin.confirmPassword"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="admin-confirm-password">Confirmer le mot de passe</FieldLabel>
              <PasswordInput {...field} id="admin-confirm-password" disabled={isLoading} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <LoadingButton
          type="submit"
          isLoading={isLoading}
          loadingText="Initialisation..."
          icon={ShieldCheck}
          className="w-full"
        >
          Créer l'entreprise et l'admin
        </LoadingButton>
      </FieldGroup>
    </form>
  );
}
