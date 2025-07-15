import type {
  ActionPayload,
  Command,
  ExtensionResponse,
  SearchPayload,
  SearchResponse,
} from '@/types/extension';

import { BaseExtension } from '@/services/extensionRegistry';
import { getExtensionIconUrl } from '@/utils/urlUtils';

import {
  clearLastHourHistory,
  clearTodayHistory,
  openHistoryItem,
  removeHistoryItem,
} from './actions';
import {
  HISTORY_ALIASES,
  HISTORY_EXTENSION_DESCRIPTION,
  HISTORY_EXTENSION_ID,
  HISTORY_EXTENSION_NAME,
  HISTORY_MESSAGES,
  HISTORY_PLACEHOLDERS,
  HistoryActionId,
  HistoryCommandId,
  HistoryCommandType,
} from './constants';
import { historyItemToSearchResult, searchHistory } from './search';

class HistoryExtension extends BaseExtension {
  id = HISTORY_EXTENSION_ID;

  name = HISTORY_EXTENSION_NAME;

  description = HISTORY_EXTENSION_DESCRIPTION;

  icon = getExtensionIconUrl('public/history_icon.png');

  commands: Command[] = [
    {
      id: HistoryCommandId.SEARCH,
      name: 'Search History',
      description: 'Search through browser history',
      alias: [...HISTORY_ALIASES.SEARCH],
      type: HistoryCommandType.SEARCH,
      placeholder: HISTORY_PLACEHOLDERS.SEARCH,
    },
    {
      id: HistoryCommandId.CLEAR_TODAY,
      name: "Clear Today's History",
      description: 'Clear all history from today',
      alias: [...HISTORY_ALIASES.CLEAR_TODAY],
      type: HistoryCommandType.ACTION,
    },
    {
      id: HistoryCommandId.CLEAR_HOUR,
      name: 'Clear Last Hour',
      description: 'Clear history from the last hour',
      alias: [...HISTORY_ALIASES.CLEAR_HOUR],
      type: HistoryCommandType.ACTION,
    },
  ];

  // eslint-disable-next-line class-methods-use-this
  async handleSearch(
    commandId: string,
    payload: SearchPayload
  ): Promise<SearchResponse> {
    if (commandId !== HistoryCommandId.SEARCH) {
      return {
        success: false,
        error: HISTORY_MESSAGES.UNKNOWN_COMMAND(commandId),
      };
    }

    try {
      const historyItems = await searchHistory(payload.query);
      const results = historyItems.map(historyItemToSearchResult);

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : HISTORY_MESSAGES.SEARCH_FAILED,
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
        case HistoryCommandId.CLEAR_TODAY:
          return clearTodayHistory();

        case HistoryCommandId.CLEAR_HOUR:
          return clearLastHourHistory();

        default:
          // Handle history-specific actions (open, remove)
          if (
            payload.actionId === HistoryActionId.OPEN &&
            payload.metadata?.url
          ) {
            return openHistoryItem(payload.metadata.url as string);
          }
          if (
            payload.actionId === HistoryActionId.REMOVE &&
            payload.metadata?.url
          ) {
            return removeHistoryItem(payload.metadata.url as string);
          }

          return {
            success: false,
            error: HISTORY_MESSAGES.UNKNOWN_ACTION(
              commandId,
              payload.actionId || ''
            ),
          };
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : HISTORY_MESSAGES.ACTION_FAILED,
      };
    }
  }
}

export default HistoryExtension;
