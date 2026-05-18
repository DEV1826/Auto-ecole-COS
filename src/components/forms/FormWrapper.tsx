/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * @module components/forms/FormWrapper
 * @description
 * Layout wrapper pour les pages de création et d'édition de formulaire.
 *
 * ## Design
 * - **Desktop** : panneau de prévisualisation sticky à gauche (w-72),
 *   formulaire en carte à droite avec en-tête, contenu et pied d'actions.
 * - **Mobile** : aperçu repliable en accordéon en haut, formulaire défilant en dessous,
 *   boutons d'action collants en bas.
 *
 * ## Thème
 * - Couleurs bleues (blue-700 / blue-800)
 * - Ombres douces, bordures arrondies `rounded-2xl`, transitions fluides
 * - Mode sombre intégral
 *
 * ## Accessibilité
 * - Le bouton de soumission supporte un état de chargement (Loader2 animé)
 * - Le panneau preview est aria-live="polite" pour annoncer les mises à jour
 *
 * ## Usage
 * ```tsx
 * <FormWrapper
 *   title="Nouveau candidat"
 *   description="Renseignez les informations du candidat."
 *   icon={UserPlus}
 *   onSubmit={handleSubmit}
 *   onCancel={() => navigate(-1)}
 *   isSubmitting={isPending}
 *   preview={<CandidatPreviewCard data={formData} />}
 *   previewTitle="Aperçu du candidat"
 * >
 *   <CandidatCreateForm data={formData} onChange={handleFormChange} />
 * </FormWrapper>
 * ```
 *
 * @author Stive Junior
 * @version 1.0.0
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    ChevronLeft,
    Save,
    Loader2,
    Eye,
    ChevronDown,
    ChevronUp,
    type LucideIcon,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Props standardisées pour tout composant formulaire utilisé dans le wrapper.
 * Compatible avec le pattern `StepFormProps` du MultiStepForm.
 */
export interface FormPageProps<T = Record<string, any>> {
    /** Données courantes du formulaire */
    data: T;
    /**
     * Callback appelé à chaque changement de valeur.
     * @param patch - Données mises à jour (partielles)
     * @param isValid - `true` si le formulaire est valide
     */
    onChange: (patch: Partial<T>, isValid: boolean) => void;
    /** Désactiver les champs pendant la soumission */
    isSubmitting?: boolean;
}

/**
 * Props du composant FormWrapper.
 */
