/**
 * History extension main entry point
 */

// Export all public functions and types
export { historyItemToSearchResult, searchHistory } from './search';
export {
  clearLastHourHistory,
  clearTodayHistory,
  openHistoryItem,
  removeHistoryItem,
} from './actions';
export {
  HISTORY_EXTENSION_ID,
  HISTORY_EXTENSION_NAME,
  HISTORY_EXTENSION_DESCRIPTION,
  HistoryCommandId,
  HistoryCommandType,
  HISTORY_MESSAGES,
} from './constants';

// Export the main extension class
export { default as HistoryExtension } from './extension';
