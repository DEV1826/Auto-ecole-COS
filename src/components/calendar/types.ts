/**
 * @module components/calendar/types
 * @description
 * Types complets pour la gestion du calendrier dans l’auto‑école COS.
 *
 * Ce module exporte :
 * - `CalendarEventType` : types d’événements (leçon, examen, paiement, maintenance, rappel)
 * - `CalendarEventStatus` : statuts (planifié, confirmé, effectué, annulé, etc.)
 * - `CalendarEventPriority` : priorité (basse, moyenne, haute, urgente)
 * - `CalendarEvent` : événement unifié
 * - `CalendarFilters`, `CalendarState`, `CalendarEventFormData`
 * - `CalendarActions` : callbacks CRUD + actions spécifiques
 * - `AppCalendarProps` : props du composant principal
 * - Sous‑composants : `CalendarHeaderProps`, `CalendarWeekViewProps`, etc.
 * - Configurations d’affichage (`EVENT_TYPE_CONFIG`, `EVENT_STATUS_CONFIG`) avec couleurs, icônes, badges
 * - Utilitaires de conversion (pour transformer les modèles métier en événements calendrier)
 *
 * Ces types sont utilisés dans les composants `AppCalendar`, `CalendarWeekView`,
 * `CalendarMonthView`, `CalendarSidebar`, etc.
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @see {@link TypeLecon} – Énumération des types de leçon
 * @see {@link StatutLecon} – Statut des leçons
 * @see {@link TypeExamen} – Type d’examen
 * @see {@link ResultatExamen} – Résultat d’examen
 * @see {@link ModePaiement} – Mode de paiement
 * @see {@link StatutFacture} – Statut de facture
 */

