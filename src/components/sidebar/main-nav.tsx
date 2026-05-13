'use client';

/**
 * @module sidebar/MainNav
 * @description
 * Composant de navigation principale pour la sidebar de l'application  Auto-École COS.
 * Supporte les sous‑menus déroulants (via Collapsible) et s'adapte à la taille
 * de la sidebar (collapsed/expanded).
 *
 * L'élément actif (lien correspondant à l'URL courante) est mis en évidence
 * avec un fond `bg-blue-800` et une ombre (`shadow-sm`).
 *
 * @author Stive Junior
 * @version 2.0.0
 *
 * @example
 * ```tsx
 * <MainNav items={MAIN_NAV_ITEMS[role]} title="Menu principal" size="lg" />
 * ```
 */

import { ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { NavItem } from './constants';
import React from 'react';

export interface MainNavProps {
  /** Liste des éléments de navigation (peuvent contenir des sous-éléments) */
  items: NavItem[];
  /** Titre affiché au‑dessus du groupe (optionnel) */
  title?: string;
  /** Taille des boutons : 'sm' | 'default' | 'lg' (défaut : 'lg') */
  size?: 'sm' | 'default' | 'lg';
  /** Classes CSS additionnelles */
  className?: string;
}

/**
 * Tailles personnalisées pour les boutons principaux et les sous-menus.
 */
const sizeClasses = {
  sm: {
    button: 'h-7 text-xs',
    icon: 'size-3.5',
    subButton: 'h-7 text-xs',
    subIcon: 'size-3',
  },
  default: {
    button: 'h-9 text-sm',
    icon: 'size-4',
    subButton: 'h-8 text-xs',
    subIcon: 'size-3.5',
  },
  lg: {
    button: 'h-10 text-base',
    icon: 'size-5',
    subButton: 'h-9 text-sm',
    subIcon: 'size-4',
  },
};

/**
 * Classe CSS pour le bouton actif (fond émeraude + ombre pour mettre en évidence)
 */
const activeButtonClass =
  'bg-blue-700! text-white shadow-md hover:bg-blue-900 dark:bg-blue-700 dark:hover:bg-blue-800';

/**
 * Navigation principale avec support des sous‑menus.
 */
export function MainNav({ items, title, size = 'lg', className }: MainNavProps) {
  const location = useLocation();
  const { open: sidebarOpen, setOpen: setSidebarOpen } = useSidebar();

  const [openMenus, setOpenMenus] = React.useState<Set<string>>(() => {
    const initial = new Set<string>();
    items.forEach((item, index) => {
      if (item.items?.some((sub) => location.pathname === sub.url)) {
        initial.add(String(index));
      }
    });
    return initial;
  });

  const isActive = (url?: string) => (url ? location.pathname === url : false);

  const styles = sizeClasses[size];

  const handleParentClick = (index: number, e: React.MouseEvent) => {
    // Si la sidebar est fermée, on l'ouvre d'abord puis on ouvre le sous‑menu
    if (!sidebarOpen) {
      e.preventDefault();
      setSidebarOpen(true);
      setOpenMenus((prev) => {
        const next = new Set(prev);
        next.add(String(index)); // toujours ouvrir après ouverture
        return next;
      });
    }
    // Si la sidebar est déjà ouverte, le CollapsibleTrigger gère le toggle normalement
  };

  const handleToggleMenu = (index: number) => {
    setOpenMenus((prev) => {
      const next = new Set(prev);
      if (next.has(String(index))) {
        next.delete(String(index));
      } else {
        next.add(String(index));
      }
      return next;
    });
  };

  return (
    <SidebarGroup className={cn(className)}>
      {title && (
        <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider px-3 py-1 text-blue-700 dark:text-blue-400">
          {title}
        </SidebarGroupLabel>
      )}
      <SidebarMenu className="flex flex-col gap-1">
        {items.map((item, index) => {
          const hasSubItems = item.items && item.items.length > 0;
          const active = isActive(item.url);
          const isMenuOpen = openMenus.has(String(index));

          if (hasSubItems) {
            return (
              <Collapsible
                key={item.title}
                open={isMenuOpen}
                onOpenChange={() => handleToggleMenu(index)}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={active}
                      onClick={(e) => handleParentClick(index, e)}
                      className={cn(
                        styles.button,
                        'w-full justify-start items-center gap-2.5 px-3 py-0 transition-all duration-200',
                        active && activeButtonClass
                      )}
                    >
                      <item.icon className={cn(styles.icon, 'shrink-0', active && 'text-white')} />
                      <span
                        className={cn(
                          'flex-1 text-left truncate',
                          active && 'border-white/30 text-white'
                        )}
                      >
                        {item.title}
                      </span>
                      {item.badge && (
                        <Badge
                          variant={active ? 'outline' : 'secondary'}
                          className={cn(
                            'ml-auto text-[10px] h-5',
                            active && 'border-white/30 text-white'
                          )}
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <SidebarMenuAction
                    onClick={() => handleToggleMenu(index)}
                    className="data-[state=open]:rotate-90"
                  >
                    <ChevronRight className="size-3.5" />
                    <span className="sr-only">Afficher/cacher</span>
                  </SidebarMenuAction>
                  <CollapsibleContent>
                    <SidebarMenuSub className="mt-1 space-y-0.5 ml-2 border-l border-border/50 pl-2">
                      {item.items!.map((subItem) => {
                        const subActive = isActive(subItem.url);
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={subActive}
                              className={cn(
                                styles.subButton,
                                'w-full justify-start gap-2.5 px-3',
                                subActive && activeButtonClass
                              )}
                            >
                              <Link to={subItem.url}>
                                <subItem.icon
                                  className={cn(
                                    styles.subIcon,
                                    'shrink-0',
                                    subActive && 'text-white!'
                                  )}
                                />
                                <span
                                  className={cn(
                                    'flex-1 text-left truncate',
                                    subActive && 'border-white/30 text-white'
                                  )}
                                >
                                  {subItem.title}
                                </span>
                                {subItem.badge && (
                                  <Badge
                                    variant={subActive ? 'outline' : 'secondary'}
                                    className={cn(
                                      'ml-auto text-[10px] h-5',
                                      subActive && 'border-white/30 text-white'
                                    )}
                                  >
                                    {subItem.badge}
                                  </Badge>
                                )}
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          }

          // Élément simple
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={active}
                className={cn(
                  styles.button,
                  'w-full justify-start gap-2.5 rounded-md px-3 py-0 transition-all duration-200',
                  active && activeButtonClass
                )}
              >
                <Link to={item.url!}>
                  <item.icon className={cn(styles.icon, 'shrink-0', active && 'text-white')} />
                  <span
                    className={cn(
                      'flex-1 text-left truncate',
                      active && 'border-white/30 text-white'
                    )}
                  >
                    {item.title}
                  </span>
                  {item.badge && (
                    <Badge
                      variant={active ? 'outline' : 'secondary'}
                      className={cn(
                        'ml-auto text-[10px] h-5',
                        active && 'border-white/30 text-white'
                      )}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
