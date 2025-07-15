import type { Command } from '@/types/extension';

import {
  createEmptyResult,
  createErrorResult,
  createSuccessResult,
  findCommandByAlias,
  parseCommand,
  parseCommandId,
  safeSearchRequest,
} from '../searchUtils';

describe('searchUtils', () => {
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

    it('should handle symbols in alias', () => {
      expect(parseCommand('> search')).toEqual({
        alias: '>',
        searchTerm: 'search',
      });
      expect(parseCommand('! command')).toEqual({
        alias: '!',
        searchTerm: 'command',
      });
      expect(parseCommand('@ test')).toEqual({
        alias: '@',
        searchTerm: 'test',
      });
    });

    it('should handle empty input', () => {
      expect(parseCommand('')).toEqual({ searchTerm: '' });
      expect(parseCommand('   ')).toEqual({ searchTerm: '' });
    });
  });

  describe('parseCommandId', () => {
    it('should parse command ID correctly', () => {
      const result = parseCommandId('extension.command');
      expect(result).toEqual({
        extensionId: 'extension',
        commandId: 'command',
      });
    });

    it('should handle command ID with multiple dots', () => {
      const result = parseCommandId('core.search-commands');
      expect(result).toEqual({
        extensionId: 'core',
        commandId: 'search-commands',
      });
    });
  });

  describe('result creators', () => {
    it('should create empty result', () => {
      const result = createEmptyResult();
      expect(result).toEqual({
        results: [],
        loading: false,
      });
    });

    it('should create error result', () => {
      const result = createErrorResult('Test error');
      expect(result).toEqual({
        results: [],
        loading: false,
        error: 'Test error',
      });
    });

    it('should create success result without active extension', () => {
      const mockResults = [
        {
          id: 'test-1',
          title: 'Test Result',
          description: 'Test description',
          type: 'tab',
          actions: [],
        },
      ];

      const result = createSuccessResult(mockResults);
      expect(result).toEqual({
        results: mockResults,
        loading: false,
        activeExtension: undefined,
        activeCommand: undefined,
      });
    });

    it('should create success result with active extension', () => {
      const mockResults = [
        {
          id: 'test-1',
          title: 'Test Result',
          description: 'Test description',
          type: 'tab',
          actions: [],
        },
      ];

      const result = createSuccessResult(mockResults, 'tab', 'search');
      expect(result).toEqual({
        results: mockResults,
        loading: false,
        activeExtension: 'tab',
        activeCommand: 'search',
      });
    });
  });

  describe('findCommandByAlias', () => {
    const mockCommands: Command[] = [
      {
        id: 'tab.search',
        name: 'Search Tabs',
        description: 'Search tabs',
        alias: ['t', 'tab', 'tabs'],
        type: 'search',
      },
      {
        id: 'history.search',
        name: 'Search History',
        description: 'Search history',
        alias: ['h', 'history'],
        type: 'search',
      },
    ];

    it('should find command by alias', () => {
      const result = findCommandByAlias('t', mockCommands);
      expect(result).toEqual(mockCommands[0]);
    });

    it('should find command by case-insensitive alias', () => {
      const result = findCommandByAlias('TAB', mockCommands);
      expect(result).toEqual(mockCommands[0]);
    });

    it('should return undefined for unknown alias', () => {
      const result = findCommandByAlias('unknown', mockCommands);
      expect(result).toBeUndefined();
    });

    it('should return undefined when command has no aliases', () => {
      const commandsWithoutAlias: Command[] = [
        {
          id: 'test.command',
          name: 'Test Command',
          description: 'Test',
          type: 'action',
        },
      ];

      const result = findCommandByAlias('test', commandsWithoutAlias);
      expect(result).toBeUndefined();
    });
  });

  describe('safeSearchRequest', () => {
    const mockBroker = {
      sendSearchRequest: jest.fn(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return data on successful response', async () => {
      const mockData = [
        {
          id: 'test-1',
          title: 'Test',
          description: 'Test description',
          type: 'tab',
          actions: [],
        },
      ];

      mockBroker.sendSearchRequest.mockResolvedValue({
        success: true,
        data: mockData,
      });

      const result = await safeSearchRequest(
        mockBroker,
        'tab',
        'search',
        'test query'
      );

      expect(result).toEqual(mockData);
      expect(mockBroker.sendSearchRequest).toHaveBeenCalledWith(
        'tab',
        'search',
        'test query'
      );
    });

    it('should return empty array on failed response', async () => {
      mockBroker.sendSearchRequest.mockResolvedValue({
        success: false,
        error: 'Search failed',
      });

      const result = await safeSearchRequest(
        mockBroker,
        'tab',
        'search',
        'test query'
      );

      expect(result).toEqual([]);
    });

    it('should return empty array on exception', async () => {
      mockBroker.sendSearchRequest.mockRejectedValue(
        new Error('Network error')
      );

      const result = await safeSearchRequest(
        mockBroker,
        'tab',
        'search',
        'test query'
      );

      expect(result).toEqual([]);
    });

    it('should return empty array when response has no data', async () => {
      mockBroker.sendSearchRequest.mockResolvedValue({
        success: true,
      });

      const result = await safeSearchRequest(
        mockBroker,
        'tab',
        'search',
        'test query'
      );

      expect(result).toEqual([]);
    });
  });
});
