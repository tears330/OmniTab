/**
 * Unit tests for TopSites Extension Actions
 */

import { handleTopSitesSearch, openTopSite } from '../actions';

// Mock Chrome APIs
global.chrome = {
  tabs: {
    create: jest.fn(),
  },
  runtime: {
    lastError: null,
  },
} as any;

describe('TopSites Extension Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.chrome.runtime.lastError = undefined;
  });

  describe('openTopSite', () => {
    it('should open a top site URL in a new tab successfully', async () => {
      const mockUrl = 'https://example.com';
      const mockTabsCreate = jest.fn().mockResolvedValue({
        id: 123,
        url: mockUrl,
        active: true,
      });

      global.chrome.tabs.create = mockTabsCreate;

      const result = await openTopSite(mockUrl);

      expect(mockTabsCreate).toHaveBeenCalledWith({
        url: mockUrl,
        active: true,
      });

      expect(result).toEqual({
        success: true,
        data: { action: 'opened', url: mockUrl },
      });
    });

    it('should handle tab creation failure with Error object', async () => {
      const mockUrl = 'https://example.com';
      const mockError = new Error('Failed to create tab');
      const mockTabsCreate = jest.fn().mockRejectedValue(mockError);

      global.chrome.tabs.create = mockTabsCreate;

      const result = await openTopSite(mockUrl);

      expect(mockTabsCreate).toHaveBeenCalledWith({
        url: mockUrl,
        active: true,
      });

      expect(result).toEqual({
        success: false,
        error: 'Failed to create tab',
      });
    });

    it('should handle tab creation failure with non-Error object', async () => {
      const mockUrl = 'https://example.com';
      const mockTabsCreate = jest.fn().mockRejectedValue('Generic error');

      global.chrome.tabs.create = mockTabsCreate;

      const result = await openTopSite(mockUrl);

      expect(result).toEqual({
        success: false,
        error: 'Failed to open top site',
      });
    });

    it('should handle empty URL', async () => {
      const mockTabsCreate = jest.fn().mockResolvedValue({
        id: 123,
        url: '',
        active: true,
      });

      global.chrome.tabs.create = mockTabsCreate;

      const result = await openTopSite('');

      expect(mockTabsCreate).toHaveBeenCalledWith({
        url: '',
        active: true,
      });

      expect(result).toEqual({
        success: true,
        data: { action: 'opened', url: '' },
      });
    });

    it('should handle various URL formats', async () => {
      const testUrls = [
        'https://www.google.com',
        'http://example.com',
        'https://subdomain.example.com/path?query=value',
        'https://localhost:3000',
      ];

      const mockTabsCreate = jest.fn().mockResolvedValue({
        id: 123,
        active: true,
      });

      global.chrome.tabs.create = mockTabsCreate;

      await Promise.all(
        testUrls.map(async (url) => {
          await openTopSite(url);
          expect(mockTabsCreate).toHaveBeenCalledWith({
            url,
            active: true,
          });
        })
      );

      expect(mockTabsCreate).toHaveBeenCalledTimes(testUrls.length);
    });
  });

  describe('handleTopSitesSearch', () => {
    it('should return success response indicating search is ready', async () => {
      const result = await handleTopSitesSearch();

      expect(result).toEqual({
        success: true,
        data: { action: 'search_ready' },
      });
    });

    it('should be synchronous and not depend on external APIs', async () => {
      // Test that the function executes quickly without async operations
      const startTime = Date.now();
      const result = await handleTopSitesSearch();
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(10); // Should be nearly instantaneous
    });

    it('should always return the same response format', async () => {
      // Test consistency across multiple calls
      const results = await Promise.all([
        handleTopSitesSearch(),
        handleTopSitesSearch(),
        handleTopSitesSearch(),
      ]);

      results.forEach((result) => {
        expect(result).toEqual({
          success: true,
          data: { action: 'search_ready' },
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle Chrome API unavailability gracefully', async () => {
      // Temporarily remove the chrome.tabs API
      const originalChrome = global.chrome;
      global.chrome = {} as any;

      const result = await openTopSite('https://example.com');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      // Restore the chrome API
      global.chrome = originalChrome;
    });

    it('should handle undefined chrome.tabs.create', async () => {
      // Save original chrome
      const originalChrome = global.chrome;

      // Create a chrome object without tabs.create
      global.chrome = {
        tabs: {},
        runtime: { lastError: null },
      } as any;

      const result = await openTopSite('https://example.com');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      // Restore original chrome
      global.chrome = originalChrome;
    });

    it('should handle Chrome runtime errors', async () => {
      const mockError = new Error('Extension context invalidated');
      global.chrome.tabs.create = jest.fn().mockRejectedValue(mockError);

      const result = await openTopSite('https://example.com');

      expect(result).toEqual({
        success: false,
        error: 'Extension context invalidated',
      });
    });
  });
});
