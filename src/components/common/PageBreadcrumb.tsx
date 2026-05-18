// /home/stive-junior/Auto-ecole-COS/src/components/common/PageBreadcrumb.tsx

/**
 * @module common/PageBreadcrumb
 * @description Fil d'Ariane dynamique avec icônes, sous-menus déroulants et résolution asynchrone.
 * Optimisé pour éviter les boucles de rendu et les appels redondants.
 * Compatible avec toutes les routes définies dans `PROTECTED_ROUTES` et `PUBLIC_ROUTES`.
 *
 * @example
 * ```tsx
 * <PageBreadcrumb
 *   resolveDynamicLabel={async (param, id) => {
 *     if (param === 'id') {
 *       const candidat = await getCandidatById(Number(id));
 *       return `${candidat.prenom} ${candidat.nom}`;
 *     }
 *     return id;
 *   }}
 * />
 * ```
 */

import * as React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDownIcon, DotIcon, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PROTECTED_ROUTES } from '@/config/routes';

// Import des icônes nécessaires pour l'auto‑école
import {
  Home,
  LayoutDashboard,
  Users,
  GraduationCap,
  School,
  Car,
  Calendar,
  FileCheck,
  CreditCard,
  FileText,
  Receipt,
  TrendingDown,
  Coins,
  BarChart3,
  Settings,
  UserCog,
  ClipboardList,
  HelpCircle,
  Bell,
  FileOutput,
  Truck,
  User,
  UserRound,
  ClipboardCheck,
  HandCoins,
} from 'lucide-react';

/**
 * Définition d'un segment de breadcrumb.
 */
export interface BreadcrumbSegment {
  /** Nom affiché */
  label: string;
  /** URL (optionnelle, si non définie c'est la page courante) */
  href?: string;
  /** Éléments enfants pour un dropdown (optionnel) */
  children?: BreadcrumbSegment[];
  /** Icône associée au segment (optionnelle) */
  icon?: React.ReactNode;
}

/**
 * Propriétés du composant PageBreadcrumb.
 */
export interface PageBreadcrumbProps {
  /** Segments personnalisés (prioritaires sur la génération auto) */
  segments?: BreadcrumbSegment[];
  /** Séparateur personnalisé (par défaut un point) */
  separator?: React.ReactNode;
  /** Classes additionnelles */
  className?: string;
  /** Fonction de résolution de label à partir d'un paramètre dynamique (ex: id → nom) */
  resolveDynamicLabel?: (paramName: string, paramValue: string) => Promise<string> | string;
}

/**
 * Retourne l'icône correspondant à un chemin de route ou un segment.
 * @param path - Chemin de la route ou nom du segment
 * @param segmentLabel - Libellé du segment (optionnel)
 * @returns Élément ReactNode représentant l'icône
 */
