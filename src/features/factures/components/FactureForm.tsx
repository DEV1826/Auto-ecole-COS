// src/features/factures/components/FactureForm.tsx

/**
 * @module features/factures/components/FactureForm
 * @description
 * Création d'une facture : candidat, montant (avec suggestion du reste à
 * facturer d'après la formation et les factures existantes), dates et notes.
 * Le numéro est généré automatiquement par le service.
 */

import * as React from 'react';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { CalendarDays, Coins, GraduationCap, Receipt, StickyNote, Wand2 } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel, FieldError, FieldDescription } from '@/components/ui/field';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { DatePicker } from '@/components/ui/date-picker';
import { EntityCombobox, type EntityOption } from '@/components/forms/EntityCombobox';
import { SectionHeader } from '@/components/forms/FormPageKit';

import { useCandidats } from '@/hooks/use.candidats';
import { usePaiements } from '@/hooks/use.paiements';
import { useFactures } from '@/hooks/use.factures';
import type { Candidat } from '@/types/candidats.types';

const schema = z
  .object({
    candidatId: z.number({ message: 'Choisissez un candidat.' }).int().positive('Choisissez un candidat.'),
    montantTotal: z
      .number({ message: 'Le montant est requis.' })
      .int('Montant entier attendu.')
      .positive('Le montant doit être positif.')
      .max(100_000_000, '100 millions FCFA maximum.'),
    dateEmission: z.date({ message: "La date d'émission est requise." }),
    dateEcheance: z.date().nullable().optional(),
    notes: z.string().max(500, '500 caractères maximum.').optional(),
  })
  .refine((v) => !v.dateEcheance || v.dateEcheance >= v.dateEmission, {
    message: "L'échéance doit être postérieure à la date d'émission.",
    path: ['dateEcheance'],
  });

type Values = z.infer<typeof schema>;

export interface FactureFormData {
  candidatId?: number;
  montantTotal?: number;
  dateEmission?: string;
  dateEcheance?: string | null;
  notes?: string | null;
}

/** Contexte financier du candidat sélectionné (pour l'aperçu). */
export interface FactureContexte {
  candidat?: Candidat;
  formationNom?: string | null;
  montantFormation: number;
  totalPaye: number;
  dejaFacture: number;
}

export interface FactureFormProps {
  data: FactureFormData;
  onChange: (data: FactureFormData, isValid: boolean) => void;
  onContexteChange?: (ctx: FactureContexte | null) => void;
  isSubmitting?: boolean;
}

