// src/features/factures/pages/FactureEditPage.tsx

/**
 * @module features/factures/pages/FactureEditPage
 * @description
 * Mise à jour d'une facture : statut, échéance et notes. Le montant et le
 * candidat restent figés après émission (cf. `updateFactureSchema`).
 * Le statut cohérent avec les paiements reçus est suggéré.
 */

import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { CalendarDays, FilePen, GraduationCap, Lightbulb, StickyNote, Wallet } from 'lucide-react';

import FormWrapper from '@/components/forms/FormWrapper';
import { FormPageSkeleton, InfoRow, PageHeader, SectionHeader, errorMessage } from '@/components/forms/FormPageKit';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { DatePicker } from '@/components/ui/date-picker';
import { ErrorDialog } from '@/components/ui/error-dialog';

import { useFactures } from '@/hooks/use.factures';
import { PROTECTED_ROUTES } from '@/config';
import { cn } from '@/lib/utils';
import { STATUT_FACTURE_VALUES } from '@/lib/validators/factures.validator';
import { STATUT_FACTURE_CONFIG } from '@/types/enums';
import type { StatutFacture } from '@/types/enums';
import type { Facture } from '@/types/factures.types';
import type { Paiement } from '@/types/paiements.types';

type FactureDetail = Facture & { paiements?: Paiement[] };

interface EditData {
  statut: StatutFacture;
  dateEcheance: string | null;
  notes: string | null;
}

