// src/features/rapports/pages/RapportExportPage.tsx

/**
 * @module features/rapports/pages/RapportExportPage
 * @description
 * Centre d'export : rapports d'activité (Excel détaillé ou synthèse PDF) sur une
 * période au choix, et exports rapides existants (bilan, factures, paiements,
 * examens). Les fichiers sont enregistrés dans Documents\Auto-Ecole COS\exports.
 */

import * as React from 'react';
import { toast } from 'sonner';
import {
  BarChart3,
  Car,
  ClipboardList,
  FileDown,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  GraduationCap,
  Landmark,
  Loader2,
  Receipt,
  Timer,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { PageHeader, errorMessage } from '@/components/forms/FormPageKit';
import { PeriodeSelector, periodeToParams, useRapportExport, type Periode } from '../components/RapportKit';
import { useAuth } from '@/hooks/use.auth';
import { cn, openDesktopPath } from '@/lib/utils';
import type { RapportExportType } from '@/types/rapports.types';

const RAPPORTS: Array<{ type: RapportExportType; label: string; description: string; icon: LucideIcon }> = [
  { type: 'financier', label: 'Financier', description: 'Recettes, dépenses, recouvrement, restes dus', icon: Landmark },
  { type: 'candidats', label: 'Candidats', description: 'Inscriptions, statuts, réussite aux examens', icon: GraduationCap },
  { type: 'lecons', label: 'Leçons', description: 'Heures, activité par moniteur, absences', icon: Timer },
  { type: 'vehicules', label: 'Flotte', description: 'Coûts, utilisation, révisions', icon: Car },
];

type QuickResult = { filePath?: string; path?: string } | null | undefined;

interface QuickExport {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  run: () => Promise<QuickResult>;
}

export default function RapportExportPage(): React.JSX.Element {
  const { user } = useAuth();
  const canFinance = user?.role === 'ADMIN' || user?.role === 'SECRETAIRE';
  const [periode, setPeriode] = React.useState<Periode>({ preset: '12m' });
  const [types, setTypes] = React.useState<Set<RapportExportType>>(new Set(['financier', 'candidats', 'lecons', 'vehicules']));
  const [format, setFormat] = React.useState<'xlsx' | 'pdf'>('xlsx');
  const [running, setRunning] = React.useState<string | null>(null);
  const { exporting, exportRapports } = useRapportExport();

  const toggle = (t: RapportExportType) =>
    setTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });

  const quick: QuickExport[] = [
    { id: 'bilan', label: "Bilan d'activité", description: 'PDF — instantané du tableau de bord', icon: BarChart3, run: () => window.api.exports.bilan({ format: 'pdf' }) },
    { id: 'factures-xlsx', label: 'Registre des factures', description: 'Excel — toutes les factures', icon: FileSpreadsheet, run: () => window.api.exports.factures({ format: 'xlsx' }) },
    { id: 'factures-pdf', label: 'Registre des factures', description: 'PDF — toutes les factures', icon: Receipt, run: () => window.api.exports.factures({ format: 'pdf' }) },
    { id: 'paiements', label: 'Journal des paiements', description: 'PDF — tous les paiements', icon: Wallet, run: () => window.api.exports.paiements({}) },
    { id: 'examens', label: 'Registre des examens', description: 'PDF — tous les examens', icon: ClipboardList, run: () => window.api.exports.examens({}) },
  ];

  const runQuick = async (q: QuickExport) => {
    setRunning(q.id);
    try {
      const res = await q.run();
      const file = res?.path ?? res?.filePath;
      toast.success('Export terminé', { description: file });
      if (file) await openDesktopPath(file);
    } catch (err) {
      toast.error('Export impossible', { description: errorMessage(err) });
    } finally {
      setRunning(null);
    }
  };

  const openFolder = async () => {
    try {
      await window.api.exports.openFolder();
    } catch (err) {
      toast.error("Ouverture du dossier impossible", { description: errorMessage(err) });
    }
  };

  const selected = RAPPORTS.filter((r) => types.has(r.type)).map((r) => r.type);
  const blocked = !canFinance;

  return (
    <div className="space-y-5 p-4 md:p-1 pb-12">
      <PageHeader
        icon={FileDown}
        title="Exports"
        accent="slate"
        actions={
          <Button variant="outline" size="sm" onClick={() => void openFolder()}>
            <FolderOpen className="h-4 w-4 mr-1" /> Dossier des exports
          </Button>
        }
      />

      {blocked && (
        <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          Les exports sont réservés aux administrateurs et au secrétariat.
        </p>
      )}

      <Card className="rounded-md">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Rapport d'activité</CardTitle>
          <CardDescription>Choisissez les rapports, la période et le format.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {RAPPORTS.map((r) => {
              const checked = types.has(r.type);
              return (
                <label
                  key={r.type}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors',
                    checked ? 'border-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/20' : 'hover:bg-muted/40'
                  )}
                >
                  <Checkbox checked={checked} onCheckedChange={() => toggle(r.type)} className="mt-0.5" disabled={blocked} />
                  <r.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>
                    <span className="block text-sm font-medium">{r.label}</span>
                    <span className="block text-xs text-muted-foreground">{r.description}</span>
                  </span>
                </label>
              );
            })}
          </div>

          <div className="flex flex-wrap items-end gap-6">
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Période</p>
              <PeriodeSelector value={periode} onChange={setPeriode} />
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Format</p>
              <div className="flex gap-2" role="radiogroup" aria-label="Format">
                {([
                  { v: 'xlsx', label: 'Excel détaillé', icon: FileSpreadsheet },
                  { v: 'pdf', label: 'Synthèse PDF', icon: FileText },
                ] as const).map((f) => (
                  <Button
                    key={f.v}
                    type="button"
                    role="radio"
                    aria-checked={format === f.v}
                    variant={format === f.v ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormat(f.v)}
                  >
                    <f.icon className="h-4 w-4 mr-1" /> {f.label}
                  </Button>
                ))}
              </div>
            </div>
            <Button
              className="ml-auto"
              onClick={() => void exportRapports(selected, periodeToParams(periode), format)}
              disabled={blocked || exporting || selected.length === 0}
            >
              {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
              Générer l'export
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-md">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Exports rapides</CardTitle>
          <CardDescription>Registres complets, sans filtre de période.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {quick.map((q) => (
            <button
              key={q.id}
              type="button"
              disabled={blocked || running !== null}
              onClick={() => void runQuick(q)}
              className="flex items-center gap-3 rounded-md border p-3 text-left transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {running === q.id ? (
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-muted-foreground" />
              ) : (
                <q.icon className="h-5 w-5 shrink-0 text-muted-foreground" />
              )}
              <span>
                <span className="block text-sm font-medium">{q.label}</span>
                <span className="block text-xs text-muted-foreground">{q.description}</span>
              </span>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
