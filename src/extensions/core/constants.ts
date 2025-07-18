/**
 * Core extension constants and enums
 */

export const CORE_EXTENSION_ID = 'core' as const;

export const CORE_EXTENSION_NAME = 'Core System' as const;

export const CORE_EXTENSION_DESCRIPTION = 'Core OmniTab functionality' as const;

export enum CoreCommandId {
  HELP = 'help',
  RELOAD = 'reload',
  SEARCH_COMMANDS = 'search-commands',
  GET_COMMANDS = 'get-commands',
}

export enum CoreCommandType {
  ACTION = 'action',
  SEARCH = 'search',
}

export enum ActionLabel {
  SELECT = 'Select',
}

export enum ActionShortcut {
  ENTER = 'Enter',
}

export enum SearchResultType {
  COMMAND = 'command',
}

export const CORE_MESSAGES = {
  HELP_OPENING: 'Opening help page',
  EXTENSIONS_RELOADED: 'Extensions reloaded',
  SEARCH_COMMANDS_USAGE: 'Use > prefix to search commands',
  ACTION_FAILED: 'Action failed',
  UNKNOWN_COMMAND: (commandId: string) => `Unknown command: ${commandId}`,
} as const;

export const CORE_ALIASES = {
  HELP: ['?'],
  RELOAD: ['reload'],
  SEARCH_COMMANDS: ['>'],
} as const;
