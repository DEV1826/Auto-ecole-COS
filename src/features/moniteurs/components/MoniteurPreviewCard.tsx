// src/features/moniteurs/components/MoniteurPreviewCard.tsx

/**
 * @module features/moniteurs/components/MoniteurPreviewCard
 * @description Aperçu en direct d'un moniteur pendant la saisie.
 */

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Award, CalendarDays, Mail, Phone } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { CompletionGauge, InfoRow, RequiredChecklist, isFilled } from '@/components/forms/FormPageKit';
import type { CreateMoniteurInput } from '@/lib/validators/moniteurs.validator';

export default function MoniteurPreviewCard({
  data,
  dirty = false,
}: {
  data: Partial<CreateMoniteurInput>;
  dirty?: boolean;
}) {
  const initials = `${data.prenom?.[0] ?? ''}${data.nom?.[0] ?? ''}`.toUpperCase();
  const actif = data.actif ?? true;
  const embauche = data.dateEmbauche ? new Date(data.dateEmbauche as string) : null;

  const required = [
    { label: 'Nom', filled: isFilled(data.nom) },
    { label: 'Prénom', filled: isFilled(data.prenom) },
  ];
  const optional = [data.email, data.telephone, data.specialite, data.dateEmbauche].filter(isFilled).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-3 pt-2 pb-4 border-b border-border/50">
        <div className="flex size-20 items-center justify-center rounded-full bg-teal-100 text-2xl font-bold text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
          {initials || '?'}
        </div>
        <div className="text-center">
          <p className="text-base font-bold text-foreground leading-tight">
            {[data.prenom, data.nom?.toUpperCase()].filter(Boolean).join(' ') || (
              <span className="text-sm text-muted-foreground/60 italic font-normal">Nom du moniteur</span>
            )}
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <Badge
              className={
                actif
                  ? 'border-0 text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'border-0 text-[10px] bg-muted text-muted-foreground'
              }
            >
              {actif ? 'Actif' : 'Inactif'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="space-y-0.5">
        <InfoRow accent="teal" icon={Mail} value={data.email} placeholder="E-mail —" />
        <InfoRow accent="teal" icon={Phone} value={data.telephone} placeholder="Téléphone —" />
        <InfoRow accent="teal" icon={Award} value={data.specialite} placeholder="Spécialité —" />
        <InfoRow
          accent="teal"
          icon={CalendarDays}
          value={embauche && !Number.isNaN(embauche.getTime()) ? `Embauché le ${format(embauche, 'd MMMM yyyy', { locale: fr })}` : null}
          placeholder="Date d'embauche —"
        />
      </div>

      <CompletionGauge
        accent="teal"
        label="Complétion de la fiche"
        filled={required.filter((r) => r.filled).length + optional}
        total={required.length + 4}
      />
      <RequiredChecklist items={required} />

      {dirty && (
        <p className="text-[10px] text-amber-600 dark:text-amber-400 text-center border-t pt-2">
          ⚡ Modifications non enregistrées
        </p>
      )}
    </div>
  );
}
