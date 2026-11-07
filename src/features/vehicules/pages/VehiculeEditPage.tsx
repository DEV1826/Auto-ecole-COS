// src/features/vehicules/pages/VehiculeEditPage.tsx

/**
 * @module features/vehicules/pages/VehiculeEditPage
 * @description Modification d'un véhicule existant (réservé aux administrateurs).
 */

import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Car } from 'lucide-react';

import FormWrapper from '@/components/forms/FormWrapper';
import { PageHeader, FormPageSkeleton, errorMessage } from '@/components/forms/FormPageKit';
import { ErrorDialog } from '@/components/ui/error-dialog';
import VehiculeForm from '../components/VehiculeForm';
import VehiculePreviewCard from '../components/VehiculePreviewCard';

import { useVehicules } from '@/hooks/use.vehicules';
import type { CreateVehiculeInput } from '@/lib/validators/vehicules.validator';
import type { Vehicule } from '@/types/vehicules.types';
import { PROTECTED_ROUTES } from '@/config';

type FormData = Partial<CreateVehiculeInput>;

const toIso = (v: Date | string | null | undefined) => (v ? new Date(v).toISOString() : undefined);

export default function VehiculeEditPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const vehiculeId = Number(id);
  const { getById, update } = useVehicules();

  const [original, setOriginal] = React.useState<Vehicule | null>(null);
  const [initialData, setInitialData] = React.useState<FormData | null>(null);
  const [formData, setFormData] = React.useState<FormData>({});
  const [isFormValid, setIsFormValid] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [fetchError, setLoadError] = React.useState<string | null>(null);
  const invalidId = !Number.isInteger(vehiculeId) || vehiculeId <= 0;
  const loadError = invalidId ? 'Identifiant de véhicule invalide.' : fetchError;
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (invalidId) return;
    let cancelled = false;
    getById(vehiculeId)
      .then((v) => {
        if (cancelled) return;
        const data: FormData = {
          immatriculation: v.immatriculation,
          marque: v.marque,
          modele: v.modele,
          annee: v.annee,
          categorie: v.categorie,
          kilometrage: v.kilometrage,
          statut: v.statut,
          dateAcquisition: toIso(v.dateAcquisition),
          dateDerniereRevision: toIso(v.dateDerniereRevision) ?? null,
          prochaineRevisionKm: v.prochaineRevisionKm ?? null,
        };
        setOriginal(v);
        setInitialData(data);
        setFormData(data);
      })
      .catch((err) => !cancelled && setLoadError(errorMessage(err, 'Impossible de charger le véhicule.')));
    return () => {
      cancelled = true;
    };
  }, [vehiculeId, invalidId, getById]);

  const handleChange = React.useCallback((patch: FormData, valid: boolean) => {
    setFormData((prev) => ({ ...prev, ...patch }));
    setIsFormValid(valid);
  }, []);

  const dirty = initialData !== null && JSON.stringify(initialData) !== JSON.stringify({ ...initialData, ...formData });

  const handleSubmit = React.useCallback(async () => {
    if (!isFormValid) {
      toast.error('Formulaire incomplet', { description: 'Veuillez corriger les champs signalés.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const updated = await update(vehiculeId, formData);
      toast.success('Véhicule mis à jour', {
        description: `${updated.marque} ${updated.modele} (${updated.immatriculation}) a été modifié.`,
      });
      navigate(PROTECTED_ROUTES.VEHICULES.DETAIL(vehiculeId));
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }, [isFormValid, vehiculeId, formData, update, navigate]);

  if (loadError) {
    return (
      <ErrorDialog
        open
        onOpenChange={() => navigate(PROTECTED_ROUTES.VEHICULES.LIST)}
        title="Erreur de chargement"
        message={loadError}
        closeText="Retour à la liste"
      />
    );
  }

  if (!initialData || !original) return <FormPageSkeleton />;

  return (
    <div className="space-y-5 p-4 md:p-1 pb-12">
      <PageHeader
        icon={Car}
        title={`Modifier ${original.marque} ${original.modele}`}
        badge={original.immatriculation}
        accent="sky"
      />

      <FormWrapper
        title="Informations du véhicule"
        description="Modifiez les caractéristiques, le statut ou le suivi des révisions."
        icon={Car}
        onSubmit={handleSubmit}
        onCancel={() => navigate(-1)}
        isSubmitting={isSubmitting}
        isValid={isFormValid}
        isEditMode
        submitLabel="Mettre à jour"
        cancelLabel="Annuler"
        previewTitle="Aperçu du véhicule"
        preview={<VehiculePreviewCard data={formData} dirty={dirty} />}
      >
        <VehiculeForm data={initialData} onChange={handleChange} isSubmitting={isSubmitting} vehiculeId={vehiculeId} />
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
