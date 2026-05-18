// src/features/candidats/pages/CandidatCreatePage.tsx

/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * @module features/candidats/pages/CandidatCreatePage
 * @description
 * Page de création d'un nouveau candidat (élève) pour l'auto-école COS.
 *
 * ## Structure
 * - **En-tête** : icône, titre, breadcrumb, date
 * - **FormWrapper** : layout avec panneau de prévisualisation + carte de formulaire
 * - **Dialogue d’erreur** : affiche les erreurs de validation (email unique, etc.)
 *
 * ## Gestion des erreurs
 * - Les erreurs de validation du backend (ex: email déjà existant) sont capturées
 *   et affichées dans un `ErrorDialog` avec des détails techniques sous une section repliable.
 * - Les erreurs de formulaire (champs manquants) sont également affichées via le dialogue.
 *
 * @author Stive Junior
 * @version 4.0.0
 */

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import {
  UserPlus,
  Users,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Hash,
  CheckCircle2,
  Circle,
  type LucideIcon,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb';
import { cn } from '@/lib/utils';
import { ErrorDialog } from '@/components/ui/error-dialog';

import FormWrapper from '@/components/forms/FormWrapper';
import CandidatCreateForm from '@/features/candidats/components/CandidatCreateForm';

import type { CreateCandidatInput } from '@/lib/validators/candidats.validator';
import { PROTECTED_ROUTES, route } from '@/config';
import { useCandidats } from '@/hooks/use.candidats';
import { SuccessDialog } from '@/components/ui/success-dialog';

// ─────────────────────────────────────────────────────────────────────────────
// Types locaux
// ─────────────────────────────────────────────────────────────────────────────

type FormData = Partial<CreateCandidatInput>;

// ─────────────────────────────────────────────────────────────────────────────
// Styles des badges
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIE_BADGE_COLORS: Record<string, string> = {
  A: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300',
  B: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300',
  C: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300',
  D: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300',
  BE: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300',
};

const STATUT_BADGE_COLORS: Record<string, string> = {
  EN_COURS: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300',
  RECU: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300',
  ECHOUE: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300',
  ABANDONNE: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400',
  EN_ATTENTE:
    'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300',
};

const STATUT_LABELS: Record<string, string> = {
  EN_COURS: 'En cours',
  RECU: 'Reçu',
  ECHOUE: 'Échoué',
  ABANDONNE: 'Abandonné',
  EN_ATTENTE: 'En attente',
};

const CATEGORIE_LABELS: Record<string, string> = {
  A: 'Catégorie A — Moto',
  B: 'Catégorie B — Voiture',
  C: 'Catégorie C — Poids lourd',
  D: 'Catégorie D — Transport',
  BE: 'Catégorie BE — Remorque',
};

// ─────────────────────────────────────────────────────────────────────────────
// Sous‑composants
// ─────────────────────────────────────────────────────────────────────────────

interface CompletionGaugeProps {
  filled: number;
  total: number;
}

/**
 * Jauge de progression visuelle pour la complétion du formulaire.
 */
function CompletionGauge({ filled, total }: CompletionGaugeProps) {
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
  const color =
    pct === 100
      ? 'bg-green-500'
      : pct >= 60
        ? 'bg-blue-600'
        : pct >= 30
          ? 'bg-amber-500'
          : 'bg-gray-300 dark:bg-gray-600';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Complétion du profil</span>
        <span className={cn('font-semibold', pct === 100 ? 'text-green-600' : 'text-foreground')}>
          {pct}%
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full transition-colors', color)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground">
        {filled} champ{filled > 1 ? 's' : ''} renseigné{filled > 1 ? 's' : ''} sur {total}
      </p>
    </div>
  );
}

interface InfoRowProps {
  icon: LucideIcon;
  value?: string | null;
  placeholder: string;
  mono?: boolean;
}

/**
 * Ligne d'information de la carte de prévisualisation.
 */
