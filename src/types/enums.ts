// src/types/enums.ts

/**
 * @module types/enums
 * @description
 * Énumérations métier de l’application Auto‑école COS.
 * Ce module exporte :
 * - Les types TypeScript pour chaque enum (Role, NiveauAcces, etc.)
 * - Les configurations d’affichage (label, bgColor, textColor, icon, etc.)
 *   pour une utilisation dans les badges, tableaux, filtres, etc.
 *
 * Toutes les valeurs sont alignées avec le schéma Prisma.
 *
 * @author Stive Junior
 * @version 1.0.0
 */

import {
  UserCog,
  CalendarCheck,
  GraduationCap,
  Car,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  HelpCircle,
  CreditCard,
  Coins,
  FileText,
  Fuel,
  Wrench,
  Briefcase,
  Building,
  Zap,
  Phone,
  Shield,
  Megaphone,
  Package,
  Landmark,
  MoreHorizontal,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react';

// ============================================================
// ÉNUMÉRATIONS BRUTES (types TypeScript)
// ============================================================

/**
 * Rôles utilisateur.
 */
export type Role = 'ADMIN' | 'SECRETAIRE' | 'MONITEUR';

/**
 * Niveaux d’accès (hiérarchie descendante).
 */
export type NiveauAcces = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'STANDARD' | 'GUEST';

/**
 * Catégories de permis de conduire.
 */
export type CategoriePermis = 'A' | 'B' | 'C' | 'D' | 'BE';

/**
 * Statut d’un candidat (élève).
 */
export type StatutCandidat = 'EN_COURS' | 'RECU' | 'ECHOUE' | 'ABANDONNE' | 'EN_ATTENTE';

/**
 * Statut d’un véhicule.
 */
export type StatutVehicule = 'DISPONIBLE' | 'EN_LECON' | 'EN_ENTRETIEN' | 'HORS_SERVICE';

/**
 * Type de leçon (code, conduite, conduite accompagnée).
 */
export type TypeLecon = 'CODE' | 'CONDUITE' | 'CONDUITE_ACCOMPAGNEE';

/**
 * Statut d’une leçon.
 */
export type StatutLecon = 'PLANIFIEE' | 'EFFECTUEE' | 'ANNULEE' | 'ABSENCE';

/**
 * Type d’examen.
 */
export type TypeExamen = 'CODE' | 'CONDUITE';

/**
 * Résultat d’un examen.
 */
export type ResultatExamen = 'EN_ATTENTE' | 'RECU' | 'AJOURNE';

/**
 * Mode de paiement.
 */
export type ModePaiement = 'ESPECES' | 'CHEQUE' | 'VIREMENT' | 'CARTE' | 'MOBILE_MONEY';

/**
 * Catégorie de dépense.
 */
export type CategorieDepense =
  | 'CARBURANT'
  | 'ENTRETIEN_VEHICULE'
  | 'SALAIRE'
  | 'LOYER'
  | 'ELECTRICITE'
  | 'TELEPHONE'
  | 'ASSURANCE'
  | 'PUBLICITE'
  | 'FOURNITURES'
  | 'TAXES'
  | 'AUTRE';

/**
 * Type de mouvement de caisse (entrée/sortie).
 */
export type TypeMouvement = 'ENTREE' | 'SORTIE';

/**
 * Statut d’une facture.
 */
export type StatutFacture = 'EN_ATTENTE' | 'PARTIELLEMENT_PAYEE' | 'PAYEE' | 'ANNULEE';

// ============================================================
// CONFIGURATIONS D’AFFICHAGE POUR LE FRONTEND
// ============================================================

/**
 * Configuration d’affichage pour un élément énuméré.
 * @template T - Type de l’énumération (ex: Role)
 */
export interface EnumDisplayConfig<T extends string = string> {
  /** Libellé localisé (affiché à l’écran) */
  label: string;
  /** Description courte (tooltip, etc.) */
  description?: string;
  /** Classe Tailwind pour la couleur de fond */
  bgColor: string;
  /** Classe Tailwind pour la couleur du texte */
  textColor: string;
  /** Classe pour la bordure (optionnelle) */
  borderColor?: string;
  /** Icône Lucide associée */
  icon: LucideIcon;
  /** Ordre de tri (optionnel) */
  order?: number;
  /** URL de l’image associée (optionnelle) */
  image?: string;
}

// ──────────────────────────────
// 1. ROLE
// ──────────────────────────────

/**
 * Configuration d’affichage pour chaque rôle.
 */
export const ROLE_CONFIG: Record<Role, EnumDisplayConfig<Role>> = {
  ADMIN: {
    label: 'Administrateur',
    description: 'Accès complet à toutes les fonctionnalités',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    textColor: 'text-blue-700 dark:text-blue-300',
    borderColor: 'border-blue-200 dark:border-blue-800',
    icon: UserCog,
    order: 1,
  },
  SECRETAIRE: {
    label: 'Secrétaire',
    description: 'Gestion des candidats, planning, paiements, examens',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    icon: CalendarCheck,
    order: 2,
  },
  MONITEUR: {
    label: 'Moniteur',
    description: 'Suivi de ses candidats, planning personnel',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    textColor: 'text-purple-700 dark:text-purple-300',
    borderColor: 'border-purple-200 dark:border-purple-800',
    icon: GraduationCap,
    order: 3,
  },
};

// ──────────────────────────────
// 2. NIVEAU D’ACCÈS
// ──────────────────────────────

/**
 * Configuration d’affichage pour chaque niveau d’accès.
 */
export const NIVEAU_ACCES_CONFIG: Record<NiveauAcces, EnumDisplayConfig<NiveauAcces>> = {
  SUPER_ADMIN: {
    label: 'Super Administrateur',
    description: 'Accès total, peut créer des admins',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    textColor: 'text-red-700 dark:text-red-300',
    icon: Shield,
    order: 1,
  },
  ADMIN: {
    label: 'Administrateur',
    description: 'Gestion complète du système',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    textColor: 'text-orange-700 dark:text-orange-300',
    icon: UserCog,
    order: 2,
  },
  MANAGER: {
    label: 'Manager',
    description: 'Gestion partielle (candidats, paiements)',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    textColor: 'text-amber-700 dark:text-amber-300',
    icon: Briefcase,
    order: 3,
  },
  STANDARD: {
    label: 'Standard',
    description: 'Accès limité, consultation',
    bgColor: 'bg-slate-50 dark:bg-slate-950/30',
    textColor: 'text-slate-700 dark:text-slate-300',
    icon: Users,
    order: 4,
  },
  GUEST: {
    label: 'Invité',
    description: 'Accès minimal (lecture seule)',
    bgColor: 'bg-gray-50 dark:bg-gray-950/30',
    textColor: 'text-gray-700 dark:text-gray-300',
    icon: HelpCircle,
    order: 5,
  },
};

// ──────────────────────────────
// 3. CATÉGORIE DE PERMIS
// ──────────────────────────────

/**
 * Configuration d’affichage pour chaque catégorie de permis.
 */
export const CATEGORIE_PERMIS_CONFIG: Record<
  CategoriePermis,
  EnumDisplayConfig<CategoriePermis>
> = {
  A: {
    label: 'Catégorie A — Moto',
    description: 'Permis moto – 2 roues',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
    textColor: 'text-indigo-700 dark:text-indigo-300',
    icon: Car,
    order: 1,
  },
  B: {
    label: 'Catégorie B — Voiture',
    description: 'Permis voiture – Permis B',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    textColor: 'text-blue-700 dark:text-blue-300',
    icon: Car,
    order: 2,
  },
  C: {
    label: 'Catégorie C — Poids lourd',
    description: 'Permis poids lourd',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    icon: Car,
    order: 3,
  },
  D: {
    label: 'Catégorie D — Transport en commun',
    description: 'Permis transport en commun',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    textColor: 'text-purple-700 dark:text-purple-300',
    icon: Car,
    order: 4,
  },
  BE: {
    label: 'Catégorie BE — Remorque',
    description: 'Permis BE (remorque)',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    textColor: 'text-amber-700 dark:text-amber-300',
    icon: Car,
    order: 5,
  },
};

// ──────────────────────────────
// 4. STATUT CANDIDAT
// ──────────────────────────────

/**
 * Configuration d’affichage pour le statut d’un candidat.
 */
export const STATUT_CANDIDAT_CONFIG: Record<StatutCandidat, EnumDisplayConfig<StatutCandidat>> = {
  EN_COURS: {
    label: 'En cours',
    description: 'Formation en progression',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    textColor: 'text-blue-700 dark:text-blue-300',
    icon: Clock,
    order: 1,
  },
  RECU: {
    label: 'Reçu',
    description: 'Permis obtenu',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    icon: CheckCircle,
    order: 2,
  },
  ECHOUE: {
    label: 'Échoué',
    description: 'Échec à l’examen',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    textColor: 'text-red-700 dark:text-red-300',
    icon: XCircle,
    order: 3,
  },
  ABANDONNE: {
    label: 'Abandonné',
    description: 'A arrêté la formation',
    bgColor: 'bg-gray-50 dark:bg-gray-950/30',
    textColor: 'text-gray-700 dark:text-gray-300',
    icon: XCircle,
    order: 4,
  },
  EN_ATTENTE: {
    label: 'En attente',
    description: 'Dossier en attente de traitement',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    textColor: 'text-amber-700 dark:text-amber-300',
    icon: AlertCircle,
    order: 5,
  },
};

// ──────────────────────────────
// 5. STATUT VÉHICULE
// ──────────────────────────────

/**
 * Configuration d’affichage pour le statut d’un véhicule.
 */
export const STATUT_VEHICULE_CONFIG: Record<StatutVehicule, EnumDisplayConfig<StatutVehicule>> = {
  DISPONIBLE: {
    label: 'Disponible',
    description: 'Prêt à être utilisé',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    icon: CheckCircle,
    order: 1,
  },
  EN_LECON: {
    label: 'En leçon',
    description: 'Actuellement utilisé pour une leçon',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    textColor: 'text-blue-700 dark:text-blue-300',
    icon: Car,
    order: 2,
  },
  EN_ENTRETIEN: {
    label: 'En entretien',
    description: 'En réparation / entretien',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    textColor: 'text-amber-700 dark:text-amber-300',
    icon: Wrench,
    order: 3,
  },
  HORS_SERVICE: {
    label: 'Hors service',
    description: 'Immobilisé',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    textColor: 'text-red-700 dark:text-red-300',
    icon: XCircle,
    order: 4,
  },
};

// ──────────────────────────────
// 6. TYPE DE LEÇON
// ──────────────────────────────

/**
 * Configuration d’affichage pour le type de leçon.
 */
export const TYPE_LECON_CONFIG: Record<TypeLecon, EnumDisplayConfig<TypeLecon>> = {
  CODE: {
    label: 'Code',
    description: 'Cours de code de la route',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
    textColor: 'text-indigo-700 dark:text-indigo-300',
    icon: GraduationCap,
    order: 1,
  },
  CONDUITE: {
    label: 'Conduite',
    description: 'Leçon de conduite',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    icon: Car,
    order: 2,
  },
  CONDUITE_ACCOMPAGNEE: {
    label: 'Conduite accompagnée',
    description: 'Leçon en conduite accompagnée',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    textColor: 'text-purple-700 dark:text-purple-300',
    icon: CalendarCheck,
    order: 3,
  },
};

// ──────────────────────────────
// 7. STATUT LEÇON
// ──────────────────────────────

/**
 * Configuration d’affichage pour le statut d’une leçon.
 */
export const STATUT_LECON_CONFIG: Record<StatutLecon, EnumDisplayConfig<StatutLecon>> = {
  PLANIFIEE: {
    label: 'Planifiée',
    description: 'À venir',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    textColor: 'text-blue-700 dark:text-blue-300',
    icon: Clock,
    order: 1,
  },
  EFFECTUEE: {
    label: 'Effectuée',
    description: 'Leçon réalisée',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    icon: CheckCircle,
    order: 2,
  },
  ANNULEE: {
    label: 'Annulée',
    description: 'Leçon annulée',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    textColor: 'text-red-700 dark:text-red-300',
    icon: XCircle,
    order: 3,
  },
  ABSENCE: {
    label: 'Absence',
    description: 'Candidat ou moniteur absent',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    textColor: 'text-amber-700 dark:text-amber-300',
    icon: AlertCircle,
    order: 4,
  },
};

// ──────────────────────────────
// 8. TYPE D’EXAMEN
// ──────────────────────────────

/**
 * Configuration d’affichage pour le type d’examen.
 */
export const TYPE_EXAMEN_CONFIG: Record<TypeExamen, EnumDisplayConfig<TypeExamen>> = {
  CODE: {
    label: 'Code',
    description: 'Examen du code de la route',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
    textColor: 'text-indigo-700 dark:text-indigo-300',
    icon: GraduationCap,
    order: 1,
  },
  CONDUITE: {
    label: 'Conduite',
    description: 'Examen pratique de conduite',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    icon: Car,
    order: 2,
  },
};

// ──────────────────────────────
// 9. RÉSULTAT D’EXAMEN
// ──────────────────────────────

/**
 * Configuration d’affichage pour le résultat d’un examen.
 */
export const RESULTAT_EXAMEN_CONFIG: Record<ResultatExamen, EnumDisplayConfig<ResultatExamen>> = {
  EN_ATTENTE: {
    label: 'En attente',
    description: 'Résultat non encore publié',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    textColor: 'text-amber-700 dark:text-amber-300',
    icon: Clock,
    order: 1,
  },
  RECU: {
    label: 'Reçu',
    description: 'Admis',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    icon: CheckCircle,
    order: 2,
  },
  AJOURNE: {
    label: 'Ajourné',
    description: 'Non admis (peut repasser)',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    textColor: 'text-red-700 dark:text-red-300',
    icon: XCircle,
    order: 3,
  },
};

// ──────────────────────────────
// 10. MODE DE PAIEMENT
// ──────────────────────────────

/**
 * Configuration d’affichage pour le mode de paiement.
 */
export const MODE_PAIEMENT_CONFIG: Record<ModePaiement, EnumDisplayConfig<ModePaiement>> = {
  ESPECES: {
    label: 'Espèces',
    description: 'Paiement en numéraire',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    icon: Coins,
    order: 1,
    image: '/images/payments/espece.png',
  },
  CHEQUE: {
    label: 'Chèque',
    description: 'Paiement par chèque',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    textColor: 'text-blue-700 dark:text-blue-300',
    icon: FileText,
    order: 2,
    image: '/images/payments/cheque.png',
  },
  VIREMENT: {
    label: 'Virement',
    description: 'Virement bancaire',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
    textColor: 'text-indigo-700 dark:text-indigo-300',
    icon: ArrowUpCircle,
    order: 3,
    image: '/images/payments/virement.png',
  },
  CARTE: {
    label: 'Carte bancaire',
    description: 'Paiement par carte',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    textColor: 'text-purple-700 dark:text-purple-300',
    icon: CreditCard,
    order: 4,
    image: '/images/payments/carte.png',
  },
  MOBILE_MONEY: {
    label: 'Mobile Money',
    description: 'Paiement mobile (Orange Money, MTN Mobile)',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    textColor: 'text-amber-700 dark:text-amber-300',
    icon: Phone,
    order: 5,
    image: '/images/payments/momo.png',
  },
};

// ──────────────────────────────
// 11. CATÉGORIE DE DÉPENSE
// ──────────────────────────────

/**
 * Configuration d’affichage pour la catégorie de dépense.
 */
export const CATEGORIE_DEPENSE_CONFIG: Record<
  CategorieDepense,
  EnumDisplayConfig<CategorieDepense>
> = {
  CARBURANT: {
    label: 'Carburant',
    description: 'Essence, gazole',
    bgColor: 'bg-slate-50 dark:bg-slate-950/30',
    textColor: 'text-slate-700 dark:text-slate-300',
    icon: Fuel,
    order: 1,
  },
  ENTRETIEN_VEHICULE: {
    label: 'Entretien véhicule',
    description: 'Révisions, pneus, plaquettes',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    textColor: 'text-amber-700 dark:text-amber-300',
    icon: Wrench,
    order: 2,
  },
  SALAIRE: {
    label: 'Salaires',
    description: 'Rémunérations du personnel',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    textColor: 'text-blue-700 dark:text-blue-300',
    icon: Briefcase,
    order: 3,
  },
  LOYER: {
    label: 'Loyer',
    description: 'Loyer des locaux',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
    textColor: 'text-indigo-700 dark:text-indigo-300',
    icon: Building,
    order: 4,
  },
  ELECTRICITE: {
    label: 'Électricité',
    description: 'Facture d’électricité',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
    textColor: 'text-yellow-700 dark:text-yellow-300',
    icon: Zap,
    order: 5,
  },
  TELEPHONE: {
    label: 'Téléphone',
    description: 'Abonnements téléphoniques et internet',
    bgColor: 'bg-teal-50 dark:bg-teal-950/30',
    textColor: 'text-teal-700 dark:text-teal-300',
    icon: Phone,
    order: 6,
  },
  ASSURANCE: {
    label: 'Assurance',
    description: 'Primes d’assurance (véhicules, locaux)',
    bgColor: 'bg-rose-50 dark:bg-rose-950/30',
    textColor: 'text-rose-700 dark:text-rose-300',
    icon: Shield,
    order: 7,
  },
  PUBLICITE: {
    label: 'Publicité',
    description: 'Marketing, annonces',
    bgColor: 'bg-fuchsia-50 dark:bg-fuchsia-950/30',
    textColor: 'text-fuchsia-700 dark:text-fuchsia-300',
    icon: Megaphone,
    order: 8,
  },
  FOURNITURES: {
    label: 'Fournitures',
    description: 'Bureautique, papeterie, etc.',
    bgColor: 'bg-lime-50 dark:bg-lime-950/30',
    textColor: 'text-lime-700 dark:text-lime-300',
    icon: Package,
    order: 9,
  },
  TAXES: {
    label: 'Taxes',
    description: 'Impôts, taxes professionnelles',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    textColor: 'text-orange-700 dark:text-orange-300',
    icon: Landmark,
    order: 10,
  },
  AUTRE: {
    label: 'Autre',
    description: 'Dépenses diverses',
    bgColor: 'bg-gray-50 dark:bg-gray-950/30',
    textColor: 'text-gray-700 dark:text-gray-300',
    icon: MoreHorizontal,
    order: 11,
  },
};

// ──────────────────────────────
// 12. TYPE DE MOUVEMENT (caisse)
// ──────────────────────────────

/**
 * Configuration d’affichage pour le type de mouvement de caisse.
 */
export const TYPE_MOUVEMENT_CONFIG: Record<TypeMouvement, EnumDisplayConfig<TypeMouvement>> = {
  ENTREE: {
    label: 'Entrée',
    description: 'Encaissement (recette)',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    icon: ArrowUpCircle,
    order: 1,
  },
  SORTIE: {
    label: 'Sortie',
    description: 'Décaissement (dépense)',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    textColor: 'text-red-700 dark:text-red-300',
    icon: ArrowDownCircle,
    order: 2,
  },
};

// ──────────────────────────────
// 13. STATUT FACTURE
// ──────────────────────────────

/**
 * Configuration d’affichage pour le statut d’une facture.
 */
export const STATUT_FACTURE_CONFIG: Record<StatutFacture, EnumDisplayConfig<StatutFacture>> = {
  EN_ATTENTE: {
    label: 'En attente',
    description: 'Non réglée',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    textColor: 'text-amber-700 dark:text-amber-300',
    icon: Clock,
    order: 1,
  },
  PARTIELLEMENT_PAYEE: {
    label: 'Partiellement payée',
    description: 'Acompte versé',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    textColor: 'text-blue-700 dark:text-blue-300',
    icon: CreditCard,
    order: 2,
  },
  PAYEE: {
    label: 'Payée',
    description: 'Soldée',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    icon: CheckCircle,
    order: 3,
  },
  ANNULEE: {
    label: 'Annulée',
    description: 'Facture annulée',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    textColor: 'text-red-700 dark:text-red-300',
    icon: XCircle,
    order: 4,
  },
};

// ============================================================
// UTILITAIRES POUR LE FRONTEND
// ============================================================

/**
 * Récupère la configuration d’affichage pour une valeur d’enum donnée.
 * @param configMap - L’objet de configuration (ex: ROLE_CONFIG)
 * @param value - La valeur de l’enum
 * @returns La configuration correspondante, ou une configuration par défaut si non trouvée.
 */
export function getEnumDisplay<T extends string>(
  configMap: Record<T, EnumDisplayConfig<T>>,
  value: T
): EnumDisplayConfig<T> {
  if (configMap[value]) return configMap[value];
  return {
    label: value,
    bgColor: 'bg-gray-50 dark:bg-gray-950/30',
    textColor: 'text-gray-700 dark:text-gray-300',
    icon: HelpCircle,
  };
}
