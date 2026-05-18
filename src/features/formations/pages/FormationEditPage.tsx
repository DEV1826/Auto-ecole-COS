/* eslint-disable react-hooks/set-state-in-effect */
// src/features/formations/pages/FormationEditPage.tsx

/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * @module features/formations/pages/FormationEditPage
 * @description
 * Page d'édition d'une formation existante pour l'auto-école COS.
 *
 * ## Structure
 * - **En-tête** : icône, titre avec ID de la formation, breadcrumb, date
 * - **FormWrapper** : layout avec panneau de prévisualisation + carte de formulaire
 * - **Dialogue d’erreur** : affiche les erreurs de validation (conflits, etc.)
 * - **Toast de succès** : notification après mise à jour réussie
 *
 * ## Flux de données
 * 1. Chargement de la formation via `useFormations.getById(id)` pendant le montage.
 * 2. Pré‑remplissage du formulaire avec les données récupérées.
 * 3. Soumission → mise à jour via `update(id, data)`.
 * 4. Affichage d’un toast de succès et redirection vers la liste.
 *
 * @author Stive Junior
 * @version 1.0.0
 */

import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { GraduationCap, BookOpen, Coins, Clock, Car } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb';
import { cn } from '@/lib/utils';
import { ErrorDialog } from '@/components/ui/error-dialog';

import FormWrapper from '@/components/forms/FormWrapper';
import FormationCreateForm from '../components/FormationCreateForm';

import { useFormations } from '@/hooks/use.formations';
import type { Formation } from '@/types/formations.types';
import type { CreateFormationInput } from '@/lib/validators/formations.validator';
import { PROTECTED_ROUTES, route } from '@/config';

// ─────────────────────────────────────────────────────────────────────────────
// Types locaux
// ─────────────────────────────────────────────────────────────────────────────

type FormData = Partial<CreateFormationInput>;

// ─────────────────────────────────────────────────────────────────────────────
// Style des catégories (pour l'aperçu)
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIE_BADGE_COLORS: Record<string, string> = {
  A: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300',
  B: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300',
  C: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300',
  D: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300',
  BE: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300',
};

const CATEGORIE_LABELS: Record<string, string> = {
  A: 'Catégorie A — Moto',
  B: 'Catégorie B — Voiture',
  C: 'Catégorie C — Poids lourd',
  D: 'Catégorie D — Transport',
  BE: 'Catégorie BE — Remorque',
};

// ─────────────────────────────────────────────────────────────────────────────
// Sous‑composant : aperçu de la formation
// ─────────────────────────────────────────────────────────────────────────────

interface FormationPreviewCardProps {
  data: FormData;
  original?: Formation;
}

