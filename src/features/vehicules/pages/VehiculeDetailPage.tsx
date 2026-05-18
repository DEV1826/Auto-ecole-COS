// src/features/vehicules/pages/VehiculeDetailPage.tsx

/**
 * @module features/vehicules/pages/VehiculeDetailPage
 * @description
 * Fiche détaillée d’un véhicule du parc automobile.
 * Thème : Bleu (accent blue-700).
 *
 * ## Architecture visuelle
 * ```
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  Bouton retour · Breadcrumb                                     │
 * ├─────────────────────────────────────────────────────────────────┤
 * │  ILLUSTRATION (image selon catégorie)  │  EN-TÊTE INFORMATIONS │
 * │  (A.png, B.png, etc.)                  │  Immatriculation · Marque/Modèle
 * │                                       │  Catégorie · Kilométrage
 * │                                       │  Statut (badge) · Acquisition
 * ├─────────────────────────────────────────────────────────────────┤
 * │  STATISTIQUES (3 cartes) : Kilométrage total, Entretiens année, Coût entretiens │
 * ├─────────────────────────────────────────────────────────────────┤
 * │  TABS ANIMÉS (cursor switcher) : Leçons | Dépenses | Entretiens │
 * │  ┌─────────────────────────────────────────────────────────────┐│
 * │  │  Tableau selon l’onglet (LeconsTable / DepensesTable / Tableau entretiens) │
 * │  └─────────────────────────────────────────────────────────────┘│
 * └─────────────────────────────────────────────────────────────────┘
 * ```
 *
 * Les données sont chargées depuis l’API Electron via le store `useVehicules`.
 * Aucune donnée mockée n’est utilisée.
 *
 * @author Stive Junior
 * @version 2.0.0
 */

import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Car,
  Gauge,
  Calendar,
  Wrench,
  Fuel,
  TrendingUp,
  AlertCircle,
  Coins,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { cn, formatCurrency } from '@/lib/utils';

import { PROTECTED_ROUTES, route } from '@/config/routes';
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb';
import { CATEGORIE_PERMIS_CONFIG, STATUT_VEHICULE_CONFIG, type CategoriePermis, type StatutVehicule } from '@/types/enums';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsGrid, type StatsCardProps } from '@/features/dashboard/components/common/StatsCard';
import { LeconsTable } from '@/features/planning/components/LeconsTable';
import { DepensesTable } from '@/features/depenses/components/DepensesTable';
import { useVehicules } from '@/hooks/use.vehicules';
import { useDepenses } from '@/hooks/use.depenses';
import { usePlanning } from '@/hooks/use.planning';
import type { Lecon } from '@/types/planning.types';
import type { Depense } from '@/types/depenses.types';
import type { Entretien } from '@/types/vehicules.types';

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
  { id: 'lecons', label: 'Leçons', icon: Car },
  { id: 'depenses', label: 'Dépenses', icon: Fuel },
  { id: 'entretiens', label: 'Entretiens', icon: Wrench },
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
        layoutId="vehicule-tab-cursor"
        className="absolute top-1/2 -translate-y-1/2 rounded-md bg-blue-600/80 shadow-md"
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
            <span className="sm:hidden">{tab.id === 'lecons' ? 'Leçons' : tab.id === 'depenses' ? 'Dépenses' : 'Entretiens'}</span>
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
    <div className="relative flex h-full min-h-60 w-full flex-col items-center justify-center rounded-xl bg-linear-to-br from-blue-50 to-blue-100 p-6 dark:from-blue-950/40 dark:to-blue-900/20">
      {!imgError ? (
        <img
          src={imagePath}
          alt={`Illustration ${categorie}`}
          className="object-contain"
          onError={() => setImgError(true)}
        />
      ) : (
        <Car className="h-16 w-16 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
      )}
      <p className="mt-4 text-center text-sm font-medium text-blue-700 dark:text-blue-300">
        Permis {CATEGORIE_PERMIS_CONFIG[categorie]?.label || categorie}
      </p>
      <p className="text-xs text-muted-foreground">Véhicule de l’auto‑école</p>
      <Badge
        variant="outline"
        className="absolute bottom-3 right-3 border-blue-200 bg-white/80 text-blue-700 dark:bg-black/50"
      >
        Certifié
      </Badge>
    </div>
  );
}


