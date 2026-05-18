// src/components/header/GlobalSearchCommand.tsx

/**
 * @module components/header/GlobalSearchCommand
 * @description Commande de recherche globale avec aperçu récent et découverte.
 */

import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Calendar,
  Car,
  Clock3,
  FileText,
  FolderSearch,
  GraduationCap,
  LayoutGrid,
  Receipt,
  Search,
  Sparkles,
  TrendingDown,
  UserRound,
  Users,
  Users2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import { Spinner } from '@/components/ui/spinner';
import { PROTECTED_ROUTES, route } from '@/config/routes';
import { useGlobalSearch } from '@/hooks/use.globalSearch';
import { cn, getAvatarUrl } from '@/lib/utils';
import type {
  GlobalSearchResult,
  RecentSearch,
  SearchResultItem,
} from '@/types/globalSearch.types';

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  type: string;
  url: string;
}

export interface SearchCommandProps {
  onSearch?: (query: string) => Promise<SearchResult[]>;
  onGetRecent?: () => Promise<SearchResult[]>;
  onGetFavorites?: () => Promise<SearchResult[]>;
  placeholder?: string;
  showSuggestions?: boolean;
  className?: string;
}

type CategoryKey = keyof GlobalSearchResult<SearchResultItem>;

interface CategoryConfig {
  key: CategoryKey;
  label: string;
  icon: React.ElementType;
  color: string;
  surface: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getUrl: (item: any) => string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getTitle: (item: any) => string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getSubtitle: (item: any) => string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getBadge?: (item: any) => React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getAvatar?: (item: any) => { src?: string; fallback: string };
}

