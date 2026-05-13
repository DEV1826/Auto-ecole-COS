// src/features/vehicules/pages/VehiculesListPage.tsx

/**
 * @module features/vehicules/pages/VehiculesListPage
 * @description
 * Page principale de la gestion des véhicules (parc automobile) de l’auto‑école COS.
 * Thème : Bleu (accent blue-700).
 *
 * Layout :
 * ─ En-tête : titre, nombre total de véhicules, date, bouton d’export, breadcrumb
 * ─ Bloc statistiques (`VehiculesStatsCards`) — repliable
 * ─ Tableau complet (`VehiculesTable`) avec filtres, pagination, actions
 *
 * Données mockées (à remplacer par des appels API réels).
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @example
 * ```tsx
 * <VehiculesListPage />
 * ```
 */

import * as React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Car, PlusCircle, Download, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VehiculesStatsCards } from '../components/VehiculesStatsCards';
import { VehiculesTable } from '../components/VehiculesTable';
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb';
import { useAuth } from '@/hooks/use.auth';
import type { Vehicule } from '@/types/vehicules.types';
import type { VehiculesStats, VehiculesTrends } from '@/types/vehicules.types';
import { useNavigate } from 'react-router-dom';
import { PROTECTED_ROUTES, route } from '@/config';
import { VehiculesEnLeconCard } from '../components';
import { getAvatarUrl } from '@/lib';


// ============================================================
// Données mockées (à remplacer par des appels API réels)
// ============================================================

/**
 * Génère une liste aléatoire de véhicules.
 */
function generateMockVehicules(count: number = 12): Vehicule[] {
  const marques = ['Toyota', 'Renault', 'Peugeot', 'Citroën', 'Volkswagen', 'Ford', 'Hyundai'];
  const modeles = ['Yaris', 'Clio', '308', 'C3', 'Golf', 'Fiesta', 'i10'];
  const categories = ['A', 'B', 'C', 'D', 'BE'] as const;
  const statuts = ['DISPONIBLE', 'EN_LECON', 'EN_ENTRETIEN', 'HORS_SERVICE'] as const;
  const now = new Date();

  const vehicules: Vehicule[] = [];

  for (let i = 1; i <= count; i++) {
    const marque = marques[i % marques.length];
    const modele = modeles[i % modeles.length];
    const annee = 2015 + Math.floor(Math.random() * 9);
    const kilometrage = 20000 + Math.floor(Math.random() * 80000);
    const statut = statuts[Math.floor(Math.random() * statuts.length)];
    const categorie = categories[Math.floor(Math.random() * categories.length)];
    const dateAcquisition = new Date(now);
    dateAcquisition.setFullYear(now.getFullYear() - Math.floor(Math.random() * 8) - 1);
    const dateDerniereRevision = new Date(now);
    dateDerniereRevision.setMonth(now.getMonth() - Math.floor(Math.random() * 12));
    const prochaineRevisionKm = kilometrage + (20000 + Math.random() * 10000);

    vehicules.push({
      id: i,
      immatriculation: `LT-${String(100 + i).slice(1)}-AB`,
      marque,
      modele,
      annee,
      categorie,
      kilometrage,
      dateAcquisition: dateAcquisition.toISOString(),
      dateDerniereRevision: dateDerniereRevision.toISOString(),
      prochaineRevisionKm: Math.floor(prochaineRevisionKm),
      statut,
      createdAt: dateAcquisition.toISOString(),
      updatedAt: now.toISOString(),
      lecons: [],
      entretiens: [],
      depenses: [],
    });
  }
  return vehicules;
}

/**
 * Calcule les statistiques agrégées à partir de la liste des véhicules.
 */
function computeStats(vehicules: Vehicule[]): VehiculesStats {
  const totalVehicules = vehicules.length;
  const disponibles = vehicules.filter((v) => v.statut === 'DISPONIBLE').length;
  const enLecon = vehicules.filter((v) => v.statut === 'EN_LECON').length;
  const kilometrageMoyen = Math.round(vehicules.reduce((s, v) => s + v.kilometrage, 0) / totalVehicules);


  return {
    totalVehicules,
    disponibles,
    enLecon,
    kilometrageMoyen,
  };
}

/**
 * Génère des tendances fictives (évolution).
 */
function generateMockTrends(): Partial<VehiculesTrends> {
  return {
    totalVehicules: 2,
    disponibles: -1,
    kilometrageMoyen: 4.5,
  };
}

/**
 * Génère des sparklines pour les statistiques (optionnel).
 */
function generateMockSparklines() {
  return {
    totalSparkline: {
      values: [10, 10, 11, 11, 12, 12, 12],
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil'],
    },
    disponiblesSparkline: {
      values: [6, 5, 5, 5, 5, 5, 5],
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil'],
    },
    enLeconSparkline: {
      values: [3, 3, 4, 4, 4, 4, 4],
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil'],
    },
    kilometrageSparkline: {
      values: [18500, 19500, 20500, 21500, 22500, 23500, 24500],
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil'],
    },
    entretiensSparkline: {
      values: [5, 8, 12, 15, 18, 20, 22],
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil'],
    },
  };
}

// ============================================================
// Page principale
// ============================================================

