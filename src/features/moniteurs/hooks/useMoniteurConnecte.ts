// src/features/moniteurs/hooks/useMoniteurConnecte.ts

/**
 * @module features/moniteurs/hooks/useMoniteurConnecte
 * @description
 * Fiche moniteur liée au compte connecté (rôle MONITEUR).
 * - `moniteur` : la fiche, ou null si le compte n'est lié à aucune fiche ;
 * - `loading` : vrai tant que la réponse n'est pas arrivée ;
 * - `applicable` : faux pour les autres rôles (aucune requête n'est faite).
 */

import * as React from 'react';
import { useAuth } from '@/hooks/use.auth';
import type { Moniteur } from '@/types/moniteurs.types';

export function useMoniteurConnecte() {
  const { user } = useAuth();
  const applicable = user?.role === 'MONITEUR';
  const userId = user?.id ?? null;
  const [state, setState] = React.useState<{ userId: number; moniteur: Moniteur | null } | null>(null);

  React.useEffect(() => {
    if (!applicable || userId === null) return;
    let cancelled = false;
    window.api.moniteurs
      .getMine()
      .then((m) => !cancelled && setState({ userId, moniteur: m ?? null }))
      .catch(() => !cancelled && setState({ userId, moniteur: null }));
    return () => {
      cancelled = true;
    };
  }, [applicable, userId]);

  const current = state && state.userId === userId ? state : null;
  return {
    applicable,
    moniteur: current?.moniteur ?? null,
    loading: applicable && current === null,
  };
}
