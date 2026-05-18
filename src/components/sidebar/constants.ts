// /home/stive-junior/Auto-ecole-COS/src/components/layout/sidebar/constants.ts

/**
 * @module layout/sidebar.constants
 * @description Définit les éléments de navigation statiques par rôle utilisateur pour l'auto‑école COS.
 * @author Stive Junior
 * @version 1.0.0
 *
 * Ce module exporte les structures de navigation principales et les projets/raccourcis
 * en fonction du rôle de l'utilisateur connecté (ADMIN, SECRETAIRE, MONITEUR).
 */

import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Car,
  Calendar,
  ClipboardList,
  CreditCard,
  FileText,
  TrendingDown,
  Coins,
  BarChart3,
  Settings,
  UserCog,
  ClipboardCheck,
  HandCoins,
  User,
  UserRound,
  HelpCircle,
  Bell,
  FileOutput,
  CalendarDays,
} from 'lucide-react';
import { PROTECTED_ROUTES } from '@/config/routes';
import type { Role } from '@/types/enums';

/**
 * Structure d'un élément de navigation principal ou d'un sous‑élément.
 */
export interface NavItem {
  /** Titre affiché dans le menu */
  title: string;
  /** URL de destination (peut être vide si un dropdown est présent) */
  url: string;
  /** Icône Lucide */
  icon: LucideIcon;
  /** Indique si l'élément est actif (surbrillance) – généralement géré par le composant */
  isActive?: boolean;
  /** Sous-éléments pour un menu déroulant */
  items?: NavItem[];
  /** Badge optionnel (nombre, notification) */
  badge?: string | number;
}

/**
 * Structure d'un élément de projet / raccourci latéral (ex: profil, calendrier).
 */
export interface ProjectItem {
  /** Nom du projet / raccourci */
  name: string;
  /** URL de destination */
  url: string;
  /** Icône Lucide */
  icon: LucideIcon;
  /** Classes CSS additionnelles */
  className?: string;
  /** Callback exécuté au clic (optionnel) */
  onClick?: () => void;
}

/**
 * Navigation principale pour chaque rôle utilisateur.
 * Les menus sont adaptés aux permissions de chaque rôle.
 */
