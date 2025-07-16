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
