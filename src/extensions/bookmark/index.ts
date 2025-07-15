/**
 * Bookmark extension main entry point
 */

// Export all public functions and types
export { bookmarkToSearchResult, searchBookmarks } from './search';
export {
  bookmarkCurrentPage,
  editBookmark,
  openBookmark,
  openBookmarkManager,
  removeBookmark,
} from './actions';
export {
  BOOKMARK_EXTENSION_ID,
  BOOKMARK_EXTENSION_NAME,
  BOOKMARK_EXTENSION_DESCRIPTION,
  BookmarkCommandId,
  BookmarkCommandType,
  BOOKMARK_MESSAGES,
} from './constants';

// Export the main extension class
export { default as BookmarkExtension } from './extension';
