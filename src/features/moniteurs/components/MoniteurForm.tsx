// src/features/moniteurs/components/MoniteurForm.tsx

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * @module features/moniteurs/components/MoniteurForm
 * @description Formulaire d'un moniteur (création et édition), validé par `createMoniteurSchema`.
 */

import * as React from 'react';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { UserRound, Phone, BadgeCheck, CalendarDays, Award, KeyRound } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Field, FieldLabel, FieldError, FieldDescription } from '@/components/ui/field';
import { Separator } from '@/components/ui/separator';
import { DatePicker } from '@/components/ui/date-picker';
import { EmailInput } from '@/components/forms/EmailInput';
import { SectionHeader } from '@/components/forms/FormPageKit';
import { EntityCombobox, type EntityOption } from '@/components/forms/EntityCombobox';
import type { CompteMoniteur } from '@/types/moniteurs.types';
import type { FormPageProps } from '@/components/forms/FormWrapper';

import { createMoniteurSchema, type CreateMoniteurInput } from '@/lib/validators/moniteurs.validator';

type Values = z.input<typeof createMoniteurSchema>;

/** Spécialités proposées (saisie libre possible). */
const SPECIALITES = [
  'Permis B',
  'Permis A (moto)',
  'Permis C (poids lourd)',
  'Permis D (transport en commun)',
  'Code de la route',
  'Conduite accompagnée',
];

