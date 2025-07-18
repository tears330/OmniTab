import type { Command, SearchResult } from '@/types/extension';

import { ActionLabel, ActionShortcut, SearchResultType } from './constants';

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
