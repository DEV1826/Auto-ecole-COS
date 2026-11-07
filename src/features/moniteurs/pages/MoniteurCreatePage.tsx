// src/features/moniteurs/pages/MoniteurCreatePage.tsx

/**
 * @module features/moniteurs/pages/MoniteurCreatePage
 * @description Ajout d'un moniteur.
 */

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { UserRoundPlus } from 'lucide-react';

import FormWrapper from '@/components/forms/FormWrapper';
import { PageHeader, errorMessage } from '@/components/forms/FormPageKit';
import { ErrorDialog } from '@/components/ui/error-dialog';
import MoniteurForm from '../components/MoniteurForm';
import MoniteurPreviewCard from '../components/MoniteurPreviewCard';

import { useMoniteurs } from '@/hooks/use.moniteurs';
import type { CreateMoniteurInput } from '@/lib/validators/moniteurs.validator';
import { PROTECTED_ROUTES } from '@/config';

type FormData = Partial<CreateMoniteurInput>;

export default function MoniteurCreatePage(): React.JSX.Element {
  const navigate = useNavigate();
  const { create } = useMoniteurs();

  const [formData, setFormData] = React.useState<FormData>({ actif: true });
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
      const moniteur = await create(formData);
      toast.success('Moniteur ajouté', { description: `${moniteur.prenom} ${moniteur.nom} a été ajouté.` });
      navigate(PROTECTED_ROUTES.MONITEURS.DETAIL(moniteur.id));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }, [isFormValid, formData, create, navigate]);

  return (
    <div className="space-y-5 p-4 md:p-1 pb-12">
      <PageHeader icon={UserRoundPlus} title="Nouveau moniteur" badge="Création" accent="teal" />

      <FormWrapper
        title="Informations du moniteur"
        description="Identité, coordonnées et activité du nouveau moniteur."
        icon={UserRoundPlus}
        onSubmit={handleSubmit}
        onCancel={() => navigate(-1)}
        isSubmitting={isSubmitting}
        isValid={isFormValid}
        submitLabel="Ajouter le moniteur"
        cancelLabel="Annuler"
        previewTitle="Aperçu de la fiche"
        preview={<MoniteurPreviewCard data={formData} />}
      >
        <MoniteurForm data={formData} onChange={handleChange} isSubmitting={isSubmitting} />
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
