// src/features/moniteurs/components/MoniteursAvailabilityCalendar.tsx

/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * @module features/moniteurs/components/MoniteursAvailabilityCalendar
 * @description
 * Calendrier hebdomadaire pour la gestion des disponibilités d’un moniteur.
 * Permet de visualiser et d’éditer les créneaux de leçons sur une semaine.
 *
 * ## Fonctionnalités
 * - Vue semaine (lundi → dimanche) avec heures configurables (par défaut 8h–20h)
 * - Navigation entre semaines : boutons précédent, suivant, aujourd'hui
 * - Affichage des disponibilités sous forme de blocs continus (bleu)
 * - Clic sur une cellule vide : ouvre un modal pour ajouter un créneau à cette heure précise
 * - Clic sur un bloc existant : ouvre un modal pour modifier ou supprimer
 * - Affichage du libellé de la semaine (ex: "Semaine 14 • 31 mars – 6 avril 2025")
 * - Hauteur fixe avec scroll interne
 * - Design responsive (sur mobile, grille simplifiée)
 * - Tooltips au survol des cellules et blocs
 * - Intégration avec le store `usePlanning` pour enregistrer les leçons planifiées
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @example
 * ```tsx
 * <MoniteursAvailabilityCalendar
 *   moniteurId={moniteur.id}
 *   onRefresh={handleRefresh}
 * />
 * ```
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, RotateCcw, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { format, startOfWeek, addDays, isToday, eachDayOfInterval, getWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Lecon } from '@/types/planning.types';
import { usePlanning } from '@/hooks/use.planning';
import { useCandidats } from '@/hooks/use.candidats';
import { useVehicules } from '@/hooks/use.vehicules';
import type { Vehicule } from '@/types/vehicules.types';

// ─────────────────────────────────────────────────────────────────────────────
// Constantes et types
// ─────────────────────────────────────────────────────────────────────────────

/** Heure de début de la grille (défaut 8h) */
const DEFAULT_START_HOUR = 8;
/** Heure de fin de la grille (défaut 20h) */
const DEFAULT_END_HOUR = 20;
/** Hauteur d'une heure en pixels */
const HOUR_HEIGHT = 56;
/** Résolution en minutes (créneaux cliquables) */
const SLOT_MINUTES = 30;
/** Pas de progression pour le stepper dans le formulaire */
const STEP_MINUTES = 30;

// Jours de la semaine (lundi → dimanche)
const WEEK_DAYS = [
    { value: 'MONDAY', label: 'Lundi', short: 'Lun' },
    { value: 'TUESDAY', label: 'Mardi', short: 'Mar' },
    { value: 'WEDNESDAY', label: 'Mercredi', short: 'Mer' },
    { value: 'THURSDAY', label: 'Jeudi', short: 'Jeu' },
    { value: 'FRIDAY', label: 'Vendredi', short: 'Ven' },
    { value: 'SATURDAY', label: 'Samedi', short: 'Sam' },
    { value: 'SUNDAY', label: 'Dimanche', short: 'Dim' },
];

export interface MoniteursAvailabilityCalendarProps {
    /** Identifiant du moniteur */
    moniteurId: number;
    /** Hauteur maximale du calendrier (par défaut 500px) */
    height?: number;
    /** Heure de début de la grille (0-23) */
    startHour?: number;
    /** Heure de fin de la grille (0-23) */
    endHour?: number;
    /** Date de référence pour la semaine (par défaut aujourd'hui) */
    referenceDate?: Date;
    /** Callback de rafraîchissement après modification */
    onRefresh?: () => Promise<void>;
    /** Classes additionnelles */
    className?: string;
}

