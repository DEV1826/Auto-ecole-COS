/* eslint-disable react-hooks/set-state-in-effect */
// src/features/factures/pages/FactureDetailPage.tsx

/**
 * @module features/factures/pages/FactureDetailPage
 * @description
 * Page de détail d’une facture – présentation complète en un seul bloc
 * avec sections visuellement séparées.
 *
 * ## Layout
 * ```
 * ┌────────────────────────────────────────────────────────────────┐
 * │  Nav : retour | actions (télécharger PDF, email, imprimer)     │
 * ├───────────────────────────────────────┬────────────────────────┤
 * │  UN SEUL BLOC PRINCIPAL               │  Sidebar sticky        │
 *  │  ─ Aperçu (numéro, montant, statut)   │  ─ Actions (PDF, email)│
 * │  ─ Séparateur                         │  ─ Candidat associé    │
 * │  ─ Candidat (avatar, infos)           │  ─ Autres factures     │
 * │  ─ Séparateur                         │                        │
 * │  ─ Détails de la facture (dates, etc) │                        │
 * │  ─ Séparateur                         │                        │
 * │  ─ Paiements associés (tableau)       │                        │
 * │  ─ Séparateur                         │                        │
 * │  ─ Historique d’enregistrement        │                        │
 * └───────────────────────────────────────┴────────────────────────┘
 * ```
 *
 * @author Stive Junior
 * @version 1.0.0
 */

'use client';

import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Receipt,
  FileText,
  User,
  Mail,
  Phone,
  MapPin,
  Printer,
  Download,
  PlusCircle,
  CheckCircle2,
  Clock,
  Eye,
  Hash,
  MessageSquare,
  GraduationCap,
  Banknote,
  BadgeCheck,
  RotateCcw,
  Smartphone,
  ChevronRight,
  Car,
  LinkIcon,
  Loader2,
  AlertTriangle,
  Info,
  TrendingUp,
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
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { Facture } from '@/types/factures.types';
import type { Paiement } from '@/types/paiements.types';
import type { Candidat } from '@/types/candidats.types';
import { STATUT_FACTURE_CONFIG, MODE_PAIEMENT_CONFIG, CATEGORIE_PERMIS_CONFIG, STATUT_CANDIDAT_CONFIG, type StatutFacture } from '@/types/enums';
import { useFactures } from '@/hooks/use.factures';
import { useCandidats } from '@/hooks/use.candidats';
import { usePaiements } from '@/hooks/use.paiements';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatMontant(n: number): string {
  return n.toLocaleString('fr-FR');
}

function formatMontantCompact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'k';
  return n.toLocaleString('fr-FR');
}

/** Retourne l'icône lucide correspondant au mode de paiement */
function getModeIcon(mode: string): React.ElementType {
  const iconMap: Record<string, React.ElementType> = {
    ESPECES: Banknote,
    CHEQUE: FileText,
    VIREMENT: TrendingUp,
    CARTE: CreditCard,
    MOBILE_MONEY: Smartphone,
  };
  return iconMap[mode] ?? CreditCard;
}

/** Retourne la couleur de fond du mode de paiement */
function getModeColor(mode: string): string {
  const colorMap: Record<string, string> = {
    ESPECES: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    CHEQUE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    VIREMENT: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    CARTE: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    MOBILE_MONEY: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  };
  return colorMap[mode] ?? 'bg-gray-100 text-gray-700';
}

// ─────────────────────────────────────────────────────────────────────────────
// Squelette de chargement
// ─────────────────────────────────────────────────────────────────────────────

