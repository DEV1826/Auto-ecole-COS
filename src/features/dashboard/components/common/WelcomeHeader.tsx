// src/features/dashboard/components/common/WelcomeHeader.tsx

/**
 * @module dashboard/components/common/WelcomeHeader
 * @description
 * En-tête de bienvenue principal — composant de base réutilisé par tous les dashboards.
 *
 * Design adapté pour l’auto‑école COS :
 * - Greeting dynamique et intelligent selon l'heure et la durée depuis la dernière connexion
 *   (Bonjour / Bon après-midi / Bonsoir / Bon retour / Re-bonjour)
 * - Nom de l'utilisateur mis en avant (couleur accent selon rôle)
 * - Message contextuel optionnel sous le greeting, avec support de segments colorés
 * - Boutons d’actions (le premier avec variant="default" est le principal)
 * - Avatar circulaire (rounded-full) sans HoverCard
 * - Logo de l’application en fond à droite (via appConfig.logo)
 * - Badge rôle affiché à côté du nom
 *
 * @author Stive Junior
 * @version 5.0.0
 *
 * @example
 * ```tsx
 * <WelcomeHeader
 *   userName="Jean Dupont"
 *   Role="ADMIN"
 *   subtitle="Super Administrateur"
 *   avatarUrl="/avatars/admin.jpg"
 *   contextMessage={[
 *     { text: "Vous avez " },
 *     { text: "5 nouveaux candidats", highlight: true },
 *     { text: " à suivre." },
 *   ]}
 *   mainActions={[
 *     { label: "Gérer les candidats", icon: Users, onClick: () => navigate('/candidats'), variant: "default" },
 *   ]}
 * />
 * ```
 */

import * as React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, type LucideIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Role } from '@/types/enums';
import { appConfig } from '@/config/app.config';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @interface ContextSegment
 * @description Segment de texte du message contextuel.
 * Permet de colorer certains mots.
 */
export interface ContextSegment {
  /** Texte du segment */
  text: string;
  /**
   * Si true, le segment est mis en avant avec la couleur du rôle.
   * @default false
   */
  highlight?: boolean;
  /**
   * Couleur CSS personnalisée (surcharge `highlight`).
   * @example "text-amber-500"
   */
  colorClass?: string;
}

/**
 * @interface WelcomeAction
 * @description Action (bouton) affichée dans le header.
 */
export interface WelcomeAction {
  /** Libellé du bouton */
  label: string;
  /** Icône Lucide */
  icon: LucideIcon;
  /** Handler de clic */
  onClick: () => void;
  /** Variante visuelle (défaut : "outline") */
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
  /** Badge numérique affiché sur le bouton */
  badge?: number;
  /** Désactiver le bouton */
  disabled?: boolean;
  /** Masquer le label sur mobile (icône seule) — défaut : false */
  iconOnly?: boolean;
}

/**
 * @interface WelcomeHeaderProps
 * @description Propriétés complètes du composant WelcomeHeader.
 */
export interface WelcomeHeaderProps {
  // ── Identité ─────────────────────────────────────────────
  /** Nom complet de l'utilisateur (affiché en accent) */
  userName: string;
  /** Rôle de l'utilisateur (influence la couleur accent) */
  Role?: Role;
  /** État de chargement – affiche un skeleton */
  isLoading?: boolean;
  /**
   * Sous-titre affiché sous le nom (facultatif).
   */
  subtitle?: string;

  // ── Avatar ────────────────────────────────────────────────
  /** URL de l'image d'avatar */
  avatarUrl?: string;
  /** Initiales de secours si pas d'image */
  avatarFallback?: string;

  // ── Greeting ──────────────────────────────────────────────
  /**
   * Message de salutation personnalisé.
   * Sinon, calcul automatique.
   */
  greetingMessage?: string;
  /**
   * Date/heure de la dernière connexion.
   * Utilisée pour les variations "Bon retour" / "Re-bonjour".
   */
  lastLoginAt?: Date;

  // ── Message contextuel ────────────────────────────────────
  /**
   * Tableau de segments formant le message sous le greeting.
   */
  contextMessage?: ContextSegment[];

  // ── Date ──────────────────────────────────────────────────
  /** Afficher la date du jour (défaut : true) */
  showDate?: boolean;
  /** Format de la date (défaut : "EEEE d MMMM yyyy") */
  dateFormat?: string;

