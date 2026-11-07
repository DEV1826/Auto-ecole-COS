// src/features/planning/hooks/useLeconActions.ts

/**
 * @module features/planning/hooks/useLeconActions
 * @description
 * Actions standard sur une leçon pour `LeconsTable` : voir, modifier, annuler,
 * marquer effectuée, signaler une absence. Les changements de statut passent
 * par le store planning puis appellent `onChanged` pour rafraîchir la page.
 */

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { usePlanning } from '@/hooks/use.planning';
import { PROTECTED_ROUTES } from '@/config';
import { errorMessage } from '@/components/forms/FormPageKit';
import type { Lecon, LeconsTableActions } from '@/types/planning.types';
import type { StatutLecon } from '@/types/enums';

const MESSAGES: Record<Exclude<StatutLecon, 'PLANIFIEE'>, string> = {
  EFFECTUEE: 'Leçon marquée comme effectuée',
  ANNULEE: 'Leçon annulée',
  ABSENCE: 'Absence signalée',
};

export function useLeconActions(onChanged?: (lecon: Lecon) => void): LeconsTableActions {
  const navigate = useNavigate();
  const { update } = usePlanning();

  const setStatut = React.useCallback(
    async (lecon: Lecon, statut: Exclude<StatutLecon, 'PLANIFIEE'>) => {
      try {
        const updated = await update(lecon.id, { statut });
        toast.success(MESSAGES[statut]);
        onChanged?.(updated);
      } catch (err) {
        toast.error('Action impossible', { description: errorMessage(err) });
      }
    },
    [update, onChanged]
  );

  return React.useMemo<LeconsTableActions>(
    () => ({
      onView: (l) => navigate(PROTECTED_ROUTES.PLANNING.DETAIL(l.id)),
      onEdit: (l) => navigate(PROTECTED_ROUTES.PLANNING.EDIT(l.id)),
      onCancel: (l) => setStatut(l, 'ANNULEE'),
      onMarkDone: (l) => setStatut(l, 'EFFECTUEE'),
      onReportAbsence: (l) => setStatut(l, 'ABSENCE'),
    }),
    [navigate, setStatut]
  );
}
