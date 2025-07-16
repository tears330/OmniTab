import type { Command, SearchResult } from '@/types/extension';

// Import the store after mocks are set up
import { performDebouncedSearch, useOmniTabStore } from '../omniTabStore';

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

describe('omniTabStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useOmniTabStore.getState().reset();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useOmniTabStore.getState();

      expect(state.isOpen).toBe(false);
      expect(state.query).toBe('');
      expect(state.selectedIndex).toBe(0);
      expect(state.results).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBeUndefined();
      expect(state.activeExtension).toBeUndefined();
      expect(state.activeCommand).toBeUndefined();
      expect(state.availableCommands).toEqual([]);
    });
  });

  describe('Basic Actions', () => {
    it('should open and set loading state', () => {
      useOmniTabStore.getState().open();

      const state = useOmniTabStore.getState();
      expect(state.isOpen).toBe(true);
      expect(state.query).toBe('');
      expect(state.selectedIndex).toBe(0);
      expect(state.results).toEqual([]);
      expect(state.loading).toBe(true);
    });

    it('should close and reset state', () => {
      // First set some state
      useOmniTabStore.getState().setQuery('test');
      useOmniTabStore.getState().setSelectedIndex(2);
      useOmniTabStore.getState().setError('test error');
      useOmniTabStore
        .getState()
        .setActiveExtension({ extensionId: 'tab', commandId: 'search' });

      // Then close
      useOmniTabStore.getState().close();

      const state = useOmniTabStore.getState();
      expect(state.isOpen).toBe(false);
      expect(state.query).toBe('');
      expect(state.selectedIndex).toBe(0);
      expect(state.results).toEqual([]);
      expect(state.error).toBeUndefined();
      expect(state.activeExtension).toBeUndefined();
      expect(state.activeCommand).toBeUndefined();
    });

    it('should set query and reset selected index', () => {
      useOmniTabStore.getState().setSelectedIndex(3);
      useOmniTabStore.getState().setQuery('test query');

      const state = useOmniTabStore.getState();
      expect(state.query).toBe('test query');
      expect(state.selectedIndex).toBe(0);
    });

    it('should set results and clear loading/error', () => {
      const mockResults: SearchResult[] = [
        {
          id: 'test-1',
          title: 'Test Result',
          description: 'Test description',
          type: 'tab',
          actions: [],
        },
      ];

      useOmniTabStore.getState().setLoading(true);
      useOmniTabStore.getState().setError('test error');
      useOmniTabStore.getState().setSelectedIndex(2);
      useOmniTabStore.getState().setResults(mockResults);

      const state = useOmniTabStore.getState();
      expect(state.results).toEqual(mockResults);
      expect(state.selectedIndex).toBe(0);
      expect(state.loading).toBe(false);
      expect(state.error).toBeUndefined();
    });

    it('should set loading state', () => {
      useOmniTabStore.getState().setLoading(true);
      expect(useOmniTabStore.getState().loading).toBe(true);

      useOmniTabStore.getState().setLoading(false);
      expect(useOmniTabStore.getState().loading).toBe(false);
    });

    it('should set error and clear loading', () => {
      useOmniTabStore.getState().setLoading(true);
      useOmniTabStore.getState().setError('test error');

      const state = useOmniTabStore.getState();
      expect(state.error).toBe('test error');
      expect(state.loading).toBe(false);
    });

    it('should clear error when set to undefined', () => {
      useOmniTabStore.getState().setError('test error');
      useOmniTabStore.getState().setError(undefined);

      expect(useOmniTabStore.getState().error).toBeUndefined();
    });
  });

  describe('Selected Index Management', () => {
    beforeEach(() => {
      const mockResults: SearchResult[] = [
        {
          id: '1',
          title: 'Result 1',
          description: '',
          type: 'tab',
          actions: [],
        },
        {
          id: '2',
          title: 'Result 2',
          description: '',
          type: 'tab',
          actions: [],
        },
        {
          id: '3',
          title: 'Result 3',
          description: '',
          type: 'tab',
          actions: [],
        },
      ];

      useOmniTabStore.getState().setResults(mockResults);
    });

    it('should clamp selected index within bounds', () => {
      useOmniTabStore.getState().setSelectedIndex(5); // Above max
      expect(useOmniTabStore.getState().selectedIndex).toBe(2); // Max index

      useOmniTabStore.getState().setSelectedIndex(-1); // Below min
      expect(useOmniTabStore.getState().selectedIndex).toBe(0); // Min index

      useOmniTabStore.getState().setSelectedIndex(1); // Valid index
      expect(useOmniTabStore.getState().selectedIndex).toBe(1);
    });

    it('should handle empty results array', () => {
      useOmniTabStore.getState().setResults([]);
      useOmniTabStore.getState().setSelectedIndex(5);

      expect(useOmniTabStore.getState().selectedIndex).toBe(0);
    });
  });

  describe('Active Extension Management', () => {
    it('should set active extension and command', () => {
      useOmniTabStore.getState().setActiveExtension({
        extensionId: 'tab',
        commandId: 'search',
      });

      const state = useOmniTabStore.getState();
      expect(state.activeExtension).toBe('tab');
      expect(state.activeCommand).toBe('search');
    });

    it('should clear active extension when payload is undefined', () => {
      useOmniTabStore.getState().setActiveExtension({
        extensionId: 'tab',
        commandId: 'search',
      });
      useOmniTabStore.getState().setActiveExtension();

      const state = useOmniTabStore.getState();
      expect(state.activeExtension).toBeUndefined();
      expect(state.activeCommand).toBeUndefined();
    });
  });

  describe('Commands Management', () => {
    it('should set available commands', () => {
      const mockCommands: Command[] = [
        {
          id: 'tab.search',
          name: 'Search Tabs',
          description: 'Search tabs',
          type: 'search',
        },
      ];

      useOmniTabStore.getState().setCommands(mockCommands);

      expect(useOmniTabStore.getState().availableCommands).toEqual(
        mockCommands
      );
    });

    it('should set initial results', () => {
      const mockResults: SearchResult[] = [
        {
          id: 'initial-1',
          title: 'Initial Result',
          description: 'Initial description',
          type: 'tab',
          actions: [],
        },
      ];

      useOmniTabStore.getState().setLoading(true);
      useOmniTabStore.getState().setError('test error');
      useOmniTabStore.getState().setInitialResults(mockResults);

      const state = useOmniTabStore.getState();
      expect(state.results).toEqual(mockResults);
      expect(state.loading).toBe(false);
      expect(state.error).toBeUndefined();
    });
  });

  describe('Reset Functionality', () => {
    it('should reset to initial state', () => {
      // Set some state
      useOmniTabStore.getState().open();
      useOmniTabStore.getState().setQuery('test');
      useOmniTabStore.getState().setError('error');
      useOmniTabStore
        .getState()
        .setActiveExtension({ extensionId: 'tab', commandId: 'search' });

      // Reset
      useOmniTabStore.getState().reset();

      const state = useOmniTabStore.getState();
      expect(state.isOpen).toBe(false);
      expect(state.query).toBe('');
      expect(state.selectedIndex).toBe(0);
      expect(state.results).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBeUndefined();
      expect(state.activeExtension).toBeUndefined();
      expect(state.activeCommand).toBeUndefined();
      expect(state.availableCommands).toEqual([]);
    });
  });

  describe('Async Actions', () => {
    describe('loadCommands', () => {
      it('should load commands successfully', async () => {
        const mockCommands: Command[] = [
          {
            id: 'tab.search',
            name: 'Search Tabs',
            description: 'Search tabs',
            type: 'search',
          },
        ];

        mockBroker.sendActionRequest.mockResolvedValue({
          success: true,
          data: { commands: mockCommands },
        });

        await useOmniTabStore.getState().loadCommands();

        expect(mockBroker.sendActionRequest).toHaveBeenCalledWith(
          'core',
          'get-commands',
          'list'
        );
        expect(useOmniTabStore.getState().availableCommands).toEqual(
          mockCommands
        );
      });

      it('should handle load commands failure', async () => {
        mockBroker.sendActionRequest.mockResolvedValue({
          success: false,
          error: 'Failed to load commands',
        });

        await useOmniTabStore.getState().loadCommands();

        expect(useOmniTabStore.getState().availableCommands).toEqual([]);
      });

      it('should handle load commands exception', async () => {
        mockBroker.sendActionRequest.mockRejectedValue(
          new Error('Network error')
        );

        await useOmniTabStore.getState().loadCommands();

        expect(useOmniTabStore.getState().availableCommands).toEqual([]);
      });
    });

    describe('loadInitialResults', () => {
      it('should load initial results successfully', async () => {
        const mockResults: SearchResult[] = [
          {
            id: 'tab-1',
            title: 'Tab 1',
            description: '',
            type: 'tab',
            actions: [],
          },
        ];

        mockBroker.sendSearchRequest.mockResolvedValue({
          success: true,
          data: mockResults,
        });

        await useOmniTabStore.getState().loadInitialResults();

        expect(mockBroker.sendSearchRequest).toHaveBeenCalledWith(
          'tab',
          'search-tab',
          ''
        );

        const state = useOmniTabStore.getState();
        expect(state.results).toEqual(mockResults);
        expect(state.loading).toBe(false);
        expect(state.error).toBeUndefined();
      });

      it('should handle load initial results failure', async () => {
        mockBroker.sendSearchRequest.mockResolvedValue({
          success: false,
          error: 'Failed to load results',
        });

        useOmniTabStore.getState().setLoading(true);
        await useOmniTabStore.getState().loadInitialResults();

        // Loading stays true when there's no success response
        expect(useOmniTabStore.getState().loading).toBe(true);
      });

      it('should handle load initial results exception', async () => {
        mockBroker.sendSearchRequest.mockRejectedValue(
          new Error('Network error')
        );

        useOmniTabStore.getState().setLoading(true);
        await useOmniTabStore.getState().loadInitialResults();

        expect(useOmniTabStore.getState().loading).toBe(false);
      });
    });

    describe('performSearch', () => {
      beforeEach(() => {
        const mockCommands: Command[] = [
          {
            id: 'tab.search',
            name: 'Search Tabs',
            description: 'Search tabs',
            type: 'search',
          },
        ];

        useOmniTabStore.getState().setCommands(mockCommands);
        // Clear mocks before each test
        mockPerformSearchService.mockClear();
      });

      it('should perform search successfully', async () => {
        const mockResults: SearchResult[] = [
          {
            id: 'search-1',
            title: 'Search Result',
            description: '',
            type: 'tab',
            actions: [],
          },
        ];

        mockPerformSearchService.mockResolvedValue({
          results: mockResults,
          loading: false,
          activeExtension: 'tab',
          activeCommand: 'search',
        });

        await useOmniTabStore.getState().performSearch('test query');

        const state = useOmniTabStore.getState();
        expect(state.query).toBe('test query');
        expect(state.results).toEqual(mockResults);
        expect(state.loading).toBe(false);
        expect(state.activeExtension).toBe('tab');
        expect(state.activeCommand).toBe('search');
        expect(state.selectedIndex).toBe(0);
      });

      it('should handle empty query by loading initial results', async () => {
        const mockResults: SearchResult[] = [
          {
            id: 'initial-1',
            title: 'Initial Result',
            description: '',
            type: 'tab',
            actions: [],
          },
        ];

        mockBroker.sendSearchRequest.mockResolvedValue({
          success: true,
          data: mockResults,
        });

        await useOmniTabStore.getState().performSearch('   '); // Whitespace only

        expect(mockBroker.sendSearchRequest).toHaveBeenCalledWith(
          'tab',
          'search-tab',
          ''
        );

        const state = useOmniTabStore.getState();
        expect(state.query).toBe('   ');
        expect(state.results).toEqual(mockResults);
      });

      it('should handle search error', async () => {
        mockPerformSearchService.mockResolvedValue({
          results: [],
          loading: false,
          error: 'Search failed',
        });

        await useOmniTabStore.getState().performSearch('test query');

        const state = useOmniTabStore.getState();
        expect(state.error).toBe('Search failed');
        expect(state.loading).toBe(false);
      });

      it('should handle search exception', async () => {
        mockPerformSearchService.mockRejectedValue(new Error('Network error'));

        await useOmniTabStore.getState().performSearch('test query');

        const state = useOmniTabStore.getState();
        expect(state.error).toBe('Network error');
        expect(state.loading).toBe(false);
      });

      it('should clear active extension when not provided in result', async () => {
        mockPerformSearchService.mockResolvedValue({
          results: [],
          loading: false,
        });

        // Set initial active extension
        useOmniTabStore
          .getState()
          .setActiveExtension({ extensionId: 'tab', commandId: 'search' });

        await useOmniTabStore.getState().performSearch('test query');

        const state = useOmniTabStore.getState();
        expect(state.activeExtension).toBeUndefined();
        expect(state.activeCommand).toBeUndefined();
      });
    });
  });

  describe('selectCommand', () => {
    it('should select command and set active extension', () => {
      useOmniTabStore.getState().selectCommand('tab.search');

      const state = useOmniTabStore.getState();
      expect(state.activeExtension).toBe('tab');
      expect(state.activeCommand).toBe('search');
    });

    it('should handle command ID without extension prefix', () => {
      useOmniTabStore.getState().selectCommand('search');

      const state = useOmniTabStore.getState();
      expect(state.activeExtension).toBe('search');
      expect(state.activeCommand).toBeUndefined();
    });
  });

  describe('performDebouncedSearch helper', () => {
    it('should set query and load initial results for empty query', async () => {
      const mockResults: SearchResult[] = [
        {
          id: 'initial-1',
          title: 'Initial Result',
          description: '',
          type: 'tab',
          actions: [],
        },
      ];

      mockBroker.sendSearchRequest.mockResolvedValue({
        success: true,
        data: mockResults,
      });

      performDebouncedSearch('');

      const state = useOmniTabStore.getState();
      expect(state.query).toBe('');
      expect(state.loading).toBe(true);
    });

    it('should set query for non-empty query', () => {
      performDebouncedSearch('test query');

      expect(useOmniTabStore.getState().query).toBe('test query');
    });
  });
});
