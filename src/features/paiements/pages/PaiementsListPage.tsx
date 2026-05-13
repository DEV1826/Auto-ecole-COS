/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/paiements/pages/PaiementsListPage.tsx

/**
 * @module features/paiements/pages/PaiementsListPage
 * @description
 * Page principale de la gestion des paiements (encaissements) de l’auto‑école COS.
 * Thème : Émeraude (accent emerald-700).
 *
 * Layout :
 * ─ En-tête : titre, nombre total de transactions, date, bouton d’export, breadcrumb
 * ─ Bloc supérieur : 2 colonnes (2/3 – statistiques, 1/3 – paiements récents)
 * ─ En dessous : tableau complet (`PaiementsTable`) avec filtres, période, pagination
 *
 * Données mockées (à remplacer par des appels API réels).
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @example
 * ```tsx
 * <PaiementsListPage />
 * ```
 */

import * as React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Receipt, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb';
import { PaiementsStatsCards } from '../components/PaiementsStatsCards';
import { PaiementsTable } from '../components/PaiementsTable';
import { PaiementsRecentCard } from '../components/PaiementsRecentCard';
import { useAuth } from '@/hooks/use.auth';
import type { Paiement, PaiementsStats, PaiementsTrends } from '@/types/paiements.types';
import { getAvatarUrl } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { PROTECTED_ROUTES } from '@/config';

// ============================================================
// Données mockées (à remplacer par des appels API réels)
// ============================================================

/**
 * Génère une liste aléatoire de paiements.
 */
export function generateMockPaiements(count: number = 80): Paiement[] {
  const modes = ['ESPECES', 'CHEQUE', 'VIREMENT', 'CARTE', 'MOBILE_MONEY'] as const;
  const candidatPrenoms = ['Jean', 'Marie', 'Charles', 'Catherine', 'Anne', 'Paul', 'Sophie'];
  const candidatNoms = ['Dupont', 'Mbarga', 'Ndong', 'Ewolo', 'Tchoffo', 'Ngono'];
  const now = new Date();

  const paiements: Paiement[] = [];

  for (let i = 1; i <= count; i++) {
    const mode = modes[Math.floor(Math.random() * modes.length)];
    const montant = [15000, 25000, 50000, 75000, 100000, 150000][Math.floor(Math.random() * 6)];
    const date = new Date(now);
    date.setDate(now.getDate() - Math.floor(Math.random() * 90));
    date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

    const candidatId = Math.floor(Math.random() * 50) + 1;
    const nomCandidat = candidatNoms[candidatId % candidatNoms.length];
    const prenomCandidat = candidatPrenoms[candidatId % candidatPrenoms.length];

    paiements.push({
      id: i,
      montant,
      date: date.toISOString(),
      mode,
      reference: mode === 'CHEQUE' ? `CHQ-${String(i).padStart(6, '0')}` : mode === 'MOBILE_MONEY' ? `MTN-${String(i).padStart(6, '0')}` : null,
      note: montant >= 100000 ? 'Solde formation' : montant <= 25000 ? 'Acompte' : undefined,
      createdAt: date.toISOString(),
      candidatId,
      factureId: Math.random() > 0.7 ? Math.floor(Math.random() * 100) + 1 : null,
      candidat: {
        id: candidatId,
        nom: nomCandidat,
        prenom: prenomCandidat,
        email: `${prenomCandidat.toLowerCase()}.${nomCandidat.toLowerCase()}@example.com`,
        telephone: `691${String(candidatId).padStart(6, '0')}`,
        dateNaissance: null,
        adresse: null,
        numeroPermis: null,
        categorie: 'B',
        statut: 'EN_COURS',
        dateInscription: new Date().toISOString(),
        notes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
        paiements: [],
        lecons: [],
        examens: [],
        factures: [],
        formation: null,
        documents: [],
      },
      facture: Math.random() > 0.8 ? { id: Math.floor(Math.random() * 100) + 1, numero: `FAC-2025-${String(Math.floor(Math.random() * 100)).padStart(3, '0')}` } as any : undefined,
    });
  }

  // Trier par date décroissante (plus récent en premier)
  paiements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return paiements;
}

/**
 * Calcule les statistiques agrégées à partir de la liste des paiements.
 */
function computeStats(paiements: Paiement[]): PaiementsStats {
  const totalEncaissements = paiements.reduce((s, p) => s + p.montant, 0);
  const nombreTransactions = paiements.length;
  const maintenant = new Date();
  const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
  const encaissementsMois = paiements.filter(p => new Date(p.date) >= debutMois).reduce((s, p) => s + p.montant, 0);
  const montantMoyen = nombreTransactions > 0 ? totalEncaissements / nombreTransactions : 0;

  return { totalEncaissements, nombreTransactions, encaissementsMois, montantMoyen };
}

/**
 * Génère des tendances fictives (évolution).
 */
function generateMockTrends(): Partial<PaiementsTrends> {
  return {
    totalEncaissements: 12.5,
    nombreTransactions: 8,
    encaissementsMois: -3.2,
    montantMoyen: 4.1,
  };
}

