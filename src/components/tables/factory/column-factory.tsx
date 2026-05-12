/**
 * @module tables/factory/column-factory
 * @description Usine à colonnes pour créer rapidement des colonnes métier éditables, badges, avatars
 *
 * @example
 * ```tsx
 * const columns = [
 *   createAvatarColumn({ ... }),
 *   createEditableColumn({ ... }),
 *   createBadgeColumn({ ... }),
 * ];
 * ```
 */

import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DataTableColumnHeader } from '../data-table-column-header';
import { EditableCell } from './editable-cell';
import type {
  EditableColumnConfig,
  BadgeColumnConfig,
  AvatarColumnConfig,
  AvatarWithTextColumnConfig,
} from './types';
import { cn } from '@/lib/utils';
import { Camera } from 'lucide-react';

/**
 * Crée une colonne métier éditable (texte, select, date, etc.)
 * @template TData – Type des données de la ligne
 * @template TValue – Type de la valeur de la colonne
 * @param config – Configuration complète de la colonne
 * @returns Colonne prête à être utilisée dans un tableau TanStack Table
 *
 * @example
 * ```tsx
 * createEditableColumn({
 *   accessorKey: 'email',
 *   title: 'Email',
 *   icon: Mail,
 *   editType: 'email',
 *   schema: emailSchema,
 *   onSave: async (row, val) => updateUser(row.id, { email: val }),
 * })
 * ```
 */
export function createEditableColumn<TData, TValue = unknown>(
  config: EditableColumnConfig<TData, TValue>
): ColumnDef<TData> {
  const {
    accessorKey,
    title,
    icon,
    editType,
    options = [],
    schema,
    validate,
    onSave,
    format,
    placeholder,
    readOnly = false,
    enableSorting = true,
    enableHiding = true,
    size,
    cellClassName,
    min,
    max,
    step,
    unit,
  } = config;

  const Cell: ColumnDef<TData>['cell'] = (context) => {
    const value = context.getValue() as TValue;
    return (
      <EditableCell
        value={value}
        row={context.row.original}
        editType={editType}
        options={options}
        schema={schema}
        validate={validate}
        onSave={onSave}
        format={format}
        placeholder={placeholder}
        readOnly={readOnly}
        cellClassName={cellClassName}
        min={min}
        max={max}
        step={step}
        unit={unit}
      />
    );
  };

  return {
    accessorKey: accessorKey as string,
    header: ({ column }) => <DataTableColumnHeader column={column} title={title} icon={icon} />,
    cell: Cell,
    enableSorting,
    enableHiding,
    size,
  };
}

/**
 * Crée une colonne d'affichage sous forme de badge (non éditable)
 * @template TData
 * @param config – Configuration
 * @returns Colonne badge
 *
 * @example
 * ```tsx
 * createBadgeColumn({
 *   accessorKey: 'role',
 *   title: 'Rôle',
 *   getColor: (role) => role === 'ADMIN' ? 'destructive' : 'secondary',
 *   getLabel: (role) => role,
 * })
 * ```
 */
export function createBadgeColumn<TData>(config: BadgeColumnConfig<TData>): ColumnDef<TData> {
  const {
    accessorKey,
    title,
    getColor,
    getLabel,
    enableSorting = true,
    enableHiding = true,
  } = config;

  return {
    accessorKey: accessorKey as string,
    header: title,
    cell: ({ row }) => {
      const value = row.getValue(accessorKey);
      const color = getColor(value);
      const label = getLabel(value);
      return <Badge variant={color}>{label}</Badge>;
    },
    enableSorting,
    enableHiding,
  };
}

/**
 * Crée une colonne d'avatar (non éditable)
 * @template TData
 * @param config – Configuration
 * @returns Colonne avatar
 *
 * @example
 * ```tsx
 * createAvatarColumn({
 *   accessorKey: 'avatar',
 *   title: 'Avatar',
 *   getInitials: (user) => `${user.firstName[0]}${user.lastName[0]}`,
 *   getAvatarUrl: (user) => user.avatarUrl,
 * })
 * ```
 */
export function createAvatarColumn<TData>(config: AvatarColumnConfig<TData>): ColumnDef<TData> {
  const {
    accessorKey,
    title,
    getInitials,
    getAvatarUrl,
    enableSorting = false,
    enableHiding = true,
    size = 40,
  } = config;

  return {
    accessorKey: accessorKey as string,
    header: ({ column }) => <DataTableColumnHeader column={column} title={title} icon={Camera} />,
    cell: ({ row }) => {
      const avatarUrl = getAvatarUrl
        ? getAvatarUrl(row.original)
        : (row.getValue(accessorKey) as string | undefined);
      const initials = getInitials(row.original);
      return (
        <Avatar className="h-8 w-8">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      );
    },
    enableSorting,
    enableHiding,
    size,
  };
}

