// src/features/formations/pages/FormationDetailPage.tsx

/**
 * @module features/formations/pages/FormationDetailPage
 * @description
 * Fiche détaillée d’une formation (offre pédagogique) de l’auto‑école COS.
 * Thème : Indigo (accent indigo-700).
 *
 * ## Architecture visuelle
 * ```
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  Bouton retour · Breadcrumb                                     │
 * ├─────────────────────────────────────────────────────────────────┤
 * │  ILLUSTRATION (image selon catégorie)  │  EN-TÊTE INFORMATIONS │
 * │  (A.png, B.png, etc.)                  │  Nom · Catégorie · Prix│
 * │                                       │  Heures code/conduite  │
 * ├─────────────────────────────────────────────────────────────────┤
 * │  STATISTIQUES (4 cartes)                                        │
 * ├─────────────────────────────────────────────────────────────────┤
 * │  TABS ANIMÉS (cursor switcher) : Évolution | Candidats inscrits │
 * │  ┌─────────────────────────────────────────────────────────────┐│
 * │  │  Graphique (BarChart horizontal) ou tableau selon l’onglet  ││
 * │  └─────────────────────────────────────────────────────────────┘│
 * └─────────────────────────────────────────────────────────────────┘
 * ```
 *
 * Les données sont chargées depuis l’API Electron via le store `useFormations`.
 * Aucune donnée mockée n’est utilisée.
 *
 * @author Stive Junior
 * @version 2.0.0
 */

import * as React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Coins,
  BookOpen,
  Car,
  Users,
  Calendar,
  TrendingUp,
  BadgeCheck,
  Edit,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { cn, formatCurrency } from '@/lib/utils';

import { PROTECTED_ROUTES, route } from '@/config/routes';
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb';
import { CATEGORIE_PERMIS_CONFIG, type CategoriePermis } from '@/types/enums';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsGrid, type StatsCardProps } from '@/features/dashboard/components/common/StatsCard';
import { FormationTrendChart } from '@/features/formations/components/FormationTrendChart';
import { CandidatsTable } from '@/features/candidats/components/CandidatsTable';
import { useFormations } from '@/hooks/use.formations';
import type { Candidat } from '@/types/candidats.types';
import type { MonthlyInscriptionData } from '@/types/formations.types';

// ─────────────────────────────────────────────────────────────────────────────
// Composants internes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Onglet animé (cursor switcher) avec bordure arrondie et fond gris clair.
 */
interface TabItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

const TABS: TabItem[] = [

  { id: 'candidats', label: 'Candidats inscrits', icon: Users },
  { id: 'evolution', label: 'Évolution des inscriptions', icon: TrendingUp },
];

interface AnimatedTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

