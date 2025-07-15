import type {
  ActionPayload,
  Command,
  ExtensionResponse,
  SearchPayload,
  SearchResponse,
} from '@/types/extension';

import { BaseExtension } from '@/services/extensionRegistry';
import { getExtensionIconUrl } from '@/utils/urlUtils';

import {
  bookmarkCurrentPage,
  editBookmark,
  openBookmark,
  openBookmarkManager,
  removeBookmark,
} from './actions';
import {
  BOOKMARK_ALIASES,
  BOOKMARK_EXTENSION_DESCRIPTION,
  BOOKMARK_EXTENSION_ID,
  BOOKMARK_EXTENSION_NAME,
  BOOKMARK_MESSAGES,
  BOOKMARK_PLACEHOLDERS,
  BookmarkActionId,
  BookmarkCommandId,
  BookmarkCommandType,
} from './constants';
import { bookmarkToSearchResult, searchBookmarks } from './search';

class BookmarkExtension extends BaseExtension {
  id = BOOKMARK_EXTENSION_ID;

  name = BOOKMARK_EXTENSION_NAME;

  description = BOOKMARK_EXTENSION_DESCRIPTION;

  icon = getExtensionIconUrl('public/bookmark_icon.png');

  commands: Command[] = [
    {
      id: BookmarkCommandId.SEARCH,
      name: 'Search Bookmarks',
      description: 'Search through browser bookmarks',
      alias: [...BOOKMARK_ALIASES.SEARCH],
      type: BookmarkCommandType.SEARCH,
      placeholder: BOOKMARK_PLACEHOLDERS.SEARCH,
    },
    {
      id: BookmarkCommandId.ADD_CURRENT,
      name: 'Bookmark Current Page',
      description: 'Add the current page to bookmarks',
      alias: [...BOOKMARK_ALIASES.ADD_CURRENT],
      type: BookmarkCommandType.ACTION,
    },
    {
      id: BookmarkCommandId.ORGANIZE,
      name: 'Organize Bookmarks',
      description: 'Open bookmark manager',
      alias: [...BOOKMARK_ALIASES.ORGANIZE],
      type: BookmarkCommandType.ACTION,
    },
  ];

  // eslint-disable-next-line class-methods-use-this
  async handleSearch(
    commandId: string,
    payload: SearchPayload
  ): Promise<SearchResponse> {
    if (commandId !== BookmarkCommandId.SEARCH) {
      return {
        success: false,
        error: BOOKMARK_MESSAGES.UNKNOWN_COMMAND(commandId),
      };
    }

    try {
      const bookmarks = await searchBookmarks(payload.query);
      const results = bookmarks.map(bookmarkToSearchResult);

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : BOOKMARK_MESSAGES.SEARCH_FAILED,
      };
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async handleAction(
    commandId: string,
    payload: ActionPayload
  ): Promise<ExtensionResponse> {
    try {
      switch (commandId) {
        case BookmarkCommandId.ADD_CURRENT:
          return bookmarkCurrentPage();

        case BookmarkCommandId.ORGANIZE:
          return openBookmarkManager();

        default:
          // Handle bookmark-specific actions (open, edit, remove)
          if (
            payload.actionId === BookmarkActionId.OPEN &&
            payload.metadata?.url
          ) {
            return openBookmark(payload.metadata.url as string);
          }
          if (
            payload.actionId === BookmarkActionId.REMOVE &&
            payload.metadata?.id
          ) {
            return removeBookmark(payload.metadata.id as string);
          }
          if (
            payload.actionId === BookmarkActionId.EDIT &&
            payload.metadata?.id
          ) {
            return editBookmark();
          }

          return {
            success: false,
            error: BOOKMARK_MESSAGES.UNKNOWN_ACTION(
              commandId,
              payload.actionId || ''
            ),
          };
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : BOOKMARK_MESSAGES.ACTION_FAILED,
      };
    }
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
