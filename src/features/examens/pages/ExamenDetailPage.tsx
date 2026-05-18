// src/features/examens/pages/ExamenDetailPage.tsx
/* eslint-disable react-hooks/set-state-in-effect */


/**
 * @module features/examens/pages/ExamenDetailPage
 * @description
 * Page de détail d’un examen (code ou conduite) de l’auto‑école COS.
 * Affiche toutes les informations liées à l’épreuve : candidat, type, date, centre,
 * résultat, note, et permet d’imprimer le certificat, modifier ou supprimer.
 *
 * Thème : Indigo (accent indigo-700).
 *
 * ## Layout
 * ```
 * ┌────────────────────────────────────────────────────────────────┐
 * │  Nav : retour | actions (imprimer, partager, modifier, delete) breadcrumb │
 * ├───────────────────────────────────────┬────────────────────────┤
 * │  BLOC PRINCIPAL                       │  Sidebar sticky        │
 * │  ─ Aperçu (type, résultat, date)      │  ─ Actions rapides     │
 * │  ─ Séparateur                         │  ─ Formation candidat  │
 * │  ─ Candidat                           │  ─ Autres examens du    │
 * │  ─ Séparateur                         │    même candidat       │
 * │  ─ Détails de l’épreuve               │                        │
 * │  ─ Séparateur                         │                        │
 * │  ─ Attestation / Certificat           │                        │
 * │  ─ Séparateur                         │                        │
 * │  ─ Historique (timeline)              │                        │
 * └───────────────────────────────────────┴────────────────────────┘
 * ```
 *
 * Les données sont chargées depuis l’API Electron via le store `useExamens`.
 *
 * @author Stive Junior
 * @version 1.0.0
 */

import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  GraduationCap,
  FileText,
  User,
  Mail,
  Phone,
  MapPin,
  Printer,
  Share2,
  CheckCircle2,
  Clock,
  Eye,
  MessageSquare,
  Building2,
  BookOpen,
  Car,
  Award,
  AlertCircle,
  Edit,
  Trash2,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { PROTECTED_ROUTES, route } from '@/config/routes';
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb';
import { useIsMobile } from '@/hooks/use-mobile';
import { getAvatarUrl } from '@/lib/utils';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import type { Examen } from '@/types/examens.types';
import type { Candidat } from '@/types/candidats.types';
import { CATEGORIE_PERMIS_CONFIG, STATUT_CANDIDAT_CONFIG } from '@/types/enums';
import { useExamens } from '@/hooks/use.examens';
import { useCandidats } from '@/hooks/use.candidats';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDateLocale(date: Date | string): string {
  return format(new Date(date), 'd MMMM yyyy à HH:mm', { locale: fr });
}

function formatNote(note: number | null | undefined): string {
  if (note === null || note === undefined) return 'Non noté';
  return `${note.toFixed(1)} / 20`;
}

