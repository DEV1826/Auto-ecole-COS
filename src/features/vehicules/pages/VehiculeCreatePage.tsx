// src/features/vehicules/pages/VehiculeCreatePage.tsx

/**
 * @module features/vehicules/pages/VehiculeCreatePage
 * @description Ajout d'un véhicule au parc (réservé aux administrateurs).
 */

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Car } from 'lucide-react';

import FormWrapper from '@/components/forms/FormWrapper';
import { PageHeader, errorMessage } from '@/components/forms/FormPageKit';
import { ErrorDialog } from '@/components/ui/error-dialog';
import VehiculeForm from '../components/VehiculeForm';
import VehiculePreviewCard from '../components/VehiculePreviewCard';

import { useVehicules } from '@/hooks/use.vehicules';
import type { CreateVehiculeInput } from '@/lib/validators/vehicules.validator';
import { PROTECTED_ROUTES } from '@/config';

type FormData = Partial<CreateVehiculeInput>;

export default function VehiculeCreatePage(): React.JSX.Element {
  const navigate = useNavigate();
  const { create } = useVehicules();

  const [formData, setFormData] = React.useState<FormData>({});
  const [isFormValid, setIsFormValid] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleChange = React.useCallback((patch: FormData, valid: boolean) => {
    setFormData((prev) => ({ ...prev, ...patch }));
    setIsFormValid(valid);
  }, []);

  const handleSubmit = React.useCallback(async () => {
    if (!isFormValid) {
      toast.error('Formulaire incomplet', { description: 'Veuillez renseigner tous les champs obligatoires.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const vehicule = await create(formData);
      toast.success('Véhicule ajouté', {
        description: `${vehicule.marque} ${vehicule.modele} (${vehicule.immatriculation}) a été ajouté au parc.`,
      });
      navigate(PROTECTED_ROUTES.VEHICULES.DETAIL(vehicule.id));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }, [isFormValid, formData, create, navigate]);

  return (
    <div className="space-y-5 p-4 md:p-1 pb-12">
      <PageHeader icon={Car} title="Nouveau véhicule" badge="Création" accent="sky" />

      <FormWrapper
        title="Informations du véhicule"
        description="Renseignez les caractéristiques du véhicule à ajouter au parc."
        icon={Car}
        onSubmit={handleSubmit}
        onCancel={() => navigate(-1)}
        isSubmitting={isSubmitting}
        isValid={isFormValid}
        submitLabel="Ajouter le véhicule"
        cancelLabel="Annuler"
        previewTitle="Aperçu du véhicule"
        preview={<VehiculePreviewCard data={formData} />}
      >
        <VehiculeForm data={formData} onChange={handleChange} isSubmitting={isSubmitting} />
      </FormWrapper>

      <ErrorDialog
        open={error !== null}
        onOpenChange={(open) => !open && setError(null)}
        title="Ajout impossible"
        message={error ?? ''}
        closeText="Fermer"
      />
    </div>
  );
}