function getIconForPathOrSegment(path: string, segmentLabel?: string): React.ReactNode {
  // Dashboard principal
  if (path === PROTECTED_ROUTES.DASHBOARD) return <LayoutDashboard className="size-3.5" />;

  // Profil & paramètres
  if (path === PROTECTED_ROUTES.PROFILE) return <User className="size-3.5" />;
  // Candidats
  if (path === PROTECTED_ROUTES.CANDIDATS.LIST) return <Users className="size-3.5" />;
  if (path.match(/\/candidats\/\d+$/)) return <UserRound className="size-3.5" />; // Détail candidat
  if (path === PROTECTED_ROUTES.CANDIDATS.CREATE) return <UserRound className="size-3.5" />;
  if (path.match(/\/candidats\/\d+\/edit$/)) return <UserRound className="size-3.5" />;

  // Formations
  if (path === PROTECTED_ROUTES.FORMATIONS.LIST) return <GraduationCap className="size-3.5" />;
  if (path.match(/\/formations\/\d+$/)) return <School className="size-3.5" />;
  if (path === PROTECTED_ROUTES.FORMATIONS.CREATE) return <School className="size-3.5" />;
  if (path.match(/\/formations\/\d+\/edit$/)) return <School className="size-3.5" />;
  if (path.match(/\/formations\/\d+\/tarifs$/)) return <Coins className="size-3.5" />;

  // Moniteurs
  if (path === PROTECTED_ROUTES.MONITEURS.LIST) return <Users className="size-3.5" />;
  if (path.match(/\/moniteurs\/\d+$/)) return <UserRound className="size-3.5" />;
  if (path === PROTECTED_ROUTES.MONITEURS.CREATE) return <UserRound className="size-3.5" />;
  if (path.match(/\/moniteurs\/\d+\/edit$/)) return <UserRound className="size-3.5" />;
  if (path.match(/\/moniteurs\/\d+\/planning$/)) return <Calendar className="size-3.5" />;

  // Véhicules
  if (path === PROTECTED_ROUTES.VEHICULES.LIST) return <Car className="size-3.5" />;
  if (path.match(/\/vehicules\/\d+$/)) return <Truck className="size-3.5" />;
  if (path === PROTECTED_ROUTES.VEHICULES.CREATE) return <Car className="size-3.5" />;
  if (path.match(/\/vehicules\/\d+\/edit$/)) return <Car className="size-3.5" />;
  if (path.match(/\/vehicules\/\d+\/entretiens$/)) return <ClipboardCheck className="size-3.5" />;

  // Planning
  if (path === PROTECTED_ROUTES.PLANNING.CALENDAR) return <Calendar className="size-3.5" />;
  if (path.match(/\/planning\/\d+$/)) return <FileCheck className="size-3.5" />;
  if (path === PROTECTED_ROUTES.PLANNING.CREATE) return <Calendar className="size-3.5" />;
  if (path.match(/\/planning\/\d+\/edit$/)) return <FileCheck className="size-3.5" />;
  if (path.match(/\/planning\/moniteur\/\d+$/)) return <Calendar className="size-3.5" />;
  if (path.match(/\/planning\/candidat\/\d+$/)) return <Calendar className="size-3.5" />;

  // Examens
  if (path === PROTECTED_ROUTES.EXAMENS.LIST) return <ClipboardList className="size-3.5" />;
  if (path.match(/\/examens\/\d+$/)) return <FileCheck className="size-3.5" />;
  if (path === PROTECTED_ROUTES.EXAMENS.CREATE) return <ClipboardList className="size-3.5" />;
  if (path.match(/\/examens\/\d+\/edit$/)) return <FileCheck className="size-3.5" />;
  if (path.match(/\/examens\/candidat\/\d+$/)) return <Users className="size-3.5" />;

  // Finances
  if (path === PROTECTED_ROUTES.PAIEMENTS.LIST) return <CreditCard className="size-3.5" />;
  if (path.match(/\/paiements\/candidat\/\d+$/)) return <User className="size-3.5" />;
  if (path === PROTECTED_ROUTES.PAIEMENTS.CREATE) return <HandCoins className="size-3.5" />;
  if (path.match(/\/paiements\/\d+$/)) return <Receipt className="size-3.5" />;

  if (path === PROTECTED_ROUTES.FACTURES.LIST) return <FileText className="size-3.5" />;
  if (path.match(/\/factures\/\d+$/)) return <FileText className="size-3.5" />;
  if (path === PROTECTED_ROUTES.FACTURES.CREATE) return <FileText className="size-3.5" />;
  if (path.match(/\/factures\/\d+\/edit$/)) return <FileText className="size-3.5" />;

  if (path === PROTECTED_ROUTES.DOCUMENTS.LIST) return <FileText className="size-3.5" />;
  if (path === PROTECTED_ROUTES.DOCUMENTS.UPLOAD) return <Upload className="size-3.5" />;
  if (path.match(/\/recus\/\d+$/)) return <Receipt className="size-3.5" />;

  if (path === PROTECTED_ROUTES.DEPENSES.LIST) return <TrendingDown className="size-3.5" />;
  if (path === PROTECTED_ROUTES.DEPENSES.CREATE) return <TrendingDown className="size-3.5" />;
  if (path.match(/\/depenses\/\d+\/edit$/)) return <TrendingDown className="size-3.5" />;

  if (path === PROTECTED_ROUTES.CAISSE.INDEX) return <Coins className="size-3.5" />;

  // Rapports
  if (path === PROTECTED_ROUTES.RAPPORTS.FINANCIER) return <BarChart3 className="size-3.5" />;
  if (path === PROTECTED_ROUTES.RAPPORTS.CANDIDATS) return <Users className="size-3.5" />;
  if (path === PROTECTED_ROUTES.RAPPORTS.LECONS) return <Calendar className="size-3.5" />;
  if (path === PROTECTED_ROUTES.RAPPORTS.VEHICULES) return <Car className="size-3.5" />;
  if (path === PROTECTED_ROUTES.RAPPORTS.EXPORT) return <FileOutput className="size-3.5" />;
  if (path === PROTECTED_ROUTES.RAPPORTS.KPI) return <BarChart3 className="size-3.5" />;

  // Administration
  if (path === PROTECTED_ROUTES.ADMIN.USERS.LIST) return <UserCog className="size-3.5" />;
  if (path.match(/\/admin\/users\/\d+$/)) return <User className="size-3.5" />;
  if (path === PROTECTED_ROUTES.ADMIN.USERS.CREATE) return <UserCog className="size-3.5" />;
  if (path.match(/\/admin\/users\/\d+\/edit$/)) return <User className="size-3.5" />;
  if (path.match(/\/admin\/users\/\d+\/permissions$/)) return <Shield className="size-3.5" />;
  if (path === PROTECTED_ROUTES.ADMIN.AUDIT_LOGS) return <ClipboardList className="size-3.5" />;
  if (path === PROTECTED_ROUTES.ADMIN.COMPANY_CONFIG) return <Settings className="size-3.5" />;

  // Utilitaires
  if (path === PROTECTED_ROUTES.UTILS.NOTIFICATIONS) return <Bell className="size-3.5" />;
  if (path === PROTECTED_ROUTES.UTILS.HELP) return <HelpCircle className="size-3.5" />;

  // Accueil (dashboard)
  if (segmentLabel === 'Accueil') return <Home className="size-3.5" />;

  // Fallback: retourner null
  return null;
}