import type { LucideIcon } from 'lucide-react';
import {
  Calendar,
  Car,
  GraduationCap,
  CreditCard,
  Wrench,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import type { Lecon } from '@/types/planning.types';
import type { Examen } from '@/types/examens.types';
import type { Paiement } from '@/types/paiements.types';
import type { Facture } from '@/types/factures.types';
import type { Vehicule } from '@/types/vehicules.types';

// ============================================================
// TYPES D’ÉVÉNEMENTS CALENDRIER
// ============================================================

/**
 * Type d’événement (catégorie métier).
 *
 * - `lesson` : Leçon de code ou de conduite
 * - `exam` : Examen (code ou pratique)
 * - `payment` : Rappel de paiement / échéance facture
 * - `maintenance` : Entretien véhicule
 * - `reminder` : Rappel personnel ou administratif
 */
export type CalendarEventType = 'lesson' | 'exam' | 'payment' | 'maintenance' | 'reminder';

/**
 * Statut d’un événement.
 *
 * - `PLANIFIED` : Planifié / à venir
 * - `CONFIRMED` : Confirmé
 * - `IN_PROGRESS` : En cours
 * - `DONE` : Effectué (leçon) / Payé (paiement)
 * - `CANCELLED` : Annulé
 * - `MISSED` : Absence (candidat non venu)
 */
export type CalendarEventStatus =
  | 'PLANIFIED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'DONE'
  | 'CANCELLED'
  | 'MISSED';

/**
 * Priorité d’un événement.
 *
 * - `LOW` : Basse
 * - `MEDIUM` : Moyenne
 * - `HIGH` : Haute
 * - `URGENT` : Urgente
 */
export type CalendarEventPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// ============================================================
// PERSONNE ASSOCIÉE À UN ÉVÉNEMENT
// ============================================================

/**
 * Informations réduites d’une personne (candidat, moniteur, etc.) pour l’affichage.
 */
export interface CalendarPersonInfo {
  /** Identifiant unique */
  id: number;
  /** Nom complet (ex: "Jean Dupont") */
  name: string;
  /** URL de l’avatar (optionnel) */
  avatarUrl?: string;
  /** Rôle (pour adapter l’affichage) */
  role?: string;
  /** Téléphone (optionnel) */
  phone?: string;
}

// ============================================================
// ÉVÉNEMENT CALENDRIER UNIFIÉ
// ============================================================

/**
 * Événement calendrier unifié.
 * Construit à partir des DTOs métier (Lecon, Examen, Paiement, Facture, etc.)
 * via les fonctions de conversion.
 *
 * @example
 * ```ts
 * const event: CalendarEvent = {
 *   id: 1,
 *   title: 'Leçon de conduite - Jean Dupont',
 *   type: 'lesson',
 *   status: 'PLANIFIED',
 *   startDate: new Date('2025-05-15T10:00:00'),
 *   endDate: new Date('2025-05-15T11:00:00'),
 *   candidat: { id: 42, name: 'Jean Dupont' },
 *   moniteur: { id: 5, name: 'Marc Dubois' },
 *   vehicule: 'LT-123-AB',
 * };
 * ```
 */
export interface CalendarEvent {
  /** Identifiant unique (généralement l’ID source) */
  id: number;
  /** Titre affiché dans le calendrier */
  title: string;
  /** Description détaillée (optionnelle) */
  description?: string;
  /** Type d’événement (catégorie) */
  type: CalendarEventType;
  /** Statut actuel */
  status: CalendarEventStatus;
  /** Priorité (ex: pour les rappels urgents) */
  priority?: CalendarEventPriority;
  /** Date et heure de début */
  startDate: Date;
  /** Date et heure de fin */
  endDate: Date;
  /** Indique si l’événement dure toute la journée */
  allDay?: boolean;
  /** Lieu (salle, centre d’examen, garage) */
  location?: string;
  /** Candidat associé (pour une leçon ou un examen) */
  candidat?: CalendarPersonInfo;
  /** Moniteur associé (pour une leçon) */
  moniteur?: CalendarPersonInfo;
  /** Immatriculation du véhicule (pour une leçon) */
  vehicule?: string;
  /** Montant (pour un paiement ou une facture) */
  montant?: number;
  /** Notes personnelles (libre) */
  notes?: string;
  /** Couleur personnalisée (code hexadécimal ou classe Tailwind) */
  color?: string;
  /** Marqué comme urgent (affichage spécifique) */
  isUrgent?: boolean;
  /** Données brutes d’origine (pour accès métier étendu) */
  rawData?: Lecon | Examen | Paiement | Facture | Vehicule;
  /** Date de création (pour tri) */
  createdAt?: Date;
  /** Date de dernière modification */
  updatedAt?: Date;
}

// ============================================================
// CONFIGURATIONS D’AFFICHAGE
// ============================================================

/**
 * Configuration visuelle pour un type d’événement.
 */
export interface EventTypeConfig {
  /** Libellé affiché (ex: "Leçon") */
  label: string;
  /** Description courte (pour tooltip) */
  description?: string;
  /** Classe Tailwind pour le fond (badge) */
  bgColor: string;
  /** Classe Tailwind pour la couleur du texte */
  textColor: string;
  /** Classe pour la bordure */
  borderColor: string;
  /** Classe pour le point de couleur (à côté du titre) */
  dotColor: string;
  /** Icône Lucide associée */
  icon: LucideIcon;
}

/**
 * Configuration visuelle pour un statut d’événement.
 */
export interface EventStatusConfig {
  /** Libellé affiché */
  label: string;
  /** Classe Tailwind pour le fond du badge */
  bgColor: string;
  /** Classe Tailwind pour la couleur du texte */
  textColor: string;
  /** Classe pour le point de couleur */
  dotColor: string;
  /** Icône (optionnelle) */
  icon?: LucideIcon;
}

/**
 * Configuration des types d’événements (affichage dans les badges, filtres, etc.)
 */
export const EVENT_TYPE_CONFIG: Record<CalendarEventType, EventTypeConfig> = {
  lesson: {
    label: 'Leçon',
    description: 'Leçon de code ou de conduite',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    textColor: 'text-blue-700 dark:text-blue-300',
    borderColor: 'border-blue-200 dark:border-blue-800',
    dotColor: 'bg-blue-500',
    icon: Car,
  },
  exam: {
    label: 'Examen',
    description: 'Examen de code ou de conduite',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    textColor: 'text-purple-700 dark:text-purple-300',
    borderColor: 'border-purple-200 dark:border-purple-800',
    dotColor: 'bg-purple-500',
    icon: GraduationCap,
  },
  payment: {
    label: 'Paiement',
    description: 'Rappel d’échéance ou encaissement',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    dotColor: 'bg-emerald-500',
    icon: CreditCard,
  },
  maintenance: {
    label: 'Entretien',
    description: 'Entretien véhicule (révision, vidange, etc.)',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    textColor: 'text-amber-700 dark:text-amber-300',
    borderColor: 'border-amber-200 dark:border-amber-800',
    dotColor: 'bg-amber-500',
    icon: Wrench,
  },
  reminder: {
    label: 'Rappel',
    description: 'Rappel personnel ou administratif',
    bgColor: 'bg-slate-50 dark:bg-slate-950/30',
    textColor: 'text-slate-700 dark:text-slate-300',
    borderColor: 'border-slate-200 dark:border-slate-800',
    dotColor: 'bg-slate-500',
    icon: Bell,
  },
};

/**
 * Configuration des statuts d’événements.
 */
export const EVENT_STATUS_CONFIG: Record<CalendarEventStatus, EventStatusConfig> = {
  PLANIFIED: {
    label: 'Planifié',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    textColor: 'text-blue-700 dark:text-blue-300',
    dotColor: 'bg-blue-500',
    icon: Calendar,
  },
  CONFIRMED: {
    label: 'Confirmé',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    dotColor: 'bg-emerald-500',
    icon: CheckCircle,
  },
  IN_PROGRESS: {
    label: 'En cours',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    textColor: 'text-amber-700 dark:text-amber-300',
    dotColor: 'bg-amber-500',
    icon: Clock,
  },
  DONE: {
    label: 'Effectué',
    bgColor: 'bg-teal-50 dark:bg-teal-950/30',
    textColor: 'text-teal-700 dark:text-teal-300',
    dotColor: 'bg-teal-500',
    icon: CheckCircle,
  },
  CANCELLED: {
    label: 'Annulé',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    textColor: 'text-red-700 dark:text-red-300',
    dotColor: 'bg-red-500',
    icon: XCircle,
  },
  MISSED: {
    label: 'Absence',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    textColor: 'text-orange-700 dark:text-orange-300',
    dotColor: 'bg-orange-500',
    icon: AlertCircle,
  },
};

// ============================================================
// FILTRES ET ÉTAT DU CALENDRIER
// ============================================================

/**
 * Critères de filtrage des événements.
 */
export interface CalendarFilters {
  /** Types d’événements à inclure (ex: ['lesson', 'exam']) */
  types?: CalendarEventType[];
  /** Statuts à inclure (ex: ['PLANIFIED', 'CONFIRMED']) */
  statuses?: CalendarEventStatus[];
  /** Priorités minimales (ex: 'HIGH' → inclut HIGH et URGENT) */
  priorities?: CalendarEventPriority[];
  /** Recherche textuelle (titre, description, candidat, moniteur) */
  search?: string;
  /** ID du candidat (filtrage) */
  candidatId?: number;
  /** ID du moniteur (filtrage) */
  moniteurId?: number;
  /** ID du véhicule (filtrage) */
  vehiculeId?: number;
  /** Date de début (inclusive) */
  startDate?: Date;
  /** Date de fin (inclusive) */
  endDate?: Date;
}

/**
 * État interne du calendrier (géré par le hook useCalendar).
 */
export interface CalendarState {
  /** Date courante (centre de la vue) */
  currentDate: Date;
  /** Vue active (semaine ou mois) */
  view: CalendarView;
  /** Filtres actifs */
  filters: CalendarFilters;
  /** Événement sélectionné (pour affichage dans le dialogue) */
  selectedEvent: CalendarEvent | null;
  /** Mode création d’un nouvel événement */
  isCreating: boolean;
  /** Mode glisser‑déposer actif (pour repositionner) */
  isDragging: boolean;
  /** Événement en cours de déplacement */
  draggingEvent?: CalendarEvent;
}

/**
 * Vue du calendrier : semaine ou mois.
 */
export type CalendarView = 'week' | 'month';

// ============================================================
// FORMULAIRE DE CRÉATION / MODIFICATION
// ============================================================

/**
 * Données du formulaire d’événement (utilisé pour la création ou la modification).
 */
export interface CalendarEventFormData {
  /** Titre */
  title: string;
  /** Type d’événement */
  type: CalendarEventType;
  /** Statut */
  status: CalendarEventStatus;
  /** Date et heure de début */
  startDate: Date;
  /** Date et heure de fin */
  endDate: Date;
  /** Toute la journée */
  allDay: boolean;
  /** Lieu */
  location?: string;
  /** Description */
  description?: string;
  /** Notes personnelles */
  notes?: string;
  /** Priorité */
  priority?: CalendarEventPriority;
  /** Urgent */
  isUrgent?: boolean;
  /** ID du candidat (si applicable) */
  candidatId?: number;
  /** ID du moniteur (si applicable) */
  moniteurId?: number;
  /** ID du véhicule (si applicable) */
  vehiculeId?: number;
  /** Montant (pour paiement/facture) */
  montant?: number;
}

// ============================================================
// ACTIONS DU CALENDRIER (CALLBACKS)
// ============================================================

/**
 * Callbacks d’actions sur les événements.
 */
export interface CalendarActions {
  /** Créer un nouvel événement */
  onCreate?: (data: CalendarEventFormData) => Promise<void> | void;
  /** Mettre à jour un événement existant (modification partielle) */
  onUpdate?: (id: number, data: Partial<CalendarEventFormData>) => Promise<void> | void;
  /** Supprimer un événement */
  onDelete?: (id: number) => Promise<void>;
  /** Confirmer un événement (ex: valider une leçon) */
  onConfirm?: (event: CalendarEvent) => Promise<void>;
  /** Annuler un événement */
  onCancel?: (event: CalendarEvent) => Promise<void>;
  /** Marquer comme effectué (leçon) / payé (paiement) */
  onComplete?: (event: CalendarEvent) => Promise<void>;
  /** Reprogrammer un événement (ouvrir le formulaire avec les dates pré‑remplies) */
  onReschedule?: (event: CalendarEvent) => void;
  /** Voir les détails complets (peut ouvrir une page dédiée) */
  onView?: (event: CalendarEvent) => void;
}

// ============================================================
// PROPS DES SOUS‑COMPOSANTS
// ============================================================

/**
 * Props pour le composant `CalendarHeader`.
 */
export interface CalendarHeaderProps {
  /** Date courante (centre de la vue) */
  currentDate: Date;
  /** Vue active (week ou month) */
  view: CalendarView;
  /** Callback pour changer la vue */
  onViewChange: (view: CalendarView) => void;
  /** Reculer la période (semaine ou mois précédent) */
  onPrev: () => void;
  /** Avancer la période (semaine ou mois suivant) */
  onNext: () => void;
  /** Revenir à la date d’aujourd’hui */
  onToday: () => void;
  /** Filtres actifs */
  filters: CalendarFilters;
  /** Mettre à jour les filtres */
  onFiltersChange: (filters: CalendarFilters) => void;
  /** Ouvrir le dialogue de création d’un événement */
  onNewEvent: () => void;
  /** Permet de créer un événement (affichage du bouton) */
  canCreate: boolean;
}

/**
 * Props pour le composant `CalendarWeekView` (vue semaine).
 */
export interface CalendarWeekViewProps {
  /** Date courante (la semaine autour de cette date) */
  currentDate: Date;
  /** Événements à afficher */
  events: CalendarEvent[];
  /** Callback au clic sur un événement */
  onEventClick: (event: CalendarEvent) => void;
  /** Callback au clic sur un créneau horaire (date + heure) */
  onSlotClick: (date: Date, hour: number) => void;
  /** Hauteur d’une heure en pixels (défaut : 60) */
  hourHeight?: number;
}

/**
 * Props pour le composant `CalendarMonthView` (vue mois).
 */
export interface CalendarMonthViewProps {
  /** Date courante (mois) */
  currentDate: Date;
  /** Événements à afficher (peut être pré‑filtré) */
  events: CalendarEvent[];
  /** Callback au clic sur un événement */
  onEventClick: (event: CalendarEvent) => void;
  /** Callback au clic sur un jour (ouvre la vue journée ou le dialogue) */
  onDayClick: (date: Date) => void;
  /** Nombre max d’événements visibles par jour (défaut : 3) */
  maxEventsPerDay?: number;
}

/**
 * Props pour le composant `CalendarSidebar` (à droite).
 */
export interface CalendarSidebarProps {
  /** Date sélectionnée */
  selectedDate: Date;
  /** Changer la date sélectionnée (met à jour le calendrier) */
  onDateSelect: (date: Date) => void;
  /** Événements du jour sélectionné (pour la liste) */
  events: CalendarEvent[];
  /** Callback au clic sur un événement (pour afficher le dialogue) */
  onEventClick: (event: CalendarEvent) => void;
  /** Permet de créer un événement à une date précise */
  onNewEvent: (date: Date) => void;
}

/**
 * Props pour le composant `CalendarEventDialog` (dialogue d’événement).
 */
export interface CalendarEventDialogProps {
  /** Dialogue ouvert */
  open: boolean;
  /** Changer l’état d’ouverture */
  onOpenChange: (open: boolean) => void;
  /** Mode : vue (lecture seule), création, modification */
  mode: 'view' | 'create' | 'edit';
  /** Événement à afficher ou modifier (optionnel) */
  event?: CalendarEvent;
  /** Date par défaut (pour le mode création) */
  defaultDate?: Date;
  /** Sauvegarde de l’événement (création ou modification) */
  onSave: (data: CalendarEventFormData) => void;
  /** Supprimer l’événement (mode édition uniquement) */
  onDelete?: (id: number) => void;
  /** Fermeture du dialogue */
  onClose: () => void;
  /** Permet de modifier (affichage des champs éditables) */
  canEdit: boolean;
  /** Permet de supprimer (affichage du bouton) */
  canDelete: boolean;
}

// ============================================================
// PROPS DU COMPOSANT PRINCIPAL (AppCalendar)
// ============================================================

/**
 * Props du composant `AppCalendar`.
 */
export interface AppCalendarProps {
  /** Événements à afficher (déjà convertis en CalendarEvent) */
  events?: CalendarEvent[];
  /** Actions disponibles (callbacks) */
  actions?: CalendarActions;
  /** Vue par défaut (semaine ou mois) */
  defaultView?: CalendarView;
  /** Date initiale (aujourd’hui si non fournie) */
  defaultDate?: Date;
  /** Classes CSS additionnelles */
  className?: string;
  /** État de chargement global (affiche un squelette) */
  isLoading?: boolean;
  /** Permet de créer des événements (affichage du bouton) */
  canCreate?: boolean;
  /** Permet de modifier des événements */
  canEdit?: boolean;
  /** Permet de supprimer des événements */
  canDelete?: boolean;
}

// ============================================================
// FONCTIONS DE CONVERSION (modèles métier → CalendarEvent)
// ============================================================

/**
 * Convertit une leçon (`Lecon`) en événement calendrier.
 *
 * @param lecon - La leçon à convertir
 * @returns Événement calendrier unifié
 *
 * @example
 * ```ts
 * const event = convertLeconToCalendarEvent(lecon);
 * ```
 */
export function convertLeconToCalendarEvent(lecon: Lecon): CalendarEvent {
  return {
    id: lecon.id,
    title: `Leçon de ${lecon.type === 'CODE' ? 'code' : 'conduite'} - ${lecon.candidat?.prenom ?? 'Candidat'} ${lecon.candidat?.nom ?? ''}`,
    description: lecon.notes ?? undefined,
    type: 'lesson',
    status: mapLeconStatusToCalendarStatus(lecon.statut),
    startDate: new Date(lecon.date),
    endDate: new Date(new Date(lecon.date).getTime() + lecon.duree * 60000),
    allDay: false,
    location: lecon.vehicule?.immatriculation
      ? `Véhicule ${lecon.vehicule.immatriculation}`
      : undefined,
    candidat: lecon.candidat
      ? {
          id: lecon.candidat.id,
          name: `${lecon.candidat.prenom} ${lecon.candidat.nom}`,
        }
      : undefined,
    moniteur: lecon.moniteur
      ? {
          id: lecon.moniteur.id,
          name: `${lecon.moniteur.prenom} ${lecon.moniteur.nom}`,
        }
      : undefined,
    vehicule: lecon.vehicule?.immatriculation,
    rawData: lecon,
    createdAt: new Date(lecon.createdAt),
    updatedAt: lecon.updatedAt ? new Date(lecon.updatedAt) : undefined,
  };
}

/**
 * Convertit un examen (`Examen`) en événement calendrier.
 *
 * @param examen - L’examen à convertir
 * @returns Événement calendrier unifié
 */
export function convertExamenToCalendarEvent(examen: Examen): CalendarEvent {
  return {
    id: examen.id,
    title: `Examen ${examen.type === 'CODE' ? 'code' : 'conduite'} - ${examen.candidat?.prenom ?? 'Candidat'} ${examen.candidat?.nom ?? ''}`,
    description: examen.notes ?? undefined,
    type: 'exam',
    status: mapResultatExamenToStatus(examen.resultat),
    startDate: new Date(examen.date),
    endDate: new Date(new Date(examen.date).getTime() + 2 * 60 * 60000), // 2h par défaut
    allDay: false,
    location: examen.centre ?? undefined,
    candidat: examen.candidat
      ? {
          id: examen.candidat.id,
          name: `${examen.candidat.prenom} ${examen.candidat.nom}`,
        }
      : undefined,
    rawData: examen,
    createdAt: new Date(examen.createdAt),
  };
}

/**
 * Convertit un paiement (`Paiement`) en événement calendrier (rappel).
 *
 * @param paiement - Le paiement à convertir
 * @returns Événement calendrier unifié
 */
export function convertPaiementToCalendarEvent(paiement: Paiement): CalendarEvent {
  return {
    id: paiement.id,
    title: `Paiement de ${paiement.montant.toLocaleString('fr-FR')} FCFA - ${paiement.candidat?.prenom ?? 'Candidat'} ${paiement.candidat?.nom ?? ''}`,
    description: paiement.note ?? undefined,
    type: 'payment',
    status: 'DONE',
    startDate: new Date(paiement.date),
    endDate: new Date(new Date(paiement.date).getTime() + 30 * 60000),
    allDay: false,
    montant: paiement.montant,
    candidat: paiement.candidat
      ? {
          id: paiement.candidat.id,
          name: `${paiement.candidat.prenom} ${paiement.candidat.nom}`,
        }
      : undefined,
    rawData: paiement,
    createdAt: new Date(paiement.createdAt),
  };
}

/**
 * Convertit une facture (`Facture`) en événement calendrier (rappel d’échéance).
 *
 * @param facture - La facture à convertir
 * @returns Événement calendrier unifié (statut = PLANIFIED si non payée)
 */
export function convertFactureToCalendarEvent(facture: Facture): CalendarEvent {
  const isPaid = facture.statut === 'PAYEE';
  return {
    id: facture.id,
    title: `Facture ${facture.numero} - ${facture.montantTotal.toLocaleString('fr-FR')} FCFA`,
    description: facture.notes ?? undefined,
    type: 'payment',
    status: isPaid ? 'DONE' : 'PLANIFIED',
    startDate: new Date(facture.dateEmission),
    endDate: facture.dateEcheance ? new Date(facture.dateEcheance) : new Date(facture.dateEmission),
    allDay: true,
    montant: facture.montantTotal,
    candidat: facture.candidat
      ? {
          id: facture.candidat.id,
          name: `${facture.candidat.prenom} ${facture.candidat.nom}`,
        }
      : undefined,
    rawData: facture,
    createdAt: new Date(facture.createdAt),
  };
}

/**
 * Convertit un entretien véhicule (`Vehicule` associé à un entretien) en événement.
 *
 * @param vehicule - Le véhicule (contient la liste des entretiens)
 * @param entretienId - ID de l’entretien à convertir (optionnel, prend le dernier si non fourni)
 * @returns Événement calendrier unifié
 */
export function convertEntretienToCalendarEvent(
  vehicule: Vehicule,
  entretienId?: number
): CalendarEvent | null {
  const entretien = entretienId
    ? vehicule.entretiens?.find((e) => e.id === entretienId)
    : vehicule.entretiens?.[vehicule.entretiens.length - 1];
  if (!entretien) return null;
  return {
    id: entretien.id,
    title: `Entretien ${entretien.type} - ${vehicule.immatriculation}`,
    description: entretien.description ?? undefined,
    type: 'maintenance',
    status: new Date(entretien.date) > new Date() ? 'PLANIFIED' : 'DONE',
    startDate: new Date(entretien.date),
    endDate: new Date(new Date(entretien.date).getTime() + 2 * 60 * 60000),
    allDay: false,
    location:
      vehicule.marque && vehicule.modele ? `${vehicule.marque} ${vehicule.modele}` : undefined,
    vehicule: vehicule.immatriculation,
    rawData: vehicule,
    createdAt: new Date(entretien.createdAt),
  };
}

// ============================================================
// FONCTIONS UTILITAIRES DE MAPPING
// ============================================================

/**
 * Convertit un statut de leçon Prisma (`StatutLecon`) en `CalendarEventStatus`.
 */
function mapLeconStatusToCalendarStatus(statut: string): CalendarEventStatus {
  const map: Record<string, CalendarEventStatus> = {
    PLANIFIEE: 'PLANIFIED',
    EFFECTUEE: 'DONE',
    ANNULEE: 'CANCELLED',
    ABSENCE: 'MISSED',
  };
  return map[statut] || 'PLANIFIED';
}

/**
 * Convertit un résultat d’examen (`ResultatExamen`) en `CalendarEventStatus`.
 */
function mapResultatExamenToStatus(resultat: string): CalendarEventStatus {
  const map: Record<string, CalendarEventStatus> = {
    EN_ATTENTE: 'PLANIFIED',
    RECU: 'DONE',
    ECHOUE: 'CANCELLED',
  };
  return map[resultat] || 'PLANIFIED';
}

// ============================================================
// CONSTANTES DE LOCALISATION
// ============================================================

/** Jours de la semaine (abréviation, commençant lundi) */
export const FRENCH_DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

/** Jours de la semaine (nom complet, commençant lundi) */
export const FRENCH_DAYS_LONG = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
  'Dimanche',
];

