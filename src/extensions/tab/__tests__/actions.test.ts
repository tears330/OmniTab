import {
  addTabToBookmarks,
  closeAllDuplicates,
  closeOtherTabGroups,
  closeOtherTabs,
  closeTab,
  closeTabGroup,
  getCurrentActiveTab,
  groupTabsByDomain,
  muteTab,
  pinTab,
  switchToTab,
} from '../actions';
import { TAB_MESSAGES } from '../constants';

// Mock chrome APIs
const mockChrome = {
  tabs: {
    get: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    query: jest.fn(),
    group: jest.fn(),
  },
  windows: {
    update: jest.fn(),
  },
  tabGroups: {
    update: jest.fn(),
    TAB_GROUP_ID_NONE: -1,
  },
  bookmarks: {
    create: jest.fn(),
  },
  runtime: {
    lastError: null,
    getURL: jest.fn((path: string) => `chrome-extension://test/${path}`),
  },
};

global.chrome = mockChrome as any;

describe('Tab Extension Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockChrome.runtime.lastError = null;
  });

  describe('getCurrentActiveTab', () => {
    it('should return the current active tab', async () => {
      const mockActiveTab = { id: 123, windowId: 456, active: true };
      mockChrome.tabs.query.mockResolvedValue([mockActiveTab]);

      const result = await getCurrentActiveTab();

      expect(mockChrome.tabs.query).toHaveBeenCalledWith({
        active: true,
        currentWindow: true,
      });
      expect(result).toEqual(mockActiveTab);
    });

    it('should return null when no active tab found', async () => {
      mockChrome.tabs.query.mockResolvedValue([]);

      const result = await getCurrentActiveTab();

      expect(mockChrome.tabs.query).toHaveBeenCalledWith({
        active: true,
        currentWindow: true,
      });
      expect(result).toBeNull();
    });

    it('should handle chrome.tabs.query errors', async () => {
      mockChrome.tabs.query.mockRejectedValue(new Error('Query failed'));

      await expect(getCurrentActiveTab()).rejects.toThrow('Query failed');
    });
  });

  describe('switchToTab', () => {
    it('should switch to tab successfully', async () => {
      const mockTab = { id: 123, windowId: 456 };
      mockChrome.tabs.get.mockImplementation((_tabId, callback) => {
        callback(mockTab);
      });

      const result = await switchToTab(123);

      expect(mockChrome.tabs.get).toHaveBeenCalledWith(
        123,
        expect.any(Function)
      );
      expect(mockChrome.tabs.update).toHaveBeenCalledWith(123, {
        active: true,
      });
      expect(mockChrome.windows.update).toHaveBeenCalledWith(456, {
        focused: true,
      });
      expect(result).toEqual({ success: true });
    });

    it('should handle tab not found error', async () => {
      mockChrome.tabs.get.mockImplementation((_tabId, callback) => {
        (mockChrome.runtime as any).lastError = { message: 'Tab not found' };
        callback(null);
      });

      const result = await switchToTab(123);

      expect(result).toEqual({
        success: false,
        error: 'Tab not found',
      });
    });
  });

  describe('closeTab', () => {
    it('should close tab successfully', async () => {
      mockChrome.tabs.remove.mockImplementation((_tabId, callback) => {
        callback();
      });

      const result = await closeTab(123);

      expect(mockChrome.tabs.remove).toHaveBeenCalledWith(
        123,
        expect.any(Function)
      );
      expect(result).toEqual({ success: true });
    });

    it('should handle tab removal error', async () => {
      mockChrome.tabs.remove.mockImplementation((_tabId, callback) => {
        (mockChrome.runtime as any).lastError = { message: 'Cannot close tab' };
        callback();
      });

      const result = await closeTab(123);

      expect(result).toEqual({
        success: false,
        error: 'Cannot close tab',
      });
    });
  });

  describe('closeAllDuplicates', () => {
    it('should close duplicate tabs', async () => {
      const mockTabs = [
        { id: 1, url: 'https://example.com', active: false },
        { id: 2, url: 'https://example.com', active: true },
        { id: 3, url: 'https://google.com', active: false },
        { id: 4, url: 'https://example.com', active: false },
      ];

      mockChrome.tabs.query.mockImplementation((_query, callback) => {
        callback(mockTabs);
      });

      mockChrome.tabs.remove.mockImplementation((_tabIds, callback) => {
        callback();
      });

      const result = await closeAllDuplicates();

      expect(mockChrome.tabs.query).toHaveBeenCalledWith(
        {},
        expect.any(Function)
      );
      expect(mockChrome.tabs.remove).toHaveBeenCalledWith(
        [1, 4],
        expect.any(Function)
      );
      expect(result).toEqual({
        success: true,
        data: {
          message: TAB_MESSAGES.DUPLICATES_CLOSED(2),
        },
      });
    });

    it('should handle no duplicates found', async () => {
      const mockTabs = [
        { id: 1, url: 'https://example.com' },
        { id: 2, url: 'https://google.com' },
      ];

      mockChrome.tabs.query.mockImplementation((_query, callback) => {
        callback(mockTabs);
      });

      const result = await closeAllDuplicates();

      expect(mockChrome.tabs.remove).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        data: { message: TAB_MESSAGES.NO_DUPLICATES_FOUND },
      });
    });

    it('should handle tab removal error', async () => {
      const mockTabs = [
        { id: 1, url: 'https://example.com' },
        { id: 2, url: 'https://example.com' },
      ];

      mockChrome.tabs.query.mockImplementation((_query, callback) => {
        callback(mockTabs);
      });

      mockChrome.tabs.remove.mockImplementation((_tabIds, callback) => {
        (mockChrome.runtime as any).lastError = {
          message: 'Cannot remove tabs',
        };
        callback();
      });

      const result = await closeAllDuplicates();

      expect(result).toEqual({
        success: false,
        error: 'Cannot remove tabs',
      });
    });
  });

  describe('groupTabsByDomain', () => {
    beforeEach(() => {
      // Mock tabGroups API availability
      mockChrome.tabGroups = {
        update: jest.fn(),
        TAB_GROUP_ID_NONE: -1,
      };
    });

    it('should group tabs by domain successfully', async () => {
      const mockTabs = [
        { id: 1, url: 'https://example.com/page1' },
        { id: 2, url: 'https://example.com/page2' },
        { id: 3, url: 'https://google.com/search' },
        { id: 4, url: 'https://github.com/repo' },
      ];

      mockChrome.tabs.query.mockImplementation((_query, callback) => {
        callback(mockTabs);
      });

      mockChrome.tabs.group.mockResolvedValue(123);
      mockChrome.tabGroups.update.mockResolvedValue(undefined);

      const result = await groupTabsByDomain();

      expect(mockChrome.tabs.query).toHaveBeenCalledWith(
        { currentWindow: true },
        expect.any(Function)
      );
      expect(mockChrome.tabs.group).toHaveBeenCalledWith({ tabIds: [1, 2] });
      expect(mockChrome.tabGroups.update).toHaveBeenCalledWith(123, {
        title: 'example.com',
        collapsed: false,
      });
      expect(result).toEqual({
        success: true,
        data: {
          message: TAB_MESSAGES.GROUPS_CREATED(1),
        },
      });
    });

    it('should handle tab groups API not supported', async () => {
      delete (mockChrome as any).tabGroups;

      const result = await groupTabsByDomain();

      expect(result).toEqual({
        success: false,
        error: TAB_MESSAGES.TAB_GROUPS_NOT_SUPPORTED,
      });
    });

    it('should handle single tabs (no grouping needed)', async () => {
      const mockTabs = [
        { id: 1, url: 'https://example.com' },
        { id: 2, url: 'https://google.com' },
      ];

      mockChrome.tabs.query.mockImplementation((_query, callback) => {
        callback(mockTabs);
      });

      const result = await groupTabsByDomain();

      expect(mockChrome.tabs.group).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        data: {
          message: TAB_MESSAGES.GROUPS_CREATED(0),
        },
      });
    });

    it('should handle invalid URLs gracefully', async () => {
      const mockTabs = [
        { id: 1, url: 'invalid-url' },
        { id: 2, url: 'https://example.com' },
      ];

      mockChrome.tabs.query.mockImplementation((_query, callback) => {
        callback(mockTabs);
      });

      const result = await groupTabsByDomain();

      expect(result).toEqual({
        success: true,
        data: {
          message: TAB_MESSAGES.GROUPS_CREATED(0),
        },
      });
    });
  });

  describe('muteTab', () => {
    it('should mute tab successfully', async () => {
      mockChrome.tabs.update.mockImplementation((_tabId, _props, callback) => {
        callback();
      });

      const result = await muteTab(123, true);

      expect(mockChrome.tabs.update).toHaveBeenCalledWith(
        123,
        { muted: true },
        expect.any(Function)
      );
      expect(result).toEqual({ success: true });
    });

    it('should unmute tab successfully', async () => {
      mockChrome.tabs.update.mockImplementation((_tabId, _props, callback) => {
        callback();
      });

      const result = await muteTab(123, false);

      expect(mockChrome.tabs.update).toHaveBeenCalledWith(
        123,
        { muted: false },
        expect.any(Function)
      );
      expect(result).toEqual({ success: true });
    });

    it('should handle mute error', async () => {
      mockChrome.tabs.update.mockImplementation((_tabId, _props, callback) => {
        (mockChrome.runtime as any).lastError = { message: 'Cannot mute tab' };
        callback();
      });

      const result = await muteTab(123, true);

      expect(result).toEqual({
        success: false,
        error: 'Cannot mute tab',
      });
    });
  });

  describe('pinTab', () => {
    it('should pin tab successfully', async () => {
      mockChrome.tabs.update.mockImplementation((_tabId, _props, callback) => {
        callback();
      });

      const result = await pinTab(123, true);

      expect(mockChrome.tabs.update).toHaveBeenCalledWith(
        123,
        { pinned: true },
        expect.any(Function)
      );
      expect(result).toEqual({ success: true });
    });

    it('should unpin tab successfully', async () => {
      mockChrome.tabs.update.mockImplementation((_tabId, _props, callback) => {
        callback();
      });

      const result = await pinTab(123, false);

      expect(mockChrome.tabs.update).toHaveBeenCalledWith(
        123,
        { pinned: false },
        expect.any(Function)
      );
      expect(result).toEqual({ success: true });
    });

    it('should handle pin error', async () => {
      mockChrome.tabs.update.mockImplementation((_tabId, _props, callback) => {
        (mockChrome.runtime as any).lastError = { message: 'Cannot pin tab' };
        callback();
      });

      const result = await pinTab(123, true);

      expect(result).toEqual({
        success: false,
        error: 'Cannot pin tab',
      });
    });
  });

  describe('closeOtherTabs', () => {
    it('should close other tabs successfully', async () => {
      const mockTabs = [
        { id: 1, url: 'https://example.com' },
        { id: 2, url: 'https://google.com' },
        { id: 3, url: 'https://github.com' },
      ];

      mockChrome.tabs.query.mockImplementation((_query, callback) => {
        callback(mockTabs);
      });

      mockChrome.tabs.remove.mockImplementation((_tabIds, callback) => {
        callback();
      });

      const result = await closeOtherTabs(2);

      expect(mockChrome.tabs.query).toHaveBeenCalledWith(
        { currentWindow: true },
        expect.any(Function)
      );
      expect(mockChrome.tabs.remove).toHaveBeenCalledWith(
        [1, 3],
        expect.any(Function)
      );
      expect(result).toEqual({ success: true });
    });

    it('should handle no other tabs', async () => {
      const mockTabs = [{ id: 1, url: 'https://example.com' }];

      mockChrome.tabs.query.mockImplementation((_query, callback) => {
        callback(mockTabs);
      });

      const result = await closeOtherTabs(1);

      expect(mockChrome.tabs.remove).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('should handle close error', async () => {
      const mockTabs = [
        { id: 1, url: 'https://example.com' },
        { id: 2, url: 'https://google.com' },
      ];

      mockChrome.tabs.query.mockImplementation((_query, callback) => {
        callback(mockTabs);
      });

      mockChrome.tabs.remove.mockImplementation((_tabIds, callback) => {
        (mockChrome.runtime as any).lastError = {
          message: 'Cannot close tabs',
        };
        callback();
      });

      const result = await closeOtherTabs(1);

      expect(result).toEqual({
        success: false,
        error: 'Cannot close tabs',
      });
    });
  });

  describe('closeTabGroup', () => {
    it('should close tab group successfully', async () => {
      const mockTab = { id: 123, groupId: 456 };
      const mockGroupTabs = [
        { id: 123, groupId: 456 },
        { id: 124, groupId: 456 },
      ];

      mockChrome.tabs.get.mockImplementation((_tabId, callback) => {
        callback(mockTab);
      });

      mockChrome.tabs.query.mockImplementation((_query, callback) => {
        callback(mockGroupTabs);
      });

      mockChrome.tabs.remove.mockImplementation((_tabIds, callback) => {
        callback();
      });

      const result = await closeTabGroup(123);

      expect(mockChrome.tabs.get).toHaveBeenCalledWith(
        123,
        expect.any(Function)
      );
      expect(mockChrome.tabs.query).toHaveBeenCalledWith(
        { groupId: 456 },
        expect.any(Function)
      );
      expect(mockChrome.tabs.remove).toHaveBeenCalledWith(
        [123, 124],
        expect.any(Function)
      );
      expect(result).toEqual({
        success: true,
        data: { message: TAB_MESSAGES.GROUP_CLOSED },
      });
    });

    it('should handle tab not in group', async () => {
      const mockTab = {
        id: 123,
        groupId: mockChrome.tabGroups.TAB_GROUP_ID_NONE,
      };

      mockChrome.tabs.get.mockImplementation((_tabId, callback) => {
        callback(mockTab);
      });

      const result = await closeTabGroup(123);

      expect(result).toEqual({
        success: false,
        error: TAB_MESSAGES.NO_GROUP_FOUND,
      });
    });

    it('should handle tab groups not supported', async () => {
      delete (mockChrome as any).tabGroups;

      const result = await closeTabGroup(123);

      expect(result).toEqual({
        success: false,
        error: TAB_MESSAGES.TAB_GROUPS_NOT_SUPPORTED,
      });
    });
  });

  describe('closeOtherTabGroups', () => {
    beforeEach(() => {
      mockChrome.tabGroups = {
        update: jest.fn(),
        TAB_GROUP_ID_NONE: -1,
      };
    });

    it('should close other tab groups successfully', async () => {
      const mockCurrentTab = { id: 123, groupId: 456 };
      const mockTabs = [
        { id: 123, groupId: 456 }, // Current tab's group
        { id: 124, groupId: 456 }, // Same group
        { id: 125, groupId: 789 }, // Different group
        { id: 126, groupId: 789 }, // Different group
        { id: 127, groupId: -1 }, // No group
      ];

      mockChrome.tabs.get.mockImplementation((_tabId, callback) => {
        callback(mockCurrentTab);
      });

      mockChrome.tabs.query.mockImplementation((_query, callback) => {
        callback(mockTabs);
      });

      mockChrome.tabs.remove.mockImplementation((_tabIds, callback) => {
        callback();
      });

      const result = await closeOtherTabGroups(123);

      expect(mockChrome.tabs.remove).toHaveBeenCalledWith(
        [125, 126],
        expect.any(Function)
      );
      expect(result).toEqual({
        success: true,
        data: {
          message: TAB_MESSAGES.OTHER_GROUPS_CLOSED(1),
        },
      });
    });

    it('should handle no other groups', async () => {
      const mockCurrentTab = { id: 123, groupId: 456 };
      const mockTabs = [
        { id: 123, groupId: 456 },
        { id: 124, groupId: 456 },
        { id: 125, groupId: -1 },
      ];

      mockChrome.tabs.get.mockImplementation((_tabId, callback) => {
        callback(mockCurrentTab);
      });

      mockChrome.tabs.query.mockImplementation((_query, callback) => {
        callback(mockTabs);
      });

      const result = await closeOtherTabGroups(123);

      expect(result).toEqual({
        success: false,
        error: TAB_MESSAGES.NO_OTHER_GROUPS_FOUND,
      });
    });

    it('should handle tab groups not supported', async () => {
      delete (mockChrome as any).tabGroups;

      const result = await closeOtherTabGroups(123);

      expect(result).toEqual({
        success: false,
        error: TAB_MESSAGES.TAB_GROUPS_NOT_SUPPORTED,
      });
    });
  });

  describe('addTabToBookmarks', () => {
    it('should add tab to bookmarks successfully', async () => {
      const mockTab = {
        id: 123,
        title: 'Example Page',
        url: 'https://example.com',
      };

      mockChrome.tabs.get.mockImplementation((_tabId, callback) => {
        callback(mockTab);
      });

      mockChrome.bookmarks.create.mockImplementation((_bookmark, callback) => {
        callback({ id: 'bookmark123' });
      });

      const result = await addTabToBookmarks(123);

      expect(mockChrome.tabs.get).toHaveBeenCalledWith(
        123,
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
        data: { message: TAB_MESSAGES.BOOKMARK_ADDED },
      });
    });

    it('should handle tab without URL or title', async () => {
      const mockTab = {
        id: 123,
        title: undefined,
        url: undefined,
      };

      mockChrome.tabs.get.mockImplementation((_tabId, callback) => {
        callback(mockTab);
      });

      const result = await addTabToBookmarks(123);

      expect(result).toEqual({
        success: false,
        error: TAB_MESSAGES.BOOKMARK_FAILED,
      });
    });

    it('should handle bookmark creation error', async () => {
      const mockTab = {
        id: 123,
        title: 'Example Page',
        url: 'https://example.com',
      };

      mockChrome.tabs.get.mockImplementation((_tabId, callback) => {
        callback(mockTab);
      });

      mockChrome.bookmarks.create.mockImplementation((_bookmark, callback) => {
        (mockChrome.runtime as any).lastError = {
          message: 'Bookmark creation failed',
        };
        callback();
      });

      const result = await addTabToBookmarks(123);

      expect(result).toEqual({
        success: false,
        error: 'Bookmark creation failed',
      });
    });

    it('should handle tab not found', async () => {
      mockChrome.tabs.get.mockImplementation((_tabId, callback) => {
        (mockChrome.runtime as any).lastError = { message: 'Tab not found' };
        callback(null);
      });

      const result = await addTabToBookmarks(123);

      expect(result).toEqual({
        success: false,
        error: 'Tab not found',
      });
    });
  });
});
