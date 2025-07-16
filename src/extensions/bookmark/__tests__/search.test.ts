import { getDomain, getFaviconUrl } from '@/utils/urlUtils';

import {
  BOOKMARK_LIMITS,
  BookmarkActionId,
  BookmarkActionLabel,
  BookmarkActionShortcut,
  BookmarkResultType,
} from '../constants';
import { bookmarkToSearchResult, searchBookmarks } from '../search';

// Mock chrome APIs
const mockChrome = {
  bookmarks: {
    getTree: jest.fn(),
  },
};

// Mock utility functions
jest.mock('@/utils/urlUtils', () => ({
  getDomain: jest.fn(),
  getFaviconUrl: jest.fn(),
}));

global.chrome = mockChrome as any;

describe('Bookmark Extension Search', () => {
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

  describe('searchBookmarks', () => {
    const mockBookmarkTree = [
      {
        id: '0',
        title: 'Bookmarks bar',
        children: [
          {
            id: '1',
            title: 'Example',
            url: 'https://example.com',
            dateAdded: 1642248600000,
          },
          {
            id: '2',
            title: 'Folder',
            children: [
              {
                id: '3',
                title: 'GitHub',
                url: 'https://github.com',
                dateAdded: 1642248500000,
              },
            ],
          },
        ],
      },
      {
        id: '1',
        title: 'Other bookmarks',
        children: [
          {
            id: '4',
            title: 'Google',
            url: 'https://google.com',
            dateAdded: 1642248700000,
          },
        ],
      },
    ];

    it('should search bookmarks with query', async () => {
      mockChrome.bookmarks.getTree.mockImplementation((callback) => {
        callback(mockBookmarkTree);
      });

      const result = await searchBookmarks('github');

      expect(mockChrome.bookmarks.getTree).toHaveBeenCalledWith(
        expect.any(Function)
      );
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('GitHub');
    });

    it('should search bookmarks by URL', async () => {
      mockChrome.bookmarks.getTree.mockImplementation((callback) => {
        callback(mockBookmarkTree);
      });

      const result = await searchBookmarks('google.com');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Google');
    });

    it('should perform case-insensitive search', async () => {
      mockChrome.bookmarks.getTree.mockImplementation((callback) => {
        callback(mockBookmarkTree);
      });

      const result = await searchBookmarks('EXAMPLE');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Example');
    });

    it('should return empty array when no matches found', async () => {
      mockChrome.bookmarks.getTree.mockImplementation((callback) => {
        callback(mockBookmarkTree);
      });

      const result = await searchBookmarks('nonexistent');

      expect(result).toHaveLength(0);
    });

    it('should return recent bookmarks when no query provided', async () => {
      mockChrome.bookmarks.getTree.mockImplementation((callback) => {
        callback(mockBookmarkTree);
      });

      const result = await searchBookmarks('');

      expect(result).toHaveLength(3);
      // Should be sorted by date added (newest first)
      expect(result[0].title).toBe('Google'); // dateAdded: 1642248700000
      expect(result[1].title).toBe('Example'); // dateAdded: 1642248600000
      expect(result[2].title).toBe('GitHub'); // dateAdded: 1642248500000
    });

    it('should limit recent bookmarks to MAX_RECENT_BOOKMARKS', async () => {
      const manyBookmarks = [
        {
          id: '0',
          title: 'Bookmarks bar',
          children: Array.from(
            { length: BOOKMARK_LIMITS.MAX_RECENT_BOOKMARKS + 5 },
            (_, i) => ({
              id: `${i + 1}`,
              title: `Bookmark ${i + 1}`,
              url: `https://example${i + 1}.com`,
              dateAdded: 1642248600000 + i * 1000,
            })
          ),
        },
      ];

      mockChrome.bookmarks.getTree.mockImplementation((callback) => {
        callback(manyBookmarks);
      });

      const result = await searchBookmarks('');

      expect(result).toHaveLength(BOOKMARK_LIMITS.MAX_RECENT_BOOKMARKS);
    });

    it('should handle bookmarks without URL (folders)', async () => {
      const bookmarkTreeWithFolders = [
        {
          id: '0',
          title: 'Bookmarks bar',
          children: [
            {
              id: '1',
              title: 'Folder',
              children: [
                {
                  id: '2',
                  title: 'Example',
                  url: 'https://example.com',
                  dateAdded: 1642248600000,
                },
              ],
            },
          ],
        },
      ];

      mockChrome.bookmarks.getTree.mockImplementation((callback) => {
        callback(bookmarkTreeWithFolders);
      });

      const result = await searchBookmarks('');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Example');
    });

    it('should handle empty bookmark tree', async () => {
      mockChrome.bookmarks.getTree.mockImplementation((callback) => {
        callback([]);
      });

      const result = await searchBookmarks('');

      expect(result).toHaveLength(0);
    });

    it('should handle deeply nested bookmark structure', async () => {
      const deepBookmarkTree = [
        {
          id: '0',
          title: 'Root',
          children: [
            {
              id: '1',
              title: 'Level 1',
              children: [
                {
                  id: '2',
                  title: 'Level 2',
                  children: [
                    {
                      id: '3',
                      title: 'Deep Bookmark',
                      url: 'https://deep.com',
                      dateAdded: 1642248600000,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];

      mockChrome.bookmarks.getTree.mockImplementation((callback) => {
        callback(deepBookmarkTree);
      });

      const result = await searchBookmarks('deep');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Deep Bookmark');
    });
  });

  describe('bookmarkToSearchResult', () => {
    it('should convert bookmark to search result', () => {
      const mockBookmark: chrome.bookmarks.BookmarkTreeNode = {
        id: '123',
        title: 'Example Page',
        url: 'https://example.com/page',
        dateAdded: 1642248600000,
        parentId: '456',
        index: 0,
      };

      const result = bookmarkToSearchResult(mockBookmark);

      expect(getDomain).toHaveBeenCalledWith('https://example.com/page');
      expect(getFaviconUrl).toHaveBeenCalledWith(
        'https://example.com/page',
        BOOKMARK_LIMITS.FAVICON_SIZE
      );
      expect(result).toEqual({
        id: 'bookmark-123',
        title: 'Example Page',
        description: 'example.com',
        icon: 'https://example.com/favicon.ico',
        type: BookmarkResultType.BOOKMARK,
        actions: [
          {
            id: BookmarkActionId.OPEN,
            label: BookmarkActionLabel.OPEN_IN_NEW_TAB,
            shortcut: BookmarkActionShortcut.ENTER,
            primary: true,
          },
          {
            id: BookmarkActionId.EDIT,
            label: BookmarkActionLabel.EDIT_BOOKMARK,
            shortcut: BookmarkActionShortcut.CTRL_E,
          },
          {
            id: BookmarkActionId.REMOVE,
            label: BookmarkActionLabel.REMOVE_BOOKMARK,
            shortcut: BookmarkActionShortcut.CTRL_ENTER,
          },
        ],
        metadata: {
          id: '123',
          url: 'https://example.com/page',
          dateAdded: 1642248600000,
          parentId: '456',
        },
      });
    });

    it('should handle bookmark without title', () => {
      const mockBookmark: chrome.bookmarks.BookmarkTreeNode = {
        id: '123',
        title: undefined,
        url: 'https://example.com',
        dateAdded: 1642248600000,
        parentId: '456',
        index: 0,
      };

      const result = bookmarkToSearchResult(mockBookmark);

      expect(result.title).toBe('Untitled');
    });

    it('should handle bookmark without URL', () => {
      const mockBookmark: chrome.bookmarks.BookmarkTreeNode = {
        id: '123',
        title: 'Bookmark Folder',
        url: undefined,
        dateAdded: 1642248600000,
        parentId: '456',
        index: 0,
      };

      const result = bookmarkToSearchResult(mockBookmark);

      expect(getDomain).toHaveBeenCalledWith('');
      expect(getFaviconUrl).toHaveBeenCalledWith(
        '',
        BOOKMARK_LIMITS.FAVICON_SIZE
      );
      expect(result.metadata.url).toBeUndefined();
    });

    it('should handle bookmark with null title', () => {
      const mockBookmark: chrome.bookmarks.BookmarkTreeNode = {
        id: '123',
        title: null as any,
        url: 'https://example.com',
        dateAdded: 1642248600000,
        parentId: '456',
        index: 0,
      };

      const result = bookmarkToSearchResult(mockBookmark);

      expect(result.title).toBe('Untitled');
    });

    it('should preserve all metadata', () => {
      const mockBookmark: chrome.bookmarks.BookmarkTreeNode = {
        id: '123',
        title: 'Test Bookmark',
        url: 'https://test.com',
        dateAdded: 1642248600000,
        parentId: '456',
        index: 2,
      };

      const result = bookmarkToSearchResult(mockBookmark);

      expect(result.metadata).toEqual({
        id: '123',
        url: 'https://test.com',
        dateAdded: 1642248600000,
        parentId: '456',
      });
    });
  });
});
