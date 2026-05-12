// src/types/candidats.types.ts

/**
 * @module types/candidats.types
 * @description
 * Types complets pour la gestion des candidats (élèves) dans l’auto‑école COS.
 *
 * Ce module exporte :
 * - `Candidat` : le modèle principal (avec relations)
 * - `CandidatsStats` : métriques agrégées pour les tableaux de bord
 * - `CandidatsTrends` : évolutions temporelles pour les cartes de statistiques
 * - `CandidatsColumnConfig` : contrôle de visibilité des colonnes dans les tableaux
 * - `CandidatsTableActions` : callbacks d’actions sur les lignes
 * - `CandidatsColumnsOptions` : options complètes pour la génération des colonnes
 *
 * Ces types sont utilisés dans les composants `StatsCard`, `DataTable`, `AdminStatsCards`,
 * `SecretaireStatsCards`, `MoniteurStatsCards`, etc.
 *
 * @author Stive Junior
 * @version 2.0.0
 *
 * @see {@link CategoriePermis} – Énumération des catégories de permis
 * @see {@link StatutCandidat} – Énumération des statuts possibles
 * @see {@link Paiement} – Paiements associés
 * @see {@link Lecon} – Leçons suivies
 * @see {@link Examen} – Examens passés
 * @see {@link Facture} – Factures émises
 * @see {@link FormationCandidat} – Formation suivie
 * @see {@link Document} – Documents scannés
 */

import type { CategoriePermis, StatutCandidat } from '@/types/enums';
import type { Paiement } from '@/types/paiements.types';
import type { Lecon } from '@/types/planning.types';
import type { Examen } from '@/types/examens.types';
import type { Facture } from '@/types/factures.types';
import type { FormationCandidat } from '@/types/formations.types';
import type { Document } from '@/types/documents.types';

// ============================================================
// MODÈLE PRINCIPAL
// ============================================================

/**
 * Candidat (élève) – correspond exactement au modèle Prisma `Candidat`.
 *
 * @interface Candidat
 * @description
 * Un candidat représente une personne inscrite à l’auto‑école pour suivre une
 * formation de conduite. Il peut avoir une ou plusieurs relations :
 * paiements, leçons, examens, factures, documents et une formation associée.
 *
 * Le champ `numeroPermis` est unique et n’est renseigné qu’après la réussite
 * de l’examen pratique. Le soft‑delete est géré via `deletedAt`.
 *
 * @property {number} id - Identifiant unique (auto-incrémenté)
 * @property {string} nom - Nom de famille du candidat
 * @property {string} prenom - Prénom du candidat
 * @property {string | null} [email] - Adresse email (unique, peut être null)
 * @property {string | null} [telephone] - Numéro de téléphone (format libre)
 * @property {Date | string | null} [dateNaissance] - Date de naissance (ISO 8601)
 * @property {string | null} [adresse] - Adresse postale complète
 * @property {string | null} [numeroPermis] - Numéro du permis de conduire (unique)
 * @property {CategoriePermis} categorie - Catégorie de permis visée (A, B, C, D, BE)
 * @property {StatutCandidat} statut - État d’avancement du parcours
 * @property {Date | string} dateInscription - Date d’inscription
 * @property {string | null} [notes] - Remarques internes (libre)
 * @property {Date | string} createdAt - Horodatage de création
 * @property {Date | string} updatedAt - Horodatage de dernière modification
 * @property {Date | string | null} [deletedAt] - Date de suppression logique
 *
 * // Relations (optionnelles, chargées selon les besoins)
 * @property {Paiement[]} [paiements] - Liste des paiements effectués
 * @property {Lecon[]} [lecons] - Leçons de conduite ou de code
 * @property {Examen[]} [examens] - Examens passés (code ou conduite)
 * @property {Facture[]} [factures] - Factures émises
 * @property {FormationCandidat | null} [formation] - Formation souscrite
 * @property {Document[]} [documents] - Documents scannés (permis, carte d’identité…)
 *
 * @example
 * ```ts
 * const candidat: Candidat = {
 *   id: 1,
 *   nom: 'Dupont',
 *   prenom: 'Jean',
 *   email: 'jean.dupont@example.com',
 *   telephone: '691234567',
 *   dateNaissance: '1990-05-15',
 *   adresse: '123 Rue de la Paix, Yaoundé',
 *   numeroPermis: null,
 *   categorie: 'B',
 *   statut: 'EN_COURS',
 *   dateInscription: '2024-01-10T08:00:00Z',
 *   notes: 'Bon élève, sérieux.',
 *   createdAt: '2024-01-10T08:00:00Z',
 *   updatedAt: '2024-01-10T08:00:00Z',
 *   deletedAt: null,
 * };
 * ```
 */
