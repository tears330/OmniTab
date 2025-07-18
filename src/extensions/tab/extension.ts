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
  addTabToBookmarks,
  closeAllDuplicates,
  closeOtherTabGroups,
  closeOtherTabs,
  closeTab,
  closeTabGroup,
  getCurrentActiveTab,
  groupTabsByDomain,
  muteTab,
  pinTab,
  switchToTab,
} from './actions';
import {
  TAB_ALIASES,
  TAB_EXTENSION_DESCRIPTION,
  TAB_EXTENSION_ID,
  TAB_EXTENSION_NAME,
  TAB_MESSAGES,
  TAB_PLACEHOLDERS,
  TabActionId,
  TabCommandId,
  TabCommandType,
} from './constants';
import { searchTabs, tabToSearchResult } from './search';

class TabExtension extends BaseExtension {
  id = TAB_EXTENSION_ID;

  name = TAB_EXTENSION_NAME;

  description = TAB_EXTENSION_DESCRIPTION;

  icon = getExtensionIconUrl('public/tab_icon.png');

  commands: Command[] = [
    {
      id: TabCommandId.SEARCH,
      name: 'Search Tabs',
      description: 'Search through open browser tabs',
      alias: [...TAB_ALIASES.SEARCH],
      type: TabCommandType.SEARCH,
      placeholder: TAB_PLACEHOLDERS.SEARCH,
    },
    {
      id: TabCommandId.CLOSE_ALL_DUPLICATES,
      name: 'Close Duplicate Tabs',
      description: 'Close all duplicate tabs keeping only one instance',
      alias: [...TAB_ALIASES.CLOSE_ALL_DUPLICATES],
      type: TabCommandType.ACTION,
    },
    {
      id: TabCommandId.GROUP_BY_DOMAIN,
      name: 'Group Tabs by Domain',
      description: 'Group tabs by their domain',
      alias: [...TAB_ALIASES.GROUP_BY_DOMAIN],
      type: TabCommandType.ACTION,
    },
    {
      id: TabCommandId.CLOSE_GROUP,
      name: 'Close Tab Group',
      description: 'Close the current tab group',
      alias: [...TAB_ALIASES.CLOSE_GROUP],
      type: TabCommandType.ACTION,
    },
    {
      id: TabCommandId.CLOSE_OTHER_GROUPS,
      name: 'Close Other Tab Groups',
      description: 'Close all tab groups except the current one',
      alias: [...TAB_ALIASES.CLOSE_OTHER_GROUPS],
      type: TabCommandType.ACTION,
    },
    {
      id: TabCommandId.CLOSE_OTHER_TABS,
      name: 'Close Other Tabs',
      description: 'Close all tabs except the current one',
      alias: [...TAB_ALIASES.CLOSE_OTHER_TABS],
      type: TabCommandType.ACTION,
    },
  ];

  // eslint-disable-next-line class-methods-use-this
  async handleSearch(
    commandId: string,
    payload: SearchPayload
  ): Promise<SearchResponse> {
    if (commandId !== TabCommandId.SEARCH) {
      return {
        success: false,
        error: TAB_MESSAGES.UNKNOWN_COMMAND(commandId),
      };
    }

    try {
      const tabs = await searchTabs(payload.query);
      const results = tabs.map(tabToSearchResult);

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : TAB_MESSAGES.SEARCH_FAILED,
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
        case TabCommandId.CLOSE_ALL_DUPLICATES:
          return closeAllDuplicates();

        case TabCommandId.GROUP_BY_DOMAIN:
          return groupTabsByDomain();

        case TabCommandId.CLOSE_GROUP:
          // If no specific tab is provided, get the current active tab
          if (!payload.resultId) {
            const activeTab = await getCurrentActiveTab();
            if (activeTab?.id) {
              return closeTabGroup(activeTab.id);
            }
            return {
              success: false,
              error: 'No active tab found',
            };
          }
          return {
            success: false,
            error: 'Tab ID is required for this action',
          };

        case TabCommandId.CLOSE_OTHER_GROUPS:
          // If no specific tab is provided, get the current active tab
          if (!payload.resultId) {
            const activeTab = await getCurrentActiveTab();
            if (activeTab?.id) {
              return closeOtherTabGroups(activeTab.id);
            }
            return {
              success: false,
              error: 'No active tab found',
            };
          }
          return {
            success: false,
            error: 'Tab ID is required for this action',
          };

        case TabCommandId.CLOSE_OTHER_TABS:
          // If no specific tab is provided, get the current active tab
          if (!payload.resultId) {
            const activeTab = await getCurrentActiveTab();
            if (activeTab?.id) {
              return closeOtherTabs(activeTab.id);
            }
            return {
              success: false,
              error: 'No active tab found',
            };
          }
          return {
            success: false,
            error: 'Tab ID is required for this action',
          };

        default:
          // Handle tab-specific actions (switch, close)
          if (payload.resultId) {
            // Extract tab ID from result ID (format: "tab-123")
            const tabId = parseInt(payload.resultId.replace('tab-', ''), 10);

            switch (payload.actionId) {
              case TabActionId.SWITCH:
                return switchToTab(tabId);

              case TabActionId.CLOSE:
                return closeTab(tabId);

              case TabActionId.MUTE:
                return muteTab(tabId, !payload.metadata?.muted);

              case TabActionId.PIN:
                return pinTab(tabId, !payload.metadata?.pinned);

              case TabActionId.CLOSE_OTHERS:
                return closeOtherTabs(tabId);

              case TabActionId.CLOSE_GROUP:
                return closeTabGroup(tabId);

              case TabActionId.CLOSE_OTHER_GROUPS:
                return closeOtherTabGroups(tabId);

              case TabActionId.BOOKMARK:
                return addTabToBookmarks(tabId);

              default:
                return {
                  success: false,
                  error: TAB_MESSAGES.UNKNOWN_ACTION(
                    commandId,
                    payload.actionId || ''
                  ),
                };
            }
          }

          return {
            success: false,
            error: TAB_MESSAGES.UNKNOWN_ACTION(
              commandId,
              payload.actionId || ''
            ),
          };
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : TAB_MESSAGES.ACTION_FAILED,
      };
    }
  }
}

export default TabExtension;
