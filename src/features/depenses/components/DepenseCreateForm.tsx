/* eslint-disable react-hooks/set-state-in-effect */
// src/features/depenses/components/DepenseCreateForm.tsx

'use client';

/**
 * @module features/depenses/components/DepenseCreateForm
 * @description
 * Formulaire de création d’une dépense avec intelligence métier.
 *
 * ## Fonctionnalités avancées
 * - Sélecteur de véhicule (optionnel, selon catégorie)
 * - Fournisseur dynamique selon catégorie
 * - Description pré‑remplie et modifiable
 * - Réinitialisation automatique des champs liés à la catégorie
 * - Validation Zod complète
 *
 * @author Stive Junior
 * @version 2.0.0
 */

import * as React from 'react';
import { useForm, useWatch, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { z } from 'zod';
import {
    Fuel,
    Wrench,
    Briefcase,
    Building2,
    Zap,
    Phone,
    Shield,
    Megaphone,
    Package,
    Landmark,
    MoreHorizontal,
    Calendar,
    Hash,
    Car,
    ChevronDown,
    AlertCircle,
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
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Command as CommandMenu,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import {
    createDepenseSchema,
    CATEGORIE_DEPENSE_VALUES,
    type CreateDepenseInput,
} from '@/lib/validators/depenses.validator';
import type { FormPageProps } from '@/components/forms/FormWrapper';
import { useVehicules } from '@/hooks/use.vehicules';
import type { Vehicule } from '@/types/vehicules.types';
import { CATEGORIE_DEPENSE_CONFIG, type CategorieDepense } from '@/types/enums';

// ─────────────────────────────────────────────────────────────────────────────
// Types & constantes
// ─────────────────────────────────────────────────────────────────────────────

type DepenseFormValues = z.infer<typeof createDepenseSchema>;
export type DepenseFormProps = FormPageProps<Partial<CreateDepenseInput>>;

const CATEGORIE_ICONS: Record<string, React.ElementType> = {
    CARBURANT: Fuel,
    ENTRETIEN_VEHICULE: Wrench,
    SALAIRE: Briefcase,
    LOYER: Building2,
    ELECTRICITE: Zap,
    TELEPHONE: Phone,
    ASSURANCE: Shield,
    PUBLICITE: Megaphone,
    FOURNITURES: Package,
    TAXES: Landmark,
    AUTRE: MoreHorizontal,
};

const FOURNISSEURS_PAR_CATEGORIE: Record<string, { label: string; value: string; icon?: React.ElementType }[]> = {
    CARBURANT: [
        { label: 'TotalEnergies', value: 'TotalEnergies', icon: Fuel },
        { label: 'TOTAL', value: 'TOTAL', icon: Fuel },
        { label: 'Petro Cameroun', value: 'Petro Cameroun', icon: Fuel },
        { label: 'Trading SA', value: 'Trading SA', icon: Fuel },
        { label: 'STATION IRAD', value: 'STATION IRAD', icon: Fuel },
        { label: 'Autre station', value: 'Autre station', icon: Fuel },
    ],
    ENTRETIEN_VEHICULE: [
        { label: 'Garage Mfoundi', value: 'Garage Mfoundi', icon: Wrench },
        { label: 'Garage Mvan', value: 'Garage Mvan', icon: Wrench },
        { label: 'Garage Bastos', value: 'Garage Bastos', icon: Wrench },
        { label: 'Garage Mokolo', value: 'Garage Mokolo', icon: Wrench },
        { label: 'Auto-école COS Garage', value: 'Auto-école COS Garage', icon: Wrench },
        { label: 'Autre garage', value: 'Autre garage', icon: Wrench },
    ],
    TELEPHONE: [
        { label: 'Orange Cameroun', value: 'Orange Cameroun', icon: Phone },
        { label: 'MTN Cameroun', value: 'MTN Cameroun', icon: Phone },
        { label: 'Camtel', value: 'Camtel', icon: Phone },
        { label: 'Nexttel', value: 'Nexttel', icon: Phone },
        { label: 'Autre opérateur', value: 'Autre opérateur', icon: Phone },
    ],
    ELECTRICITE: [
        { label: 'ENEO', value: 'ENEO', icon: Zap },
        { label: 'Autre fournisseur', value: 'Autre fournisseur', icon: Zap },
    ],
    ASSURANCE: [
        { label: 'AXA Cameroun', value: 'AXA Cameroun', icon: Shield },
        { label: 'Allianz Cameroun', value: 'Allianz Cameroun', icon: Shield },
        { label: 'Activa', value: 'Activa', icon: Shield },
        { label: 'SAAR', value: 'SAAR', icon: Shield },
        { label: 'Autre assurance', value: 'Autre assurance', icon: Shield },
    ],
    PUBLICITE: [
        { label: 'CRTV', value: 'CRTV', icon: Megaphone },
        { label: 'Vision 4', value: 'Vision 4', icon: Megaphone },
        { label: 'Facebook Ads', value: 'Facebook Ads', icon: Megaphone },
        { label: 'Google Ads', value: 'Google Ads', icon: Megaphone },
        { label: 'Imprimerie COS', value: 'Imprimerie COS', icon: Megaphone },
        { label: 'Autre média', value: 'Autre média', icon: Megaphone },
    ],
    FOURNITURES: [
        { label: 'Bureau Vallée', value: 'Bureau Vallée', icon: Package },
        { label: 'Buroplus', value: 'Buroplus', icon: Package },
        { label: 'Auchan', value: 'Auchan', icon: Package },
        { label: 'Carrefour Mfoundi', value: 'Carrefour Mfoundi', icon: Package },
        { label: 'Autre', value: 'Autre', icon: Package },
    ],
    AUTRE: [{ label: 'Autre fournisseur', value: 'Autre fournisseur', icon: MoreHorizontal }],
};

function generateDefaultDescription(categorie: CategorieDepense, fournisseur?: string | null, vehicule?: Vehicule | null): string {
    const catLabel = CATEGORIE_DEPENSE_CONFIG[categorie]?.label || categorie;
    if (categorie === 'CARBURANT') {
        if (vehicule) {
            return `Achat de carburant pour ${vehicule.marque} ${vehicule.modele} (${vehicule.immatriculation}) - ${fournisseur || 'Station service'}`;
        }
        return `Achat de carburant - ${fournisseur || 'Station service'}`;
    }
    if (categorie === 'ENTRETIEN_VEHICULE') {
        if (vehicule) {
            return `Entretien du véhicule ${vehicule.marque} ${vehicule.modele} (${vehicule.immatriculation}) - ${fournisseur || 'Garage'}`;
        }
        return `Entretien véhicule - ${fournisseur || 'Garage'}`;
    }
    if (categorie === 'TELEPHONE') return `Abonnement téléphone - ${fournisseur || 'Opérateur'}`;
    if (categorie === 'ELECTRICITE') return `Facture électricité - ${fournisseur || 'ENEO'}`;
    if (categorie === 'ASSURANCE') return `Prime d'assurance - ${fournisseur || 'Assureur'}`;
    if (categorie === 'LOYER') return `Loyer des locaux - ${fournisseur || 'Propriétaire'}`;
    if (categorie === 'SALAIRE') return `Salaire personnel - ${fournisseur || 'Paye'}`;
    if (categorie === 'PUBLICITE') return `Campagne publicitaire - ${fournisseur || 'Média'}`;
    if (categorie === 'FOURNITURES') return `Achat fournitures - ${fournisseur || 'Fournisseur'}`;
    return `${catLabel} - ${fournisseur || 'Divers'}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sélecteur de véhicule
// ─────────────────────────────────────────────────────────────────────────────

interface VehiculeSelectorProps {
    value?: number | null;
    onChange: (vehiculeId: number | null, vehicule?: Vehicule) => void;
    disabled?: boolean;
    isSubmitting?: boolean;
}

function VehiculeSelector({ value, onChange, disabled, isSubmitting }: VehiculeSelectorProps) {
    const [open, setOpen] = React.useState(false);
    const [vehicules, setVehicules] = React.useState<Vehicule[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [selectedVehicule, setSelectedVehicule] = React.useState<Vehicule | null>(null);

    const { getAll } = useVehicules();

    React.useEffect(() => {
        const loadVehicules = async () => {
            setLoading(true);
            try {
                const response = await getAll({});
                setVehicules(response.vehicules);
            } catch (err) {
                console.error('Erreur chargement véhicules', err);
            } finally {
                setLoading(false);
            }
        };
        loadVehicules();
    }, [getAll]);

    React.useEffect(() => {
        if (value && !selectedVehicule) {
            const found = vehicules.find(v => v.id === value);
            if (found) setSelectedVehicule(found);
        } else if (!value && selectedVehicule) {
            setSelectedVehicule(null);
        }
    }, [value, vehicules, selectedVehicule]);

    const handleSelect = (vehicule: Vehicule) => {
        setSelectedVehicule(vehicule);
        setOpen(false);
        onChange(vehicule.id, vehicule);
    };

    const handleClear = () => {
        setSelectedVehicule(null);
        onChange(null);
    };

    const displayName = selectedVehicule
        ? `${selectedVehicule.marque} ${selectedVehicule.modele} - ${selectedVehicule.immatriculation}`
        : 'Sélectionner un véhicule (optionnel)';

    const getVehicleImage = (v: Vehicule) => `/images/permis/${v.categorie}.png`;

    return (
        <Field>
            <FieldLabel htmlFor="vehicule-select">Véhicule associé (optionnel)</FieldLabel>
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
                        <CommandInput placeholder="Rechercher par immatriculation, marque..." />
                        <CommandList>
                            <CommandEmpty>Aucun véhicule trouvé.</CommandEmpty>
                            <CommandGroup>
                                {vehicules.map((v) => (
                                    <CommandItem
                                        key={v.id}
                                        value={`${v.marque} ${v.modele} ${v.immatriculation}`}
                                        onSelect={() => handleSelect(v)}
                                        className="flex items-center gap-3 p-2"
                                    >
                                        <Avatar className="size-10 object-contain">
                                            <AvatarImage src={getVehicleImage(v)} />
                                            <AvatarFallback>{`${v.marque[0]}${v.modele[0]}`}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {v.marque} {v.modele}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {v.immatriculation} - {v.kilometrage.toLocaleString()} km
                                            </p>
                                        </div>
                                        <Badge variant="outline" className="shrink-0">
                                            {v.statut === 'DISPONIBLE' ? 'Dispo' : v.statut === 'EN_LECON' ? 'En leçon' : 'Indispo'}
                                        </Badge>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </CommandMenu>
                </PopoverContent>
            </Popover>
            {selectedVehicule && (
                <div className="flex justify-end">
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={handleClear}>
                        Effacer
                    </Button>
                </div>
            )}
            <FieldDescription>Laissez vide si la dépense n’est pas liée à un véhicule spécifique.</FieldDescription>
        </Field>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sélecteur de fournisseur dynamique
// ─────────────────────────────────────────────────────────────────────────────

interface FournisseurSelectorProps {
    categorie?: string;
    value?: string | null;
    onChange: (value: string | null) => void;
    disabled?: boolean;
}

function FournisseurSelector({ categorie, value, onChange, disabled }: FournisseurSelectorProps) {
    const options = React.useMemo(() => {
        return categorie && FOURNISSEURS_PAR_CATEGORIE[categorie] ? FOURNISSEURS_PAR_CATEGORIE[categorie] : [];
    }, [categorie]);

    const [customValue, setCustomValue] = React.useState('');

    React.useEffect(() => {
        if (value && options.every(opt => opt.value !== value)) {
            setCustomValue(value);
        } else if (!value) {
            setCustomValue('');
        }
    }, [value, options]);

    if (options.length === 0) {
        return (
            <Field>
                <FieldLabel>Fournisseur</FieldLabel>
                <Input
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value || null)}
                    placeholder="Nom du fournisseur / prestataire"
                    className="h-12"
                    disabled={disabled}
                />
                <FieldDescription>Libellé libre</FieldDescription>
            </Field>
        );
    }

    const Icon = options.find(o => o.value === value)?.icon || options[0]?.icon;

    const handleSelectChange = (val: string) => {
        if (val === 'none') {
            onChange('');
        } else {
            onChange(val);
        }
    };

    const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setCustomValue(val);
        onChange(val || null);
    };

    return (
        <Field>
            <FieldLabel>Fournisseur</FieldLabel>
            <Select
                value={options.some(opt => opt.value === value) ? (value ?? '') : 'none'}
                onValueChange={handleSelectChange}
                disabled={disabled}
            >
                <SelectTrigger className="h-12!">
                    <div className="flex items-center gap-2">
                        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                        <SelectValue placeholder="Sélectionner un fournisseur..." />
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">Saisir manuellement</SelectItem>
                    {options.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center gap-2">
                                {opt.icon && <opt.icon className="h-4 w-4" />}
                                {opt.label}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {value === '' && (
                <Input
                    placeholder="Nom du fournisseur personnalisé..."
                    className="mt-2"
                    value={customValue}
                    onChange={handleCustomChange}
                    disabled={disabled}
                />
            )}
        </Field>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

export default function DepenseCreateForm({ data, onChange, isSubmitting }: DepenseFormProps) {
    const [generatedReference] = React.useState<string>(() => data.reference ?? `DEP-${Date.now()}`);
    const [selectedVehicule, setSelectedVehicule] = React.useState<Vehicule | null>(null);
    const lastDefaultDescRef = React.useRef<string>('');

    const {
        control,
        setValue,
        formState: { isValid },
        trigger,
    } = useForm<DepenseFormValues>({
        resolver: zodResolver(createDepenseSchema) as Resolver<DepenseFormValues>,
        mode: 'onChange',
        defaultValues: {
            categorie: data.categorie ?? undefined,
            montant: data.montant ?? undefined,
            description: data.description as string ?? '',
            date: data.date ?? new Date().toISOString(),
            fournisseur: data.fournisseur as string ?? null,
            reference: generatedReference,
            vehiculeId: data.vehiculeId as number ?? null,
        },
    });

    const watched = useWatch({ control });
    const currentCategorie = watched.categorie;
    const currentFournisseur = watched.fournisseur;

    // Effet 1 : Réinitialiser le véhicule si la catégorie n'est pas CARBURANT ni ENTRETIEN_VEHICULE
    React.useEffect(() => {
        if (currentCategorie && currentCategorie !== 'CARBURANT' && currentCategorie !== 'ENTRETIEN_VEHICULE') {
            if (watched.vehiculeId !== null) {
                setValue('vehiculeId', null);
                setSelectedVehicule(null);
                trigger('vehiculeId');
            }
        }
    }, [currentCategorie, watched.vehiculeId, setValue, trigger]);

    // Effet 2 : Réinitialiser le fournisseur lorsque la catégorie change
    React.useEffect(() => {
        if (currentCategorie) {
            // Ne pas réinitialiser si la valeur est déjà vide ou null
            if (currentFournisseur !== null && currentFournisseur !== '') {
                setValue('fournisseur', null);
                trigger('fournisseur');
            }
        }
    }, [currentCategorie, currentFournisseur, setValue, trigger]);

    // Effet 3 : Mise à jour automatique de la description par défaut
    React.useEffect(() => {
        if (!currentCategorie) return;
        const defaultDesc = generateDefaultDescription(currentCategorie, currentFournisseur, selectedVehicule);
        const currentDesc = watched.description || '';
        // Ne mettre à jour que si la description est vide ou égale à la dernière valeur par défaut
        if (currentDesc === '' || currentDesc === lastDefaultDescRef.current) {
            setValue('description', defaultDesc);
            trigger('description');
        }
        lastDefaultDescRef.current = defaultDesc;
    }, [currentCategorie, currentFournisseur, selectedVehicule, watched.description, setValue, trigger]);

    const handleVehiculeChange = (vehiculeId: number | null, vehicule?: Vehicule) => {
        setValue('vehiculeId', vehiculeId);
        if (vehicule) setSelectedVehicule(vehicule);
        else setSelectedVehicule(null);
        trigger('vehiculeId');
    };

    // Propagation au parent
    React.useEffect(() => {
        onChange(watched, isValid);
    }, [watched, isValid, onChange]);

    const showVehiculeSelector = currentCategorie === 'CARBURANT' || currentCategorie === 'ENTRETIEN_VEHICULE';

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-8"
        >
            <section className="flex justify-between items-center">
                <div className="flex items-start gap-2.5">
                    <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-blue-100 dark:bg-blue-900/40">
                        <Hash className="h-3.5 w-3.5 text-blue-700 dark:text-blue-400" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold">Référence</h4>
                        <p className="text-xs text-muted-foreground">Identifiant unique.</p>
                    </div>
                </div>
                <div className="rounded-md bg-muted/30 p-3 font-bold font-mono text-sm">{generatedReference}</div>
            </section>

            <Separator />

            <section className="space-y-4">
                <div className="flex items-start gap-2.5 mb-4">
                    <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-blue-100 dark:bg-blue-900/40">
                        <AlertCircle className="h-3.5 w-3.5 text-blue-700 dark:text-blue-400" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold">Catégorie de dépense</h4>
                        <p className="text-xs text-muted-foreground">Choisissez la nature de la dépense.</p>
                    </div>
                </div>

                <Controller
                    name="categorie"
                    control={control}
                    render={({ field, fieldState }) => {
                        const isInvalid = fieldState.invalid;
                        return (
                            <FieldSet data-invalid={isInvalid} className="space-y-3">
                                <FieldLegend variant="label" className="sr-only">Catégorie de dépense</FieldLegend>
                                <RadioGroup
                                    name={field.name}
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    aria-invalid={isInvalid}
                                    className="grid grid-cols-2 md:grid-cols-3 gap-2"
                                >
                                    {CATEGORIE_DEPENSE_VALUES.map((cat) => {
                                        const cfg = CATEGORIE_DEPENSE_CONFIG[cat];
                                        const CatIcon = CATEGORIE_ICONS[cat];
                                        const isSelected = field.value === cat;
                                        return (
                                            <FieldLabel
                                                key={cat}
                                                htmlFor={`depense-categorie-${cat}`}
                                                className={cn(
                                                    'cursor-pointer rounded-lg border p-3 transition-all',
                                                    isSelected
                                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 ring-1 ring-blue-500'
                                                        : 'border-border hover:border-blue-300 hover:bg-muted/20'
                                                )}
                                            >
                                                <Field orientation="horizontal">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gray-600 shadow-sm dark:bg-gray-800">
                                                        <CatIcon className="size-5 text-white" />
                                                    </div>
                                                    <FieldContent>
                                                        <FieldTitle>{cfg.label}</FieldTitle>
                                                        <FieldDescription>{cfg.description}</FieldDescription>
                                                    </FieldContent>
                                                    <RadioGroupItem value={cat} id={`depense-categorie-${cat}`} />
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

            {currentCategorie && (
                <section className="space-y-4">
                    <div className="flex items-start gap-2.5 mb-4">
                        <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-blue-100 dark:bg-blue-900/40">
                            <Car className="h-3.5 w-3.5 text-blue-700 dark:text-blue-400" />
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold">Détails de la dépense</h4>
                            <p className="text-xs text-muted-foreground">Informations spécifiques à la catégorie sélectionnée.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {showVehiculeSelector && (
                            <Controller
                                name="vehiculeId"
                                control={control}
                                render={({ field }) => (
                                    <VehiculeSelector
                                        value={field.value}
                                        onChange={handleVehiculeChange}
                                        disabled={isSubmitting}
                                        isSubmitting={isSubmitting}
                                    />
                                )}
                            />
                        )}

                        <Controller
                            name="fournisseur"
                            control={control}
                            render={({ field }) => (
                                <FournisseurSelector
                                    categorie={currentCategorie}
                                    value={field.value}
                                    onChange={field.onChange}
                                    disabled={isSubmitting}
                                />
                            )}
                        />

                        <Controller
                            name="description"
                            control={control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel>Description</FieldLabel>
                                    <Textarea
                                        {...field}
                                        value={field.value ?? ''}
                                        placeholder="Description détaillée de la dépense..."
                                        rows={3}
                                        className="resize-none"
                                        disabled={isSubmitting}
                                    />
                                    <FieldDescription>Peut être modifiée librement.</FieldDescription>
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                </Field>
                            )}
                        />

                        <Controller
                            name="date"
                            control={control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel>
                                        <Calendar className="inline h-3 w-3 mr-1" /> Date de la dépense
                                    </FieldLabel>
                                    <Input
                                        type="date"
                                        {...field}
                                        value={field.value ? format(new Date(field.value), 'yyyy-MM-dd') : ''}
                                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
                                        className="h-12"
                                        disabled={isSubmitting}
                                    />
                                    <FieldDescription>Par défaut, la date du jour.</FieldDescription>
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                </Field>
                            )}
                        />

                        <Controller
                            name="montant"
                            control={control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel>Montant (FCFA) *</FieldLabel>
                                    <Input
                                        type="number"
                                        {...field}
                                        value={field.value ?? ''}
                                        placeholder="ex: 45000"
                                        className="h-12"
                                        disabled={isSubmitting}
                                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                    />
                                    <FieldDescription>Le montant total de la dépense.</FieldDescription>
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                </Field>
                            )}
                        />
                    </div>
                </section>
            )}

            <input type="hidden" {...control.register('reference')} value={generatedReference} />

            <p className="text-xs text-muted-foreground border-t pt-4">
                Les champs marqués d’un astérisque (*) sont obligatoires.
            </p>
        </motion.div>
    );
}