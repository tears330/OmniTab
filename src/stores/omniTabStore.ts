/* eslint-disable import/prefer-default-export */
import type { Command, OmniTabState, SearchResult } from '@/types/extension';
import type { Theme } from '@/types/settings';
import { clamp, debounce, DebouncedFunction } from 'es-toolkit';
import { create } from 'zustand';

import { getContentBroker } from '@/services/messageBroker';
import { performSearch as performSearchService } from '@/services/searchService';
import { settingsService } from '@/services/settingsService';
import createStoreLogger from '@/utils/storeLogger';

import { TAB_EXTENSION_ID, TabCommandId } from '../extensions';

interface OmniTabStore extends OmniTabState {
  // Theme
  theme: Theme;

  // Actions Menu State
  isActionsMenuOpen: boolean;
  actionsMenuSelectedIndex: number;

  // Actions
  open: () => void;
  close: () => void;
  setQuery: (query: string) => void;
  setResults: (results: SearchResult[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | undefined) => void;
  setSelectedIndex: (index: number) => void;
  setTheme: (theme: Theme) => void;
  setActiveExtension: (payload?: {
    extensionId: string;
    commandId: string;
  }) => void;
  setCommands: (commands: Command[]) => void;
  setInitialResults: (results: SearchResult[]) => void;
  reset: () => void;

  // Actions Menu Actions
  openActionsMenu: () => void;
  closeActionsMenu: () => void;
  toggleActionsMenu: () => void;
  setActionsMenuSelectedIndex: (index: number) => void;

  // Async actions
  performSearch: DebouncedFunction<(query: string) => Promise<void>>;
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

// Configure devtools for Chrome extension environment
// Redux DevTools Extension needs special handling for content scripts
const isDevMode = process.env.NODE_ENV === 'development';

// Create store with conditional devtools
export const useOmniTabStore = create<OmniTabStore>()((set, get) => ({
  ...initialState,
  theme: 'system',
  isActionsMenuOpen: false,
  actionsMenuSelectedIndex: 0,

  // Basic state actions
  open: () => {
    set(
      {
        isOpen: true,
        query: '',
        selectedIndex: 0,
        results: [],
        loading: true,
      },
      false
    );
    // Load initial results when opened
    const store = get();
    if (store.loading && !store.query) {
      store.loadInitialResults();
    }
  },

  close: () =>
    set(
      {
        isOpen: false,
        query: '',
        selectedIndex: 0,
        results: [],
        error: undefined,
        activeExtension: undefined,
        activeCommand: undefined,
        isActionsMenuOpen: false,
        actionsMenuSelectedIndex: 0,
      },
      false
    ),

  setQuery: (query: string) =>
    set(
      {
        query,
        selectedIndex: 0,
        isActionsMenuOpen: false,
        actionsMenuSelectedIndex: 0,
      },
      false
    ),

  setResults: (results: SearchResult[]) =>
    set(
      {
        results,
        selectedIndex: 0,
        loading: false,
        error: undefined,
        isActionsMenuOpen: false,
        actionsMenuSelectedIndex: 0,
      },
      false
    ),

  setLoading: (loading: boolean) => set({ loading }, false),

  setError: (error: string | undefined) =>
    set({ error, loading: false }, false),

  setSelectedIndex: (index: number) => {
    const state = get();
    const clampedIndex = clamp(index, 0, Math.max(0, state.results.length - 1));
    set(
      {
        selectedIndex: clampedIndex,
        isActionsMenuOpen: false,
        actionsMenuSelectedIndex: 0,
      },
      false
    );
  },

  setTheme: (theme: Theme) => set({ theme }, false),

  setActiveExtension: (payload?: { extensionId: string; commandId: string }) =>
    set(
      {
        activeExtension: payload?.extensionId,
        activeCommand: payload?.commandId,
      },
      false
    ),

  setCommands: (commands: Command[]) =>
    set({ availableCommands: commands }, false),

  setInitialResults: (results: SearchResult[]) =>
    set(
      {
        results,
        loading: false,
        error: undefined,
        isActionsMenuOpen: false,
        actionsMenuSelectedIndex: 0,
      },
      false
    ),

  reset: () =>
    set(
      {
        ...initialState,
        theme: 'system',
        isActionsMenuOpen: false,
        actionsMenuSelectedIndex: 0,
      },
      false
    ),

  // Actions Menu Actions
  openActionsMenu: () => {
    const state = get();
    const selectedResult = state.results[state.selectedIndex];
    if (
      selectedResult &&
      selectedResult.actions.filter((a) => !a.primary).length > 0
    ) {
      set({ isActionsMenuOpen: true, actionsMenuSelectedIndex: 0 }, false);
    }
  },

  closeActionsMenu: () =>
    set({ isActionsMenuOpen: false, actionsMenuSelectedIndex: 0 }, false),

  toggleActionsMenu: () => {
    const state = get();
    if (state.isActionsMenuOpen) {
      set({ isActionsMenuOpen: false, actionsMenuSelectedIndex: 0 }, false);
    } else {
      state.openActionsMenu();
    }
  },

  setActionsMenuSelectedIndex: (index: number) => {
    const state = get();
    const selectedResult = state.results[state.selectedIndex];
    if (selectedResult) {
      const secondaryActions = selectedResult.actions.filter((a) => !a.primary);
      const actionsCount = secondaryActions.length;
      if (actionsCount === 0) return;

      // Wrap around navigation
      let newIndex = index;
      if (index < 0) {
        newIndex = actionsCount - 1; // Wrap to last item
      } else if (index >= actionsCount) {
        newIndex = 0; // Wrap to first item
      }

      set({ actionsMenuSelectedIndex: newIndex }, false);
    }
  },

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
        set({ availableCommands: commands }, false);
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
        set({ results: data, loading: false, error: undefined }, false);
      }
    } catch (error) {
      set({ loading: false }, false);
    }
  },

  performSearch: debounce(async (query: string) => {
    const { availableCommands, loadInitialResults } = get();

    set(
      {
        selectedIndex: 0,
        isActionsMenuOpen: false,
        actionsMenuSelectedIndex: 0,
      },
      false
    );

    try {
      if (!query.trim()) {
        set({ loading: true }, false);
        await loadInitialResults();
        return;
      }

      set({ loading: true }, false);

      const broker = getContentBroker();
      // Perform search directly
      const searchResult = await performSearchService({
        query,
        availableCommands,
        broker,
      });
      set(
        {
          results: searchResult.results,
          selectedIndex: 0,
          loading: false,
          error: searchResult.error, // This will be undefined if no error, clearing previous errors
        },
        false
      );

      if (searchResult.activeExtension && searchResult.activeCommand) {
        set(
          {
            activeExtension: searchResult.activeExtension,
            activeCommand: searchResult.activeCommand,
          },
          false
        );
      } else {
        set({ activeExtension: undefined, activeCommand: undefined }, false);
      }
    } catch (error) {
      set(
        {
          error: error instanceof Error ? error.message : 'Search failed',
          loading: false,
        },
        false
      );
    }
  }, 300),

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
        // Set query to the appropriate alias based on the command
        let queryAlias = '';
        if (command.alias && command.alias.length > 0) {
          // Use the first alias, add space for non-immediate aliases
          const [firstAlias] = command.alias;
          queryAlias = firstAlias;
          if (!command.immediateAlias) {
            queryAlias += ' ';
          }
        }

        set(
          {
            activeExtension: extensionId,
            activeCommand: commandId,
            query: queryAlias,
            results: [],
          },
          false
        );
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
              isActionsMenuOpen: false,
              actionsMenuSelectedIndex: 0,
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
        set(
          {
            isOpen: false,
            query: '',
            selectedIndex: 0,
            results: [],
            error: undefined,
            activeExtension: undefined,
            activeCommand: undefined,
            isActionsMenuOpen: false,
            actionsMenuSelectedIndex: 0,
          },
          false
        );
      } else {
        set({ error: response.error }, false);
      }
    } catch (error) {
      set(
        {
          error: error instanceof Error ? error.message : 'Action failed',
        },
        false
      );
    }
  },

  selectCommand: (commandId: string) => {
    const [extensionId, cmdId] = commandId.split('.');
    set(
      {
        activeExtension: extensionId,
        activeCommand: cmdId,
      },
      false
    );
  },
}));

