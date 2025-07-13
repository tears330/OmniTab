/**
 * Utility functions for handling search result actions
 */
import type { SearchResult } from '@/types';

export interface ActionCallbacks {
  onClose: () => void;
  onTabClosed: (removedIndex: number, totalResults: number) => void;
}

/**
 * Handles tab-specific actions (switch or close)
 */
function handleTabAction(
  result: SearchResult,
  modifierKey: boolean,
  callbacks: ActionCallbacks
): void {
  // Type guard to ensure we have a tab result
  if (result.type !== 'tab') return;

  if (modifierKey) {
    // Close tab (Cmd/Ctrl + Enter)
    chrome.runtime.sendMessage(
      {
        action: 'close-tab',
        tabId: result.id,
      },
      () => {
        // Notify parent component about tab closure
        callbacks.onTabClosed(0, 0); // Index will be handled by parent
      }
    );
  } else {
    // Switch to tab (Enter)
    chrome.runtime.sendMessage(
      {
        action: 'switch-tab',
        tabId: result.id,
        windowId: result.windowId,
      },
      () => {
        callbacks.onClose();
      }
    );
  }
}

/**
 * Handles history item actions (open in new tab)
 */
function handleHistoryAction(
  result: SearchResult,
  callbacks: ActionCallbacks
): void {
  chrome.runtime.sendMessage(
    {
      action: 'open-url',
      url: result.url,
    },
    () => {
      callbacks.onClose();
    }
  );
}

/**
 * Handles bookmark actions (open in new tab)
 */
function handleBookmarkAction(
  result: SearchResult,
  callbacks: ActionCallbacks
): void {
  chrome.runtime.sendMessage(
    {
      action: 'open-url',
      url: result.url,
    },
    () => {
      callbacks.onClose();
    }
  );
}

/**
 * Executes the appropriate action based on result type and modifier keys
 */
export function executeResultAction(
  result: SearchResult,
  callbacks: ActionCallbacks,
  modifierKey: boolean = false
): void {
  switch (result.type) {
    case 'tab':
      handleTabAction(result, modifierKey, callbacks);
      break;
    case 'history':
      handleHistoryAction(result, callbacks);
      break;
    case 'bookmark':
      handleBookmarkAction(result, callbacks);
      break;
    default:
      // Fallback for unknown types
      break;
  }
}

/**
 * Gets the appropriate action label for a result type
 */
export function getActionLabel(
  resultType: SearchResult['type'],
  isModifier: boolean = false
): string {
  switch (resultType) {
    case 'tab':
      return isModifier ? 'Close' : 'Switch';
    case 'history':
    case 'bookmark':
      return 'Open';
    default:
      return 'Select';
  }
}

/**
 * Gets the keyboard shortcut for a result type
 */
export function getActionShortcut(
  resultType: SearchResult['type'],
  isModifier: boolean = false
): string {
  switch (resultType) {
    case 'tab':
      return isModifier ? '⌘↵' : '↵';
    case 'history':
    case 'bookmark':
      return '↵';
    default:
      return '↵';
  }
}