function InfoRow({ icon: Icon, value, placeholder, mono }: InfoRowProps) {
  const isEmpty = !value;
  return (
    <div className="flex items-center gap-2.5 py-1.5 border-b border-dashed border-border/60 last:border-0">
      <Icon
        className={cn(
          'h-3.5 w-3.5 shrink-0',
          isEmpty ? 'text-muted-foreground/40' : 'text-blue-600 dark:text-blue-400'
        )}
      />
      <span
        className={cn(
          'text-xs truncate leading-relaxed',
          isEmpty ? 'text-muted-foreground/50 italic' : 'text-foreground',
          mono && !isEmpty && 'font-mono tracking-wide'
        )}
      >
        {isEmpty ? placeholder : value}
      </span>
    </div>
  );
}

interface ChecklistItemProps {
  label: string;
  filled: boolean;
}

/**
 * Élément de la checklist des champs obligatoires.
 */
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

interface CandidatPreviewCardProps {
  data: FormData;
}

/**
 * Carte de prévisualisation affichée dans le panneau latéral gauche.
 * Affiche les informations saisies en temps réel.
 */
function CandidatPreviewCard({ data }: CandidatPreviewCardProps) {
  const fullName = [data.nom, data.prenom].filter(Boolean).join(' ');
  const fieldsToCheck: Array<{ key: keyof FormData; label: string }> = [
    { key: 'nom', label: 'Nom' },
    { key: 'prenom', label: 'Prénom' },
    { key: 'email', label: 'Email' },
    { key: 'telephone', label: 'Téléphone' },
    { key: 'dateNaissance', label: 'Date de naissance' },
    { key: 'adresse', label: 'Adresse' },
    { key: 'categorie', label: 'Catégorie de permis' },
    { key: 'statut', label: 'Statut' },
    { key: 'dateInscription', label: "Date d'inscription" },
  ];

  const filledCount = fieldsToCheck.filter(({ key }) => {
    const v = data[key];
    return v !== undefined && v !== null && v !== '';
  }).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-3 pt-2 pb-4 border-b border-border/50">
        <div className="text-center">
          {fullName ? (
            <p className="text-base font-bold text-foreground leading-tight">{fullName}</p>
          ) : (
            <p className="text-sm text-muted-foreground/60 italic">Nom non renseigné</p>
          )}
          <div className="flex items-center justify-center flex-wrap gap-1.5 mt-2">
            {data.categorie ? (
              <Badge
                variant="outline"
                className={cn('text-[10px] font-bold px-2 py-0.5', CATEGORIE_BADGE_COLORS[data.categorie])}
              >
                Cat. {data.categorie}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] text-muted-foreground/50 border-dashed">
                Catégorie —
              </Badge>
            )}
            {data.statut ? (
              <Badge
                variant="outline"
                className={cn('text-[10px] font-medium px-2 py-0.5', STATUT_BADGE_COLORS[data.statut])}
              >
                {STATUT_LABELS[data.statut] ?? data.statut}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] text-muted-foreground/50 border-dashed">
                Statut —
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-0.5">
        <InfoRow icon={Mail} value={data.email} placeholder="Email non renseigné" />
        <InfoRow icon={Phone} value={data.telephone ? `+237 ${data.telephone}` : null} placeholder="Téléphone non renseigné" />
        <InfoRow
          icon={Calendar}
          value={data.dateNaissance ? format(new Date(data.dateNaissance), 'd MMMM yyyy', { locale: fr }) : null}
          placeholder="Date de naissance —"
        />
        <InfoRow icon={MapPin} value={data.adresse} placeholder="Adresse non renseignée" />
        <InfoRow icon={Hash} value={data.numeroPermis} placeholder="N° permis —" mono />
      </div>

      {data.categorie && (
        <p className="text-[11px] text-muted-foreground text-center bg-muted/40 rounded-lg px-3 py-2">
          {CATEGORIE_LABELS[data.categorie]}
        </p>
      )}

      <CompletionGauge filled={filledCount} total={fieldsToCheck.length} />
      <div className="space-y-1 pt-1 border-t border-border/50">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">
          Champs requis
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
 * Page de création d'un candidat.
 * Orchestre FormWrapper + CandidatCreateForm + CandidatPreviewCard.
 * Utilise le store `useCandidats` pour créer le candidat via l'API Electron.
 * Affiche un dialogue d'erreur personnalisé (ErrorDialog) en cas d'échec.
 */
export default function CandidatCreatePage(): React.JSX.Element {
  const navigate = useNavigate();
  const { create } = useCandidats();

  const [formData, setFormData] = React.useState<FormData>({
    statut: 'EN_COURS',
    dateInscription: format(new Date(), 'yyyy-MM-dd'),
  });
  const [isFormValid, setIsFormValid] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorDialog, setErrorDialog] = React.useState<{
    open: boolean;
    title?: string;
    message: string;
    details?: string[];
  }>({ open: false, message: '' });

  // Dialogue de succès
  const [successDialogOpen, setSuccessDialogOpen] = React.useState(false);
  const [createdCandidatId, setCreatedCandidatId] = React.useState<number | null>(null);



  const handleFormChange = React.useCallback(
    (patch: Partial<CreateCandidatInput>, isValid: boolean) => {
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
      const newCandidat = await create(formData);
      setCreatedCandidatId(newCandidat.id);
      setSuccessDialogOpen(true);
      // Ne pas rediriger automatiquement, laisser l'utilisateur choisir
    } catch (err: any) {
      let message = 'Une erreur inattendue est survenue. Veuillez réessayer.';
      let details: string[] | undefined;

      if (err?.message) {
        message = err.message;
        if (message.includes('email existe déjà')) {
          details = [
            'Un candidat avec cette adresse email est déjà enregistré.',
            'Veuillez utiliser un autre email ou modifier l’existant.',
          ];
        } else if (message.includes('numéro de permis déjà attribué')) {
          details = [
            'Ce numéro de permis est déjà utilisé par un autre candidat.',
            'Vérifiez le numéro ou contactez l’administrateur.',
          ];
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

  const handleGoToPayment = () => {
    if (createdCandidatId) {
      navigate(`${PROTECTED_ROUTES.PAIEMENTS.CREATE}?candidatId=${createdCandidatId}`);
    } else {
      navigate(PROTECTED_ROUTES.PAIEMENTS.CREATE);
    }
  };

  const handleGoToList = () => {
    navigate(route(PROTECTED_ROUTES.CANDIDATS.LIST));
  };




  return (
    <div className="space-y-5 p-4 md:p-1 pb-12">
      {/* En-tête de page */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-12 rounded-md bg-blue-700 text-white shadow-sm shrink-0">
            <UserPlus className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">Nouveau candidat</h1>
              <Badge
                variant="outline"
                className="text-[10px] h-5 px-2 border-0 bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-semibold"
              >
                Création
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

      {/* Wrapper principal */}
      <FormWrapper
        title="Informations du candidat"
        description="Renseignez les informations personnelles, coordonnées et détails de formation du nouveau candidat."
        icon={UserPlus}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
        isValid={isFormValid}
        isEditMode={false}
        submitLabel="Créer le candidat"
        cancelLabel="Annuler"
        previewTitle="Aperçu du candidat"
        preview={<CandidatPreviewCard data={formData} />}
      >
        <CandidatCreateForm data={formData} onChange={handleFormChange} isSubmitting={isSubmitting} />
      </FormWrapper>

      {/* Dialogue d'erreur avec support des thèmes clair/sombre */}
      <ErrorDialog
        open={errorDialog.open}
        onOpenChange={(open) => setErrorDialog((prev) => ({ ...prev, open }))}
        title={errorDialog.title}
        message={errorDialog.message}
        details={errorDialog.details}
        closeText="Fermer"
        actionText="Réessayer la validation"
      />

      {/* Dialogue de succès avec proposition d'enregistrer un paiement */}
      <SuccessDialog
        open={successDialogOpen}
        onOpenChange={setSuccessDialogOpen}
        title="Candidat créé avec succès"
        message="Le candidat a bien été enregistré dans le système."
        details={[
          `Nom: ${formData.nom} ${formData.prenom}`,
          `Email: ${formData.email || 'Non renseigné'}`,
        ]}
        closeText="Voir la liste"
        actionText="Enregistrer un paiement"
        onAction={handleGoToPayment}
      />
    </div>


  );
}