// src/features/planning/pages/PlanningEditPage.tsx

/**
 * @module features/planning/pages/PlanningEditPage
 * @description Modification d'une leçon (créneau, participants, véhicule, statut, notes).
 */

import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { CalendarCog } from 'lucide-react';

import FormWrapper from '@/components/forms/FormWrapper';
import { PageHeader, FormPageSkeleton, errorMessage } from '@/components/forms/FormPageKit';
import { ErrorDialog } from '@/components/ui/error-dialog';
import LeconForm, { type LeconFormData } from '../components/LeconForm';
import LeconPreviewCard from '../components/LeconPreviewCard';
import { usePlanningReferences } from '../hooks/usePlanningReferences';

import { usePlanning } from '@/hooks/use.planning';
import { PROTECTED_ROUTES } from '@/config';

export default function PlanningEditPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const leconId = Number(id);
  const { getById, update } = usePlanning();
  const refs = usePlanningReferences();

  const [initialData, setInitialData] = React.useState<LeconFormData | null>(null);
  const [formData, setFormData] = React.useState<LeconFormData>({});
  const [isFormValid, setIsFormValid] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [fetchError, setLoadError] = React.useState<string | null>(null);
  const invalidId = !Number.isInteger(leconId) || leconId <= 0;
  const loadError = invalidId ? 'Identifiant de leçon invalide.' : fetchError;
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (invalidId) return;
    let cancelled = false;
    getById(leconId)
      .then((l) => {
        if (cancelled) return;
        const data: LeconFormData = {
          date: new Date(l.date).toISOString(),
          duree: l.duree,
          type: l.type,
          statut: l.statut,
          candidatId: l.candidatId,
          moniteurId: l.moniteurId,
          vehiculeId: l.vehiculeId ?? null,
          notes: l.notes ?? null,
        };
        setInitialData(data);
        setFormData(data);
      })
      .catch((err) => !cancelled && setLoadError(errorMessage(err, 'Impossible de charger la leçon.')));
    return () => {
      cancelled = true;
    };
  }, [leconId, invalidId, getById]);

  const handleChange = React.useCallback((data: LeconFormData, valid: boolean) => {
    setFormData(data);
    setIsFormValid(valid);
  }, []);

  const dirty = initialData !== null && JSON.stringify(initialData) !== JSON.stringify(formData);

  const handleSubmit = React.useCallback(async () => {
    if (!isFormValid) {
      toast.error('Formulaire incomplet', { description: 'Veuillez corriger les champs signalés.' });
      return;
    }
    setIsSubmitting(true);
    try {
      await update(leconId, formData);
      toast.success('Leçon mise à jour');
      navigate(PROTECTED_ROUTES.PLANNING.DETAIL(leconId));
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }, [isFormValid, leconId, formData, update, navigate]);

  if (loadError) {
    return (
      <ErrorDialog
        open
        onOpenChange={() => navigate(PROTECTED_ROUTES.PLANNING.CALENDAR)}
        title="Erreur de chargement"
        message={loadError}
        closeText="Retour au planning"
      />
    );
  }

  if (!initialData) return <FormPageSkeleton />;

  return (
    <div className="space-y-5 p-4 md:p-1 pb-12">
      <PageHeader icon={CalendarCog} title="Modifier la leçon" badge={`#${leconId}`} accent="violet" />

      <FormWrapper
        title="Détails de la leçon"
        description="Modifiez le créneau, les participants, le véhicule ou le statut."
        icon={CalendarCog}
        onSubmit={handleSubmit}
        onCancel={() => navigate(-1)}
        isSubmitting={isSubmitting}
        isValid={isFormValid}
        isEditMode
        submitLabel="Mettre à jour"
        cancelLabel="Annuler"
        previewTitle="Récapitulatif"
        preview={
          <LeconPreviewCard data={formData} candidats={refs.candidats} moniteurs={refs.moniteurs} vehicules={refs.vehicules} dirty={dirty} />
        }
      >
        <LeconForm
          data={initialData}
          onChange={handleChange}
          isSubmitting={isSubmitting}
          isEdit
          candidats={refs.candidats}
          moniteurs={refs.moniteurs}
          vehicules={refs.vehicules}
          referencesLoading={refs.loading}
        />
      </FormWrapper>

      <ErrorDialog
        open={submitError !== null}
        onOpenChange={(open) => !open && setSubmitError(null)}
        title="Mise à jour impossible"
        message={submitError ?? ''}
        closeText="Fermer"
      />
    </div>
  );
}
