import type { Command, OmniTabState, SearchResult } from '@/types/extension';
import { clamp, debounce } from 'es-toolkit';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { getContentBroker } from '@/services/messageBroker';
import { performSearch as performSearchService } from '@/services/searchService';
import createStoreLogger from '@/utils/storeLogger';

import { TAB_EXTENSION_ID, TabCommandId } from '../extensions';

// Flag to prevent circular dependency in search subscription
let isPerformingDirectSearch = false;

interface OmniTabStore extends OmniTabState {
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

// Configure devtools for Chrome extension environment
// Redux DevTools Extension needs special handling for content scripts
const isDevMode = process.env.NODE_ENV === 'development';

// Create store with conditional devtools
export const useOmniTabStore = create<OmniTabStore>()(
  isDevMode
    ? devtools(
        (set, get) => ({
          ...initialState,
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
              false,
              'open'
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
              false,
              'close'
            ),

          setQuery: (query: string) =>
            set({ query, selectedIndex: 0 }, false, 'setQuery'),

          setResults: (results: SearchResult[]) =>
            set(
              { results, selectedIndex: 0, loading: false, error: undefined },
              false,
              'setResults'
            ),

          setLoading: (loading: boolean) =>
            set({ loading }, false, 'setLoading'),

          setError: (error: string | undefined) =>
            set({ error, loading: false }, false, 'setError'),

          setSelectedIndex: (index: number) => {
            const state = get();
            const clampedIndex = clamp(
              index,
              0,
              Math.max(0, state.results.length - 1)
            );
            set({ selectedIndex: clampedIndex }, false, 'setSelectedIndex');
          },

          setActiveExtension: (payload?: {
            extensionId: string;
            commandId: string;
          }) =>
            set(
              {
                activeExtension: payload?.extensionId,
                activeCommand: payload?.commandId,
              },
              false,
              'setActiveExtension'
            ),

          setCommands: (commands: Command[]) =>
            set({ availableCommands: commands }, false, 'setCommands'),

          setInitialResults: (results: SearchResult[]) =>
            set(
              { results, loading: false, error: undefined },
              false,
              'setInitialResults'
            ),

          reset: () =>
            set(
              {
                ...initialState,
                isActionsMenuOpen: false,
                actionsMenuSelectedIndex: 0,
              },
              false,
              'reset'
            ),

          // Actions Menu Actions
          openActionsMenu: () => {
            const state = get();
            const selectedResult = state.results[state.selectedIndex];
            if (
              selectedResult &&
              selectedResult.actions.filter((a) => !a.primary).length > 0
            ) {
              set(
                { isActionsMenuOpen: true, actionsMenuSelectedIndex: 0 },
                false,
                'openActionsMenu'
              );
            }
          },

          closeActionsMenu: () =>
            set(
              { isActionsMenuOpen: false, actionsMenuSelectedIndex: 0 },
              false,
              'closeActionsMenu'
            ),

          toggleActionsMenu: () => {
            const state = get();
            if (state.isActionsMenuOpen) {
              set(
                { isActionsMenuOpen: false, actionsMenuSelectedIndex: 0 },
                false,
                'toggleActionsMenu'
              );
            } else {
              state.openActionsMenu();
            }
          },

          setActionsMenuSelectedIndex: (index: number) => {
            const state = get();
            const selectedResult = state.results[state.selectedIndex];
            if (selectedResult) {
              const secondaryActions = selectedResult.actions.filter(
                (a) => !a.primary
              );
              const actionsCount = secondaryActions.length;
              if (actionsCount === 0) return;

              // Wrap around navigation
              let newIndex = index;
              if (index < 0) {
                newIndex = actionsCount - 1; // Wrap to last item
              } else if (index >= actionsCount) {
                newIndex = 0; // Wrap to first item
              }

              set(
                { actionsMenuSelectedIndex: newIndex },
                false,
                'setActionsMenuSelectedIndex'
              );
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
                set({ availableCommands: commands }, false, 'loadCommands');
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
                set(
                  { results: data, loading: false, error: undefined },
                  false,
                  'loadInitialResults'
                );
              }
            } catch (error) {
              set({ loading: false }, false, 'loadInitialResults');
            }
          },

          performSearch: async (query: string) => {
            const { availableCommands, loadInitialResults } = get();

            isPerformingDirectSearch = true;
            set({ query, selectedIndex: 0 }, false, 'performSearch');

            try {
              if (!query.trim()) {
                set({ loading: true }, false, 'performSearch');
                await loadInitialResults();
                return;
              }

              set({ loading: true }, false, 'performSearch');

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
                false,
                'performSearch'
              );

              if (searchResult.activeExtension && searchResult.activeCommand) {
                set(
                  {
                    activeExtension: searchResult.activeExtension,
                    activeCommand: searchResult.activeCommand,
                  },
                  false,
                  'performSearch'
                );
              } else {
                set(
                  { activeExtension: undefined, activeCommand: undefined },
                  false,
                  'performSearch'
                );
              }
            } catch (error) {
              set(
                {
                  error:
                    error instanceof Error ? error.message : 'Search failed',
                  loading: false,
                },
                false,
                'performSearch'
              );
            } finally {
              isPerformingDirectSearch = false;
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
                set(
                  {
                    activeExtension: extensionId,
                    activeCommand: commandId,
                    query: '',
                    results: [],
                  },
                  false,
                  'executeAction'
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
                    error:
                      error instanceof Error ? error.message : 'Action failed',
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
                  false,
                  'executeAction'
                );
              } else {
                set({ error: response.error }, false, 'executeAction');
              }
            } catch (error) {
              set(
                {
                  error:
                    error instanceof Error ? error.message : 'Action failed',
                },
                false,
                'executeAction'
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
              false,
              'selectCommand'
            );
          },
        }),
        {
          name: 'omnitab-store',
          trace: true,
        }
      )
    : (set, get) => ({
        ...initialState,
        isActionsMenuOpen: false,
        actionsMenuSelectedIndex: 0,

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
            isActionsMenuOpen: false,
            actionsMenuSelectedIndex: 0,
          }),

        setQuery: (query: string) => set({ query, selectedIndex: 0 }),

        setResults: (results: SearchResult[]) =>
          set({ results, selectedIndex: 0, loading: false, error: undefined }),

        setLoading: (loading: boolean) => set({ loading }),

        setError: (error: string | undefined) => set({ error, loading: false }),

        setSelectedIndex: (index: number) => {
          const state = get();
          const clampedIndex = clamp(
            index,
            0,
            Math.max(0, state.results.length - 1)
          );
          set({ selectedIndex: clampedIndex });
        },

        setActiveExtension: (payload?: {
          extensionId: string;
          commandId: string;
        }) =>
          set({
            activeExtension: payload?.extensionId,
            activeCommand: payload?.commandId,
          }),

        setCommands: (commands: Command[]) =>
          set({ availableCommands: commands }),

        setInitialResults: (results: SearchResult[]) =>
          set({ results, loading: false, error: undefined }),

        reset: () =>
          set({
            ...initialState,
            isActionsMenuOpen: false,
            actionsMenuSelectedIndex: 0,
          }),

        // Actions Menu Actions
        openActionsMenu: () => {
          const state = get();
          const selectedResult = state.results[state.selectedIndex];
          if (
            selectedResult &&
            selectedResult.actions.filter((a) => !a.primary).length > 0
          ) {
            set({ isActionsMenuOpen: true, actionsMenuSelectedIndex: 0 });
          }
        },

        closeActionsMenu: () =>
          set({ isActionsMenuOpen: false, actionsMenuSelectedIndex: 0 }),

        toggleActionsMenu: () => {
          const state = get();
          if (state.isActionsMenuOpen) {
            set({ isActionsMenuOpen: false, actionsMenuSelectedIndex: 0 });
          } else {
            state.openActionsMenu();
          }
        },

        setActionsMenuSelectedIndex: (index: number) => {
          const state = get();
          const selectedResult = state.results[state.selectedIndex];
          if (selectedResult) {
            const secondaryActions = selectedResult.actions.filter(
              (a) => !a.primary
            );
            const actionsCount = secondaryActions.length;
            if (actionsCount === 0) return;

            // Wrap around navigation
            let newIndex = index;
            if (index < 0) {
              newIndex = actionsCount - 1; // Wrap to last item
            } else if (index >= actionsCount) {
              newIndex = 0; // Wrap to first item
            }

            set({ actionsMenuSelectedIndex: newIndex });
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
              set({ availableCommands: commands });
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

          set({ selectedIndex: 0 });

          if (!query.trim()) {
            set({ loading: true });
            await loadInitialResults();
            return;
          }

          set({ loading: true });

          try {
            const broker = getContentBroker();
            // Perform search directly
            const searchResult = await performSearchService({
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
                    isActionsMenuOpen: false,
                    actionsMenuSelectedIndex: 0,
                  });
                } else {
                  set({ error: response.error });
                }
              } catch (error) {
                set({
                  error:
                    error instanceof Error ? error.message : 'Action failed',
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
        },

        selectCommand: (commandId: string) => {
          const [extensionId, cmdId] = commandId.split('.');
          set({
            activeExtension: extensionId,
            activeCommand: cmdId,
          });
        },
      })
);

// Initialize store - load commands on creation
useOmniTabStore.getState().loadCommands();

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

// Create debounced search function
const debouncedPerformSearch = debounce((query: string) => {
  useOmniTabStore.getState().performSearch(query);
}, 300);

// Subscribe to query changes for debounced search
let previousQuery = '';

useOmniTabStore.subscribe((state) => {
  const currentQuery = state.query;
  if (currentQuery !== previousQuery && !isPerformingDirectSearch) {
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
