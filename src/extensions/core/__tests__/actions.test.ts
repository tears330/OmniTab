import { ExtensionRegistry } from '@/services/extensionRegistry';

import {
  getCommands,
  handleSearchCommands,
  reloadExtensions,
  showHelp,
} from '../actions';
import { CORE_MESSAGES } from '../constants';

// Mock chrome APIs
const mockChrome = {
  tabs: {
    create: jest.fn(),
  },
  runtime: {
    getURL: jest.fn(),
    lastError: null,
  },
};

// Mock ExtensionRegistry
jest.mock('@/services/extensionRegistry', () => ({
  ExtensionRegistry: {
    getInstance: jest.fn(),
  },
}));

global.chrome = mockChrome as any;

describe('Core Extension Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockChrome.runtime.lastError = null;
    mockChrome.runtime.getURL.mockReturnValue(
      'chrome-extension://id/help.html'
    );
  });

  describe('showHelp', () => {
    it('should create a new tab with help URL', async () => {
      const result = await showHelp();

      expect(mockChrome.tabs.create).toHaveBeenCalledWith({
        url: 'chrome-extension://id/help.html',
      });
      expect(result).toEqual({
        success: true,
        data: { message: CORE_MESSAGES.HELP_OPENING },
      });
    });

    it('should handle chrome API errors', async () => {
      (mockChrome.runtime as any).lastError = {
        message: 'Tab creation failed',
      };

      const result = await showHelp();

      expect(result).toEqual({
        success: true,
        data: { message: CORE_MESSAGES.HELP_OPENING },
      });
    });
  });

  describe('reloadExtensions', () => {
    it('should return success message', async () => {
      const result = await reloadExtensions();

      expect(result).toEqual({
        success: true,
        data: { message: CORE_MESSAGES.EXTENSIONS_RELOADED },
      });
    });
  });

  describe('getCommands', () => {
    it('should return all commands from registry', async () => {
      const mockCommands = [
        { id: 'cmd1', name: 'Command 1', description: 'Test command' },
        { id: 'cmd2', name: 'Command 2', description: 'Another command' },
      ];

      const mockRegistry = {
        getAllCommands: jest.fn().mockReturnValue(mockCommands),
      };

      (ExtensionRegistry.getInstance as jest.Mock).mockReturnValue(
        mockRegistry
      );

      const result = await getCommands();

      expect(mockRegistry.getAllCommands).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        data: { commands: mockCommands },
      });
    });
  });

  describe('handleSearchCommands', () => {
    it('should return search commands usage message', async () => {
      const result = await handleSearchCommands();

      expect(result).toEqual({
        success: true,
        data: { message: CORE_MESSAGES.SEARCH_COMMANDS_USAGE },
      });
    });
  });
});
