// src/features/formations/pages/FormationCreatePage.tsx

/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * @module features/formations/pages/FormationCreatePage
 * @description
 * Page de création d’une nouvelle formation (offre pédagogique).
 *
 * ## Structure
 * - **En-tête** : icône, titre, breadcrumb, date
 * - **FormWrapper** : layout avec panneau de prévisualisation + carte de formulaire
 *   - Panneau gauche : `FormationPreviewCard` — illustration véhicule selon catégorie,
 *     badges, infos clés, jauge de complétion.
 *   - Panneau droit : `FormationCreateForm` — formulaire avec validation Zod.
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
  Users,
  Coins,
  Clock,
  Car,
  CheckCircle2,
  Circle,
  type LucideIcon,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb';
import { cn } from '@/lib/utils';

import FormWrapper from '@/components/forms/FormWrapper';
import FormationCreateForm from '@/features/formations/components/FormationCreateForm';

import type { CreateFormationInput } from '@/lib/validators/formations.validator';
import { PROTECTED_ROUTES } from '@/config';
import { useFormations } from '@/hooks/use.formations';
import { CATEGORIE_PERMIS_CONFIG } from '@/types/enums';

// ─────────────────────────────────────────────────────────────────────────────
// Types locaux
// ─────────────────────────────────────────────────────────────────────────────

type FormData = Partial<CreateFormationInput>;


// ─────────────────────────────────────────────────────────────────────────────
// Jauge de complétion
// ─────────────────────────────────────────────────────────────────────────────

interface CompletionGaugeProps {
  filled: number;
  total: number;
}

