'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner, type ToasterProps } from 'sonner';
import { Loader2Icon } from 'lucide-react';

/**
 * Toaster configuré pour React.js (Vite)
 * Intègre les icônes personnalisées SVG du dossier /public
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  // Résolution du chemin pour Vite (le dossier public est à la racine /)
  const getIconPath = (
    type: 'success' | 'error' | 'maintenance',
    currentTheme: string | undefined
  ) => {
    // On gère le mode 'system' en vérifiant la préférence média si nécessaire
    const isDark =
      currentTheme === 'dark' ||
      (currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const icons = {
      success: isDark ? 'success-dark.svg' : 'success.svg',
      error: isDark ? 'error-dark.svg' : 'error.svg',
      maintenance: isDark ? 'maintenance-dark.svg' : 'maintenance.svg',
    };

    return `/images/error/${icons[type]}`;
  };

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      position="top-center"
      closeButton

      className="toaster group"
      icons={{
        success: (
          <img
            src={getIconPath('success', theme)}
            alt="Succès"
            className="size-6 shrink-0 object-contain"
          />
        ),
        error: (
          <img
            src={getIconPath('error', theme)}
            alt="Erreur"
            className="size-6 shrink-0 object-contain"
          />
        ),
        warning: (
          <img
            src={getIconPath('maintenance', theme)}
            alt="Attention"
            className="size-6 shrink-0 object-contain"
          />
        ),
        info: (
          <img
            src={getIconPath('success', theme)}
            alt="Info"
            className="size-6 shrink-0 object-contain opacity-90"
          />
        ),
        loading: <Loader2Icon className="size-5 animate-spin text-primary" />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': '2px',
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            'cn-toast group flex items-center gap-4  text-foreground border-border rounded-md shadow-2xl p-4 transition-all duration-300',
          title: 'font-bold text-[14px] tracking-tight',
          description: 'text-xs! text-muted-foreground!',

          actionButton:
            'bg-primary text-primary-foreground font-semibold rounded-md px-4 py-2 hover:opacity-90 transition-opacity',
          cancelButton:
            'bg-muted text-muted-foreground font-semibold rounded-md px-4 py-2 hover:bg-muted/80 transition-colors',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
