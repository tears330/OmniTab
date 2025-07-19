import type { ExtensionSettings } from '@/types/settings';
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from '@/types/settings';
import type { SettingsChangeListener } from '../settingsService';


import { SettingsService, settingsService } from '../settingsService';

// Mock Chrome APIs
const mockChrome = {
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
    },
    onChanged: {
      addListener: jest.fn(),
    },
  },
  runtime: {
    lastError: null,
    sendMessage: jest.fn(),
  },
};

global.chrome = mockChrome as any;

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockChrome.runtime.lastError = null;
    service = new SettingsService();
  });

  describe('loadSettings', () => {
    it('should return default settings when Chrome storage is not available', async () => {
      // Mock Chrome as undefined
      const originalChrome = global.chrome;
      delete (global as any).chrome;

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const settings = await service.loadSettings();

      expect(settings).toEqual(DEFAULT_SETTINGS);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Chrome storage API not available, using default settings'
      );

      consoleSpy.mockRestore();
      global.chrome = originalChrome;
    });

    it('should load saved settings from storage', async () => {
      const savedSettings: ExtensionSettings = {
        appearance: { theme: 'dark' },
        commands: { 'test:command': { enabled: false } },
        version: 1,
      };

      mockChrome.storage.sync.get.mockImplementation((_keys, callback) => {
        callback({ [SETTINGS_STORAGE_KEY]: savedSettings });
      });

      const settings = await service.loadSettings();

      expect(mockChrome.storage.sync.get).toHaveBeenCalledWith(
        [SETTINGS_STORAGE_KEY],
        expect.any(Function)
      );
      expect(settings).toEqual(savedSettings);
    });

    it('should save and return default settings when no saved settings exist', async () => {
      mockChrome.storage.sync.get.mockImplementation((_keys, callback) => {
        callback({});
      });

      mockChrome.storage.sync.set.mockImplementation((_data, callback) => {
        callback();
      });

      const settings = await service.loadSettings();

      expect(mockChrome.storage.sync.set).toHaveBeenCalledWith(
        { [SETTINGS_STORAGE_KEY]: DEFAULT_SETTINGS },
        expect.any(Function)
      );
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('should validate and migrate settings with invalid theme', async () => {
      const invalidSettings = {
        appearance: { theme: 'invalid-theme' as any },
        commands: {},
        version: 1,
      };

      mockChrome.storage.sync.get.mockImplementation((_keys, callback) => {
        callback({ [SETTINGS_STORAGE_KEY]: invalidSettings });
      });

      const settings = await service.loadSettings();

      expect(settings.appearance.theme).toBe(DEFAULT_SETTINGS.appearance.theme);
    });

    it('should migrate settings from older versions', async () => {
      const oldSettings = {
        appearance: { theme: 'dark' },
        commands: {},
        version: 0, // Old version
      };

      mockChrome.storage.sync.get.mockImplementation((_keys, callback) => {
        callback({ [SETTINGS_STORAGE_KEY]: oldSettings });
      });

      const settings = await service.loadSettings();

      expect(settings.version).toBe(DEFAULT_SETTINGS.version);
      expect(settings.appearance.theme).toBe('dark'); // Should preserve valid settings
    });
  });

  describe('saveSettings', () => {
    it('should save settings to Chrome storage', async () => {
      const testSettings: ExtensionSettings = {
        appearance: { theme: 'light' },
        commands: { 'test:command': { enabled: true } },
        version: 1,
      };

      mockChrome.storage.sync.set.mockImplementation((_data, callback) => {
        callback();
      });

      await service.saveSettings(testSettings);

      expect(mockChrome.storage.sync.set).toHaveBeenCalledWith(
        { [SETTINGS_STORAGE_KEY]: testSettings },
        expect.any(Function)
      );
    });

    it('should handle Chrome storage errors', async () => {
      const testSettings: ExtensionSettings = DEFAULT_SETTINGS;

      mockChrome.storage.sync.set.mockImplementation((_data, callback) => {
        (mockChrome.runtime as any).lastError = {
          message: 'Storage quota exceeded',
        };
        callback();
      });

      await expect(service.saveSettings(testSettings)).rejects.toThrow(
        'Storage quota exceeded'
      );
    });

    it('should return resolved promise when Chrome storage is not available', async () => {
      const originalChrome = global.chrome;
      delete (global as any).chrome;

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await expect(
        service.saveSettings(DEFAULT_SETTINGS)
      ).resolves.toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Chrome storage API not available, settings not saved'
      );

      consoleSpy.mockRestore();
      global.chrome = originalChrome;
    });

    it('should notify listeners of settings changes', async () => {
      const listener: SettingsChangeListener = jest.fn();
      service.addSettingsChangeListener(listener);

      const newSettings: ExtensionSettings = {
        ...DEFAULT_SETTINGS,
        appearance: { theme: 'dark' },
      };

      mockChrome.storage.sync.set.mockImplementation((_data, callback) => {
        callback();
      });

      await service.saveSettings(newSettings);

      expect(listener).toHaveBeenCalledWith({
        type: 'all',
        oldSettings: DEFAULT_SETTINGS,
        newSettings,
      });
    });

    it('should validate settings before saving', async () => {
      const invalidSettings = {
        appearance: { theme: 'invalid' as any },
        commands: { 'test:command': { enabled: 'not-boolean' as any } },
        version: 1,
      };

      mockChrome.storage.sync.set.mockImplementation((_data, callback) => {
        callback();
      });

      await service.saveSettings(invalidSettings);

      expect(mockChrome.storage.sync.set).toHaveBeenCalledWith(
        {
          [SETTINGS_STORAGE_KEY]: expect.objectContaining({
            appearance: { theme: DEFAULT_SETTINGS.appearance.theme },
            commands: { 'test:command': { enabled: true } },
          }),
        },
        expect.any(Function)
      );
    });
  });

  describe('updateSettings', () => {
    beforeEach(async () => {
      // Load initial settings
      mockChrome.storage.sync.get.mockImplementation((_keys, callback) => {
        callback({ [SETTINGS_STORAGE_KEY]: DEFAULT_SETTINGS });
      });
      await service.loadSettings();
    });

    it('should update specific settings section', async () => {
      const listener: SettingsChangeListener = jest.fn();
      service.addSettingsChangeListener(listener);

      mockChrome.storage.sync.set.mockImplementation((_data, callback) => {
        callback();
      });

      await service.updateSettings('appearance', { theme: 'dark' });

      expect(listener).toHaveBeenCalledWith({
        type: 'appearance',
        oldSettings: DEFAULT_SETTINGS,
        newSettings: expect.objectContaining({
          appearance: { theme: 'dark' },
        }),
      });
    });

    it('should update commands section', async () => {
      const newCommands = { 'test:command': { enabled: false } };

      mockChrome.storage.sync.set.mockImplementation((_data, callback) => {
        callback();
      });

      await service.updateSettings('commands', newCommands);

      expect(mockChrome.storage.sync.set).toHaveBeenCalledWith(
        {
          [SETTINGS_STORAGE_KEY]: expect.objectContaining({
            commands: newCommands,
          }),
        },
        expect.any(Function)
      );
    });
  });

  describe('getSettings', () => {
    it('should return cached settings if available', async () => {
      // First load to cache settings
      mockChrome.storage.sync.get.mockImplementation((_keys, callback) => {
        callback({ [SETTINGS_STORAGE_KEY]: DEFAULT_SETTINGS });
      });
      await service.loadSettings();

      // Clear mock to ensure cache is used
      mockChrome.storage.sync.get.mockClear();

      const settings = await service.getSettings();

      expect(settings).toEqual(DEFAULT_SETTINGS);
      expect(mockChrome.storage.sync.get).not.toHaveBeenCalled();
    });

    it('should load settings if not cached', async () => {
      mockChrome.storage.sync.get.mockImplementation((_keys, callback) => {
        callback({ [SETTINGS_STORAGE_KEY]: DEFAULT_SETTINGS });
      });

      const settings = await service.getSettings();

      expect(settings).toEqual(DEFAULT_SETTINGS);
      expect(mockChrome.storage.sync.get).toHaveBeenCalled();
    });
  });

  describe('getSettingsSection', () => {
    beforeEach(async () => {
      mockChrome.storage.sync.get.mockImplementation((_keys, callback) => {
        callback({ [SETTINGS_STORAGE_KEY]: DEFAULT_SETTINGS });
      });
      await service.loadSettings();
    });

    it('should return specific settings section', async () => {
      const appearanceSettings = await service.getSettingsSection('appearance');

      expect(appearanceSettings).toEqual(DEFAULT_SETTINGS.appearance);
    });

    it('should return commands section', async () => {
      const commandsSettings = await service.getSettingsSection('commands');

      expect(commandsSettings).toEqual(DEFAULT_SETTINGS.commands);
    });
  });

  describe('resetSettings', () => {
    it('should reset settings to defaults', async () => {
      mockChrome.storage.sync.set.mockImplementation((_data, callback) => {
        callback();
      });

      await service.resetSettings();

      expect(mockChrome.storage.sync.set).toHaveBeenCalledWith(
        { [SETTINGS_STORAGE_KEY]: DEFAULT_SETTINGS },
        expect.any(Function)
      );
    });
  });

  describe('isCommandEnabled', () => {
    beforeEach(async () => {
      const settingsWithCommands = {
        ...DEFAULT_SETTINGS,
        commands: {
          'enabled:command': { enabled: true },
          'disabled:command': { enabled: false },
        },
      };

      mockChrome.storage.sync.get.mockImplementation((_keys, callback) => {
        callback({ [SETTINGS_STORAGE_KEY]: settingsWithCommands });
      });
      await service.loadSettings();
    });

    it('should return true for enabled commands', async () => {
      const isEnabled = await service.isCommandEnabled('enabled:command');
      expect(isEnabled).toBe(true);
    });

    it('should return false for disabled commands', async () => {
      const isEnabled = await service.isCommandEnabled('disabled:command');
      expect(isEnabled).toBe(false);
    });

    it('should return true for unknown commands (default)', async () => {
      const isEnabled = await service.isCommandEnabled('unknown:command');
      expect(isEnabled).toBe(true);
    });
  });

  describe('setCommandEnabled', () => {
    beforeEach(async () => {
      mockChrome.storage.sync.get.mockImplementation((_keys, callback) => {
        callback({ [SETTINGS_STORAGE_KEY]: DEFAULT_SETTINGS });
      });
      await service.loadSettings();
    });

    it('should enable a command', async () => {
      mockChrome.storage.sync.set.mockImplementation((_data, callback) => {
        callback();
      });

      await service.setCommandEnabled('test:command', true);

      expect(mockChrome.storage.sync.set).toHaveBeenCalledWith(
        {
          [SETTINGS_STORAGE_KEY]: expect.objectContaining({
            commands: expect.objectContaining({
              'test:command': { enabled: true },
            }),
          }),
        },
        expect.any(Function)
      );
    });

    it('should disable a command', async () => {
      mockChrome.storage.sync.set.mockImplementation((_data, callback) => {
        callback();
      });

      await service.setCommandEnabled('test:command', false);

      expect(mockChrome.storage.sync.set).toHaveBeenCalledWith(
        {
          [SETTINGS_STORAGE_KEY]: expect.objectContaining({
            commands: expect.objectContaining({
              'test:command': { enabled: false },
            }),
          }),
        },
        expect.any(Function)
      );
    });
  });

  describe('listeners management', () => {
    it('should add and remove settings change listeners', () => {
      const listener1: SettingsChangeListener = jest.fn();
      const listener2: SettingsChangeListener = jest.fn();

      service.addSettingsChangeListener(listener1);
      service.addSettingsChangeListener(listener2);

      // Simulate settings change
      mockChrome.storage.sync.set.mockImplementation((_data, callback) => {
        callback();
      });

      service.saveSettings(DEFAULT_SETTINGS);

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();

      // Remove one listener
      service.removeSettingsChangeListener(listener1);
      jest.clearAllMocks();

      service.saveSettings(DEFAULT_SETTINGS);

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should handle listener errors gracefully', async () => {
      const errorListener: SettingsChangeListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      const goodListener: SettingsChangeListener = jest.fn();

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      service.addSettingsChangeListener(errorListener);
      service.addSettingsChangeListener(goodListener);

      mockChrome.storage.sync.set.mockImplementation((_data, callback) => {
        callback();
      });

      await service.saveSettings(DEFAULT_SETTINGS);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error in settings change listener:',
        expect.any(Error)
      );
      expect(goodListener).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('validation', () => {
    it('should fix invalid command settings structure', async () => {
      const invalidSettings = {
        appearance: { theme: 'light' as const },
        commands: {
          'valid:command': { enabled: true },
          'invalid:command': null as any,
          'invalid2:command': { enabled: 'not-boolean' as any },
        },
        version: 1,
      };

      mockChrome.storage.sync.get.mockImplementation((_keys, callback) => {
        callback({ [SETTINGS_STORAGE_KEY]: invalidSettings });
      });

      const settings = await service.loadSettings();

      expect(settings.commands['valid:command']).toEqual({ enabled: true });
      expect(settings.commands['invalid:command']).toEqual({ enabled: true });
      expect(settings.commands['invalid2:command']).toEqual({ enabled: true });
    });

    it('should add missing commands section', async () => {
      const settingsWithoutCommands = {
        appearance: { theme: 'light' as const },
        version: 1,
      } as any;

      mockChrome.storage.sync.get.mockImplementation((_keys, callback) => {
        callback({ [SETTINGS_STORAGE_KEY]: settingsWithoutCommands });
      });

      const settings = await service.loadSettings();

      expect(settings.commands).toEqual(DEFAULT_SETTINGS.commands);
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(settingsService).toBeInstanceOf(SettingsService);
    });
  });
});
