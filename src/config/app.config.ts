/**
 * @module config/app.config
 * @description Configuration métier et constantes applicatives de  Auto-École COS
 * @author Stive Junior
 * @version 1.0.0
 *
 * Ce module définit les paramètres généraux de l'application (noms, formats, plages horaires, etc.).
 */

/**
 * Informations générales sur l'application
 * @constant {Object} appConfig
 * @readonly
 */

export const appConfig = {
  /** Nom complet de l'application */
  name: (import.meta.env.VITE_APP_NAME as string) || 'COS Auto-école',
  /** Version sémantique */
  version: (import.meta.env.VITE_APP_VERSION as string) || '1.0.0',
  /** Mode maintenance (bloque l’accès) */
  maintenance: import.meta.env.VITE_MAINTENANCE === 'true',
  /** Brève description */
  description:
    'Système de gestion complet pour auto-écoles, couvrant les candidatures, formations, plannings, paiements et plus encore.',
  /** Chemin vers le logo de l'application */
  logo: '/icons/hero.png',
} as const;