/**
 * Crée une colonne combinant un avatar et du texte sur deux lignes.
 *
 * Utile pour afficher :
 * - Un patient avec son avatar, son nom en principal et son numéro de téléphone en secondaire
 * - Un médecin avec son avatar, son nom et sa spécialité
 * - Toute entité nécessitant une identification visuelle riche
 *
 * @template TData - Type des données de la ligne
 * @param config - {@link AvatarWithTextColumnConfig}
 * @returns Définition de colonne TanStack Table
 *
 * @example
 * ```tsx
 * // Colonne "Patient" : avatar + nom + téléphone + badge "Nouveau"
 * createAvatarWithTextColumn<AppointmentDTO>({
 *   accessorKey: 'patient.fullName',
 *   title: 'Patient',
 *   getAvatarUrl:     (row) => row.patient.avatarUrl,
 *   getInitials:      (row) => `${row.patient.firstName[0]}${row.patient.lastName[0]}`,
 *   getPrimaryText:   (row) => row.patient.fullName,
 *   getSecondaryText: (row) => row.patient.phone,
 *   getBadge:         (row) => row.patient.chronicDiseases?.length
 *     ? { label: 'Chronique', colorClass: 'bg-amber-50 text-amber-700' }
 *     : undefined,
 *   avatarSize: 'md',
 *   size: 220,
 * })
 *
 * // Colonne "Médecin" : avatar + nom + spécialité
 * createAvatarWithTextColumn<AppointmentDTO>({
 *   accessorKey: 'doctor.fullName',
 *   title: 'Médecin',
 *   getAvatarUrl:     (row) => row.doctor.avatarUrl,
 *   getInitials:      (row) => `${row.doctor.firstName[0]}${row.doctor.lastName[0]}`,
 *   getPrimaryText:   (row) => `${row.doctor.fullName}`,
 *   getSecondaryText: (row) => row.doctor.specialization,
 *   size: 220,
 * })
 * ```
 */
export function createAvatarWithTextColumn<TData>(
  config: AvatarWithTextColumnConfig<TData>
): ColumnDef<TData> {
  const {
    accessorKey,
    title,
    icon,
    getAvatarUrl,
    getInitials,
    getPrimaryText,
    getSecondaryText,
    getBadge,
    avatarSize = 'md',
    enableSorting = true,
    enableHiding = true,
    size,
    cellClassName,
  } = config;

  const avatarClass = avatarSize === 'sm' ? 'h-7 w-7' : 'h-9 w-9';
  const fallbackClass = avatarSize === 'sm' ? 'text-[10px]' : 'text-xs';

  return {
    accessorKey: accessorKey as string,
    header: ({ column }) => <DataTableColumnHeader column={column} title={title} icon={icon} />,
    cell: ({ row }) => {
      const avatarUrl = getAvatarUrl(row.original);
      const initials = getInitials(row.original);
      const primaryText = getPrimaryText(row.original);
      const secondaryText = getSecondaryText?.(row.original);
      const badge = getBadge?.(row.original);

      return (
        <div className={cn('flex items-center gap-2.5 min-w-0', cellClassName)}>
          {/* Avatar */}
          <Avatar className={cn(avatarClass, 'shrink-0')}>
            <AvatarImage src={avatarUrl} alt={primaryText} />
            <AvatarFallback
              className={cn('bg-primary/10 text-primary font-semibold', fallbackClass)}
            >
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Textes */}
          <div className="flex flex-col min-w-0 gap-0.5">
            {/* Ligne principale : texte + badge optionnel */}
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm font-medium leading-tight truncate">{primaryText}</span>
              {badge && (
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] h-4 px-1.5 py-0 shrink-0 border-0 whitespace-nowrap',
                    badge.colorClass ?? 'bg-muted text-muted-foreground'
                  )}
                >
                  {badge.label}
                </Badge>
              )}
            </div>

            {/* Ligne secondaire */}
            {secondaryText && (
              <span className="text-xs text-muted-foreground leading-tight truncate">
                {secondaryText}
              </span>
            )}
          </div>
        </div>
      );
    },
    enableSorting,
    enableHiding,
    size,
  };
}
