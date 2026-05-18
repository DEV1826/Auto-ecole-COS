// src/features/planning/pages/PlanningDetailPage.tsx

/**
 * @module features/planning/pages/PlanningDetailPage
 * @description
 * Page de détail d’une leçon (planning) de l’auto‑école COS.
 * Affiche toutes les informations de la leçon : date, durée, type, statut, notes,
 * ainsi que les fiches récapitulatives du candidat, du moniteur et du véhicule.
 *
 * Thème : Bleu (accent blue-700).
 *
 * ## Architecture visuelle
 * ```
 * ┌─────────────────────────────────────────────────────────────┐
 * │  Bouton retour · Breadcrumb                                 │
 * ├─────────────────────────────────────────────────────────────┤
 * │  EN-TÊTE : Type de leçon · Statut · Date · Heure · Durée    │
 * ├─────────────────────────────────────────────────────────────┤
 * │  Bloc principal : 3 colonnes                               │
 * │  ┌─────────────┬─────────────┬─────────────────────────┐   │
 * │  │  Candidat   │  Moniteur   │  Véhicule               │   │
 * │  │  (avatar,   │  (avatar,   │  (avatar, immatriculation│   │
 * │  │   nom,       │   nom,       │   marque, modèle, statut)│   │
 * │  │   contact)   │   contact)   │                         │   │
 * │  └─────────────┴─────────────┴─────────────────────────┘   │
 * ├─────────────────────────────────────────────────────────────┤
 * │  Notes et actions (modifier, annuler, marquer effectuée,    │
 * │  signaler absence)                                          │
 * └─────────────────────────────────────────────────────────────┘
 * ```
 *
 * Les données sont chargées depuis l’API Electron via le store `usePlanning`.
 * Aucune donnée mockée n’est utilisée.
 *
 * @see {@link usePlanning}
 * @see {@link useCandidats}
 * @see {@link useMoniteurs}
 * @see {@link useVehicules}
 *
 * @author Stive Junior
 * @version 1.0.0
 */

import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Car,
  User,
  Users,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { PROTECTED_ROUTES, route } from '@/config/routes';
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb';
import { getAvatarUrl } from '@/lib/utils';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ErrorDialog } from '@/components/ui/error-dialog';

import { usePlanning } from '@/hooks/use.planning';
import { useCandidats } from '@/hooks/use.candidats';
import { useMoniteurs } from '@/hooks/use.moniteurs';
import { useVehicules } from '@/hooks/use.vehicules';
import { TYPE_LECON_CONFIG, STATUT_LECON_CONFIG } from '@/types/enums';

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composants internes
// ─────────────────────────────────────────────────────────────────────────────

interface InfoCardProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
}

function InfoCard({ title, icon: Icon, children, className }: InfoCardProps) {
  return (
    <Card className={cn('overflow-hidden shadow-sm', className)}>
      <CardHeader className="pb-2 pt-3 px-4 border-b bg-muted/20">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Icon className="h-4 w-4 text-blue-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">{children}</CardContent>
    </Card>
  );
}

interface InfoRowProps {
  label: string;
  value?: React.ReactNode;
  icon?: React.ElementType;
  mono?: boolean;
}