const categories: CategoryConfig[] = [
  {
    key: 'candidats',
    label: 'Candidats',
    icon: Users,
    color: 'text-blue-600',
    surface: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-300',
    getUrl: (c) => route(PROTECTED_ROUTES.CANDIDATS.DETAIL(c.id), { id: c.id }),
    getTitle: (c) => `${c.prenom} ${c.nom}`,
    getSubtitle: (c) => c.email || c.telephone || `Cat. ${c.categorie}`,
    getBadge: (c) => (
      <Badge variant="outline" className="h-5 text-[10px]">
        {c.statut}
      </Badge>
    ),
    getAvatar: (c) => ({ src: getAvatarUrl(`${c.prenom?.[0] ?? ''}${c.nom?.[0] ?? ''}`), fallback: `${c.prenom?.[0] ?? ''}${c.nom?.[0] ?? ''}` }),
  },
  {
    key: 'moniteurs',
    label: 'Moniteurs',
    icon: UserRound,
    color: 'text-emerald-600',
    surface:
      'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300',
    getUrl: (m) => route(PROTECTED_ROUTES.MONITEURS.DETAIL(m.id), { id: m.id }),
    getTitle: (m) => `${m.prenom} ${m.nom}`,
    getSubtitle: (m) => m.specialite || m.email || m.telephone,
    getBadge: (m) => (
      <Badge variant={m.actif ? 'success' : 'secondary'} className="h-5 text-[10px]">
        {m.actif ? 'Actif' : 'Inactif'}
      </Badge>
    ),
    getAvatar: (m) => ({ src: getAvatarUrl(`${m.prenom?.[0] ?? ''}${m.nom?.[0] ?? ''}`), fallback: `${m.prenom?.[0] ?? ''}${m.nom?.[0] ?? ''}` }),
  },
  {
    key: 'vehicules',
    label: 'Véhicules',
    icon: Car,
    color: 'text-amber-600',
    surface: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-300',
    getUrl: (v) => route(PROTECTED_ROUTES.VEHICULES.DETAIL(v.id), { id: v.id }),
    getTitle: (v) => `${v.marque} ${v.modele}`,
    getSubtitle: (v) => `${v.immatriculation} - ${v.kilometrage.toLocaleString()} km`,
    getBadge: (v) => (
      <Badge variant="outline" className="h-5 text-[10px]">
        {v.statut}
      </Badge>
    ),
    getAvatar: (v) => ({ src: getAvatarUrl(v.immatriculation), fallback: v.immatriculation.slice(0, 2) }),
  },
  {
    key: 'formations',
    label: 'Formations',
    icon: GraduationCap,
    color: 'text-violet-600',
    surface:
      'bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-500/10 dark:text-violet-300',
    getUrl: (f) => route(PROTECTED_ROUTES.FORMATIONS.DETAIL(f.id), { id: f.id }),
    getTitle: (f) => f.nom,
    getSubtitle: (f) =>
      `${f.heuresConduite}h conduite / ${f.heuresCode}h code - ${f.prixTotal.toLocaleString()} FCFA`,
  },
  {
    key: 'examens',
    label: 'Examens',
    icon: Calendar,
    color: 'text-indigo-600',
    surface:
      'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300',
    getUrl: (e) => route(PROTECTED_ROUTES.EXAMENS.DETAIL(e.id), { id: e.id }),
    getTitle: (e) =>
      `${e.type === 'CODE' ? 'Code' : 'Conduite'} - ${e.candidat?.prenom ?? ''} ${e.candidat?.nom ?? ''
      }`,
    getSubtitle: (e) =>
      `${new Date(e.date).toLocaleDateString('fr-FR')} - ${e.centre || 'Centre inconnu'}`,
    getBadge: (e) => (
      <Badge variant="outline" className="h-5 text-[10px]">
        {e.resultat || 'Planifie'}
      </Badge>
    ),
  },
  {
    key: 'lecons',
    label: 'Leçons',
    icon: Calendar,
    color: 'text-sky-600',
    surface: 'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-500/10 dark:text-sky-300',
    getUrl: (l) => route(PROTECTED_ROUTES.PLANNING.DETAIL(l.id), { id: l.id }),
    getTitle: (l) => `${l.type} - ${l.candidat?.prenom ?? ''} ${l.candidat?.nom ?? ''}`,
    getSubtitle: (l) =>
      `${new Date(l.date).toLocaleDateString('fr-FR')} - ${l.duree} min - ${l.moniteur?.prenom ?? ''
      } ${l.moniteur?.nom ?? ''}`,
    getBadge: (l) => (
      <Badge variant="outline" className="h-5 text-[10px]">
        {l.statut}
      </Badge>
    ),
  },
  {
    key: 'paiements',
    label: 'Paiements',
    icon: Receipt,
    color: 'text-teal-600',
    surface: 'bg-teal-50 text-teal-700 border-teal-100 dark:bg-teal-500/10 dark:text-teal-300',
    getUrl: (p) => route(PROTECTED_ROUTES.PAIEMENTS.DETAIL(p.id), { id: p.id }),
    getTitle: (p) => `${p.montant.toLocaleString()} FCFA`,
    getSubtitle: (p) =>
      `${p.candidat?.prenom ?? ''} ${p.candidat?.nom ?? ''} - ${p.mode} - ${new Date(
        p.date
      ).toLocaleDateString('fr-FR')}`,
    getBadge: (p) => (
      <Badge variant="outline" className="h-5 text-[10px]">
        {p.reference || `#${p.id}`}
      </Badge>
    ),
  },
  {
    key: 'factures',
    label: 'Factures',
    icon: FileText,
    color: 'text-orange-600',
    surface:
      'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-500/10 dark:text-orange-300',
    getUrl: (f) => route(PROTECTED_ROUTES.FACTURES.DETAIL(f.id), { id: f.id }),
    getTitle: (f) => f.numero,
    getSubtitle: (f) =>
      `${f.montantTotal.toLocaleString()} FCFA - ${f.candidat?.prenom ?? ''} ${f.candidat?.nom ?? ''
      }`,
    getBadge: (f) => (
      <Badge variant="outline" className="h-5 text-[10px]">
        {f.statut}
      </Badge>
    ),
  },
  {
    key: 'depenses',
    label: 'Dépenses',
    icon: TrendingDown,
    color: 'text-rose-600',
    surface: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-300',
    getUrl: (d) => route(PROTECTED_ROUTES.DEPENSES.DETAIL(d.id), { id: d.id }),
    getTitle: (d) => `${d.categorie} - ${d.montant.toLocaleString()} FCFA`,
    getSubtitle: (d) =>
      `${d.fournisseur || 'Sans fournisseur'}${d.vehicule ? ` - ${d.vehicule.marque} ${d.vehicule.modele}` : ''
      }`,
  },
  {
    key: 'utilisateurs',
    label: 'Utilisateurs',
    icon: Users2,
    color: 'text-slate-600',
    surface:
      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-300',
    getUrl: (u) => route(PROTECTED_ROUTES.ADMIN.USERS.DETAIL(u.id), { id: u.id }),
    getTitle: (u) => `${u.prenom} ${u.nom}`,
    getSubtitle: (u) => u.email,
    getBadge: (u) => (
      <Badge variant="outline" className="h-5 text-[10px]">
        {u.role}
      </Badge>
    ),
    getAvatar: (u) => ({ fallback: `${u.prenom?.[0] ?? ''}${u.nom?.[0] ?? ''}` }),
  },
];

