import type { ExtensionResponse } from '@/types/extension';

import { BOOKMARK_MESSAGES, BOOKMARK_URLS } from './constants';

/**
 * Open a bookmark in a new tab
 */
export async function openBookmark(url: string): Promise<ExtensionResponse> {
  return new Promise((resolve) => {
    chrome.tabs.create({ url }, () => {
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
 * Remove a bookmark
 */
export async function removeBookmark(
  bookmarkId: string
): Promise<ExtensionResponse> {
  return new Promise((resolve) => {
    chrome.bookmarks.remove(bookmarkId, () => {
      if (chrome.runtime.lastError) {
        resolve({
          success: false,
          error: chrome.runtime.lastError.message,
        });
        return;
      }

      resolve({
        success: true,
        data: { message: BOOKMARK_MESSAGES.BOOKMARK_REMOVED },
      });
    });
  });
}

/**
 * Open the bookmark manager
 */
export async function openBookmarkManager(): Promise<ExtensionResponse> {
  return new Promise((resolve) => {
    chrome.tabs.create({ url: BOOKMARK_URLS.BOOKMARK_MANAGER }, () => {
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
 * Edit a bookmark (currently opens bookmark manager)
 */
export async function editBookmark(): Promise<ExtensionResponse> {
  // For now, we'll open the bookmark manager with the bookmark selected
  // In the future, this could open an inline edit dialog
  return openBookmarkManager();
}

/**
 * Bookmark the current page
 */
export async function bookmarkCurrentPage(): Promise<ExtensionResponse> {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      if (!currentTab || !currentTab.url || !currentTab.title) {
        resolve({
          success: false,
          error: BOOKMARK_MESSAGES.COULD_NOT_GET_TAB,
        });
        return;
      }

      chrome.bookmarks.create(
        {
          title: currentTab.title,
          url: currentTab.url,
        },
        (bookmark) => {
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
              message: BOOKMARK_MESSAGES.BOOKMARKED_PAGE(
                currentTab.title || 'Unknown'
              ),
              bookmarkId: bookmark.id,
            },
          });
        }
      );
    });
  });
}
