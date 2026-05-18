// src/features/dashboard/components/common/EmptyState.tsx

/**
 * @module dashboard/components/common/EmptyState
 * @description
 * Composant d'état vide entièrement personnalisable, adapté au thème émeraude de  Auto-École COS.
 *
 * Il peut afficher une icône, une illustration personnalisée, un titre, une description,
 * un bouton d'action principal, et du contenu supplémentaire.
 *
 * ## Variantes de bordure
 * - `dashed` : bordure pointillée (par défaut, légèrement émeraude)
 * - `solid`  : bordure pleine (émeraude subtile)
 * - `none`   : pas de bordure, fond transparent, sans ombre
 *
 * ## Tailles
 * - `sm`, `md` (défaut), `lg`, `xl` – ajuste les dimensions de l'icône et le padding.
 *
 * ## Thème
 * - Couleur primaire : émeraude (emerald-600 / emerald-700)
 * - Fonds : `bg-card` avec légères variations selon la variante.
 *
 * @author Stive Junior
 * @version 3.0.0
 *
 * @example
 * ```tsx
 * // Utilisation basique
 * <EmptyState
 *   title="Aucun rendez-vous"
 *   description="Vous n'avez aucun rendez-vous programmé."
 *   icon={Calendar}
 *   action={{
 *     label: "Prendre rendez-vous",
 *     onClick: () => navigate("/appointments/create"),
 *   }}
 * />
 *
 * // Avec illustration personnalisée
 * <EmptyState
 *   title="Aucune donnée"
 *   illustration="/images/empty-data.svg"
 *   variant="solid"
 *   size="lg"
 * />
 * ```
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type EmptyStateVariant = 'dashed' | 'solid' | 'none';
export type EmptyStateSize = 'sm' | 'md' | 'lg' | 'xl';

export interface EmptyStateAction {
  /** Texte du bouton */
  label: string;
  /** Fonction de clic */
  onClick: () => void;
  /** Variante du bouton (défaut: 'default' – émeraude) */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  /** Icône optionnelle (Lucide) */
  icon?: LucideIcon;
  /** Désactiver le bouton */
  disabled?: boolean;
  /** Classes spécifiques au bouton */
  className?: string;
}

export interface EmptyStateProps {
  /** Titre principal (obligatoire) */
  title: string;
  /** Description optionnelle */
  description?: string;
  /** Icône Lucide (affichée avant l'illustration) */
  icon?: LucideIcon;
  /** URL d'une image personnalisée (remplace l'icône) */
  illustration?: string;
  /** Action principale sous forme de bouton */
  action?: EmptyStateAction;
  /** Variante de bordure (défaut: 'dashed') */
  variant?: EmptyStateVariant;
  /** Taille du composant (défaut: 'md') */
  size?: EmptyStateSize;
  /** Contenu personnalisé (remplace description et action) */
  children?: React.ReactNode;
  /** Classes additionnelles */
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles internes (selon taille et variante)
// ─────────────────────────────────────────────────────────────────────────────

const sizePadding: Record<EmptyStateSize, string> = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-10',
};

const variantClasses: Record<EmptyStateVariant, string> = {
  dashed: 'border-dashed border-2 border-blue-200 dark:border-blue-800/50',
  solid: 'border border-solid border-blue-100 dark:border-blue-900/30',
  none: 'border-0 ring-0 shadow-none bg-transparent',
};

const iconSize: Record<EmptyStateSize, string> = {
  sm: 'h-12 w-12',
  md: 'h-16 w-16',
  lg: 'h-20 w-20',
  xl: 'h-24 w-24',
};

const illustrationHeight: Record<EmptyStateSize, string> = {
  sm: 'h-24',
  md: 'h-32',
  lg: 'h-40',
  xl: 'h-48',
};

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Affiche un état vide élégant avec un design émeraude cohérent avec  Auto-École COS.
 *
 * @param props - Les propriétés du composant
 * @returns Un élément JSX représentant l'état vide
 */
export function EmptyState({
  title,
  description,
  icon: Icon,
  illustration,
  action,
  variant = 'dashed',
  size = 'md',
  children,
  className,
}: EmptyStateProps): React.JSX.Element {
  const renderVisual = () => {
    if (Icon) {
      return (
        <div
          className={cn(
            'mx-auto rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center',
            iconSize[size]
          )}
        >
          <Icon className="h-2/3 w-2/3 text-blue-600 dark:text-blue-400" />
        </div>
      );
    }
    if (illustration) {
      return (
        <img
          src={illustration}
          alt="Illustration"
          className={cn('mx-auto object-contain', illustrationHeight[size])}
        />
      );
    }
    return null;
  };

  return (
    <Card
      className={cn(
        'text-center bg-card shadow-sm  transition-all justify-center h-full',
        variantClasses[variant],
        sizePadding[size],
        className
      )}
    >
      <CardHeader className="pb-2 space-y-3">
        {renderVisual()}
        <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
        {description && !children && (
          <CardDescription className="text-sm text-muted-foreground">{description}</CardDescription>
        )}
      </CardHeader>

      {(action || children) && (
        <CardContent className="pt-2">
          {children ? (
            <div className="flex flex-col items-center gap-3">{children}</div>
          ) : (
            action && (
              <Button
                onClick={action.onClick}
                variant={action.variant || 'default'}
                disabled={action.disabled}
                className={cn(
                  'gap-2 bg-blue-600 hover:bg-blue-700 text-white h-10',
                  action.variant === 'outline' &&
                  'border-blue-200 text-blue-700 hover:bg-blue-50',
                  action.variant === 'ghost' && 'text-blue-600 hover:bg-blue-50',
                  action.className
                )}
              >
                {action.icon && <action.icon className="h-4 w-4" />}
                {action.label}
              </Button>
            )
          )}
        </CardContent>
      )}
    </Card>
  );
}
