// src/features/vehicules/components/EntretienDialog.tsx

/**
 * @module features/vehicules/components/EntretienDialog
 * @description Fenêtre d'ajout / modification d'un entretien de véhicule.
 */

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wrench } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldLabel, FieldError, FieldDescription } from '@/components/ui/field';
import { DatePicker } from '@/components/ui/date-picker';
import { Spinner } from '@/components/ui/spinner';
import type { Entretien } from '@/types/vehicules.types';

/** Types d'entretien proposés (saisie libre possible). */
export const TYPES_ENTRETIEN = [
  'Vidange',
  'Révision',
  'Freins',
  'Pneumatiques',
  'Batterie',
  'Contrôle technique',
  'Carrosserie',
  'Climatisation',
  'Embrayage',
  'Autre',
];

const schema = z.object({
  type: z.string().trim().min(1, "Le type d'entretien est requis.").max(100),
  description: z.string().max(500, '500 caractères maximum.').optional(),
  cout: z.number().min(0, 'Le coût ne peut pas être négatif.').max(100_000_000).optional(),
  kilometre: z.number().int('Nombre entier attendu.').min(0).max(1_000_000).optional(),
  prochainKm: z.number().int('Nombre entier attendu.').min(0).max(1_000_000).optional(),
  date: z.date({ message: 'La date est requise.' }),
});

export type EntretienFormValues = z.infer<typeof schema>;

export interface EntretienDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Entretien à modifier ; absent = création. */
  entretien?: Entretien | null;
  /** Kilométrage actuel du véhicule (pré-remplissage). */
  kilometrageActuel?: number;
  onSubmit: (values: EntretienFormValues) => Promise<void>;
}

const numberOrUndefined = (e: React.ChangeEvent<HTMLInputElement>) =>
  e.target.value === '' ? undefined : e.target.valueAsNumber;

export default function EntretienDialog({
  open,
  onOpenChange,
  entretien,
  kilometrageActuel,
  onSubmit,
}: EntretienDialogProps) {
  const isEdit = Boolean(entretien);
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, isValid },
  } = useForm<EntretienFormValues>({ resolver: zodResolver(schema), mode: 'onChange' });

  React.useEffect(() => {
    if (!open) return;
    reset({
      type: entretien?.type ?? '',
      description: entretien?.description ?? '',
      cout: entretien?.cout ?? undefined,
      kilometre: entretien?.kilometre ?? kilometrageActuel ?? undefined,
      prochainKm: entretien?.prochainKm ?? undefined,
      date: entretien?.date ? new Date(entretien.date) : new Date(),
    });
  }, [open, entretien, kilometrageActuel, reset]);

  return (
    <Dialog open={open} onOpenChange={(o) => !isSubmitting && onOpenChange(o)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-amber-600" />
            {isEdit ? "Modifier l'entretien" : 'Nouvel entretien'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Corrigez les informations de l'intervention."
              : "Enregistrez une intervention réalisée sur le véhicule."}
          </DialogDescription>
        </DialogHeader>

        <form id="entretien-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Controller
            name="type"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
                <FieldLabel htmlFor="entretien-type">Type d'intervention *</FieldLabel>
                <Input {...field} id="entretien-type" list="entretien-types" placeholder="ex : Vidange" disabled={isSubmitting} />
                <datalist id="entretien-types">
                  {TYPES_ENTRETIEN.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
                {fieldState.invalid && <FieldError className="text-xs!" errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="date"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Date *</FieldLabel>
                <DatePicker
                  date={field.value}
                  onSelect={(d) => field.onChange(d)}
                  disabled={isSubmitting}
                  formatStr="dd/MM/yyyy"
                  placeholder="JJ/MM/AAAA"
                  className="w-full"
                />
                {fieldState.invalid && <FieldError className="text-xs!" errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="cout"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="entretien-cout">Coût (FCFA)</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  id="entretien-cout"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(numberOrUndefined(e))}
                  onBlur={field.onBlur}
                  disabled={isSubmitting}
                />
                {fieldState.invalid && <FieldError className="text-xs!" errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="kilometre"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="entretien-km">Kilométrage à l'intervention</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  id="entretien-km"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(numberOrUndefined(e))}
                  onBlur={field.onBlur}
                  disabled={isSubmitting}
                />
                {fieldState.invalid && <FieldError className="text-xs!" errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="prochainKm"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="entretien-prochain">Prochain entretien à (km)</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  id="entretien-prochain"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(numberOrUndefined(e))}
                  onBlur={field.onBlur}
                  disabled={isSubmitting}
                />
                {fieldState.invalid && <FieldError className="text-xs!" errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="description"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
                <FieldLabel htmlFor="entretien-description">Description</FieldLabel>
                <Textarea
                  {...field}
                  value={field.value ?? ''}
                  id="entretien-description"
                  rows={3}
                  className="resize-none text-sm"
                  placeholder="Pièces changées, garage, observations…"
                  disabled={isSubmitting}
                />
                <FieldDescription>Optionnel — 500 caractères maximum.</FieldDescription>
                {fieldState.invalid && <FieldError className="text-xs!" errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button type="submit" form="entretien-form" disabled={isSubmitting || !isValid}>
            {isSubmitting && <Spinner className="mr-2" />}
            {isEdit ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
