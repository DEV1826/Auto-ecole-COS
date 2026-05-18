// src/lib/validators/paiements.validator.ts

/**
 * @module lib/validators/paiements.validator
 * @description
 * Schémas de validation Zod pour les opérations CRUD sur les paiements.
 * Réutilise les schémas de base (`positiveIntSchema`, `dateSchema`, etc.)
 * définis dans `auth.validator.ts` pour garantir une cohérence à travers l'application.
 *
 * Les messages d'erreur sont centralisés dans `VALIDATION_ERRORS` pour maintenir
 * l’uniformité des retours utilisateur.
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @example
 * ```typescript
 * import { createPaiementSchema, paiementsListSchema } from '@/lib/validators/paiements.validator';
 *
 * const result = createPaiementSchema.safeParse({
 *   montant: 50000,
 *   mode: 'MOBILE_MONEY',
 *   candidatId: 42,
 *   reference: 'MTN-789456',
 *   note: 'Acompte permis B',
 *   factureId: 101,
 * });
 *
 * if (!result.success) {
 *   console.error(result.error.format());
 * }
 * ```
 */

import { z } from 'zod';
import { positiveIntSchema, dateSchema } from './auth.validator';

// ============================================================
// CONSTANTES
// ============================================================

/** Modes de paiement possibles (basés sur l'énumération Prisma) */
export const MODE_PAIEMENT_VALUES = [
  'ESPECES',
  'CHEQUE',
  'VIREMENT',
  'CARTE',
  'MOBILE_MONEY',
] as const;

/** Périodes prédéfinies pour le filtrage des dates */
export const PERIOD_VALUES = ['today', 'week', 'month', 'all'] as const;

/** Champs de tri autorisés */
export const SORT_BY_VALUES = ['date', 'montant', 'createdAt'] as const;
export const SORT_ORDER_VALUES = ['asc', 'desc'] as const;

// ============================================================
// SCHÉMAS SPÉCIFIQUES POUR LES PAIEMENTS
// ============================================================

/**
 * Schéma pour le montant (entier strictement positif, max 100 millions FCFA).
 * @internal
 */
const montantSchema = z
  .number({ message: 'Le montant doit être un nombre.' })
  .int({ message: 'Le montant doit être un nombre entier.' })
  .positive('Le montant doit être positif.')
  .max(100_000_000, 'Le montant ne peut pas dépasser 100 millions FCFA');

/**
 * Schéma pour une référence (optionnelle, max 100 caractères).
 * @internal
 */
const referenceSchema = z
  .string()
  .max(100, 'La référence ne peut pas dépasser 100 caractères')
  .optional()
  .nullable();

/**
 * Schéma pour une note (optionnelle, max 255 caractères).
 * @internal
 */
const noteSchema = z
  .string()
  .max(255, 'La note ne peut pas dépasser 255 caractères')
  .optional()
  .nullable();

/**
 * Schéma de validation pour la création d’un paiement.
 * Tous les champs requis sont présents ; les champs optionnels sont optionnels.
 */
export const createPaiementSchema = z.object({
  /** Montant en FCFA (>0) */
  montant: montantSchema,
  /** Mode de paiement */
  mode: z.enum(MODE_PAIEMENT_VALUES, { message: 'Mode de paiement invalide.' }),
  /** Identifiant du candidat (doit exister) */
  candidatId: positiveIntSchema,
  /** Date du paiement (optionnelle, par défaut maintenant) */
  date: dateSchema.optional(),
  /** Référence externe (numéro de chèque, transaction, etc.) */
  reference: referenceSchema,
  /** Note interne (ex: "Acompte", "Solde") */
  note: noteSchema,
  /** Identifiant de la facture associée (optionnel) */
  factureId: positiveIntSchema.optional().nullable(),
});

/**
 * Schéma de validation pour la mise à jour d’un paiement.
 * Seuls les champs non-financiers sont modifiables (candidatId non modifiable).
 */
export const updatePaiementSchema = z.object({
  /** Identifiant du paiement (requis) */
  id: positiveIntSchema,
  /** Montant (non modifiable – mais laissé pour compatibilité, sera ignoré côté service) */
  montant: montantSchema.optional(),
  /** Mode (non modifiable) */
  mode: z.enum(MODE_PAIEMENT_VALUES).optional(),
  /** Date (non modifiable) */
  date: dateSchema.optional(),
  /** Référence externe */
  reference: referenceSchema,
  /** Note interne */
  note: noteSchema,
  /** Facture associée */
  factureId: positiveIntSchema.optional().nullable(),
});

/**
 * Schéma pour la suppression d’un paiement.
 * Nécessite seulement l’identifiant.
 */
export const deletePaiementSchema = z.object({
  id: positiveIntSchema,
});

/**
 * Schéma pour la recherche / pagination des paiements.
 * Utilisé dans les listes avec filtres optionnels.
 *
 * @example
 * ```ts
 * const params = {
 *   page: 2,
 *   limit: 20,
 *   mode: 'MOBILE_MONEY',
 *   period: 'month',
 *   sortBy: 'montant',
 *   sortOrder: 'desc',
 * };
 * const result = paiementsListSchema.safeParse(params);
 * ```
 */
export const paiementsListSchema = z.object({
  /** Page courante (1-indexed) */
  page: z.number().int().positive().default(1).optional(),
  /** Nombre d’éléments par page (max 200) */
  limit: z.number().int().positive().max(200).default(20).optional(),
  /** Recherche textuelle (référence, note, nom/prénom candidat) */
  search: z.string().max(100).optional(),
  /** Filtrer par mode de paiement */
  mode: z.enum(MODE_PAIEMENT_VALUES).optional(),
  /** Filtrer par candidat */
  candidatId: positiveIntSchema.optional(),
  /** Filtrer par facture */
  factureId: positiveIntSchema.optional(),
  /** Date de début (inclus) */
  dateDebut: dateSchema.optional(),
  /** Date de fin (inclus) */
  dateFin: dateSchema.optional(),
  /** Période prédéfinie (remplace dateDebut/dateFin) */
  period: z.enum(PERIOD_VALUES).optional(),
  /** Champ de tri */
  sortBy: z.enum(SORT_BY_VALUES).default('date').optional(),
  /** Sens du tri */
  sortOrder: z.enum(SORT_ORDER_VALUES).default('desc').optional(),
});

// ============================================================
// TYPES INFÉRÉS POUR UNE UTILISATION SÉCURISÉE
// ============================================================

/** Type des données attendues pour la création d’un paiement */
export type CreatePaiementInput = z.infer<typeof createPaiementSchema>;

/** Type des données attendues pour la mise à jour d’un paiement */
export type UpdatePaiementInput = z.infer<typeof updatePaiementSchema>;

/** Type des données pour la suppression d’un paiement */
export type DeletePaiementInput = z.infer<typeof deletePaiementSchema>;

/** Type des paramètres de liste paginée des paiements */
export type PaiementsListInput = z.infer<typeof paiementsListSchema>;
