// src/features/depenses/pages/DepenseEditPage.tsx

/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * @module features/depenses/pages/DepenseEditPage
 * @description
 * Page d'édition d'une dépense existante.
 *
 * ## Structure
 * - **En‑tête** : icône, titre avec ID, breadcrumb, date
 * - **FormWrapper** : layout avec panneau de prévisualisation + formulaire
 * - **Dialogue d’erreur** : affiche les erreurs de validation (montant, catégorie, etc.)
 *
 * ## Flux de données
 * 1. Chargement de la dépense via `useDepenses.getById(id)` pendant le montage.
 * 2. Pré‑remplissage du formulaire avec les données récupérées.
 * 3. Soumission → mise à jour via `update(id, data)`.
 * 4. Redirection vers la liste des dépenses après succès.
 *
 * @author Stive Junior
 * @version 1.0.0
 */

import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import {
  TrendingDown,
  Users,
  Coins,
  Calendar,
  Hash,
  Building2,
  Car,
  CheckCircle2,
  Circle,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb';
import { cn } from '@/lib/utils';
import { ErrorDialog } from '@/components/ui/error-dialog';
import { Skeleton } from '@/components/ui/skeleton';

import FormWrapper from '@/components/forms/FormWrapper';
import DepenseCreateForm from '@/features/depenses/components/DepenseCreateForm';

import type { CreateDepenseInput } from '@/lib/validators/depenses.validator';
import { PROTECTED_ROUTES } from '@/config';
import { useDepenses } from '@/hooks/use.depenses';
import { CATEGORIE_DEPENSE_CONFIG } from '@/types/enums';

// ─────────────────────────────────────────────────────────────────────────────
// Types locaux
// ─────────────────────────────────────────────────────────────────────────────

type FormData = Partial<CreateDepenseInput>;

function formatMontant(n: number): string {
  return n.toLocaleString('fr-FR');
}

// ─────────────────────────────────────────────────────────────────────────────
// Jauge de complétion (identique à la page création)
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
        ? 'bg-blue-600'
        : pct >= 30
          ? 'bg-amber-500'
          : 'bg-gray-300 dark:bg-gray-600';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Complétion du formulaire</span>
        <span className={cn('font-semibold', pct === 100 ? 'text-green-600' : 'text-foreground')}>
          {pct}%
        </span>
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
          isEmpty ? 'text-muted-foreground/40' : 'text-blue-600 dark:text-blue-400'
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
// Carte de prévisualisation (identique à la page création)
// ─────────────────────────────────────────────────────────────────────────────

interface DepensePreviewCardProps {
  data: FormData;
}

function DepensePreviewCard({ data }: DepensePreviewCardProps) {
  const cfg = data.categorie ? CATEGORIE_DEPENSE_CONFIG[data.categorie] : null;
  const Icon = cfg?.icon || TrendingDown;

  const fieldsToCheck: Array<{ key: keyof FormData; label: string }> = [
    { key: 'categorie', label: 'Catégorie' },
    { key: 'montant', label: 'Montant' },
  ];

  const filledCount = fieldsToCheck.filter(({ key }) => {
    const v = data[key];
    return v !== undefined && v !== null && v !== '';
  }).length;

  return (
    <div className="space-y-5">
      {/* En-tête avec icône de catégorie */}
      <div className="flex flex-col items-center gap-3 pt-2 pb-4 border-b border-border/50">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/20 p-4 shadow-md">
          <Icon className="h-10 w-10 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          {data.categorie ? (
            <p className="text-base font-bold text-foreground leading-tight">{cfg?.label}</p>
          ) : (
            <p className="text-sm text-muted-foreground/60 italic">Catégorie non sélectionnée</p>
          )}
          <div className="flex items-center justify-center flex-wrap gap-1.5 mt-2">
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-0 dark:bg-blue-950/40 dark:text-blue-300">
              Dépense
            </Badge>
            {data.montant && (
              <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-700">
                {formatMontant(data.montant)} FCFA
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Informations détaillées */}
      <div className="space-y-0.5">
        <InfoRow icon={Hash} value={data.reference || 'Auto-générée'} placeholder="Référence —" />
        <InfoRow
          icon={Calendar}
          value={data.date ? format(new Date(data.date), 'd MMMM yyyy', { locale: fr }) : null}
          placeholder="Date —"
        />
        <InfoRow icon={Building2} value={data.fournisseur} placeholder="Fournisseur —" />
        {(data.categorie === 'CARBURANT' || data.categorie === 'ENTRETIEN_VEHICULE') && (
          <InfoRow
            icon={Car}
            value={data.vehiculeId ? `Véhicule #${data.vehiculeId}` : null}
            placeholder="Véhicule —"
          />
        )}
        <InfoRow
          icon={Coins}
          value={data.montant}
          placeholder="Montant —"
          formatter={(v) => `${v.toLocaleString('fr-FR')} FCFA`}
        />
        <InfoRow
          icon={Icon}
          value={
            data.description
              ? data.description.length > 60
                ? data.description.substring(0, 60) + '…'
                : data.description
              : null
          }
          placeholder="Description —"
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
// Page principale : DepenseEditPage
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Page d'édition d'une dépense existante.
 * Charge les données via `useDepenses.getById`, les injecte dans le formulaire,
 * puis soumet la mise à jour via `update`.
 * Affiche un dialogue d'erreur personnalisé en cas d'échec.
 */
export default function DepenseEditPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const depenseId = parseInt(id ?? '0', 10);

  const {
    getById,
    update,
    loading: depenseLoading,
    detailLoading,
    detailError,
  } = useDepenses();

  const [formData, setFormData] = React.useState<FormData>({});
  const [isFormValid, setIsFormValid] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [errorDialog, setErrorDialog] = React.useState<{
    open: boolean;
    title?: string;
    message: string;
    details?: string[];
  }>({ open: false, message: '' });

  // Chargement de la dépense au montage
  React.useEffect(() => {
    if (isNaN(depenseId)) {
      setLoadError('Identifiant de dépense invalide.');
      setIsLoading(false);
      return;
    }

    const loadDepense = async () => {
      setIsLoading(true);
      try {
        const depense = await getById(depenseId);
        // Pré‑remplir le formulaire avec les données existantes
        setFormData({
          categorie: depense.categorie,
          montant: depense.montant,
          description: depense.description ?? '',
          date: depense.date ? new Date(depense.date).toISOString() : new Date().toISOString(),
          fournisseur: depense.fournisseur ?? null,
          reference: depense.reference ?? `DEP-${Date.now()}`,
          vehiculeId: depense.vehiculeId ?? null,
        });
        setIsFormValid(true);
      } catch (err: any) {
        setLoadError(err?.message ?? 'Impossible de charger la dépense.');
      } finally {
        setIsLoading(false);
      }
    };

    loadDepense();
  }, [depenseId, getById]);

  const handleFormChange = React.useCallback(
    (patch: Partial<CreateDepenseInput>, isValid: boolean) => {
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
        montant: Number(formData.montant),
        vehiculeId: formData.vehiculeId ? Number(formData.vehiculeId) : null,
      } as CreateDepenseInput;
      await update(depenseId, payload);
      toast.success('Dépense mise à jour avec succès', {
        description: `${payload.montant.toLocaleString('fr-FR')} FCFA – ${CATEGORIE_DEPENSE_CONFIG[payload.categorie!]?.label
          }`,
      });
      navigate(PROTECTED_ROUTES.DEPENSES.LIST);
    } catch (err: any) {
      let message = 'Une erreur inattendue est survenue. Veuillez réessayer.';
      let details: string[] | undefined;
      if (err?.message) {
        message = err.message;
        if (message.includes('montant') || message.includes('catégorie')) {
          details = ['Vérifiez les informations saisies et réessayez.'];
        }
      }
      setErrorDialog({
        open: true,
        title: 'Erreur de mise à jour',
        message,
        details,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [isFormValid, formData, update, depenseId, navigate]);

  const handleCancel = React.useCallback(() => navigate(-1), [navigate]);

  // Affichage du chargement
  if (isLoading || depenseLoading || detailLoading) {
    return (
      <div className="space-y-5 p-4 md:p-1 pb-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-md" />
            <div>
              <Skeleton className="h-6 w-48 mb-1" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Skeleton className="h-150 w-full rounded-md" />
          </div>
          <div className="lg:col-span-2">
            <Skeleton className="h-200 w-full rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  // Affichage d’une erreur de chargement
  if (loadError || detailError) {
    return (
      <div className="space-y-5 p-4 md:p-1 pb-12">
        <ErrorDialog
          open={true}
          onOpenChange={() => navigate(-1)}
          title="Erreur de chargement"
          message={loadError ?? detailError ?? "Impossible de charger la dépense."}
          closeText="Retour"
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 md:p-1 pb-12">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-12 rounded-md bg-blue-700 text-white shadow-sm shrink-0">
            <TrendingDown className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">Modifier dépense</h1>
              <Badge
                variant="outline"
                className="text-[10px] h-5 px-2 border-0 bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-semibold"
              >
                ID {depenseId}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <Users className="h-3 w-3" />
              <span>{format(new Date(), "EEEE d MMMM yyyy 'à' HH'h'mm", { locale: fr })}</span>
            </p>
          </div>
        </div>
        <PageBreadcrumb className="hidden lg:flex" />
      </div>

      {/* Formulaire d’édition */}
      <FormWrapper
        title="Informations de la dépense"
        description="Modifiez la catégorie, le montant et les détails."
        icon={TrendingDown}

        isValid={isFormValid}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
        isEditMode={true}
        submitLabel="Mettre à jour"
        cancelLabel="Annuler"
        previewTitle="Aperçu de la dépense"
        preview={<DepensePreviewCard data={formData} />}
      >
        <DepenseCreateForm
          data={formData}
          onChange={handleFormChange}
          isSubmitting={isSubmitting}
        />
      </FormWrapper>

      {/* Dialogue d’erreur */}
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