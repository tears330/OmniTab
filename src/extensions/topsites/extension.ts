/**
 * TopSites Extension
 * Provides search functionality for Chrome's most visited sites
 */

import type {
  ActionPayload,
  ExtensionResponse,
  SearchPayload,
  SearchResponse,
} from '@/types/extension';

import { BaseExtension } from '@/services/extensionRegistry';

import { handleTopSitesSearch, openTopSite } from './actions';
import {
  TOPSITES_ALIASES,
  TOPSITES_EXTENSION_DESCRIPTION,
  TOPSITES_EXTENSION_ID,
  TOPSITES_EXTENSION_NAME,
  TOPSITES_MESSAGES,
  TopSitesCommandId,
  TopSitesCommandType,
} from './constants';
import { searchTopSites } from './search';

class TopSitesExtension extends BaseExtension {
  id = TOPSITES_EXTENSION_ID;

  name = TOPSITES_EXTENSION_NAME;

  description = TOPSITES_EXTENSION_DESCRIPTION;

  icon = chrome.runtime.getURL('icon16.png');

  commands = [
    {
      id: TopSitesCommandId.SEARCH,
      name: 'Search Top Sites',
      description: 'Search your most visited sites',
      alias: [...TOPSITES_ALIASES.SEARCH],
      type: TopSitesCommandType.SEARCH,
    },
  ];

  // eslint-disable-next-line class-methods-use-this
  async initialize(): Promise<void> {
    // Check if topSites permission is available
    try {
      if (!chrome.topSites) {
        // Chrome topSites API not available in this environment
      }
    } catch (error) {
      // Failed to initialize TopSites extension
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async handleSearch(
    commandId: string,
    payload: SearchPayload
  ): Promise<SearchResponse> {
    if (commandId !== TopSitesCommandId.SEARCH) {
      return {
        success: false,
        error: TOPSITES_MESSAGES.UNKNOWN_COMMAND(commandId),
      };
    }

    try {
      const results = await searchTopSites(payload.query);

      if (results.length === 0) {
        return {
          success: true,
          data: [],
        };
      }

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : TOPSITES_MESSAGES.SEARCH_FAILED;

      // Check if it's a permission error
      if (
        errorMessage.includes('permission') ||
        errorMessage.includes('denied')
      ) {
        return {
          success: false,
          error: TOPSITES_MESSAGES.PERMISSION_DENIED,
        };
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async handleAction(
    commandId: string,
    payload: ActionPayload
  ): Promise<ExtensionResponse> {
    try {
      switch (commandId) {
        case TopSitesCommandId.SEARCH:
          return handleTopSitesSearch();

        default:
          // Handle result-based actions
          if (payload?.metadata?.url) {
            return openTopSite(payload.metadata.url as string);
          }

          return {
            success: false,
            error: TOPSITES_MESSAGES.UNKNOWN_COMMAND(commandId),
          };
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : TOPSITES_MESSAGES.SEARCH_FAILED,
      };
    }
  }
}

export default TopSitesExtension;
