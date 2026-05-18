// src/lib/validators/vehicules.validator.ts

/**
 * @module lib/validators/vehicules.validator
 * @description
 * Schémas de validation Zod pour les opérations CRUD sur les véhicules et leurs entretiens.
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
 * import { createVehiculeSchema, vehiculesListSchema } from '@/lib/validators/vehicules.validator';
 *
 * const result = createVehiculeSchema.safeParse({
 *   immatriculation: 'LT-123-AB',
 *   marque: 'Toyota',
 *   modele: 'Yaris',
 *   annee: 2022,
 *   categorie: 'B',
 *   kilometrage: 12500,
 *   statut: 'DISPONIBLE',
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

/** Catégories de permis valides (basées sur l'énumération Prisma) */
export const CATEGORIE_PERMIS_VALUES = ['A', 'B', 'C', 'D', 'BE'] as const;

/** Statuts de véhicule possibles */
export const STATUT_VEHICULE_VALUES = [
  'DISPONIBLE',
  'EN_LECON',
  'EN_ENTRETIEN',
  'HORS_SERVICE',
] as const;

/** Périodes prédéfinies pour le filtrage des dates (acquisition) */
export const PERIOD_VALUES = ['today', 'week', 'month', 'all'] as const;

/** Champs de tri autorisés pour les véhicules */
export const SORT_BY_VALUES = ['dateAcquisition', 'kilometrage', 'createdAt'] as const;
export const SORT_ORDER_VALUES = ['asc', 'desc'] as const;

// ============================================================
// SCHÉMAS SPÉCIFIQUES POUR LES VÉHICULES
// ============================================================

/**
 * Schéma pour l'immatriculation (lettres, chiffres, tirets, max 20).
 * @internal
 */
const immatriculationSchema = z
  .string()
  .min(1, 'L’immatriculation est requise.')
  .max(20, 'L’immatriculation ne peut pas dépasser 20 caractères.')
  .regex(
    /^[A-Z0-9-]+$/i,
    'L’immatriculation ne peut contenir que des lettres, chiffres et tirets.'
  );

/**
 * Schéma pour la marque ou le modèle (lettres, espaces, chiffres, max 50).
 * @internal
 */
const marqueModeleSchema = z
  .string()
  .min(1, 'Ce champ est requis.')
  .max(50, 'Ce champ ne peut pas dépasser 50 caractères.')
  .regex(/^[A-Za-z0-9\s-]+$/, 'Caractères non autorisés.');

/**
 * Schéma pour l'année (entre 1950 et année en cours + 1).
 * @internal
 */
const anneeSchema = z
  .number()
  .int('L’année doit être un nombre entier.')
  .min(1950, 'L’année doit être supérieure ou égale à 1950.')
  .max(
    new Date().getFullYear() + 1,
    `L’année ne peut pas dépasser ${new Date().getFullYear() + 1}.`
  );

/**
 * Schéma pour le kilométrage (entier >= 0).
 * @internal
 */
const kilometrageSchema = z
  .number()
  .int('Le kilométrage doit être un nombre entier.')
  .min(0, 'Le kilométrage ne peut pas être négatif.')
  .max(1_000_000, 'Le kilométrage ne peut pas dépasser 1 million de km.');

/**
 * Schéma pour le coût d’un entretien (optionnel, >= 0, max 100M FCFA).
 * @internal
 */
const coutSchema = z
  .number()
  .min(0, 'Le coût ne peut pas être négatif.')
  .max(100_000_000, 'Le coût ne peut pas dépasser 100 millions FCFA')
  .optional();

// ============================================================
// SCHÉMAS CRUD VÉHICULES
// ============================================================

/**
 * Schéma de validation pour la création d’un véhicule.
 * Tous les champs obligatoires sont validés.
 */
export const createVehiculeSchema = z.object({
  /** Plaque d'immatriculation (unique) */
  immatriculation: immatriculationSchema,
  /** Marque du véhicule */
  marque: marqueModeleSchema,
  /** Modèle */
  modele: marqueModeleSchema,
  /** Année de fabrication */
  annee: anneeSchema,
  /** Catégorie de permis requise */
  categorie: z.enum(CATEGORIE_PERMIS_VALUES, { message: 'Catégorie de permis invalide.' }),
  /** Kilométrage initial (défaut 0) */
  kilometrage: kilometrageSchema.default(0).optional(),
  /** Date d’acquisition (ISO 8601) – par défaut maintenant */
  dateAcquisition: dateSchema.optional(),
  /** Date de la dernière révision (optionnelle) */
  dateDerniereRevision: dateSchema.optional().nullable(),
  /** Kilométrage recommandé pour la prochaine révision (optionnel) */
  prochaineRevisionKm: kilometrageSchema.optional().nullable(),
  /** Statut initial (défaut DISPONIBLE) */
  statut: z.enum(STATUT_VEHICULE_VALUES).default('DISPONIBLE').optional(),
});

/**
 * Schéma pour la mise à jour d’un véhicule (patch partiel).
 * Tous les champs sont optionnels.
 */
