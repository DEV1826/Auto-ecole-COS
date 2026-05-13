'use client';

/**
 * @module features/profile/components/ActiveSessionsPanel
 * @description
 * Panneau de gestion des sessions actives haute fidélité pour VitaCare.
 *
 * Ce composant implémente une interface hybride (Dialog/Drawer) avec un design
 * "Glassmorphism" avancé. Il permet une gestion granulaire des accès sécurisés.
 *
 * ## Fonctionnalités Clés
 * - 🖥️ Détection intelligente du type d'appareil avec imagerie produit.
 * - 🛡️ Sécurité renforcée avec doubles modales de confirmation.
 * - ⚡ Chargement asynchrone avec Squelettes optimisés.
 * - 📱 Expérience responsive native (Drawer pour mobile, Dialog pour Desktop).
 *
 * @author Stive Junior (Nana Tchoffo)
 * @version 4.2.0
 */

import * as React from 'react';
import {
  Monitor,
  Smartphone,
  Tablet,
  Watch,
  XCircle,
  LogOut,
  ShieldCheck,
  MapPin,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
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
import type { Session } from '@/types/auth.types';

// ── Types & Constantes ────────────────────────────────────────────────────────

/**
 * Mapping des ressources images stockées dans /public/images/product/
 */
const DEVICE_IMAGES = {
  DESKTOP: '/images/device/Computer.jpg',
  MOBILE: '/images/device/Phone.jpg',
  TABLET: '/images/device/Tablet.jpg',
  WATCH: '/images/device/Watch.jpg',
  DEFAULT: '/icons/icon.svg',
};

interface ActiveSessionsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessions: Session[];
  isLoading?: boolean;
  currentSessionId?: number;
  onTerminate?: (sessionId: number) => Promise<void>;
  onLogoutAll?: () => Promise<void>;
  className?: string;
}

// ── Helpers de Présentation ──────────────────────────────────────────────────

/**
 * Détermine l'image et l'icône appropriées selon le User Agent simulé
 */
function getDeviceMetadata(device: string) {
  const lower = device.toLowerCase();
  if (lower.includes('iphone') || lower.includes('android')) {
    return { icon: <Smartphone className="h-4 w-4" />, image: DEVICE_IMAGES.MOBILE };
  }
  if (lower.includes('ipad') || lower.includes('tablet')) {
    return { icon: <Tablet className="h-4 w-4" />, image: DEVICE_IMAGES.TABLET };
  }
  if (lower.includes('watch')) {
    return { icon: <Watch className="h-4 w-4" />, image: DEVICE_IMAGES.WATCH };
  }
  if (lower.includes('mac') || lower.includes('windows') || lower.includes('linux')) {
    return { icon: <Monitor className="h-4 w-4" />, image: DEVICE_IMAGES.DESKTOP };
  }
  return { icon: <Monitor className="h-4 w-4" />, image: DEVICE_IMAGES.DEFAULT };
}

/**
 * Formate la date de dernière activité avec style
 */
function formatSessionActivity(isoDate: string): string {
  const date = new Date(isoDate);
  const diff = date.getTime() - Date.now();
  const minutes = Math.round(diff / 60000);
  if (minutes > -60) return `Il y a ${Math.abs(minutes)} min`;
  const hours = Math.round(minutes / 60);
  if (hours > -24) return `Il y a ${Math.abs(hours)} h`;
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── Composant Principal ──────────────────────────────────────────────────────

// ── Sous-composants de rendu ──────────────────────────────────────────────

const LoadingSkeleton = () => (
  <div className="space-y-4 p-1">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="flex items-center gap-4 p-4 rounded-2xl border border-dashed animate-pulse"
      >
        <Skeleton className="h-16 w-16 rounded-md bg-emerald-100/20" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3 bg-emerald-100/20" />
          <Skeleton className="h-3 w-1/2 opacity-50" />
        </div>
      </div>
    ))}
  </div>
);

interface SessionListProps {
  isLoading: boolean;
  sessions: Session[];
  currentSessionId?: number;
  onTerminateClick: (session: Session) => void;
  onLogoutAllClick: () => void;
  className?: string;
}

