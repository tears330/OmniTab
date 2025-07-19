import type { ExtensionResponse } from '@/types/extension';

import { ExtensionRegistry } from '@/services/extensionRegistry';

import { CORE_MESSAGES } from './constants';

/**
 * Show help by opening help page
 */
export async function showHelp(): Promise<ExtensionResponse> {
  // In a real implementation, this could open a help page or show a modal
  chrome.tabs.create({ url: chrome.runtime.getURL('help.html') });

  return {
    success: true,
    data: { message: CORE_MESSAGES.HELP_OPENING },
  };
}

/**
 * Reload all extensions
 */
export async function reloadExtensions(): Promise<ExtensionResponse> {
  // This would trigger a reload of all extensions
  // For now, just return success
  return {
    success: true,
    data: { message: CORE_MESSAGES.EXTENSIONS_RELOADED },
  };
}

/**
 * Get all available commands (filtered by settings)
 */
export async function getCommands(): Promise<ExtensionResponse> {
  const registry = ExtensionRegistry.getInstance();
  const commands = await registry.getEnabledCommands();

  return {
    success: true,
    data: { commands },
  };
}

/**
 * Handle search commands action
 */
export async function handleSearchCommands(): Promise<ExtensionResponse> {
  return {
    success: true,
    data: { message: CORE_MESSAGES.SEARCH_COMMANDS_USAGE },
  };
}

/**
 * Open OmniTab settings page
 */
export async function openSettings(): Promise<ExtensionResponse> {
  // Open the options page in a new tab
  chrome.tabs.create({ url: chrome.runtime.getURL('src/options/index.html') });

  return {
    success: true,
    data: { message: CORE_MESSAGES.SETTINGS_OPENING },
  };
}
