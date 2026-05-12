'use client';

/**
 * @module features/profile/components/ProfileHeader
 * @description
 * En-tête de profil ultra-complet pour VitaCare.
 * Layout : avatar large à gauche, informations à droite, dernière connexion mise en avant.
 *
 * Fonctionnalités :
 * - Avatar XL (128px) avec upload au survol et indicateur de statut actif
 * - Greeting intelligent (Bonjour / Bon retour / Re-bonjour)
 * - Message contextuel personnalisable (segments colorés)
 * - Métadonnées éditables (nom, email, téléphone, localisation, date de naissance, genre)
 * - Badges (rôle, email vérifié, statut)
 * - Dernière connexion affichée en texte + icône (date relative et absolue)
 * - Statistiques sous forme de StatsGrid (réutilise le composant existant)
 * - Actions principales (CTA) sous forme de boutons
 * - Alertes dans la HoverCard de l'avatar
 * - Icône décorative SVG en fond
 * - Squelette de chargement
 * - Responsive : colonne unique sur mobile, deux colonnes sur desktop
 * - Accessible (aria-labels, rôles)
 *
 * @author Stive Junior
 * @version 7.0.0
 *
 * @example
 * ```tsx
 * <ProfileHeader
 *   session={session}
 *   user={user}
 *   title="Mon profil"
 *   contextMessage={[{ text: "Vous avez ", highlight: false }, { text: "3 consultations", highlight: true }, { text: " aujourd'hui" }]}
 *   mainActions={[{ label: "Modifier", icon: Edit, onClick: () => {} }]}
 *   statsCards={[...]}
 *   onAvatarChange={handleUpload}
 *   onEditField={(field, value) => updateField(field, value)}
 * />
 * ```
 */

import * as React from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Camera, type LucideIcon, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, getAvatarUrl } from '@/lib/utils';
import { EditFieldDialog, type FieldConfig } from './ProfileForms';
import type { Session, Utilisateur } from '@/types/auth.types';
import type { Role } from '@/types/enums';

// ─────────────────────────────────────────────────────────────────────────────
// Types publics (inchangés)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Segment de texte pour le message contextuel.
 * Permet de colorer certaines parties du message.
 */
export interface ContextSegment {
  /** Texte du segment */
  text: string;
  /** Si true, applique la couleur d'accent (vert émeraude) */
  highlight?: boolean;
  /** Classe CSS personnalisée pour la couleur (surcharge highlight) */
  colorClass?: string;
}

/**
 * Alerte affichée dans la HoverCard de l'avatar.
 */
export interface ProfileAlert {
  /** Identifiant unique */
  id: string;
  /** Titre de l'alerte */
  title: string;
  /** Description optionnelle */
  description?: string;
  /** Sévérité (influence la couleur de fond) */
  severity?: 'info' | 'warning' | 'error' | 'success';
  /** Action au clic sur l'alerte */
  onClick?: () => void;
}

/**
 * Props pour le champ éditable (déprécié, remplacé par l'édition modale).
 * @deprecated Utilisez plutôt les dialogues d'édition individuels.
 */
export interface EditableFieldProps {
  /** Valeur affichée */
  value: string | React.ReactNode;
  /** Label utilisé pour l'accessibilité */
  label: string;
  /** Icône à gauche */
  icon?: LucideIcon;
  /** Callback déclenché au clic sur le crayon */
  onEdit?: () => void;
  /** Désactive l'édition (cache le crayon) */
  disabled?: boolean;
  /** Classes additionnelles */
  className?: string;
}

/**
 * Props principales du composant ProfileHeader.
 */
export interface ProfileHeaderProps {
  // ── Données utilisateur (obligatoires) ─────────────────────
  /** Session utilisateur (contenant les tokens et infos enrichies) */
  session: Session | null;
  /** Utilisateur de base (provenant de l'API) */
  user: Utilisateur;

  // ── Personnalisation du contenu ────────────────────────────
  /** Message de salutation personnalisé (sinon calcul automatique selon l'heure et dernière connexion) */
  greetingMessage?: string;
  /** Message contextuel (segments colorés) affiché sous le nom */
  contextMessage?: ContextSegment[];
  /** Sous-titre (spécialité, établissement, etc.) */
  subtitle?: string;

  // ── Callbacks ──────────────────────────────────────────────
  /** Changement d'avatar (upload d'un fichier) */
  onAvatarChange?: (file: File) => Promise<void>;

