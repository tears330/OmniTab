import type {
  ExtensionResponse,
  SearchPayload,
  SearchResponse,
} from '@/types/extension';

import { BaseExtension, ExtensionRegistry } from '@/services/extensionRegistry';

import {
  getCommands,
  handleSearchCommands,
  reloadExtensions,
  showHelp,
} from './actions';
import {
  CORE_ALIASES,
  CORE_EXTENSION_DESCRIPTION,
  CORE_EXTENSION_ID,
  CORE_EXTENSION_NAME,
  CORE_MESSAGES,
  CoreCommandId,
  CoreCommandType,
} from './constants';
import { searchCommands } from './search';

class CoreExtension extends BaseExtension {
  id = CORE_EXTENSION_ID;

  name = CORE_EXTENSION_NAME;

  description = CORE_EXTENSION_DESCRIPTION;

  icon = chrome.runtime.getURL('icon16.png');

  commands = [
    {
      id: CoreCommandId.HELP,
      name: 'Help',
      description: 'Show available commands and shortcuts',
      alias: [...CORE_ALIASES.HELP],
      type: CoreCommandType.ACTION,
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
    },
  ];

  // eslint-disable-next-line class-methods-use-this
  async handleSearch(
    commandId: string,
    payload: SearchPayload
  ): Promise<SearchResponse> {
    if (commandId !== CoreCommandId.SEARCH_COMMANDS) {
      return {
        success: false,
        error: CORE_MESSAGES.UNKNOWN_COMMAND(commandId),
      };
    }

    const registry = ExtensionRegistry.getInstance();
    const allCommands = registry.getAllCommands();

    // Use the searchCommands function to filter and convert
    const results = searchCommands(payload.query, allCommands);

    return {
      success: true,
      data: results,
    };
  }

  // eslint-disable-next-line class-methods-use-this
  async handleAction(commandId: string): Promise<ExtensionResponse> {
    try {
      switch (commandId) {
        case CoreCommandId.HELP:
          return showHelp();

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
