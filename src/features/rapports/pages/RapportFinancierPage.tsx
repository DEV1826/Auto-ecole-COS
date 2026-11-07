// src/features/rapports/pages/RapportFinancierPage.tsx

/**
 * @module features/rapports/pages/RapportFinancierPage
 * @description
 * Rapport financier : recettes, dépenses, résultat et marge sur la période,
 * évolution mensuelle, répartition par mode de paiement et par catégorie de
 * dépense, recouvrement des factures et restes dus par candidat.
 */

import * as React from 'react';
import { Link } from 'react-router-dom';
import { Coins, HandCoins, Landmark, PiggyBank, Receipt, TrendingDown, Wallet } from 'lucide-react';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { StatsGrid, type StatsCardProps } from '@/features/dashboard/components/common/StatsCard';
import {
  ChartCard,
  MonthlyBars,
  RankedBars,
  RapportLayout,
  fcfa,
  libelle,
  signe,
  useRapport,
  useRapportExport,
  type Periode,
} from '../components/RapportKit';
import { PROTECTED_ROUTES } from '@/config';

const fetchFinancier = (params: Parameters<typeof window.api.rapports.financier>[0]) => window.api.rapports.financier(params);

export default function RapportFinancierPage(): React.JSX.Element {
  const [periode, setPeriode] = React.useState<Periode>({ preset: '12m' });
  const { data, loading, error, reload, params } = useRapport(fetchFinancier, periode);
  const { exporting, exportRapports } = useRapportExport();

  const cards: StatsCardProps[] = data
    ? [
        {
          id: 'recettes',
          title: 'Recettes',
          value: fcfa(data.totalPaiements),
          icon: <Coins className="h-5 w-5" />,
          Color: 'blue-600',
          description: `${signe(data.variations.recettes)} vs période précédente`,
        },
        {
          id: 'depenses',
          title: 'Dépenses',
          value: fcfa(data.totalDepenses),
          icon: <TrendingDown className="h-5 w-5" />,
          Color: 'amber-600',
          description: `${signe(data.variations.depenses)} vs période précédente`,
        },
        {
          id: 'resultat',
          title: 'Résultat',
          value: fcfa(data.benefice),
          icon: <PiggyBank className="h-5 w-5" />,
          Color: data.benefice >= 0 ? 'emerald-600' : 'red-600',
          description: `Marge de ${data.margePct.toLocaleString('fr-FR')} %`,
        },
        {
          id: 'impayes',
          title: 'Restes dus',
          value: fcfa(data.impayes.total),
          icon: <HandCoins className="h-5 w-5" />,
          Color: 'red-600',
          description: `${data.impayes.nbCandidats} candidat${data.impayes.nbCandidats > 1 ? 's' : ''} concerné${data.impayes.nbCandidats > 1 ? 's' : ''}`,
        },
      ]
    : [];

  return (
    <RapportLayout
      icon={Landmark}
      title="Rapport financier"
      accent="emerald"
      periode={periode}
      onPeriodeChange={setPeriode}
      error={error}
      loading={loading}
      onReload={reload}
      onExport={() => void exportRapports(['financier'], params)}
      exporting={exporting}
    >
      <StatsGrid cards={cards} cols={4} isLoading={loading} classGrid="h-auto" />

      <ChartCard title="Recettes et dépenses par mois" description="Montants encaissés et dépensés, en FCFA." loading={loading}>
        {data && (
          <MonthlyBars
            data={data.serie}
            series={[
              { key: 'recettes', label: 'Recettes', color: 'var(--viz-1)' },
              { key: 'depenses', label: 'Dépenses', color: 'var(--viz-2)' },
            ]}
            valueFormatter={fcfa}
            height={260}
          />
        )}
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Recettes par mode de paiement" description={data ? `${data.nbPaiements} paiements · panier moyen ${fcfa(data.panierMoyen)}` : undefined} loading={loading}>
          {data && (
            <RankedBars
              items={data.parMode.map((m) => ({ label: libelle(m.mode), value: m.montant, hint: `${m.part} %` }))}
              valueFormatter={fcfa}
              color="var(--viz-1)"
            />
          )}
        </ChartCard>
        <ChartCard title="Dépenses par catégorie" description={data ? `${data.nbDepenses} dépenses enregistrées` : undefined} loading={loading}>
          {data && (
            <RankedBars
              items={data.parCategorie.map((c) => ({ label: libelle(c.categorie), value: c.montant, hint: `${c.part} %` }))}
              valueFormatter={fcfa}
              color="var(--viz-2)"
            />
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ChartCard title="Facturation" description="Factures émises sur la période (hors annulées)." loading={loading}>
          {data && (
            <div className="space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Receipt className="h-4 w-4" /> {data.facturation.nbFactures} factures
                </span>
                <span className="font-semibold tabular-nums">{fcfa(data.facturation.totalFacture)}</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span>Taux de recouvrement</span>
                  <span className="font-semibold tabular-nums">{data.facturation.tauxRecouvrement} %</span>
                </div>
                <Progress value={Math.min(100, data.facturation.tauxRecouvrement)} className="h-2" />
                <p className="text-xs text-muted-foreground">Encaissements de la période rapportés au montant facturé.</p>
              </div>
              <ul className="space-y-1 text-sm">
                {Object.entries(data.facturation.parStatut).map(([statut, n]) => (
                  <li key={statut} className="flex justify-between">
                    <span className="text-muted-foreground">{libelle(statut)}</span>
                    <span className="tabular-nums">{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Restes dus par candidat"
          description="Coût de la formation moins les paiements reçus (toutes périodes)."
          className="lg:col-span-2"
          loading={loading}
        >
          {data &&
            (data.impayes.liste.length === 0 ? (
              <p className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                <Wallet className="h-4 w-4" /> Tous les candidats sont à jour de leurs paiements.
              </p>
            ) : (
              <div className="max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidat</TableHead>
                      <TableHead className="hidden md:table-cell">Formation</TableHead>
                      <TableHead className="text-right">Payé</TableHead>
                      <TableHead className="text-right">Reste dû</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.impayes.liste.map((c) => (
                      <TableRow key={c.candidatId}>
                        <TableCell>
                          <Link to={PROTECTED_ROUTES.CANDIDATS.DETAIL(c.candidatId)} className="font-medium hover:underline">
                            {c.nom}
                          </Link>
                          {c.telephone && <p className="text-xs text-muted-foreground">{c.telephone}</p>}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{c.formation ?? '—'}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {fcfa(c.paye)}
                          <span className="block text-xs text-muted-foreground">sur {fcfa(c.montantFormation)}</span>
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">{fcfa(c.reste)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
        </ChartCard>
      </div>
    </RapportLayout>
  );
}
