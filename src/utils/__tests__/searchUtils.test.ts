import {
  buildCommandId,
  createEmptyResult,
  createErrorResult,
  createSuccessResult,
  parseCommand,
  parseCommandId,
  parseCommandWithNonSpace,
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

    it('should handle special characters that are not valid aliases', () => {
      expect(parseCommand('♦ search')).toEqual({
        searchTerm: '♦ search',
      });
      expect(parseCommand('🔍 search')).toEqual({
        searchTerm: '🔍 search',
      });
      expect(parseCommand('中文 search')).toEqual({
        searchTerm: '中文 search',
      });
    });

    it('should handle boundary length aliases', () => {
      // 10 characters exactly (should be valid)
      expect(parseCommand('abcdefghij search')).toEqual({
        alias: 'abcdefghij',
        searchTerm: 'search',
      });

      // 11 characters (should not be valid alias)
      expect(parseCommand('abcdefghijk search')).toEqual({
        searchTerm: 'abcdefghijk search',
      });
    });

    it('should handle single character aliases', () => {
      expect(parseCommand('a search')).toEqual({
        alias: 'a',
        searchTerm: 'search',
      });
      expect(parseCommand('1 search')).toEqual({
        alias: '1',
        searchTerm: 'search',
      });
    });
  });

  describe('parseCommandWithNonSpace', () => {
    const mockCommands = [
      { alias: ['>'], immediateAlias: true },
      { alias: ['t', 'tab'] }, // default behavior (requires space)
      { alias: ['h', 'history'] }, // default behavior (requires space)
      { alias: ['close'], immediateAlias: true },
    ];

    it('should match immediate aliases first', () => {
      expect(parseCommandWithNonSpace('>help', mockCommands)).toEqual({
        alias: '>',
        searchTerm: 'help',
      });
      expect(parseCommandWithNonSpace('>close tab', mockCommands)).toEqual({
        alias: '>',
        searchTerm: 'close tab',
      });
      expect(parseCommandWithNonSpace('closeall', mockCommands)).toEqual({
        alias: 'close',
        searchTerm: 'all',
      });
    });

    it('should handle empty search term with immediate aliases', () => {
      expect(parseCommandWithNonSpace('>', mockCommands)).toEqual({
        alias: '>',
        searchTerm: '',
      });
      expect(parseCommandWithNonSpace('close', mockCommands)).toEqual({
        alias: 'close',
        searchTerm: '',
      });
    });

    it('should fall back to space-based parsing for space-required aliases', () => {
      expect(parseCommandWithNonSpace('t github', mockCommands)).toEqual({
        alias: 't',
        searchTerm: 'github',
      });
      expect(parseCommandWithNonSpace('history search', mockCommands)).toEqual({
        alias: 'history',
        searchTerm: 'search',
      });
    });

    it('should return no alias when no match is found', () => {
      expect(parseCommandWithNonSpace('xyz search', mockCommands)).toEqual({
        alias: 'xyz',
        searchTerm: 'search',
      });
    });

    it('should handle case insensitive matching', () => {
      expect(parseCommandWithNonSpace('>HELP', mockCommands)).toEqual({
        alias: '>',
        searchTerm: 'HELP',
      });
      expect(parseCommandWithNonSpace('CLOSE all', mockCommands)).toEqual({
        alias: 'close',
        searchTerm: 'all',
      });
    });

    it('should handle commands with no aliases', () => {
      const commandsWithNoAlias = [
        { alias: undefined, immediateAlias: true },
        { alias: [] }, // empty array
        { alias: ['t', 'tab'] },
      ];

      expect(
        parseCommandWithNonSpace('test query', commandsWithNoAlias)
      ).toEqual({
        alias: 'test',
        searchTerm: 'query',
      });
    });

    it('should handle empty commands array', () => {
      expect(parseCommandWithNonSpace('test query', [])).toEqual({
        alias: 'test',
        searchTerm: 'query',
      });
    });

    it('should handle overlapping aliases (longest match first)', () => {
      const overlappingCommands = [
        { alias: ['close'], immediateAlias: true },
        { alias: ['closetab'], immediateAlias: true },
        { alias: ['c'], immediateAlias: true },
      ];

      expect(parseCommandWithNonSpace('closetab', overlappingCommands)).toEqual(
        {
          alias: 'close',
          searchTerm: 'tab',
        }
      );
    });

    it('should handle queries that start with whitespace', () => {
      expect(parseCommandWithNonSpace('  > help', mockCommands)).toEqual({
        searchTerm: '> help',
      });
    });
  });

  describe('buildCommandId', () => {
    it('should build command ID correctly', () => {
      const result = buildCommandId('extension', 'command');
      expect(result).toBe('extension.command');
    });

    it('should handle command IDs with dots', () => {
      const result = buildCommandId('extension', 'sub.command');
      expect(result).toBe('extension.sub.command');
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

    it('should handle command ID with no dots', () => {
      const result = parseCommandId('singlecommand');
      expect(result).toEqual({
        extensionId: 'singlecommand',
        commandId: undefined,
      });
    });

    it('should handle command ID with many dots', () => {
      const result = parseCommandId('extension.sub.command.nested');
      expect(result).toEqual({
        extensionId: 'extension',
        commandId: 'sub',
      });
    });

    it('should handle empty command ID', () => {
      const result = parseCommandId('');
      expect(result).toEqual({
        extensionId: '',
        commandId: undefined,
      });
    });

    it('should handle command ID starting with dot', () => {
      const result = parseCommandId('.command');
      expect(result).toEqual({
        extensionId: '',
        commandId: 'command',
      });
    });

    it('should handle command ID ending with dot', () => {
      const result = parseCommandId('extension.');
      expect(result).toEqual({
        extensionId: 'extension',
        commandId: '',
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

    it('should create success result with empty results array', () => {
      const result = createSuccessResult([]);
      expect(result).toEqual({
        results: [],
        loading: false,
        activeExtension: undefined,
        activeCommand: undefined,
      });
    });

    it('should create error result with empty string', () => {
      const result = createErrorResult('');
      expect(result).toEqual({
        results: [],
        loading: false,
        error: '',
      });
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

    it('should return empty array when response data is null', async () => {
      mockBroker.sendSearchRequest.mockResolvedValue({
        success: true,
        data: null,
      });

      const result = await safeSearchRequest(
        mockBroker,
        'tab',
        'search',
        'test query'
      );

      expect(result).toEqual([]);
    });

    it('should return empty array when response data is undefined', async () => {
      mockBroker.sendSearchRequest.mockResolvedValue({
        success: true,
        data: undefined,
      });

      const result = await safeSearchRequest(
        mockBroker,
        'tab',
        'search',
        'test query'
      );

      expect(result).toEqual([]);
    });

    it('should handle synchronous errors gracefully', async () => {
      mockBroker.sendSearchRequest.mockImplementation(() => {
        throw new Error('Synchronous error');
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
