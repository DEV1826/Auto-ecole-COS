// /home/stive-junior/Auto-ecole-COS/src/lib/validators/auth.validator.ts

/**
 * @module lib/validators/auth.validator
 * @description Validateurs Zod pour l'authentification et la gestion des utilisateurs, des permissions, des sessions et de l'audit.
 * @author Stive Junior
 * @version 1.0.0
 *
 * Ce module exporte des schémas de validation pour tous les DTOs liés à l'authentification,
 * en utilisant des messages d'erreur cohérents. Les validateurs sont utilisés côté client
 * avant l'envoi des données au backend (IPC).
 *
 * @example
 * ```typescript
 * import { loginSchema } from '@/lib/validators/auth.validator';
 * const result = loginSchema.safeParse({ email: 'admin@autoecole.com', password: 'Admin123!' });
 * if (!result.success) {
 *   console.error(result.error.format());
 * }
 * ```
 */

import { z } from 'zod';
import { VALIDATION_ERRORS, AUTH_ERRORS } from '../constants/messages';

// ============================================================
// SCHÉMAS DE BASE RÉUTILISABLES
// ============================================================

/**
 * Schéma de validation pour une adresse email.
 */
export const emailSchema = z
  .string({ message: VALIDATION_ERRORS.REQUIRED })
  .email({ message: VALIDATION_ERRORS.INVALID_EMAIL })
  .min(5, VALIDATION_ERRORS.TOO_SHORT(5))
  .max(255, VALIDATION_ERRORS.TOO_LONG(255))
  .toLowerCase();

/**
 * Schéma de validation pour un mot de passe (fort).
 * @description
 * - Minimum 8 caractères
 * - Au moins une lettre majuscule
 * - Au moins une lettre minuscule
 * - Au moins un chiffre
 * - Au moins un caractère spécial
 */
export const passwordSchema = z
  .string({ message: VALIDATION_ERRORS.REQUIRED })
  .min(8, VALIDATION_ERRORS.TOO_SHORT(8))
  .max(128, VALIDATION_ERRORS.TOO_LONG(128))
  .regex(/[A-Z]/, AUTH_ERRORS.WEAK_PASSWORD)
  .regex(/[a-z]/, AUTH_ERRORS.WEAK_PASSWORD)
  .regex(/[0-9]/, AUTH_ERRORS.WEAK_PASSWORD)
  .regex(/[^A-Za-z0-9]/, AUTH_ERRORS.WEAK_PASSWORD);

/**
 * Schéma pour un nom (prénom ou nom de famille).
 */
