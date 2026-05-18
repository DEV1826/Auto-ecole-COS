/* eslint-disable react-hooks/set-state-in-effect */
// src/features/paiements/components/PaiementCreateForm.tsx

/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * @module features/paiements/components/PaiementCreateForm
 * @description
 * Formulaire de création d’un paiement avec sélection de candidat,
 * modes de paiement via RadioGroup organisés en cartes (image, titre, description),
 * pré‑remplissage automatique du montant avec le reste à payer du candidat,
 * affichage de la référence générée et sélection de facture associée.
 *
 * ## Intelligence métier
 * - Le montant total à payer est le prix de la formation du candidat.
 * - Le solde = prix formation - somme des paiements (indépendamment des factures).
 * - Si le solde est nul, le champ montant est désactivé et un message de succès s’affiche.
 * - Un paiement supérieur au solde est **interdit** : le formulaire devient invalide.
 *
 * @author Stive Junior
 * @version 6.0.0
 */

import * as React from 'react';
import { useForm, useWatch, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { z } from 'zod';
import {
    User,
    Calendar,
    CircleDollarSign,
    BadgeCheck,
    MessageSquare,
    ChevronDown,
    Hash,
    AlertTriangle,
    CheckCircle2,
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { getAvatarUrl } from '@/lib/utils';
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
    createPaiementSchema,
    MODE_PAIEMENT_VALUES,
    type CreatePaiementInput,
} from '@/lib/validators/paiements.validator';
import type { FormPageProps } from '@/components/forms/FormWrapper';
import { useCandidats } from '@/hooks/use.candidats';
import { usePaiements } from '@/hooks/use.paiements';
import { useFactures } from '@/hooks/use.factures';
import type { Candidat } from '@/types/candidats.types';
import type { SoldeCandidat } from '@/types/paiements.types';
import type { Facture } from '@/types/factures.types';
import { MODE_PAIEMENT_CONFIG } from '@/types/enums';

// ─────────────────────────────────────────────────────────────────────────────
// Types & constantes
// ─────────────────────────────────────────────────────────────────────────────

type PaiementFormValues = z.infer<typeof createPaiementSchema>;
export type PaiementFormProps = FormPageProps<Partial<CreatePaiementInput>>;

function formatMontant(n: number): string {
    return n.toLocaleString('fr-FR');
}

// ─────────────────────────────────────────────────────────────────────────────
// Sélecteur de candidat avec gestion du solde complet
// ─────────────────────────────────────────────────────────────────────────────

interface CandidatSelectorProps {
    value?: number;
    onChange: (candidatId: number, candidat: Candidat) => void;
    onSoldeChange: (soldeData: SoldeCandidat) => void;
    disabled?: boolean;
    isSubmitting?: boolean;
}

function CandidatSelector({ value, onChange, onSoldeChange, disabled, isSubmitting }: CandidatSelectorProps) {
    const [open, setOpen] = React.useState(false);
    const [candidats, setCandidats] = React.useState<Candidat[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [selectedCandidat, setSelectedCandidat] = React.useState<Candidat | null>(null);
    const [soldeLoading, setSoldeLoading] = React.useState(false);
    const [recentPayments, setRecentPayments] = React.useState<any[]>([]);
    const [soldeData, setSoldeData] = React.useState<SoldeCandidat | null>(null);

    const { getAll, getById } = useCandidats();
    const { getSoldeCandidat, getByCandidat } = usePaiements();

    // Charger la liste des candidats au montage
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

    // Mettre à jour les détails quand un candidat est pré‑sélectionné
    React.useEffect(() => {
        if (!value || selectedCandidat) return;
        const loadDetails = async () => {
            try {
                const candidat = await getById(value);
                setSelectedCandidat(candidat);
                setSoldeLoading(true);
                const [solde, payments] = await Promise.all([getSoldeCandidat(value), getByCandidat(value)]);
                setSoldeData(solde);
                onSoldeChange(solde);
                setRecentPayments(payments.slice(0, 5));
                setSoldeLoading(false);
            } catch (err) {
                console.error(err);
                setSoldeLoading(false);
            }
        };
        loadDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, selectedCandidat]);

    const handleSelect = (candidat: Candidat) => {
        setSelectedCandidat(candidat);
        setOpen(false);
        onChange(candidat.id, candidat);
        setSoldeLoading(true);
        Promise.all([getSoldeCandidat(candidat.id), getByCandidat(candidat.id)])
            .then(([solde, payments]) => {
                setSoldeData(solde);
                onSoldeChange(solde);
                setRecentPayments(payments.slice(0, 5));
                setSoldeLoading(false);
            })
            .catch(() => setSoldeLoading(false));
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
                <FieldDescription>Choisissez le candidat dans la liste.</FieldDescription>
            </Field>

            {selectedCandidat && (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-md border bg-card p-4 space-y-3 shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <Avatar className="h-14 w-14 ring-2 rounded-full ring-emerald-200">
                            <AvatarImage src={getAvatarUrl(`${selectedCandidat.prenom} ${selectedCandidat.nom}`)} />
                            <AvatarFallback className="bg-emerald-700 text-white text-lg">
                                {`${selectedCandidat.prenom?.[0]}${selectedCandidat.nom?.[0]}`.toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <p className="font-semibold text-lg">{selectedCandidat.prenom} {selectedCandidat.nom}</p>
                            <p className="text-sm text-muted-foreground">
                                {selectedCandidat.email || selectedCandidat.telephone || `ID: ${selectedCandidat.id}`}
                            </p>
                        </div>
                        <Badge
                            variant="outline"
                            className={selectedCandidat.statut === 'RECU' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}
                        >
                            {selectedCandidat.statut === 'RECU' ? 'Reçu' : 'En cours'}
                        </Badge>
                    </div>

                    {/* Affichage du solde détaillé */}
                    {soldeLoading ? (
                        <Skeleton className="h-6 w-28" />
                    ) : soldeData ? (
                        <>
                            <div className="flex justify-between items-center border-t pt-2">
                                <span className="text-sm text-muted-foreground">Total formation <Badge variant="success">{soldeData.formationNom}</Badge></span>
                                <span className="font-semibold">{formatMontant(soldeData.montantTotalFormation)} FCFA</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Total payé</span>
                                <span className="font-semibold">{formatMontant(soldeData.totalPaye)} FCFA</span>
                            </div>
                            <div className="flex justify-between items-center border-t pt-2">
                                <span className="text-sm text-muted-foreground">Solde restant dû</span>
                                <span
                                    className={cn(
                                        'text-xl font-bold',
                                        soldeData.solde > 0 ? 'text-amber-600' : 'text-green-600'
                                    )}
                                >
                                    {formatMontant(soldeData.solde)} FCFA
                                </span>
                            </div>
                            {soldeData.estSolde && (
                                <div className="flex items-center gap-2 text-emerald-600 text-sm bg-emerald-50 dark:bg-emerald-950/20 p-2 rounded-md">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span>Formation entièrement soldée – aucun paiement requis</span>
                                </div>
                            )}
                            {soldeData.tropPerçu && (
                                <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 dark:bg-amber-950/20 p-2 rounded-md">
                                    <AlertTriangle className="h-4 w-4" />
                                    <span>Crédit client : {formatMontant(soldeData.totalPaye - soldeData.montantTotalFormation)} FCFA</span>
                                </div>
                            )}
                        </>
                    ) : null}

                    {recentPayments.length > 0 && (
                        <div className="border-t pt-2">
                            <p className="text-xs font-semibold text-muted-foreground mb-2">Derniers paiements</p>
                            <div className="space-y-1.5">
                                {recentPayments.map((p) => (
                                    <div key={p.id} className="flex justify-between text-xs bg-muted/30 p-2 rounded-md">
                                        <span>{format(new Date(p.date), 'dd/MM/yyyy')}</span>
                                        <span className="font-mono font-semibold">{p.montant.toLocaleString()} FCFA</span>
                                        <span className="text-muted-foreground">{p.mode}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Formulaire principal
// ─────────────────────────────────────────────────────────────────────────────

export default function PaiementCreateForm({ data, onChange, isSubmitting }: PaiementFormProps) {
    const [generatedReference] = React.useState<string>(() => data.reference ?? `PAY-${Date.now()}`);
    const [imgError, setImgError] = React.useState(false);

    const {
        control,
        setValue,
        setError,
        clearErrors,
        formState: { isValid },
        trigger,
    } = useForm<PaiementFormValues>({
        resolver: zodResolver(createPaiementSchema) as Resolver<PaiementFormValues>,
        mode: 'onChange',
        defaultValues: {
            montant: data.montant ?? undefined,
            mode: data.mode ?? undefined,
            candidatId: data.candidatId ?? undefined,
            date: data.date ?? new Date().toISOString(),
            reference: generatedReference,
            note: data.note as string ?? '',
            factureId: data.factureId as number ?? null,
        },
    });

    const watched = useWatch({ control });
    const [selectedCandidatId, setSelectedCandidatId] = React.useState<number | undefined>(data.candidatId);
    const [factures, setFactures] = React.useState<Facture[]>([]);
    const [facturesLoading, setFacturesLoading] = React.useState(false);
    const [candidatSoldeData, setCandidatSoldeData] = React.useState<SoldeCandidat | null>(null);

    const candidatSolde = candidatSoldeData?.solde ?? 0;
    const montantTotalFormation = candidatSoldeData?.montantTotalFormation ?? 0;
    const estSolde = candidatSoldeData?.estSolde ?? false;
    const tropPerçu = candidatSoldeData?.tropPerçu ?? false;
    const totalPaye = candidatSoldeData?.totalPaye ?? 0;

    const { getFacturesByCandidat } = useFactures();

    // Charger les factures du candidat sélectionné
    React.useEffect(() => {
        if (!selectedCandidatId) {
            setFactures([]);
            return;
        }
        setFacturesLoading(true);
        getFacturesByCandidat(selectedCandidatId)
            .then((f) => {
                setFactures(f);
                setFacturesLoading(false);
            })
            .catch(() => {
                setFactures([]);
                setFacturesLoading(false);
            });
    }, [selectedCandidatId, getFacturesByCandidat]);

    // Pré‑remplir le montant avec le solde si le candidat n’est pas encore soldé
    React.useEffect(() => {
        if (!estSolde && candidatSolde > 0 && (!watched.montant || watched.montant === 0)) {
            setValue('montant', candidatSolde);
            trigger('montant');
        }
    }, [candidatSolde, estSolde, watched.montant, setValue, trigger]);

    // Mettre à jour l’ID candidat pour charger les factures
    React.useEffect(() => {
        if (watched.candidatId !== selectedCandidatId) {
            setSelectedCandidatId(watched.candidatId);
        }
    }, [watched.candidatId, selectedCandidatId]);

    const montant = watched.montant || 0;
    const showOverpaymentWarning = !estSolde && montant > candidatSolde && candidatSolde > 0;

    // --- Validation métier : interdire les paiements > solde ---
    const isBusinessValid = React.useMemo(() => {
        if (estSolde) return false; // déjà soldé, pas de paiement possible
        return montant > 0 && montant <= candidatSolde;
    }, [estSolde, montant, candidatSolde]);

    // Ajouter / supprimer une erreur personnalisée sur le champ montant
    React.useEffect(() => {
        if (showOverpaymentWarning) {
            setError('montant', {
                type: 'manual',
                message: `Le montant ne peut pas dépasser le solde dû (${formatMontant(candidatSolde)} FCFA).`,
            });
        } else {
            clearErrors('montant');
        }
    }, [showOverpaymentWarning, candidatSolde, setError, clearErrors]);

    // Propagation au parent avec la validité combinée (Zod + métier)
    React.useEffect(() => {
        onChange(watched, isValid && isBusinessValid);
    }, [watched, isValid, isBusinessValid, onChange]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-8"
        >
            {/* Référence */}
            <section className="flex justify-between items-center">
                <div className="flex items-start gap-2.5 mb-4">
                    <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                        <Hash className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold">Référence du paiement</h4>
                        <p className="text-xs text-muted-foreground">Identifiant unique.</p>
                    </div>
                </div>
                <div className="rounded-md bg-muted/30 p-3 font-bold font-mono text-sm">{generatedReference}</div>
            </section>

            <Separator />

            {/* Candidat */}
            <section className="space-y-2">
                <div className="flex items-start gap-2.5 mb-4">
                    <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                        <User className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold">Candidat</h4>
                        <p className="text-xs text-muted-foreground">Sélectionnez le candidat qui effectue le paiement.</p>
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
                                onSoldeChange={setCandidatSoldeData}
                                disabled={field.disabled}
                                isSubmitting={isSubmitting}
                            />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                    )}
                />
            </section>

            <Separator />

            {/* Montant & mode */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Colonne gauche : montant, date */}
                <section className="space-y-4">
                    <div className="flex items-start gap-2.5 mb-4">
                        <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                            <CircleDollarSign className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold">Montant & date</h4>
                            <p className="text-xs text-muted-foreground">Montant encaissé et date du paiement.</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {/* Montant */}
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
                                        placeholder="ex: 50000"
                                        className="h-12"
                                        disabled={isSubmitting || estSolde}
                                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                    />
                                    <FieldDescription>
                                        {!estSolde
                                            ? `Montant restant dû : ${formatMontant(candidatSolde)} FCFA sur un total de ${formatMontant(montantTotalFormation)} FCFA.`
                                            : null}
                                    </FieldDescription>
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                </Field>
                            )}
                        />

                        {estSolde && (
                            <Alert variant="success" className="mt-2">
                                <CheckCircle2 className="h-4 w-4" />
                                <AlertTitle>Formation entièrement soldée</AlertTitle>
                                <AlertDescription>
                                    Ce candidat a déjà soldé le montant total de sa formation. Aucun paiement supplémentaire n'est nécessaire.
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Avertissement paiement supérieur au solde */}
                        {showOverpaymentWarning && (
                            <Alert variant="info" className="mt-2">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Paiement supérieur au solde</AlertTitle>
                                <AlertDescription>
                                    Le montant saisi dépasse le solde restant dû ({formatMontant(candidatSolde)} FCFA).
                                    Le paiement ne peut pas être enregistré. Veuillez ajuster le montant.
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Crédit existant (trop perçu antérieur) */}
                        {tropPerçu && !estSolde && (
                            <Alert variant="alert" className="mt-2">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Compte créditeur</AlertTitle>
                                <AlertDescription>
                                    Ce candidat a déjà versé plus que le montant de sa formation ({formatMontant(totalPaye)} FCFA pour{' '}
                                    {formatMontant(montantTotalFormation)} FCFA). Un remboursement ou un avoir peut être envisagé.
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Date */}
                        <Controller
                            name="date"
                            control={control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel>
                                        <Calendar className="inline h-3 w-3 mr-1" /> Date du paiement
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
                    </div>
                </section>

                {/* Colonne droite : mode de paiement */}
                <section className="space-y-4">
                    <div className="flex items-start gap-2.5 mb-4">
                        <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                            <BadgeCheck className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold">Mode de paiement</h4>
                            <p className="text-xs text-muted-foreground">Choisissez le moyen utilisé.</p>
                        </div>
                    </div>
                    <Controller
                        name="mode"
                        control={control}
                        render={({ field, fieldState }) => {
                            const isInvalid = fieldState.invalid;
                            return (
                                <FieldSet data-invalid={isInvalid} className="space-y-3">
                                    <FieldLegend variant="label" className="sr-only">
                                        Mode de paiement
                                    </FieldLegend>
                                    <RadioGroup
                                        name={field.name}
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        aria-invalid={isInvalid}
                                        className="grid grid-cols-2 gap-2"
                                    >
                                        {MODE_PAIEMENT_VALUES.map((mode) => {
                                            const cfg = MODE_PAIEMENT_CONFIG[mode];
                                            const isSelected = field.value === mode;
                                            const ModeIcon = cfg.icon;
                                            const modeImage = cfg.image;
                                            return (
                                                <FieldLabel
                                                    key={mode}
                                                    htmlFor={`payment-mode-${mode}`}
                                                    className={cn(
                                                        'cursor-pointer rounded-lg border p-3 transition-all',
                                                        isSelected
                                                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 ring-1 ring-emerald-500'
                                                            : 'border-border hover:border-emerald-300 hover:bg-muted/20'
                                                    )}
                                                >
                                                    <Field orientation="horizontal">
                                                        <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-white dark:bg-gray-800">
                                                            {!imgError && modeImage ? (
                                                                <img
                                                                    src={modeImage}
                                                                    alt={cfg.label}
                                                                    className=" object-contain"
                                                                    onError={() => setImgError(true)}
                                                                />
                                                            ) : (
                                                                <ModeIcon className="size-6 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
                                                            )}
                                                        </div>
                                                        <FieldContent>
                                                            <FieldTitle>{cfg.label}</FieldTitle>
                                                            <FieldDescription>{cfg.description}</FieldDescription>
                                                        </FieldContent>
                                                        <RadioGroupItem value={mode} id={`payment-mode-${mode}`} />
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
            </div>

            <Separator />

            {/* Facture associée (optionnelle) */}
            {selectedCandidatId && (
                <section className="space-y-4">
                    <div className="flex items-start gap-2.5 mb-4">
                        <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                            <BadgeCheck className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold">Facture associée</h4>
                            <p className="text-xs text-muted-foreground">
                                Optionnelle – Lie ce paiement à une facture existante.
                            </p>
                        </div>
                    </div>
                    <Controller
                        name="factureId"
                        control={control}
                        render={({ field }) => (
                            <Field>
                                <Select
                                    onValueChange={(val) => field.onChange(val === 'none' ? null : Number(val))}
                                    value={field.value?.toString() ?? 'none'}
                                    disabled={isSubmitting || facturesLoading}
                                >
                                    <SelectTrigger className="h-12!">
                                        <SelectValue placeholder={facturesLoading ? 'Chargement...' : 'Aucune facture'} />
                                    </SelectTrigger>
                                    <SelectContent >
                                        <SelectItem className="h-12!" value="none">Aucune facture</SelectItem>
                                        {factures.map((f) => (
                                            <SelectItem className="h-12!" key={f.id} value={f.id.toString()}>
                                                {f.numero} - {f.montantTotal.toLocaleString()} FCFA ({f.statut})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FieldDescription>
                                    Laissez vide si vous souhaitez créer une facture ultérieurement.
                                </FieldDescription>
                            </Field>
                        )}
                    />
                </section>
            )}

            <Separator />

            {/* Note interne */}
            <section className="space-y-4">
                <div className="flex items-start gap-2.5 mb-4">
                    <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                        <MessageSquare className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold">Note interne</h4>
                        <p className="text-xs text-muted-foreground">Informations complémentaires (optionnelle).</p>
                    </div>
                </div>
                <Controller
                    name="note"
                    control={control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <Textarea
                                {...field}
                                value={field.value ?? ''}
                                placeholder="ex: Acompte permis B, Solde restant, etc."
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

            {/* Champ référence masqué */}
            <input type="hidden" {...control.register('reference')} value={generatedReference} />
        </motion.div>
    );
}