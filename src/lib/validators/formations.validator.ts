// src/lib/validators/formations.validator.ts

/**
 * @module lib/validators/formations.validator
 * @description
 * Schémas de validation Zod pour les opérations CRUD sur les formations (offres pédagogiques).
 * Réutilise les schémas de base (`nameSchema`, `positiveIntSchema`, etc.)
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
 * import { createFormationSchema, updateFormationSchema } from '@/lib/validators/formations.validator';
 *
 * const result = createFormationSchema.safeParse({
 *   nom: 'Permis B',
 *   description: 'Formation complète pour l’obtention du permis B.',
 *   prixTotal: 250000,
 *   heuresCode: 12,
 *   heuresConduite: 20,
 *   categorie: 'B',
 *   actif: true,
 * });
 * if (!result.success) {
 *   console.error(result.error.format());
 * }
 * ```
 */

import { z } from 'zod';
import { nameSchema, positiveIntSchema } from './auth.validator';

// ============================================================
// CONSTANTES
// ============================================================

/** Valeurs possibles pour la catégorie de permis (basées sur l'énumération Prisma) */
export const CATEGORIE_PERMIS_VALUES = ['A', 'B', 'C', 'D', 'BE'] as const;

// ============================================================
// SCHÉMAS SPÉCIFIQUES POUR LES FORMATIONS
// ============================================================

/**
 * Schéma pour un prix (nombre entier positif, maximum raisonnable pour éviter les abus).
 * @internal
 */
const prixSchema = z
  .number()
  .int()
  .positive()
  .max(100_000_000, 'Le prix ne peut pas dépasser 100 millions FCFA');

/**
 * Schéma pour un nombre d'heures (entier positif, max 500h pour éviter les saisies aberrantes).
 * @internal
 */
const heuresSchema = z
  .number()
  .int()
  .positive()
  .max(500, 'Le nombre d’heures ne peut pas dépasser 500');

/**
 * Schéma de validation pour la création d’une formation.
 * Tous les champs requis sont présents ; les champs optionnels (description) peuvent être null.
 */
export const createFormationSchema = z.object({
  /** Nom de la formation (requis) */
  nom: nameSchema,
  /** Description détaillée (optionnelle) */
  description: z
    .string()
    .max(500, 'La description ne peut pas dépasser 500 caractères')
    .optional()
    .nullable(),
  /** Prix total en FCFA (entier positif) */
  prixTotal: prixSchema,
  /** Nombre d’heures de code obligatoires */
  heuresCode: heuresSchema,
  /** Nombre d’heures de conduite incluses */
  heuresConduite: heuresSchema,
  /** Catégorie de permis visée (A, B, C, D, BE) */
  categorie: z.enum(CATEGORIE_PERMIS_VALUES, { message: 'Catégorie de permis invalide.' }),
  /** Indique si la formation est active (défaut: true) */
  actif: z.boolean().default(true).optional(),
});

/**
 * Schéma de validation pour la mise à jour d’une formation.
 * Tous les champs sont optionnels pour permettre des mises à jour partielles.
 */
export const updateFormationSchema = z.object({
  /** Identifiant de la formation (requis) */
  id: positiveIntSchema,
  /** Nom de la formation (optionnel) */
  nom: nameSchema.optional(),
  /** Description (optionnelle) */
  description: z.string().max(500).optional().nullable(),
  /** Prix total (optionnel) */
  prixTotal: prixSchema.optional(),
  /** Heures de code (optionnel) */
  heuresCode: heuresSchema.optional(),
  /** Heures de conduite (optionnel) */
  heuresConduite: heuresSchema.optional(),
  /** Catégorie de permis (optionnel) */
  categorie: z.enum(CATEGORIE_PERMIS_VALUES).optional(),
  /** Statut actif/inactif (optionnel) */
  actif: z.boolean().optional(),
});

/**
 * Schéma pour la suppression (soft delete ou désactivation) d’une formation.
 * Nécessite seulement l’identifiant.
 */
export const deleteFormationSchema = z.object({
  id: positiveIntSchema,
});

/**
 * Schéma pour la recherche / pagination des formations.
 * Utilisé dans les listes avec filtres optionnels.
 */
export const formationsListSchema = z.object({
  /** Page courante (1-indexed) */
  page: z.number().int().positive().default(1).optional(),
  /** Nombre d’éléments par page (max 200) */
  limit: z.number().int().positive().max(200).default(20).optional(),
  /** Terme de recherche (dans le nom) */
  search: z.string().max(50).optional(),
  /** Filtrer par catégorie de permis */
  categorie: z.enum(CATEGORIE_PERMIS_VALUES).optional(),
  /** Filtrer par statut actif/inactif */
  actif: z.boolean().optional(),
});

// ============================================================
// TYPES INFÉRÉS POUR UNE UTILISATION SÉCURISÉE
// ============================================================

/** Type des données attendues pour la création d’une formation */
export type CreateFormationInput = z.infer<typeof createFormationSchema>;
/** Type des données attendues pour la mise à jour d’une formation */
export type UpdateFormationInput = z.infer<typeof updateFormationSchema>;
/** Type des données pour la suppression d’une formation */
export type DeleteFormationInput = z.infer<typeof deleteFormationSchema>;
/** Type des paramètres de liste paginée des formations */
export type FormationsListInput = z.infer<typeof formationsListSchema>;