/**
 * Composant interne pour afficher un badge d'icône (Shield non défini précédemment)
 */
const Shield = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

/**
 * Génère automatiquement les segments à partir du chemin de l'URL.
 * Utilise les constantes de routes pour les libellés et les icônes.
 * @param pathname - Chemin actuel
 * @returns Liste des segments
 */
function generateSegmentsFromPath(pathname: string): BreadcrumbSegment[] {
  const segments: BreadcrumbSegment[] = [];
  const parts = pathname.split('/').filter(Boolean);
  let currentPath = '';

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    currentPath += `/${part}`;

    let label = '';
    let children: BreadcrumbSegment[] | undefined;
    let icon: React.ReactNode = null;

    // Fonction utilitaire pour créer un segment avec dropdown optionnel
    const addSegment = (
      lbl: string,
      href?: string,
      childs?: BreadcrumbSegment[],
      ico?: React.ReactNode
    ) => {
      label = lbl;
      if (href !== undefined)
        segments.push({
          label,
          href,
          children: childs,
          icon: ico || getIconForPathOrSegment(currentPath, lbl),
        });
      else
        segments.push({
          label,
          children: childs,
          icon: ico || getIconForPathOrSegment(currentPath, lbl),
        });
    };

    // Détection des routes via les constantes PROTECTED_ROUTES

    // Dashboard
    if (currentPath === PROTECTED_ROUTES.DASHBOARD) {
      addSegment('Tableau de bord', undefined, undefined, <LayoutDashboard className="size-3.5" />);
      break;
    }

    // Profil
    else if (currentPath === PROTECTED_ROUTES.PROFILE) {
      addSegment('Mon profil', undefined, undefined, <User className="size-3.5" />);
    }


    // Gestion des candidats
    else if (currentPath === PROTECTED_ROUTES.CANDIDATS.LIST) {
      addSegment(
        'Candidats',
        undefined,
        [
          {
            label: 'Liste',
            href: PROTECTED_ROUTES.CANDIDATS.LIST,
            icon: <UserRound className="size-3.5" />,
          },
        ],
        <Users className="size-3.5" />
      );
    } else if (currentPath.match(/^\/candidats\/\d+$/) && !currentPath.includes('/edit')) {
      addSegment(':id', undefined, undefined, <UserRound className="size-3.5" />);
    } else if (currentPath === PROTECTED_ROUTES.CANDIDATS.CREATE) {
      addSegment('Nouveau candidat', undefined, undefined, <UserRound className="size-3.5" />);
    } else if (currentPath.match(/\/candidats\/\d+\/edit$/)) {
      addSegment('Modifier candidat', undefined, undefined, <UserRound className="size-3.5" />);
    }

    // Formations
    else if (currentPath === PROTECTED_ROUTES.FORMATIONS.LIST) {
      addSegment(
        'Formations',
        undefined,
        [
          {
            label: 'Liste',
            href: PROTECTED_ROUTES.FORMATIONS.LIST,
            icon: <School className="size-3.5" />,
          },
        ],
        <GraduationCap className="size-3.5" />
      );
    } else if (
      currentPath.match(/^\/formations\/\d+$/) &&
      !currentPath.includes('/edit') &&
      !currentPath.includes('/tarifs')
    ) {
      addSegment(':id', undefined, undefined, <School className="size-3.5" />);
    } else if (currentPath === PROTECTED_ROUTES.FORMATIONS.CREATE) {
      addSegment('Nouvelle formation', undefined, undefined, <School className="size-3.5" />);
    } else if (currentPath.match(/\/formations\/\d+\/edit$/)) {
      addSegment('Modifier formation', undefined, undefined, <School className="size-3.5" />);
    } else if (currentPath.match(/\/formations\/\d+\/tarifs$/)) {
      addSegment('Historique des tarifs', undefined, undefined, <Coins className="size-3.5" />);
    }

    // Moniteurs
    else if (currentPath === PROTECTED_ROUTES.MONITEURS.LIST) {
      addSegment(
        'Moniteurs',
        undefined,
        [
          {
            label: 'Nouveau moniteur',
            href: PROTECTED_ROUTES.MONITEURS.CREATE,
            icon: <UserRound className="size-3.5" />,
          },
        ],
        <Users className="size-3.5" />
      );
    } else if (
      currentPath.match(/^\/moniteurs\/\d+$/) &&
      !currentPath.includes('/edit') &&
      !currentPath.includes('/planning')
    ) {
      addSegment(':id', undefined, undefined, <UserRound className="size-3.5" />);
    } else if (currentPath === PROTECTED_ROUTES.MONITEURS.CREATE) {
      addSegment('Nouveau moniteur', undefined, undefined, <UserRound className="size-3.5" />);
    } else if (currentPath.match(/\/moniteurs\/\d+\/edit$/)) {
      addSegment('Modifier moniteur', undefined, undefined, <UserRound className="size-3.5" />);
    } else if (currentPath.match(/\/moniteurs\/\d+\/planning$/)) {
      addSegment('Planning', undefined, undefined, <Calendar className="size-3.5" />);
    }

    // Véhicules
    else if (currentPath === PROTECTED_ROUTES.VEHICULES.LIST) {
      addSegment(
        'Véhicules',
        undefined,
        [
          {
            label: 'Ajouter un véhicule',
            href: PROTECTED_ROUTES.VEHICULES.CREATE,
            icon: <Car className="size-3.5" />,
          },
        ],
        <Car className="size-3.5" />
      );
    } else if (
      currentPath.match(/^\/vehicules\/\d+$/) &&
      !currentPath.includes('/edit') &&
      !currentPath.includes('/entretiens')
    ) {
      addSegment(':id', undefined, undefined, <Truck className="size-3.5" />);
    } else if (currentPath === PROTECTED_ROUTES.VEHICULES.CREATE) {
      addSegment('Ajouter un véhicule', undefined, undefined, <Car className="size-3.5" />);
    } else if (currentPath.match(/\/vehicules\/\d+\/edit$/)) {
      addSegment('Modifier véhicule', undefined, undefined, <Car className="size-3.5" />);
    } else if (currentPath.match(/\/vehicules\/\d+\/entretiens$/)) {
      addSegment('Entretiens', undefined, undefined, <ClipboardCheck className="size-3.5" />);
    }

    // Planning
    else if (currentPath === PROTECTED_ROUTES.PLANNING.CALENDAR) {
      addSegment(
        'Planning',
        undefined,
        [
          {
            label: 'Nouvelle leçon',
            href: PROTECTED_ROUTES.PLANNING.CREATE,
            icon: <Calendar className="size-3.5" />,
          },
        ],
        <Calendar className="size-3.5" />
      );
    } else if (
      currentPath.match(/^\/planning\/\d+$/) &&
      !currentPath.includes('/edit') &&
      !currentPath.includes('/moniteur') &&
      !currentPath.includes('/candidat')
    ) {
      addSegment(':id', undefined, undefined, <FileCheck className="size-3.5" />);
    } else if (currentPath === PROTECTED_ROUTES.PLANNING.CREATE) {
      addSegment('Nouvelle leçon', undefined, undefined, <Calendar className="size-3.5" />);
    } else if (currentPath.match(/\/planning\/\d+\/edit$/)) {
      addSegment('Modifier leçon', undefined, undefined, <FileCheck className="size-3.5" />);
    } else if (currentPath.match(/\/planning\/moniteur\/\d+$/)) {
      addSegment('Planning moniteur', undefined, undefined, <Calendar className="size-3.5" />);
    } else if (currentPath.match(/\/planning\/candidat\/\d+$/)) {
      addSegment('Planning candidat', undefined, undefined, <Calendar className="size-3.5" />);
    }

    // Examens
    else if (currentPath === PROTECTED_ROUTES.EXAMENS.LIST) {
      addSegment(
        'Examens',
        undefined,
        [
          {
            label: 'Inscrire à un examen',
            href: PROTECTED_ROUTES.EXAMENS.CREATE,
            icon: <ClipboardList className="size-3.5" />,
          },
        ],
        <ClipboardList className="size-3.5" />
      );
    } else if (
      currentPath.match(/^\/examens\/\d+$/) &&
      !currentPath.includes('/edit') &&
      !currentPath.includes('/candidat')
    ) {
      addSegment(':id', undefined, undefined, <FileCheck className="size-3.5" />);
    } else if (currentPath === PROTECTED_ROUTES.EXAMENS.CREATE) {
      addSegment(
        'Inscription examen',
        undefined,
        undefined,
        <ClipboardList className="size-3.5" />
      );
    } else if (currentPath.match(/\/examens\/\d+\/edit$/)) {
      addSegment('Modifier examen', undefined, undefined, <FileCheck className="size-3.5" />);
    } else if (currentPath.match(/\/examens\/candidat\/\d+$/)) {
      addSegment('Examens du candidat', undefined, undefined, <Users className="size-3.5" />);
    }

    // Paiements
    else if (currentPath === PROTECTED_ROUTES.PAIEMENTS.LIST) {
      addSegment(
        'Paiements',
        undefined,
        [
          {
            label: 'Nouveau paiement',
            href: PROTECTED_ROUTES.PAIEMENTS.CREATE,
            icon: <HandCoins className="size-3.5" />,
          },
        ],
        <CreditCard className="size-3.5" />
      );
    } else if (currentPath.match(/\/paiements\/candidat\/\d+$/)) {
      addSegment('Paiements du candidat', undefined, undefined, <User className="size-3.5" />);
    } else if (currentPath === PROTECTED_ROUTES.PAIEMENTS.CREATE) {
      addSegment('Nouveau paiement', undefined, undefined, <HandCoins className="size-3.5" />);
    } else if (currentPath.match(/^\/paiements\/\d+$/)) {
      addSegment(':id', undefined, undefined, <Receipt className="size-3.5" />);
    }

    // Factures
    else if (currentPath === PROTECTED_ROUTES.FACTURES.LIST) {
      addSegment(
        'Factures',
        undefined,
        [
          {
            label: 'Nouvelle facture',
            href: PROTECTED_ROUTES.FACTURES.CREATE,
            icon: <FileText className="size-3.5" />,
          },
        ],
        <FileText className="size-3.5" />
      );
    } else if (currentPath.match(/^\/factures\/\d+$/) && !currentPath.includes('/edit')) {
      addSegment(':id', undefined, undefined, <FileText className="size-3.5" />);
    } else if (currentPath === PROTECTED_ROUTES.FACTURES.CREATE) {
      addSegment('Nouvelle facture', undefined, undefined, <FileText className="size-3.5" />);
    } else if (currentPath.match(/\/factures\/\d+\/edit$/)) {
      addSegment('Modifier facture', undefined, undefined, <FileText className="size-3.5" />);
    }

    // Reçus
    else if (currentPath === PROTECTED_ROUTES.DOCUMENTS.LIST) {
      addSegment('Documents', undefined, undefined, <FileText className="size-3.5" />);
    } else if (currentPath.match(/^\/recus\/\d+$/)) {
      addSegment(':id', undefined, undefined, <Receipt className="size-3.5" />);
    }

    // Dépenses
    else if (currentPath === PROTECTED_ROUTES.DEPENSES.LIST) {
      addSegment(
        'Dépenses',
        undefined,
        [
          {
            label: 'Nouvelle dépense',
            href: PROTECTED_ROUTES.DEPENSES.CREATE,
            icon: <TrendingDown className="size-3.5" />,
          },
        ],
        <TrendingDown className="size-3.5" />
      );
    } else if (currentPath === PROTECTED_ROUTES.DEPENSES.CREATE) {
      addSegment('Nouvelle dépense', undefined, undefined, <TrendingDown className="size-3.5" />);
    } else if (currentPath.match(/\/depenses\/\d+\/edit$/)) {
      addSegment('Modifier dépense', undefined, undefined, <TrendingDown className="size-3.5" />);
    }

    // Rapports
    else if (currentPath === PROTECTED_ROUTES.RAPPORTS.FINANCIER) {
      addSegment('Rapport financier', undefined, undefined, <BarChart3 className="size-3.5" />);
    } else if (currentPath === PROTECTED_ROUTES.RAPPORTS.CANDIDATS) {
      addSegment('Rapport candidats', undefined, undefined, <Users className="size-3.5" />);
    } else if (currentPath === PROTECTED_ROUTES.RAPPORTS.LECONS) {
      addSegment('Rapport leçons', undefined, undefined, <Calendar className="size-3.5" />);
    } else if (currentPath === PROTECTED_ROUTES.RAPPORTS.VEHICULES) {
      addSegment('Rapport véhicules', undefined, undefined, <Car className="size-3.5" />);
    } else if (currentPath === PROTECTED_ROUTES.RAPPORTS.EXPORT) {
      addSegment('Export de données', undefined, undefined, <FileOutput className="size-3.5" />);
    } else if (currentPath === PROTECTED_ROUTES.RAPPORTS.KPI) {
      addSegment('Tableau de bord KPI', undefined, undefined, <BarChart3 className="size-3.5" />);
    }

    // Administration
    else if (currentPath === PROTECTED_ROUTES.ADMIN.USERS.LIST) {
      addSegment(
        'Utilisateurs',
        undefined,
        [
          {
            label: 'Nouvel utilisateur',
            href: PROTECTED_ROUTES.ADMIN.USERS.CREATE,
            icon: <UserCog className="size-3.5" />,
          },
        ],
        <UserCog className="size-3.5" />
      );
    } else if (
      currentPath.match(/^\/admin\/users\/\d+$/) &&
      !currentPath.includes('/edit') &&
      !currentPath.includes('/permissions')
    ) {
      addSegment(':id', undefined, undefined, <User className="size-3.5" />);
    } else if (currentPath === PROTECTED_ROUTES.ADMIN.USERS.CREATE) {
      addSegment('Nouvel utilisateur', undefined, undefined, <UserCog className="size-3.5" />);
    } else if (currentPath.match(/\/admin\/users\/\d+\/edit$/)) {
      addSegment('Modifier utilisateur', undefined, undefined, <User className="size-3.5" />);
    } else if (currentPath.match(/\/admin\/users\/\d+\/permissions$/)) {
      addSegment('Permissions', undefined, undefined, <Shield className="size-3.5" />);
    } else if (currentPath === PROTECTED_ROUTES.ADMIN.AUDIT_LOGS) {
      addSegment("Journaux d'audit", undefined, undefined, <ClipboardList className="size-3.5" />);
    } else if (currentPath === PROTECTED_ROUTES.ADMIN.COMPANY_CONFIG) {
      addSegment('Configuration', undefined, undefined, <Settings className="size-3.5" />);
    }

    // Utilitaires
    else if (currentPath === PROTECTED_ROUTES.UTILS.NOTIFICATIONS) {
      addSegment('Notifications', undefined, undefined, <Bell className="size-3.5" />);
    } else if (currentPath === PROTECTED_ROUTES.UTILS.HELP) {
      addSegment('Aide & Support', undefined, undefined, <HelpCircle className="size-3.5" />);
    }

    // Fallback : transformer le segment en libellé lisible
    else {
      label = part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ');
      const href = i === parts.length - 1 ? undefined : currentPath;
      icon = getIconForPathOrSegment(currentPath, label);
      segments.push({ label, href, icon });
    }

    // Si on a ajouté un segment et que ce n'est pas le dernier, on continue
    if (!currentPath.match(/\/dashboard$/) && label !== 'Tableau de bord') continue;
    break;
  }

  // Ajouter "Accueil" au début si ce n'est pas déjà le cas
  if (segments.length === 0 || segments[0].label !== 'Accueil') {
    segments.unshift({
      label: 'Accueil',
      href: PROTECTED_ROUTES.DASHBOARD,
      icon: <Home className="size-3.5" />,
    });
  }

  return segments;
}

