// src/components/forms/FormPageKit.tsx

/**
 * @module components/forms/FormPageKit
 * @description
 * Briques communes aux pages de création / édition (même rendu que les pages
 * Formations) : en-tête de page, squelette de chargement, en-tête de section
 * de formulaire, jauge de complétion, ligne d'information et checklist.
 *
 * Les couleurs sont choisies via `accent` (classes Tailwind littérales,
 * indispensables pour que Tailwind les génère).
 */

import * as React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { CalendarDays, CheckCircle2, Circle, type LucideIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Palettes
// ─────────────────────────────────────────────────────────────────────────────

export type Accent = 'indigo' | 'emerald' | 'amber' | 'sky' | 'violet' | 'rose' | 'slate' | 'teal';

const ACCENTS: Record<
  Accent,
  { solid: string; soft: string; softText: string; icon: string; bar: string }
> = {
  indigo: {
    solid: 'bg-indigo-700 text-white',
    soft: 'bg-indigo-100 dark:bg-indigo-900/40',
    softText: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
    icon: 'text-indigo-700 dark:text-indigo-400',
    bar: 'bg-indigo-600',
  },
  emerald: {
    solid: 'bg-emerald-700 text-white',
    soft: 'bg-emerald-100 dark:bg-emerald-900/40',
    softText: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    icon: 'text-emerald-700 dark:text-emerald-400',
    bar: 'bg-emerald-600',
  },
  amber: {
    solid: 'bg-amber-600 text-white',
    soft: 'bg-amber-100 dark:bg-amber-900/40',
    softText: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    icon: 'text-amber-700 dark:text-amber-400',
    bar: 'bg-amber-500',
  },
  sky: {
    solid: 'bg-sky-700 text-white',
    soft: 'bg-sky-100 dark:bg-sky-900/40',
    softText: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
    icon: 'text-sky-700 dark:text-sky-400',
    bar: 'bg-sky-600',
  },
  violet: {
    solid: 'bg-violet-700 text-white',
    soft: 'bg-violet-100 dark:bg-violet-900/40',
    softText: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
    icon: 'text-violet-700 dark:text-violet-400',
    bar: 'bg-violet-600',
  },
  rose: {
    solid: 'bg-rose-700 text-white',
    soft: 'bg-rose-100 dark:bg-rose-900/40',
    softText: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
    icon: 'text-rose-700 dark:text-rose-400',
    bar: 'bg-rose-600',
  },
  slate: {
    solid: 'bg-slate-700 text-white',
    soft: 'bg-slate-100 dark:bg-slate-800/60',
    softText: 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300',
    icon: 'text-slate-700 dark:text-slate-300',
    bar: 'bg-slate-600',
  },
  teal: {
    solid: 'bg-teal-700 text-white',
    soft: 'bg-teal-100 dark:bg-teal-900/40',
    softText: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
    icon: 'text-teal-700 dark:text-teal-400',
    bar: 'bg-teal-600',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// En-tête de page
// ─────────────────────────────────────────────────────────────────────────────

export interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  badge?: string;
  subtitle?: React.ReactNode;
  accent?: Accent;
  /** Actions affichées à droite (boutons). Le breadcrumb est affiché si absent. */
  actions?: React.ReactNode;
}

export function PageHeader({
  icon: Icon,
  title,
  badge,
  subtitle,
  accent = 'indigo',
  actions,
}: PageHeaderProps) {
  const a = ACCENTS[accent];
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={cn(
            'flex items-center justify-center size-12 rounded-md shadow-sm shrink-0',
            a.solid
          )}
        >
          <Icon className="size-6" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight truncate">{title}</h1>
            {badge && (
              <Badge
                variant="outline"
                className={cn('text-[10px] h-5 px-2 border-0 font-semibold', a.softText)}
              >
                {badge}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
            {subtitle ?? (
              <>
                <CalendarDays className="h-3 w-3" />
                <span>{format(new Date(), "EEEE d MMMM yyyy 'à' HH'h'mm", { locale: fr })}</span>
              </>
            )}
          </p>
        </div>
      </div>
      {actions ? (
        <div className="flex items-center gap-2 flex-wrap">{actions}</div>
      ) : (
        <PageBreadcrumb className="hidden lg:flex" />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Squelette de chargement (page formulaire)
// ─────────────────────────────────────────────────────────────────────────────

export function FormPageSkeleton() {
  return (
    <div className="space-y-5 p-4 md:p-1 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-md" />
          <div>
            <Skeleton className="h-6 w-48 mb-1" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-100 w-full rounded-md" />
        <Skeleton className="h-150 w-full rounded-md lg:col-span-2" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// En-tête de section de formulaire
// ─────────────────────────────────────────────────────────────────────────────

export interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  accent?: Accent;
}

export function SectionHeader({ icon: Icon, title, description, accent = 'indigo' }: SectionHeaderProps) {
  const a = ACCENTS[accent];
  return (
    <div className="flex items-start gap-2.5 mb-4">
      <div
        className={cn(
          'flex items-center justify-center h-7 w-7 rounded-lg shrink-0 mt-0.5',
          a.soft
        )}
      >
        <Icon className={cn('h-3.5 w-3.5', a.icon)} />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Jauge de complétion
// ─────────────────────────────────────────────────────────────────────────────

export function CompletionGauge({
  filled,
  total,
  label = 'Complétion',
  accent = 'indigo',
}: {
  filled: number;
  total: number;
  label?: string;
  accent?: Accent;
}) {
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
  const color =
    pct === 100
      ? 'bg-green-500'
      : pct >= 60
        ? ACCENTS[accent].bar
        : pct >= 30
          ? 'bg-amber-500'
          : 'bg-gray-300 dark:bg-gray-600';
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className={cn('font-semibold', pct === 100 ? 'text-green-600' : 'text-foreground')}>
          {pct}%
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full transition-colors', color)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground">
        {filled} champ{filled > 1 ? 's' : ''} renseigné{filled > 1 ? 's' : ''} sur {total}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Ligne d'information
// ─────────────────────────────────────────────────────────────────────────────

export function InfoRow({
  icon: Icon,
  value,
  placeholder,
  accent = 'indigo',
}: {
  icon: LucideIcon;
  value?: React.ReactNode;
  placeholder: string;
  accent?: Accent;
}) {
  const isEmpty = value === undefined || value === null || value === '';
  return (
    <div className="flex items-center gap-2.5 py-1.5 border-b border-dashed border-border/60 last:border-0">
      <Icon
        className={cn(
          'h-3.5 w-3.5 shrink-0',
          isEmpty ? 'text-muted-foreground/40' : ACCENTS[accent].icon
        )}
      />
      <span
        className={cn(
          'text-xs truncate leading-relaxed',
          isEmpty ? 'text-muted-foreground/50 italic' : 'text-foreground'
        )}
      >
        {isEmpty ? placeholder : value}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Checklist des champs requis
// ─────────────────────────────────────────────────────────────────────────────

export function RequiredChecklist({ items }: { items: Array<{ label: string; filled: boolean }> }) {
  return (
    <div className="space-y-1 pt-1 border-t border-border/50">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">
        Champs requis
      </p>
      {items.map(({ label, filled }) => (
        <div key={label} className="flex items-center gap-2 text-xs">
          {filled ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
          ) : (
            <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
          )}
          <span className={cn(filled ? 'text-foreground' : 'text-muted-foreground/60')}>{label}</span>
        </div>
      ))}
    </div>
  );
}

/** Vrai si une valeur de formulaire est renseignée. */
export function isFilled(value: unknown): boolean {
  return value !== undefined && value !== null && value !== '' && !Number.isNaN(value);
}

/** Message d'erreur lisible depuis une erreur IPC (« Error invoking remote method ... »). */
export function errorMessage(err: unknown, fallback = 'Une erreur inattendue est survenue.'): string {
  const raw = err instanceof Error ? err.message : typeof err === 'string' ? err : '';
  if (!raw) return fallback;
  return raw.replace(/^Error invoking remote method '[^']+': (Error: )?/, '').trim() || fallback;
}
