// src/features/rapports/pages/RapportVehiculesPage.tsx

/**
 * @module features/rapports/pages/RapportVehiculesPage
 * @description
 * Rapport flotte : disponibilité, coûts d'entretien et de carburant, utilisation
 * en leçon, coût par heure et révisions à prévoir, véhicule par véhicule.
 */

import * as React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Car, Fuel, Gauge, ShieldCheck, Wrench } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatsGrid, type StatsCardProps } from '@/features/dashboard/components/common/StatsCard';
import { ChartCard, RankedBars, RapportLayout, fcfa, useRapport, useRapportExport, type Periode } from '../components/RapportKit';
import { PROTECTED_ROUTES } from '@/config';
import { cn } from '@/lib/utils';
import { STATUT_VEHICULE_CONFIG } from '@/types/enums';
import type { StatutVehicule } from '@/types/enums';
import type { RapportPeriodeParams } from '@/types/rapports.types';

const fetchVehicules = (params: RapportPeriodeParams) => window.api.rapports.vehicules(params);
const km = (n: number) => `${n.toLocaleString('fr-FR')} km`;

export default function RapportVehiculesPage(): React.JSX.Element {
  const [periode, setPeriode] = React.useState<Periode>({ preset: '12m' });
  const { data, loading, error, reload, params } = useRapport(fetchVehicules, periode);
  const { exporting, exportRapports } = useRapportExport();

  const cards: StatsCardProps[] = data
    ? [
        {
          id: 'dispo',
          title: 'Disponibilité de la flotte',
          value: `${data.tauxDisponibilite} %`,
          icon: <ShieldCheck className="h-5 w-5" />,
          Color: 'emerald-600',
          description: `${data.disponibles + data.enLecon}/${data.totalVehicules} véhicules utilisables`,
        },
        {
          id: 'entretiens',
          title: 'Coût des entretiens',
          value: fcfa(data.coutEntretiens),
          icon: <Wrench className="h-5 w-5" />,
          Color: 'amber-600',
          description: `${data.entretiensPeriode} intervention${data.entretiensPeriode > 1 ? 's' : ''}`,
        },
        {
          id: 'carburant',
          title: 'Carburant',
          value: fcfa(data.coutCarburant),
          icon: <Fuel className="h-5 w-5" />,
          Color: 'red-600',
          description: `${data.heuresLecons.toLocaleString('fr-FR')} h de leçon en véhicule`,
        },
        {
          id: 'km',
          title: 'Kilométrage moyen',
          value: km(data.kilometrageMoyen),
          icon: <Gauge className="h-5 w-5" />,
          Color: 'blue-600',
          description: `${data.alertes.length} révision${data.alertes.length > 1 ? 's' : ''} à prévoir`,
        },
      ]
    : [];

  return (
    <RapportLayout
      icon={Car}
      title="Rapport de la flotte"
      accent="sky"
      periode={periode}
      onPeriodeChange={setPeriode}
      error={error}
      loading={loading}
      onReload={reload}
      onExport={() => void exportRapports(['vehicules'], params)}
      exporting={exporting}
    >
      <StatsGrid cards={cards} cols={4} isLoading={loading} classGrid="h-auto" />

      {data && data.alertes.length > 0 && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4" /> Révisions à prévoir
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {data.alertes.map((v) => (
              <li key={v.id}>
                <Link
                  to={PROTECTED_ROUTES.VEHICULES.ENTRETIENS(v.id)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-background px-2.5 py-1 text-xs hover:bg-muted dark:border-amber-800"
                >
                  <span className="font-mono font-medium">{v.immatriculation}</span>
                  <span className="text-muted-foreground">
                    {v.kmAvantRevision! <= 0 ? `dépassée de ${km(Math.abs(v.kmAvantRevision!))}` : `dans ${km(v.kmAvantRevision!)}`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ChartCard title="Coût total par véhicule" description="Entretiens, carburant et autres dépenses rattachées." className="lg:col-span-2" loading={loading}>
          {data && (
            <RankedBars
              items={data.parVehicule.map((v) => ({
                label: `${v.immatriculation} · ${v.libelle}`,
                value: v.coutTotal,
                hint: v.coutParHeure != null ? `${fcfa(v.coutParHeure)}/h` : undefined,
              }))}
              valueFormatter={fcfa}
              color="var(--viz-2)"
              max={10}
            />
          )}
        </ChartCard>
        <ChartCard title="Types d'intervention" description="Entretiens de la période." loading={loading}>
          {data && <RankedBars items={data.entretiensParType.map((e) => ({ label: e.type, value: e.nombre }))} />}
        </ChartCard>
      </div>

      <ChartCard title="Détail par véhicule" loading={loading}>
        {data &&
          (data.parVehicule.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Aucun véhicule dans le parc.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Véhicule</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Kilométrage</TableHead>
                    <TableHead className="text-right">Heures de leçon</TableHead>
                    <TableHead className="text-right hidden md:table-cell">Entretiens</TableHead>
                    <TableHead className="text-right hidden md:table-cell">Carburant</TableHead>
                    <TableHead className="text-right">Coût / heure</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">Prochaine révision</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.parVehicule.map((v) => {
                    const cfg = STATUT_VEHICULE_CONFIG[v.statut as StatutVehicule];
                    return (
                      <TableRow key={v.id}>
                        <TableCell>
                          <Link to={PROTECTED_ROUTES.VEHICULES.DETAIL(v.id)} className="font-mono font-medium hover:underline">
                            {v.immatriculation}
                          </Link>
                          <p className="text-xs text-muted-foreground">{v.libelle} · Cat. {v.categorie}</p>
                        </TableCell>
                        <TableCell>
                          {cfg && (
                            <Badge variant="outline" className={cn('border-0 text-[10px]', cfg.bgColor, cfg.textColor)}>
                              <cfg.icon className="h-3 w-3 mr-1" />
                              {cfg.label}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{km(v.kilometrage)}</TableCell>
                        <TableCell className="text-right tabular-nums">{v.heuresLecons.toLocaleString('fr-FR')} h</TableCell>
                        <TableCell className="text-right tabular-nums hidden md:table-cell">{fcfa(v.coutEntretiens)}</TableCell>
                        <TableCell className="text-right tabular-nums hidden md:table-cell">{fcfa(v.carburant)}</TableCell>
                        <TableCell className="text-right tabular-nums">{v.coutParHeure != null ? fcfa(v.coutParHeure) : '—'}</TableCell>
                        <TableCell className={cn('text-right tabular-nums hidden lg:table-cell', v.alerteRevision && 'font-medium text-amber-700 dark:text-amber-300')}>
                          {v.kmAvantRevision == null ? '—' : v.kmAvantRevision <= 0 ? `Dépassée (${km(Math.abs(v.kmAvantRevision))})` : `Dans ${km(v.kmAvantRevision)}`}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ))}
      </ChartCard>
    </RapportLayout>
  );
}
