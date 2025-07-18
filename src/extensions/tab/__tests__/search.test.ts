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

      mockChrome.tabs.query.mockImplementation((_query, callback) => {
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

      mockChrome.tabs.query.mockImplementation((_query, callback) => {
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

      mockChrome.tabs.query.mockImplementation((_query, callback) => {
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

      mockChrome.tabs.query.mockImplementation((_query, callback) => {
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

      mockChrome.tabs.query.mockImplementation((_query, callback) => {
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

      mockChrome.tabs.query.mockImplementation((_query, callback) => {
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
        selected: false,
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
            shortcut: TabActionShortcut.CLOSE,
          },
          {
            id: TabActionId.MUTE,
            label: TabActionLabel.MUTE_TAB,
            shortcut: TabActionShortcut.MUTE,
          },
          {
            id: TabActionId.PIN,
            label: TabActionLabel.PIN_TAB,
            shortcut: TabActionShortcut.PIN,
          },
          {
            id: TabActionId.CLOSE_OTHERS,
            label: TabActionLabel.CLOSE_OTHER_TABS,
            shortcut: TabActionShortcut.CLOSE_OTHERS,
          },
          {
            id: TabActionId.CLOSE_GROUP,
            label: TabActionLabel.CLOSE_GROUP,
            shortcut: TabActionShortcut.CLOSE_GROUP,
          },
          {
            id: TabActionId.CLOSE_OTHER_GROUPS,
            label: TabActionLabel.CLOSE_OTHER_GROUPS,
            shortcut: TabActionShortcut.CLOSE_OTHER_GROUPS,
          },
          {
            id: TabActionId.BOOKMARK,
            label: TabActionLabel.BOOKMARK_TAB,
            shortcut: TabActionShortcut.BOOKMARK,
          },
        ],
        metadata: {
          windowId: 456,
          active: true,
          pinned: false,
          audible: false,
          incognito: false,
          url: 'https://example.com/page',
          muted: false,
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
        selected: false,
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
        selected: false,
        discarded: false,
        autoDiscardable: true,
        groupId: -1,
      };

      const result = tabToSearchResult(mockTab);

      expect(getDomain).toHaveBeenCalledWith('');
      expect(getFaviconUrl).toHaveBeenCalledWith('');
      expect(result.metadata?.url).toBeUndefined();
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
        selected: false,
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
        muted: false,
      });
    });

    it('should handle muted tab metadata', () => {
      const mockTab: chrome.tabs.Tab = {
        id: 123,
        title: 'Muted Tab',
        url: 'https://example.com',
        windowId: 456,
        active: false,
        pinned: false,
        audible: false,
        incognito: false,
        index: 0,
        highlighted: false,
        selected: false,
        discarded: false,
        autoDiscardable: true,
        groupId: -1,
        mutedInfo: { muted: true },
      };

      const result = tabToSearchResult(mockTab);

      expect(result.metadata?.muted).toBe(true);
    });

    it('should handle tab with missing ID', () => {
      const mockTab: chrome.tabs.Tab = {
        id: undefined,
        title: 'Tab without ID',
        url: 'https://example.com',
        windowId: 456,
        active: false,
        pinned: false,
        audible: false,
        incognito: false,
        index: 0,
        highlighted: false,
        selected: false,
        discarded: false,
        autoDiscardable: true,
        groupId: -1,
      };

      const result = tabToSearchResult(mockTab);

      expect(result.id).toBe('tab-undefined');
    });

    it('should handle actions correctly', () => {
      const mockTab: chrome.tabs.Tab = {
        id: 123,
        title: 'Test Tab',
        url: 'https://test.com',
        windowId: 456,
        active: false,
        pinned: false,
        audible: false,
        incognito: false,
        index: 0,
        highlighted: false,
        selected: false,
        discarded: false,
        autoDiscardable: true,
        groupId: -1,
      };

      const result = tabToSearchResult(mockTab);

      expect(result.actions).toHaveLength(8);
      expect(result.actions[0]).toEqual({
        id: TabActionId.SWITCH,
        label: TabActionLabel.SWITCH_TO_TAB,
        shortcut: TabActionShortcut.ENTER,
        primary: true,
      });
      expect(result.actions[1]).toEqual({
        id: TabActionId.CLOSE,
        label: TabActionLabel.CLOSE_TAB,
        shortcut: TabActionShortcut.CLOSE,
      });
    });
  });

  describe('searchTabs edge cases', () => {
    it('should handle chrome.tabs.query error', async () => {
      mockChrome.tabs.query.mockImplementation(() => {
        throw new Error('Chrome API error');
      });

      await expect(searchTabs('test')).rejects.toThrow('Chrome API error');
    });

    it('should handle special characters in search query', async () => {
      const mockTabs = [
        { id: 1, title: 'Tab with [brackets]', url: 'https://example.com' },
        { id: 2, title: 'Tab with (parentheses)', url: 'https://google.com' },
        { id: 3, title: 'Tab with *asterisk*', url: 'https://github.com' },
      ];

      mockChrome.tabs.query.mockImplementation((_query, callback) => {
        callback(mockTabs);
      });

      const result = await searchTabs('[brackets]');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Tab with [brackets]');
    });

    it('should handle very long search queries', async () => {
      const mockTabs = [
        { id: 1, title: 'Short tab', url: 'https://example.com' },
        {
          id: 2,
          title:
            'Very long tab title that contains many words and should still match',
          url: 'https://verylongdomainname.com',
        },
      ];

      mockChrome.tabs.query.mockImplementation((_query, callback) => {
        callback(mockTabs);
      });

      const longQuery = 'very long tab title that contains many words';
      const result = await searchTabs(longQuery);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });

    it('should handle unicode characters in search', async () => {
      const mockTabs = [
        { id: 1, title: 'Tab with émojis 🚀', url: 'https://example.com' },
        { id: 2, title: 'Tab with ñ and á', url: 'https://español.com' },
        { id: 3, title: 'Regular tab', url: 'https://english.com' },
      ];

      mockChrome.tabs.query.mockImplementation((_query, callback) => {
        callback(mockTabs);
      });

      const result = await searchTabs('émojis');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Tab with émojis 🚀');
    });

    it('should handle empty tab array', async () => {
      mockChrome.tabs.query.mockImplementation((_query, callback) => {
        callback([]);
      });

      const result = await searchTabs('anything');

      expect(result).toHaveLength(0);
    });

    it('should handle null callback response', async () => {
      mockChrome.tabs.query.mockImplementation((_query, callback) => {
        callback(null as any);
      });

      const result = await searchTabs('test');

      expect(result).toEqual([]);
    });
  });
});
