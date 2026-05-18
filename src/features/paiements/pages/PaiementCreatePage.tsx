// src/features/paiements/pages/PaiementCreatePage.tsx

/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * @module features/paiements/pages/PaiementCreatePage
 * @description
 * Page de création d’un nouveau paiement (encaissement) pour un candidat.
 *
 * ## Structure
 * - **En-tête** : icône, titre, breadcrumb, date
 * - **FormWrapper** : layout avec panneau de prévisualisation + carte de formulaire
 *   - Panneau gauche : `PaiementPreviewCard` — récapitulatif, jauge de complétion,
 *     badge mode de paiement avec image, montant, etc.
 *   - Panneau droit : `PaiementCreateForm` — formulaire avec validation Zod.
 *
 * ## Améliorations
 * - Désactivation du bouton "Enregistrer" tant que le formulaire n’est pas valide.
 * - Gestion des erreurs avec `ErrorDialog`.
 * - Dialogue de succès après création avec redirection optionnelle.
 *
 * @author Stive Junior
 * @version 4.0.0
 */

import * as React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Receipt,
  Users,
  Coins,
  Calendar,
  Hash,
  MessageSquare,
  Banknote,
  FileText,
  CreditCard,
  TrendingUp,
  Smartphone,
  CheckCircle2,
  Circle,
  type LucideIcon,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb';
import { cn } from '@/lib/utils';

import FormWrapper from '@/components/forms/FormWrapper';
import PaiementCreateForm from '@/features/paiements/components/PaiementCreateForm';

import type { CreatePaiementInput } from '@/lib/validators/paiements.validator';
import { PROTECTED_ROUTES, route } from '@/config';
import { usePaiements } from '@/hooks/use.paiements';
import { MODE_PAIEMENT_CONFIG, type ModePaiement } from '@/types/enums';
import { ErrorDialog } from '@/components/ui/error-dialog';
import { SuccessDialog } from '@/components/ui/success-dialog';

// ─────────────────────────────────────────────────────────────────────────────
// Types locaux
// ─────────────────────────────────────────────────────────────────────────────

type FormData = Partial<CreatePaiementInput>;

// ─────────────────────────────────────────────────────────────────────────────
// Constantes pour les modes de paiement (images et icônes)
// ─────────────────────────────────────────────────────────────────────────────

const MODE_IMAGES: Record<string, string> = {
  ESPECES: '/payments/especes.png',
  CHEQUE: '/payments/cheque.png',
  VIREMENT: '/payments/virement.png',
  CARTE: '/payments/carte.png',
  MOBILE_MONEY: '/payments/mobile_money.png',
};

const MODE_ICONS: Record<string, LucideIcon> = {
  ESPECES: Banknote,
  CHEQUE: FileText,
  VIREMENT: TrendingUp,
  CARTE: CreditCard,
  MOBILE_MONEY: Smartphone,
};

function formatMontant(n: number): string {
  return n.toLocaleString('fr-FR');
}

// ─────────────────────────────────────────────────────────────────────────────
// Jauge de complétion
// ─────────────────────────────────────────────────────────────────────────────

interface CompletionGaugeProps {
  filled: number;
  total: number;
}

