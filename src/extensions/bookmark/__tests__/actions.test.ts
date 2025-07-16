import {
  bookmarkCurrentPage,
  editBookmark,
  openBookmark,
  openBookmarkManager,
  removeBookmark,
} from '../actions';
import { BOOKMARK_MESSAGES, BOOKMARK_URLS } from '../constants';

// Mock chrome APIs
const mockChrome = {
  tabs: {
    create: jest.fn(),
    query: jest.fn(),
  },
  bookmarks: {
    remove: jest.fn(),
    create: jest.fn(),
  },
  runtime: {
    lastError: null,
  },
};

global.chrome = mockChrome as any;

describe('Bookmark Extension Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockChrome.runtime.lastError = null;
  });

  describe('openBookmark', () => {
    it('should open bookmark in new tab', async () => {
      const testUrl = 'https://example.com';

      mockChrome.tabs.create.mockImplementation((_options, callback) => {
        callback({ id: 123 });
      });

      const result = await openBookmark(testUrl);

      expect(mockChrome.tabs.create).toHaveBeenCalledWith(
        { url: testUrl },
        expect.any(Function)
      );
      expect(result).toEqual({ success: true });
    });

    it('should handle tab creation error', async () => {
      const testUrl = 'https://example.com';

      mockChrome.tabs.create.mockImplementation((_options, callback) => {
        (mockChrome.runtime as any).lastError = {
          message: 'Cannot create tab',
        };
        callback(null);
      });

      const result = await openBookmark(testUrl);

      expect(result).toEqual({
        success: false,
        error: 'Cannot create tab',
      });
    });
  });

  describe('removeBookmark', () => {
    it('should remove bookmark successfully', async () => {
      const bookmarkId = '123';

      mockChrome.bookmarks.remove.mockImplementation((_id, callback) => {
        callback();
      });

      const result = await removeBookmark(bookmarkId);

      expect(mockChrome.bookmarks.remove).toHaveBeenCalledWith(
        bookmarkId,
        expect.any(Function)
      );
      expect(result).toEqual({
        success: true,
        data: { message: BOOKMARK_MESSAGES.BOOKMARK_REMOVED },
      });
    });

    it('should handle bookmark removal error', async () => {
      const bookmarkId = '123';

      mockChrome.bookmarks.remove.mockImplementation((_id, callback) => {
        (mockChrome.runtime as any).lastError = {
          message: 'Cannot remove bookmark',
        };
        callback();
      });

      const result = await removeBookmark(bookmarkId);

      expect(result).toEqual({
        success: false,
        error: 'Cannot remove bookmark',
      });
    });
  });

  describe('openBookmarkManager', () => {
    it('should open bookmark manager', async () => {
      mockChrome.tabs.create.mockImplementation((_options, callback) => {
        callback({ id: 123 });
      });

      const result = await openBookmarkManager();

      expect(mockChrome.tabs.create).toHaveBeenCalledWith(
        { url: BOOKMARK_URLS.BOOKMARK_MANAGER },
        expect.any(Function)
      );
      expect(result).toEqual({ success: true });
    });

    it('should handle tab creation error', async () => {
      mockChrome.tabs.create.mockImplementation((_options, callback) => {
        (mockChrome.runtime as any).lastError = {
          message: 'Cannot open bookmark manager',
        };
        callback(null);
      });

      const result = await openBookmarkManager();

      expect(result).toEqual({
        success: false,
        error: 'Cannot open bookmark manager',
      });
    });
  });

  describe('editBookmark', () => {
    it('should open bookmark manager for editing', async () => {
      mockChrome.tabs.create.mockImplementation((_options, callback) => {
        callback({ id: 123 });
      });

      const result = await editBookmark();

      expect(mockChrome.tabs.create).toHaveBeenCalledWith(
        { url: BOOKMARK_URLS.BOOKMARK_MANAGER },
        expect.any(Function)
      );
      expect(result).toEqual({ success: true });
    });
  });

  describe('bookmarkCurrentPage', () => {
    it('should bookmark current page successfully', async () => {
      const mockTab = {
        id: 123,
        title: 'Example Page',
        url: 'https://example.com',
        active: true,
      };

      mockChrome.tabs.query.mockImplementation((_query, callback) => {
        callback([mockTab]);
      });

      const mockBookmark = {
        id: '456',
        title: 'Example Page',
        url: 'https://example.com',
      };

      mockChrome.bookmarks.create.mockImplementation((_options, callback) => {
        callback(mockBookmark);
      });

      const result = await bookmarkCurrentPage();

      expect(mockChrome.tabs.query).toHaveBeenCalledWith(
        { active: true, currentWindow: true },
        expect.any(Function)
      );
      expect(mockChrome.bookmarks.create).toHaveBeenCalledWith(
        {
          title: 'Example Page',
          url: 'https://example.com',
        },
        expect.any(Function)
      );
      expect(result).toEqual({
        success: true,
        data: {
          message: BOOKMARK_MESSAGES.BOOKMARKED_PAGE('Example Page'),
          bookmarkId: '456',
        },
      });
    });

    it('should handle no current tab', async () => {
      mockChrome.tabs.query.mockImplementation((_query, callback) => {
        callback([]);
      });

      const result = await bookmarkCurrentPage();

      expect(result).toEqual({
        success: false,
        error: BOOKMARK_MESSAGES.COULD_NOT_GET_TAB,
      });
    });

    it('should handle tab without URL', async () => {
      const mockTab = {
        id: 123,
        title: 'New Tab',
        url: undefined,
        active: true,
      };

      mockChrome.tabs.query.mockImplementation((_query, callback) => {
        callback([mockTab]);
      });

      const result = await bookmarkCurrentPage();

      expect(result).toEqual({
        success: false,
        error: BOOKMARK_MESSAGES.COULD_NOT_GET_TAB,
      });
    });

    it('should handle tab without title', async () => {
      const mockTab = {
        id: 123,
        title: undefined,
        url: 'https://example.com',
        active: true,
      };

      mockChrome.tabs.query.mockImplementation((_query, callback) => {
        callback([mockTab]);
      });

      const result = await bookmarkCurrentPage();

      expect(result).toEqual({
        success: false,
        error: BOOKMARK_MESSAGES.COULD_NOT_GET_TAB,
      });
    });

    it('should handle bookmark creation error', async () => {
      const mockTab = {
        id: 123,
        title: 'Example Page',
        url: 'https://example.com',
        active: true,
      };

      mockChrome.tabs.query.mockImplementation((_query, callback) => {
        callback([mockTab]);
      });

      mockChrome.bookmarks.create.mockImplementation((_options, callback) => {
        (mockChrome.runtime as any).lastError = {
          message: 'Cannot create bookmark',
        };
        callback(null);
      });

      const result = await bookmarkCurrentPage();

      expect(result).toEqual({
        success: false,
        error: 'Cannot create bookmark',
      });
    });

    it('should handle tab with empty title', async () => {
      const mockTab = {
        id: 123,
        title: '',
        url: 'https://example.com',
        active: true,
      };

      mockChrome.tabs.query.mockImplementation((_query, callback) => {
        callback([mockTab]);
      });

      const result = await bookmarkCurrentPage();

      expect(result).toEqual({
        success: false,
        error: BOOKMARK_MESSAGES.COULD_NOT_GET_TAB,
      });
    });
  });
});
