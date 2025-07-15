import type { SearchBroker } from '@/types';
import type { Command, SearchResult } from '@/types/extension';

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
  });
});