export interface FormWrapperProps {
    /** Titre de la page affiché dans l'en-tête de la carte */
    title: string;
    /** Description optionnelle */
    description?: string;
    /** Icône Lucide pour l'en-tête */
    icon?: LucideIcon;
    /* Couleur de fond de l'icône (ex: "bg-blue-700") */
    iconColor?: string;
    /** Callback de soumission (appelé par le bouton Enregistrer) */
    onSubmit: () => void;
    /** Callback d'annulation (retour page précédente) */
    onCancel?: () => void;
    /** État de chargement (désactive le bouton, affiche le spinner) */
    isSubmitting?: boolean;
    /** Valide le formulaire */
    isValid?: boolean;
    /** Mode édition (change le label du bouton) */
    isEditMode?: boolean;
    /** Contenu du formulaire */
    children: React.ReactNode;
    /** Contenu du panneau de prévisualisation */
    preview?: React.ReactNode;
    /** Titre du panneau de prévisualisation */
    previewTitle?: string;
    /** Label personnalisé du bouton de soumission */
    submitLabel?: string;
    /** Label personnalisé du bouton d'annulation */
    cancelLabel?: string;
    /** Classes CSS additionnelles */
    className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composant : panneau de prévisualisation
// ─────────────────────────────────────────────────────────────────────────────

interface PreviewPanelProps {
    title: string;
    children: React.ReactNode;
    className?: string;
}

function PreviewPanel({ title, children, className }: PreviewPanelProps) {
    return (
        <div className={cn("bg-card border rounded-md shadow-sm overflow-hidden", className)}>
            {/* En-tête du panneau */}
            <div className="px-4 py-3 border-b bg-linear-to-r from-blue-50/80 to-transparent dark:from-blue-950/30 flex items-center gap-2">
                <div className="flex items-center justify-center h-6 w-6 rounded-md bg-blue-100 dark:bg-blue-900/50">
                    <Eye className="h-3.5 w-3.5 text-blue-700 dark:text-blue-400" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            </div>
            {/* Contenu */}
            <div
                className="p-4"
                aria-live="polite"
                aria-label={`Aperçu : ${title}`}
            >
                {children}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant FormWrapper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Layout wrapper pour les pages de création et d'édition.
 * Gère uniquement le layout, la navigation et le bouton de soumission.
 * La validation est déléguée au formulaire enfant via le pattern `onChange`.
 */
export default function FormWrapper({
    title,
    description,
    icon: Icon,
    iconColor = 'bg-blue-700',
    onSubmit,
    onCancel,
    isValid,
    isSubmitting = false,
    isEditMode = false,
    children,
    preview,
    previewTitle = 'Aperçu',
    submitLabel,
    cancelLabel = 'Annuler',
    className,
}: FormWrapperProps) {
    const [mobilePreviewOpen, setMobilePreviewOpen] = React.useState(false);

    const resolvedSubmitLabel = submitLabel ?? (isEditMode ? 'Enregistrer les modifications' : 'Créer');

    return (
        <div className={cn('w-full', className)}>
            <div className="flex flex-col lg:flex-row gap-6 items-start">

                {/* ── Panneau Prévisualisation ─────────────────────────────────────── */}
                {preview && (
                    <>
                        {/* Mobile : accordéon repliable */}
                        <div className="lg:hidden w-full">
                            <button
                                type="button"
                                onClick={() => setMobilePreviewOpen((o) => !o)}
                                className={cn(
                                    'w-full flex items-center justify-between px-4 py-3 rounded-md border',
                                    'bg-card text-sm font-medium text-muted-foreground hover:text-foreground',
                                    'transition-colors duration-150',
                                    mobilePreviewOpen && 'border-blue-200 dark:border-blue-800'
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <span>{previewTitle}</span>
                                    {/* Indicateur live */}
                                    <span className="flex h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                                </div>
                                {mobilePreviewOpen ? (
                                    <ChevronUp className="h-4 w-4 shrink-0" />
                                ) : (
                                    <ChevronDown className="h-4 w-4 shrink-0" />
                                )}
                            </button>

                            <AnimatePresence initial={false}>
                                {mobilePreviewOpen && (
                                    <motion.div
                                        key="mobile-preview"
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                                        className="overflow-hidden"
                                    >
                                        <div className="pt-3">
                                            <PreviewPanel title={previewTitle} className="sticky top-6">{preview}</PreviewPanel>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Desktop : sidebar sticky */}
                        <div className="hidden lg:block w-72 shrink-0 sticky top-6 self-start">
                            <PreviewPanel title={previewTitle}>{preview}</PreviewPanel>
                        </div>
                    </>
                )}

                {/* ── Formulaire ──────────────────────────────────────────────────── */}
                <div className="flex-1 min-w-0">
                    <div className="bg-card border rounded-md shadow-sm overflow-hidden">

                        {/* En-tête de la carte */}
                        <div className="px-6 pt-6 pb-5 border-b bg-linear-to-br from-blue-50/60 via-transparent to-transparent dark:from-blue-950/25 dark:via-transparent">
                            <div className="flex items-start gap-3">
                                {Icon && (
                                    <div className={`flex items-center justify-center h-11 w-11 rounded-md ${iconColor} text-white shadow-md shrink-0 mt-0.5`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-xl font-bold tracking-tight text-foreground truncate">
                                        {title}
                                    </h2>
                                    {description && (
                                        <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                                            {description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Contenu du formulaire */}
                        <div className="px-6 py-6">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key="form-content"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.18, ease: 'easeOut' }}
                                >
                                    {children}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <Separator />

                        {/* Pied : boutons d'action */}
                        <div className="px-6 py-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 bg-muted/20 dark:bg-muted/10">
                            {/* Bouton Annuler */}
                            <div>
                                {onCancel && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={onCancel}
                                        disabled={isSubmitting}
                                        className="gap-1.5 text-muted-foreground hover:text-foreground rounded-md h-10"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        {cancelLabel}
                                    </Button>
                                )}
                            </div>

                            {/* Bouton Enregistrer */}
                            <Button
                                type="button"
                                onClick={onSubmit}
                                disabled={isSubmitting || (!isValid && !isEditMode) || (!isValid && isEditMode)}
                                className={cn(
                                    'min-w-47.5 h-10 rounded-md text-sm font-semibold text-white gap-2',
                                    'bg-blue-700 hover:bg-blue-800',
                                    'shadow-sm hover:shadow-md',
                                    'transition-all duration-200',
                                    'disabled:opacity-60 disabled:cursor-not-allowed'
                                )}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Traitement en cours…
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        {resolvedSubmitLabel}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}