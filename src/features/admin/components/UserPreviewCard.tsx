// src/features/admin/components/UserPreviewCard.tsx

/**
 * @module features/admin/components/UserPreviewCard
 * @description Aperçu en direct d'un compte utilisateur pendant la saisie.
 */

import { KeyRound, Mail, Shield, UserRound } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { CompletionGauge, InfoRow, RequiredChecklist, isFilled } from '@/components/forms/FormPageKit';
import { cn } from '@/lib/utils';
import { NIVEAU_ACCES_CONFIG, ROLE_CONFIG } from '@/types/enums';
import type { NiveauAcces, Role } from '@/types/enums';

export interface UserPreviewData {
  nom?: string;
  prenom?: string;
  email?: string;
  role?: Role;
  niveau?: NiveauAcces;
  actif?: boolean;
  password?: string;
}

export default function UserPreviewCard({
  data,
  isEditMode = false,
  dirty = false,
}: {
  data: UserPreviewData;
  isEditMode?: boolean;
  dirty?: boolean;
}) {
  const initials = `${data.prenom?.[0] ?? ''}${data.nom?.[0] ?? ''}`.toUpperCase();
  const role = data.role ? ROLE_CONFIG[data.role] : null;
  const niveau = data.niveau ? NIVEAU_ACCES_CONFIG[data.niveau] : null;
  const actif = data.actif ?? true;

  const required = [
    { label: 'Prénom', filled: isFilled(data.prenom) },
    { label: 'Nom', filled: isFilled(data.nom) },
    { label: 'E-mail', filled: isFilled(data.email) },
    { label: 'Rôle', filled: isFilled(data.role) },
    { label: "Niveau d'accès", filled: isFilled(data.niveau) },
    ...(isEditMode ? [] : [{ label: 'Mot de passe', filled: isFilled(data.password) }]),
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-3 pt-2 pb-4 border-b border-border/50">
        <div className="flex size-20 items-center justify-center rounded-full bg-sky-100 text-2xl font-bold text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
          {initials || <UserRound className="h-8 w-8" />}
        </div>
        <div className="text-center">
          <p className="text-base font-bold leading-tight">
            {[data.prenom, data.nom].filter(Boolean).join(' ') || (
              <span className="text-sm font-normal italic text-muted-foreground/60">Nom de l'utilisateur</span>
            )}
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
            {role && (
              <Badge variant="outline" className={cn('border-0 text-[10px]', role.bgColor, role.textColor)}>
                {role.label}
              </Badge>
            )}
            {niveau && (
              <Badge variant="outline" className={cn('border-0 text-[10px]', niveau.bgColor, niveau.textColor)}>
                {niveau.label}
              </Badge>
            )}
            <Badge variant="outline" className={cn('text-[10px]', !actif && 'text-muted-foreground')}>
              {actif ? 'Compte actif' : 'Compte désactivé'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="space-y-0.5">
        <InfoRow accent="sky" icon={Mail} value={data.email} placeholder="E-mail —" />
        <InfoRow accent="sky" icon={Shield} value={niveau?.description} placeholder="Niveau d'accès —" />
        <InfoRow
          accent="sky"
          icon={KeyRound}
          value={isEditMode ? null : data.password ? '••••••••' : null}
          placeholder={isEditMode ? 'Mot de passe inchangé (réinitialisation par code)' : 'Mot de passe —'}
        />
      </div>

      <CompletionGauge accent="sky" filled={required.filter((r) => r.filled).length} total={required.length} />
      <RequiredChecklist items={required} />

      {dirty && (
        <p className="text-[10px] text-amber-600 dark:text-amber-400 text-center border-t pt-2">
          ⚡ Modifications non enregistrées
        </p>
      )}
    </div>
  );
}