/** Mois de l’année (nominatif) */
export const FRENCH_MONTHS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

// ============================================================
// UTILITAIRES DE DATES (helpers)
// ============================================================

/** Heures de la journée (0 à 23) */
export const HOURS = Array.from({ length: 24 }, (_, i) => i);

/** Demi‑heures (0, 0.5, 1, …, 23.5) */
export const HALF_HOURS = Array.from({ length: 48 }, (_, i) => i * 0.5);

/**
 * Formate une heure (0–23.5) en chaîne HH:MM.
 *
 * @param hour - Heure (ex: 14.5)
 * @returns Chaîne formatée (ex: "14:30")
 *
 * @example
 * ```ts
 * formatHour(14.5) // "14:30"
 * ```
 */
export function formatHour(hour: number): string {
  const h = Math.floor(hour);
  const m = hour % 1 === 0.5 ? '30' : '00';
  return `${String(h).padStart(2, '0')}:${m}`;
}

/**
 * Calcule la position verticale (en pourcentage) d’un événement dans la grille horaire.
 *
 * @param startDate - Date de début
 * @returns Pourcentage de la hauteur totale (0–100)
 */
export function getEventTop(startDate: Date): number {
  const hour = startDate.getHours() + startDate.getMinutes() / 60;
  return (hour / 24) * 100;
}

