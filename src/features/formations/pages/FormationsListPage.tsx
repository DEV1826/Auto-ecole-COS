// src/features/formations/pages/FormationsListPage.tsx

/**
 * @module features/formations/pages/FormationsListPage
 * @description
 * Page principale de la gestion des formations (offres pédagogiques) de l’auto‑école COS.
 * Thème : Indigo (accent indigo-700).
 *
 * Layout :
 * ─ En-tête : titre, nombre total de formations, date, bouton d’export, breadcrumb
 * ─ Bloc statistiques (`FormationsStatsCards`) — repliable
 * ─ Tableau complet (`FormationsTable`) avec filtres, pagination, actions
 *
 * Données mockées (à remplacer par des appels API réels).
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @example
 * ```tsx
 * <FormationsListPage />
 * ```
 */

import * as React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { GraduationCap, PlusCircle, Download, } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormationsStatsCards } from '../components/FormationsStatsCards';
import { FormationsTable } from '../components/FormationsTable';
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb';
import { useAuth } from '@/hooks/use.auth';
import type { Formation } from '@/types/formations.types';
import type { FormationsStats, FormationsTrends } from '@/types/formations.types';
import { useNavigate } from 'react-router-dom';
import { PROTECTED_ROUTES, route } from '@/config';
import { FormationTrendChart } from '../components/FormationTrendChart';

// ============================================================
// Données mockées (à remplacer par des appels API réels)
// ============================================================

/**
 * Génère une liste aléatoire de formations.
 */
function generateMockFormations(count: number = 8): Formation[] {
  const noms = [
    'Permis B (Voiture)',
    'Permis A (Moto)',
    'Permis C (Poids lourd)',
    'Permis D (Transport en commun)',
    'Permis BE (Remorque)',
    'Conduite accompagnée',
    'Stage de récupération de points',
    'Formation accélérée (3 mois)',
  ];
  const categories = ['A', 'B', 'C', 'D', 'BE'] as const;
  const now = new Date();

  const formations: Formation[] = [];

  for (let i = 1; i <= Math.min(count, noms.length); i++) {
    const actif = Math.random() > 0.3;
    const prixTotal = [180000, 220000, 250000, 280000, 310000, 350000][Math.floor(Math.random() * 6)];
    const heuresCode = [8, 10, 12, 15][Math.floor(Math.random() * 4)];
    const heuresConduite = [12, 15, 20, 25, 30][Math.floor(Math.random() * 5)];
    const createdAt = new Date(now);
    createdAt.setMonth(now.getMonth() - Math.floor(Math.random() * 12));

    formations.push({
      id: i,
      nom: noms[i - 1],
      description: `Formation complète pour l’obtention du ${noms[i - 1]}.`,
      prixTotal,
      heuresCode,
      heuresConduite,
      categorie: categories[i % categories.length],
      actif,
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
    });
  }
  return formations;
}

/**
 * Calcule les statistiques agrégées à partir de la liste des formations.
 */
function computeStats(formations: Formation[]): FormationsStats {
  const totalFormations = formations.length;
  const formationsActives = formations.filter((f) => f.actif).length;
  const prixMoyen = formationsActives > 0
    ? Math.round(formations.filter((f) => f.actif).reduce((s, f) => s + f.prixTotal, 0) / formationsActives)
    : 0;
  const dureeMoyenneConduite = formationsActives > 0
    ? Math.round(formations.filter((f) => f.actif).reduce((s, f) => s + f.heuresConduite, 0) / formationsActives)
    : 0;
  // Simuler des inscriptions (mockées)
  const totalInscriptions = Math.floor(Math.random() * 200) + 50;
  const inscriptionsMois = Math.floor(Math.random() * 15) + 2;

  return {
    totalFormations,
    formationsActives,
    prixMoyen,
    dureeMoyenneConduite,
    totalInscriptions,
    inscriptionsMois,
  };
}

/**
 * Génère des tendances fictives (évolution).
 */
function generateMockTrends(): Partial<FormationsTrends> {
  return {
    formationsActives: 0,
    prixMoyen: 2.5,
    totalInscriptions: 8,
    inscriptionsMois: -3,
  };
}

/**
 * Génère des sparklines pour les statistiques.
 */
function generateMockSparklines() {
  return {
    formationsActivesSparkline: {
      values: [3, 3, 4, 4, 4, 4, 4],
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil'],
    },
    prixMoyenSparkline: {
      values: [210000, 215000, 220000, 225000, 230000, 240000, 245000],
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil'],
    },
    totalInscriptionsSparkline: {
      values: [98, 105, 112, 118, 122, 125, 128],
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil'],
    },
    inscriptionsMoisSparkline: {
      values: [8, 10, 11, 12, 9, 14, 12],
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil'],
    },
  };
}

// ============================================================
// Page principale
// ============================================================