export default function VehiculesListPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const canEdit = isAdmin;

  // Données mockées
  const [vehicules, setVehicules] = React.useState<Vehicule[]>(() => generateMockVehicules(12));
  const [stats, setStats] = React.useState<VehiculesStats>(() => computeStats(vehicules));
  const [trends] = React.useState(() => generateMockTrends());
  const [isLoading, setIsLoading] = React.useState(false);
  const [statsOpen, setStatsOpen] = React.useState(true);

  const sparklines = generateMockSparklines();

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    const fresh = generateMockVehicules(12);
    setVehicules(fresh);
    setStats(computeStats(fresh));
    setIsLoading(false);
    toast.success('Parc véhicule actualisé');
  };

  const handleExport = () => {
    toast.success('Export des véhicules (simulé)');
  };

  const handleAddVehicule = () => {
    toast.info('Formulaire d’ajout de véhicule (à connecter)');
  };

  const handleView = (vehicule: Vehicule) => {
    navigate(route(PROTECTED_ROUTES.VEHICULES.DETAIL(vehicule.id), { id: vehicule.id }));
  };

  const handleEdit = (vehicule: Vehicule) => {
    toast.info(`Modifier le véhicule : ${vehicule.marque} ${vehicule.modele}`);
  };

  const handleViewEntretiens = (vehicule: Vehicule) => {
    toast.info(`Historique des entretiens du véhicule ${vehicule.immatriculation}`);
  };

  const handleRecordMaintenance = (vehicule: Vehicule) => {
    toast.info(`Enregistrer un entretien pour ${vehicule.immatriculation}`);
  };

  const handleDelete = async (vehicule: Vehicule) => {
    toast.info(`Désactivation du véhicule ${vehicule.immatriculation}`);
  };

  // ── Enrichissements pour le tableau ───────────────────────────────────────
  const enrichments = {
    getMarqueModeleComplet: (v: Vehicule) => `${v.marque} ${v.modele}`,
    getAvatarUrl: (v: Vehicule) => `/images/brand/${v.marque.toLowerCase()}.png`,
    getInitials: (v: Vehicule) => `${v.marque[0]}${v.modele[0]}`,
    getProchaineRevisionKm: (v: Vehicule) => v.prochaineRevisionKm ?? v.kilometrage + 20000,
    isRevisionDue: (v: Vehicule) => v.kilometrage >= (v.prochaineRevisionKm ?? Infinity),
  };

  // ── Actions du tableau ───────────────────────────────────────────────────
  const actions = {
    onView: handleView,
    onEdit: canEdit ? handleEdit : undefined,
    onDelete: canEdit ? handleDelete : undefined,
    onViewEntretiens: canEdit ? handleViewEntretiens : undefined,
    onRecordMaintenance: canEdit ? handleRecordMaintenance : undefined,
  };

  const variant = isAdmin ? 'admin' : 'secretaire';

  return (
    <div className="space-y-5 p-4 md:p-1 pb-10">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-12 rounded-md bg-blue-700 text-white shadow-sm shrink-0">
            <Car className="size-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Véhicules</h1>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <span className="capitalize">
                {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
              </span>
              <span>·</span>
              <Badge
                variant="outline"
                className="text-[10px] h-4 px-1.5 border-0 bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
              >
                {stats.totalVehicules} véhicules
              </Badge>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="h-8 gap-1 text-xs">
            <Download className="h-3.5 w-3.5" />
            Exporter
          </Button>
          <Button size="sm" onClick={handleAddVehicule} className="h-8 gap-1 text-xs bg-blue-700 hover:bg-blue-800">
            <PlusCircle className="h-3.5 w-3.5" />
            Ajouter
          </Button>
          <PageBreadcrumb className="hidden lg:flex" />
        </div>
      </div>

      {/* Statistiques repliables */}
      <div className="space-y-2">
        <button
          onClick={() => setStatsOpen((o) => !o)}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <BarChart3 className="h-4 w-4 text-blue-700" />
          Statistiques du parc
          {statsOpen ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
        {statsOpen && (

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-5">
            <div className="lg:col-span-2">
              <VehiculesStatsCards
                stats={stats}
                trends={trends}
                totalSparkline={sparklines.totalSparkline}
                disponiblesSparkline={sparklines.disponiblesSparkline}
                enLeconSparkline={sparklines.enLeconSparkline}
                kilometrageSparkline={sparklines.kilometrageSparkline}
                entretiensSparkline={sparklines.entretiensSparkline}
                isLoading={isLoading}
                onCardClick={(id) => {
                  if (id === 'total-vehicules') toast.info('Voir tous les véhicules');
                  else if (id === 'disponibles') toast.info('Filtrer les disponibles');
                  else if (id === 'en-lecon') toast.info('Véhicules en leçon');
                  else if (id === 'en-entretien') toast.info('Véhicules en entretien');
                  else if (id === 'hors-service') toast.info('Véhicules hors service');
                  else if (id === 'kilometrage-moyen') toast.info('Kilométrage moyen');
                  else if (id === 'entretiens-annee') toast.info('Entretiens de l’année');
                }}
              />
            </div>
            <div className="lg:col-span-1">
              <VehiculesEnLeconCard
                enLecon={stats.enLecon}
                total={stats.totalVehicules}
                trend={{ value: 2.5, isPositive: true, }}
                statusLabel="En leçon"
                statusColor="bg-emerald-500"
                illustrationSrc="/images/brand/car.png"
                className='h-full'
                driverInfo={{
                  name: "Marc Dubois",
                  role: "Moniteur permis B",
                  avatarUrl: getAvatarUrl("marc"),
                  onCall() {
                    toast.info('Voir le profil du moniteur Marc Dubois');
                  },
                  vehiculeName: 'Toyota'
                }}
              />

            </div>
          </div>
        )}
      </div>


      {/* Tableau des véhicules */}
      <VehiculesTable
        vehicules={vehicules}
        variant={variant}
        enrichments={enrichments}
        actions={actions}
        enablePagination
        enableToolbar
        defaultPageSize={10}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        title="Liste des véhicules"
        description="Gérez le parc automobile"
        showAddButton={canEdit}
        onAddClick={handleAddVehicule}
        showViewAll={false}
        asCard
        className="w-full"
        emptyMessage="Aucun véhicule trouvé."
      />
    </div>
  );
}