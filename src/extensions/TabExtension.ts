import type {
  ActionPayload,
  Command,
  ExtensionResponse,
  SearchPayload,
  SearchResponse,
  SearchResult,
} from '@/types/extension';

import { BaseExtension } from '@/services/extensionRegistry';
import {
  getDomain,
  getExtensionIconUrl,
  getFaviconUrl,
} from '@/utils/urlUtils';

class TabExtension extends BaseExtension {
  id = 'tab';

  name = 'Tab Manager';

  description = 'Search, switch, and manage browser tabs';

  icon = getExtensionIconUrl('public/tab_icon.png');

  commands: Command[] = [
    {
      id: 'search',
      name: 'Search Tabs',
      description: 'Search through open browser tabs',
      alias: ['t', 'tab', 'tabs'],
      type: 'search',
      placeholder: 'Search tabs...',
    },
    {
      id: 'close-all-duplicates',
      name: 'Close Duplicate Tabs',
      description: 'Close all duplicate tabs keeping only one instance',
      alias: ['dup', 'duplicates'],
      type: 'action',
    },
    {
      id: 'group-by-domain',
      name: 'Group Tabs by Domain',
      description: 'Group tabs by their domain',
      alias: ['group', 'gd'],
      type: 'action',
    },
  ];

  async handleSearch(
    commandId: string,
    payload: SearchPayload
  ): Promise<SearchResponse> {
    if (commandId !== 'search') {
      return {
        success: false,
        error: `Unknown command: ${commandId}`,
      };
    }

    try {
      const tabs = await this.searchTabs(payload.query);
      const results = tabs.map(this.tabToSearchResult.bind(this));

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search tabs',
      };
    }
  }

  async handleAction(
    commandId: string,
    payload: ActionPayload
  ): Promise<ExtensionResponse> {
    try {
      switch (commandId) {
        case 'close-all-duplicates':
          return await this.closeAllDuplicates();

        case 'group-by-domain':
          return await this.groupTabsByDomain();

        default:
          // Handle tab-specific actions (switch, close)
          if (payload.actionId === 'switch' && payload.resultId) {
            // Extract tab ID from result ID (format: "tab-123")
            const tabId = parseInt(payload.resultId.replace('tab-', ''), 10);
            return await this.switchToTab(tabId);
          }
          if (payload.actionId === 'close' && payload.resultId) {
            // Extract tab ID from result ID (format: "tab-123")
            const tabId = parseInt(payload.resultId.replace('tab-', ''), 10);
            return await this.closeTab(tabId);
          }

          return {
            success: false,
            error: `Unknown action: ${commandId} - ${payload.actionId}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Action failed',
      };
    }
  }

  // eslint-disable-next-line class-methods-use-this
  private async searchTabs(query: string): Promise<chrome.tabs.Tab[]> {
    return new Promise((resolve) => {
      chrome.tabs.query({}, (tabs) => {
        if (!query) {
          // Return all tabs if no query
          resolve(tabs);
          return;
        }

        // Simple filtering - the fuzzy search will be handled by the view layer
        const lowerQuery = query.toLowerCase();
        const filtered = tabs.filter(
          (tab) =>
            tab.title?.toLowerCase().includes(lowerQuery) ||
            tab.url?.toLowerCase().includes(lowerQuery)
        );

        resolve(filtered);
      });
    });
  }

  // eslint-disable-next-line class-methods-use-this
  private tabToSearchResult(tab: chrome.tabs.Tab): SearchResult {
    return {
      id: `tab-${tab.id}`,
      title: tab.title ?? 'Untitled',
      description: getDomain(tab.url ?? ''),
      icon: getFaviconUrl(tab.url ?? ''),
      type: 'tab',
      actions: [
        {
          id: 'switch',
          label: 'Switch to Tab',
          shortcut: 'Enter',
          primary: true,
        },
        {
          id: 'close',
          label: 'Close Tab',
          shortcut: 'Ctrl+Enter',
        },
      ],
      metadata: {
        windowId: tab.windowId,
        active: tab.active,
        pinned: tab.pinned,
        audible: tab.audible,
        incognito: tab.incognito,
        url: tab.url,
      },
    };
  }

  // eslint-disable-next-line class-methods-use-this
  private async switchToTab(tabId: number): Promise<ExtensionResponse> {
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

  // eslint-disable-next-line class-methods-use-this
  private async closeTab(tabId: number): Promise<ExtensionResponse> {
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

  // eslint-disable-next-line class-methods-use-this
  private async closeAllDuplicates(): Promise<ExtensionResponse> {
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
            data: { message: 'No duplicate tabs found' },
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
              message: `Closed ${tabsToClose.length} duplicate tab${tabsToClose.length > 1 ? 's' : ''}`,
            },
          });
        });
      });
    });
  }

  // eslint-disable-next-line class-methods-use-this
  private async groupTabsByDomain(): Promise<ExtensionResponse> {
    // Check if tab groups API is available
    if (!chrome.tabGroups) {
      return {
        success: false,
        error: 'Tab groups are not supported in this browser',
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
            message: `Created ${groupsCreated} tab group${groupsCreated !== 1 ? 's' : ''}`,
          },
        });
      });
    });
  }
}

export default TabExtension;
