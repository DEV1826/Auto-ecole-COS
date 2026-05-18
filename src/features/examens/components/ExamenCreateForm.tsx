/* eslint-disable react-hooks/set-state-in-effect */
// src/features/examens/components/ExamenCreateForm.tsx
'use client';

/**
 * @module features/examens/components/ExamenCreateForm
 * @description
 * Formulaire de création d’un examen (code ou conduite).
 *
 * ## Champs
 * - **Candidat** : sélection via recherche (popover Command)
 * - **Type** : CODE / CONDUITE (RadioGroup avec icônes)
 * - **Date** : date et heure de l’examen (datetime-local)
 * - **Centre** : lieu d’examen (optionnel)
 * - **Notes** : remarques internes (optionnel)
 *
 * Le formulaire utilise `react-hook-form` + `zod` (validation via `createExamenSchema`).
 * Il expose via `onChange` l’état partiel et la validité pour le parent (`FormWrapper`).
 *
 * @author Stive Junior
 * @version 1.0.0
 */

import * as React from 'react';
import { useForm, useWatch, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { z } from 'zod';
import {
    User,
    Calendar,
    MapPin,
    MessageSquare,
    ChevronDown,
    BookOpen,
    Car,
    type LucideIcon,
} from 'lucide-react';
import { format } from 'date-fns';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Field,
    FieldLabel,
    FieldError,
    FieldDescription,
    FieldSet,
    FieldLegend,
    FieldContent,
    FieldTitle,
} from '@/components/ui/field';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, getAvatarUrl } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command as CommandMenu, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { useCandidats } from '@/hooks/use.candidats';
import { createExamenSchema, TYPE_EXAMEN_VALUES } from '@/lib/validators/examens.validator';
import type { FormPageProps } from '@/components/forms/FormWrapper';
import type { Candidat } from '@/types/candidats.types';

type ExamenFormValues = z.infer<typeof createExamenSchema>;
export type ExamenFormProps = FormPageProps<Partial<ExamenFormValues>>;

