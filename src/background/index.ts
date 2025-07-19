import { ExtensionRegistry } from '@/services/extensionRegistry';
import { settingsManager } from '@/services/settingsManager';

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
  // Initialize settings manager first
  await settingsManager.initialize();

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

// Clean up on unload
if (chrome.runtime.onSuspend) {
  chrome.runtime.onSuspend.addListener(() => {
    registry.destroy();
  });
}

export {};
