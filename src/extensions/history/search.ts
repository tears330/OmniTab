import type { SearchResult } from '@/types/extension';

import { getDomain, getFaviconUrl } from '@/utils/urlUtils';

import {
  HISTORY_LIMITS,
  HistoryActionId,
  HistoryActionLabel,
  HistoryActionShortcut,
  HistoryResultType,
} from './constants';

/**
 * Search browser history
 */
export async function searchHistory(
  query: string
): Promise<chrome.history.HistoryItem[]> {
  return new Promise((resolve) => {
    const historyQuery = query || '';
    const maxResults = historyQuery
      ? HISTORY_LIMITS.MAX_RESULTS_WITH_QUERY
      : HISTORY_LIMITS.MAX_RESULTS_WITHOUT_QUERY;

    const searchOptions: chrome.history.HistoryQuery = {
      text: historyQuery,
      maxResults,
    };

    // If no search term, limit to recent history
    if (!historyQuery) {
      searchOptions.startTime =
        Date.now() - HISTORY_LIMITS.RECENT_HISTORY_DAYS * 24 * 60 * 60 * 1000;
    }

    chrome.history.search(searchOptions, (historyItems) => {
      resolve(historyItems);
    });
  });
}

/**
 * Convert a history item to a search result
 */
export function historyItemToSearchResult(
  item: chrome.history.HistoryItem
): SearchResult {
  return {
    id: `history-${item.id}`,
    title: item.title || 'Untitled',
    description: getDomain(item.url ?? ''),
    icon: getFaviconUrl(item.url ?? ''),
    type: HistoryResultType.HISTORY,
    actions: [
      {
        id: HistoryActionId.OPEN,
        label: HistoryActionLabel.OPEN_IN_NEW_TAB,
        shortcut: HistoryActionShortcut.ENTER,
        primary: true,
      },
      {
        id: HistoryActionId.REMOVE,
        label: HistoryActionLabel.REMOVE_FROM_HISTORY,
        shortcut: HistoryActionShortcut.REMOVE,
      },
    ],
    metadata: {
      url: item.url,
      visitCount: item.visitCount,
      lastVisitTime: item.lastVisitTime,
    },
  };
}