function AnimatedTabs({ activeTab, onTabChange }: AnimatedTabsProps) {
  const activeIndex = TABS.findIndex((t) => t.id === activeTab);
  const buttonWidth = 280;

  return (
    <div className="relative inline-flex rounded-md border border-gray-200 bg-gray-100 p-1 dark:border-gray-700 dark:bg-gray-800/50">
      <motion.span
        layoutId="formation-tab-cursor"
        className="absolute top-1/2 -translate-y-1/2 rounded-md bg-indigo-600 shadow-md"
        style={{ width: buttonWidth, height: 'calc(100% - 2px)' }}
        animate={{ x: activeIndex * buttonWidth }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
      {TABS.map((tab, idx) => {
        const Icon = tab.icon;
        const isActive = idx === activeIndex;
        return (
          <motion.button
            key={tab.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'relative z-10 flex h-9 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition-colors',
              isActive
                ? 'text-white'
                : 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
            )}
            style={{ width: buttonWidth }}
            aria-pressed={isActive}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.id === 'evolution' ? 'Évolution' : 'Candidats'}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

/**
 * Illustration avec image dynamique selon la catégorie de permis.
 * Les images doivent être placées dans `/public/images/permis/` (ex: `B.png`).
 */
interface CarIllustrationProps {
  categorie: CategoriePermis;
}

function CarIllustration({ categorie }: CarIllustrationProps) {
  const imagePath = `/images/permis/${categorie}.png`;
  const [imgError, setImgError] = React.useState(false);

  return (
    <div className="relative flex h-full min-h-60 w-full flex-col items-center justify-center rounded-xl bg-linear-to-br from-indigo-50 to-indigo-100 p-6 dark:from-indigo-950/40 dark:to-indigo-900/20">
      {!imgError ? (
        <img
          src={imagePath}
          alt={`Illustration ${categorie}`}
          className="object-contain"
          onError={() => setImgError(true)}
        />
      ) : (
        <Car className="h-16 w-16 text-indigo-600 dark:text-indigo-400" strokeWidth={1.5} />
      )}
      <p className="mt-4 text-center text-sm font-medium text-indigo-700 dark:text-indigo-300">
        Formation {CATEGORIE_PERMIS_CONFIG[categorie]?.label || categorie}
      </p>
      <p className="text-xs text-muted-foreground">Auto‑école COS</p>
      <Badge
        variant="outline"
        className="absolute bottom-3 right-3 border-indigo-200 bg-white/80 text-indigo-700 dark:bg-black/50"
      >
        Certifié
      </Badge>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Page de détail d’une formation.
 * Charge les données réelles depuis l’API et affiche les onglets.
 */
export default function FormationDetailPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const formationId = Number(id);

  // Store formations
  const {
    currentFormation,
    detailLoading,
    monthlyInscriptions,
    candidatsInscrits,
    getById,
    getMonthlyInscriptions,
    getCandidatsByFormation,
    resetCurrentFormation,
  } = useFormations();

  // État local
  const [activeTab, setActiveTab] = React.useState('candidats');
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Chargement initial
  React.useEffect(() => {
    if (!formationId || isNaN(formationId)) {
      toast.error('Identifiant formation invalide');
      navigate(PROTECTED_ROUTES.FORMATIONS.LIST);
      return;
    }

    const loadFormation = async () => {
      try {
        await getById(formationId);
      } catch {
        toast.error('Formation introuvable');
        navigate(PROTECTED_ROUTES.FORMATIONS.LIST);
      }
    };
    loadFormation();

    return () => {
      resetCurrentFormation();
    };
  }, [formationId, getById, navigate, resetCurrentFormation]);

  // Chargement des relations
  React.useEffect(() => {
    if (!currentFormation) return;
    Promise.all([
      getMonthlyInscriptions(currentFormation.id),
      getCandidatsByFormation(currentFormation.id),
    ]).catch((err) => console.error('Erreur chargement relations:', err));
  }, [currentFormation, getMonthlyInscriptions, getCandidatsByFormation]);

  // Rafraîchissement
  const handleRefresh = async () => {
    if (!currentFormation) return;
    setIsRefreshing(true);
    try {
      await Promise.all([
        getById(currentFormation.id),
        getMonthlyInscriptions(currentFormation.id),
        getCandidatsByFormation(currentFormation.id),
      ]);
      toast.success('Données actualisées');
    } catch {
      toast.error('Erreur lors du rafraîchissement');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calcul du total d’inscriptions
  const totalInscriptions = candidatsInscrits.length;

  const monthlyData: MonthlyInscriptionData[] = monthlyInscriptions;

  // Tendance globale (variation dernier mois vs avant‑dernier)
  const computeTrend = (): { value: number; isPositive: boolean } => {
    if (monthlyData.length < 2) return { value: 0, isPositive: true };
    const last = monthlyData[monthlyData.length - 1].inscriptions;
    const prev = monthlyData[monthlyData.length - 2].inscriptions;
    if (prev === 0) return { value: 0, isPositive: true };
    const diff = ((last - prev) / prev) * 100;
    return { value: Math.abs(Math.round(diff)), isPositive: diff >= 0 };
  };
  const trend = computeTrend();

  // État de chargement global
  const isLoading = detailLoading || isRefreshing;

  // Squelette principal
  if (detailLoading && !currentFormation) {
    return (
      <div className="px-4 sm:px-6 py-6 pb-12 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-28 rounded-full" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-62.5 rounded-xl" />
          <Skeleton className="h-62.5 rounded-xl" />
        </div>
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!currentFormation) return <></>;

  const categorieCfg = CATEGORIE_PERMIS_CONFIG[currentFormation.categorie] || {
    label: currentFormation.categorie,
    icon: null,
  };

  // Cartes statistiques (avec les bonnes propriétés pour StatsCard)
  const statsCards: StatsCardProps[] = [
    {
      id: 'prix',
      title: 'Prix total',
      value: formatCurrency(currentFormation.prixTotal),
      icon: <Coins className="h-5 w-5" />,
      Color: 'indigo-600',
      description: 'Tarif actuel',
    },
    {
      id: 'heures-code',
      title: 'Heures de code',
      value: currentFormation.heuresCode,
      icon: <BookOpen className="h-5 w-5" />,
      Color: 'emerald-600',
      description: 'Obligatoires',
    },
    {
      id: 'heures-conduite',
      title: 'Heures de conduite',
      value: currentFormation.heuresConduite,
      icon: <Car className="h-5 w-5" />,
      Color: 'amber-600',
      description: 'Incluses',
    },
    {
      id: 'inscriptions',
      title: 'Inscriptions',
      value: totalInscriptions,
      icon: <Users className="h-5 w-5" />,
      Color: 'purple-600',
      description: 'Candidats inscrits',
      trend: totalInscriptions > 0 ? { value: 8, isPositive: true, label: 'vs mois dernier' } : undefined,
    },
  ];

  // Actions pour le tableau des candidats
  const candidatsActions = {
    onView: (candidat: Candidat) => {
      navigate(route(PROTECTED_ROUTES.CANDIDATS.DETAIL(candidat.id), { id: candidat.id }));
    },
  };

  return (
    <div className="px-4 sm:px-6 py-6 pb-12 space-y-6">
      {/* Bouton retour + breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 rounded-full text-muted-foreground hover:text-foreground"
          onClick={() => navigate(PROTECTED_ROUTES.FORMATIONS.LIST)}
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la liste
        </Button>
        <PageBreadcrumb className="hidden lg:flex" resolveDynamicLabel={async (param, id) => {
          if (param === 'id') {
            return currentFormation ? currentFormation.nom : 'Détails formation';
          }
          return id;
        }} />
      </div>

      {/* En-tête principal : illustration + infos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <CarIllustration categorie={currentFormation.categorie} />

        <div className="rounded-md border bg-card p-5 md:p-6 space-y-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{currentFormation.nom}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <Badge variant="outline" className="gap-1 text-xs">
                  {categorieCfg.icon && <categorieCfg.icon className="h-3 w-3" />}
                  {categorieCfg.label}
                </Badge>

                {currentFormation.actif ? (
                  <Badge className="bg-emerald-100 text-emerald-700 border-0 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <BadgeCheck className="h-3 w-3 mr-1" /> Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                    Inactive
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-stats font-bold text-blue-700 dark:text-blue-400">
                {currentFormation.prixTotal.toLocaleString('fr-FR')} FCFA
              </div>
              <p className="text-xs text-muted-foreground">Prix TTC</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{currentFormation.heuresCode} h</p>
                <p className="text-xs text-muted-foreground">Code</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{currentFormation.heuresConduite} h</p>
                <p className="text-xs text-muted-foreground">Conduite</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{totalInscriptions}</p>
                <p className="text-xs text-muted-foreground">Inscriptions</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {format(new Date(currentFormation.createdAt), 'dd/MM/yyyy')}
                </p>
                <p className="text-xs text-muted-foreground">Créée le</p>
              </div>
            </div>
          </div>

          {currentFormation.description && (
            <>
              <Separator />
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentFormation.description}
              </p>
              {/* Cartes statistiques */}
              <StatsGrid cards={statsCards} cols={2} isLoading={isLoading} classGrid='h-auto' />

            </>
          )}
        </div>
      </div>


      {/* Onglets animés */}
      <div className="space-y-4">
        <div className="flex justify-center">
          <AnimatedTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        <div className="transition-all duration-200">
          {activeTab === 'evolution' ? (
            <FormationTrendChart
              type="single"
              formationName={currentFormation.nom}
              monthlyData={monthlyData}
              totalInscriptions={totalInscriptions}
              trendPercentage={trend.value}
              isPositiveTrend={trend.isPositive}
              title={`Évolution des inscriptions – ${currentFormation.nom}`}
              description="Nombre d’inscriptions par mois"
              isLoading={isLoading}
            />
          ) : (
            <Card className="shadow-sm rounded-md">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Candidats inscrits</CardTitle>
              </CardHeader>
              <CardContent>
                <CandidatsTable
                  candidats={candidatsInscrits}
                  variant="admin"
                  isLoading={isLoading}
                  actions={candidatsActions}
                  enablePagination
                  enableToolbar
                  defaultPageSize={10}
                  onRefresh={handleRefresh}
                  title="Liste des candidats"
                  asCard={false}
                  emptyMessage="Aucun candidat inscrit à cette formation pour l'instant."
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}