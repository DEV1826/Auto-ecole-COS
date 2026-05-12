'use client';

/**
 * @module components/forms/FileDropzone
 * @description
 * Zone de dépôt de fichiers élégante avec icônes personnalisées selon le type de fichier.
 *
 * ## Fonctionnalités
 * - **Glisser‑déposer** ou **clic** pour sélectionner un fichier.
 * - **Icône adaptative** : image, PDF, vidéo, document générique.
 * - **Prévisualisation** miniature pour les images.
 * - **Carte de fichier** minimaliste : icône, nom, type, taille, bouton de suppression.
 * - Validation des types MIME et de la taille maximale.
 * - Messages d'erreur contextuels.
 * - Design émeraude, bordures pointillées, transitions fluides.
 * - Responsive et accessible (aria, clavier).
 *
 * ## Ressources d'icônes
 * Les icônes sont chargées depuis `/images/icons/` (pdf.svg, file-image.svg, file-video.svg, etc.).
 *
 * @example
 * ```tsx
 * <FileDropzone
 *   value={file}
 *   onChange={setFile}
 *   accept="image/png,image/jpeg,application/pdf"
 *   maxSize={5 * 1024 * 1024}
 *   label="Pièce justificative"
 *   description="Formats acceptés : PNG, JPEG, PDF (max 5 Mo)"
 * />
 * ```
 *
 * @see {@link https://ui.shadcn.com/docs/components/button} Button
 * @see {@link https://developer.mozilla.org/fr/docs/Web/API/HTML_Drag_and_Drop_API} Drag & Drop API
 *
 * @author Stive Junior
 * @version 2.0.0
 */

import * as React from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface FileDropzoneProps {
  value: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
  maxSize?: number;
  label?: string;
  description?: string;
  browseLabel?: string;
  dropLabel?: string;
  className?: string;
  disabled?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Détermination de l'icône selon le type MIME
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retourne le chemin de l'icône correspondant au type de fichier.
 * Priorité : image > vidéo > PDF > document générique.
 */
function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '/images/icons/file-image.svg';
  if (mimeType.startsWith('video/')) return '/images/icons/file-video.svg';
  if (mimeType === 'application/pdf') return '/images/icons/pdf.svg';
  if (mimeType.includes('google') || mimeType.includes('drive'))
    return '/images/icons/google-drive.svg';
  return '/images/icons/file-text.svg'; // fallback générique (à créer au besoin)
}

/**
 * Extrait le type lisible à partir du type MIME.
 * Ex: "image/png" → "Image PNG"
 */
function getReadableType(mimeType: string): string {
  if (mimeType.startsWith('image/')) {
    const ext = mimeType.split('/')[1]?.toUpperCase() ?? '';
    return `Image ${ext}`;
  }
  if (mimeType.startsWith('video/')) {
    const ext = mimeType.split('/')[1]?.toUpperCase() ?? '';
    return `Vidéo ${ext}`;
  }
  if (mimeType === 'application/pdf') return 'PDF';
  return 'Document';
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

export function FileDropzone({
  value,
  onChange,
  accept = 'image/png,image/jpeg,image/webp,image/svg+xml,application/pdf',
  maxSize = 5 * 1024 * 1024,
  label,
  description,
  browseLabel = 'Parcourir',
  dropLabel = 'Glissez‑déposez vos fichiers ici',
  className,
  disabled = false,
}: FileDropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Nettoyage de l'URL objet
  React.useEffect(() => {
    if (value) {
      const url = URL.createObjectURL(value);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(null);
  }, [value]);

  // ── Validation ──────────────────────────────────────────────────────────

  const validateFile = (file: File): boolean => {
    setError(null);
    if (accept) {
      const acceptedTypes = accept.split(',').map((t) => t.trim().toLowerCase());
      const fileType = file.type.toLowerCase();
      const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
      const isAccepted =
        acceptedTypes.some((t) => fileType === t) || acceptedTypes.some((t) => t === fileExtension);
      if (!isAccepted) {
        setError(`Format non accepté. Types autorisés : ${accept}`);
        return false;
      }
    }
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      setError(`Fichier trop volumineux (max ${maxSizeMB} Mo)`);
      return false;
    }
    return true;
  };

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (validateFile(file)) onChange(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleRemove = () => {
    onChange(null);
    setError(null);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (validateFile(file)) onChange(file);
  };

  // ── Informations du fichier ─────────────────────────────────────────────
  const fileName = value?.name ?? '';
  const fileSize = value
    ? value.size < 1024 * 1024
      ? `${(value.size / 1024).toFixed(1)} Ko`
      : `${(value.size / (1024 * 1024)).toFixed(1)} Mo`
    : '';
  const fileType = value?.type ?? '';
  const isImage = value?.type.startsWith('image/');

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Libellé */}
      {label && (
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
      )}

      {/* Description (seulement si pas de fichier sélectionné) */}
      {description && !value && <p className="text-xs text-muted-foreground">{description}</p>}

      {/* Zone de drop */}
      <div
        role="form"
        tabIndex={0}
        aria-label={label ?? 'Zone de dépôt de fichier'}
        className={cn(
          'relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200',
          'p-6',
          'bg-muted/30 dark:bg-muted/10',
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 shadow-lg scale-[1.02]'
            : 'border-muted-foreground/20 hover:border-blue-400 dark:hover:border-blue-600',
          disabled && 'opacity-50 pointer-events-none',
          error && 'border-destructive/60 bg-destructive/5'
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled}
          aria-label={label ?? 'Sélectionner un fichier'}
        />

        {value ? (
          // ── Carte de fichier minimaliste ──────────────────────────
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Icône selon le type */}
              {isImage && preview ? (
                <img
                  src={preview}
                  alt={fileName}
                  className="h-10 w-10 rounded-xs object-cover border border-blue-100 dark:border-blue-900"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xs bg-white dark:bg-white/5 border border-border">
                  <img
                    src={getFileIcon(fileType)}
                    alt=""
                    className="h-6 w-6"
                    onError={(e) => {
                      // fallback si l'icône n'existe pas
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  {/* Fallback si l'icône ne charge pas */}
                  <FileText className="h-5 w-5 text-muted-foreground hidden" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{fileName}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>{getReadableType(fileType)}</span>
                  <span className="inline-block w-1 h-1 bg-muted-foreground rounded-xs" />
                  <span>{fileSize}</span>
                </div>
              </div>
            </div>

            {/* Bouton supprimer */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xs text-muted-foreground hover:text-destructive shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              aria-label="Retirer le fichier"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          // ── Zone vide ─────────────────────────────────────────────
          <div className="flex flex-col items-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xs bg-muted text-muted-foreground dark:bg-muted/50">
              <Upload className="h-6 w-6" />
            </div>
            <h4 className="mb-2 text-sm font-semibold text-foreground">{dropLabel}</h4>
            <span className="mb-4 block max-w-65 text-center text-xs text-muted-foreground">
              {description ?? `Glissez‑déposez ou parcourez. Formats acceptés : ${accept}`}
            </span>
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:text-blue-700">
              {browseLabel}
            </span>
          </div>
        )}
      </div>

      {/* Message d'erreur */}
      {error && (
        <p className="text-xs text-destructive mt-1 flex items-center gap-1">
          <X className="h-3.5 w-3.5" />
          {error}
        </p>
      )}
    </div>
  );
}
