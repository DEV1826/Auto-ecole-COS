// src/components/header/search-command.tsx

/**
 * @module components/header/search-command
 * @description Composant de recherche avancée avec command palette (Cmd+K / Ctrl+K)
 * @author Stive Junior
 * @version 2.1.0
 *
 * Ce composant intègre une palette de commande basée sur shadcn/ui et cmdk.
 * Il permet de rechercher des rendez-vous, patients, médecins, etc.
 * Il gère également les favoris et les récents.
 *
 * @example
 * ```tsx
 * import { SearchCommand } from '@/components/header/search-command';
 *
 * function MyComponent() {
 *   const handleSearch = async (query) => { ... };
 *   const getRecent = async () => { ... };
 *   const getFavorites = async () => { ... };
 *
 *   return (
 *     <SearchCommand
 *       onSearch={handleSearch}
 *       onGetRecent={getRecent}
 *       onGetFavorites={getFavorites}
 *       placeholder="Rechercher..."
 *       title="Recherche globale"
 *       showSuggestions
 *     />
 *   );
 * }
 * ```
 */

import * as React from 'react';
import { Search, FileText, Calendar, User, Pill, Settings, Star, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import { useNavigate } from 'react-router-dom';
import { Spinner } from '../ui/spinner';

// ============================================================
// TYPES
// ============================================================

export type SearchResultType =
  | 'appointment'
  | 'patient'
  | 'doctor'
  | 'medication'
  | 'settings'
  | 'page'
  | 'recent'
  | 'favorite';

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  type: SearchResultType;
  url: string;
  icon?: React.ReactNode;
  score?: number;
  lastUsed?: Date;
}

export interface SearchCommandProps {
  results?: SearchResult[];
  onSearch?: (query: string) => Promise<SearchResult[]>;
  onGetRecent?: () => Promise<SearchResult[]>;
  onGetFavorites?: () => Promise<SearchResult[]>;
  placeholder?: string;
  title?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  showSuggestions?: boolean;
}

// ============================================================
// UTILITAIRES
// ============================================================

function groupResultsByType(results: SearchResult[]): Map<string, SearchResult[]> {
  const groups = new Map<string, SearchResult[]>();
  for (const result of results) {
    let groupName = '';
    switch (result.type) {
      case 'appointment':
        groupName = 'Rendez-vous';
        break;
      case 'patient':
        groupName = 'Patients';
        break;
      case 'doctor':
        groupName = 'Médecins';
        break;
      case 'medication':
        groupName = 'Médicaments';
        break;
      case 'settings':
        groupName = 'Paramètres';
        break;
      case 'page':
        groupName = 'Pages';
        break;
      case 'recent':
        groupName = 'Récemment consultés';
        break;
      case 'favorite':
        groupName = 'Favoris';
        break;
      default:
        groupName = 'Autres';
    }
    if (!groups.has(groupName)) groups.set(groupName, []);
    groups.get(groupName)!.push(result);
  }
  return groups;
}

