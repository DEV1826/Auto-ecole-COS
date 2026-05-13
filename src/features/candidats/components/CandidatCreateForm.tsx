/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * @module features/candidats/components/CandidatCreateForm
 * @description
 * Formulaire de création (ou d'édition) d'un candidat pour l'auto-école COS.
 *
 * ## Responsabilités
 * - Valide l'ensemble des champs via le schéma Zod `createCandidatSchema`.
 * - Communique avec le composant parent (FormWrapper) via les props `data` et `onChange`
 *   (interface {@link FormPageProps}).
 * - Organisé en 4 sections sémantiques :
 *   1. **Identité** — nom, prénom, date de naissance, adresse
 *   2. **Contact** — email, téléphone
 *   3. **Formation** — catégorie de permis, statut, date d'inscription
 *   4. **Informations complémentaires** — numéro de permis, notes
 *
 * ## Thème
 * - Palette bleue (blue-700)
 * - Sections délimitées par un sous-titre et une ligne de séparation
 *
 * ## Intégration
 * ```tsx
 * // Dans CandidatCreatePage :
 * <FormWrapper onSubmit={handleSubmit} ...>
 *   <CandidatCreateForm
 *     data={formData}
 *     onChange={(patch, isValid) => {
 *       setFormData(prev => ({ ...prev, ...patch }));
 *       setIsValid(isValid);
 *     }}
 *   />
 * </FormWrapper>
 * ```
 *
 * @see {@link createCandidatSchema}
 * @see {@link FormPageProps}
 * @see {@link FormWrapper}
 *
 * @author Stive Junior
 * @version 1.0.0
 */

import * as React from 'react';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { z } from 'zod';
import {
  User,
  Phone,
  BookOpen,
  FileText,
  Calendar,
  MapPin,
  Hash,
  AlignLeft,
} from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Field, FieldLabel, FieldError, FieldDescription } from '@/components/ui/field';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

import { EmailInput } from '@/components/forms/EmailInput';
import { PhoneInput } from '@/components/forms/PhoneInput';
import { cn } from '@/lib/utils';

import {
  createCandidatSchema,
  CATEGORIE_PERMIS_VALUES,
  STATUT_CANDIDAT_VALUES,
  type CreateCandidatInput,
} from '@/lib/validators/candidats.validator';
import type { FormPageProps } from '@/components/forms/FormWrapper';
import { DatePicker } from '@/components/ui/date-picker';
import { CATEGORIE_PERMIS_CONFIG, STATUT_CANDIDAT_CONFIG } from '@/types/enums';

// ─────────────────────────────────────────────────────────────────────────────
// Types & constantes
// ─────────────────────────────────────────────────────────────────────────────

type CandidatFormValues = z.infer<typeof createCandidatSchema>;

/** Props du composant */
export type CandidatFormProps = FormPageProps<Partial<CreateCandidatInput>>;



// ─────────────────────────────────────────────────────────────────────────────
// Sous-composant : en-tête de section
// ─────────────────────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  icon: React.ElementType;
  title: string;
  description?: string;
}

