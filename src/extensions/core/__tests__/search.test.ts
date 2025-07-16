import type { Command } from '@/types/extension';

import {
  ActionLabel,
  ActionShortcut,
  CoreCommandType,
  SearchResultType,
} from '../constants';
import { commandToSearchResult, searchCommands } from '../search';

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
      const results = searchCommands('h', mockCommands);

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Help Command');
    });

    it('should exclude search type commands', () => {
      const results = searchCommands('search', mockCommands);

      expect(results).toHaveLength(0);
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

    it('should return all non-search commands when query is empty', () => {
      const results = searchCommands('', mockCommands);

      expect(results).toHaveLength(2);
      expect(results.map((r) => r.title)).toEqual([
        'Help Command',
        'Reload Extensions',
      ]);
    });
  });
});
