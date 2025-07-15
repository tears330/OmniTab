import type {
  ActionPayload,
  Command,
  ExtensionResponse,
  SearchPayload,
  SearchResponse,
  SearchResult,
} from '@/types/extension';

import { BaseExtension } from '@/services/extensionRegistry';
import {
  getDomain,
  getExtensionIconUrl,
  getFaviconUrl,
} from '@/utils/urlUtils';

class HistoryExtension extends BaseExtension {
  id = 'history';

  name = 'History Manager';

  description = 'Search and manage browser history';

  icon = getExtensionIconUrl('public/history_icon.png');

  commands: Command[] = [
    {
      id: 'search',
      name: 'Search History',
      description: 'Search through browser history',
      alias: ['h', 'history', 'hist'],
      type: 'search',
      placeholder: 'Search history...',
    },
    {
      id: 'clear-today',
      name: "Clear Today's History",
      description: 'Clear all history from today',
      alias: ['cleartoday', 'ct'],
      type: 'action',
    },
    {
      id: 'clear-hour',
      name: 'Clear Last Hour',
      description: 'Clear history from the last hour',
      alias: ['clearhour', 'ch'],
      type: 'action',
    },
  ];

  async handleSearch(
    commandId: string,
    payload: SearchPayload
  ): Promise<SearchResponse> {
    if (commandId !== 'search') {
      return {
        success: false,
        error: `Unknown command: ${commandId}`,
      };
    }

    try {
      const historyItems = await this.searchHistory(payload.query);
      const results = historyItems.map(
        this.historyItemToSearchResult.bind(this)
      );

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to search history',
      };
    }
  }

  async handleAction(
    commandId: string,
    payload: ActionPayload
  ): Promise<ExtensionResponse> {
    try {
      switch (commandId) {
        case 'clear-today':
          return await this.clearTodayHistory();

        case 'clear-hour':
          return await this.clearLastHourHistory();

        default:
          // Handle history-specific actions (open, remove)
          if (payload.actionId === 'open' && payload.metadata?.url) {
            return await this.openHistoryItem(payload.metadata.url as string);
          }
          if (payload.actionId === 'remove' && payload.metadata?.url) {
            return await this.removeHistoryItem(payload.metadata.url as string);
          }

          return {
            success: false,
            error: `Unknown action: ${commandId} - ${payload.actionId}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Action failed',
      };
    }
  }

  // eslint-disable-next-line class-methods-use-this
  private async searchHistory(
    query: string
  ): Promise<chrome.history.HistoryItem[]> {
    return new Promise((resolve) => {
      const historyQuery = query || '';
      const maxResults = historyQuery ? 50 : 20;
      const searchOptions: chrome.history.HistoryQuery = {
        text: historyQuery,
        maxResults,
      };

      // If no search term, limit to recent history
      if (!historyQuery) {
        searchOptions.startTime = Date.now() - 7 * 24 * 60 * 60 * 1000; // Last 7 days
      }

      chrome.history.search(searchOptions, (historyItems) => {
        resolve(historyItems);
      });
    });
  }

  // eslint-disable-next-line class-methods-use-this
  private historyItemToSearchResult(
    item: chrome.history.HistoryItem
  ): SearchResult {
    return {
      id: `history-${item.id}`,
      title: item.title || 'Untitled',
      description: getDomain(item.url ?? ''),
      icon: getFaviconUrl(item.url ?? ''),
      type: 'history',
      actions: [
        {
          id: 'open',
          label: 'Open in New Tab',
          shortcut: 'Enter',
          primary: true,
        },
        {
          id: 'remove',
          label: 'Remove from History',
          shortcut: 'Ctrl+Enter',
        },
      ],
      metadata: {
        url: item.url,
        visitCount: item.visitCount,
        lastVisitTime: item.lastVisitTime,
      },
    };
  }

  // eslint-disable-next-line class-methods-use-this
  private async openHistoryItem(url: string): Promise<ExtensionResponse> {
    return new Promise((resolve) => {
      chrome.tabs.create({ url }, () => {
        if (chrome.runtime.lastError) {
          resolve({
            success: false,
            error: chrome.runtime.lastError.message,
          });
          return;
        }

        resolve({ success: true });
      });
    });
  }

  // eslint-disable-next-line class-methods-use-this
  private async removeHistoryItem(url: string): Promise<ExtensionResponse> {
    return new Promise((resolve) => {
      chrome.history.deleteUrl({ url }, () => {
        if (chrome.runtime.lastError) {
          resolve({
            success: false,
            error: chrome.runtime.lastError.message,
          });
          return;
        }

        resolve({
          success: true,
          data: { message: 'Removed from history' },
        });
      });
    });
  }

  // eslint-disable-next-line class-methods-use-this
  private async clearTodayHistory(): Promise<ExtensionResponse> {
    return new Promise((resolve) => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      chrome.history.deleteRange(
        {
          startTime: startOfDay.getTime(),
          endTime: Date.now(),
        },
        () => {
          if (chrome.runtime.lastError) {
            resolve({
              success: false,
              error: chrome.runtime.lastError.message,
            });
            return;
          }

          resolve({
            success: true,
            data: { message: "Cleared today's history" },
          });
        }
      );
    });
  }

  // eslint-disable-next-line class-methods-use-this
  private async clearLastHourHistory(): Promise<ExtensionResponse> {
    return new Promise((resolve) => {
      const oneHourAgo = Date.now() - 60 * 60 * 1000;

      chrome.history.deleteRange(
        {
          startTime: oneHourAgo,
          endTime: Date.now(),
        },
        () => {
          if (chrome.runtime.lastError) {
            resolve({
              success: false,
              error: chrome.runtime.lastError.message,
            });
            return;
          }

          resolve({
            success: true,
            data: { message: "Cleared last hour's history" },
          });
        }
      );
    });
  }
}

export default HistoryExtension;
