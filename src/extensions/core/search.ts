import type { Command, SearchResult } from '@/types/extension';

import { buildCommandId } from '@/utils/searchUtils';

import {
  ActionLabel,
  ActionShortcut,
  CORE_EXTENSION_ID,
  CoreCommandId,
  SearchResultType,
} from './constants';

/**
 * Converts a command to a search result
 */
export function commandToSearchResult(cmd: Command): SearchResult {
  return {
    id: cmd.id,
    title: cmd.name,
    description: cmd.description || '',
    icon: cmd.icon,
    type: SearchResultType.COMMAND,
    actions: [
      {
        id: ActionLabel.SELECT.toLowerCase(),
        label: ActionLabel.SELECT,
        shortcut: ActionShortcut.ENTER,
        primary: true,
      },
    ],
    metadata: { command: cmd },
  };
}

/**
 * Searches for commands that match the query
 */
export function searchCommands(
  query: string,
  commands: Command[]
): SearchResult[] {
  const lowerQuery = query.toLowerCase();
  const matchingCommands = commands.filter(
    (cmd) =>
      cmd.name.toLowerCase().includes(lowerQuery) ||
      cmd.description?.toLowerCase().includes(lowerQuery) ||
      cmd.alias?.some((a) => a.includes(lowerQuery))
  );

  return matchingCommands.map(commandToSearchResult);
}

/**
 * Searches for help commands (search type commands only)
 */
export function searchHelpCommands(
  query: string,
  commands: Command[]
): SearchResult[] {
  // Only show results when query is empty
  if (query.trim() !== '') {
    return [];
  }

  // Build the full help command ID
  const helpCommandId = buildCommandId(CORE_EXTENSION_ID, CoreCommandId.HELP);

  // Filter to only search commands, exclude self
  const searchTypeCommands = commands.filter(
    (cmd) => cmd.type === 'search' && cmd.id !== helpCommandId
  );

  // Create results with alias as title
  return searchTypeCommands.map((cmd) => {
    const [primaryAlias] = cmd.alias || [];
    return {
      id: cmd.id,
      title: primaryAlias || cmd.name,
      description: cmd.description || '',
      icon: cmd.icon,
      type: SearchResultType.COMMAND,
      actions: [
        {
          id: ActionLabel.SELECT.toLowerCase(),
          label: ActionLabel.SELECT,
          shortcut: ActionShortcut.ENTER,
          primary: true,
        },
      ],
      metadata: { command: cmd },
    };
  });
}

/**
 * Handles core extension search based on command ID
 */
export function handleCoreSearch(
  commandId: string,
  query: string,
  commands: Command[]
): SearchResult[] {
  switch (commandId) {
    case CoreCommandId.SEARCH_COMMANDS:
      return searchCommands(query, commands);

    case CoreCommandId.HELP:
      return searchHelpCommands(query, commands);

    default:
      return [];
  }
}
