// src/features/rapports/pages/RapportCandidatsPage.tsx

/**
 * @module features/rapports/pages/RapportCandidatsPage
 * @description
 * Rapport candidats : inscriptions (évolution, formations choisies), état du
 * fichier candidats, réussite aux examens (code / conduite) et abandons.
 */

import * as React from 'react';
import { Award, BookOpen, Car, GraduationCap, UserMinus, UserPlus, Users } from 'lucide-react';

import { Progress } from '@/components/ui/progress';
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
import type { ExamenTypeStats, RapportPeriodeParams } from '@/types/rapports.types';

const fetchCandidats = (params: RapportPeriodeParams) => window.api.rapports.candidats(params);

function ReussiteRow({ icon: Icon, label, stats }: { icon: React.ElementType; label: string; stats: ExamenTypeStats }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 font-medium">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {label}
        </span>
        <span className="tabular-nums">
          <span className="font-semibold">{stats.tauxReussite} %</span>
          <span className="text-muted-foreground"> · {stats.recus}/{stats.passes} reçus</span>
        </span>
      </div>
      <Progress value={stats.tauxReussite} className="h-2" />
    </div>
  );
}

export default function RapportCandidatsPage(): React.JSX.Element {
  const [periode, setPeriode] = React.useState<Periode>({ preset: '12m' });
  const { data, loading, error, reload, params } = useRapport(fetchCandidats, periode);
  const { exporting, exportRapports } = useRapportExport();

  const cards: StatsCardProps[] = data
    ? [
        {
          id: 'inscrits',
          title: 'Nouveaux inscrits',
          value: data.totalInscrits,
          icon: <UserPlus className="h-5 w-5" />,
          Color: 'blue-600',
          description: `${signe(data.variationInscrits)} vs période précédente`,
        },
        {
          id: 'en-cours',
          title: 'En formation',
          value: data.enCours,
          icon: <Users className="h-5 w-5" />,
          Color: 'amber-600',
          description: `Sur ${data.totalCandidats} candidats au total`,
        },
        {
          id: 'reussite',
          title: 'Réussite aux examens',
          value: `${data.tauxReussite} %`,
          icon: <Award className="h-5 w-5" />,
          Color: 'emerald-600',
          description: `${data.examens.total - data.examens.enAttente} épreuves passées`,
        },
        {
          id: 'abandon',
          title: "Taux d'abandon",
          value: `${data.tauxAbandon} %`,
          icon: <UserMinus className="h-5 w-5" />,
          Color: 'red-600',
          description: 'Sur l’ensemble du fichier',
        },
      ]
    : [];

  return (
    <RapportLayout
      icon={GraduationCap}
      title="Rapport candidats"
      accent="indigo"
      periode={periode}
      onPeriodeChange={setPeriode}
      error={error}
      loading={loading}
      onReload={reload}
      onExport={() => void exportRapports(['candidats'], params)}
      exporting={exporting}
    >
      <StatsGrid cards={cards} cols={4} isLoading={loading} classGrid="h-auto" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ChartCard title="Inscriptions par mois" description="Candidats inscrits sur la période." className="lg:col-span-2" loading={loading}>
          {data && (
            <MonthlyBars
              data={data.serieInscriptions}
              series={[{ key: 'inscriptions', label: 'Inscriptions', color: 'var(--viz-1)' }]}
              axisFormatter={(n) => String(n)}
            />
          )}
        </ChartCard>
        <ChartCard title="Formations choisies" description="Par les inscrits de la période." loading={loading}>
          {data && <RankedBars items={data.parFormation.map((f) => ({ label: f.nom, value: f.nombre }))} />}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Réussite aux examens" description="Épreuves dont le résultat est connu, sur la période." loading={loading}>
          {data && (
            <div className="space-y-5">
              <ReussiteRow icon={BookOpen} label="Code de la route" stats={data.examens.code} />
              <ReussiteRow icon={Car} label="Conduite" stats={data.examens.conduite} />
              <dl className="grid grid-cols-2 gap-3 border-t pt-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Tentatives avant réussite (conduite)</dt>
                  <dd className="text-lg font-semibold tabular-nums">
                    {data.tentativesMoyennesConduite ? data.tentativesMoyennesConduite.toLocaleString('fr-FR') : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Résultats en attente</dt>
                  <dd className="text-lg font-semibold tabular-nums">{data.examens.enAttente}</dd>
                </div>
              </dl>
            </div>
          )}
        </ChartCard>
        <ChartCard title="Candidats par statut" description="État actuel de l'ensemble du fichier." loading={loading}>
          {data && (
            <RankedBars
              items={Object.entries(data.parStatut).map(([statut, n]) => ({
                label: libelle(statut),
                value: n,
                hint: data.totalCandidats ? `${Math.round((n / data.totalCandidats) * 100)} %` : undefined,
              }))}
            />
          )}
        </ChartCard>
      </div>
    </RapportLayout>
  );
}
