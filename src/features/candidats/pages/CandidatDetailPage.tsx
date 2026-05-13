// src/features/candidats/pages/CandidatDetailPage.tsx

/**
 * @module features/candidats/pages/CandidatDetailPage
 * @description
 * Fiche détaillée d’un candidat (élève) de l’auto‑école COS.
 * Affiche toutes les informations personnelles, les statistiques,
 * et les onglets : paiements, leçons, examens, factures, documents.
 *
 * Thème : Bleu (accent blue-700).
 *
 * ## Architecture visuelle
 * ```
 * ┌─────────────────────────────────────────────────────────────┐
 * │  Bouton retour · Breadcrumb                                 │
 * ├─────────────────────────────────────────────────────────────┤
 * │  EN-TÊTE : Avatar · Nom complet · Statut · Catégorie · ...  │
 * ├─────────────────────────────────────────────────────────────┤
 * │  Bloc statistiques (cartes de synthèse)                     │
 * ├─────────────────────────────────────────────────────────────┤
 * │  TABS : Paiements | Leçons | Examens | Factures | Documents │
 * │  ┌───────────────────────────────────────────────────────┐  │
 * │  │  Tableau correspondant (avec filtres et pagination)   │  │
 * │  └───────────────────────────────────────────────────────┘  │
 * └─────────────────────────────────────────────────────────────┘
 * ```
 *
 * Les données sont chargées depuis l’API Electron via le store `useCandidats`.
 * Aucune donnée mockée n’est utilisée.
 *
 * @see {@link PaiementsTable}
 * @see {@link LeconsTable}
 * @see {@link ExamensTable}
 * @see {@link FacturesTable}
 * @see {@link DocumentsTable}
 *
 * @author Stive Junior
 * @version 2.0.0
 *
 * @example
 * ```tsx
 * <Route path="/candidats/:id" element={<CandidatDetailPage />} />
 * ```
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
  CreditCard,
  BookOpen,
  FileText,
  GraduationCap,
  Wallet,
  PlusCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { PROTECTED_ROUTES, route } from '@/config/routes';
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb';
import { CATEGORIE_PERMIS_CONFIG, STATUT_CANDIDAT_CONFIG } from '@/types/enums';
import { getAvatarUrl } from '@/lib';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

// Composants tableaux
import { PaiementsTable } from '@/features/paiements/components/PaiementsTable';
import { LeconsTable } from '@/features/planning/components/LeconsTable';
import { ExamensTable } from '@/features/examens/components/ExamensTable';
import { FacturesTable } from '@/features/factures/components/FacturesTable';
import { DocumentsTable } from '@/features/documents/components/DocumentsTable';
import { StatsGrid } from '@/features/dashboard/components/common/StatsCard';

// Types
import type { Candidat } from '@/types/candidats.types';
import type { Paiement } from '@/types/paiements.types';
import type { Lecon } from '@/types/planning.types';
import type { Examen } from '@/types/examens.types';
import type { Facture } from '@/types/factures.types';
import type { Document } from '@/types/documents.types';
import { useCandidats } from '@/hooks/use.candidats';

// ============================================================
// PAGE PRINCIPALE
// ============================================================

/**
 * Page de détail d’un candidat.
 * Charge les données réelles depuis l’API et affiche les onglets avec les tableaux.
 */
