import type { Command, SearchResult } from '@/types/extension';
import type {
  SearchBroker,
  SearchOptions,
  SearchResults,
} from '@/types/search';
import { groupBy, uniqBy } from 'es-toolkit';

import {
  createEmptyResult,
  createErrorResult,
  createSuccessResult,
  parseCommandId,
  parseCommandWithNonSpace,
  safeSearchRequest,
} from '@/utils/searchUtils';

// Re-export types for backward compatibility
export type { SearchBroker, SearchOptions, SearchResults };

/**
 * Performs a search across all available extensions
 */
export async function searchAllExtensions(
  query: string,
  commands: Command[],
  broker: SearchBroker
): Promise<SearchResult[]> {
  // Filter search commands and group by extension
  const searchCommands = commands.filter((cmd) => cmd.type === 'search');
  const commandsByExtension = groupBy(
    searchCommands,
    (cmd) => parseCommandId(cmd.id).extensionId
  );

  // Create search promises for each extension's search commands
  const searchPromises = Object.entries(commandsByExtension).flatMap(
    ([extensionId, extensionCommands]) =>
      extensionCommands.map(async (command) => {
        const { commandId } = parseCommandId(command.id);
        return safeSearchRequest(broker, extensionId, commandId, query);
      })
  );

  const results = await Promise.all(searchPromises);
  const flatResults = results.flat();

  // Remove duplicate results by ID using es-toolkit
  return uniqBy(flatResults, (result) => result.id);
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
    return createEmptyResult();
  }

  // Parse command from query with support for non-space aliases
  const { alias, searchTerm } = parseCommandWithNonSpace(
    query,
    availableCommands
  );

  try {
    // Check if alias matches a specific command
    if (alias) {
      const command = availableCommands.find((cmd) =>
        cmd.alias?.includes(alias.toLowerCase())
      );

      if (command) {
        const { extensionId, commandId } = parseCommandId(command.id);
        const results = await searchExtension(
          extensionId,
          commandId,
          searchTerm,
          broker
        );
        return createSuccessResult(results, extensionId, commandId);
      }
    }

    // No specific command found, search all extensions
    const results = await searchAllExtensions(
      searchTerm || query,
      availableCommands,
      broker
    );
    return createSuccessResult(results);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Search failed';
    return createErrorResult(errorMessage);
  }
}
