import { getDomain, getFaviconUrl } from '@/utils/urlUtils';

import {
  HISTORY_LIMITS,
  HistoryActionId,
  HistoryActionLabel,
  HistoryActionShortcut,
  HistoryResultType,
} from '../constants';
import { historyItemToSearchResult, searchHistory } from '../search';

// Mock chrome APIs
const mockChrome = {
  history: {
    search: jest.fn(),
  },
};

// Mock utility functions
jest.mock('@/utils/urlUtils', () => ({
  getDomain: jest.fn(),
  getFaviconUrl: jest.fn(),
}));

global.chrome = mockChrome as any;

describe('History Extension Search', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getDomain as jest.Mock).mockImplementation((url: string) => {
      try {
        return new URL(url).hostname;
      } catch {
        return '';
      }
    });
    (getFaviconUrl as jest.Mock).mockReturnValue(
      'https://example.com/favicon.ico'
    );
  });

  describe('searchHistory', () => {
    it('should search history with query', async () => {
      const mockHistoryItems = [
        { id: '1', title: 'Example Page', url: 'https://example.com' },
        { id: '2', title: 'Test Page', url: 'https://test.com' },
      ];

      mockChrome.history.search.mockImplementation((_options, callback) => {
        callback(mockHistoryItems);
      });

      const result = await searchHistory('example');

      expect(mockChrome.history.search).toHaveBeenCalledWith(
        {
          text: 'example',
          maxResults: HISTORY_LIMITS.MAX_RESULTS_WITH_QUERY,
        },
        expect.any(Function)
      );
      expect(result).toEqual(mockHistoryItems);
    });

    it('should search recent history without query', async () => {
      const mockHistoryItems = [
        { id: '1', title: 'Recent Page', url: 'https://recent.com' },
      ];

      const mockNow = 1642248600000; // 2022-01-15T10:30:00Z
      const expectedStartTime =
        mockNow - HISTORY_LIMITS.RECENT_HISTORY_DAYS * 24 * 60 * 60 * 1000;

      jest.spyOn(Date, 'now').mockReturnValue(mockNow);

      mockChrome.history.search.mockImplementation((_options, callback) => {
        callback(mockHistoryItems);
      });

      const result = await searchHistory('');

      expect(mockChrome.history.search).toHaveBeenCalledWith(
        {
          text: '',
          maxResults: HISTORY_LIMITS.MAX_RESULTS_WITHOUT_QUERY,
          startTime: expectedStartTime,
        },
        expect.any(Function)
      );
      expect(result).toEqual(mockHistoryItems);
    });

    it('should handle empty query string', async () => {
      const mockHistoryItems = [
        { id: '1', title: 'Recent Page', url: 'https://recent.com' },
      ];

      mockChrome.history.search.mockImplementation((_options, callback) => {
        callback(mockHistoryItems);
      });

      const result = await searchHistory('');

      expect(result).toEqual(mockHistoryItems);
    });

    it('should handle undefined query', async () => {
      const mockHistoryItems = [
        { id: '1', title: 'Recent Page', url: 'https://recent.com' },
      ];

      mockChrome.history.search.mockImplementation((_options, callback) => {
        callback(mockHistoryItems);
      });

      const result = await searchHistory(undefined as any);

      expect(mockChrome.history.search).toHaveBeenCalledWith(
        expect.objectContaining({
          text: '',
          maxResults: HISTORY_LIMITS.MAX_RESULTS_WITHOUT_QUERY,
        }),
        expect.any(Function)
      );
      expect(result).toEqual(mockHistoryItems);
    });

    it('should return empty array when no history items found', async () => {
      mockChrome.history.search.mockImplementation((_options, callback) => {
        callback([]);
      });

      const result = await searchHistory('nonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('historyItemToSearchResult', () => {
    it('should convert history item to search result', () => {
      const mockHistoryItem: chrome.history.HistoryItem = {
        id: '123',
        title: 'Example Page',
        url: 'https://example.com/page',
        visitCount: 5,
        lastVisitTime: 1642248600000,
        typedCount: 2,
      };

      const result = historyItemToSearchResult(mockHistoryItem);

      expect(getDomain).toHaveBeenCalledWith('https://example.com/page');
      expect(getFaviconUrl).toHaveBeenCalledWith('https://example.com/page');
      expect(result).toEqual({
        id: 'history-123',
        title: 'Example Page',
        description: 'example.com',
        icon: 'https://example.com/favicon.ico',
        type: HistoryResultType.HISTORY,
        actions: [
          {
            id: HistoryActionId.OPEN,
            label: HistoryActionLabel.OPEN_IN_NEW_TAB,
            shortcut: HistoryActionShortcut.ENTER,
            primary: true,
          },
          {
            id: HistoryActionId.REMOVE,
            label: HistoryActionLabel.REMOVE_FROM_HISTORY,
            shortcut: HistoryActionShortcut.CTRL_ENTER,
          },
        ],
        metadata: {
          url: 'https://example.com/page',
          visitCount: 5,
          lastVisitTime: 1642248600000,
        },
      });
    });

    it('should handle history item without title', () => {
      const mockHistoryItem: chrome.history.HistoryItem = {
        id: '123',
        title: undefined,
        url: 'https://example.com',
        visitCount: 1,
        lastVisitTime: 1642248600000,
        typedCount: 0,
      };

      const result = historyItemToSearchResult(mockHistoryItem);

      expect(result.title).toBe('Untitled');
    });

    it('should handle history item without URL', () => {
      const mockHistoryItem: chrome.history.HistoryItem = {
        id: '123',
        title: 'Test Page',
        url: undefined,
        visitCount: 1,
        lastVisitTime: 1642248600000,
        typedCount: 0,
      };

      const result = historyItemToSearchResult(mockHistoryItem);

      expect(getDomain).toHaveBeenCalledWith('');
      expect(getFaviconUrl).toHaveBeenCalledWith('');
      expect(result.metadata?.url).toBeUndefined();
    });

    it('should handle history item with null title', () => {
      const mockHistoryItem: chrome.history.HistoryItem = {
        id: '123',
        title: null as any,
        url: 'https://example.com',
        visitCount: 1,
        lastVisitTime: 1642248600000,
        typedCount: 0,
      };

      const result = historyItemToSearchResult(mockHistoryItem);

      expect(result.title).toBe('Untitled');
    });

    it('should preserve all metadata', () => {
      const mockHistoryItem: chrome.history.HistoryItem = {
        id: '123',
        title: 'Test Page',
        url: 'https://test.com',
        visitCount: 10,
        lastVisitTime: 1642248600000,
        typedCount: 3,
      };

      const result = historyItemToSearchResult(mockHistoryItem);

      expect(result.metadata).toEqual({
        url: 'https://test.com',
        visitCount: 10,
        lastVisitTime: 1642248600000,
      });
    });
  });
});
