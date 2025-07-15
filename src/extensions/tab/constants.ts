/**
 * Tab extension constants and enums
 */

export const TAB_EXTENSION_ID = 'tab' as const;

export const TAB_EXTENSION_NAME = 'Tab Manager' as const;

export const TAB_EXTENSION_DESCRIPTION =
  'Search, switch, and manage browser tabs' as const;

export enum TabCommandId {
  SEARCH = 'search-tab',
  CLOSE_ALL_DUPLICATES = 'close-all-duplicates',
  GROUP_BY_DOMAIN = 'group-by-domain',
}

export enum TabCommandType {
  ACTION = 'action',
  SEARCH = 'search',
}

export enum TabActionId {
  SWITCH = 'switch',
  CLOSE = 'close',
}

export enum TabActionLabel {
  SWITCH_TO_TAB = 'Switch to Tab',
  CLOSE_TAB = 'Close Tab',
}

export enum TabActionShortcut {
  ENTER = 'Enter',
  CTRL_ENTER = 'Ctrl+Enter',
}

export enum TabResultType {
  TAB = 'tab',
}

export const TAB_MESSAGES = {
  SEARCH_FAILED: 'Failed to search tabs',
  ACTION_FAILED: 'Action failed',
  NO_DUPLICATES_FOUND: 'No duplicate tabs found',
  DUPLICATES_CLOSED: (count: number) =>
    `Closed ${count} duplicate tab${count > 1 ? 's' : ''}`,
  GROUPS_CREATED: (count: number) =>
    `Created ${count} tab group${count !== 1 ? 's' : ''}`,
  TAB_GROUPS_NOT_SUPPORTED: 'Tab groups are not supported in this browser',
  UNKNOWN_COMMAND: (commandId: string) => `Unknown command: ${commandId}`,
  UNKNOWN_ACTION: (commandId: string, actionId: string) =>
    `Unknown action: ${commandId} - ${actionId}`,
} as const;

export const TAB_ALIASES = {
  SEARCH: ['t', 'tab', 'tabs'],
  CLOSE_ALL_DUPLICATES: ['dup', 'duplicates'],
  GROUP_BY_DOMAIN: ['group', 'gd'],
} as const;

export const TAB_PLACEHOLDERS = {
  SEARCH: 'Search tabs...',
} as const;
