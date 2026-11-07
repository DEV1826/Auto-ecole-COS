// src/features/factures/pages/FactureCreatePage.tsx

/**
 * @module features/factures/pages/FactureCreatePage
 * @description Émission d'une facture pour un candidat (`?candidatId=` pour pré-sélectionner).
 */

import * as React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { CalendarDays, FilePlus2, GraduationCap, Receipt } from 'lucide-react';

import FormWrapper from '@/components/forms/FormWrapper';
import { CompletionGauge, InfoRow, PageHeader, RequiredChecklist, errorMessage, isFilled } from '@/components/forms/FormPageKit';
import { ErrorDialog } from '@/components/ui/error-dialog';
import FactureForm, { type FactureContexte, type FactureFormData } from '../components/FactureForm';

import { useFactures } from '@/hooks/use.factures';
import { PROTECTED_ROUTES } from '@/config';

const fcfa = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} FCFA`;

function FacturePreview({ data, ctx }: { data: FactureFormData; ctx: FactureContexte | null }) {
  const required = [
    { label: 'Candidat', filled: isFilled(data.candidatId) },
    { label: 'Montant', filled: isFilled(data.montantTotal) },
    { label: "Date d'émission", filled: isFilled(data.dateEmission) },
  ];
  const apres = ctx && data.montantTotal ? ctx.dejaFacture + data.montantTotal : null;
  const depasse = ctx && apres !== null && ctx.montantFormation > 0 && apres > ctx.montantFormation;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border bg-emerald-50/60 p-4 dark:bg-emerald-950/20">
        <p className="text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Facture</p>
        <p className="font-mono text-sm text-muted-foreground">FAC-{new Date().getFullYear()}-•••••</p>
        <p className="mt-3 text-3xl font-bold tabular-nums">{data.montantTotal ? fcfa(data.montantTotal) : '— FCFA'}</p>
        <p className="text-xs text-muted-foreground">Statut initial : en attente de paiement</p>
      </div>

      <div className="space-y-0.5">
        <InfoRow
          accent="emerald"
          icon={GraduationCap}
          value={ctx?.candidat ? `${ctx.candidat.prenom} ${ctx.candidat.nom}` : null}
          placeholder="Candidat —"
        />
        <InfoRow accent="emerald" icon={Receipt} value={ctx?.formationNom} placeholder="Formation —" />
        <InfoRow
          accent="emerald"
          icon={CalendarDays}
          value={data.dateEmission ? `Émise le ${format(new Date(data.dateEmission), 'd MMMM yyyy', { locale: fr })}` : null}
          placeholder="Date d'émission —"
        />
        <InfoRow
          accent="emerald"
          icon={CalendarDays}
          value={data.dateEcheance ? `Échéance le ${format(new Date(data.dateEcheance), 'd MMMM yyyy', { locale: fr })}` : null}
          placeholder="Sans échéance"
        />
      </div>

      {depasse && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-[11px] text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          Avec cette facture, le total facturé ({fcfa(apres!)}) dépassera le coût de la formation ({fcfa(ctx!.montantFormation)}).
        </p>
      )}

      <CompletionGauge accent="emerald" filled={required.filter((r) => r.filled).length} total={required.length} />
      <RequiredChecklist items={required} />
    </div>
  );
}

export default function FactureCreatePage(): React.JSX.Element {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { create } = useFactures();

  const initialData = React.useMemo<FactureFormData>(() => {
    const id = Number(params.get('candidatId'));
    return {
      candidatId: Number.isInteger(id) && id > 0 ? id : undefined,
      dateEmission: new Date().toISOString(),
    };
  }, [params]);

  const [formData, setFormData] = React.useState<FactureFormData>(initialData);
  const [ctx, setCtx] = React.useState<FactureContexte | null>(null);
  const [isFormValid, setIsFormValid] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleChange = React.useCallback((data: FactureFormData, valid: boolean) => {
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
      const facture = await create(formData);
      toast.success('Facture émise', { description: `${facture.numero} · ${fcfa(facture.montantTotal)}` });
      navigate(PROTECTED_ROUTES.FACTURES.DETAIL(facture.id));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }, [isFormValid, formData, create, navigate]);

  return (
    <div className="space-y-5 p-4 md:p-1 pb-12">
      <PageHeader icon={FilePlus2} title="Nouvelle facture" badge="Émission" accent="emerald" />

      <FormWrapper
        title="Informations de facturation"
        description="Choisissez le candidat et le montant à facturer."
        icon={FilePlus2}
        onSubmit={handleSubmit}
        onCancel={() => navigate(-1)}
        isSubmitting={isSubmitting}
        isValid={isFormValid}
        submitLabel="Émettre la facture"
        cancelLabel="Annuler"
        previewTitle="Aperçu de la facture"
        preview={<FacturePreview data={formData} ctx={ctx} />}
      >
        <FactureForm data={initialData} onChange={handleChange} onContexteChange={setCtx} isSubmitting={isSubmitting} />
      </FormWrapper>

      <ErrorDialog
        open={error !== null}
        onOpenChange={(open) => !open && setError(null)}
        title="Émission impossible"
        message={error ?? ''}
        closeText="Fermer"
      />
    </div>
  );
}
