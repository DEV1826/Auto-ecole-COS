'use client';

/**
 * @module features/profile/components/ProfileSectionCard
 * @description
 * Carte de section de profil sans bordure, avec bouton d'édition permanent,
 * icône personnalisable et design épuré.
 *
 * ## Fonctionnalités
 * - Bouton d'édition toujours visible (crayon) — pas de comportement au survol
 * - Support de Dialog (desktop) et Drawer (mobile) pour l'édition
 * - Slots pour titre, description, icône (avec fond et taille personnalisables),
 *   contenu (lecture seule) et formulaire d'édition
 * - Design moderne sans bordure, avec ombre subtile au survol
 * - Intégration native avec le composant `EditableField`
 * - Accessibilité complète (aria-labels, focus management)
 * - Gestion d'état de chargement (skeleton)
 * - Callbacks d'ouverture/fermeture du modal
 *
 * @see {@link EditableField} pour l'affichage de champs avec icône et crayon
 * @author Stive Junior
 * @version 2.0.0
 *
 * @example
 * ```tsx
 * // Utilisation simple
 * <ProfileSectionCard
 *   title="Informations personnelles"
 *   description="Nom, email et téléphone"
 *   icon={<User className="h-5 w-5" />}
 *   iconBg="bg-emerald-500"
 *   iconSize="lg"
 *   editTitle="Modifier mes informations"
 *   editContent={<PersonalInfoForm />}
 * >
 *   <div className="space-y-2">...</div>
 * </ProfileSectionCard>
 * ```
 */

import * as React from 'react';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';

// ─────────────────────────────────────────────────────────────────────────────
// Types publics
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Taille de l'icône dans l'en-tête.
 */
export type IconSize = 'sm' | 'default' | 'lg' | 'xl';

/**
 * Mapping des tailles d'icônes vers les classes Tailwind.
 */
const iconSizeClasses: Record<IconSize, string> = {
  sm: 'h-8 w-8 rounded-lg',
  default: 'h-10 w-10 rounded-xl',
  lg: 'h-12 w-12 rounded-2xl',
  xl: 'h-14 w-14 rounded-2xl',
};

/**
 * Props du composant ProfileSectionCard.
 */
export interface ProfileSectionCardProps {
  /** Titre de la section (affiché dans l'en-tête de la carte) */
  title?: string;

  /** Description courte de la section (sous-titre) */
  description?: string;

  /** Icône affichée à gauche du titre (composant Lucide ou SVG) */
  icon?: React.ReactNode;

  /**
   * Classe Tailwind de la couleur de l'icône.
   * @default "text-primary"
   */
  iconColor?: string;

  /**
   * Taille de l'icône.
   * @default "default"
   */
  iconSize?: IconSize;

  /** Titre du dialogue / tiroir d'édition (par défaut : "Modifier — {title}") */
  editTitle?: string;

  /** Description du dialogue / tiroir d'édition */
  editDescription?: string;

  /** Contenu du formulaire d'édition (affiché dans le modal) */
  editContent?: React.ReactNode;

  /** Libellé du bouton d'édition (aria-label, par défaut : "Modifier {title}") */
  editButtonLabel?: string;

  /** Désactive complètement l'édition (cache le bouton et le modal) */
  editable?: boolean;

  rowInfo?: boolean;

  /** Contenu affiché en lecture seule dans la carte */
  children: React.ReactNode;

  /** Classes CSS additionnelles pour la carte */
  className?: string;

  /** Affiche un squelette de chargement */
  isLoading?: boolean;

  /** Callback exécuté à l'ouverture du modal d'édition */
  onEditOpen?: () => void;

