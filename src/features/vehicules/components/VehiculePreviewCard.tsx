// src/features/vehicules/components/VehiculePreviewCard.tsx

/**
 * @module features/vehicules/components/VehiculePreviewCard
 * @description Aperçu en direct d'un véhicule pendant la saisie (création / édition).
 */

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarDays, Gauge, Hash, Wrench, Car } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn, resolveAssetPath } from '@/lib/utils';
import {
  CompletionGauge,
  InfoRow,
  RequiredChecklist,
  isFilled,
} from '@/components/forms/FormPageKit';
import type { CreateVehiculeInput } from '@/lib/validators/vehicules.validator';
import { CATEGORIE_PERMIS_CONFIG, STATUT_VEHICULE_CONFIG } from '@/types/enums';

const fmtDate = (v: unknown) => {
  if (!v) return null;
  const d = new Date(v as string);
  return Number.isNaN(d.getTime()) ? null : format(d, 'd MMMM yyyy', { locale: fr });
};

export default function VehiculePreviewCard({
  data,
  dirty = false,
}: {
  data: Partial<CreateVehiculeInput>;
  dirty?: boolean;
}) {
  const categorie = data.categorie;
  const statut = data.statut ?? 'DISPONIBLE';
  const statutCfg = STATUT_VEHICULE_CONFIG[statut];

  const required = [
    { label: 'Immatriculation', filled: isFilled(data.immatriculation) },
    { label: 'Marque', filled: isFilled(data.marque) },
    { label: 'Modèle', filled: isFilled(data.modele) },
    { label: 'Année', filled: isFilled(data.annee) },
    { label: 'Catégorie de permis', filled: isFilled(categorie) },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-3 pt-2 pb-4 border-b border-border/50">
        <div className="flex h-28 w-full items-center justify-center rounded-lg p-4">
          {categorie ? (
            <img
              src={resolveAssetPath(`/images/permis/${categorie}.png`)}
              alt={`Catégorie ${categorie}`}
              className="shrink-0 h-auto max-h-24 w-auto"
            />
          ) : (
            <Car className="h-16 w-16 text-muted-foreground/30" />
          )}
        </div>
        <div className="rounded-md border-2 border-foreground/80 bg-background px-4 py-1 font-mono text-lg font-bold tracking-widest">
          {data.immatriculation?.toUpperCase() || '— — —'}
        </div>
        <div className="text-center">
          <p className="text-base font-bold text-foreground leading-tight">
            {[data.marque, data.modele].filter(Boolean).join(' ') || (
              <span className="text-sm text-muted-foreground/60 italic font-normal">Marque et modèle</span>
            )}
          </p>
          <div className="flex items-center justify-center flex-wrap gap-1.5 mt-2">
            {categorie && (
              <Badge variant="outline" className={cn('text-[10px] font-bold px-2 py-0.5', CATEGORIE_PERMIS_CONFIG[categorie].bgColor)}>
                {CATEGORIE_PERMIS_CONFIG[categorie].label.split('—')[0].trim()}
              </Badge>
            )}
            <Badge className={cn('border-0 text-[10px]', statutCfg.bgColor, statutCfg.textColor)}>
              {statutCfg.label}
            </Badge>
          </div>
        </div>
      </div>

      <div className="space-y-0.5">
        <InfoRow accent="sky" icon={Hash} value={data.annee ? `Année ${data.annee}` : null} placeholder="Année —" />
        <InfoRow
          accent="sky"
          icon={Gauge}
          value={isFilled(data.kilometrage) ? `${Number(data.kilometrage).toLocaleString('fr-FR')} km` : null}
          placeholder="Kilométrage —"
        />
        <InfoRow accent="sky" icon={CalendarDays} value={fmtDate(data.dateAcquisition) && `Acquis le ${fmtDate(data.dateAcquisition)}`} placeholder="Date d'acquisition —" />
        <InfoRow
          accent="sky"
          icon={Wrench}
          value={
            isFilled(data.prochaineRevisionKm)
              ? `Prochaine révision à ${Number(data.prochaineRevisionKm).toLocaleString('fr-FR')} km`
              : null
          }
          placeholder="Prochaine révision —"
        />
      </div>

      <CompletionGauge accent="sky" filled={required.filter((r) => r.filled).length} total={required.length} />
      <RequiredChecklist items={required} />

      {dirty && (
        <p className="text-[10px] text-amber-600 dark:text-amber-400 text-center border-t pt-2">
          ⚡ Modifications non enregistrées
        </p>
      )}
    </div>
  );
}
