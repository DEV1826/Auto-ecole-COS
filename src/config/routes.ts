// /home/stive-junior/Auto-ecole-COS/src/config/routes.ts

/**
 * @module config/routes
 * @description Configuration centralisée de toutes les routes de l'application Auto‑école COS
 * @author Stive Junior
 * @version 1.0.0
 *
 * Ce module définit la structure complète des routes avec :
 * - Routes publiques (authentification, redirections)
 * - Routes protégées par authentification
 * - Routes par rôle utilisateur (ADMIN, SECRETAIRE, MONITEUR)
 * - Routes dynamiques avec paramètres (ID, token, etc.)
 */

// ============================================================
// ROUTES PUBLIQUES (accessibles sans authentification)
// ============================================================

/**
 * Routes publiques (accessibles sans authentification)
 * @constant {Object} PUBLIC_ROUTES
 * @readonly
 */
export const PUBLIC_ROUTES = {
  /**
   * Page d'accueil
   * @type {string}
   * @value '/'
   * @description Présentation de l'auto‑école, liens vers login.
   */
  HOME: '/',

  /**
   * Routes d'authentification
   * @namespace AUTH
   */
  AUTH: {
    /** Page de connexion */
    LOGIN: '/auth/login',
    /** Page d'inscription (création de compte pour un nouveau secrétaire/admin, réservée aux SUPER_ADMIN) */
    REGISTER: '/auth/register',
    /** Page de déconnexion (appelle le store) */
    LOGOUT: '/auth/logout',
    /** Confirmation après déconnexion */
    LOGOUT_SUCCESS: '/auth/logout-success',
    /** Mot de passe oublié */
    FORGOT_PASSWORD: '/auth/forgot-password',
    /** Réinitialisation du mot de passe avec token */
    RESET_PASSWORD: '/auth/reset-password/:token',
    /** Vérification OTP (2FA) */
    VERIFY_OTP: '/auth/verify-otp',
  } as const,

  /**
   * Pages d'état (erreurs, accès refusé)
   */
  STATUS: {
    UNAUTHORIZED: '/unauthorized', // 403
    NOT_FOUND: '/404', // 404
    ACCOUNT_INACTIVE: '/account-inactive',
    MAINTENANCE: '/maintenance',
  } as const,
} as const;

// ============================================================
// ROUTES PROTÉGÉES (authentification requise)
// ============================================================

/**
 * Routes protégées (authentification requise)
 * @constant {Object} PROTECTED_ROUTES
 * @readonly
 */