  // ── Apparence ──────────────────────────────────────────────
  /** Icône décorative SVG (par défaut un smiley médical) */
  decorativeIcon?: React.ReactNode | null;
  /** Opacité de l'icône décorative (0-1, défaut: 0.08) */
  decorativeIconOpacity?: number;
  /** État de chargement (affiche des squelettes) */
  isLoading?: boolean;
  /** Classes CSS additionnelles sur le conteneur */
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Fonctions utilitaires (inchangées)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Génère les initiales à partir du prénom et nom.
 * @internal
 */
function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

/**
 * Retourne le texte relatif de la dernière connexion (ex: "il y a 2 heures").
 * @internal
 */
function formatLastLoginRelative(lastLoginAt?: string): string {
  if (!lastLoginAt) return 'Jamais';
  const date = new Date(lastLoginAt);
  if (isNaN(date.getTime())) return 'Date invalide';
  return formatDistanceToNow(date, { addSuffix: true, locale: fr });
}

/**
 * Calcule le message de salutation intelligent selon l'heure et la dernière connexion.
 * @internal
 */
function computeGreeting(lastLoginAt?: string): string {
  const now = new Date();
  const hour = now.getHours();

  if (lastLoginAt) {
    const date = new Date(lastLoginAt);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = diffMs / 60_000;
    if (diffMin < 30) return 'Re-bonjour';
    if (diffMin < 480) return 'Bon retour';
  }

  if (hour >= 5 && hour < 12) return 'Bonjour';
  if (hour >= 12 && hour < 18) return 'Bon après-midi';
  if (hour >= 18 && hour < 21) return 'Bonsoir';
  return 'Bonne nuit';
}

/**
 * Retourne le libellé du rôle en français.
 * @internal
 */
function getRoleLabel(role?: Role): string {
  switch (role) {
    case 'MONITEUR':
      return 'Moniteur';
    case 'SECRETAIRE':
      return '';
    case 'ADMIN':
      return 'Administrateur';
    default:
      return 'Utilisateur';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * En-tête de profil complet avec layout à deux colonnes.
 *
 * ## Architecture visuelle
 * - **Colonne gauche** : Avatar XL (128x128) avec upload, HoverCard pour alertes, indicateur de statut
 * - **Colonne droite** : Greeting + titre, nom + badges, message contextuel, métadonnées éditables,
 *   dernière connexion (texte + icône), actions principales, puis grille de statistiques
 *
 * ## Édition
 * - Chaque métadonnée (email, téléphone, localisation, date de naissance, genre) possède un crayon.
 * - Au clic, un modal (Dialog/Drawer) s'ouvre avec le formulaire d'édition approprié.
 * - Le callback `onEditField` est appelé avec le champ et la nouvelle valeur.
 *
 * ## Dernière connexion
 * - Affichée clairement avec l'icône d'horloge et le texte relatif ("il y a 2 heures").
 * - Au survol, un tooltip donne la date et l'heure précises.
 *
 * ## Responsive
 * - Sur mobile : empilement vertical (avatar centré, informations en dessous).
 * - Sur desktop (sm:flex-row) : avatar à gauche, infos à droite.
 */
export function ProfileHeader({
  session,
  user,
  greetingMessage,
  contextMessage,
  subtitle,
  onAvatarChange,
  decorativeIcon = (
    <svg
      className="absolute -right-12 -top-12 h-40 w-40 text-emerald-500"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
    </svg>
  ),
  decorativeIconOpacity = 0.08,
  isLoading = false,
  className,
}: ProfileHeaderProps): React.JSX.Element {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // ── Extraction des données utilisateur avec fallbacks ──
  const firstName = user?.nom ?? '';
  const lastName = user?.prenom ?? '';
  const fullName = `${firstName} ${lastName}`.trim() || 'Utilisateur';
  const avatarUrl = getAvatarUrl(`${user.nom} ${user.prenom}`);
  const isActive = user?.actif ?? false;
  const lastLoginAt = session?.dernierAcces.toISOString();

  const greeting = greetingMessage || computeGreeting(lastLoginAt);
  const roleLabel = getRoleLabel(user?.role);

  // ── État pour le dialogue d'édition ──
  const [editingField, setEditingField] = React.useState<FieldConfig | null>(null);

  // ── Handlers pour l'avatar ──
  const handleAvatarClick = () => fileInputRef.current?.click();
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onAvatarChange) return;
    await onAvatarChange(file);
    e.target.value = '';
  };

  // ── Squelette de chargement (inchangé) ──
  if (isLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-6">
              <Skeleton className="h-32 w-32 rounded-full shrink-0" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-40" />
                <div className="flex flex-wrap gap-4 pt-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-36" />
                </div>
                <Skeleton className="h-10 w-32 mt-4" />
              </div>
            </div>
          </CardContent>
        </div>
      </div>
    );
  }

