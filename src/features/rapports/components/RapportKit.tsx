// src/features/rapports/components/RapportKit.tsx

/**
 * @module features/rapports/components/RapportKit
 * @description
 * Briques communes aux pages de rapports : période (préréglages + plage libre),
 * chargement des données, mise en page, histogramme mensuel et barres classées.
 *
 * Couleurs : jetons `--viz-*` (src/styles/index.css), palette validée pour le
 * daltonisme et le contraste en clair comme en sombre. Les valeurs et libellés
 * restent dans les couleurs de texte ; la couleur ne porte que l'identité des séries.
 */

import * as React from 'react';
import { format, startOfMonth, startOfYear, subDays, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { AlertTriangle, FileDown, Lock, RefreshCw, type LucideIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { DatePicker } from '@/components/ui/date-picker';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { PageHeader, errorMessage, type Accent } from '@/components/forms/FormPageKit';
import { toast } from 'sonner';
import { cn, openDesktopPath } from '@/lib/utils';
import type { RapportPeriodeParams } from '@/types/rapports.types';

// ─────────────────────────────────────────────────────────────────────────────
// Formats
// ─────────────────────────────────────────────────────────────────────────────

export const fcfa = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} FCFA`;

/** Montant compact pour les axes : 1,2 M · 350 k. */
export const fcfaCompact = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} M`;
  if (abs >= 1_000) return `${Math.round(n / 1_000).toLocaleString('fr-FR')} k`;
  return Math.round(n).toLocaleString('fr-FR');
};

/** « 2026-03 » → « mars 26 » */
export const moisCourt = (mois: string) => {
  const [y, m] = mois.split('-').map(Number);
  return format(new Date(y, m - 1, 1), 'MMM yy', { locale: fr });
};

export const signe = (n: number) => `${n > 0 ? '+' : ''}${n.toLocaleString('fr-FR')} %`;

// ─────────────────────────────────────────────────────────────────────────────
// Période
// ─────────────────────────────────────────────────────────────────────────────

export type PeriodePreset = '30j' | '3m' | '6m' | '12m' | 'annee' | 'perso';

const PRESETS: Array<{ value: PeriodePreset; label: string }> = [
  { value: '30j', label: '30 derniers jours' },
  { value: '3m', label: '3 derniers mois' },
  { value: '6m', label: '6 derniers mois' },
  { value: '12m', label: '12 derniers mois' },
  { value: 'annee', label: 'Année en cours' },
  { value: 'perso', label: 'Période personnalisée' },
];

export interface Periode {
  preset: PeriodePreset;
  range?: DateRange;
}

export function periodeToParams(p: Periode): RapportPeriodeParams {
  const now = new Date();
  switch (p.preset) {
    case '30j':
      return { dateDebut: subDays(now, 29).toISOString(), dateFin: now.toISOString() };
    case '3m':
      return { dateDebut: startOfMonth(subMonths(now, 2)).toISOString(), dateFin: now.toISOString() };
    case '6m':
      return { dateDebut: startOfMonth(subMonths(now, 5)).toISOString(), dateFin: now.toISOString() };
    case 'annee':
      return { dateDebut: startOfYear(now).toISOString(), dateFin: now.toISOString() };
    case 'perso':
      return p.range?.from
        ? { dateDebut: p.range.from.toISOString(), dateFin: (p.range.to ?? p.range.from).toISOString() }
        : {};
    default:
      return { dateDebut: startOfMonth(subMonths(now, 11)).toISOString(), dateFin: now.toISOString() };
  }
}

