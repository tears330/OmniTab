/**
 * Unit tests for TopSites Extension Search Utilities
 */

import type { SearchResult } from '@/types/extension';

import {
  filterTopSites,
  getTopSites,
  searchTopSites,
  topSiteToSearchResult,
} from '../search';

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

// Mock URL utils
jest.mock('@/utils/urlUtils', () => ({
  getDomain: jest.fn((url: string) => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace(/^www\./, '');
    } catch {
      return '';
    }
  }),
  getFaviconUrl: jest.fn((url: string) => {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`;
    } catch {
      return null;
    }
  }),
}));

describe('TopSites Extension Search Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.chrome.runtime.lastError = undefined;
  });

  describe('getTopSites', () => {
    it('should return top sites successfully', async () => {
      const mockTopSites: chrome.topSites.MostVisitedURL[] = [
        { url: 'https://google.com', title: 'Google' },
        { url: 'https://github.com', title: 'GitHub' },
        { url: 'https://stackoverflow.com', title: 'Stack Overflow' },
      ];

      const mockGet = jest.fn(
        (callback: (data: chrome.topSites.MostVisitedURL[]) => void) => {
          callback(mockTopSites);
        }
      );

      global.chrome.topSites.get = mockGet as any;

      const result = await getTopSites();

      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockTopSites);
    });

    it('should handle empty top sites array', async () => {
      const mockGet = jest.fn(
        (callback: (data: chrome.topSites.MostVisitedURL[]) => void) => {
          callback([]);
        }
      );

      global.chrome.topSites.get = mockGet as any;

      const result = await getTopSites();

      expect(result).toEqual([]);
    });

    it('should handle Chrome runtime error', async () => {
      const mockGet = jest.fn(
        (callback: (data: chrome.topSites.MostVisitedURL[]) => void) => {
          global.chrome.runtime.lastError = { message: 'Permission denied' };
          callback([]);
        }
      );

      global.chrome.topSites.get = mockGet as any;

      await expect(getTopSites()).rejects.toThrow('Permission denied');
    });

    it('should handle missing Chrome topSites API', async () => {
      global.chrome.topSites = undefined as any;

      await expect(getTopSites()).rejects.toThrow(
        'Chrome topSites API not available'
      );
    });

    it('should handle null callback result', async () => {
      const mockGet = jest.fn(
        (callback: (data: chrome.topSites.MostVisitedURL[]) => void) => {
          callback([]);
        }
      );

      // Ensure topSites exists
      global.chrome.topSites = { get: mockGet as any };

      const result = await getTopSites();

      expect(result).toEqual([]);
    });

    it('should handle undefined callback result', async () => {
      const mockGet = jest.fn(
        (callback: (data: chrome.topSites.MostVisitedURL[]) => void) => {
          callback([]);
        }
      );

      // Ensure topSites exists
      global.chrome.topSites = { get: mockGet as any };

      const result = await getTopSites();

      expect(result).toEqual([]);
    });
  });

  describe('topSiteToSearchResult', () => {
    it('should convert top site to search result with all fields', () => {
      const mockTopSite: chrome.topSites.MostVisitedURL = {
        url: 'https://www.google.com',
        title: 'Google',
      };

      const result = topSiteToSearchResult(mockTopSite, 0);

      expect(result).toEqual({
        id: 'topsites-0',
        title: 'Google',
        description: 'google.com',
        icon: 'https://www.google.com/favicon.ico',
        type: 'topSites',
        actions: [
          {
            id: 'open',
            label: 'Open site',
            shortcut: 'Enter',
            primary: true,
          },
        ],
        metadata: {
          url: 'https://www.google.com',
          score: 100,
          source: 'topsites',
        },
      });
    });

    it('should handle top site without title', () => {
      const mockTopSite: chrome.topSites.MostVisitedURL = {
        url: 'https://example.com',
        title: '',
      };

      const result = topSiteToSearchResult(mockTopSite, 1);

      expect(result.title).toBe('example.com');
      expect(result.description).toBe('example.com');
      expect(result.metadata!.score).toBe(99);
    });

    it('should handle top site with null title', () => {
      const mockTopSite: chrome.topSites.MostVisitedURL = {
        url: 'https://test.com',
        title: null as any,
      };

      const result = topSiteToSearchResult(mockTopSite, 2);

      expect(result.title).toBe('test.com');
      expect(result.metadata!.score).toBe(98);
    });

    it('should handle top site with undefined title', () => {
      const mockTopSite: chrome.topSites.MostVisitedURL = {
        url: 'https://site.com',
        title: undefined as any,
      };

      const result = topSiteToSearchResult(mockTopSite, 3);

      expect(result.title).toBe('site.com');
      expect(result.metadata!.score).toBe(97);
    });

    it('should use fallback icon when favicon is not available', () => {
      const mockTopSite: chrome.topSites.MostVisitedURL = {
        url: 'invalid-url',
        title: 'Invalid Site',
      };

      const result = topSiteToSearchResult(mockTopSite, 0);

      expect(result.icon).toBe('chrome-extension://test-id/icon16.png');
    });

    it('should handle various URL formats', () => {
      const testCases = [
        {
          url: 'https://subdomain.example.com/path',
          expectedDomain: 'subdomain.example.com',
        },
        {
          url: 'http://localhost:3000',
          expectedDomain: 'localhost', // Note: port is stripped by getDomain mock
        },
        {
          url: 'https://www.test.co.uk',
          expectedDomain: 'test.co.uk',
        },
      ];

      testCases.forEach((testCase, index) => {
        const mockTopSite: chrome.topSites.MostVisitedURL = {
          url: testCase.url,
          title: 'Test Site',
        };

        const result = topSiteToSearchResult(mockTopSite, index);

        expect(result.description).toBe(testCase.expectedDomain);
        expect(result.metadata!.url).toBe(testCase.url);
      });
    });

    it('should generate unique IDs for different indices', () => {
      const mockTopSite: chrome.topSites.MostVisitedURL = {
        url: 'https://example.com',
        title: 'Example',
      };

      const result1 = topSiteToSearchResult(mockTopSite, 0);
      const result2 = topSiteToSearchResult(mockTopSite, 5);
      const result3 = topSiteToSearchResult(mockTopSite, 10);

      expect(result1.id).toBe('topsites-0');
      expect(result2.id).toBe('topsites-5');
      expect(result3.id).toBe('topsites-10');
    });

    it('should calculate score based on index', () => {
      const mockTopSite: chrome.topSites.MostVisitedURL = {
        url: 'https://example.com',
        title: 'Example',
      };

      const result1 = topSiteToSearchResult(mockTopSite, 0);
      const result2 = topSiteToSearchResult(mockTopSite, 5);
      const result3 = topSiteToSearchResult(mockTopSite, 19);

      expect(result1.metadata!.score).toBe(100);
      expect(result2.metadata!.score).toBe(95);
      expect(result3.metadata!.score).toBe(81);
    });
  });

  describe('filterTopSites', () => {
    const mockTopSites: chrome.topSites.MostVisitedURL[] = [
      { url: 'https://google.com', title: 'Google' },
      { url: 'https://github.com', title: 'GitHub' },
      { url: 'https://stackoverflow.com', title: 'Stack Overflow' },
      { url: 'https://developer.mozilla.org', title: 'MDN Web Docs' },
      { url: 'https://reddit.com', title: 'Reddit' },
    ];

    it('should return all sites when query is empty', () => {
      const result = filterTopSites(mockTopSites, '');

      expect(result).toEqual(mockTopSites);
    });

    it('should return all sites when query is whitespace only', () => {
      const result = filterTopSites(mockTopSites, '   ');

      expect(result).toEqual(mockTopSites);
    });

    it('should filter by title (case insensitive)', () => {
      const result = filterTopSites(mockTopSites, 'git');

      expect(result).toEqual([{ url: 'https://github.com', title: 'GitHub' }]);
    });

    it('should filter by title with different case', () => {
      const result = filterTopSites(mockTopSites, 'GITHUB');

      expect(result).toEqual([{ url: 'https://github.com', title: 'GitHub' }]);
    });

    it('should filter by URL', () => {
      const result = filterTopSites(mockTopSites, 'stackoverflow');

      expect(result).toEqual([
        { url: 'https://stackoverflow.com', title: 'Stack Overflow' },
      ]);
    });

    it('should filter by domain', () => {
      const result = filterTopSites(mockTopSites, 'reddit');

      expect(result).toEqual([{ url: 'https://reddit.com', title: 'Reddit' }]);
    });

    it('should return multiple matches', () => {
      const result = filterTopSites(mockTopSites, 'o');

      expect(result).toHaveLength(5); // Google, GitHub, Stack Overflow, MDN, Reddit all contain 'o'
      expect(result).toContainEqual({
        url: 'https://google.com',
        title: 'Google',
      });
      expect(result).toContainEqual({
        url: 'https://github.com',
        title: 'GitHub',
      });
      expect(result).toContainEqual({
        url: 'https://stackoverflow.com',
        title: 'Stack Overflow',
      });
      expect(result).toContainEqual({
        url: 'https://developer.mozilla.org',
        title: 'MDN Web Docs',
      });
      expect(result).toContainEqual({
        url: 'https://reddit.com',
        title: 'Reddit',
      });
    });

    it('should return empty array when no matches found', () => {
      const result = filterTopSites(mockTopSites, 'nonexistent');

      expect(result).toEqual([]);
    });

    it('should handle sites with empty/null titles', () => {
      const sitesWithEmptyTitles: chrome.topSites.MostVisitedURL[] = [
        { url: 'https://example.com', title: '' },
        { url: 'https://test.com', title: null as any },
        { url: 'https://sample.com', title: 'Sample' },
      ];

      const result = filterTopSites(sitesWithEmptyTitles, 'example');

      expect(result).toEqual([{ url: 'https://example.com', title: '' }]);
    });

    it('should limit results to MAX_RESULTS', () => {
      // Create more than MAX_RESULTS (20) items
      const manyTopSites: chrome.topSites.MostVisitedURL[] = Array.from(
        { length: 25 },
        (_, i) => ({
          url: `https://site${i}.com`,
          title: `Site ${i}`,
        })
      );

      const result = filterTopSites(manyTopSites, '');

      expect(result).toHaveLength(20); // MAX_RESULTS
    });

    it('should limit filtered results to MAX_RESULTS', () => {
      // Create more than MAX_RESULTS items that match the query
      const manyMatchingSites: chrome.topSites.MostVisitedURL[] = Array.from(
        { length: 25 },
        (_, i) => ({
          url: `https://test${i}.com`,
          title: `Test Site ${i}`,
        })
      );

      const result = filterTopSites(manyMatchingSites, 'test');

      expect(result).toHaveLength(20); // MAX_RESULTS
    });

    it('should handle partial matches in URL paths', () => {
      const sitesWithPaths: chrome.topSites.MostVisitedURL[] = [
        { url: 'https://example.com/docs', title: 'Documentation' },
        { url: 'https://test.com/blog', title: 'Blog' },
        { url: 'https://site.com/docs/guide', title: 'Guide' },
      ];

      const result = filterTopSites(sitesWithPaths, 'docs');

      expect(result).toHaveLength(2);
      expect(result).toContainEqual({
        url: 'https://example.com/docs',
        title: 'Documentation',
      });
      expect(result).toContainEqual({
        url: 'https://site.com/docs/guide',
        title: 'Guide',
      });
    });
  });

  describe('searchTopSites', () => {
    beforeEach(() => {
      // Ensure chrome.topSites exists for each test
      global.chrome.topSites = { get: jest.fn() };
    });

    it('should search top sites successfully', async () => {
      const mockTopSites: chrome.topSites.MostVisitedURL[] = [
        { url: 'https://google.com', title: 'Google' },
        { url: 'https://github.com', title: 'GitHub' },
      ];

      const mockGet = jest.fn(
        (callback: (data: chrome.topSites.MostVisitedURL[]) => void) => {
          callback(mockTopSites);
        }
      );

      global.chrome.topSites.get = mockGet as any;

      const result = await searchTopSites('');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('topsites-0');
      expect(result[0].title).toBe('Google');
      expect(result[1].id).toBe('topsites-1');
      expect(result[1].title).toBe('GitHub');
    });

    it('should search and filter top sites', async () => {
      const mockTopSites: chrome.topSites.MostVisitedURL[] = [
        { url: 'https://google.com', title: 'Google' },
        { url: 'https://github.com', title: 'GitHub' },
        { url: 'https://stackoverflow.com', title: 'Stack Overflow' },
      ];

      const mockGet = jest.fn(
        (callback: (data: chrome.topSites.MostVisitedURL[]) => void) => {
          callback(mockTopSites);
        }
      );

      global.chrome.topSites.get = mockGet as any;

      const result = await searchTopSites('git');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('GitHub');
      expect(result[0].metadata!.url).toBe('https://github.com');
    });

    it('should return empty array when no matches found', async () => {
      const mockTopSites: chrome.topSites.MostVisitedURL[] = [
        { url: 'https://google.com', title: 'Google' },
        { url: 'https://github.com', title: 'GitHub' },
      ];

      const mockGet = jest.fn(
        (callback: (data: chrome.topSites.MostVisitedURL[]) => void) => {
          callback(mockTopSites);
        }
      );

      global.chrome.topSites.get = mockGet as any;

      const result = await searchTopSites('nonexistent');

      expect(result).toEqual([]);
    });

    it('should handle Chrome API errors', async () => {
      const mockGet = jest.fn(
        (callback: (data: chrome.topSites.MostVisitedURL[]) => void) => {
          global.chrome.runtime.lastError = { message: 'Permission denied' };
          callback([]);
        }
      );

      global.chrome.topSites.get = mockGet as any;

      await expect(searchTopSites('test')).rejects.toThrow('Permission denied');
    });

    it('should handle missing Chrome topSites API', async () => {
      global.chrome.topSites = undefined as any;

      await expect(searchTopSites('test')).rejects.toThrow(
        'Chrome topSites API not available'
      );
    });

    it('should preserve order and generate correct indices', async () => {
      const mockTopSites: chrome.topSites.MostVisitedURL[] = [
        { url: 'https://site1.com', title: 'Site 1' },
        { url: 'https://site2.com', title: 'Site 2' },
        { url: 'https://site3.com', title: 'Site 3' },
      ];

      const mockGet = jest.fn(
        (callback: (data: chrome.topSites.MostVisitedURL[]) => void) => {
          callback(mockTopSites);
        }
      );

      global.chrome.topSites.get = mockGet as any;

      const result = await searchTopSites('site');

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('topsites-0');
      expect(result[0].metadata!.score).toBe(100);
      expect(result[1].id).toBe('topsites-1');
      expect(result[1].metadata!.score).toBe(99);
      expect(result[2].id).toBe('topsites-2');
      expect(result[2].metadata!.score).toBe(98);
    });
  });

  describe('Integration Tests', () => {
    it('should work end-to-end with realistic data', async () => {
      const mockTopSites: chrome.topSites.MostVisitedURL[] = [
        { url: 'https://www.google.com', title: 'Google' },
        { url: 'https://github.com', title: 'GitHub' },
        { url: 'https://stackoverflow.com', title: 'Stack Overflow' },
        { url: 'https://www.youtube.com', title: 'YouTube' },
        { url: 'https://reddit.com', title: 'Reddit' },
      ];

      const mockGet = jest.fn(
        (callback: (data: chrome.topSites.MostVisitedURL[]) => void) => {
          callback(mockTopSites);
        }
      );

      global.chrome.topSites.get = mockGet as any;

      const result = await searchTopSites('o');

      expect(result.length).toBeGreaterThan(0);

      // Verify that results contain expected structure
      result.forEach((item: SearchResult) => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('title');
        expect(item).toHaveProperty('description');
        expect(item).toHaveProperty('icon');
        expect(item).toHaveProperty('type', 'topSites');
        expect(item).toHaveProperty('actions');
        expect(item).toHaveProperty('metadata');
        expect(item.actions).toHaveLength(1);
        expect(item.actions[0]).toHaveProperty('id', 'open');
        expect(item.actions[0]).toHaveProperty('primary', true);
      });
    });
  });
});