/**
 * Génère des sparklines pour les statistiques.
 */
function generateMockSparklines() {
  return {
    totalEncaissementsSparkline: {
      values: [980000, 1020000, 1100000, 1150000, 1180000, 1220000, 1250000],
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil'],
    },
    nombreTransactionsSparkline: {
      values: [28, 32, 35, 38, 40, 42, 42],
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil'],
    },
    encaissementsMoisSparkline: {
      values: [210000, 235000, 280000, 310000, 295000, 320000, 340000],
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil'],
    },
    montantMoyenSparkline: {
      values: [28500, 29500, 30500, 29800, 31200, 32500, 33000],
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil'],
    },
  };
}

// ============================================================
// Page principale
// ============================================================

export default function PaiementsListPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role;
  const isAdmin = role === 'ADMIN';

  // Données mockées
  const [paiements, setPaiements] = React.useState<Paiement[]>(() => generateMockPaiements(80));
  const [stats, setStats] = React.useState<PaiementsStats>(() => computeStats(paiements));
  const [trends] = React.useState(() => generateMockTrends());
  const [isLoading, setIsLoading] = React.useState(false);
  const sparklines = generateMockSparklines();

  // ── Enrichissements pour le tableau ───────────────────────────────────────
  const enrichments = {
    getCandidatNomComplet: (p: Paiement) => p.candidat ? `${p.candidat.prenom} ${p.candidat.nom}` : `Candidat ${p.candidatId}`,
    getCandidatEmail: (p: Paiement) => p.candidat?.email ?? `candidat${p.candidatId}@example.com`,
    getCandidatTelephone: (p: Paiement) => p.candidat?.telephone ?? '',
    getCandidatAvatarUrl: (p: Paiement) => p.candidat ? getAvatarUrl(`${p.candidat.prenom} ${p.candidat.nom}`) : getAvatarUrl(`Candidat ${p.candidatId}`),
    getCandidatInitials: (p: Paiement) => p.candidat ? `${p.candidat.prenom[0]}${p.candidat.nom[0]}`.toUpperCase() : `C${p.candidatId}`,
    getFactureNumero: (p: Paiement) => p.facture?.numero ?? '',
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    const fresh = generateMockPaiements(80);
    setPaiements(fresh);
    setStats(computeStats(fresh));
    setIsLoading(false);
    toast.success('Paiements actualisés');
  };

  const handleExport = () => {
    toast.success('Export des paiements (simulé)');
  };

  const handleAddPaiement = () => {
    toast.info('Formulaire d’ajout de paiement (à connecter)');
  };

  const handleViewPaiement = (p: Paiement) => {
    navigate(PROTECTED_ROUTES.PAIEMENTS.DETAIL(p.id))
  };


  const variant = isAdmin ? 'admin' : 'secretaire';

  return (
    <div className="space-y-6 p-4 md:p-1 pb-10">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-12 rounded-md bg-emerald-700 text-white shadow-sm shrink-0">
            <Receipt className="size-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Paiements</h1>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <span className="capitalize">
                {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
              </span>
              <span>·</span>
              <Badge
                variant="outline"
                className="text-[10px] h-4 px-1.5 border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
              >
                {stats.nombreTransactions} transactions
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

      {/* Bloc supérieur : statistiques (2/3) + paiements récents (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <PaiementsStatsCards
            stats={stats}
            trends={trends}
            totalEncaissementsSparkline={sparklines.totalEncaissementsSparkline}
            nombreTransactionsSparkline={sparklines.nombreTransactionsSparkline}
            encaissementsMoisSparkline={sparklines.encaissementsMoisSparkline}
            montantMoyenSparkline={sparklines.montantMoyenSparkline}
            isLoading={isLoading}
            onCardClick={(id) => {
              if (id === 'total-encaissements') toast.info('Total des encaissements');
              else if (id === 'nombre-transactions') toast.info('Nombre de transactions');
              else if (id === 'encaissements-mois') toast.info('Encaissements du mois');
              else if (id === 'montant-moyen') toast.info('Montant moyen par transaction');
            }}
            className="h-full"
          />
        </div>
        <div className="lg:col-span-1">
          <PaiementsRecentCard
            paiements={paiements.slice(0, 6)}
            maxItems={5}
            isLoading={isLoading}
            onViewPaiement={handleViewPaiement}
            className="h-full"
          />
        </div>
      </div>

      {/* Tableau complet des paiements */}
      <PaiementsTable
        paiements={paiements}
        variant={variant}
        enrichments={enrichments}
        actions={{
          onView: handleViewPaiement,
          onPrintReceipt: (p) => toast.info(`Impression du reçu pour le paiement ${p.id}`),
        }}
        defaultPeriodFilter="month"
        showPeriodFilter
        enablePagination
        enableToolbar
        defaultPageSize={20}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        title="Historique des paiements"
        description="Liste de tous les encaissements (espèces, chèque, virement, carte, mobile money)"
        showAddButton={isAdmin}
        onAddClick={handleAddPaiement}
        asCard
        className="w-full"
        emptyMessage="Aucun paiement trouvé."
      />
    </div>
  );
}