export interface Candidat {
  id: number;
  nom: string;
  prenom: string;
  email?: string | null;
  telephone?: string | null;
  dateNaissance?: Date | string | null;
  adresse?: string | null;
  numeroPermis?: string | null;
  categorie: CategoriePermis;
  statut: StatutCandidat;
  dateInscription: Date | string;
  notes?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;

  // Relations (optionnelles, dépendent du niveau de chargement)
  paiements?: Paiement[];
  lecons?: Lecon[];
  examens?: Examen[];
  factures?: Facture[];
  formation?: FormationCandidat | null;
  documents?: Document[];
}

// ============================================================
// STATISTIQUES POUR LE DASHBOARD
// ============================================================

/**
 * Métriques statistiques agrégées pour les candidats.
 * Utilisé dans les composants de cartes statistiques (`StatsCard`, `AdminStatsCards`, etc.)
 *
 * @interface CandidatsStats
 * @description Regroupe les indicateurs clés de l’activité « candidats ».
 *
 * @property {number} total - Nombre total de candidats (tous statuts confondus)
 * @property {number} actifs - Candidats dont le statut est `EN_COURS`
 * @property {number} reçus - Candidats ayant obtenu leur permis (`RECU`)
 * @property {number} echecs - Candidats ayant échoué à l’examen (`ECHOUE`)
 * @property {number} tauxReussite - Pourcentage de réussite (reçus / total d’inscrits terminés)
 *
 * @example
 * ```ts
 * const stats: CandidatsStats = {
 *   total: 156,
 *   actifs: 98,
 *   reçus: 45,
 *   echecs: 13,
 *   tauxReussite: 77.5
 * };
 * ```
 */
export interface CandidatsStats {
  total: number;
  actifs: number;
  reçus: number;
  echecs: number;
  tauxReussite: number;
}

/**
 * Tendances évolutives des indicateurs candidats.
 * Permet d’afficher les variations (par exemple « +12 % ce mois ») dans les cartes.
 *
 * @interface CandidatsTrends
 * @property {number} total - Variation du nombre total (en pourcentage ou valeur absolue)
 * @property {number} actifs - Variation des candidats actifs
 * @property {number} reçus - Variation des candidats reçus
 * @property {number} echecs - Variation des candidats échoués
 *
 * @example
 * ```ts
 * const trends: CandidatsTrends = {
 *   total: 8.5,
 *   actifs: 12,
 *   reçus: 5.2,
 *   echecs: -2
 * };
 * ```
 */
export interface CandidatsTrends {
  total: number;
  actifs: number;
  reçus: number;
  echecs: number;
}

// ============================================================
// CONFIGURATION DES COLONNES DU TABLEAU DES CANDIDATS
// ============================================================

/**
 * Configuration de visibilité des colonnes dans le tableau des candidats.
 * Permet d’adapter dynamiquement l’interface selon le rôle de l’utilisateur
 * (admin, secrétaire, moniteur) ou selon les préférences personnelles.
 *
 * @interface CandidatsColumnConfig
 * @property {boolean} [showFullName] - Afficher l’avatar + le nom complet (défaut : true)
 * @property {boolean} [showEmail] - Afficher l’adresse email (défaut : true)
 * @property {boolean} [showPhone] - Afficher le numéro de téléphone (défaut : true)
 * @property {boolean} [showDateInscription] - Afficher la date d’inscription (défaut : true)
 * @property {boolean} [showCategorie] - Afficher la catégorie de permis (défaut : true)
 * @property {boolean} [showStatut] - Afficher le badge de statut (défaut : true)
 * @property {boolean} [showSolde] - Afficher le montant restant dû (défaut : true pour admin/secrétaire)
 * @property {boolean} [showLeconsCount] - Afficher le nombre de leçons effectuées (défaut : false)
 * @property {boolean} [showExamensCount] - Afficher le nombre d’examens passés (défaut : false)
 * @property {boolean} [showActions] - Afficher le menu d’actions (défaut : true)
 *
 * @example
 * ```ts
 * const config: CandidatsColumnConfig = {
 *   showFullName: true,
 *   showEmail: false,
 *   showPhone: true,
 *   showDateInscription: true,
 *   showCategorie: true,
 *   showStatut: true,
 *   showSolde: true,
 *   showLeconsCount: true,
 *   showExamensCount: false,
 *   showActions: true,
 * };
 * ```
 */
