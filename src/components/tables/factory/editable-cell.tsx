/**
 * @module tables/factory/editable-cell
 * @description Composant de cellule éditable inline avec validation et feedback
 */

import * as React from 'react';
import { Pencil, Check, X, Loader2, Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { cn } from '@/lib/utils';
import type { EditType, SelectOption } from './types';

export interface EditableCellProps<TData, TValue> {
  value: TValue;
  row: TData;
  editType: EditType;
  options?: SelectOption[];
  schema?: z.ZodType<TValue>;
  validate?: (value: TValue, row: TData) => string | null | Promise<string | null>;
  onSave: (row: TData, value: TValue) => Promise<void>;
  format?: (value: TValue, row: TData) => React.ReactNode;
  placeholder?: string;
  readOnly?: boolean;
  cellClassName?: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

/**
 * Cellule éditable inline avec validation Zod et feedback utilisateur.
 */
export function EditableCell<TData, TValue>({
  value,
  row,
  editType,
  options = [],
  schema,
  validate,
  onSave,
  format,
  placeholder = 'Saisir...',
  readOnly = false,
  cellClassName,
  min,
  max,
  step,
  unit,
}: EditableCellProps<TData, TValue>) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState<TValue>(value);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleEdit = () => {
    if (readOnly) return;
    setEditValue(value);
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
  };

  // Prévenir la propagation des événements pendant l'édition
  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Escape') handleCancel();
    if (e.key === 'Enter') handleSave();
  };

  const handleSave = async () => {
    let validationError: string | null = null;

    if (schema) {
      try {
        await schema.parseAsync(editValue);
      } catch (err) {
        if (err instanceof z.ZodError) {
          validationError = err.issues[0]?.message || 'Valeur invalide';
        } else {
          validationError = 'Erreur de validation';
        }
      }
    }

    if (!validationError && validate) {
      validationError = await validate(editValue, row);
    }

    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    setIsLoading(true);
    try {
      await onSave(row, editValue);
      setIsEditing(false);
      toast.success('Modification enregistrée');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Mode lecture
  if (!isEditing) {
    const displayContent = format ? format(value, row) : (value ?? '-');
    return (
      <div
        className={cn('group flex items-center justify-between gap-1', cellClassName)}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <span className="truncate ">{displayContent?.toLocaleString()}</span>
        {!readOnly && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit();
            }}
          >
            <Pencil className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  // Mode édition
  const renderEditor = () => {
    const commonProps = {
      className: cn('h-8 w-full', error && 'border-destructive'),
      placeholder,
      disabled: isLoading,
      value: String(editValue ?? ''),
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setEditValue(e.target.value as TValue),
      onKeyDown: handleKeyDown,
      onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
      onClick: (e: React.MouseEvent) => e.stopPropagation(),
    };

    switch (editType) {
      case 'text':
        return <Input ref={inputRef as React.Ref<HTMLInputElement>} {...commonProps} />;
      case 'number':
        return (
          <Input
            ref={inputRef as React.Ref<HTMLInputElement>}
            type="number"
            className={cn('h-8 w-full', error && 'border-destructive')}
            placeholder={placeholder}
            disabled={isLoading}
            value={String(editValue ?? '')}
            onChange={(e) => setEditValue(e.target.valueAsNumber as TValue)}
            min={min}
            max={max}
            step={step}
          />
        );
      case 'textarea':
        return (
          <Textarea
            ref={inputRef as React.Ref<HTMLTextAreaElement>}
            {...commonProps}
            className="min-h-[80px]"
          />
        );
      case 'email':
        return (
          <Input ref={inputRef as React.Ref<HTMLInputElement>} type="email" {...commonProps} />
        );
      case 'phone':
        return <Input ref={inputRef as React.Ref<HTMLInputElement>} type="tel" {...commonProps} />;
      case 'url':
        return <Input ref={inputRef as React.Ref<HTMLInputElement>} type="url" {...commonProps} />;
      case 'password':
        return (
          <div className="relative">
            <Input
              ref={inputRef as React.Ref<HTMLInputElement>}
              type={showPassword ? 'text' : 'password'}
              {...commonProps}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-8 w-8"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        );
      case 'select':
        return (
          <Select
            value={String(editValue ?? '')}
            onValueChange={(val) => setEditValue(val as TValue)}
            disabled={isLoading}
          >
            <SelectTrigger
              className={cn('h-8 w-full', error && 'border-destructive')}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent onMouseDown={(e) => e.stopPropagation()}>
              {options.map((opt) => (
                <SelectItem
                  key={String(opt.value)}
                  value={String(opt.value)}
                  disabled={opt.disabled}
                >
                  {opt.icon && <opt.icon className="mr-2 h-4 w-4" />}
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'multi-select':
        return (
          <Select
            value={String(editValue ?? '')}
            onValueChange={(val) => setEditValue(val as TValue)}
            disabled={isLoading}
          >
            <SelectTrigger
              className={cn('h-8 w-full', error && 'border-destructive')}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent onMouseDown={(e) => e.stopPropagation()}>
              {options.map((opt) => (
                <SelectItem key={String(opt.value)} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'date':
        return (
          <DatePicker
            variant="default"
            mode="single"
            formatStr="yyyy-MM-dd"
            date={editValue ? new Date(editValue as string) : undefined}
            onSelect={(date) => setEditValue(date?.toISOString() as TValue)}
            disabled={isLoading}
            placeholder={placeholder}
          />
        );
      case 'datetime':
        return (
          <Input
            ref={inputRef as React.Ref<HTMLInputElement>}
            type="datetime-local"
            {...commonProps}
          />
        );
      case 'time':
        return <Input ref={inputRef as React.Ref<HTMLInputElement>} type="time" {...commonProps} />;
      case 'switch':
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={!!editValue}
              onCheckedChange={(checked) => setEditValue(checked as TValue)}
              disabled={isLoading}
            />
            <span className="text-sm text-muted-foreground">{editValue ? 'Oui' : 'Non'}</span>
          </div>
        );
      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={!!editValue}
              onCheckedChange={(checked) => setEditValue(checked as TValue)}
              disabled={isLoading}
            />
            <Label className="text-sm">{placeholder}</Label>
          </div>
        );
      case 'slider':
        return (
          <div className="flex flex-col gap-2">
            <Slider
              value={[(editValue as number) ?? 0]}
              onValueChange={([val]) => setEditValue(val as TValue)}
              min={min ?? 0}
              max={max ?? 100}
              step={step ?? 1}
              disabled={isLoading}
            />
            <div className="text-xs text-muted-foreground text-center">
              {String(editValue)} {unit}
            </div>
          </div>
        );
      default:
        return <Input ref={inputRef as React.Ref<HTMLInputElement>} {...commonProps} />;
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2" onMouseDown={(e) => e.stopPropagation()}>
        {renderEditor()}
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={(e) => {
            e.stopPropagation();
            handleSave();
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={(e) => {
            e.stopPropagation();
            handleCancel();
          }}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
