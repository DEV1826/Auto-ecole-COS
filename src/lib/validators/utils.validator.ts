// ===============================
// UTILITAIRES DE VALIDATION
// ===============================

import { ZodError, z } from 'zod';
import { fromZodError } from 'zod-validation-error';

/**
 * Valide des données avec un schéma Zod et retourne les données typées.
 * En cas d'erreur, lève une erreur avec un message formaté.
 * @private
 * @template T
 * @param {z.Schema<T>} schema - Schéma Zod
 * @param {unknown} data - Données à valider
 * @returns {T} Données validées et typées
 * @throws {Error} Erreur de validation lisible
 */
export function validateOrThrow<T>(schema: z.Schema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      throw new Error(`Erreur de validation : ${validationError.message}`);
    }
    throw error;
  }
}

/**
 * Valide des données sans lever d'exception.
 * @private
 * @template T
 * @param {z.Schema<T>} schema - Schéma Zod
 * @param {unknown} data - Données à valider
 * @returns {{ success: true; data: T } | { success: false; error: string }} Résultat de validation
 */
export function safeValidate<T>(
  schema: z.Schema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    const validationError = fromZodError(result.error);
    return { success: false, error: validationError.message };
  }
}
