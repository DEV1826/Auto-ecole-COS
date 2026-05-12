'use client';

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes';

/**
 * Fournisseur de thème pour l'application
 * Utilise next-themes pour gérer le thème (clair/sombre/système)
 *
 * @param {ThemeProviderProps} props - Propriétés du provider
 * @param {React.ReactNode} props.children - Composants enfants
 * @example
 * ```tsx
 * <ThemeProvider defaultTheme="dark" enableSystem>
 *   <App />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={true}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
