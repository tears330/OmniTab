/**
 * Bookmark extension constants and enums
 */

export const BOOKMARK_EXTENSION_ID = 'bookmark' as const;

export const BOOKMARK_EXTENSION_NAME = 'Bookmark Manager' as const;

export const BOOKMARK_EXTENSION_DESCRIPTION =
  'Search and manage browser bookmarks' as const;

export enum BookmarkCommandId {
  SEARCH = 'search-bookmark',
  ADD_CURRENT = 'add-current',
  ORGANIZE = 'organize',
}

export enum BookmarkCommandType {
  ACTION = 'action',
  SEARCH = 'search',
}

export enum BookmarkActionId {
  OPEN = 'open',
  EDIT = 'edit',
  REMOVE = 'remove',
}

export enum BookmarkActionLabel {
  OPEN_IN_NEW_TAB = 'Open in New Tab',
  EDIT_BOOKMARK = 'Edit Bookmark',
  REMOVE_BOOKMARK = 'Remove Bookmark',
}

export enum BookmarkActionShortcut {
  ENTER = 'Enter',
  EDIT = 'e',
  REMOVE = 'r',
}

export enum BookmarkResultType {
  BOOKMARK = 'bookmark',
}

export const BOOKMARK_MESSAGES = {
  SEARCH_FAILED: 'Failed to search bookmarks',
  ACTION_FAILED: 'Action failed',
  BOOKMARK_REMOVED: 'Bookmark removed',
  COULD_NOT_GET_TAB: 'Could not get current tab information',
  BOOKMARKED_PAGE: (title: string) => `Bookmarked: ${title}`,
  UNKNOWN_COMMAND: (commandId: string) => `Unknown command: ${commandId}`,
  UNKNOWN_ACTION: (commandId: string, actionId: string) =>
    `Unknown action: ${commandId} - ${actionId}`,
} as const;

export const BOOKMARK_ALIASES = {
  SEARCH: ['b', 'bookmark', 'bookmarks'],
  ADD_CURRENT: ['bc', 'bookmarkcurrent'],
  ORGANIZE: ['bo', 'bookmarkorganize'],
} as const;

export const BOOKMARK_PLACEHOLDERS = {
  SEARCH: 'Search bookmarks...',
} as const;

export const BOOKMARK_LIMITS = {
  MAX_RECENT_BOOKMARKS: 50,
  FAVICON_SIZE: 16,
} as const;

export const BOOKMARK_URLS = {
  BOOKMARK_MANAGER: 'chrome://bookmarks/',
} as const;
