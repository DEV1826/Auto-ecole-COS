// src/features/candidats/components/FormationSelector.tsx

/**
 * @module features/candidats/components/FormationSelector
 * @description
 * Sélecteur visuel de formation pour le formulaire d’inscription d’un candidat.
 * Affiche une grille de cartes (une par formation) avec :
 * - Nom de la formation
 * - Prix total
 * - Heures code / conduite
 * - Icône / image de la catégorie de permis
 * - Radio bouton de sélection
 *
 * Charge les formations via le store `useFormations`.
 * Expose un callback `onSelect(formationId, categorie)` vers le parent.
 *
 * @author Stive Junior
 * @version 1.0.0
 */

'use client';

import * as React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useFormations } from '@/hooks/use.formations';
import type { Formation } from '@/types/formations.types';
import { CATEGORIE_PERMIS_CONFIG, type CategoriePermis } from '@/types/enums';
import { Fuel, Clock, Coins } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface FormationSelectorProps {
    /** ID de la formation pré‑sélectionnée (par défaut, la première de catégorie B) */
    defaultFormationId?: number;
    /** Callback appelé lors du choix d’une formation – transmet l’ID et la catégorie */
    onSelect: (formationId: number, categorie: CategoriePermis) => void;
    /** État de chargement (surcharge optionnelle) */
    isLoading?: boolean;
    /** Classes additionnelles */
    className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composant : carte de formation
// ─────────────────────────────────────────────────────────────────────────────

interface FormationCardProps {
    formation: Formation;
    isSelected: boolean;
    onSelect: (id: number) => void;
}

function FormationCard({ formation, isSelected, onSelect }: FormationCardProps) {
    const { id, nom, prixTotal, heuresCode, heuresConduite, categorie } = formation;
    const catCfg = CATEGORIE_PERMIS_CONFIG[categorie];
    const Icon = catCfg?.icon || Fuel;

    const imageUrl = `/images/permis/${categorie}.png`;

    return (
        <div
            className={cn(
                'relative flex flex-col items-start gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer',
                isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 ring-2 ring-blue-500/20'
                    : 'border-border hover:border-blue-300 hover:bg-accent/30'
            )}
            onClick={() => onSelect(id)}
        >
            {/* Radio (cachée mais utilisée pour l'accessibilité) */}
            <RadioGroupItem value={id.toString()} id={`formation-${id}`} className="mt-1 shrink-0" />

            {/* Image illustrative */}
            <div className="shrink-0  rounded-md bg-muted/30 flex items-center justify-center overflow-hidden">
                <img
                    src={imageUrl}
                    alt={categorie}
                    className="size-full object-contain"
                    onError={(e) => {
                        // Fallback sur l'icône Lucide si l'image n'existe pas
                        (e.target as HTMLImageElement).style.display = 'none';
                    }}
                />
                {!imageUrl && <Icon className="w-8 h-8 text-muted-foreground" />}

            </div>

            {/* Informations */}
            <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h4 className="font-semibold text-foreground">{nom}</h4>

                </div>
                <div className="flex flex-wrap flex-col gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Coins className="h-3 w-3" />
                        {prixTotal.toLocaleString('fr-FR')} FCFA
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {heuresCode}h code
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {heuresConduite}h conduite
                    </span>
                    <span className="text-xs inline-flex font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        {catCfg?.label?.split('—')[0] || categorie}
                    </span>
                </div>
            </div>

            {/* Badge de sélection (optionnel) */}
            {isSelected && (
                <div className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold">
                    ✓
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sélecteur de formations – grille de cartes avec radio.
 * Charge les formations actives via le store.
 */
export function FormationSelector({
    defaultFormationId,
    onSelect,
    isLoading: externalLoading,
    className,
}: FormationSelectorProps): React.JSX.Element {
    const { formations, loading, getAll } = useFormations();

    // Calculer l'ID par défaut basé sur les formations disponibles
    const defaultSelectedId = React.useMemo(() => {
        if (formations.length === 0) return null;
        if (defaultFormationId) {
            const found = formations.find((f) => f.id === defaultFormationId);
            if (found) return found.id;
        }
        // Sinon, priorité à la catégorie B
        const bFormation = formations.find((f) => f.categorie === 'B');
        if (bFormation) return bFormation.id;
        // Dernier recours : première formation
        return formations[0].id;
    }, [formations, defaultFormationId]);

    const [selectedId, setSelectedId] = React.useState<number | null>(null);

    // Chargement initial des formations
    React.useEffect(() => {
        getAll().catch(console.error);
    }, [getAll]);

    // Synchroniser le callback onSelect avec la sélection par défaut
    // N'appelle que le callback externe, sans mettre à jour l'état interne
    React.useEffect(() => {
        if (defaultSelectedId && !selectedId) {
            const selected = formations.find((f) => f.id === defaultSelectedId);
            if (selected) {
                onSelect(defaultSelectedId, selected.categorie);
            }
        }
    }, [defaultSelectedId, selectedId, formations, onSelect]);

    const handleSelect = (id: number) => {
        const formation = formations.find((f) => f.id === id);
        if (formation) {
            setSelectedId(id);
            onSelect(formation.id, formation.categorie);
        }
    };

    const isLoading = externalLoading ?? loading;

    if (isLoading) {
        return (
            <div className={cn('space-y-3', className)}>
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-3 p-4 rounded-lg border">
                        <Skeleton className="h-16 w-16 rounded-md" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <div className="flex gap-2">
                                <Skeleton className="h-3 w-16" />
                                <Skeleton className="h-3 w-16" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (formations.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                Aucune formation active disponible. Veuillez contacter l’administrateur.
            </div>
        );
    }

    return (
        <RadioGroup
            value={(defaultSelectedId || selectedId)?.toString() ?? ''}
            onValueChange={(val) => handleSelect(Number(val))}
            className={cn('space-y-3 grid grid-cols-3', className)}
        >
            {formations.map((formation) => (
                <FormationCard
                    key={formation.id}
                    formation={formation}
                    isSelected={(defaultSelectedId || selectedId) === formation.id}
                    onSelect={handleSelect}
                />
            ))}
        </RadioGroup>
    );
}