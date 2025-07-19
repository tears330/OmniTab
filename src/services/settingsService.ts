/**
 * Settings service for managing extension settings storage and retrieval
 */

import {
  DEFAULT_SETTINGS,
  ExtensionSettings,
  SETTINGS_STORAGE_KEY,
  SETTINGS_VALIDATION_SCHEMA,
  SettingsChangeEvent,
  SettingsChangeType,
} from '@/types/settings';

/**
 * Settings change listener callback
 */
export type SettingsChangeListener = (event: SettingsChangeEvent) => void;

/**
 * Settings service class for managing extension settings
 */
class SettingsService {
  private listeners: Set<SettingsChangeListener> = new Set();

  private cachedSettings: ExtensionSettings | null = null;

  /**
   * Load settings from Chrome storage
   */
  async loadSettings(): Promise<ExtensionSettings> {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      // eslint-disable-next-line no-console
      console.warn('Chrome storage API not available, using default settings');
      return DEFAULT_SETTINGS;
    }

    return new Promise((resolve) => {
      chrome.storage.sync.get([SETTINGS_STORAGE_KEY], (result) => {
        const savedSettings = result[SETTINGS_STORAGE_KEY] as ExtensionSettings;

        if (savedSettings) {
          // Validate and migrate settings if needed
          const validatedSettings =
            SettingsService.validateAndMigrateSettings(savedSettings);
          this.cachedSettings = validatedSettings;
          resolve(validatedSettings);
        } else {
          // First time installation, save default settings
          this.saveSettings(DEFAULT_SETTINGS).then(() => {
            this.cachedSettings = DEFAULT_SETTINGS;
            resolve(DEFAULT_SETTINGS);
          });
        }
      });
    });
  }

  /**
   * Save settings to Chrome storage
   */
  async saveSettings(settings: ExtensionSettings): Promise<void> {
    const validatedSettings = SettingsService.validateSettings(settings);

    if (typeof chrome === 'undefined' || !chrome.storage) {
      // eslint-disable-next-line no-console
      console.warn('Chrome storage API not available, settings not saved');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      chrome.storage.sync.set(
        { [SETTINGS_STORAGE_KEY]: validatedSettings },
        () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            const oldSettings = this.cachedSettings || DEFAULT_SETTINGS;
            this.cachedSettings = validatedSettings;

            // Notify listeners of settings change
            this.notifySettingsChange('all', oldSettings, validatedSettings);
            resolve();
          }
        }
      );
    });
  }

  /**
   * Update specific settings section
   */
  async updateSettings<K extends keyof ExtensionSettings>(
    section: K,
    sectionSettings: ExtensionSettings[K]
  ): Promise<void> {
    const currentSettings = await this.getSettings();
    const newSettings: ExtensionSettings = {
      ...currentSettings,
      [section]: sectionSettings,
    };

    await this.saveSettings(newSettings);
    this.notifySettingsChange(
      section as SettingsChangeType,
      currentSettings,
      newSettings
    );
  }

  /**
   * Get current settings (from cache or storage)
   */
  async getSettings(): Promise<ExtensionSettings> {
    if (this.cachedSettings) {
      return this.cachedSettings;
    }
    return this.loadSettings();
  }

  /**
   * Get specific settings section
   */
  async getSettingsSection<K extends keyof ExtensionSettings>(
    section: K
  ): Promise<ExtensionSettings[K]> {
    const settings = await this.getSettings();
    return settings[section];
  }

  /**
   * Reset settings to defaults
   */
  async resetSettings(): Promise<void> {
    await this.saveSettings(DEFAULT_SETTINGS);
  }

  /**
   * Check if a specific command is enabled
   */
  async isCommandEnabled(commandId: string): Promise<boolean> {
    const settings = await this.getSettings();
    const commandSetting = settings.commands[commandId];

    // If command is not in settings, it's enabled by default
    return commandSetting?.enabled ?? true;
  }

  /**
   * Enable or disable a specific command
   */
  async setCommandEnabled(commandId: string, enabled: boolean): Promise<void> {
    const settings = await this.getSettings();
    const newCommands = {
      ...settings.commands,
      [commandId]: { enabled },
    };

    await this.updateSettings('commands', newCommands);
  }

  /**
   * Add settings change listener
   */
  addSettingsChangeListener(listener: SettingsChangeListener): void {
    this.listeners.add(listener);
  }

  /**
   * Remove settings change listener
   */
  removeSettingsChangeListener(listener: SettingsChangeListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Validate settings against schema
   */
  private static validateSettings(
    settings: ExtensionSettings
  ): ExtensionSettings {
    const validatedSettings = { ...settings };

    // Validate appearance settings
    if (
      !SETTINGS_VALIDATION_SCHEMA.appearance.theme.includes(
        settings.appearance.theme
      )
    ) {
      validatedSettings.appearance.theme = DEFAULT_SETTINGS.appearance.theme;
    }

    // Validate command settings - ensure each command has proper structure
    if (validatedSettings.commands) {
      Object.keys(validatedSettings.commands).forEach((commandId) => {
        const commandSetting = validatedSettings.commands[commandId];

        // Ensure command setting has enabled field
        if (!commandSetting || typeof commandSetting.enabled !== 'boolean') {
          validatedSettings.commands[commandId] = { enabled: true };
        }
      });
    } else {
      // If commands section is missing, use defaults
      validatedSettings.commands = DEFAULT_SETTINGS.commands;
    }

    return validatedSettings;
  }

  /**
   * Validate and migrate settings from older versions
   */
  private static validateAndMigrateSettings(
    settings: ExtensionSettings
  ): ExtensionSettings {
    let migratedSettings = { ...settings };

    // Migration logic for version upgrades
    if (!settings.version || settings.version < DEFAULT_SETTINGS.version) {
      // Add any missing fields from default settings
      migratedSettings = {
        ...DEFAULT_SETTINGS,
        ...settings,
        version: DEFAULT_SETTINGS.version,
      };
    }

    return SettingsService.validateSettings(migratedSettings);
  }

  /**
   * Notify all listeners of settings changes
   */
  private notifySettingsChange(
    type: SettingsChangeType,
    oldSettings: ExtensionSettings,
    newSettings: ExtensionSettings
  ): void {
    const event: SettingsChangeEvent = {
      type,
      oldSettings,
      newSettings,
    };

    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error in settings change listener:', error);
      }
    });
  }
}

// Export singleton instance
export const settingsService = new SettingsService();

// Export the class for testing
export { SettingsService };
