// src/features/vehicules/components/VehiculeForm.tsx

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * @module features/vehicules/components/VehiculeForm
 * @description
 * Formulaire d'un véhicule (création et édition), validé par `createVehiculeSchema`.
 *
 * Sections :
 *  1. Identification — immatriculation (unicité vérifiée), marque, modèle, année
 *  2. Exploitation — catégorie de permis, statut, kilométrage, date d'acquisition
 *  3. Révision — dernière révision, kilométrage de la prochaine révision
 */

import * as React from 'react';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { Car, Gauge, Hash, CalendarDays, Wrench, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Field, FieldLabel, FieldError, FieldDescription } from '@/components/ui/field';
import { Separator } from '@/components/ui/separator';
import { DatePicker } from '@/components/ui/date-picker';
import { SectionHeader } from '@/components/forms/FormPageKit';
import type { FormPageProps } from '@/components/forms/FormWrapper';
import { cn } from '@/lib/utils';

import {
  createVehiculeSchema,
  CATEGORIE_PERMIS_VALUES,
  STATUT_VEHICULE_VALUES,
  type CreateVehiculeInput,
} from '@/lib/validators/vehicules.validator';
import { CATEGORIE_PERMIS_CONFIG, STATUT_VEHICULE_CONFIG } from '@/types/enums';
import { useVehicules } from '@/hooks/use.vehicules';

type Values = z.input<typeof createVehiculeSchema>;

export interface VehiculeFormProps extends FormPageProps<Partial<CreateVehiculeInput>> {
  /** En édition : identifiant exclu du contrôle d'unicité de l'immatriculation. */
  vehiculeId?: number;
}

