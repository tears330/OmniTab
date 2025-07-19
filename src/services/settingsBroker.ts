/**
 * Settings broker for frontend-to-service-worker communication
 * All settings operations in the frontend should go through this broker
 */

import type { ExtensionSettings, Theme } from '@/types/settings';

export interface SettingsResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Frontend settings broker that communicates with service worker
 */
class SettingsBroker {
  /**
   * Get all settings from service worker
   */
  async getSettings(): Promise<ExtensionSettings> {
    const response = await this.sendMessage<ExtensionSettings>({
      action: 'settings-get',
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to get settings');
  }

  /**
   * Update specific settings section
   */
  async updateSettings<K extends keyof ExtensionSettings>(
    section: K,
    sectionSettings: ExtensionSettings[K]
  ): Promise<void> {
    const response = await this.sendMessage({
      action: 'settings-update',
      section,
      settings: sectionSettings,
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to update settings');
    }
  }

  /**
   * Update theme setting
   */
  async updateTheme(theme: Theme): Promise<void> {
    await this.updateSettings('appearance', { theme });
  }

  /**
   * Set command enabled state
   */
  async setCommandEnabled(commandId: string, enabled: boolean): Promise<void> {
    const response = await this.sendMessage({
      action: 'settings-set-command-enabled',
      commandId,
      enabled,
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to set command enabled state');
    }
  }

  /**
   * Check if command is enabled
   */
  async isCommandEnabled(commandId: string): Promise<boolean> {
    const response = await this.sendMessage<boolean>({
      action: 'settings-is-command-enabled',
      commandId,
    });

    if (response.success && response.data !== undefined) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to check command enabled state');
  }

  /**
   * Reset settings to defaults
   */
  async resetSettings(): Promise<void> {
    const response = await this.sendMessage({
      action: 'settings-reset',
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to reset settings');
    }
  }

  /**
   * Listen for settings changes from service worker
   */
  // eslint-disable-next-line class-methods-use-this
  addSettingsChangeListener(
    listener: (settings: ExtensionSettings) => void
  ): void {
    const handleMessage = (message: {
      action: string;
      settings: ExtensionSettings;
    }) => {
      if (message.action === 'settings-changed') {
        listener(message.settings);
      }
    };

    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener(handleMessage);
    }
  }

  /**
   * Remove settings change listener
   */
  // eslint-disable-next-line class-methods-use-this
  removeSettingsChangeListener(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _listener: (settings: ExtensionSettings) => void
  ): void {
    // Note: Chrome doesn't provide a way to remove specific listeners
    // This is a limitation of the Chrome extension API
    // In practice, we'll manage this in the useSettings hook
  }

  /**
   * Send message to service worker and wait for response
   */
  // eslint-disable-next-line class-methods-use-this
  private async sendMessage<T = unknown>(
    message: Record<string, unknown>
  ): Promise<SettingsResponse<T>> {
    return new Promise((resolve) => {
      if (typeof chrome === 'undefined' || !chrome.runtime) {
        resolve({
          success: false,
          error: 'Chrome runtime not available',
        });
        return;
      }

      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          resolve({
            success: false,
            error: chrome.runtime.lastError.message,
          });
        } else {
          resolve(
            response || { success: false, error: 'No response received' }
          );
        }
      });
    });
  }
}

// Export singleton instance
export const settingsBroker = new SettingsBroker();

// Export the class for testing
export { SettingsBroker };