// Initialize store - load commands and theme on creation
useOmniTabStore.getState().loadCommands();

// Load theme from settings
settingsService
  .getSettings()
  .then((settings) => {
    useOmniTabStore.getState().setTheme(settings.appearance.theme);
  })
  .catch(() => {
    // Keep default theme if settings load fails
  });

// Expose store to window in development for debugging
if (isDevMode && typeof window !== 'undefined') {
  // @ts-expect-error - Adding store to window for debugging
  window.omniTabStore = useOmniTabStore;

  // Subscribe to store changes for logging
  const logger = createStoreLogger('OmniTab');
  useOmniTabStore.subscribe(logger);

  // Development debugging instructions
  // eslint-disable-next-line no-console
  console.info('[OmniTab] Store debugging enabled. Access via:', {
    'View state': 'window.omniTabStore.getState()',
    'Open OmniTab': 'window.omniTabStore.getState().open()',
    Subscribe: 'window.omniTabStore.subscribe(console.log)',
  });
}

// Subscribe to query changes for debounced search
let previousQuery = '';

useOmniTabStore.subscribe((state) => {
  const currentQuery = state.query;
  if (currentQuery !== previousQuery) {
    previousQuery = currentQuery;
    useOmniTabStore.getState().performSearch(currentQuery);
  }
});
