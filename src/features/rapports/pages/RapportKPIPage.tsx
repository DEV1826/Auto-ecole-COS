// src/features/rapports/pages/RapportKPIPage.tsx

/**
 * @module features/rapports/pages/RapportKPIPage
 * @description
 * Tableau de bord des indicateurs clés (administrateurs) : rentabilité,
 * recouvrement, recrutement, réussite, activité pédagogique et flotte,
 * avec comparaison à la période précédente.
 */

import * as React from 'react';
import { ArrowDownRight, ArrowUpRight, Gauge, Minus, type LucideIcon } from 'lucide-react';
import {
  Award,
  Car,
  Clock,
  Coins,
  HandCoins,
  PiggyBank,
  Percent,
  UserPlus,
  Users,
  Wrench,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartCard, MonthlyBars, RapportLayout, fcfa, useRapport, useRapportExport, type Periode } from '../components/RapportKit';
import { cn } from '@/lib/utils';
import type { RapportPeriodeParams } from '@/types/rapports.types';

const fetchKpi = (params: RapportPeriodeParams) => window.api.rapports.kpi(params);

interface Kpi {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  /** Variation en % vs période précédente. */
  delta?: number;
  /** true si une hausse est une bonne nouvelle (défaut). */
  higherIsBetter?: boolean;
}

function KpiTile({ kpi }: { kpi: Kpi }) {
  const { delta, higherIsBetter = true } = kpi;
  const good = delta === undefined || delta === 0 ? null : delta > 0 === higherIsBetter;
  const DeltaIcon = !delta ? Minus : delta > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <Card className="rounded-md">
      <CardContent className="space-y-2 p-4">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <kpi.icon className="h-3.5 w-3.5" />
          {kpi.label}
        </p>
        <p className="text-2xl font-bold tabular-nums leading-none">{kpi.value}</p>
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="truncate text-muted-foreground">{kpi.hint}</span>
          {delta !== undefined && (
            <span
              className={cn(
                'flex shrink-0 items-center gap-0.5 font-medium tabular-nums',
                good === null ? 'text-muted-foreground' : good ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
              )}
              aria-label={`${delta > 0 ? 'Hausse' : delta < 0 ? 'Baisse' : 'Stable'} de ${Math.abs(delta)} % vs période précédente`}
            >
              <DeltaIcon className="h-3.5 w-3.5" />
              {Math.abs(delta).toLocaleString('fr-FR')} %
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function KpiGroup({ title, kpis, loading }: { title: string; kpis: Kpi[]; loading: boolean }) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-md" />)
          : kpis.map((k) => <KpiTile key={k.label} kpi={k} />)}
      </div>
    </section>
  );
}

export default function RapportKPIPage(): React.JSX.Element {
  const [periode, setPeriode] = React.useState<Periode>({ preset: '12m' });
  const { data: d, loading, error, reload, params } = useRapport(fetchKpi, periode);
  const { exporting, exportRapports } = useRapportExport();

  const finances: Kpi[] = d
    ? [
        { label: "Chiffre d'affaires", value: fcfa(d.chiffreAffaires), icon: Coins, delta: d.variationCA, hint: 'Paiements encaissés' },
        { label: 'Résultat', value: fcfa(d.benefice), icon: PiggyBank, hint: `Marge ${d.margePct} %` },
        { label: 'Taux de recouvrement', value: `${d.tauxRecouvrement} %`, icon: Percent, hint: 'Encaissé / facturé' },
        { label: 'Restes dus', value: fcfa(d.impayes), icon: HandCoins, hint: 'Formations non soldées' },
      ]
    : [];
  const candidats: Kpi[] = d
    ? [
        { label: 'Nouveaux inscrits', value: String(d.nouveauxInscrits), icon: UserPlus, delta: d.variationInscrits, hint: `${d.candidatsEnCours} en formation` },
        { label: 'CA par inscrit', value: fcfa(d.caParInscrit), icon: Coins, hint: 'Recettes / nouveaux inscrits' },
        { label: 'Réussite aux examens', value: `${d.tauxReussite} %`, icon: Award, hint: `Code ${d.tauxReussiteCode} % · conduite ${d.tauxReussiteConduite} %` },
        { label: "Taux d'abandon", value: `${d.tauxAbandon} %`, icon: Users, hint: d.tentativesMoyennesConduite ? `${d.tentativesMoyennesConduite} tentative(s) moy. en conduite` : undefined },
      ]
    : [];
  const activite: Kpi[] = d
    ? [
        { label: 'Heures dispensées', value: `${d.heuresDispensees.toLocaleString('fr-FR')} h`, icon: Clock, delta: d.variationHeures, hint: `${d.heuresParMoniteur} h par moniteur actif` },
        { label: "Taux d'absence", value: `${d.tauxAbsence} %`, icon: Users, hint: `Annulations ${d.tauxAnnulation} %` },
        { label: 'Coût / heure de conduite', value: d.coutParHeureConduite != null ? fcfa(d.coutParHeureConduite) : '—', icon: Wrench, hint: 'Entretiens + carburant' },
        { label: 'Disponibilité de la flotte', value: `${d.tauxDisponibiliteFlotte} %`, icon: Car, hint: `${d.alertesRevision} révision(s) à prévoir` },
      ]
    : [];

  return (
    <RapportLayout
      icon={Gauge}
      title="Indicateurs clés"
      accent="indigo"
      periode={periode}
      onPeriodeChange={setPeriode}
      error={error}
      loading={loading}
      onReload={reload}
      onExport={() => void exportRapports(['financier', 'candidats', 'lecons', 'vehicules'], params, 'pdf')}
      exporting={exporting}
    >
      <KpiGroup title="Finances" kpis={finances} loading={loading} />
      <KpiGroup title="Candidats" kpis={candidats} loading={loading} />
      <KpiGroup title="Activité et flotte" kpis={activite} loading={loading} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ChartCard title="Recettes et dépenses par mois" loading={loading}>
          {d && (
            <MonthlyBars
              data={d.serieFinanciere}
              series={[
                { key: 'recettes', label: 'Recettes', color: 'var(--viz-1)' },
                { key: 'depenses', label: 'Dépenses', color: 'var(--viz-2)' },
              ]}
              valueFormatter={fcfa}
            />
          )}
        </ChartCard>
        <ChartCard title="Heures de leçon par mois" loading={loading}>
          {d && (
            <MonthlyBars
              data={d.serieHeures}
              series={[{ key: 'heures', label: 'Heures', color: 'var(--viz-1)' }]}
              valueFormatter={(n) => `${n.toLocaleString('fr-FR')} h`}
              axisFormatter={(n) => `${n} h`}
            />
          )}
        </ChartCard>
      </div>
    </RapportLayout>
  );
}
