// src/store/globalSearch.store.ts

import { create } from 'zustand';
import type {
  GlobalSearchResult,
  SearchResultItem,
  RecentSearch,
} from '@/types/globalSearch.types';
import { formatErrorMessage } from '@/lib/helpers/error.helper';

interface GlobalSearchState {
  results: GlobalSearchResult<SearchResultItem> | null;
  loading: boolean;
  error: string | null;
  lastQuery: string;
  recentSearches: RecentSearch[];
}

interface GlobalSearchActions {
  search: (query: string) => Promise<GlobalSearchResult<SearchResultItem>>;
  clearResults: () => void;
  clearErrors: () => void;
  addRecentSearch: (search: RecentSearch) => void;
  removeRecentSearch: (id: string) => void;
  clearRecentSearches: () => void;
  loadRecentSearches: () => void;
}

type GlobalSearchStore = GlobalSearchState & GlobalSearchActions;

const RECENT_SEARCHES_STORAGE_KEY = 'global-search-recent';
const MAX_RECENT_SEARCHES = 10;
const SEARCH_CACHE_TTL_MS = 30_000;

const searchCache = new Map<
  string,
  { timestamp: number; results: GlobalSearchResult<SearchResultItem> }
>();
const inflightSearches = new Map<string, Promise<GlobalSearchResult<SearchResultItem>>>();
let latestSearchToken = 0;

const initialState: GlobalSearchState = {
  results: null,
  loading: false,
  error: null,
  lastQuery: '',
  recentSearches: [],
};

// Helper function to persist recent searches to localStorage
const persistRecentSearches = (searches: RecentSearch[]) => {
  try {
    localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(searches));
  } catch (error) {
    console.warn('Failed to persist recent searches:', error);
  }
};

// Helper function to load recent searches from localStorage
const loadRecentSearchesFromStorage = (): RecentSearch[] => {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored).map(
        (search: Omit<RecentSearch, 'timestamp'> & { timestamp: string }) => ({
          ...search,
          timestamp: new Date(search.timestamp),
        })
      );
    }
  } catch (error) {
    console.warn('Failed to load recent searches:', error);
  }
  return [];
};

export const useGlobalSearchStore = create<GlobalSearchStore>()((set, _get) => ({
  ...initialState,

  search: async (query: string) => {
    const normalizedQuery = query.trim();
    const cacheKey = normalizedQuery.toLocaleLowerCase('fr-FR');

    if (!normalizedQuery || normalizedQuery.length < 2) {
      set({
        results: null,
        error: 'La recherche doit contenir au moins 2 caractères.',
        loading: false,
      });
      throw new Error('Requête trop courte');
    }

    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < SEARCH_CACHE_TTL_MS) {
      set({ results: cached.results, loading: false, error: null, lastQuery: normalizedQuery });
      return cached.results;
    }

    const currentToken = ++latestSearchToken;
    set({ loading: true, error: null, lastQuery: normalizedQuery });

    try {
      let request = inflightSearches.get(cacheKey);
      if (!request) {
        request = window.api.globalSearch.search(normalizedQuery);
        inflightSearches.set(cacheKey, request);
      }

      const results = await request;
      searchCache.set(cacheKey, { timestamp: Date.now(), results });

      if (currentToken === latestSearchToken) {
        set({ results, loading: false, error: null, lastQuery: normalizedQuery });
      }
      return results;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors de la recherche');
      if (currentToken === latestSearchToken) {
        set({ loading: false, error: message });
      }
      throw new Error(message);
    } finally {
      inflightSearches.delete(cacheKey);
    }
  },

  clearResults: () => {
    latestSearchToken++;
    set({ results: null, lastQuery: '', loading: false });
  },
  clearErrors: () => set({ error: null }),

  addRecentSearch: (search: RecentSearch) => {
    set((state) => {
      // Eviter les doublons
      const filtered = state.recentSearches.filter((s) => s.query !== search.query);
      const updated = [search, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      persistRecentSearches(updated);
      return { recentSearches: updated };
    });
  },

  removeRecentSearch: (id: string) => {
    set((state) => {
      const updated = state.recentSearches.filter((s) => s.id !== id);
      persistRecentSearches(updated);
      return { recentSearches: updated };
    });
  },

  clearRecentSearches: () => {
    try {
      localStorage.removeItem(RECENT_SEARCHES_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear recent searches:', error);
    }
    set({ recentSearches: [] });
  },

  loadRecentSearches: () => {
    const searches = loadRecentSearchesFromStorage();
    set({ recentSearches: searches });
  },
}));
