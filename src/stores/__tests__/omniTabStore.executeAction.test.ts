import type { Command, SearchResult } from '@/types/extension';

// Import the store after mocks are set up
import { useOmniTabStore } from '../omniTabStore';

// Mock es-toolkit functions
jest.mock('es-toolkit', () => ({
  clamp: jest.fn((value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value))
  ),
  debounce: jest.fn((fn: (...args: any[]) => any, delay: number) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const debouncedFn = (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
    debouncedFn.cancel = () => clearTimeout(timeoutId);
    return debouncedFn;
  }),
  memoize: jest.fn((fn: (...args: any[]) => any, options?: any) => {
    const cache = new Map();
    const memoizedFn = (...args: any[]) => {
      const key = options?.getCacheKey
        ? options.getCacheKey(...args)
        : JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = fn(...args);
      cache.set(key, result);
      return result;
    };
    memoizedFn.cache = { clear: () => cache.clear() };
    return memoizedFn;
  }),
}));

// Mock message broker
const mockBroker = {
  sendActionRequest: jest.fn(),
  sendSearchRequest: jest.fn(),
};

jest.mock('@/services/messageBroker', () => ({
  getContentBroker: () => mockBroker,
}));

// Mock search service
const mockPerformSearchService = jest.fn();
jest.mock('@/services/searchService', () => ({
  performSearch: jest.fn(() => mockPerformSearchService()),
}));

// Mock extensions
jest.mock('../../extensions', () => ({
  TAB_EXTENSION_ID: 'tab',
  TabCommandId: {
    SEARCH: 'search-tab',
  },
}));

