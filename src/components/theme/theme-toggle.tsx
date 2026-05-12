/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Laptop, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Variantes d'affichage disponibles pour le sélecteur de thème.
 * @typedef {'button' | 'switch' | 'icon-only' | 'dropdown'} ThemeToggleVariant
 */
export type ThemeToggleVariant = 'button' | 'switch' | 'icon-only' | 'dropdown';

/**
 * Tailles disponibles alignées sur le système de design.
 * @typedef {'default' | 'xs' | 'sm' | 'lg'} ThemeToggleSize
 */
export type ThemeToggleSize = 'default' | 'xs' | 'sm' | 'lg';

/**
 * Interface complète pour les propriétés du composant ThemeToggle.
 * Hérite des attributs HTML standards pour une flexibilité maximale.
 */
export interface ThemeToggleProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof toggleIconVariants> {
  /** * Le style visuel du composant.
   * @default 'button'
   */
  variant?: ThemeToggleVariant;
  /** * Si vrai, affiche un label textuel à côté de l'icône.
   * @default false
   */
  showText?: boolean;
  /** * Texte personnalisé pour le label ou le lecteur d'écran.
   * @default 'Thème'
   */
  text?: string;
  /** * Taille globale du composant (bouton et icône).
   * @default 'default'
   */
  size?: ThemeToggleSize;
  /** * Désactive les transitions CSS lors du changement.
   * @default false
   */
  disableAnimation?: boolean;
  /** * Style d'arrondi des coins.
   * @default 'default'
   */
  rounded?: 'default' | 'full' | 'xl';
  /** * Classes CSS additionnelles via Tailwind.
   */
  className?: string;
}

/**
 * Définition des animations d'icônes via CVA.
 */
const toggleIconVariants = cva('transition-all duration-500 ease-in-out', {
  variants: {
    animation: {
      rotate: 'transition-all duration-500',
      scale: 'transition-all duration-500',
      fade: 'transition-opacity duration-300',
      slide: 'transition-all duration-500',
      none: '',
    },
  },
  defaultVariants: {
    animation: 'rotate',
  },
});

/**
 * Mappage technique des tailles pour les composants Shadcn.
 */
const sizeMap: Record<ThemeToggleSize, 'default' | 'xs' | 'sm' | 'lg' | 'icon'> = {
  default: 'default',
  xs: 'xs',
  sm: 'sm',
  lg: 'lg',
};

/**
 * Mappage précis des dimensions d'icônes selon la taille du bouton.
 */
const iconSizeMap: Record<ThemeToggleSize, string> = {
  default: 'size-4',
  xs: 'size-3.5',
  sm: 'size-4',
  lg: 'size-5',
};

/**
 * Composant ThemeToggle haut de gamme.
 * Gère le changement de thème (Clair/Sombre/Système) avec des animations fluides
 * et une compatibilité totale avec le SSR via Next.js.
 * * @component
 * @example
 * <ThemeToggle variant="icon-only" size="sm" rounded="full" />
 */
