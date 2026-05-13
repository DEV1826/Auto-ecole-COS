// src/features/moniteurs/pages/MoniteursListPage.tsx

/**
 * @module features/moniteurs/pages/MoniteursListPage
 * @description
 * Page principale de la gestion des moniteurs (instructeurs) de l’auto‑école COS.
 * Thème : Bleu (accent blue-700).
 *
 * Layout :
 * ─ En-tête : titre, nombre total de moniteurs, date, bouton d’export, breadcrumb
 * ─ Bloc statistiques (`MoniteursStatsCards`) — repliable
 * ─ Tableau complet (`MoniteursTable`) avec filtres, pagination, actions
 *
 * Données mockées (à remplacer par des appels API réels).
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @example
 * ```tsx
 * <MoniteursListPage />
 * ```
 */

import * as React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Users, PlusCircle, Download, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoniteursStatsCards } from '../components/MoniteursStatsCards';
import { MoniteursTable } from '../components/MoniteursTable';
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb';
import { useAuth } from '@/hooks/use.auth';
import type { Moniteur } from '@/types/moniteurs.types';
import type { MoniteursStats, MoniteursTrends } from '@/types/moniteurs.types';
import { useNavigate } from 'react-router-dom';
import { PROTECTED_ROUTES, route } from '@/config';
import { getAvatarUrl } from '@/lib';
import { MoniteursResumeCard } from '../components';

// ============================================================
// Données mockées (à remplacer par des appels API réels)
// ============================================================

/**
 * Génère une liste aléatoire de moniteurs.
 */
