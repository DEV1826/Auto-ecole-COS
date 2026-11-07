// src/features/rapports/pages/RapportLeconsPage.tsx

/**
 * @module features/rapports/pages/RapportLeconsPage
 * @description
 * Rapport leçons : heures dispensées, réalisation / absences / annulations,
 * activité par moniteur, évolution mensuelle et répartition par jour et par heure.
 */

import * as React from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, CalendarX, Clock, Timer, UserX } from 'lucide-react';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatsGrid, type StatsCardProps } from '@/features/dashboard/components/common/StatsCard';
import {
  ChartCard,
  MonthlyBars,
  RankedBars,
  RapportLayout,
  libelle,
  signe,
  useRapport,
  useRapportExport,
  type Periode,
} from '../components/RapportKit';
import { PROTECTED_ROUTES } from '@/config';
import type { RapportPeriodeParams } from '@/types/rapports.types';

const fetchLecons = (params: RapportPeriodeParams) => window.api.rapports.lecons(params);
const heures = (n: number) => `${n.toLocaleString('fr-FR')} h`;

/** Petit histogramme HTML (une série) pour les répartitions jour / heure. */
function MiniColumns({ items }: { items: Array<{ label: string; value: number }> }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="flex h-36 items-end gap-1.5" role="img" aria-label={items.map((i) => `${i.label} : ${i.value}`).join(', ')}>
      {items.map((i) => (
        <div key={i.label} className="group flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${i.label} : ${i.value} leçon${i.value > 1 ? 's' : ''}`}>
          <span className="text-[10px] tabular-nums text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">{i.value}</span>
          <div
            className="w-full max-w-7 rounded-t-[4px] transition-opacity group-hover:opacity-80"
            style={{ height: `${Math.max((i.value / max) * 100, i.value ? 4 : 0)}%`, background: 'var(--viz-1)' }}
          />
          <span className="text-[10px] text-muted-foreground">{i.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function RapportLeconsPage(): React.JSX.Element {
  const [periode, setPeriode] = React.useState<Periode>({ preset: '3m' });
  const { data, loading, error, reload, params } = useRapport(fetchLecons, periode);
  const { exporting, exportRapports } = useRapportExport();

  const cards: StatsCardProps[] = data
    ? [
        {
          id: 'heures',
          title: 'Heures dispensées',
          value: heures(data.totalHeures),
          icon: <Clock className="h-5 w-5" />,
          Color: 'blue-600',
          description: `${signe(data.variationHeures)} vs période précédente`,
        },
        {
          id: 'realisation',
          title: 'Taux de réalisation',
          value: `${data.tauxRealisation} %`,
          icon: <CalendarCheck className="h-5 w-5" />,
          Color: 'emerald-600',
          description: `${data.totalLecons} leçons · ${data.dureeMoyenne} min en moyenne`,
        },
        {
          id: 'absence',
          title: "Taux d'absence",
          value: `${data.tauxAbsence} %`,
          icon: <UserX className="h-5 w-5" />,
          Color: 'amber-600',
          description: `${data.parStatut.ABSENCE ?? 0} absence${(data.parStatut.ABSENCE ?? 0) > 1 ? 's' : ''}`,
        },
        {
          id: 'annulation',
          title: "Taux d'annulation",
          value: `${data.tauxAnnulation} %`,
          icon: <CalendarX className="h-5 w-5" />,
          Color: 'red-600',
          description: `${data.parStatut.ANNULEE ?? 0} annulée${(data.parStatut.ANNULEE ?? 0) > 1 ? 's' : ''}`,
        },
      ]
    : [];

  const maxHeures = data ? Math.max(...data.parMoniteur.map((m) => m.heures), 1) : 1;

  return (
    <RapportLayout
      icon={Timer}
      title="Rapport des leçons"
      accent="violet"
      periode={periode}
      onPeriodeChange={setPeriode}
      error={error}
      loading={loading}
      onReload={reload}
      onExport={() => void exportRapports(['lecons'], params)}
      exporting={exporting}
    >
      <StatsGrid cards={cards} cols={4} isLoading={loading} classGrid="h-auto" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ChartCard title="Heures effectuées par mois" className="lg:col-span-2" loading={loading}>
          {data && (
            <MonthlyBars
              data={data.serie}
              series={[{ key: 'heures', label: 'Heures', color: 'var(--viz-1)' }]}
              valueFormatter={heures}
              axisFormatter={(n) => `${n} h`}
            />
          )}
        </ChartCard>
        <ChartCard title="Heures par type" description="Leçons effectuées." loading={loading}>
          {data && <RankedBars items={Object.entries(data.parType).map(([t, h]) => ({ label: libelle(t), value: h }))} valueFormatter={heures} />}
        </ChartCard>
      </div>

      <ChartCard title="Activité par moniteur" description="Heures effectuées, leçons planifiées, annulations et absences sur la période." loading={loading}>
        {data &&
          (data.parMoniteur.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Aucune leçon sur la période.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Moniteur</TableHead>
                    <TableHead className="w-[35%]">Heures effectuées</TableHead>
                    <TableHead className="text-right">Leçons</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Planifiées</TableHead>
                    <TableHead className="text-right">Annulées</TableHead>
                    <TableHead className="text-right">Absences</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.parMoniteur.map((m) => (
                    <TableRow key={m.moniteurId}>
                      <TableCell>
                        <Link to={PROTECTED_ROUTES.PLANNING.MONITEUR(m.moniteurId)} className="font-medium hover:underline">
                          {m.moniteurNom}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full" style={{ width: `${(m.heures / maxHeures) * 100}%`, background: 'var(--viz-1)' }} />
                          </div>
                          <span className="w-14 text-right text-sm font-medium tabular-nums">{heures(m.heures)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{m.lecons}</TableCell>
                      <TableCell className="text-right tabular-nums hidden sm:table-cell">{m.planifiees}</TableCell>
                      <TableCell className="text-right tabular-nums">{m.annulees}</TableCell>
                      <TableCell className="text-right tabular-nums">{m.absences}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Leçons par jour de la semaine" description="Hors annulations. Survolez une colonne pour le nombre exact." loading={loading}>
          {data && <MiniColumns items={data.parJourSemaine.map((j) => ({ label: j.jour.slice(0, 3), value: j.lecons }))} />}
        </ChartCard>
        <ChartCard title="Leçons par heure de début" description="Créneaux les plus demandés (7 h – 20 h)." loading={loading}>
          {data && <MiniColumns items={data.parHeure.map((h) => ({ label: h.heure, value: h.lecons }))} />}
        </ChartCard>
      </div>
    </RapportLayout>
  );
}
