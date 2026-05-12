// src/components/calendar/calendar-event-dialog.tsx

/**
 * @module components/calendar/calendar-event-dialog
 * @description
 * Dialogue unifié (Dialog sur desktop, Drawer sur mobile) pour la gestion des événements du calendrier COS.
 * - Mode `view` : affichage détaillé en lecture seule avec actions (confirmer, annuler, marquer comme effectué, modifier, supprimer)
 * - Mode `create` : formulaire de création d'un nouvel événement (leçon, examen, paiement, entretien, rappel)
 * - Mode `edit` : formulaire d'édition d'un événement existant
 *
 * Adapté aux types d'événements de l'auto‑école :
 * - `lesson` (leçon de code ou conduite)
 * - `exam` (examen)
 * - `payment` (rappel de paiement)
 * - `maintenance` (entretien véhicule)
 * - `reminder` (rappel personnel)
 *
 * Utilise les composants shadcn/ui, le DatePicker personnalisé, et s'adapte automatiquement à la taille d'écran.
 *
 * @author Stive Junior
 * @version 2.0.0 – adapté COS
 *
 * @example
 * ```tsx
 * <CalendarEventDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   mode="create"
 *   defaultDate={new Date()}
 *   onSave={handleCreate}
 *   canEdit
 *   canDelete
 * />
 * ```
 */

import * as React from 'react';
import {
  Clock,
  MapPin,
  FileText,
  User as UserIcon,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar as CalendarIcon,
  Car,
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { DatePicker } from '@/components/ui/date-picker';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  type CalendarEvent,
  type CalendarEventFormData,
  type CalendarEventType,
  type CalendarEventStatus,
  EVENT_TYPE_CONFIG,
  EVENT_STATUS_CONFIG,
} from './types';

// ============================================================
// Helpers de formatage
// ============================================================

/**
 * Formate une date complète (jour, mois, année, heure, minute) en français.
 */
