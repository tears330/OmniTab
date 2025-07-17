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
      let results: chrome.tabs.Tab[];

      if (!query) {
        // Return all tabs if no query
        results = tabs;
      } else {
        // Simple filtering - the fuzzy search will be handled by the view layer
        const lowerQuery = query.toLowerCase();
        results = tabs.filter(
          (tab) =>
            tab.title?.toLowerCase().includes(lowerQuery) ||
            tab.url?.toLowerCase().includes(lowerQuery)
        );
      }

      // Find the active tab and move it to the front
      const activeTabIndex = results.findIndex((tab) => tab.active);
      if (activeTabIndex > 0) {
        const activeTab = results[activeTabIndex];
        results.splice(activeTabIndex, 1);
        results.unshift(activeTab);
      }

      resolve(results);
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
        shortcut: TabActionShortcut.CLOSE,
      },
      {
        id: TabActionId.MUTE,
        label: tab.mutedInfo?.muted
          ? TabActionLabel.UNMUTE_TAB
          : TabActionLabel.MUTE_TAB,
        shortcut: TabActionShortcut.MUTE,
      },
      {
        id: TabActionId.PIN,
        label: tab.pinned ? TabActionLabel.UNPIN_TAB : TabActionLabel.PIN_TAB,
        shortcut: TabActionShortcut.PIN,
      },
      {
        id: TabActionId.CLOSE_OTHERS,
        label: TabActionLabel.CLOSE_OTHER_TABS,
        shortcut: TabActionShortcut.CLOSE_OTHERS,
      },
      {
        id: TabActionId.CLOSE_GROUP,
        label: TabActionLabel.CLOSE_GROUP,
        shortcut: TabActionShortcut.CLOSE_GROUP,
      },
      {
        id: TabActionId.CLOSE_OTHER_GROUPS,
        label: TabActionLabel.CLOSE_OTHER_GROUPS,
        shortcut: TabActionShortcut.CLOSE_OTHER_GROUPS,
      },
      {
        id: TabActionId.BOOKMARK,
        label: TabActionLabel.BOOKMARK_TAB,
        shortcut: TabActionShortcut.BOOKMARK,
      },
    ],
    metadata: {
      windowId: tab.windowId,
      active: tab.active,
      pinned: tab.pinned,
      audible: tab.audible,
      incognito: tab.incognito,
      url: tab.url,
      muted: Boolean(tab.mutedInfo?.muted),
    },
  };
}
