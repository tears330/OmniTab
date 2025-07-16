import {
  clearLastHourHistory,
  clearTodayHistory,
  openHistoryItem,
  removeHistoryItem,
} from '../actions';
import { HISTORY_MESSAGES } from '../constants';

// Mock chrome APIs
const mockChrome = {
  tabs: {
    create: jest.fn(),
  },
  history: {
    deleteUrl: jest.fn(),
    deleteRange: jest.fn(),
  },
  runtime: {
    lastError: null,
  },
};

global.chrome = mockChrome as any;

describe('History Extension Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockChrome.runtime.lastError = null;
  });

  describe('openHistoryItem', () => {
    it('should open history item in new tab', async () => {
      const testUrl = 'https://example.com';

      mockChrome.tabs.create.mockImplementation((options, callback) => {
        callback({ id: 123 });
      });

      const result = await openHistoryItem(testUrl);

      expect(mockChrome.tabs.create).toHaveBeenCalledWith(
        { url: testUrl },
        expect.any(Function)
      );
      expect(result).toEqual({ success: true });
    });

    it('should handle tab creation error', async () => {
      const testUrl = 'https://example.com';

      mockChrome.tabs.create.mockImplementation((options, callback) => {
        (mockChrome.runtime as any).lastError = {
          message: 'Cannot create tab',
        };
        callback(null);
      });

      const result = await openHistoryItem(testUrl);

      expect(result).toEqual({
        success: false,
        error: 'Cannot create tab',
      });
    });
  });

  describe('removeHistoryItem', () => {
    it('should remove history item successfully', async () => {
      const testUrl = 'https://example.com';

      mockChrome.history.deleteUrl.mockImplementation((options, callback) => {
        callback();
      });

      const result = await removeHistoryItem(testUrl);

      expect(mockChrome.history.deleteUrl).toHaveBeenCalledWith(
        { url: testUrl },
        expect.any(Function)
      );
      expect(result).toEqual({
        success: true,
        data: { message: HISTORY_MESSAGES.REMOVED_FROM_HISTORY },
      });
    });

    it('should handle history deletion error', async () => {
      const testUrl = 'https://example.com';

      mockChrome.history.deleteUrl.mockImplementation((options, callback) => {
        (mockChrome.runtime as any).lastError = {
          message: 'Cannot delete history',
        };
        callback();
      });

      const result = await removeHistoryItem(testUrl);

      expect(result).toEqual({
        success: false,
        error: 'Cannot delete history',
      });
    });
  });

  describe('clearTodayHistory', () => {
    it("should clear today's history successfully", async () => {
      const mockDate = new Date('2023-01-15T10:30:00Z');

      // Use fake timers
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);

      mockChrome.history.deleteRange.mockImplementation((options, callback) => {
        callback();
      });

      const result = await clearTodayHistory();

      // Calculate expected start time the same way the function does
      const expectedStartOfDay = new Date();
      expectedStartOfDay.setHours(0, 0, 0, 0);

      expect(mockChrome.history.deleteRange).toHaveBeenCalledWith(
        {
          startTime: expectedStartOfDay.getTime(),
          endTime: mockDate.getTime(),
        },
        expect.any(Function)
      );
      expect(result).toEqual({
        success: true,
        data: { message: HISTORY_MESSAGES.CLEARED_TODAY_HISTORY },
      });

      // Restore real timers
      jest.useRealTimers();
    });

    it('should handle history deletion error', async () => {
      mockChrome.history.deleteRange.mockImplementation((options, callback) => {
        (mockChrome.runtime as any).lastError = {
          message: 'Cannot clear history',
        };
        callback();
      });

      const result = await clearTodayHistory();

      expect(result).toEqual({
        success: false,
        error: 'Cannot clear history',
      });
    });
  });

  describe('clearLastHourHistory', () => {
    it('should clear last hour history successfully', async () => {
      const mockNow = 1642248600000; // 2022-01-15T10:30:00Z
      const mockOneHourAgo = mockNow - 60 * 60 * 1000;
      const originalDateNow = Date.now;

      // Mock Date.now
      Date.now = jest.fn(() => mockNow);

      mockChrome.history.deleteRange.mockImplementation((options, callback) => {
        callback();
      });

      const result = await clearLastHourHistory();

      expect(mockChrome.history.deleteRange).toHaveBeenCalledWith(
        {
          startTime: mockOneHourAgo,
          endTime: mockNow,
        },
        expect.any(Function)
      );
      expect(result).toEqual({
        success: true,
        data: { message: HISTORY_MESSAGES.CLEARED_HOUR_HISTORY },
      });

      // Restore Date.now
      Date.now = originalDateNow;
    });

    it('should handle history deletion error', async () => {
      mockChrome.history.deleteRange.mockImplementation((options, callback) => {
        (mockChrome.runtime as any).lastError = {
          message: 'Cannot clear history',
        };
        callback();
      });

      const result = await clearLastHourHistory();

      expect(result).toEqual({
        success: false,
        error: 'Cannot clear history',
      });
    });
  });
});
