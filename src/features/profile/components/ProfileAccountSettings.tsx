'use client';

/**
 * @module features/profile/components/ProfileAccountSettings
 * @description
 * Section "Gestion du compte" intégrée dans une `ProfileSectionCard`.
 * Utilise `ProfileInfoRow` pour chaque action sensible, avec des dialogues de confirmation.
 * Design cohérent avec le thème émeraude et les cartes sans bordure.
 *
 * Fonctionnalités :
 * - Export des données personnelles (RGPD)
 * - Déconnexion de toutes les sessions actives
 * - Désactivation temporaire du compte (réversible via support)
 * - Suppression définitive du compte (irréversible, avec saisie du nom de confirmation)
 *
 * Chaque action est affichée sous forme de `ProfileInfoRow` avec icône, label, description,
 * et un bouton d'action (ou un badge d'état). Les actions destructives ouvrent une `AlertDialog`.
 *
 * @author Stive Junior
 * @version 3.0.0
 *
 * @example
 * ```tsx
 * <ProfileSectionCard title="Confidentialité" icon={<AlertTriangle className="h-6 w-6" />}>
 *   <ProfileAccountSettings
 *     userName={`${user.firstName} ${user.lastName}`}
 *     onExportData={handleExport}
 *     onSignOutAll={handleSignOutAll}
 *     onDeactivate={handleDeactivate}
 *     onDeleteAccount={handleDeleteAccount}
 *   />
 * </ProfileSectionCard>
 * ```
 */

import * as React from 'react';
import { Download, LogOut, UserX, Trash2, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ProfileInfoRow } from './ProfileInfoRow';

// ─────────────────────────────────────────────────────────────────────────────
// Types publics
// ─────────────────────────────────────────────────────────────────────────────

