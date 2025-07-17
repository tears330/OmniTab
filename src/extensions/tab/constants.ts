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
  CLOSE_GROUP = 'close-group',
  CLOSE_OTHER_TABS = 'close-others',
  CLOSE_OTHER_GROUPS = 'close-other-groups',
}

export enum TabCommandType {
  ACTION = 'action',
  SEARCH = 'search',
}

export enum TabActionId {
  SWITCH = 'switch',
  CLOSE = 'close',
  MUTE = 'mute',
  PIN = 'pin',
  CLOSE_OTHERS = 'close-others',
  CLOSE_GROUP = 'close-group',
  CLOSE_OTHER_GROUPS = 'close-other-groups',
  BOOKMARK = 'bookmark',
}

export enum TabActionLabel {
  SWITCH_TO_TAB = 'Switch to Tab',
  CLOSE_TAB = 'Close Tab',
  MUTE_TAB = 'Mute Tab',
  UNMUTE_TAB = 'Unmute Tab',
  PIN_TAB = 'Pin Tab',
  UNPIN_TAB = 'Unpin Tab',
  CLOSE_OTHER_TABS = 'Close Other Tabs',
  CLOSE_GROUP = 'Close Group',
  CLOSE_OTHER_GROUPS = 'Close Other Groups',
  BOOKMARK_TAB = 'Bookmark Tab',
}

export enum TabActionShortcut {
  ENTER = 'Enter',
  CLOSE = 'c',
  MUTE = 'm',
  PIN = 'p',
  CLOSE_OTHERS = 'o',
  CLOSE_GROUP = 'g',
  CLOSE_OTHER_GROUPS = 'G',
  BOOKMARK = 'b',
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
  GROUP_CLOSED: 'Tab group closed successfully',
  OTHER_GROUPS_CLOSED: (count: number) =>
    `Closed ${count} other tab group${count !== 1 ? 's' : ''}`,
  NO_GROUP_FOUND: 'No tab group found for this tab',
  NO_OTHER_GROUPS_FOUND: 'No other tab groups found',
  OTHER_TABS_CLOSED: (count: number) =>
    `Closed ${count} other tab${count !== 1 ? 's' : ''}`,
  NO_OTHER_TABS_FOUND: 'No other tabs found',
  BOOKMARK_ADDED: 'Tab bookmarked successfully',
  BOOKMARK_FAILED: 'Failed to bookmark tab',
} as const;

export const TAB_ALIASES = {
  SEARCH: ['t', 'tab', 'tabs'],
  CLOSE_ALL_DUPLICATES: ['dup', 'duplicates'],
  GROUP_BY_DOMAIN: ['group', 'gd'],
  CLOSE_GROUP: ['cg', 'closegroup'],
  CLOSE_OTHER_GROUPS: ['cog', 'closeothergroups'],
  CLOSE_OTHER_TABS: ['cot', 'closeothertabs'],
} as const;

export const TAB_PLACEHOLDERS = {
  SEARCH: 'Search tabs...',
} as const;
