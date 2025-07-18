import type { ActionPayload, SearchPayload } from '@/types/extension';

import * as actions from '../actions';
import { getCurrentActiveTab } from '../actions';
import { TAB_MESSAGES, TabActionId, TabCommandId } from '../constants';
import TabExtension from '../extension';
import * as search from '../search';

// Mock the actions module
jest.mock('../actions');
jest.mock('../search');

// Mock chrome APIs
const mockChrome = {
  tabs: {
    query: jest.fn(),
  },
  runtime: {
    lastError: null,
    getURL: jest.fn((path: string) => `chrome-extension://test/${path}`),
  },
};

// Mock chrome.tabs.query as a promise
(mockChrome.tabs.query as jest.Mock).mockImplementation(() =>
  Promise.resolve([])
);

global.chrome = mockChrome as any;

describe('TabExtension', () => {
  let extension: TabExtension;

  beforeEach(() => {
    jest.clearAllMocks();
    extension = new TabExtension();
    mockChrome.runtime.lastError = null;
  });

  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      expect(extension.id).toBe('tab');
      expect(extension.name).toBe('Tab Manager');
      expect(extension.description).toBe(
        'Search, switch, and manage browser tabs'
      );
      expect(extension.commands).toHaveLength(6);
    });

    it('should have correct command definitions', () => {
      const { commands } = extension;

      expect(commands[0]).toEqual({
        id: TabCommandId.SEARCH,
        name: 'Search Tabs',
        description: 'Search through open browser tabs',
        alias: ['t', 'tab', 'tabs'],
        type: 'search',
        placeholder: 'Search tabs...',
      });

      expect(commands[1]).toEqual({
        id: TabCommandId.CLOSE_ALL_DUPLICATES,
        name: 'Close Duplicate Tabs',
        description: 'Close all duplicate tabs keeping only one instance',
        alias: ['dup', 'duplicates'],
        type: 'action',
      });

      expect(commands[2]).toEqual({
        id: TabCommandId.GROUP_BY_DOMAIN,
        name: 'Group Tabs by Domain',
        description: 'Group tabs by their domain',
        alias: ['group', 'gd'],
        type: 'action',
      });
    });
  });

  describe('handleSearch', () => {
    it('should handle search command successfully', async () => {
      const mockTabs = [
        { id: 1, title: 'Tab 1', url: 'https://example.com' },
        { id: 2, title: 'Tab 2', url: 'https://google.com' },
      ];

      const mockResults = [
        { id: 'tab-1', title: 'Tab 1', description: 'example.com' },
        { id: 'tab-2', title: 'Tab 2', description: 'google.com' },
      ];

      (search.searchTabs as jest.Mock).mockResolvedValue(mockTabs);
      (search.tabToSearchResult as jest.Mock).mockImplementation(
        (tab: any) => ({
          id: `tab-${tab.id}`,
          title: tab.title,
          description: tab.url.includes('example')
            ? 'example.com'
            : 'google.com',
        })
      );

      const payload: SearchPayload = { query: 'test' };
      const result = await extension.handleSearch(TabCommandId.SEARCH, payload);

      expect(search.searchTabs).toHaveBeenCalledWith('test');
      expect(search.tabToSearchResult).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        success: true,
        data: mockResults,
      });
    });

    it('should handle unknown command', async () => {
      const payload: SearchPayload = { query: 'test' };
      const result = await extension.handleSearch('unknown-command', payload);

      expect(result).toEqual({
        success: false,
        error: TAB_MESSAGES.UNKNOWN_COMMAND('unknown-command'),
      });
    });

    it('should handle search error', async () => {
      (search.searchTabs as jest.Mock).mockRejectedValue(
        new Error('Search failed')
      );

      const payload: SearchPayload = { query: 'test' };
      const result = await extension.handleSearch(TabCommandId.SEARCH, payload);

      expect(result).toEqual({
        success: false,
        error: 'Search failed',
      });
    });

    it('should handle non-Error exceptions', async () => {
      (search.searchTabs as jest.Mock).mockRejectedValue('String error');

      const payload: SearchPayload = { query: 'test' };
      const result = await extension.handleSearch(TabCommandId.SEARCH, payload);

      expect(result).toEqual({
        success: false,
        error: TAB_MESSAGES.SEARCH_FAILED,
      });
    });
  });

  describe('handleAction', () => {
    describe('command actions', () => {
      it('should handle close all duplicates command', async () => {
        (actions.closeAllDuplicates as jest.Mock).mockResolvedValue({
          success: true,
          data: { message: 'Duplicates closed' },
        });

        const payload: ActionPayload = { resultId: '', actionId: '' };
        const result = await extension.handleAction(
          TabCommandId.CLOSE_ALL_DUPLICATES,
          payload
        );

        expect(actions.closeAllDuplicates).toHaveBeenCalled();
        expect(result).toEqual({
          success: true,
          data: { message: 'Duplicates closed' },
        });
      });

      it('should handle group by domain command', async () => {
        (actions.groupTabsByDomain as jest.Mock).mockResolvedValue({
          success: true,
          data: { message: 'Groups created' },
        });

        const payload: ActionPayload = { resultId: '', actionId: '' };
        const result = await extension.handleAction(
          TabCommandId.GROUP_BY_DOMAIN,
          payload
        );

        expect(actions.groupTabsByDomain).toHaveBeenCalled();
        expect(result).toEqual({
          success: true,
          data: { message: 'Groups created' },
        });
      });

      it('should handle close group command with active tab', async () => {
        const mockActiveTab = { id: 123, windowId: 456 };
        (getCurrentActiveTab as jest.Mock).mockResolvedValue(mockActiveTab);

        (actions.closeTabGroup as jest.Mock).mockResolvedValue({
          success: true,
          data: { message: 'Group closed' },
        });

        const payload: ActionPayload = { resultId: '', actionId: '' };
        const result = await extension.handleAction(
          TabCommandId.CLOSE_GROUP,
          payload
        );

        expect(getCurrentActiveTab).toHaveBeenCalled();
        expect(actions.closeTabGroup).toHaveBeenCalledWith(123);
        expect(result).toEqual({
          success: true,
          data: { message: 'Group closed' },
        });
      });

      it('should handle close group command without active tab', async () => {
        (getCurrentActiveTab as jest.Mock).mockResolvedValue(null);

        const payload: ActionPayload = { resultId: '', actionId: '' };
        const result = await extension.handleAction(
          TabCommandId.CLOSE_GROUP,
          payload
        );

        expect(getCurrentActiveTab).toHaveBeenCalled();
        expect(result).toEqual({
          success: false,
          error: 'No active tab found',
        });
      });

      it('should handle close other groups command', async () => {
        const mockActiveTab = { id: 123, windowId: 456 };
        (getCurrentActiveTab as jest.Mock).mockResolvedValue(mockActiveTab);

        (actions.closeOtherTabGroups as jest.Mock).mockResolvedValue({
          success: true,
          data: { message: 'Other groups closed' },
        });

        const payload: ActionPayload = { resultId: '', actionId: '' };
        const result = await extension.handleAction(
          TabCommandId.CLOSE_OTHER_GROUPS,
          payload
        );

        expect(getCurrentActiveTab).toHaveBeenCalled();
        expect(actions.closeOtherTabGroups).toHaveBeenCalledWith(123);
        expect(result).toEqual({
          success: true,
          data: { message: 'Other groups closed' },
        });
      });

      it('should handle close other tabs command', async () => {
        const mockActiveTab = { id: 123, windowId: 456 };
        (getCurrentActiveTab as jest.Mock).mockResolvedValue(mockActiveTab);

        (actions.closeOtherTabs as jest.Mock).mockResolvedValue({
          success: true,
          data: { message: 'Other tabs closed' },
        });

        const payload: ActionPayload = { resultId: '', actionId: '' };
        const result = await extension.handleAction(
          TabCommandId.CLOSE_OTHER_TABS,
          payload
        );

        expect(getCurrentActiveTab).toHaveBeenCalled();
        expect(actions.closeOtherTabs).toHaveBeenCalledWith(123);
        expect(result).toEqual({
          success: true,
          data: { message: 'Other tabs closed' },
        });
      });
    });

    describe('tab-specific actions', () => {
      it('should handle switch action', async () => {
        (actions.switchToTab as jest.Mock).mockResolvedValue({
          success: true,
        });

        const payload: ActionPayload = {
          resultId: 'tab-123',
          actionId: TabActionId.SWITCH,
        };
        const result = await extension.handleAction('unknown-command', payload);

        expect(actions.switchToTab).toHaveBeenCalledWith(123);
        expect(result).toEqual({ success: true });
      });

      it('should handle close action', async () => {
        (actions.closeTab as jest.Mock).mockResolvedValue({
          success: true,
        });

        const payload: ActionPayload = {
          resultId: 'tab-456',
          actionId: TabActionId.CLOSE,
        };
        const result = await extension.handleAction('unknown-command', payload);

        expect(actions.closeTab).toHaveBeenCalledWith(456);
        expect(result).toEqual({ success: true });
      });

      it('should handle mute action', async () => {
        (actions.muteTab as jest.Mock).mockResolvedValue({
          success: true,
        });

        const payload: ActionPayload = {
          resultId: 'tab-789',
          actionId: TabActionId.MUTE,
          metadata: { muted: false },
        };
        const result = await extension.handleAction('unknown-command', payload);

        expect(actions.muteTab).toHaveBeenCalledWith(789, true);
        expect(result).toEqual({ success: true });
      });

      it('should handle pin action', async () => {
        (actions.pinTab as jest.Mock).mockResolvedValue({
          success: true,
        });

        const payload: ActionPayload = {
          resultId: 'tab-101',
          actionId: TabActionId.PIN,
          metadata: { pinned: false },
        };
        const result = await extension.handleAction('unknown-command', payload);

        expect(actions.pinTab).toHaveBeenCalledWith(101, true);
        expect(result).toEqual({ success: true });
      });

      it('should handle close others action', async () => {
        (actions.closeOtherTabs as jest.Mock).mockResolvedValue({
          success: true,
        });

        const payload: ActionPayload = {
          resultId: 'tab-202',
          actionId: TabActionId.CLOSE_OTHERS,
        };
        const result = await extension.handleAction('unknown-command', payload);

        expect(actions.closeOtherTabs).toHaveBeenCalledWith(202);
        expect(result).toEqual({ success: true });
      });

      it('should handle close group action', async () => {
        (actions.closeTabGroup as jest.Mock).mockResolvedValue({
          success: true,
        });

        const payload: ActionPayload = {
          resultId: 'tab-303',
          actionId: TabActionId.CLOSE_GROUP,
        };
        const result = await extension.handleAction('unknown-command', payload);

        expect(actions.closeTabGroup).toHaveBeenCalledWith(303);
        expect(result).toEqual({ success: true });
      });

      it('should handle close other groups action', async () => {
        (actions.closeOtherTabGroups as jest.Mock).mockResolvedValue({
          success: true,
        });

        const payload: ActionPayload = {
          resultId: 'tab-404',
          actionId: TabActionId.CLOSE_OTHER_GROUPS,
        };
        const result = await extension.handleAction('unknown-command', payload);

        expect(actions.closeOtherTabGroups).toHaveBeenCalledWith(404);
        expect(result).toEqual({ success: true });
      });

      it('should handle bookmark action', async () => {
        (actions.addTabToBookmarks as jest.Mock).mockResolvedValue({
          success: true,
        });

        const payload: ActionPayload = {
          resultId: 'tab-505',
          actionId: TabActionId.BOOKMARK,
        };
        const result = await extension.handleAction('unknown-command', payload);

        expect(actions.addTabToBookmarks).toHaveBeenCalledWith(505);
        expect(result).toEqual({ success: true });
      });

      it('should handle unknown action', async () => {
        const payload: ActionPayload = {
          resultId: 'tab-606',
          actionId: 'unknown-action' as any,
        };
        const result = await extension.handleAction('unknown-command', payload);

        expect(result).toEqual({
          success: false,
          error: TAB_MESSAGES.UNKNOWN_ACTION(
            'unknown-command',
            'unknown-action'
          ),
        });
      });

      it('should handle missing result ID', async () => {
        const payload: ActionPayload = {
          resultId: '',
          actionId: TabActionId.SWITCH,
        };
        const result = await extension.handleAction('unknown-command', payload);

        expect(result).toEqual({
          success: false,
          error: TAB_MESSAGES.UNKNOWN_ACTION(
            'unknown-command',
            TabActionId.SWITCH
          ),
        });
      });

      it('should handle action with resultId but no actionId', async () => {
        const payload: ActionPayload = {
          resultId: 'tab-707',
          actionId: '',
        };
        const result = await extension.handleAction('unknown-command', payload);

        expect(result).toEqual({
          success: false,
          error: TAB_MESSAGES.UNKNOWN_ACTION('unknown-command', ''),
        });
      });
    });
  });
});
