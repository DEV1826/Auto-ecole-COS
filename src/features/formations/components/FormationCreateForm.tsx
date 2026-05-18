// src/features/formations/components/FormationCreateForm.tsx

/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * @module features/formations/components/FormationCreateForm
 * @description
 * Formulaire de création d’une formation (offre pédagogique) pour l’auto-école COS.
 *
 * ## Responsabilités
 * - Valide les champs via le schéma Zod `createFormationSchema`.
 * - Communique avec le composant parent via les props `data` et `onChange`
 *   (interface {@link FormPageProps}).
 * - Organisé en 3 sections :
 *   1. **Informations générales** — nom, description
 *   2. **Détails de la formation** — prix, heures code, heures conduite, catégorie
 *   3. **Statut** — actif / inactif (toggle ou select)
 *
 * ## Thème
 * - Palette indigo (indigo-700)
 * - Sections délimitées par un sous‑titre et une ligne de séparation
 * - Icônes Lucide pour chaque champ
 *
 * @see {@link createFormationSchema}
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
    FileText,
    Coins,
    Clock,
    Car,
    BadgeCheck,
    GraduationCap,
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
import { Switch } from '@/components/ui/switch';
import { Field, FieldLabel, FieldError, FieldDescription } from '@/components/ui/field';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

import {
    createFormationSchema,
    CATEGORIE_PERMIS_VALUES,
    type CreateFormationInput,
} from '@/lib/validators/formations.validator';
import type { FormPageProps } from '@/components/forms/FormWrapper';
import { CATEGORIE_PERMIS_CONFIG } from '@/types/enums';

// ─────────────────────────────────────────────────────────────────────────────
// Types & constantes
// ─────────────────────────────────────────────────────────────────────────────

type FormationFormValues = z.infer<typeof createFormationSchema>;

