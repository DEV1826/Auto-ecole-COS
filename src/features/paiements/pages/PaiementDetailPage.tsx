/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/static-components */
// src/features/paiements/pages/PaiementDetailPage.tsx

/**
 * @module features/paiements/pages/PaiementDetailPage
 * @description
 * Page de détail d'un paiement — présentation complète en un seul bloc
 * avec sections visuellement séparées. Pas d'ID technique exposé à l'utilisateur.
 *
 * Les données sont chargées depuis l’API Electron via le store `usePaiements`.
 * Aucune donnée mockée n’est utilisée.
 *
 * ## Layout
 * ```
 * ┌────────────────────────────────────────────────────────────────┐
 * │  Nav : retour | actions (imprimer, partager)   breadcrumb      │
 * ├───────────────────────────────────────┬────────────────────────┤
 * │  UN SEUL BLOC PRINCIPAL               │  Sidebar sticky        │
 * │  ─ Aperçu (montant, mode, date)       │  ─ Actions             │
 * │  ─ Séparateur                         │  ─ Formation candidat  │
 * │  ─ Candidat                           │  ─ Autres paiements    │
 * │  ─ Séparateur                         │                        │
 * │  ─ Détails de la transaction          │                        │
 * │  ─ Séparateur                         │                        │
 * │  ─ Facture associée                   │                        │
 * │  ─ Séparateur                         │                        │
 * │  ─ Enregistrement                     │                        │
 * └───────────────────────────────────────┴────────────────────────┘
 * ```
 *
 * @author Stive Junior
 * @version 4.0.0
 */

'use client';

import * as React from 'react';
import { useParams, useNavigate, href } from 'react-router-dom';
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
  Share2,
  Download,
  PlusCircle,
  CheckCircle2,
  Clock,
  Eye,
  Wallet,
  Hash,
  MessageSquare,
  GraduationCap,
  TrendingUp,
  Banknote,
  BadgeCheck,
  RotateCcw,
  Smartphone,
  ChevronRight,
  Car,
  Link as LinkIcon,
  Loader2,
  type LucideIcon,
  AlertTriangle,
  Info,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

