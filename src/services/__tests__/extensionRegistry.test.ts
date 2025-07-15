import type {
  ActionPayload,
  Command,
  ExtensionResponse,
  SearchPayload,
  SearchResponse,
} from '@/types/extension';

import { BaseExtension, ExtensionRegistry } from '../extensionRegistry';
import { getBackgroundBroker } from '../messageBroker';

// Mock the message broker
jest.mock('../messageBroker', () => ({
  getBackgroundBroker: jest.fn(() => ({
    registerExtension: jest.fn(),
    unregisterExtension: jest.fn(),
  })),
}));

// Create a concrete test extension
class TestExtension extends BaseExtension {
  id = 'test';

  name = 'Test Extension';

  description = 'A test extension';

  icon = 'test-icon.png';

  commands: Command[] = [
    {
      id: 'search',
      name: 'Test Search',
      type: 'search',
      alias: ['t', 'test'],
    },
    {
      id: 'action',
      name: 'Test Action',
      type: 'action',
    },
  ];

  handleSearch = jest.fn(
    async (): Promise<SearchResponse> => ({
      success: true,
      data: [],
    })
  );

  handleAction = jest.fn(
    async (): Promise<ExtensionResponse> => ({
      success: true,
    })
  );

  initialize = jest.fn();

  destroy = jest.fn();
}