/** Props du composant */
export type FormationFormProps = FormPageProps<Partial<CreateFormationInput>>;

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
            <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 shrink-0 mt-0.5">
                <Icon className="h-3.5 w-3.5 text-indigo-700 dark:text-indigo-400" />
            </div>
            <div>
                <h4 className="text-sm font-semibold text-foreground">{title}</h4>
                {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal : FormationCreateForm
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formulaire de création d’une formation.
 * Communique avec le parent via `data` et `onChange`.
 */
export default function FormationCreateForm({ data, onChange, isSubmitting }: FormationFormProps) {
    const {
        control,
        formState: { isValid },
    } = useForm<FormationFormValues>({
        resolver: zodResolver(createFormationSchema),
        mode: 'onChange',
        defaultValues: {
            nom: (data.nom as string) || '',
            description: (data.description as string) || '',
            prixTotal: (data.prixTotal as number) ?? 0,
            heuresCode: (data.heuresCode as number) ?? 0,
            heuresConduite: (data.heuresConduite as number) ?? 0,
            categorie: (data.categorie as any) || 'B',
            actif: data.actif as boolean ?? true,
        },
    });

    // ── Observation réactive des valeurs ────────────────────────────────────
    const watched = useWatch({
        control,
        name: ['nom', 'description', 'prixTotal', 'heuresCode', 'heuresConduite', 'categorie', 'actif'],
    });

    const [nom, description, prixTotal, heuresCode, heuresConduite, categorie, actif] = watched;

    // Données nettoyées mémoïsées
    const cleanData = React.useMemo(
        () => ({
            nom: nom || '',
            description: description || '',
            prixTotal: prixTotal ?? undefined,
            heuresCode: heuresCode ?? undefined,
            heuresConduite: heuresConduite ?? undefined,
            categorie: categorie || undefined,
            actif: actif ?? true,
        }),
        [nom, description, prixTotal, heuresCode, heuresConduite, categorie, actif]
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
            {/* ── Section 1 : Informations générales ─────────────────────────────── */}
            <section className="space-y-4">
                <SectionHeader
                    icon={FileText}
                    title="Informations générales"
                    description="Nom et description de la formation."
                />

                <div className="grid grid-cols-1 gap-4">
                    {/* Nom */}
                    <Controller
                        name="nom"
                        control={control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="formation-nom">Nom de la formation *</FieldLabel>
                                <Input
                                    {...field}
                                    id="formation-nom"
                                    placeholder="ex : Permis B (Voiture)"
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

                    {/* Description */}
                    <Controller
                        name="description"
                        control={control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="formation-description">
                                    <span className="flex items-center gap-1.5">
                                        <AlignLeft className="h-3.5 w-3.5 text-muted-foreground" />
                                        Description (optionnelle)
                                    </span>
                                </FieldLabel>
                                <Textarea
                                    {...field}
                                    value={field.value ?? ''}
                                    id="formation-description"
                                    placeholder="Description détaillée de la formation…"
                                    rows={3}
                                    className="resize-none text-sm"
                                    disabled={isSubmitting}
                                    aria-invalid={fieldState.invalid}
                                />
                                <FieldDescription>Maximum 500 caractères.</FieldDescription>
                                {fieldState.invalid && (
                                    <FieldError className="text-xs!" errors={[fieldState.error]} />
                                )}
                            </Field>
                        )}
                    />
                </div>
            </section>

            <Separator className="my-2" />

            {/* ── Section 2 : Détails de la formation ────────────────────────────── */}
            <section className="space-y-4">
                <SectionHeader
                    icon={GraduationCap}
                    title="Détails de la formation"
                    description="Prix, heures et catégorie de permis."
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Prix total */}
                    <Controller
                        name="prixTotal"
                        control={control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="formation-prix">
                                    <span className="flex items-center gap-1.5">
                                        <Coins className="h-3.5 w-3.5 text-muted-foreground" />
                                        Prix total (FCFA) *
                                    </span>
                                </FieldLabel>
                                <Input
                                    type="number"
                                    {...field}
                                    value={field.value ?? ''}
                                    id="formation-prix"
                                    placeholder="ex: 250000"
                                    className="h-12"
                                    disabled={isSubmitting}
                                    aria-invalid={fieldState.invalid}
                                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                />
                                <FieldDescription>Montant toutes taxes comprises.</FieldDescription>
                                {fieldState.invalid && (
                                    <FieldError className="text-xs!" errors={[fieldState.error]} />
                                )}
                            </Field>
                        )}
                    />

                    {/* Heures code */}
                    <Controller
                        name="heuresCode"
                        control={control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="formation-heures-code">
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                        Heures de code *
                                    </span>
                                </FieldLabel>
                                <Input
                                    type="number"
                                    {...field}
                                    value={field.value ?? ''}
                                    id="formation-heures-code"
                                    placeholder="ex: 12"
                                    className="h-12"
                                    disabled={isSubmitting}
                                    aria-invalid={fieldState.invalid}
                                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                />
                                <FieldDescription>Nombre d’heures de code obligatoires.</FieldDescription>
                                {fieldState.invalid && (
                                    <FieldError className="text-xs!" errors={[fieldState.error]} />
                                )}
                            </Field>
                        )}
                    />

                    {/* Heures conduite */}
                    <Controller
                        name="heuresConduite"
                        control={control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="formation-heures-conduite">
                                    <span className="flex items-center gap-1.5">
                                        <Car className="h-3.5 w-3.5 text-muted-foreground" />
                                        Heures de conduite *
                                    </span>
                                </FieldLabel>
                                <Input
                                    type="number"
                                    {...field}
                                    value={field.value ?? ''}
                                    id="formation-heures-conduite"
                                    placeholder="ex: 20"
                                    className="h-12"
                                    disabled={isSubmitting}
                                    aria-invalid={fieldState.invalid}
                                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                />
                                <FieldDescription>Heures de conduite incluses dans le forfait.</FieldDescription>
                                {fieldState.invalid && (
                                    <FieldError className="text-xs!" errors={[fieldState.error]} />
                                )}
                            </Field>
                        )}
                    />

                    {/* Catégorie de permis */}
                    <Controller
                        name="categorie"
                        control={control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="formation-categorie">Catégorie de permis *</FieldLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value ?? ''}
                                    disabled={isSubmitting}
                                >
                                    <SelectTrigger
                                        id="formation-categorie"
                                        className={cn('h-12!', fieldState.invalid && 'border-destructive')}
                                    >
                                        <SelectValue placeholder="Sélectionner une catégorie…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIE_PERMIS_VALUES.map((cat) => {
                                            const cfg = CATEGORIE_PERMIS_CONFIG[cat];
                                            return (
                                                <SelectItem key={cat} value={cat}>
                                                    <div className="flex items-center gap-2">
                                                        {cfg.icon && <cfg.icon className="h-4 w-4 text-muted-foreground" />}
                                                        <span className="font-semibold">{cfg.label.split('—')[0].trim()}</span>
                                                        <span className="text-xs text-muted-foreground">— {cfg.description}</span>
                                                    </div>
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                                {fieldState.invalid && (
                                    <FieldError className="text-xs!" errors={[fieldState.error]} />
                                )}
                            </Field>
                        )}
                    />
                </div>
            </section>

            <Separator className="my-2" />

            {/* ── Section 3 : Statut ─────────────────────────────────────────────── */}
            <section className="space-y-4">
                <SectionHeader
                    icon={BadgeCheck}
                    title="Statut de la formation"
                    description="Active ou inactive (les formations inactives n’apparaissent pas dans le catalogue)."
                />

                <Controller
                    name="actif"
                    control={control}
                    render={({ field }) => (
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FieldLabel htmlFor="formation-actif" className="text-sm font-medium">
                                    Formation active
                                </FieldLabel>
                                <FieldDescription>
                                    Une formation inactive ne peut plus être choisie par les nouveaux candidats.
                                </FieldDescription>
                            </div>
                            <Switch
                                id="formation-actif"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={isSubmitting}
                            />
                        </div>
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