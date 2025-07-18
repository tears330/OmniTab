import type { Command } from '@/types/extension';

import {
  ActionLabel,
  ActionShortcut,
  CoreCommandType,
  SearchResultType,
} from '../constants';
import {
  commandToSearchResult,
  handleCoreSearch,
  searchCommands,
  searchHelpCommands,
} from '../search';

describe('Core Extension Search', () => {
  describe('commandToSearchResult', () => {
    it('should convert command to search result', () => {
      const command: Command = {
        id: 'test-cmd',
        name: 'Test Command',
        description: 'A test command',
        type: CoreCommandType.ACTION,
        icon: 'test-icon.png',
        alias: ['tc'],
      };

      const result = commandToSearchResult(command);

      expect(result).toEqual({
        id: 'test-cmd',
        title: 'Test Command',
        description: 'A test command',
        icon: 'test-icon.png',
        type: SearchResultType.COMMAND,
        actions: [
          {
            id: ActionLabel.SELECT.toLowerCase(),
            label: ActionLabel.SELECT,
            shortcut: ActionShortcut.ENTER,
            primary: true,
          },
        ],
        metadata: { command },
      });
    });

    it('should handle command without optional fields', () => {
      const command: Command = {
        id: 'minimal-cmd',
        name: 'Minimal Command',
        type: CoreCommandType.ACTION,
      };

      const result = commandToSearchResult(command);

      expect(result).toEqual({
        id: 'minimal-cmd',
        title: 'Minimal Command',
        description: '',
        icon: undefined,
        type: SearchResultType.COMMAND,
        actions: [
          {
            id: ActionLabel.SELECT.toLowerCase(),
            label: ActionLabel.SELECT,
            shortcut: ActionShortcut.ENTER,
            primary: true,
          },
        ],
        metadata: { command },
      });
    });
  });

  describe('searchCommands', () => {
    const mockCommands: Command[] = [
      {
        id: 'help',
        name: 'Help Command',
        description: 'Show help information',
        type: CoreCommandType.ACTION,
        alias: ['h', 'help'],
      },
      {
        id: 'search',
        name: 'Search Command',
        description: 'Search for items',
        type: CoreCommandType.SEARCH,
        alias: ['s', 'find'],
      },
      {
        id: 'reload',
        name: 'Reload Extensions',
        description: 'Reload all extensions',
        type: CoreCommandType.ACTION,
        alias: ['r', 'reload'],
      },
    ];

    it('should filter commands by name', () => {
      const results = searchCommands('help', mockCommands);

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Help Command');
    });

    it('should filter commands by description', () => {
      const results = searchCommands('extensions', mockCommands);

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Reload Extensions');
    });

    it('should filter commands by alias', () => {
      const results = searchCommands('reload', mockCommands);

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Reload Extensions');
    });

    it('should include search type commands', () => {
      const results = searchCommands('search', mockCommands);

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Search Command');
    });

    it('should perform case-insensitive search', () => {
      const results = searchCommands('HELP', mockCommands);

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Help Command');
    });

    it('should return empty array when no matches found', () => {
      const results = searchCommands('nonexistent', mockCommands);

      expect(results).toHaveLength(0);
    });

    it('should return all commands when query is empty', () => {
      const results = searchCommands('', mockCommands);

      expect(results).toHaveLength(3);
      expect(results.map((r) => r.title)).toEqual([
        'Help Command',
        'Search Command',
        'Reload Extensions',
      ]);
    });
  });

  describe('searchHelpCommands', () => {
    const mockCommands: Command[] = [
      {
        id: 'core.help',
        name: 'Help Command',
        description: 'Show help information',
        type: CoreCommandType.SEARCH,
        alias: ['h', 'help'],
      },
      {
        id: 'core.search',
        name: 'Search Command',
        description: 'Search for items',
        type: CoreCommandType.SEARCH,
        alias: ['s', 'find'],
      },
      {
        id: 'core.reload',
        name: 'Reload Extensions',
        description: 'Reload all extensions',
        type: CoreCommandType.ACTION,
        alias: ['r', 'reload'],
      },
      {
        id: 'tab.search-tab',
        name: 'Search Tabs',
        description: 'Search browser tabs',
        type: CoreCommandType.SEARCH,
        alias: ['t', 'tab'],
      },
    ];

    it('should return only search commands excluding help when query is empty', () => {
      const results = searchHelpCommands('', mockCommands);

      expect(results).toHaveLength(2);
      expect(results.map((r) => r.id)).toEqual([
        'core.search',
        'tab.search-tab',
      ]);
    });

    it('should return empty array when query is not empty', () => {
      const results = searchHelpCommands('test', mockCommands);
      expect(results).toHaveLength(0);
    });

    it('should treat query with only spaces as empty', () => {
      const results = searchHelpCommands('   ', mockCommands);
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.id)).toEqual([
        'core.search',
        'tab.search-tab',
      ]);
    });

    it('should use alias as title when available', () => {
      const results = searchHelpCommands('', mockCommands);

      expect(results[0].title).toBe('s'); // First alias of search command
      expect(results[1].title).toBe('t'); // First alias of tab.search command
    });

    it('should use command name as title when no alias', () => {
      const commandsNoAlias: Command[] = [
        {
          id: 'test.search',
          name: 'Test Search',
          description: 'Test search command',
          type: CoreCommandType.SEARCH,
        },
      ];

      const results = searchHelpCommands('', commandsNoAlias);
      expect(results[0].title).toBe('Test Search');
    });

    it('should exclude action type commands', () => {
      const results = searchHelpCommands('', mockCommands);

      const actionCommands = results.filter((r) => r.id === 'core.reload');
      expect(actionCommands).toHaveLength(0);
    });
  });

  describe('handleCoreSearch', () => {
    const mockCommands: Command[] = [
      {
        id: 'help',
        name: 'Help Command',
        description: 'Show help information',
        type: CoreCommandType.ACTION,
        alias: ['h', 'help'],
      },
      {
        id: 'search',
        name: 'Search Command',
        description: 'Search for items',
        type: CoreCommandType.SEARCH,
        alias: ['s', 'find'],
      },
    ];

    it('should handle search-commands command', () => {
      const results = handleCoreSearch('search-commands', 'help', mockCommands);

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Help Command');
    });

    it('should handle help command with empty query', () => {
      const results = handleCoreSearch('help', '', mockCommands);

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('s');
    });

    it('should handle help command with non-empty query', () => {
      const results = handleCoreSearch('help', 'test', mockCommands);

      expect(results).toHaveLength(0);
    });

    it('should return empty array for unknown command', () => {
      const results = handleCoreSearch('unknown', '', mockCommands);

      expect(results).toHaveLength(0);
    });
  });
});
