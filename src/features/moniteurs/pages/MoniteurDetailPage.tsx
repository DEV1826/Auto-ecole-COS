// src/features/moniteurs/pages/MoniteurDetailPage.tsx

/**
 * @module features/moniteurs/pages/MoniteurDetailPage
 * @description
 * Fiche détaillée d’un moniteur (instructeur) de l’auto‑école COS.
 * Affiche toutes les informations personnelles, les statistiques,
 * et les onglets : leçons données, planning individuel.
 *
 * Thème : Bleu (accent blue-700).
 *
 * ## Architecture visuelle
 * ```
 * ┌─────────────────────────────────────────────────────────────┐
 * │  Bouton retour · Breadcrumb                                 │
 * ├─────────────────────────────────────────────────────────────┤
 * │  EN-TÊTE : Avatar · Nom complet · Statut · Spécialité · ... │
 * ├─────────────────────────────────────────────────────────────┤
 * │  Bloc statistiques (cartes de synthèse)                     │
 * ├─────────────────────────────────────────────────────────────┤
 * │  TABS : Leçons données | Planning individuel                │
 * │  ┌───────────────────────────────────────────────────────┐  │
 * │  │  Tableau des leçons (ou Calendrier visuel)            │  │
 * │  └───────────────────────────────────────────────────────┘  │
 * └─────────────────────────────────────────────────────────────┘
 * ```
 *
 * Les données sont chargées depuis l’API Electron via le store `useMoniteurs`.
 * Aucune donnée mockée n’est utilisée.
 *
 * @see {@link LeconsTable}
 * @see {@link MoniteursAvailabilityCalendar}
 * @see {@link useMoniteurs}
 *
 * @author Stive Junior
 * @version 2.0.0
 */

import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  Clock,
  Users,
  Award,
  PlusCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { PROTECTED_ROUTES, route } from '@/config/routes';
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb';
import { getAvatarUrl } from '@/lib/utils';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { StatsGrid } from '@/features/dashboard/components/common/StatsCard';

// Composants tableaux
import { LeconsTable } from '@/features/planning/components/LeconsTable';
import { MoniteursAvailabilityCalendar } from '../components/MoniteursAvailabilityCalendar';

import type { Lecon } from '@/types/planning.types';
import { useMoniteurs } from '@/hooks/use.moniteurs';
import { usePlanning } from '@/hooks/use.planning';

// ============================================================
// PAGE PRINCIPALE
// ============================================================

/**
 * Page de détail d’un moniteur.
 * Charge les données réelles depuis l’API et affiche les onglets.
 */
