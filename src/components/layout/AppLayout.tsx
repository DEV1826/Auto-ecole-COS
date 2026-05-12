/**
 * @module layout/AppLayout
 * @description Layout principal pour les pages authentifiées (avec sidebar et header)
 */

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/sidebar/app-sidebar';
import { Header } from '@/components/header';
import { Outlet } from 'react-router-dom';
import { cn } from '@/lib';

/**
 * Layout principal de l'application après authentification.
 * Intègre la sidebar (autonome), le header (variante 'app') et la zone de contenu.
 *
 * @example
 * ```tsx
 * <Route element={<AppLayout />}>
 *   <Route path="/dashboard" element={<Dashboard />} />
 * </Route>
 * ```
 */
export function AppLayout() {
  return (
    <>
      <SidebarProvider
        style={
          {
            '--sidebar-width': 'calc(var(--spacing) * 72)',
            '--header-height': 'calc(var(--spacing) * 12)',
          } as React.CSSProperties
        }
        className={cn('bg-[#FFFFFFCC]  dark:bg-blue-50/5')}
      >
        <AppSidebar variant="inset" />
        <SidebarInset className=" no-scrollbar! flex min-h-0 flex-1 flex-col overflow-hidden  border bg-clip-padding has-data-[slot=rtl-components]:overflow-visible has-data-[slot=rtl-components]:border-0 has-data-[slot=rtl-components]:bg-transparent md:flex-1 xl:rounded-xl">
          <Header variant="app" className="bg-blue-50/70  dark:bg-blue-50/5" />
          <div className="flex flex-1 flex-col gap-4 p-4 md:p-4 overflow-x-auto no-scrollbar! bg-blue-50/70  dark:bg-blue-50/5">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
