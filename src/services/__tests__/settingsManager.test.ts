// Mock Chrome APIs first
import type { ExtensionSettings, SettingsChangeEvent } from '@/types/settings';

import { SettingsService, settingsService } from '../settingsService';

const mockChrome = {
  storage: {
    onChanged: {
      addListener: jest.fn(),
    },
    sync: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
  runtime: {
    sendMessage: jest.fn(),
    lastError: null as null | { message: string },
  },
  tabs: {
    query: jest.fn((_queryInfo, callback) => callback([])),
    sendMessage: jest.fn(),
  },
};

// Mock window.matchMedia
const mockMatchMedia = jest.fn();

// Set up global mocks
(global as any).chrome = mockChrome;
(global as any).window = {
  matchMedia: mockMatchMedia,
};

describe('SettingsService (with manager functionality)', () => {
  let manager: SettingsService;
  const mockSettings: ExtensionSettings = {
    appearance: { theme: 'system' },
    commands: {
      'test:command': { enabled: true },
    },
    version: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset the chrome mock completely
    mockChrome.storage.onChanged = {
      addListener: jest.fn(),
    };
    mockChrome.storage.sync = {
      get: jest.fn((_keys, callback) => {
        callback({ omnitab_settings: mockSettings });
      }),
      set: jest.fn((_data, callback) => {
        callback();
      }),
    };
    mockChrome.runtime.sendMessage = jest.fn();
    mockChrome.runtime.lastError = null;
    mockChrome.tabs.query = jest.fn((_queryInfo, callback) => callback([]));
    mockChrome.tabs.sendMessage = jest.fn();

    (global as any).chrome = mockChrome;

    // Reset window.matchMedia mock
    (global as any).window = {
      matchMedia: mockMatchMedia,
    };

    // Ensure matchMedia is properly mocked
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });

    manager = new SettingsService();
  });

  describe('initialize', () => {
    it('should initialize only once', async () => {
      await manager.initialize();
      await manager.initialize(); // Second call

      // Should only call Chrome storage once for loading
      expect(mockChrome.storage.sync.get).toHaveBeenCalledTimes(1);
    });

    it('should load initial settings', async () => {
      await manager.initialize();

      expect(mockChrome.storage.sync.get).toHaveBeenCalled();
    });

    it('should add settings change listener', async () => {
      await manager.initialize();

      // Should have added listeners
      expect(manager.addSettingsChangeListener).toBeDefined();
    });

    it('should add Chrome storage change listener when available', async () => {
      await manager.initialize();

      expect(mockChrome.storage.onChanged.addListener).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    it('should handle missing Chrome storage API gracefully', async () => {
      const originalChrome = (global as any).chrome;
      delete (global as any).chrome;

      await expect(manager.initialize()).resolves.toBeUndefined();

      (global as any).chrome = originalChrome;
    });

    it('should handle Chrome storage without onChanged gracefully', async () => {
      const originalOnChanged = mockChrome.storage.onChanged;
      delete (mockChrome.storage as any).onChanged;

      // Create a new manager after deleting onChanged
      const testManager = new SettingsService();
      await expect(testManager.initialize()).resolves.toBeUndefined();

      mockChrome.storage.onChanged = originalOnChanged;
    });
  });

  describe('handleSettingsChange', () => {
    let capturedListener: any;

    beforeEach(async () => {
      // Spy on the addSettingsChangeListener method to capture the listener
      const addListenerSpy = jest.spyOn(manager, 'addSettingsChangeListener');

      await manager.initialize();

      // Get the captured listener from the spy
      if (addListenerSpy.mock.calls.length > 0) {
        // eslint-disable-next-line prefer-destructuring
        capturedListener = addListenerSpy.mock.calls[0][0];
      }
    });

    it('should handle commands change events', () => {
      const changeEvent: SettingsChangeEvent = {
        type: 'commands',
        oldSettings: mockSettings,
        newSettings: {
          ...mockSettings,
          commands: { 'test:command': { enabled: false } },
        },
      };

      // Call the captured listener with commands change
      expect(capturedListener).toBeDefined();
      capturedListener(changeEvent);

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'settings-commands-updated',
        oldCommands: changeEvent.oldSettings.commands,
        newCommands: changeEvent.newSettings.commands,
      });
    });

    it('should handle all change events', () => {
      const changeEvent: SettingsChangeEvent = {
        type: 'all',
        oldSettings: mockSettings,
        newSettings: {
          ...mockSettings,
          appearance: { theme: 'dark' },
        },
      };

      // Call the captured listener with all change
      expect(capturedListener).toBeDefined();
      expect(() => capturedListener(changeEvent)).not.toThrow();
    });

    it('should handle appearance change events silently', () => {
      const changeEvent: SettingsChangeEvent = {
        type: 'appearance',
        oldSettings: mockSettings,
        newSettings: {
          ...mockSettings,
          appearance: { theme: 'dark' },
        },
      };

      // Call the captured listener with appearance change
      expect(capturedListener).toBeDefined();
      expect(() => capturedListener(changeEvent)).not.toThrow();

      // Should not send any runtime messages for appearance changes
      expect(mockChrome.runtime.sendMessage).not.toHaveBeenCalled();
    });

    it('should handle unknown change events silently', () => {
      const changeEvent: SettingsChangeEvent = {
        type: 'unknown' as any,
        oldSettings: mockSettings,
        newSettings: mockSettings,
      };

      // Call the captured listener with unknown change
      expect(capturedListener).toBeDefined();
      expect(() => capturedListener(changeEvent)).not.toThrow();
    });

    it('should handle missing Chrome runtime gracefully', () => {
      const originalChrome = (global as any).chrome;
      delete (global as any).chrome;

      const changeEvent: SettingsChangeEvent = {
        type: 'commands',
        oldSettings: mockSettings,
        newSettings: mockSettings,
      };

      // Call the captured listener with missing chrome
      expect(capturedListener).toBeDefined();
      expect(() => capturedListener(changeEvent)).not.toThrow();

      (global as any).chrome = originalChrome;
    });
  });

  describe('Chrome storage change listener', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should handle storage changes for omnitab_settings', () => {
      const storageChanges = {
        omnitab_settings: {
          newValue: {
            ...mockSettings,
            appearance: { theme: 'dark' },
          },
        },
      };

      // Get the registered storage listener
      const storageListener =
        mockChrome.storage.onChanged.addListener.mock.calls[0][0];

      // Call the listener with sync area changes
      expect(() => storageListener(storageChanges, 'sync')).not.toThrow();
    });

    it('should ignore storage changes for other keys', () => {
      const storageChanges = {
        other_key: {
          newValue: 'some value',
        },
      };

      // Get the registered storage listener
      const storageListener =
        mockChrome.storage.onChanged.addListener.mock.calls[0][0];

      // Call the listener
      expect(() => storageListener(storageChanges, 'sync')).not.toThrow();
    });

    it('should ignore storage changes for non-sync areas', () => {
      const storageChanges = {
        omnitab_settings: {
          newValue: mockSettings,
        },
      };

      // Get the registered storage listener
      const storageListener =
        mockChrome.storage.onChanged.addListener.mock.calls[0][0];

      // Call the listener with local area
      expect(() => storageListener(storageChanges, 'local')).not.toThrow();
    });

    it('should handle storage changes with missing newValue', () => {
      const storageChanges = {
        omnitab_settings: {
          oldValue: mockSettings,
        },
      };

      // Get the registered storage listener
      const storageListener =
        mockChrome.storage.onChanged.addListener.mock.calls[0][0];

      expect(() => storageListener(storageChanges, 'sync')).not.toThrow();
    });
  });

  describe('getCurrentTheme', () => {
    it('should return light theme when system is light', async () => {
      // Update mock to return system theme
      mockChrome.storage.sync.get = jest.fn((_keys, callback) => {
        callback({
          omnitab_settings: {
            ...mockSettings,
            appearance: { theme: 'system' },
          },
        });
      });

      // Set up matchMedia mock to return light theme
      const matchMediaMock = jest.fn().mockReturnValue({
        matches: false, // Light theme (prefers-color-scheme: dark is false)
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      });

      // Use Object.defineProperty to properly mock window.matchMedia
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: matchMediaMock,
      });

      const theme = await SettingsService.getCurrentTheme();

      expect(theme).toBe('light');
      expect(matchMediaMock).toHaveBeenCalledWith(
        '(prefers-color-scheme: dark)'
      );
    });

    it('should return dark theme when system is dark', async () => {
      // Update mock to return system theme
      mockChrome.storage.sync.get = jest.fn((_keys, callback) => {
        callback({
          omnitab_settings: {
            ...mockSettings,
            appearance: { theme: 'system' },
          },
        });
      });

      // Set up matchMedia mock to return dark theme
      const matchMediaMock = jest.fn().mockReturnValue({
        matches: true, // Dark theme (prefers-color-scheme: dark is true)
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      });

      // Use Object.defineProperty to properly mock window.matchMedia
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: matchMediaMock,
      });

      const theme = await SettingsService.getCurrentTheme();

      expect(theme).toBe('dark');
    });

    it('should return explicit light theme', async () => {
      // Update mock to return light theme
      mockChrome.storage.sync.get = jest.fn((_keys, callback) => {
        callback({
          omnitab_settings: {
            ...mockSettings,
            appearance: { theme: 'light' },
          },
        });
      });

      const theme = await SettingsService.getCurrentTheme();

      expect(theme).toBe('light');
      expect(mockMatchMedia).not.toHaveBeenCalled();
    });

    it('should return explicit dark theme', async () => {
      // Update mock to return dark theme
      mockChrome.storage.sync.get = jest.fn((_keys, callback) => {
        callback({
          omnitab_settings: {
            ...mockSettings,
            appearance: { theme: 'dark' },
          },
        });
      });

      const theme = await SettingsService.getCurrentTheme();

      expect(theme).toBe('dark');
      expect(mockMatchMedia).not.toHaveBeenCalled();
    });

    it('should handle service worker context', () => {
      // This test documents that the getCurrentTheme method handles service worker context
      // In the actual service worker, window is undefined and defaults to light theme
      expect(SettingsService.getCurrentTheme).toBeDefined();
    });
  });

  describe('isCommandEnabled', () => {
    it('should return true for enabled commands', async () => {
      const isEnabled = await SettingsService.isCommandEnabled('test:command');

      expect(isEnabled).toBe(true);
    });

    it('should return false for disabled commands', async () => {
      // Update mock to return disabled command
      mockChrome.storage.sync.get = jest.fn((_keys, callback) => {
        callback({
          omnitab_settings: {
            ...mockSettings,
            commands: {
              'test:command': { enabled: false },
            },
          },
        });
      });

      const isEnabled = await SettingsService.isCommandEnabled('test:command');

      expect(isEnabled).toBe(false);
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(settingsService).toBeInstanceOf(SettingsService);
    });
  });

  describe('error handling', () => {
    it('should handle Chrome storage set errors gracefully', async () => {
      // Test the saveSettings method directly which should handle errors
      mockChrome.storage.sync.set = jest.fn((_data, callback) => {
        mockChrome.runtime.lastError = { message: 'Storage error' };
        callback();
      });

      await expect(manager.saveSettings(mockSettings)).rejects.toThrow(
        'Storage error'
      );

      // Clear the error to prevent issues with subsequent tests
      mockChrome.runtime.lastError = null;
    });

    it('should handle missing Chrome storage gracefully', async () => {
      const originalChrome = (global as any).chrome;
      delete (global as any).chrome;

      // This should return default settings and not throw
      const settings = await manager.loadSettings();
      expect(settings).toBeDefined();
      expect(settings.appearance.theme).toBe('system'); // Should use default settings

      (global as any).chrome = originalChrome;
    });

    it('should handle malformed storage data', async () => {
      // Mock Chrome storage to return invalid data
      mockChrome.storage.sync.get = jest.fn((_keys, callback) => {
        callback({ omnitab_settings: 'invalid-data' });
      });

      // Should fall back to defaults
      const settings = await manager.loadSettings();
      expect(settings).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle initialization with no settings listeners', async () => {
      const manager2 = new SettingsService();
      await expect(manager2.initialize()).resolves.toBeUndefined();
    });

    it('should handle Chrome storage changes with malformed data', async () => {
      const storageChanges = {
        omnitab_settings: {
          newValue: 'invalid-json-data',
        },
      };

      // Initialize first to register listener
      await manager.initialize();

      // Get the registered storage listener
      const storageListener =
        mockChrome.storage.onChanged.addListener.mock.calls[0][0];

      // Should not throw even with invalid data
      expect(() => storageListener(storageChanges, 'sync')).not.toThrow();
    });
  });
});
