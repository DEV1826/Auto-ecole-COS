/**
 * Nettoie un message d'erreur brut en supprimant les préfixes techniques d'Electron IPC.
 * Utilise une approche récursive pour extraire le message métier final.
 */
function cleanMessage(raw: string): string {
  if (!raw) return 'Une erreur est survenue.';

  let cleaned = raw;

  // Liste des patterns techniques à supprimer
  // On boucle tant qu'on trouve un pattern au début du message
  const patterns = [
    /^Error invoking remote method '[\w:-]+':\s*/i,
    /^Error:\s*/i,
    /^TypeError:\s*/i,
    /^Uncaught\s+/i,
  ];

  let changed = true;
  while (changed) {
    changed = false;
    for (const pattern of patterns) {
      if (pattern.test(cleaned)) {
        cleaned = cleaned.replace(pattern, '');
        changed = true;
      }
    }
    cleaned = cleaned.trim();
  }

  // Si le message contient encore un saut de ligne avec "Error:",
  // on prend la dernière partie (souvent la plus spécifique)
  if (cleaned.includes('Error:')) {
    const parts = cleaned.split('Error:');
    cleaned = parts[parts.length - 1].trim();
  }

  // Capitalisation du premier caractère pour le professionnalisme
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);

  return cleaned || 'Une erreur inattendue s’est produite.';
}

/**
 * Formate l'erreur pour l'utilisateur final.
 */
export function formatErrorMessage(
  error: unknown,
  defaultMessage = 'Une erreur inattendue s’est produite.'
): string {
  if (!error) return defaultMessage;

  // Cas spécial : Erreur renvoyée par le backend (souvent une string ou un objet simple)
  if (typeof error === 'string') {
    return cleanMessage(error);
  }

  let finalMessage = defaultMessage;

  if (error instanceof Error) {
    finalMessage = error.message;
  } else if (typeof error === 'object' && error !== null && 'message' in error) {
    finalMessage = String(error.message);
  }

  const result = cleanMessage(finalMessage);

  // Si après nettoyage on n'a rien de concret, on remet le message par défaut
  return result.length < 3 ? defaultMessage : result;
}
