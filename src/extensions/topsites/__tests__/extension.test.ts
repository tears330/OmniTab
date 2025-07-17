/**
 * Unit tests for TopSites Extension
 */

import type { ActionPayload, SearchPayload } from '@/types/extension';

// Import mocked modules
import { handleTopSitesSearch, openTopSite } from '../actions';
import { TopSitesCommandId } from '../constants';
import TopSitesExtension from '../extension';
import { searchTopSites } from '../search';

// Mock the actions and search modules
jest.mock('../actions', () => ({
  handleTopSitesSearch: jest.fn(),
  openTopSite: jest.fn(),
}));

jest.mock('../search', () => ({
  searchTopSites: jest.fn(),
}));

// Mock Chrome APIs
global.chrome = {
  topSites: {
    get: jest.fn(),
  },
  runtime: {
    lastError: null,
    getURL: jest.fn((path: string) => `chrome-extension://test-id/${path}`),
  },
} as any;

describe('TopSitesExtension', () => {
  let extension: TopSitesExtension;

  beforeEach(() => {
    jest.clearAllMocks();
    extension = new TopSitesExtension();
    global.chrome.runtime.lastError = undefined;
  });

  describe('Extension Properties', () => {
    it('should have correct extension properties', () => {
      expect(extension.id).toBe('topsites');
      expect(extension.name).toBe('Top Sites');
      expect(extension.description).toBe(
        'Search and access your most visited sites'
      );
      expect(extension.icon).toBe('chrome-extension://test-id/icon16.png');
    });

    it('should have correct commands configuration', () => {
      expect(extension.commands).toHaveLength(1);

      const searchCommand = extension.commands[0];
      expect(searchCommand.id).toBe(TopSitesCommandId.SEARCH);
      expect(searchCommand.name).toBe('Search Top Sites');
      expect(searchCommand.description).toBe('Search your most visited sites');
      expect(searchCommand.alias).toEqual(['topsites', 'top', 'ts', 'sites']);
      expect(searchCommand.type).toBe('search');
    });
  });

  describe('initialize', () => {
    it('should initialize successfully when Chrome topSites API is available', async () => {
      global.chrome.topSites = { get: jest.fn() };

      await expect(extension.initialize()).resolves.toBeUndefined();
    });

    it('should handle missing Chrome topSites API gracefully', async () => {
      global.chrome.topSites = undefined as any;

      await expect(extension.initialize()).resolves.toBeUndefined();
    });

    it('should handle Chrome API errors gracefully', async () => {
      global.chrome.topSites = {
        get: jest.fn(() => {
          throw new Error('API error');
        }),
      };

      await expect(extension.initialize()).resolves.toBeUndefined();
    });
  });

  describe('handleSearch', () => {
    const mockSearchTopSites = searchTopSites as jest.MockedFunction<
      typeof searchTopSites
    >;

    beforeEach(() => {
      mockSearchTopSites.mockClear();
    });

    it('should handle search successfully with results', async () => {
      const mockResults = [
        {
          id: 'topsites-0',
          title: 'Google',
          description: 'google.com',
          type: 'topSites',
          actions: [],
          metadata: { url: 'https://google.com' },
        },
      ];

      mockSearchTopSites.mockResolvedValue(mockResults);

      const payload: SearchPayload = { query: 'google' };
      const result = await extension.handleSearch(
        TopSitesCommandId.SEARCH,
        payload
      );

      expect(mockSearchTopSites).toHaveBeenCalledWith('google');
      expect(result).toEqual({
        success: true,
        data: mockResults,
      });
    });

    it('should handle search with empty results', async () => {
      mockSearchTopSites.mockResolvedValue([]);

      const payload: SearchPayload = { query: 'nonexistent' };
      const result = await extension.handleSearch(
        TopSitesCommandId.SEARCH,
        payload
      );

      expect(mockSearchTopSites).toHaveBeenCalledWith('nonexistent');
      expect(result).toEqual({
        success: true,
        data: [],
      });
    });

    it('should handle search with empty query', async () => {
      const mockResults = [
        {
          id: 'topsites-0',
          title: 'Google',
          description: 'google.com',
          type: 'topSites',
          actions: [],
          metadata: { url: 'https://google.com' },
        },
      ];

      mockSearchTopSites.mockResolvedValue(mockResults);

      const payload: SearchPayload = { query: '' };
      const result = await extension.handleSearch(
        TopSitesCommandId.SEARCH,
        payload
      );

      expect(mockSearchTopSites).toHaveBeenCalledWith('');
      expect(result).toEqual({
        success: true,
        data: mockResults,
      });
    });

    it('should handle unknown command', async () => {
      const payload: SearchPayload = { query: 'test' };
      const result = await extension.handleSearch('unknown-command', payload);

      expect(result).toEqual({
        success: false,
        error: 'Unknown command: unknown-command',
      });
    });

    it('should handle search error', async () => {
      mockSearchTopSites.mockRejectedValue(new Error('Search failed'));

      const payload: SearchPayload = { query: 'test' };
      const result = await extension.handleSearch(
        TopSitesCommandId.SEARCH,
        payload
      );

      expect(result).toEqual({
        success: false,
        error: 'Search failed',
      });
    });

    it('should handle permission denied error', async () => {
      mockSearchTopSites.mockRejectedValue(
        new Error('Permission denied for topSites')
      );

      const payload: SearchPayload = { query: 'test' };
      const result = await extension.handleSearch(
        TopSitesCommandId.SEARCH,
        payload
      );

      expect(result).toEqual({
        success: false,
        error: 'Permission denied. Top sites access requires user permission.',
      });
    });

    it('should handle generic permission error', async () => {
      mockSearchTopSites.mockRejectedValue(
        new Error('Access permission required')
      );

      const payload: SearchPayload = { query: 'test' };
      const result = await extension.handleSearch(
        TopSitesCommandId.SEARCH,
        payload
      );

      expect(result).toEqual({
        success: false,
        error: 'Permission denied. Top sites access requires user permission.',
      });
    });

    it('should handle non-Error exceptions', async () => {
      mockSearchTopSites.mockRejectedValue('String error');

      const payload: SearchPayload = { query: 'test' };
      const result = await extension.handleSearch(
        TopSitesCommandId.SEARCH,
        payload
      );

      expect(result).toEqual({
        success: false,
        error: 'Failed to search top sites',
      });
    });
  });

  describe('handleAction', () => {
    const mockHandleTopSitesSearch =
      handleTopSitesSearch as jest.MockedFunction<typeof handleTopSitesSearch>;
    const mockOpenTopSite = openTopSite as jest.MockedFunction<
      typeof openTopSite
    >;

    beforeEach(() => {
      mockHandleTopSitesSearch.mockClear();
      mockOpenTopSite.mockClear();
      // Reset to default successful responses
      mockHandleTopSitesSearch.mockResolvedValue({
        success: true,
        data: { actionId: 'search_ready' },
      });
      mockOpenTopSite.mockResolvedValue({
        success: true,
        data: { actionId: 'opened' },
      });
    });

    it('should handle search action command', async () => {
      const mockResponse = {
        success: true,
        data: { actionId: 'search_ready' },
      };

      mockHandleTopSitesSearch.mockResolvedValue(mockResponse);

      const payload: ActionPayload = { actionId: 'execute' };
      const result = await extension.handleAction(
        TopSitesCommandId.SEARCH,
        payload
      );

      expect(mockHandleTopSitesSearch).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });

    it('should handle result-based action with URL metadata', async () => {
      const mockResponse = {
        success: true,
        data: { actionId: 'opened', url: 'https://example.com' },
      };

      mockOpenTopSite.mockResolvedValue(mockResponse);

      const payload: ActionPayload = {
        actionId: 'open',
        metadata: { url: 'https://example.com' },
      };

      const result = await extension.handleAction('open', payload);

      expect(mockOpenTopSite).toHaveBeenCalledWith('https://example.com');
      expect(result).toEqual(mockResponse);
    });

    it('should handle result-based action without URL metadata', async () => {
      const payload: ActionPayload = {
        actionId: 'open',
        metadata: { title: 'Test' },
      };

      const result = await extension.handleAction('open', payload);

      expect(result).toEqual({
        success: false,
        error: 'Unknown command: open',
      });
    });

    it('should handle result-based action with undefined metadata', async () => {
      const payload: ActionPayload = { actionId: 'open' };

      const result = await extension.handleAction('open', payload);

      expect(result).toEqual({
        success: false,
        error: 'Unknown command: open',
      });
    });

    it('should handle unknown action command', async () => {
      const payload: ActionPayload = { actionId: 'unknown' };

      const result = await extension.handleAction('unknown-command', payload);

      expect(result).toEqual({
        success: false,
        error: 'Unknown command: unknown-command',
      });
    });

    it('should handle successful action execution', async () => {
      // This test verifies that the try-catch block works for successful operations
      const payload: ActionPayload = { actionId: 'execute' };

      const result = await extension.handleAction(
        TopSitesCommandId.SEARCH,
        payload
      );

      expect(result).toEqual({
        success: true,
        data: { actionId: 'search_ready' },
      });
    });

    it('should handle successful openTopSite action', async () => {
      // This test verifies that the try-catch block works for successful operations
      const payload: ActionPayload = {
        actionId: 'open',
        metadata: { url: 'https://example.com' },
      };

      const result = await extension.handleAction('open', payload);

      expect(result).toEqual({
        success: true,
        data: { actionId: 'opened' },
      });
    });
  });

  describe('Command Configuration', () => {
    it('should have valid command structure', () => {
      extension.commands.forEach((command) => {
        expect(command).toHaveProperty('id');
        expect(command).toHaveProperty('name');
        expect(command).toHaveProperty('description');
        expect(command).toHaveProperty('alias');
        expect(command).toHaveProperty('type');
        expect(Array.isArray(command.alias)).toBe(true);
        expect(command.alias.length).toBeGreaterThan(0);
      });
    });

    it('should have unique command IDs', () => {
      const commandIds = extension.commands.map((cmd) => cmd.id);
      const uniqueIds = [...new Set(commandIds)];
      expect(commandIds).toHaveLength(uniqueIds.length);
    });

    it('should have valid command types', () => {
      const validTypes = ['search', 'action'];
      extension.commands.forEach((command) => {
        expect(validTypes).toContain(command.type);
      });
    });
  });

  describe('Extension Interface Compliance', () => {
    it('should implement required BaseExtension methods', () => {
      expect(typeof extension.initialize).toBe('function');
      expect(typeof extension.handleSearch).toBe('function');
      expect(typeof extension.handleAction).toBe('function');
    });

    it('should have required properties', () => {
      expect(typeof extension.id).toBe('string');
      expect(typeof extension.name).toBe('string');
      expect(typeof extension.description).toBe('string');
      expect(typeof extension.icon).toBe('string');
      expect(Array.isArray(extension.commands)).toBe(true);
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle null payload in handleSearch', async () => {
      const mockSearchTopSites = searchTopSites as jest.MockedFunction<
        typeof searchTopSites
      >;
      mockSearchTopSites.mockResolvedValue([]);

      const result = await extension.handleSearch(
        TopSitesCommandId.SEARCH,
        null as any
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle null payload in handleAction', async () => {
      // Reset the mock to avoid interference from previous test
      const mockHandleTopSitesSearch =
        handleTopSitesSearch as jest.MockedFunction<
          typeof handleTopSitesSearch
        >;
      mockHandleTopSitesSearch.mockClear();
      mockHandleTopSitesSearch.mockResolvedValue({
        success: true,
        data: { actionId: 'search_ready' },
      });

      const result = await extension.handleAction(
        TopSitesCommandId.SEARCH,
        null as any
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ actionId: 'search_ready' });
    });

    it('should handle empty string command in handleSearch', async () => {
      const payload: SearchPayload = { query: 'test' };
      const result = await extension.handleSearch('', payload);

      expect(result).toEqual({
        success: false,
        error: 'Unknown command: ',
      });
    });

    it('should handle empty string command in handleAction', async () => {
      const payload: ActionPayload = { actionId: 'test' };
      const result = await extension.handleAction('', payload);

      expect(result).toEqual({
        success: false,
        error: 'Unknown command: ',
      });
    });

    it('should handle undefined command in handleSearch', async () => {
      const payload: SearchPayload = { query: 'test' };
      const result = await extension.handleSearch(undefined as any, payload);

      expect(result).toEqual({
        success: false,
        error: 'Unknown command: undefined',
      });
    });

    it('should handle undefined command in handleAction', async () => {
      const payload: ActionPayload = { actionId: 'test' };
      const result = await extension.handleAction(undefined as any, payload);

      expect(result).toEqual({
        success: false,
        error: 'Unknown command: undefined',
      });
    });
  });

  describe('Performance and Reliability', () => {
    beforeEach(() => {
      // Clear all mocks before each test
      jest.clearAllMocks();
    });

    it('should handle multiple concurrent search requests', async () => {
      const mockSearchTopSites = searchTopSites as jest.MockedFunction<
        typeof searchTopSites
      >;
      mockSearchTopSites.mockResolvedValue([]);

      const payload: SearchPayload = { query: 'test' };
      const promises = Array(10)
        .fill(null)
        .map(() => extension.handleSearch(TopSitesCommandId.SEARCH, payload));

      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result.success).toBe(true);
        expect(result.data).toEqual([]);
      });

      expect(mockSearchTopSites).toHaveBeenCalledTimes(10);
    });

    it('should handle multiple concurrent action requests', async () => {
      const mockHandleTopSitesSearch =
        handleTopSitesSearch as jest.MockedFunction<
          typeof handleTopSitesSearch
        >;
      mockHandleTopSitesSearch.mockResolvedValue({
        success: true,
        data: { actionId: 'search_ready' },
      });

      const payload: ActionPayload = { actionId: 'execute' };
      const promises = Array(10)
        .fill(null)
        .map(() => extension.handleAction(TopSitesCommandId.SEARCH, payload));

      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result.success).toBe(true);
        expect(result.data).toEqual({ actionId: 'search_ready' });
      });

      expect(mockHandleTopSitesSearch).toHaveBeenCalledTimes(10);
    });

    it('should maintain state consistency across multiple operations', async () => {
      // Test that the extension doesn't maintain harmful state between operations
      const mockSearchTopSites = searchTopSites as jest.MockedFunction<
        typeof searchTopSites
      >;

      // First call
      mockSearchTopSites.mockResolvedValueOnce([
        {
          id: 'test-1',
          title: 'Test 1',
          actions: [],
          type: 'topSites',
        },
      ]);
      const result1 = await extension.handleSearch(TopSitesCommandId.SEARCH, {
        query: 'test1',
      });

      // Second call
      mockSearchTopSites.mockResolvedValueOnce([
        {
          id: 'test-2',
          title: 'Test 2',
          actions: [],
          type: 'topSites',
        },
      ]);
      const result2 = await extension.handleSearch(TopSitesCommandId.SEARCH, {
        query: 'test2',
      });

      expect(result1.data).toEqual([
        {
          id: 'test-1',
          title: 'Test 1',
          actions: [],
          type: 'topSites',
        },
      ]);
      expect(result2.data).toEqual([
        {
          id: 'test-2',
          title: 'Test 2',
          actions: [],
          type: 'topSites',
        },
      ]);
      expect(mockSearchTopSites).toHaveBeenCalledTimes(2);
    });
  });
});
