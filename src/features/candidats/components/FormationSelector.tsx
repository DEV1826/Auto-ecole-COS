// src/features/candidats/components/FormationSelector.tsx

'use client';

import * as React from 'react';
import { Clock, Coins, Fuel } from 'lucide-react';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { useFormations } from '@/hooks/use.formations';
import { cn, resolveAssetPath } from '@/lib/utils';
import { CATEGORIE_PERMIS_CONFIG, type CategoriePermis } from '@/types/enums';
import type { Formation } from '@/types/formations.types';

export interface FormationSelectorProps {
    defaultFormationId?: number;
    onSelect: (formationId: number, categorie: CategoriePermis) => void;
    isLoading?: boolean;
    className?: string;
}

interface FormationCardProps {
    formation: Formation;
    isSelected: boolean;
    onSelect: (id: number) => void;
}

function FormationCard({ formation, isSelected, onSelect }: FormationCardProps) {
    const { id, nom, prixTotal, heuresCode, heuresConduite, categorie } = formation;
    const catCfg = CATEGORIE_PERMIS_CONFIG[categorie];
    const Icon = catCfg?.icon || Fuel;
    const imageUrl = resolveAssetPath(`/images/permis/${categorie}.png`);

    return (
        <div
            className={cn(
                'relative flex cursor-pointer flex-col items-start gap-3 rounded-lg border-2 p-4 transition-all',
                isSelected
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20 dark:bg-blue-950/30'
                    : 'border-border hover:border-blue-300 hover:bg-accent/30'
            )}
            onClick={() => onSelect(id)}
        >
            <RadioGroupItem value={id.toString()} id={`formation-${id}`} className="mt-1 shrink-0" />

            <div className="flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted/30">
                <img
                    src={imageUrl}
                    alt={categorie}
                    className="size-full object-contain"
                    onError={(event) => {
                        (event.target as HTMLImageElement).style.display = 'none';
                    }}
                />
                {!imageUrl && <Icon className="h-8 w-8 text-muted-foreground" />}
            </div>

            <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="font-semibold text-foreground">{nom}</h4>
                </div>
                <div className="flex flex-col gap-3 text-xs text-muted-foreground">
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
                    <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        {catCfg?.label?.split('—')[0] || categorie}
                    </span>
                </div>
            </div>

            {isSelected && (
                <div className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
                    ✓
                </div>
            )}
        </div>
    );
}

export function FormationSelector({
    defaultFormationId,
    onSelect,
    isLoading: externalLoading,
    className,
}: FormationSelectorProps): React.JSX.Element {
    const { formations, loading, getAll } = useFormations();
    const activeFormations = React.useMemo(
        () => formations.filter((formation) => formation.actif !== false),
        [formations]
    );

    const defaultSelectedId = React.useMemo(() => {
        if (activeFormations.length === 0) return null;

        if (defaultFormationId) {
            const found = activeFormations.find((formation) => formation.id === defaultFormationId);
            if (found) return found.id;
        }

        const categoryBFormation = activeFormations.find((formation) => formation.categorie === 'B');
        if (categoryBFormation) return categoryBFormation.id;

        return activeFormations[0].id;
    }, [activeFormations, defaultFormationId]);

    const [selectedId, setSelectedId] = React.useState<number | null>(null);

    React.useEffect(() => {
        getAll({ actif: true, limit: 100 }).catch(console.error);
    }, [getAll]);

    React.useEffect(() => {
        if (defaultSelectedId && !selectedId) {
            const selected = activeFormations.find((formation) => formation.id === defaultSelectedId);
            if (selected) {
                onSelect(defaultSelectedId, selected.categorie);
            }
        }
    }, [activeFormations, defaultSelectedId, onSelect, selectedId]);

    const handleSelect = (id: number) => {
        const formation = activeFormations.find((item) => item.id === id);
        if (!formation) return;

        setSelectedId(id);
        onSelect(formation.id, formation.categorie);
    };

    const isLoading = externalLoading ?? loading;

    if (isLoading) {
        return (
            <div className={cn('space-y-3', className)}>
                {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex gap-3 rounded-lg border p-4">
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

    if (activeFormations.length === 0) {
        return (
            <div className="py-8 text-center text-muted-foreground">
                Aucune formation active disponible. Veuillez contacter l'administrateur.
            </div>
        );
    }

    return (
        <RadioGroup
            value={(defaultSelectedId || selectedId)?.toString() ?? ''}
            onValueChange={(value) => handleSelect(Number(value))}
            className={cn('grid grid-cols-3 space-y-3', className)}
        >
            {activeFormations.map((formation) => (
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
