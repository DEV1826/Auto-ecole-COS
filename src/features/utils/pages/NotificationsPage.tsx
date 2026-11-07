// src/features/utils/pages/NotificationsPage.tsx

/**
 * @module features/utils/pages/NotificationsPage
 * @description
 * Centre de notifications : alertes calculées à partir des données (aucun
 * stockage serveur). Selon le rôle :
 *  - planning : leçons du jour / de demain, leçons passées non clôturées ;
 *  - examens : examens à venir (7 j), résultats non saisis ;
 *  - finances : factures échues non réglées ;
 *  - flotte : révisions à prévoir.
 * Une alerte peut être marquée « vue » (mémorisé sur ce poste uniquement).
 */

import * as React from 'react';
import { Link } from 'react-router-dom';
import { addDays, endOfDay, format, formatDistanceToNow, isToday, startOfDay, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  AlertOctagon,
  AlertTriangle,
  Bell,
  BellOff,
  CalendarClock,
  Car,
  CheckCheck,
  ClipboardList,
  Info,
  Receipt,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/forms/FormPageKit';

import { useAuth } from '@/hooks/use.auth';
import { PROTECTED_ROUTES } from '@/config';
import { cn } from '@/lib/utils';

type Niveau = 'critique' | 'attention' | 'info';
type Categorie = 'planning' | 'examens' | 'finances' | 'flotte';

interface Alerte {
  id: string;
  niveau: Niveau;
  categorie: Categorie;
  titre: string;
  detail: string;
  date?: Date;
  lien?: string;
}

const NIVEAUX: Record<Niveau, { label: string; icon: LucideIcon; className: string; order: number }> = {
  critique: { label: 'Critique', icon: AlertOctagon, className: 'text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-950/40', order: 0 },
  attention: { label: 'Attention', icon: AlertTriangle, className: 'text-amber-800 bg-amber-50 dark:text-amber-200 dark:bg-amber-950/40', order: 1 },
  info: { label: 'Information', icon: Info, className: 'text-sky-800 bg-sky-50 dark:text-sky-200 dark:bg-sky-950/40', order: 2 },
};

const CATEGORIES: Record<Categorie, { label: string; icon: LucideIcon }> = {
  planning: { label: 'Planning', icon: CalendarClock },
  examens: { label: 'Examens', icon: ClipboardList },
  finances: { label: 'Finances', icon: Receipt },
  flotte: { label: 'Flotte', icon: Car },
};

const STORAGE_KEY = 'cos-notifications-vues';

function readSeen(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'));
  } catch {
    return new Set();
  }
}
function writeSeen(ids: Set<string>) {
  try {
    // On ne garde que les 500 derniers identifiants.
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids].slice(-500)));
  } catch {
    /* stockage indisponible : l'état reste en mémoire */
  }
}