export const updateVehiculeSchema = z.object({
  /** Identifiant du véhicule (requis) */
  id: positiveIntSchema,
  immatriculation: immatriculationSchema.optional(),
  marque: marqueModeleSchema.optional(),
  modele: marqueModeleSchema.optional(),
  annee: anneeSchema.optional(),
  categorie: z.enum(CATEGORIE_PERMIS_VALUES).optional(),
  kilometrage: kilometrageSchema.optional(),
  dateAcquisition: dateSchema.optional().nullable(),
  dateDerniereRevision: dateSchema.optional().nullable(),
  prochaineRevisionKm: kilometrageSchema.optional().nullable(),
  statut: z.enum(STATUT_VEHICULE_VALUES).optional(),
});

/**
 * Schéma pour la suppression (désactivation) d’un véhicule.
 */
export const deleteVehiculeSchema = z.object({
  id: positiveIntSchema,
});

/**
 * Schéma pour la recherche / pagination des véhicules.
 */
export const vehiculesListSchema = z.object({
  page: z.number().int().positive().default(1).optional(),
  limit: z.number().int().positive().max(200).default(20).optional(),
  search: z.string().max(100).optional(),
  categorie: z.enum(CATEGORIE_PERMIS_VALUES).optional(),
  statut: z.enum(STATUT_VEHICULE_VALUES).optional(),
  dateDebut: dateSchema.optional(),
  dateFin: dateSchema.optional(),
  sortBy: z.enum(SORT_BY_VALUES).default('createdAt').optional(),
  sortOrder: z.enum(SORT_ORDER_VALUES).default('desc').optional(),
});

// ============================================================
// SCHÉMAS POUR LES ENTRETIENS
// ============================================================

/**
 * Schéma pour la création d’un entretien.
 */
export const createEntretienSchema = z.object({
  /** Type d’entretien (ex: "vidange", "freins", "révision") */
  type: z.string().min(1, 'Le type d’entretien est requis.').max(100),
  /** Description (optionnelle) */
  description: z.string().max(500).optional(),
  /** Coût de l’entretien (optionnel, >=0) */
  cout: coutSchema,
  /** Kilométrage au moment de l’entretien (optionnel, >=0) */
  kilometre: kilometrageSchema.optional(),
  /** Date de l’entretien (défaut maintenant) */
  date: dateSchema.optional(),
  /** Kilométrage recommandé pour le prochain entretien (optionnel) */
  prochainKm: kilometrageSchema.optional(),
  /** Identifiant du véhicule (obligatoire) */
  vehiculeId: positiveIntSchema,
});

/**
 * Schéma pour la mise à jour d’un entretien (patch partiel).
 */
export const updateEntretienSchema = z.object({
  id: positiveIntSchema,
  type: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  cout: coutSchema,
  kilometre: kilometrageSchema.optional().nullable(),
  date: dateSchema.optional(),
  prochainKm: kilometrageSchema.optional().nullable(),
  vehiculeId: positiveIntSchema.optional(),
});

/**
 * Schéma pour la suppression d’un entretien.
 */
export const deleteEntretienSchema = z.object({
  id: positiveIntSchema,
});

// ============================================================
// SCHÉMAS POUR LA MISE À JOUR DU KILOMÉTRAGE
// ============================================================

/**
 * Schéma pour la mise à jour du kilométrage d’un véhicule.
 */
export const updateKilometrageSchema = z.object({
  /** Identifiant du véhicule */
  vehiculeId: positiveIntSchema,
  /** Nouveau kilométrage (doit être >= kilométrage actuel, sauf force = true) */
  nouveauKilometrage: kilometrageSchema,
  /** Forcer la mise à jour même si la valeur est inférieure (optionnel, défaut false) */
  force: z.boolean().default(false).optional(),
});

// ============================================================
// SCHÉMA POUR VÉRIFICATION D'UNICITÉ DE L'IMMATRICULATION
// ============================================================

/**
 * Schéma pour vérifier si une immatriculation est unique.
 */
export const checkImmatriculationUniqueSchema = z.object({
  immatriculation: immatriculationSchema,
  excludeId: positiveIntSchema.optional(),
});

// ============================================================
// TYPES INFÉRÉS
// ============================================================

export type CreateVehiculeInput = z.infer<typeof createVehiculeSchema>;
export type UpdateVehiculeInput = z.infer<typeof updateVehiculeSchema>;
export type DeleteVehiculeInput = z.infer<typeof deleteVehiculeSchema>;
export type VehiculesListInput = z.infer<typeof vehiculesListSchema>;

export type CreateEntretienInput = z.infer<typeof createEntretienSchema>;
export type UpdateEntretienInput = z.infer<typeof updateEntretienSchema>;
export type DeleteEntretienInput = z.infer<typeof deleteEntretienSchema>;

export type UpdateKilometrageInput = z.infer<typeof updateKilometrageSchema>;
export type CheckImmatriculationUniqueInput = z.infer<typeof checkImmatriculationUniqueSchema>;