export function ThemeToggle({
  variant = 'button',
  showText = true,
  text = 'Thème',
  size = 'default',
  disableAnimation = false,
  className,
  animation = 'rotate',
  rounded = 'default',
  ...props
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';
  const animationClass = disableAnimation ? 'transition-none' : toggleIconVariants({ animation });
  const iconSize = iconSizeMap[size];

  // Gestion de l'arrondi
  const roundedClass = cn(
    rounded === 'full' && 'rounded-xs',
    rounded === 'xl' && 'rounded-xl',
    rounded === 'default' && 'rounded-xs'
  );

  /**
   * Rendu du squelette pendant le chargement côté client
   */
  if (!mounted) {
    return (
      <div className={cn('flex items-center', className)} {...props}>
        <Button
          variant="outline"
          size={variant === 'icon-only' ? 'icon' : sizeMap[size]}
          disabled
          className="opacity-40 shadow-none"
        >
          <Loader2 className={cn(iconSize, 'animate-spin')} />
          {showText && variant !== 'icon-only' && <span className="ml-2">{text}</span>}
        </Button>
      </div>
    );
  }

  // ============================================================
  // VARIANTE : ICON-ONLY (Version Corrigée)
  // ============================================================
  if (variant === 'icon-only') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className={cn(
          'relative overflow-hidden hover:bg-primary/10 hover:text-primary transition-colors duration-300',
          roundedClass,
          size === 'xs' && 'size-7',
          size === 'sm' && 'size-9',
          size === 'default' && 'size-10',
          size === 'lg' && 'size-12',
          className
        )}
        title={`Passer en mode ${isDark ? 'clair' : 'sombre'}`}
        {...(props as any)}
      >
        {/* On utilise un conteneur relatif avec une taille fixe pour que les icônes absolues se centrent */}
        <div className={cn('relative flex items-center justify-center', iconSize)}>
          <Sun
            className={cn(
              'absolute inset-0 m-auto',
              iconSize,
              animationClass,
              isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
            )}
          />
          <Moon
            className={cn(
              'absolute inset-0 m-auto',
              iconSize,
              animationClass,
              isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
            )}
          />
        </div>
        <span className="sr-only">Basculer le thème</span>
      </Button>
    );
  }

  // ============================================================
  // VARIANTE : BOUTON CLASSIQUE
  // ============================================================
  if (variant === 'button') {
    return (
      <Button
        variant="outline"
        size={sizeMap[size]}
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className={cn('gap-2 border-input/50 hover:bg-accent/50', roundedClass, className)}
        {...(props as any)}
      >
        <div className={cn('relative flex items-center justify-center', iconSize)}>
          <Sun
            className={cn(
              'absolute inset-0 m-auto',
              iconSize,
              animationClass,
              isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
            )}
          />
          <Moon
            className={cn(
              'absolute inset-0 m-auto',
              iconSize,
              animationClass,
              isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
            )}
          />
        </div>
        {showText && <span className="font-medium">{text}</span>}
      </Button>
    );
  }

  // ============================================================
  // VARIANTE : SWITCH (Basculeur)
  // ============================================================
  if (variant === 'switch') {
    return (
      <div className={cn('flex items-center gap-3', className)} {...props}>
        {showText && <span className="text-sm font-medium text-muted-foreground">{text}</span>}
        <Switch
          checked={isDark}
          onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
          aria-label="Mode sombre"
          className="data-[state=checked]:bg-primary"
        />
        {!showText && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            {isDark ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // VARIANTE : DROPDOWN (Menu déroulant moderne)
  // ============================================================
  if (variant === 'dropdown') {
    const CurrentIcon = theme === 'system' ? Laptop : isDark ? Moon : Sun;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size={sizeMap[size]}
            className={cn(
              'gap-2 bg-background rounded-xs  shadow-sm hover:bg-accent transition-all',

              className
            )}
          >
            <CurrentIcon className={iconSize} />
            {showText && (
              <span className="text-md font-semibold">
                {theme === 'system' ? text : isDark ? 'Sombre' : 'Clair'}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-56 rounded-xs shadow-xl backdrop-blur-md">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
              {text}
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup value={theme || 'light'} onValueChange={setTheme}>
              <DropdownMenuRadioItem
                value="light"
                className="flex items-center gap-2 cursor-pointer rounded-xs py-2 focus:bg-primary/10 focus:text-primary transition-colors"
              >
                <Sun className="size-4" />
                <span className="flex-1">Clair</span>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem
                value="dark"
                className="flex items-center gap-2 cursor-pointer rounded-xs py-2 focus:bg-primary/10 focus:text-primary transition-colors"
              >
                <Moon className="size-4" />
                <span className="flex-1">Sombre</span>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem
                value="system"
                className="flex items-center gap-2 cursor-pointer rounded-xs py-2 focus:bg-primary/10 focus:text-primary transition-colors"
              >
                <Laptop className="size-4" />
                <span className="flex-1">Système</span>
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return null;
}
