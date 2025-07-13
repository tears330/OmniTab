import type {
  BackgroundMessage,
  BookmarkSearchResult,
  HistorySearchResult,
  SearchResult,
  TabSearchResult,
} from '@/types';

import { fuzzySearchResults, parseSearchQuery } from '@/utils/fuzzySearch';

// Helper function to get favicon URL using only the site's own resources
function getFaviconUrl(url: string): string {
  try {
    const { origin } = new URL(url);
    // Use the site's own favicon.ico - most common location
    return `${origin}/favicon.ico`;
  } catch {
    // For invalid URLs, return our default icon
    return chrome.runtime.getURL('icon16.png');
  }
}

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

// Listen for messages from content script
chrome.runtime.onMessage.addListener(
  (request: BackgroundMessage, _sender, sendResponse) => {
    if (request.action === 'search-tabs') {
      const query = parseSearchQuery(request.searchTerm);

      // Perform searches in parallel
      Promise.all([
        // Search tabs
        new Promise<TabSearchResult[]>((resolve) => {
          chrome.tabs.query({}, (tabs) => {
            const results: TabSearchResult[] = tabs.map((tab) => ({
              id: tab.id!,
              title: tab.title || 'Untitled',
              url: tab.url || '',
              favIconUrl: tab.favIconUrl || '',
              windowId: tab.windowId!,
              type: 'tab' as const,
            }));
            resolve(results);
          });
        }),

        // Search history
        new Promise<HistorySearchResult[]>((resolve) => {
          const historyQuery = query.term || '';
          const maxResults = historyQuery ? 50 : 20;
          const searchOptions: chrome.history.HistoryQuery = {
            text: historyQuery,
            maxResults,
          };

          // If no search term, limit to recent history
          if (!historyQuery) {
            searchOptions.startTime = Date.now() - 7 * 24 * 60 * 60 * 1000; // Last 7 days
          }

          chrome.history.search(searchOptions, (historyItems) => {
            const results: HistorySearchResult[] = historyItems.map((item) => ({
              id: `history-${item.id}`,
              title: item.title || 'Untitled',
              url: item.url || '',
              favIconUrl: getFaviconUrl(item.url || ''),
              type: 'history' as const,
              visitCount: item.visitCount,
              lastVisitTime: item.lastVisitTime,
            }));
            resolve(results);
          });
        }),

        // Search bookmarks
        new Promise<BookmarkSearchResult[]>((resolve) => {
          chrome.bookmarks.getTree((bookmarkTreeNodes) => {
            const allBookmarks: BookmarkSearchResult[] = [];

            const traverseBookmarks = (
              nodes: chrome.bookmarks.BookmarkTreeNode[]
            ) => {
              nodes.forEach((node) => {
                if (node.url) {
                  // It's a bookmark (has URL)
                  const bookmark: BookmarkSearchResult = {
                    id: `bookmark-${node.id}`,
                    title: node.title || 'Untitled',
                    url: node.url,
                    favIconUrl: getFaviconUrl(node.url),
                    type: 'bookmark' as const,
                    dateAdded: node.dateAdded,
                  };

                  allBookmarks.push(bookmark);
                }

                if (node.children) {
                  traverseBookmarks(node.children);
                }
              });
            };

            traverseBookmarks(bookmarkTreeNodes);

            // Sort by date added (newest first) but don't filter here - let fuzzy search handle it
            const sortedBookmarks = allBookmarks.sort(
              (a, b) => (b.dateAdded || 0) - (a.dateAdded || 0)
            );

            resolve(sortedBookmarks);
          });
        }),
      ])
        .then(([tabs, history, bookmarks]) => {
          // Combine all results
          const allResults: SearchResult[] = [
            ...tabs,
            ...history,
            ...bookmarks,
          ];

          // Apply fuzzy search with intelligent ranking
          const searchResults = fuzzySearchResults(allResults, query, 50);

          sendResponse({ results: searchResults } as const);
        })
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.error('Search error:', error);
          sendResponse({ results: [] } as const);
        });

      return true; // Keep message channel open for async response
    }

    if (request.action === 'switch-tab') {
      // Switch to the selected tab
      chrome.tabs.update(request.tabId, { active: true });
      chrome.windows.update(request.windowId, { focused: true });
      sendResponse({ success: true });
      return true;
    }

    if (request.action === 'open-url') {
      // Open URL in new tab (for history and bookmarks)
      chrome.tabs.create({ url: request.url }, () => {
        sendResponse({ success: true });
      });
      return true;
    }

    if (request.action === 'close-tab') {
      // Close the selected tab
      chrome.tabs.remove(request.tabId, () => {
        sendResponse({ success: true });
      });
      return true;
    }

    return false; // Return false for unhandled messages
  }
);

export {};
