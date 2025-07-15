import type { BaseExtension } from '@/services/extensionRegistry';
import type { Command } from '@/types/extension';

import { createCommandResult, parseCommand } from '../commandUtils';

describe('commandUtils', () => {
  describe('parseCommand', () => {
    it('should return only searchTerm when no space is present', () => {
      expect(parseCommand('github')).toEqual({ searchTerm: 'github' });
      expect(parseCommand('test')).toEqual({ searchTerm: 'test' });
      expect(parseCommand('  hello  ')).toEqual({ searchTerm: 'hello' });
    });

    it('should extract alias and searchTerm when valid alias is present', () => {
      expect(parseCommand('t github')).toEqual({
        alias: 't',
        searchTerm: 'github',
      });
      expect(parseCommand('tab search term')).toEqual({
        alias: 'tab',
        searchTerm: 'search term',
      });
      expect(parseCommand('h-1 history search')).toEqual({
        alias: 'h-1',
        searchTerm: 'history search',
      });
      expect(parseCommand('b_mark bookmarks')).toEqual({
        alias: 'b_mark',
        searchTerm: 'bookmarks',
      });
    });

    it('should handle alias with empty search term', () => {
      expect(parseCommand('t ')).toEqual({
        alias: 't',
        searchTerm: '',
      });
      expect(parseCommand('tab    ')).toEqual({
        alias: 'tab',
        searchTerm: '',
      });
    });

    it('should handle multiple spaces in search term', () => {
      expect(parseCommand('t   multiple   spaces')).toEqual({
        alias: 't',
        searchTerm: 'multiple   spaces',
      });
    });

    it('should not treat long first parts as alias', () => {
      expect(parseCommand('verylongword search')).toEqual({
        searchTerm: 'verylongword search',
      });
      expect(parseCommand('12345678901 search')).toEqual({
        searchTerm: '12345678901 search',
      });
    });

    it('should not treat invalid characters as alias', () => {
      expect(parseCommand('t@b search')).toEqual({
        searchTerm: 't@b search',
      });
      expect(parseCommand('t.ab search')).toEqual({
        searchTerm: 't.ab search',
      });
      expect(parseCommand('t!ab search')).toEqual({
        searchTerm: 't!ab search',
      });
    });

    it('should handle empty input', () => {
      expect(parseCommand('')).toEqual({ searchTerm: '' });
      expect(parseCommand('   ')).toEqual({ searchTerm: '' });
    });
  });

  describe('createCommandResult', () => {
    const mockExtension: BaseExtension = {
      id: 'test-ext',
      name: 'Test Extension',
      description: 'Test extension description',
      icon: 'test-icon.png',
      commands: [],
      initialize: jest.fn(),
      destroy: jest.fn(),
      handleSearch: jest.fn(),
      handleAction: jest.fn(),
    } as unknown as BaseExtension;

    const mockCommand: Command = {
      id: 'search',
      name: 'Search Test',
      description: 'Search test command',
      type: 'search',
      alias: ['t', 'test'],
    };

    it('should create a command result with all fields', () => {
      const result = createCommandResult(mockExtension, mockCommand, 0);

      expect(result).toEqual({
        id: 'test-ext.search',
        title: 'Search Test',
        description: 'Search test command',
        icon: 'test-icon.png',
        type: 'command',
        actions: [
          {
            id: 'select',
            label: 'Select',
            shortcut: 'Enter',
            primary: true,
          },
        ],
        metadata: {
          extensionId: 'test-ext',
          commandId: 'search',
          commandType: 'search',
          alias: ['t', 'test'],
        },
      });
    });

    it('should use extension icon when command icon is not provided', () => {
      const commandWithoutIcon = { ...mockCommand, icon: undefined };
      const result = createCommandResult(mockExtension, commandWithoutIcon, 1);

      expect(result.icon).toBe('test-icon.png');
    });

    it('should use command icon when provided', () => {
      const commandWithIcon = { ...mockCommand, icon: 'command-icon.png' };
      const result = createCommandResult(mockExtension, commandWithIcon, 1);

      expect(result.icon).toBe('command-icon.png');
    });

    it('should generate description when not provided', () => {
      const commandWithoutDescription = {
        ...mockCommand,
        description: undefined,
      };
      const result = createCommandResult(
        mockExtension,
        commandWithoutDescription,
        2
      );

      expect(result.description).toBe('Test Extension - search command');
    });

    it('should handle action type commands', () => {
      const actionCommand: Command = {
        id: 'close-all',
        name: 'Close All',
        type: 'action',
      };
      const result = createCommandResult(mockExtension, actionCommand, 3);

      expect(result.description).toBe('Test Extension - action command');
      expect(result.metadata?.commandType).toBe('action');
    });

    it('should handle extension without icon', () => {
      const extensionWithoutIcon = {
        ...mockExtension,
        icon: undefined,
      } as BaseExtension;
      const result = createCommandResult(extensionWithoutIcon, mockCommand, 4);

      expect(result.icon).toBeUndefined();
    });
  });
});
