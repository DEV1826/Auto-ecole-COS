// src/features/examens/pages/ExamenCreatePage.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * @module features/examens/pages/ExamenCreatePage
 * @description
 * Page de création d’un nouvel examen (code ou conduite).
 *
 * ## Structure
 * - **En-tête** : icône, titre, breadcrumb, date
 * - **FormWrapper** : layout avec panneau de prévisualisation + carte de formulaire
 *   - Panneau gauche : `ExamenPreviewCard` — récapitulatif, jauge de complétion,
 *     badge du type d’examen avec icône, candidat, date, centre, notes.
 *   - Panneau droit : `ExamenCreateForm` — formulaire avec validation Zod.
 *
 * @author Stive Junior
 * @version 1.0.0
 */

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  User,
  Calendar,
  MapPin,
  MessageSquare,
  BookOpen,
  Car,
  CheckCircle2,
  Circle,
  type LucideIcon,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb';
import { cn } from '@/lib/utils';
import FormWrapper from '@/components/forms/FormWrapper';
import ExamenCreateForm from '@/features/examens/components/ExamenCreateForm';
import type { CreateExamenInput } from '@/lib/validators/examens.validator';
import { PROTECTED_ROUTES } from '@/config';
import { useExamens } from '@/hooks/use.examens';
import { ErrorDialog } from '@/components/ui/error-dialog';

type FormData = Partial<CreateExamenInput>;

// ─────────────────────────────────────────────────────────────────────────────
// Jauge de complétion
// ─────────────────────────────────────────────────────────────────────────────
interface CompletionGaugeProps {
  filled: number;
  total: number;
}

