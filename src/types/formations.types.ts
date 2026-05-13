// src/types/formations.types.ts

/**
 * @module types/formations.types
 * @description
 * Types complets pour la gestion des formations dans l’auto‑école COS.
 *
 * Ce module exporte :
 * - `Formation` : le modèle principal
 * - `Tarif` : historique des prix d’une formation
 * - `FormationCandidat` : inscription d’un candidat à une formation (relation)
 * - `FormationsStats` : métriques agrégées (formations actives, prix moyen, etc.)
 * - `FormationsTrends` : évolutions temporelles
 * - `FormationsColumnConfig` : contrôle de visibilité des colonnes dans les tableaux
 * - `FormationsTableActions` : callbacks d’actions sur les lignes
 * - `FormationsColumnsOptions` : options complètes pour la génération des colonnes
 *
 * Ces types sont utilisés dans les composants `StatsCard`, `DataTable`,
 * `AdminStatsCards`, `SecretaireStatsCards`, etc.
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @see {@link CategoriePermis} – Énumération des catégories de permis
 * @see {@link Candidat} – Candidats inscrits
 */

import type { CategoriePermis } from '@/types/enums';
import type { Candidat } from '@/types/candidats.types';

// ============================================================
// MODÈLES PRINCIPAUX
// ============================================================

/**
 * Formation – correspond au modèle Prisma `Formation`.
 *
 * @interface Formation
 * @description
 * Une formation représente une offre pédagogique : permis B, permis moto, conduite accompagnée, etc.
 * Elle définit le nombre d’heures de code et de conduite, ainsi que le prix total (peut être révisé via Tarif).
 *
 * @property {number} id - Identifiant unique (auto-incrémenté)
 * @property {string} nom - Nom de la formation (ex: "Permis B (Voiture)")
 * @property {string | null} [description] - Description détaillée
 * @property {number} prixTotal - Prix total actuel de la formation (en FCFA)
 * @property {number} heuresCode - Nombre d’heures de code obligatoires
 * @property {number} heuresConduite - Nombre d’heures de conduite incluses
 * @property {CategoriePermis} categorie - Catégorie de permis visée (A, B, C, D, BE)
 * @property {boolean} actif - Indique si la formation est encore proposée
 * @property {Date | string} createdAt - Horodatage de création
 * @property {Date | string} updatedAt - Dernière modification
 *
 * @example
 * ```ts
 * const formation: Formation = {
 *   id: 1,
 *   nom: 'Permis B (Voiture)',
 *   description: 'Formation complète pour l’obtention du permis B.',
 *   prixTotal: 250000,
 *   heuresCode: 12,
 *   heuresConduite: 20,
 *   categorie: 'B',
 *   actif: true,
 *   createdAt: '2024-01-01T08:00:00Z',
 *   updatedAt: '2024-01-01T08:00:00Z',
 * };
 * ```
 */
