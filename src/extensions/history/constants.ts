/**
 * History extension constants and enums
 */

export const HISTORY_EXTENSION_ID = 'history' as const;

export const HISTORY_EXTENSION_NAME = 'History Manager' as const;

export const HISTORY_EXTENSION_DESCRIPTION =
  'Search and manage browser history' as const;

export enum HistoryCommandId {
  SEARCH = 'search-history',
  CLEAR_TODAY = 'clear-today',
  CLEAR_HOUR = 'clear-hour',
}

export enum HistoryCommandType {
  ACTION = 'action',
  SEARCH = 'search',
}

export enum HistoryActionId {
  OPEN = 'open',
  REMOVE = 'remove',
}

export enum HistoryActionLabel {
  OPEN_IN_NEW_TAB = 'Open in New Tab',
  REMOVE_FROM_HISTORY = 'Remove from History',
}

export enum HistoryActionShortcut {
  ENTER = 'Enter',
  CTRL_ENTER = 'Ctrl+Enter',
}

export enum HistoryResultType {
  HISTORY = 'history',
}

export const HISTORY_MESSAGES = {
  SEARCH_FAILED: 'Failed to search history',
  ACTION_FAILED: 'Action failed',
  REMOVED_FROM_HISTORY: 'Removed from history',
  CLEARED_TODAY_HISTORY: "Cleared today's history",
  CLEARED_HOUR_HISTORY: "Cleared last hour's history",
  UNKNOWN_COMMAND: (commandId: string) => `Unknown command: ${commandId}`,
  UNKNOWN_ACTION: (commandId: string, actionId: string) =>
    `Unknown action: ${commandId} - ${actionId}`,
} as const;

export const HISTORY_ALIASES = {
  SEARCH: ['h', 'history', 'hist'],
  CLEAR_TODAY: ['cleartoday', 'ct'],
  CLEAR_HOUR: ['clearhour', 'ch'],
} as const;

export const HISTORY_PLACEHOLDERS = {
  SEARCH: 'Search history...',
} as const;

export const HISTORY_LIMITS = {
  MAX_RESULTS_WITH_QUERY: 50,
  MAX_RESULTS_WITHOUT_QUERY: 20,
  RECENT_HISTORY_DAYS: 7,
} as const;
