// src/features/caisse/pages/CaisseIndexPage.tsx

/**
 * @module features/caisse/pages/CaisseIndexPage
 * @description
 * Page principale du relevé de caisse – affiche les mouvements de trésorerie,
 * les indicateurs clés et l’historique complet.
 * Thème : Bleu (accent blue-700).
 *
 * Layout :
 * ─ En-tête : titre, nombre total de mouvements, date, bouton d’export, breadcrumb
 * ─ Bloc supérieur : 2 colonnes (2/3 – statistiques, 1/3 – mouvements récents)
 * ─ En dessous : tableau complet (`CaisseTable`) avec filtres, période, pagination
 *
 * Données mockées (à remplacer par des appels API réels).
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @example
 * ```tsx
 * <CaisseIndexPage />
 * ```
 */

import * as React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Wallet, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb';
import { CaisseStatsCards } from '../components/CaisseStatsCards';
import { CaisseMouvementsRecentCard } from '../../dashboard/components/admin/CaisseMouvementsRecentCard';
import { useAuth } from '@/hooks/use.auth';
import type { MouvementCaisse, CaisseStats, CaisseTrends } from '@/types/caisse.types';
import { CaisseTable } from '../components';
import { FinanceOverviewCard } from '@/features/dashboard/components/admin/FinanceOverviewCard';

// ============================================================
// Données mockées (à remplacer par des appels API réels)
// ============================================================


/**
 * Génère une liste aléatoire de mouvements de caisse.
 */
function generateMockMouvements(count: number = 120): MouvementCaisse[] {
  const descriptions = [
    'Inscription candidat', 'Acompte permis B', 'Solde formation', 'Carburant véhicule',
    'Entretien véhicule', 'Paiement moniteur', 'Fournitures bureau', 'Location salle',
    'Examen code', 'Examen conduite', 'Remboursement', 'Assurance véhicule',
  ];
  const types: ('ENTREE' | 'SORTIE')[] = ['ENTREE', 'SORTIE'];
  const now = new Date();
  const mouvements: MouvementCaisse[] = [];

  let soldeCourant = 250000; // solde initial fictif

  for (let i = 1; i <= count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const montant = type === 'ENTREE'
      ? [25000, 50000, 75000, 100000, 150000][Math.floor(Math.random() * 5)]
      : [10000, 15000, 25000, 50000, 80000][Math.floor(Math.random() * 5)];
    soldeCourant += type === 'ENTREE' ? montant : -montant;
    const date = new Date(now);
    date.setDate(now.getDate() - Math.floor(Math.random() * 90));
    date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

    mouvements.push({
      id: i,
      type,
      montant,
      solde: soldeCourant,
      description: `${descriptions[i % descriptions.length]} ${type === 'ENTREE' ? '+ ' : '- '}${montant} FCFA`,
      reference: type === 'ENTREE' ? `PAY-${String(i).padStart(4, '0')}` : `DEP-${String(i).padStart(4, '0')}`,
      date: date.toISOString(),
      createdAt: date.toISOString(),
    });
  }

  // Trier par date décroissante (plus récent en premier)
  mouvements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return mouvements;
}

/**
 * Calcule les statistiques agrégées à partir des mouvements.
 */
function computeStats(mouvements: MouvementCaisse[]): CaisseStats {
  const totalEntrees = mouvements.filter(m => m.type === 'ENTREE').reduce((s, m) => s + m.montant, 0);
  const totalSorties = mouvements.filter(m => m.type === 'SORTIE').reduce((s, m) => s + m.montant, 0);
  const soldeActuel = mouvements.length > 0 ? mouvements[0].solde : 0;
  const maintenant = new Date();
  const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
  const mouvementsMois = mouvements.filter(m => new Date(m.date) >= debutMois);
  const entreesMois = mouvementsMois.filter(m => m.type === 'ENTREE').reduce((s, m) => s + m.montant, 0);
  const sortiesMois = mouvementsMois.filter(m => m.type === 'SORTIE').reduce((s, m) => s + m.montant, 0);

  return {
    soldeActuel,
    totalEntrees,
    totalSorties,
    nombreMouvements: mouvements.length,
    entreesMois,
    sortiesMois,
  };
}

/**
 * Génère des tendances fictives pour les cartes.
 */
