// src/lib/validators/depenses.validator.ts

/**
 * @module lib/validators/depenses.validator
 * @description
 * Schémas de validation Zod pour les opérations CRUD sur les dépenses.
 * Réutilise les schémas de base (`positiveIntSchema`, `dateSchema`, etc.)
 * définis dans `auth.validator.ts` pour garantir une cohérence à travers l'application.
 *
 * @author Stive Junior
 * @version 1.0.0
 */

import { z } from 'zod';
import { positiveIntSchema, dateSchema } from './auth.validator';

// ============================================================
// CONSTANTES
// ============================================================

/** Catégories de dépense possibles (basées sur l'énumération Prisma) */
export const CATEGORIE_DEPENSE_VALUES = [
  'CARBURANT',
  'ENTRETIEN_VEHICULE',
  'SALAIRE',
  'LOYER',
  'ELECTRICITE',
  'TELEPHONE',
  'ASSURANCE',
  'PUBLICITE',
  'FOURNITURES',
  'TAXES',
  'AUTRE',
] as const;

/** Périodes prédéfinies pour le filtrage des dates */
export const PERIOD_VALUES = ['today', 'week', 'month', 'all'] as const;

/** Champs de tri autorisés */
export const SORT_BY_VALUES = ['date', 'montant', 'createdAt'] as const;
export const SORT_ORDER_VALUES = ['asc', 'desc'] as const;

// ============================================================
// SCHÉMAS SPÉCIFIQUES POUR LES DÉPENSES
// ============================================================

/**
 * Schéma pour le montant (entier positif, max 100 millions FCFA).
 * @internal
 */
const montantSchema = z
  .number({ message: 'Le montant doit être un nombre.' })
  .int({ message: 'Le montant doit être un nombre entier.' })
  .positive('Le montant doit être positif.')
  .max(100_000_000, 'Le montant ne peut pas dépasser 100 millions FCFA');

/**
 * Schéma de validation pour la création d'une dépense.
 */
export const createDepenseSchema = z.object({
  /** Catégorie de dépense */
  categorie: z.enum(CATEGORIE_DEPENSE_VALUES, { message: 'Catégorie de dépense invalide.' }),
  /** Montant en FCFA */
  montant: montantSchema,
  /** Description (optionnelle) */
  description: z.string().max(500, 'La description ne peut pas dépasser 500 caractères').optional(),
  /** Date de la dépense (ISO 8601, défaut = maintenant) */
  date: dateSchema.optional(),
  /** Fournisseur (optionnel) */
  fournisseur: z.string().max(200).optional().nullable(),
  /** Référence externe (optionnelle) */
  reference: z.string().max(100).optional().nullable(),
  /** Véhicule associé (optionnel) */
  vehiculeId: positiveIntSchema.optional().nullable(),
});

/**
 * Schéma de validation pour la mise à jour d'une dépense.
 * Tous les champs sont optionnels.
 */
export const updateDepenseSchema = z.object({
  /** Identifiant de la dépense (requis) */
  id: positiveIntSchema,
  categorie: z.enum(CATEGORIE_DEPENSE_VALUES).optional(),
  montant: montantSchema.optional(),
  description: z.string().max(500).optional().nullable(),
  date: dateSchema.optional(),
  fournisseur: z.string().max(200).optional().nullable(),
  reference: z.string().max(100).optional().nullable(),
  vehiculeId: positiveIntSchema.optional().nullable(),
});

/**
 * Schéma pour la suppression d'une dépense.
 */
export const deleteDepenseSchema = z.object({
  id: positiveIntSchema,
});

/**
 * Schéma pour la recherche / pagination des dépenses.
 */
export const depensesListSchema = z.object({
  page: z.number().int().positive().default(1).optional(),
  limit: z.number().int().positive().max(200).default(20).optional(),
  search: z.string().max(100).optional(),
  categorie: z.enum(CATEGORIE_DEPENSE_VALUES).optional(),
  vehiculeId: positiveIntSchema.optional(),
  dateDebut: dateSchema.optional(),
  dateFin: dateSchema.optional(),
  period: z.enum(PERIOD_VALUES).optional(),
  sortBy: z.enum(SORT_BY_VALUES).default('date').optional(),
  sortOrder: z.enum(SORT_ORDER_VALUES).default('desc').optional(),
});

// ============================================================
// TYPES INFÉRÉS
// ============================================================

export type CreateDepenseInput = z.infer<typeof createDepenseSchema>;
export type UpdateDepenseInput = z.infer<typeof updateDepenseSchema>;
export type DeleteDepenseInput = z.infer<typeof deleteDepenseSchema>;
export type DepensesListInput = z.infer<typeof depensesListSchema>;
