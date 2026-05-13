// src/features/examens/pages/ExamensListPage.tsx

/**
 * @module features/examens/pages/ExamensListPage
 * @description
 * Page principale de la gestion des examens (code et conduite) de l’auto‑école COS.
 * Thème : Indigo (accent indigo-700).
 *
 * Layout :
 * ─ En-tête : titre, nombre total d’examens, date, bouton d’export, bouton d’ajout, breadcrumb
 * ─ Bloc supérieur : deux colonnes (2/3 + 1/3) :
 *     - Statistiques des examens (repliables) sur la gauche
 *     - Carte des candidats prioritaires (prochains examens) sur la droite
 * ─ Tableau complet (`ExamensTable`) avec filtres, pagination, actions
 *
 * Données mockées (à remplacer par des appels API réels).
 *
 * @author Stive Junior
 * @version 2.0.0
 *
 * @example
 * ```tsx
 * <ExamensListPage />
 * ```
 */

import * as React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { GraduationCap, PlusCircle, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExamensStatsCards } from '../components/ExamensStatsCards';
import { ExamensTable } from '../components/ExamensTable';
import { CandidatsExamsCard } from '../components/CandidatsExamensCard';
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb';
import { useAuth } from '@/hooks/use.auth';
import type { Examen } from '@/types/examens.types';
import type { ExamensStats, ExamensTrends } from '@/types/examens.types';
import type { Candidat } from '@/types/candidats.types';
import { useNavigate } from 'react-router-dom';
import { PROTECTED_ROUTES, route } from '@/config';
import { getAvatarUrl } from '@/lib/utils';



// ============================================================
// Données mockées (à remplacer par des appels API réels)
// ============================================================

/**
 * Génère une liste aléatoire d’examens avec des dates dans le futur (prochains) et le passé.
 */
function generateMockExamens(count: number = 60): Examen[] {
  const centres = [
    'Centre d’examen de Mvog-Mbi',
    'Piste de conduite de Bastos',
    'Centre d’examen de Douala',
    'Pôle examen de Yaoundé Nord',
  ];
  const types = ['CODE', 'CONDUIT'] as const;
  const resultats = ['RECU', 'AJOURNE', 'EN_ATTENTE'] as const;
  const now = new Date();

  const examens: Examen[] = [];

  for (let i = 1; i <= count; i++) {
    const type = types[i % types.length];
    let resultat = resultats[i % resultats.length];
    // Pour les examens passés (>30 jours), on évite EN_ATTENTE
    const isPast = i > 30;
    const date = new Date(now);
    if (isPast) {
      date.setDate(now.getDate() - Math.floor(Math.random() * 120));
    } else {
      date.setDate(now.getDate() + Math.floor(Math.random() * 60) + 1);
    }
    date.setHours(9 + Math.floor(Math.random() * 6), [0, 30][Math.floor(Math.random() * 2)]);

    if (date < new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) && resultat === 'EN_ATTENTE') {
      resultat = Math.random() > 0.3 ? 'RECU' : 'AJOURNE';
    }
    const note = type === 'CONDUIT' && resultat !== 'EN_ATTENTE' ? (10 + Math.random() * 10).toFixed(1) : null;
    const centre = centres[Math.floor(Math.random() * centres.length)];

    examens.push({
      id: i,
      date: date.toISOString(),
      type,
      resultat,
      note: note ? parseFloat(note) : null,
      centre,
      notes: note ? (parseFloat(note) >= 16 ? 'Excellent parcours' : 'Parcours correct') : null,
      createdAt: date.toISOString(),
      candidatId: Math.floor(Math.random() * 50) + 1,
      candidat: undefined,
    });
  }

  examens.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return examens;
}

/**
 * Génère une liste de candidats fictifs (pour enrichir les examens).
 */
function generateMockCandidats(): Candidat[] {
  const prenoms = ['Jean', 'Marie', 'Charles', 'Catherine', 'Anne', 'Paul', 'Sophie', 'Marc', 'Julie', 'Pierre'];
  const noms = ['Dupont', 'Mbarga', 'Ndong', 'Ewolo', 'Tchoffo', 'Ngono', 'Biyong', 'Ngo', 'Mvogo', 'Essomba'];
  const categories = ['A', 'B', 'C', 'D', 'BE'] as const;
  const statuts = ['EN_COURS', 'RECU', 'ECHOUE', 'ABANDONNE', 'EN_ATTENTE'] as const;
  const now = new Date();

  const candidats: Candidat[] = [];
  for (let i = 1; i <= 50; i++) {
    const statut = statuts[Math.floor(Math.random() * statuts.length)];
    const recu = statut === 'RECU';
    const dateInscription = new Date(now);
    dateInscription.setDate(now.getDate() - Math.floor(Math.random() * 180));
    candidats.push({
      id: i,
      nom: noms[i % noms.length],
      prenom: prenoms[i % prenoms.length],
      email: `candidat${i}@example.com`,
      telephone: `691${String(i).padStart(6, '0')}`,
      dateNaissance: new Date(1990 + Math.floor(Math.random() * 20), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)),
      adresse: `${Math.floor(Math.random() * 500)} Rue de la Paix, Yaoundé`,
      numeroPermis: recu ? `PER-${String(i).padStart(6, '0')}` : null,
      categorie: categories[i % categories.length],
      statut,
      dateInscription: dateInscription.toISOString(),
      notes: null,
      createdAt: dateInscription.toISOString(),
      updatedAt: dateInscription.toISOString(),
      deletedAt: null,
      paiements: [],
      lecons: [],
      examens: [],
      factures: [],
      formation: null,
      documents: [],
    });
  }
  return candidats;
}

