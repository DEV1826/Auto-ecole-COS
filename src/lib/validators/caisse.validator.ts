// /home/stive-junior/Auto-ecole-COS/src/lib/validators/caisse.validator.ts

/**
 * @module lib/validators/caisse.validator
 * @description
 * Schémas de validation Zod pour les paramètres de la caisse (filtres, pagination, tri).
 * Réutilise les schémas de base (`positiveIntSchema`, `dateSchema`, etc.)
 * définis dans `auth.validator.ts` pour garantir une cohérence à travers l'application.
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @example
 * ```typescript
 * import { caisseListSchema } from '@/lib/validators/caisse.validator';
 *
 * const result = caisseListSchema.safeParse({
 *   page: 2,
 *   limit: 20,
 *   type: 'ENTREE',
 *   period: 'month',
 *   sortBy: 'montant',
 *   sortOrder: 'desc',
 * });
 *
 * if (!result.success) {
 *   console.error(result.error.format());
 * }
 * ```
 */

import { z } from 'zod';
import { dateSchema } from './auth.validator';

// ============================================================
// CONSTANTES
// ============================================================

/** Types de mouvements possibles (basés sur l'énumération Prisma) */
export const TYPE_MOUVEMENT_VALUES = ['ENTREE', 'SORTIE'] as const;

/** Périodes prédéfinies pour le filtrage des dates */
export const PERIOD_VALUES = ['today', 'week', 'month', 'all'] as const;

/** Champs de tri autorisés pour la liste des mouvements */
export const SORT_BY_VALUES = ['date', 'montant', 'solde'] as const;
export const SORT_ORDER_VALUES = ['asc', 'desc'] as const;

// ============================================================
// SCHÉMAS SPÉCIFIQUES POUR LA CAISSE
// ============================================================

/**
 * Schéma de validation pour la recherche / pagination des mouvements de caisse.
 * Utilisé dans les listes avec filtres optionnels.
 *
 * @example
 * ```ts
 * const params = {
 *   page: 2,
 *   limit: 20,
 *   search: 'carburant',
 *   type: 'SORTIE',
 *   period: 'month',
 *   sortBy: 'montant',
 *   sortOrder: 'desc',
 * };
 * const result = caisseListSchema.safeParse(params);
 * ```
 */
export const caisseListSchema = z.object({
  /** Page courante (1-indexed) */
  page: z.number().int().positive().default(1).optional(),
  /** Nombre d’éléments par page (max 200) */
  limit: z.number().int().positive().max(200).default(20).optional(),
  /** Recherche textuelle (description, référence) */
  search: z.string().max(100).optional(),
  /** Filtrer par type de mouvement (ENTREE / SORTIE) */
  type: z.enum(TYPE_MOUVEMENT_VALUES).optional(),
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

/** Type des paramètres de liste paginée des mouvements de caisse */
export type CaisseListInput = z.infer<typeof caisseListSchema>;