function CompletionGauge({ filled, total }: CompletionGaugeProps) {
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
  const color = pct === 100 ? 'bg-green-500' : pct >= 60 ? 'bg-indigo-600' : pct >= 30 ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600';
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Complétion du profil</span>
        <span className={cn('font-semibold', pct === 100 ? 'text-green-600' : 'text-foreground')}>{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <motion.div className={cn('h-full rounded-full transition-colors', color)} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
      </div>
      <p className="text-[10px] text-muted-foreground">{filled} champ{filled > 1 ? 's' : ''} renseigné{filled > 1 ? 's' : ''} sur {total}</p>
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
  const displayValue = !isEmpty && formatter && typeof value === 'number' ? formatter(value) : value?.toString();
  return (
    <div className="flex items-center gap-2.5 py-1.5 border-b border-dashed border-border/60 last:border-0">
      <Icon className={cn('h-3.5 w-3.5 shrink-0', isEmpty ? 'text-muted-foreground/40' : 'text-indigo-600 dark:text-indigo-400')} />
      <span className={cn('text-xs truncate leading-relaxed', isEmpty ? 'text-muted-foreground/50 italic' : 'text-foreground')}>
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
      {filled ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" /> : <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />}
      <span className={cn(filled ? 'text-foreground' : 'text-muted-foreground/60')}>{label}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Carte de prévisualisation avec illustration dynamique
// ─────────────────────────────────────────────────────────────────────────────

interface FormationPreviewCardProps {
  data: FormData;
}

function FormationPreviewCard({ data }: FormationPreviewCardProps) {
  const categorie = data.categorie;

  const fieldsToCheck: Array<{ key: keyof FormData; label: string }> = [
    { key: 'nom', label: 'Nom de la formation' },
    { key: 'prixTotal', label: 'Prix total' },
    { key: 'heuresCode', label: 'Heures de code' },
    { key: 'heuresConduite', label: 'Heures de conduite' },
    { key: 'categorie', label: 'Catégorie de permis' },
  ];

  const filledCount = fieldsToCheck.filter(({ key }) => {
    const v = data[key];
    return v !== undefined && v !== null && v !== '';
  }).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-3 pt-2 pb-4 border-b border-border/50">
        <div className="relative flex h-28 w-full items-center justify-center rounded-lg b p-4">

          <img src={`/images/permis/${categorie}.png`} alt={categorie} className='shrink-0 h-auto w-auto' />

        </div>
        <div className="text-center pt-3">
          {data.nom ? <p className="text-base font-bold text-foreground leading-tight">{data.nom}</p> : <p className="text-sm text-muted-foreground/60 italic">Nom non renseigné</p>}
          <div className="flex items-center justify-center flex-wrap gap-1.5 mt-2">
            {categorie ? (
              <Badge variant="outline" className={cn('text-[10px] font-bold px-2 py-0.5', CATEGORIE_PERMIS_CONFIG[categorie].bgColor ?? '')}>
                {CATEGORIE_PERMIS_CONFIG[categorie]?.label.split('—')[0] || `Cat. ${categorie}`}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] text-muted-foreground/50 border-dashed">Catégorie —</Badge>
            )}
            <Badge className="bg-emerald-100 text-emerald-700 border-0 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px]">Active</Badge>
          </div>
        </div>
      </div>

      <div className="space-y-0.5">
        <InfoRow icon={Coins} value={data.prixTotal} placeholder="Prix total —" formatter={(v) => `${v.toLocaleString('fr-FR')} FCFA`} />
        <InfoRow icon={Clock} value={data.heuresCode} placeholder="Heures de code —" formatter={(v) => `${v} h`} />
        <InfoRow icon={Car} value={data.heuresConduite} placeholder="Heures de conduite —" formatter={(v) => `${v} h`} />
        <InfoRow icon={Users} value={data.description ? `${data.description.substring(0, 40)}...` : null} placeholder="Description —" />
      </div>

      {categorie && (
        <p className="text-[11px] text-muted-foreground text-center bg-muted/40 rounded-lg px-3 py-2">
          {CATEGORIE_PERMIS_CONFIG[categorie].description} – Formation complète incluant {data.heuresCode || 'X'}h de code et {data.heuresConduite || 'Y'}h de conduite.
        </p>
      )}

      <CompletionGauge filled={filledCount} total={fieldsToCheck.length} />

      <div className="space-y-1 pt-1 border-t border-border/50">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">Champs requis</p>
        {fieldsToCheck.map(({ key, label }) => (
          <ChecklistItem key={key} label={label} filled={Boolean(data[key] !== undefined && data[key] !== null && data[key] !== '')} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────────────────────────────────────

export default function FormationCreatePage(): React.JSX.Element {
  const navigate = useNavigate();
  const { create } = useFormations();

  const [formData, setFormData] = React.useState<FormData>({ actif: true });
  const [isFormValid, setIsFormValid] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleFormChange = React.useCallback((patch: Partial<CreateFormationInput>, isValid: boolean) => {
    setFormData((prev) => ({ ...prev, ...patch }));
    setIsFormValid(isValid);
  }, []);

  const handleSubmit = React.useCallback(async () => {
    if (!isFormValid) {
      toast.error('Formulaire incomplet', { description: 'Veuillez renseigner tous les champs obligatoires.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const newFormation = await create(formData as CreateFormationInput);
      toast.success('Formation créée avec succès', { description: `${newFormation.nom} a été ajoutée.` });
      navigate(PROTECTED_ROUTES.FORMATIONS.LIST);
    } catch (err: any) {
      toast.error('Erreur lors de la création', { description: err?.message ?? 'Erreur inattendue.' });
    } finally {
      setIsSubmitting(false);
    }
  }, [isFormValid, formData, create, navigate]);

  const handleCancel = React.useCallback(() => navigate(-1), [navigate]);

  return (
    <div className="space-y-5 p-4 md:p-1 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-12 rounded-md bg-indigo-700 text-white shadow-sm shrink-0">
            <GraduationCap className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">Nouvelle formation</h1>
              <Badge variant="outline" className="text-[10px] h-5 px-2 border-0 bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 font-semibold">Création</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <Users className="h-3 w-3" />
              <span>{format(new Date(), "EEEE d MMMM yyyy 'à' HH'h'mm", { locale: fr })}</span>
            </p>
          </div>
        </div>
        <PageBreadcrumb className="hidden lg:flex" />
      </div>

      <FormWrapper
        title="Informations de la formation"
        description="Renseignez les détails de la nouvelle offre pédagogique."
        icon={GraduationCap}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}

        isValid={isFormValid}
        isEditMode={false}
        submitLabel="Créer la formation"
        cancelLabel="Annuler"
        previewTitle="Aperçu de la formation"
        preview={<FormationPreviewCard data={formData} />}
      >
        <FormationCreateForm data={formData} onChange={handleFormChange} isSubmitting={isSubmitting} />
      </FormWrapper>
    </div>
  );
}