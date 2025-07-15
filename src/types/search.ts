/**
 * Search-related TypeScript type definitions
 */

import type { Command, SearchResult } from './extension';

/**
 * Minimal broker interface needed for search operations
 */
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

/**
 * Options for performing a search operation
 */
export interface SearchOptions {
  query: string;
  availableCommands: Command[];
  broker: SearchBroker;
}

/**
 * Result of a search operation
 */
export interface SearchResults {
  results: SearchResult[];
  loading: boolean;
  error?: string;
  activeExtension?: string;
  activeCommand?: string;
}

/**
 * Parsed command ID structure
 */
export interface ParsedCommandId {
  extensionId: string;
  commandId: string;
}
