// src/features/examens/components/ExamenEditForm.tsx

/**
 * @module features/examens/components/ExamenEditForm
 * @description
 * Édition d'un examen existant : date, centre, résultat, note et remarques.
 * Le candidat et le type d'épreuve ne sont pas modifiables (cf. `updateExamenSchema`).
 */

import * as React from 'react';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { Award, CalendarDays, MapPin, StickyNote } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldLabel, FieldError, FieldDescription } from '@/components/ui/field';
import { Separator } from '@/components/ui/separator';
import { DatePicker } from '@/components/ui/date-picker';
import { SectionHeader } from '@/components/forms/FormPageKit';
import { cn } from '@/lib/utils';
import { RESULTAT_EXAMEN_VALUES } from '@/lib/validators/examens.validator';
import { RESULTAT_EXAMEN_CONFIG } from '@/types/enums';
import type { ResultatExamen } from '@/types/enums';

const schema = z.object({
  date: z.date({ message: 'La date est requise.' }),
  centre: z.string().max(200, '200 caractères maximum.').optional(),
  notes: z.string().max(500, '500 caractères maximum.').optional(),
  resultat: z.enum(RESULTAT_EXAMEN_VALUES),
  note: z
    .number()
    .min(0, 'Minimum 0.')
    .max(20, 'Maximum 20.')
    .multipleOf(0.5, 'Multiple de 0,5 attendu.')
    .nullable()
    .optional(),
});

type Values = z.infer<typeof schema>;

export interface ExamenEditData {
  date?: string;
  centre?: string | null;
  notes?: string | null;
  resultat?: ResultatExamen;
  note?: number | null;
}

export interface ExamenEditFormProps {
  data: ExamenEditData;
  onChange: (data: ExamenEditData, isValid: boolean) => void;
  isSubmitting?: boolean;
}

export default function ExamenEditForm({ data, onChange, isSubmitting }: ExamenEditFormProps) {
  const {
    control,
    formState: { isValid },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      date: data.date ? new Date(data.date) : new Date(),
      centre: data.centre ?? '',
      notes: data.notes ?? '',
      resultat: data.resultat ?? 'EN_ATTENTE',
      note: data.note ?? null,
    },
  });

  const v = useWatch({ control });

  React.useEffect(() => {
    onChange(
      {
        date: v.date ? new Date(v.date).toISOString() : undefined,
        centre: v.centre?.trim() || null,
        notes: v.notes?.trim() || null,
        resultat: v.resultat,
        // Pas de note tant que le résultat n'est pas connu.
        note: v.resultat === 'EN_ATTENTE' ? null : (v.note ?? null),
      },
      isValid
    );
  }, [v, isValid, onChange]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className="space-y-8">
      <section className="space-y-4">
        <SectionHeader icon={CalendarDays} title="Convocation" description="Date et centre d'examen." />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Controller
            name="date"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Date de l'examen *</FieldLabel>
                <DatePicker
                  date={field.value}
                  onSelect={(d) => field.onChange(d)}
                  disabled={isSubmitting}
                  formatStr="EEE dd/MM/yyyy"
                  placeholder="JJ/MM/AAAA"
                  className="w-full h-12"
                />
                {fieldState.invalid && <FieldError className="text-xs!" errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="centre"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="examen-centre">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    Centre d'examen
                  </span>
                </FieldLabel>
                <Input {...field} value={field.value ?? ''} id="examen-centre" className="h-12" placeholder="ex : Centre de Yaoundé" disabled={isSubmitting} />
                {fieldState.invalid && <FieldError className="text-xs!" errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>
      </section>

      <Separator className="my-2" />

      <section className="space-y-4">
        <SectionHeader icon={Award} title="Résultat" description="À renseigner après l'épreuve." />
        <Controller
          name="resultat"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Résultat">
              {RESULTAT_EXAMEN_VALUES.map((r) => {
                const cfg = RESULTAT_EXAMEN_CONFIG[r];
                const active = field.value === r;
                return (
                  <button
                    key={r}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={isSubmitting}
                    onClick={() => field.onChange(r)}
                    className={cn(
                      'flex items-center gap-2 rounded-md border p-3 text-left text-sm transition-colors',
                      active ? cn('border-transparent ring-2 ring-offset-1 ring-indigo-500', cfg.bgColor) : 'hover:bg-muted/50'
                    )}
                  >
                    <cfg.icon className={cn('h-4 w-4', active ? cfg.textColor : 'text-muted-foreground')} />
                    <span className={cn('font-medium', active && cfg.textColor)}>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        />
        {v.resultat !== 'EN_ATTENTE' && (
          <Controller
            name="note"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="max-w-xs">
                <FieldLabel htmlFor="examen-note">Note (sur 20)</FieldLabel>
                <Input
                  type="number"
                  step={0.5}
                  min={0}
                  max={20}
                  id="examen-note"
                  className="h-12"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value === '' ? null : e.target.valueAsNumber)}
                  onBlur={field.onBlur}
                  disabled={isSubmitting}
                />
                <FieldDescription>Optionnelle — par pas de 0,5.</FieldDescription>
                {fieldState.invalid && <FieldError className="text-xs!" errors={[fieldState.error]} />}
              </Field>
            )}
          />
        )}
      </section>

      <Separator className="my-2" />

      <section className="space-y-4">
        <SectionHeader icon={StickyNote} title="Remarques" />
        <Controller
          name="notes"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <Textarea
                {...field}
                value={field.value ?? ''}
                rows={3}
                className="resize-none text-sm"
                placeholder="Observations de l'examinateur, points à retravailler…"
                disabled={isSubmitting}
              />
              {fieldState.invalid && <FieldError className="text-xs!" errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </section>
    </motion.div>
  );
}