/** Retourne la couleur de fond et le texte selon le résultat */
function getResultatConfig(resultat: string) {
  switch (resultat) {
    case 'RECU':
      return { label: 'Reçu', bgColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', icon: CheckCircle2 };
    case 'AJOURNE':
      return { label: 'Ajourné', bgColor: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', icon: AlertCircle };
    default:
      return { label: 'En attente', bgColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', icon: Clock };
  }
}

/** Retourne la configuration du type d'examen (icône, label) */
function getTypeConfig(type: string) {
  if (type === 'CODE') {
    return { label: 'Code', icon: BookOpen, description: 'Épreuve théorique' };
  }
  return { label: 'Conduite', icon: Car, description: 'Épreuve pratique' };
}

// ─────────────────────────────────────────────────────────────────────────────
// Squelette de chargement
// ─────────────────────────────────────────────────────────────────────────────
function PageSkeleton(): React.JSX.Element {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-36 rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Skeleton className="h-180 rounded-2xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composants internes (inspirés de PaiementDetailPage)
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  label,
  accent = 'indigo',
}: {
  icon: LucideIcon;
  label: string;
  accent?: 'indigo' | 'emerald' | 'blue' | 'amber' | 'purple' | 'slate';
}) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  };
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className={cn('flex items-center justify-center h-7 w-7 rounded-lg shrink-0', colors[accent])}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function InfoField({
  label,
  value,
  icon: Icon,
  mono = false,
  href,
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  mono?: boolean;
  href?: string;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3 text-muted-foreground/60 shrink-0" />}
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          {label}
        </span>
      </div>
      {href ? (
        <a
          href={href}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 underline underline-offset-2"
        >
          {value}
        </a>
      ) : (
        <div className={cn('text-sm font-semibold text-foreground', mono && 'font-mono tracking-wide')}>
          {value}
        </div>
      )}
    </div>
  );
}

function TimelineEvent({
  icon: Icon,
  label,
  date,
  relative,
  accent = 'slate',
}: {
  icon: LucideIcon;
  label: string;
  date: Date;
  relative?: string;
  accent?: 'indigo' | 'emerald' | 'blue' | 'slate' | 'amber';
}) {
  const accents: Record<string, string> = {
    indigo: 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    emerald: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    blue: 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    amber: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    slate: 'border-border bg-muted/30 text-muted-foreground',
  };
  return (
    <div className="flex items-start gap-3">
      <div className={cn('flex items-center justify-center h-7 w-7 rounded-full border shrink-0 mt-0.5', accents[accent])}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {format(date, "d MMMM yyyy 'à' HH:mm", { locale: fr })}
        </p>
        {relative && (
          <p className="text-[10px] text-muted-foreground/60 mt-0.5 italic">{relative}</p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar : Actions
// ─────────────────────────────────────────────────────────────────────────────
function ActionsPanel({
  onPrint,
  onEdit,
  onDelete,
  onShare,
  canPrint = false,
  canEdit = false,
  canDelete = false,
}: {
  onPrint: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onShare: () => void;
  canPrint: boolean;
  canEdit: boolean;
  canDelete: boolean;
}) {
  return (
    <Card className="border shadow-sm overflow-hidden py-0">
      <CardHeader className="pb-3 pt-4 px-4 border-b bg-linear-to-r from-indigo-50/60 to-transparent dark:from-indigo-950/20">
        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <GraduationCap className="h-3.5 w-3.5 text-indigo-700" />
          Actions rapides
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-3 space-y-2">
        {canPrint && (
          <Button
            className="w-full justify-start gap-2.5 h-12 text-sm font-semibold bg-indigo-700 hover:bg-indigo-800 text-white rounded-md"
            onClick={onPrint}
          >
            <Printer className="h-4 w-4 shrink-0" />
            Imprimer le certificat
          </Button>
        )}
        {canEdit && (
          <Button
            variant="outline"
            className="w-full justify-start gap-2.5 h-12 text-sm font-semibold bg-white hover:bg-gray-100 text-foreground border border-gray-300 dark:border-gray-600 dark:hover:bg-gray-800"
            onClick={onEdit}
          >
            <Edit className="h-4 w-4 shrink-0" />
            Modifier l’examen
          </Button>
        )}
        {canDelete && (
          <Button
            variant="outline"
            className="w-full justify-start gap-2.5 h-12 text-sm font-semibold bg-white hover:bg-gray-100 text-foreground border border-gray-300 dark:border-gray-600 dark:hover:bg-gray-800"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4 shrink-0" />
            Supprimer l’examen
          </Button>
        )}
        <Separator className="my-1" />
        <Button
          variant="ghost"
          className="w-full justify-start gap-2.5 h-9 text-sm text-muted-foreground"
          onClick={onShare}
        >
          <Share2 className="h-4 w-4 shrink-0" />
          Copier le lien
        </Button>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar : Formation du candidat (identique à PaiementDetailPage)
// ─────────────────────────────────────────────────────────────────────────────
function FormationPanel({ candidat }: { candidat?: Candidat }) {
  const navigate = useNavigate();
  if (!candidat) return null;


  const statutCfg = STATUT_CANDIDAT_CONFIG[candidat.statut] ?? {
    label: candidat.statut ?? 'Statut inconnu',
    description: 'Statut non défini',
    bgColor: 'bg-gray-50 dark:bg-gray-950/30',
    textColor: 'text-gray-700 dark:text-gray-300',
    icon: Clock,
  };
  const categorieCfg = CATEGORIE_PERMIS_CONFIG[candidat.categorie] ?? {
    label: candidat.categorie ?? 'Catégorie inconnue',
    description: 'Catégorie non définie',
    bgColor: 'bg-gray-50 dark:bg-gray-950/30',
    textColor: 'text-gray-700 dark:text-gray-300',
    icon: Car,
  };
  const StatutIcon = statutCfg.icon;
  const CategorieIcon = categorieCfg.icon;

  return (
    <Card className="border shadow-sm overflow-hidden py-0">
      <CardHeader className="pb-3 pt-4 px-4 border-b bg-linear-to-r from-blue-50/60 to-transparent dark:from-blue-950/20">
        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <GraduationCap className="h-3.5 w-3.5 text-blue-700" />
          Formation en cours
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-3 space-y-3">
        <div className="flex items-center gap-2">
          <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-semibold border', categorieCfg.bgColor, categorieCfg.textColor)}>
            <CategorieIcon className="h-3 w-3" />
            {categorieCfg.label}
          </div>
        </div>

        <div className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium', statutCfg.bgColor, statutCfg.textColor)}>
          <StatutIcon className="h-3.5 w-3.5 shrink-0" />
          {statutCfg.label}
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Inscrit depuis</span>
            <span className="font-semibold">
              {candidat.dateInscription && !isNaN(new Date(candidat.dateInscription).getTime())
                ? format(new Date(candidat.dateInscription), 'd MMM yyyy', { locale: fr })
                : 'Date invalide'}
            </span>
          </div>
          {candidat.numeroPermis && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">N° permis</span>
              <code className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">
                {candidat.numeroPermis}
              </code>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-1.5 h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
          onClick={() => {
            navigate(route(PROTECTED_ROUTES.CANDIDATS.DETAIL(candidat.id), { id: candidat.id }));
          }}
        >
          <Eye className="h-3.5 w-3.5" />
          Voir la fiche candidat
          <ChevronRight className="h-3 w-3 ml-auto" />
        </Button>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar : Autres examens du même candidat
// ─────────────────────────────────────────────────────────────────────────────
function AutresExamensPanel({
  currentExamenId,
  examens,
  onViewExamen,
}: {
  currentExamenId: number;
  examens: Examen[];
  onViewExamen: (e: Examen) => void;
}) {
  const autres = examens.filter((e) => e.id !== currentExamenId).slice(0, 5);
  if (autres.length === 0) return null;

  return (
    <Card className="border shadow-sm overflow-hidden">
      <CardHeader className="pb-3 pt-4 px-4 border-b bg-linear-to-r from-slate-50/60 to-transparent dark:from-slate-900/20">
        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <GraduationCap className="h-3.5 w-3.5" />
          Autres examens du candidat
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-2">
        <div className="space-y-0.5">
          {autres.map((e) => {
            const typeCfg = getTypeConfig(e.type);
            const resultatCfg = getResultatConfig(e.resultat);
            const TypeIcon = typeCfg.icon;
            return (
              <button
                key={e.id}
                onClick={() => onViewExamen(e)}
                className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors group text-left"
              >
                <div className={cn('flex items-center justify-center h-7 w-7 rounded-md shrink-0', resultatCfg.bgColor)}>
                  <TypeIcon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      {typeCfg.label}
                    </span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDateLocale(e.date)} · {resultatCfg.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Page de détail d’un examen.
 * Charge les données réelles depuis l’API via le store `useExamens`.
 */
export default function ExamenDetailPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Stores
  const {
    currentExamen,
    detailLoading,
    getById,
    delete: deleteExamen,
    printCertificate,
    getByCandidat,
  } = useExamens();
  const { getById: getCandidatById, currentCandidat, detailLoading: candidatLoading } = useCandidats();

  const [autresExamens, setAutresExamens] = React.useState<Examen[]>([]);
  const [autresLoading, setAutresLoading] = React.useState(false);

  // 1. Chargement de l'examen principal
  React.useEffect(() => {
    if (!id) {
      toast.error('Identifiant examen invalide');
      navigate(PROTECTED_ROUTES.EXAMENS.LIST);
      return;
    }
    const examenId = Number(id);
    if (isNaN(examenId)) {
      toast.error('Identifiant examen invalide');
      navigate(PROTECTED_ROUTES.EXAMENS.LIST);
      return;
    }
    getById(examenId).catch((err) => {
      console.error(err);
      toast.error('Examen introuvable');
      navigate(PROTECTED_ROUTES.EXAMENS.LIST);
    });
  }, [id, getById, navigate]);

  // 2. Charger le candidat associé
  React.useEffect(() => {
    if (currentExamen?.candidatId && !currentExamen.candidat) {
      getCandidatById(currentExamen.candidatId).catch((err) =>
        console.error('Erreur chargement candidat:', err)
      );
    }
  }, [currentExamen, getCandidatById]);

  // 3. Charger les autres examens du même candidat
  React.useEffect(() => {
    if (currentExamen?.candidatId) {
      setAutresLoading(true);
      getByCandidat(currentExamen.candidatId)
        .then((examens) => {
          setAutresExamens(examens);
          setAutresLoading(false);
        })
        .catch((err) => {
          console.error('Erreur chargement autres examens:', err);
          setAutresLoading(false);
        });
    }
  }, [currentExamen?.candidatId, getByCandidat]);

  const isLoading = detailLoading || candidatLoading || autresLoading;
  const examen = currentExamen;
  const candidat = currentCandidat || examen?.candidat;

  if (isLoading && !examen) return <PageSkeleton />;
  if (!examen) return <></>;

  // ── Données extraites ──────────────────────────────────────────────────────
  const typeCfg = getTypeConfig(examen.type);
  const resultatCfg = getResultatConfig(examen.resultat);
  const ResultatIcon = resultatCfg.icon;
  const TypeIcon = typeCfg.icon;

  const examenDate = new Date(examen.date);
  const createdDate = new Date(examen.createdAt);
  const fullName = candidat ? `${candidat.prenom} ${candidat.nom}` : `Candidat ${examen.candidatId}`;
  const avatarUrl = candidat ? getAvatarUrl(fullName) : undefined;
  const initials = candidat
    ? `${candidat.prenom?.[0] ?? ''}${candidat.nom?.[0] ?? ''}`.toUpperCase()
    : `C${examen.candidatId}`;

  const canPrint = examen.resultat === 'RECU';
  const canEdit = true; // selon permissions (admin, secretaire)
  const canDelete = true; // selon permissions

  const daysSince = differenceInDays(new Date(), createdDate);
  const relativeSince = formatDistanceToNow(createdDate, { addSuffix: true, locale: fr });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handlePrint = async () => {
    try {
      const result = await printCertificate(examen.id);
      if (result.success && result.path) {
        toast.success(`Certificat généré : ${result.path}`);
        window.open(result.path, '_blank');
      } else {
        toast.error(result.message || 'Erreur lors de la génération');
      }
    } catch {
      toast.error('Erreur lors de l’impression du certificat');
    }
  };

  const handleEdit = () => {
    navigate(route(PROTECTED_ROUTES.EXAMENS.EDIT(examen.id), { id: examen.id }));
  };

  const handleDelete = async () => {
    if (window.confirm(`Supprimer définitivement l’examen du ${formatDateLocale(examen.date)} ?`)) {
      try {
        await deleteExamen(examen.id);
        toast.success('Examen supprimé');
        navigate(PROTECTED_ROUTES.EXAMENS.LIST);
      } catch (err) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Lien copié dans le presse-papier');
  };

  const handleViewCandidat = () => {
    if (candidat) navigate(route(PROTECTED_ROUTES.CANDIDATS.DETAIL(candidat.id), { id: candidat.id }));
  };

  const handleViewOtherExamen = (e: Examen) => {
    navigate(route(PROTECTED_ROUTES.EXAMENS.DETAIL(e.id), { id: e.id }));
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-14 space-y-6">
        {/* ── Barre de navigation ───────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground rounded-lg"
            onClick={() => navigate(PROTECTED_ROUTES.EXAMENS.LIST)}
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux examens
          </Button>

          <div className="flex items-center gap-1.5">
            {!isMobile && <PageBreadcrumb className="mr-2" resolveDynamicLabel={() => `Examen ${examen.type.toLowerCase()}`} />}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copier le lien</TooltipContent>
            </Tooltip>
            {canPrint && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={handlePrint}>
                    <Printer className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Imprimer le certificat</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* ── Grille principale ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* BLOC PRINCIPAL */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
          >
            <Card className="border shadow-md overflow-hidden p-0">
              {/* ── SECTION 0 : Aperçu de l'examen ─────────────────────── */}
              <div className="bg-linear-to-br from-indigo-50 via-transparent to-transparent dark:from-indigo-950/25 dark:via-transparent px-6 py-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                      Examen {typeCfg.label}
                    </p>
                    <div className="flex items-center gap-3">
                      <TypeIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                      <h2 className="text-2xl font-bold tracking-tight">{typeCfg.label}</h2>
                    </div>
                    {examen.note !== null && examen.note !== undefined && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-sm font-bold px-2 py-1">
                          Note : {formatNote(examen.note)}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className={cn('flex items-center gap-2 px-3 py-2 rounded-xl border', resultatCfg.bgColor, 'border-current/20')}>
                      <ResultatIcon className="h-4 w-4 shrink-0" />
                      <span className="text-sm font-semibold">{resultatCfg.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border bg-muted/40 text-muted-foreground text-sm font-semibold">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDateLocale(examen.date)}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── SECTION 1 : Candidat ───────────────────────────────── */}
              <Separator />
              <div className="px-6 py-5">
                <SectionHeader icon={User} label="Candidat" accent="indigo" />
                <div className="flex flex-col sm:flex-row items-start gap-5">
                  <button
                    onClick={handleViewCandidat}
                    className="flex flex-col items-center gap-2 group shrink-0"
                  >
                    <Avatar className="h-20 w-20 rounded-full border-4 border-background shadow-md ring-2 ring-indigo-200 group-hover:ring-indigo-400 transition-all duration-200 dark:ring-indigo-800">
                      <AvatarImage src={avatarUrl} alt={fullName} className="object-cover" />
                      <AvatarFallback className="bg-indigo-700 text-white text-xl font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[10px] text-indigo-600 font-semibold group-hover:underline">
                      Voir la fiche
                    </span>
                  </button>

                  <div className="flex-1 min-w-0 space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-foreground tracking-tight">{fullName}</h3>
                      {candidat && (
                        <div className="flex flex-wrap gap-2 mt-1.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[11px] font-semibold border-0',
                              CATEGORIE_PERMIS_CONFIG[candidat.categorie]?.bgColor,
                              CATEGORIE_PERMIS_CONFIG[candidat.categorie]?.textColor
                            )}
                          >
                            {CATEGORIE_PERMIS_CONFIG[candidat.categorie]?.label}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[11px] font-semibold border-0',
                              STATUT_CANDIDAT_CONFIG[candidat.statut]?.bgColor,
                              STATUT_CANDIDAT_CONFIG[candidat.statut]?.textColor
                            )}
                          >
                            {STATUT_CANDIDAT_CONFIG[candidat.statut]?.label}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {candidat?.email && (
                        <InfoField
                          label="Adresse e-mail"
                          value={candidat.email}
                          icon={Mail}
                          href={`mailto:${candidat.email}`}
                        />
                      )}
                      {candidat?.telephone && (
                        <InfoField
                          label="Téléphone"
                          value={candidat.telephone}
                          icon={Phone}
                          href={`tel:${candidat.telephone}`}
                        />
                      )}
                      {candidat?.dateNaissance && (
                        <InfoField
                          label="Date de naissance"
                          value={format(new Date(candidat.dateNaissance), 'd MMMM yyyy', { locale: fr })}
                          icon={Calendar}
                        />
                      )}
                      {candidat?.adresse && (
                        <InfoField
                          label="Adresse"
                          value={candidat.adresse}
                          icon={MapPin}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── SECTION 2 : Détails de l'épreuve ───────────────────── */}
              <Separator />
              <div className="px-6 py-5">
                <SectionHeader icon={Award} label="Détails de l'épreuve" accent="purple" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoField
                    label="Type d'examen"
                    value={typeCfg.label}
                    icon={TypeIcon}
                  />
                  <InfoField
                    label="Résultat"
                    value={
                      <div className="flex items-center gap-1.5">
                        <ResultatIcon className="h-3.5 w-3.5" />
                        {resultatCfg.label}
                      </div>
                    }
                    icon={Award}
                  />
                  {examen.note !== null && examen.note !== undefined && (
                    <InfoField
                      label="Note obtenue"
                      value={`${examen.note.toFixed(1)} / 20`}
                      icon={Award}
                    />
                  )}
                  <InfoField
                    label="Centre d'examen"
                    value={examen.centre || 'Non renseigné'}
                    icon={Building2}
                  />
                </div>
                {examen.notes && (
                  <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
                    <div className="flex items-center gap-1.5 mb-1">
                      <MessageSquare className="h-3 w-3 text-amber-600" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                        Notes internes
                      </span>
                    </div>
                    <p className="text-sm text-amber-900 dark:text-amber-200">{examen.notes}</p>
                  </div>
                )}
              </div>

              {/* ── SECTION 3 : Attestation / Certificat (si réussi) ───── */}
              {examen.resultat === 'RECU' && (
                <>
                  <Separator />
                  <div className="px-6 py-5">
                    <SectionHeader icon={FileText} label="Certificat" accent="emerald" />
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                          <Award className="h-6 w-6 text-emerald-700 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                            Certificat de réussite
                          </p>
                          <p className="text-xs text-emerald-700 dark:text-emerald-300">
                            Cet examen a été réussi. Vous pouvez générer le certificat officiel.
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={handlePrint}
                        className="gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white"
                      >
                        <Printer className="h-4 w-4" />
                        Imprimer le certificat
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {/* ── SECTION 4 : Historique (timeline) ─────────────────── */}
              <Separator />
              <div className="px-6 py-5">
                <SectionHeader icon={Clock} label="Historique" accent="slate" />
                <div className="space-y-4">
                  <TimelineEvent
                    icon={Calendar}
                    label="Examen planifié"
                    date={examenDate}
                    relative={formatDateLocale(examen.date)}
                    accent="indigo"
                  />
                  {createdDate.getTime() !== examenDate.getTime() && (
                    <TimelineEvent
                      icon={CheckCircle2}
                      label="Enregistrement dans le système"
                      date={createdDate}
                      relative={relativeSince}
                      accent="blue"
                    />
                  )}
                  {daysSince === 0 && (
                    <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Examen enregistré aujourd'hui
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* SIDEBAR STICKY */}
          <motion.div
            className="space-y-4 lg:sticky lg:top-4 self-start"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.22, delay: 0.06 }}
          >
            <ActionsPanel
              onPrint={handlePrint}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onShare={handleShare}
              canPrint={canPrint}
              canEdit={canEdit}
              canDelete={canDelete}
            />
            <FormationPanel candidat={candidat} />
            <AutresExamensPanel
              currentExamenId={examen.id}
              examens={autresExamens}
              onViewExamen={handleViewOtherExamen}
            />
          </motion.div>
        </div>
      </div>
    </TooltipProvider>
  );
}