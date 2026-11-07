// src/features/planning/components/LeconsAgenda.tsx

/**
 * @module features/planning/components/LeconsAgenda
 * @description Leçons à venir regroupées par jour (vue « agenda »).
 */

import { useState } from 'react';
import { addMinutes, format, isToday, isTomorrow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarCheck, Car, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { PROTECTED_ROUTES } from '@/config';
import { TYPE_LECON_CONFIG } from '@/types/enums';
import type { Lecon } from '@/types/planning.types';

function dayLabel(d: Date) {
  if (isToday(d)) return "Aujourd'hui";
  if (isTomorrow(d)) return 'Demain';
  return format(d, 'EEEE d MMMM', { locale: fr });
}

export interface LeconsAgendaProps {
  lecons: Lecon[];
  /** Nom affiché pour l'autre participant (candidat côté moniteur et inversement). */
  getParticipant: (lecon: Lecon) => string;
  loading?: boolean;
  /** Nombre maximal de leçons affichées (défaut 12). */
  limit?: number;
}

export default function LeconsAgenda({ lecons, getParticipant, loading, limit = 12 }: LeconsAgendaProps) {
  const [now] = useState(() => Date.now());
  const upcoming = lecons
    .filter((l) => l.statut === 'PLANIFIEE' && new Date(l.date).getTime() + l.duree * 60000 >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, limit);

  const groups = new Map<string, Lecon[]>();
  for (const l of upcoming) {
    const key = format(new Date(l.date), 'yyyy-MM-dd');
    groups.set(key, [...(groups.get(key) ?? []), l]);
  }

  return (
    <Card className="rounded-md h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-violet-600" />
          Prochaines leçons
        </CardTitle>
        <CardDescription>Leçons planifiées à venir.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
        ) : upcoming.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Aucune leçon planifiée.</p>
        ) : (
          [...groups.entries()].map(([key, items]) => (
            <div key={key} className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground first-letter:uppercase">
                {dayLabel(new Date(items[0].date))}
              </p>
              {items.map((l) => {
                const start = new Date(l.date);
                const cfg = TYPE_LECON_CONFIG[l.type];
                return (
                  <Link
                    key={l.id}
                    to={PROTECTED_ROUTES.PLANNING.DETAIL(l.id)}
                    className="group flex items-center gap-3 rounded-md border p-2.5 transition-colors hover:bg-muted/50"
                  >
                    <div className="w-14 shrink-0 text-center">
                      <p className="text-sm font-semibold tabular-nums">{format(start, 'HH:mm')}</p>
                      <p className="text-[10px] text-muted-foreground tabular-nums">
                        {format(addMinutes(start, l.duree), 'HH:mm')}
                      </p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{getParticipant(l)}</p>
                      <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                        {l.vehicule ? (
                          <>
                            <Car className="h-3 w-3" />
                            {l.vehicule.marque} {l.vehicule.modele} · {l.vehicule.immatriculation}
                          </>
                        ) : (
                          `${l.duree} min`
                        )}
                      </p>
                    </div>
                    <Badge variant="outline" className={cn('border-0 text-[10px] shrink-0', cfg.bgColor, cfg.textColor)}>
                      {cfg.label}
                    </Badge>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                );
              })}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
