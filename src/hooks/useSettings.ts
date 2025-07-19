/**
 * React hook for managing extension settings
 */

import { useCallback, useEffect, useState } from 'react';

import { settingsService } from '@/services/settingsService';
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
        const loadedSettings = await settingsService.loadSettings();
        setSettings(loadedSettings);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();

    // Listen for settings changes
    const handleSettingsChange = () => {
      settingsService.getSettings().then(setSettings);
    };

    settingsService.addSettingsChangeListener(handleSettingsChange);

    return () => {
      settingsService.removeSettingsChangeListener(handleSettingsChange);
    };
  }, []);

  // Appearance settings
  const changeTheme = useCallback(
    async (theme: Theme) => {
      if (!settings) return;

      await settingsService.updateSettings('appearance', { theme });
    },
    [settings]
  );

  // Command settings
  const setCommandEnabled = useCallback(
    async (commandId: string, enabled: boolean) => {
      if (!settings) return;

      await settingsService.setCommandEnabled(commandId, enabled);
    },
    [settings]
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
    await settingsService.resetSettings();
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