export default function FormationsListPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isSecretaire = user?.role === 'SECRETAIRE';
  const canEdit = isAdmin || isSecretaire;

  // Données mockées
  const [formations, setFormations] = React.useState<Formation[]>(() => generateMockFormations(8));
  const [stats, setStats] = React.useState<FormationsStats>(() => computeStats(formations));
  const [trends] = React.useState(() => generateMockTrends());
  const [isLoading, setIsLoading] = React.useState(false);

  const sparklines = generateMockSparklines();

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    const fresh = generateMockFormations(8);
    setFormations(fresh);
    setStats(computeStats(fresh));
    setIsLoading(false);
    toast.success('Formations actualisées');
  };

  const handleExport = () => {
    toast.success('Export des formations (simulé)');
  };

  const handleAddFormation = () => {
    toast.info('Formulaire d’ajout de formation (à connecter)');
  };

  const handleView = (formation: Formation) => {
    navigate(route(PROTECTED_ROUTES.FORMATIONS.DETAIL(formation.id), { id: formation.id }));
  };

  const handleEdit = (formation: Formation) => {
    toast.info(`Modifier la formation : ${formation.nom}`);
  };

  const handleToggleActive = async (formation: Formation) => {
    await new Promise((r) => setTimeout(r, 600));
    setFormations((prev) =>
      prev.map((f) => (f.id === formation.id ? { ...f, actif: !f.actif } : f))
    );
    setStats(computeStats(formations.map((f) => (f.id === formation.id ? { ...f, actif: !f.actif } : f))));
    toast.success(`Formation ${formation.actif ? 'désactivée' : 'activée'}`);
  };

  const handleViewTarifs = (formation: Formation) => {
    toast.info(`Historique des tarifs pour ${formation.nom}`);
  };

  // ── Actions du tableau ───────────────────────────────────────────────────
  const actions = {
    onView: handleView,
    onEdit: canEdit ? handleEdit : undefined,
    onToggleActive: isAdmin ? handleToggleActive : undefined,
    onViewTarifs: isAdmin ? handleViewTarifs : undefined,
  };

  // Enrichissements (formatage des heures)
  const enrichments = {
    getDureeFormatee: (f: Formation) => `${f.heuresCode}h code / ${f.heuresConduite}h conduite`,
    getNbInscriptions: (f: Formation) => Math.floor(Math.random() * 50) + 10, // Mocké
  };

  const variant = isAdmin ? 'admin' : 'secretaire';

  return (
    <div className="space-y-5 p-4 md:p-1 pb-10">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-12 rounded-md bg-indigo-700 text-white shadow-sm shrink-0">
            <GraduationCap className="size-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Formations</h1>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <span className="capitalize">
                {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
              </span>
              <span>·</span>
              <Badge
                variant="outline"
                className="text-[10px] h-4 px-1.5 border-0 bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
              >
                {stats.totalFormations} formations
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



      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-2">
        <div className="lg:col-span-2">

          <FormationsStatsCards
            stats={stats}
            trends={trends}
            formationsActivesSparkline={sparklines.formationsActivesSparkline}
            prixMoyenSparkline={sparklines.prixMoyenSparkline}
            totalInscriptionsSparkline={sparklines.totalInscriptionsSparkline}
            inscriptionsMoisSparkline={sparklines.inscriptionsMoisSparkline}
            isLoading={isLoading}
            className='h-full'
            onCardClick={(id) => {
              if (id === 'formations-actives') toast.info('Voir les formations actives');
              else if (id === 'prix-moyen') toast.info('Prix moyen des formations');
              else if (id === 'total-inscriptions') toast.info('Total des inscriptions');
              else if (id === 'inscriptions-mois') toast.info('Inscriptions du mois');
            }}
          />
        </div>
        <div className="lg:col-span-1">
          <FormationTrendChart
            data={[
              { name: 'Permis B', inscriptions: 45, trend: 12 },
              { name: 'Permis A', inscriptions: 32, trend: 5 },
              { name: 'Permis C', inscriptions: 24, trend: -2 },
              { name: 'Permis D', inscriptions: 18, trend: 8 },
              { name: 'Conduite accompagnée', inscriptions: 15, trend: 3 },
            ]}
            totalLabel="Inscriptions totales"
            totalValue={134}
            globalTrend={{ value: 8.5, isPositive: true, label: 'vs mois dernier' }}

            title="Popularité des formations"
            description="Classement par nombre d'inscriptions"
          />
        </div>
      </div>

      {/* Tableau des formations */}
      <FormationsTable
        formations={formations}
        variant={variant}
        enrichments={enrichments}
        actions={actions}
        enablePagination
        enableToolbar
        defaultPageSize={10}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        title="Catalogue des formations"
        description="Gérez les offres pédagogiques proposées"
        showAddButton={canEdit}
        onAddClick={handleAddFormation}
        showViewAll={false}
        asCard
        className="w-full"
        emptyMessage="Aucune formation trouvée."
      />
    </div>
  );
}