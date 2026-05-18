'use client';

/**
 * @module ui/error-dialog
 * @description Dialogue d'erreur hautement configurable affichant des messages d'erreur système ou applicatifs.
 * Intègre une gestion d'icônes SVG dynamiques selon le thème actif (Clair/Sombre/Système).
 * 
 * 
 * 
 * <ErrorDialog
  open={isValidating}
  onOpenChange={setValidating}
  title="Validation Échouée"
  message="Certains champs requis contiennent des données incorrectes ou manquantes."
  details={[
    "Le champ 'Adresse Email' doit respecter un format valide (ex: utilisateur@domaine.fr).",
    "Le mot de passe doit comporter au moins 12 caractères.",
    "Le numéro de téléphone entré n'est pas conforme aux normes internationales."
  ]}
  closeText="Ignorer"
  actionText="Réessayer la validation"
  onAction={() => executerValidationFormulaire()}
/>
 */

import { useTheme } from 'next-themes';
import { ChevronDown } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/**
 * Interface définissant les propriétés acceptées par le composant ErrorDialog.
 */
export interface ErrorDialogProps {
    /** Contrôle l'état d'ouverture du dialogue */
    open: boolean;
    /** Fonction de rappel déclenchée lors du changement d'état d'ouverture */
    onOpenChange: (open: boolean) => void;
    /** Titre principal affiché en tête du dialogue. Valeur par défaut : "Erreur" */
    title?: string;
    /** Message d'erreur principal décrivant le problème rencontré */
    message: string;
    /** Détails techniques supplémentaires (chaîne unique ou tableau de chaînes pour une liste de validation) */
    details?: string | string[];
    /** Libellé personnalisé du bouton de fermeture principale. Valeur par défaut : "Fermer" */
    closeText?: string;
    /** Fonction de rappel optionnelle exécutée lors du clic sur le bouton d'action principale */
    onAction?: () => void;
    /** Libellé optionnel pour un bouton d'action secondaire (ex: "Réessayer") */
    actionText?: string;
}

export function ErrorDialog({
    open,
    onOpenChange,
    title = 'Erreur',
    message,
    details,
    closeText = 'Fermer',
    onAction,
    actionText,
}: ErrorDialogProps) {
    const { theme = 'system' } = useTheme();


    /**
     * Résout dynamiquement le chemin de l'icône SVG d'erreur située dans le dossier public.
     * Analyse si le mode sombre est actif, y compris lorsque le thème est défini sur 'system'.
     * 
     * @param currentTheme - Le thème actuellement retourné par Next-Themes
     * @returns Le chemin absolu vers l'image SVG correspondante
     */
    const getIconPath = (currentTheme: string | undefined): string => {


        const isDark =
            currentTheme === 'dark' ||
            (currentTheme === 'system' &&
                typeof window !== 'undefined' &&
                window.matchMedia('(prefers-color-scheme: dark)').matches);

        const iconName = isDark ? 'error-dark.svg' : 'error.svg';
        return `/images/error/${iconName}`;
    };

    // Évaluation de la présence et du format des détails fournis
    const hasDetails = details && (Array.isArray(details) ? details.length > 0 : true);

    return (
        <Dialog open={open} onOpenChange={onOpenChange} >
            <DialogContent className="sm:max-w-md border-border bg-popover text-foreground rounded-md shadow-2xl  transition-all duration-300">

                {/* En-tête du dialogue contenant l'icône et le titre */}
                <DialogHeader className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="shrink-0">
                            <img
                                src={getIconPath(theme)}
                                alt="Icône Erreur"
                                className="size-7 object-contain select-none"
                                draggable={false}
                            />
                        </div>
                        <DialogTitle className="text-lg font-bold tracking-tight text-red-600 dark:text-red-400">
                            {title}
                        </DialogTitle>
                    </div>

                    {/* Message principal */}
                    <DialogDescription className="text-sm text-foreground/90 font-medium leading-relaxed pt-1">
                        {message}
                    </DialogDescription>
                </DialogHeader>

                {/* Section technique détaillée conditionnelle */}
                {hasDetails && (
                    <div className="mt-4">
                        <details className="group border border-border bg-muted/50 rounded-md p-1 transition-all duration-200 open:bg-muted">
                            <summary className="flex items-center justify-between cursor-pointer list-none p-2 text-xs font-semibold text-muted-foreground hover:text-foreground select-none uppercase tracking-wider">
                                <span>Détails techniques</span>
                                <ChevronDown className="size-4 transition-transform duration-200 group-open:rotate-180 text-muted-foreground" />
                            </summary>

                            <div className="p-3 pt-1 border-t border-border/50 text-xs overflow-auto max-h-45 custom-scrollbar">
                                {Array.isArray(details) ? (
                                    <ul className="list-disc pl-4 space-y-1.5">
                                        {details.map((individualDetail, index) => (
                                            <li key={index} className="text-muted-foreground font-mono leading-normal wrap-break-word">
                                                {individualDetail}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-muted-foreground font-mono leading-normal wrap-break-word">
                                        {details}
                                    </p>
                                )}
                            </div>
                        </details>
                    </div>
                )}

                {/* Pied de page contenant les boutons de contrôle */}
                <DialogFooter className="mt-6 sm:justify-end gap-2 flex-col-reverse sm:flex-row">
                    <Button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        variant="outline"
                        className="w-full sm:w-auto bg-muted text-muted-foreground font-semibold rounded-md px-4 py-2 hover:bg-muted/80 border-border transition-colors text-[14px]"
                    >
                        {closeText}
                    </Button>

                    {onAction && actionText && (
                        <Button
                            type="button"
                            onClick={() => {
                                onAction();
                                onOpenChange(false);
                            }}
                            className="w-full sm:w-auto bg-primary text-primary-foreground font-semibold rounded-md px-4 py-2 hover:opacity-90 transition-opacity text-[14px]"
                        >
                            {actionText}
                        </Button>
                    )}
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
}