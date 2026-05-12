'use client';

/**
 * @module features/profile/components/ProfileInfoRow
 * @description
 * Ligne d'information éditable au survol, avec affichage adapté au type de valeur.
 * Supporte :
 * - texte, email, téléphone, date, select, textarea, url, nombre
 * - booléen (badge "Activé"/"Désactivé")
 * - nombre avec stepper (boutons + et -)
 * - mot de passe (masqué, action "Modifier" au lieu du crayon)
 * - actions personnalisées (ex: 2FA, déconnexion) avec badge d'état et bouton d'action
 * - **json** : affichage structuré des permissions (badges colorés, compteur) et édition via éditeur JSON validé
 *
 * Au clic sur le crayon ou sur le bouton d'action, un modal (Dialog/Drawer) s'ouvre avec le contrôle d'édition adapté.
 *
 * @author Stive Junior
 * @version 5.0.0
 */

import * as React from 'react';
import {
  Pencil,
  Eye,
  EyeOff,
  type LucideIcon,
  Loader2Icon,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  EditFieldDialog,
  FormModalWrapper,
  type FieldConfig,
  type FieldType,
} from './ProfileForms';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

/**
 * Props du composant ProfileInfoRow.
 */
export interface ProfileInfoRowProps {
  label: string;
  value?: string | number | boolean | null | undefined | JSON | undefined;
  icon?: LucideIcon;
  type?: FieldType | 'action' | 'json';
  onEdit?: (value: unknown) => Promise<void>;
  onAction?: () => void;
  actionLabel?: string;
  actionIcon?: LucideIcon;
  options?: { value: string; label: string }[];
  placeholder?: string;
  editDescription?: string;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  schema?: import('zod').ZodType;
  editIconAlwaysVisible?: boolean;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  valueClassName?: string;
  statusBadge?: boolean;
  emptyPlaceholder?: string;
  editContent?: React.ReactNode;
  editModalTitle?: string;
  editModalDescription?: string;
  children?: React.ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sous‑composants existants (BooleanBadge, PasswordValue) – inchangés
// ─────────────────────────────────────────────────────────────────────────────

function BooleanBadge({ value }: { value: boolean }) {
  return (
    <Badge
      variant={value ? 'default' : 'secondary'}
      className={cn(
        'text-xs font-medium',
        value ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : ''
      )}
    >
      {value ? 'Activé' : 'Désactivé'}
    </Badge>
  );
}

function PasswordValue({ value, className }: { value: string; className?: string }) {
  const [show, setShow] = React.useState(false);
  const displayValue = show ? value : '••••••••';
  return (
    <div className="flex items-center gap-2">
      <span className={cn('text-base font-semibold', className)}>{displayValue}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShow(!show);
        }}
        className="text-muted-foreground hover:text-foreground"
        aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Nouveaux composants pour le type JSON (permissions)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse la valeur JSON (string) en objet.
 * Retourne `null` si invalide.
 */
function parseJsonValue(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'string') return null;
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Affiche les permissions sous forme de badges empilés avec compteur.
 */
function JsonValueDisplay({
  value,
  className,
}: {
  value: string;
  className?: string;
}): React.JSX.Element {
  const permissionsObj = parseJsonValue(value);
  if (!permissionsObj) {
    return <span className="text-muted-foreground italic">Aucune permission</span>;
  }

  const entries = Object.entries(permissionsObj);
  const activeCount = entries.filter(([, v]) => v === true).length;

  return (
    <div className={cn('space-y-1.5', className)}>
      {entries.length > 0 ? (
        <>
          <div className="flex items-center gap-2 text-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="font-semibold">
              {activeCount} permission{activeCount > 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {entries.map(([key, enabled]) => (
              <Badge
                key={key}
                variant={enabled ? 'default' : 'outline'}
                className={cn(
                  'text-[11px] capitalize',
                  enabled
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : 'text-muted-foreground'
                )}
              >
                {key.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
        </>
      ) : (
        <span className="text-sm text-muted-foreground italic">Aucune permission définie</span>
      )}
    </div>
  );
}

/**
 * Modal d'édition pour le type JSON.
 * Affiche un Textarea avec le JSON formaté, validation en direct.
 */
function JsonEditModal({
  open,
  onOpenChange,
  value,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onSave: (newValue: string) => Promise<void>;
}) {
  const [text, setText] = React.useState(value);
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(text);
      setText(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch {
      setError('JSON invalide');
    }
  };

  const handleSave = async () => {
    try {
      JSON.parse(text); // validation
      setError(null);
      setIsSaving(true);
      await onSave(text);
      toast.success('Permissions mises à jour');
      onOpenChange(false);
    } catch {
      setError('JSON invalide – corrigez avant d’enregistrer');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <FormModalWrapper
      title="Modifier les permissions (JSON)"
      Icon={ShieldCheck}
      description="Entrez un objet JSON valide. Utilisez le bouton Formater pour l’indenter."
      open={open}
      onOpenChange={onOpenChange}
    >
      <div className="space-y-4">
        <div className="space-y-1">
          <Textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError(null);
            }}
            placeholder='{"gerer_utilisateurs": true, "voir_rapports": false}'
            className="min-h-50 font-mono text-sm"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleFormat}>
            Formater
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </div>
    </FormModalWrapper>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

export function ProfileInfoRow({
  label,
  value,
  icon: Icon,
  type = 'text',
  onEdit,
  onAction,
  actionLabel,
  actionIcon: ActionIcon,
  options,
  placeholder,
  editDescription,
  unit,
  min,
  max,
  step = 1,
  schema,
  editIconAlwaysVisible = false,
  disabled = false,
  loading = false,
  className,
  valueClassName,
  statusBadge = false,
  emptyPlaceholder = 'Non renseigné',
  editContent,
  editModalTitle,
  editModalDescription,
  children,
}: ProfileInfoRowProps): React.JSX.Element {
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isActionLoading, setIsActionLoading] = React.useState(false);

  const isPassword = type === 'password';
  const isActionType = type === 'action';
  const isJson = type === 'json';

  // ── Valeur affichée ─────────────────────────────────────────────────────
  const displayRawValue = (): React.ReactNode => {
    if (value === null || value === undefined || value === '') {
      if (children) return children;
      return <span className="text-muted-foreground italic">{emptyPlaceholder}</span>;
    }

    if (isPassword) {
      return <PasswordValue value={String(value)} className={valueClassName} />;
    }

    if (type === 'boolean' || statusBadge) {
      return <BooleanBadge value={!!value} />;
    }

    if (isJson) {
      return <JsonValueDisplay value={String(value)} className={valueClassName} />;
    }

    if (type === 'stepper') {
      const numValue = typeof value === 'number' ? value : Number(value);
      return (
        <span className={cn('text-base font-semibold', valueClassName)}>
          {isNaN(numValue) ? '—' : numValue}
          {unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
        </span>
      );
    }

    let displayValue = String(value);
    if (type === 'date' && value) {
      try {
        displayValue = new Date(value as string).toLocaleDateString('fr-FR');
      } catch {
        displayValue = String(value);
      }
    }
    return (
      <span className={cn('text-base font-semibold wrap-break-word', valueClassName)}>
        {displayValue}
        {unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
      </span>
    );
  };

  // ── Gestion de l'édition JSON personnalisée ─────────────────────────────
  const openJsonEditor = () => setIsEditOpen(true);

  const handleSaveJson = async (newJson: string) => {
    if (onEdit) await onEdit(newJson);
  };

  // ── Gestion des actions (pour type='action') ────────────────────────────
  const handleAction = async () => {
    if (!onAction) return;
    setIsActionLoading(true);
    try {
      await onAction();
    } catch (error) {
      console.error(error);
    } finally {
      setIsActionLoading(false);
    }
  };

  // ── Configuration du FieldConfig pour les types éditables standard ──────
  const hasCustomContent = !!editContent;
  const fieldConfig: FieldConfig | null =
    !hasCustomContent && onEdit && !isActionType && !isPassword && !isJson
      ? {
          field: label.toLowerCase().replace(/\s/g, '-'),
          label,
          type: type === 'stepper' ? 'number' : (type as FieldType),
          defaultValue: value ?? '',
          options,
          placeholder,
          description: editDescription,
          icon: Icon,
          unit,
          min,
          max,
          step,
          schema,
          onSubmit: async (newValue) => {
            if (onEdit) await onEdit(newValue);
          },
          useSwitch: type === 'boolean',
          useStepper: type === 'stepper',
        }
      : null;

  if (loading) {
    return (
      <div className={cn('flex items-center gap-4 py-3', className)}>
        {Icon && <div className="h-5 w-5 animate-pulse rounded bg-muted" />}
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-24 animate-pulse rounded bg-muted" />
          <div className="h-5 w-36 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          'group flex items-start gap-4 py-3 transition-colors',
          !isActionType &&
            (onEdit || hasCustomContent || isJson) &&
            !disabled &&
            'cursor-pointer hover:bg-muted/30 rounded-lg -mx-1 px-2',
          className
        )}
        onClick={(e) => {
          e.stopPropagation();
          if (!isActionType && (onEdit || hasCustomContent || isJson) && !disabled) {
            if (isJson) openJsonEditor();
            else setIsEditOpen(true);
          }
        }}
      >
        {Icon && (
          <Icon className="h-5 w-5 text-emerald-900 dark:text-muted-foreground mt-0.5 shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-emerald-900 dark:text-muted-foreground">{label}</p>
          <div className="mt-1">{displayRawValue()}</div>
        </div>

        {/* Bouton d'action (pour type='action') */}
        {isActionType && onAction && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAction}
                  disabled={isActionLoading}
                  className="shrink-0"
                >
                  {ActionIcon && <ActionIcon className="h-4 w-4 mr-1.5" />}
                  {actionLabel ?? (statusBadge ? 'Gérer' : 'Activer')}
                  {isActionLoading && (
                    <span className="ml-2 animate-spin">
                      <Loader2Icon className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{editDescription || `Configurer ${label.toLowerCase()}`}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Indicateur d'édition pour JSON (flèche/clic) */}
        {isJson && (
          <button
            type="button"
            className="shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label={`Modifier ${label}`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        {/* Crayon d'édition pour les autres types éditables */}
        {!isActionType && !isJson && (onEdit || hasCustomContent) && !disabled && (
          <button
            type="button"
            className={cn(
              'shrink-0 text-muted-foreground transition-opacity focus:outline-none',
              editIconAlwaysVisible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
              'hover:text-primary'
            )}
            onClick={(e) => {
              e.stopPropagation();
              setIsEditOpen(true);
            }}
            aria-label={`Modifier ${label}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Modaux d'édition */}
      {isJson && (
        <JsonEditModal
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          value={String(value ?? '')}
          onSave={handleSaveJson}
        />
      )}

      {fieldConfig && (
        <EditFieldDialog config={fieldConfig} open={isEditOpen} onOpenChange={setIsEditOpen} />
      )}

      {hasCustomContent && (
        <FormModalWrapper
          title={editModalTitle ?? `Modifier ${label}`}
          Icon={Icon}
          description={editModalDescription ?? editDescription}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
        >
          {editContent}
        </FormModalWrapper>
      )}
    </>
  );
}
