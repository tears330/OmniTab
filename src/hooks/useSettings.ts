/**
 * React hook for managing extension settings
 */

import { useCallback, useEffect, useState } from 'react';

import { settingsBroker } from '@/services/settingsBroker';
import { ExtensionSettings, Theme } from '@/types/settings';

/**
 * Hook for managing extension settings
 */
export default function useSettings() {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load initial settings
    const loadSettings = async () => {
      try {
        const loadedSettings = await settingsBroker.getSettings();
        setSettings(loadedSettings);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();

    // Listen for settings changes
    const handleSettingsChange = (newSettings: ExtensionSettings) => {
      setSettings(newSettings);
    };

    settingsBroker.addSettingsChangeListener(handleSettingsChange);

    return () => {
      settingsBroker.removeSettingsChangeListener(handleSettingsChange);
    };
  }, []);

  // Appearance settings
  const changeTheme = useCallback(async (theme: Theme) => {
    try {
      await settingsBroker.updateTheme(theme);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to change theme:', error);
    }
  }, []);

  // Command settings
  const setCommandEnabled = useCallback(
    async (commandId: string, enabled: boolean) => {
      try {
        await settingsBroker.setCommandEnabled(commandId, enabled);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to set command enabled:', error);
      }
    },
    []
  );

  const isCommandEnabled = useCallback(
    (commandId: string): boolean => {
      if (!settings) return true; // Default to enabled

      return settings.commands[commandId]?.enabled ?? true;
    },
    [settings]
  );

  // Reset settings
  const resetSettings = useCallback(async () => {
    try {
      await settingsBroker.resetSettings();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to reset settings:', error);
    }
  }, []);

  return {
    settings,
    loading,
    // Appearance
    theme: settings?.appearance.theme ?? 'system',
    changeTheme,
    // Commands
    commands: settings?.commands ?? {},
    setCommandEnabled,
    isCommandEnabled,
    // Actions
    resetSettings,
  };
}
