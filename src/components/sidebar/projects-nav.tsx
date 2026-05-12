'use client';

/**
 * @module sidebar/ProjectsNav
 * @description
 * Composant affichant une liste de projets / catégories dans la sidebar.
 * Utilisé pour les raccourcis rapides (calendrier, téléconsultations, etc.).
 * L'élément actif est mis en évidence avec un fond `bg-blue-800` et une ombre.
 *
 * @author Stive Junior
 * @version 2.0.0
 *
 * @example
 * ```tsx
 * <ProjectsNav projects={DOCTOR_PROJECTS} title="Mon activité" size="lg" />
 * ```
 */

import { Link, useLocation } from 'react-router-dom';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import type { ProjectItem } from './constants';

export interface ProjectsNavProps {
  /** Liste des projets à afficher */
  projects: ProjectItem[];
  /** Titre du groupe (optionnel) */
  title?: string;
  /** Taille des boutons : 'sm' | 'default' | 'lg' (défaut : 'lg') */
  size?: 'sm' | 'default' | 'lg';
  /** Classes CSS additionnelles */
  className?: string;
}

/**
 * Classes CSS par taille.
 */
const sizeClasses = {
  sm: {
    button: 'h-8 text-xs',
    icon: 'size-3.5',
  },
  default: {
    button: 'h-9 text-sm',
    icon: 'size-4',
  },
  lg: {
    button: 'h-10 text-base',
    icon: 'size-5',
  },
};

/**
 * Classe CSS pour le bouton actif (fond émeraude + ombre)
 */
const activeButtonClass =
  'bg-blue-700! text-white shadow-md hover:bg-blue-900 dark:bg-blue-700 dark:hover:bg-blue-800';

/**
 * Composant de navigation projets.
 */
export function ProjectsNav({ projects, title, size = 'lg', className }: ProjectsNavProps) {
  const location = useLocation();
  const styles = sizeClasses[size];

  return (
    <SidebarGroup className={cn('group-data-[collapsible=icon]:hidden', className)}>
      {title && (
        <SidebarGroupLabel className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-700/70 dark:text-blue-400/70">
          {title}
        </SidebarGroupLabel>
      )}
      <SidebarMenu className="flex flex-col gap-1">
        {projects.map((project) => {
          const isActive = location.pathname === project.url;

          // Déterminer si c'est un lien ou une action
          const isAction = !!project.onClick;

          return (
            <SidebarMenuItem key={project.name}>
              <SidebarMenuButton
                asChild={true}
                isActive={isActive}
                tooltip={project.name}
                className={cn(
                  styles.button,
                  'w-full justify-start gap-2.5 px-3 transition-all duration-200',
                  isActive && activeButtonClass,
                  project.className
                )}
              >
                {isAction ? (
                  // Rendu pour un bouton avec onClick
                  <button
                    type="button"
                    onClick={project.onClick}
                    className="flex w-full items-center gap-2.5"
                  >
                    <project.icon className={cn(styles.icon, isActive && 'text-white')} />
                    <span className="truncate flex-1 text-left">{project.name}</span>
                  </button>
                ) : (
                  // Rendu pour un lien de navigation
                  <Link to={project.url} className="flex w-full items-center gap-2.5">
                    <project.icon className={cn(styles.icon, isActive && 'text-white')} />
                    <span
                      className={cn(
                        'truncate flex-1',
                        isActive && 'font-medium border-white/30 text-white'
                      )}
                    >
                      {project.name}
                    </span>
                  </Link>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