export interface CandidatsColumnConfig {
  showFullName?: boolean;
  showEmail?: boolean;
  showPhone?: boolean;
  showDateInscription?: boolean;
  showCategorie?: boolean;
  showStatut?: boolean;
  showSolde?: boolean;
  showLeconsCount?: boolean;
  showExamensCount?: boolean;
  showActions?: boolean;
}

/**
 * Callbacks d’actions possibles sur une ligne du tableau des candidats.
 * Ces fonctions sont appelées lorsque l’utilisateur clique sur un bouton d’action
 * (voir, éditer, supprimer, etc.) ou sur un des éléments du menu contextuel.
 *
 * @interface CandidatsTableActions
 * @property {(candidat: Candidat) => void} [onView] - Naviguer vers la fiche détaillée
 * @property {(candidat: Candidat) => void} [onEdit] - Ouvrir le formulaire de modification
 * @property {(candidat: Candidat) => Promise<void>} [onDelete] - Supprimer/désactiver le candidat (soft delete)
 * @property {(candidat: Candidat) => void} [onAddPayment] - Ouvrir le formulaire d’ajout de paiement
 * @property {(candidat: Candidat) => void} [onAddLesson] - Ajouter une leçon au planning
 * @property {(candidat: Candidat) => void} [onRegisterExam] - Inscrire le candidat à un examen
 * @property {(candidat: Candidat) => void} [onViewDocuments] - Voir la liste des documents du candidat
 *
 * @example
 * ```ts
 * const actions: CandidatsTableActions = {
 *   onView: (c) => navigate(`/candidats/${c.id}`),
 *   onEdit: (c) => navigate(`/candidats/${c.id}/edit`),
 *   onDelete: async (c) => await deleteCandidat(c.id),
 *   onAddPayment: (c) => navigate(`/paiements/create?candidatId=${c.id}`),
 * };
 * ```
 */
export interface CandidatsTableActions {
  onView?: (candidat: Candidat) => void;
  onEdit?: (candidat: Candidat) => void;
  onDelete?: (candidat: Candidat) => Promise<void>;
  onAddPayment?: (candidat: Candidat) => void;
  onAddLesson?: (candidat: Candidat) => void;
  onRegisterExam?: (candidat: Candidat) => void;
  onViewDocuments?: (candidat: Candidat) => void;
}

/**
 * @interface CandidatsEnrichments
 * @description
 * Données supplémentaires calculées ou issues d’API que le parent peut injecter
 * pour enrichir l’affichage des colonnes (solde, compteurs).
 *
 * @property getSolde       - Montant restant dû (total factures - total paiements)
 * @property getLeconsCount - Nombre de leçons effectuées
 * @property getExamensCount - Nombre d’examens passés
 */
export interface CandidatsEnrichments {
  /** Montant restant dû (en FCFA) */
  getSolde?: (candidat: Candidat) => number;
  /** Nombre de leçons effectuées */
  getLeconsCount?: (candidat: Candidat) => number;
  /** Nombre d’examens passés */
  getExamensCount?: (candidat: Candidat) => number;
}

/**
 * Options complètes pour la génération des colonnes du tableau des candidats.
 * Utilisé par la fonction `getCandidatsColumns` pour construire dynamiquement
 * les colonnes en fonction du rôle de l’utilisateur et des personnalisations.
 *
 * @interface CandidatsColumnsOptions
 * @property {CandidatsColumnConfig} [columnConfig] - Surcharge de la visibilité des colonnes
 * @property {CandidatsTableActions} [actions] - Callbacks d’actions sur les lignes
 * @property {'admin' | 'secretaire' | 'moniteur'} [variant] - Profil utilisateur
 *   - `admin` : affiche toutes les colonnes
 *   - `secretaire` : colonnes adaptées à la gestion quotidienne (email, statut, solde, actions)
 *   - `moniteur` : colonnes réduites (nom, catégorie, leçons)
 *
 * @example
 * ```ts
 * const options: CandidatsColumnsOptions = {
 *   variant: 'secretaire',
 *   columnConfig: { showExamensCount: true },
 *   actions: {
 *     onView: (c) => console.log(c),
 *     onEdit: (c) => console.log('edit', c),
 *   },
 * };
 * const columns = getCandidatsColumns(options);
 * ```
 */
export interface CandidatsColumnsOptions {
  columnConfig?: CandidatsColumnConfig;
  actions?: CandidatsTableActions;
  enrichments?: CandidatsEnrichments;
  variant?: 'admin' | 'secretaire' | 'moniteur';
}