const fcfa = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} FCFA`;
const heure = (d: Date) => format(d, 'HH:mm');

async function collectAlertes(canManage: boolean): Promise<Alerte[]> {
  const now = new Date();
  const alertes: Alerte[] = [];
  const tasks: Array<Promise<void>> = [];

  // Planning
  tasks.push(
    window.api.planning.getBetweenDates(subDays(startOfDay(now), 14), endOfDay(addDays(now, 1))).then((lecons) => {
      const aCloturer = lecons.filter((l) => l.statut === 'PLANIFIEE' && new Date(l.date).getTime() + l.duree * 60000 < now.getTime());
      if (aCloturer.length) {
        alertes.push({
          id: `lecons-a-cloturer-${aCloturer.map((l) => l.id).join('-').slice(0, 80)}`,
          niveau: 'attention',
          categorie: 'planning',
          titre: `${aCloturer.length} leçon${aCloturer.length > 1 ? 's' : ''} passée${aCloturer.length > 1 ? 's' : ''} à clôturer`,
          detail: 'Indiquez si elles ont été effectuées, annulées ou si le candidat était absent.',
          lien: PROTECTED_ROUTES.PLANNING.CALENDAR,
        });
      }
      const prochaines = lecons
        .filter((l) => l.statut === 'PLANIFIEE' && new Date(l.date) >= now)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      for (const l of prochaines) {
        const d = new Date(l.date);
        const qui = l.candidat ? `${l.candidat.prenom} ${l.candidat.nom}` : `candidat #${l.candidatId}`;
        const avec = l.moniteur ? ` avec ${l.moniteur.prenom} ${l.moniteur.nom}` : '';
        alertes.push({
          id: `lecon-${l.id}-${d.getTime()}`,
          niveau: 'info',
          categorie: 'planning',
          titre: `${isToday(d) ? "Aujourd'hui" : 'Demain'} à ${heure(d)} — leçon de ${qui}`,
          detail: `${l.duree} min${avec}${l.vehicule ? ` · ${l.vehicule.immatriculation}` : ''}`,
          date: d,
          lien: PROTECTED_ROUTES.PLANNING.DETAIL(l.id),
        });
      }
    })
  );

  if (canManage) {
    // Examens
    tasks.push(
      window.api.examens
        .getAll({ dateDebut: subDays(now, 60).toISOString(), dateFin: addDays(now, 7).toISOString(), limit: 200 })
        .then(({ examens }) => {
          for (const e of examens) {
            const d = new Date(e.date);
            const qui = e.candidat ? `${e.candidat.prenom} ${e.candidat.nom}` : `candidat #${e.candidatId}`;
            if (d >= startOfDay(now)) {
              alertes.push({
                id: `examen-${e.id}-${d.getTime()}`,
                niveau: 'info',
                categorie: 'examens',
                titre: `Examen de ${e.type === 'CODE' ? 'code' : 'conduite'} — ${qui}`,
                detail: `${format(d, "EEEE d MMMM 'à' HH:mm", { locale: fr })}${e.centre ? ` · ${e.centre}` : ''}`,
                date: d,
                lien: PROTECTED_ROUTES.EXAMENS.DETAIL(e.id),
              });
            } else if (e.resultat === 'EN_ATTENTE') {
              alertes.push({
                id: `examen-resultat-${e.id}`,
                niveau: 'attention',
                categorie: 'examens',
                titre: `Résultat à saisir — ${qui}`,
                detail: `Examen de ${e.type === 'CODE' ? 'code' : 'conduite'} passé ${formatDistanceToNow(d, { addSuffix: true, locale: fr })}.`,
                date: d,
                lien: PROTECTED_ROUTES.EXAMENS.EDIT(e.id),
              });
            }
          }
        })
    );

    // Factures échues
    for (const statut of ['EN_ATTENTE', 'PARTIELLEMENT_PAYEE'] as const) {
      tasks.push(
        window.api.factures.getAll({ statut, limit: 200 }).then(({ factures }) => {
          for (const f of factures) {
            if (!f.dateEcheance || new Date(f.dateEcheance) >= startOfDay(now)) continue;
            const echeance = new Date(f.dateEcheance);
            alertes.push({
              id: `facture-echue-${f.id}`,
              niveau: 'critique',
              categorie: 'finances',
              titre: `Facture ${f.numero} échue`,
              detail: `${fcfa(f.montantTotal)}${f.candidat ? ` · ${f.candidat.prenom} ${f.candidat.nom}` : ''} — échéance dépassée ${formatDistanceToNow(echeance, { addSuffix: true, locale: fr })}.`,
              date: echeance,
              lien: PROTECTED_ROUTES.FACTURES.DETAIL(f.id),
            });
          }
        })
      );
    }
  }

  // Flotte
  tasks.push(
    window.api.rapports.vehicules({}).then((r) => {
      for (const v of r.alertes) {
        const depasse = (v.kmAvantRevision ?? 0) <= 0;
        alertes.push({
          id: `revision-${v.id}-${v.kilometrage}`,
          niveau: depasse ? 'critique' : 'attention',
          categorie: 'flotte',
          titre: `Révision ${depasse ? 'dépassée' : 'à prévoir'} — ${v.immatriculation}`,
          detail: `${v.libelle} : ${depasse ? `dépassée de ${Math.abs(v.kmAvantRevision ?? 0).toLocaleString('fr-FR')} km` : `dans ${(v.kmAvantRevision ?? 0).toLocaleString('fr-FR')} km`}.`,
          lien: PROTECTED_ROUTES.VEHICULES.ENTRETIENS(v.id),
        });
      }
    })
  );

  const results = await Promise.allSettled(tasks);
  const failures = results.filter((r) => r.status === 'rejected').length;
  if (failures === results.length) throw new Error('Aucune source de notifications n’a pu être chargée.');

  return alertes.sort(
    (a, b) => NIVEAUX[a.niveau].order - NIVEAUX[b.niveau].order || (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0)
  );
}

