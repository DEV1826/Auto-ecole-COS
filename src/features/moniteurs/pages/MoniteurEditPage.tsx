// src/features/moniteurs/pages/MoniteurEditPage.tsx

/**
 * @module features/moniteurs/pages/MoniteurEditPage
 * @description Modification d'un moniteur existant.
 */

import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { UserRoundPen } from 'lucide-react';

import FormWrapper from '@/components/forms/FormWrapper';
import { PageHeader, FormPageSkeleton, errorMessage } from '@/components/forms/FormPageKit';
import { ErrorDialog } from '@/components/ui/error-dialog';
import MoniteurForm from '../components/MoniteurForm';
import MoniteurPreviewCard from '../components/MoniteurPreviewCard';

import { useMoniteurs } from '@/hooks/use.moniteurs';
import type { CreateMoniteurInput } from '@/lib/validators/moniteurs.validator';
import type { Moniteur } from '@/types/moniteurs.types';
import { PROTECTED_ROUTES } from '@/config';

type FormData = Partial<CreateMoniteurInput>;

export default function MoniteurEditPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const moniteurId = Number(id);
  const { getById, update } = useMoniteurs();

  const [original, setOriginal] = React.useState<Moniteur | null>(null);
  const [initialData, setInitialData] = React.useState<FormData | null>(null);
  const [formData, setFormData] = React.useState<FormData>({});
  const [isFormValid, setIsFormValid] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [fetchError, setLoadError] = React.useState<string | null>(null);
  const invalidId = !Number.isInteger(moniteurId) || moniteurId <= 0;
  const loadError = invalidId ? 'Identifiant de moniteur invalide.' : fetchError;
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (invalidId) return;
    let cancelled = false;
    getById(moniteurId)
      .then((m) => {
        if (cancelled) return;
        const data: FormData = {
          nom: m.nom,
          prenom: m.prenom,
          email: m.email ?? null,
          telephone: m.telephone ?? undefined,
          specialite: m.specialite ?? null,
          dateEmbauche: m.dateEmbauche ? new Date(m.dateEmbauche).toISOString() : undefined,
          actif: m.actif,
          utilisateurId: m.utilisateurId ?? null,
        };
        setOriginal(m);
        setInitialData(data);
        setFormData(data);
      })
      .catch((err) => !cancelled && setLoadError(errorMessage(err, 'Impossible de charger le moniteur.')));
    return () => {
      cancelled = true;
    };
  }, [moniteurId, invalidId, getById]);

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
      const updated = await update(moniteurId, formData);
      toast.success('Moniteur mis à jour', { description: `${updated.prenom} ${updated.nom} a été modifié.` });
      navigate(PROTECTED_ROUTES.MONITEURS.DETAIL(moniteurId));
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }, [isFormValid, moniteurId, formData, update, navigate]);

  if (loadError) {
    return (
      <ErrorDialog
        open
        onOpenChange={() => navigate(PROTECTED_ROUTES.MONITEURS.LIST)}
        title="Erreur de chargement"
        message={loadError}
        closeText="Retour à la liste"
      />
    );
  }

  if (!initialData || !original) return <FormPageSkeleton />;

  return (
    <div className="space-y-5 p-4 md:p-1 pb-12">
      <PageHeader icon={UserRoundPen} title={`Modifier ${original.prenom} ${original.nom}`} badge={`ID ${moniteurId}`} accent="teal" />

      <FormWrapper
        title="Informations du moniteur"
        description="Modifiez l'identité, les coordonnées ou le statut du moniteur."
        icon={UserRoundPen}
        onSubmit={handleSubmit}
        onCancel={() => navigate(-1)}
        isSubmitting={isSubmitting}
        isValid={isFormValid}
        isEditMode
        submitLabel="Mettre à jour"
        cancelLabel="Annuler"
        previewTitle="Aperçu de la fiche"
        preview={<MoniteurPreviewCard data={formData} dirty={dirty} />}
      >
        <MoniteurForm data={initialData} onChange={handleChange} isSubmitting={isSubmitting} moniteurId={moniteurId} />
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
