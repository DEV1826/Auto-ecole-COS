// src/lib/validators/examens.validator.ts

/**
 * @module lib/validators/examens.validator
 * @description
 * Schémas de validation Zod pour les opérations CRUD sur les examens.
 * Réutilise les schémas de base (`positiveIntSchema`, `dateSchema`, etc.)
 * définis dans `auth.validator.ts`.
 *
 * @author Stive Junior
 * @version 1.0.0
 */

import { z } from 'zod';
import { positiveIntSchema, dateSchema } from './auth.validator';

// ============================================================
// CONSTANTES
// ============================================================

export const TYPE_EXAMEN_VALUES = ['CODE', 'CONDUITE'] as const;
export const RESULTAT_EXAMEN_VALUES = ['EN_ATTENTE', 'RECU', 'AJOURNE'] as const;
export const PERIOD_VALUES = ['today', 'week', 'month', 'all'] as const;
export const SORT_BY_VALUES = ['date', 'note', 'createdAt'] as const;
export const SORT_ORDER_VALUES = ['asc', 'desc'] as const;

// ============================================================
// SCHÉMAS SPÉCIFIQUES
// ============================================================

/**
 * Schéma pour la note (optionnelle, entre 0 et 20, 1 décimale max).
 * @internal
 */
const noteSchema = z
  .number()
  .min(0, 'La note ne peut pas être inférieure à 0.')
  .max(20, 'La note ne peut pas dépasser 20.')
  .multipleOf(0.5, 'La note doit être un multiple de 0.5')
  .optional()
  .nullable();

/**
 * Schéma pour le centre (optionnel, max 200 caractères).
 */
const centreSchema = z.string().max(200).optional().nullable();

/**
 * Schéma pour les remarques (optionnel, max 500 caractères).
 */
const notesSchema = z.string().max(500).optional().nullable();

/**
 * Schéma de validation pour la création d’un examen.
 */
export const createExamenSchema = z.object({
  date: dateSchema,
  type: z.enum(TYPE_EXAMEN_VALUES, { message: 'Type d’examen invalide.' }),
  candidatId: positiveIntSchema,
  centre: centreSchema,
  notes: notesSchema,
});

/**
 * Schéma de validation pour la mise à jour d’un examen (patch partiel).
 */
export const updateExamenSchema = z.object({
  id: positiveIntSchema,
  date: dateSchema.optional(),
  resultat: z.enum(RESULTAT_EXAMEN_VALUES).optional(),
  note: noteSchema,
  centre: centreSchema,
  notes: notesSchema,
});

/**
 * Schéma pour la suppression d’un examen.
 */
export const deleteExamenSchema = z.object({
  id: positiveIntSchema,
});

/**
 * Schéma pour la recherche / pagination des examens.
 */
export const examensListSchema = z.object({
  page: z.number().int().positive().default(1).optional(),
  limit: z.number().int().positive().max(200).default(20).optional(),
  search: z.string().max(100).optional(),
  type: z.enum(TYPE_EXAMEN_VALUES).optional(),
  resultat: z.enum(RESULTAT_EXAMEN_VALUES).optional(),
  candidatId: positiveIntSchema.optional(),
  dateDebut: dateSchema.optional(),
  dateFin: dateSchema.optional(),
  period: z.enum(PERIOD_VALUES).optional(),
  sortBy: z.enum(SORT_BY_VALUES).default('date').optional(),
  sortOrder: z.enum(SORT_ORDER_VALUES).default('desc').optional(),
});

// ============================================================
// TYPES INFÉRÉS
// ============================================================

export type CreateExamenInput = z.infer<typeof createExamenSchema>;
export type UpdateExamenInput = z.infer<typeof updateExamenSchema>;
export type DeleteExamenInput = z.infer<typeof deleteExamenSchema>;
export type ExamensListInput = z.infer<typeof examensListSchema>;