export default function NotificationsPage(): React.JSX.Element {
  const { user } = useAuth();
  const canManage = user?.role === 'ADMIN' || user?.role === 'SECRETAIRE';

  const [alertes, setAlertes] = React.useState<Alerte[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [seen, setSeen] = React.useState<Set<string>>(() => readSeen());
  const [filtre, setFiltre] = React.useState<'toutes' | Categorie>('toutes');
  const [showSeen, setShowSeen] = React.useState(false);
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    collectAlertes(canManage)
      .then((a) => {
        if (cancelled) return;
        setAlertes(a);
        setError(null);
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : String(err)));
    return () => {
      cancelled = true;
    };
  }, [canManage, tick]);

  const markSeen = (ids: string[]) => {
    const next = new Set(seen);
    ids.forEach((id) => next.add(id));
    setSeen(next);
    writeSeen(next);
  };

  const visibles = (alertes ?? []).filter((a) => (filtre === 'toutes' || a.categorie === filtre) && (showSeen || !seen.has(a.id)));
  const nonVues = (alertes ?? []).filter((a) => !seen.has(a.id));
  const count = (c: Categorie) => nonVues.filter((a) => a.categorie === c).length;
  const categories = (Object.keys(CATEGORIES) as Categorie[]).filter((c) => canManage || c === 'planning' || c === 'flotte');

  return (
    <div className="space-y-5 p-4 md:p-1 pb-12">
      <PageHeader
        icon={Bell}
        title="Notifications"
        accent="amber"
        badge={alertes ? `${nonVues.length} non vue${nonVues.length > 1 ? 's' : ''}` : undefined}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setTick((t) => t + 1)} aria-label="Actualiser">
              <RefreshCw className={cn('h-4 w-4', !alertes && !error && 'animate-spin')} />
            </Button>
            <Button variant="outline" size="sm" onClick={() => markSeen(visibles.map((a) => a.id))} disabled={visibles.length === 0}>
              <CheckCheck className="h-4 w-4 mr-1" /> Tout marquer comme vu
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={filtre} onValueChange={(v) => setFiltre(v as typeof filtre)}>
          <TabsList>
            <TabsTrigger value="toutes">Toutes {nonVues.length > 0 && `(${nonVues.length})`}</TabsTrigger>
            {categories.map((c) => (
              <TabsTrigger key={c} value={c}>
                {CATEGORIES[c].label} {count(c) > 0 && `(${count(c)})`}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={showSeen} onChange={(e) => setShowSeen(e.target.checked)} className="h-4 w-4 accent-current" />
          Afficher les notifications vues
        </label>
      </div>

      {error ? (
        <Card className="rounded-md">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">{error}</CardContent>
        </Card>
      ) : !alertes ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-md" />)}</div>
      ) : visibles.length === 0 ? (
        <Card className="rounded-md">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <BellOff className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">Rien à signaler</p>
            <p className="text-sm text-muted-foreground">Aucune notification {showSeen ? '' : 'non vue '}dans cette catégorie.</p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {visibles.map((a) => {
            const n = NIVEAUX[a.niveau];
            const C = CATEGORIES[a.categorie];
            const vue = seen.has(a.id);
            return (
              <li key={a.id}>
                <Card className={cn('rounded-md transition-opacity', vue && 'opacity-60')}>
                  <CardContent className="flex items-start gap-3 p-3">
                    <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md', n.className)}>
                      <n.icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{a.titre}</p>
                        <Badge variant="outline" className={cn('border-0 text-[10px]', n.className)}>
                          {n.label}
                        </Badge>
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <C.icon className="h-3 w-3" /> {C.label}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{a.detail}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {a.lien && (
                        <Button variant="ghost" size="sm" asChild onClick={() => markSeen([a.id])}>
                          <Link to={a.lien}>Ouvrir</Link>
                        </Button>
                      )}
                      {!vue && (
                        <Button variant="ghost" size="sm" onClick={() => markSeen([a.id])}>
                          Vu
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
