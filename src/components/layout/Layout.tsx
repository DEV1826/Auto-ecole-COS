/**
 * @module layout/Layout
 * @description Layout public flexible avec Header et Footer optionnels.
 * Utilise SidebarInset pour rester compatible avec l'infrastructure de sidebar.
 */

import { Outlet } from 'react-router-dom';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { SidebarInset } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { ScrollToTopButton } from '@/components/common/ScrollToTopButton';
import type { FooterProps } from '@/components/footer';
import { GridShape } from './GridShape';

export interface LayoutProps {
  /** Afficher le header (défaut: true) */
  showHeader?: boolean;
  /** Afficher le footer (défaut: true) */
  showFooter?: boolean;
  /** Variante du footer (défaut: 'default') */
  footerVariant?: FooterProps['variant'];
  /** Classes additionnelles pour le conteneur principal */
  className?: string;
}

/**
 * Layout public réutilisable.
 * - `showHeader` : masque/affiche le Header en mode landing.
 * - `showFooter` : masque/affiche le Footer (par défaut variante 'default').
 * - `footerVariant` : permet de passer une variante spécifique au Footer (ex: 'form').
 *
 * @example
 * ```tsx
 * // Landing page classique
 * <Route element={<Layout />}>
 *   <Route path="/" element={<HomePage />} />
 * </Route>
 *
 * // Page de succès sans header (juste le contenu)
 * <Route element={<Layout showHeader={false} />}>
 *   <Route path="/success" element={<SuccessPage />} />
 * </Route>
 *
 * // Page de maintenance avec footer minimal
 * <Route element={<Layout footerVariant="form" />}>
 *   <Route path="/maintenance" element={<MaintenancePage />} />
 * </Route>
 * ```
 */
export function Layout({
  showHeader = true,
  showFooter = true,
  footerVariant = 'default',
  className,
}: LayoutProps) {
  return (
    <div className="flex min-h-svh flex-col   bg-blue-50/70  dark:bg-red-50/5 no-scrollbar!">
      {/* Arrière‑plan décoratif */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <GridShape position="top-right" className="z-1" />
        <GridShape position="bottom-left" className="z-1 dark:opacity-50" />
      </div>
      {showHeader && <Header variant="landing" />}
      <SidebarInset
        className={cn(
          'relative flex w-full flex-1 bg-blue-50/70  dark:bg-blue-50/5 flex-col',
          className
        )}
      >
        <Outlet />
      </SidebarInset>
      {showFooter && <Footer variant={footerVariant} />}
      <ScrollToTopButton />
    </div>
  );
}
