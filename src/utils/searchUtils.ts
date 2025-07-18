/**
 * Search utility functions for OmniTab
 */

import type { SearchBroker, SearchResults } from '@/types';
import type { SearchResult } from '@/types/extension';

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

  if (
    firstPart.length <= 10 &&
    /^[a-zA-Z0-9_\-!@#$%^&*()+=[\]{};':"|,.<>?/\\~`]+$/.test(firstPart)
  ) {
    return { alias: firstPart, searchTerm: restPart.trim() };
  }

  return { searchTerm: query.trim() };
}

/**
 * Utility function to parse command from query with support for immediate aliases
 */
export function parseCommandWithNonSpace(
  query: string,
  commands: Array<{ alias?: string[]; immediateAlias?: boolean }>
): {
  alias?: string;
  searchTerm: string;
} {
  // First check for immediate aliases (those that don't require a space)
  const immediateMatch = commands
    .filter((command) => command.alias && command.immediateAlias === true)
    .flatMap((command) => command.alias!.map((alias) => ({ command, alias })))
    .find(({ alias }) => query.toLowerCase().startsWith(alias.toLowerCase()));

  if (immediateMatch) {
    return {
      alias: immediateMatch.alias,
      searchTerm: query.substring(immediateMatch.alias.length).trim(),
    };
  }

  // Fall back to standard space-based parsing
  return parseCommand(query);
}

/**
 * Builds a full command ID from extension and command IDs
 */
export function buildCommandId(extensionId: string, commandId: string): string {
  return `${extensionId}.${commandId}`;
}

/**
 * Parses a full command ID into extension and command parts
 */
export function parseCommandId(fullCommandId: string): {
  extensionId: string;
  commandId: string;
} {
  const [extensionId, commandId] = fullCommandId.split('.');
  return { extensionId, commandId };
}

/**
 * Creates a successful search result response
 */
export function createSuccessResult(
  results: SearchResult[],
  activeExtension?: string,
  activeCommand?: string
): SearchResults {
  return {
    results,
    loading: false,
    activeExtension,
    activeCommand,
  };
}

/**
 * Creates an error search result response
 */
export function createErrorResult(error: string): SearchResults {
  return {
    results: [],
    loading: false,
    error,
  };
}

/**
 * Creates an empty search result response
 */
export function createEmptyResult(): SearchResults {
  return {
    results: [],
    loading: false,
  };
}

/**
 * Safely executes a search request and returns results or empty array
 */
export async function safeSearchRequest(
  broker: SearchBroker,
  extensionId: string,
  commandId: string,
  query: string
): Promise<SearchResult[]> {
  try {
    const response = await broker.sendSearchRequest(
      extensionId,
      commandId,
      query
    );
    return response.success && response.data ? response.data : [];
  } catch {
    // Ignore individual extension failures
    return [];
  }
}