import type { Paiement } from '@/types/paiements.types';
import type { SoldeCandidat } from '@/types/paiements.types';
import { MODE_PAIEMENT_CONFIG, STATUT_CANDIDAT_CONFIG, CATEGORIE_PERMIS_CONFIG, STATUT_FACTURE_CONFIG, type StatutFacture } from '@/types/enums';
import { usePaiements } from '@/hooks/use.paiements';
import { useCandidats } from '@/hooks/use.candidats';
import { useFactures } from '@/hooks/use.factures';
import type { Candidat } from '@/types/candidats.types';
import type { Facture } from '@/types/factures.types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

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
function getModeIcon(mode: string): LucideIcon {
  const iconMap: Record<string, LucideIcon> = {
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
// Sous-composants internes (inchangés)
// ─────────────────────────────────────────────────────────────────────────────

/** En-tête de section dans le bloc principal */
function SectionHeader({
  icon: Icon,
  label,
  accent = 'emerald',
}: {
  icon: LucideIcon;
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

/** Champ d'information label + valeur */
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

/** Pilule de statut d'une facture */
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

/** Mini timeline event (sans ID) */
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
  onDownload,
  onCreateInvoice,
  onShare,
  hasFacture,
}: {
  onPrint: () => void;
  onDownload: () => void;
  onCreateInvoice: () => void;
  onShare: () => void;
  onEdit: () => void;
  hasFacture: boolean;
}) {
  return (
    <Card className="border shadow-sm overflow-hidden py-0">
      <CardHeader className="pb-3 pt-4 px-4 border-b bg-linear-to-r from-emerald-50/60 to-transparent dark:from-emerald-950/20">
        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Receipt className="h-3.5 w-3.5 text-emerald-700" />
          Actions rapides
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-3 space-y-2">
        <Button
          className="w-full justify-start gap-2.5 h-12 text-sm font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-md"
          onClick={onPrint}
        >
          <Printer className="h-4 w-4 shrink-0" />
          Imprimer le reçu
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start gap-2.5 h-12 text-sm rounded-md"
          onClick={onDownload}
        >
          <Download className="h-4 w-4 shrink-0" />
          Télécharger (PDF)
        </Button>
        {!hasFacture && (
          <Button
            variant="outline"
            className="w-full justify-start gap-2.5 h-12 text-sm rounded-md border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/30"
            onClick={onCreateInvoice}
          >
            <PlusCircle className="h-4 w-4 shrink-0" />
            Créer une facture
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
// Sidebar : Formation du candidat
// ─────────────────────────────────────────────────────────────────────────────

function FormationPanel({ candidat }: { candidat?: Candidat }) {
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

  const Image = `/images/permis/${candidat.categorie}.png`;

  return (
    <Card className="border shadow-sm overflow-hidden py-0">
      <CardHeader className="pb-3 pt-4 px-4 border-b bg-linear-to-r from-blue-50/60 to-transparent dark:from-blue-950/20">
        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <GraduationCap className="h-3.5 w-3.5 text-blue-700" />
          Formation en cours
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-3 space-y-3">'

        <img src={Image} />

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
            window.open(href(route(PROTECTED_ROUTES.CANDIDATS.DETAIL(candidat.id), { id: candidat.id })), '_blank');
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
// Sidebar : Autres paiements du candidat
// ─────────────────────────────────────────────────────────────────────────────

function AutresPaiementsPanel({
  currentPaiementId,
  paiements,
  onViewPaiement,
}: {
  currentPaiementId: number;
  paiements: Paiement[];
  onViewPaiement: (p: Paiement) => void;
}) {
  const autres = paiements.filter((p) => p.id !== currentPaiementId).slice(0, 5);
  if (autres.length === 0) return null;

  return (
    <Card className="border shadow-sm overflow-hidden py-0">
      <CardHeader className="pb-3 pt-4 px-4 border-b bg-linear-to-r from-slate-50/60 to-transparent dark:from-slate-900/20">
        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Wallet className="h-3.5 w-3.5" />
          Autres paiements
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-2">
        <div className="space-y-0.5">
          {autres.map((p) => {
            const modeCfg = MODE_PAIEMENT_CONFIG[p.mode];
            const ModeIcon = getModeIcon(p.mode);
            return (
              <button
                key={p.id}
                onClick={() => onViewPaiement(p)}
                className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors group text-left"
              >
                <div className={cn('flex items-center justify-center h-7 w-7 rounded-md shrink-0', getModeColor(p.mode))}>
                  <ModeIcon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground tabular-nums">
                      {formatMontant(p.montant)} FCFA
                    </span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(p.date), 'd MMM yyyy', { locale: fr })} · {modeCfg?.label ?? p.mode}
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
 * Page de détail d'un paiement.
 * Charge les données réelles depuis l’API via le store `usePaiements`.
 */
export default function PaiementDetailPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Stores
  const {
    currentPaiement,
    detailLoading,
    getById,
    getByCandidat,
    update,
  } = usePaiements();
  const {
    getById: getCandidatById,
    currentCandidat,
    detailLoading: candidatLoading,
    resetCurrentCandidat,
  } = useCandidats();
  const { getFacturesByCandidat } = useFactures();
  const { getSoldeCandidat } = usePaiements();

  const [autresPaiements, setAutresPaiements] = React.useState<Paiement[]>([]);
  const [autresLoading, setAutresLoading] = React.useState(false);
  const [facturesDuCandidat, setFacturesDuCandidat] = React.useState<Facture[]>([]);
  const [facturesLoading, setFacturesLoading] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedFactureId, setSelectedFactureId] = React.useState<string>("none");
  const [updatingFacture, setUpdatingFacture] = React.useState(false);
  const [soldeCandidat, setSoldeCandidat] = React.useState<SoldeCandidat | null>(null);
  const [soldeLoading, setSoldeLoading] = React.useState(false);


  const [hasUninvoicedPayments, setHasUninvoicedPayments] = React.useState(false);
  const [totalCandidatPayments, setTotalCandidatPayments] = React.useState(0);
  const [uninvoicedPaymentsList, setUninvoicedPaymentsList] = React.useState<Paiement[]>([]);




  // Chargement du paiement principal
  React.useEffect(() => {
    if (!id) {
      toast.error('Identifiant paiement invalide');
      navigate(PROTECTED_ROUTES.PAIEMENTS.LIST);
      return;
    }
    const paiementId = Number(id);
    if (isNaN(paiementId)) {
      toast.error('Identifiant paiement invalide');
      navigate(PROTECTED_ROUTES.PAIEMENTS.LIST);
      return;
    }
    getById(paiementId).catch((err) => {
      console.error(err);
      toast.error('Paiement introuvable');
      navigate(PROTECTED_ROUTES.PAIEMENTS.LIST);
    });
  }, [id, getById, navigate]);

  // Chargement du candidat et du solde dès que le paiement est disponible
  React.useEffect(() => {
    if (currentPaiement?.candidatId) {
      // Réinitialiser l'ancien candidat pour éviter l'affichage périmé
      resetCurrentCandidat();
      // Charger le nouveau candidat
      getCandidatById(currentPaiement.candidatId).catch((err) =>
        console.error('Erreur chargement candidat:', err)
      );
      // Charger le solde
      setSoldeLoading(true);
      getSoldeCandidat(currentPaiement.candidatId)
        .then(setSoldeCandidat)
        .catch(console.error)
        .finally(() => setSoldeLoading(false));
    }
  }, [currentPaiement, getCandidatById, getSoldeCandidat, resetCurrentCandidat]);

  // Charger les autres paiements du même candidat
  React.useEffect(() => {
    if (currentPaiement?.candidatId) {
      setAutresLoading(true);
      getByCandidat(currentPaiement.candidatId)
        .then((paiements) => {
          setAutresPaiements(paiements);
          setAutresLoading(false);
        })
        .catch((err) => {
          console.error('Erreur chargement autres paiements:', err);
          setAutresLoading(false);
        });
    }
  }, [currentPaiement?.candidatId, getByCandidat]);

  // Charger les factures du candidat pour le dialogue d'association
  // Dans le composant principal, remplacez l'effet qui charge les factures par :

  React.useEffect(() => {
    if (dialogOpen && currentPaiement?.candidatId) {
      setFacturesLoading(true);
      getFacturesByCandidat(currentPaiement.candidatId)
        .then((factures) => {
          setFacturesDuCandidat(factures);
          setSelectedFactureId(currentPaiement.factureId?.toString() ?? "none");
          setFacturesLoading(false);
        })
        .catch((err) => {
          console.error('Erreur chargement factures:', err);
          setFacturesDuCandidat([]);
          setFacturesLoading(false);
        });
    }
  }, [dialogOpen, currentPaiement?.candidatId, currentPaiement?.factureId, getFacturesByCandidat]);


  const isLoading = detailLoading || candidatLoading || autresLoading || soldeLoading;
  const paiement = currentPaiement;
  const candidat = currentCandidat;


  // Analyse des paiements non facturés
  React.useEffect(() => {
    if (!paiement || !candidat) return;

    const allPayments = [paiement, ...autresPaiements];
    const uninvoiced = allPayments.filter(p => !p.factureId);
    setHasUninvoicedPayments(uninvoiced.length > 0);
    setUninvoicedPaymentsList(uninvoiced);
    const total = allPayments.reduce((sum, p) => sum + p.montant, 0);
    setTotalCandidatPayments(total);
  }, [paiement, candidat, autresPaiements]);

  if (isLoading && !paiement) return <PageSkeleton />;
  if (!paiement) return <></>;

  const facture = paiement.facture;
  const modeCfg = MODE_PAIEMENT_CONFIG[paiement.mode];
  const modeColor = getModeColor(paiement.mode);
  const paymentDate = new Date(paiement.date);
  const createdDate = new Date(paiement.createdAt);
  const fullName = candidat ? `${candidat.prenom} ${candidat.nom}` : `Candidat ${paiement.candidatId}`;
  const avatarUrl = candidat ? getAvatarUrl(fullName) : undefined;
  const initials = candidat
    ? `${candidat.prenom?.[0] ?? ''}${candidat.nom?.[0] ?? ''}`.toUpperCase()
    : `C${paiement.candidatId}`;

  const montantPaye = facture
    ? facture.paiements?.reduce((s: number, p: Paiement) => s + p.montant, 0) ?? paiement.montant
    : 0;
  const progressPct = facture
    ? Math.min(100, Math.round((montantPaye / facture.montantTotal) * 100))
    : 0;
  const resteAPayer = facture ? Math.max(0, facture.montantTotal - montantPaye) : 0;

  const daysSince = differenceInDays(new Date(), createdDate);
  const relativeSince = formatDistanceToNow(createdDate, { addSuffix: true, locale: fr });

  // Handlers
  const handlePrint = () => {
    toast.info("Préparation de l'impression…");
    setTimeout(() => window.print(), 300);
  };
  const handleDownload = () => {
    if (facture?.pdfPath) {
      toast.success(`Téléchargement de ${facture.numero}`);
    } else {
      toast.info('Aucun document PDF disponible pour ce paiement');
    }
  };
  const handleCreateInvoice = () => {
    toast.info('Création d\'une facture pour ce paiement');
  };
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Lien copié dans le presse-papier');
  };
  const handleEdit = () => {
    toast.info('Modification du paiement');
  };
  const handleViewFacture = () => {
    if (facture) navigate(route(PROTECTED_ROUTES.FACTURES.DETAIL(facture.id), { id: facture.id }));
  };
  const handleViewCandidat = () => {
    if (candidat) navigate(route(PROTECTED_ROUTES.CANDIDATS.DETAIL(candidat.id), { id: candidat.id }));
  };

  // Association à une facture
  const handleOpenAttachDialog = () => setDialogOpen(true);
  const handleAttachFacture = async () => {
    if (!paiement) return;
    setUpdatingFacture(true);
    try {
      const newFactureId = selectedFactureId === "none" ? null : Number(selectedFactureId);
      await update(paiement.id, { factureId: newFactureId });
      toast.success('Facture associée avec succès');

      await getById(paiement.id);
      const updatedPayments = await getByCandidat(paiement.candidatId);
      setAutresPaiements(updatedPayments);
      setDialogOpen(false);
    } catch (err) {
      toast.error('Erreur lors de l\'association de la facture', {
        description: err instanceof Error ? err.message : 'Une erreur inconnue est survenue',
      });
    } finally {
      setUpdatingFacture(false);
    }
  };


  const ModeIcon = getModeIcon(paiement.mode);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-14 space-y-6">
        {/* Barre de navigation */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground rounded-lg"
            onClick={() => navigate(PROTECTED_ROUTES.PAIEMENTS.LIST)}
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux paiements
          </Button>
          <div className="flex items-center gap-1.5">
            {!isMobile && <PageBreadcrumb className="mr-2" />}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copier le lien</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Imprimer le reçu</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Grille principale */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Bloc principal (inchangé structurellement) */}
          <motion.div className="lg:col-span-2" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
            <Card className="border shadow-md overflow-hidden p-0">
              {/* Aperçu du paiement (inchangé) */}
              <div className="bg-linear-to-br from-emerald-50 via-transparent to-transparent dark:from-emerald-950/25 dark:via-transparent px-6 py-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                      Montant encaissé
                    </p>
                    <div className="flex items-end gap-2">
                      <span className="text-5xl sm:text-6xl font-black text-foreground tabular-nums leading-none">
                        {formatMontant(paiement.montant)}
                      </span>
                      <span className="text-lg font-bold text-muted-foreground pb-1">FCFA</span>
                    </div>
                    {paiement.note && <p className="text-sm text-muted-foreground italic">{paiement.note}</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className={cn('flex items-center gap-2 px-3 py-2 rounded-xl border', modeColor, 'border-current/20')}>
                      <ModeIcon className="h-4 w-4 shrink-0" />
                      <span className="text-sm font-semibold">{modeCfg?.label ?? paiement.mode}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border bg-muted/40 text-muted-foreground text-sm font-semibold">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(paymentDate, 'd MMM yyyy', { locale: fr })}
                    </div>
                    {paiement.reference && (
                      <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border bg-muted/40 text-muted-foreground">
                        <Hash className="h-3.5 w-3.5" />
                        <code className="text-xs font-mono font-semibold">{paiement.reference}</code>
                      </div>
                    )}
                  </div>
                </div>
                {facture && (
                  <div className="mt-4 p-3 rounded-xl bg-white/60 dark:bg-white/5 border border-border/40">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground">Facture {facture.numero}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FactureStatutPill statut={facture.statut} />
                        <span className="text-xs font-bold tabular-nums">{progressPct}%</span>
                      </div>
                    </div>
                    <Progress value={progressPct} className="h-1.5" indicatorClassName='bg-emerald-600' />
                    <div className="flex justify-between mt-1.5">
                      <span className="text-[10px] text-muted-foreground">
                        Payé : <strong>{formatMontant(montantPaye)} FCFA</strong>
                      </span>
                      {resteAPayer > 0 && (
                        <span className="text-[10px] text-amber-600 font-semibold">
                          Reste : {formatMontant(resteAPayer)} FCFA
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Separator />
              {/* Section Candidat (identique mais avec solde) */}
              <div className="px-6 py-5">
                <SectionHeader icon={User} label="Candidat" accent="emerald" />
                <div className="flex flex-col sm:flex-row items-start gap-5">
                  <button onClick={handleViewCandidat} className="flex flex-col items-center gap-2 group shrink-0">
                    <Avatar className="h-20 w-20 rounded-full border-4 border-background shadow-md ring-2 ring-emerald-200 group-hover:ring-emerald-400 transition-all duration-200 dark:ring-emerald-800">
                      <AvatarImage src={avatarUrl} alt={fullName} className="object-cover" />
                      <AvatarFallback className="bg-emerald-700 text-white text-xl font-bold">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="text-[10px] text-emerald-600 font-semibold group-hover:underline">Voir la fiche</span>
                  </button>
                  <div className="flex-1 min-w-0 space-y-4">
                    <div>
                      <h2 className="text-xl font-bold text-foreground tracking-tight">{fullName}</h2>
                      {candidat && (
                        <div className="flex flex-wrap gap-2 mt-1.5">
                          <Badge variant="outline" className={cn('text-[11px] font-semibold border-0', CATEGORIE_PERMIS_CONFIG[candidat.categorie]?.bgColor, CATEGORIE_PERMIS_CONFIG[candidat.categorie]?.textColor)}>
                            {CATEGORIE_PERMIS_CONFIG[candidat.categorie]?.label}
                          </Badge>
                          <Badge variant="outline" className={cn('text-[11px] font-semibold border-0', STATUT_CANDIDAT_CONFIG[candidat.statut]?.bgColor, STATUT_CANDIDAT_CONFIG[candidat.statut]?.textColor)}>
                            {STATUT_CANDIDAT_CONFIG[candidat.statut]?.label}
                          </Badge>
                        </div>
                      )}
                    </div>
                    {/* Affichage du solde du candidat */}
                    {soldeCandidat && (
                      <div className="p-3 rounded-xl bg-muted/30 border border-border/40 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Total formation</span>
                          <span className="font-semibold">{formatMontant(soldeCandidat.montantTotalFormation)} FCFA</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Total payé</span>
                          <span className="font-semibold">{formatMontant(soldeCandidat.totalPaye)} FCFA</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium pt-1 border-t">
                          <span>Solde restant dû</span>
                          <span className={soldeCandidat.solde > 0 ? 'text-amber-600' : 'text-green-600'}>
                            {formatMontant(soldeCandidat.solde)} FCFA
                          </span>
                        </div>
                        {soldeCandidat.tropPerçu && (
                          <div className="text-xs text-amber-600 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Crédit client : {formatMontant(soldeCandidat.totalPaye - soldeCandidat.montantTotalFormation)} FCFA
                          </div>
                        )}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {candidat?.email && (
                        <InfoField label="Adresse e-mail" value={candidat.email} icon={Mail} href={`mailto:${candidat.email}`} />
                      )}
                      {candidat?.telephone && (
                        <InfoField label="Téléphone" value={candidat.telephone} icon={Phone} href={`tel:${candidat.telephone}`} />
                      )}
                      {candidat?.dateNaissance && (
                        <InfoField label="Date de naissance" value={format(new Date(candidat.dateNaissance), 'd MMMM yyyy', { locale: fr })} icon={Calendar} />
                      )}
                      {candidat?.adresse && (
                        <InfoField label="Adresse" value={candidat.adresse} icon={MapPin} />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />
              {/* Détails de la transaction (inchangé) */}
              <div className="px-6 py-5">
                <SectionHeader icon={Receipt} label="Détails de la transaction" accent="blue" />
                <div className={cn('flex items-center gap-4 p-4 rounded-xl border mb-4', modeColor, 'border-current/20 bg-opacity-30')}>
                  <div className={cn('flex items-center justify-center h-12 w-12 rounded-xl shrink-0', modeColor)}>
                    <ModeIcon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold">{modeCfg?.label ?? paiement.mode}</p>
                    <p className="text-xs text-current/70">{modeCfg?.description ?? 'Mode de paiement'}</p>
                  </div>
                  <BadgeCheck className="h-5 w-5 shrink-0 opacity-60" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoField label="Date du paiement" value={format(paymentDate, "d MMMM yyyy 'à' HH:mm", { locale: fr })} icon={Calendar} />
                  <InfoField label="Heure précise" value={format(paymentDate, 'HH:mm:ss')} icon={Clock} mono />
                  {paiement.reference && <InfoField label="Référence externe" value={paiement.reference} icon={Hash} mono />}
                  <InfoField label="Montant encaissé" value={<span className="text-emerald-700 dark:text-emerald-400 font-black text-lg tabular-nums">{formatMontant(paiement.montant)} FCFA</span>} icon={Wallet} />
                </div>
                {paiement.note && (
                  <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
                    <div className="flex items-center gap-1.5 mb-1">
                      <MessageSquare className="h-3 w-3 text-amber-600" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Note interne</span>
                    </div>
                    <p className="text-sm text-amber-900 dark:text-amber-200">{paiement.note}</p>
                  </div>
                )}
              </div>

              <Separator />
              {/* Section Facture associée avec bouton pour modifier */}
              <div className="px-6 py-5">
                <SectionHeader icon={FileText} label="Facture associée" accent="purple" />
                {facture ? (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono font-bold text-foreground bg-muted px-2 py-0.5 rounded">{facture.numero}</code>
                        <FactureStatutPill statut={facture.statut} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={handleViewFacture}>
                          <Eye className="h-3.5 w-3.5" /> Ouvrir la facture
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={handleOpenAttachDialog}>
                          <LinkIcon className="h-3.5 w-3.5" /> Modifier
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-muted/40 border border-border/40 text-center">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Total facture</p>
                        <p className="text-base font-black tabular-nums">{formatMontantCompact(facture.montantTotal)}</p>
                        <p className="text-[10px] text-muted-foreground">FCFA</p>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800 text-center">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 mb-1">Déjà payé</p>
                        <p className="text-base font-black tabular-nums text-emerald-700 dark:text-emerald-300">{formatMontantCompact(montantPaye)}</p>
                        <p className="text-[10px] text-emerald-600">FCFA</p>
                      </div>
                      <div className={cn('p-3 rounded-xl border text-center', resteAPayer > 0 ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800' : 'bg-muted/40 border-border/40')}>
                        <p className={cn('text-[10px] font-semibold uppercase tracking-wider mb-1', resteAPayer > 0 ? 'text-amber-600' : 'text-muted-foreground')}>Reste à payer</p>
                        <p className={cn('text-base font-black tabular-nums', resteAPayer > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-muted-foreground')}>
                          {resteAPayer > 0 ? formatMontantCompact(resteAPayer) : '—'}
                        </p>
                        <p className={cn('text-[10px]', resteAPayer > 0 ? 'text-amber-600' : 'text-muted-foreground')}>{resteAPayer > 0 ? 'FCFA' : 'soldée'}</p>
                      </div>
                    </div>
                    {/* Avertissement si des paiements non facturés existent */}
                    {hasUninvoicedPayments && (
                      <Alert variant="alert" className="mt-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Paiements sans facture</AlertTitle>
                        <AlertDescription className="space-y-2">
                          <p>
                            Ce candidat a effectué <strong>{uninvoicedPaymentsList.length} paiement{uninvoicedPaymentsList.length > 1 ? 's' : ''}</strong>{" "}
                            qui ne sont rattachés à aucune facture.
                          </p>
                          <p className="text-sm">
                            Montant total payé par le candidat : <strong>{formatMontant(totalCandidatPayments)} FCFA</strong><br />
                            Montant payé sur cette facture : <strong>{formatMontant(montantPaye)} FCFA</strong>
                          </p>
                          <p className="text-sm">
                            Pour une comptabilité exacte, veuillez associer les paiements suivants à une facture :
                          </p>
                          <ul className="list-disc pl-5 text-sm">
                            {uninvoicedPaymentsList.map(p => (
                              <li key={p.id}>
                                {format(new Date(p.date), 'dd/MM/yyyy')} – {formatMontant(p.montant)} FCFA ({p.mode})
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="h-auto p-0 ml-2 text-emerald-600"
                                  onClick={() => {
                                    navigate(PROTECTED_ROUTES.PAIEMENTS.DETAIL(p.id));
                                  }}
                                >
                                  Associer
                                </Button>
                              </li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}


                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-medium">Taux de règlement</span>
                        <span className="font-bold tabular-nums" >{progressPct}%</span>
                      </div>
                      <Progress value={progressPct} className="h-2.5" indicatorClassName='bg-emerald-700' />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-4 text-center">
                    {/* Alerte existante */}
                    <Alert variant="alert" className="w-full bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertTitle>Paiement sans facture</AlertTitle>
                      <AlertDescription>
                        Ce paiement n’est actuellement rattaché à aucune facture.
                        Vous pouvez l’associer à une facture existante ou en créer une.
                      </AlertDescription>
                    </Alert>

                    {/* Si d’autres paiements sans facture existent aussi, on peut le signaler */}
                    {hasUninvoicedPayments && uninvoicedPaymentsList.length > 1 && (
                      <Alert variant="info" className="w-full">
                        <Info className="h-4 w-4" />
                        <AlertTitle>Autres paiements sans facture</AlertTitle>
                        <AlertDescription>
                          Le candidat a {uninvoicedPaymentsList.length - 1} autre paiement sans facture.
                          Pensez à les régulariser.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Icône et bouton existants */}
                    <div className="p-4 rounded-xl bg-muted/30 border border-dashed border-border">
                      <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Aucune facture associée</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Ce paiement n'est pas encore rattaché à une facture.
                      </p>
                    </div>
                    <Button size="sm" onClick={handleOpenAttachDialog} className="gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white">
                      <LinkIcon className="h-4 w-4" /> Associer une facture
                    </Button>
                  </div>
                )}
              </div>

              <Separator />
              {/* Historique d'enregistrement (inchangé) */}
              <div className="px-6 py-5">
                <SectionHeader icon={Clock} label="Historique d'enregistrement" accent="slate" />
                <div className="space-y-4">
                  <TimelineEvent icon={CheckCircle2} label="Paiement effectué" date={paymentDate} relative={`${format(paymentDate, "HH:mm", { locale: fr })} — ${modeCfg?.label ?? paiement.mode}`} accent="emerald" />
                  {createdDate.getTime() !== paymentDate.getTime() && (
                    <TimelineEvent icon={RotateCcw} label="Enregistrement dans le système" date={createdDate} relative={relativeSince} accent="blue" />
                  )}
                  {daysSince === 0 && (
                    <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Paiement enregistré aujourd'hui
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Sidebar sticky (Actions, Formation, Autres paiements) */}
          <motion.div className="space-y-4 lg:sticky lg:top-4 self-start" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.22, delay: 0.06 }}>
            <ActionsPanel
              onPrint={handlePrint}
              onDownload={handleDownload}
              onCreateInvoice={handleCreateInvoice}
              onShare={handleShare}
              onEdit={handleEdit}
              hasFacture={!!facture}
            />
            <FormationPanel candidat={candidat!} />
            <AutresPaiementsPanel
              currentPaiementId={paiement.id}
              paiements={autresPaiements}
              onViewPaiement={(p) => navigate(PROTECTED_ROUTES.PAIEMENTS.DETAIL(p.id))}
            />
          </motion.div>
        </div>
      </div>

      {/* Dialogue d'association de facture */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Associer une facture</DialogTitle>
            <DialogDescription>
              Choisissez la facture à associer à ce paiement. La facture pourra ensuite être suivie.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="facture-select">Facture</Label>
              <Select value={selectedFactureId} onValueChange={setSelectedFactureId} disabled={facturesLoading}>
                <SelectTrigger id="facture-select">
                  <SelectValue placeholder={facturesLoading ? "Chargement..." : "Sélectionner une facture"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune facture</SelectItem>
                  {facturesDuCandidat.map((f) => (
                    <SelectItem key={f.id} value={f.id.toString()}>
                      {f.numero} - {formatMontant(f.montantTotal)} FCFA ({STATUT_FACTURE_CONFIG[f.statut]?.label})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleAttachFacture} disabled={updatingFacture}>
              {updatingFacture && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Associer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}