export function PeriodeSelector({ value, onChange }: { value: Periode; onChange: (p: Periode) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={value.preset} onValueChange={(v) => onChange({ preset: v as PeriodePreset, range: value.range })}>
        <SelectTrigger className="h-9 w-52" aria-label="Période">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value.preset === 'perso' && (
        <DatePicker
          mode="range"
          dateRange={value.range}
          onRangeSelect={(range) => onChange({ preset: 'perso', range })}
          numberOfMonths={2}
          formatStr="dd/MM/yyyy"
          placeholder="Choisir les dates"
          className="h-9 w-64"
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Chargement
// ─────────────────────────────────────────────────────────────────────────────

export function useRapport<T>(fetcher: (params: RapportPeriodeParams) => Promise<T>, periode: Periode) {
  const params = React.useMemo(() => periodeToParams(periode), [periode]);
  const key = JSON.stringify(params);
  const [state, setState] = React.useState<{ key: string; data: T | null; error: string | null } | null>(null);
  const [reloadTick, setReloadTick] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    fetcher(params)
      .then((data) => !cancelled && setState({ key, data, error: null }))
      .catch((err) => !cancelled && setState({ key, data: null, error: errorMessage(err, 'Chargement du rapport impossible.') }));
    return () => {
      cancelled = true;
    };
    // `key` résume `params` ; reloadTick force un rechargement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, reloadTick, fetcher]);

  const current = state?.key === key ? state : null;
  return {
    data: current?.data ?? null,
    error: current?.error ?? null,
    loading: current === null,
    params,
    reload: () => setReloadTick((t) => t + 1),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Mise en page
// ─────────────────────────────────────────────────────────────────────────────

export interface RapportLayoutProps {
  icon: LucideIcon;
  title: string;
  accent?: Accent;
  periode: Periode;
  onPeriodeChange: (p: Periode) => void;
  error: string | null;
  loading: boolean;
  onReload: () => void;
  onExport?: () => void;
  exporting?: boolean;
  children: React.ReactNode;
}

export function RapportLayout({
  icon,
  title,
  accent = 'indigo',
  periode,
  onPeriodeChange,
  error,
  loading,
  onReload,
  onExport,
  exporting,
  children,
}: RapportLayoutProps) {
  const forbidden = error?.includes('FORBIDDEN');
  return (
    <div className="space-y-5 p-4 md:p-1 pb-12">
      <PageHeader
        icon={icon}
        title={title}
        accent={accent}
        actions={
          <>
            <PeriodeSelector value={periode} onChange={onPeriodeChange} />
            <Button variant="outline" size="sm" onClick={onReload} disabled={loading} aria-label="Actualiser">
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            </Button>
            {onExport && (
              <Button size="sm" onClick={onExport} disabled={loading || exporting || Boolean(error)}>
                <FileDown className="h-4 w-4 mr-1" /> Exporter
              </Button>
            )}
          </>
        }
      />
      {error ? (
        <Card className="rounded-md">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            {forbidden ? <Lock className="h-8 w-8 text-muted-foreground" /> : <AlertTriangle className="h-8 w-8 text-amber-500" />}
            <p className="font-medium">{forbidden ? 'Accès réservé' : 'Rapport indisponible'}</p>
            <p className="max-w-md text-sm text-muted-foreground">
              {forbidden ? "Votre rôle ne permet pas de consulter ce rapport." : error.replace(/^[A-Z_]+: /, '')}
            </p>
            {!forbidden && (
              <Button variant="outline" size="sm" onClick={onReload}>
                Réessayer
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        children
      )}
    </div>
  );
}

export function ChartCard({
  title,
  description,
  children,
  className,
  loading,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
}) {
  return (
    <Card className={cn('rounded-md', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{loading ? <Skeleton className="h-56 w-full" /> : children}</CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Histogramme mensuel (1 à 3 séries, même unité → un seul axe)
// ─────────────────────────────────────────────────────────────────────────────

export interface Serie {
  key: string;
  label: string;
  /** Jeton CSS : 'var(--viz-1)' … */
  color: string;
}

export function MonthlyBars<T extends { mois: string }>({
  data,
  series,
  valueFormatter = (n) => n.toLocaleString('fr-FR'),
  axisFormatter = fcfaCompact,
  height = 240,
}: {
  data: T[];
  series: Serie[];
  valueFormatter?: (n: number) => string;
  axisFormatter?: (n: number) => string;
  height?: number;
}) {
  const config = React.useMemo<ChartConfig>(
    () => Object.fromEntries(series.map((s) => [s.key, { label: s.label, color: s.color }])),
    [series]
  );
  const rows = data.map((d) => ({ ...d, label: moisCourt(d.mois) }));
  const empty = rows.every((r) => series.every((s) => !Number((r as Record<string, unknown>)[s.key])));

  if (empty) {
    return <p className="flex h-40 items-center justify-center text-sm text-muted-foreground">Aucune donnée sur la période.</p>;
  }

  return (
    <ChartContainer config={config} className="w-full" style={{ height }}>
      <BarChart accessibilityLayer data={rows} barGap={2} margin={{ left: 4, right: 4, top: 8 }}>
        <CartesianGrid vertical={false} strokeOpacity={0.5} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={8} />
        <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={(v) => axisFormatter(Number(v))} />
        <ChartTooltip
          cursor={{ fillOpacity: 0.08 }}
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <div className="flex w-full items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: config[String(name)]?.color }} />
                    {config[String(name)]?.label ?? name}
                  </span>
                  <span className="font-mono font-medium tabular-nums text-foreground">{valueFormatter(Number(value))}</span>
                </div>
              )}
            />
          }
        />
        {series.length > 1 && <ChartLegend content={<ChartLegendContent />} />}
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} fill={`var(--color-${s.key})`} radius={[4, 4, 0, 0]} maxBarSize={28} />
        ))}
      </BarChart>
    </ChartContainer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Barres classées (une seule série, valeur écrite à côté)
// ─────────────────────────────────────────────────────────────────────────────

export function RankedBars({
  items,
  valueFormatter = (n) => n.toLocaleString('fr-FR'),
  color = 'var(--viz-1)',
  emptyText = 'Aucune donnée sur la période.',
  max: maxItems = 8,
}: {
  items: Array<{ label: string; value: number; hint?: string }>;
  valueFormatter?: (n: number) => string;
  color?: string;
  emptyText?: string;
  max?: number;
}) {
  const sorted = [...items].filter((i) => i.value > 0).sort((a, b) => b.value - a.value);
  const shown = sorted.slice(0, maxItems);
  const rest = sorted.slice(maxItems);
  if (rest.length) shown.push({ label: `Autres (${rest.length})`, value: rest.reduce((s, i) => s + i.value, 0) });
  const max = Math.max(...shown.map((i) => i.value), 1);

  if (shown.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">{emptyText}</p>;

  return (
    <ul className="space-y-2.5">
      {shown.map((i) => (
        <li key={i.label} title={`${i.label} : ${valueFormatter(i.value)}${i.hint ? ` (${i.hint})` : ''}`}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{i.label}</span>
            <span className="shrink-0 font-medium tabular-nums">
              {valueFormatter(i.value)}
              {i.hint && <span className="ml-1.5 text-xs font-normal text-muted-foreground">{i.hint}</span>}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full" style={{ width: `${(i.value / max) * 100}%`, background: color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Libellés lisibles des énumérations utilisées dans les rapports. */
export const LIBELLES: Record<string, string> = {
  ESPECES: 'Espèces',
  CHEQUE: 'Chèque',
  VIREMENT: 'Virement',
  CARTE: 'Carte bancaire',
  MOBILE_MONEY: 'Mobile money',
  CARBURANT: 'Carburant',
  ENTRETIEN_VEHICULE: 'Entretien véhicule',
  SALAIRE: 'Salaires',
  LOYER: 'Loyer',
  ELECTRICITE: 'Électricité',
  TELEPHONE: 'Téléphone',
  ASSURANCE: 'Assurance',
  PUBLICITE: 'Publicité',
  FOURNITURES: 'Fournitures',
  TAXES: 'Taxes',
  AUTRE: 'Autre',
  EN_COURS: 'En cours',
  RECU: 'Reçu',
  ECHOUE: 'Échoué',
  ABANDONNE: 'Abandonné',
  EN_ATTENTE: 'En attente',
  PLANIFIEE: 'Planifiée',
  EFFECTUEE: 'Effectuée',
  ANNULEE: 'Annulée',
  ABSENCE: 'Absence',
  CODE: 'Code',
  CONDUITE: 'Conduite',
  CONDUITE_ACCOMPAGNEE: 'Conduite accompagnée',
  PARTIELLEMENT_PAYEE: 'Partiellement payée',
  PAYEE: 'Payée',
};
export const libelle = (k: string) => LIBELLES[k] ?? k;

// ─────────────────────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────────────────────

/** Export Excel d'un ou plusieurs rapports puis ouverture du fichier. */
export function useRapportExport() {
  const [exporting, setExporting] = React.useState(false);
  const run = React.useCallback(
    async (
      types: Array<'financier' | 'candidats' | 'lecons' | 'vehicules'>,
      params: RapportPeriodeParams,
      fileFormat: 'xlsx' | 'pdf' = 'xlsx'
    ) => {
      setExporting(true);
      try {
        const res = await window.api.rapports.export({ ...params, types, format: fileFormat });
        toast.success('Rapport exporté', { description: res.path });
        await openDesktopPath(res.path);
        return res;
      } catch (err) {
        toast.error('Export impossible', { description: errorMessage(err) });
        return null;
      } finally {
        setExporting(false);
      }
    },
    []
  );
  return { exporting, exportRapports: run };
}