export const PROTECTED_ROUTES = {
  /**
   * Tableau de bord principal – affichage conditionnel selon le rôle
   * - ADMIN / SUPER_ADMIN : KPI globaux, graphiques financiers, alerte.
   * - SECRETAIRE : planning des leçons, état des paiements, candidats récents.
   * - MONITEUR : son planning personnel, suivi de ses élèves.
   */
  DASHBOARD: '/dashboard',

  /**
   * Profil utilisateur (informations personnelles, changement de mot de passe, préférences)
   */
  PROFILE: '/profile',

  /**
   * Paramètres de l'application (configuration de l'entreprise, tarifs, etc.)
   * Réservé aux SUPER_ADMIN et ADMIN
   */
  SETTINGS: '/settings',

  // ========== GESTION DES CANDIDATS ==========
  /**
   * Routes liées aux candidats (élèves)
   * @namespace CANDIDATS
   */
  CANDIDATS: {
    /** Liste paginée des candidats (avec filtres : statut, catégorie, date) */
    LIST: '/candidats',
    /** Détail d'un candidat (fiche complète : infos personnelles, formation, paiements, examens, leçons) */
    DETAIL: (id: number | string) => `/candidats/${id}`,
    /** Formulaire de création d'un nouveau candidat */
    CREATE: '/candidats/create',
    /** Formulaire d'édition d'un candidat */
    EDIT: (id: number | string) => `/candidats/${id}/edit`,
    /** Suppression (désactivation) – généralement via action, pas de route dédiée */
  } as const,

  // ========== GESTION DES FORMATIONS ==========
  /**
   * Offres de formation (permis B, A, etc.) et tarifs
   */
  FORMATIONS: {
    /** Liste des formations actives */
    LIST: '/formations',
    /** Détail d'une formation (description, prix, durée) */
    DETAIL: (id: number | string) => `/formations/${id}`,
    /** Création d'une nouvelle formation (admin) */
    CREATE: '/formations/create',
    /** Édition d'une formation (admin) */
    EDIT: (id: number | string) => `/formations/${id}/edit`,
    /** Gestion des tarifs historiques (optionnel) */
    TARIFS: (id: number | string) => `/formations/${id}/tarifs`,
  } as const,

  // ========== GESTION DES MONITEURS (INSTRUCTEURS) ==========
  /**
   * Employés (moniteurs)
   */
  MONITEURS: {
    /** Liste des moniteurs actifs */
    LIST: '/moniteurs',
    /** Détail d'un moniteur (disponibilités, spécialités, leçons) */
    DETAIL: (id: number | string) => `/moniteurs/${id}`,
    /** Création d'un moniteur */
    CREATE: '/moniteurs/create',
    /** Édition d'un moniteur */
    EDIT: (id: number | string) => `/moniteurs/${id}/edit`,
    /** Planning individuel d'un moniteur */
    PLANNING: (id: number | string) => `/moniteurs/${id}/planning`,
  } as const,

  // ========== GESTION DES VÉHICULES ==========
  /**
   * Parc automobile
   */
  VEHICULES: {
    /** Liste des véhicules (disponibles, en entretien, hors service) */
    LIST: '/vehicules',
    /** Détail d'un véhicule (kilométrage, révisions, affectations) */
    DETAIL: (id: number | string) => `/vehicules/${id}`,
    /** Ajout d'un véhicule */
    CREATE: '/vehicules/create',
    /** Modification d'un véhicule */
    EDIT: (id: number | string) => `/vehicules/${id}/edit`,
    /** Historique des entretiens d'un véhicule */
    ENTRETIENS: (id: number | string) => `/vehicules/${id}/entretiens`,
  } as const,

  // ========== PLANIFICATION (LEÇONS) ==========
  /**
   * Planning des leçons (code, conduite, conduite accompagnée)
   */
  PLANNING: {
    /** Vue calendrier générale (semaine / mois) */
    CALENDAR: '/planning',
    /** Détail d'une leçon */
    DETAIL: (id: number | string) => `/planning/${id}`,
    /** Création d'une leçon (réservation) */
    CREATE: '/planning/create',
    /** Édition d'une leçon */
    EDIT: (id: number | string) => `/planning/${id}/edit`,
    /** Affichage du planning d'un moniteur (fonction utilisée dans DETAIL) */
    MONITEUR: (moniteurId: number | string) => `/planning/moniteur/${moniteurId}`,
    /** Planning d'un candidat */
    CANDIDAT: (candidatId: number | string) => `/planning/candidat/${candidatId}`,
  } as const,

  // ========== EXAMENS ==========
  /**
   * Gestion des examens (code ou conduite)
   */
  EXAMENS: {
    /** Liste des examens programmés avec leurs résultats */
    LIST: '/examens',
    /** Détail d'un examen */
    DETAIL: (id: number | string) => `/examens/${id}`,
    /** Inscription d'un candidat à un examen */
    CREATE: '/examens/create',
    /** Modification d'un examen (date, centre, résultat) */
    EDIT: (id: number | string) => `/examens/${id}/edit`,
    /** Résultats par candidat (vue consolidée) */
    PAR_CANDIDAT: (candidatId: number | string) => `/examens/candidat/${candidatId}`,
  } as const,

  // ========== FINANCES & COMPTABILITÉ ==========
  /**
   * Paiements, factures, recettes, dépenses, caisse
   */
  PAIEMENTS: {
    /** Liste des paiements (tous, filtrables) */
    LIST: '/paiements',
    /** Paiements d'un candidat */
    PAR_CANDIDAT: (candidatId: number | string) => `/paiements/candidat/${candidatId}`,
    /** Enregistrement d'un paiement */
    CREATE: '/paiements/create',
    /** Détail d'un paiement */
    DETAIL: (id: number | string) => `/paiements/${id}`,
  } as const,

  FACTURES: {
    /** Liste des factures émises */
    LIST: '/factures',
    /** Détail d'une facture (PDF intégré) */
    DETAIL: (id: number | string) => `/factures/${id}`,
    /** Génération d'une facture pour un candidat */
    CREATE: '/factures/create',
    /** Édition / mise à jour (statut, échéance) */
    EDIT: (id: number | string) => `/factures/${id}/edit`,
  } as const,

  RECUS: {
    /** Liste des reçus (historique) */
    LIST: '/recus',
    /** Détail d'un reçu (PDF) */
    DETAIL: (id: number | string) => `/recus/${id}`,
  } as const,

  DEPENSES: {
    /** Liste des dépenses (catégories, fournisseur) */
    LIST: '/depenses',
    /** Enregistrement d'une dépense */
    CREATE: '/depenses/create',
    /** Modification d'une dépense */
    EDIT: (id: number | string) => `/depenses/${id}/edit`,
  } as const,

  CAISSE: {
    /** État de la caisse (solde actuel, historique des mouvements) */
    INDEX: '/caisse',
    /** Enregistrement d'une entrée manuelle */
    ENTREE: '/caisse/entree',
    /** Enregistrement d'une sortie manuelle */
    SORTIE: '/caisse/sortie',
    /** Relevé détaillé sur une période */
    RELEVE: '/caisse/releve',
  } as const,

  // ========== RAPPORTS ET STATISTIQUES ==========
  /**
   * Tableaux de bord avancés et exports
   */
  RAPPORTS: {
    /** Rapport financier (recettes, dépenses, bénéfice) */
    FINANCIER: '/rapports/financier',
    /** Rapport sur les candidats (inscriptions, taux de réussite) */
    CANDIDATS: '/rapports/candidats',
    /** Rapport sur les leçons effectuées (heures par moniteur) */
    LECONS: '/rapports/lecons',
    /** Rapport sur l'activité des véhicules (kilométrage, entretiens) */
    VEHICULES: '/rapports/vehicules',
    /** Export global (Excel, PDF) – généré via action */
    EXPORT: '/rapports/export',
    /** Dashboard KPI détaillé (accessible aux admins) */
    KPI: '/rapports/kpi',
  } as const,

  // ========== ADMINISTRATION (réservé aux SUPER_ADMIN/ADMIN) ==========
  /**
   * Administration système
   */
  ADMIN: {
    /** Gestion des utilisateurs (listes, création, rôles, permissions) */
    USERS: {
      LIST: '/admin/users',
      DETAIL: (id: number | string) => `/admin/users/${id}`,
      CREATE: '/admin/users/create',
      EDIT: (id: number | string) => `/admin/users/${id}/edit`,
      PERMISSIONS: (id: number | string) => `/admin/users/${id}/permissions`,
    },
    /** Logs d'audit (consultation) */
    AUDIT_LOGS: '/admin/audit-logs',
    /** Configuration de l'entreprise (nom, adresse, logo, etc.) */
    COMPANY_CONFIG: '/admin/company',
    /** Gestion des sessions actives (révocation à distance) */
    SESSIONS: '/admin/sessions',
  } as const,

  // ========== UTILITAIRES ==========
  /**
   * Pages annexes
   */
  UTILS: {
    /** Notification / messages système */
    NOTIFICATIONS: '/notifications',
    /** Aide / support */
    HELP: '/help',
  } as const,
} as const;

// ============================================================
// FONCTIONS D'AIDE POUR LA GÉNÉRATION D'URL
// ============================================================

/**
 * Génère dynamiquement une route avec paramètres
 * @param template - Route avec placeholders (ex: "/users/:id")
 * @param params - Objet contenant les valeurs (ex: { id: 42 })
 * @returns URL complète
 * @example
 * ```ts
 * route(PROTECTED_ROUTES.USERS.DETAIL, { id: 123 }) // "/users/123"
 * ```
 */
export function route(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  let result = template;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`:${key}`, String(value));
  }
  return result;
}

// ============================================================
// TYPES POUR UNE MEILLEURE SÉCURITÉ
// ============================================================

export type PublicRoutes = typeof PUBLIC_ROUTES;
export type ProtectedRoutes = typeof PROTECTED_ROUTES;