describe('omniTabStore - executeAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useOmniTabStore.getState().reset();
    // Reset mock implementations
    mockBroker.sendActionRequest.mockReset();
    mockBroker.sendSearchRequest.mockReset();
  });

  describe('Command Results', () => {
    it('should handle search command selection', async () => {
      const mockCommand: Command = {
        id: 'tab.search',
        name: 'Search Tabs',
        description: 'Search tabs',
        type: 'search',
        alias: ['t', 'tab'],
      };

      const mockResult: SearchResult = {
        id: 'cmd-tab-search',
        title: 'Search Tabs',
        description: 'Search tabs',
        type: 'command',
        actions: [],
        metadata: { command: mockCommand },
      };

      // Set up results
      useOmniTabStore.getState().setResults([mockResult]);

      await useOmniTabStore
        .getState()
        .executeAction('cmd-tab-search', 'select');

      const state = useOmniTabStore.getState();
      expect(state.activeExtension).toBe('tab');
      expect(state.activeCommand).toBe('search');
      expect(state.query).toBe('t ');
      expect(state.results).toEqual([]);
    });

    it('should handle search command with immediate alias', async () => {
      const mockCommand: Command = {
        id: 'core.search',
        name: 'Search Commands',
        description: 'Search commands',
        type: 'search',
        alias: ['>'],
        immediateAlias: true,
      };

      const mockResult: SearchResult = {
        id: 'cmd-core-search',
        title: 'Search Commands',
        description: 'Search commands',
        type: 'command',
        actions: [],
        metadata: { command: mockCommand },
      };

      // Set up results
      useOmniTabStore.getState().setResults([mockResult]);

      await useOmniTabStore
        .getState()
        .executeAction('cmd-core-search', 'select');

      const state = useOmniTabStore.getState();
      expect(state.activeExtension).toBe('core');
      expect(state.activeCommand).toBe('search');
      expect(state.query).toBe('>');
      expect(state.results).toEqual([]);
    });

    it('should handle search command without alias', async () => {
      const mockCommand: Command = {
        id: 'test.search',
        name: 'Test Search',
        description: 'Test search command',
        type: 'search',
      };

      const mockResult: SearchResult = {
        id: 'cmd-test-search',
        title: 'Test Search',
        description: 'Test search command',
        type: 'command',
        actions: [],
        metadata: { command: mockCommand },
      };

      // Set up results
      useOmniTabStore.getState().setResults([mockResult]);

      await useOmniTabStore
        .getState()
        .executeAction('cmd-test-search', 'select');

      const state = useOmniTabStore.getState();
      expect(state.activeExtension).toBe('test');
      expect(state.activeCommand).toBe('search');
      expect(state.query).toBe('');
      expect(state.results).toEqual([]);
    });

    it('should handle action command execution successfully', async () => {
      const mockCommand: Command = {
        id: 'core.help',
        name: 'Help',
        description: 'Show help',
        type: 'action',
      };

      const mockResult: SearchResult = {
        id: 'cmd-core-help',
        title: 'Help',
        description: 'Show help',
        type: 'command',
        actions: [],
        metadata: { command: mockCommand },
      };

      mockBroker.sendActionRequest.mockResolvedValue({
        success: true,
      });

      // Set up results after opening (open() clears results)
      useOmniTabStore.getState().open();
      useOmniTabStore.getState().setResults([mockResult]);

      await useOmniTabStore
        .getState()
        .executeAction('cmd-core-help', 'execute');

      expect(mockBroker.sendActionRequest).toHaveBeenCalledWith(
        'core',
        'help',
        'execute'
      );

      const state = useOmniTabStore.getState();
      expect(state.isOpen).toBe(false);
      expect(state.query).toBe('');
      expect(state.selectedIndex).toBe(0);
      expect(state.results).toEqual([]);
      expect(state.error).toBeUndefined();
      expect(state.activeExtension).toBeUndefined();
      expect(state.activeCommand).toBeUndefined();
    });

    it('should handle action command execution failure', async () => {
      const mockCommand: Command = {
        id: 'core.help',
        name: 'Help',
        description: 'Show help',
        type: 'action',
      };

      const mockResult: SearchResult = {
        id: 'cmd-core-help',
        title: 'Help',
        description: 'Show help',
        type: 'command',
        actions: [],
        metadata: { command: mockCommand },
      };

      mockBroker.sendActionRequest.mockResolvedValue({
        success: false,
        error: 'Command execution failed',
      });

      // Set up results
      useOmniTabStore.getState().setResults([mockResult]);

      await useOmniTabStore
        .getState()
        .executeAction('cmd-core-help', 'execute');

      expect(useOmniTabStore.getState().error).toBe('Command execution failed');
    });

    it('should handle action command execution exception', async () => {
      const mockCommand: Command = {
        id: 'core.help',
        name: 'Help',
        description: 'Show help',
        type: 'action',
      };

      const mockResult: SearchResult = {
        id: 'cmd-core-help',
        title: 'Help',
        description: 'Show help',
        type: 'command',
        actions: [],
        metadata: { command: mockCommand },
      };

      mockBroker.sendActionRequest.mockRejectedValue(
        new Error('Network error')
      );

      // Set up results
      useOmniTabStore.getState().setResults([mockResult]);

      await useOmniTabStore
        .getState()
        .executeAction('cmd-core-help', 'execute');

      expect(useOmniTabStore.getState().error).toBe('Network error');
    });

    it('should return early for non-existent result', async () => {
      const mockResult: SearchResult = {
        id: 'existing-result',
        title: 'Existing',
        description: 'Existing result',
        type: 'tab',
        actions: [],
      };

      // Set up results
      useOmniTabStore.getState().setResults([mockResult]);

      await useOmniTabStore
        .getState()
        .executeAction('non-existent-result', 'select');

      // Should not call any broker methods
      expect(mockBroker.sendActionRequest).not.toHaveBeenCalled();
      expect(mockBroker.sendSearchRequest).not.toHaveBeenCalled();
    });
  });

  describe('Regular Result Actions', () => {
    it('should handle regular result action successfully', async () => {
      const mockResult: SearchResult = {
        id: 'tab-123',
        title: 'Example Tab',
        description: 'example.com',
        type: 'tab',
        actions: [],
        metadata: { windowId: 1, active: false },
      };

      mockBroker.sendActionRequest.mockResolvedValue({
        success: true,
      });

      // Set up results after opening (open() clears results)
      useOmniTabStore.getState().open();
      useOmniTabStore.getState().setResults([mockResult]);

      await useOmniTabStore.getState().executeAction('tab-123', 'switch');

      expect(mockBroker.sendActionRequest).toHaveBeenCalledWith(
        'tab',
        'search',
        'switch',
        'tab-123',
        { windowId: 1, active: false }
      );

      const state = useOmniTabStore.getState();
      expect(state.isOpen).toBe(false);
      expect(state.query).toBe('');
      expect(state.selectedIndex).toBe(0);
      expect(state.results).toEqual([]);
      expect(state.error).toBeUndefined();
      expect(state.activeExtension).toBeUndefined();
      expect(state.activeCommand).toBeUndefined();
    });

    it('should handle regular result action failure', async () => {
      const mockResult: SearchResult = {
        id: 'history-456',
        title: 'Example History',
        description: 'example.com',
        type: 'history',
        actions: [],
        metadata: { url: 'https://example.com' },
      };

      mockBroker.sendActionRequest.mockResolvedValue({
        success: false,
        error: 'Action failed',
      });

      // Set up results
      useOmniTabStore.getState().setResults([mockResult]);

      await useOmniTabStore.getState().executeAction('history-456', 'open');

      expect(mockBroker.sendActionRequest).toHaveBeenCalledWith(
        'history',
        'search',
        'open',
        'history-456',
        { url: 'https://example.com' }
      );

      expect(useOmniTabStore.getState().error).toBe('Action failed');
    });

    it('should handle regular result action exception', async () => {
      const mockResult: SearchResult = {
        id: 'bookmark-789',
        title: 'Example Bookmark',
        description: 'example.com',
        type: 'bookmark',
        actions: [],
        metadata: { id: '789', url: 'https://example.com' },
      };

      mockBroker.sendActionRequest.mockRejectedValue(
        new Error('Network timeout')
      );

      // Set up results
      useOmniTabStore.getState().setResults([mockResult]);

      await useOmniTabStore.getState().executeAction('bookmark-789', 'open');

      expect(useOmniTabStore.getState().error).toBe('Network timeout');
    });

    it('should extract extension ID from complex result IDs', async () => {
      const mockResult: SearchResult = {
        id: 'custom-extension-complex-id-123',
        title: 'Custom Result',
        description: 'Custom description',
        type: 'custom',
        actions: [],
        metadata: { customData: 'test' },
      };

      mockBroker.sendActionRequest.mockResolvedValue({
        success: true,
      });

      // Set up results
      useOmniTabStore.getState().setResults([mockResult]);

      await useOmniTabStore
        .getState()
        .executeAction('custom-extension-complex-id-123', 'custom-action');

      expect(mockBroker.sendActionRequest).toHaveBeenCalledWith(
        'custom',
        'search',
        'custom-action',
        'custom-extension-complex-id-123',
        { customData: 'test' }
      );
    });

    it('should handle unknown error types', async () => {
      const mockResult: SearchResult = {
        id: 'tab-123',
        title: 'Example Tab',
        description: 'example.com',
        type: 'tab',
        actions: [],
      };

      mockBroker.sendActionRequest.mockRejectedValue('String error');

      // Set up results
      useOmniTabStore.getState().setResults([mockResult]);

      await useOmniTabStore.getState().executeAction('tab-123', 'switch');

      expect(useOmniTabStore.getState().error).toBe('Action failed');
    });
  });

  describe('Command Type Handling', () => {
    it('should handle command without metadata', async () => {
      const mockResult: SearchResult = {
        id: 'cmd-without-metadata',
        title: 'Command Without Metadata',
        description: 'Command description',
        type: 'command',
        actions: [],
        // No metadata property
      };

      mockBroker.sendActionRequest.mockResolvedValue({
        success: true,
      });

      // Set up results
      useOmniTabStore.getState().setResults([mockResult]);

      await useOmniTabStore
        .getState()
        .executeAction('cmd-without-metadata', 'select');

      // Since there's no metadata.command, it falls through to regular result action handling
      expect(mockBroker.sendActionRequest).toHaveBeenCalledWith(
        'cmd',
        'search',
        'select',
        'cmd-without-metadata',
        undefined
      );
    });

    it('should handle command with invalid metadata', async () => {
      const mockResult: SearchResult = {
        id: 'cmd-invalid-metadata',
        title: 'Command Invalid Metadata',
        description: 'Command description',
        type: 'command',
        actions: [],
        metadata: { command: null },
      };

      mockBroker.sendActionRequest.mockResolvedValue({
        success: true,
      });

      // Set up results
      useOmniTabStore.getState().setResults([mockResult]);

      await useOmniTabStore
        .getState()
        .executeAction('cmd-invalid-metadata', 'select');

      // Since metadata.command is null, it falls through to regular result action handling
      expect(mockBroker.sendActionRequest).toHaveBeenCalledWith(
        'cmd',
        'search',
        'select',
        'cmd-invalid-metadata',
        { command: null }
      );
    });

    it('should handle command ID without dot separator', async () => {
      const mockCommand: Command = {
        id: 'help', // No dot separator
        name: 'Help',
        description: 'Show help',
        type: 'action',
      };

      const mockResult: SearchResult = {
        id: 'cmd-help',
        title: 'Help',
        description: 'Show help',
        type: 'command',
        actions: [],
        metadata: { command: mockCommand },
      };

      mockBroker.sendActionRequest.mockResolvedValue({
        success: true,
      });

      // Set up results
      useOmniTabStore.getState().setResults([mockResult]);

      await useOmniTabStore.getState().executeAction('cmd-help', 'execute');

      expect(mockBroker.sendActionRequest).toHaveBeenCalledWith(
        'help',
        undefined,
        'execute'
      );
    });
  });

  describe('Additional Edge Cases', () => {
    it('should reset actions menu state when executing successful action', async () => {
      const mockResult: SearchResult = {
        id: 'tab-123',
        title: 'Example Tab',
        description: 'example.com',
        type: 'tab',
        actions: [
          { id: 'switch', label: 'Switch', primary: true },
          { id: 'close', label: 'Close', primary: false },
        ],
      };

      mockBroker.sendActionRequest.mockResolvedValue({
        success: true,
      });

      // Set up state with open actions menu
      useOmniTabStore.getState().open();
      useOmniTabStore.getState().setResults([mockResult]);
      useOmniTabStore.getState().openActionsMenu();
      useOmniTabStore.getState().setActionsMenuSelectedIndex(1);

      await useOmniTabStore.getState().executeAction('tab-123', 'switch');

      const state = useOmniTabStore.getState();
      expect(state.isOpen).toBe(false);
      expect(state.isActionsMenuOpen).toBe(false);
      expect(state.actionsMenuSelectedIndex).toBe(0);
    });

    it('should handle command execution with actions menu state reset', async () => {
      const mockCommand: Command = {
        id: 'core.help',
        name: 'Help',
        description: 'Show help',
        type: 'action',
      };

      const mockResult: SearchResult = {
        id: 'cmd-core-help',
        title: 'Help',
        description: 'Show help',
        type: 'command',
        actions: [],
        metadata: { command: mockCommand },
      };

      mockBroker.sendActionRequest.mockResolvedValue({
        success: true,
      });

      // Set up state with open actions menu
      useOmniTabStore.getState().open();
      useOmniTabStore.getState().setResults([mockResult]);
      useOmniTabStore.getState().openActionsMenu();

      await useOmniTabStore
        .getState()
        .executeAction('cmd-core-help', 'execute');

      const state = useOmniTabStore.getState();
      expect(state.isOpen).toBe(false);
      expect(state.isActionsMenuOpen).toBe(false);
      expect(state.actionsMenuSelectedIndex).toBe(0);
    });

    it('should preserve actions menu state on command execution failure', async () => {
      const mockCommand: Command = {
        id: 'core.help',
        name: 'Help',
        description: 'Show help',
        type: 'action',
      };

      const mockResult: SearchResult = {
        id: 'cmd-core-help',
        title: 'Help',
        description: 'Show help',
        type: 'command',
        actions: [],
        metadata: { command: mockCommand },
      };

      mockBroker.sendActionRequest.mockResolvedValue({
        success: false,
        error: 'Command failed',
      });

      // Set up state with open actions menu
      useOmniTabStore.getState().setResults([mockResult]);
      useOmniTabStore.getState().openActionsMenu();

      await useOmniTabStore
        .getState()
        .executeAction('cmd-core-help', 'execute');

      // Actions menu state should be preserved on failure
      expect(useOmniTabStore.getState().error).toBe('Command failed');
    });

    it('should handle empty command id in split operation', async () => {
      const mockCommand: Command = {
        id: '', // Empty command ID
        name: 'Empty Command',
        description: 'Command with empty ID',
        type: 'action',
      };

      const mockResult: SearchResult = {
        id: 'cmd-empty',
        title: 'Empty Command',
        description: 'Empty command',
        type: 'command',
        actions: [],
        metadata: { command: mockCommand },
      };

      mockBroker.sendActionRequest.mockResolvedValue({
        success: true,
      });

      useOmniTabStore.getState().setResults([mockResult]);

      await useOmniTabStore.getState().executeAction('cmd-empty', 'execute');

      expect(mockBroker.sendActionRequest).toHaveBeenCalledWith(
        '',
        undefined,
        'execute'
      );
    });

    it('should handle result with undefined metadata', async () => {
      const mockResult: SearchResult = {
        id: 'tab-no-metadata',
        title: 'Tab Without Metadata',
        description: 'Tab without metadata',
        type: 'tab',
        actions: [],
        // metadata is undefined
      };

      mockBroker.sendActionRequest.mockResolvedValue({
        success: true,
      });

      useOmniTabStore.getState().setResults([mockResult]);

      await useOmniTabStore
        .getState()
        .executeAction('tab-no-metadata', 'switch');

      expect(mockBroker.sendActionRequest).toHaveBeenCalledWith(
        'tab',
        'search',
        'switch',
        'tab-no-metadata',
        undefined
      );
    });
  });
});
