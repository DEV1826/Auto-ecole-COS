/**
 * @module layout/components/GridShape
 * @description Composant décoratif affichant des grilles SVG en arrière‑plan.
 */

import { cn } from '@/lib/utils';

export interface GridShapeProps {
  /** Classes additionnelles */
  className?: string;
  /** Position : 'top-right' (défaut), 'bottom-left', 'top-left' ou 'bottom-right' */
  position?: 'top-right' | 'bottom-left' | 'top-left' | 'bottom-right';
  /**Model */
  model?: number;
}

/**
 * Affiche une grille décorative SVG dans le coin spécifié.
 *
 * @example
 * ```tsx
 * <GridShape position="top-right" />
 * <GridShape position="bottom-left" />
 * ```
 */
export function GridShape({ className, model = 1, position = 'top-right' }: GridShapeProps) {
  const positionClasses = {
    'top-right': 'right-0 top-0',
    'bottom-left': 'bottom-0 left-0 rotate-180',
    'top-left': 'left-0 top-0 -rotate-90',
    'bottom-right': 'bottom-0 right-0 rotate-90',
  };

  return (
    <div
      className={cn(
        'pointer-events-none absolute -z-10 w-full max-w-62.5 xl:max-w-112.5',
        positionClasses[position],
        className
      )}
    >
      <img src={`/images/shape/grid-0${model}.svg`} alt="" className="w-full " />
    </div>
  );
}
