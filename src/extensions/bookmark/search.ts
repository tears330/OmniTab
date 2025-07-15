import type { SearchResult } from '@/types/extension';

import { getDomain, getFaviconUrl } from '@/utils/urlUtils';

import {
  BOOKMARK_LIMITS,
  BookmarkActionId,
  BookmarkActionLabel,
  BookmarkActionShortcut,
  BookmarkResultType,
} from './constants';

/**
 * Search browser bookmarks
 */
export async function searchBookmarks(
  query: string
): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
  return new Promise((resolve) => {
    chrome.bookmarks.getTree((bookmarkTreeNodes) => {
      const allBookmarks: chrome.bookmarks.BookmarkTreeNode[] = [];

      const traverseBookmarks = (
        nodes: chrome.bookmarks.BookmarkTreeNode[]
      ) => {
        nodes.forEach((node) => {
          if (node.url) {
            // It's a bookmark (has URL)
            allBookmarks.push(node);
          }

          if (node.children) {
            traverseBookmarks(node.children);
          }
        });
      };

      traverseBookmarks(bookmarkTreeNodes);

      // If there's a query, filter bookmarks
      if (query) {
        const lowerQuery = query.toLowerCase();
        const filtered = allBookmarks.filter(
          (bookmark) =>
            bookmark.title?.toLowerCase().includes(lowerQuery) ||
            bookmark.url?.toLowerCase().includes(lowerQuery)
        );
        resolve(filtered);
      } else {
        // Sort by date added (newest first)
        const sorted = allBookmarks.sort(
          (a, b) => (b.dateAdded || 0) - (a.dateAdded || 0)
        );
        resolve(sorted.slice(0, BOOKMARK_LIMITS.MAX_RECENT_BOOKMARKS));
      }
    });
  });
}

/**
 * Convert a bookmark to a search result
 */
export function bookmarkToSearchResult(
  bookmark: chrome.bookmarks.BookmarkTreeNode
): SearchResult {
  return {
    id: `bookmark-${bookmark.id}`,
    title: bookmark.title || 'Untitled',
    description: getDomain(bookmark.url ?? ''),
    icon: getFaviconUrl(bookmark.url || '', BOOKMARK_LIMITS.FAVICON_SIZE),
    type: BookmarkResultType.BOOKMARK,
    actions: [
      {
        id: BookmarkActionId.OPEN,
        label: BookmarkActionLabel.OPEN_IN_NEW_TAB,
        shortcut: BookmarkActionShortcut.ENTER,
        primary: true,
      },
      {
        id: BookmarkActionId.EDIT,
        label: BookmarkActionLabel.EDIT_BOOKMARK,
        shortcut: BookmarkActionShortcut.CTRL_E,
      },
      {
        id: BookmarkActionId.REMOVE,
        label: BookmarkActionLabel.REMOVE_BOOKMARK,
        shortcut: BookmarkActionShortcut.CTRL_ENTER,
      },
    ],
    metadata: {
      id: bookmark.id,
      url: bookmark.url,
      dateAdded: bookmark.dateAdded,
      parentId: bookmark.parentId,
    },
  };
}