/**
 * Enrichit les candidats avec leurs examens (retourne un tableau de candidats avec la propriété `examens` remplie).
 */
function enrichirExamensAvecCandidats(examens: Examen[], candidats: Candidat[]): (Candidat & { examens: Examen[] })[] {
  const candidatsMap = new Map<number, Candidat & { examens: Examen[] }>();

  candidats.forEach(c => {
    candidatsMap.set(c.id, { ...c, examens: [] });
  });

  examens.forEach(examen => {
    let candidat = candidatsMap.get(examen.candidatId);
    if (!candidat) {
      // Créer un candidat fictif si inexistant
      candidat = {
        id: examen.candidatId,
        nom: `Candidat${examen.candidatId}`,
        prenom: 'Anonyme',
        email: null,
        telephone: null,
        dateNaissance: null,
        adresse: null,
        numeroPermis: null,
        categorie: 'B',
        statut: 'EN_ATTENTE',
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
      };
      candidatsMap.set(examen.candidatId, candidat);
    }
    candidat.examens.push(examen);
  });

  return Array.from(candidatsMap.values());
}

/**
 * Calcule les statistiques agrégées à partir de la liste des examens.
 */
function computeStats(examens: Examen[]): ExamensStats {
  const totalExamens = examens.length;
  const examensCode = examens.filter((e) => e.type === 'CODE').length;
  const examensConduite = examens.filter((e) => e.type === 'CONDUIT').length;
  const reussites = examens.filter((e) => e.resultat === 'RECU').length;
  const echecs = examens.filter((e) => e.resultat === 'AJOURNE').length;
  const tauxReussiteGlobal = (reussites / (reussites + echecs)) * 100 || 0;

  return {
    totalExamens,
    examensCode,
    examensConduite,
    reussites,
    echecs,
    tauxReussiteGlobal,
  };
}

/**
 * Génère des tendances fictives (évolution).
 */
function generateMockTrends(): Partial<ExamensTrends> {
  return {
    totalExamens: 5.2,
    examensCode: 2.1,
    examensConduite: 8.3,
    tauxReussiteGlobal: 1.5,
  };
}

/**
 * Génère des sparklines pour les statistiques (optionnel).
 */
function generateMockSparklines() {
  return {
    totalSparkline: {
      values: [45, 48, 52, 55, 58, 60, 63, 65, 68, 72, 75, 78],
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
    },
    tauxReussiteSparkline: {
      values: [62, 64, 67, 68, 70, 72, 74, 73, 75, 76, 77, 78],
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
    },
    codeSparkline: {
      values: [28, 30, 32, 35, 36, 38, 40, 42, 43, 44, 45, 46],
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
    },
    conduiteSparkline: {
      values: [17, 18, 20, 20, 22, 22, 23, 23, 25, 28, 30, 32],
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
    },
  };
}

// ============================================================
// Page principale
// ============================================================

