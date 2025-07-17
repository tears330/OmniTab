/**
 * Production environment tests for omniTabStore
 * These tests specifically target the production store configuration
 */

// Set production environment before any imports
const originalNodeEnv = process.env.NODE_ENV;
process.env.NODE_ENV = 'production';

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

// Mock storeLogger
jest.mock('@/utils/storeLogger', () => ({
  __esModule: true,
  default: jest.fn(() => jest.fn()),
}));

describe('omniTabStore - Production Environment', () => {
  afterAll(() => {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create store without devtools in production', async () => {
    // Clear the module cache to ensure we test the production path
    jest.resetModules();

    // Re-import the store after setting production environment
    const { useOmniTabStore } = await import('../omniTabStore');

    const state = useOmniTabStore.getState();

    // Test basic store functionality in production
    expect(state.isOpen).toBe(false);
    expect(state.query).toBe('');
    expect(state.selectedIndex).toBe(0);
    expect(state.results).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.error).toBeUndefined();
    expect(state.activeExtension).toBeUndefined();
    expect(state.activeCommand).toBeUndefined();
    expect(state.availableCommands).toEqual([]);
    expect(state.isActionsMenuOpen).toBe(false);
    expect(state.actionsMenuSelectedIndex).toBe(0);
  });

  it('should handle basic operations in production mode', async () => {
    jest.resetModules();
    const { useOmniTabStore } = await import('../omniTabStore');

    // Test opening the store
    useOmniTabStore.getState().open();
    expect(useOmniTabStore.getState().isOpen).toBe(true);
    expect(useOmniTabStore.getState().loading).toBe(true);

    // Test closing the store
    useOmniTabStore.getState().close();
    expect(useOmniTabStore.getState().isOpen).toBe(false);
    expect(useOmniTabStore.getState().isActionsMenuOpen).toBe(false);
    expect(useOmniTabStore.getState().actionsMenuSelectedIndex).toBe(0);
  });
});
