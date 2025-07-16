import { getDomain, getFaviconUrl } from '@/utils/urlUtils';

import {
  TabActionId,
  TabActionLabel,
  TabActionShortcut,
  TabResultType,
} from '../constants';
import { searchTabs, tabToSearchResult } from '../search';

// Mock chrome APIs
const mockChrome = {
  tabs: {
    query: jest.fn(),
  },
};

// Mock utility functions
jest.mock('@/utils/urlUtils', () => ({
  getDomain: jest.fn(),
  getFaviconUrl: jest.fn(),
}));

global.chrome = mockChrome as any;

describe('Tab Extension Search', () => {
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

  describe('searchTabs', () => {
    it('should return all tabs when no query provided', async () => {
      const mockTabs = [
        { id: 1, title: 'Tab 1', url: 'https://example.com' },
        { id: 2, title: 'Tab 2', url: 'https://google.com' },
      ];

      mockChrome.tabs.query.mockImplementation((query, callback) => {
        callback(mockTabs);
      });

      const result = await searchTabs('');

      expect(mockChrome.tabs.query).toHaveBeenCalledWith(
        {},
        expect.any(Function)
      );
      expect(result).toEqual(mockTabs);
    });

    it('should filter tabs by title', async () => {
      const mockTabs = [
        { id: 1, title: 'Gmail - Inbox', url: 'https://gmail.com' },
        { id: 2, title: 'Google Search', url: 'https://google.com' },
        { id: 3, title: 'GitHub', url: 'https://github.com' },
      ];

      mockChrome.tabs.query.mockImplementation((query, callback) => {
        callback(mockTabs);
      });

      const result = await searchTabs('gmail');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Gmail - Inbox');
    });

    it('should filter tabs by URL', async () => {
      const mockTabs = [
        { id: 1, title: 'Tab 1', url: 'https://example.com' },
        { id: 2, title: 'Tab 2', url: 'https://google.com/search' },
        { id: 3, title: 'Tab 3', url: 'https://github.com' },
      ];

      mockChrome.tabs.query.mockImplementation((query, callback) => {
        callback(mockTabs);
      });

      const result = await searchTabs('google');

      expect(result).toHaveLength(1);
      expect(result[0].url).toBe('https://google.com/search');
    });

    it('should perform case-insensitive search', async () => {
      const mockTabs = [
        { id: 1, title: 'GitHub Repository', url: 'https://github.com' },
        { id: 2, title: 'Google Search', url: 'https://google.com' },
      ];

      mockChrome.tabs.query.mockImplementation((query, callback) => {
        callback(mockTabs);
      });

      const result = await searchTabs('GITHUB');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('GitHub Repository');
    });

    it('should return empty array when no matches found', async () => {
      const mockTabs = [
        { id: 1, title: 'Tab 1', url: 'https://example.com' },
        { id: 2, title: 'Tab 2', url: 'https://google.com' },
      ];

      mockChrome.tabs.query.mockImplementation((query, callback) => {
        callback(mockTabs);
      });

      const result = await searchTabs('nonexistent');

      expect(result).toHaveLength(0);
    });

    it('should handle tabs without title or URL', async () => {
      const mockTabs = [
        { id: 1, title: undefined, url: undefined },
        { id: 2, title: 'Valid Tab', url: 'https://example.com' },
      ];

      mockChrome.tabs.query.mockImplementation((query, callback) => {
        callback(mockTabs);
      });

      const result = await searchTabs('valid');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Valid Tab');
    });
  });

  describe('tabToSearchResult', () => {
    it('should convert tab to search result', () => {
      const mockTab: chrome.tabs.Tab = {
        id: 123,
        title: 'Example Page',
        url: 'https://example.com/page',
        windowId: 456,
        active: true,
        pinned: false,
        audible: false,
        incognito: false,
        index: 0,
        highlighted: false,
        discarded: false,
        autoDiscardable: true,
        groupId: -1,
      };

      const result = tabToSearchResult(mockTab);

      expect(getDomain).toHaveBeenCalledWith('https://example.com/page');
      expect(getFaviconUrl).toHaveBeenCalledWith('https://example.com/page');
      expect(result).toEqual({
        id: 'tab-123',
        title: 'Example Page',
        description: 'example.com',
        icon: 'https://example.com/favicon.ico',
        type: TabResultType.TAB,
        actions: [
          {
            id: TabActionId.SWITCH,
            label: TabActionLabel.SWITCH_TO_TAB,
            shortcut: TabActionShortcut.ENTER,
            primary: true,
          },
          {
            id: TabActionId.CLOSE,
            label: TabActionLabel.CLOSE_TAB,
            shortcut: TabActionShortcut.CTRL_ENTER,
          },
        ],
        metadata: {
          windowId: 456,
          active: true,
          pinned: false,
          audible: false,
          incognito: false,
          url: 'https://example.com/page',
        },
      });
    });

    it('should handle tab without title', () => {
      const mockTab: chrome.tabs.Tab = {
        id: 123,
        title: undefined,
        url: 'https://example.com',
        windowId: 456,
        active: false,
        pinned: false,
        audible: false,
        incognito: false,
        index: 0,
        highlighted: false,
        discarded: false,
        autoDiscardable: true,
        groupId: -1,
      };

      const result = tabToSearchResult(mockTab);

      expect(result.title).toBe('Untitled');
    });

    it('should handle tab without URL', () => {
      const mockTab: chrome.tabs.Tab = {
        id: 123,
        title: 'New Tab',
        url: undefined,
        windowId: 456,
        active: false,
        pinned: false,
        audible: false,
        incognito: false,
        index: 0,
        highlighted: false,
        discarded: false,
        autoDiscardable: true,
        groupId: -1,
      };

      const result = tabToSearchResult(mockTab);

      expect(getDomain).toHaveBeenCalledWith('');
      expect(getFaviconUrl).toHaveBeenCalledWith('');
      expect(result.metadata.url).toBeUndefined();
    });

    it('should preserve all metadata', () => {
      const mockTab: chrome.tabs.Tab = {
        id: 123,
        title: 'Test Tab',
        url: 'https://test.com',
        windowId: 456,
        active: true,
        pinned: true,
        audible: true,
        incognito: true,
        index: 2,
        highlighted: true,
        discarded: false,
        autoDiscardable: false,
        groupId: 789,
      };

      const result = tabToSearchResult(mockTab);

      expect(result.metadata).toEqual({
        windowId: 456,
        active: true,
        pinned: true,
        audible: true,
        incognito: true,
        url: 'https://test.com',
      });
    });
  });
});
