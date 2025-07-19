import { ExtensionRegistry } from '@/services/extensionRegistry';
import { settingsService } from '@/services/settingsService';

import {
  BookmarkExtension,
  CoreExtension,
  HistoryExtension,
  TabExtension,
  TopSitesExtension,
} from '../extensions';

// Initialize extension registry
const registry = ExtensionRegistry.getInstance();

// Register all extensions
async function initializeExtensions() {
  try {
    // Register core extension first
    await registry.registerExtension(new CoreExtension());

    // Register feature extensions
    await registry.registerExtension(new TabExtension());
    await registry.registerExtension(new HistoryExtension());
    await registry.registerExtension(new BookmarkExtension());
    await registry.registerExtension(new TopSitesExtension());

    // All extensions registered successfully
  } catch (error) {
    // Failed to initialize extensions
  }
}

// Initialize on startup
async function initialize() {
  // Initialize settings service first
  await settingsService.initialize();

  // Then initialize extensions
  await initializeExtensions();
}

initialize();

// Listen for keyboard command
chrome.commands.onCommand.addListener((command) => {
  if (command === '_execute_action') {
    // Send message to content script to show the search overlay
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'toggle-omnitab' });
      }
    });
  }
});

// Also listen for action clicks (when user clicks the extension icon)
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { action: 'toggle-omnitab' });
  }
});

// Listen for messages from options page
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    try {
      if (message.action === 'get-all-commands') {
        // Get all commands from the registry
        const allCommands = registry.getAllCommands();
        sendResponse({
          success: true,
          data: { commands: allCommands },
        });
      } else if (message.action === 'settings-commands-updated') {
        // Refresh the extension registry's enabled commands cache
        // This ensures the background script uses the latest command settings
        await registry.refreshEnabledCommands();
        sendResponse({ success: true });
      } else if (message.action === 'settings-get') {
        // Get current settings
        const settings = await settingsService.getSettings();
        sendResponse({
          success: true,
          data: settings,
        });
      } else if (message.action === 'settings-update') {
        // Update specific settings section
        await settingsService.updateSettings(message.section, message.settings);
        sendResponse({ success: true });
      } else if (message.action === 'settings-set-command-enabled') {
        // Set command enabled state
        await settingsService.setCommandEnabled(
          message.commandId,
          message.enabled
        );
        sendResponse({ success: true });
      } else if (message.action === 'settings-is-command-enabled') {
        // Check if command is enabled
        const isEnabled = await settingsService.isCommandEnabled(
          message.commandId
        );
        sendResponse({
          success: true,
          data: isEnabled,
        });
      } else if (message.action === 'settings-reset') {
        // Reset settings to defaults
        await settingsService.resetSettings();
        sendResponse({ success: true });
      } else {
        sendResponse({
          success: false,
          error: 'Unknown action',
        });
      }
    } catch (error) {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  })();

  // Return true to indicate we will send a response asynchronously
  return true;
});

// Clean up on unload
if (chrome.runtime.onSuspend) {
  chrome.runtime.onSuspend.addListener(() => {
    registry.destroy();
  });
}

export {};