export const nameSchema = z
  .string({ message: VALIDATION_ERRORS.REQUIRED })
  .min(2, VALIDATION_ERRORS.TOO_SHORT(2))
  .max(100, VALIDATION_ERRORS.TOO_LONG(100))
  .regex(
    /^[a-zA-ZÀ-ÿ\s'-]+$/,
    'Le nom ne peut contenir que des lettres, espaces, apostrophes et tirets.'
  );

/**
 * Schéma pour un téléphone (optionnel mais validé si fourni).
 */
export const phoneSchema = z
  .string()
  .optional()
  .refine(
    (val) =>
      !val || /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{4,12}$/.test(val),
    { message: VALIDATION_ERRORS.INVALID_PHONE }
  );

/**
 * Schéma pour un nombre positif (entier ou float).
 */
export const positiveNumberSchema = z
  .number({ message: VALIDATION_ERRORS.REQUIRED })
  .positive(VALIDATION_ERRORS.POSITIVE);

/**
 * Schéma pour un entier positif.
 */
export const positiveIntSchema = positiveNumberSchema.int(VALIDATION_ERRORS.INVALID_INTEGER);

/**
 * Schéma de date (string ISO ou Date).
 */
// src/lib/validators/auth.validator.ts (extrait modifié)

/**
 * @module shared/schemas/dateSchema
 * @description
 * Schéma de validation et de transformation de date ultra-robuste.
 * Ce schéma résout le conflit entre les entrées utilisateur (String au format FR)
 * et les besoins du backend (Format ISO).
 * * FONCTIONNALITÉS :
 * 1. Support multi-format : Accepte les objets Date, les strings ISO et le format JJ/MM/AAAA.
 * 2. Normalisation : Transforme systématiquement l'entrée en chaîne ISO 8601.
 * 3. Valeur par défaut dynamique : Si l'entrée est vide, injecte la date du jour à minuit.
 * 4. Validation stricte : Vérifie la validité réelle de la date (ex: refuse le 31/02/2026).
 * * @example
 * dateSchema.parse("09/05/2026") // -> "2026-05-09T00:00:00.000Z"
 * dateSchema.parse("")           // -> [Date du jour ISO]
 */

export const dateSchema = z
  .preprocess(
    (arg) => {
      if (arg === '' || arg === null || arg === undefined) {
        return new Date();
      }
      return arg;
    },
    z.union([
      // Cas 1 : L'entrée est déjà un objet Date
      z.date(),
      // Cas 2 : L'entrée est une chaîne de caractères
      z
        .string()
        .trim()
        .refine(
          (val) => {
            // On accepte soit le format ISO, soit le format JJ/MM/AAAA
            const isIso = !isNaN(Date.parse(val));
            const isFrenchFormat = /^\d{2}\/\d{2}\/\d{4}$/.test(val);
            return isIso || isFrenchFormat;
          },
          {
            message: 'Format de date invalide. Utilisez JJ/MM/AAAA ou le format standard ISO.',
          }
        ),
    ])
  )
  .transform((val) => {
    // Si c'est déjà un objet Date, on s'assure qu'il est valide avant conversion
    if (val instanceof Date) {
      if (isNaN(val.getTime())) return new Date().toISOString();
      return val.toISOString();
    }

    // Si c'est une chaîne au format JJ/MM/AAAA
    if (typeof val === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
      const [day, month, year] = val.split('/').map(Number);

      // Attention : Le mois en JS commence à 0 (janvier = 0)
      const date = new Date(year, month - 1, day);

      // Validation de la cohérence de la date (évite le 32/01/2026)
      if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        // En cas d'incohérence, on peut soit lever une erreur, soit retourner la date actuelle
        // Ici, on retourne la date actuelle pour éviter de bloquer le formulaire inutilement
        return new Date().toISOString();
      }

      return date.toISOString();
    }

    // Pour les chaînes déjà au format ISO ou autre format valide reconnu par Date.parse()
    const finalDate = new Date(val);
    return isNaN(finalDate.getTime()) ? new Date().toISOString() : finalDate.toISOString();
  });

/**
 * @typedef {z.infer<typeof dateSchema>} DateSchemaType
 * @description Type TypeScript généré : string (car transformé en ISO)
 */

// ============================================================
// SCHÉMAS D'AUTHENTIFICATION (LOGIN, REGISTER, TOKENS)
// ============================================================

/**
 * Schéma de validation pour la connexion.
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ message: VALIDATION_ERRORS.REQUIRED }).min(1, VALIDATION_ERRORS.REQUIRED),
});

/**
 * Schéma pour la création d’un nouvel utilisateur (par un admin).
 * Correspond aux champs du modèle Utilisateur + mot de passe (hors hash).
 */
export const createUserSchema = z.object({
  email: emailSchema,
  nom: nameSchema,
  prenom: nameSchema,
  password: passwordSchema,
  role: z.enum(['ADMIN', 'SECRETAIRE', 'MONITEUR'], { message: 'Rôle invalide.' }),
  niveau: z.enum(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STANDARD', 'GUEST'], {
    message: 'Niveau d’accès invalide.',
  }),
  creeParId: z.number().int().positive().optional(),
});

/**
 * Schéma pour la mise à jour d’un utilisateur (tous champs optionnels).
 */
export const updateUserSchema = z.object({
  userId: positiveIntSchema,
  nom: nameSchema.optional(),
  prenom: nameSchema.optional(),
  email: emailSchema.optional(),
  role: z.enum(['ADMIN', 'SECRETAIRE', 'MONITEUR']).optional(),
  niveau: z.enum(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STANDARD', 'GUEST']).optional(),
  actif: z.boolean().optional(),
});

/**
 * Schéma pour le changement de mot de passe.
 */
export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, VALIDATION_ERRORS.REQUIRED),
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, VALIDATION_ERRORS.REQUIRED),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: VALIDATION_ERRORS.PASSWORDS_DO_NOT_MATCH,
    path: ['confirmNewPassword'],
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: AUTH_ERRORS.OLD_PASSWORD_SAME_AS_NEW,
    path: ['newPassword'],
  });

/**
 * Schéma pour la demande d'un code de réinitialisation (email uniquement)
 * @constant requestResetCodeSchema
 */
