// src/features/planning/components/LeconPreviewCard.tsx

/**
 * @module features/planning/components/LeconPreviewCard
 * @description Récapitulatif en direct d'une leçon pendant la saisie.
 */

import { addMinutes, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Car, Clock, GraduationCap, StickyNote, UserRound } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { CompletionGauge, InfoRow, RequiredChecklist, isFilled } from '@/components/forms/FormPageKit';
import { cn } from '@/lib/utils';
import { STATUT_LECON_CONFIG, TYPE_LECON_CONFIG } from '@/types/enums';
import type { Candidat } from '@/types/candidats.types';
import type { Moniteur } from '@/types/moniteurs.types';
import type { Vehicule } from '@/types/vehicules.types';
import type { LeconFormData } from './LeconForm';

export default function LeconPreviewCard({
  data,
  candidats,
  moniteurs,
  vehicules,
  dirty = false,
}: {
  data: LeconFormData;
  candidats: Candidat[];
  moniteurs: Moniteur[];
  vehicules: Vehicule[];
  dirty?: boolean;
}) {
  const candidat = candidats.find((c) => c.id === data.candidatId);
  const moniteur = moniteurs.find((m) => m.id === data.moniteurId);
  const vehicule = vehicules.find((v) => v.id === data.vehiculeId);
  const start = data.date ? new Date(data.date) : null;
  const end = start && data.duree ? addMinutes(start, data.duree) : null;
  const typeCfg = data.type ? TYPE_LECON_CONFIG[data.type] : null;
  const statutCfg = STATUT_LECON_CONFIG[data.statut ?? 'PLANIFIEE'];
  const needsVehicule = data.type !== 'CODE';

  const required = [
    { label: 'Candidat', filled: isFilled(data.candidatId) },
    { label: 'Moniteur', filled: isFilled(data.moniteurId) },
    { label: 'Date et heure', filled: isFilled(data.date) },
    { label: 'Durée', filled: isFilled(data.duree) },
    ...(needsVehicule ? [{ label: 'Véhicule', filled: isFilled(data.vehiculeId) }] : []),
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-lg border bg-violet-50/60 p-4 text-center dark:bg-violet-950/20">
        {start ? (
          <>
            <p className="text-xs uppercase tracking-wider text-violet-700 dark:text-violet-300">
              {format(start, 'EEEE', { locale: fr })}
            </p>
            <p className="text-3xl font-bold leading-tight">{format(start, 'd MMM', { locale: fr })}</p>
            <p className="text-sm font-medium text-muted-foreground mt-1">
              {format(start, 'HH:mm')}
              {end && ` → ${format(end, 'HH:mm')}`}
            </p>
          </>
        ) : (
          <p className="py-4 text-sm italic text-muted-foreground/60">Créneau non défini</p>
        )}
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {typeCfg && (
            <Badge variant="outline" className={cn('border-0 text-[10px]', typeCfg.bgColor, typeCfg.textColor)}>
              {typeCfg.label}
            </Badge>
          )}
          <Badge variant="outline" className={cn('border-0 text-[10px]', statutCfg.bgColor, statutCfg.textColor)}>
            {statutCfg.label}
          </Badge>
        </div>
      </div>

      <div className="space-y-0.5">
        <InfoRow accent="violet" icon={GraduationCap} value={candidat && `${candidat.prenom} ${candidat.nom} · Permis ${candidat.categorie}`} placeholder="Candidat —" />
        <InfoRow accent="violet" icon={UserRound} value={moniteur && `${moniteur.prenom} ${moniteur.nom}`} placeholder="Moniteur —" />
        <InfoRow
          accent="violet"
          icon={Car}
          value={vehicule ? `${vehicule.marque} ${vehicule.modele} · ${vehicule.immatriculation}` : needsVehicule ? null : 'Sans véhicule (code)'}
          placeholder="Véhicule —"
        />
        <InfoRow accent="violet" icon={Clock} value={data.duree ? `${data.duree} minutes` : null} placeholder="Durée —" />
        <InfoRow accent="violet" icon={StickyNote} value={data.notes} placeholder="Aucune note" />
      </div>

      {candidat && vehicule && candidat.categorie !== vehicule.categorie && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-[11px] text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          Le véhicule (cat. {vehicule.categorie}) ne correspond pas au permis visé par le candidat (cat. {candidat.categorie}).
        </p>
      )}

      <CompletionGauge accent="violet" filled={required.filter((r) => r.filled).length} total={required.length} />
      <RequiredChecklist items={required} />

      {dirty && (
        <p className="text-[10px] text-amber-600 dark:text-amber-400 text-center border-t pt-2">
          ⚡ Modifications non enregistrées
        </p>
      )}
    </div>
  );
}