const toDate = (v: unknown): Date | undefined => {
  if (!v) return undefined;
  const d = new Date(v as string);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

const numberOrUndefined = (e: React.ChangeEvent<HTMLInputElement>) =>
  e.target.value === '' ? undefined : e.target.valueAsNumber;

export default function VehiculeForm({ data, onChange, isSubmitting, vehiculeId }: VehiculeFormProps) {
  const { isImmatriculationUnique } = useVehicules();

  const {
    control,
    setError,
    clearErrors,
    formState: { isValid, errors },
  } = useForm<Values>({
    resolver: zodResolver(createVehiculeSchema),
    mode: 'onChange',
    defaultValues: {
      immatriculation: data.immatriculation ?? '',
      marque: data.marque ?? '',
      modele: data.modele ?? '',
      annee: data.annee ?? new Date().getFullYear(),
      categorie: (data.categorie as any) ?? 'B',
      kilometrage: data.kilometrage ?? 0,
      statut: (data.statut as any) ?? 'DISPONIBLE',
      dateAcquisition: data.dateAcquisition as any,
      dateDerniereRevision: (data.dateDerniereRevision as any) ?? null,
      prochaineRevisionKm: data.prochaineRevisionKm ?? null,
    },
  });

  const values = useWatch({ control });
  // Résultat du dernier contrôle d'unicité, associé à la valeur contrôlée.
  const [check, setCheck] = React.useState<{ value: string; status: 'ok' | 'taken' | 'error' } | null>(null);
  const immat = (values.immatriculation ?? '').trim().toUpperCase();
  const immatCheckable = immat.length > 0 && /^[A-Z0-9-]+$/.test(immat);
  const immatStatus: 'idle' | 'checking' | 'ok' | 'taken' = !immatCheckable
    ? 'idle'
    : check?.value !== immat
      ? 'checking'
      : check.status === 'error'
        ? 'idle'
        : check.status;

  // Contrôle d'unicité de l'immatriculation (anti-rebond 400 ms)
  React.useEffect(() => {
    if (!immatCheckable) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const unique = await isImmatriculationUnique(immat, vehiculeId);
        if (cancelled) return;
        setCheck({ value: immat, status: unique ? 'ok' : 'taken' });
        if (unique) clearErrors('immatriculation');
        else setError('immatriculation', { type: 'manual', message: 'Cette immatriculation est déjà utilisée.' });
      } catch {
        if (!cancelled) setCheck({ value: immat, status: 'error' });
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [immat, immatCheckable, vehiculeId, isImmatriculationUnique, setError, clearErrors]);

  const formValid = isValid && immatStatus !== 'taken' && immatStatus !== 'checking' && !errors.immatriculation;

  React.useEffect(() => {
    onChange(
      {
        ...values,
        immatriculation: (values.immatriculation ?? '').toUpperCase(),
      } as Partial<CreateVehiculeInput>,
      formValid
    );
  }, [values, formValid, onChange]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className="space-y-8">
      {/* 1. Identification */}
      <section className="space-y-4">
        <SectionHeader icon={Car} title="Identification" description="Plaque, marque, modèle et année du véhicule." accent="sky" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Controller
            name="immatriculation"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
                <FieldLabel htmlFor="vehicule-immat">
                  <span className="flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                    Immatriculation *
                  </span>
                </FieldLabel>
                <div className="relative">
                  <Input
                    {...field}
                    id="vehicule-immat"
                    placeholder="ex : LT-123-AB"
                    className="h-12 uppercase pr-10 font-mono tracking-wider"
                    disabled={isSubmitting}
                    aria-invalid={fieldState.invalid}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    {immatStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    {immatStatus === 'ok' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    {immatStatus === 'taken' && <AlertCircle className="h-4 w-4 text-destructive" />}
                  </span>
                </div>
                <FieldDescription>Lettres, chiffres et tirets. Doit être unique.</FieldDescription>
                {fieldState.invalid && <FieldError className="text-xs!" errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {(['marque', 'modele'] as const).map((name) => (
            <Controller
              key={name}
              name={name}
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`vehicule-${name}`}>{name === 'marque' ? 'Marque *' : 'Modèle *'}</FieldLabel>
                  <Input
                    {...field}
                    id={`vehicule-${name}`}
                    placeholder={name === 'marque' ? 'ex : Toyota' : 'ex : Corolla'}
                    className="h-12"
                    disabled={isSubmitting}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError className="text-xs!" errors={[fieldState.error]} />}
                </Field>
              )}
            />
          ))}

          <Controller
            name="annee"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="vehicule-annee">Année de fabrication *</FieldLabel>
                <Input
                  type="number"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(numberOrUndefined(e))}
                  id="vehicule-annee"
                  min={1950}
                  max={new Date().getFullYear() + 1}
                  className="h-12"
                  disabled={isSubmitting}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError className="text-xs!" errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="categorie"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="vehicule-categorie">Catégorie de permis *</FieldLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={isSubmitting}>
                  <SelectTrigger id="vehicule-categorie" className={cn('h-12!', fieldState.invalid && 'border-destructive')}>
                    <SelectValue placeholder="Sélectionner…" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIE_PERMIS_VALUES.map((cat) => {
                      const cfg = CATEGORIE_PERMIS_CONFIG[cat];
                      return (
                        <SelectItem key={cat} value={cat}>
                          <span className="font-semibold">{cfg.label.split('—')[0].trim()}</span>
                          <span className="text-xs text-muted-foreground"> — {cfg.description}</span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError className="text-xs!" errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>
      </section>

      <Separator className="my-2" />

      {/* 2. Exploitation */}
      <section className="space-y-4">
        <SectionHeader icon={Gauge} title="Exploitation" description="Statut, kilométrage et date d'acquisition." accent="sky" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Controller
            name="statut"
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="vehicule-statut">Statut</FieldLabel>
                <Select onValueChange={field.onChange} value={field.value ?? 'DISPONIBLE'} disabled={isSubmitting}>
                  <SelectTrigger id="vehicule-statut" className="h-12!">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUT_VEHICULE_VALUES.map((s) => {
                      const cfg = STATUT_VEHICULE_CONFIG[s];
                      return (
                        <SelectItem key={s} value={s}>
                          <span className={cn('flex items-center gap-2', cfg.textColor)}>
                            <cfg.icon className="h-4 w-4" />
                            {cfg.label}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />

          <Controller
            name="kilometrage"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="vehicule-km">Kilométrage actuel (km)</FieldLabel>
                <Input
                  type="number"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(numberOrUndefined(e))}
                  id="vehicule-km"
                  min={0}
                  className="h-12"
                  disabled={isSubmitting}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError className="text-xs!" errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="dateAcquisition"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
                <FieldLabel>
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    Date d'acquisition
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
                {fieldState.invalid && <FieldError className="text-xs!" errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>
      </section>

      <Separator className="my-2" />

      {/* 3. Révision */}
      <section className="space-y-4">
        <SectionHeader icon={Wrench} title="Suivi des révisions" description="Optionnel : utilisé pour les alertes d'entretien." accent="sky" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Controller
            name="dateDerniereRevision"
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel>Dernière révision</FieldLabel>
                <DatePicker
                  date={toDate(field.value)}
                  onSelect={(d) => field.onChange(d ? d.toISOString() : null)}
                  disabled={isSubmitting}
                  formatStr="dd/MM/yyyy"
                  placeholder="JJ/MM/AAAA"
                  className="w-full h-12"
                />
              </Field>
            )}
          />

          <Controller
            name="prochaineRevisionKm"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="vehicule-prochaine-km">Prochaine révision à (km)</FieldLabel>
                <Input
                  type="number"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value === '' ? null : e.target.valueAsNumber)}
                  id="vehicule-prochaine-km"
                  min={0}
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

      <p className="text-xs text-muted-foreground border-t pt-4">
        Les champs marqués d&apos;un astérisque (*) sont obligatoires.
      </p>
    </motion.div>
  );
}
