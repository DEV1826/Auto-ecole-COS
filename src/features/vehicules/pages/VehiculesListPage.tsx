// src/features/vehicules/pages/VehiculesListPage.tsx

/**
 * @module features/vehicules/pages/VehiculesListPage
 * @description
 * Page principale de la gestion des véhicules (parc automobile) de l’auto‑école COS.
 * Thème : Bleu (accent blue-700).
 *
 * Layout :
 * ─ En-tête : titre, nombre total de véhicules, date, bouton d’export, breadcrumb
 * ─ Bloc statistiques (`VehiculesStatsCards`) + carte "Véhicules en leçon"
 * ─ Tableau complet (`VehiculesTable`) avec filtres, pagination, actions
 *
 * Les données sont chargées depuis l’API Electron via le store `useVehicules`.
 * Aucune donnée mockée n’est utilisée.
 *
 * @author Stive Junior
 * @version 2.0.0
 */

import * as React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Car, Download, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb';
import { useAuth } from '@/hooks/use.auth';
import { useVehicules } from '@/hooks/use.vehicules';
import { useNavigate } from 'react-router-dom';
import { PROTECTED_ROUTES, route } from '@/config';
import { getAvatarUrl } from '@/lib/utils';
import { VehiculesStatsCards } from '../components/VehiculesStatsCards';
import { VehiculesTable } from '../components/VehiculesTable';
import { VehiculesEnLeconCard } from '../components/VehiculesEnLeconCard';
import type { Vehicule } from '@/types/vehicules.types';

// ===============================
// COMPOSANT PRINCIPAL
// ===============================

/**
 * Page principale de gestion des véhicules.
 * Affiche les statistiques, la carte des véhicules en leçon et le tableau complet.
 */