function CompletionGauge({ filled, total }: CompletionGaugeProps) {
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
  const color =
    pct === 100
      ? 'bg-green-500'
      : pct >= 60
        ? 'bg-indigo-600'
        : pct >= 30
          ? 'bg-amber-500'
          : 'bg-gray-300 dark:bg-gray-600';
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Complétion du formulaire</span>
        <span className={cn('font-semibold', pct === 100 ? 'text-green-600' : 'text-foreground')}>{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full transition-colors', color)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground">
        {filled} champ{filled > 1 ? 's' : ''} renseigné{filled > 1 ? 's' : ''} sur {total}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Ligne d'info
// ─────────────────────────────────────────────────────────────────────────────
interface InfoRowProps {
  icon: LucideIcon;
  value?: string | number | null;
  placeholder: string;
  formatter?: (v: number) => string;
}

function InfoRow({ icon: Icon, value, placeholder, formatter }: InfoRowProps) {
  const isEmpty = value === undefined || value === null || value === '';
  const displayValue =
    !isEmpty && formatter && typeof value === 'number' ? formatter(value) : value?.toString();
  return (
    <div className="flex items-center gap-2.5 py-1.5 border-b border-dashed border-border/60 last:border-0">
      <Icon
        className={cn(
          'h-3.5 w-3.5 shrink-0',
          isEmpty ? 'text-muted-foreground/40' : 'text-indigo-600 dark:text-indigo-400'
        )}
      />
      <span
        className={cn(
          'text-xs truncate leading-relaxed',
          isEmpty ? 'text-muted-foreground/50 italic' : 'text-foreground'
        )}
      >
        {isEmpty ? placeholder : displayValue}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Checklist
// ─────────────────────────────────────────────────────────────────────────────
interface ChecklistItemProps {
  label: string;
  filled: boolean;
}

function ChecklistItem({ label, filled }: ChecklistItemProps) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {filled ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
      ) : (
        <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
      )}
      <span className={cn(filled ? 'text-foreground' : 'text-muted-foreground/60')}>{label}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Carte de prévisualisation
// ─────────────────────────────────────────────────────────────────────────────
interface ExamenPreviewCardProps {
  data: FormData;
}

function ExamenPreviewCard({ data }: ExamenPreviewCardProps) {
  const typeConfig =
    data.type === 'CODE' ? { label: 'Code', icon: BookOpen, color: 'blue' } :
      data.type === 'CONDUITE' ? { label: 'Conduite', icon: Car, color: 'purple' } :
        null;
  const IconType = typeConfig?.icon || GraduationCap;

  const fieldsToCheck: Array<{ key: keyof FormData; label: string }> = [
    { key: 'candidatId', label: 'Candidat' },
    { key: 'type', label: 'Type d’examen' },
    { key: 'date', label: 'Date' },
  ];

  const filledCount = fieldsToCheck.filter(({ key }) => {
    const v = data[key];
    return v !== undefined && v !== null && v !== '';
  }).length;

  return (
    <div className="space-y-5">
      {/* En-tête avec icône du type d’examen */}
      <div className="flex flex-col items-center gap-3 pt-2 pb-4 border-b border-border/50">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-linear-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/40 dark:to-indigo-900/20 p-4 shadow-md">
          <IconType className="h-12 w-12 text-indigo-600 dark:text-indigo-400" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          {data.type ? (
            <p className="text-base font-bold text-foreground leading-tight">
              {data.type === 'CODE' ? 'Examen du code' : 'Examen de conduite'}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground/60 italic">Type non sélectionné</p>
          )}
          <div className="flex items-center justify-center flex-wrap gap-1.5 mt-2">
            <Badge
              variant="outline"
              className="bg-indigo-100 text-indigo-700 border-0 dark:bg-indigo-950/40 dark:text-indigo-300"
            >
              {data.type === 'CODE' ? 'Théorique' : 'Pratique'}
            </Badge>
            {data.date && (
              <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-700">
                {format(new Date(data.date), 'dd/MM/yyyy HH:mm')}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Informations détaillées */}
      <div className="space-y-0.5">
        <InfoRow
          icon={User}
          value={data.candidatId ? `Candidat #${data.candidatId}` : null}
          placeholder="Candidat non sélectionné"
        />
        <InfoRow
          icon={Calendar}
          value={data.date ? format(new Date(data.date), 'd MMMM yyyy à HH:mm', { locale: fr }) : null}
          placeholder="Date —"
        />
        <InfoRow
          icon={MapPin}
          value={data.centre}
          placeholder="Centre —"
        />
        <InfoRow
          icon={MessageSquare}
          value={data.notes ? (data.notes.length > 40 ? data.notes.substring(0, 40) + '…' : data.notes) : null}
          placeholder="Note —"
        />
      </div>

      {/* Jauge de complétion */}
      <CompletionGauge filled={filledCount} total={fieldsToCheck.length} />

      {/* Checklist des champs obligatoires */}
      <div className="space-y-1 pt-1 border-t border-border/50">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">
          Champs obligatoires
        </p>
        {fieldsToCheck.map(({ key, label }) => (
          <ChecklistItem
            key={key}
            label={label}
            filled={Boolean(data[key] !== undefined && data[key] !== null && data[key] !== '')}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Page de création d’un examen.
 * Utilise le store `useExamens` et le composant `FormWrapper` avec une prévisualisation
 * interactive affichant la jauge de complétion et le type d’examen.
 */
export default function ExamenCreatePage(): React.JSX.Element {
  const navigate = useNavigate();
  const { create } = useExamens();

  const [formData, setFormData] = React.useState<FormData>({
    date: new Date().toISOString(),
  });
  const [isFormValid, setIsFormValid] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [errorDialog, setErrorDialog] = React.useState<{
    open: boolean;
    title?: string;
    message: string;
    details?: string[];
  }>({ open: false, message: '' });

  const handleFormChange = React.useCallback(
    (patch: Partial<CreateExamenInput>, isValid: boolean) => {
      setFormData((prev) => ({ ...prev, ...patch }));
      setIsFormValid(isValid);
    },
    []
  );

  const handleSubmit = React.useCallback(async () => {
    if (!isFormValid) {
      setErrorDialog({
        open: true,
        title: 'Formulaire incomplet',
        message: 'Veuillez renseigner tous les champs obligatoires avant de continuer.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        date: formData.date,
        candidatId: Number(formData.candidatId),
      } as CreateExamenInput;
      const newExamen = await create(payload);
      toast.success('Examen planifié avec succès', {
        description: `${newExamen.type === 'CODE' ? 'Code' : 'Conduite'} – ${format(new Date(newExamen.date), 'dd/MM/yyyy')}`,
      });
      navigate(PROTECTED_ROUTES.EXAMENS.DETAIL(newExamen.id));
    } catch (err: any) {
      let message = 'Une erreur inattendue est survenue. Veuillez réessayer.';
      let details: string[] | undefined;
      if (err?.message) {
        message = err.message;
        if (message.includes('candidatId')) {
          details = ['Le candidat sélectionné est introuvable.', 'Veuillez choisir un candidat valide.'];
        } else if (message.includes('date')) {
          details = ['La date de l’examen est invalide ou déjà passée.', 'Vérifiez la date et réessayez.'];
        }
      }
      setErrorDialog({
        open: true,
        title: 'Erreur de création',
        message,
        details,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [isFormValid, formData, create, navigate]);

  const handleCancel = React.useCallback(() => navigate(-1), [navigate]);

  return (
    <div className="space-y-5 p-4 md:p-1 pb-12">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-12 rounded-md bg-indigo-700 text-white shadow-sm shrink-0">
            <GraduationCap className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">Planifier un examen</h1>
              <Badge
                variant="outline"
                className="text-[10px] h-5 px-2 border-0 bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 font-semibold"
              >
                Nouvelle épreuve
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <User className="h-3 w-3" />
              <span>{format(new Date(), "EEEE d MMMM yyyy 'à' HH'h'mm", { locale: fr })}</span>
            </p>
          </div>
        </div>
        <PageBreadcrumb className="hidden lg:flex" />
      </div>

      {/* FormWrapper avec prévisualisation enrichie */}
      <FormWrapper
        title="Planifier un examen"
        description="Renseignez le candidat, le type d’épreuve, la date et le lieu."
        icon={GraduationCap}
        onSubmit={handleSubmit}
        onCancel={handleCancel}

        isValid={isFormValid}
        isSubmitting={isSubmitting}
        isEditMode={false}
        submitLabel="Planifier l’examen"
        cancelLabel="Annuler"
        previewTitle="Aperçu de l’examen"
        preview={<ExamenPreviewCard data={formData} />}
      >
        <ExamenCreateForm data={formData} onChange={handleFormChange} isSubmitting={isSubmitting} />
      </FormWrapper>

      <ErrorDialog
        open={errorDialog.open}
        onOpenChange={(open) => setErrorDialog((prev) => ({ ...prev, open }))}
        title={errorDialog.title}
        message={errorDialog.message}
        details={errorDialog.details}
        closeText="Fermer"
      />
    </div>
  );
}