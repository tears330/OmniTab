/**
 * Settings schema and types for OmniTab extension
 */

export type Theme = 'light' | 'dark' | 'system';

/**
 * Appearance settings for the extension
 */
export interface AppearanceSettings {
  /** Theme preference */
  theme: Theme;
}

/**
 * Individual command setting
 */
export interface CommandSetting {
  /** Whether the command is enabled */
  enabled: boolean;
}

/**
 * Command settings - key-value object where key is command ID
 */
export interface CommandSettings {
  [commandId: string]: CommandSetting;
}

/**
 * Complete settings schema
 */
export interface ExtensionSettings {
  appearance: AppearanceSettings;
  commands: CommandSettings;
  /** Settings schema version for migration */
  version: number;
}

/**
 * Default settings configuration
 */
export const DEFAULT_SETTINGS: ExtensionSettings = {
  appearance: {
    theme: 'system',
  },
  commands: {
    // Tab extension commands
    'tab:search': { enabled: true },
    'tab:switch': { enabled: true },
    'tab:close': { enabled: true },
    'tab:duplicate': { enabled: true },
    // History extension commands
    'history:search': { enabled: true },
    'history:open': { enabled: true },
    // Bookmark extension commands
    'bookmark:search': { enabled: true },
    'bookmark:open': { enabled: true },
    // TopSites extension commands
    'topsites:search': { enabled: true },
    'topsites:open': { enabled: true },
    // Core extension commands
    'core:help': { enabled: true },
    'core:reload': { enabled: true },
  },
  version: 1,
};

/**
 * Settings storage keys
 */
export const SETTINGS_STORAGE_KEY = 'omnitab_settings';

/**
 * Settings change event types
 */
export type SettingsChangeType = 'appearance' | 'commands' | 'all';

export interface SettingsChangeEvent {
  type: SettingsChangeType;
  oldSettings: ExtensionSettings;
  newSettings: ExtensionSettings;
}

/**
 * Settings validation schema
 */
export interface SettingsValidationSchema {
  appearance: {
    theme: Theme[];
  };
  commands: {
    [key: string]: {
      enabled: boolean;
    };
  };
}

export const SETTINGS_VALIDATION_SCHEMA: SettingsValidationSchema = {
  appearance: {
    theme: ['light', 'dark', 'system'],
  },
  commands: {
    // Validation for any command - must have enabled boolean field
    default: {
      enabled: true,
    },
  },
};