/**
 * Composant Fil d'Ariane intelligent, sans boucle de rendu.
 */
export function PageBreadcrumb({
  segments: customSegments,
  separator = <DotIcon className="size-3.5" />,
  className,
  resolveDynamicLabel,
}: PageBreadcrumbProps) {
  const location = useLocation();
  const params = useParams();

  const baseSegments = React.useMemo(() => {
    if (customSegments) return customSegments;
    return generateSegmentsFromPath(location.pathname);
  }, [customSegments, location.pathname]);

  // État des segments résolus (après remplacement des paramètres dynamiques)
  const [resolvedSegments, setResolvedSegments] = React.useState<BreadcrumbSegment[]>(baseSegments);

  // Effet pour résoudre les labels dynamiques (ex: :id → nom réel)
  React.useEffect(() => {
    let isMounted = true;

    const resolveDynamic = async () => {
      const updated = await Promise.all(
        baseSegments.map(async (seg) => {
          // Détecter les labels au format ":nomParametre"
          const match = seg.label.match(/^:(\w+)$/);
          if (match && resolveDynamicLabel) {
            const paramName = match[1];
            const paramValue = params[paramName];
            if (paramValue) {
              const resolvedLabel = await resolveDynamicLabel(paramName, paramValue);
              return { ...seg, label: resolvedLabel };
            }
          }
          return seg;
        })
      );
      if (isMounted) {
        setResolvedSegments(updated);
      }
    };

    resolveDynamic();

    return () => {
      isMounted = false;
    };
  }, [baseSegments, params, resolveDynamicLabel]);

  const finalSegments = resolvedSegments;

  if (finalSegments.length === 0) return null;

  return (
    <Breadcrumb className={cn('flex items-center', className)}>
      <BreadcrumbList>
        {finalSegments.map((segment, index) => {
          const isLast = index === finalSegments.length - 1;
          const hasChildren = segment.children && segment.children.length > 0;

          return (
            <React.Fragment key={`${segment.label}-${index}`}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="flex items-center gap-1">
                    {segment.icon}
                    {segment.label}
                  </BreadcrumbPage>
                ) : hasChildren ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary transition-colors"
                        aria-label={`${segment.label}, menu déroulant`}
                      >
                        {segment.icon}
                        {segment.label}
                        <ChevronDownIcon className="size-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {segment.children?.map((child) => (
                        <DropdownMenuItem key={child.href} asChild>
                          <Link to={child.href!} className="flex items-center gap-2">
                            {child.icon}
                            {child.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={segment.href!} className="flex items-center gap-1">
                      {segment.icon}
                      {segment.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator>{separator}</BreadcrumbSeparator>}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