function generateMockMoniteurs(count: number = 12): Moniteur[] {
  const prenoms = ['Marc', 'Sophie', 'Jean', 'Marie', 'Pierre', 'Catherine', 'Paul', 'Anne', 'David', 'Julie'];
  const noms = ['Dubois', 'Martin', 'Durand', 'Lefevre', 'Moreau', 'Simon', 'Laurent', 'Michel', 'Garcia', 'Bernard'];
  const specialitesList = [
    'Permis B', 'Permis A (Moto)', 'Permis C (Poids lourd)', 'Permis D (Transport)',
    'Conduite accompagnée', 'Formation code', 'Remorque (BE)', 'Permis B + Accompagnée'
  ];
  const now = new Date();

  const moniteurs: Moniteur[] = [];

  for (let i = 1; i <= count; i++) {
    const actif = Math.random() > 0.2;
    const dateEmbauche = new Date(now);
    dateEmbauche.setFullYear(now.getFullYear() - Math.floor(Math.random() * 10) - 1);
    dateEmbauche.setMonth(Math.floor(Math.random() * 12));
    const leconsCount = Math.floor(Math.random() * 200) + 20;
    // Simuler des leçons (pas nécessaire pour le tableau, mais enrichissement)
    const lecons = Array.from({ length: leconsCount }, (_, idx) => ({
      id: idx,
      date: new Date(),
      duree: 60,
      type: 'CONDUITE' as const,
      statut: 'EFFECTUEE' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      candidatId: 1,
      moniteurId: i,
    }));

    moniteurs.push({
      id: i,
      nom: noms[i % noms.length],
      prenom: prenoms[i % prenoms.length],
      email: `${prenoms[i % prenoms.length].toLowerCase()}.${noms[i % noms.length].toLowerCase()}@cos.com`,
      telephone: `69${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
      specialite: specialitesList[Math.floor(Math.random() * specialitesList.length)],
      dateEmbauche: dateEmbauche.toISOString(),
      actif,
      createdAt: dateEmbauche.toISOString(),
      updatedAt: now.toISOString(),
      lecons,
    });
  }
  return moniteurs;
}

/**
 * Calcule les statistiques agrégées à partir de la liste des moniteurs.
 */
function computeStats(moniteurs: Moniteur[]): MoniteursStats {
  const totalMoniteurs = moniteurs.length;
  const actifs = moniteurs.filter((m) => m.actif).length;
  const inactifs = totalMoniteurs - actifs;
  // Simuler les heures de leçons (basé sur des leçons mockées)
  const totalHeuresLeçons = moniteurs.reduce((acc, m) => {
    const heures = (m.lecons?.length ?? 0) * 1.5; // 1.5h par leçon en moyenne
    return acc + heures;
  }, 0);
  const moyenneHeuresParMoniteur = actifs > 0 ? totalHeuresLeçons / actifs : 0;

  return {
    totalMoniteurs,
    actifs,
    inactifs,
    totalHeuresLeçons,
    moyenneHeuresParMoniteur,
  };
}

/**
 * Génère des tendances fictives (évolution).
 */
function generateMockTrends(): Partial<MoniteursTrends> {
  return {
    totalMoniteurs: 2,
    actifs: 1,
    totalHeuresLeçons: 8.5,
  };
}

/**
 * Génère des sparklines pour les statistiques (optionnel).
 */
function generateMockSparklines() {
  return {
    totalMoniteursSparkline: {
      values: [6, 7, 8, 9, 10, 11, 12],
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil'],
    },
    actifsSparkline: {
      values: [5, 5, 6, 7, 8, 9, 9],
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil'],
    },
    totalHeuresSparkline: {
      values: [980, 1020, 1050, 1100, 1150, 1180, 1240],
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil'],
    },
    moyenneHeuresSparkline: {
      values: [145, 160, 175, 185, 195, 205, 215],
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil'],
    },
  };
}

// ============================================================
// Page principale
// ============================================================

export default function MoniteursListPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isSecretaire = user?.role === 'SECRETAIRE';
  const canEdit = isAdmin || isSecretaire;

  // Données mockées
  const [moniteurs, setMoniteurs] = React.useState<Moniteur[]>(() => generateMockMoniteurs(12));
  const [stats, setStats] = React.useState<MoniteursStats>(() => computeStats(moniteurs));
  const [trends] = React.useState(() => generateMockTrends());
  const [isLoading, setIsLoading] = React.useState(false);

  const sparklines = generateMockSparklines();

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    const fresh = generateMockMoniteurs(12);
    setMoniteurs(fresh);
    setStats(computeStats(fresh));
    setIsLoading(false);
    toast.success('Moniteurs actualisés');
  };

  const handleExport = () => {
    toast.success('Export des moniteurs (simulé)');
  };

  const handleAddMoniteur = () => {
    toast.info('Formulaire d’ajout de moniteur (à connecter)');
  };

  const handleView = (moniteur: Moniteur) => {
    navigate(route(PROTECTED_ROUTES.MONITEURS.DETAIL(moniteur.id), { id: moniteur.id }));
  };

  const handleEdit = (moniteur: Moniteur) => {
    toast.info(`Modifier le moniteur : ${moniteur.prenom} ${moniteur.nom}`);
  };

  const handleViewPlanning = (moniteur: Moniteur) => {
    toast.info(`Planning du moniteur ${moniteur.prenom} ${moniteur.nom}`);
  };

  const handleDelete = async (moniteur: Moniteur) => {
    toast.info(`Désactivation du moniteur ${moniteur.prenom} ${moniteur.nom}`);
  };

  // ── Enrichissements pour le tableau ───────────────────────────────────────
  const enrichments = {
    getAvatarUrl: (m: Moniteur) => getAvatarUrl(`${m.prenom} ${m.nom}`),
    getInitials: (m: Moniteur) => `${m.prenom?.[0]}${m.nom?.[0]}`.toUpperCase(),
    getLeconsCount: (m: Moniteur) => m.lecons?.length ?? 0,
    getHeuresTotales: (m: Moniteur) => (m.lecons?.length ?? 0) * 1.5,
  };

  // ── Actions du tableau ───────────────────────────────────────────────────
  const actions = {
    onView: handleView,
    onEdit: canEdit ? handleEdit : undefined,
    onDelete: isAdmin ? handleDelete : undefined,
    onViewPlanning: handleViewPlanning,
  };

  const variant = isAdmin ? 'admin' : 'secretaire';

  return (
    <div className="space-y-5 p-4 md:p-1 pb-10">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-12 rounded-md bg-blue-700 text-white shadow-sm shrink-0">
            <Users className="size-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Moniteurs</h1>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <span className="capitalize">
                {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
              </span>
              <span>·</span>
              <Badge
                variant="outline"
                className="text-[10px] h-4 px-1.5 border-0 bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
              >
                {stats.totalMoniteurs} moniteurs
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



      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-5">
        <div className="lg:col-span-2">

          <MoniteursStatsCards
            stats={stats}
            trends={trends}
            totalMoniteursSparkline={sparklines.totalMoniteursSparkline}
            actifsSparkline={sparklines.actifsSparkline}
            totalHeuresSparkline={sparklines.totalHeuresSparkline}
            moyenneHeuresSparkline={sparklines.moyenneHeuresSparkline}
            isLoading={isLoading}
            onCardClick={(id) => {
              if (id === 'total-moniteurs') toast.info('Voir tous les moniteurs');
              else if (id === 'moniteurs-actifs') toast.info('Filtrer les actifs');
              else if (id === 'total-heures-lecons') toast.info('Total des heures de leçons');
              else if (id === 'moyenne-heures') toast.info('Moyenne d’heures par moniteur');
            }}
          />
        </div>
        <div className="lg:col-span-1">
          <MoniteursResumeCard
            moniteurs={moniteurs}
            trend={{ value: 8.5, isPositive: true, label: 'vs mois dernier' }}
            onMoniteurClick={(m) => navigate(`/moniteurs/${m.id}`)}
          />
        </div>
      </div>

      {/* Tableau des moniteurs */}
      <MoniteursTable
        moniteurs={moniteurs}
        variant={variant}
        enrichments={enrichments}
        actions={actions}
        enablePagination
        enableToolbar
        maxItems={5}
        defaultPageSize={5}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        title="Liste des moniteurs"
        description="Gérez l’équipe pédagogique de l’auto‑école"
        showAddButton={canEdit}
        onAddClick={handleAddMoniteur}

        showViewAll={false}
        asCard
        className="w-full"
        emptyMessage="Aucun moniteur trouvé."
      />
    </div >
  );
}