'use client';

/**
 * @module components/forms/BooleanChoice
 * @description ⚡ Sélecteur booléen ultra-léger et compact pour des choix Oui/Non rapides.
 *
 * FEATURES:
 * - Layout horizontal (inline) : Label et boutons sur la même ligne.
 * - Design segmenté : Fond muté avec curseur de sélection discret.
 * - Micro-interactions : Feedback tactile via Framer Motion.
 * - Adaptabilité : Hauteur fixe `h-8` ou `h-9` pour une intégration fluide.
 *
 * @see {@link https://ui.shadcn.com/docs/components/button} Button ShadCN
 * @see {@link https://www.framer.com/motion/} Framer Motion
 *
 * @author Stive Junior
 * @version 1.1.0
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { Check, X, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

export interface BooleanChoiceProps {
  /** Valeur active (true = Oui, false = Non) */
  value: boolean;
  /** Callback déclenché au changement d'état */
  onChange: (value: boolean) => void;
  /** Libellé court affiché à gauche */
  label?: string;
  /** Désactiver l'interaction */
  disabled?: boolean;
  /** Classes CSS additionnelles pour le conteneur */
  className?: string;
  /** Icône optionnelle à côté du label */
  icon?: LucideIcon;
  /** Labels personnalisés (défaut: Oui/Non) */
  labels?: { yes?: string; no?: string };
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Un switch Oui/Non minimaliste qui tient sur une seule ligne.
 */
export function BooleanChoice({
  value,
  onChange,
  label,
  disabled = false,
  className,
  icon: Icon,
  labels = { yes: 'Oui', no: 'Non' },
}: BooleanChoiceProps) {
  // Identifiant unique pour l'animation de layout partagé
  const layoutId = React.useId();

  return (
    <div
      className={cn(
        'flex  justify-between flex-col gap-2 py-1 w-full',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
    >
      {/* 1. LABEL & ICONE (Section Gauche) */}
      {label && (
        <div className="flex items-center gap-2 shrink-0">
          {Icon && <Icon className="size-4 text-muted-foreground/70" />}
          <span className="text-sm font-medium leading-none tracking-tight">{label}</span>
        </div>
      )}

      {/* 2. SELECTEUR SEGMENTÉ (Section Droite) */}
      <div className="relative flex p-0.5 bg-muted/50 dark:bg-muted/20 rounded-md border border-border/40 w-30">
        {/* Bouton "NON" */}
        <button
          type="button"
          onClick={() => onChange(false)}
          className={cn(
            'relative z-10 flex-1 flex items-center justify-center gap-1.5 py-1 rounded-md text-[11px] font-bold transition-colors',
            !value ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {!value && (
            <motion.div
              layoutId={layoutId}
              className="absolute inset-0 bg-background dark:bg-muted-foreground/10 border border-border/50 shadow-sm rounded-md z-[-1]"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
            />
          )}
          <X className={cn('size-3', !value ? 'text-gray-500' : 'opacity-50')} />
          {labels.no}
        </button>

        {/* Bouton "OUI" */}
        <button
          type="button"
          onClick={() => onChange(true)}
          className={cn(
            'relative z-10 flex-1 flex items-center justify-center gap-1.5 py-1 rounded-md text-[11px] font-bold transition-colors',
            value ? 'text-white' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {value && (
            <motion.div
              layoutId={layoutId}
              className="absolute inset-0 bg-blue-800 dark:bg-blue-800 border border-blue-200/50 dark:border-blue-500/20 shadow-sm rounded-md z-[-1]"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
            />
          )}
          <Check className={cn('size-3', value ? 'text-white' : 'opacity-50')} />
          {labels.yes}
        </button>
      </div>
    </div>
  );
}