/**
 * Calcule la hauteur (en pourcentage) d’un événement dans la grille horaire.
 *
 * @param startDate - Date de début
 * @param endDate - Date de fin
 * @returns Pourcentage de la hauteur totale (0–100)
 */
export function getEventHeight(startDate: Date, endDate: Date): number {
  const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
  return (durationHours / 24) * 100;
}

/**
 * Retourne les 7 jours de la semaine contenant la date donnée (du lundi au dimanche).
 *
 * @param date - Date référence
 * @returns Tableau des 7 dates
 */
export function getWeekDays(date: Date): Date[] {
  const start = new Date(date);
  const day = start.getDay();
  // Lundi = 1, Dimanche = 0 → on décale pour que le lundi soit le premier
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

/**
 * Retourne une grille de 42 jours (6 semaines × 7 jours) pour le mois contenant la date donnée.
 * Inclut les jours des mois précédent et suivant pour remplir la grille.
 *
 * @param date - Date référence
 * @returns Tableau de 42 dates
 */
export function getMonthDays(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Décalage pour commencer le lundi (0 = dimanche, 1 = lundi, …)
  const startPad = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const days: Date[] = [];
  for (let i = startPad; i > 0; i--) {
    const d = new Date(firstDay);
    d.setDate(firstDay.getDate() - i);
    days.push(d);
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(lastDay);
    d.setDate(lastDay.getDate() + i);
    days.push(d);
  }
  return days;
}

/**
 * Compare deux dates au jour près (ignore l’heure).
 *
 * @param a - Première date
 * @param b - Seconde date
 * @returns Vrai si elles représentent le même jour
 */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Vérifie si une date correspond à aujourd’hui.
 *
 * @param date - Date à tester
 * @returns Vrai si c’est aujourd’hui
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Retourne le numéro de la semaine (ISO 8601) pour une date donnée.
 *
 * @param date - Date
 * @returns Numéro de semaine (1–53)
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Filtre les événements pour un jour donné.
 *
 * @param events - Liste des événements
 * @param day - Jour cible
 * @returns Événements ayant lieu ce jour
 */
export function getEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events.filter((e) => isSameDay(e.startDate, day));
}