function EntretiensTable({ entretiens, isLoading }: { entretiens: Entretien[]; isLoading: boolean }) {
  if (isLoading) {
    return <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  }
  if (entretiens.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">Aucun entretien enregistré pour ce véhicule.</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50">
          <tr>
            <th className="text-left p-2">Date</th>
            <th className="text-left p-2">Type</th>
            <th className="text-left p-2">Description</th>
            <th className="text-right p-2">Kilométrage</th>
            <th className="text-right p-2">Coût</th>
            <th className="text-right p-2">Prochain km</th>
          </tr>
        </thead>
        <tbody>
          {entretiens.map((e) => (
            <tr key={e.id} className="border-b">
              <td className="p-2">{format(new Date(e.date), 'dd/MM/yyyy')}</td>
              <td className="p-2 font-medium">{e.type}</td>
              <td className="p-2 text-muted-foreground">{e.description || '—'}</td>
              <td className="p-2 text-right">{e.kilometre?.toLocaleString('fr-FR') || '—'} km</td>
              <td className="p-2 text-right">{e.cout ? formatCurrency(e.cout) : '—'}</td>
              <td className="p-2 text-right">{e.prochainKm?.toLocaleString('fr-FR') || '—'} km</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Page de détail d’un véhicule.
 * Charge les données réelles depuis l’API et affiche les onglets.
 */
export default function VehiculeDetailPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const vehiculeId = Number(id);

  const {
    currentVehicule,
    detailLoading,
    getById,
    resetCurrentVehicule,
    getEntretiensByVehicule,
    entretiensLoading,
  } = useVehicules();

  const { getByVehicule: getDepensesByVehicule, depensesByVehiculeLoading } = useDepenses();
  const { getByVehicule: getLeconsByVehicule, isBusy: leconsByVehiculeLoading } = usePlanning();

  const [activeTab, setActiveTab] = React.useState('lecons');
  const [entretiens, setEntretiens] = React.useState<Entretien[]>([]);
  const [depenses, setDepenses] = React.useState<Depense[]>([]);
  const [lecons, setLecons] = React.useState<Lecon[]>([]);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Chargement initial
  React.useEffect(() => {
    if (!vehiculeId || isNaN(vehiculeId)) {
      toast.error('Identifiant véhicule invalide');
      navigate(PROTECTED_ROUTES.VEHICULES.LIST);
      return;
    }

    const loadVehicule = async () => {
      try {
        await getById(vehiculeId);
      } catch {
        toast.error('Véhicule introuvable');
        navigate(PROTECTED_ROUTES.VEHICULES.LIST);
      }
    };
    loadVehicule();

    return () => {
      resetCurrentVehicule();
    };
  }, [vehiculeId, getById, navigate, resetCurrentVehicule]);

  // Chargement des relations
  React.useEffect(() => {
    if (!currentVehicule) return;
    const loadRelations = async () => {
      try {
        const [ent, dep, lec] = await Promise.all([
          getEntretiensByVehicule(currentVehicule.id),
          getDepensesByVehicule(currentVehicule.id),
          getLeconsByVehicule(currentVehicule.id),
        ]);
        setEntretiens(ent);
        setDepenses(dep);
        setLecons(lec);
      } catch (err) {
        console.error('Erreur chargement relations:', err);
      }
    };
    loadRelations();
  }, [currentVehicule, getEntretiensByVehicule, getDepensesByVehicule, getLeconsByVehicule]);

  const handleRefresh = async () => {
    if (!currentVehicule) return;
    setIsRefreshing(true);
    try {
      await Promise.all([
        getById(currentVehicule.id),
        getEntretiensByVehicule(currentVehicule.id),
        getDepensesByVehicule(currentVehicule.id),
        getLeconsByVehicule(currentVehicule.id),
      ]);
    } catch {
      toast.error('Erreur lors du rafraîchissement');
    } finally {
      setIsRefreshing(false);
    }
  };

  // État de chargement global
  const isLoading = detailLoading || entretiensLoading || depensesByVehiculeLoading || leconsByVehiculeLoading || isRefreshing;

  // Squelette principal
  if (detailLoading && !currentVehicule) {
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

  if (!currentVehicule) return <></>;

  const {
    immatriculation,
    marque,
    modele,
    annee,
    categorie,
    kilometrage,
    dateAcquisition,
    dateDerniereRevision,
    prochaineRevisionKm,
    statut,
  } = currentVehicule;

  const statutCfg = STATUT_VEHICULE_CONFIG[statut as StatutVehicule];
  const categorieCfg = CATEGORIE_PERMIS_CONFIG[categorie];

  // Calcul des statistiques
  const totalEntretiens = entretiens.length;
  const coutEntretiensTotal = entretiens.reduce((sum, e) => sum + (e.cout || 0), 0);
  const totalDepenses = depenses.reduce((sum, d) => sum + d.montant, 0);

  const statsCards: StatsCardProps[] = [
    {
      id: 'kilometrage-total',
      title: 'Kilométrage total',
      value: `${kilometrage.toLocaleString('fr-FR')} km`,
      icon: <Gauge className="h-5 w-5" />,
      Color: 'blue-600',
      description: 'Depuis l’acquisition',
    },
    {
      id: 'entretiens-annee',
      title: 'Entretiens (total)',
      value: totalEntretiens,
      icon: <Wrench className="h-5 w-5" />,
      Color: 'amber-600',
      description: 'Interventions enregistrées',
    },
    {
      id: 'cout-entretiens',
      title: 'Coût des entretiens',
      value: formatCurrency(coutEntretiensTotal),
      icon: <TrendingUp className="h-5 w-5" />,
      Color: 'emerald-600',
      description: 'Dépenses totales',
    },
    {
      id: 'depenses-total',
      title: 'Dépenses totales',
      value: formatCurrency(totalDepenses),
      icon: <Coins className="h-5 w-5" />,
      Color: 'red-600',
      description: 'Toutes dépenses confondues',
    },
  ];

  // Enrichissements pour les tableaux
  const depensesEnrichments = {
    getVehiculeLibelle: () => `${marque} ${modele} (${immatriculation})`,
    getVehiculeImmatriculation: () => immatriculation,
  };

  const leconsEnrichments = {
    getCandidatNomComplet: (l: Lecon) => l.candidat ? `${l.candidat.prenom} ${l.candidat.nom}` : `Candidat ${l.candidatId}`,
    getMoniteurNomComplet: (l: Lecon) => l.moniteur ? `${l.moniteur.prenom} ${l.moniteur.nom}` : `Moniteur ${l.moniteurId}`,
    getVehiculeImmatriculation: () => immatriculation,
    getVehiculeLibelle: () => `${marque} ${modele}`,
  };

  const leconsActions = {
    onView: (lecon: Lecon) => navigate(route(PROTECTED_ROUTES.PLANNING.DETAIL(lecon.id), { id: lecon.id })),
  };

  const depensesActions = {
    onView: (depense: Depense) => navigate(route(PROTECTED_ROUTES.DEPENSES.DETAIL(depense.id), { id: depense.id })),
  };

  return (
    <div className="px-4 sm:px-6 py-6 pb-12 space-y-6">
      {/* Bouton retour + breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 rounded-full text-muted-foreground hover:text-foreground"
          onClick={() => navigate(PROTECTED_ROUTES.VEHICULES.LIST)}
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la liste
        </Button>
        <PageBreadcrumb
          className="hidden lg:flex"
          resolveDynamicLabel={async (param, id) => {
            if (param === 'id') return currentVehicule?.immatriculation || 'Détails';
            return id;
          }}
        />
      </div>

      {/* En-tête principal : illustration + infos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <CarIllustration categorie={categorie} />

        <div className="rounded-md border bg-card p-5 md:p-6 space-y-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {marque} {modele}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <Badge variant="outline" className="gap-1 text-xs font-mono">
                  {immatriculation}
                </Badge>
                {statutCfg && (
                  <Badge className={cn('gap-1 text-xs border-0', statutCfg.bgColor, statutCfg.textColor)}>
                    {statutCfg.icon && <statutCfg.icon className="h-3 w-3 mr-1" />}
                    {statutCfg.label}
                  </Badge>
                )}
                <Badge variant="outline" className="gap-1 text-xs">
                  {categorieCfg?.icon && <categorieCfg.icon className="h-3 w-3" />}
                  Cat. {categorie}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-stats font-bold text-blue-700 dark:text-blue-400">
                {annee}
              </div>
              <p className="text-xs text-muted-foreground">Année modèle</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{kilometrage.toLocaleString('fr-FR')} km</p>
                <p className="text-xs text-muted-foreground">Kilométrage actuel</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {dateAcquisition ? format(new Date(dateAcquisition), 'dd/MM/yyyy') : '—'}
                </p>
                <p className="text-xs text-muted-foreground">Date d’acquisition</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {dateDerniereRevision ? format(new Date(dateDerniereRevision), 'dd/MM/yyyy') : '—'}
                </p>
                <p className="text-xs text-muted-foreground">Dernière révision</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {prochaineRevisionKm ? `${prochaineRevisionKm.toLocaleString('fr-FR')} km` : '—'}
                </p>
                <p className="text-xs text-muted-foreground">Prochaine révision</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Cartes statistiques */}
          <StatsGrid cards={statsCards} cols={2} isLoading={isLoading} classGrid="h-auto" />
        </div>
      </div>

      {/* Onglets animés */}
      <div className="space-y-4">
        <div className="flex justify-center">
          <AnimatedTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        <div className="transition-all duration-200">
          {activeTab === 'lecons' && (
            <Card className="shadow-sm rounded-md">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Leçons associées</CardTitle>
              </CardHeader>
              <CardContent>
                <LeconsTable
                  lecons={lecons}
                  isLoading={isLoading}
                  actions={leconsActions}
                  enrichments={leconsEnrichments}
                  variant="admin"
                  enablePagination
                  defaultPageSize={10}
                  onRefresh={handleRefresh}
                  title={`Leçons du véhicule ${immatriculation}`}
                  asCard={false}
                  emptyMessage="Aucune leçon n’utilise ce véhicule pour l’instant."
                />
              </CardContent>
            </Card>
          )}

          {activeTab === 'depenses' && (
            <Card className="shadow-sm rounded-md">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Dépenses liées</CardTitle>
              </CardHeader>
              <CardContent>
                <DepensesTable
                  depenses={depenses}
                  variant="admin"
                  enrichments={depensesEnrichments}
                  actions={depensesActions}
                  enablePagination
                  defaultPeriodFilter="all"
                  defaultPageSize={10}
                  onRefresh={handleRefresh}
                  isLoading={isLoading}
                  title={`Dépenses du véhicule ${immatriculation}`}
                  asCard={false}
                  emptyMessage="Aucune dépense enregistrée pour ce véhicule."
                />
              </CardContent>
            </Card>
          )}

          {activeTab === 'entretiens' && (
            <Card className="shadow-sm rounded-md">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Historique des entretiens</CardTitle>
              </CardHeader>
              <CardContent>
                <EntretiensTable entretiens={entretiens} isLoading={isLoading} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}