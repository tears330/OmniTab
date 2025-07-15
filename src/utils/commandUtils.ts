import type { BaseExtension } from '@/services/extensionRegistry';
import type { Command, SearchResult } from '@/types/extension';

/**
 * Utility function to parse command from query
 */
export function parseCommand(query: string): {
  alias?: string;
  searchTerm: string;
} {
  const spaceIndex = query.indexOf(' ');

  if (spaceIndex === -1) {
    return { searchTerm: query.trim() };
  }

  const firstPart = query.substring(0, spaceIndex);
  const restPart = query.substring(spaceIndex + 1);

  if (firstPart.length <= 10 && /^[a-zA-Z0-9_-]+$/.test(firstPart)) {
    return { alias: firstPart, searchTerm: restPart.trim() };
  }

  return { searchTerm: query.trim() };
}

/**
 * Helper function to create a command result for display
 */
export function createCommandResult(
  extension: BaseExtension,
  command: Command,
  _index: number // eslint-disable-line @typescript-eslint/no-unused-vars
): SearchResult {
  const fullCommandId = `${extension.id}.${command.id}`;

  return {
    id: fullCommandId,
    title: command.name,
    description:
      command.description || `${extension.name} - ${command.type} command`,
    icon: command.icon || extension.icon,
    type: 'command',
    actions: [
      {
        id: 'select',
        label: 'Select',
        shortcut: 'Enter',
        primary: true,
      },
    ],
    metadata: {
      extensionId: extension.id,
      commandId: command.id,
      commandType: command.type,
      alias: command.alias,
    },
  };
}