/**
 * Filtre les événements pour une heure précise d’un jour donné.
 *
 * @param events - Liste des événements
 * @param day - Jour cible
 * @param hour - Heure (0–23)
 * @returns Événements commençant à cette heure
 */
export function getEventsForHour(
  events: CalendarEvent[],
  day: Date,
  hour: number
): CalendarEvent[] {
  return events.filter((e) => {
    if (!isSameDay(e.startDate, day)) return false;
    return e.startDate.getHours() === hour;
  });
}

/**
 * Retourne une grille étendue de semaines pour permettre le défilement inter‑mois fluide.
 * Génère EXTRA_WEEKS semaines avant et après le mois central.
 *
 * @param date - Date référence (mois central)
 * @returns Tableau étendu de dates
 */
export function getExtendedMonthDays(date: Date): Date[] {
  const baseMonthDays = getMonthDays(date);
  const extendedDays: Date[] = [];

  // Ajouter les semaines précédentes
  const firstDay = baseMonthDays[0];
  for (let week = EXTRA_WEEKS; week > 0; week--) {
    for (let day = 6; day >= 0; day--) {
      const d = new Date(firstDay);
      d.setDate(firstDay.getDate() - week * 7 + day);
      extendedDays.push(d);
    }
  }

  // Ajouter le mois principal
  extendedDays.push(...baseMonthDays);

  // Ajouter les semaines suivantes
  const lastDay = baseMonthDays[baseMonthDays.length - 1];
  for (let week = 1; week <= EXTRA_WEEKS; week++) {
    for (let day = 0; day < 7; day++) {
      const d = new Date(lastDay);
      d.setDate(lastDay.getDate() + week * 7 + day - 6);
      extendedDays.push(d);
    }
  }

  return extendedDays;
}

/** Nombre de semaines supplémentaires pour le défilement (par défaut 4) */
const EXTRA_WEEKS = 4;
