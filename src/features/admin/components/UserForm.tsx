/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * @module features/admin/components/UserForm
 * @description
 * Formulaire de création/édition d'un utilisateur (admin, secrétaire, moniteur).
 * Utilisé dans UserFormDialog.
 *
 * ## Champs
 * - Identité : nom, prénom, email
 * - Rôle : ADMIN, SECRETAIRE, MONITEUR
 * - Niveau d'accès : SUPER_ADMIN, ADMIN, MANAGER, STANDARD, GUEST
 * - Mot de passe (uniquement lors de la création)
 * - Statut actif (modifiable en édition)
 *
 * @author Stive Junior
 * @version 2.0.0
 */

import * as React from 'react';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { User, Mail, Shield, KeyRound, Power } from 'lucide-react';

import { Input } from '@/components/ui/input';
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
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

import { createUserSchema, updateUserSchema } from '@/lib/validators/auth.validator';
import { ROLE_CONFIG, NIVEAU_ACCES_CONFIG } from '@/types/enums';
import type { FormPageProps } from '@/components/forms/FormWrapper';

// ─────────────────────────────────────────────────────────────────────────────
// Types & constantes
// ─────────────────────────────────────────────────────────────────────────────

type CreateFormValues = z.infer<typeof createUserSchema>;
type UpdateFormValues = z.infer<typeof updateUserSchema>;
type FormValues = Partial<CreateFormValues & UpdateFormValues>;

export interface UserFormProps extends FormPageProps<FormValues> {
    /** Mode édition (si true, le champ mot de passe est optionnel) */
    isEditMode?: boolean;
}

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
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formulaire de création / édition d'un utilisateur.
 * Communique avec le parent via `data` et `onChange`.
 */
export default function UserForm({ data, onChange, isSubmitting, isEditMode = false }: UserFormProps) {
    // Sélection du schéma de validation selon le mode
    const schema = isEditMode ? updateUserSchema : createUserSchema;

    const {
        control,
        formState: { isValid },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        mode: 'onChange',
        defaultValues: {
            email: data.email || '',
            nom: data.nom || '',
            prenom: data.prenom || '',
            role: (data.role as any) || undefined,
            niveau: (data.niveau as any) || undefined,
            password: '',
            actif: data.actif !== undefined ? data.actif : true,
        },
    });

    // Surveiller tous les champs pertinents via un tableau de noms pour obtenir un tableau itérable
    const watchedValues = useWatch({
        control,
        name: ['email', 'nom', 'prenom', 'role', 'niveau', 'password', 'actif'],
    });
    const [email, nom, prenom, role, niveau, password, actif] = watchedValues;

    // Données nettoyées à envoyer au parent
    const cleanData = React.useMemo(() => {
        const result: any = {
            email: email || '',
            nom: nom || '',
            prenom: prenom || '',
            role: role || undefined,
            niveau: niveau || undefined,
        };
        if (!isEditMode) {
            result.password = password || '';
        } else {
            if (actif !== undefined) result.actif = actif;
        }
        return result;
    }, [email, nom, prenom, role, niveau, password, actif, isEditMode]);

    // Propagation au parent
    React.useEffect(() => {
        onChange(cleanData, isValid);
    }, [cleanData, isValid, onChange]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="space-y-8"
        >
            {/* Section identité */}
            <section className="space-y-4">
                <SectionHeader icon={User} title="Identité" description="Nom, prénom et email de l'utilisateur." />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Controller
                        name="nom"
                        control={control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="user-nom">Nom *</FieldLabel>
                                <Input {...field} id="user-nom" placeholder="ex : Dupont" className="h-12" disabled={isSubmitting} />
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />
                    <Controller
                        name="prenom"
                        control={control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="user-prenom">Prénom *</FieldLabel>
                                <Input {...field} id="user-prenom" placeholder="ex : Jean" className="h-12" disabled={isSubmitting} />
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />
                    <Controller
                        name="email"
                        control={control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="user-email">
                                    <Mail className="inline h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                    Email *
                                </FieldLabel>
                                <Input {...field} id="user-email" type="email" placeholder="jean.dupont@example.com" className="h-12" disabled={isSubmitting} />
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />
                </div>
            </section>

            <Separator />

            {/* Section rôle et niveau */}
            <section className="space-y-4">
                <SectionHeader icon={Shield} title="Rôle & niveau" description="Permissions et accès système." />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Controller
                        name="role"
                        control={control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="user-role">Rôle *</FieldLabel>
                                <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                                    <SelectTrigger id="user-role" className={cn('h-12!', fieldState.invalid && 'border-destructive')}>
                                        <SelectValue placeholder="Sélectionner un rôle" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(ROLE_CONFIG).map(([value, cfg]) => (
                                            <SelectItem key={value} value={value} className='h-12!'>
                                                <Badge variant="outline" className="mr-2 text-[10px]">{cfg.label}</Badge>
                                                <span className="text-xs text-muted-foreground">{cfg.description}</span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />
                    <Controller
                        name="niveau"
                        control={control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="user-niveau">Niveau d'accès *</FieldLabel>
                                <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                                    <SelectTrigger id="user-niveau" className={cn('h-12!', fieldState.invalid && 'border-destructive')}>
                                        <SelectValue placeholder="Sélectionner un niveau" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(NIVEAU_ACCES_CONFIG).map(([value, cfg]) => (
                                            <SelectItem key={value} value={value}>
                                                <Badge variant="outline" className="mr-2 text-[10px]">{cfg.label}</Badge>
                                                <span className="text-xs text-muted-foreground">{cfg.description}</span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />
                </div>
            </section>

            {!isEditMode && (
                <>
                    <Separator />
                    <section className="space-y-4">
                        <SectionHeader icon={KeyRound} title="Mot de passe" description="Mot de passe temporaire (l'utilisateur devra le changer à la première connexion)." />
                        <Controller
                            name="password"
                            control={control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="user-password">Mot de passe *</FieldLabel>
                                    <Input {...field} id="user-password" type="password" placeholder="••••••••" className="h-12" disabled={isSubmitting} />
                                    <FieldDescription>Minimum 6 caractères.</FieldDescription>
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                </Field>
                            )}
                        />
                    </section>
                </>
            )}

            {isEditMode && (
                <>
                    <Separator />
                    <section className="space-y-4">
                        <SectionHeader icon={Power} title="Statut" description="Activer ou désactiver le compte." />
                        <Controller
                            name="actif"
                            control={control}
                            render={({ field }) => (
                                <div className="flex items-center gap-4">
                                    <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} />
                                    <span className="text-sm">{field.value ? 'Compte actif' : 'Compte désactivé'}</span>
                                </div>
                            )}
                        />
                    </section>
                </>
            )}

            <p className="text-xs text-muted-foreground border-t pt-4">
                Les champs marqués d'un astérisque (*) sont obligatoires.
            </p>
        </motion.div>
    );
}