// ─────────────────────────────────────────────────────────────────────────────
// Configuration des types d'examen (icônes, labels)
// ─────────────────────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<string, { label: string; icon: LucideIcon; description: string }> = {
    CODE: {
        label: 'Examen du code',
        icon: BookOpen,
        description: 'Épreuve théorique (code de la route)',
    },
    CONDUITE: {
        label: 'Examen de conduite',
        icon: Car,
        description: 'Épreuve pratique (conduite en conditions réelles)',
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Composant : Sélection de candidat (identique à celui des paiements)
// ─────────────────────────────────────────────────────────────────────────────
interface CandidatSelectorProps {
    value?: number;
    onChange: (candidatId: number, candidat: Candidat) => void;
    disabled?: boolean;
    isSubmitting?: boolean;
}

function CandidatSelector({ value, onChange, disabled, isSubmitting }: CandidatSelectorProps) {
    const [open, setOpen] = React.useState(false);
    const [candidats, setCandidats] = React.useState<Candidat[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [selectedCandidat, setSelectedCandidat] = React.useState<Candidat | null>(null);

    const { getAll, getById } = useCandidats();

    React.useEffect(() => {
        const loadCandidats = async () => {
            setLoading(true);
            try {
                const response = await getAll({});
                setCandidats(response.candidats);
            } catch (err) {
                console.error('Erreur chargement candidats', err);
            } finally {
                setLoading(false);
            }
        };
        loadCandidats();
    }, [getAll]);

    React.useEffect(() => {
        if (!value || selectedCandidat) return;
        const loadCandidat = async () => {
            try {
                const candidat = await getById(value);
                setSelectedCandidat(candidat);
            } catch (err) {
                console.error(err);
            }
        };
        loadCandidat();
    }, [value, selectedCandidat, getById]);

    const handleSelect = (candidat: Candidat) => {
        setSelectedCandidat(candidat);
        setOpen(false);
        onChange(candidat.id, candidat);
    };

    const displayName = selectedCandidat
        ? `${selectedCandidat.prenom} ${selectedCandidat.nom}`
        : 'Sélectionner un candidat';

    return (
        <div className="space-y-4">
            <Field>
                <FieldLabel htmlFor="candidat-select">Candidat *</FieldLabel>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="h-12 w-full justify-between font-normal"
                            disabled={disabled || isSubmitting}
                        >
                            {loading ? <Skeleton className="h-4 w-40" /> : displayName}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-100 max-w-[90vw] p-0" align="start">
                        <CommandMenu>
                            <CommandInput placeholder="Rechercher par nom, prénom, téléphone..." />
                            <CommandList>
                                <CommandEmpty>Aucun candidat trouvé.</CommandEmpty>
                                <CommandGroup>
                                    {candidats.map((c) => (
                                        <CommandItem
                                            key={c.id}
                                            value={`${c.prenom} ${c.nom} ${c.email || ''} ${c.telephone || ''}`}
                                            onSelect={() => handleSelect(c)}
                                            className="flex items-center gap-3 p-2"
                                        >
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={getAvatarUrl(`${c.prenom} ${c.nom}`)} />
                                                <AvatarFallback>{`${c.prenom?.[0]}${c.nom?.[0]}`.toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{c.prenom} {c.nom}</p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {c.email || c.telephone || `ID: ${c.id}`}
                                                </p>
                                            </div>
                                            <Badge variant="outline" className="shrink-0">
                                                {c.statut === 'RECU' ? 'Reçu' : 'En cours'}
                                            </Badge>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </CommandMenu>
                    </PopoverContent>
                </Popover>
                <FieldDescription>Choisissez le candidat qui passe l’examen.</FieldDescription>
            </Field>

            {/* Informations du candidat sélectionné */}
            {selectedCandidat && (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-md border bg-card p-4 space-y-3 shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <Avatar className="h-14 w-14 ring-2 rounded-full ring-indigo-200">
                            <AvatarImage src={getAvatarUrl(`${selectedCandidat.prenom} ${selectedCandidat.nom}`)} />
                            <AvatarFallback className="bg-indigo-700 text-white text-lg">
                                {`${selectedCandidat.prenom?.[0]}${selectedCandidat.nom?.[0]}`.toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <p className="font-semibold text-lg">{selectedCandidat.prenom} {selectedCandidat.nom}</p>
                            <p className="text-sm text-muted-foreground">
                                {selectedCandidat.email || selectedCandidat.telephone || `ID: ${selectedCandidat.id}`}
                            </p>
                        </div>
                        <Badge variant="outline" className={selectedCandidat.statut === 'RECU' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                            {selectedCandidat.statut === 'RECU' ? 'Reçu' : 'En cours'}
                        </Badge>
                    </div>
                    <div className="flex justify-between items-center border-t pt-2 text-sm">
                        <span className="text-muted-foreground">Catégorie</span>
                        <span className="font-medium">{selectedCandidat.categorie}</span>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────
export default function ExamenCreateForm({ data, onChange, isSubmitting }: ExamenFormProps) {
    const {
        control,
        formState: { isValid },
    } = useForm<ExamenFormValues>({
        resolver: zodResolver(createExamenSchema) as Resolver<ExamenFormValues>,
        mode: 'onChange',
        defaultValues: {
            date: data.date ?? new Date().toISOString(),
            type: data.type ?? undefined,
            candidatId: data.candidatId ?? undefined,
            centre: data.centre ?? '',
            notes: data.notes ?? '',
        },
    });

    const watched = useWatch({ control });
    const [selectedCandidatId, setSelectedCandidatId] = React.useState<number | undefined>(data.candidatId);

    // Propagation au parent
    React.useEffect(() => {
        onChange(watched, isValid);
    }, [watched, isValid, onChange]);

    // Mise à jour de l'ID candidat pour affichage
    React.useEffect(() => {
        if (watched.candidatId !== selectedCandidatId) {
            setSelectedCandidatId(watched.candidatId);
        }
    }, [watched.candidatId, selectedCandidatId]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-8"
        >
            {/* Section Candidat */}
            <section className="space-y-2">
                <div className="flex items-start gap-2.5 mb-4">
                    <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/40">
                        <User className="h-3.5 w-3.5 text-indigo-700 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold">Candidat</h4>
                        <p className="text-xs text-muted-foreground">Sélectionnez le candidat qui passe l’examen.</p>
                    </div>
                </div>

                <Controller
                    name="candidatId"
                    control={control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <CandidatSelector
                                value={field.value}
                                onChange={(id) => {
                                    field.onChange(id);
                                    setSelectedCandidatId(id);
                                }}
                                disabled={field.disabled}
                                isSubmitting={isSubmitting}
                            />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                    )}
                />
            </section>

            <Separator />

            {/* Section Type d'examen (RadioGroup avec cartes) */}
            <section className="space-y-4">
                <div className="flex items-start gap-2.5 mb-4">
                    <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/40">
                        <BookOpen className="h-3.5 w-3.5 text-indigo-700 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold">Type d’examen</h4>
                        <p className="text-xs text-muted-foreground">Choisissez l’épreuve (code ou conduite).</p>
                    </div>
                </div>

                <Controller
                    name="type"
                    control={control}
                    render={({ field, fieldState }) => {
                        const isInvalid = fieldState.invalid;
                        return (
                            <FieldSet data-invalid={isInvalid} className="space-y-3">
                                <FieldLegend variant="label" className="sr-only">Type d’examen</FieldLegend>
                                <RadioGroup
                                    name={field.name}
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    aria-invalid={isInvalid}
                                    className="grid grid-cols-2 gap-2"
                                >
                                    {TYPE_EXAMEN_VALUES.map((type) => {
                                        const cfg = TYPE_CONFIG[type];
                                        const isSelected = field.value === type;
                                        const Icon = cfg.icon;
                                        return (
                                            <FieldLabel
                                                key={type}
                                                htmlFor={`examen-type-${type}`}
                                                className={cn(
                                                    'cursor-pointer rounded-lg border p-3 transition-all',
                                                    isSelected
                                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 ring-1 ring-indigo-500'
                                                        : 'border-border hover:border-indigo-300 hover:bg-muted/20'
                                                )}
                                            >
                                                <Field orientation="horizontal">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white shadow-sm dark:bg-gray-800">
                                                        <Icon className="size-6 text-indigo-600 dark:text-indigo-400" strokeWidth={1.5} />
                                                    </div>
                                                    <FieldContent>
                                                        <FieldTitle>{cfg.label}</FieldTitle>
                                                        <FieldDescription>{cfg.description}</FieldDescription>
                                                    </FieldContent>
                                                    <RadioGroupItem value={type} id={`examen-type-${type}`} />
                                                </Field>
                                            </FieldLabel>
                                        );
                                    })}
                                </RadioGroup>
                                {isInvalid && <FieldError errors={[fieldState.error]} />}
                            </FieldSet>
                        );
                    }}
                />
            </section>

            <Separator />

            {/* Section Date, Centre, Notes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Colonne gauche : Date */}
                <section className="space-y-4">
                    <div className="flex items-start gap-2.5 mb-4">
                        <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/40">
                            <Calendar className="h-3.5 w-3.5 text-indigo-700 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold">Date de l’examen</h4>
                            <p className="text-xs text-muted-foreground">Jour et heure de l’épreuve.</p>
                        </div>
                    </div>

                    <Controller
                        name="date"
                        control={control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel>Date et heure *</FieldLabel>
                                <Input
                                    type="datetime-local"
                                    {...field}
                                    value={field.value ? format(new Date(field.value), "yyyy-MM-dd'T'HH:mm") : ''}
                                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
                                    className="h-12"
                                    disabled={isSubmitting}
                                />
                                <FieldDescription>Format : jour, mois, année, heure.</FieldDescription>
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />
                </section>

                {/* Colonne droite : Centre */}
                <section className="space-y-4">
                    <div className="flex items-start gap-2.5 mb-4">
                        <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/40">
                            <MapPin className="h-3.5 w-3.5 text-indigo-700 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold">Centre d’examen</h4>
                            <p className="text-xs text-muted-foreground">Lieu où se déroule l’épreuve (optionnel).</p>
                        </div>
                    </div>

                    <Controller
                        name="centre"
                        control={control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel>Centre</FieldLabel>
                                <Input
                                    {...field}
                                    value={field.value ?? ''}
                                    placeholder="ex: Centre d’examen de Mvog-Mbi"
                                    className="h-12"
                                    disabled={isSubmitting}
                                />
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />
                </section>
            </div>

            <Separator />

            {/* Section Notes */}
            <section className="space-y-4">
                <div className="flex items-start gap-2.5 mb-4">
                    <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/40">
                        <MessageSquare className="h-3.5 w-3.5 text-indigo-700 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold">Notes internes</h4>
                        <p className="text-xs text-muted-foreground">Informations complémentaires (optionnel).</p>
                    </div>
                </div>

                <Controller
                    name="notes"
                    control={control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <Textarea
                                {...field}
                                value={field.value ?? ''}
                                placeholder="ex: Attention : candidat nécessite aménagement particulier"
                                rows={3}
                                disabled={isSubmitting}
                                className="resize-none"
                            />
                            <FieldDescription>Visible uniquement en interne.</FieldDescription>
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                    )}
                />
            </section>

            <p className="text-xs text-muted-foreground border-t pt-4">
                Les champs marqués d’un astérisque (*) sont obligatoires.
            </p>
        </motion.div>
    );
}