function InfoRow({ label, value, icon: Icon, mono = false }: InfoRowProps) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 text-sm">
      {Icon && <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />}
      <div className="flex-1 min-w-0">
        <span className="text-muted-foreground text-xs font-medium">{label}</span>
        <p className={cn('font-medium', mono && 'font-mono text-xs')}>{value}</p>
      </div>
    </div>
  );
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} h`;
  return `${hours}h${mins}`;
}

function getStatutColor(statut: string): string {
  const colors: Record<string, string> = {
    PLANIFIEE: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
    EFFECTUEE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    ANNULEE: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
    ABSENCE: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  };
  return colors[statut] ?? 'bg-gray-100 text-gray-700';
}

// ─────────────────────────────────────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────────────────────────────────────

export default function PlanningDetailPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const leconId = Number(id);

  const {
    currentLecon,
    detailLoading,
    getById,
    update,
    delete: deleteLecon,
    resetCurrentLecon,
  } = usePlanning();

  const { getById: getCandidatById, currentCandidat, detailLoading: candidatLoading } = useCandidats();
  const { getById: getMoniteurById, currentMoniteur, detailLoading: moniteurLoading } = useMoniteurs();
  const { getById: getVehiculeById, currentVehicule, detailLoading: vehiculeLoading } = useVehicules();

  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = React.useState(false);

  // Chargement de la leçon
  React.useEffect(() => {
    if (!leconId || isNaN(leconId)) {
      toast.error('Identifiant de leçon invalide');
      navigate(PROTECTED_ROUTES.PLANNING.CALENDAR);
      return;
    }
    const load = async () => {
      try {
        await getById(leconId);
      } catch {
        toast.error('Leçon introuvable');
        navigate(PROTECTED_ROUTES.PLANNING.CALENDAR);
      }
    };
    load();
    return () => resetCurrentLecon();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leconId]);

  // Chargement des entités associées
  React.useEffect(() => {
    if (currentLecon?.candidatId) getCandidatById(currentLecon.candidatId);
    if (currentLecon?.moniteurId) getMoniteurById(currentLecon.moniteurId);
    if (currentLecon?.vehiculeId) getVehiculeById(currentLecon.vehiculeId);
  }, [currentLecon, getCandidatById, getMoniteurById, getVehiculeById]);

  const isLoading = detailLoading || candidatLoading || moniteurLoading || vehiculeLoading || isRefreshing;
  const lecon = currentLecon;
  const typeCfg = lecon ? TYPE_LECON_CONFIG[lecon.type] : null;
  const statutCfg = lecon ? STATUT_LECON_CONFIG[lecon.statut] : null;

  const handleUpdateStatus = async (statut: string) => {
    if (!lecon) return;
    setIsRefreshing(true);
    try {
      await update(lecon.id, { statut });
      toast.success(`Leçon marquée comme ${statutCfg?.label?.toLowerCase()}`);
      await getById(lecon.id);
    } catch (err) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsRefreshing(false);
      setStatusDialogOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!lecon) return;
    setIsRefreshing(true);
    try {
      await deleteLecon(lecon.id);
      toast.success('Leçon supprimée');
      navigate(PROTECTED_ROUTES.PLANNING.CALENDAR);
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsRefreshing(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleEdit = () => {
    if (lecon) navigate(route(PROTECTED_ROUTES.PLANNING.EDIT(lecon.id), { id: lecon.id }));
  };

  if (isLoading && !lecon) {
    return (
      <div className="px-4 sm:px-6 py-6 pb-12 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-28 rounded-full" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!lecon) return <></>;

  const dateObj = new Date(lecon.date);
  const endTime = new Date(dateObj.getTime() + lecon.duree * 60000);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="px-4 sm:px-6 py-6 pb-12 space-y-6">
        {/* Barre de navigation */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 rounded-full text-muted-foreground hover:text-foreground"
            onClick={() => navigate(PROTECTED_ROUTES.PLANNING.CALENDAR)}
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au planning
          </Button>
          <PageBreadcrumb className="hidden lg:flex" />
        </div>

        {/* En-tête avec infos principales */}
        <div className="rounded-2xl border bg-card p-5 md:p-6 space-y-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                {typeCfg && (
                  <Badge variant="outline" className="gap-1">
                    {typeCfg.icon && <typeCfg.icon className="h-3 w-3" />}
                    {typeCfg.label}
                  </Badge>
                )}
                {statutCfg && (
                  <Badge className={getStatutColor(lecon.statut)}>
                    {statutCfg.icon && <statutCfg.icon className="h-3 w-3 mr-1" />}
                    {statutCfg.label}
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {format(dateObj, 'EEEE d MMMM yyyy', { locale: fr })}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {format(dateObj, 'HH:mm')} – {format(endTime, 'HH:mm')}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  Durée : {formatDuration(lecon.duree)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-1.5" />
                    Modifier
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Modifier la leçon</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Supprimer
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Supprimer la leçon</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {lecon.notes && (
            <>
              <Separator />
              <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                <div className="flex items-center gap-1.5 mb-1">
                  <FileText className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Notes
                  </span>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">{lecon.notes}</p>
              </div>
            </>
          )}
        </div>

        {/* Grille 3 colonnes : Candidat, Moniteur, Véhicule */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Candidat */}
          <InfoCard title="Candidat" icon={User}>
            {currentCandidat ? (
              <>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border">
                    <AvatarImage src={getAvatarUrl(`${currentCandidat.prenom} ${currentCandidat.nom}`)} />
                    <AvatarFallback className="bg-blue-700 text-white text-sm">
                      {currentCandidat.prenom?.[0]}{currentCandidat.nom?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{currentCandidat.prenom} {currentCandidat.nom}</p>
                    <p className="text-xs text-muted-foreground">{currentCandidat.categorie}</p>
                  </div>
                </div>
                <InfoRow label="Email" value={currentCandidat.email} icon={User} />
                <InfoRow label="Téléphone" value={currentCandidat.telephone} icon={User} />
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-xs"
                  onClick={() => navigate(PROTECTED_ROUTES.CANDIDATS.DETAIL(currentCandidat.id))}
                >
                  Voir la fiche candidat
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Candidat non trouvé</p>
            )}
          </InfoCard>

          {/* Moniteur */}
          <InfoCard title="Moniteur" icon={Users}>
            {currentMoniteur ? (
              <>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border">
                    <AvatarImage src={getAvatarUrl(`${currentMoniteur.prenom} ${currentMoniteur.nom}`)} />
                    <AvatarFallback className="bg-blue-700 text-white text-sm">
                      {currentMoniteur.prenom?.[0]}{currentMoniteur.nom?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{currentMoniteur.prenom} {currentMoniteur.nom}</p>
                    <p className="text-xs text-muted-foreground">{currentMoniteur.specialite || 'Moniteur'}</p>
                  </div>
                </div>
                <InfoRow label="Email" value={currentMoniteur.email} icon={Users} />
                <InfoRow label="Téléphone" value={currentMoniteur.telephone} icon={Users} />
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-xs"
                  onClick={() => navigate(PROTECTED_ROUTES.MONITEURS.DETAIL(currentMoniteur.id))}
                >
                  Voir la fiche moniteur
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Moniteur non trouvé</p>
            )}
          </InfoCard>

          {/* Véhicule */}
          <InfoCard title="Véhicule" icon={Car}>
            {currentVehicule ? (
              <>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border">
                    <AvatarImage src={`/images/brand/${currentVehicule.marque.toLowerCase()}.png`} />
                    <AvatarFallback className="bg-blue-700 text-white text-sm">
                      {currentVehicule.marque[0]}{currentVehicule.modele[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{currentVehicule.marque} {currentVehicule.modele}</p>
                    <p className="text-xs font-mono text-muted-foreground">{currentVehicule.immatriculation}</p>
                  </div>
                </div>
                <InfoRow label="Kilométrage" value={`${currentVehicule.kilometrage.toLocaleString('fr-FR')} km`} icon={Car} />
                <InfoRow label="Statut" value={currentVehicule.statut} icon={Car} />
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-xs"
                  onClick={() => navigate(PROTECTED_ROUTES.VEHICULES.DETAIL(currentVehicule.id))}
                >
                  Voir la fiche véhicule
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun véhicule associé</p>
            )}
          </InfoCard>
        </div>

        {/* Actions de changement de statut */}
        {lecon.statut === 'PLANIFIEE' && (
          <div className="flex flex-wrap gap-3 justify-center pt-4">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
              onClick={() => handleUpdateStatus('EFFECTUEE')}
            >
              <CheckCircle className="h-4 w-4" />
              Marquer effectuée
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-amber-600 border-amber-200 hover:bg-amber-50"
              onClick={() => handleUpdateStatus('ABSENCE')}
            >
              <AlertCircle className="h-4 w-4" />
              Signaler absence
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => handleUpdateStatus('ANNULEE')}
            >
              <XCircle className="h-4 w-4" />
              Annuler
            </Button>
          </div>
        )}

        {/* Dialogues de confirmation */}
        <ErrorDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Confirmation de suppression"
          message="Êtes-vous sûr de vouloir supprimer définitivement cette leçon ? Cette action est irréversible."
          closeText="Annuler"
          actionText="Supprimer"
          onAction={handleDelete}
        />
      </div>
    </TooltipProvider>
  );
}