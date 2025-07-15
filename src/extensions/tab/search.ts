import type { SearchResult } from '@/types/extension';

import { getDomain, getFaviconUrl } from '@/utils/urlUtils';

import {
  TabActionId,
  TabActionLabel,
  TabActionShortcut,
  TabResultType,
} from './constants';

/**
 * Search for tabs matching the query
 */
export async function searchTabs(query: string): Promise<chrome.tabs.Tab[]> {
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

/**
 * Convert a Chrome tab to a search result
 */
export function tabToSearchResult(tab: chrome.tabs.Tab): SearchResult {
  return {
    id: `tab-${tab.id}`,
    title: tab.title ?? 'Untitled',
    description: getDomain(tab.url ?? ''),
    icon: getFaviconUrl(tab.url ?? ''),
    type: TabResultType.TAB,
    actions: [
      {
        id: TabActionId.SWITCH,
        label: TabActionLabel.SWITCH_TO_TAB,
        shortcut: TabActionShortcut.ENTER,
        primary: true,
      },
      {
        id: TabActionId.CLOSE,
        label: TabActionLabel.CLOSE_TAB,
        shortcut: TabActionShortcut.CTRL_ENTER,
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
