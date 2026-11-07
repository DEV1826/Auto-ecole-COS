// src/features/planning/components/LeconForm.tsx

/**
 * @module features/planning/components/LeconForm
 * @description
 * Formulaire d'une leçon (création et édition) : participants, créneau, véhicule,
 * notes, et statut en édition. Les conflits d'horaire sont vérifiés par le service.
 */

import * as React from 'react';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { CalendarClock, Car, ClipboardList, GraduationCap, StickyNote, UserRound, Users } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Field, FieldLabel, FieldError, FieldDescription } from '@/components/ui/field';
import { Separator } from '@/components/ui/separator';
import { DatePicker } from '@/components/ui/date-picker';
import { EntityCombobox, type EntityOption } from '@/components/forms/EntityCombobox';
import { SectionHeader } from '@/components/forms/FormPageKit';
import { cn } from '@/lib/utils';

import { TYPE_LECON_VALUES, STATUT_LECON_VALUES } from '@/lib/validators/planning.validator';
import {
  STATUT_CANDIDAT_CONFIG,
  STATUT_LECON_CONFIG,
  STATUT_VEHICULE_CONFIG,
  TYPE_LECON_CONFIG,
} from '@/types/enums';
import type { Candidat } from '@/types/candidats.types';
import type { Moniteur } from '@/types/moniteurs.types';
import type { Vehicule } from '@/types/vehicules.types';
import type { StatutLecon, TypeLecon } from '@/types/enums';

/** Durées proposées (minutes). */
const DUREES = [30, 45, 60, 90, 120, 180, 240];

const schema = z
  .object({
    jour: z.date({ message: 'La date est requise.' }),
    heure: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Heure invalide (HH:MM).'),
    duree: z.number().int().positive().max(240, '240 minutes maximum.'),
    type: z.enum(TYPE_LECON_VALUES),
    statut: z.enum(STATUT_LECON_VALUES).optional(),
    candidatId: z.number({ message: 'Choisissez un candidat.' }).int().positive('Choisissez un candidat.'),
    moniteurId: z.number({ message: 'Choisissez un moniteur.' }).int().positive('Choisissez un moniteur.'),
    vehiculeId: z.number().int().positive().nullable().optional(),
    notes: z.string().max(500, '500 caractères maximum.').optional(),
  })
  .refine((v) => v.type === 'CODE' || Boolean(v.vehiculeId), {
    message: 'Un véhicule est requis pour une leçon de conduite.',
    path: ['vehiculeId'],
  });

type Values = z.infer<typeof schema>;

/** Données échangées avec la page (format attendu par le store planning). */
export interface LeconFormData {
  date?: string;
  duree?: number;
  type?: TypeLecon;
  statut?: StatutLecon;
  candidatId?: number;
  moniteurId?: number;
  vehiculeId?: number | null;
  notes?: string | null;
}