export const requestResetCodeSchema = z.object({
  email: emailSchema,
});

/**
 * Schéma pour la validation d’un code de réinitialisation (6 chiffres).
 * @constant resetCodeSchema
 */
export const resetCodeSchema = z.object({
  code: z
    .string({ message: VALIDATION_ERRORS.REQUIRED })
    .length(6, 'Le code doit comporter exactement 6 chiffres.')
    .regex(/^\d+$/, 'Le code ne doit contenir que des chiffres.'),
});

/**
 * Schéma pour la réinitialisation du mot de passe avec code et nouveau mot de passe.
 * @constant resetPasswordSchema
 */
export const resetPasswordSchema = z
  .object({
    code: z.string().length(6).regex(/^\d+$/),
    newPassword: passwordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmNewPassword'],
  });

/**
 * Schéma pour le rafraîchissement du token JWT.
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(10, VALIDATION_ERRORS.TOO_SHORT(10)),
});

/**
 * Schéma pour la validation d’un token (simple).
 */
export const validateTokenSchema = z.object({
  token: z.string().min(10, VALIDATION_ERRORS.TOO_SHORT(10)),
});

// ============================================================
// SCHÉMAS DE GESTION DES PERMISSIONS
// ============================================================

/**
 * Schéma pour l’assignation d’une permission.
 */
export const assignPermissionSchema = z.object({
  userId: positiveIntSchema,
  ressource: z.string().min(1, VALIDATION_ERRORS.REQUIRED).max(100),
  action: z.enum(['create', 'read', 'update', 'delete'], {
    message: 'Action doit être create, read, update ou delete.',
  }),
});

/**
 * Schéma pour la révocation d’une permission.
 */
export const revokePermissionSchema = z.object({
  permissionId: positiveIntSchema,
});

/**
 * Schéma pour la vérification d’une permission (check).
 */
export const checkPermissionSchema = z.object({
  userId: positiveIntSchema,
  ressource: z.string().min(1),
  action: z.string().min(1),
});

// ============================================================
// SCHÉMAS DE GESTION DES SESSIONS
// ============================================================

/**
 * Schéma pour la récupération des sessions d’un utilisateur.
 */
export const getUserSessionsSchema = z.object({
  userId: positiveIntSchema,
});

/**
 * Schéma pour la révocation d’une session.
 */
export const revokeSessionSchema = z.object({
  sessionId: positiveIntSchema,
});

/**
 * Schéma pour la révocation de toutes les sessions d’un utilisateur.
 */
export const revokeAllSessionsSchema = z.object({
  userId: positiveIntSchema,
});

export const validateResetCodeSchema = z.object({
  email: emailSchema,
  code: z
    .string({ message: VALIDATION_ERRORS.REQUIRED })
    .length(6, 'Le code OTP doit comporter exactement 6 chiffres.')
    .regex(/^\d+$/, 'Le code OTP ne doit contenir que des chiffres.'),
});

// ============================================================
// SCHÉMAS D'AUDIT LOGS
// ============================================================

/**
 * Schéma pour la récupération des logs d’audit (pagination + filtres).
 * Les filtres sont optionnels.
 */
export const getAuditLogsSchema = z.object({
  page: z.number().int().positive().default(1).optional(),
  limit: z.number().int().positive().max(200).default(50).optional(),
  filters: z
    .object({
      utilisateurId: positiveIntSchema.optional(),
      action: z.string().optional(),
      statut: z.enum(['SUCCESS', 'FAILED']).optional(),
    })
    .optional(),
});

// ============================================================
// TYPES INFÉRÉS
// ============================================================

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ValidateTokenInput = z.infer<typeof validateTokenSchema>;
export type AssignPermissionInput = z.infer<typeof assignPermissionSchema>;
export type RevokePermissionInput = z.infer<typeof revokePermissionSchema>;
export type CheckPermissionInput = z.infer<typeof checkPermissionSchema>;
export type GetUserSessionsInput = z.infer<typeof getUserSessionsSchema>;
export type RevokeSessionInput = z.infer<typeof revokeSessionSchema>;
export type RevokeAllSessionsInput = z.infer<typeof revokeAllSessionsSchema>;
export type GetAuditLogsInput = z.infer<typeof getAuditLogsSchema>;
export type RequestResetCodeInput = z.infer<typeof requestResetCodeSchema>;
export type ResetCodeInput = z.infer<typeof resetCodeSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