// Interface interne pour une disponibilité (leçon planifiée)
interface AvailabilitySlot {
    id: number;
    dayOfWeek: string;
    date: Date;
    startTime: string;
    endTime: string;
    isActive: boolean;
    leconId?: number;
    candidat?: {
        id: number;
        nom: string;
        prenom: string;
    };
    vehicule?: {
        id: number;
        immatriculation: string;
        marque: string;
        modele: string;
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sous‑composants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cellule de la grille (un créneau de SLOT_MINUTES minutes).
 */
function TimeSlotCell({
    day,
    hour,
    minute,
    isCovered,
    onClick,
    isWeekend,
}: {
    day: Date;
    hour: number;
    minute: number;
    isCovered: boolean;
    onClick: () => void;
    isWeekend?: boolean;
}) {
    const timeLabel = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    return (
        <div
            className={cn(
                'absolute border-t border-border/30 cursor-pointer transition-colors',
                isCovered
                    ? 'bg-blue-100 dark:bg-blue-950/40 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                    : 'hover:bg-muted/50',
                isWeekend && 'bg-muted/10'
            )}
            style={{
                top: `${(hour - DEFAULT_START_HOUR + minute / 60) * HOUR_HEIGHT}px`,
                height: `${(SLOT_MINUTES / 60) * HOUR_HEIGHT}px`,
                left: 0,
                right: 0,
            }}
            onClick={onClick}
            title={`${format(day, 'EEEE d MMM', { locale: fr })} à ${timeLabel}`}
        >
            {isCovered && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Clock className="h-3 w-3 text-blue-700 dark:text-blue-300" />
                </div>
            )}
        </div>
    );
}

/**
 * Bloc continu représentant une leçon planifiée (ou disponibilité).
 */
function AvailabilityBlock({
    slot,
    onClick,
}: {
    slot: AvailabilitySlot;
    onClick: () => void;
}) {
    const [startHour, startMin] = slot.startTime.split(':').map(Number);
    const [endHour, endMin] = slot.endTime.split(':').map(Number);
    const startPx = (startHour - DEFAULT_START_HOUR + startMin / 60) * HOUR_HEIGHT;
    const durationHours = endHour - startHour + (endMin - startMin) / 60;
    const heightPx = durationHours * HOUR_HEIGHT;
    const candidatName = slot.candidat ? `${slot.candidat.prenom} ${slot.candidat.nom}` : 'Candidat';
    const vehiculeInfo = slot.vehicule ? `${slot.vehicule.marque} ${slot.vehicule.modele} (${slot.vehicule.immatriculation})` : '';

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        className="absolute left-0 right-0 bg-blue-500/20 dark:bg-blue-500/30 border-l-4 border-blue-500 rounded-r-md cursor-pointer hover:bg-blue-500/30 transition-colors z-10"
                        style={{ top: `${startPx}px`, height: `${heightPx}px`, minHeight: '24px' }}
                        onClick={onClick}
                    >
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-[10px] font-medium text-blue-800 dark:text-blue-200 px-1 truncate">
                            <span>{slot.startTime} – {slot.endTime}</span>
                            <span className="text-[9px] text-blue-700/70 dark:text-blue-300/70">{candidatName}</span>
                            {vehiculeInfo && <span className="text-[8px] truncate">{vehiculeInfo}</span>}
                        </div>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="text-xs">
                    <div>Leçon de {slot.startTime} à {slot.endTime}</div>
                    <div>Candidat : {candidatName}</div>
                    {slot.vehicule && <div>Véhicule : {vehiculeInfo}</div>}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

/**
 * Modal / Drawer pour l’édition d’une leçon.
 */
function AvailabilityEditModal({
    open,
    onOpenChange,
    defaultValues,
    onSave,
    onDelete,
    moniteurId,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultValues: {
        id?: number;
        dayOfWeek: string;
        startTime: string;
        endTime: string;
        candidatId?: number;
        vehiculeId?: number;
    };
    onSave: (data: any) => Promise<void>;
    onDelete?: () => Promise<void>;
    moniteurId: number;
}) {
    const isMobile = useIsMobile();
    const [isLoading, setIsLoading] = React.useState(false);
    const [startTime, setStartTime] = React.useState(defaultValues.startTime);
    const [endTime, setEndTime] = React.useState(defaultValues.endTime);
    const [candidatId, setCandidatId] = React.useState<number | undefined>(defaultValues.candidatId);
    const [vehiculeId, setVehiculeId] = React.useState<number | undefined>(defaultValues.vehiculeId);
    const [dayOfWeek, setDayOfWeek] = React.useState(defaultValues.dayOfWeek);

    const { candidats, getAll: getAllCandidats } = useCandidats();
    const { vehicules, getAll: getAllVehicules } = useVehicules();

    React.useEffect(() => {
        getAllCandidats({ limit: 100 });
        getAllVehicules({ limit: 100 });
    }, [getAllCandidats, getAllVehicules]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (startTime >= endTime) {
            toast.error("L'heure de fin doit être postérieure à l'heure de début");
            return;
        }
        if (!candidatId) {
            toast.error('Veuillez sélectionner un candidat');
            return;
        }
        if (!vehiculeId) {
            toast.error('Veuillez sélectionner un véhicule');
            return;
        }
        setIsLoading(true);
        try {
            await onSave({
                id: defaultValues.id,
                dayOfWeek,
                startTime,
                endTime,
                candidatId,
                vehiculeId,
                moniteurId,
            });
            onOpenChange(false);
        } catch {
            toast.error("Erreur lors de l'enregistrement");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!onDelete) return;
        setIsLoading(true);
        try {
            await onDelete();
            onOpenChange(false);
        } catch (err) {
            toast.error('Erreur lors de la suppression');
        } finally {
            setIsLoading(false);
        }
    };

    const formContent = (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FieldGroup>
                <Field>
                    <FieldLabel>Jour de la semaine</FieldLabel>
                    <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {WEEK_DAYS.map((day) => (
                                <SelectItem key={day.value} value={day.value}>
                                    {day.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>

                <div className="grid grid-cols-2 gap-4">
                    <Field>
                        <FieldLabel>Heure de début</FieldLabel>
                        <Input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            step={STEP_MINUTES}
                        />
                    </Field>
                    <Field>
                        <FieldLabel>Heure de fin</FieldLabel>
                        <Input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            step={STEP_MINUTES}
                        />
                    </Field>
                </div>

                <Field>
                    <FieldLabel>Candidat</FieldLabel>
                    <Select
                        value={candidatId?.toString() ?? ''}
                        onValueChange={(val) => setCandidatId(Number(val))}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un candidat" />
                        </SelectTrigger>
                        <SelectContent>
                            {candidats.map((c) => (
                                <SelectItem key={c.id} value={c.id.toString()}>
                                    {c.prenom} {c.nom} ({c.categorie})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>

                <Field>
                    <FieldLabel>Véhicule</FieldLabel>
                    <Select
                        value={vehiculeId?.toString() ?? ''}
                        onValueChange={(val) => setVehiculeId(Number(val))}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un véhicule" />
                        </SelectTrigger>
                        <SelectContent>
                            {vehicules.map((v) => (
                                <SelectItem key={v.id} value={v.id.toString()}>
                                    {v.marque} {v.modele} - {v.immatriculation}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>
            </FieldGroup>

            <div className="flex items-center justify-end gap-3 pt-4">
                {onDelete && (
                    <Button type="button" variant="destructive" onClick={handleDelete} disabled={isLoading}>
                        <Trash2 className="h-4 w-4 mr-1.5" />
                        Supprimer
                    </Button>
                )}
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isLoading}
                >
                    Annuler
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-blue-700 hover:bg-blue-800">
                    {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
            </div>
        </form>
    );

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={onOpenChange}>
                <DrawerContent>
                    <DrawerHeader className="text-left">
                        <DrawerTitle>
                            {defaultValues.id ? 'Modifier la leçon' : 'Planifier une leçon'}
                        </DrawerTitle>
                        <DrawerDescription>
                            {defaultValues.id
                                ? 'Modifiez les horaires, le candidat ou le véhicule.'
                                : 'Ajoutez une nouvelle leçon pour ce créneau.'}
                        </DrawerDescription>
                    </DrawerHeader>
                    <div className="px-6 pb-8">{formContent}</div>
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {defaultValues.id ? 'Modifier la leçon' : 'Planifier une leçon'}
                    </DialogTitle>
                    <DialogDescription>
                        {defaultValues.id
                            ? 'Modifiez les horaires, le candidat ou le véhicule.'
                            : 'Ajoutez une nouvelle leçon pour ce créneau.'}
                    </DialogDescription>
                </DialogHeader>
                {formContent}
            </DialogContent>
        </Dialog>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calendrier des disponibilités / planning d’un moniteur.
 * Affiche les leçons planifiées et permet d’en ajouter/modifier/supprimer.
 */
export function MoniteursAvailabilityCalendar({
    moniteurId,
    height = 500,
    startHour = DEFAULT_START_HOUR,
    endHour = DEFAULT_END_HOUR,
    referenceDate = new Date(),
    onRefresh,
    className,
}: MoniteursAvailabilityCalendarProps): React.JSX.Element {
    const [currentWeekStart, setCurrentWeekStart] = React.useState(
        startOfWeek(referenceDate, { weekStartsOn: 1 })
    );
    const [modalOpen, setModalOpen] = React.useState(false);
    const [selectedSlot, setSelectedSlot] = React.useState<{
        day: Date;
        hour: number;
        minute: number;
        existingSlot?: AvailabilitySlot;
    } | null>(null);
    const [lecons, setLecons] = React.useState<Lecon[]>([]);
    const [loading, setLoading] = React.useState(true);

    const { getByMoniteur, create, update, delete: deleteLecon } = usePlanning();

    // Calcul des dates de la semaine
    const weekDays = React.useMemo(
        () => eachDayOfInterval({ start: currentWeekStart, end: addDays(currentWeekStart, 6) }),
        [currentWeekStart]
    );

    // Chargement des leçons du moniteur pour la semaine courante
    React.useEffect(() => {
        const loadLecons = async () => {
            setLoading(true);
            try {
                const start = weekDays[0];
                const end = weekDays[6];
                const allLecons = await getByMoniteur(moniteurId);
                // Filtrer les leçons de la semaine
                const weekLecons = allLecons.filter((l) => {
                    const leconDate = new Date(l.date);
                    return leconDate >= start && leconDate <= end;
                });
                setLecons(weekLecons);
            } catch (err) {
                console.error(err);
                toast.error("Erreur lors du chargement du planning");
            } finally {
                setLoading(false);
            }
        };
        loadLecons();
    }, [moniteurId, getByMoniteur, weekDays]);

    // Transformer les leçons en slots de disponibilité
    const availabilitiesByDay = React.useMemo(() => {
        const map = new Map<string, AvailabilitySlot[]>();
        for (const day of weekDays) {
            const dayDate = day;
            const dayOfWeek = WEEK_DAYS[day.getDay() === 0 ? 6 : day.getDay() - 1].value;
            const dayLecons = lecons.filter((l) => {
                const leconDate = new Date(l.date);
                return leconDate.toDateString() === dayDate.toDateString();
            });
            const slots: AvailabilitySlot[] = dayLecons.map((l) => ({
                id: l.id,
                dayOfWeek,
                date: l.date as Date,
                startTime: format(new Date(l.date), 'HH:mm'),
                endTime: format(new Date(new Date(l.date).getTime() + l.duree * 60000), 'HH:mm'),
                isActive: true,
                leconId: l.id,
                candidat: l.candidat,
                vehicule: l.vehicule as Vehicule,
            }));
            map.set(day.toDateString(), slots);
        }
        return map;
    }, [lecons, weekDays]);

    // Générer les créneaux horaires
    const timeSlots = React.useMemo(() => {
        const slots = [];
        for (let h = startHour; h < endHour; h++) {
            for (let m = 0; m < 60; m += SLOT_MINUTES) {
                slots.push({ hour: h, minute: m });
            }
        }
        return slots;
    }, [startHour, endHour]);

    // Vérifier si un créneau précis est couvert
    const isTimeSlotCovered = (day: Date, hour: number, minute: number): boolean => {
        const daySlots = availabilitiesByDay.get(day.toDateString()) ?? [];
        const timeMinutes = hour * 60 + minute;
        return daySlots.some((slot) => {
            const [startH, startM] = slot.startTime.split(':').map(Number);
            const [endH, endM] = slot.endTime.split(':').map(Number);
            const startMinutes = startH * 60 + startM;
            const endMinutes = endH * 60 + endM;
            return timeMinutes >= startMinutes && timeMinutes < endMinutes;
        });
    };

    // Récupérer le bloc existant contenant ce créneau
    const getExistingSlot = (day: Date, hour: number, minute: number): AvailabilitySlot | undefined => {
        const daySlots = availabilitiesByDay.get(day.toDateString()) ?? [];
        const timeMinutes = hour * 60 + minute;
        return daySlots.find((slot) => {
            const [startH, startM] = slot.startTime.split(':').map(Number);
            const [endH, endM] = slot.endTime.split(':').map(Number);
            const startMinutes = startH * 60 + startM;
            const endMinutes = endH * 60 + endM;
            return timeMinutes >= startMinutes && timeMinutes < endMinutes;
        });
    };

    const handleCellClick = (day: Date, hour: number, minute: number) => {
        const existingSlot = getExistingSlot(day, hour, minute);
        setSelectedSlot({ day, hour, minute, existingSlot });
        setModalOpen(true);
    };

    const handleSave = async (data: any) => {
        const startDateTime = new Date(selectedSlot!.day);
        const [startH, startM] = data.startTime.split(':').map(Number);
        startDateTime.setHours(startH, startM, 0);
        const duree = (() => {
            const [endH, endM] = data.endTime.split(':').map(Number);
            const endDateTime = new Date(selectedSlot!.day);
            endDateTime.setHours(endH, endM, 0);
            return (endDateTime.getTime() - startDateTime.getTime()) / 60000;
        })();

        if (data.id) {
            // Mise à jour
            await update(data.id, {
                date: startDateTime.toISOString(),
                duree,
                candidatId: data.candidatId,
                vehiculeId: data.vehiculeId,
            });
            toast.success('Leçon modifiée');
        } else {
            // Création
            await create({
                date: startDateTime.toISOString(),
                duree,
                type: 'CONDUITE',
                candidatId: data.candidatId,
                moniteurId,
                vehiculeId: data.vehiculeId,
            });
            toast.success('Leçon planifiée');
        }
        setModalOpen(false);
        setSelectedSlot(null);
        if (onRefresh) await onRefresh();
        // Recharger les leçons
        const allLecons = await getByMoniteur(moniteurId);
        const start = weekDays[0];
        const end = weekDays[6];
        const weekLecons = allLecons.filter((l) => {
            const leconDate = new Date(l.date);
            return leconDate >= start && leconDate <= end;
        });
        setLecons(weekLecons);
    };

    const handleDeleteSlot = async (id: number) => {
        await deleteLecon(id);
        toast.success('Leçon supprimée');
        if (onRefresh) await onRefresh();
        // Recharger les leçons
        const allLecons = await getByMoniteur(moniteurId);
        const start = weekDays[0];
        const end = weekDays[6];
        const weekLecons = allLecons.filter((l) => {
            const leconDate = new Date(l.date);
            return leconDate >= start && leconDate <= end;
        });
        setLecons(weekLecons);
    };

    const prevWeek = () => setCurrentWeekStart(addDays(currentWeekStart, -7));
    const nextWeek = () => setCurrentWeekStart(addDays(currentWeekStart, 7));
    const todayWeek = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

    const firstDay = weekDays[0];
    const lastDay = weekDays[6];
    const periodLabel = `${format(firstDay, 'd MMM', { locale: fr })} – ${format(lastDay, 'd MMM yyyy', { locale: fr })}`;
    const weekNumber = getWeek(firstDay, { weekStartsOn: 1 });

    if (loading) {
        return (
            <Card className={cn('flex flex-col p-4', className)}>
                <div className="flex items-center justify-between gap-2 px-2 py-2">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-8 w-48" />
                </div>
                <div className="flex-1" style={{ height: `${height}px` }}>
                    <Skeleton className="h-full w-full" />
                </div>
            </Card>
        );
    }

    return (
        <Card className={cn('flex flex-col bg-none', className)}>
            {/* Barre d'en-tête avec navigation */}
            <div>
                <div className="flex items-center justify-between gap-2 px-2 py-2 border-b bg-background/50">
                    <div className="flex items-center gap-1">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevWeek}>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Semaine précédente</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextWeek}>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Semaine suivante</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={todayWeek}>
                                        <RotateCcw className="h-3 w-3 mr-1.5" />
                                        Aujourd'hui
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Revenir à la semaine en cours</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs font-normal">
                            Semaine {weekNumber}
                        </Badge>
                        <span className="text-sm font-medium">{periodLabel}</span>
                    </div>
                    <div className="w-12" />
                </div>

                {/* Grille des jours (en-tête) */}
                <div className="flex border-b sticky top-0 z-30 bg-background">
                    <div className="w-14 shrink-0 border-r" />
                    {weekDays.map((day, i) => (
                        <div
                            key={i}
                            className={cn(
                                'flex-1 text-center py-2 text-sm font-medium',
                                isToday(day) && 'text-blue-600 dark:text-blue-400'
                            )}
                        >
                            <div className="hidden sm:block">{WEEK_DAYS[i].label}</div>
                            <div className="block sm:hidden text-xs">{WEEK_DAYS[i].short}</div>
                            <div className="text-xs text-muted-foreground">
                                {format(day, 'd MMM', { locale: fr })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Corps scrollable du calendrier */}
            <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full" style={{ height: `${height}px` }}>
                    <div
                        className="relative flex"
                        style={{ height: `${(endHour - startHour) * HOUR_HEIGHT}px` }}
                    >
                        {/* Colonne heures */}
                        <div className="w-14 shrink-0 relative select-none">
                            {Array.from({ length: endHour - startHour }, (_, i) => {
                                const hour = startHour + i;
                                return (
                                    <div
                                        key={hour}
                                        className="absolute right-2 text-xs text-muted-foreground"
                                        style={{ top: `${i * HOUR_HEIGHT}px` }}
                                    >
                                        {hour.toString().padStart(2, '0')}:00
                                    </div>
                                );
                            })}
                        </div>

                        {/* Colonnes par jour */}
                        {weekDays.map((day, dayIdx) => {
                            const daySlots = availabilitiesByDay.get(day.toDateString()) ?? [];
                            const isWeekend = dayIdx >= 5;

                            return (
                                <div key={dayIdx} className="flex-1 relative border-l border-border/40">
                                    {/* Cellules cliquables */}
                                    {timeSlots.map(({ hour, minute }, slotIdx) => {
                                        const isCovered = isTimeSlotCovered(day, hour, minute);
                                        return (
                                            <TimeSlotCell
                                                key={slotIdx}
                                                day={day}
                                                hour={hour}
                                                minute={minute}
                                                isCovered={isCovered}
                                                isWeekend={isWeekend}
                                                onClick={() => handleCellClick(day, hour, minute)}
                                            />
                                        );
                                    })}
                                    {/* Blocs de leçons existants */}
                                    {daySlots.map((slot) => (
                                        <AvailabilityBlock
                                            key={slot.id}
                                            slot={slot}
                                            onClick={() =>
                                                handleCellClick(day, parseInt(slot.startTime.split(':')[0]), 0)
                                            }
                                        />
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
            </div>

            {/* Pied de page */}
            <div className="flex items-center justify-between px-2 py-1.5 border-t text-xs text-muted-foreground bg-muted/20">
                <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span>Cliquez sur une cellule pour planifier/modifier une leçon</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="h-3 w-3 rounded-full bg-blue-500/40" />
                    <span>Leçon planifiée</span>
                </div>
            </div>

            {/* Modal d'édition */}
            {selectedSlot && (
                <AvailabilityEditModal
                    open={modalOpen}
                    onOpenChange={setModalOpen}
                    defaultValues={{
                        id: selectedSlot.existingSlot?.id,
                        dayOfWeek:
                            WEEK_DAYS[selectedSlot.day.getDay() === 0 ? 6 : selectedSlot.day.getDay() - 1].value,
                        startTime:
                            selectedSlot.existingSlot?.startTime ??
                            `${selectedSlot.hour.toString().padStart(2, '0')}:${selectedSlot.minute.toString().padStart(2, '0')}`,
                        endTime:
                            selectedSlot.existingSlot?.endTime ??
                            `${(selectedSlot.hour + 1).toString().padStart(2, '0')}:${selectedSlot.minute.toString().padStart(2, '0')}`,
                        candidatId: selectedSlot.existingSlot?.candidat?.id,
                        vehiculeId: selectedSlot.existingSlot?.vehicule?.id,
                    }}
                    onSave={handleSave}
                    onDelete={
                        selectedSlot.existingSlot
                            ? () => handleDeleteSlot(selectedSlot.existingSlot!.id)
                            : undefined
                    }
                    moniteurId={moniteurId}
                />
            )}
        </Card>
    );
}