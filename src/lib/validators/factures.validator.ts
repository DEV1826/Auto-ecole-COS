// src/lib/validators/factures.validator.ts

/**
 * @module lib/validators/factures.validator
 * @description
 * Schémas de validation Zod pour les opérations CRUD sur les factures.
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
 * import { createFactureSchema, updateFactureSchema } from '@/lib/validators/factures.validator';
 *
 * const result = createFactureSchema.safeParse({
 *   candidatId: 42,
 *   montantTotal: 250000,
 *   dateEmission: '2025-01-15T08:00:00Z',
 *   dateEcheance: '2025-02-15T23:59:59Z',
 *   notes: 'Formation B – acompte',
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

/** Statuts possibles pour une facture (basés sur l'énumération Prisma) */
export const STATUT_FACTURE_VALUES = [
  'EN_ATTENTE',
  'PARTIELLEMENT_PAYEE',
  'PAYEE',
  'ANNULEE',
] as const;

/** Périodes prédéfinies pour le filtrage des dates d'émission */
export const PERIOD_VALUES = ['today', 'week', 'month', 'all'] as const;

/** Champs de tri autorisés pour la liste des factures */
export const SORT_BY_VALUES = ['numero', 'montantTotal', 'dateEmission', 'createdAt'] as const;
export const SORT_ORDER_VALUES = ['asc', 'desc'] as const;

// ============================================================
// SCHÉMAS SPÉCIFIQUES POUR LES FACTURES
// ============================================================

/**
 * Schéma pour le montant total (entier positif, max 100 millions FCFA).
 * @internal
 */
const montantSchema = z
  .number({ message: 'Le montant doit être un nombre.' })
  .int({ message: 'Le montant doit être un nombre entier.' })
  .positive('Le montant doit être positif.')
  .max(100_000_000, 'Le montant ne peut pas dépasser 100 millions FCFA');

/**
 * Schéma pour une note ou commentaire (optionnelle, max 500 caractères).
 * @internal
 */
const notesSchema = z
  .string()
  .max(500, 'La note ne peut pas dépasser 500 caractères')
  .optional()
  .nullable();

/**
 * Schéma pour le numéro de facture (optionnel, si fourni doit respecter un format de base).
 * @internal
 */
const numeroSchema = z
  .string()
  .regex(/^FAC-\d{4}-\d{5}$/, 'Le numéro de facture doit suivre le format FAC-YYYY-XXXXX')
  .optional();

/**
 * Schéma de validation pour la création d’une facture.
 * Tous les champs requis sont présents ; les champs optionnels sont optionnels.
 */
export const createFactureSchema = z.object({
  /** Identifiant du candidat (doit exister) */
  candidatId: positiveIntSchema,
  /** Montant total de la facture en FCFA (>0) */
  montantTotal: montantSchema,
  /** Date d’émission (ISO 8601, par défaut maintenant) */
  dateEmission: dateSchema.optional(),
  /** Date d’échéance (optionnelle) */
  dateEcheance: dateSchema.optional().nullable(),
  /** Notes internes (optionnelles) */
  notes: notesSchema,
  /** Numéro personnalisé (optionnel – auto‑généré si absent) */
  numero: numeroSchema,
});

/**
 * Schéma de validation pour la mise à jour d’une facture.
 * Tous les champs sont optionnels (patch partiel).
 */
export const updateFactureSchema = z.object({
  /** Identifiant de la facture (requis) */
  id: positiveIntSchema,
  /** Nouveau statut (optionnel) */
  statut: z.enum(STATUT_FACTURE_VALUES).optional(),
  /** Nouvelle date d’échéance (optionnelle) */
  dateEcheance: dateSchema.optional().nullable(),
  /** Nouvelles notes (optionnelles) */
  notes: notesSchema,
  /** Chemin du PDF (optionnel, généralement généré automatiquement) */
  pdfPath: z.string().max(255).optional().nullable(),
});

/**
 * Schéma pour la suppression d’une facture.
 * Nécessite seulement l’identifiant.
 */
export const deleteFactureSchema = z.object({
  id: positiveIntSchema,
});

/**
 * Schéma pour la recherche / pagination des factures.
 * Utilisé dans les listes avec filtres optionnels.
 *
 * @example
 * ```ts
 * const params = {
 *   page: 2,
 *   limit: 20,
 *   statut: 'PARTIELLEMENT_PAYEE',
 *   period: 'month',
 *   sortBy: 'dateEmission',
 *   sortOrder: 'desc',
 * };
 * const result = facturesListSchema.safeParse(params);
 * ```
 */
export const facturesListSchema = z.object({
  /** Page courante (1-indexed) */
  page: z.number().int().positive().default(1).optional(),
  /** Nombre d’éléments par page (max 200) */
  limit: z.number().int().positive().max(200).default(20).optional(),
  /** Recherche textuelle (numéro de facture ou nom candidat) */
  search: z.string().max(100).optional(),
  /** Filtrer par statut */
  statut: z.enum(STATUT_FACTURE_VALUES).optional(),
  /** Filtrer par candidat */
  candidatId: positiveIntSchema.optional(),
  /** Date d’émission début (inclus) */
  dateDebut: dateSchema.optional(),
  /** Date d’émission fin (inclus) */
  dateFin: dateSchema.optional(),
  /** Période prédéfinie (remplace dateDebut/dateFin) */
  period: z.enum(PERIOD_VALUES).optional(),
  /** Champ de tri */
  sortBy: z.enum(SORT_BY_VALUES).default('dateEmission').optional(),
  /** Sens du tri */
  sortOrder: z.enum(SORT_ORDER_VALUES).default('desc').optional(),
});

// ============================================================
// TYPES INFÉRÉS POUR UNE UTILISATION SÉCURISÉE
// ============================================================

/** Type des données attendues pour la création d’une facture */
export type CreateFactureInput = z.infer<typeof createFactureSchema>;

/** Type des données attendues pour la mise à jour d’une facture */
export type UpdateFactureInput = z.infer<typeof updateFactureSchema>;

/** Type des données pour la suppression d’une facture */
export type DeleteFactureInput = z.infer<typeof deleteFactureSchema>;

/** Type des paramètres de liste paginée des factures */
export type FacturesListInput = z.infer<typeof facturesListSchema>;
