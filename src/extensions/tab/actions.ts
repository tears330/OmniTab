import type { ExtensionResponse } from '@/types/extension';

import { TAB_MESSAGES } from './constants';

/**
 * Switch to a specific tab
 */
export async function switchToTab(tabId: number): Promise<ExtensionResponse> {
  return new Promise((resolve) => {
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError) {
        resolve({
          success: false,
          error: chrome.runtime.lastError.message,
        });
        return;
      }

      chrome.tabs.update(tabId, { active: true });
      chrome.windows.update(tab.windowId!, { focused: true });

      resolve({ success: true });
    });
  });
}

/**
 * Close a specific tab
 */
export async function closeTab(tabId: number): Promise<ExtensionResponse> {
  return new Promise((resolve) => {
    chrome.tabs.remove(tabId, () => {
      if (chrome.runtime.lastError) {
        resolve({
          success: false,
          error: chrome.runtime.lastError.message,
        });
        return;
      }

      resolve({ success: true });
    });
  });
}

/**
 * Close all duplicate tabs
 */
export async function closeAllDuplicates(): Promise<ExtensionResponse> {
  return new Promise((resolve) => {
    chrome.tabs.query({}, (tabs) => {
      const urlToTabs = new Map<string, chrome.tabs.Tab[]>();

      // Group tabs by URL
      tabs.forEach((tab) => {
        if (tab.url) {
          const existing = urlToTabs.get(tab.url) || [];
          existing.push(tab);
          urlToTabs.set(tab.url, existing);
        }
      });

      // Find duplicate tabs to close
      const tabsToClose: number[] = [];
      urlToTabs.forEach((tabGroup) => {
        if (tabGroup.length > 1) {
          // Keep the first one (or the active one if any)
          const activeTab = tabGroup.find((t) => t.active);
          const tabToKeep = activeTab || tabGroup[0];

          tabGroup.forEach((tab) => {
            if (tab.id !== tabToKeep.id && tab.id !== undefined) {
              tabsToClose.push(tab.id);
            }
          });
        }
      });

      if (tabsToClose.length === 0) {
        resolve({
          success: true,
          data: { message: TAB_MESSAGES.NO_DUPLICATES_FOUND },
        });
        return;
      }

      // Close duplicate tabs
      chrome.tabs.remove(tabsToClose, () => {
        if (chrome.runtime.lastError) {
          resolve({
            success: false,
            error: chrome.runtime.lastError.message,
          });
          return;
        }

        resolve({
          success: true,
          data: {
            message: TAB_MESSAGES.DUPLICATES_CLOSED(tabsToClose.length),
          },
        });
      });
    });
  });
}

/**
 * Group tabs by domain
 */
export async function groupTabsByDomain(): Promise<ExtensionResponse> {
  // Check if tab groups API is available
  if (!chrome.tabGroups) {
    return {
      success: false,
      error: TAB_MESSAGES.TAB_GROUPS_NOT_SUPPORTED,
    };
  }

  return new Promise((resolve) => {
    chrome.tabs.query({ currentWindow: true }, async (tabs) => {
      const domainToTabs = new Map<string, chrome.tabs.Tab[]>();

      // Group tabs by domain
      tabs.forEach((tab) => {
        if (tab.url) {
          try {
            const url = new URL(tab.url);
            const domain = url.hostname;
            const existing = domainToTabs.get(domain) || [];
            existing.push(tab);
            domainToTabs.set(domain, existing);
          } catch {
            // Invalid URL, skip
          }
        }
      });

      // Create tab groups for domains with multiple tabs
      let groupsCreated = 0;
      // eslint-disable-next-line no-restricted-syntax
      for (const [domain, domainTabs] of domainToTabs) {
        if (domainTabs.length > 1) {
          const tabIds = domainTabs
            .map((t) => t.id)
            .filter((id): id is number => id !== undefined);

          if (tabIds.length > 0) {
            try {
              // eslint-disable-next-line no-await-in-loop
              const groupId = await chrome.tabs.group({ tabIds });
              // eslint-disable-next-line no-await-in-loop
              await chrome.tabGroups.update(groupId, {
                title: domain,
                collapsed: false,
              });
              groupsCreated += 1;
            } catch (error) {
              // Continue with other groups even if one fails
            }
          }
        }
      }

      resolve({
        success: true,
        data: {
          message: TAB_MESSAGES.GROUPS_CREATED(groupsCreated),
        },
      });
    });
  });
}
