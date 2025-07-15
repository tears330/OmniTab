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

class BookmarkExtension extends BaseExtension {
  id = 'bookmark';

  name = 'Bookmark Manager';

  description = 'Search and manage browser bookmarks';

  icon = getExtensionIconUrl('public/bookmark_icon.png');

  commands: Command[] = [
    {
      id: 'search',
      name: 'Search Bookmarks',
      description: 'Search through browser bookmarks',
      alias: ['b', 'bookmark', 'bookmarks'],
      type: 'search',
      placeholder: 'Search bookmarks...',
    },
    {
      id: 'add-current',
      name: 'Bookmark Current Page',
      description: 'Add the current page to bookmarks',
      alias: ['bc', 'bookmarkcurrent'],
      type: 'action',
    },
    {
      id: 'organize',
      name: 'Organize Bookmarks',
      description: 'Open bookmark manager',
      alias: ['bo', 'bookmarkorganize'],
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
      const bookmarks = await this.searchBookmarks(payload.query);
      const results = bookmarks.map(this.bookmarkToSearchResult.bind(this));

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to search bookmarks',
      };
    }
  }

  async handleAction(
    commandId: string,
    payload: ActionPayload
  ): Promise<ExtensionResponse> {
    try {
      switch (commandId) {
        case 'add-current':
          return await this.bookmarkCurrentPage();

        case 'organize':
          return await this.openBookmarkManager();

        default:
          // Handle bookmark-specific actions (open, edit, remove)
          if (payload.actionId === 'open' && payload.metadata?.url) {
            return await this.openBookmark(payload.metadata.url as string);
          }
          if (payload.actionId === 'remove' && payload.metadata?.id) {
            return await this.removeBookmark(payload.metadata.id as string);
          }
          if (payload.actionId === 'edit' && payload.metadata?.id) {
            return await this.editBookmark(payload.metadata.id as string);
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
  private async searchBookmarks(
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
          resolve(sorted.slice(0, 50)); // Limit to 50 most recent
        }
      });
    });
  }

  // eslint-disable-next-line class-methods-use-this
  private bookmarkToSearchResult(
    bookmark: chrome.bookmarks.BookmarkTreeNode
  ): SearchResult {
    return {
      id: `bookmark-${bookmark.id}`,
      title: bookmark.title || 'Untitled',
      description: getDomain(bookmark.url ?? ''),
      icon: getFaviconUrl(bookmark.url || '', 16),
      type: 'bookmark',
      actions: [
        {
          id: 'open',
          label: 'Open in New Tab',
          shortcut: 'Enter',
          primary: true,
        },
        {
          id: 'edit',
          label: 'Edit Bookmark',
          shortcut: 'Ctrl+E',
        },
        {
          id: 'remove',
          label: 'Remove Bookmark',
          shortcut: 'Ctrl+Enter',
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

  // eslint-disable-next-line class-methods-use-this
  private async openBookmark(url: string): Promise<ExtensionResponse> {
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

  // eslint-disable-next-line class-methods-use-this
  private async removeBookmark(bookmarkId: string): Promise<ExtensionResponse> {
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
          data: { message: 'Bookmark removed' },
        });
      });
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async editBookmark(_bookmarkId: string): Promise<ExtensionResponse> {
    // For now, we'll open the bookmark manager with the bookmark selected
    // In the future, this could open an inline edit dialog
    return this.openBookmarkManager();
  }

  // eslint-disable-next-line class-methods-use-this
  private async bookmarkCurrentPage(): Promise<ExtensionResponse> {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        if (!currentTab || !currentTab.url || !currentTab.title) {
          resolve({
            success: false,
            error: 'Could not get current tab information',
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
                message: `Bookmarked: ${currentTab.title}`,
                bookmarkId: bookmark.id,
              },
            });
          }
        );
      });
    });
  }

  // eslint-disable-next-line class-methods-use-this
  private async openBookmarkManager(): Promise<ExtensionResponse> {
    return new Promise((resolve) => {
      chrome.tabs.create({ url: 'chrome://bookmarks/' }, () => {
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
  async initialize(): Promise<void> {
    // Listen for bookmark changes to update cache if needed
    chrome.bookmarks.onCreated.addListener(() => {
      // Could implement cache invalidation here
    });

    chrome.bookmarks.onRemoved.addListener(() => {
      // Could implement cache invalidation here
    });

    chrome.bookmarks.onChanged.addListener(() => {
      // Could implement cache invalidation here
    });
  }

  // eslint-disable-next-line class-methods-use-this
  async destroy(): Promise<void> {
    // Remove listeners if needed
  }
}

export default BookmarkExtension;
