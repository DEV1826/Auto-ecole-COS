// src/lib/validators/candidats.validator.ts

/**
 * @module lib/validators/candidats.validator
 * @description
 * Schémas de validation Zod pour les opérations CRUD sur les candidats (élèves).
 * Réutilise les schémas de base (`emailSchema`, `nameSchema`, `phoneSchema`, etc.)
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
 * import { createCandidatSchema, updateCandidatSchema } from '@/lib/validators/candidats.validator';
 *
 * const result = createCandidatSchema.safeParse({
 *   nom: 'Dupont',
 *   prenom: 'Jean',
 *   email: 'jean.dupont@example.com',
 *   telephone: '691234567',
 *   dateNaissance: '1990-05-15',
 *   adresse: '123 Rue de la Paix, Yaoundé',
 *   categorie: 'B',
 *   statut: 'EN_COURS',
 *   numeroPermis: null,
 *   notes: 'Bon élève',
 * });
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
// --------------------------------------------------------------------
// Valeurs des enums utilisées dans les schémas (définies localement)
// --------------------------------------------------------------------
export const CATEGORIE_PERMIS_VALUES = ['A', 'B', 'C', 'D', 'BE'] as const;
export const STATUT_CANDIDAT_VALUES = [
  'EN_COURS',
  'RECU',
  'ECHOUE',
  'ABANDONNE',
  'EN_ATTENTE',
] as const;

// --------------------------------------------------------------------
// SCHÉMAS SPÉCIFIQUES POUR LES CANDIDATS
// --------------------------------------------------------------------

/**
 * Schéma de validation pour la création d’un candidat.
 * Tous les champs requis sont présents ; les champs optionnels (email, téléphone, etc.)
 * sont soit optionnels, soit acceptent `null`.
 */
export const createCandidatSchema = z.object({
  // Identité
  nom: nameSchema,
  prenom: nameSchema,
  email: emailSchema.optional().nullable(),
  telephone: phoneSchema.nullable(),
  dateNaissance: z.string().nullable(),
  adresse: z.string().max(255).optional().nullable(),
  categorie: z.enum(CATEGORIE_PERMIS_VALUES, { message: 'Catégorie de permis invalide.' }),
  statut: z.enum(STATUT_CANDIDAT_VALUES, { message: 'Statut de candidat invalide.' }),
  numeroPermis: z.string().max(50).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  formationId: positiveIntSchema.optional().nullable(),
  dateInscription: z.string().optional(),
});

/**
 * Schéma de validation pour la mise à jour d’un candidat.
 * Tous les champs sont optionnels pour permettre des mises à jour partielles.
 */
export const updateCandidatSchema = z.object({
  id: positiveIntSchema,
  nom: nameSchema.optional(),
  prenom: nameSchema.optional(),
  email: emailSchema.optional().nullable(),
  telephone: phoneSchema.optional().nullable(),
  dateNaissance: dateSchema.optional().nullable(),
  adresse: z.string().max(255).optional().nullable(),
  categorie: z.enum(CATEGORIE_PERMIS_VALUES).optional(),
  statut: z.enum(STATUT_CANDIDAT_VALUES).optional(),
  numeroPermis: z.string().max(50).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  formationId: positiveIntSchema.optional().nullable(),
  dateInscription: z.string().datetime().optional(),
});

/**
 * Schéma pour la suppression (soft delete) d’un candidat.
 * Nécessite seulement l’identifiant.
 */
export const deleteCandidatSchema = z.object({
  id: positiveIntSchema,
});

/**
 * Schéma pour la recherche / pagination des candidats.
 * Utilisé dans les listes avec filtres optionnels.
 */
export const candidatsListSchema = z.object({
  page: z.number().int().positive().default(1).optional(),
  limit: z.number().int().positive().max(200).default(20).optional(),
  search: z.string().max(50).optional(),
  statut: z.enum(STATUT_CANDIDAT_VALUES).optional(),
  categorie: z.enum(CATEGORIE_PERMIS_VALUES).optional(),
  dateDebut: dateSchema.optional(),
  dateFin: dateSchema.optional(),
});

// --------------------------------------------------------------------
// TYPES INFÉRÉS POUR UNE UTILISATION SÉCURISÉE AVEC LES FORMULAIRES
// --------------------------------------------------------------------

export type CreateCandidatInput = z.infer<typeof createCandidatSchema>;
export type UpdateCandidatInput = z.infer<typeof updateCandidatSchema>;
export type DeleteCandidatInput = z.infer<typeof deleteCandidatSchema>;
export type CandidatsListInput = z.infer<typeof candidatsListSchema>;