const toDate = (v: unknown): Date | undefined => {
  if (!v) return undefined;
  const d = new Date(v as string);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

export interface MoniteurFormProps extends FormPageProps<Partial<CreateMoniteurInput>> {
  /** Fiche en cours d'édition : son compte lié reste proposé dans la liste. */
  moniteurId?: number;
}

export default function MoniteurForm({ data, onChange, isSubmitting, moniteurId }: MoniteurFormProps) {
  // Comptes de rôle MONITEUR encore libres (ou celui déjà lié à cette fiche).
  const [comptes, setComptes] = React.useState<CompteMoniteur[] | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    window.api.moniteurs
      .getComptesDisponibles(moniteurId)
      .then((list) => !cancelled && setComptes(list))
      .catch(() => !cancelled && setComptes([]));
    return () => {
      cancelled = true;
    };
  }, [moniteurId]);

  const {
    control,
    formState: { isValid },
  } = useForm<Values>({
    resolver: zodResolver(createMoniteurSchema),
    mode: 'onChange',
    defaultValues: {
      nom: data.nom ?? '',
      prenom: data.prenom ?? '',
      email: data.email ?? null,
      telephone: data.telephone ?? '',
      specialite: data.specialite ?? '',
      dateEmbauche: data.dateEmbauche as any,
      actif: data.actif ?? true,
      utilisateurId: data.utilisateurId ?? null,
    },
  });

  const values = useWatch({ control });

  React.useEffect(() => {
    onChange(
      {
        ...values,
        email: values.email ? values.email : null,
        telephone: values.telephone?.trim() || undefined,
        specialite: values.specialite?.trim() || null,
        utilisateurId: values.utilisateurId ?? null,
      } as Partial<CreateMoniteurInput>,
      isValid
    );
  }, [values, isValid, onChange]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className="space-y-8">
      <section className="space-y-4">
        <SectionHeader icon={UserRound} title="Identité" description="Nom et prénom du moniteur." accent="teal" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(['nom', 'prenom'] as const).map((name) => (
            <Controller
              key={name}
              name={name}
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`moniteur-${name}`}>{name === 'nom' ? 'Nom *' : 'Prénom *'}</FieldLabel>
                  <Input
                    {...field}
                    id={`moniteur-${name}`}
                    placeholder={name === 'nom' ? 'ex : Mbarga' : 'ex : Paul'}
                    className="h-12"
                    disabled={isSubmitting}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError className="text-xs!" errors={[fieldState.error]} />}
                </Field>
              )}
            />
          ))}
        </div>
      </section>

      <Separator className="my-2" />

      <section className="space-y-4">
        <SectionHeader icon={Phone} title="Coordonnées" description="Optionnelles, utilisées pour les convocations." accent="teal" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Controller
            name="email"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="moniteur-email">E-mail</FieldLabel>
                <EmailInput
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(e.target.value === '' ? null : e.target.value)}
                  id="moniteur-email"
                  placeholder="moniteur@exemple.com"
                  className="h-12"
                  error={fieldState.invalid}
                  disabled={isSubmitting}
                />
                <FieldDescription>Doit être unique.</FieldDescription>
                {fieldState.invalid && <FieldError className="text-xs!" errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="telephone"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="moniteur-tel">Téléphone</FieldLabel>
                <Input
                  {...field}
                  value={field.value ?? ''}
                  type="tel"
                  id="moniteur-tel"
                  placeholder="ex : 6 99 00 00 00"
                  className="h-12"
                  disabled={isSubmitting}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError className="text-xs!" errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>
      </section>

      <Separator className="my-2" />

      <section className="space-y-4">
        <SectionHeader icon={Award} title="Activité" description="Spécialité, date d'embauche et statut." accent="teal" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Controller
            name="specialite"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="moniteur-specialite">Spécialité</FieldLabel>
                <Input
                  {...field}
                  value={field.value ?? ''}
                  list="moniteur-specialites"
                  id="moniteur-specialite"
                  placeholder="ex : Permis B"
                  className="h-12"
                  disabled={isSubmitting}
                />
                <datalist id="moniteur-specialites">
                  {SPECIALITES.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
                {fieldState.invalid && <FieldError className="text-xs!" errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="dateEmbauche"
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel>
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    Date d'embauche
                  </span>
                </FieldLabel>
                <DatePicker
                  date={toDate(field.value)}
                  onSelect={(d) => field.onChange(d ? d.toISOString() : undefined)}
                  disabled={isSubmitting}
                  formatStr="dd/MM/yyyy"
                  placeholder="JJ/MM/AAAA"
                  className="w-full h-12"
                />
                <FieldDescription>Par défaut : la date du jour.</FieldDescription>
              </Field>
            )}
          />
        </div>

        <Controller
          name="actif"
          control={control}
          render={({ field }) => (
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FieldLabel htmlFor="moniteur-actif" className="text-sm font-medium flex items-center gap-1.5">
                  <BadgeCheck className="h-3.5 w-3.5 text-muted-foreground" />
                  Moniteur actif
                </FieldLabel>
                <FieldDescription>Un moniteur inactif ne peut plus être affecté à de nouvelles leçons.</FieldDescription>
              </div>
              <Switch id="moniteur-actif" checked={field.value ?? true} onCheckedChange={field.onChange} disabled={isSubmitting} />
            </div>
          )}
        />
      </section>

      <Separator className="my-2" />

      <section className="space-y-4">
        <SectionHeader
          icon={KeyRound}
          title="Compte de connexion"
          description="Compte utilisateur (rôle Moniteur) avec lequel ce moniteur se connecte : son planning et son tableau de bord affichent ses propres leçons."
          accent="teal"
        />
        <Controller
          name="utilisateurId"
          control={control}
          render={({ field, fieldState }) => {
            const options: EntityOption[] = (comptes ?? []).map((c) => ({
              id: c.id,
              label: `${c.prenom} ${c.nom}`,
              sublabel: c.email,
            }));
            return (
              <Field data-invalid={fieldState.invalid}>
                <EntityCombobox
                  id="moniteur-compte"
                  icon={KeyRound}
                  options={options}
                  value={field.value ?? null}
                  onChange={(id) => field.onChange(id)}
                  placeholder="Aucun compte lié"
                  searchPlaceholder="Nom ou e-mail du compte…"
                  emptyText="Aucun compte de rôle Moniteur disponible."
                  loading={comptes === null}
                  disabled={isSubmitting}
                  clearable
                />
                <FieldDescription>
                  Seuls les comptes actifs de rôle « Moniteur » non liés à une autre fiche sont proposés. Créez le compte
                  dans Administration › Utilisateurs si besoin.
                </FieldDescription>
                {fieldState.invalid && <FieldError className="text-xs!" errors={[fieldState.error]} />}
              </Field>
            );
          }}
        />
      </section>

      <p className="text-xs text-muted-foreground border-t pt-4">
        Les champs marqués d&apos;un astérisque (*) sont obligatoires.
      </p>
    </motion.div>
  );
}
