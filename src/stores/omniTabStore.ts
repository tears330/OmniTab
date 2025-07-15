import type { Command, OmniTabState, SearchResult } from '@/types/extension';
import { clamp, debounce, memoize } from 'es-toolkit';
import { create } from 'zustand';

import { getContentBroker } from '@/services/messageBroker';
import { performSearch as performSearchService } from '@/services/searchService';

import { TAB_EXTENSION_ID, TabCommandId } from '../extensions';

interface OmniTabStore extends OmniTabState {
  // Actions
  open: () => void;
  close: () => void;
  setQuery: (query: string) => void;
  setResults: (results: SearchResult[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | undefined) => void;
  setSelectedIndex: (index: number) => void;
  setActiveExtension: (payload?: {
    extensionId: string;
    commandId: string;
  }) => void;
  setCommands: (commands: Command[]) => void;
  setInitialResults: (results: SearchResult[]) => void;
  reset: () => void;

  // Async actions
  performSearch: (query: string) => Promise<void>;
  executeAction: (resultId: string, actionId: string) => Promise<void>;
  selectCommand: (commandId: string) => void;
  loadCommands: () => Promise<void>;
  loadInitialResults: () => Promise<void>;
}

const initialState: OmniTabState = {
  isOpen: false,
  query: '',
  selectedIndex: 0,
  results: [],
  loading: false,
  error: undefined,
  activeExtension: undefined,
  activeCommand: undefined,
  availableCommands: [],
};

// Create memoized search function with cache key based on query and available commands
// This caches search results to avoid redundant API calls for identical queries
// Cache is cleared when available commands change
const memoizedPerformSearch = memoize(performSearchService, {
  getCacheKey: (options) => {
    // Create a cache key from query and command IDs
    const commandIds = options.availableCommands
      .map((cmd) => cmd.id)
      .sort()
      .join(',');
    return `${options.query}::${commandIds}`;
  },
});

export const useOmniTabStore = create<OmniTabStore>()((set, get) => ({
  ...initialState,

  // Basic state actions
  open: () => {
    set({
      isOpen: true,
      query: '',
      selectedIndex: 0,
      results: [],
      loading: true,
    });
    // Load initial results when opened
    const store = get();
    if (store.loading && !store.query) {
      store.loadInitialResults();
    }
  },

  close: () =>
    set({
      isOpen: false,
      query: '',
      selectedIndex: 0,
      results: [],
      error: undefined,
      activeExtension: undefined,
      activeCommand: undefined,
    }),

  setQuery: (query: string) => set({ query, selectedIndex: 0 }),

  setResults: (results: SearchResult[]) =>
    set({ results, selectedIndex: 0, loading: false, error: undefined }),

  setLoading: (loading: boolean) => set({ loading }),

  setError: (error: string | undefined) => set({ error, loading: false }),

  setSelectedIndex: (index: number) => {
    const state = get();
    const clampedIndex = clamp(index, 0, Math.max(0, state.results.length - 1));
    set({ selectedIndex: clampedIndex });
  },

  setActiveExtension: (payload?: { extensionId: string; commandId: string }) =>
    set({
      activeExtension: payload?.extensionId,
      activeCommand: payload?.commandId,
    }),

  setCommands: (commands: Command[]) => set({ availableCommands: commands }),

  setInitialResults: (results: SearchResult[]) =>
    set({ results, loading: false, error: undefined }),

  reset: () => set(initialState),

  // Async actions
  loadCommands: async () => {
    try {
      const broker = getContentBroker();
      const response = await broker.sendActionRequest(
        'core',
        'get-commands',
        'list'
      );

      if (response.success && response.data) {
        const { commands } = response.data as { commands: Command[] };
        set({ availableCommands: commands });
        // Clear memoization cache when commands change
        memoizedPerformSearch.cache.clear();
      }
    } catch (error) {
      // Failed to load commands
    }
  },

  loadInitialResults: async () => {
    try {
      const broker = getContentBroker();
      const response = await broker.sendSearchRequest(
        TAB_EXTENSION_ID,
        TabCommandId.SEARCH,
        ''
      );

      if (response.success && response.data) {
        const { data } = response;
        set({ results: data, loading: false, error: undefined });
      }
    } catch (error) {
      set({ loading: false });
    }
  },

  performSearch: async (query: string) => {
    const { availableCommands, loadInitialResults } = get();

    set({ query, selectedIndex: 0 });

    if (!query.trim()) {
      set({ loading: true });
      await loadInitialResults();
      return;
    }

    set({ loading: true });

    try {
      const broker = getContentBroker();
      // Use memoized search for better performance
      const searchResult = await memoizedPerformSearch({
        query,
        availableCommands,
        broker,
      });

      set({
        results: searchResult.results,
        selectedIndex: 0,
        loading: false,
        error: searchResult.error, // This will be undefined if no error, clearing previous errors
      });

      if (searchResult.activeExtension && searchResult.activeCommand) {
        set({
          activeExtension: searchResult.activeExtension,
          activeCommand: searchResult.activeCommand,
        });
      } else {
        set({ activeExtension: undefined, activeCommand: undefined });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Search failed',
        loading: false,
      });
    }
  },

  executeAction: async (resultId: string, actionId: string) => {
    const { results } = get();
    const result = results.find((r) => r.id === resultId);
    if (!result) return;

    const broker = getContentBroker();

    // Handle command selection
    if (result.type === 'command' && result.metadata?.command) {
      const command = result.metadata.command as Command;
      const [extensionId, commandId] = command.id.split('.');

      if (command.type === 'search') {
        set({
          activeExtension: extensionId,
          activeCommand: commandId,
          query: '',
          results: [],
        });
      } else {
        try {
          const response = await broker.sendActionRequest(
            extensionId,
            commandId,
            'execute'
          );

          if (response.success) {
            set({
              isOpen: false,
              query: '',
              selectedIndex: 0,
              results: [],
              error: undefined,
              activeExtension: undefined,
              activeCommand: undefined,
            });
          } else {
            set({ error: response.error });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Action failed',
          });
        }
      }
      return;
    }

    // Handle regular result actions
    const extensionId = result.id.split('-')[0];

    try {
      const response = await broker.sendActionRequest(
        extensionId,
        'search',
        actionId,
        resultId,
        result.metadata
      );

      if (response.success) {
        set({
          isOpen: false,
          query: '',
          selectedIndex: 0,
          results: [],
          error: undefined,
          activeExtension: undefined,
          activeCommand: undefined,
        });
      } else {
        set({ error: response.error });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Action failed',
      });
    }
  },

  selectCommand: (commandId: string) => {
    const [extensionId, cmdId] = commandId.split('.');
    set({
      activeExtension: extensionId,
      activeCommand: cmdId,
    });
  },
}));

// Initialize store - load commands on creation
useOmniTabStore.getState().loadCommands();

// Create debounced search function
const debouncedPerformSearch = debounce((query: string) => {
  useOmniTabStore.getState().performSearch(query);
}, 150);

// Subscribe to query changes for debounced search
let previousQuery = '';
useOmniTabStore.subscribe((state) => {
  const currentQuery = state.query;
  if (currentQuery !== previousQuery) {
    previousQuery = currentQuery;
    if (currentQuery) {
      debouncedPerformSearch(currentQuery);
    }
  }
});

// Helper function for manual search (if needed)
export const performDebouncedSearch = (query: string) => {
  useOmniTabStore.getState().setQuery(query);
  if (!query.trim()) {
    useOmniTabStore.getState().setLoading(true);
    useOmniTabStore.getState().loadInitialResults();
  }
};
