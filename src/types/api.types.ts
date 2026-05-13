// ─────────────────────────────────────────────────────────────────────────────
// Extension de l'interface WindowApi globale
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extension du type global `Window` pour inclure l'API candidats.
 *
 * @example
 * ```ts
 * // Dans n'importe quel composant :
 * const candidats = await window.api.candidats.getAll({ page: 1, limit: 20 });
 * const candidat  = await window.api.candidats.getById(42);
 * const nouveau   = await window.api.candidats.create({ nom: 'Dupont', ... });
 * ```
 */
declare global {
  interface Window {
    api: {
      auth: import('./auth.types').AuthApi;
      candidats: import('./candidats.types').CandidatsApi;
    };
  }
}
