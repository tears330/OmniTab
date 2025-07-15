import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import type { Command, OmniTabState, StateAction } from '@/types/extension';

import { getContentBroker } from '@/services/messageBroker';
import { performSearch } from '@/services/searchService';

interface OmniTabContextValue {
  state: OmniTabState;
  dispatch: React.Dispatch<StateAction>;
  performSearch: (query: string) => Promise<void>;
  executeAction: (resultId: string, actionId: string) => Promise<void>;
  selectCommand: (commandId: string) => void;
  loadCommands: () => Promise<void>;
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

function omniTabReducer(
  state: OmniTabState,
  action: StateAction
): OmniTabState {
  switch (action.type) {
    case 'OPEN':
      return {
        ...state,
        isOpen: true,
        query: '',
        selectedIndex: 0,
        results: [],
        loading: true, // Start loading tabs when opened
      };

    case 'CLOSE':
      return {
        ...state,
        isOpen: false,
        query: '',
        selectedIndex: 0,
        results: [],
        error: undefined,
        activeExtension: undefined,
        activeCommand: undefined,
      };

    case 'SET_QUERY':
      return {
        ...state,
        query: action.payload,
        selectedIndex: 0,
      };

    case 'SET_RESULTS':
      return {
        ...state,
        results: action.payload,
        selectedIndex: 0,
        loading: false,
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case 'SET_SELECTED_INDEX':
      return {
        ...state,
        selectedIndex: Math.max(
          0,
          Math.min(action.payload, state.results.length - 1)
        ),
      };

    case 'SET_ACTIVE_EXTENSION':
      return {
        ...state,
        activeExtension: action.payload?.extensionId,
        activeCommand: action.payload?.commandId,
      };

    case 'SET_COMMANDS':
      return {
        ...state,
        availableCommands: action.payload,
      };

    case 'SET_INITIAL_RESULTS':
      return {
        ...state,
        results: action.payload,
        loading: false,
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

const OmniTabContext = createContext<OmniTabContextValue | undefined>(
  undefined
);

export function OmniTabProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(omniTabReducer, initialState);
  const broker = getContentBroker();

  const loadCommands = useCallback(async () => {
    try {
      // Request commands from background
      const response = await broker.sendActionRequest(
        'core',
        'get-commands',
        'list'
      );
      if (response.success && response.data) {
        dispatch({
          type: 'SET_COMMANDS',
          payload: (response.data as { commands: Command[] }).commands,
        });
      }
    } catch (error) {
      // Failed to load commands
    }
  }, [broker]);

  // Load available commands on mount
  useEffect(() => {
    loadCommands();
  }, [loadCommands]);

  // Load initial results (tabs) when opened
  const loadInitialResults = useCallback(async () => {
    try {
      // Load tabs by default
      const response = await broker.sendSearchRequest('tab', 'search', '');
      if (response.success && response.data) {
        dispatch({ type: 'SET_INITIAL_RESULTS', payload: response.data });
      }
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [broker]);

  // Load tabs when opened
  useEffect(() => {
    if (state.isOpen && state.loading && !state.query) {
      loadInitialResults();
    }
  }, [state.isOpen, state.loading, state.query, loadInitialResults]);

  const handleSearch = useCallback(
    async (query: string) => {
      dispatch({ type: 'SET_QUERY', payload: query });

      if (!query.trim()) {
        // Show tabs by default when query is empty
        dispatch({ type: 'SET_LOADING', payload: true });
        loadInitialResults();
        return;
      }

      dispatch({ type: 'SET_LOADING', payload: true });

      try {
        const searchResult = await performSearch({
          query,
          availableCommands: state.availableCommands,
          broker,
        });

        dispatch({ type: 'SET_RESULTS', payload: searchResult.results });

        if (searchResult.activeExtension && searchResult.activeCommand) {
          dispatch({
            type: 'SET_ACTIVE_EXTENSION',
            payload: {
              extensionId: searchResult.activeExtension,
              commandId: searchResult.activeCommand,
            },
          });
        } else {
          dispatch({ type: 'SET_ACTIVE_EXTENSION', payload: undefined });
        }

        if (searchResult.error) {
          dispatch({ type: 'SET_ERROR', payload: searchResult.error });
        }
      } catch (error) {
        dispatch({
          type: 'SET_ERROR',
          payload: error instanceof Error ? error.message : 'Search failed',
        });
      }
    },
    [broker, state.availableCommands, loadInitialResults]
  );

  const executeAction = useCallback(
    async (resultId: string, actionId: string) => {
      const result = state.results.find((r) => r.id === resultId);
      if (!result) return;

      // Handle command selection
      if (result.type === 'command' && result.metadata?.command) {
        const command = result.metadata.command as Command;
        const [extensionId, commandId] = command.id.split('.');

        if (command.type === 'search') {
          // Set as active search command
          dispatch({
            type: 'SET_ACTIVE_EXTENSION',
            payload: { extensionId, commandId },
          });
          dispatch({ type: 'SET_QUERY', payload: '' });
          dispatch({ type: 'SET_RESULTS', payload: [] });
        } else {
          // Execute action command
          try {
            const response = await broker.sendActionRequest(
              extensionId,
              commandId,
              'execute'
            );

            if (response.success) {
              // Close OmniTab after successful action
              dispatch({ type: 'CLOSE' });
            } else {
              dispatch({ type: 'SET_ERROR', payload: response.error });
            }
          } catch (error) {
            dispatch({
              type: 'SET_ERROR',
              payload: error instanceof Error ? error.message : 'Action failed',
            });
          }
        }

        return;
      }

      // Handle regular result actions
      const extensionId = result.id.split('-')[0]; // Extract extension ID from result ID

      try {
        const response = await broker.sendActionRequest(
          extensionId,
          'search', // Default command for actions
          actionId,
          resultId,
          result.metadata
        );

        if (response.success) {
          // Close OmniTab after successful action
          dispatch({ type: 'CLOSE' });
        } else {
          dispatch({ type: 'SET_ERROR', payload: response.error });
        }
      } catch (error) {
        dispatch({
          type: 'SET_ERROR',
          payload: error instanceof Error ? error.message : 'Action failed',
        });
      }
    },
    [broker, state.results]
  );

  const selectCommand = useCallback((commandId: string) => {
    const [extensionId, cmdId] = commandId.split('.');
    dispatch({
      type: 'SET_ACTIVE_EXTENSION',
      payload: { extensionId, commandId: cmdId },
    });
  }, []);

  const value: OmniTabContextValue = useMemo(
    () => ({
      state,
      dispatch,
      performSearch: handleSearch,
      executeAction,
      selectCommand,
      loadCommands,
    }),
    [state, dispatch, handleSearch, executeAction, selectCommand, loadCommands]
  );

  return (
    <OmniTabContext.Provider value={value}>{children}</OmniTabContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useOmniTab() {
  const context = useContext(OmniTabContext);
  if (!context) {
    throw new Error('useOmniTab must be used within OmniTabProvider');
  }
  return context;
}
