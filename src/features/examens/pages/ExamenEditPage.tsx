// src/features/examens/pages/ExamenEditPage.tsx

/**
 * @module features/examens/pages/ExamenEditPage
 * @description Modification d'un examen (date, centre, résultat, note, remarques).
 */

import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { Award, CalendarDays, ClipboardPen, GraduationCap, MapPin } from 'lucide-react';

import FormWrapper from '@/components/forms/FormWrapper';
import { PageHeader, FormPageSkeleton, InfoRow, errorMessage } from '@/components/forms/FormPageKit';
import { Badge } from '@/components/ui/badge';
import { ErrorDialog } from '@/components/ui/error-dialog';
import ExamenEditForm, { type ExamenEditData } from '../components/ExamenEditForm';

import { useExamens } from '@/hooks/use.examens';
import { PROTECTED_ROUTES } from '@/config';
import { cn } from '@/lib/utils';
import { RESULTAT_EXAMEN_CONFIG, TYPE_EXAMEN_CONFIG } from '@/types/enums';
import type { Examen } from '@/types/examens.types';

function ExamenPreview({ examen, data, dirty }: { examen: Examen; data: ExamenEditData; dirty: boolean }) {
  const resultat = RESULTAT_EXAMEN_CONFIG[data.resultat ?? examen.resultat];
  const type = TYPE_EXAMEN_CONFIG[examen.type];
  const candidat = examen.candidat;
  return (
    <div className="space-y-5">
      <div className={cn('rounded-lg p-4 text-center', resultat.bgColor)}>
        <resultat.icon className={cn('mx-auto h-8 w-8', resultat.textColor)} />
        <p className={cn('mt-2 text-lg font-bold', resultat.textColor)}>{resultat.label}</p>
        {data.note != null && <p className="text-sm text-muted-foreground">{data.note} / 20</p>}
        <Badge variant="outline" className={cn('mt-2 border-0 text-[10px]', type.bgColor, type.textColor)}>
          Examen {type.label.toLowerCase()}
        </Badge>
      </div>
      <div className="space-y-0.5">
        <InfoRow icon={GraduationCap} value={candidat ? `${candidat.prenom} ${candidat.nom}` : `Candidat #${examen.candidatId}`} placeholder="Candidat —" />
        <InfoRow
          icon={CalendarDays}
          value={data.date ? format(new Date(data.date), 'EEEE d MMMM yyyy', { locale: fr }) : null}
          placeholder="Date —"
        />
        <InfoRow icon={MapPin} value={data.centre} placeholder="Centre —" />
        <InfoRow icon={Award} value={data.notes} placeholder="Aucune remarque" />
      </div>
      {dirty && (
        <p className="text-[10px] text-amber-600 dark:text-amber-400 text-center border-t pt-2">
          ⚡ Modifications non enregistrées
        </p>
      )}
    </div>
  );
}

export default function ExamenEditPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const examenId = Number(id);
  const invalidId = !Number.isInteger(examenId) || examenId <= 0;
  const { getById, update } = useExamens();

  const [examen, setExamen] = React.useState<Examen | null>(null);
  const [initialData, setInitialData] = React.useState<ExamenEditData | null>(null);
  const [formData, setFormData] = React.useState<ExamenEditData>({});
  const [isFormValid, setIsFormValid] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const loadError = invalidId ? "Identifiant d'examen invalide." : fetchError;

  React.useEffect(() => {
    if (invalidId) return;
    let cancelled = false;
    getById(examenId)
      .then((e) => {
        if (cancelled) return;
        const data: ExamenEditData = {
          date: new Date(e.date).toISOString(),
          centre: e.centre ?? null,
          notes: e.notes ?? null,
          resultat: e.resultat,
          note: e.note ?? null,
        };
        setExamen(e);
        setInitialData(data);
        setFormData(data);
      })
      .catch((err) => !cancelled && setFetchError(errorMessage(err, "Impossible de charger l'examen.")));
    return () => {
      cancelled = true;
    };
  }, [examenId, invalidId, getById]);

  const handleChange = React.useCallback((data: ExamenEditData, valid: boolean) => {
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
      await update(examenId, formData);
      toast.success('Examen mis à jour');
      navigate(PROTECTED_ROUTES.EXAMENS.DETAIL(examenId));
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }, [isFormValid, examenId, formData, update, navigate]);

  if (loadError) {
    return (
      <ErrorDialog
        open
        onOpenChange={() => navigate(PROTECTED_ROUTES.EXAMENS.LIST)}
        title="Erreur de chargement"
        message={loadError}
        closeText="Retour aux examens"
      />
    );
  }

  if (!initialData || !examen) return <FormPageSkeleton />;

  const titre = examen.candidat ? `${examen.candidat.prenom} ${examen.candidat.nom}` : `Examen #${examenId}`;

  return (
    <div className="space-y-5 p-4 md:p-1 pb-12">
      <PageHeader
        icon={ClipboardPen}
        title={`Modifier l'examen · ${titre}`}
        badge={TYPE_EXAMEN_CONFIG[examen.type].label}
      />

      <FormWrapper
        title="Informations de l'examen"
        description="Mettez à jour la convocation ou saisissez le résultat."
        icon={ClipboardPen}
        onSubmit={handleSubmit}
        onCancel={() => navigate(-1)}
        isSubmitting={isSubmitting}
        isValid={isFormValid}
        isEditMode
        submitLabel="Mettre à jour"
        cancelLabel="Annuler"
        previewTitle="Aperçu"
        preview={<ExamenPreview examen={examen} data={formData} dirty={dirty} />}
      >
        <ExamenEditForm data={initialData} onChange={handleChange} isSubmitting={isSubmitting} />
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
