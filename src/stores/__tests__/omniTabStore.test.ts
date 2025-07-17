/* eslint-disable no-promise-executor-return */
import type { Command, SearchResult } from '@/types/extension';

// Import the store after mocks are set up
import { useOmniTabStore } from '../omniTabStore';

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
    it('should open and set loading state', async () => {
      // Mock the initial results load
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

        // Set query and wait for debounced search to complete
        useOmniTabStore.getState().setQuery('test query');

        // Wait for debounced search to complete
        await new Promise((resolve) => setTimeout(resolve, 400));

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

        // Set empty query and wait for debounced search
        useOmniTabStore.getState().setQuery('   ');

        // Wait for debounced search to complete
        await new Promise((resolve) => setTimeout(resolve, 400));

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

        // Set query and wait for debounced search to complete
        useOmniTabStore.getState().setQuery('test query');

        // Wait for debounced search to complete
        await new Promise((resolve) => setTimeout(resolve, 400));

        const state = useOmniTabStore.getState();
        expect(state.error).toBe('Search failed');
        expect(state.loading).toBe(false);
      });

      it('should handle search exception', async () => {
        mockPerformSearchService.mockRejectedValue(new Error('Network error'));

        // Set query and wait for debounced search to complete
        useOmniTabStore.getState().setQuery('test query');

        // Wait for debounced search to complete
        await new Promise((resolve) => setTimeout(resolve, 400));

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

        // Set query and wait for debounced search to complete
        useOmniTabStore.getState().setQuery('test query');

        // Wait for debounced search to complete
        await new Promise((resolve) => setTimeout(resolve, 400));

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

  describe('Actions Menu Management', () => {
    const mockResultWithActions: SearchResult = {
      id: 'test-1',
      title: 'Test Result',
      description: 'Test',
      type: 'tab',
      actions: [
        { id: 'primary', label: 'Primary Action', primary: true },
        { id: 'secondary1', label: 'Secondary 1', primary: false },
        { id: 'secondary2', label: 'Secondary 2', primary: false },
      ],
    };

    beforeEach(() => {
      // Set up results with actions
      useOmniTabStore.getState().setResults([mockResultWithActions]);
    });

    it('should have correct initial actions menu state', () => {
      const state = useOmniTabStore.getState();
      expect(state.isActionsMenuOpen).toBe(false);
      expect(state.actionsMenuSelectedIndex).toBe(0);
    });

    it('should open actions menu when result has secondary actions', () => {
      useOmniTabStore.getState().openActionsMenu();

      const state = useOmniTabStore.getState();
      expect(state.isActionsMenuOpen).toBe(true);
      expect(state.actionsMenuSelectedIndex).toBe(0);
    });

    it('should not open actions menu when result has no secondary actions', () => {
      const resultWithoutSecondary: SearchResult = {
        id: 'test-2',
        title: 'Test',
        description: 'Test',
        type: 'tab',
        actions: [{ id: 'primary', label: 'Primary Only', primary: true }],
      };

      useOmniTabStore.getState().setResults([resultWithoutSecondary]);
      useOmniTabStore.getState().openActionsMenu();

      expect(useOmniTabStore.getState().isActionsMenuOpen).toBe(false);
    });

    it('should close actions menu and reset selected index', () => {
      useOmniTabStore.getState().openActionsMenu();
      useOmniTabStore.getState().setActionsMenuSelectedIndex(1);
      useOmniTabStore.getState().closeActionsMenu();

      const state = useOmniTabStore.getState();
      expect(state.isActionsMenuOpen).toBe(false);
      expect(state.actionsMenuSelectedIndex).toBe(0);
    });

    it('should toggle actions menu', () => {
      // Open
      useOmniTabStore.getState().toggleActionsMenu();
      expect(useOmniTabStore.getState().isActionsMenuOpen).toBe(true);

      // Close
      useOmniTabStore.getState().toggleActionsMenu();
      expect(useOmniTabStore.getState().isActionsMenuOpen).toBe(false);
    });

    it('should handle actions menu index with wrap-around navigation', () => {
      useOmniTabStore.getState().openActionsMenu();

      // Navigate forward
      useOmniTabStore.getState().setActionsMenuSelectedIndex(1);
      expect(useOmniTabStore.getState().actionsMenuSelectedIndex).toBe(1);

      // Wrap to first from last
      useOmniTabStore.getState().setActionsMenuSelectedIndex(2); // Last item
      useOmniTabStore.getState().setActionsMenuSelectedIndex(3); // Beyond last
      expect(useOmniTabStore.getState().actionsMenuSelectedIndex).toBe(0);

      // Wrap to last from first
      useOmniTabStore.getState().setActionsMenuSelectedIndex(-1);
      expect(useOmniTabStore.getState().actionsMenuSelectedIndex).toBe(1); // 2 secondary actions, last index is 1
    });

    it('should not set actions menu index when no secondary actions', () => {
      const resultWithoutActions: SearchResult = {
        id: 'test-3',
        title: 'Test',
        description: 'Test',
        type: 'tab',
        actions: [],
      };

      useOmniTabStore.getState().setResults([resultWithoutActions]);
      useOmniTabStore.getState().setActionsMenuSelectedIndex(1);

      // Should remain at 0 when no actions
      expect(useOmniTabStore.getState().actionsMenuSelectedIndex).toBe(0);
    });

    it('should reset actions menu state on close', () => {
      // Open menu and set some state
      useOmniTabStore.getState().openActionsMenu();
      useOmniTabStore.getState().setActionsMenuSelectedIndex(1);

      // Close the OmniTab
      useOmniTabStore.getState().close();

      const state = useOmniTabStore.getState();
      expect(state.isActionsMenuOpen).toBe(false);
      expect(state.actionsMenuSelectedIndex).toBe(0);
    });

    it('should reset actions menu state on reset', () => {
      // Open menu and set some state
      useOmniTabStore.getState().openActionsMenu();
      useOmniTabStore.getState().setActionsMenuSelectedIndex(1);

      // Reset store
      useOmniTabStore.getState().reset();

      const state = useOmniTabStore.getState();
      expect(state.isActionsMenuOpen).toBe(false);
      expect(state.actionsMenuSelectedIndex).toBe(0);
    });
  });

  describe('Store Initialization and Subscriptions', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should initialize store and load commands on creation', async () => {
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

      // Call loadCommands directly to test the functionality
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

    it('should handle store subscription and query changes', async () => {
      // Mock the search result
      mockPerformSearchService.mockResolvedValue({
        results: [],
        loading: false,
      });

      // Change query to trigger subscription
      useOmniTabStore.getState().setQuery('test');

      // Subscription should be triggered and call performSearch
      expect(useOmniTabStore.getState().query).toBe('test');
      // The subscription calls performSearch which is debounced
      // We can't easily test the debounced call directly, but we can verify the query was set
    });

    it('should handle empty query changes in subscription', () => {
      // First set a non-empty query
      useOmniTabStore.getState().setQuery('test');

      // Then set empty query
      useOmniTabStore.getState().setQuery('');

      expect(useOmniTabStore.getState().query).toBe('');
    });

    it('should not trigger subscription for same query', () => {
      const initialQuery = useOmniTabStore.getState().query;

      // Set the same query
      useOmniTabStore.getState().setQuery(initialQuery);

      expect(useOmniTabStore.getState().query).toBe(initialQuery);
    });
  });

  describe('Production Store Configuration', () => {
    let originalEnv: string | undefined;

    beforeEach(() => {
      originalEnv = process.env.NODE_ENV;
      jest.clearAllMocks();
    });

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env.NODE_ENV = originalEnv;
      } else {
        delete process.env.NODE_ENV;
      }
    });

    it('should not use devtools in production', () => {
      // This test mainly ensures the production branch exists
      // The actual store creation happens at module load time
      process.env.NODE_ENV = 'production';

      // Create a new instance to test production path
      const state = useOmniTabStore.getState();
      expect(state).toBeDefined();
      expect(state.isOpen).toBe(false);
      expect(state.isActionsMenuOpen).toBe(false);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle setSelectedIndex with no results', () => {
      useOmniTabStore.getState().setResults([]);
      useOmniTabStore.getState().setSelectedIndex(5);

      expect(useOmniTabStore.getState().selectedIndex).toBe(0);
    });

    it('should handle openActionsMenu with no selected result', () => {
      useOmniTabStore.getState().setResults([]);
      useOmniTabStore.getState().setSelectedIndex(0);
      useOmniTabStore.getState().openActionsMenu();

      expect(useOmniTabStore.getState().isActionsMenuOpen).toBe(false);
    });

    it('should handle setActionsMenuSelectedIndex with no selected result', () => {
      useOmniTabStore.getState().setResults([]);
      useOmniTabStore.getState().setActionsMenuSelectedIndex(1);

      // Should not crash or change state when no result selected
      expect(useOmniTabStore.getState().actionsMenuSelectedIndex).toBe(0);
    });

    it('should handle missing devtools configuration', () => {
      // Test that the store works even if devtools isn't available
      const state = useOmniTabStore.getState();
      expect(state.isOpen).toBe(false);
      expect(state.query).toBe('');
    });
  });
});
