'use client';

/**
 * @module features/profile/components/ProfileForms
 * @description
 * Formulaires d'édition pour chaque section de profil utilisateur VitaCare.
 * Version ultra‑complète avec gestion unifiée des dialogues/tiroirs,
 * édition par champ individuel, validation Zod, et design homogène.
 *
 * ## Fonctionnalités
 * - 11 formulaires complets couvrant tous les rôles (patient, médecin, pharmacien, infirmier, admin)
 * - Adaptation automatique Dialog (desktop) / Drawer (mobile) via `useIsMobile`
 * - Gestion d'édition modale pour un champ spécifique (`EditFieldDialog`)
 * - Icônes cohérentes, champs avec validation inline, boutons de validation vert émeraude
 * - Support des listes dynamiques (allergies, maladies chroniques, créneaux)
 * - Sélecteurs avancés (recherche de spécialité, fuseau horaire, langues)
 * - Utilisation de `InputGroup` pour les champs avec icônes et états de chargement
 * - Utilisation de `Item` pour les actions de sécurité (2FA, sessions)
 * - Documentation JSDOC exhaustive (chaque composant, chaque prop)
 *
 * @author Stive Junior
 * @version 4.0.0
 */

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  User,
  Mail,
  Lock,
  Check,
  ChevronsUpDown,
  type LucideIcon,
  MinusIcon,
  PlusIcon,
} from 'lucide-react';
import { cn, getAvatarUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Field, FieldGroup, FieldLabel, FieldDescription, FieldError } from '@/components/ui/field';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Spinner } from '@/components/ui/spinner';
import { EmailInput } from '@/components/forms/EmailInput';
import { PhoneInput } from '@/components/forms/PhoneInput';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { AvatarImage, AvatarFallback, Avatar } from '@/components/ui/avatar';
import {
  changePasswordSchema,
  updateUserSchema,
  type ChangePasswordInput,
  type UpdateUserInput,
} from '@/lib';
import { PasswordInput } from '@/components/forms';

// ============================================================================
// Types & helpers communs
// ============================================================================

/**
 * Props communes à tous les formulaires.
 */
interface BaseFormProps {
  /** Annuler l'édition (fermer le modal) */
  onCancel?: () => void;
  /** Callback après soumission réussie (optionnel) */
  onSuccess?: () => void;
}

/**
 * Boutons d'action standardisés pour tous les formulaires.
 */