export const MAIN_NAV_ITEMS: Record<Role, NavItem[]> = {
  // ============================================================
  // ADMIN (accès complet à toutes les fonctionnalités)
  // ============================================================
  ADMIN: [
    {
      title: 'Tableau de bord',
      url: PROTECTED_ROUTES.DASHBOARD,
      icon: LayoutDashboard,
    },

    {
      title: 'Candidats',
      url: PROTECTED_ROUTES.CANDIDATS.LIST,
      icon: Users,
    },

    {
      title: 'Finances',
      url: '',
      icon: CreditCard,
      items: [
        {
          title: 'Paiements',
          url: PROTECTED_ROUTES.PAIEMENTS.LIST,
          icon: HandCoins,
        },
        {
          title: 'Factures',
          url: PROTECTED_ROUTES.FACTURES.LIST,
          icon: FileText,
        },

        {
          title: 'Dépenses',
          url: PROTECTED_ROUTES.DEPENSES.LIST,
          icon: TrendingDown,
        },
        {
          title: 'Caisse',
          url: PROTECTED_ROUTES.CAISSE.INDEX,
          icon: Coins,
        },
        {
          title: 'Documents',
          url: PROTECTED_ROUTES.DOCUMENTS.LIST,
          icon: FileOutput,
        },
      ],
    },

    {
      title: 'Formations',
      url: PROTECTED_ROUTES.FORMATIONS.LIST,
      icon: GraduationCap,
    },
    {
      title: 'Moniteurs',
      url: PROTECTED_ROUTES.MONITEURS.LIST,
      icon: Users,
    },
    {
      title: 'Véhicules',
      url: PROTECTED_ROUTES.VEHICULES.LIST,
      icon: Car,
    },
    {
      title: 'Planning',
      url: '',
      icon: Calendar,
      items: [
        {
          title: 'Vue calendrier',
          url: PROTECTED_ROUTES.PLANNING.CALENDAR,
          icon: CalendarDays,
        },

        {
          title: 'Planning moniteur',
          url: '#',
          icon: Calendar,
        },
        {
          title: 'Planning candidat',
          url: '#',
          icon: Calendar,
        },
      ],
    },
    {
      title: 'Examens',
      url: PROTECTED_ROUTES.EXAMENS.LIST,
      icon: ClipboardList,
    },

    {
      title: 'Rapports',
      url: PROTECTED_ROUTES.RAPPORTS.FINANCIER,
      icon: BarChart3,
      items: [
        {
          title: 'Rapport financier',
          url: PROTECTED_ROUTES.RAPPORTS.FINANCIER,
          icon: BarChart3,
        },
        {
          title: 'Rapport candidats',
          url: PROTECTED_ROUTES.RAPPORTS.CANDIDATS,
          icon: Users,
        },
        {
          title: 'Rapport leçons',
          url: PROTECTED_ROUTES.RAPPORTS.LECONS,
          icon: Calendar,
        },
        {
          title: 'Rapport véhicules',
          url: PROTECTED_ROUTES.RAPPORTS.VEHICULES,
          icon: Car,
        },
        {
          title: 'Export de données',
          url: PROTECTED_ROUTES.RAPPORTS.EXPORT,
          icon: FileOutput,
        },
        {
          title: 'KPI détaillé',
          url: PROTECTED_ROUTES.RAPPORTS.KPI,
          icon: BarChart3,
        },
      ],
    },
    {
      title: 'Administration',
      url: '',
      icon: UserCog,
      items: [
        {
          title: 'Utilisateurs',
          url: PROTECTED_ROUTES.ADMIN.USERS.LIST,
          icon: UserCog,
        },
        {
          title: 'Logs d’audit',
          url: PROTECTED_ROUTES.ADMIN.AUDIT_LOGS,
          icon: ClipboardList,
        },
        {
          title: "L'entreprise",
          url: PROTECTED_ROUTES.ADMIN.COMPANY_CONFIG,
          icon: Settings,
        },
      ],
    },
    {
      title: 'Aide',
      url: PROTECTED_ROUTES.UTILS.HELP,
      icon: HelpCircle,
    },
  ],

  // ============================================================
  // SECRETAIRE (gestion des candidats, planning, paiements, examens, mais pas d'administration)
  // ============================================================
  SECRETAIRE: [
    {
      title: 'Tableau de bord',
      url: PROTECTED_ROUTES.DASHBOARD,
      icon: LayoutDashboard,
    },
    {
      title: 'Candidats',
      url: PROTECTED_ROUTES.CANDIDATS.LIST,
      icon: Users,
      items: [
        {
          title: 'Liste des candidats',
          url: PROTECTED_ROUTES.CANDIDATS.LIST,
          icon: Users,
        },
        {
          title: 'Nouveau candidat',
          url: PROTECTED_ROUTES.CANDIDATS.CREATE,
          icon: UserRound,
        },
      ],
    },
    {
      title: 'Formations',
      url: PROTECTED_ROUTES.FORMATIONS.LIST,
      icon: GraduationCap,
      // Seulement la consultation (pas de création/modification)
    },
    {
      title: 'Moniteurs',
      url: PROTECTED_ROUTES.MONITEURS.LIST,
      icon: Users,
    },
    {
      title: 'Véhicules',
      url: PROTECTED_ROUTES.VEHICULES.LIST,
      icon: Car,
    },
    {
      title: 'Planning',
      url: '',
      icon: Calendar,
      items: [
        {
          title: 'Vue calendrier',
          url: PROTECTED_ROUTES.PLANNING.CALENDAR,
          icon: CalendarDays,
        },
        {
          title: 'Nouvelle leçon',
          url: PROTECTED_ROUTES.PLANNING.CREATE,
          icon: ClipboardCheck,
        },
      ],
    },
    {
      title: 'Examens',
      url: PROTECTED_ROUTES.EXAMENS.LIST,
      icon: ClipboardList,
      items: [
        {
          title: 'Tous les examens',
          url: PROTECTED_ROUTES.EXAMENS.LIST,
          icon: ClipboardList,
        },
        {
          title: 'Inscrire à un examen',
          url: PROTECTED_ROUTES.EXAMENS.CREATE,
          icon: ClipboardCheck,
        },
      ],
    },
    {
      title: 'Finances',
      url: PROTECTED_ROUTES.PAIEMENTS.LIST,
      icon: CreditCard,
      items: [
        {
          title: 'Paiements',
          url: PROTECTED_ROUTES.PAIEMENTS.LIST,
          icon: HandCoins,
        },
        {
          title: 'Factures',
          url: PROTECTED_ROUTES.FACTURES.LIST,
          icon: FileText,
        },
        {
          title: 'Dépenses',
          url: PROTECTED_ROUTES.DEPENSES.LIST,
          icon: TrendingDown,
        },
        {
          title: 'Caisse',
          url: PROTECTED_ROUTES.CAISSE.INDEX,
          icon: Coins,
        },
      ],
    },
    {
      title: 'Documents',
      url: PROTECTED_ROUTES.DOCUMENTS.LIST,
      icon: FileText,
    },

    {
      title: 'Rapports',
      url: PROTECTED_ROUTES.RAPPORTS.FINANCIER,
      icon: BarChart3,
      items: [
        {
          title: 'Rapport financier',
          url: PROTECTED_ROUTES.RAPPORTS.FINANCIER,
          icon: BarChart3,
        },
        {
          title: 'Rapport candidats',
          url: PROTECTED_ROUTES.RAPPORTS.CANDIDATS,
          icon: Users,
        },
        {
          title: 'Rapport leçons',
          url: PROTECTED_ROUTES.RAPPORTS.LECONS,
          icon: Calendar,
        },
        {
          title: 'Rapport véhicules',
          url: PROTECTED_ROUTES.RAPPORTS.VEHICULES,
          icon: Car,
        },
        {
          title: 'Export de données',
          url: PROTECTED_ROUTES.RAPPORTS.EXPORT,
          icon: FileOutput,
        },
      ],
    },
    {
      title: 'Aide',
      url: PROTECTED_ROUTES.UTILS.HELP,
      icon: HelpCircle,
    },
  ],

  // ============================================================
  // MONITEUR (accès restreint : planning personnel, ses candidats, ses leçons)
  // ============================================================
  MONITEUR: [
    {
      title: 'Tableau de bord',
      url: PROTECTED_ROUTES.DASHBOARD,
      icon: LayoutDashboard,
    },
    {
      title: 'Mon planning',
      url: PROTECTED_ROUTES.PLANNING.CALENDAR,
      icon: CalendarDays,
    },
    {
      title: 'Mes candidats',
      url: PROTECTED_ROUTES.CANDIDATS.LIST,
      icon: Users,
    },
    {
      title: 'Mes leçons',
      url: PROTECTED_ROUTES.PLANNING.CALENDAR,
      icon: ClipboardCheck,
    },
    {
      title: 'Examens de mes candidats',
      url: PROTECTED_ROUTES.EXAMENS.LIST,
      icon: ClipboardList,
    },
    {
      title: 'Mon profil',
      url: PROTECTED_ROUTES.PROFILE,
      icon: User,
    },
    {
      title: 'Aide',
      url: PROTECTED_ROUTES.UTILS.HELP,
      icon: HelpCircle,
    },
  ],
};

/**
 * Raccourcis (projets / sections latérales) par rôle.
 * Ces éléments apparaissent généralement en bas de la barre latérale.
 */
export const PROJECTS: Record<Role, ProjectItem[]> = {
  ADMIN: [
    { name: 'Mon profil', url: PROTECTED_ROUTES.PROFILE, icon: User },
    {
      name: 'Planning',
      url: PROTECTED_ROUTES.PLANNING.CALENDAR,
      icon: Calendar,
    },

    { name: 'Notifications', url: PROTECTED_ROUTES.UTILS.NOTIFICATIONS, icon: Bell },
  ],
  SECRETAIRE: [
    { name: 'Mon profil', url: PROTECTED_ROUTES.PROFILE, icon: User },
    { name: 'Notifications', url: PROTECTED_ROUTES.UTILS.NOTIFICATIONS, icon: Bell },
  ],
  MONITEUR: [
    { name: 'Mon profil', url: PROTECTED_ROUTES.PROFILE, icon: User },
    { name: 'Notifications', url: PROTECTED_ROUTES.UTILS.NOTIFICATIONS, icon: Bell },
  ],
};