export interface LeconFormProps {
  data: LeconFormData;
  onChange: (data: LeconFormData, isValid: boolean) => void;
  isSubmitting?: boolean;
  isEdit?: boolean;
  candidats: Candidat[];
  moniteurs: Moniteur[];
  vehicules: Vehicule[];
  referencesLoading?: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');

function splitDate(iso?: string): { jour?: Date; heure: string } {
  if (!iso) return { heure: '08:00' };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { heure: '08:00' };
  return { jour: d, heure: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
}

function combine(jour: Date | undefined, heure: string | undefined): string | undefined {
  if (!jour || !heure || !/^\d{2}:\d{2}$/.test(heure)) return undefined;
  const [h, m] = heure.split(':').map(Number);
  const d = new Date(jour);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

export default function LeconForm({
  data,
  onChange,
  isSubmitting,
  isEdit = false,
  candidats,
  moniteurs,
  vehicules,
  referencesLoading,
}: LeconFormProps) {
  const initial = splitDate(data.date);
  const {
    control,
    setValue,
    formState: { isValid },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      jour: initial.jour,
      heure: initial.heure,
      duree: data.duree ?? 60,
      type: data.type ?? 'CONDUITE',
      statut: data.statut,
      candidatId: data.candidatId,
      moniteurId: data.moniteurId,
      vehiculeId: data.vehiculeId ?? null,
      notes: data.notes ?? '',
    },
  });

  const v = useWatch({ control });
  const candidat = candidats.find((c) => c.id === v.candidatId);

  // Une leçon de code n'utilise pas de véhicule.
  React.useEffect(() => {
    if (v.type === 'CODE' && v.vehiculeId) setValue('vehiculeId', null, { shouldValidate: true });
  }, [v.type, v.vehiculeId, setValue]);

  React.useEffect(() => {
    onChange(
      {
        date: combine(v.jour, v.heure),
        duree: v.duree,
        type: v.type,
        ...(isEdit ? { statut: v.statut } : {}),
        candidatId: v.candidatId,
        moniteurId: v.moniteurId,
        vehiculeId: v.type === 'CODE' ? null : (v.vehiculeId ?? null),
        notes: v.notes?.trim() ? v.notes.trim() : null,
      },
      isValid
    );
  }, [v, isValid, isEdit, onChange]);

  const candidatOptions: EntityOption[] = candidats.map((c) => {
    const cfg = STATUT_CANDIDAT_CONFIG[c.statut];
    return {
      id: c.id,
      label: `${c.prenom} ${c.nom}`,
      sublabel: `Permis ${c.categorie}${c.telephone ? ` · ${c.telephone}` : ''}`,
      keywords: `${c.email ?? ''} ${c.telephone ?? ''}`,
      disabled: (c.statut === 'ABANDONNE' || c.statut === 'RECU') && c.id !== data.candidatId,
      adornment: cfg ? (
        <Badge variant="outline" className={cn('text-[10px] border-0', cfg.bgColor, cfg.textColor)}>
          {cfg.label}
        </Badge>
      ) : undefined,
    };
  });

  const moniteurOptions: EntityOption[] = moniteurs
    .filter((m) => m.actif || m.id === data.moniteurId)
    .map((m) => ({
      id: m.id,
      label: `${m.prenom} ${m.nom}`,
      sublabel: m.specialite ?? m.telephone ?? undefined,
    }));

  const vehiculeOptions: EntityOption[] = vehicules
    .filter((vh) => vh.statut !== 'HORS_SERVICE' || vh.id === data.vehiculeId)
    .map((vh) => {
      const cfg = STATUT_VEHICULE_CONFIG[vh.statut];
      const autreCategorie = candidat && vh.categorie !== candidat.categorie;
      return {
        id: vh.id,
        label: `${vh.marque} ${vh.modele}`,
        sublabel: `${vh.immatriculation} · Cat. ${vh.categorie}${autreCategorie ? ' (≠ permis du candidat)' : ''}`,
        disabled: vh.statut === 'EN_ENTRETIEN' && vh.id !== data.vehiculeId,
        adornment: (
          <Badge variant="outline" className={cn('text-[10px] border-0', cfg.bgColor, cfg.textColor)}>
            {cfg.label}
          </Badge>
        ),
      };
    })
    // Véhicules de la catégorie du candidat en premier
    .sort((a, b) => Number((a.sublabel ?? '').includes('≠')) - Number((b.sublabel ?? '').includes('≠')));

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className="space-y-8">
      <section className="space-y-4">
        <SectionHeader icon={Users} title="Participants" description="Candidat et moniteur de la leçon." accent="violet" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Controller
            name="candidatId"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="lecon-candidat">Candidat *</FieldLabel>
                <EntityCombobox
                  id="lecon-candidat"
                  icon={GraduationCap}
                  options={candidatOptions}
                  value={field.value}
                  onChange={(id) => field.onChange(id ?? undefined)}
                  placeholder="Choisir un candidat"
                  searchPlaceholder="Nom, téléphone, e-mail…"
                  emptyText="Aucun candidat trouvé."
                  loading={referencesLoading}
                  disabled={isSubmitting}
                  invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError className="text-xs!" errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="moniteurId"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="lecon-moniteur">Moniteur *</FieldLabel>
                <EntityCombobox
                  id="lecon-moniteur"
                  icon={UserRound}
                  options={moniteurOptions}
                  value={field.value}
                  onChange={(id) => field.onChange(id ?? undefined)}
                  placeholder="Choisir un moniteur"
                  emptyText="Aucun moniteur actif."
                  loading={referencesLoading}
                  disabled={isSubmitting}
                  invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError className="text-xs!" errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>
      </section>

      <Separator className="my-2" />

      <section className="space-y-4">
        <SectionHeader icon={CalendarClock} title="Créneau" description="Type de leçon, date, heure de début et durée." accent="violet" />

        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Type de leçon">
              {TYPE_LECON_VALUES.map((t) => {
                const cfg = TYPE_LECON_CONFIG[t];
                const active = field.value === t;
                return (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={isSubmitting}
                    onClick={() => field.onChange(t)}
                    className={cn(
                      'flex items-center gap-2 rounded-md border p-3 text-left text-sm transition-colors',
                      active ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30' : 'hover:bg-muted/50'
                    )}
                  >
                    <cfg.icon className={cn('h-4 w-4', active ? 'text-violet-600' : 'text-muted-foreground')} />
                    <span className="font-medium">{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Controller
            name="jour"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Date *</FieldLabel>
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
            name="heure"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="lecon-heure">Heure de début *</FieldLabel>
                <Input {...field} type="time" step={900} id="lecon-heure" className="h-12" disabled={isSubmitting} />
                {fieldState.invalid && <FieldError className="text-xs!" errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="duree"
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="lecon-duree">Durée *</FieldLabel>
                <Select value={String(field.value)} onValueChange={(val) => field.onChange(Number(val))} disabled={isSubmitting}>
                  <SelectTrigger id="lecon-duree" className="h-12!">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DUREES.map((d) => (
                      <SelectItem key={d} value={String(d)}>
                        {d < 60 ? `${d} min` : `${Math.floor(d / 60)} h${d % 60 ? ` ${d % 60}` : ''}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
        </div>
      </section>

      <Separator className="my-2" />

      <section className="space-y-4">
        <SectionHeader
          icon={Car}
          title="Véhicule"
          description={v.type === 'CODE' ? 'Non requis pour une leçon de code.' : 'Véhicule utilisé pour la leçon de conduite.'}
          accent="violet"
        />
        <Controller
          name="vehiculeId"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <EntityCombobox
                id="lecon-vehicule"
                icon={Car}
                options={vehiculeOptions}
                value={field.value ?? null}
                onChange={(id) => field.onChange(id)}
                placeholder={v.type === 'CODE' ? 'Aucun véhicule' : 'Choisir un véhicule'}
                searchPlaceholder="Marque, modèle, immatriculation…"
                emptyText="Aucun véhicule disponible."
                loading={referencesLoading}
                disabled={isSubmitting || v.type === 'CODE'}
                clearable
                invalid={fieldState.invalid}
              />
              <FieldDescription>Les véhicules en entretien ne peuvent pas être réservés.</FieldDescription>
              {fieldState.invalid && <FieldError className="text-xs!" errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </section>

      <Separator className="my-2" />

      <section className="space-y-4">
        <SectionHeader icon={StickyNote} title="Suivi" description={isEdit ? 'Statut et remarques.' : 'Remarques internes.'} accent="violet" />
        {isEdit && (
          <Controller
            name="statut"
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="lecon-statut">
                  <span className="flex items-center gap-1.5">
                    <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
                    Statut
                  </span>
                </FieldLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
                  <SelectTrigger id="lecon-statut" className="h-12!">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUT_LECON_VALUES.map((s) => {
                      const cfg = STATUT_LECON_CONFIG[s];
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
        )}
        <Controller
          name="notes"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="lecon-notes">Notes</FieldLabel>
              <Textarea
                {...field}
                value={field.value ?? ''}
                id="lecon-notes"
                rows={3}
                className="resize-none text-sm"
                placeholder="Lieu de rendez-vous, points à travailler…"
                disabled={isSubmitting}
              />
              {fieldState.invalid && <FieldError className="text-xs!" errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </section>

      <p className="text-xs text-muted-foreground border-t pt-4">
        Les conflits d&apos;horaire (moniteur, candidat, véhicule) sont vérifiés à l&apos;enregistrement.
      </p>
    </motion.div>
  );
}