export default function CandidatDetailPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const candidatId = Number(id);

  // Store candidats
  const {
    currentCandidat,
    detailLoading,
    detailError,
    paiements,
    paiementsLoading,
    lecons,
    leconsLoading,
    examens,
    examensLoading,
    factures,
    facturesLoading,
    documents,
    documentsLoading,
    getById,
    getPaiements,
    getLecons,
    getExamens,
    getFactures,
    getDocuments,
    resetCurrentCandidat,
  } = useCandidats();

  // État local pour l’onglet actif
  const [activeTab, setActiveTab] = React.useState('paiements');
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Chargement initial du candidat et de ses relations
  React.useEffect(() => {
    if (!candidatId || isNaN(candidatId)) {
      toast.error('Identifiant candidat invalide');
      navigate(PROTECTED_ROUTES.CANDIDATS.LIST);
      return;
    }

    const loadCandidat = async () => {
      try {
        await getById(candidatId);
      } catch (err) {
        toast.error('Candidat introuvable', {
          description: detailError || "Le candidat n'existe pas ou a été supprimé.",
        });
        navigate(PROTECTED_ROUTES.CANDIDATS.LIST);
      }
    };

    loadCandidat();

    // Nettoyage : réinitialiser le candidat courant lors du démontage
    return () => {
      resetCurrentCandidat();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidatId]);

  // Chargement des relations lorsque le candidat est chargé
  React.useEffect(() => {
    if (!currentCandidat) return;

    const loadRelations = async () => {
      await Promise.all([
        getPaiements(currentCandidat.id),
        getLecons(currentCandidat.id),
        getExamens(currentCandidat.id),
        getFactures(currentCandidat.id),
        getDocuments(currentCandidat.id),
      ]);
    };

    loadRelations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCandidat]);

  // Rafraîchissement manuel de toutes les données
  const handleRefresh = async () => {
    if (!currentCandidat) return;
    setIsRefreshing(true);
    try {
      await Promise.all([
        getById(currentCandidat.id),
        getPaiements(currentCandidat.id),
        getLecons(currentCandidat.id),
        getExamens(currentCandidat.id),
        getFactures(currentCandidat.id),
        getDocuments(currentCandidat.id),
      ]);
      toast.success('Données actualisées');
    } catch (err) {
      toast.error('Erreur lors du rafraîchissement');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculs des statistiques
  const totalPaiements = paiements.reduce((sum, p) => sum + p.montant, 0);
  const totalFactures = factures.reduce((sum, f) => sum + f.montantTotal, 0);
  const soldeDu = Math.max(0, totalFactures - totalPaiements);
  const totalLeconsEffectuees = lecons.filter((l) => l.statut === 'EFFECTUEE').length;
  const totalExamens = examens.length;
  const totalDocuments = documents.length;

  // État de chargement global pour l’affichage des squelettes
  const isLoading = detailLoading || paiementsLoading || leconsLoading || examensLoading || facturesLoading || documentsLoading || isRefreshing;

  if (detailLoading && !currentCandidat) {
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

  if (!currentCandidat) return <></>;

  const statutCfg = STATUT_CANDIDAT_CONFIG[currentCandidat.statut] || { label: currentCandidat.statut, bgColor: 'bg-gray-100', textColor: 'text-gray-700', icon: null };
  const categorieCfg = CATEGORIE_PERMIS_CONFIG[currentCandidat.categorie] || { label: currentCandidat.categorie, icon: null };

  // Configuration des cartes de statistiques
  const statsCards = [
    {
      id: 'solde',
      title: 'Solde dû',
      value: `${soldeDu.toLocaleString('fr-FR')} FCFA`,
      icon: <Wallet />,
      iconBg: 'bg-blue-600/10',
      iconColor: 'text-blue-600',
    },
    {
      id: 'lecons',
      title: 'Leçons',
      value: totalLeconsEffectuees,
      icon: <BookOpen />,
      iconBg: 'bg-emerald-600/10',
      iconColor: 'text-emerald-600',
      secondaryValue: `${lecons.length} au total`,
    },
    {
      id: 'examens',
      title: 'Examens',
      value: totalExamens,
      icon: <GraduationCap />,
      iconBg: 'bg-purple-600/10',
      iconColor: 'text-purple-600',
    },
    {
      id: 'documents',
      title: 'Documents',
      value: totalDocuments,
      icon: <FileText />,
      iconBg: 'bg-amber-600/10',
      iconColor: 'text-amber-600',
    },
  ];

  // Actions des boutons d’ajout
  const handleAddPayment = () => {
    navigate(route(PROTECTED_ROUTES.PAIEMENTS.CREATE, { candidatId: currentCandidat.id }));
  };
  const handleAddLesson = () => {
    navigate(route(PROTECTED_ROUTES.PLANNING.CREATE, { candidatId: currentCandidat.id }));
  };
  const handleRegisterExam = () => {
    navigate(route(PROTECTED_ROUTES.EXAMENS.CREATE, { candidatId: currentCandidat.id }));
  };
  const handleAddDocument = () => {
    navigate(route(PROTECTED_ROUTES.CANDIDATS.DOCUMENTS(currentCandidat.id), { id: currentCandidat.id }));
  };

  // Actions des tableaux (redirection vers les pages de détail correspondantes)
  const handleViewPaiement = (paiement: Paiement) => {
    navigate(route(PROTECTED_ROUTES.PAIEMENTS.DETAIL(paiement.id), { id: paiement.id }));
  };
  const handleViewLecon = (lecon: Lecon) => {
    navigate(route(PROTECTED_ROUTES.PLANNING.DETAIL(lecon.id), { id: lecon.id }));
  };
  const handleViewExamen = (examen: Examen) => {
    navigate(route(PROTECTED_ROUTES.EXAMENS.DETAIL(examen.id), { id: examen.id }));
  };
  const handleViewFacture = (facture: Facture) => {
    navigate(route(PROTECTED_ROUTES.FACTURES.DETAIL(facture.id), { id: facture.id }));
  };
  const handleViewDocument = (doc: Document) => {
    // Ouvrir le document dans un nouvel onglet (chemin absolu ou URL)
    if (doc.chemin) window.open(doc.chemin, '_blank');
    else toast.info('Aperçu non disponible');
  };

  // Enrichissements pour les tableaux (données du candidat courant)
  const paiementsEnrichments = {
    getCandidatNomComplet: () => `${currentCandidat.prenom} ${currentCandidat.nom}`,
    getCandidatEmail: () => currentCandidat.email ?? 'Non renseigné',
    getCandidatAvatarUrl: () => getAvatarUrl(`${currentCandidat.prenom} ${currentCandidat.nom}`),
    getFactureNumero: (p: Paiement) => `FAC-${p.id}`,
  };
  const leconsEnrichments = {
    getCandidatNomComplet: () => `${currentCandidat.prenom} ${currentCandidat.nom}`,
    getMoniteurNomComplet: () => 'À définir', // À adapter si l’API fournit le moniteur
  };
  const examensEnrichments = {
    getCandidatNomComplet: () => `${currentCandidat.prenom} ${currentCandidat.nom}`,
    getCandidatEmail: () => currentCandidat.email ?? 'Non renseigné',
    getCandidatAvatarUrl: () => getAvatarUrl(`${currentCandidat.prenom} ${currentCandidat.nom}`),
  };
  const facturesEnrichments = {
    getCandidatNomComplet: () => `${currentCandidat.prenom} ${currentCandidat.nom}`,
    getCandidatEmail: () => currentCandidat.email ?? 'Non renseigné',
    getCandidatAvatarUrl: () => getAvatarUrl(`${currentCandidat.prenom} ${currentCandidat.nom}`),
    getMontantPaye: (f: Facture) => {
      const paiementsFacture = paiements.filter((p) => p.factureId === f.id);
      return paiementsFacture.reduce((sum, p) => sum + p.montant, 0);
    },
  };
  const documentsEnrichments = {
    getCandidatNomComplet: () => `${currentCandidat.prenom} ${currentCandidat.nom}`,
    getCandidatEmail: () => currentCandidat.email ?? 'Non renseigné',
    getCandidatTelephone: () => currentCandidat.telephone ?? 'Non renseigné',
    getCandidatAvatarUrl: () => getAvatarUrl(`${currentCandidat.prenom} ${currentCandidat.nom}`),
    getCandidatInitials: () => `${currentCandidat.prenom?.[0]}${currentCandidat.nom?.[0]}`,
  };

  return (
    <div className="px-4 sm:px-6 py-6 pb-12 space-y-6">
      {/* Bouton retour + breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 rounded-full text-muted-foreground hover:text-foreground"
          onClick={() => navigate(PROTECTED_ROUTES.CANDIDATS.LIST)}
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
              src={getAvatarUrl(`${currentCandidat.prenom} ${currentCandidat.nom}`)}
              alt={`${currentCandidat.prenom} ${currentCandidat.nom}`}
            />
            <AvatarFallback className="bg-blue-700 text-white text-xl font-bold">
              {currentCandidat.prenom?.[0]}{currentCandidat.nom?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">
                {currentCandidat.prenom} {currentCandidat.nom}
              </h1>
              <Badge className={cn('border-0 gap-1 text-[11px]', statutCfg.bgColor, statutCfg.textColor)}>
                {statutCfg.icon && <statutCfg.icon className="h-3 w-3" />}
                {statutCfg.label}
              </Badge>
              <Badge variant="outline" className="gap-1 text-xs">
                {categorieCfg.icon && <categorieCfg.icon className="h-3 w-3" />}
                {categorieCfg.label}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                <span>{currentCandidat.email || 'Non renseigné'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                <span>{currentCandidat.telephone || 'Non renseigné'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Inscrit le {format(new Date(currentCandidat.dateInscription), 'd MMM yyyy', { locale: fr })}</span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Statistiques */}
        <StatsGrid
          cards={statsCards}
          cols={4}
          isLoading={isLoading}
          className=""
        />
      </div>

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList variant="line" className="flex flex-wrap h-auto gap-1 bg-muted/30 p-1 rounded-lg">
          <TabsTrigger value="paiements" className="rounded-md gap-1.5 text-xs">
            <CreditCard className="h-3.5 w-3.5" /> Paiements
          </TabsTrigger>
          <TabsTrigger value="lecons" className="rounded-md gap-1.5 text-xs">
            <BookOpen className="h-3.5 w-3.5" /> Leçons
          </TabsTrigger>
          <TabsTrigger value="examens" className="rounded-md gap-1.5 text-xs">
            <GraduationCap className="h-3.5 w-3.5" /> Examens
          </TabsTrigger>
          <TabsTrigger value="factures" className="rounded-md gap-1.5 text-xs">
            <FileText className="h-3.5 w-3.5" /> Factures
          </TabsTrigger>
          <TabsTrigger value="documents" className="rounded-md gap-1.5 text-xs">
            <FileText className="h-3.5 w-3.5" /> Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="paiements" className="space-y-3">
          <PaiementsTable
            paiements={paiements}
            variant="admin"
            onAddClick={handleAddPayment}
            enrichments={paiementsEnrichments}
            actions={{ onView: handleViewPaiement }}
            enablePagination
            enableToolbar
            onRefresh={handleRefresh}
            defaultPageSize={5}
            title="Historique des paiements"
            asCard
          />
        </TabsContent>

        <TabsContent value="lecons">
          <LeconsTable
            lecons={lecons}
            variant="admin"
            enrichments={leconsEnrichments}
            actions={{ onView: handleViewLecon, onEdit: handleViewLecon }}
            enablePagination
            enableToolbar
            onAddClick={handleAddLesson}
            defaultPageSize={5}
            title="Leçons suivies"
            asCard
          />
        </TabsContent>

        <TabsContent value="examens">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={handleRegisterExam} className="h-8 gap-1 text-xs bg-blue-700 hover:bg-blue-800">
              <PlusCircle className="h-3.5 w-3.5" /> Inscrire à un examen
            </Button>
          </div>
          <ExamensTable
            examens={examens}
            variant="admin"
            enrichments={examensEnrichments}
            onAddClick={handleRegisterExam}
            showAddButton
            actions={{ onView: handleViewExamen }}
            enablePagination
            defaultPageSize={5}
            title="Examens passés"
            asCard
          />
        </TabsContent>

        <TabsContent value="factures">
          <FacturesTable
            factures={factures}
            variant="admin"
            enrichments={facturesEnrichments}
            actions={{ onView: handleViewFacture }}
            enablePagination
            defaultPageSize={5}
            title="Factures"
            asCard
          />
        </TabsContent>

        <TabsContent value="documents">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={handleAddDocument} className="h-8 gap-1 text-xs bg-blue-700 hover:bg-blue-800">
              <PlusCircle className="h-3.5 w-3.5" /> Ajouter un document
            </Button>
          </div>
          <DocumentsTable
            documents={documents}
            variant="admin"
            enrichments={documentsEnrichments}
            actions={{ onView: handleViewDocument }}
            enablePagination
            defaultPageSize={5}
            title="Documents scannés"
            asCard
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}