  // ── Rendu principal ──
  return (
    <div className={cn('space-y-6', className)}>
      {/* Carte principale */}
      <div className={cn('relative overflow-hidden  bg-background rounded-xl border-none!')}>
        <CardContent className="p-6">
          {/* Icône décorative de fond */}
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ opacity: decorativeIconOpacity }}
          >
            {decorativeIcon}
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row gap-8">
            {/* ── COLONNE GAUCHE : AVATAR XL ─────────────────────────────── */}
            <div className="flex justify-center sm:block shrink-0">
              <div className="relative group/avatar cursor-pointer">
                <Avatar className="h-32 w-32  shadow-lg">
                  <AvatarImage src={avatarUrl ?? undefined} alt={fullName} />
                  <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-200 font-semibold text-3xl">
                    {getInitials(firstName, lastName)}
                  </AvatarFallback>
                </Avatar>
                {onAvatarChange && (
                  <button
                    type="button"
                    onClick={handleAvatarClick}
                    title="Changer Votre photo de profil"
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover/avatar:opacity-100 cursor-pointer"
                    aria-label="Changer la photo de profil"
                  >
                    <Camera className="h-8 w-8 text-white" />
                  </button>
                )}
                {/* Indicateur de statut actif/inactif */}
                <span
                  className={cn(
                    'absolute bottom-2 right-2 h-5 w-5 rounded-full border-2 border-white ring-1 ring-emerald-200',
                    isActive ? 'bg-emerald-500' : 'bg-slate-400'
                  )}
                  title={isActive ? 'Compte actif' : 'Compte inactif'}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                  aria-label="Sélectionner une photo de profil"
                />
              </div>
            </div>

            {/* ── COLONNE DROITE : INFORMATIONS ───────────────────────────── */}
            <div className="flex-1 min-w-0 space-y-2">
              {/* Nom + badges avec édition du nom */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="group/name flex items-center gap-1">
                  <h1 className="text-xl sm:text-2xl font-semibold text-emerald-700 dark:text-emerald-200">
                    <span className="font-bold tracking-tight text-emerald-900 dark:text-emerald-50">
                      {greeting}
                    </span>{' '}
                    {fullName}
                  </h1>
                </div>
                <Badge className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-200 border-0 font-medium">
                  {roleLabel}
                </Badge>
              </div>

              {/* Sous-titre */}
              {subtitle && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400">{subtitle}</p>
              )}

              {/* Message contextuel */}
              {contextMessage && (
                <p className="text-sm text-muted-foreground">
                  {contextMessage.map((segment, i) => (
                    <span
                      key={i}
                      className={cn(
                        segment.highlight && 'font-semibold text-emerald-600 dark:text-emerald-400',
                        segment.colorClass
                      )}
                    >
                      {segment.text}
                    </span>
                  ))}
                </p>
              )}

              {/* Dernière connexion (affichage clair avec icône et texte) */}
              {lastLoginAt && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-md px-3 py-1.5 w-fit">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  <span>
                    Dernière connexion :{' '}
                    <span className="font-medium text-foreground">
                      {formatLastLoginRelative(lastLoginAt)}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    ({format(new Date(lastLoginAt), 'dd MMM yyyy à HH:mm', { locale: fr })})
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </div>

      {/* Dialogue d'édition modale */}
      {editingField && (
        <EditFieldDialog
          config={{
            field: editingField.field,
            label: editingField.label,
            type: editingField.type,
            defaultValue: editingField.defaultValue,
            options:
              editingField.field === 'gender'
                ? [
                    { value: 'M', label: 'Homme' },
                    { value: 'F', label: 'Femme' },
                    { value: 'O', label: 'Autre' },
                  ]
                : undefined,
            onSubmit: editingField.onSubmit,
          }}
          open={!!editingField}
          onOpenChange={(open) => !open && setEditingField(null)}
        />
      )}
    </div>
  );
}
