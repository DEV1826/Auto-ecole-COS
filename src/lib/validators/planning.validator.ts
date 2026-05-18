// src/lib/validators/planning.validator.ts

/**
 * @module lib/validators/planning.validator
 * @description
 * Schémas de validation Zod pour les opérations CRUD sur les leçons (planning) dans l’auto‑école COS.
 * Réutilise les schémas de base (`positiveIntSchema`, `dateSchema`, etc.)
 * définis dans `auth.validator.ts` pour garantir une cohérence à travers l'application.
 *
 * Les messages d'erreur sont intégrés directement dans chaque schéma pour une
 * expérience utilisateur claire.
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @example
 * ```typescript
 * import { createLeconSchema, leconsListSchema } from '@/lib/validators/planning.validator';
 *
 * const result = createLeconSchema.safeParse({
 *   date: '2025-05-20T09:00:00Z',
 *   duree: 60,
 *   type: 'CONDUITE',
 *   candidatId: 42,
 *   moniteurId: 5,
 *   vehiculeId: 3,
 *   notes: 'Séance de régularisation',
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

/** Types de leçon possibles (basés sur l'énumération Prisma) */
export const TYPE_LECON_VALUES = ['CODE', 'CONDUITE', 'CONDUITE_ACCOMPAGNEE'] as const;

/** Statuts de leçon possibles */
export const STATUT_LECON_VALUES = ['PLANIFIEE', 'EFFECTUEE', 'ANNULEE', 'ABSENCE'] as const;

/** Périodes prédéfinies pour le filtrage des dates */
export const PERIOD_VALUES = ['today', 'week', 'month', 'all'] as const;

/** Champs de tri autorisés */
export const SORT_BY_VALUES = ['date', 'duree', 'createdAt'] as const;
export const SORT_ORDER_VALUES = ['asc', 'desc'] as const;

// ============================================================
// SCHÉMAS SPÉCIFIQUES POUR LES LEÇONS
// ============================================================

/**
 * Schéma pour la durée (en minutes, positive, max 240 min).
 * @internal
 */
const dureeSchema = z
  .number({ message: 'La durée doit être un nombre.' })
  .int('La durée doit être un nombre entier.')
  .positive('La durée doit être positive.')
  .max(240, 'La durée ne peut pas dépasser 240 minutes (4 heures).');

/**
 * Schéma pour les notes (optionnelles, max 500 caractères).
 * @internal
 */
const notesSchema = z
  .string()
  .max(500, 'Les notes ne peuvent pas dépasser 500 caractères.')
  .optional()
  .nullable();

/**
 * Schéma de validation pour la création d’une leçon.
 * Tous les champs obligatoires sont validés.
 */
export const createLeconSchema = z.object({
  /** Date et heure de début (ISO 8601) */
  date: dateSchema,
  /** Durée en minutes (positive, max 240) */
  duree: dureeSchema,
  /** Type de leçon (CODE, CONDUITE, CONDUITE_ACCOMPAGNEE) */
  type: z.enum(TYPE_LECON_VALUES, { message: 'Type de leçon invalide.' }),
  /** Identifiant du candidat (doit exister) */
  candidatId: positiveIntSchema,
  /** Identifiant du moniteur (doit exister) */
  moniteurId: positiveIntSchema,
  /** Identifiant du véhicule (optionnel) */
  vehiculeId: positiveIntSchema.optional().nullable(),
  /** Remarques internes (optionnelles) */
  notes: notesSchema,
});

/**
 * Schéma de validation pour la mise à jour d’une leçon (patch partiel).
 * Tous les champs sont optionnels.
 */
export const updateLeconSchema = z.object({
  /** Identifiant de la leçon (requis) */
  id: positiveIntSchema,
  date: dateSchema.optional(),
  duree: dureeSchema.optional(),
  type: z.enum(TYPE_LECON_VALUES).optional(),
  statut: z.enum(STATUT_LECON_VALUES).optional(),
  candidatId: positiveIntSchema.optional(),
  moniteurId: positiveIntSchema.optional(),
  vehiculeId: positiveIntSchema.optional().nullable(),
  notes: notesSchema,
});

/**
 * Schéma pour la suppression d’une leçon.
 * Nécessite seulement l’identifiant.
 */
export const deleteLeconSchema = z.object({
  id: positiveIntSchema,
});

/**
 * Schéma pour la recherche / pagination des leçons.
 * Utilisé dans les listes avec filtres optionnels.
 */
export const leconsListSchema = z.object({
  page: z.number().int().positive().default(1).optional(),
  limit: z.number().int().positive().max(200).default(20).optional(),
  search: z.string().max(100).optional(),
  type: z.enum(TYPE_LECON_VALUES).optional(),
  statut: z.enum(STATUT_LECON_VALUES).optional(),
  candidatId: positiveIntSchema.optional(),
  moniteurId: positiveIntSchema.optional(),
  vehiculeId: positiveIntSchema.optional(),
  dateDebut: dateSchema.optional(),
  dateFin: dateSchema.optional(),
  period: z.enum(PERIOD_VALUES).optional(),
  sortBy: z.enum(SORT_BY_VALUES).default('date').optional(),
  sortOrder: z.enum(SORT_ORDER_VALUES).default('desc').optional(),
});

// ============================================================
// SCHÉMA POUR LES PARAMÈTRES DE PÉRIODE (BETWEEN DATES)
// ============================================================

/**
 * Schéma pour récupérer les leçons entre deux dates.
 */
export const leconsBetweenDatesSchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema,
  moniteurId: positiveIntSchema.optional(),
});

// ============================================================
// TYPES INFÉRÉS
// ============================================================

export type CreateLeconInput = z.infer<typeof createLeconSchema>;
export type UpdateLeconInput = z.infer<typeof updateLeconSchema>;
export type DeleteLeconInput = z.infer<typeof deleteLeconSchema>;
export type LeconsListInput = z.infer<typeof leconsListSchema>;
export type LeconsBetweenDatesInput = z.infer<typeof leconsBetweenDatesSchema>;
