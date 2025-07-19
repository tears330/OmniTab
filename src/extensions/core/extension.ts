import type {
  ExtensionResponse,
  SearchPayload,
  SearchResponse,
} from '@/types/extension';

import { BaseExtension, ExtensionRegistry } from '@/services/extensionRegistry';

import { getCommands, handleSearchCommands, reloadExtensions } from './actions';
import {
  CORE_ALIASES,
  CORE_EXTENSION_DESCRIPTION,
  CORE_EXTENSION_ID,
  CORE_EXTENSION_NAME,
  CORE_MESSAGES,
  CoreCommandId,
  CoreCommandType,
} from './constants';
import { handleCoreSearch } from './search';

class CoreExtension extends BaseExtension {
  id = CORE_EXTENSION_ID;

  name = CORE_EXTENSION_NAME;

  description = CORE_EXTENSION_DESCRIPTION;

  icon = chrome.runtime.getURL('icon16.png');

  commands = [
    {
      id: CoreCommandId.HELP,
      name: 'Help',
      description: 'Show available search commands',
      alias: [...CORE_ALIASES.HELP],
      type: CoreCommandType.SEARCH,
      immediateAlias: true,
    },
    {
      id: CoreCommandId.RELOAD,
      name: 'Reload Extensions',
      description: 'Reload all extensions',
      alias: [...CORE_ALIASES.RELOAD],
      type: CoreCommandType.ACTION,
    },
    {
      id: CoreCommandId.SEARCH_COMMANDS,
      name: 'Search Commands',
      description: 'Search for available commands',
      alias: [...CORE_ALIASES.SEARCH_COMMANDS],
      type: CoreCommandType.SEARCH,
      immediateAlias: true,
    },
  ];

  // eslint-disable-next-line class-methods-use-this
  async handleSearch(
    commandId: string,
    payload: SearchPayload
  ): Promise<SearchResponse> {
    // Validate command ID
    if (
      commandId !== CoreCommandId.SEARCH_COMMANDS &&
      commandId !== CoreCommandId.HELP
    ) {
      return {
        success: false,
        error: CORE_MESSAGES.UNKNOWN_COMMAND(commandId),
      };
    }

    const registry = ExtensionRegistry.getInstance();
    const allCommands = await registry.getEnabledCommands();

    // Use the centralized search handler
    const results = handleCoreSearch(commandId, payload.query, allCommands);

    return {
      success: true,
      data: results,
    };
  }

  // eslint-disable-next-line class-methods-use-this
  async handleAction(commandId: string): Promise<ExtensionResponse> {
    try {
      switch (commandId) {
        case CoreCommandId.RELOAD:
          return reloadExtensions();

        case CoreCommandId.GET_COMMANDS:
          return getCommands();

        case CoreCommandId.SEARCH_COMMANDS:
          return handleSearchCommands();

        default:
          return {
            success: false,
            error: CORE_MESSAGES.UNKNOWN_COMMAND(commandId),
          };
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : CORE_MESSAGES.ACTION_FAILED,
      };
    }
  }
}

export default CoreExtension;