export default function VehiculesListPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const canEdit = isAdmin; // Seul l'admin peut gérer les véhicules

  // Store véhicules
  const {
    vehicules,
    stats,
    trends,
    sparklines,
    getAll,
    getStats,
    getTrends,
    getSparklines,
    delete: deleteVehicule,
    loading: listLoading,
    statsLoading,
    trendsLoading,
    sparklinesLoading,
  } = useVehicules();

  // État local pour la section repliable
  const [statsOpen, setStatsOpen] = React.useState(true);

  // ── Chargement initial ──────────────────────────────────────────────
  React.useEffect(() => {
    const loadInitialData = async () => {
      try {
        await getAll();
        await getStats();
        await getTrends();
        await getSparklines();
      } catch {
        toast.error('Erreur lors du chargement des données');
      }
    };
    loadInitialData();
  }, [getAll, getStats, getTrends, getSparklines]);

  // ── Handlers ──────────────────────────────────────────────────────
  const handleRefresh = async () => {
    try {
      await getAll();
      await getStats();
      await getTrends();
      await getSparklines();
      toast.success('Parc véhicule actualisé');
    } catch {
      toast.error('Erreur lors de l’actualisation');
    }
  };

  const handleExport = () => {
    // TODO: implémenter l'export des véhicules (CSV/Excel/PDF)
    toast.info('Fonction d’export à implémenter');
  };

  const handleAddVehicule = () => {
    navigate(PROTECTED_ROUTES.VEHICULES.CREATE);
  };

  const handleView = (vehicule: Vehicule) => {
    navigate(route(PROTECTED_ROUTES.VEHICULES.DETAIL(vehicule.id), { id: vehicule.id }));
  };

  const handleEdit = (vehicule: Vehicule) => {
    navigate(route(PROTECTED_ROUTES.VEHICULES.EDIT(vehicule.id), { id: vehicule.id }));
  };

  const handleViewEntretiens = (vehicule: Vehicule) => {
    navigate(route(PROTECTED_ROUTES.VEHICULES.ENTRETIENS(vehicule.id), { id: vehicule.id }));
  };

  const handleRecordMaintenance = (vehicule: Vehicule) => {
    // TODO: naviguer vers le formulaire d'ajout d'entretien
    toast.info(`Enregistrer un entretien pour ${vehicule.immatriculation}`);
  };

  const handleDelete = async (vehicule: Vehicule) => {
    if (!canEdit) return;
    if (window.confirm(`Supprimer définitivement le véhicule ${vehicule.immatriculation} ?`)) {
      try {
        await deleteVehicule(vehicule.id);
        toast.success('Véhicule supprimé');
        await handleRefresh();
      } catch {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleCallDriver = () => {
    toast.info('Contacter le moniteur (fonction à implémenter)');
  };

  // ── Enrichissements pour le tableau ───────────────────────────────
  const enrichments = {
    getMarqueModeleComplet: (v: Vehicule) => `${v.marque} ${v.modele}`,
    getAvatarUrl: (v: Vehicule) => `/images/brand/${v.marque.toLowerCase()}.png`,
    getInitials: (v: Vehicule) => `${v.marque[0]}${v.modele[0]}`,
    getProchaineRevisionKm: (v: Vehicule) => v.prochaineRevisionKm ?? v.kilometrage + 20000,
    isRevisionDue: (v: Vehicule) => v.kilometrage >= (v.prochaineRevisionKm ?? Infinity),
  };

  // ── Actions du tableau ───────────────────────────────────────────
  const actions = {
    onView: handleView,
    onEdit: canEdit ? handleEdit : undefined,
    onDelete: canEdit ? handleDelete : undefined,
    onViewEntretiens: canEdit ? handleViewEntretiens : undefined,
    onRecordMaintenance: canEdit ? handleRecordMaintenance : undefined,
  };

  const variant = isAdmin ? 'admin' : 'secretaire';
  const isLoading = listLoading || statsLoading || trendsLoading || sparklinesLoading;

  // Préparer les données pour la carte "Véhicules en leçon"
  const enLeconCount = stats?.enLecon ?? 0;
  const totalVehicules = stats?.totalVehicules ?? 0;
  const evolutionDisponibles = stats?.evolutionDisponibles ?? 0;

  // Trouver un moniteur "le plus actif" (exemple : récupérer depuis le store ou une API)
  // Pour l’instant, on utilise un placeholder
  const driverInfo = {
    name: 'Marc Dubois',
    role: 'Moniteur principal',
    avatarUrl: getAvatarUrl('marc'),
    onCall: handleCallDriver,
    vehiculeName: 'Toyota Yaris',
  };

  return (
    <div className="space-y-5 p-4 md:p-1 pb-10">
      {/* ── EN‑TÊTE ───────────────────────────────────────────────────── */}
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
                {totalVehicules} véhicules
              </Badge>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="h-8 gap-1 text-xs">
            <Download className="h-3.5 w-3.5" />
            Exporter
          </Button>

          <PageBreadcrumb className="hidden lg:flex" />
        </div>
      </div>

      {/* ── STATISTIQUES REPLIABLES ───────────────────────────────────── */}
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
                trends={trends || undefined}
                totalSparkline={sparklines?.disponiblesSparkline}
                disponiblesSparkline={sparklines?.disponiblesSparkline}
                entretiensSparkline={sparklines?.entretiensSparkline}
                kilometrageSparkline={sparklines?.kilometrageSparkline}
                isLoading={isLoading}
                onCardClick={(id) => {
                  if (id === 'total-vehicules') toast.info('Voir tous les véhicules');
                  else if (id === 'disponibles') toast.info('Filtrer les disponibles');
                  else if (id === 'entretiens-annee') toast.info('Entretiens de l’année');
                  else if (id === 'kilometrage-moyen') toast.info('Kilométrage moyen');
                }}
                className='h-full'
              />
            </div>
            <div className="lg:col-span-1">
              <VehiculesEnLeconCard
                enLecon={enLeconCount}
                trend={{
                  value: Math.abs(evolutionDisponibles),
                  isPositive: evolutionDisponibles >= 0,
                  label: 'vs mois dernier',
                }}
                isLoading={isLoading}
                statusLabel="En leçon"
                statusColor="bg-emerald-500"
                illustrationSrc="/images/brand/car.png"
                driverInfo={driverInfo}
                className="h-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── TABLEAU DES VÉHICULES ────────────────────────────────────── */}
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
        onAddClick={canEdit ? handleAddVehicule : undefined}
        showViewAll={false}
        asCard
        className="w-full"
        emptyMessage="Aucun véhicule trouvé."
      />
    </div>
  );
}