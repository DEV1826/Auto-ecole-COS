// src/features/planning/pages/PlanningCreatePage.tsx

/**
 * @module features/planning/pages/PlanningCreatePage
 * @description
 * Planification d'une leçon. Paramètres d'URL optionnels pour pré-remplir :
 * `?candidatId=`, `?moniteurId=`, `?vehiculeId=`, `?date=` (ISO).
 */

import * as React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarPlus } from 'lucide-react';

import FormWrapper from '@/components/forms/FormWrapper';
import { PageHeader, errorMessage } from '@/components/forms/FormPageKit';
import { ErrorDialog } from '@/components/ui/error-dialog';
import LeconForm, { type LeconFormData } from '../components/LeconForm';
import LeconPreviewCard from '../components/LeconPreviewCard';
import { usePlanningReferences } from '../hooks/usePlanningReferences';

import { usePlanning } from '@/hooks/use.planning';
import { PROTECTED_ROUTES } from '@/config';

const positiveInt = (v: string | null) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : undefined;
};

/** Prochain créneau rond (heure suivante) si aucune date n'est fournie. */
function defaultDate(param: string | null): string {
  if (param && !Number.isNaN(new Date(param).getTime())) return new Date(param).toISOString();
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d.toISOString();
}

export default function PlanningCreatePage(): React.JSX.Element {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { create } = usePlanning();
  const refs = usePlanningReferences();

  const initialData = React.useMemo<LeconFormData>(
    () => ({
      date: defaultDate(params.get('date')),
      duree: 60,
      type: 'CONDUITE',
      candidatId: positiveInt(params.get('candidatId')),
      moniteurId: positiveInt(params.get('moniteurId')),
      vehiculeId: positiveInt(params.get('vehiculeId')) ?? null,
    }),
    [params]
  );

  const [formData, setFormData] = React.useState<LeconFormData>(initialData);
  const [isFormValid, setIsFormValid] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleChange = React.useCallback((data: LeconFormData, valid: boolean) => {
    setFormData(data);
    setIsFormValid(valid);
  }, []);

  const handleSubmit = React.useCallback(async () => {
    if (!isFormValid) {
      toast.error('Formulaire incomplet', { description: 'Veuillez renseigner tous les champs obligatoires.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const lecon = await create(formData);
      toast.success('Leçon planifiée', {
        description: format(new Date(lecon.date), "EEEE d MMMM 'à' HH'h'mm", { locale: fr }),
      });
      navigate(PROTECTED_ROUTES.PLANNING.DETAIL(lecon.id));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }, [isFormValid, formData, create, navigate]);

  return (
    <div className="space-y-5 p-4 md:p-1 pb-12">
      <PageHeader icon={CalendarPlus} title="Planifier une leçon" badge="Création" accent="violet" />

      <FormWrapper
        title="Détails de la leçon"
        description="Choisissez les participants, le créneau et le véhicule."
        icon={CalendarPlus}
        onSubmit={handleSubmit}
        onCancel={() => navigate(-1)}
        isSubmitting={isSubmitting}
        isValid={isFormValid}
        submitLabel="Planifier la leçon"
        cancelLabel="Annuler"
        previewTitle="Récapitulatif"
        preview={<LeconPreviewCard data={formData} candidats={refs.candidats} moniteurs={refs.moniteurs} vehicules={refs.vehicules} />}
      >
        <LeconForm
          data={initialData}
          onChange={handleChange}
          isSubmitting={isSubmitting}
          candidats={refs.candidats}
          moniteurs={refs.moniteurs}
          vehicules={refs.vehicules}
          referencesLoading={refs.loading}
        />
      </FormWrapper>

      <ErrorDialog
        open={error !== null || refs.error !== null}
        onOpenChange={(open) => !open && setError(null)}
        title={refs.error ? 'Chargement des listes impossible' : 'Planification impossible'}
        message={error ?? refs.error ?? ''}
        closeText="Fermer"
      />
    </div>
  );
}