function getDefaultIcon(type: SearchResultType): React.ReactNode {
  switch (type) {
    case 'appointment':
      return <Calendar className="size-4" />;
    case 'patient':
      return <User className="size-4" />;
    case 'doctor':
      return <User className="size-4" />;
    case 'medication':
      return <Pill className="size-4" />;
    case 'settings':
      return <Settings className="size-4" />;
    case 'page':
      return <FileText className="size-4" />;
    case 'recent':
      return <Clock className="size-4" />;
    case 'favorite':
      return <Star className="size-4" />;
    default:
      return <FileText className="size-4" />;
  }
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

/**
 * Composant de recherche avancée avec command palette.
 * S'ouvre avec Cmd+K / Ctrl+K.
 *
 * @param {SearchCommandProps} props - Les propriétés du composant
 * @returns {React.ReactElement} Élément React
 */
export function SearchCommand({
  results = [],
  onSearch,
  onGetRecent,
  onGetFavorites,
  placeholder = 'Rechercher...',
  title = 'Recherche rapide',
  open: controlledOpen,
  onOpenChange,
  className,
  showSuggestions = true,
}: SearchCommandProps): React.ReactElement {
  const navigate = useNavigate();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<SearchResult[]>(results);
  const [recentResults, setRecentResults] = React.useState<SearchResult[]>([]);
  const [favoriteResults, setFavoriteResults] = React.useState<SearchResult[]>([]);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  // Charger les suggestions initiales (récents et favoris) lorsque la palette s'ouvre
  React.useEffect(() => {
    if (showSuggestions && open && !query) {
      const loadSuggestions = async () => {
        setLoading(true);
        try {
          const [recent, favorites] = await Promise.all([
            onGetRecent ? onGetRecent() : Promise.resolve([]),
            onGetFavorites ? onGetFavorites() : Promise.resolve([]),
          ]);
          setRecentResults(recent);
          setFavoriteResults(favorites);
        } catch (error) {
          console.error('Erreur lors du chargement des suggestions', error);
        } finally {
          setLoading(false);
        }
      };
      loadSuggestions();
    }
  }, [open, query, showSuggestions, onGetRecent, onGetFavorites]);

  // Raccourci clavier pour ouvrir/fermer la palette
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, setOpen]);

  // Gérer la recherche à chaque changement de query (avec debounce)
  React.useEffect(() => {
    if (!onSearch) return;
    const debounceTimeout = setTimeout(async () => {
      if (query.length === 0) {
        setSearchResults([]);
        return;
      }
      setLoading(true);
      try {
        const results = await onSearch(query);
        setSearchResults(results);
      } catch (error) {
        console.error('Erreur lors de la recherche', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(debounceTimeout);
  }, [query, onSearch]);

  const handleSelect = (result: SearchResult) => {
    navigate(result.url);
    setOpen(false);
    setQuery('');
  };

  const displayResults = React.useMemo(() => {
    if (query.length > 0) return searchResults;
    const combined = [...favoriteResults, ...recentResults];
    const unique = new Map<string, SearchResult>();
    for (const item of combined) {
      if (!unique.has(item.id)) unique.set(item.id, item);
    }
    return Array.from(unique.values());
  }, [query, searchResults, favoriteResults, recentResults]);

  const groupedResults = React.useMemo(() => groupResultsByType(displayResults), [displayResults]);
  const hasResults = displayResults.length > 0;

  const Trigger = (
    <div className={cn('hidden lg:block relative w-full max-w-md', className)}>
      <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Button
        variant="outline"
        className="w-full justify-start gap-2 pl-8 font-normal text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <span>{placeholder}</span>
        <KbdGroup className="ml-auto">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Button>
    </div>
  );

  return (
    <>
      {Trigger}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 shadow-lg sm:max-w-150">
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <DialogDescription className="sr-only">
            Utilisez la commande palette pour naviguer rapidement.
          </DialogDescription>
          <div className="border-b px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">
              Appuyez sur <Kbd className="mx-0.5 inline-flex">↵</Kbd> pour sélectionner,{' '}
              <Kbd className="mx-0.5 inline-flex">Esc</Kbd> pour fermer.
            </p>
          </div>
          <Command className="**:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 **:[[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 **:[[cmdk-input]]:h-12 **:[[cmdk-item]]:px-2 **:[[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
            <CommandInput placeholder={placeholder} onValueChange={setQuery} value={query} />
            <CommandList>
              {loading && <Spinner className="mx-auto my-4 size-6 text-primary" />}
              {!loading && query && !hasResults && (
                <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
              )}
              {!loading && hasResults && (
                <>
                  {Array.from(groupedResults.entries()).map(([group, items], idx) => (
                    <React.Fragment key={group}>
                      <CommandGroup heading={group}>
                        {items.map((item) => (
                          <CommandItem
                            key={item.id}
                            value={item.title}
                            onSelect={() => handleSelect(item)}
                            className="flex items-center gap-2"
                          >
                            {item.icon || getDefaultIcon(item.type)}
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{item.title}</span>
                              {item.description && (
                                <span className="text-xs text-muted-foreground">
                                  {item.description}
                                </span>
                              )}
                            </div>
                            {item.type === 'favorite' && (
                              <Star className="ml-auto size-3 text-yellow-500" />
                            )}
                            {item.type === 'recent' && (
                              <Clock className="ml-auto size-3 text-muted-foreground" />
                            )}
                            <CommandShortcut>↵</CommandShortcut>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      {idx < groupedResults.size - 1 && <CommandSeparator />}
                    </React.Fragment>
                  ))}
                </>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