function FormActions({
  isLoading,
  onCancel,
  submitLabel = 'Enregistrer',
}: {
  isLoading: boolean;
  onCancel?: () => void;
  submitLabel?: string;
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-end gap-3 pt-4 border-t mt-4">
      {onCancel && (
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Annuler
        </Button>
      )}
      <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
        {isLoading ? (
          <>
            <Spinner className="mr-2 h-4 w-4" />
            Enregistrement...
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </div>
  );
}

// ============================================================================
// Wrapper universel Dialog/Drawer pour chaque formulaire
// ============================================================================

/**
 * Props pour le wrapper de modal.
 */
interface FormModalWrapperProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  dialogClassName?: string;
  Icon?: LucideIcon;
}

/**
 * Wrapper qui choisit automatiquement Dialog (desktop) ou Drawer (mobile).
 */
export function FormModalWrapper({
  children,
  title,
  description,
  open,
  Icon,
  onOpenChange,
  trigger,
  dialogClassName,
}: FormModalWrapperProps): React.JSX.Element {
  const isMobile = useIsMobile();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const handleOpenChange = (newOpen: boolean) => {
    if (!isControlled) setInternalOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={handleOpenChange}>
        {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
        <DrawerContent>
          {title && (
            <DrawerHeader className="text-left px-6 pt-6">
              <DrawerTitle className="flex items-center gap-2">
                {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
                {title}
              </DrawerTitle>
              {description && <DrawerDescription>{description}</DrawerDescription>}
            </DrawerHeader>
          )}
          <ScrollArea className="max-h-[75vh] overflow-y-auto">
            <div className="px-6 pb-8">{children}</div>
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className={cn('sm:max-w-lg max-h-[90vh] overflow-y-auto', dialogClassName)}>
        {title && (
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
              {title}
            </DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        <div className="mt-2">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Configuration pour l'édition par champ individuel
// ============================================================================

export type FieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'date'
  | 'select'
  | 'textarea'
  | 'number'
  | 'url'
  | 'boolean'
  | 'stepper'
  | 'password'
  | 'command'
  | 'json';

export interface FieldConfig {
  field: string;
  label: string;
  type: FieldType;
  defaultValue: string | number | boolean | undefined | JSON;
  options?: { value: string; label: string }[];
  schema?: z.ZodType;
  onSubmit: (value: unknown) => Promise<void>;
  placeholder?: string;
  description?: string;
  icon?: LucideIcon;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  useSwitch?: boolean;
  useStepper?: boolean;
}

/**
 * Dialogue/tiroir pour éditer un champ spécifique.
 */
export function EditFieldDialog({
  config,
  trigger,
  open,
  onOpenChange,
}: {
  config: FieldConfig;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}): React.JSX.Element {
  const [isLoading, setIsLoading] = React.useState(false);
  const [value, setValue] = React.useState<string | boolean>(
    config.type === 'boolean'
      ? ((config.defaultValue as boolean) ?? false)
      : String(config.defaultValue ?? '')
  );
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    let parsedValue: unknown = value;

    if (config.type === 'boolean') {
      parsedValue = value;
    } else if (config.type === 'number' || config.type === 'stepper') {
      const num = Number(value);
      if (isNaN(num)) {
        setError('Veuillez saisir un nombre valide');
        return;
      }
      if (config.min !== undefined && num < config.min) {
        setError(`La valeur minimale est ${config.min}`);
        return;
      }
      if (config.max !== undefined && num > config.max) {
        setError(`La valeur maximale est ${config.max}`);
        return;
      }
      parsedValue = num;
    } else if (config.type === 'email') {
      const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
      if (!emailRegex.test(value as string)) {
        setError('Adresse email invalide');
        return;
      }
    } else if (config.type === 'phone') {
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{4,12}$/;
      if (!phoneRegex.test(value as string)) {
        setError('Numéro de téléphone invalide');
        return;
      }
    } else if (config.type === 'url') {
      try {
        new URL(value as string);
      } catch {
        setError('URL invalide');
        return;
      }
    }

    if (config.schema) {
      const result = config.schema.safeParse(parsedValue);
      if (!result.success) {
        setError(result.error.message ?? 'Valeur invalide');
        return;
      }
    }

    setIsLoading(true);
    try {
      await config.onSubmit(parsedValue);
      toast.success(`${config.label} mis à jour`);
      onOpenChange?.(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : `Erreur lors de la mise à jour de ${config.label}`;
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // États locaux pour ce champ spécifique
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');
  const currentValue = value as string;

  const renderInput = () => {
    // Booléen avec Switch
    if (config.type === 'boolean' || config.useSwitch) {
      return (
        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
          <div>
            <p className="text-sm font-medium">{config.label}</p>
            <p className="text-xs text-muted-foreground">
              {config.description ?? 'Activer ou désactiver cette option'}
            </p>
          </div>
          <Switch checked={value as boolean} onCheckedChange={(checked) => setValue(checked)} />
        </div>
      );
    }

    // Nombre avec stepper (+/-)
    if ((config.type === 'number' || config.type === 'stepper') && config.useStepper) {
      const numValue = typeof value === 'number' ? value : Number(value);
      const increment = () => {
        const newVal = numValue + (config.step ?? 1);
        if (config.max !== undefined && newVal > config.max) return;
        setValue(newVal.toString());
      };
      const decrement = () => {
        const newVal = numValue - (config.step ?? 1);
        if (config.min !== undefined && newVal < config.min) return;
        setValue(newVal.toString());
      };
      return (
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={decrement} type="button">
            <MinusIcon className="h-4 w-4" />
          </Button>
          <Input
            type="number"
            value={isNaN(numValue) ? '' : numValue}
            onChange={(e) =>
              setValue(e.target.value === '' ? '' : Number(e.target.value).toString())
            }
            className="w-24 text-center"
            min={config.min}
            max={config.max}
            step={config.step}
          />
          <Button variant="outline" size="icon" onClick={increment} type="button">
            <PlusIcon className="h-4 w-4" />
          </Button>
          {config.unit && <span className="text-sm text-muted-foreground">{config.unit}</span>}
        </div>
      );
    }

    // Autres types (inchangés)
    switch (config.type) {
      case 'email':
        return (
          <EmailInput
            value={value as string}
            onChange={(v) => setValue(v)}
            placeholder={config.placeholder ?? 'exemple@domaine.com'}
          />
        );
      case 'phone':
        return <PhoneInput value={value as string} onChange={(v) => setValue(v)} />;
      case 'textarea':
        return (
          <Textarea
            value={value as string}
            onChange={(e) => setValue(e.target.value)}
            placeholder={config.placeholder}
            rows={3}
            className="resize-none"
          />
        );
      case 'select':
        return (
          <Select value={value as string} onValueChange={setValue}>
            <SelectTrigger>
              <SelectValue placeholder={config.placeholder ?? 'Sélectionner...'} />
            </SelectTrigger>
            <SelectContent>
              {config.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'command':
        return (
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between h-10 font-normal"
              >
                {(currentValue || config.placeholder) ?? 'Sélectionner...'}
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Rechercher..."
                  value={searchValue}
                  onValueChange={setSearchValue}
                />
                <CommandList>
                  <CommandEmpty>Aucun résultat.</CommandEmpty>
                  <CommandGroup>
                    {config.options
                      ?.filter((opt) => opt.label.toLowerCase().includes(searchValue.toLowerCase()))
                      .map((opt) => (
                        <CommandItem
                          key={opt.value}
                          value={opt.value}
                          onSelect={() => {
                            setValue(opt.value);
                            setIsOpen(false);
                            setSearchValue('');
                          }}
                        >
                          <Check
                            className={cn(
                              'h-4 w-4 mr-2',
                              currentValue === opt.value ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          {opt.label}
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        );
      case 'date':
        return (
          <DatePicker
            date={value ? new Date(value as string) : undefined}
            onSelect={(d) => setValue(d ? d.toISOString().split('T')[0] : '')}
            placeholder={config.placeholder ?? 'Sélectionner une date'}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={value as string}
            onChange={(e) => setValue(e.target.value)}
            placeholder={config.placeholder}
            min={config.min}
            max={config.max}
            step={config.step}
          />
        );
      default:
        return (
          <Input
            type="text"
            value={value as string}
            onChange={(e) => setValue(e.target.value)}
            placeholder={config.placeholder}
          />
        );
    }
  };

  const Icon = config.icon;

  return (
    <FormModalWrapper
      title={`Modifier ${config.label}`}
      description={config.description}
      open={open}
      onOpenChange={onOpenChange}
      trigger={trigger}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field>
          <FieldLabel className="flex items-center gap-1.5">
            {Icon && <Icon className="h-4 w-4" />}
            {config.label}
            {config.unit && !config.useStepper && (
              <span className="text-xs text-muted-foreground">({config.unit})</span>
            )}
          </FieldLabel>
          {renderInput()}
          {error && <FieldError errors={[{ message: error }]} />}
        </Field>
        <FormActions isLoading={isLoading} onCancel={() => onOpenChange?.(false)} />
      </form>
    </FormModalWrapper>
  );
}

// ============================================================================
// 1. PersonalInfoForm
// ============================================================================

interface PersonalInfoFormProps extends BaseFormProps {
  defaultValues?: Partial<UpdateUserInput>;
  onSubmit: (data: UpdateUserInput & { avatarFile?: File }) => Promise<void>;
}

/**
 * Formulaire complet des informations personnelles.
 * Utilisé par tous les rôles.
 * Intègre un avatar uploadable (remplace le champ texte avatarUrl).
 */
export function PersonalInfoForm({
  defaultValues,
  onSubmit,
  onCancel,
  onSuccess,
}: PersonalInfoFormProps): React.JSX.Element {
  const [isLoading, setIsLoading] = React.useState(false);
  const [avatarPreview] = React.useState<string | null>(
    getAvatarUrl(`${defaultValues?.nom} ${defaultValues?.prenom}`) || null
  );
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { control, handleSubmit } = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      nom: '',
      prenom: '',
      email: '',
      ...defaultValues,
    },
  });

  // Génère les initiales pour le fallback de l'avatar
  const firstNameValue = defaultValues?.nom || '';
  const lastNameValue = defaultValues?.prenom || '';
  const getInitials = () => {
    return `${firstNameValue.charAt(0)}${lastNameValue.charAt(0)}`.toUpperCase();
  };

  // Gestion du clic sur l'avatar pour ouvrir le sélecteur de fichier
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const submit = async (data: UpdateUserInput) => {
    setIsLoading(true);
    try {
      const payload = { ...data };
      await onSubmit(payload);
      toast.success('Informations personnelles mises à jour');
      onSuccess?.();
      onCancel?.();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour ' + { error });
    } finally {
      setIsLoading(false);
    }
  };

  // Nettoyer l'URL de preview au démontage
  React.useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <FieldGroup>
        {/* Avatar uploadable */}
        <Field>
          <FieldLabel>Photo de profil</FieldLabel>
          <div className="flex items-center gap-4">
            <div className="relative group/avatar cursor-pointer" onClick={handleAvatarClick}>
              <Avatar className="h-20 w-20 ring-2 ring-emerald-200/50 shadow-md">
                <AvatarImage src={avatarPreview || undefined} alt="Avatar" />
                <AvatarFallback className="bg-emerald-100 text-emerald-700 font-semibold text-xl">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </Field>

        {/* Prénom et Nom */}
        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="prenom"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="pf-firstName">Prénom *</FieldLabel>
                <InputGroup className="h-10">
                  <InputGroupAddon align="inline-start">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </InputGroupAddon>
                  <InputGroupInput {...field} id="pf-firstName" placeholder="Nana" />
                </InputGroup>
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="nom"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="pf-lastName">Nom *</FieldLabel>
                <Input {...field} id="pf-lastName" placeholder="Dupont" className="h-10" />
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        {/* Email */}
        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="pf-email">
                <Mail className="h-3.5 w-3.5 inline mr-1" />
                Email *
              </FieldLabel>
              <EmailInput
                value={field.value ?? ''}
                onChange={field.onChange}
                id="pf-email"
                error={fieldState.invalid}
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Date de naissance et Genre */}
        <div className="grid grid-cols-2 gap-4"></div>
      </FieldGroup>

      <FormActions isLoading={isLoading} onCancel={onCancel} />
    </form>
  );
}

// ============================================================================
// 2. ChangePasswordForm
// ============================================================================

interface ChangePasswordFormProps extends BaseFormProps {
  onSubmit: (data: ChangePasswordInput) => Promise<void>;
}

export function ChangePasswordForm({
  onSubmit,
  onCancel,
  onSuccess,
}: ChangePasswordFormProps): React.JSX.Element {
  const [isLoading, setIsLoading] = React.useState(false);

  const { control, handleSubmit, reset } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const submit = async (data: ChangePasswordInput) => {
    setIsLoading(true);
    try {
      await onSubmit(data);
      toast.success('Mot de passe modifié avec succès');
      reset();
      onSuccess?.();
      onCancel?.();
    } catch {
      toast.error('Erreur lors du changement de mot de passe');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <FieldGroup>
        <Controller
          name="oldPassword"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>
                <Lock className="h-3.5 w-3.5 inline mr-1" />
                Mot de passe actuel
              </FieldLabel>

              <PasswordInput
                {...field}
                id="currentPassword"
                placeholder="••••••••"
                className="h-10"
                disabled={isLoading}
              />

              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Separator />

        <Controller
          name="newPassword"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Nouveau mot de passe</FieldLabel>

              <PasswordInput
                {...field}
                placeholder="••••••••"
                className="h-10"
                disabled={isLoading}
                id="newPassword"
              />
              <FieldDescription>
                Minimum 8 caractères, une majuscule, une minuscule, un chiffre, un caractère
                spécial.
              </FieldDescription>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="confirmNewPassword"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Confirmer le nouveau mot de passe</FieldLabel>
              <PasswordInput
                {...field}
                placeholder="••••••••"
                className="h-10"
                disabled={isLoading}
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
      <FormActions
        isLoading={isLoading}
        onCancel={onCancel}
        submitLabel="Changer le mot de passe"
      />
    </form>
  );
}

// ============================================================================
// 10. AdminInfoForm
// ============================================================================
/*
interface AdminInfoFormProps extends BaseFormProps {
  defaultValues?: Partial<UpdateAdminInput>;
  onSubmit: (data: UpdateAdminInput) => Promise<void>;
}

export function AdminInfoForm({
  defaultValues,
  onSubmit,
  onCancel,
  onSuccess,
}: AdminInfoFormProps): React.JSX.Element {
  const [isLoading, setIsLoading] = React.useState(false);

  const { control, handleSubmit } = useForm<UpdateAdminInput>({
    resolver: zodResolver(updateAdminSchema) as Resolver<UpdateAdminInput>,
    defaultValues: {
      department: '',
      ...defaultValues,
    },
  });

  const submit = async (data: UpdateAdminInput) => {
    setIsLoading(true);
    try {
      await onSubmit(data);
      toast.success('Informations administrateur mises à jour');
      onSuccess?.();
      onCancel?.();
    } catch {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <FieldGroup>
        <Controller
          name="department"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>
                <Building2 className="h-3.5 w-3.5 inline mr-1" />
                Département *
              </FieldLabel>
              <Input {...field} placeholder="IT, Support, Gestion..." className="h-10" />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
      <FormActions isLoading={isLoading} onCancel={onCancel} />
    </form>
  );
}
*/