describe('ExtensionRegistry', () => {
  let mockBroker: any;
  let registry: ExtensionRegistry;

  beforeEach(() => {
    // Reset singleton instance
    (ExtensionRegistry as any).instance = undefined;

    // Mock broker methods
    mockBroker = {
      registerExtension: jest.fn(),
      unregisterExtension: jest.fn(),
    };
    (getBackgroundBroker as jest.Mock).mockReturnValue(mockBroker);

    registry = ExtensionRegistry.getInstance();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return the same instance', () => {
      const instance1 = ExtensionRegistry.getInstance();
      const instance2 = ExtensionRegistry.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('registerExtension', () => {
    it('should register an extension successfully', async () => {
      const extension = new TestExtension();

      await registry.registerExtension(extension);

      expect(extension.initialize).toHaveBeenCalled();
      expect(mockBroker.registerExtension).toHaveBeenCalledWith('test', {
        handleSearch: expect.any(Function),
        handleAction: expect.any(Function),
      });
      expect(registry.getExtension('test')).toBe(extension);
    });

    it('should throw error when registering duplicate extension', async () => {
      const extension1 = new TestExtension();
      const extension2 = new TestExtension();

      await registry.registerExtension(extension1);

      await expect(registry.registerExtension(extension2)).rejects.toThrow(
        'Extension test is already registered'
      );
    });

    it('should register extension handlers with broker', async () => {
      const extension = new TestExtension();
      await registry.registerExtension(extension);

      // Get the registered handlers
      const registerCall = mockBroker.registerExtension.mock.calls[0];
      const handlers = registerCall[1];

      // Test search handler
      const searchPayload: SearchPayload = { query: 'test' };
      await handlers.handleSearch('search', searchPayload);
      expect(extension.handleSearch).toHaveBeenCalledWith(
        'search',
        searchPayload
      );

      // Test action handler
      const actionPayload: ActionPayload = {
        actionId: 'action',
        resultId: 'result-1',
      };
      await handlers.handleAction('action', actionPayload);
      expect(extension.handleAction).toHaveBeenCalledWith(
        'action',
        actionPayload
      );
    });
  });

  describe('unregisterExtension', () => {
    it('should unregister an extension successfully', async () => {
      const extension = new TestExtension();
      await registry.registerExtension(extension);

      await registry.unregisterExtension('test');

      expect(extension.destroy).toHaveBeenCalled();
      expect(mockBroker.unregisterExtension).toHaveBeenCalledWith('test');
      expect(registry.getExtension('test')).toBeUndefined();
    });

    it('should do nothing when unregistering non-existent extension', async () => {
      await registry.unregisterExtension('non-existent');

      expect(mockBroker.unregisterExtension).not.toHaveBeenCalled();
    });
  });

  describe('getExtension', () => {
    it('should return registered extension', async () => {
      const extension = new TestExtension();
      await registry.registerExtension(extension);

      expect(registry.getExtension('test')).toBe(extension);
    });

    it('should return undefined for non-existent extension', () => {
      expect(registry.getExtension('non-existent')).toBeUndefined();
    });
  });

  describe('getAllExtensions', () => {
    it('should return all registered extensions', async () => {
      const extension1 = new TestExtension();
      const extension2 = new TestExtension();
      extension2.id = 'test2';

      await registry.registerExtension(extension1);
      await registry.registerExtension(extension2);

      const extensions = registry.getAllExtensions();
      expect(extensions).toHaveLength(2);
      expect(extensions).toContain(extension1);
      expect(extensions).toContain(extension2);
    });

    it('should return empty array when no extensions registered', () => {
      expect(registry.getAllExtensions()).toEqual([]);
    });
  });

  describe('getAllCommands', () => {
    it('should return commands from all extensions', async () => {
      const extension = new TestExtension();
      await registry.registerExtension(extension);

      const commands = registry.getAllCommands();

      expect(commands).toHaveLength(2);
      expect(commands[0]).toEqual({
        id: 'test.search',
        name: 'Test Search',
        type: 'search',
        alias: ['t', 'test'],
        icon: 'test-icon.png',
      });
      expect(commands[1]).toEqual({
        id: 'test.action',
        name: 'Test Action',
        type: 'action',
        icon: 'test-icon.png',
      });
    });

    it('should use command icon over extension icon when available', async () => {
      const extension = new TestExtension();
      // Add icon to command
      extension.commands[0] = {
        ...extension.commands[0],
        icon: 'command-icon.png',
      };
      await registry.registerExtension(extension);

      const commands = registry.getAllCommands();

      expect(commands[0].icon).toBe('command-icon.png');
      expect(commands[1].icon).toBe('test-icon.png');
    });

    it('should return empty array when no extensions registered', () => {
      expect(registry.getAllCommands()).toEqual([]);
    });
  });

  describe('findCommandByAlias', () => {
    it('should find command by alias', async () => {
      const extension = new TestExtension();
      await registry.registerExtension(extension);

      const result = registry.findCommandByAlias('t');
      expect(result).toBeDefined();
      expect(result?.extension).toBe(extension);
      expect(result?.command.id).toBe('search');
    });

    it('should find command by longer alias', async () => {
      const extension = new TestExtension();
      await registry.registerExtension(extension);

      const result = registry.findCommandByAlias('test');
      expect(result).toBeDefined();
      expect(result?.extension).toBe(extension);
      expect(result?.command.id).toBe('search');
    });

    it('should be case insensitive', async () => {
      const extension = new TestExtension();
      await registry.registerExtension(extension);

      const result = registry.findCommandByAlias('T');
      expect(result).toBeDefined();
      expect(result?.extension).toBe(extension);
      expect(result?.command.id).toBe('search');
    });

    it('should return undefined for non-existent alias', async () => {
      const extension = new TestExtension();
      await registry.registerExtension(extension);

      const result = registry.findCommandByAlias('nonexistent');
      expect(result).toBeUndefined();
    });

    it('should return undefined when no extensions registered', () => {
      const result = registry.findCommandByAlias('t');
      expect(result).toBeUndefined();
    });
  });

  describe('destroy', () => {
    it('should unregister all extensions', async () => {
      const extension1 = new TestExtension();
      const extension2 = new TestExtension();
      extension2.id = 'test2';

      await registry.registerExtension(extension1);
      await registry.registerExtension(extension2);

      await registry.destroy();

      expect(extension1.destroy).toHaveBeenCalled();
      expect(extension2.destroy).toHaveBeenCalled();
      expect(mockBroker.unregisterExtension).toHaveBeenCalledWith('test');
      expect(mockBroker.unregisterExtension).toHaveBeenCalledWith('test2');
      expect(registry.getAllExtensions()).toEqual([]);
    });

    it('should handle empty registry', async () => {
      await registry.destroy();

      expect(mockBroker.unregisterExtension).not.toHaveBeenCalled();
    });
  });
});