function CompletionGauge({ filled, total }: CompletionGaugeProps) {
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
  const color =
    pct === 100
      ? 'bg-green-500'
      : pct >= 60
        ? 'bg-emerald-600'
        : pct >= 30
          ? 'bg-amber-500'
          : 'bg-gray-300 dark:bg-gray-600';
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Complétion du formulaire</span>
        <span className={cn('font-semibold', pct === 100 ? 'text-green-600' : 'text-foreground')}>
          {pct}%
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full transition-colors', color)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground">
        {filled} champ{filled > 1 ? 's' : ''} renseigné{filled > 1 ? 's' : ''} sur {total}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Ligne d'info
// ─────────────────────────────────────────────────────────────────────────────

interface InfoRowProps {
  icon: LucideIcon;
  value?: string | number | null;
  placeholder: string;
  formatter?: (v: number) => string;
}

function InfoRow({ icon: Icon, value, placeholder, formatter }: InfoRowProps) {
  const isEmpty = value === undefined || value === null || value === '';
  const displayValue =
    !isEmpty && formatter && typeof value === 'number' ? formatter(value) : value?.toString();
  return (
    <div className="flex items-center gap-2.5 py-1.5 border-b border-dashed border-border/60 last:border-0">
      <Icon
        className={cn(
          'h-3.5 w-3.5 shrink-0',
          isEmpty ? 'text-muted-foreground/40' : 'text-emerald-600 dark:text-emerald-400'
        )}
      />
      <span
        className={cn(
          'text-xs truncate leading-relaxed',
          isEmpty ? 'text-muted-foreground/50 italic' : 'text-foreground'
        )}
      >
        {isEmpty ? placeholder : displayValue}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Checklist
// ─────────────────────────────────────────────────────────────────────────────

interface ChecklistItemProps {
  label: string;
  filled: boolean;
}

function ChecklistItem({ label, filled }: ChecklistItemProps) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {filled ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
      ) : (
        <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
      )}
      <span className={cn(filled ? 'text-foreground' : 'text-muted-foreground/60')}>{label}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Carte de prévisualisation avec image du mode de paiement
// ─────────────────────────────────────────────────────────────────────────────

interface PaiementPreviewCardProps {
  data: FormData;
}

function PaiementPreviewCard({ data }: PaiementPreviewCardProps) {
  const modeCfg = data.mode ? MODE_PAIEMENT_CONFIG[data.mode] : null;
  const ModeIcon = modeCfg ? modeCfg.icon : Receipt;
  const modeImage = modeCfg ? modeCfg.image : '';

  const fieldsToCheck: Array<{ key: keyof FormData; label: string }> = [
    { key: 'candidatId', label: 'Candidat' },
    { key: 'montant', label: 'Montant' },
    { key: 'mode', label: 'Mode de paiement' },
  ];

  const filledCount = fieldsToCheck.filter(({ key }) => {
    const v = data[key];
    return v !== undefined && v !== null && v !== '';
  }).length;

  return (
    <div className="space-y-5">
      {/* En-tête avec icône / image du mode de paiement */}
      <div className="flex flex-col items-center gap-3 pt-2 pb-4 border-b border-border/50">
        {data.mode ? (
          <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-linear-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/40 dark:to-emerald-900/20 p-4 shadow-md">
            {modeImage ? (
              <img
                src={modeImage}
                alt={modeCfg?.label}
                className="h-16 w-16 object-contain"
              />
            ) : (
              <ModeIcon className="h-12 w-12 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
            )}
          </div>
        ) : (
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-muted/30">
            <Receipt className="h-12 w-12 text-muted-foreground/40" />
          </div>
        )}
        <div className="text-center">
          {data.mode ? (
            <p className="text-base font-bold text-foreground leading-tight">{modeCfg?.label}</p>
          ) : (
            <p className="text-sm text-muted-foreground/60 italic">Mode non sélectionné</p>
          )}
          <div className="flex items-center justify-center flex-wrap gap-1.5 mt-2">
            <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-0 dark:bg-emerald-950/40 dark:text-emerald-300">
              Encaissement
            </Badge>
            {data.montant && (
              <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-700">
                {formatMontant(data.montant)} FCFA
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Informations détaillées */}
      <div className="space-y-0.5">
        <InfoRow
          icon={Users}
          value={data.candidatId ? `Candidat #${data.candidatId}` : null}
          placeholder="Candidat non sélectionné"
        />
        <InfoRow
          icon={Coins}
          value={data.montant}
          placeholder="Montant —"
          formatter={(v) => `${v.toLocaleString('fr-FR')} FCFA`}
        />
        <InfoRow
          icon={Calendar}
          value={data.date ? format(new Date(data.date), 'd MMMM yyyy', { locale: fr }) : null}
          placeholder="Date —"
        />
        <InfoRow
          icon={Hash}
          value={data.reference || 'Auto-générée'}
          placeholder="Référence —"
        />
        <InfoRow
          icon={MessageSquare}
          value={data.note ? (data.note.length > 40 ? data.note.substring(0, 40) + '…' : data.note) : null}
          placeholder="Note —"
        />
      </div>

      {/* Jauge de complétion */}
      <CompletionGauge filled={filledCount} total={fieldsToCheck.length} />

      {/* Checklist des champs obligatoires */}
      <div className="space-y-1 pt-1 border-t border-border/50">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">
          Champs obligatoires
        </p>
        {fieldsToCheck.map(({ key, label }) => (
          <ChecklistItem
            key={key}
            label={label}
            filled={Boolean(data[key] !== undefined && data[key] !== null && data[key] !== '')}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Page de création d’un paiement.
 * Utilise le store `usePaiements` et le composant `FormWrapper` avec une prévisualisation
 * interactive affichant la jauge de complétion et le mode de paiement avec image.
 * Le bouton de soumission est désactivé tant que le formulaire n’est pas valide.
 * Affiche un dialogue de succès après création réussie.
 */
export default function PaiementCreatePage(): React.JSX.Element {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const candidatIdFromUrl = searchParams.get('candidatId');
  const initialCandidatId = candidatIdFromUrl ? Number(candidatIdFromUrl) : undefined;

  const { create } = usePaiements();

  const [formData, setFormData] = React.useState<FormData>({
    date: new Date().toISOString(),
    candidatId: initialCandidatId,
  });
  const [isFormValid, setIsFormValid] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorDialog, setErrorDialog] = React.useState<{
    open: boolean;
    title?: string;
    message: string;
    details?: string[];
  }>({ open: false, message: '' });

  // État pour le dialogue de succès
  const [successDialogOpen, setSuccessDialogOpen] = React.useState(false);
  const [createdPaiementId, setCreatedPaiementId] = React.useState<number | null>(null);
  const [createdPaiementMontant, setCreatedPaiementMontant] = React.useState<number>(0);
  const [createdPaiementMode, setCreatedPaiementMode] = React.useState<ModePaiement>('ESPECES');

  const handleFormChange = React.useCallback(
    (patch: Partial<CreatePaiementInput>, isValid: boolean) => {
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
      const payload = { ...formData, montant: Number(formData.montant) } as CreatePaiementInput;
      const newPaiement = await create(payload);
      setCreatedPaiementId(newPaiement.id);
      setCreatedPaiementMontant(newPaiement.montant);
      setCreatedPaiementMode(newPaiement.mode);
      setSuccessDialogOpen(true);
      // Ne pas rediriger immédiatement – laisser l'utilisateur choisir
    } catch (err: any) {
      let message = 'Une erreur inattendue est survenue. Veuillez réessayer.';
      let details: string[] | undefined;
      if (err?.message) {
        message = err.message;
        if (message.includes('candidatId')) {
          details = ['Le candidat sélectionné est introuvable ou inactif.'];
        } else if (message.includes('montant')) {
          details = ['Le montant doit être supérieur à zéro.'];
        } else if (message.includes('solde')) {
          details = ['Ce paiement dépasse le solde dû. Vérifiez le montant.'];
        } else if (message.includes('email existe déjà')) {
          details = ['Un candidat avec cette adresse email est déjà enregistré.', 'Veuillez utiliser un autre email ou modifier l’existant.'];
        } else if (message.includes('numéro de permis déjà attribué')) {
          details = ['Ce numéro de permis est déjà utilisé par un autre candidat.', 'Vérifiez le numéro ou contactez l’administrateur.'];
          // eslint-disable-next-line no-dupe-else-if
        } else if (message.includes('montant') || message.includes('candidatId')) {
          details = ['Vérifiez les informations saisies et réessayez.'];
        }
      }
      setErrorDialog({
        open: true,
        title: 'Erreur de création',
        message,
        details,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [isFormValid, formData, create]);

  const handleCancel = React.useCallback(() => navigate(-1), [navigate]);

  // Actions du dialogue de succès
  const handleGoToPaymentDetail = () => {
    if (createdPaiementId) {
      navigate(route(PROTECTED_ROUTES.PAIEMENTS.DETAIL(createdPaiementId), { id: createdPaiementId }));
    } else {
      navigate(PROTECTED_ROUTES.PAIEMENTS.LIST);
    }
  };


  return (
    <div className="space-y-5 p-4 md:p-1 pb-12">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-12 rounded-md bg-emerald-700 text-white shadow-sm shrink-0">
            <Receipt className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">Nouveau paiement</h1>
              <Badge
                variant="outline"
                className="text-[10px] h-5 px-2 border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold"
              >
                Encaissement
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <Users className="h-3 w-3" />
              <span>{format(new Date(), "EEEE d MMMM yyyy 'à' HH'h'mm", { locale: fr })}</span>
            </p>
          </div>
        </div>
        <PageBreadcrumb className="hidden lg:flex" />
      </div>

      {/* FormWrapper avec prévisualisation enrichie */}
      <FormWrapper
        title="Enregistrer un paiement"
        description="Renseignez le montant, le mode de paiement et le candidat concerné."
        icon={Receipt}
        iconColor="bg-emerald-700"
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
        isValid={isFormValid}
        isEditMode={false}
        submitLabel="Enregistrer le paiement"
        cancelLabel="Annuler"
        previewTitle="Aperçu du paiement"
        preview={<PaiementPreviewCard data={formData} />}
      >
        <PaiementCreateForm data={formData} onChange={handleFormChange} isSubmitting={isSubmitting} />
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

      {/* Dialogue de succès après création du paiement */}
      <SuccessDialog
        open={successDialogOpen}
        onOpenChange={setSuccessDialogOpen}
        title="Paiement enregistré avec succès"
        message={`${formatMontant(createdPaiementMontant)} FCFA – ${MODE_PAIEMENT_CONFIG[createdPaiementMode]?.label || createdPaiementMode}`}
        details={[
          `Référence : ${createdPaiementId ? `#${createdPaiementId}` : 'Générée automatiquement'}`,
          `Date : ${format(new Date(), 'dd/MM/yyyy à HH:mm')}`,
          `Mode : ${MODE_PAIEMENT_CONFIG[createdPaiementMode]?.label || createdPaiementMode}`,
        ]}
        closeText="Voir la liste"
        actionText="Voir le détail"
        onAction={handleGoToPaymentDetail}
      />
    </div>
  );
}