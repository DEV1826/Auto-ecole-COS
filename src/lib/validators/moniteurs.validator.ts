// src/lib/validators/moniteurs.validator.ts

/**
 * @module lib/validators/moniteurs.validator
 * @description
 * Schémas de validation Zod pour les opérations CRUD sur les moniteurs (instructeurs) dans l’auto‑école COS.
 * Réutilise les schémas de base (`emailSchema`, `nameSchema`, `phoneSchema`, `positiveIntSchema`, `dateSchema`)
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
 * import { createMoniteurSchema, moniteursListSchema } from '@/lib/validators/moniteurs.validator';
 *
 * const result = createMoniteurSchema.safeParse({
 *   nom: 'Dubois',
 *   prenom: 'Marc',
 *   email: 'marc.dubois@cos.com',
 *   telephone: '691234567',
 *   specialite: 'Permis B',
 *   dateEmbauche: '2023-01-15',
 *   actif: true,
 * });
 *
 * if (!result.success) {
 *   console.error(result.error.format());
 * }
 * ```
 */

import { z } from 'zod';
import {
  emailSchema,
  nameSchema,
  phoneSchema,
  positiveIntSchema,
  dateSchema,
} from './auth.validator';

// ============================================================
// CONSTANTES
// ============================================================

/** Champs de tri autorisés pour les moniteurs */
export const SORT_BY_VALUES = ['createdAt', 'dateEmbauche'] as const;
export const SORT_ORDER_VALUES = ['asc', 'desc'] as const;

// ============================================================
// SCHÉMAS SPÉCIFIQUES POUR LES MONITEURS
// ============================================================

/**
 * Schéma pour la spécialité (optionnel, max 200 caractères).
 * @internal
 */
const specialiteSchema = z
  .string()
  .max(200, 'La spécialité ne peut pas dépasser 200 caractères.')
  .optional()
  .nullable();

/**
 * Schéma de validation pour la création d’un moniteur.
 * Tous les champs obligatoires sont validés.
 */
export const createMoniteurSchema = z.object({
  /** Nom de famille */
  nom: nameSchema,
  /** Prénom */
  prenom: nameSchema,
  /** Email (unique, optionnel) */
  email: emailSchema.optional().nullable(),
  /** Téléphone (optionnel) */
  telephone: phoneSchema,
  /** Spécialité (optionnelle) */
  specialite: specialiteSchema,
  /** Date d’embauche (ISO 8601, par défaut maintenant) */
  dateEmbauche: dateSchema.optional(),
  /** Statut actif (défaut: true) */
  actif: z.boolean().default(true).optional(),
});

/**
 * Schéma de validation pour la mise à jour d’un moniteur (patch partiel).
 * Tous les champs sont optionnels.
 */
export const updateMoniteurSchema = z.object({
  /** Identifiant du moniteur (requis) */
  id: positiveIntSchema,
  nom: nameSchema.optional(),
  prenom: nameSchema.optional(),
  email: emailSchema.optional().nullable(),
  telephone: phoneSchema,
  specialite: specialiteSchema,
  dateEmbauche: dateSchema.optional().nullable(),
  actif: z.boolean().optional(),
});

/**
 * Schéma pour la suppression (désactivation) d’un moniteur.
 * Nécessite seulement l’identifiant.
 */
export const deleteMoniteurSchema = z.object({
  id: positiveIntSchema,
});

/**
 * Schéma pour la recherche / pagination des moniteurs.
 * Utilisé dans les listes avec filtres optionnels.
 */
export const moniteursListSchema = z.object({
  page: z.number().int().positive().default(1).optional(),
  limit: z.number().int().positive().max(200).default(20).optional(),
  search: z.string().max(100).optional(),
  actif: z.boolean().optional(),
  sortBy: z.enum(SORT_BY_VALUES).default('createdAt').optional(),
  sortOrder: z.enum(SORT_ORDER_VALUES).default('desc').optional(),
});

// ============================================================
// TYPES INFÉRÉS
// ============================================================

export type CreateMoniteurInput = z.infer<typeof createMoniteurSchema>;
export type UpdateMoniteurInput = z.infer<typeof updateMoniteurSchema>;
export type DeleteMoniteurInput = z.infer<typeof deleteMoniteurSchema>;
export type MoniteursListInput = z.infer<typeof moniteursListSchema>;
