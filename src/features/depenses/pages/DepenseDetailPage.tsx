// src/features/depenses/pages/DepenseDetailPage.tsx

/* eslint-disable react-hooks/set-state-in-effect */


/**
 * @module features/depenses/pages/DepenseDetailPage
 * @description
 * Page de détail d’une dépense — présentation complète en un seul bloc
 * avec sections visuellement séparées. Aucun ID technique exposé à l’utilisateur.
 *
 * ## Layout
 * ```
 * ┌────────────────────────────────────────────────────────────────┐
 * │  Nav : retour | actions (modifier, supprimer, joindre reçu)   breadcrumb │
 * ├───────────────────────────────────────┬────────────────────────┤
 * │  BLOC PRINCIPAL                       │  Sidebar sticky        │
 * │  ─ Aperçu (montant, catégorie, date)  │  ─ Actions             │
 * │  ─ Séparateur                         │  ─ Véhicule associé     │
 * │  ─ Détails (fournisseur, description) │  ─ Autres dépenses      │
 * │  ─ Séparateur                         │  ─ du même véhicule     │
 * │  ─ Justificatif (reçu)                │                        │
 * │  ─ Séparateur                         │                        │
 * │  ─ Enregistrement                     │                        │
 * └───────────────────────────────────────┴────────────────────────┘
 * ```
 *
 * Les données sont chargées depuis l’API Electron via le store `useDepenses`.
 * Aucune donnée mockée n’est utilisée.
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
  Receipt,
  FileText,
  Car,
  Fuel,
  Wrench,
  Briefcase,
  Building2,
  Zap,
  Phone,
  Shield,
  Megaphone,
  Package,
  Landmark,
  MoreHorizontal,
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
  Building,
  TrendingUp,
  Banknote,
  BadgeCheck,
  RotateCcw,
  ChevronRight,
  Trash2,
  Edit,
  Paperclip,
  type LucideIcon,
  Tag,
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

import type { Depense } from '@/types/depenses.types';
import type { Vehicule } from '@/types/vehicules.types';
import { CATEGORIE_DEPENSE_CONFIG, type CategorieDepense } from '@/types/enums';
import { useDepenses } from '@/hooks/use.depenses';
import { useVehicules } from '@/hooks/use.vehicules';
import { ErrorDialog } from '@/components/ui/error-dialog';

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

// Icônes par catégorie
const CATEGORIE_ICONS: Record<CategorieDepense, LucideIcon> = {
  CARBURANT: Fuel,
  ENTRETIEN_VEHICULE: Wrench,
  SALAIRE: Briefcase,
  LOYER: Building2,
  ELECTRICITE: Zap,
  TELEPHONE: Phone,
  ASSURANCE: Shield,
  PUBLICITE: Megaphone,
  FOURNITURES: Package,
  TAXES: Landmark,
  AUTRE: MoreHorizontal,
};

// Couleurs de fond pour les badges de catégorie
function getCategorieColor(categorie: CategorieDepense): string {
  const colors: Record<CategorieDepense, string> = {
    CARBURANT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    ENTRETIEN_VEHICULE: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300',
    SALAIRE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    LOYER: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    ELECTRICITE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    TELEPHONE: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
    ASSURANCE: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    PUBLICITE: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300',
    FOURNITURES: 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300',
    TAXES: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    AUTRE: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  };
  return colors[categorie] ?? 'bg-gray-100 text-gray-700';
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
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Skeleton className="h-150 rounded-2xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composants internes
// ─────────────────────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  icon: LucideIcon;
  label: string;
  accent?: 'emerald' | 'blue' | 'amber' | 'purple' | 'slate';
}

function SectionHeader({ icon: Icon, label, accent = 'emerald' }: SectionHeaderProps) {
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
      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
    </div>
  );
}

interface InfoFieldProps {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  mono?: boolean;
  href?: string;
  className?: string;
}

function InfoField({ label, value, icon: Icon, mono = false, href, className }: InfoFieldProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3 text-muted-foreground/60 shrink-0" />}
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{label}</span>
      </div>
      {href ? (
        <a href={href} className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 underline underline-offset-2">
          {value}
        </a>
      ) : (
        <div className={cn('text-sm font-semibold text-foreground', mono && 'font-mono tracking-wide')}>{value}</div>
      )}
    </div>
  );
}

interface TimelineEventProps {
  icon: LucideIcon;
  label: string;
  date: Date;
  relative?: string;
  accent?: 'emerald' | 'blue' | 'slate' | 'amber';
}

function TimelineEvent({ icon: Icon, label, date, relative, accent = 'slate' }: TimelineEventProps) {
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
        {relative && <p className="text-[10px] text-muted-foreground/60 mt-0.5 italic">{relative}</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar : Actions
// ─────────────────────────────────────────────────────────────────────────────

interface ActionsPanelProps {
  onEdit: () => void;
  onDelete: () => void;
  onAttachReceipt: () => void;
  onPrint: () => void;
  onShare: () => void;
}

function ActionsPanel({ onEdit, onDelete, onAttachReceipt, onPrint, onShare }: ActionsPanelProps) {
  return (
    <Card className="border shadow-sm overflow-hidden">
      <CardHeader className="pb-3 pt-4 px-4 border-b bg-linear-to-r from-amber-50/60 to-transparent dark:from-amber-950/20">
        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Receipt className="h-3.5 w-3.5 text-amber-700" />
          Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-3 space-y-2">
        <Button className="w-full justify-start gap-2.5 text-sm font-semibold bg-amber-700 hover:bg-amber-800 text-white rounded-md h-12" onClick={onEdit}>
          <Edit className="h-4 w-4 shrink-0" />
          Modifier la dépense
        </Button>
        <Button variant="outline" className="w-full justify-start gap-2.5 text-sm rounded-md h-12" onClick={onAttachReceipt}>
          <Paperclip className="h-4 w-4 shrink-0" />
          Joindre un reçu (PDF)
        </Button>
        <Button variant="outline" className="w-full justify-start gap-2.5  text-sm rounded-md h-12" onClick={onPrint}>
          <Printer className="h-4 w-4 shrink-0" />
          Imprimer la dépense
        </Button>
        <Separator className="my-1" />
        <Button variant="ghost" className="w-full rounded-md h-12 justify-start gap-2.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30" onClick={onDelete}>
          <Trash2 className="h-4 w-4 shrink-0" />
          Supprimer la dépense
        </Button>
        <Separator className="my-1" />
        <Button variant="ghost" className="w-full justify-start gap-2.5 h-9 text-sm text-muted-foreground" onClick={onShare}>
          <Share2 className="h-4 w-4 shrink-0" />
          Copier le lien
        </Button>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar : Véhicule associé
// ─────────────────────────────────────────────────────────────────────────────

function VehiculePanel({ vehicule }: { vehicule?: Vehicule | null }) {
  if (!vehicule) return null;

  const avatarUrl = vehicule.categorie ? `/images/permis/${vehicule.categorie}.png` : '/images/permis/B.png';
  return (
    <Card className="border shadow-sm py-0 overflow-hidden">
      <CardHeader className="pb-3 pt-4 px-4 border-b bg-linear-to-r from-blue-50/60 to-transparent dark:from-blue-950/20">
        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Car className="h-3.5 w-3.5 text-blue-700" />
          Véhicule associé
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-3 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 rounded-md">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback>{`${vehicule.marque[0]}${vehicule.modele[0]}`}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{vehicule.marque} {vehicule.modele}</p>
            <p className="text-xs text-muted-foreground font-mono">{vehicule.immatriculation}</p>
          </div>
          <Badge variant="outline" className={vehicule.statut === 'DISPONIBLE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
            {vehicule.statut === 'DISPONIBLE' ? 'Disponible' : vehicule.statut === 'EN_LECON' ? 'En leçon' : 'Indisponible'}
          </Badge>
        </div>
        <Separator />
        <div className="grid grid-cols-2 gap-2 text-xs">
          {vehicule.kilometrage && (
            <div>
              <span className="text-muted-foreground">Kilométrage :</span> <span className="font-semibold">{vehicule.kilometrage.toLocaleString('fr-FR')} km</span>
            </div>
          )}
          {vehicule.prochaineRevisionKm && (
            <div>
              <span className="text-muted-foreground">Prochaine révision :</span> <span className="font-semibold">{vehicule.prochaineRevisionKm.toLocaleString('fr-FR')} km</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar : Autres dépenses du même véhicule
// ─────────────────────────────────────────────────────────────────────────────

function AutresDepensesPanel({
  currentDepenseId,
  depenses,
  onViewDepense,
}: {
  currentDepenseId: number;
  depenses: Depense[];
  onViewDepense: (d: Depense) => void;
}) {
  const autres = depenses.filter(d => d.id !== currentDepenseId).slice(0, 5);
  if (autres.length === 0) return null;

  return (
    <Card className="border shadow-sm overflow-hidden">
      <CardHeader className="pb-3 pt-4 px-4 border-b bg-linear-to-r from-slate-50/60 to-transparent dark:from-slate-900/20">
        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Wallet className="h-3.5 w-3.5" />
          Autres dépenses
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-2">
        <div className="space-y-0.5">
          {autres.map(d => {
            const cfg = CATEGORIE_DEPENSE_CONFIG[d.categorie];
            const Icon = CATEGORIE_ICONS[d.categorie];
            return (
              <button key={d.id} onClick={() => onViewDepense(d)} className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors group text-left">
                <div className={cn('flex items-center justify-center h-7 w-7 rounded-md shrink-0', getCategorieColor(d.categorie))}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground tabular-nums">{formatMontantCompact(d.montant)} FCFA</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{cfg?.label} · {format(new Date(d.date), 'd MMM yyyy', { locale: fr })}</span>
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
// Page principale
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Page de détail d'une dépense.
 * Charge les données depuis l’API via le store `useDepenses`.
 */