function generateMockTrends(): CaisseTrends {
  return {
    soldeActuel: 8.5,
    totalEntrees: 12,
    totalSorties: -3,
    entreesMois: 5.2,
    sortiesMois: 7.4,
  };
}

/**
 * Génère les données de sparkline pour le solde sur les 6 derniers mois.
 */
function generateMockSparkline() {
  return {
    soldeSparkline: {
      values: [185000, 192000, 210000, 225000, 240000, 258000, 275000],
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil'],
    },
    entreesMoisSparkline: {
      values: [210000, 235000, 280000, 310000, 295000, 320000, 340000],
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil'],
    },
    sortiesMoisSparkline: {
      values: [175000, 190000, 205000, 195000, 210000, 225000, 240000],
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil'],
    },
  };
}

// ============================================================
// Page principale
// ============================================================

export default function CaisseIndexPage(): React.JSX.Element {
  const { user } = useAuth();
  const role = user?.role;
  const isAdmin = role === 'ADMIN';

  // Données mockées
  const [mouvements, setMouvements] = React.useState<MouvementCaisse[]>(() => generateMockMouvements(120));
  const [stats, setStats] = React.useState<CaisseStats>(() => computeStats(mouvements));
  const [trends] = React.useState(() => generateMockTrends());
  const [isLoading, setIsLoading] = React.useState(false);
  const sparklines = generateMockSparkline();

  // ── Entrées du jour (mock) ──────────────────────────────────────────────
  const entreesJour = mouvements.filter(
    (m) => m.type === 'ENTREE' && new Date(m.date).toDateString() === new Date().toDateString()
  ).reduce((sum, m) => sum + m.montant, 0);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    const fresh = generateMockMouvements(120);
    setMouvements(fresh);
    setStats(computeStats(fresh));
    setIsLoading(false);
    toast.success('Relevé de caisse actualisé');
  };

  const handleExport = () => {
    toast.success('Export du relevé de caisse (simulé)');
  };

  const handleViewMouvement = (m: MouvementCaisse) => {
    toast.info(`Détail du mouvement ${m.id} : ${m.description}`);
  };

  const handleViewAll = () => {
    toast.info('Navigation vers la liste complète (déjà sur la page)');
  };

  const variant = isAdmin ? 'admin' : 'secretaire';

  return (
    <div className="space-y-6 p-4 md:p-1 pb-10">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-12 rounded-md bg-blue-700 text-white shadow-sm shrink-0">
            <Wallet className="size-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Relevé de caisse</h1>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <span className="capitalize">
                {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
              </span>
              <span>·</span>
              <Badge
                variant="outline"
                className="text-[10px] h-4 px-1.5 border-0 bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
              >
                {stats.nombreMouvements} mouvements
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

      {/* Bloc supérieur : statistiques (2/3) + mouvements récents (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2">
          <CaisseStatsCards
            stats={stats}
            trends={trends}
            soldeSparkline={sparklines.soldeSparkline}
            entreesMoisSparkline={sparklines.entreesMoisSparkline}
            sortiesMoisSparkline={sparklines.sortiesMoisSparkline}
            isLoading={isLoading}
            cols={2}
            onCardClick={(id) => {
              if (id === 'solde-actuel') toast.info('Solde actuel');
              else if (id === 'entrees-mois') toast.info('Filtrer les entrées du mois');
              else if (id === 'sorties-mois') toast.info('Filtrer les sorties du mois');
              else if (id === 'solde-net') toast.info('Solde net du mois');
            }}
            className='h-full'
          />
        </div>
        <div className="lg:col-span-1">


          <FinanceOverviewCard
            caisseStats={stats}
            caisseTrends={trends}
            entreesJour={entreesJour}
            periode="mois"
            isLoading={false}
            className="col-span-12 xl:col-span-7"
          />
        </div>
      </div>

      {/* Tableau complet des mouvements */}
      <CaisseTable
        mouvements={mouvements}
        variant={variant}
        actions={{
          onView: handleViewMouvement,
          onPrint: (m) => toast.info(`Impression du mouvement ${m.id}`),
        }}
        defaultPeriodFilter="month"
        showPeriodFilter
        enablePagination
        enableToolbar
        defaultPageSize={20}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        title="Historique"
        description="Liste de tous les mouvements de caisse (entrées / sorties)"
        asCard
        className="w-full"
        emptyMessage="Aucun mouvement de caisse trouvé."
      />
    </div>
  );
}