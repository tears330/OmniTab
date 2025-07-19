import type { SearchBroker } from '@/types';
import type { Command, SearchResult } from '@/types/extension';

import { BookmarkResultType } from '@/extensions/bookmark/constants';
import { SearchResultType } from '@/extensions/core/constants';
import { HistoryResultType } from '@/extensions/history/constants';
import { TabResultType } from '@/extensions/tab/constants';
import { TopSitesResultType } from '@/extensions/topsites/constants';

import {
  performSearch,
  searchAllExtensions,
  searchExtension,
} from '../searchService';

describe('searchService', () => {
  const mockCommands: Command[] = [
    {
      id: 'tab.search',
      name: 'Search Tabs',
      description: 'Search through open browser tabs',
      alias: ['t', 'tab', 'tabs'],
      type: 'search',
    },
    {
      id: 'history.search',
      name: 'Search History',
      description: 'Search through browser history',
      alias: ['h', 'history'],
      type: 'search',
    },
    {
      id: 'bookmark.search',
      name: 'Search Bookmarks',
      description: 'Search through browser bookmarks',
      alias: ['b', 'bookmark'],
      type: 'search',
    },
    {
      id: 'tab.close-duplicates',
      name: 'Close Duplicate Tabs',
      description: 'Close all duplicate tabs',
      alias: ['dup'],
      type: 'action',
      immediateAlias: true,
    },
  ];

  const mockBroker: SearchBroker = {
    sendSearchRequest: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchAllExtensions', () => {
    it('should search commands and all extensions', async () => {
      const mockTabResults: SearchResult[] = [
        {
          id: 'tab-1',
          title: 'GitHub',
          description: 'github.com',
          type: 'tab',
          actions: [],
        },
      ];
      const mockHistoryResults: SearchResult[] = [
        {
          id: 'history-1',
          title: 'GitHub - Home',
          description: 'github.com',
          type: 'history',
          actions: [],
        },
      ];

      (mockBroker.sendSearchRequest as jest.Mock)
        .mockResolvedValueOnce({ success: true, data: mockTabResults })
        .mockResolvedValueOnce({ success: true, data: mockHistoryResults })
        .mockResolvedValueOnce({ success: true, data: [] });

      const results = await searchAllExtensions(
        'github',
        mockCommands,
        mockBroker
      );

      expect(results).toHaveLength(2); // 0 commands + 1 tab + 1 history
      expect(mockBroker.sendSearchRequest).toHaveBeenCalledTimes(3);
      expect(mockBroker.sendSearchRequest).toHaveBeenCalledWith(
        'tab',
        'search',
        'github'
      );
      expect(mockBroker.sendSearchRequest).toHaveBeenCalledWith(
        'history',
        'search',
        'github'
      );
      expect(mockBroker.sendSearchRequest).toHaveBeenCalledWith(
        'bookmark',
        'search',
        'github'
      );
    });

    it('should handle extension failures gracefully', async () => {
      (mockBroker.sendSearchRequest as jest.Mock)
        .mockRejectedValueOnce(new Error('Tab extension failed'))
        .mockResolvedValueOnce({ success: true, data: [] })
        .mockResolvedValueOnce({ success: false, error: 'Bookmark error' });

      const results = await searchAllExtensions(
        'test',
        mockCommands,
        mockBroker
      );

      expect(results).toHaveLength(0);
      expect(mockBroker.sendSearchRequest).toHaveBeenCalledTimes(3);
    });
  });

  describe('searchExtension', () => {
    it('should search within a specific extension', async () => {
      const mockResults: SearchResult[] = [
        {
          id: 'tab-1',
          title: 'Test Tab',
          description: 'test.com',
          type: 'tab',
          actions: [],
        },
      ];

      (mockBroker.sendSearchRequest as jest.Mock).mockResolvedValue({
        success: true,
        data: mockResults,
      });

      const results = await searchExtension(
        'tab',
        'search',
        'test',
        mockBroker
      );

      expect(results).toEqual(mockResults);
      expect(mockBroker.sendSearchRequest).toHaveBeenCalledWith(
        'tab',
        'search',
        'test'
      );
    });

    it('should throw error on failure', async () => {
      (mockBroker.sendSearchRequest as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Extension error',
      });

      await expect(
        searchExtension('tab', 'search', 'test', mockBroker)
      ).rejects.toThrow('Extension error');
    });
  });

  describe('performSearch', () => {
    it('should return empty results for empty query', async () => {
      const result = await performSearch({
        query: '  ',
        availableCommands: mockCommands,
        broker: mockBroker,
      });

      expect(result).toEqual({
        results: [],
        loading: false,
      });
      expect(mockBroker.sendSearchRequest).not.toHaveBeenCalled();
    });

    it('should search all extensions when no alias is used', async () => {
      (mockBroker.sendSearchRequest as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      });

      const result = await performSearch({
        query: 'github',
        availableCommands: mockCommands,
        broker: mockBroker,
      });

      expect(result.loading).toBe(false);
      expect(result.error).toBeUndefined();
      expect(mockBroker.sendSearchRequest).toHaveBeenCalledTimes(3);
    });

    it('should search specific extension when alias is used', async () => {
      const mockResults: SearchResult[] = [
        {
          id: 'tab-1',
          title: 'GitHub',
          description: 'github.com',
          type: 'tab',
          actions: [],
        },
      ];

      (mockBroker.sendSearchRequest as jest.Mock).mockResolvedValue({
        success: true,
        data: mockResults,
      });

      const result = await performSearch({
        query: 't github',
        availableCommands: mockCommands,
        broker: mockBroker,
      });

      expect(result).toEqual({
        results: mockResults,
        loading: false,
        activeExtension: 'tab',
        activeCommand: 'search',
      });
      expect(mockBroker.sendSearchRequest).toHaveBeenCalledTimes(1);
      expect(mockBroker.sendSearchRequest).toHaveBeenCalledWith(
        'tab',
        'search',
        'github'
      );
    });

    it('should handle alias with empty search term', async () => {
      const mockResults: SearchResult[] = [
        {
          id: 'tab-1',
          title: 'Tab 1',
          description: 'example.com',
          type: 'tab',
          actions: [],
        },
        {
          id: 'tab-2',
          title: 'Tab 2',
          description: 'test.com',
          type: 'tab',
          actions: [],
        },
      ];

      (mockBroker.sendSearchRequest as jest.Mock).mockResolvedValue({
        success: true,
        data: mockResults,
      });

      const result = await performSearch({
        query: 't ',
        availableCommands: mockCommands,
        broker: mockBroker,
      });

      expect(result).toEqual({
        results: mockResults,
        loading: false,
        activeExtension: 'tab',
        activeCommand: 'search',
      });
      expect(mockBroker.sendSearchRequest).toHaveBeenCalledTimes(1);
      expect(mockBroker.sendSearchRequest).toHaveBeenCalledWith(
        'tab',
        'search',
        ''
      );
    });

    it('should handle unknown alias', async () => {
      (mockBroker.sendSearchRequest as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      });

      const result = await performSearch({
        query: 'xyz test',
        availableCommands: mockCommands,
        broker: mockBroker,
      });

      expect(result.activeExtension).toBeUndefined();
      expect(result.activeCommand).toBeUndefined();
      expect(mockBroker.sendSearchRequest).toHaveBeenCalledTimes(3); // Searches all extensions
    });

    it('should handle search errors', async () => {
      (mockBroker.sendSearchRequest as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const result = await performSearch({
        query: 't github',
        availableCommands: mockCommands,
        broker: mockBroker,
      });

      expect(result).toEqual({
        results: [],
        loading: false,
        error: 'Network error',
      });
    });

    it('should handle action commands without calling search', async () => {
      const result = await performSearch({
        query: 'dup',
        availableCommands: mockCommands,
        broker: mockBroker,
      });

      expect(result).toEqual({
        results: [
          {
            id: 'tab.close-duplicates',
            title: 'Close Duplicate Tabs',
            description: 'Close all duplicate tabs',
            icon: undefined,
            type: 'command',
            actions: [
              {
                id: 'select',
                label: 'Select',
                shortcut: 'Enter',
                primary: true,
              },
            ],
            metadata: {
              command: {
                id: 'tab.close-duplicates',
                name: 'Close Duplicate Tabs',
                description: 'Close all duplicate tabs',
                alias: ['dup'],
                type: 'action',
                immediateAlias: true,
              },
            },
          },
        ],
        loading: false,
        activeExtension: 'tab',
        activeCommand: 'close-duplicates',
      });

      // Should not call search for action commands
      expect(mockBroker.sendSearchRequest).not.toHaveBeenCalled();
    });
  });

  describe('searchAllExtensions - Fuse.js integration', () => {
    it('should return results without sorting for empty query', async () => {
      const mockResults: SearchResult[] = [
        {
          id: 'tab-1',
          title: 'GitHub',
          description: 'github.com',
          type: TabResultType.TAB,
          actions: [],
        },
        {
          id: 'history-1',
          title: 'Stack Overflow',
          description: 'stackoverflow.com',
          type: HistoryResultType.HISTORY,
          actions: [],
        },
      ];

      (mockBroker.sendSearchRequest as jest.Mock).mockResolvedValue({
        success: true,
        data: mockResults,
      });

      const results = await searchAllExtensions('', mockCommands, mockBroker);

      expect(results).toEqual(mockResults);
      expect(mockBroker.sendSearchRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        ''
      );
    });

    it('should sort results by type priority: tab > history > bookmark > command', async () => {
      const mockResults: SearchResult[] = [
        {
          id: 'command-1',
          title: 'Test Command',
          description: 'A test command',
          type: SearchResultType.COMMAND,
          actions: [],
        },
        {
          id: 'bookmark-1',
          title: 'Test Bookmark',
          description: 'A test bookmark',
          type: BookmarkResultType.BOOKMARK,
          actions: [],
        },
        {
          id: 'history-1',
          title: 'Test History',
          description: 'A test history item',
          type: HistoryResultType.HISTORY,
          actions: [],
        },
        {
          id: 'tab-1',
          title: 'Test Tab',
          description: 'A test tab',
          type: TabResultType.TAB,
          actions: [],
        },
      ];

      (mockBroker.sendSearchRequest as jest.Mock).mockResolvedValue({
        success: true,
        data: mockResults,
      });

      const results = await searchAllExtensions(
        'test',
        mockCommands,
        mockBroker
      );

      // Results should be sorted by type priority: tab, history, bookmark, command
      expect(results[0].type).toBe(TabResultType.TAB);
      expect(results[1].type).toBe(HistoryResultType.HISTORY);
      expect(results[2].type).toBe(BookmarkResultType.BOOKMARK);
      expect(results[3].type).toBe(SearchResultType.COMMAND);
    });

    it('should handle fuzzy search with Fuse.js', async () => {
      const mockResults: SearchResult[] = [
        {
          id: 'tab-1',
          title: 'GitHub Repository',
          description: 'github.com/user/repo',
          type: TabResultType.TAB,
          actions: [],
        },
        {
          id: 'tab-2',
          title: 'GitLab Project',
          description: 'gitlab.com/user/project',
          type: TabResultType.TAB,
          actions: [],
        },
        {
          id: 'tab-3',
          title: 'Unrelated Page',
          description: 'example.com/page',
          type: TabResultType.TAB,
          actions: [],
        },
      ];

      (mockBroker.sendSearchRequest as jest.Mock).mockResolvedValue({
        success: true,
        data: mockResults,
      });

      const results = await searchAllExtensions(
        'git',
        mockCommands,
        mockBroker
      );

      // Should return results that match "git" fuzzy search
      // Note: Fuse.js might filter out results that don't match well enough
      expect(results.length).toBeGreaterThanOrEqual(1);

      // GitHub and GitLab should match "git" search
      const githubResult = results.find((r) => r.title.includes('GitHub'));
      const gitlabResult = results.find((r) => r.title.includes('GitLab'));

      expect(githubResult || gitlabResult).toBeDefined();
    });

    it('should remove duplicate results by ID', async () => {
      const duplicateResults: SearchResult[] = [
        {
          id: 'duplicate-1',
          title: 'Duplicate Item',
          description: 'First occurrence',
          type: TabResultType.TAB,
          actions: [],
        },
        {
          id: 'duplicate-1', // Same ID
          title: 'Duplicate Item',
          description: 'Second occurrence',
          type: TabResultType.TAB,
          actions: [],
        },
        {
          id: 'unique-1',
          title: 'Unique Item',
          description: 'Unique occurrence',
          type: TabResultType.TAB,
          actions: [],
        },
      ];

      (mockBroker.sendSearchRequest as jest.Mock).mockResolvedValue({
        success: true,
        data: duplicateResults,
      });

      const results = await searchAllExtensions(
        'duplicate',
        mockCommands,
        mockBroker
      );

      expect(results).toHaveLength(2); // Should remove one duplicate
      expect(results.find((r) => r.id === 'duplicate-1')).toBeDefined();
      expect(results.find((r) => r.id === 'unique-1')).toBeDefined();
    });

    it('should handle unknown result types with lowest priority', async () => {
      const mockResults: SearchResult[] = [
        {
          id: 'unknown-1',
          title: 'Test Unknown Type',
          description: 'Test unknown type result',
          type: 'unknown-type',
          actions: [],
        },
        {
          id: 'tab-1',
          title: 'Test Tab Result',
          description: 'Test tab result',
          type: TabResultType.TAB,
          actions: [],
        },
      ];

      (mockBroker.sendSearchRequest as jest.Mock).mockResolvedValue({
        success: true,
        data: mockResults,
      });

      const results = await searchAllExtensions(
        'test',
        mockCommands,
        mockBroker
      );

      // Both should be present since both have "test" in title
      expect(results.length).toBeGreaterThanOrEqual(1);
      const tabResult = results.find((r) => r.type === TabResultType.TAB);

      expect(tabResult).toBeDefined();
      // Tab should have higher priority than unknown type
      const tabIndex = results.findIndex((r) => r.type === TabResultType.TAB);
      const unknownIndex = results.findIndex((r) => r.type === 'unknown-type');

      expect(tabIndex).toBeGreaterThanOrEqual(0);
      expect(unknownIndex === -1 || tabIndex < unknownIndex).toBe(true);
    });

    it('should handle TopSites result type with correct priority', async () => {
      const mockResults: SearchResult[] = [
        {
          id: 'topsites-1',
          title: 'Test Top Site',
          description: 'A test top site',
          type: TopSitesResultType.TOP_SITE,
          actions: [],
        },
        {
          id: 'command-1',
          title: 'Test Command',
          description: 'A test command',
          type: SearchResultType.COMMAND,
          actions: [],
        },
      ];

      (mockBroker.sendSearchRequest as jest.Mock).mockResolvedValue({
        success: true,
        data: mockResults,
      });

      const results = await searchAllExtensions(
        'test',
        mockCommands,
        mockBroker
      );

      // Command should come before TopSites (priority 4 vs 5)
      expect(results.length).toBeGreaterThan(0);
      const commandResult = results.find(
        (r) => r.type === SearchResultType.COMMAND
      );
      const topSitesResult = results.find(
        (r) => r.type === TopSitesResultType.TOP_SITE
      );

      // Both should be present since both have "test" in title
      expect(commandResult).toBeDefined();
      expect(topSitesResult).toBeDefined();

      // Command should have higher priority (lower index) than TopSites
      expect(results.indexOf(commandResult!)).toBeLessThan(
        results.indexOf(topSitesResult!)
      );
    });

    it('should sort by Fuse score when types have same priority', async () => {
      const mockResults: SearchResult[] = [
        {
          id: 'tab-1',
          title: 'Somewhat matching title',
          description: 'description',
          type: TabResultType.TAB,
          actions: [],
        },
        {
          id: 'tab-2',
          title: 'Perfect test match',
          description: 'description',
          type: TabResultType.TAB,
          actions: [],
        },
      ];

      (mockBroker.sendSearchRequest as jest.Mock).mockResolvedValue({
        success: true,
        data: mockResults,
      });

      const results = await searchAllExtensions(
        'test',
        mockCommands,
        mockBroker
      );

      // Both are tabs (same type priority), so should sort by Fuse relevance
      expect(results).toHaveLength(2);
      expect(results[0].title).toBe('Perfect test match'); // Better match should come first
    });

    it('should handle whitespace-only queries', async () => {
      const mockResults: SearchResult[] = [
        {
          id: 'tab-1',
          title: 'Tab 1',
          description: 'description',
          type: TabResultType.TAB,
          actions: [],
        },
      ];

      (mockBroker.sendSearchRequest as jest.Mock).mockResolvedValue({
        success: true,
        data: mockResults,
      });

      const results = await searchAllExtensions(
        '   ',
        mockCommands,
        mockBroker
      );

      expect(results).toEqual(mockResults); // Should return unsorted results
    });

    it('should handle empty results from all extensions', async () => {
      (mockBroker.sendSearchRequest as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      });

      const results = await searchAllExtensions(
        'nonexistent',
        mockCommands,
        mockBroker
      );

      expect(results).toHaveLength(0);
    });
  });
});