export interface ProfileAccountSettingsProps {
  /** Nom complet de l'utilisateur (utilisé pour la confirmation de suppression) */
  userName: string;
  /** Callback pour exporter les données personnelles (RGPD) */
  onExportData?: () => Promise<void>;
  /** Callback pour déconnecter l'utilisateur de tous ses appareils */
  onSignOutAll?: () => Promise<void>;
  /** Callback pour désactiver temporairement le compte (réversible) */
  onDeactivate?: () => Promise<void>;
  /** Callback pour supprimer définitivement le compte (irréversible) */
  onDeleteAccount?: () => Promise<void>;
  /** Indique si le compte est actuellement actif (pour afficher un badge) */
  isActive?: boolean;
  /** Classes additionnelles */
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Gestion avancée du compte, présentée sous forme de lignes d'information.
 * Chaque action est protégée par une confirmation explicite via AlertDialog.
 */
export function ProfileAccountSettings({
  userName,
  onExportData,
  onSignOutAll,
  onDeactivate,
  onDeleteAccount,
  isActive = true,
  className,
}: ProfileAccountSettingsProps): React.JSX.Element {
  const [confirmName, setConfirmName] = React.useState('');
  const [isExporting, setIsExporting] = React.useState(false);
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const [isDeactivating, setIsDeactivating] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const isDeleteConfirmed = confirmName.trim().toLowerCase() === userName.trim().toLowerCase();

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleExport = async () => {
    if (!onExportData) return;
    setIsExporting(true);
    try {
      await onExportData();
      toast.success('Export des données', {
        description: 'Un email contenant le lien de téléchargement vous a été envoyé.',
      });
    } catch {
      toast.error("Échec de l'export", {
        description: 'Veuillez réessayer ultérieurement ou contacter le support.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSignOutAll = async () => {
    if (!onSignOutAll) return;
    setIsSigningOut(true);
    try {
      await onSignOutAll();
      toast.success('Déconnexion globale', {
        description: 'Vous avez été déconnecté de tous vos appareils.',
      });
    } catch {
      toast.error('Erreur lors de la déconnexion', {
        description: 'Certaines sessions n’ont pas pu être fermées.',
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleDeactivate = async () => {
    if (!onDeactivate) return;
    setIsDeactivating(true);
    try {
      await onDeactivate();
      toast.success('Compte désactivé', {
        description:
          'Votre compte a été temporairement désactivé. Contactez le support pour le réactiver.',
      });
    } catch {
      toast.error('Erreur lors de la désactivation', {
        description: 'Veuillez réessayer ou contacter le support.',
      });
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleDelete = async () => {
    if (!isDeleteConfirmed || !onDeleteAccount) return;
    setIsDeleting(true);
    try {
      await onDeleteAccount();
      toast.success('Compte supprimé', {
        description: 'Toutes vos données ont été définitivement effacées.',
      });
    } catch {
      toast.error('Erreur lors de la suppression', {
        description: 'Veuillez réessayer ou contacter le support.',
      });
    } finally {
      setIsDeleting(false);
      setConfirmName('');
    }
  };

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <div className={cn('space-y-1', className)}>
      {/* Export des données */}
      {onExportData && (
        <ProfileInfoRow
          label="Exporter mes données"
          value=""
          icon={Download}
          type="action"
          actionLabel={isExporting ? 'Envoi...' : 'Exporter'}
          onAction={handleExport}
          disabled={isExporting}
          editDescription="Téléchargez l’intégralité de vos données personnelles (conformément au RGPD)."
        />
      )}

      {/* Déconnexion globale */}
      {onSignOutAll && (
        <ProfileInfoRow
          label="Déconnecter toutes les sessions"
          value=""
          icon={LogOut}
          type="action"
          actionLabel={isSigningOut ? 'Déconnexion...' : 'Déconnecter tout'}
          onAction={handleSignOutAll}
          disabled={isSigningOut}
          editDescription="Fermez votre session sur tous vos appareils connectés simultanément."
        />
      )}

      {/* Désactivation temporaire */}
      {onDeactivate && (
        <ProfileInfoRow
          label="Désactiver temporairement mon compte"
          value={!isActive}
          icon={UserX}
          type="action"
          statusBadge
          actionLabel={isDeactivating ? 'Désactivation...' : 'Désactiver'}
          onAction={handleDeactivate}
          disabled={isDeactivating}
          editDescription="Votre compte sera masqué et inaccessible. Réactivation possible via le support."
        />
      )}

      {/* Suppression définitive */}
      {onDeleteAccount && (
        <div className="group flex items-start gap-4 py-3 transition-colors rounded-lg -mx-1 px-2 hover:bg-red-50/50 dark:hover:bg-red-950/20">
          <div className="shrink-0 mt-0.5">
            <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              Supprimer définitivement mon compte
            </p>
            <p className="text-xs text-red-700/80 dark:text-red-300/80 mt-0.5">
              Action irréversible. Toutes vos données seront effacées.
            </p>
            <Badge
              variant="outline"
              className="mt-1.5 text-[10px] border-red-300 text-red-600 dark:border-red-700 dark:text-red-400"
            >
              Irréversible
            </Badge>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="shrink-0">
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Supprimer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                  <Trash2 className="h-5 w-5" />
                  Supprimer définitivement votre compte ?
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  <p>
                    Cette action est <strong>irréversible</strong>. Toutes vos données personnelles
                    et médicales seront supprimées des serveurs VitaCare.
                  </p>
                  <p>
                    Pour confirmer, saisissez votre nom complet :{' '}
                    <strong className="font-mono">{userName}</strong>
                  </p>
                  <Input
                    value={confirmName}
                    onChange={(e) => setConfirmName(e.target.value)}
                    placeholder={userName}
                    className="mt-1"
                    autoComplete="off"
                    aria-label="Confirmation du nom"
                  />
                  {confirmName.length > 0 && !isDeleteConfirmed && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <HelpCircle className="h-3 w-3" />
                      Le nom saisi ne correspond pas.
                    </p>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmName('')}>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={!isDeleteConfirmed || isDeleting}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