export default function DepenseDetailPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { currentDepense, detailLoading, getById, delete: deleteDepense, attachReceipt, getByVehicule } = useDepenses();
  const { getById: getVehiculeById, currentVehicule, detailLoading: vehiculeLoading } = useVehicules();

  const [autresDepenses, setAutresDepenses] = React.useState<Depense[]>([]);
  const [autresLoading, setAutresLoading] = React.useState(false);
  const [errorDialog, setErrorDialog] = React.useState<{ open: boolean; title?: string; message: string; details?: string[] }>({ open: false, message: '' });
  const [deleteDialog, setDeleteDialog] = React.useState(false);

  // 1. Chargement de la dépense
  React.useEffect(() => {
    if (!id) {
      toast.error('Identifiant dépense invalide');
      navigate(PROTECTED_ROUTES.DEPENSES.LIST);
      return;
    }
    const depenseId = Number(id);
    if (isNaN(depenseId)) {
      toast.error('Identifiant dépense invalide');
      navigate(PROTECTED_ROUTES.DEPENSES.LIST);
      return;
    }
    getById(depenseId).catch(err => {
      console.error(err);
      toast.error('Dépense introuvable');
      navigate(PROTECTED_ROUTES.DEPENSES.LIST);
    });
  }, [id, getById, navigate]);

  // 2. Chargement du véhicule associé
  React.useEffect(() => {
    if (currentDepense?.vehiculeId && !currentDepense.vehicule) {
      getVehiculeById(currentDepense.vehiculeId).catch(console.error);
    }
  }, [currentDepense, getVehiculeById]);

  // 3. Chargement des autres dépenses du même véhicule
  React.useEffect(() => {
    if (currentDepense?.vehiculeId) {
      setAutresLoading(true);
      getByVehicule(currentDepense.vehiculeId)
        .then(depenses => {
          setAutresDepenses(depenses);
          setAutresLoading(false);
        })
        .catch(err => {
          console.error(err);
          setAutresLoading(false);
        });
    } else {
      setAutresDepenses([]);
    }
  }, [currentDepense?.vehiculeId, getByVehicule]);

  const isLoading = detailLoading || vehiculeLoading || autresLoading;
  const depense = currentDepense;
  const vehicule = currentVehicule || depense?.vehicule;

  if (isLoading && !depense) return <PageSkeleton />;
  if (!depense) return <></>;

  const dateObj = new Date(depense.date);
  const createdObj = new Date(depense.createdAt);
  const daysSince = differenceInDays(new Date(), createdObj);
  const relativeSince = formatDistanceToNow(createdObj, { addSuffix: true, locale: fr });
  const categorieCfg = CATEGORIE_DEPENSE_CONFIG[depense.categorie];
  const CategoryIcon = CATEGORIE_ICONS[depense.categorie];

  // Handlers
  const handleEdit = () => navigate(route(PROTECTED_ROUTES.DEPENSES.EDIT(depense.id), { id: depense.id }));
  const handleDelete = async () => {
    try {
      await deleteDepense(depense.id);
      toast.success('Dépense supprimée avec succès');
      navigate(PROTECTED_ROUTES.DEPENSES.LIST);
    } catch (err: any) {
      setErrorDialog({ open: true, title: 'Erreur', message: err?.message || 'Impossible de supprimer la dépense.', details: err?.message?.includes('caisse') ? ['Cette dépense est liée à un mouvement de caisse.'] : undefined });
    }
    setDeleteDialog(false);
  };
  const handleAttachReceipt = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const result = await attachReceipt(depense.id, file.name);
          if (result.success) toast.success('Reçu attaché avec succès');
          else toast.error(result.message);
        } catch { toast.error('Erreur lors de l’attachement'); }
      }
    };
    input.click();
  };
  const handlePrint = () => window.print();
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Lien copié dans le presse-papier');
  };


  return (
    <TooltipProvider delayDuration={200}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-14 space-y-6">
        {/* Barre de navigation */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground rounded-lg" onClick={() => navigate(PROTECTED_ROUTES.DEPENSES.LIST)}>
            <ArrowLeft className="h-4 w-4" />
            Retour aux dépenses
          </Button>
          <div className="flex items-center gap-1.5">
            {!isMobile && <PageBreadcrumb className="mr-2" />}
            <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={handleShare}><Share2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Copier le lien</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={handlePrint}><Printer className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Imprimer</TooltipContent></Tooltip>
          </div>
        </div>

        {/* Grille principale */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* BLOC PRINCIPAL */}
          <motion.div className="lg:col-span-2" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
            <Card className="border shadow-md overflow-hidden p-0">
              {/* Aperçu */}
              <div className="bg-linear-to-br from-amber-50 via-transparent to-transparent dark:from-amber-950/25 px-6 py-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">Montant dépensé</p>
                    <div className="flex items-end gap-2">
                      <span className="text-5xl sm:text-6xl font-black text-foreground tabular-nums leading-none">{formatMontant(depense.montant)}</span>
                      <span className="text-lg font-bold text-muted-foreground pb-1">FCFA</span>
                    </div>
                    {depense.description && <p className="text-sm text-muted-foreground italic">{depense.description}</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className={cn('flex items-center gap-2 px-3 py-2 rounded-xl border', getCategorieColor(depense.categorie), 'border-current/20')}>
                      <CategoryIcon className="h-4 w-4 shrink-0" />
                      <span className="text-sm font-semibold">{categorieCfg?.label ?? depense.categorie}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border bg-muted/40 text-muted-foreground text-sm font-semibold">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(dateObj, 'd MMM yyyy', { locale: fr })}
                    </div>
                    {depense.reference && (
                      <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border bg-muted/40 text-muted-foreground">
                        <Hash className="h-3.5 w-3.5" />
                        <code className="text-xs font-mono font-semibold">{depense.reference}</code>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Détails */}
              <div className="px-6 py-5">
                <SectionHeader icon={Receipt} label="Détails de la dépense" accent="amber" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoField label="Catégorie" value={categorieCfg?.label ?? depense.categorie} icon={Tag} />
                  <InfoField label="Date de la dépense" value={format(dateObj, "d MMMM yyyy 'à' HH:mm", { locale: fr })} icon={Calendar} />
                  {depense.fournisseur && <InfoField label="Fournisseur" value={depense.fournisseur} icon={Building} />}
                  {depense.reference && <InfoField label="Référence" value={depense.reference} icon={Hash} mono />}
                  {depense.vehiculeId && (
                    <InfoField
                      label="Véhicule associé"
                      value={vehicule ? `${vehicule.marque} ${vehicule.modele} - ${vehicule.immatriculation}` : `ID ${depense.vehiculeId}`}
                      icon={Car}
                      href={vehicule ? PROTECTED_ROUTES.VEHICULES.DETAIL(vehicule.id) : undefined}
                    />
                  )}
                  <InfoField label="Montant" value={<span className="text-amber-700 dark:text-amber-400 font-black text-lg tabular-nums">{formatMontant(depense.montant)} FCFA</span>} icon={Wallet} />
                </div>
                {depense.description && (
                  <div className="mt-4 p-3 rounded-xl bg-muted/40 border border-border/40">
                    <div className="flex items-center gap-1.5 mb-1">
                      <MessageSquare className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Description</span>
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed">{depense.description}</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Justificatif (simulé) */}
              <div className="px-6 py-5">
                <SectionHeader icon={Paperclip} label="Justificatif" accent="purple" />
                <div className="flex items-center justify-between p-3 rounded-xl border border-dashed border-border bg-muted/20">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Aucun justificatif attaché</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleAttachReceipt} className="gap-1">
                    <Paperclip className="h-3.5 w-3.5" />
                    Joindre un reçu
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Enregistrement */}
              <div className="px-6 py-5">
                <SectionHeader icon={Clock} label="Historique d'enregistrement" accent="slate" />
                <div className="space-y-4">
                  <TimelineEvent icon={CheckCircle2} label="Dépense enregistrée" date={dateObj} relative={format(dateObj, "HH:mm", { locale: fr })} accent="emerald" />
                  {createdObj.getTime() !== dateObj.getTime() && (
                    <TimelineEvent icon={RotateCcw} label="Création dans le système" date={createdObj} relative={relativeSince} accent="blue" />
                  )}
                  {daysSince === 0 && (
                    <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Dépense enregistrée aujourd'hui
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* SIDEBAR STICKY */}
          <motion.div className="space-y-4 lg:sticky lg:top-4 self-start" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.22, delay: 0.06 }}>
            <ActionsPanel onEdit={handleEdit} onDelete={() => setDeleteDialog(true)} onAttachReceipt={handleAttachReceipt} onPrint={handlePrint} onShare={handleShare} />
            {vehicule && <VehiculePanel vehicule={vehicule} />}
            {depense.vehiculeId && autresDepenses.length > 0 && (
              <AutresDepensesPanel currentDepenseId={depense.id} depenses={autresDepenses} onViewDepense={d => navigate(route(PROTECTED_ROUTES.DEPENSES.DETAIL(d.id), { id: d.id }))} />
            )}
          </motion.div>
        </div>
      </div>

      {/* Dialogue de confirmation suppression */}
      <ErrorDialog
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        title="Confirmation"
        message="Êtes-vous sûr de vouloir supprimer définitivement cette dépense ? Cette action est irréversible."
        closeText="Annuler"
        actionText="Supprimer"
        onAction={handleDelete}
      />

      {/* Dialogue d'erreur */}
      <ErrorDialog open={errorDialog.open} onOpenChange={open => setErrorDialog(prev => ({ ...prev, open }))} title={errorDialog.title} message={errorDialog.message} details={errorDialog.details} closeText="Fermer" />
    </TooltipProvider>
  );
}