export interface Formation {
  id: number;
  nom: string;
  description?: string | null;
  prixTotal: number;
  heuresCode: number;
  heuresConduite: number;
  categorie: CategoriePermis;
  actif: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Tarif – correspond au modèle Prisma `Tarif`.
 * Historise les changements de prix d’une formation.
 *
 * @interface Tarif
 * @property {number} id - Identifiant unique
 * @property {number} formationId - Formation concernée
 * @property {number} prix - Prix à la date de début
 * @property {Date | string} dateDebut - Date à partir de laquelle ce tarif s’applique
 * @property {Date | string | null} [dateFin] - Date de fin d’application (optionnelle)
 *
 * @example
 * ```ts
 * const tarif: Tarif = {
 *   id: 1,
 *   formationId: 1,
 *   prix: 240000,
 *   dateDebut: '2023-01-01T00:00:00Z',
 *   dateFin: '2024-01-01T00:00:00Z',
 * };
 * ```
 */
export interface Tarif {
  id: number;
  formationId: number;
  prix: number;
  dateDebut: Date | string;
  dateFin?: Date | string | null;
}

/**
 * FormationCandidat – correspond au modèle Prisma `FormationCandidat`.
 * Lie un candidat à une formation avec suivi des heures effectuées.
 *
 * @interface FormationCandidat
 * @property {number} id - Identifiant unique
 * @property {number} candidatId - Candidat inscrit
 * @property {number} formationId - Formation suivie
 * @property {number} heuresCodeEffectuees - Heures de code déjà réalisées
 * @property {number} heuresConduiteEffectuees - Heures de conduite déjà réalisées
 * @property {number} montantTotal - Montant facturé (peut différer du prix actuel)
 * @property {Date | string} dateDebut - Date de début de la formation
 * @property {Date | string | null} [dateFin] - Date de fin (si terminée)
 * @property {Candidat} [candidat] - Détails du candidat (optionnel, chargé)
 * @property {Formation} [formation] - Détails de la formation (optionnel, chargé)
 *
 * @example
 * ```ts
 * const formationCandidat: FormationCandidat = {
 *   id: 1,
 *   candidatId: 42,
 *   formationId: 1,
 *   heuresCodeEffectuees: 8,
 *   heuresConduiteEffectuees: 12,
 *   montantTotal: 250000,
 *   dateDebut: '2024-01-15T00:00:00Z',
 * };
 * ```
 */
export interface FormationCandidat {
  id: number;
  candidatId: number;
  formationId: number;
  heuresCodeEffectuees: number;
  heuresConduiteEffectuees: number;
  montantTotal: number;
  dateDebut: Date | string;
  dateFin?: Date | string | null;
  candidat?: Candidat;
  formation?: Formation;
}

// ============================================================
// STATISTIQUES POUR LE DASHBOARD
// ============================================================

/**
 * Métriques statistiques agrégées pour les formations.
 *
 * @interface FormationsStats
 * @property {number} totalFormations - Nombre de formations (actives et inactives)
 * @property {number} formationsActives - Formations actuellement proposées
 * @property {number} prixMoyen - Prix moyen des formations actives
 * @property {number} dureeMoyenneConduite - Heures de conduite moyennes
 * @property {number} totalInscriptions - Nombre total d’inscriptions (FormationCandidat)
 * @property {number} inscriptionsMois - Inscriptions du mois en cours
 *
 * @example
 * ```ts
 * const stats: FormationsStats = {
 *   totalFormations: 6,
 *   formationsActives: 4,
 *   prixMoyen: 245000,
 *   dureeMoyenneConduite: 20,
 *   totalInscriptions: 158,
 *   inscriptionsMois: 12,
 * };
 * ```
 */
export interface FormationsStats {
  totalFormations: number;
  formationsActives: number;
  prixMoyen: number;
  dureeMoyenneConduite: number;
  totalInscriptions: number;
  inscriptionsMois: number;
}

/**
 * Tendances évolutives des indicateurs de formations.
 *
 * @interface FormationsTrends
 * @property {number} formationsActives - Variation (en pourcentage ou absolu)
 * @property {number} prixMoyen - Variation
 * @property {number} totalInscriptions - Variation
 * @property {number} inscriptionsMois - Variation
 *
 * @example
 * ```ts
 * const trends: FormationsTrends = {
 *   formationsActives: 0,
 *   prixMoyen: 5.2,
 *   totalInscriptions: 8,
 *   inscriptionsMois: -3,
 * };
 * ```
 */
export interface FormationsTrends {
  formationsActives: number;
  prixMoyen: number;
  totalInscriptions: number;
  inscriptionsMois: number;
}

// ============================================================
// CONFIGURATION DES COLONNES DU TABLEAU DES FORMATIONS
// ============================================================

/**
 * Configuration de visibilité des colonnes dans le tableau des formations.
 *
 * @interface FormationsColumnConfig
 * @property {boolean} [showNom] - Afficher le nom de la formation (défaut : true)
 * @property {boolean} [showCategorie] - Afficher la catégorie de permis (badge) (défaut : true)
 * @property {boolean} [showPrix] - Afficher le prix total (défaut : true)
 * @property {boolean} [showHeures] - Afficher "heuresCode / heuresConduite" (défaut : true)
 * @property {boolean} [showActif] - Afficher l’état actif/inactif (badge) (défaut : true)
 * @property {boolean} [showActions] - Afficher le menu d’actions (défaut : true)
 *
 * @example
 * ```ts
 * const config: FormationsColumnConfig = {
 *   showNom: true,
 *   showCategorie: true,
 *   showPrix: true,
 *   showHeures: true,
 *   showActif: true,
 *   showActions: true,
 * };
 * ```
 */
export interface FormationsColumnConfig {
  showNom?: boolean;
  showCategorie?: boolean;
  showPrix?: boolean;
  showHeures?: boolean;
  showNbInscriptions?: boolean;
  showActif?: boolean;
  showActions?: boolean;
}

/**
 * Callbacks d’actions sur une ligne du tableau des formations.
 *
 * @interface FormationsTableActions
 * @property {(formation: Formation) => void} [onView] - Voir le détail de la formation
 * @property {(formation: Formation) => void} [onEdit] - Modifier la formation
 * @property {(formation: Formation) => Promise<void>} [onToggleActive] - Activer / désactiver
 * @property {(formation: Formation) => void} [onViewTarifs] - Voir l’historique des tarifs
 *
 * @example
 * ```ts
 * const actions: FormationsTableActions = {
 *   onView: (f) => navigate(`/formations/${f.id}`),
 *   onEdit: (f) => navigate(`/formations/${f.id}/edit`),
 *   onToggleActive: async (f) => await updateFormation(f.id, { actif: !f.actif }),
 * };
 * ```
 */
export interface FormationsTableActions {
  onView?: (formation: Formation) => void;
  onEdit?: (formation: Formation) => void;
  onToggleActive?: (formation: Formation) => Promise<void>;
  onViewTarifs?: (formation: Formation) => void;
}

/**
 * Enrichissements optionnels pour le tableau des formations.
 * Pour l’instant, pas de relation directe, mais permet d’étendre.
 *
 * @interface FormationsEnrichments
 * @property {(formation: Formation) => number} [getNbInscriptions] - Nombre d’inscriptions à cette formation
 * @property {(formation: Formation) => string} [getDureeFormatee] - Texte personnalisé "Xh code / Yh conduite"
 */
export interface FormationsEnrichments {
  getNbInscriptions?: (formation: Formation) => number;
  getDureeFormatee?: (formation: Formation) => string;
}

/**
 * Options complètes pour la génération des colonnes du tableau des formations.
 *
 * @interface FormationsColumnsOptions
 * @property {FormationsColumnConfig} [columnConfig] - Surcharge de la visibilité des colonnes
 * @property {FormationsEnrichments} [enrichments] - Enrichissements optionnels
 * @property {FormationsTableActions} [actions] - Callbacks d’actions sur les lignes
 * @property {'admin' | 'secretaire'} [variant] - Profil utilisateur
 *   - `admin` : toutes les colonnes (nom, catégorie, prix, heures, actif, actions)
 *   - `secretaire` : colonnes essentielles (nom, catégorie, prix, actif)
 *
 * @example
 * ```ts
 * const options: FormationsColumnsOptions = {
 *   variant: 'admin',
 *   actions: { onView: (f) => console.log(f) },
 * };
 * const columns = getFormationsColumns(options);
 * ```
 */
export interface FormationsColumnsOptions {
  columnConfig?: FormationsColumnConfig;
  actions?: FormationsTableActions;
  enrichments?: FormationsEnrichments;
  variant?: 'admin' | 'secretaire';
}