export default function MoniteurDetailPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const moniteurId = Number(id);

  // Store moniteurs
  const {
    currentMoniteur,
    detailLoading,
    detailError,
    getById,
    resetCurrentMoniteur,
  } = useMoniteurs();


  // État local pour l’onglet actif
  const [activeTab, setActiveTab] = React.useState('lecons');
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const { getByMoniteur } = usePlanning();
  const [lecons, setLecons] = React.useState<Lecon[]>([]);
  const [leconsLoading, setLeconsLoading] = React.useState(true);


  // Chargement des leçons du moniteur
  React.useEffect(() => {
    if (!currentMoniteur) return;
    const loadLecons = async () => {
      setLeconsLoading(true);
      try {
        const lessons = await getByMoniteur(currentMoniteur.id);
        setLecons(lessons);
      } catch (err) {
        console.error(err);
      } finally {
        setLeconsLoading(false);
      }
    };
    loadLecons();
  }, [currentMoniteur, getByMoniteur]);


  // Chargement initial du moniteur
  React.useEffect(() => {
    if (!moniteurId || isNaN(moniteurId)) {
      toast.error('Identifiant moniteur invalide');
      navigate(PROTECTED_ROUTES.MONITEURS.LIST);
      return;
    }

    const loadMoniteur = async () => {
      try {
        await getById(moniteurId);
      } catch {
        toast.error('Moniteur introuvable', {
          description: detailError || "Le moniteur n'existe pas ou a été désactivé.",
        });
        navigate(PROTECTED_ROUTES.MONITEURS.LIST);
      }
    };

    loadMoniteur();

    return () => {
      resetCurrentMoniteur();
    };
  }, [detailError, getById, moniteurId, navigate, resetCurrentMoniteur]);



  // Rafraîchissement manuel de toutes les données
  const handleRefresh = async () => {
    if (!currentMoniteur) return;
    setIsRefreshing(true);
    try {
      await getById(currentMoniteur.id);
      const lessons = await getByMoniteur(currentMoniteur.id);
      setLecons(lessons);
      toast.success('Données actualisées');
    } catch {
      toast.error('Erreur lors du rafraîchissement');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculs des statistiques

  const totalLecons = lecons.length;
  const leconsEffectuees = lecons.filter(l => l.statut === 'EFFECTUEE').length;
  const heuresTotales = lecons.reduce((acc, l) => acc + (l.duree / 60), 0);
  const tauxCompletion = totalLecons > 0 ? Math.round((leconsEffectuees / totalLecons) * 100) : 0;

  // État de chargement global
  const isLoading = detailLoading || leconsLoading || isRefreshing;

  if (detailLoading && !currentMoniteur) {
    return (
      <div className="px-4 sm:px-6 py-6 pb-12 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-28 rounded-full" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="rounded-2xl border bg-card p-5 md:p-6 space-y-5">
          <div className="flex flex-col md:flex-row gap-5">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentMoniteur) return <></>;

  const statutActif = currentMoniteur.actif;
  const specialite = currentMoniteur.specialite || 'Moniteur polyvalent';
  const dateEmbauche = currentMoniteur.dateEmbauche
    ? format(new Date(currentMoniteur.dateEmbauche), 'd MMMM yyyy', { locale: fr })
    : 'Date non renseignée';

  // Configuration des cartes de statistiques
  const statsCards = [
    {
      id: 'total-lecons',
      title: 'Total leçons',
      value: totalLecons,
      icon: <BookOpen className="h-4 w-4" />,
      Color: 'blue-600',
      iconColor: 'text-blue-600',
      description: 'Toutes leçons confondues',
    },
    {
      id: 'heures',
      title: 'Heures de conduite',
      value: `${heuresTotales.toFixed(0)} h`,
      icon: <Clock className="h-4 w-4" />,
      Color: 'emerald-600',
      description: 'Cumul depuis l’embauche',
    },
    {
      id: 'taux-completion',
      title: 'Taux de réalisation',
      value: `${tauxCompletion}%`,
      icon: <Award className="h-4 w-4" />,
      Color: 'amber-600',
      description: 'Leçons effectuées / planifiées',
    },
    {
      id: 'lecons-mois',
      title: 'Leçons ce mois',
      value: lecons?.filter((l: Lecon) => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return new Date(l.date) >= startOfMonth;
      }).length ?? 0,
      icon: <Calendar className="h-4 w-4" />,
      Color: 'purple-600',
      description: 'Mois en cours',
    },
  ];

  // Actions des tableaux (redirection vers le détail d’une leçon)
  const handleViewLecon = (lecon: Lecon) => {
    navigate(route(PROTECTED_ROUTES.PLANNING.DETAIL(lecon.id), { id: lecon.id }));
  };
  const handleEditLecon = (lecon: Lecon) => {
    navigate(route(PROTECTED_ROUTES.PLANNING.EDIT(lecon.id), { id: lecon.id }));
  };
  const handleCancelLecon = async (lecon: Lecon) => {
    // À implémenter via le store planning
    toast.info(`Annulation de la leçon #${lecon.id} – à connecter`);
  };
  const handleMarkDone = async (lecon: Lecon) => {
    toast.info(`Marquer comme effectuée – à connecter`);
  };
  const handleReportAbsence = async (lecon: Lecon) => {
    toast.info(`Signaler absence – à connecter`);
  };

  // Actions du tableau LeconsTable
  const leconsActions = {
    onView: handleViewLecon,
    onEdit: handleEditLecon,
    onCancel: handleCancelLecon,
    onMarkDone: handleMarkDone,
    onReportAbsence: handleReportAbsence,
  };

  // Enrichissements pour LeconsTable (données du moniteur courant)
  const leconsEnrichments = {
    getMoniteurNomComplet: () => `${currentMoniteur.prenom} ${currentMoniteur.nom}`,
    getMoniteurAvatarUrl: () => getAvatarUrl(`${currentMoniteur.prenom} ${currentMoniteur.nom}`),
    getMoniteurInitials: () => `${currentMoniteur.prenom?.[0]}${currentMoniteur.nom?.[0]}`,
    getCandidatNomComplet: (l: Lecon) =>
      l.candidat ? `${l.candidat.prenom} ${l.candidat.nom}` : `Candidat ${l.candidatId}`,
  };

  return (
    <div className="px-4 sm:px-6 py-6 pb-12 space-y-6">
      {/* Bouton retour + breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 rounded-full text-muted-foreground hover:text-foreground"
          onClick={() => navigate(PROTECTED_ROUTES.MONITEURS.LIST)}
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la liste
        </Button>
        <PageBreadcrumb className="hidden lg:flex" />
      </div>

      {/* En-tête principal */}
      <div className="rounded-2xl border bg-card p-5 md:p-6 space-y-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
          <Avatar className="h-20 w-20 border-4 border-blue-100 shadow-md rounded-full">
            <AvatarImage
              src={getAvatarUrl(`${currentMoniteur.prenom} ${currentMoniteur.nom}`)}
              alt={`${currentMoniteur.prenom} ${currentMoniteur.nom}`}
            />
            <AvatarFallback className="bg-blue-700 text-white text-xl font-bold">
              {currentMoniteur.prenom?.[0]}{currentMoniteur.nom?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">
                {currentMoniteur.prenom} {currentMoniteur.nom}
              </h1>
              {statutActif ? (
                <Badge className="bg-emerald-100 text-emerald-700 border-0 dark:bg-emerald-950/40 dark:text-emerald-300">
                  Actif
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                >
                  Inactif
                </Badge>
              )}
              {specialite && (
                <Badge variant="outline" className="gap-1 text-xs">
                  <Users className="h-3 w-3" />
                  {specialite}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {currentMoniteur.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  <span>{currentMoniteur.email}</span>
                </div>
              )}
              {currentMoniteur.telephone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{currentMoniteur.telephone}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Embauché le {dateEmbauche}</span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Statistiques */}
        <StatsGrid cards={statsCards} cols={4} isLoading={isLoading} className="" />
      </div>

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList
          variant="line"
          className="flex flex-wrap h-auto gap-1 bg-muted/30 p-1 rounded-lg"
        >
          <TabsTrigger value="lecons" className="rounded-md gap-1.5 text-xs">
            <BookOpen className="h-3.5 w-3.5" /> Leçons données
          </TabsTrigger>
          <TabsTrigger value="planning" className="rounded-md gap-1.5 text-xs">
            <Calendar className="h-3.5 w-3.5" /> Planning individuel
          </TabsTrigger>
        </TabsList>

        {/* Onglet : Leçons données (tableau) */}
        <TabsContent value="lecons" className="space-y-3">
          <div className="flex justify-end mb-3">
            <Button
              size="sm"
              onClick={() => navigate(PROTECTED_ROUTES.PLANNING.CREATE)}
              className="h-8 gap-1 text-xs bg-blue-700 hover:bg-blue-800"
            >
              <PlusCircle className="h-3.5 w-3.5" /> Planifier une leçon
            </Button>
          </div>
          <LeconsTable
            lecons={lecons ?? []}
            variant="admin"
            enrichments={leconsEnrichments}
            actions={leconsActions}
            enablePagination
            enableToolbar
            onRefresh={handleRefresh}
            defaultPageSize={10}
            title="Leçons données"
            description={`Toutes les leçons assurées par ${currentMoniteur.prenom} ${currentMoniteur.nom}`}
            asCard
          />
        </TabsContent>

        {/* Onglet : Planning individuel (calendrier visuel) */}
        <TabsContent value="planning" className="space-y-3">
          <MoniteursAvailabilityCalendar
            moniteurId={moniteurId}
            height={550}
            onRefresh={handleRefresh}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}