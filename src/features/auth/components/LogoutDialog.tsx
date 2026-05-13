'use client';

/**
 * @module features/auth/components/LogoutDialog
 * @description Dialogue de confirmation de déconnexion avec design émeraude.
 *
 * ## Utilisation
 * ```tsx
 * <LogoutDialog
 *   open={showDialog}
 *   onOpenChange={setShowDialog}
 *   onConfirm={() => navigate('/auth/logout')}
 * />
 * ```
 *
 * @author Stive Junior
 * @version 1.0.0
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { LogOut } from 'lucide-react';

export interface LogoutDialogProps {
  /** Contrôle l'ouverture du dialogue */
  open: boolean;
  /** Callback pour modifier l'état d'ouverture */
  onOpenChange: (open: boolean) => void;
  /** Action à exécuter lorsque l'utilisateur confirme la déconnexion */
  onConfirm: () => void;
  /** Classes additionnelles */
  className?: string;
}

/**
 * Dialogue de confirmation pour la déconnexion.
 *
 * Affiche un message demandant à l'utilisateur s'il souhaite vraiment se
 * déconnecter, avec des boutons "Annuler" et "Oui, me déconnecter".
 */
export function LogoutDialog({ open, onOpenChange, onConfirm, className }: LogoutDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={cn('max-w-95  text-center!', className)}>
        <AlertDialogHeader className={cn('space-y-2 text-center! flex flex-col items-center')}>
          <AlertDialogTitle className="text-2xl font-bold text-foreground text-center!">
            Déconnexion
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base text-muted-foreground">
            Souhaitez-vous vraiment quitter votre session ?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel
            className={cn(
              'rounded-md h-10 text-base font-semibold',
              'bg-transparent border border-input'
            )}
          >
            Rester connecté
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(
              'rounded-md h-10 text-base font-semibold text-white',
              'bg-red-700 hover:bg-red-800'
            )}
          >
            <LogOut className="size-4" />
            Oui, me déconnecter
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
