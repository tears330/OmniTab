import type { Command, SearchResult } from '@/types/extension';

import { parseCommand } from '@/utils/commandUtils';

// Define minimal broker interface needed for search
export interface SearchBroker {
  sendSearchRequest(
    extensionId: string,
    commandId: string,
    query: string
  ): Promise<{
    success: boolean;
    data?: SearchResult[];
    error?: string;
  }>;
}

export interface SearchOptions {
  query: string;
  availableCommands: Command[];
  broker: SearchBroker;
}

export interface SearchResults {
  results: SearchResult[];
  loading: boolean;
  error?: string;
  activeExtension?: string;
  activeCommand?: string;
}

/**
 * Converts a command to a search result
 */
export function commandToSearchResult(cmd: Command): SearchResult {
  return {
    id: cmd.id,
    title: cmd.name,
    description: cmd.description || '',
    icon: cmd.icon,
    type: 'command',
    actions: [
      {
        id: 'select',
        label: 'Select',
        shortcut: 'Enter',
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
 * Performs a search across all available extensions
 */
export async function searchAllExtensions(
  query: string,
  commands: Command[],
  broker: SearchBroker
): Promise<SearchResult[]> {
  const allResults: SearchResult[] = [];

  // First, add matching commands
  allResults.push(...searchCommands(query, commands));

  // Then search across all search extensions
  const extensionIds = new Set(
    commands
      .filter((cmd) => cmd.type === 'search')
      .map((cmd) => cmd.id.split('.')[0])
  );

  const searchPromises = Array.from(extensionIds).map(async (extId) => {
    try {
      const response = await broker.sendSearchRequest(extId, 'search', query);
      if (response.success && response.data) {
        return response.data;
      }
    } catch {
      // Ignore individual extension failures
    }
    return [];
  });

  const results = await Promise.all(searchPromises);
  allResults.push(...results.flat());

  return allResults;
}

/**
 * Searches within a specific extension
 */
export async function searchExtension(
  extensionId: string,
  commandId: string,
  searchTerm: string,
  broker: SearchBroker
): Promise<SearchResult[]> {
  const response = await broker.sendSearchRequest(
    extensionId,
    commandId,
    searchTerm
  );
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.error || 'Search failed');
}

/**
 * Main search function that handles all search logic
 */
export async function performSearch(
  options: SearchOptions
): Promise<SearchResults> {
  const { query, availableCommands, broker } = options;

  // Empty query - return empty results (caller should handle default state)
  if (!query.trim()) {
    return {
      results: [],
      loading: false,
    };
  }

  // Parse command from query
  const { alias, searchTerm } = parseCommand(query);

  // Find matching command by alias
  let extensionId: string | undefined;
  let commandId: string | undefined;

  if (alias) {
    // Look for command with matching alias
    const command = availableCommands.find((cmd) =>
      cmd.alias?.includes(alias.toLowerCase())
    );

    if (command) {
      const [extId, cmdId] = command.id.split('.');
      extensionId = extId;
      commandId = cmdId;
    }
  }

  try {
    // If a specific command found via alias, search only that extension
    if (extensionId && commandId) {
      const results = await searchExtension(
        extensionId,
        commandId,
        searchTerm,
        broker
      );
      return {
        results,
        loading: false,
        activeExtension: extensionId,
        activeCommand: commandId,
      };
    }

    // Otherwise, search commands and all extensions
    const results = await searchAllExtensions(
      searchTerm || query,
      availableCommands,
      broker
    );
    return {
      results,
      loading: false,
    };
  } catch (error) {
    return {
      results: [],
      loading: false,
      error: error instanceof Error ? error.message : 'Search failed',
    };
  }
}
