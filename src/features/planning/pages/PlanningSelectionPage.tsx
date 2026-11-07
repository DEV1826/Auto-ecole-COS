// src/features/planning/pages/PlanningSelectionPage.tsx

/**
 * @module features/planning/pages/PlanningSelectionPage
 * @description
 * Point d'entrée des menus « Planning moniteur » et « Planning candidat » :
 * liste recherchable des moniteurs (ou candidats) ; un clic ouvre son planning.
 */

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ChevronRight, GraduationCap, Search, UserRound } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader, errorMessage } from '@/components/forms/FormPageKit';

import { useMoniteurs } from '@/hooks/use.moniteurs';
import { useCandidats } from '@/hooks/use.candidats';
import { PROTECTED_ROUTES } from '@/config';
import { cn } from '@/lib/utils';
import { STATUT_CANDIDAT_CONFIG } from '@/types/enums';
import type { StatutCandidat } from '@/types/enums';

interface Personne {
  id: number;
  nom: string;
  detail: string;
  badge?: { label: string; className: string };
  inactif?: boolean;
  recherche: string;
}

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function PlanningSelectionPage({ kind }: { kind: 'moniteur' | 'candidat' }): React.JSX.Element {
  const navigate = useNavigate();
  const { getAll: getMoniteurs } = useMoniteurs();
  const { getAll: getCandidats } = useCandidats();

  const [state, setState] = React.useState<{ kind: string; personnes: Personne[]; error: string | null } | null>(null);
  const [query, setQuery] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    const load =
      kind === 'moniteur'
        ? getMoniteurs({ page: 1, limit: 200 }).then((r) =>
            (r.moniteurs ?? []).map<Personne>((m) => ({
              id: m.id,
              nom: `${m.prenom} ${m.nom}`,
              detail: m.specialite || m.telephone || m.email || 'Moniteur',
              badge: m.actif
                ? undefined
                : { label: 'Inactif', className: 'bg-muted text-muted-foreground' },
              inactif: !m.actif,
              recherche: normalize(`${m.prenom} ${m.nom} ${m.specialite ?? ''} ${m.telephone ?? ''} ${m.email ?? ''}`),
            }))
          )
        : getCandidats({ page: 1, limit: 1000 }).then((r) =>
            (r.candidats ?? []).map<Personne>((c) => {
              const cfg = STATUT_CANDIDAT_CONFIG[c.statut as StatutCandidat];
              return {
                id: c.id,
                nom: `${c.prenom} ${c.nom}`,
                detail: `Permis ${c.categorie}${c.telephone ? ` · ${c.telephone}` : ''}`,
                badge: cfg ? { label: cfg.label, className: cn(cfg.bgColor, cfg.textColor) } : undefined,
                inactif: c.statut === 'ABANDONNE',
                recherche: normalize(`${c.prenom} ${c.nom} ${c.telephone ?? ''} ${c.email ?? ''}`),
              };
            })
          );
    load
      .then((personnes) => {
        if (cancelled) return;
        // Actifs d'abord, puis ordre alphabétique.
        personnes.sort((a, b) => Number(a.inactif) - Number(b.inactif) || a.nom.localeCompare(b.nom, 'fr'));
        setState({ kind, personnes, error: null });
      })
      .catch((err) => !cancelled && setState({ kind, personnes: [], error: errorMessage(err) }));
    return () => {
      cancelled = true;
    };
  }, [kind, getMoniteurs, getCandidats]);

  const current = state?.kind === kind ? state : null;
  const q = normalize(query.trim());
  const list = (current?.personnes ?? []).filter((p) => !q || p.recherche.includes(q));
  const isMoniteur = kind === 'moniteur';
  const Icon = isMoniteur ? UserRound : GraduationCap;

  const open = (id: number) =>
    navigate(isMoniteur ? PROTECTED_ROUTES.PLANNING.MONITEUR(id) : PROTECTED_ROUTES.PLANNING.CANDIDAT(id));

  return (
    <div className="space-y-5 p-4 md:p-1 pb-12">
      <PageHeader
        icon={CalendarDays}
        accent="violet"
        title={isMoniteur ? 'Planning par moniteur' : 'Planning par candidat'}
        subtitle={isMoniteur ? 'Choisissez un moniteur pour afficher son planning.' : 'Choisissez un candidat pour afficher son planning.'}
        badge={current ? `${current.personnes.length}` : undefined}
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && list.length === 1) open(list[0].id);
          }}
          placeholder={isMoniteur ? 'Rechercher un moniteur…' : 'Rechercher un candidat (nom, téléphone…)'}
          className="h-11 pl-9"
          aria-label="Rechercher"
        />
      </div>

      {!current ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-md" />
          ))}
        </div>
      ) : current.error ? (
        <Card className="rounded-md">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">{current.error}</CardContent>
        </Card>
      ) : list.length === 0 ? (
        <Card className="rounded-md">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {current.personnes.length === 0
              ? isMoniteur
                ? 'Aucun moniteur enregistré.'
                : 'Aucun candidat enregistré.'
              : `Aucun résultat pour « ${query} ».`}
          </CardContent>
        </Card>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {list.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => open(p.id)}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-md border bg-card p-3 text-left transition-colors hover:bg-muted/50',
                  p.inactif && 'opacity-70'
                )}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                  {p.nom
                    .split(' ')
                    .map((x) => x[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase() || <Icon className="h-4 w-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{p.nom}</span>
                  <span className="block truncate text-xs text-muted-foreground">{p.detail}</span>
                </span>
                {p.badge && (
                  <Badge variant="outline" className={cn('shrink-0 border-0 text-[10px]', p.badge.className)}>
                    {p.badge.label}
                  </Badge>
                )}
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