function formatDateTime(date: Date): string {
  return date.toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formate uniquement l'heure (HH:MM).
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Convertit un événement `CalendarEvent` en données de formulaire `CalendarEventFormData`.
 * Utilisé pour pré-remplir le formulaire d'édition.
 */
function eventToFormData(event: CalendarEvent): CalendarEventFormData {
  return {
    title: event.title,
    type: event.type,
    status: event.status,
    startDate: new Date(event.startDate),
    endDate: new Date(event.endDate),
    allDay: event.allDay ?? false,
    location: event.location,
    description: event.description,
    notes: event.notes,
    priority: event.priority,
    isUrgent: event.isUrgent ?? false,
    candidatId: event.candidat?.id,
    moniteurId: event.moniteur?.id,
    vehiculeId: event.vehicule ? undefined : undefined, // à adapter si besoin
    montant: event.montant,
  };
}

// ============================================================
// Vue détaillée (lecture seule)
// ============================================================

interface EventDetailContentProps {
  event: CalendarEvent;
  canEdit?: boolean;
  canDelete?: boolean;
  onConfirm?: (event: CalendarEvent) => Promise<void>;
  onCancel?: (event: CalendarEvent) => Promise<void>;
  onComplete?: (event: CalendarEvent) => Promise<void>; // Marquer comme effectué
  onDelete?: (id: number) => Promise<void>;
  onEdit?: () => void;
  onClose: () => void;
}

/**
 * Affichage détaillé d'un événement (mode view).
 * Affiche toutes les informations avec des icônes, badges et actions contextuelles.
 */
function EventDetailContent({
  event,
  canEdit,
  canDelete,
  onConfirm,
  onCancel,
  onComplete,
  onDelete,
  onEdit,
  onClose,
}: EventDetailContentProps): React.JSX.Element {
  const config = EVENT_TYPE_CONFIG[event.type];
  const statusConfig = EVENT_STATUS_CONFIG[event.status];
  const [loading, setLoading] = React.useState<string | null>(null);
  const person = event.candidat ?? event.moniteur;

  const handleConfirm = async () => {
    setLoading('confirm');
    await onConfirm?.(event);
    setLoading(null);
    onClose();
  };

  const handleCancel = async () => {
    setLoading('cancel');
    await onCancel?.(event);
    setLoading(null);
    onClose();
  };

  const handleComplete = async () => {
    setLoading('complete');
    await onComplete?.(event);
    setLoading(null);
    onClose();
  };

  const handleDelete = async () => {
    setLoading('delete');
    await onDelete?.(event.id);
    setLoading(null);
    onClose();
  };

  // Icône principale selon type
  const TypeIcon = config.icon;

  return (
    <div className="space-y-4">
      {/* En‑tête coloré selon le type */}
      <div className={cn('rounded-xs p-3 border-l-4', config.bgColor, config.borderColor)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <TypeIcon className={cn('h-4 w-4', config.textColor)} />
              <h3 className={cn('font-semibold text-base', config.textColor)}>{event.title}</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{config.label}</p>
          </div>
          <div className="flex flex-wrap gap-1 shrink-0">
            <Badge
              variant="outline"
              className={cn('text-xs border-0', statusConfig.bgColor, statusConfig.textColor)}
            >
              {statusConfig.label}
            </Badge>
            {event.isUrgent && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Urgent
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Détails */}
      <div className="space-y-2.5 text-sm">
        {/* Date et heure */}
        <div className="flex items-start gap-3">
          <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-foreground capitalize">
              {event.allDay
                ? formatDateTime(event.startDate).split(' à')[0]
                : formatDateTime(event.startDate)}
            </p>
            {!event.allDay && (
              <p className="text-xs text-muted-foreground">Fin à {formatTime(event.endDate)}</p>
            )}
            {event.allDay && (
              <Badge variant="secondary" className="text-xs mt-0.5">
                Toute la journée
              </Badge>
            )}
          </div>
        </div>

        {/* Lieu */}
        {event.location && (
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">{event.location}</span>
          </div>
        )}

        {/* Montant (pour paiement) */}
        {event.montant !== undefined && (
          <div className="flex items-center gap-3">
            <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">
              {event.montant.toLocaleString('fr-FR')} FCFA
            </span>
          </div>
        )}

        {/* Véhicule (pour leçon ou entretien) */}
        {event.vehicule && (
          <div className="flex items-center gap-3">
            <Car className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Véhicule {event.vehicule}</span>
          </div>
        )}

        {/* Personne associée (candidat ou moniteur) */}
        {person && (
          <div className="flex items-center gap-3">
            <UserIcon className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={person.avatarUrl} alt={person.name} />
                <AvatarFallback className="text-[10px]">
                  {person.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-muted-foreground">{person.name}</span>
              {person.role && (
                <span className="text-xs text-muted-foreground/70">• {person.role}</span>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        {event.description && (
          <div className="flex items-start gap-3">
            <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-muted-foreground text-xs leading-relaxed">{event.description}</p>
          </div>
        )}

        {/* Notes personnelles */}
        {event.notes && (
          <>
            <Separator />
            <div>
              <p className="text-xs font-semibold mb-1">Notes</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{event.notes}</p>
            </div>
          </>
        )}
      </div>

      {/* Actions contextuelles */}
      <Separator />
      <div className="flex flex-wrap gap-2">
        {/* Confirmer (uniquement si planifié) */}
        {event.status === 'PLANIFIED' && onConfirm && (
          <Button
            variant="default"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={handleConfirm}
            disabled={loading === 'confirm'}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Confirmer
          </Button>
        )}
        {/* Annuler (planifié ou confirmé) */}
        {['PLANIFIED', 'CONFIRMED'].includes(event.status) && onCancel && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={handleCancel}
            disabled={loading === 'cancel'}
          >
            <XCircle className="h-3.5 w-3.5" />
            Annuler
          </Button>
        )}
        {/* Marquer comme effectué (confirmé) */}
        {event.status === 'CONFIRMED' && onComplete && (
          <Button
            variant="secondary"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={handleComplete}
            disabled={loading === 'complete'}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Marquer effectué
          </Button>
        )}
        {canEdit && onEdit && (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={onEdit}>
            <Edit className="h-3.5 w-3.5" />
            Modifier
          </Button>
        )}
        {canDelete && onDelete && (
          <Button
            variant="destructive"
            size="sm"
            className="gap-1.5 text-xs ml-auto"
            onClick={handleDelete}
            disabled={loading === 'delete'}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Supprimer
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Formulaire (création / édition)
// ============================================================

interface EventFormContentProps {
  initialData?: CalendarEventFormData;
  initialDate?: Date | null;
  isEdit?: boolean;
  onSubmit: (data: CalendarEventFormData) => Promise<void>;
  onClose: () => void;
}

/**
 * Formulaire de création ou d'édition d'un événement COS.
 * Champs : titre, type, statut, dates, allDay, lieu, description, notes, urgent.
 * Pour les leçons, on pourrait ajouter candidat/moniteur mais on les simplifie.
 */
function EventFormContent({
  initialData,
  initialDate,
  isEdit = false,
  onSubmit,
  onClose,
}: EventFormContentProps): React.JSX.Element {
  const now = initialDate ?? new Date();
  const defaultEnd = new Date(now);
  defaultEnd.setHours(defaultEnd.getHours() + 1);

  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState<CalendarEventFormData>(() => {
    if (initialData) return initialData;
    return {
      title: '',
      type: 'lesson',
      status: 'PLANIFIED',
      startDate: now,
      endDate: defaultEnd,
      allDay: false,
      location: '',
      description: '',
      notes: '',
      priority: 'MEDIUM',
      isUrgent: false,
    };
  });

  const updateField = <K extends keyof CalendarEventFormData>(
    key: K,
    value: CalendarEventFormData[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setLoading(true);
    await onSubmit(form);
    setLoading(false);
  };

  const handleStartDateChange = (date: Date | undefined) => {
    if (date) updateField('startDate', date);
  };

  const handleEndDateChange = (date: Date | undefined) => {
    if (date && date > form.startDate) updateField('endDate', date);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Titre */}
      <div className="space-y-1.5">
        <Label htmlFor="event-title" className="text-xs font-semibold">
          Titre *
        </Label>
        <Input
          id="event-title"
          placeholder="Nom de l'événement"
          value={form.title}
          onChange={(e) => updateField('title', e.target.value)}
          className="h-8 text-sm"
          required
        />
      </div>

      {/* Type et statut */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Type</Label>
          <Select
            value={form.type}
            onValueChange={(v) => updateField('type', v as CalendarEventType)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(
                Object.entries(EVENT_TYPE_CONFIG) as [
                  CalendarEventType,
                  (typeof EVENT_TYPE_CONFIG)[CalendarEventType],
                ][]
              ).map(([type, config]) => (
                <SelectItem key={type} value={type} className="text-xs">
                  <div className="flex items-center gap-2">
                    <span className={cn('h-2 w-2 rounded-full shrink-0', config.dotColor)} />
                    {config.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Statut</Label>
          <Select
            value={form.status}
            onValueChange={(v) => updateField('status', v as CalendarEventStatus)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(
                Object.entries(EVENT_STATUS_CONFIG) as [
                  CalendarEventStatus,
                  (typeof EVENT_STATUS_CONFIG)[CalendarEventStatus],
                ][]
              ).map(([status, config]) => (
                <SelectItem key={status} value={status} className="text-xs">
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Toute la journée */}
      <div className="flex items-center gap-2">
        <Switch
          id="event-all-day"
          checked={form.allDay}
          onCheckedChange={(v) => updateField('allDay', v)}
        />
        <Label htmlFor="event-all-day" className="text-xs">
          Toute la journée
        </Label>
      </div>

      {/* Dates avec DatePicker */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Début</Label>
          <DatePicker
            mode="single"
            date={form.startDate}
            onSelect={handleStartDateChange}
            withTime={!form.allDay}
            variant="default"
            showPresets={false}
            formatStr={form.allDay ? 'PPP' : 'PPP à HH:mm'}
            className="w-full"
          />
        </div>

        {!form.allDay && (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Fin</Label>
            <DatePicker
              mode="single"
              date={form.endDate}
              onSelect={handleEndDateChange}
              withTime
              variant="default"
              showPresets={false}
              formatStr="PPP à HH:mm"
              className="w-full"
            />
          </div>
        )}
      </div>

      {/* Lieu */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Lieu</Label>
        <Input
          placeholder="Adresse, salle, centre d'examen..."
          value={form.location ?? ''}
          onChange={(e) => updateField('location', e.target.value)}
          className="h-8 text-xs"
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Description</Label>
        <Textarea
          placeholder="Détails de l'événement..."
          value={form.description ?? ''}
          onChange={(e) => updateField('description', e.target.value)}
          className="text-xs min-h-15 resize-none"
        />
      </div>

      {/* Urgent */}
      <div className="flex items-center gap-2">
        <Switch
          id="event-urgent"
          checked={form.isUrgent ?? false}
          onCheckedChange={(v) => updateField('isUrgent', v)}
        />
        <Label htmlFor="event-urgent" className="text-xs">
          Marquer comme urgent
        </Label>
      </div>

      {/* Boutons */}
      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 text-xs"
          onClick={onClose}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          size="sm"
          className="flex-1 text-xs"
          disabled={loading || !form.title.trim()}
        >
          {loading
            ? isEdit
              ? 'Mise à jour...'
              : 'Création...'
            : isEdit
              ? 'Mettre à jour'
              : 'Créer'}
        </Button>
      </div>
    </form>
  );
}

// ============================================================
// Composant principal : CalendarEventDialog
// ============================================================

export interface CalendarEventDialogProps {
  /** Ouverture du dialogue */
  open: boolean;
  /** Callback de changement d'état (fermeture) */
  onOpenChange: (open: boolean) => void;
  /** Mode d'affichage : vue, création, édition */
  mode: 'view' | 'create' | 'edit';
  /** Événement à afficher ou éditer (requis pour view et edit) */
  event?: CalendarEvent;
  /** Date par défaut pour la création (optionnelle) */
  defaultDate?: Date;
  /** Callback de sauvegarde (création ou mise à jour) */
  onSave: (data: CalendarEventFormData) => Promise<void>;
  /** Callback de suppression (uniquement si mode=view) */
  onDelete?: (id: number) => Promise<void>;
  /** L'utilisateur a-t-il le droit de modifier ? */
  canEdit?: boolean;
  /** L'utilisateur a-t-il le droit de supprimer ? */
  canDelete?: boolean;
  /** Callback de confirmation (planifié → confirmé) */
  onConfirm?: (event: CalendarEvent) => Promise<void>;
  /** Callback d'annulation */
  onCancel?: (event: CalendarEvent) => Promise<void>;
  /** Callback pour marquer comme effectué (confirmé → done) */
  onComplete?: (event: CalendarEvent) => Promise<void>;
}

/**
 * Dialogue unifié pour la gestion des événements.
 * - `mode="view"` : affiche les détails avec actions.
 * - `mode="create"` : formulaire de création.
 * - `mode="edit"` : formulaire d'édition pré-rempli.
 *
 * Sur mobile, utilise un `Drawer` (bottom sheet) ; sur desktop, un `Dialog` modal.
 */
export function CalendarEventDialog({
  open,
  onOpenChange,
  mode,
  event,
  defaultDate,
  onSave,
  onDelete,
  canEdit = false,
  canDelete = false,
  onConfirm,
  onCancel,
  onComplete,
}: CalendarEventDialogProps): React.JSX.Element {
  const isMobile = useIsMobile();

  // États internes pour basculer entre vue et édition (mode view)
  const [internalMode, setInternalMode] = React.useState<'view' | 'edit' | 'create'>(
    mode === 'view' ? 'view' : mode
  );
  const [editModeActive, setEditModeActive] = React.useState(false);

  // Synchronisation du mode interne avec la prop `mode`
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (mode === 'create') setInternalMode('create');
    else if (mode === 'edit') setInternalMode('edit');
    else setInternalMode('view');
    setEditModeActive(false);
  }, [mode]);

  // Passage en mode édition depuis la vue
  const handleEdit = () => {
    setEditModeActive(true);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setEditModeActive(false);
      setInternalMode(mode === 'view' ? 'view' : mode);
    }, 300);
  };

  const handleSave = async (data: CalendarEventFormData) => {
    await onSave(data);
    handleClose();
  };

  // Si mode create ou edit, ou mode view avec édition active, on affiche le formulaire
  const showForm =
    internalMode === 'create' || internalMode === 'edit' || (mode === 'view' && editModeActive);
  const initialFormData =
    event && (internalMode === 'edit' || editModeActive) ? eventToFormData(event) : undefined;

  const content = showForm ? (
    <EventFormContent
      initialData={initialFormData}
      initialDate={defaultDate}
      isEdit={internalMode === 'edit' || editModeActive}
      onSubmit={handleSave}
      onClose={handleClose}
    />
  ) : event ? (
    <EventDetailContent
      event={event}
      canEdit={canEdit}
      canDelete={canDelete}
      onConfirm={onConfirm}
      onCancel={onCancel}
      onComplete={onComplete}
      onDelete={onDelete}
      onEdit={handleEdit}
      onClose={handleClose}
    />
  ) : null;

  if (!content) return <></>;

  // Rendu adaptatif : Drawer sur mobile, Dialog sur desktop
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {mode === 'create'
                ? 'Nouvel événement'
                : mode === 'edit' || editModeActive
                  ? 'Modifier l’événement'
                  : event?.title || 'Détails de l’événement'}
            </DrawerTitle>
            <DrawerDescription>
              {mode === 'create'
                ? 'Créez un événement dans votre calendrier'
                : mode === 'edit' || editModeActive
                  ? 'Modifiez les informations de l’événement'
                  : EVENT_TYPE_CONFIG[event?.type || 'lesson']?.label || 'Événement'}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-2 overflow-y-auto max-h-[70vh]">{content}</div>
          {!showForm && (
            <DrawerFooter>
              <Button variant="outline" onClick={handleClose} className="text-xs">
                Fermer
              </Button>
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-primary" />
            {mode === 'create'
              ? 'Nouvel événement'
              : mode === 'edit' || editModeActive
                ? 'Modifier l’événement'
                : 'Détails de l’événement'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Créez un événement dans votre calendrier'
              : mode === 'edit' || editModeActive
                ? 'Modifiez les informations de l’événement'
                : EVENT_TYPE_CONFIG[event?.type || 'lesson']?.label || 'Événement'}
          </DialogDescription>
        </DialogHeader>
        {content}
        {!showForm && (
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={handleClose} className="text-xs">
              Fermer
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
