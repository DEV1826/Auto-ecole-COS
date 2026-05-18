/**
 * @module features/auth/components/DeveloperSetupAccessForm
 * @description Formulaire d'accès développeur pour sécuriser l'initialisation du système.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeftIcon, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import { LoadingButton } from '@/components/forms/LoadingButton';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PUBLIC_ROUTES } from '@/config/routes';
import {
  developerSetupCodeSchema,
  type DeveloperSetupCodeInput,
} from '@/lib/validators/auth.validator';

export default function DeveloperSetupAccessForm() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit } = useForm<DeveloperSetupCodeInput>({
    resolver: zodResolver(developerSetupCodeSchema),
    defaultValues: { code: '' },
  });

  const onSubmit = async ({ code }: DeveloperSetupCodeInput) => {
    setIsLoading(true);
    try {
      const access = await window.api.auth.verifyDeveloperSetupCode(code);
      navigate(PUBLIC_ROUTES.AUTH.REGISTER, {
        replace: true,
        state: {
          developerSetupAccess: true,
          setupAccessToken: access.accessToken,
          expiresAt: access.expiresAt,
          timestamp: access.expiresAt - 10 * 60 * 1000,
        },
      });
      toast.success('Accès développeur validé');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Code développeur invalide', {
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
            to={PUBLIC_ROUTES.AUTH.LOGIN}
            className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeftIcon className="size-5" />
            Retour à la connexion
          </Link>
        </div>

        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">Accès développeur</h1>
          <p className="text-sm text-muted-foreground">
            Entrez le code fourni par les développeurs pour initialiser l'application.
          </p>
        </div>

        <Controller
          name="code"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="developer-code">Code d'accès</FieldLabel>
              <Input
                {...field}
                id="developer-code"
                type="password"
                autoComplete="one-time-code"
                placeholder="Code développeur"
                className="h-12"
                disabled={isLoading}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              <FieldDescription>
                Ce code n'est pas stocké côté interface et expire après validation.
              </FieldDescription>
            </Field>
          )}
        />

        <LoadingButton
          type="submit"
          isLoading={isLoading}
          loadingText="Validation..."
          icon={ShieldCheck}
          className="w-full"
        >
          Valider l'accès
        </LoadingButton>
      </FieldGroup>
    </form>
  );
}
