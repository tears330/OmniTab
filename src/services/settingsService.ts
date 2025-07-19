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

  private initialized = false;

  /**
   * Initialize the settings service
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Load initial settings
    const settings = await this.loadSettings();
    await this.applySettings(settings);

    // Listen for settings changes
    this.addSettingsChangeListener((event) => {
      this.handleSettingsChange(event);
    });

    // Listen for storage changes from other tabs/windows
    if (
      typeof chrome !== 'undefined' &&
      chrome.storage &&
      chrome.storage.onChanged
    ) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'sync' && changes.omnitab_settings) {
          const newSettings = changes.omnitab_settings
            .newValue as ExtensionSettings;
          if (newSettings) {
            this.applySettings(newSettings);
          }
        }
      });
    }

    this.initialized = true;
  }

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
   * Force refresh the settings cache from storage
   * This should be called when settings are updated from another context
   */
  async refreshCache(): Promise<void> {
    this.cachedSettings = null;
    await this.loadSettings();
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
   * Apply all settings
   */
  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  private async applySettings(_settings: ExtensionSettings): Promise<void> {
    // Apply command settings (will be used by extension registry)
    // Command settings are handled by the extension registry when checking if commands are enabled
  }

  /**
   * Handle settings change events
   */
  private handleSettingsChange(event: SettingsChangeEvent): void {
    switch (event.type) {
      case 'commands':
        // Notify extension registry of command changes
        SettingsService.notifyCommandChanges(event);
        break;
      case 'all':
        this.applySettings(event.newSettings);
        break;
      default:
        // Handle any unknown event types silently
        break;
    }

    // Broadcast settings changes to all frontend contexts
    this.broadcastSettingsChange(event.newSettings);
  }

  /**
   * Notify extension registry about command changes
   */
  private static notifyCommandChanges(event: SettingsChangeEvent): void {
    // Send message to background script to update command availability
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        action: 'settings-commands-updated',
        oldCommands: event.oldSettings.commands,
        newCommands: event.newSettings.commands,
      });
    }
  }

  /**
   * Broadcast settings changes to all frontend contexts
   */
  // eslint-disable-next-line class-methods-use-this
  private broadcastSettingsChange(settings: ExtensionSettings): void {
    // Send message to all tabs/contexts about settings change
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id) {
            chrome.tabs.sendMessage(
              tab.id,
              {
                action: 'settings-changed',
                settings,
              },
              () => {
                // Ignore errors for tabs that don't have content scripts
                if (chrome.runtime.lastError) {
                  // Silent error handling
                }
              }
            );
          }
        });
      });
    }
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

  /**
   * Get current theme with system preference resolved
   */
  static async getCurrentTheme(): Promise<'light' | 'dark'> {
    // Create a temporary instance to avoid circular reference
    const tempService = new SettingsService();
    const settings = await tempService.getSettings();
    const { theme } = settings.appearance;

    if (theme === 'system') {
      // Check if we're in a DOM context
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      }
      // Default to light in service worker context
      return 'light';
    }

    return theme;
  }

  /**
   * Check if a command is enabled (static method)
   */
  static async isCommandEnabled(commandId: string): Promise<boolean> {
    // Create a temporary instance to avoid circular reference
    const tempService = new SettingsService();
    return tempService.isCommandEnabled(commandId);
  }
}

// Export singleton instance
export const settingsService = new SettingsService();

// Export alias for backward compatibility with settingsManager
export const settingsManager = settingsService;

// Export the class for testing
export { SettingsService };
