import type { Command, SearchResult } from '@/types/extension';
import type {
  SearchBroker,
  SearchOptions,
  SearchResults,
} from '@/types/search';
import type { IFuseOptions } from 'fuse.js';
import { groupBy, uniqBy } from 'es-toolkit';
import Fuse from 'fuse.js';

import { BookmarkResultType } from '@/extensions/bookmark/constants';
import { SearchResultType } from '@/extensions/core/constants';
import { commandToSearchResult } from '@/extensions/core/search';
import { HistoryResultType } from '@/extensions/history/constants';
import { TabResultType } from '@/extensions/tab/constants';
import { TopSitesResultType } from '@/extensions/topsites/constants';
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
 * Performs a search across all available extensions with Fuse.js optimization
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
  const uniqueResults = uniqBy(flatResults, (result) => result.id);

  // If no query, return results as-is (for empty state or browsing)
  if (!query.trim()) {
    return uniqueResults;
  }

  // Type priority mapping (lower number = higher priority)
  const getTypePriority = (type: string): number => {
    switch (type.toLowerCase()) {
      case TabResultType.TAB:
        return 1; // Highest priority
      case HistoryResultType.HISTORY:
        return 2;
      case BookmarkResultType.BOOKMARK:
        return 3;
      case SearchResultType.COMMAND:
        return 4; // Lowest priority
      case TopSitesResultType.TOP_SITE:
        return 5; // TopSites priority
      default:
        return 6; // Unknown types get lowest priority
    }
  };

  // Configure Fuse.js for fuzzy search optimization
  const fuseOptions: IFuseOptions<SearchResult> = {
    keys: [
      { name: 'title', weight: 2 }, // Title is most important
      { name: 'description', weight: 1 }, // Description is secondary
      { name: 'type', weight: 2 }, // Type has same weight as title
    ],
    threshold: 0.6, // Allow moderate fuzziness (0 = perfect match, 1 = match anything)
    distance: 100, // Maximum character distance for matches
    minMatchCharLength: 1, // Minimum character length for matches
    includeScore: true, // Include relevance score
    shouldSort: false, // We'll sort manually with type priority
  };

  // Create Fuse instance and search
  const fuse = new Fuse(uniqueResults, fuseOptions);
  const fuseResults = fuse.search(query);

  // Sort results by type priority first, then by Fuse score
  const sortedResults = fuseResults.sort((a, b) => {
    const typePriorityA = getTypePriority(a.item.type);
    const typePriorityB = getTypePriority(b.item.type);

    // If types have different priorities, sort by type priority
    if (typePriorityA !== typePriorityB) {
      return typePriorityA - typePriorityB;
    }

    // If types have same priority, sort by Fuse score (lower score = more relevant)
    return (a.score || 0) - (b.score || 0);
  });

  // Return sorted results
  return sortedResults.map((result) => result.item);
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

        // Only search if it's a search command
        if (command.type === 'search') {
          const results = await searchExtension(
            extensionId,
            commandId,
            searchTerm,
            broker
          );
          return createSuccessResult(results, extensionId, commandId);
        }

        // For action commands, return the command as a result
        const actionResult = commandToSearchResult(command);
        return createSuccessResult([actionResult], extensionId, commandId);
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