  /** Callback exécuté à la fermeture du modal d'édition */
  onEditClose?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Carte de section de profil sans bordure, avec bouton d'édition permanent.
 *
 * ## Détails d'implémentation
 * - Le bouton d'édition (crayon) est **toujours visible** en haut à droite.
 * - Sur mobile, l'édition s'ouvre dans un tiroir (Drawer).
 * - Sur desktop, un modal Dialog est utilisé.
 * - La carte n'a pas de bordure (border-0) mais une ombre légère et un fond.
 * - L'icône peut être personnalisée en taille, couleur de fond et couleur.
 *
 * @param props - Les propriétés du composant
 * @returns Élément JSX de la carte de section
 */
export function ProfileSectionCard({
  title,
  description,
  icon,
  iconColor = 'text-primary',
  iconSize = 'lg',
  editTitle,
  editDescription,
  editContent,
  editButtonLabel,
  editable = true,
  rowInfo = false,
  children,
  className,
  isLoading = false,
  onEditOpen,
  onEditClose,
}: ProfileSectionCardProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  const isMobile = useIsMobile();

  const handleOpen = () => {
    if (!editable) return;
    setOpen(true);
    onEditOpen?.();
  };

  const handleClose = () => {
    setOpen(false);
    onEditClose?.();
  };

  // ── Squelette de chargement ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <Card className={cn('relative overflow-hidden border-0 shadow-sm', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Skeleton className={cn('shrink-0', iconSizeClasses[iconSize])} />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }

  // ── Dialogue / Drawer d'édition ─────────────────────────────────────────
  const modal = isMobile ? (
    <Drawer open={open} onOpenChange={(o) => (o ? handleOpen() : handleClose())}>
      <DrawerContent>
        <DrawerHeader className="text-left px-6 pt-6">
          <DrawerTitle>{editTitle ?? `Modifier — ${title}`}</DrawerTitle>
          {editDescription ||
            (description && (
              <DrawerDescription>{editDescription || description}</DrawerDescription>
            ))}
        </DrawerHeader>
        <ScrollArea className="max-h-[75vh] overflow-y-auto">
          <div className="px-6 pb-8">{editContent}</div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  ) : (
    <Dialog open={open} onOpenChange={(o) => (o ? handleOpen() : handleClose())}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {icon}
            {editTitle ?? `Modifier — ${title}`}
          </DialogTitle>
          {editDescription && <DialogDescription>{editDescription}</DialogDescription>}
        </DialogHeader>
        <div className="mt-2">{editContent}</div>
      </DialogContent>
    </Dialog>
  );

  if (rowInfo) {
    return (
      <div className="relative group/section">
        {/* Bouton d'édition de la section (si editable) */}
        {editable && editContent && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleOpen}
            aria-label={editButtonLabel ?? `Modifier — ${title}`}
            className="absolute top-0 right-0 h-8 w-8 z-10 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
        {/* Contenu cliquable (ouvre le modal de la section) */}
        <div onClick={handleOpen} className="cursor-pointer">
          {children}
        </div>
        {editable && editContent && modal}
      </div>
    );
  }
  // ── Rendu principal ──────────────────────────────────────────────────────
  return (
    <>
      <Card
        className={cn(
          'relative transition-all duration-200 border-0  py-4 ring-0',
          editable && 'group/section',
          className
        )}
      >
        {/* Bouton d'édition — TOUJOURS VISIBLE */}
        {editable && editContent && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleOpen}
            aria-label={editButtonLabel ?? `Modifier — ${title}`}
            className="absolute top-4 right-4 h-8 w-8 z-10 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}

        <CardHeader className="pb-3 pr-12">
          <div className="flex items-center gap-3">
            {icon && (
              <div
                className={cn(
                  'flex items-center justify-center shrink-0 bg-emerald-800 text-white! dark:bg-emerald-700 dark:text-emerald-400  ',
                  iconSizeClasses[iconSize],
                  iconColor
                )}
                aria-hidden="true"
              >
                {icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold">{title}</CardTitle>
              {description && (
                <CardDescription className="text-xs mt-0.5">{description}</CardDescription>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">{children}</CardContent>
      </Card>

      {editable && editContent && modal}
    </>
  );
}
