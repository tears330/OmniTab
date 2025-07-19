/**
 * Settings manager for applying settings changes across the extension
 */

import { ExtensionSettings, SettingsChangeEvent } from '@/types/settings';

import { settingsService } from './settingsService';

/**
 * Settings manager class that handles applying settings changes
 */
class SettingsManager {
  private initialized = false;

  /**
   * Initialize the settings manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Load initial settings
    const settings = await settingsService.loadSettings();
    await this.applySettings(settings);

    // Listen for settings changes
    settingsService.addSettingsChangeListener((event) => {
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
        SettingsManager.notifyCommandChanges(event);
        break;
      case 'all':
        this.applySettings(event.newSettings);
        break;
      default:
        // Handle any unknown event types silently
        break;
    }
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
   * Get current theme with system preference resolved
   */
  static async getCurrentTheme(): Promise<'light' | 'dark'> {
    const settings = await settingsService.getSettings();
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
   * Check if a command is enabled
   */
  static async isCommandEnabled(commandId: string): Promise<boolean> {
    return settingsService.isCommandEnabled(commandId);
  }
}

// Export singleton instance
export const settingsManager = new SettingsManager();

// Export the class for testing
export { SettingsManager };
