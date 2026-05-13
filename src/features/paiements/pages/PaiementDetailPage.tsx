/**
 * @fileoverview Page de gestion détaillée des paiements - Interface ultra-professionnelle
 * 
 * Module principal pour l'affichage et la gestion des transactions de paiement.
 * Destiné à un environnement de gestion scolaire d'auto-école COS.
 * 
 * @module features/paiements/pages/PaiementDetailPage
 * @author Stive Junior <stive.junior@auto-ecole-cos.cm>
 * @version 2.1.0
 * @since 2024-01-10
 * @license MIT
 */

'use strict';

import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Receipt,
  FileText,
  User,
  Mail,
  Phone,
  Hash,
  Printer,
  Share2,
  Download,
  PlusCircle,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Edit3,
  DollarSign,
  TrendingUp,
  MapPin,
  Flag,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { PROTECTED_ROUTES, route } from '@/config/routes';
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb';
import { useIsMobile } from '@/hooks/use-mobile';
import { getAvatarUrl } from '@/lib/utils';

// Composants UI
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Types & Énums
import type { Paiement } from '@/types/paiements.types';
import { MODE_PAIEMENT_CONFIG } from '@/types/enums';
import { generateMockPaiements } from './PaiementsListPage';

// ═════════════════════════════════════════════════════════════════════════════
// CONSTANTES & CONFIGURATIONS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Mapping des statuts de facturation avec leurs représentations visuelles.
 * 
 * @constant
 * @type {Record<string, {label: string; color: string; icon: React.ReactNode}>}
 */
const FACTURE_STATUT_CONFIG = {
  PAYEE: {
    label: 'Payée',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    icon: <CheckCircle className="h-4 w-4" />,
  },
  PARTIELLEMENT_PAYEE: {
    label: 'Partiellement payée',
    color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    icon: <AlertCircle className="h-4 w-4" />,
  },
  EN_ATTENTE: {
    label: 'En attente',
    color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    icon: <Clock className="h-4 w-4" />,
  },
  ANNULEE: {
    label: 'Annulée',
    color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
    icon: <AlertCircle className="h-4 w-4" />,
  },
} as const;



// ═════════════════════════════════════════════════════════════════════════════
// DONNÉES MOCKÉES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Récupère les données mockées d'un paiement par son identifiant.
 * 
 * @function
 * @param {string} id - Identifiant unique du paiement
 * @returns {Paiement | null} Objet paiement complète ou null si introuvable
 * 
 * @example
 * ```typescript
 * const payment = getMockPaiement('42');
 * if (payment) {
 *   console.log(`Montant: ${payment.montant} FCFA`);
 * }
 * ```
 */
function getMockPaiement(id: string): Paiement | null {
  const candidat = {
    id: 42,
    nom: 'Dupont',
    prenom: 'Jean',
    email: 'jean.dupont@example.com',
    telephone: '691234567',
    dateNaissance: new Date('1990-05-15'),
    adresse: '123 Rue de la Paix, Yaoundé',
    numeroPermis: 'DUPONT900515001',
    categorie: 'B' as const,
    statut: 'EN_COURS' as const,
    dateInscription: new Date('2024-01-10'),
    notes: 'Candidat assidu et dynamique',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    deletedAt: null,
    paiements: [],
    lecons: [],
    examens: [],
    factures: [],
    formation: null,
    documents: [],
  };

  const mockPaiements = generateMockPaiements(60).reduce((acc, p) => {
    acc[p.id] = { ...p, candidat };
    return acc;
  }, {} as Record<number, Paiement>);

  return mockPaiements[Number(id)] || null;
}

// ═════════════════════════════════════════════════════════════════════════════
// COMPOSANTS AUXILIAIRES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Affiche un squelette de chargement animé pour la page de détail.
 * 
 * Utilisé lors du chargement asynchrone des données du paiement.
 * 
 * @component
 * @returns {React.JSX.Element} Squelette avec disposition identique à la page réelle
 * 
 * @example
 * ```tsx
 * {isLoading && <DetailSkeleton />}
 * ```
 */
function DetailSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-6 p-4 md:p-6 animate-pulse">
      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-8 w-40 rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>

      {/* En-tête */}
      <div className="p-6 rounded-md space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-8 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-md" />
          ))}
        </div>
        <div className="space-y-5">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Carte d'information avec label et valeur.
 * 
 * @component
 * @param {Object} props - Propriétés du composant
 * @param {string} props.label - Libellé de l'information
 * @param {React.ReactNode} props.value - Valeur à afficher
 * @param {React.ReactNode} [props.icon] - Icône optionnelle
 * @param {string} [props.className] - Classes CSS supplémentaires
 * @returns {React.JSX.Element} Carte d'information formatée
 * 
 * @example
 * ```tsx
 * <InfoCard
 *   label="Référence"
 *   value="PAI-2024-001234"
 *   icon={<Hash className="h-4 w-4" />}
 * />
 * ```
 */
function InfoCard({
  label,
  value,
  icon,
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center gap-1.5">
        {icon && <span className="text-emerald-600 dark:text-emerald-400">{icon}</span>}
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

/**
 * Statut badge avec icône et label.
 * 
 * @component
 * @param {Object} props - Propriétés
 * @param {string} props.statut - Code du statut
 * @param {Object} props.config - Configuration du statut
 * @returns {React.JSX.Element} Badge de statut
 */
function StatutBadge({
  config,
}: {
  config: (typeof FACTURE_STATUT_CONFIG)[keyof typeof FACTURE_STATUT_CONFIG];
}): React.JSX.Element {
  return (
    <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border', config.color)}>
      {config.icon}
      <span className="text-xs font-medium">{config.label}</span>
    </div>
  );
}

/**
 * Section avec titre et contenu organisé.
 * 
 * @component
 * @param {Object} props - Propriétés
 * @param {React.ReactNode} props.icon - Icône du titre
 * @param {string} props.title - Titre de la section
 * @param {string} [props.description] - Description optionnelle
 * @param {React.ReactNode} props.children - Contenu enfant
 * @returns {React.JSX.Element} Section formatée
 */
function DetailSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className='p-3 bg-blue-500/10 flex items-center rounded-md'>
            <span className="text-blue-700 dark:text-blue-400">{icon}</span>
          </div>
          <div>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider">
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="text-xs mt-0.5">{description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card >
  );
}

/**
 * Panneau d'action avec boutons.
 * 
 * @component
 * @param {Object} props - Propriétés
 * @returns {React.JSX.Element} Panneau d'actions
 */
function ActionPanel({
  onPrintReceipt,
  onDownloadPDF,
  onCreateInvoice,
  onShare,
  showCreateInvoice,
}: {
  onPrintReceipt: () => void;
  onDownloadPDF: () => void;
  onCreateInvoice: () => void;
  onShare: () => void;
  showCreateInvoice: boolean;
}): React.JSX.Element {
  return (
    <Card className="border shadow-sm sticky top-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-700" />
          Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-2 gap-1 grid grid-cols-2">
        <Button
          className="w-full justify-start gap-2 bg-emerald-700 hover:bg-emerald-800 text-white"
          onClick={onPrintReceipt}
        >
          <Printer className="h-4 w-4" />
          Imprimer le reçu
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={onDownloadPDF}
        >
          <Download className="h-4 w-4" />
          Télécharger (PDF)
        </Button>
        {showCreateInvoice && (
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={onCreateInvoice}
          >
            <PlusCircle className="h-4 w-4" />
            Créer facture
          </Button>
        )}
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={onShare}
        >
          <Share2 className="h-4 w-4" />
          Partager
        </Button>
      </CardContent>
    </Card>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Page de détail d'un paiement professionnel.
 * 
 * Affiche les informations complètes d'une transaction de paiement avec :
 * - Vue d'ensemble du paiement
 * - Détails du candidat et son statut
 * - Documents et factures associés
 * - Actions de gestion
 * - Audit trail
 * 
 * @component
 * @returns {React.JSX.Element} Page de détail avec navigation
 * 
 * @throws {Error} Si l'ID du paiement est invalide
 * 
 * @example
 * ```tsx
 * <Route 
 *   path={PROTECTED_ROUTES.PAIEMENTS.DETAIL(':id')}
 *   element={<PaiementDetailPage />}
 * />
 * ```
 */
export default function PaiementDetailPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // ─────────────────────────────────────────────────────────────────────────
  // État du composant
  // ─────────────────────────────────────────────────────────────────────────

  const [paiement, setPaiement] = React.useState<Paiement | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // Effets - Chargement des données
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Charge les données du paiement au montage du composant.
   */
  React.useEffect(() => {
    if (!id) {
      setError('Identifiant de paiement invalide');
      toast.error('Identifiant de paiement invalide');
      navigate(PROTECTED_ROUTES.PAIEMENTS.LIST);
      return;
    }

    setIsLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      try {
        const data = getMockPaiement(id);
        if (!data) {
          setError('Paiement introuvable');
          toast.error('Paiement introuvable');
          navigate(PROTECTED_ROUTES.PAIEMENTS.LIST);
        } else {
          setPaiement(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        toast.error('Erreur lors du chargement');
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [id, navigate]);

  // ─────────────────────────────────────────────────────────────────────────
  // Rendu conditionnel
  // ─────────────────────────────────────────────────────────────────────────

  if (isLoading) return <DetailSkeleton />;
  if (error || !paiement) return <></>;

  // ─────────────────────────────────────────────────────────────────────────
  // Données extraites
  // ─────────────────────────────────────────────────────────────────────────

  const candidat = paiement.candidat;
  const facture = paiement.facture;
  const modeCfg = MODE_PAIEMENT_CONFIG[paiement.mode];
  const ModeIcon = modeCfg?.icon || CreditCard;
  const paymentDate = new Date(paiement.date);
  const creationDate = new Date(paiement.createdAt);
  const daysSinceCreation = differenceInDays(new Date(), creationDate);

  // Formatage des noms
  const fullName = candidat ? `${candidat.prenom} ${candidat.nom}` : `Candidat ${paiement.candidatId}`;
  const avatarUrl = candidat ? getAvatarUrl(fullName) : undefined;
  const initials = candidat
    ? `${candidat.prenom?.[0] ?? ''}${candidat.nom?.[0] ?? ''}`.toUpperCase()
    : `C${paiement.candidatId}`;

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Imprime le reçu de paiement.
   */
  const handlePrintReceipt = (): void => {
    toast.info('Préparation de l\'impression du reçu');
    setTimeout(() => window.print(), 300);
  };

  /**
   * Télécharge le PDF du paiement.
   */
  const handleDownloadPDF = (): void => {
    if (facture?.pdfPath) {
      toast.success(`Téléchargement de ${facture.pdfPath}`);
    } else {
      toast.info('Aucun PDF disponible pour ce paiement');
    }
  };

  /**
   * Lance la création d'une facture pour ce paiement.
   */
  const handleCreateInvoice = (): void => {
    toast.info('Création d\'une facture pour ce paiement');
  };

  /**
   * Partage le lien du paiement.
   */
  const handleShare = (): void => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Lien copié dans le presse-papier');
  };

  /**
   * Affiche la facture associée.
   */
  const handleViewFacture = (): void => {
    if (facture) {
      navigate(route(PROTECTED_ROUTES.FACTURES.DETAIL(facture.id), { id: facture.id }));
    } else {
      toast.info('Aucune facture associée à ce paiement');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Rendu
  // ─────────────────────────────────────────────────────────────────────────

  const factureStatut = facture ? FACTURE_STATUT_CONFIG[facture.statut] : null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 pb-12 space-y-6">

      <div className="flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 rounded-lg text-muted-foreground hover:text-foreground"
          onClick={() => navigate(PROTECTED_ROUTES.PAIEMENTS.LIST)}
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la liste
        </Button>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Partager ce paiement</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={handlePrintReceipt}
                >
                  <Printer className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Imprimer</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {!isMobile && <PageBreadcrumb className="ml-4" />}
        </div>
      </div>

      <Card className="border shadow-md bg-linear-to-br from-blue-50 to-transparent dark:from-blue-950/20">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            {/* Montant */}
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Montant du paiement
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-blue-600 dark:text-blue-400">
                {paiement.montant.toLocaleString('fr-FR')}
              </h1>
              <p className="text-sm text-muted-foreground font-medium">FCFA</p>
            </div>

            {/* Badges de statut */}
            <div className="flex flex-wrap items-center gap-3">
              <Badge
                variant="outline"
                className="gap-1.5 px-3 py-1.5 text-xs border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
              >
                <ModeIcon className="h-3.5 w-3.5" />
                {modeCfg?.label ?? paiement.mode}
              </Badge>

              <Badge
                variant="outline"
                className="gap-1.5 px-3 py-1.5 text-xs border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/30 dark:text-blue-300"
              >
                <Calendar className="h-3.5 w-3.5" />
                {format(paymentDate, 'dd MMM yyyy', { locale: fr })}
              </Badge>

              {paiement.reference && (
                <Badge
                  variant="outline"
                  className="gap-1.5 px-3 py-1.5 text-xs font-mono border-gray-300 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-950/30 dark:text-gray-300"
                >
                  <Hash className="h-3.5 w-3.5" />
                  {paiement.reference}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLONNE PRINCIPALE (2/3) */}
        <div className="lg:col-span-2 space-y-6">

          <DetailSection icon={<User className="h-5 w-5" />} title="Candidat" description="Informations personnelles">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20 border-2 border-emerald-200 rounded-full shadow-sm">
                  <AvatarImage src={avatarUrl} alt={fullName} />
                  <AvatarFallback className="bg-emerald-700 text-white font-bold text-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0 space-y-2">
                  <div>
                    <p className="text-lg font-bold text-foreground">{fullName}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {candidat?.categorie && (
                      <Badge variant="secondary" className="text-xs">
                        Catégorie {candidat.categorie}
                      </Badge>
                    )}
                    {candidat?.statut && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800"
                      >
                        {candidat.statut}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {candidat?.email && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Email</span>
                    </div>
                    <a
                      href={`mailto:${candidat.email}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 break-all"
                    >
                      {candidat.email}
                    </a>
                  </div>
                )}

                {candidat?.telephone && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Téléphone</span>
                    </div>
                    <a
                      href={`tel:${candidat.telephone}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {candidat.telephone}
                    </a>
                  </div>
                )}

                {candidat?.dateNaissance && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Date de naissance</span>
                    </div>
                    <p className="text-sm font-medium">
                      {format(new Date(candidat.dateNaissance), 'dd MMMM yyyy', { locale: fr })}
                    </p>
                  </div>
                )}

                {candidat?.adresse && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Adresse</span>
                    </div>
                    <p className="text-sm font-medium">{candidat.adresse}</p>
                  </div>
                )}
              </div>

              {candidat?.notes && (
                <>
                  <Separator className="my-3" />
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Notes</span>
                    <p className="text-sm text-foreground">{candidat.notes}</p>
                  </div>
                </>
              )}
            </div>
          </DetailSection>

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* SECTION 2: DÉTAILS DE LA TRANSACTION                            */}
          {/* ─────────────────────────────────────────────────────────────── */}

          <DetailSection
            icon={<Receipt className="h-5 w-5" />}
            title="Détails de la transaction"
            description="Informations du paiement"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <InfoCard
                  label="Mode de paiement"
                  value={modeCfg?.label ?? paiement.mode}
                  icon={<ModeIcon className="h-4 w-4" />}
                />

                <InfoCard
                  label="Date et heure"
                  value={format(paymentDate, "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                  icon={<Calendar className="h-4 w-4" />}
                />

                {paiement.reference && (
                  <InfoCard
                    label="Référence externe"
                    value={<code className="text-xs font-mono bg-muted px-2 py-1 rounded">{paiement.reference}</code>}
                    icon={<Hash className="h-4 w-4" />}
                  />
                )}


              </div>

              {paiement.note && (
                <>
                  <Separator className="my-3" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Flag className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Note interne</span>
                    </div>
                    <p className="text-sm text-foreground bg-amber-50 dark:bg-amber-950/20 p-2.5 rounded border border-amber-200 dark:border-amber-800">
                      {paiement.note}
                    </p>
                  </div>
                </>
              )}
            </div>
          </DetailSection>

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* SECTION 3: FACTURE ASSOCIÉE                                     */}
          {/* ─────────────────────────────────────────────────────────────── */}

          <DetailSection
            icon={<FileText className="h-5 w-5" />}
            title="Facture"
            description="Document de facturation"
          >
            {facture ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <InfoCard label="Numéro de facture" value={<code className="text-xs font-mono bg-muted px-2 py-1 rounded">{facture.numero}</code>} icon={<FileText className="h-4 w-4" />} />

                  <InfoCard label="Montant total" value={`${facture.montantTotal.toLocaleString('fr-FR')} FCFA`} icon={<DollarSign className="h-4 w-4" />} />

                  <InfoCard
                    label="Date de facturation"
                    value={format(new Date(facture.createdAt), 'dd MMM yyyy', { locale: fr })}
                    icon={<Calendar className="h-4 w-4" />}
                  />

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Flag className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Statut</span>
                    </div>
                    {factureStatut && <StatutBadge config={factureStatut} />}
                  </div>
                </div>

                <Separator className="my-3" />

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={handleViewFacture} className="gap-1.5">
                    <Eye className="h-4 w-4" />
                    Voir la facture
                  </Button>

                  {facture.pdfPath && (
                    <Button size="sm" variant="outline" onClick={handleDownloadPDF} className="gap-1.5">
                      <Download className="h-4 w-4" />
                      Télécharger (PDF)
                    </Button>
                  )}

                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Printer className="h-4 w-4" />
                    Imprimer
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-900">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Aucune facture associée</p>
                  <p className="text-xs text-muted-foreground">Créez une facture pour ce paiement</p>
                </div>
                <Button size="sm" onClick={handleCreateInvoice} className="gap-1.5 bg-emerald-700 hover:bg-emerald-800 mt-2">
                  <PlusCircle className="h-4 w-4" />
                  Créer une facture
                </Button>
              </div>
            )}
          </DetailSection>


          <DetailSection icon={<Activity className="h-5 w-5" />} title="Audit trail" description="Historique des modifications">
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Créé le</span>
                  </div>
                  <p className="text-sm font-medium">
                    {format(creationDate, "d MMMM yyyy 'à' HH:mm:ss", { locale: fr })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {daysSinceCreation} jour{daysSinceCreation > 1 ? 's' : ''} ago
                  </p>
                </div>


              </div>

              <Separator className="my-2" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  <span>ID Paiement: <code className="font-mono">{paiement.id}</code></span>
                </div>
                <div className="flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  <span>ID Candidat: <code className="font-mono">{paiement.candidatId}</code></span>
                </div>
              </div>
            </div>
          </DetailSection>
        </div>

        {/* SIDEBAR (1/3) */}
        <div className="space-y-6">
          {/* Actions rapides */}
          <ActionPanel
            onPrintReceipt={handlePrintReceipt}
            onDownloadPDF={handleDownloadPDF}
            onCreateInvoice={handleCreateInvoice}
            onShare={handleShare}
            showCreateInvoice={!facture}
          />

          {/* État de formation */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-700" />
                Formation
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-muted-foreground">Statut global</span>
                  <Badge variant="secondary" className="text-xs">
                    {candidat?.statut ?? 'N/A'}
                  </Badge>
                </div>
              </div>

              <Separator className="my-2" />

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Catégorie</span>
                  <span className="font-semibold">{candidat?.categorie ?? 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Inscription</span>
                  <span className="font-semibold">
                    {candidat?.dateInscription
                      ? format(new Date(candidat.dateInscription), 'dd MMM yyyy', { locale: fr })
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


