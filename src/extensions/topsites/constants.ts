/**
 * TopSites Extension Constants
 * All constants and enums for the TopSites extension
 */

export const TOPSITES_EXTENSION_ID = 'topsites';
export const TOPSITES_EXTENSION_NAME = 'Top Sites';
export const TOPSITES_EXTENSION_DESCRIPTION =
  'Search and access your most visited sites';

export enum TopSitesCommandId {
  SEARCH = 'search-top-sites',
}

export enum TopSitesCommandType {
  SEARCH = 'search',
}

export const TOPSITES_ALIASES = {
  SEARCH: ['top'],
} as const;

export const TOPSITES_MESSAGES = {
  UNKNOWN_COMMAND: (commandId: string) => `Unknown command: ${commandId}`,
  SEARCH_FAILED: 'Failed to search top sites',
  PERMISSION_DENIED:
    'Permission denied. Top sites access requires user permission.',
  NO_RESULTS: 'No top sites found',
} as const;

export const TOPSITES_CONFIG = {
  MAX_RESULTS: 20,
  DEFAULT_ICON: 'icon16.png',
} as const;

export enum TopSitesActionId {
  OPEN = 'open',
}

export enum TopSitesActionLabel {
  OPEN_SITE = 'Open site',
}

export enum TopSitesActionShortcut {
  ENTER = 'Enter',
}

export enum TopSitesResultType {
  TOP_SITE = 'topSites',
}
