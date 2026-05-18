/* eslint-disable react-hooks/set-state-in-effect */
// src/features/candidats/pages/CandidatEditPage.tsx

/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * @module features/candidats/pages/CandidatEditPage
 * @description
 * Page d'édition d'un candidat existant pour l'auto-école COS.
 *
 * ## Structure
 * - **En-tête** : icône, titre avec ID du candidat, breadcrumb, date
 * - **FormWrapper** : layout avec panneau de prévisualisation + carte de formulaire
 * - **Dialogue d’erreur** : affiche les erreurs de validation (email unique, etc.)
 *
 * ## Flux de données
 * 1. Chargement du candidat via `useCandidats.getById(id)` pendant le montage.
 * 2. Pré‑remplissage du formulaire avec les données récupérées.
 * 3. Soumission → mise à jour via `update(id, data)`.
 * 4. Affichage d’un dialogue d’erreur personnalisé en cas d’échec.
 *
 * @author Stive Junior
 * @version 1.0.0
 */

import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import {
  UserCog,
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
import { Skeleton } from '@/components/ui/skeleton';

import { Badge } from '@/components/ui/badge';
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb';
import { cn } from '@/lib/utils';
import { ErrorDialog } from '@/components/ui/error-dialog';

import FormWrapper from '@/components/forms/FormWrapper';
import CandidatCreateForm from '@/features/candidats/components/CandidatCreateForm';

import type { CreateCandidatInput } from '@/lib/validators/candidats.validator';
import { PROTECTED_ROUTES, route } from '@/config';
import { useCandidats } from '@/hooks/use.candidats';
import type { Candidat } from '@/types/candidats.types';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────────────────────
// Types locaux
// ─────────────────────────────────────────────────────────────────────────────

type FormData = Partial<CreateCandidatInput>;

// ─────────────────────────────────────────────────────────────────────────────
// Styles des badges (identique au formulaire de création)
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
// Sous‑composants (complétion, info row, checklist, preview)
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
 * Affiche les informations modifiées en temps réel.
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
        <InfoRow icon={Phone} value={data.telephone ? `${data.telephone}` : null} placeholder="Téléphone non renseigné" />
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
// Page principale : CandidatEditPage
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Page d'édition d'un candidat existant.
 * Charge les données via `useCandidats.getById`, les injecte dans le formulaire,
 * puis soumet la mise à jour via `update`.
 * Affiche un dialogue d'erreur personnalisé en cas d'échec.
 */
export default function CandidatEditPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const candidatId = parseInt(id ?? '0', 10);

  const {
    getById,
    update,
    loading: candidatLoading,
    detailLoading,
    detailError,
  } = useCandidats();

  const [formData, setFormData] = React.useState<FormData>({});
  const [initialData, setInitialData] = React.useState<Candidat | null>(null);
  const [isFormValid, setIsFormValid] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [errorDialog, setErrorDialog] = React.useState<{
    open: boolean;
    title?: string;
    message: string;
    details?: string[];
  }>({ open: false, message: '' });

  // Chargement du candidat au montage
  React.useEffect(() => {
    if (isNaN(candidatId)) {
      setLoadError("Identifiant de candidat invalide.");
      setIsLoading(false);
      return;
    }

    const loadCandidat = async () => {
      setIsLoading(true);
      try {
        const candidat = await getById(candidatId);
        setInitialData(candidat);
        // Pré‑remplir le formulaire avec les données existantes
        setFormData({
          nom: candidat.nom,
          prenom: candidat.prenom,
          email: candidat.email ?? '',
          telephone: candidat.telephone ?? '',
          dateNaissance: candidat.dateNaissance ? new Date(candidat.dateNaissance).toISOString().split('T')[0] : '',
          adresse: candidat.adresse ?? '',
          categorie: candidat.categorie,
          statut: candidat.statut,
          numeroPermis: candidat.numeroPermis ?? '',
          notes: candidat.notes ?? '',
          dateInscription: candidat.dateInscription ? new Date(candidat.dateInscription).toISOString().split('T')[0] : '',
          formationId: candidat.formation?.formationId,
        });
        setIsFormValid(true);
      } catch (err: any) {
        setLoadError(err?.message ?? "Impossible de charger le candidat.");
      } finally {
        setIsLoading(false);
      }
    };

    loadCandidat();
  }, [candidatId, getById]);

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
      await update(candidatId, formData);
      navigate(route(PROTECTED_ROUTES.CANDIDATS.LIST));
      toast.success('Candidat mis à jour avec succès', {
        position: 'top-center'
      });
    } catch (err: any) {
      let message = 'Une erreur inattendue est survenue. Veuillez réessayer.';
      let details: string[] | undefined;

      if (err?.message) {
        message = err.message;
        if (message.includes('email existe déjà')) {
          details = [
            'Un autre candidat utilise déjà cette adresse email.',
            'Veuillez utiliser un email différent ou contacter l’administrateur.',
          ];
        } else if (message.includes('numéro de permis déjà attribué')) {
          details = [
            'Ce numéro de permis est déjà attribué à un autre candidat.',
            'Vérifiez le numéro ou contactez l’administrateur.',
          ];
        }
      }

      setErrorDialog({
        open: true,
        title: 'Erreur de mise à jour',
        message,
        details,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [isFormValid, candidatId, formData, update, navigate]);

  const handleCancel = React.useCallback(() => navigate(-1), [navigate]);

  // Affichage du chargement
  if (isLoading || candidatLoading || detailLoading) {
    return (
      <div className="space-y-5 p-4 md:p-1 pb-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-md" />
            <div>
              <Skeleton className="h-6 w-48 mb-1" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Skeleton className="h-150 w-full rounded-md" />
          </div>
          <div className="lg:col-span-2">
            <Skeleton className="h-200 w-full rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  // Affichage d’une erreur de chargement
  if (loadError || detailError) {
    return (
      <div className="space-y-5 p-4 md:p-1 pb-12">
        <ErrorDialog
          open={true}
          onOpenChange={() => navigate(-1)}
          title="Erreur de chargement"
          message={loadError ?? detailError ?? "Impossible de charger le candidat."}
          closeText="Retour"
        />
      </div>
    );
  }

  // Données de base pour l’aperçu
  const previewData: FormData = {
    ...formData,
    dateInscription: formData.dateInscription ?? initialData?.dateInscription?.toString().split('T')[0],
  };

  return (
    <div className="space-y-5 p-4 md:p-1 pb-12">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-12 rounded-md bg-blue-700 text-white shadow-sm shrink-0">
            <UserCog className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">
                Modifier candidat
              </h1>
              <Badge
                variant="outline"
                className="text-[10px] h-5 px-2 border-0 bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-semibold"
              >
                ID {candidatId}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <Users className="h-3 w-3" />
              <span>{format(new Date(), "EEEE d MMMM yyyy 'à' HH'h'mm", { locale: fr })}</span>
            </p>
          </div>
        </div>
        <PageBreadcrumb className="hidden lg:flex" resolveDynamicLabel={() => `${formData.nom} ${formData.prenom}`} />
      </div>

      {/* Formulaire d’édition */}
      <FormWrapper
        title="Informations du candidat"
        description="Modifiez les informations personnelles, coordonnées et détails de formation."
        icon={UserCog}

        isValid={isFormValid}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
        isEditMode={true}
        submitLabel="Mettre à jour"
        cancelLabel="Annuler"
        previewTitle="Aperçu du candidat"
        preview={<CandidatPreviewCard data={previewData} />}
      >
        <CandidatCreateForm
          data={formData}
          onChange={handleFormChange}
          isSubmitting={isSubmitting}
        />
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
    </div>
  );
}