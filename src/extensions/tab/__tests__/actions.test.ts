import {
  closeAllDuplicates,
  closeTab,
  groupTabsByDomain,
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
  },
  runtime: {
    lastError: null,
  },
};

global.chrome = mockChrome as any;

describe('Tab Extension Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockChrome.runtime.lastError = null;
  });

  describe('switchToTab', () => {
    it('should switch to tab successfully', async () => {
      const mockTab = { id: 123, windowId: 456 };
      mockChrome.tabs.get.mockImplementation((tabId, callback) => {
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
      mockChrome.tabs.get.mockImplementation((tabId, callback) => {
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
      mockChrome.tabs.remove.mockImplementation((tabId, callback) => {
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
      mockChrome.tabs.remove.mockImplementation((tabId, callback) => {
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

      mockChrome.tabs.query.mockImplementation((query, callback) => {
        callback(mockTabs);
      });

      mockChrome.tabs.remove.mockImplementation((tabIds, callback) => {
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

      mockChrome.tabs.query.mockImplementation((query, callback) => {
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

      mockChrome.tabs.query.mockImplementation((query, callback) => {
        callback(mockTabs);
      });

      mockChrome.tabs.remove.mockImplementation((tabIds, callback) => {
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
      };
    });

    it('should group tabs by domain successfully', async () => {
      const mockTabs = [
        { id: 1, url: 'https://example.com/page1' },
        { id: 2, url: 'https://example.com/page2' },
        { id: 3, url: 'https://google.com/search' },
        { id: 4, url: 'https://github.com/repo' },
      ];

      mockChrome.tabs.query.mockImplementation((query, callback) => {
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

      mockChrome.tabs.query.mockImplementation((query, callback) => {
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

      mockChrome.tabs.query.mockImplementation((query, callback) => {
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
});