function FormationPreviewCard({ data, original }: FormationPreviewCardProps) {
  const nom = data.nom || original?.nom || '—';
  const description = data.description || original?.description || '';
  const prixTotal = data.prixTotal ?? original?.prixTotal;
  const heuresCode = data.heuresCode ?? original?.heuresCode;
  const heuresConduite = data.heuresConduite ?? original?.heuresConduite;
  const categorie = data.categorie || original?.categorie;
  const actif = data.actif ?? original?.actif ?? true;

  const hasChanges = JSON.stringify(data) !== '{}';

  return (
    <div className="space-y-5">
      <div className="relative flex h-28 w-full items-center justify-center rounded-lg b p-4">

        <img src={`/images/permis/${categorie}.png`} alt={categorie} className='shrink-0 h-auto w-auto' />

      </div>{/* Titre et statut */}
      <div className="text-center">
        <h3 className="text-lg font-bold text-foreground">{nom}</h3>
        <div className="flex items-center justify-center gap-2 mt-1">
          {categorie && (
            <Badge variant="outline" className={cn('text-[10px] font-bold px-2 py-0.5', CATEGORIE_BADGE_COLORS[categorie])}>
              Cat. {categorie}
            </Badge>
          )}
          <Badge variant={actif ? 'default' : 'secondary'} className="text-[10px] px-2 py-0.5">
            {actif ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>

      {/* Détails */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Coins className="h-3.5 w-3.5" />
          <span>Prix : {prixTotal?.toLocaleString('fr-FR') || '—'} FCFA</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{heuresCode || 0} h de code · {heuresConduite || 0} h de conduite</span>
        </div>
        {categorie && (
          <div className="flex items-start gap-2 text-muted-foreground">
            <Car className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span className="text-xs">{CATEGORIE_LABELS[categorie]}</span>
          </div>
        )}
      </div>

      {/* Description */}
      {description && (
        <div className="rounded-md bg-muted/30 p-3 text-xs text-muted-foreground">
          <p className="line-clamp-3">{description}</p>
        </div>
      )}

      {/* Indicateur de modification */}
      {hasChanges && (
        <p className="text-[10px] text-amber-600 dark:text-amber-400 text-center border-t pt-2 mt-2">
          ⚡ Modifications non enregistrées
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page principale : FormationEditPage
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Page d'édition d'une formation existante.
 * Charge les données via `useFormations.getById`, les injecte dans le formulaire,
 * puis soumet la mise à jour via `update`.
 * Affiche un toast de succès et un dialogue d'erreur personnalisé.
 */
export default function FormationEditPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const formationId = parseInt(id ?? '0', 10);

  const { getById, update, loading: formationLoading, detailLoading, detailError } = useFormations();

  const [formData, setFormData] = React.useState<FormData>({});
  const [originalFormation, setOriginalFormation] = React.useState<Formation | null>(null);
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

  // Chargement de la formation au montage
  React.useEffect(() => {
    if (isNaN(formationId)) {
      setLoadError('Identifiant de formation invalide.');
      setIsLoading(false);
      return;
    }

    const loadFormation = async () => {
      setIsLoading(true);
      try {
        const formation = await getById(formationId);
        setOriginalFormation(formation);
        setFormData({
          nom: formation.nom,
          description: formation.description ?? '',
          prixTotal: formation.prixTotal,
          heuresCode: formation.heuresCode,
          heuresConduite: formation.heuresConduite,
          categorie: formation.categorie,
          actif: formation.actif,
        });
        setIsFormValid(true)
      } catch (err: any) {
        setLoadError(err?.message ?? 'Impossible de charger la formation.');
      } finally {
        setIsLoading(false);
      }
    };

    loadFormation();
  }, [formationId, getById]);

  const handleFormChange = React.useCallback(
    (patch: Partial<CreateFormationInput>, isValid: boolean) => {
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
      await update(formationId, formData);
      toast.success('Formation mise à jour', {
        description: `${formData.nom || originalFormation?.nom} a été modifiée avec succès.`,
      });
      navigate(route(PROTECTED_ROUTES.FORMATIONS.LIST));
    } catch (err: any) {
      let message = 'Une erreur inattendue est survenue. Veuillez réessayer.';
      let details: string[] | undefined;

      if (err?.message) {
        message = err.message;
        if (message.includes('nom existe déjà')) {
          details = ['Une formation avec ce nom existe déjà.', 'Veuillez choisir un nom différent.'];
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
  }, [isFormValid, formationId, formData, originalFormation, update, navigate]);

  const handleCancel = React.useCallback(() => navigate(-1), [navigate]);

  // Affichage du chargement
  if (isLoading || formationLoading || detailLoading) {
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
            <Skeleton className="h-100 w-full rounded-md" />
          </div>
          <div className="lg:col-span-2">
            <Skeleton className="h-150 w-full rounded-md" />
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
          message={loadError ?? detailError ?? "Impossible de charger la formation."}
          closeText="Retour"
        />
      </div>
    );
  }

  // Données pour l’aperçu (fusion des modifications)
  const previewData: FormData = { ...formData };

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
              <h1 className="text-2xl font-bold tracking-tight">
                Modifier formation
              </h1>
              <Badge
                variant="outline"
                className="text-[10px] h-5 px-2 border-0 bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 font-semibold"
              >
                ID {formationId}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <BookOpen className="h-3 w-3" />
              <span>{format(new Date(), "EEEE d MMMM yyyy 'à' HH'h'mm", { locale: fr })}</span>
            </p>
          </div>
        </div>
        <PageBreadcrumb className="hidden lg:flex" />
      </div>

      {/* Formulaire d’édition */}
      <FormWrapper
        title="Informations de la formation"
        description="Modifiez les détails de la formation (prix, heures, catégorie, statut)."
        icon={GraduationCap}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}

        isValid={isFormValid}
        isEditMode={true}
        submitLabel="Mettre à jour"
        cancelLabel="Annuler"
        previewTitle="Aperçu de la formation"
        preview={<FormationPreviewCard data={previewData} original={originalFormation ?? undefined} />}
      >
        <FormationCreateForm
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