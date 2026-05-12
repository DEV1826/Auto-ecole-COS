// src/types/rapports.types.ts

/**
 * @module types/rapports.types
 * @description
 * Types complets pour les rapports et statistiques de l’auto‑école COS.
 *
 * Ce module exporte :
 * - `RapportFinancier` : synthèse financière (paiements, dépenses, bénéfice)
 * - `RapportCandidats` : statistiques des candidats (par statut, taux réussite)
 * - `RapportLecons` : analyse des leçons (heures par type, par moniteur)
 * - `RapportVehicules` : métriques sur les véhicules (kilométrage, entretiens)
 * - `RapportOptions` : options de génération (période, filtres)
 *
 * @author Stive Junior
 * @version 1.0.0
 */

// ============================================================
// RAPPORTS FINANCIERS
// ============================================================

/**
 * Rapport financier – synthèse des encaissements et dépenses.
 *
 * @interface RapportFinancier
 * @property {number} totalPaiements - Somme de tous les paiements encaissés (période)
 * @property {number} totalDepenses - Somme de toutes les dépenses (période)
 * @property {number} benefice - Différence (totalPaiements - totalDepenses)
 * @property {string} periode - Période concernée (ex: "2025-03", "2025-Q1", "2024")
 *
 * @example
 * ```ts
 * const rapport: RapportFinancier = {
 *   totalPaiements: 4250000,
 *   totalDepenses: 1875000,
 *   benefice: 2375000,
 *   periode: '2025-03',
 * };
 * ```
 */
export interface RapportFinancier {
  totalPaiements: number;
  totalDepenses: number;
  benefice: number;
  periode: string;
}

// ============================================================
// RAPPORTS CANDIDATS
// ============================================================

/**
 * Rapport sur les candidats – statistiques d’inscription et de réussite.
 *
 * @interface RapportCandidats
 * @property {number} totalInscrits - Nombre total de candidats (tous statuts) pendant la période
 * @property {Record<string, number>} parStatut - Répartition par statut (clé = StatutCandidat)
 * @property {number} tauxReussite - Pourcentage de candidats reçus (RECU / total des candidats ayant terminé)
 *
 * @example
 * ```ts
 * const rapport: RapportCandidats = {
 *   totalInscrits: 156,
 *   parStatut: { EN_COURS: 98, RECU: 45, ECHOUE: 13, ABANDONNE: 0, EN_ATTENTE: 0 },
 *   tauxReussite: 77.5,
 * };
 * ```
 */
export interface RapportCandidats {
  totalInscrits: number;
  parStatut: Record<string, number>;
  tauxReussite: number;
}

// ============================================================
// RAPPORTS LEÇONS
// ============================================================

/**
 * Rapport sur les leçons – analyse des heures de conduite et de code.
 *
 * @interface RapportLecons
 * @property {number} totalHeures - Nombre total d’heures de leçons (code + conduite) pendant la période
 * @property {Record<string, number>} parType - Répartition par type (CODE, CONDUITE, CONDUITE_ACCOMPAGNEE)
 * @property {Array<{ moniteurNom: string; heures: number }>} parMoniteur - Heures données par moniteur
 *
 * @example
 * ```ts
 * const rapport: RapportLecons = {
 *   totalHeures: 1250,
 *   parType: { CODE: 320, CONDUITE: 850, CONDUITE_ACCOMPAGNEE: 80 },
 *   parMoniteur: [
 *     { moniteurNom: 'Dubois Marc', heures: 340 },
 *     { moniteurNom: 'Martin Sophie', heures: 295 },
 *   ],
 * };
 * ```
 */
export interface RapportLecons {
  totalHeures: number;
  parType: Record<string, number>;
  parMoniteur: Array<{ moniteurNom: string; heures: number }>;
}

// ============================================================
// RAPPORTS VÉHICULES (optionnel)
// ============================================================

/**
 * Rapport sur les véhicules – kilométrage, entretiens, disponibilité.
 *
 * @interface RapportVehicules
 * @property {number} totalVehicules - Nombre total de véhicules dans le parc
 * @property {number} disponibles - Nombre de véhicules disponibles
 * @property {number} enEntretien - Nombre en entretien
 * @property {number} horsService - Nombre hors service
 * @property {number} kilometrageMoyen - Kilométrage moyen (tous véhicules)
 * @property {number} entretiensAnnee - Nombre d’entretiens effectués dans l’année
 */
export interface RapportVehicules {
  totalVehicules: number;
  disponibles: number;
  enEntretien: number;
  horsService: number;
  kilometrageMoyen: number;
  entretiensAnnee: number;
}

// ============================================================
// OPTIONS DE GÉNÉRATION DE RAPPORTS
// ============================================================

/**
 * Options pour la génération de rapports (filtres, période).
 *
 * @interface RapportOptions
 * @property {string} periode - Période au format 'YYYY-MM' (mois) ou 'YYYY' (année)
 * @property {boolean} [inclureDetails] - Inclure les détails (ex: liste des moniteurs)
 * @property {('financier' | 'candidats' | 'lecons' | 'vehicules')[]} [types] - Types de rapports à générer (tous par défaut)
 */
export interface RapportOptions {
  periode: string;
  inclureDetails?: boolean;
  types?: ('financier' | 'candidats' | 'lecons' | 'vehicules')[];
}

/**
 * Enrichissements optionnels pour personnaliser l’affichage des colonnes
 * dans les tableaux de rapports.
 *
 * @interface RapportsEnrichments
 * @property {(statut: string) => string} [getStatutLabel] - Retourne le libellé localisé d’un statut.
 * @property {(type: string) => string} [getTypeLeconLabel] - Libellé personnalisé pour un type de leçon.
 * @property {(montant: number) => string} [formatCurrency] - Formate un montant en FCFA (ex: "1,2M FCFA").
 * @property {(km: number) => string} [formatKm] - Formate un kilométrage (ex: "12 500 km").
 * @property {(heures: number) => string} [formatHeures] - Formate des heures (ex: "2,5 h").
 */
export interface RapportsEnrichments {
  getStatutLabel?: (statut: string) => string;
  getTypeLeconLabel?: (type: string) => string;
  formatCurrency?: (montant: number) => string;
  formatKm?: (km: number) => string;
  formatHeures?: (heures: number) => string;
}