const SessionList = ({
  isLoading,
  sessions,
  currentSessionId,
  onTerminateClick,
  onLogoutAllClick,
  className,
}: SessionListProps) => {
  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className={cn('space-y-4 py-2', className)}>
      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
          <div className="p-4 rounded-full bg-emerald-50 dark:bg-emerald-500/10">
            <ShieldCheck className="h-10 w-10 text-emerald-500 opacity-50" />
          </div>
          <div className="space-y-1">
            <p className="font-medium text-foreground">Votre compte est sécurisé</p>
            <p className="text-sm text-muted-foreground max-w-60">
              Aucune autre session active n&apos;a été détectée sur d&apos;autres appareils.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {sessions.map((session) => {
            const isCurrent = session.id === currentSessionId;
            const meta = getDeviceMetadata(session.userAgent?.toString() ?? '');

            return (
              <div
                key={session.id}
                className={cn(
                  'group relative flex items-center gap-4 p-2 rounded-md transition-all duration-300',
                  'bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md border border-white/20 dark:border-white/5',
                  'hover:shadow-lg hover:shadow-emerald-500/5 hover:border-emerald-500/30',
                  isCurrent && 'ring-1 ring-emerald-500 bg-emerald-50/30 dark:bg-emerald-500/5'
                )}
              >
                {/* Image du produit (Device) */}
                <div className="relative h-14 w-14 shrink-0 flex items-center justify-center rounded-md bg-white dark:bg-zinc-800 shadow-sm">
                  <img
                    src={meta.image}
                    alt={session.userAgent || ''}
                    width={48}
                    height={48}
                    className="object-contain p-1 transition-transform group-hover:scale-110"
                    onError={(e: { currentTarget: HTMLImageElement }) => {
                      e.currentTarget.src = DEVICE_IMAGES.DEFAULT;
                    }}
                  />
                </div>

                {/* Informations de Session */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm truncate tracking-tight">
                      {session.userAgent}
                    </span>
                    {isCurrent && (
                      <Badge
                        variant="outline"
                        className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] h-5"
                      >
                        Session actuelle
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <MapPin className="h-3 w-3 text-emerald-500" />
                      <span>{session.ipAddress}</span>
                      <span className="opacity-30">•</span>
                      <Clock className="h-3 w-3 text-emerald-500" />
                      <span>{formatSessionActivity(session.dernierAcces.toISOString())}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onTerminateClick(session)}
                  className="text-muted-foreground hover:text-destructive shrink-0"
                  disabled={!session.actif}
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {sessions.length > 0 && (
        <div className="pt-2">
          <Button
            variant="destructive"
            className="w-full"
            onClick={onLogoutAllClick}
            disabled={sessions.length === 0}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Déconnecter tous les autres appareils
          </Button>
        </div>
      )}
    </div>
  );
};

export function ActiveSessionsPanel({
  open,
  onOpenChange,
  sessions,
  isLoading = false,
  currentSessionId,
  onTerminate,
  onLogoutAll,
  className,
}: ActiveSessionsPanelProps) {
  const isMobile = useIsMobile();
  const [sessionToTerminate, setSessionToTerminate] = React.useState<Session | null>(null);
  const [showLogoutAllConfirm, setShowLogoutAllConfirm] = React.useState(false);
  const [isActionInProgress, setIsActionInProgress] = React.useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleTerminateAction = async () => {
    if (!sessionToTerminate) return;
    setIsActionInProgress(true);
    try {
      await onTerminate?.(sessionToTerminate.id);
      toast.success(`Session sur ${sessionToTerminate.userAgent} terminée.`);
      setSessionToTerminate(null);
    } catch {
      toast.error('Échec de la fermeture de session');
    } finally {
      setIsActionInProgress(false);
    }
  };

  const handleLogoutAllAction = async () => {
    setIsActionInProgress(true);
    try {
      await onLogoutAll?.();
      toast.success('Toutes les autres sessions ont été déconnectées');
      setShowLogoutAllConfirm(false);
    } catch {
      toast.error('Erreur lors de la déconnexion globale');
    } finally {
      setIsActionInProgress(false);
    }
  };

  // ── Contenu Partagé ───────────────────────────────────────────────────────

  const SharedTitle = (
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-emerald-500/10">
        <Monitor className="h-5 w-5 text-emerald-600" />
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-bold tracking-tight">Appareils Connectés</span>
        <span className="text-xs font-normal text-muted-foreground">
          Sécurité du compte VitaCare
        </span>
      </div>
    </div>
  );

  // ── Rendu Final ───────────────────────────────────────────────────────────

  return (
    <>
      {isMobile ? (
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-2">{SharedTitle}</DrawerTitle>
              <DrawerDescription>
                Voici la liste des appareils ayant accédé à votre compte récemment.
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-10 overflow-y-auto">
              <SessionList
                isLoading={isLoading}
                sessions={sessions}
                currentSessionId={currentSessionId}
                onTerminateClick={setSessionToTerminate}
                onLogoutAllClick={() => setShowLogoutAllConfirm(true)}
                className={className}
              />
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">{SharedTitle}</DialogTitle>
              <DialogDescription>
                Gérez vos sessions actives pour prévenir tout accès non autorisé.
              </DialogDescription>
            </DialogHeader>

            <div className="p-6 pt-2 max-h-[60vh] overflow-y-auto">
              <SessionList
                isLoading={isLoading}
                sessions={sessions}
                currentSessionId={currentSessionId}
                onTerminateClick={setSessionToTerminate}
                onLogoutAllClick={() => setShowLogoutAllConfirm(true)}
                className={className}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fermer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ALERTES DE CONFIRMATION */}
      <AlertDialog
        open={!!sessionToTerminate}
        onOpenChange={(op) => !op && setSessionToTerminate(null)}
      >
        <AlertDialogContent className="rounded-3xl border-white/20 backdrop-blur-xl">
          <AlertDialogHeader>
            <div className="mx-auto p-3 rounded-full bg-destructive/10 w-fit mb-2">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center">Terminer la session ?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              L&apos;appareil{' '}
              <span className="font-bold text-foreground">{sessionToTerminate?.userAgent}</span>{' '}
              devra se reconnecter pour accéder à VitaCare.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2">
            <AlertDialogCancel className="rounded-md">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleTerminateAction();
              }}
              disabled={isActionInProgress}
              className="bg-destructive hover:bg-destructive/90 rounded-md"
            >
              {isActionInProgress ? 'Fermeture...' : 'Confirmer la révocation'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showLogoutAllConfirm} onOpenChange={setShowLogoutAllConfirm}>
        <AlertDialogContent className="rounded-3xl border-white/20 backdrop-blur-xl">
          <AlertDialogHeader>
            <div className="mx-auto p-3 rounded-full bg-destructive/10 w-fit mb-2">
              <LogOut className="h-8 w-8 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center">Révoquer tous les accès ?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Cette action déconnectera{' '}
              <span className="font-bold text-foreground">tous les appareils</span> à
              l&apos;exception de celui que vous utilisez actuellement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2">
            <AlertDialogCancel className="rounded-md">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleLogoutAllAction();
              }}
              disabled={isActionInProgress}
              className="bg-destructive hover:bg-destructive/90 rounded-md"
            >
              {isActionInProgress ? 'Déconnexion...' : 'Tout déconnecter'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
