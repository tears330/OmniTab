/**
 * Tab extension main entry point
 */

// Export all public functions and types
export { searchTabs, tabToSearchResult } from './search';
export {
  closeAllDuplicates,
  closeTab,
  groupTabsByDomain,
  switchToTab,
} from './actions';
export {
  TAB_EXTENSION_ID,
  TAB_EXTENSION_NAME,
  TAB_EXTENSION_DESCRIPTION,
  TabCommandId,
  TabCommandType,
  TAB_MESSAGES,
} from './constants';

// Export the main extension class
export { default as TabExtension } from './extension';