function SectionHeader({ icon: Icon, title, description }: SectionHeaderProps) {
  return (
    <div className="flex items-start gap-2.5 mb-4">
      <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 shrink-0 mt-0.5">
        <Icon className="h-3.5 w-3.5 text-blue-700 dark:text-blue-400" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal : CandidatCreateForm
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formulaire de création / édition d'un candidat.
 * Communique avec le parent via `data` et `onChange`.
 */
export default function CandidatCreateForm({ data, onChange, isSubmitting }: CandidatFormProps) {
  const {
    control,
    formState: { isValid },
  } = useForm<CandidatFormValues>({
    resolver: zodResolver(createCandidatSchema),
    mode: 'onChange',
    defaultValues: {
      nom: (data.nom as string) || '',
      prenom: (data.prenom as string) || '',
      email: (data.email as string) || '',
      telephone: (data.telephone as string) || '',
      dateNaissance: (data.dateNaissance as string) || '',
      adresse: (data.adresse as string) || '',
      categorie: (data.categorie as any) || undefined,
      statut: (data.statut as any) || 'EN_ATTENTE',
      numeroPermis: (data.numeroPermis as string) || '',
      notes: (data.notes as string) || '',
      formationId: (data.formationId as number) || undefined,
      dateInscription: (data.dateInscription as string) || '',
    },
  });

  // ── Observation réactive des valeurs ────────────────────────────────────
  const watched = useWatch({
    control,
    name: [
      'nom',
      'prenom',
      'email',
      'telephone',
      'dateNaissance',
      'adresse',
      'categorie',
      'statut',
      'numeroPermis',
      'notes',
      'dateInscription',
    ],
  });

  const [
    nom,
    prenom,
    email,
    telephone,
    dateNaissance,
    adresse,
    categorie,
    statut,
    numeroPermis,
    notes,
    dateInscription,
  ] = watched;

  // Données nettoyées mémoïsées
  const cleanData = React.useMemo(
    () => ({
      nom: nom || '',
      prenom: prenom || '',
      email: email || '',
      telephone: telephone || '',
      dateNaissance: dateNaissance || '',
      adresse: adresse || '',
      categorie: categorie || undefined,
      statut: statut || 'EN_ATTENTE',
      numeroPermis: numeroPermis || '',
      notes: notes || '',
      dateInscription: dateInscription || '',
    }),
    [
      nom, prenom, email, telephone, dateNaissance,
      adresse, categorie, statut, numeroPermis, notes, dateInscription,
    ]
  );

  // Propagation au parent
  React.useEffect(() => {
    onChange(cleanData as any, isValid);
  }, [cleanData, isValid, onChange]);

  // ── Rendu ──────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className="space-y-8"
    >
      {/* ── Section 1 : Identité ──────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader
          icon={User}
          title="Identité"
          description="Nom légal, prénom et date de naissance du candidat."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Nom */}
          <Controller
            name="nom"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="candidat-nom">Nom *</FieldLabel>
                <Input
                  {...field}
                  id="candidat-nom"
                  placeholder="ex : Mbarga"
                  className="h-12"
                  disabled={isSubmitting}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError className="text-xs!" errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          {/* Prénom */}
          <Controller
            name="prenom"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="candidat-prenom">Prénom *</FieldLabel>
                <Input
                  {...field}
                  id="candidat-prenom"
                  placeholder="ex : Jean-Paul"
                  className="h-12"
                  disabled={isSubmitting}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError className="text-xs!" errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          {/* Date de naissance */}
          <Controller
            name="dateNaissance"
            control={control}
            render={({ field, fieldState }) => {
              // Convertir la valeur stockée (string ISO) en Date pour l'affichage
              const selectedDate = field.value ? new Date(field.value) : undefined;

              return (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="candidat-dob">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      Date de naissance
                    </span>
                  </FieldLabel>

                  <DatePicker
                    date={selectedDate}
                    onSelect={(date) => field.onChange(date ? date.toISOString() : null)}
                    disabled={isSubmitting}
                    formatStr="dd/MM/yyyy"
                    id='candidat-dob'
                    placeholder="JJ/MM/AAAA"
                    className="w-full h-12"
                  />

                  {fieldState.invalid && <FieldError className="text-xs!" errors={[fieldState.error]} />}
                </Field>
              );
            }}
          />

          {/* Adresse */}
          <Controller
            name="adresse"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="candidat-adresse">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    Adresse
                  </span>
                </FieldLabel>
                <Input
                  {...field}
                  value={field.value ?? ''}
                  id="candidat-adresse"
                  placeholder="ex : Rue de la Paix, Yaoundé"
                  className="h-12"
                  disabled={isSubmitting}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError className="text-xs!" errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
      </section>

      <Separator className="my-2" />

      {/* ── Section 2 : Contact ───────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader
          icon={Phone}
          title="Coordonnées"
          description="Email et numéro de téléphone pour les communications."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Email */}
          <Controller
            name="email"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="candidat-email">Adresse e-mail</FieldLabel>
                <EmailInput
                  {...field}
                  value={field.value ?? ''}
                  id="candidat-email"
                  placeholder="jean@example.com"
                  className='h-12'
                  error={fieldState.invalid}
                  disabled={isSubmitting}
                />
                <FieldDescription>Optionnel — pour les rappels et convocations.</FieldDescription>
                {fieldState.invalid && (
                  <FieldError className="text-xs!" errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          {/* Téléphone */}
          <Controller
            name="telephone"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="candidat-phone">Téléphone</FieldLabel>
                <PhoneInput
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  placeholder="6XX XXX XXX"
                  disabled={isSubmitting}
                />
                <FieldDescription>Indicatif Cameroun (+237) prédéfini.</FieldDescription>
                {fieldState.invalid && (
                  <FieldError className="text-xs!" errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
      </section>

      <Separator className="my-2" />

      {/* ── Section 3 : Formation ─────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader
          icon={BookOpen}
          title="Formation"
          description="Catégorie de permis visée et statut actuel de la formation."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Catégorie */}
          <Controller
            name="categorie"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="candidat-categorie">Catégorie de permis *</FieldLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ''}
                  disabled={isSubmitting}
                >
                  <SelectTrigger
                    id="candidat-categorie"
                    className={cn('h-12!', fieldState.invalid && 'border-destructive')}
                  >
                    <SelectValue placeholder="Choisir une catégorie…" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIE_PERMIS_VALUES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        <span className="font-semibold mr-2">{cat}</span>
                        <span className="text-muted-foreground text-xs">
                          {CATEGORIE_PERMIS_CONFIG[cat].description}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && (
                  <FieldError className="text-xs!" errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          {/* Statut */}
          <Controller
            name="statut"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="candidat-statut">Statut *</FieldLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ''}
                  disabled={isSubmitting}
                >
                  <SelectTrigger
                    id="candidat-statut"
                    className={cn('h-12!', fieldState.invalid && 'border-destructive')}
                  >
                    <SelectValue placeholder="Sélectionner un statut…" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUT_CANDIDAT_VALUES.map((s) => (
                      <SelectItem key={s} value={s}>
                        <Badge
                          variant="outline"
                          className={cn('text-[10px] rounded-md font-medium mr-2', STATUT_CANDIDAT_CONFIG[s].bgColor)}
                        >
                          {STATUT_CANDIDAT_CONFIG[s].label.split('—')[0].trim()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{STATUT_CANDIDAT_CONFIG[s].label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && (
                  <FieldError className="text-xs!" errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          {/* Date d'inscription */}
          <Controller
            name="dateInscription"
            control={control}
            render={({ field, fieldState }) => {
              // Convertir la valeur stockée (string ISO) en Date pour l'affichage
              const selectedDate = field.value ? new Date(field.value) : undefined;

              return (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="candidat-date-inscription">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      Date d'inscription
                    </span>
                  </FieldLabel>

                  <DatePicker
                    date={selectedDate}
                    onSelect={(date) => field.onChange(date ? date.toISOString() : null)}
                    disabled={isSubmitting}
                    formatStr="dd/MM/yyyy"
                    placeholder="JJ/MM/AAAA"
                    className="w-full h-12"
                  />

                  <FieldDescription>
                    Par défaut : la date du jour si laissée vide.

                  </FieldDescription>

                  {fieldState.invalid && <FieldError className="text-xs!" errors={[fieldState.error]} />}
                </Field>
              );
            }}
          />

          {/* Numéro de permis */}
          <Controller
            name="numeroPermis"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="candidat-num-permis">
                  <span className="flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                    Numéro de permis
                  </span>
                </FieldLabel>
                <Input
                  {...field}
                  value={field.value ?? ''}
                  id="candidat-num-permis"
                  placeholder="ex : PER-000123"
                  className="h-12 font-mono tracking-wide"
                  disabled={isSubmitting}
                  aria-invalid={fieldState.invalid}
                />
                <FieldDescription>Laissez vide si le permis n&apos;est pas encore obtenu.</FieldDescription>
                {fieldState.invalid && (
                  <FieldError className="text-xs!" errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
      </section>

      <Separator className="my-2" />

      {/* ── Section 4 : Notes ─────────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader
          icon={AlignLeft}
          title="Notes & observations"
          description="Informations complémentaires libres sur ce candidat."
        />

        <Controller
          name="notes"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="candidat-notes">
                <span className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  Observations internes
                </span>
              </FieldLabel>
              <Textarea
                {...field}
                value={field.value ?? ''}
                id="candidat-notes"
                placeholder="ex : Candidat sérieux, difficultés au créneau. Prévoir une séance supplémentaire."
                rows={4}
                className="resize-none text-sm"
                disabled={isSubmitting}
                aria-invalid={fieldState.invalid}
              />
              <FieldDescription>
                Maximum 500 caractères. Visibles uniquement par le personnel de l&apos;auto-école.
              </FieldDescription>
              {fieldState.invalid && (
                <FieldError className="text-xs!" errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />
      </section>

      {/* Note de bas de formulaire */}
      <p className="text-xs text-muted-foreground border-t pt-4">
        Les champs marqués d&apos;un astérisque (*) sont obligatoires.
      </p>
    </motion.div>
  );
}