const fcfa = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} FCFA`;

export default function FactureForm({ data, onChange, onContexteChange, isSubmitting }: FactureFormProps) {
  const { getAll: getCandidats } = useCandidats();
  const { getSoldeCandidat } = usePaiements();
  const { getFacturesByCandidat } = useFactures();

  const [candidats, setCandidats] = React.useState<Candidat[]>([]);
  const [candidatsLoading, setCandidatsLoading] = React.useState(true);
  const [contexte, setContexte] = React.useState<{ id: number; ctx: FactureContexte } | null>(null);

  const {
    control,
    setValue,
    formState: { isValid },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      candidatId: data.candidatId,
      montantTotal: data.montantTotal,
      dateEmission: data.dateEmission ? new Date(data.dateEmission) : new Date(),
      dateEcheance: data.dateEcheance ? new Date(data.dateEcheance) : null,
      notes: data.notes ?? '',
    },
  });
  const v = useWatch({ control });

  React.useEffect(() => {
    let cancelled = false;
    getCandidats({ page: 1, limit: 1000 })
      .then((r) => !cancelled && setCandidats(r.candidats ?? []))
      .catch(() => undefined)
      .finally(() => !cancelled && setCandidatsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [getCandidats]);

  // Contexte financier du candidat choisi
  React.useEffect(() => {
    const id = v.candidatId;
    if (!id) return;
    let cancelled = false;
    Promise.all([getSoldeCandidat(id), getFacturesByCandidat(id)])
      .then(([solde, factures]) => {
        if (cancelled) return;
        setContexte({
          id,
          ctx: {
            candidat: candidats.find((c) => c.id === id),
            formationNom: solde.formationNom,
            montantFormation: solde.montantTotalFormation ?? 0,
            totalPaye: solde.totalPaye ?? 0,
            dejaFacture: factures.filter((f) => f.statut !== 'ANNULEE').reduce((s, f) => s + f.montantTotal, 0),
          },
        });
      })
      .catch(() => !cancelled && setContexte(null));
    return () => {
      cancelled = true;
    };
  }, [v.candidatId, candidats, getSoldeCandidat, getFacturesByCandidat]);

  const ctx = contexte && contexte.id === v.candidatId ? contexte.ctx : null;
  const resteAFacturer = ctx ? Math.max(0, ctx.montantFormation - ctx.dejaFacture) : 0;

  React.useEffect(() => {
    onContexteChange?.(ctx);
  }, [ctx, onContexteChange]);

  React.useEffect(() => {
    onChange(
      {
        candidatId: v.candidatId,
        montantTotal: v.montantTotal,
        dateEmission: v.dateEmission ? new Date(v.dateEmission).toISOString() : undefined,
        dateEcheance: v.dateEcheance ? new Date(v.dateEcheance).toISOString() : null,
        notes: v.notes?.trim() || null,
      },
      isValid
    );
  }, [v, isValid, onChange]);

  const options: EntityOption[] = candidats.map((c) => ({
    id: c.id,
    label: `${c.prenom} ${c.nom}`,
    sublabel: `Permis ${c.categorie}${c.telephone ? ` · ${c.telephone}` : ''}`,
    keywords: `${c.email ?? ''} ${c.numeroPermis ?? ''}`,
  }));

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className="space-y-8">
      <section className="space-y-4">
        <SectionHeader icon={GraduationCap} title="Candidat" description="Personne facturée." accent="emerald" />
        <Controller
          name="candidatId"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <EntityCombobox
                options={options}
                value={field.value}
                onChange={(id) => field.onChange(id ?? undefined)}
                icon={GraduationCap}
                placeholder="Choisir un candidat"
                searchPlaceholder="Nom, téléphone, e-mail…"
                emptyText="Aucun candidat trouvé."
                loading={candidatsLoading}
                disabled={isSubmitting}
                invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError className="text-xs!" errors={[fieldState.error]} />}
            </Field>
          )}
        />
        {v.candidatId && !ctx && <Skeleton className="h-16 w-full" />}
        {ctx && (
          <div className="grid grid-cols-3 gap-2 rounded-md border bg-muted/30 p-3 text-center text-xs">
            <div>
              <p className="text-muted-foreground">Formation</p>
              <p className="font-semibold tabular-nums">{fcfa(ctx.montantFormation)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Déjà facturé</p>
              <p className="font-semibold tabular-nums">{fcfa(ctx.dejaFacture)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Déjà payé</p>
              <p className="font-semibold tabular-nums">{fcfa(ctx.totalPaye)}</p>
            </div>
          </div>
        )}
      </section>

      <Separator className="my-2" />

      <section className="space-y-4">
        <SectionHeader icon={Coins} title="Montant" description="Montant total TTC de la facture, en FCFA." accent="emerald" />
        <Controller
          name="montantTotal"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="facture-montant">Montant (FCFA) *</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="facture-montant"
                  type="number"
                  min={1}
                  step={500}
                  className="h-12"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)}
                  onBlur={field.onBlur}
                  disabled={isSubmitting}
                  aria-invalid={fieldState.invalid}
                />
                {ctx && resteAFacturer > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 shrink-0"
                    disabled={isSubmitting}
                    onClick={() => setValue('montantTotal', Math.round(resteAFacturer), { shouldValidate: true })}
                  >
                    <Wand2 className="h-4 w-4 mr-1" /> Reste : {fcfa(resteAFacturer)}
                  </Button>
                )}
              </div>
              {ctx && resteAFacturer === 0 && ctx.montantFormation > 0 && (
                <FieldDescription className="text-amber-600">La formation de ce candidat est déjà entièrement facturée.</FieldDescription>
              )}
              {fieldState.invalid && <FieldError className="text-xs!" errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </section>

      <Separator className="my-2" />

      <section className="space-y-4">
        <SectionHeader icon={CalendarDays} title="Dates" accent="emerald" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Controller
            name="dateEmission"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Date d'émission *</FieldLabel>
                <DatePicker date={field.value} onSelect={(d) => field.onChange(d)} disabled={isSubmitting} formatStr="dd/MM/yyyy" placeholder="JJ/MM/AAAA" className="w-full h-12" />
                {fieldState.invalid && <FieldError className="text-xs!" errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="dateEcheance"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Date d'échéance</FieldLabel>
                <DatePicker
                  date={field.value ?? undefined}
                  onSelect={(d) => field.onChange(d ?? null)}
                  disabled={isSubmitting}
                  formatStr="dd/MM/yyyy"
                  placeholder="Optionnelle"
                  className="w-full h-12"
                />
                {fieldState.invalid && <FieldError className="text-xs!" errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>
      </section>

      <Separator className="my-2" />

      <section className="space-y-4">
        <SectionHeader icon={StickyNote} title="Notes" accent="emerald" />
        <Controller
          name="notes"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <Textarea {...field} value={field.value ?? ''} rows={3} className="resize-none text-sm" placeholder="Objet, conditions de paiement…" disabled={isSubmitting} />
              {fieldState.invalid && <FieldError className="text-xs!" errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </section>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground border-t pt-4">
        <Receipt className="h-3.5 w-3.5" /> Le numéro (FAC-AAAA-XXXXX) est attribué automatiquement.
      </p>
    </motion.div>
  );
}
