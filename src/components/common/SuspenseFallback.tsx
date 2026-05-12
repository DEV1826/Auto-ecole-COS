/**
 * @module common/SuspenseFallback
 * @description Composant d'affichage pendant le chargement lazy d'une page.
 */

import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

/**
 * Propriétés du composant SuspenseFallback.
 */
export interface SuspenseFallbackProps {
  /** Classes additionnelles */
  className?: string;
  /** Texte optionnel */
  message?: string;
}

/**
 * Composant de fallback pour React.lazy().
 * Affiche un spinner centré.
 *
 * @example
 * ```tsx
 * const Dashboard = lazy(() => import('@/pages/Dashboard'));
 * <Suspense fallback={<SuspenseFallback />}>
 *   <Dashboard />
 * </Suspense>
 * ```
 */
export function SuspenseFallback({ className, message = 'Chargement...' }: SuspenseFallbackProps) {
  return (
    <div className={cn('flex min-h-screen flex-col items-center justify-center gap-4', className)}>
      <Spinner className="size-6" />
    </div>
  );
}
