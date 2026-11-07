// src/features/planning/hooks/usePlanningReferences.ts

/**
 * @module features/planning/hooks/usePlanningReferences
 * @description Charge les candidats, moniteurs et véhicules nécessaires aux formulaires de leçon.
 */

import * as React from 'react';
import { useCandidats } from '@/hooks/use.candidats';
import { useMoniteurs } from '@/hooks/use.moniteurs';
import { useVehicules } from '@/hooks/use.vehicules';
import type { Candidat } from '@/types/candidats.types';
import type { Moniteur } from '@/types/moniteurs.types';
import type { Vehicule } from '@/types/vehicules.types';

export function usePlanningReferences() {
  const { getAll: getCandidats } = useCandidats();
  const { getAll: getMoniteurs } = useMoniteurs();
  const { getAll: getVehicules } = useVehicules();

  const [candidats, setCandidats] = React.useState<Candidat[]>([]);
  const [moniteurs, setMoniteurs] = React.useState<Moniteur[]>([]);
  const [vehicules, setVehicules] = React.useState<Vehicule[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    Promise.all([
      getCandidats({ page: 1, limit: 1000 }),
      getMoniteurs({ page: 1, limit: 200 }),
      getVehicules({ page: 1, limit: 200 }),
    ])
      .then(([c, m, v]) => {
        if (cancelled) return;
        setCandidats(c.candidats ?? []);
        setMoniteurs(m.moniteurs ?? []);
        setVehicules(v.vehicules ?? []);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [getCandidats, getMoniteurs, getVehicules]);

  return { candidats, moniteurs, vehicules, loading, error };
}