  // ── Actions ───────────────────────────────────────────────
  /**
   * Boutons d'actions.
   * Le premier avec variant="default" est le bouton principal.
   */
  mainActions?: WelcomeAction[];

  // ── Style ────────────────────────────────────────────────
  /** Classes CSS additionnelles */
  className?: string;
  /** Élément additionnel affiché à droite des actions */
  extra?: React.ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
// Configuration des rôles
// ─────────────────────────────────────────────────────────────────────────────

interface RoleConfig {
  label: string;
  /** Classe Tailwind pour le texte du nom et les éléments accent */
  accentText: string;
  /** Classe Tailwind pour le fond du bouton primaire */
  btnBg: string;
  /** Classe Tailwind pour le fond du badge rôle */
  badgeBg: string;
  /** Classe Tailwind pour le texte du badge rôle */
  badgeText: string;
}

/**
 * Retourne la configuration de couleur selon le rôle.
 * @internal
 */
function getRoleConfig(role?: Role): RoleConfig {
  switch (role) {
    case 'ADMIN':
      return {
        label: 'Administrateur',
        accentText: 'text-blue-700 dark:text-blue-400',
        btnBg: 'bg-blue-700 hover:bg-blue-800 text-white',
        badgeBg: 'bg-blue-50 dark:bg-blue-950/40',
        badgeText: 'text-blue-700 dark:text-blue-300',
      };
    case 'SECRETAIRE':
      return {
        label: 'Secrétaire',
        accentText: 'text-emerald-700 dark:text-emerald-400',
        btnBg: 'bg-emerald-700 hover:bg-emerald-800 text-white',
        badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
        badgeText: 'text-emerald-700 dark:text-emerald-300',
      };
    case 'MONITEUR':
      return {
        label: 'Moniteur',
        accentText: 'text-purple-700 dark:text-purple-400',
        btnBg: 'bg-purple-700 hover:bg-purple-800 text-white',
        badgeBg: 'bg-purple-50 dark:bg-purple-950/40',
        badgeText: 'text-purple-700 dark:text-purple-300',
      };
    default:
      return {
        label: 'Utilisateur',
        accentText: 'text-primary',
        btnBg: 'bg-primary hover:bg-primary/90 text-primary-foreground',
        badgeBg: 'bg-muted',
        badgeText: 'text-muted-foreground',
      };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Génère les initiales à partir d'un nom complet.
 * @internal
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Calcule le message de salutation intelligent.
 * @internal
 */
function computeGreeting(lastLoginAt?: Date): string {
  const now = new Date();
  const hour = now.getHours();

  if (lastLoginAt) {
    const diffMs = now.getTime() - lastLoginAt.getTime();
    const diffMin = diffMs / 60_000;
    if (diffMin < 30) return 'Re-bonjour';
    if (diffMin < 480) return 'Bon retour';
  }

  if (hour >= 5 && hour < 12) return 'Bonjour';
  if (hour >= 12 && hour < 18) return 'Bon après-midi';
  if (hour >= 18 && hour < 21) return 'Bonsoir';
  return 'Bonne nuit';
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * En-tête de bienvenue COS — version 5.
 * Composant de base réutilisable par tous les dashboards.
 * Sans HoverCard ni alertes, avec logo décoratif.
 * Affiche un skeleton élégant lorsque `isLoading` est true.
 */
export function WelcomeHeader({
  userName,
  Role,
  subtitle,
  avatarUrl,
  isLoading = false,
  avatarFallback,
  greetingMessage,
  lastLoginAt,
  contextMessage,
  showDate = true,
  dateFormat = 'EEEE d MMMM yyyy',
  mainActions = [],
  className,
  extra,
}: WelcomeHeaderProps): React.JSX.Element {
  const isMobile = useIsMobile();
  const role = getRoleConfig(Role);
  const greeting = greetingMessage ?? computeGreeting(lastLoginAt);
  const fallbackText = avatarFallback ?? getInitials(userName);
  const formattedDate = React.useMemo(
    () => format(new Date(), dateFormat, { locale: fr }),
    [dateFormat]
  );

  // Bouton principal (premier avec variant="default" ou sans variant)
  const primaryAction = mainActions.find((a) => a.variant === 'default' || !a.variant);
  const secondaryActions = mainActions.filter((a) => a !== primaryAction);

  // ── Squelette de chargement ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <Card className={cn('relative overflow-hidden border-border/50 shadow-xs', className)}>
        <CardContent className="p-5 sm:px-6 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3 flex-1">
              <Skeleton className="size-15 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-64" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  {showDate && !isMobile && <Skeleton className="h-3 w-32" />}
                </div>
              </div>
            </div>
            {showDate && !isMobile && <Skeleton className="h-4 w-36 hidden sm:block" />}
          </div>

          {/* Message contextuel skeleton */}
          {contextMessage && contextMessage.length > 0 && (
            <Skeleton className="h-4 w-3/4" />
          )}

          {/* Actions skeleton */}
          {mainActions.length > 0 && (
            <div className="flex items-center gap-2.5 flex-wrap mt-1">
              <Skeleton className="h-10 w-28 rounded-md" />
              {secondaryActions.map((_, idx) => (
                <Skeleton key={idx} className="h-10 w-24 rounded-md" />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // ── Rendu normal (données réelles) ───────────────────────────────────────
  return (
    <Card className={cn('relative overflow-hidden border-border/50 shadow-xs', className)}>
      <CardContent className="p-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Colonne gauche : avatar + greeting + message + actions */}
          <div className="flex flex-col gap-3 flex-1 min-w-0">
            {/* Ligne identité */}
            <div className="flex items-start gap-3">
              <Avatar className="size-15 ring-2 ring-border rounded-full shrink-0">
                <AvatarImage src={avatarUrl} alt={userName} />
                <AvatarFallback
                  className={cn('text-sm font-semibold', role.badgeBg, role.accentText)}
                >
                  {fallbackText}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <h1 className="text-xl font-bold tracking-tight leading-tight">
                  <span className="text-foreground">{greeting}, </span>
                  <span className={cn('font-bold', role.accentText)}>{userName}</span>
                  <span className="text-foreground"> !</span>
                </h1>

                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  {Role && (
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[11px] font-medium px-2 py-0 h-5 border-0',
                        role.badgeBg,
                        role.badgeText
                      )}
                    >
                      {role.label}
                    </Badge>
                  )}
                  {subtitle && (
                    <>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{subtitle}</span>
                    </>
                  )}
                  {showDate && !isMobile && (
                    <>
                      <span className="text-xs text-muted-foreground">•</span>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="capitalize">{formattedDate}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Message contextuel */}
            {contextMessage && contextMessage.length > 0 && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {contextMessage.map((seg, i) =>
                  seg.highlight || seg.colorClass ? (
                    <span
                      key={i}
                      className={cn('font-semibold', seg.colorClass ?? role.accentText)}
                    >
                      {seg.text}
                    </span>
                  ) : (
                    <span key={i}>{seg.text}</span>
                  )
                )}
              </p>
            )}

            {/* Actions (boutons) */}
            {mainActions.length > 0 && (
              <div className="flex items-center gap-2.5 flex-wrap mt-1">
                {primaryAction && (
                  <Button
                    onClick={primaryAction.onClick}
                    disabled={primaryAction.disabled}
                    className={cn('h-10 px-5 gap-2 font-medium shadow-sm', role.btnBg)}
                  >
                    <primaryAction.icon className="size-4 shrink-0" />
                    <span>{primaryAction.label}</span>
                    {primaryAction.badge !== undefined && primaryAction.badge > 0 && (
                      <span className="ml-1 inline-flex items-center justify-center h-4 min-w-4 rounded-full bg-white/25 text-[10px] font-bold px-1">
                        {primaryAction.badge > 99 ? '99+' : primaryAction.badge}
                      </span>
                    )}
                  </Button>
                )}

                {secondaryActions.map((action, idx) => (
                  <Button
                    key={idx}
                    variant={action.variant || 'outline'}
                    size="default"
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className="h-10 px-4 gap-2"
                  >
                    <action.icon className="size-4 shrink-0" />
                    {!action.iconOnly && <span>{action.label}</span>}
                    {action.badge !== undefined && action.badge > 0 && (
                      <span className="ml-1 inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-primary/20 text-[10px] font-bold px-1">
                        {action.badge > 99 ? '99+' : action.badge}
                      </span>
                    )}
                  </Button>
                ))}

                {extra}
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {/* Icône décorative : logo de l’application (fond) */}
      {!isMobile && appConfig.logo && (
        <div
          className="pointer-events-none select-none absolute right-4 top-1/2 -translate-y-1/2 opacity-70 dark:opacity-100"
          aria-hidden="true"
        >
          <img src={appConfig.logo} alt="" className="h-50 w-auto" />
        </div>
      )}
    </Card>
  );
}