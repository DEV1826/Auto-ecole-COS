// src/hooks/use.globalSearch.ts

import { useGlobalSearchStore } from '@/store/globalSearch.store';
import type {
  GlobalSearchResult,
  RecentSearch,
  SearchResultItem,
} from '@/types/globalSearch.types';

export interface UseGlobalSearch {
  results: GlobalSearchResult<SearchResultItem> | null;
  loading: boolean;
  error: string | null;
  lastQuery: string;
  recentSearches: RecentSearch[];
  search: (query: string) => Promise<GlobalSearchResult<SearchResultItem>>;
  clearResults: () => void;
  clearErrors: () => void;
  addRecentSearch: (search: RecentSearch) => void;
  removeRecentSearch: (id: string) => void;
  clearRecentSearches: () => void;
  loadRecentSearches: () => void;
}

export const useGlobalSearch = (): UseGlobalSearch => {
  const store = useGlobalSearchStore();
  return {
    results: store.results,
    loading: store.loading,
    error: store.error,
    lastQuery: store.lastQuery,
    recentSearches: store.recentSearches,
    search: store.search,
    clearResults: store.clearResults,
    clearErrors: store.clearErrors,
    addRecentSearch: store.addRecentSearch,
    removeRecentSearch: store.removeRecentSearch,
    clearRecentSearches: store.clearRecentSearches,
    loadRecentSearches: store.loadRecentSearches,
  };
};