const fcfa = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} FCFA`;
const fmt = (d: Date | string) => format(new Date(d), 'd MMMM yyyy', { locale: fr });

function statutAttendu(montant: number, paye: number): StatutFacture {
  if (paye <= 0) return 'EN_ATTENTE';
  return paye >= montant ? 'PAYEE' : 'PARTIELLEMENT_PAYEE';
}

export default function FactureEditPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const factureId = Number(id);
  const invalidId = !Number.isInteger(factureId) || factureId <= 0;
  const { getById, update } = useFactures();

  const [facture, setFacture] = React.useState<FactureDetail | null>(null);
  const [initial, setInitial] = React.useState<EditData | null>(null);
  const [data, setData] = React.useState<EditData | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const loadError = invalidId ? 'Identifiant de facture invalide.' : fetchError;

  React.useEffect(() => {
    if (invalidId) return;
    let cancelled = false;
    getById(factureId)
      .then((f) => {
        if (cancelled) return;
        const d: EditData = {
          statut: f.statut,
          dateEcheance: f.dateEcheance ? new Date(f.dateEcheance).toISOString() : null,
          notes: f.notes ?? null,
        };
        setFacture(f);
        setInitial(d);
        setData(d);
      })
      .catch((err) => !cancelled && setFetchError(errorMessage(err, 'Impossible de charger la facture.')));
    return () => {
      cancelled = true;
    };
  }, [factureId, invalidId, getById]);

  const notesTooLong = (data?.notes?.length ?? 0) > 500;
  const echeanceInvalide =
    facture && data?.dateEcheance ? new Date(data.dateEcheance) < new Date(new Date(facture.dateEmission).toDateString()) : false;
  const isValid = Boolean(data) && !notesTooLong && !echeanceInvalide;
  const dirty = JSON.stringify(initial) !== JSON.stringify(data);

  const handleSubmit = async () => {
    if (!data || !isValid) {
      toast.error('Formulaire invalide', { description: 'Veuillez corriger les champs signalés.' });
      return;
    }
    setIsSubmitting(true);
    try {
      await update(factureId, data);
      toast.success('Facture mise à jour', { description: facture?.numero });
      navigate(PROTECTED_ROUTES.FACTURES.DETAIL(factureId));
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadError) {
    return (
      <ErrorDialog open onOpenChange={() => navigate(PROTECTED_ROUTES.FACTURES.LIST)} title="Erreur de chargement" message={loadError} closeText="Retour aux factures" />
    );
  }
  if (!facture || !data) return <FormPageSkeleton />;

  const paiements = facture.paiements ?? [];
  const paye = paiements.reduce((s, p) => s + p.montant, 0);
  const pct = facture.montantTotal > 0 ? Math.min(100, Math.round((paye / facture.montantTotal) * 100)) : 0;
  const suggere = statutAttendu(facture.montantTotal, paye);
  const statutCfg = STATUT_FACTURE_CONFIG[data.statut];

  const preview = (
    <div className="space-y-5">
      <div className={cn('rounded-lg p-4', statutCfg.bgColor)}>
        <p className="font-mono text-xs text-muted-foreground">{facture.numero}</p>
        <p className="mt-1 text-3xl font-bold tabular-nums">{fcfa(facture.montantTotal)}</p>
        <p className={cn('mt-1 flex items-center gap-1.5 text-sm font-medium', statutCfg.textColor)}>
          <statutCfg.icon className="h-4 w-4" />
          {statutCfg.label}
        </p>
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Encaissé</span>
          <span className="font-semibold tabular-nums">
            {fcfa(paye)} ({pct} %)
          </span>
        </div>
        <Progress value={pct} className="h-2" />
        <p className="text-[11px] text-muted-foreground">Reste dû : {fcfa(Math.max(0, facture.montantTotal - paye))}</p>
      </div>
      <div className="space-y-0.5">
        <InfoRow
          accent="emerald"
          icon={GraduationCap}
          value={facture.candidat ? `${facture.candidat.prenom} ${facture.candidat.nom}` : `Candidat #${facture.candidatId}`}
          placeholder="Candidat —"
        />
        <InfoRow accent="emerald" icon={CalendarDays} value={`Émise le ${fmt(facture.dateEmission)}`} placeholder="" />
        <InfoRow accent="emerald" icon={CalendarDays} value={data.dateEcheance ? `Échéance le ${fmt(data.dateEcheance)}` : null} placeholder="Sans échéance" />
        <InfoRow accent="emerald" icon={Wallet} value={`${paiements.length} paiement${paiements.length > 1 ? 's' : ''} rattaché${paiements.length > 1 ? 's' : ''}`} placeholder="" />
      </div>
      {dirty && <p className="text-[10px] text-amber-600 dark:text-amber-400 text-center border-t pt-2">⚡ Modifications non enregistrées</p>}
    </div>
  );

  return (
    <div className="space-y-5 p-4 md:p-1 pb-12">
      <PageHeader icon={FilePen} title="Modifier la facture" badge={facture.numero} accent="emerald" />

      <FormWrapper
        title="Suivi de la facture"
        description="Le montant et le candidat ne sont plus modifiables après émission."
        icon={FilePen}
        onSubmit={handleSubmit}
        onCancel={() => navigate(-1)}
        isSubmitting={isSubmitting}
        isValid={isValid}
        isEditMode
        submitLabel="Mettre à jour"
        cancelLabel="Annuler"
        previewTitle="Aperçu"
        preview={preview}
      >
        <div className="space-y-8">
          <section className="space-y-4">
            <SectionHeader icon={Wallet} title="Statut" description="État de règlement de la facture." accent="emerald" />
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Statut de la facture">
              {STATUT_FACTURE_VALUES.map((s) => {
                const cfg = STATUT_FACTURE_CONFIG[s];
                const active = data.statut === s;
                return (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={isSubmitting}
                    onClick={() => setData({ ...data, statut: s })}
                    className={cn(
                      'flex items-center gap-2 rounded-md border p-3 text-left text-sm transition-colors',
                      active ? cn('ring-2 ring-emerald-500 ring-offset-1', cfg.bgColor) : 'hover:bg-muted/50'
                    )}
                  >
                    <cfg.icon className={cn('h-4 w-4', active ? cfg.textColor : 'text-muted-foreground')} />
                    <span className={cn('font-medium', active && cfg.textColor)}>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
            {data.statut !== suggere && data.statut !== 'ANNULEE' && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed p-3 text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                  D'après les paiements reçus ({fcfa(paye)}), le statut attendu est « {STATUT_FACTURE_CONFIG[suggere].label} ».
                </span>
                <Button type="button" size="sm" variant="outline" onClick={() => setData({ ...data, statut: suggere })}>
                  Appliquer
                </Button>
              </div>
            )}
          </section>

          <Separator className="my-2" />

          <section className="space-y-4">
            <SectionHeader icon={CalendarDays} title="Échéance" accent="emerald" />
            <Field data-invalid={echeanceInvalide} className="max-w-sm">
              <FieldLabel>Date d'échéance</FieldLabel>
              <DatePicker
                date={data.dateEcheance ? new Date(data.dateEcheance) : undefined}
                onSelect={(d) => setData({ ...data, dateEcheance: d ? d.toISOString() : null })}
                disabled={isSubmitting}
                formatStr="dd/MM/yyyy"
                placeholder="Aucune"
                className="w-full h-12"
              />
              <FieldDescription className={cn(echeanceInvalide && 'text-destructive')}>
                {echeanceInvalide ? "L'échéance doit être postérieure à la date d'émission." : 'Laisser vide pour une facture sans échéance.'}
              </FieldDescription>
            </Field>
          </section>

          <Separator className="my-2" />

          <section className="space-y-4">
            <SectionHeader icon={StickyNote} title="Notes" accent="emerald" />
            <Field data-invalid={notesTooLong}>
              <Textarea
                value={data.notes ?? ''}
                onChange={(e) => setData({ ...data, notes: e.target.value || null })}
                rows={4}
                className="resize-none text-sm"
                disabled={isSubmitting}
              />
              <FieldDescription className={cn(notesTooLong && 'text-destructive')}>{(data.notes ?? '').length} / 500 caractères</FieldDescription>
            </Field>
          </section>
        </div>
      </FormWrapper>

      <ErrorDialog open={submitError !== null} onOpenChange={(open) => !open && setSubmitError(null)} title="Mise à jour impossible" message={submitError ?? ''} closeText="Fermer" />
    </div>
  );
}