const categoryByKey = categories.reduce<Record<string, CategoryConfig>>((acc, category) => {
  acc[category.key] = category;
  return acc;
}, {});

const discoveryItems = [
  { label: 'Nouveau candidat', url: PROTECTED_ROUTES.CANDIDATS.CREATE, icon: Users },
  { label: 'Planning', url: PROTECTED_ROUTES.PLANNING.CALENDAR, icon: Calendar },
  { label: 'Paiement', url: PROTECTED_ROUTES.PAIEMENTS.CREATE, icon: Receipt },
  { label: 'Véhicules', url: PROTECTED_ROUTES.VEHICULES.LIST, icon: Car },
];

function getResultCount(results: GlobalSearchResult<SearchResultItem> | null): number {
  if (!results) return 0;
  return Object.values(results).reduce((count, value) => {
    return count + (Array.isArray(value) ? value.length : 0);
  }, 0);
}

function getRecentLabel(search: RecentSearch): string {
  return formatDistanceToNow(search.timestamp, { addSuffix: true, locale: fr });
}

export function SearchCommand({
  placeholder = 'Rechercher un candidat, moniteur, véhicule...',
  className,
}: SearchCommandProps = {}): React.JSX.Element {
  const navigate = useNavigate();
  const {
    results,
    loading,
    recentSearches,
    search,
    clearResults,
    addRecentSearch,
    loadRecentSearches,
  } = useGlobalSearch();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [debouncedQuery, setDebouncedQuery] = React.useState('');
  const lastSubmittedQueryRef = React.useRef('');

  React.useEffect(() => {
    loadRecentSearches();
  }, [loadRecentSearches]);

  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 450);
    return () => window.clearTimeout(timer);
  }, [query]);

  React.useEffect(() => {
    if (debouncedQuery.length >= 2) {
      if (debouncedQuery === lastSubmittedQueryRef.current) return;
      lastSubmittedQueryRef.current = debouncedQuery;
      search(debouncedQuery).catch(console.error);
      return;
    }

    if (debouncedQuery.length === 0) {
      lastSubmittedQueryRef.current = '';
      clearResults();
    }
  }, [debouncedQuery, search, clearResults]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
        if (!open) setQuery('');
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open]);

  const hasQuery = debouncedQuery.length >= 2;
  const resultCount = getResultCount(results);
  const hasResults = resultCount > 0;
  const isLoading = loading && hasQuery;

  const closeSearch = React.useCallback(() => {
    setOpen(false);
    setQuery('');
    clearResults();
  }, [clearResults]);

  const handleNavigate = React.useCallback(
    (url: string) => {
      navigate(url);
      closeSearch();
    },
    [closeSearch, navigate]
  );

  const handleSelectResult = React.useCallback(
    (category: CategoryConfig, item: SearchResultItem) => {
      addRecentSearch({
        id: `${category.key}-${item.id}-${Date.now()}`,
        query: category.getTitle(item),
        category: category.key,
        title: category.getTitle(item),
        icon: category.label,
        timestamp: new Date(),
        itemId: item.id,
      });
      handleNavigate(category.getUrl(item));
    },
    [addRecentSearch, handleNavigate]
  );

  const handleSelectRecent = React.useCallback(
    (recent: RecentSearch) => {
      const category = categoryByKey[recent.category];
      if (category && recent.itemId) {
        handleNavigate(category.getUrl({ id: recent.itemId }));
        return;
      }

      setQuery(recent.query);
    },
    [handleNavigate]
  );

  return (
    <>
      <div className={cn('hidden w-full max-w-md lg:block', className)}>
        <Button
          variant="outline"
          className="h-10 w-full justify-start gap-3 rounded-md border-input/60 bg-background/80 px-1 text-muted-foreground shadow-sm transition hover:border-primary/30 hover:bg-background"
          onClick={() => setOpen(true)}
        >
          <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Search className="size-4" />
          </span>
          <span className="min-w-0 flex-1 truncate text-left font-normal">
            Recherche globale...
          </span>
          <KbdGroup className="ml-auto">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[86vh] overflow-hidden p-0 shadow-2xl sm:max-w-3xl">
          <DialogTitle className="sr-only">Recherche globale</DialogTitle>
          <DialogDescription className="sr-only">
            Recherchez dans les données de l'auto-école.
          </DialogDescription>

          <Command
            className={cn(
              'min-h-130 flex-1 rounded-md! bg-background p-0',
              '**:data-[slot=command-input-wrapper]:border-b **:data-[slot=command-input-wrapper]:p-3',
              '**:data-[slot=input-group]:h-12! **:data-[slot=input-group]:rounded-md!',
              '**:data-[slot=command-input]:text-[15px]',
              '**:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-2'
            )}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <FolderSearch className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    Recherche globale
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    Candidats, planning, finances, véhicules et administration
                  </p>
                </div>
              </div>
              <Badge
                variant="secondary"
                className="hidden h-7 gap-1 rounded-md px-2 text-[11px] sm:flex"
              >
                <LayoutGrid className="size-3.5" />
                {hasResults
                  ? `${resultCount} resultat${resultCount > 1 ? 's' : ''}`
                  : 'Auto-ecole COS'}
              </Badge>
            </div>

            <CommandInput placeholder={placeholder} value={query} onValueChange={setQuery} />

            <CommandList className="max-h-[64vh] px-2 py-2">
              {!hasQuery && (
                <div className="space-y-4 p-1">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-md border bg-muted/30 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <Clock3 className="size-4" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold">Recherches recentes</p>
                          <p className="text-xs text-muted-foreground">Reprenez rapidement</p>
                        </div>
                      </div>

                      {recentSearches.length > 0 ? (
                        <div className="space-y-1">
                          {recentSearches.slice(0, 4).map((recent) => {
                            const category = categoryByKey[recent.category];
                            const Icon = category?.icon ?? Clock3;

                            return (
                              <button
                                key={recent.id}
                                type="button"
                                onClick={() => handleSelectRecent(recent)}
                                className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-muted"
                              >
                                <span
                                  className={cn(
                                    'flex size-9 shrink-0 items-center justify-center rounded-md border',
                                    category?.surface
                                  )}
                                >
                                  <Icon className="size-4" />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-medium">
                                    {recent.title}
                                  </span>
                                  <span className="block truncate text-xs text-muted-foreground">
                                    {category?.label ?? recent.category} - {getRecentLabel(recent)}
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex min-h-50 flex-col items-center justify-center rounded-md border border-dashed bg-background/60 px-4 text-center">
                          <Sparkles className="mb-2 size-6 text-primary/70" />
                          <p className="text-sm font-medium">Aucun recent pour le moment</p>
                          <p className="mt-1 max-w-52 text-xs text-muted-foreground">
                            Les fiches ouvertes depuis la recherche apparaitront ici.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="rounded-md border bg-background p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="flex size-8 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600">
                          <Sparkles className="size-4" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold">Decouvrir</p>
                          <p className="text-xs text-muted-foreground">Acces utiles</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {discoveryItems.map((item) => (
                          <button
                            key={item.url}
                            type="button"
                            onClick={() => handleNavigate(item.url)}
                            className="flex flex-col items-start gap-3 rounded-md border bg-muted/20 p-3 text-left transition-colors hover:bg-muted"
                          >
                            <span className="flex size-9 items-center justify-center rounded-md bg-background text-primary shadow-sm">
                              <item.icon className="size-4" />
                            </span>
                            <span className="text-xs font-medium leading-tight">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
                  <Spinner className="size-7 text-primary" />
                  <p className="text-sm font-medium">Recherche en cours...</p>
                </div>
              )}

              {!isLoading && hasQuery && !hasResults && (
                <CommandEmpty className="py-0">
                  <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
                    <div className="relative mb-5">
                      <div className="flex size-20 items-center justify-center rounded-md border bg-muted/40">
                        <FolderSearch className="size-9 text-muted-foreground" />
                      </div>
                      <span className="absolute -right-2 -top-2 flex size-8 items-center justify-center rounded-md bg-background shadow-sm ring-1 ring-border">
                        <Search className="size-4 text-primary" />
                      </span>
                    </div>
                    <p className="text-base font-semibold text-foreground">
                      Aucune ressource trouvee
                    </p>
                    <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                      Aucun candidat, moniteur, vehicule, paiement ou document ne correspond a "
                      {debouncedQuery}".
                    </p>
                  </div>
                </CommandEmpty>
              )}

              {!isLoading && hasQuery && hasResults && (
                <div className="space-y-1 p-1">
                  {categories.map((category) => {
                    const items = results?.[category.key] || [];
                    if (items.length === 0) return null;

                    return (
                      <React.Fragment key={category.key}>
                        <CommandGroup
                          heading={`${category.label} (${items.length})`}
                          className="**:[[cmdk-group-heading]]:sr-only"
                        >
                          <div className="mb-1 flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground">
                            <category.icon className={cn('size-4', category.color)} />
                            <span>{category.label}</span>
                            <Badge variant="secondary" className="ml-auto h-5 text-[10px]">
                              {items.length}
                            </Badge>
                          </div>
                          {items.map((item: SearchResultItem, index: number) => (
                            <CommandItem
                              key={`${category.key}-${item.id}-${index}`}
                              value={`${category.key}-${category.getTitle(item)}-${category.getSubtitle(item)}`}
                              onSelect={() => handleSelectResult(category, item)}
                              className="group flex items-start gap-3 rounded-md p-2.5"
                              showCheckIcon={false}
                            >
                              <Avatar className="size-10 rounded-md">
                                {category.getAvatar ? (
                                  <>
                                    <AvatarImage src={category.getAvatar(item).src} />
                                    <AvatarFallback className="rounded-md bg-muted text-xs">
                                      {category.getAvatar(item).fallback.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </>
                                ) : (
                                  <AvatarFallback
                                    className={cn(
                                      'rounded-md border bg-muted text-xs',
                                      category.color
                                    )}
                                  >
                                    <category.icon className="size-4" />
                                  </AvatarFallback>
                                )}
                              </Avatar>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="truncate text-sm font-semibold">
                                    {category.getTitle(item)}
                                  </span>
                                  {category.getBadge?.(item)}
                                </div>
                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                  {category.getSubtitle(item)}
                                </p>
                              </div>

                              <CommandShortcut className="opacity-0 transition-opacity group-data-selected/command-item:opacity-100">
                                Ouvrir
                              </CommandShortcut>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                        <CommandSeparator className="my-1" />
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