function PageSkeleton(): React.JSX.Element {
  return (
    <div className="max-w-7xl px-4 sm:px-6 py-6 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-36 rounded-lg" />
        <div className="flex gap-2">
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
// Sous-composants internes
// ─────────────────────────────────────────────────────────────────────────────

/** En-tête de section */
function SectionHeader({
  icon: Icon,
  label,
  accent = 'emerald',
}: {
  icon: React.ElementType;
  label: string;
  accent?: 'emerald' | 'blue' | 'amber' | 'purple' | 'slate';
}) {
  const colors: Record<string, string> = {
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

/** Champ d'information */
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
  icon?: React.ElementType;
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
          className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 underline underline-offset-2"
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

/** Pilule de statut */
function FactureStatutPill({ statut }: { statut: StatutFacture }) {
  const cfg = STATUT_FACTURE_CONFIG[statut] ?? STATUT_FACTURE_CONFIG.EN_ATTENTE;
  const Icon = cfg.icon;
  return (
    <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold', cfg.textColor)}>
      <Icon className="h-3 w-3 shrink-0" />
      {cfg.label}
    </div>
  );
}

/** Mini timeline */
function TimelineEvent({
  icon: Icon,
  label,
  date,
  relative,
  accent = 'slate',
}: {
  icon: React.ElementType;
  label: string;
  date: Date;
  relative?: string;
  accent?: 'emerald' | 'blue' | 'slate' | 'amber';
}) {
  const accents: Record<string, string> = {
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
  onDownloadPDF,
  onSendEmail,
  onAddPayment,
  pdfPath,
}: {
  onPrint: () => void;
  onDownloadPDF: () => void;
  onSendEmail: () => void;
  onAddPayment: () => void;
  pdfPath?: string | null;
}) {
  return (
    <Card className="border shadow-sm overflow-hidden py-0">
      <CardHeader className="pb-3 pt-4 px-4 border-b bg-linear-to-r from-blue-50/60 to-transparent dark:from-blue-950/20">
        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Receipt className="h-3.5 w-3.5 text-blue-700" />
          Actions rapides
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-3 space-y-2">
        <Button
          className="w-full justify-start gap-2.5 h-12 text-sm font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-md"
          onClick={onDownloadPDF}
        >
          <Download className="h-4 w-4 shrink-0" />
          Télécharger PDF
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start gap-2.5 h-12 text-sm rounded-md"
          onClick={onPrint}
        >
          <Printer className="h-4 w-4 shrink-0" />
          Imprimer
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start gap-2.5 h-12 text-sm rounded-md border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/30"
          onClick={onSendEmail}
        >
          <Mail className="h-4 w-4 shrink-0" />
          Envoyer par email
        </Button>
        <Separator className="my-1" />
        <Button
          variant="ghost"
          className="w-full justify-start gap-2.5 h-9 text-sm text-muted-foreground"
          onClick={onAddPayment}
        >
          <PlusCircle className="h-4 w-4 shrink-0" />
          Ajouter un paiement
        </Button>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar : Candidat
// ─────────────────────────────────────────────────────────────────────────────

function CandidatPanel({ candidat }: { candidat?: Candidat }) {
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
          <User className="h-3.5 w-3.5 text-blue-700" />
          Candidat
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-3 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 rounded-full border shadow-sm">
            <AvatarImage src={getAvatarUrl(`${candidat.prenom} ${candidat.nom}`)} alt={`${candidat.prenom} ${candidat.nom}`} />
            <AvatarFallback className="bg-blue-700 text-white text-sm font-bold">
              {`${candidat.prenom?.[0] ?? ''}${candidat.nom?.[0] ?? ''}`.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-bold">{candidat.prenom} {candidat.nom}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              <Badge variant="outline" className={cn('text-[10px] font-semibold border-0', categorieCfg.bgColor, categorieCfg.textColor)}>
                <CategorieIcon className="h-2.5 w-2.5 mr-1" />
                {categorieCfg.label}
              </Badge>
              <Badge variant="outline" className={cn('text-[10px] font-semibold border-0', statutCfg.bgColor, statutCfg.textColor)}>
                <StatutIcon className="h-2.5 w-2.5 mr-1" />
                {statutCfg.label}
              </Badge>
            </div>
          </div>
        </div>
        <Separator />
        <div className="space-y-2 text-xs">
          {candidat.email && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Email</span>
              <a href={`mailto:${candidat.email}`} className="font-medium text-blue-600 hover:underline">{candidat.email}</a>
            </div>
          )}
          {candidat.telephone && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Téléphone</span>
              <a href={`tel:${candidat.telephone}`} className="font-medium">{candidat.telephone}</a>
            </div>
          )}
          {candidat.numeroPermis && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">N° permis</span>
              <code className="text-[10px] font-mono bg-muted px-1 py-0.5 rounded">{candidat.numeroPermis}</code>
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
// Sidebar : Autres factures du candidat
// ─────────────────────────────────────────────────────────────────────────────

function AutresFacturesPanel({
  currentFactureId,
  factures,
  onViewFacture,
}: {
  currentFactureId: number;
  factures: Facture[];
  onViewFacture: (f: Facture) => void;
}) {
  const autres = factures.filter((f) => f.id !== currentFactureId).slice(0, 5);
  if (autres.length === 0) return null;

  return (
    <Card className="border shadow-sm overflow-hidden py-0">
      <CardHeader className="pb-3 pt-4 px-4 border-b bg-linear-to-r from-slate-50/60 to-transparent dark:from-slate-900/20">
        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <FileText className="h-3.5 w-3.5" />
          Autres factures
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-2">
        <div className="space-y-0.5">
          {autres.map((f) => {
            const statutCfg = STATUT_FACTURE_CONFIG[f.statut];
            return (
              <button
                key={f.id}
                onClick={() => onViewFacture(f)}
                className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors group text-left"
              >
                <div className={cn('flex items-center justify-center h-7 w-7 rounded-md shrink-0', statutCfg?.bgColor ?? 'bg-gray-100')}>
                  <FileText className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground tabular-nums">
                      {f.numero}
                    </span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(f.dateEmission), 'd MMM yyyy', { locale: fr })} · {formatMontant(f.montantTotal)} FCFA
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

export default function FactureDetailPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Stores
  const {
    currentFacture,
    detailLoading,
    getById,
    generatePDF,
    sendByEmail,
    getFacturesByCandidat,
  } = useFactures();
  const { getById: getCandidatById, currentCandidat, detailLoading: candidatLoading, resetCurrentCandidat } = useCandidats();
  const { getPaiementsByFacture } = useFactures();

  const [paiements, setPaiements] = React.useState<Paiement[]>([]);
  const [paiementsLoading, setPaiementsLoading] = React.useState(false);
  const [autresFactures, setAutresFactures] = React.useState<Facture[]>([]);
  const [autresFacturesLoading, setAutresFacturesLoading] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState(false);

  // Chargement de la facture
  React.useEffect(() => {
    if (!id) {
      toast.error('Identifiant facture invalide');
      navigate(PROTECTED_ROUTES.FACTURES.LIST);
      return;
    }
    const factureId = Number(id);
    if (isNaN(factureId)) {
      toast.error('Identifiant facture invalide');
      navigate(PROTECTED_ROUTES.FACTURES.LIST);
      return;
    }
    getById(factureId).catch((err) => {
      console.error(err);
      toast.error('Facture introuvable');
      navigate(PROTECTED_ROUTES.FACTURES.LIST);
    });
  }, [id, getById, navigate]);

  // Chargement du candidat
  React.useEffect(() => {
    if (currentFacture?.candidatId) {
      resetCurrentCandidat();
      getCandidatById(currentFacture.candidatId).catch((err) =>
        console.error('Erreur chargement candidat:', err)
      );
    }
  }, [currentFacture?.candidatId, getCandidatById, resetCurrentCandidat]);

  // Chargement des paiements de la facture
  React.useEffect(() => {
    if (currentFacture?.id) {
      setPaiementsLoading(true);
      getPaiementsByFacture(currentFacture.id)
        .then(setPaiements)
        .catch(console.error)
        .finally(() => setPaiementsLoading(false));
    }
  }, [currentFacture?.id, getPaiementsByFacture]);

  // Chargement des autres factures du même candidat
  React.useEffect(() => {
    if (currentFacture?.candidatId && currentFacture?.id) {
      setAutresFacturesLoading(true);
      getFacturesByCandidat(currentFacture.candidatId)
        .then((factures) => {
          setAutresFactures(factures);
        })
        .catch(console.error)
        .finally(() => setAutresFacturesLoading(false));
    }
  }, [currentFacture?.candidatId, currentFacture?.id, getFacturesByCandidat]);

  const isLoading = detailLoading || candidatLoading || paiementsLoading || autresFacturesLoading;
  const facture = currentFacture;
  const candidat = currentCandidat;

  if (isLoading && !facture) return <PageSkeleton />;
  if (!facture) return <></>;

  const totalPaye = paiements.reduce((sum, p) => sum + p.montant, 0);
  const resteAPayer = Math.max(0, facture.montantTotal - totalPaye);
  const progressPct = facture.montantTotal > 0 ? Math.min(100, Math.round((totalPaye / facture.montantTotal) * 100)) : 0;

  const emissionDate = new Date(facture.dateEmission);
  const echeanceDate = facture.dateEcheance ? new Date(facture.dateEcheance) : null;
  const createdAtDate = new Date(facture.createdAt);
  const daysSince = differenceInDays(new Date(), createdAtDate);
  const relativeSince = formatDistanceToNow(createdAtDate, { addSuffix: true, locale: fr });

  // Handlers
  const handlePrint = () => {
    toast.info('Préparation de l’impression…');
    setTimeout(() => window.print(), 300);
  };

  const handleDownloadPDF = async () => {
    setActionLoading(true);
    try {
      const result = await generatePDF(facture.id);
      if (result.success && result.path) {
        toast.success('PDF généré avec succès');
        window.open(result.path, '_blank');
      } else {
        toast.error(result.message || 'Erreur lors de la génération du PDF');
      }
    } catch {
      toast.error('Erreur lors du téléchargement');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!candidat?.email) {
      toast.error('Ce candidat n’a pas d’adresse email renseignée');
      return;
    }
    setActionLoading(true);
    try {
      const result = await sendByEmail(facture.id);
      if (result.success) {
        toast.success(`Facture envoyée à ${candidat.email}`);
      } else {
        toast.error(result.message || "Erreur lors de l'envoi");
      }
    } catch {
      toast.error('Erreur lors de l’envoi par email');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddPayment = () => {
    navigate(`${PROTECTED_ROUTES.PAIEMENTS.CREATE}?candidatId=${facture.candidatId}`);
  };

  const handleViewFacture = (f: Facture) => {
    navigate(route(PROTECTED_ROUTES.FACTURES.DETAIL(f.id), { id: f.id }));
  };

  const handleViewCandidat = () => {
    if (candidat) navigate(route(PROTECTED_ROUTES.CANDIDATS.DETAIL(candidat.id), { id: candidat.id }));
  };

  const statutCfg = STATUT_FACTURE_CONFIG[facture.statut];

  return (
    <TooltipProvider delayDuration={200}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-14 space-y-6">
        {/* Barre de navigation */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground rounded-lg"
            onClick={() => navigate(PROTECTED_ROUTES.FACTURES.LIST)}
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux factures
          </Button>
          <div className="flex items-center gap-1.5">
            {!isMobile && <PageBreadcrumb className="mr-2" />}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Imprimer</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={handleDownloadPDF} disabled={actionLoading}>
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Télécharger PDF</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Grille principale */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Bloc principal */}
          <motion.div className="lg:col-span-2" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
            <Card className="border shadow-md overflow-hidden p-0">
              {/* Aperçu de la facture */}
              <div className="bg-linear-to-br from-blue-50 via-transparent to-transparent dark:from-blue-950/25 dark:via-transparent px-6 py-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                      Facture n°
                    </p>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl sm:text-4xl font-black text-foreground font-mono tracking-tight">
                        {facture.numero}
                      </span>
                    </div>
                    {facture.notes && <p className="text-sm text-muted-foreground italic">{facture.notes}</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-muted/40 text-muted-foreground text-sm font-semibold">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(emissionDate, 'd MMM yyyy', { locale: fr })}
                    </div>
                    <FactureStatutPill statut={facture.statut} />
                  </div>
                </div>

                {/* Barre de progression du paiement */}
                <div className="mt-5 p-3 rounded-xl bg-white/60 dark:bg-white/5 border border-border/40">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Banknote className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-semibold text-muted-foreground">Règlement</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold tabular-nums">{progressPct}%</span>
                    </div>
                  </div>
                  <Progress value={progressPct} className="h-1.5" indicatorClassName="bg-blue-600" />
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-muted-foreground">
                      Payé : <strong>{formatMontant(totalPaye)} FCFA</strong>
                    </span>
                    {resteAPayer > 0 && (
                      <span className="text-[10px] text-amber-600 font-semibold">
                        Reste : {formatMontant(resteAPayer)} FCFA
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Détails de la facture */}
              <div className="px-6 py-5">
                <SectionHeader icon={FileText} label="Détails de la facture" accent="blue" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoField
                    label="Date d'émission"
                    value={format(emissionDate, "d MMMM yyyy", { locale: fr })}
                    icon={Calendar}
                  />
                  {echeanceDate && (
                    <InfoField
                      label="Date d'échéance"
                      value={format(echeanceDate, "d MMMM yyyy", { locale: fr })}
                      icon={Clock}
                    />
                  )}
                  <InfoField
                    label="Montant total"
                    value={<span className="text-blue-700 dark:text-blue-400 font-black text-lg tabular-nums">{formatMontant(facture.montantTotal)} FCFA</span>}
                    icon={Receipt}
                  />
                  <InfoField
                    label="Statut"
                    value={
                      <div className="inline-flex items-center gap-1.5">
                        {statutCfg?.icon && <statutCfg.icon className="h-3.5 w-3.5" />}
                        <span>{statutCfg?.label ?? facture.statut}</span>
                      </div>
                    }
                    icon={BadgeCheck}
                  />
                </div>
                {facture.notes && (
                  <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
                    <div className="flex items-center gap-1.5 mb-1">
                      <MessageSquare className="h-3 w-3 text-amber-600" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Note interne</span>
                    </div>
                    <p className="text-sm text-amber-900 dark:text-amber-200">{facture.notes}</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Paiements associés */}
              <div className="px-6 py-5">
                <SectionHeader icon={CreditCard} label="Paiements effectués" accent="emerald" />
                {paiements.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-6 text-center border rounded-xl bg-muted/20">
                    <Banknote className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">Aucun paiement enregistré pour cette facture</p>
                    <Button size="sm" variant="outline" onClick={handleAddPayment} className="gap-1">
                      <PlusCircle className="h-4 w-4" /> Ajouter un paiement
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-xl border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">Date</TableHead>
                          <TableHead>Mode</TableHead>
                          <TableHead className="text-right">Montant</TableHead>
                          <TableHead className="text-center w-[80px]">Reçu</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paiements.map((p) => {
                          const ModeIcon = getModeIcon(p.mode);
                          const modeColor = getModeColor(p.mode);
                          return (
                            <TableRow key={p.id} className="cursor-pointer hover:bg-muted/30" onClick={() => navigate(PROTECTED_ROUTES.PAIEMENTS.DETAIL(p.id))}>
                              <TableCell className="text-xs font-mono">{format(new Date(p.date), 'dd/MM/yyyy')}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  <div className={cn('p-1 rounded-md', modeColor)}>
                                    <ModeIcon className="h-3 w-3" />
                                  </div>
                                  <span className="text-xs">{MODE_PAIEMENT_CONFIG[p.mode]?.label ?? p.mode}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-semibold tabular-nums">{formatMontant(p.montant)} FCFA</TableCell>
                              <TableCell className="text-center">
                                {p.reference ? (
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <BadgeCheck className="h-4 w-4 text-green-600" />
                                    </TooltipTrigger>
                                    <TooltipContent>Réf: {p.reference}</TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <CheckCircle2 className="h-4 w-4 text-muted-foreground/50" />
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    {resteAPayer > 0 && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border-t border-amber-200 dark:border-amber-800 text-center">
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          Il reste <strong>{formatMontant(resteAPayer)} FCFA</strong> à payer sur cette facture.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              {/* Historique d'enregistrement */}
              <div className="px-6 py-5">
                <SectionHeader icon={Clock} label="Historique" accent="slate" />
                <div className="space-y-4">
                  <TimelineEvent icon={FileText} label="Facture émise" date={emissionDate} relative={format(emissionDate, "HH:mm", { locale: fr })} accent="blue" />
                  {createdAtDate.getTime() !== emissionDate.getTime() && (
                    <TimelineEvent icon={RotateCcw} label="Enregistrement système" date={createdAtDate} relative={relativeSince} accent="slate" />
                  )}
                  {daysSince === 0 && (
                    <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Facture enregistrée aujourd'hui
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Sidebar */}
          <motion.div className="space-y-4 lg:sticky lg:top-4 self-start" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.22, delay: 0.06 }}>
            <ActionsPanel
              onPrint={handlePrint}
              onDownloadPDF={handleDownloadPDF}
              onSendEmail={handleSendEmail}
              onAddPayment={handleAddPayment}
              pdfPath={facture.pdfPath}
            />
            <CandidatPanel candidat={candidat!} />
            <AutresFacturesPanel
              currentFactureId={facture.id}
              factures={autresFactures}
              onViewFacture={handleViewFacture}
            />
          </motion.div>
        </div>
      </div>
    </TooltipProvider>
  );
}