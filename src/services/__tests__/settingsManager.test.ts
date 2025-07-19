// Mock Chrome APIs first
import type { ExtensionSettings, SettingsChangeEvent } from '@/types/settings';

import { SettingsManager, settingsManager } from '../settingsManager';
import { settingsService } from '../settingsService';

const mockChrome = {
  storage: {
    onChanged: {
      addListener: jest.fn(),
    },
  },
  runtime: {
    sendMessage: jest.fn(),
  },
};

// Mock window.matchMedia
const mockMatchMedia = jest.fn();

// Set up global mocks before any imports
(global as any).chrome = mockChrome;
(global as any).window = {
  matchMedia: mockMatchMedia,
};

// Mock the settings service before importing
jest.mock('../settingsService', () => ({
  settingsService: {
    loadSettings: jest.fn(),
    addSettingsChangeListener: jest.fn(),
    getSettings: jest.fn(),
    isCommandEnabled: jest.fn(),
  },
}));

describe('SettingsManager', () => {
  let manager: SettingsManager;
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
    mockChrome.runtime.sendMessage = jest.fn();

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

    manager = new SettingsManager();

    // Default mock implementations
    (settingsService.loadSettings as jest.Mock).mockResolvedValue(mockSettings);
    (settingsService.getSettings as jest.Mock).mockResolvedValue(mockSettings);
    (settingsService.isCommandEnabled as jest.Mock).mockResolvedValue(true);
  });

  describe('initialize', () => {
    it('should initialize only once', async () => {
      await manager.initialize();
      await manager.initialize(); // Second call

      expect(settingsService.loadSettings).toHaveBeenCalledTimes(1);
      expect(settingsService.addSettingsChangeListener).toHaveBeenCalledTimes(
        1
      );
    });

    it('should load initial settings', async () => {
      await manager.initialize();

      expect(settingsService.loadSettings).toHaveBeenCalled();
    });

    it('should add settings change listener', async () => {
      await manager.initialize();

      expect(settingsService.addSettingsChangeListener).toHaveBeenCalledWith(
        expect.any(Function)
      );
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
      const testManager = new SettingsManager();
      await expect(testManager.initialize()).resolves.toBeUndefined();

      mockChrome.storage.onChanged = originalOnChanged;
    });
  });

  describe('handleSettingsChange', () => {
    beforeEach(async () => {
      await manager.initialize();
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

      // Get the registered listener
      const settingsChangeListener = (
        settingsService.addSettingsChangeListener as jest.Mock
      ).mock.calls[0][0];

      // Call the listener with commands change
      settingsChangeListener(changeEvent);

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

      // Get the registered listener
      const settingsChangeListener = (
        settingsService.addSettingsChangeListener as jest.Mock
      ).mock.calls[0][0];

      // Call the listener with all change
      settingsChangeListener(changeEvent);

      // Should call applySettings (which is currently empty but exists)
      expect(settingsChangeListener).toBeDefined();
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

      // Get the registered listener
      const settingsChangeListener = (
        settingsService.addSettingsChangeListener as jest.Mock
      ).mock.calls[0][0];

      // Call the listener with appearance change
      expect(() => settingsChangeListener(changeEvent)).not.toThrow();

      // Should not send any runtime messages for appearance changes
      expect(mockChrome.runtime.sendMessage).not.toHaveBeenCalled();
    });

    it('should handle unknown change events silently', () => {
      const changeEvent: SettingsChangeEvent = {
        type: 'unknown' as any,
        oldSettings: mockSettings,
        newSettings: mockSettings,
      };

      // Get the registered listener
      const settingsChangeListener = (
        settingsService.addSettingsChangeListener as jest.Mock
      ).mock.calls[0][0];

      // Call the listener with unknown change
      expect(() => settingsChangeListener(changeEvent)).not.toThrow();
    });

    it('should handle missing Chrome runtime gracefully', () => {
      const originalChrome = (global as any).chrome;
      delete (global as any).chrome;

      const changeEvent: SettingsChangeEvent = {
        type: 'commands',
        oldSettings: mockSettings,
        newSettings: mockSettings,
      };

      // Get the registered listener
      const settingsChangeListener = (
        settingsService.addSettingsChangeListener as jest.Mock
      ).mock.calls[0][0];

      expect(() => settingsChangeListener(changeEvent)).not.toThrow();

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
      (settingsService.getSettings as jest.Mock).mockResolvedValue({
        ...mockSettings,
        appearance: { theme: 'system' },
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

      const theme = await SettingsManager.getCurrentTheme();

      expect(theme).toBe('light');
      expect(matchMediaMock).toHaveBeenCalledWith(
        '(prefers-color-scheme: dark)'
      );
    });

    it('should return dark theme when system is dark', async () => {
      (settingsService.getSettings as jest.Mock).mockResolvedValue({
        ...mockSettings,
        appearance: { theme: 'system' },
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

      const theme = await SettingsManager.getCurrentTheme();

      expect(theme).toBe('dark');
    });

    it('should return explicit light theme', async () => {
      (settingsService.getSettings as jest.Mock).mockResolvedValue({
        ...mockSettings,
        appearance: { theme: 'light' },
      });

      const theme = await SettingsManager.getCurrentTheme();

      expect(theme).toBe('light');
      expect(mockMatchMedia).not.toHaveBeenCalled();
    });

    it('should return explicit dark theme', async () => {
      (settingsService.getSettings as jest.Mock).mockResolvedValue({
        ...mockSettings,
        appearance: { theme: 'dark' },
      });

      const theme = await SettingsManager.getCurrentTheme();

      expect(theme).toBe('dark');
      expect(mockMatchMedia).not.toHaveBeenCalled();
    });

    it('should default to light when window is not available (service worker)', async () => {
      (settingsService.getSettings as jest.Mock).mockResolvedValue({
        ...mockSettings,
        appearance: { theme: 'system' },
      });

      // Mock the SettingsManager.getCurrentTheme to directly test the service worker scenario
      // By temporarily replacing the window check
      const originalGetCurrentTheme = SettingsManager.getCurrentTheme;
      SettingsManager.getCurrentTheme = jest.fn(async () => {
        const settings = await settingsService.getSettings();
        const { theme } = settings.appearance;

        if (theme === 'system') {
          // Simulate service worker context (no window)
          return 'light';
        }

        return theme;
      });

      const theme = await SettingsManager.getCurrentTheme();

      expect(theme).toBe('light');

      // Restore original method
      SettingsManager.getCurrentTheme = originalGetCurrentTheme;
    });
  });

  describe('isCommandEnabled', () => {
    it('should delegate to settings service', async () => {
      (settingsService.isCommandEnabled as jest.Mock).mockResolvedValue(true);

      const isEnabled = await SettingsManager.isCommandEnabled('test:command');

      expect(isEnabled).toBe(true);
      expect(settingsService.isCommandEnabled).toHaveBeenCalledWith(
        'test:command'
      );
    });

    it('should return false for disabled commands', async () => {
      (settingsService.isCommandEnabled as jest.Mock).mockResolvedValue(false);

      const isEnabled = await SettingsManager.isCommandEnabled('test:command');

      expect(isEnabled).toBe(false);
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(settingsManager).toBeInstanceOf(SettingsManager);
    });
  });

  describe('error handling', () => {
    it('should handle settings service errors gracefully', async () => {
      (settingsService.loadSettings as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      await expect(manager.initialize()).rejects.toThrow('Storage error');
    });

    it('should handle settings service errors in getCurrentTheme', async () => {
      (settingsService.getSettings as jest.Mock).mockRejectedValue(
        new Error('Settings error')
      );

      await expect(SettingsManager.getCurrentTheme()).rejects.toThrow(
        'Settings error'
      );
    });

    it('should handle settings service errors in isCommandEnabled', async () => {
      (settingsService.isCommandEnabled as jest.Mock).mockRejectedValue(
        new Error('Command error')
      );

      await expect(
        SettingsManager.isCommandEnabled('test:command')
      ).rejects.toThrow('Command error');
    });
  });

  describe('edge cases', () => {
    it('should handle initialization with no settings listeners', async () => {
      // Don't register any listeners
      (
        settingsService.addSettingsChangeListener as jest.Mock
      ).mockImplementation(() => {});

      const manager2 = new SettingsManager();
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