export default function ExamensListPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role;
  const isAdmin = role === 'ADMIN';
  const isSecretaire = role === 'SECRETAIRE';

  const getVariant = (): 'admin' | 'secretaire' | 'moniteur' => {
    if (isAdmin) return 'admin';
    if (isSecretaire) return 'secretaire';
    return 'moniteur';
  };

  // Données mockées
  const [examens, setExamens] = React.useState<Examen[]>(() => generateMockExamens(60));
  const [candidats, setCandidats] = React.useState<Candidat[]>(() => generateMockCandidats());
  const [candidatsAvecExamens, setCandidatsAvecExamens] = React.useState<(Candidat & { examens: Examen[] })[]>(() =>
    enrichirExamensAvecCandidats(examens, candidats)
  );
  const [stats, setStats] = React.useState<ExamensStats>(() => computeStats(examens));
  const [trends] = React.useState(() => generateMockTrends());
  const [isLoading, setIsLoading] = React.useState(false);

  const sparklines = generateMockSparklines();

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    const freshExamens = generateMockExamens(60);
    const freshCandidats = generateMockCandidats();
    setExamens(freshExamens);
    setCandidats(freshCandidats);
    setCandidatsAvecExamens(enrichirExamensAvecCandidats(freshExamens, freshCandidats));
    setStats(computeStats(freshExamens));
    setIsLoading(false);
    toast.success('Examens actualisés');
  };

  const handleExport = () => {
    toast.success('Export des examens (simulé)');
  };

  const handleAddExamen = () => {
    toast.info('Formulaire d’ajout d’examen (à connecter)');
  };

  const handleView = (examen: Examen) => {
    navigate(route(PROTECTED_ROUTES.EXAMENS.DETAIL(examen.id), { id: examen.id }));
  };

  const handleEdit = (examen: Examen) => {
    toast.info(`Modifier l’examen du ${format(new Date(examen.date), 'dd/MM/yyyy')}`);
  };

  const handlePrintCertificate = (examen: Examen) => {
    toast.success(`Impression du certificat pour l’examen ${examen.id}`);
  };

  const handleCandidatClick = (candidat: Candidat) => {
    navigate(route(PROTECTED_ROUTES.CANDIDATS.DETAIL(candidat.id), { id: candidat.id }));
  };

  // ── Enrichissements pour le tableau (candidat) ────────────────────────────
  const enrichments = {
    getCandidatNomComplet: (e: Examen) => {
      const c = candidatsAvecExamens.find(c => c.id === e.candidatId);
      return c ? `${c.prenom} ${c.nom}` : `Candidat ${e.candidatId}`;
    },
    getCandidatEmail: (e: Examen) => {
      const c = candidatsAvecExamens.find(c => c.id === e.candidatId);
      return c?.email ?? `candidat${e.candidatId}@example.com`;
    },
    getCandidatAvatarUrl: (e: Examen) => {
      const c = candidatsAvecExamens.find(c => c.id === e.candidatId);
      return c ? getAvatarUrl(`${c.prenom} ${c.nom}`) : getAvatarUrl(`Candidat ${e.candidatId}`);
    },
    getCandidatInitials: (e: Examen) => {
      const c = candidatsAvecExamens.find(c => c.id === e.candidatId);
      return c ? `${c.prenom[0]}${c.nom[0]}`.toUpperCase() : `C${e.candidatId}`;
    },
  };

  // ── Actions du tableau ───────────────────────────────────────────────────
  const actions = {
    onView: handleView,
    onEdit: (isAdmin || isSecretaire) ? handleEdit : undefined,
    onPrintCertificate: isAdmin ? handlePrintCertificate : undefined,
  };

  const variant = getVariant();

  return (
    <div className="space-y-5 p-4 md:p-1 pb-10">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-12 rounded-md bg-indigo-700 text-white shadow-sm shrink-0">
            <GraduationCap className="size-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Examens</h1>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <span className="capitalize">
                {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
              </span>
              <span>·</span>
              <Badge
                variant="outline"
                className="text-[10px] h-4 px-1.5 border-0 bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
              >
                {stats.totalExamens} examens
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

      {/* Bloc supérieur : statistiques + carte des candidats prioritaires */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Colonne de gauche : statistiques des examens (repliables) */}
        <div className="lg:col-span-2">
          <ExamensStatsCards
            stats={stats}
            trends={trends}
            totalSparkline={sparklines.totalSparkline}
            tauxReussiteSparkline={sparklines.tauxReussiteSparkline}
            codeSparkline={sparklines.codeSparkline}
            conduiteSparkline={sparklines.conduiteSparkline}
            isLoading={isLoading}
            onCardClick={(id) => {
              if (id === 'total-examens') toast.info('Voir tous les examens');
              else if (id === 'taux-reussite') toast.info('Taux de réussite global');
              else if (id === 'examens-code') toast.info('Examens du code');
              else if (id === 'examens-conduite') toast.info('Examens de conduite');
            }}
            className='h-full'
          />
        </div>
        {/* Colonne de droite : carte des candidats prioritaires */}
        <div className="lg:col-span-1">
          <CandidatsExamsCard
            candidats={candidatsAvecExamens}
            onCandidatClick={handleCandidatClick}
            title="Prochains examens"
            maxItems={5}
            className="h-full"
          />
        </div>
      </div>

      {/* Tableau des examens */}
      <ExamensTable
        examens={examens}
        variant={variant}
        enrichments={enrichments}
        actions={actions}
        enablePagination
        enableToolbar
        maxItems={5}
        defaultPageSize={5}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        title="Liste des examens"
        description="Consultez et gérez l’ensemble des épreuves (code et conduite)"
        showAddButton={isAdmin || isSecretaire}
        onAddClick={handleAddExamen}
        showViewAll={false}
        asCard
        className="w-full"
        emptyMessage="Aucun examen trouvé."
      />
    </div>
  );
}