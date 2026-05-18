/* eslint-disable react-hooks/set-state-in-effect */
// src/features/admin/components/UserFormDialog.tsx

/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * @module features/admin/components/UserFormDialog
 * @description
 * Dialogue modal pour la création ou l'édition d'un utilisateur.
 * Utilise le formulaire `UserForm` et communique avec le store `useAuth`.
 *
 * ## Fonctionnalités
 * - Ouvre un modal avec le formulaire `UserForm`
 * - Gère la création (`createUser`) et la mise à jour (`updateUser`)
 * - Réinitialise le formulaire à chaque ouverture avec les données de l'utilisateur (édition) ou vide (création)
 * - Évite les boucles infinies de mise à jour grâce à une comparaison des références avec `useRef`
 * - Affiche des toasts de succès/erreur
 *
 * @author Stive Junior
 * @version 2.0.0
 */

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import UserForm from './UserForm';
import { useAuth } from '@/hooks/use.auth';
import type { Utilisateur, CreateUserParams } from '@/types/auth.types';

export interface UserFormDialogProps {
    /** État d'ouverture du dialogue */
    open: boolean;
    /** Callback de changement d'état d'ouverture */
    onOpenChange: (open: boolean) => void;
    /** Utilisateur à éditer (si undefined, mode création) */
    user?: Utilisateur | null;
    /** Callback exécuté après succès de la création/mise à jour */
    onSuccess?: () => void;
}

/**
 * Dialogue modal pour la création ou l'édition d'un utilisateur.
 */
export function UserFormDialog({ open, onOpenChange, user, onSuccess }: UserFormDialogProps) {
    const isEditMode = !!user;
    const { createUser, updateUser } = useAuth();

    const [formData, setFormData] = React.useState<Partial<CreateUserParams>>({});
    const [isFormValid, setIsFormValid] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    // Refs pour éviter les boucles infinies lors de la réinitialisation
    const prevUserRef = React.useRef<Utilisateur | null | undefined>(user);
    const prevOpenRef = React.useRef(open);

    // Réinitialisation du formulaire uniquement quand le dialogue s'ouvre ET que l'utilisateur a changé
    React.useEffect(() => {
        if (open && (user !== prevUserRef.current || prevOpenRef.current !== open)) {
            // Mettre à jour les données du formulaire
            if (user) {
                setFormData({ ...user, password: '' });
            } else {
                setFormData({});
            }
            setIsFormValid(false);
            prevUserRef.current = user;
        }
        prevOpenRef.current = open;
    }, [open, user]);

    const handleFormChange = React.useCallback((patch: any, isValid: boolean) => {
        setFormData(prev => ({ ...prev, ...patch }));
        setIsFormValid(isValid);
    }, []);

    const handleSubmit = React.useCallback(async () => {
        if (!isFormValid) return;
        setIsSubmitting(true);
        try {
            if (isEditMode && user) {
                await updateUser(user.id, formData);
                toast.success('Utilisateur mis à jour avec succès');
            } else {
                await createUser(formData as CreateUserParams);
                toast.success('Utilisateur créé avec succès');
            }
            onOpenChange(false);
            onSuccess?.();
        } catch (err: any) {
            toast.error(err?.message || 'Une erreur est survenue');
        } finally {
            setIsSubmitting(false);
        }
    }, [isFormValid, isEditMode, user, formData, updateUser, createUser, onOpenChange, onSuccess]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Modifier l’utilisateur' : 'Créer un utilisateur'}</DialogTitle>
                    <DialogDescription>
                        {isEditMode
                            ? 'Modifiez les informations de l’utilisateur.'
                            : 'Remplissez le formulaire pour créer un nouvel utilisateur (admin, secrétaire, moniteur).'}
                    </DialogDescription>
                </DialogHeader>
                <UserForm
                    data={formData}
                    onChange={handleFormChange}
                    isSubmitting={isSubmitting}
                    isEditMode={isEditMode}
                />
                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
                    <Button onClick={handleSubmit} disabled={!isFormValid || isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditMode ? 'Mettre à jour' : 'Créer'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}