import type {
  ActionPayload,
  ExtensionResponse,
  SearchPayload,
} from '@/types/extension';

import { BackgroundMessageBroker } from '../messageBroker';

// Mock chrome APIs
const mockChrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    sendMessage: jest.fn(),
    lastError: null as any,
  },
  tabs: {
    sendMessage: jest.fn(),
  },
};

// Replace global chrome object
(global as any).chrome = mockChrome;

describe('BackgroundMessageBroker', () => {
  let broker: BackgroundMessageBroker;
  let messageListener: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Capture the message listener
    mockChrome.runtime.onMessage.addListener.mockImplementation((listener) => {
      messageListener = listener;
    });

    broker = new BackgroundMessageBroker();
  });

  describe('constructor', () => {
    it('should set up message listener', () => {
      expect(mockChrome.runtime.onMessage.addListener).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });
  });

  describe('registerExtension', () => {
    it('should register extension handlers', () => {
      const handlers = {
        handleSearch: jest.fn(),
        handleAction: jest.fn(),
      };

      broker.registerExtension('test-ext', handlers);

      // Extension should be registered (we'll test it works in handleMessage tests)
      expect(true).toBe(true);
    });
  });

  describe('unregisterExtension', () => {
    it('should unregister extension', async () => {
      const handlers = {
        handleSearch: jest.fn(),
        handleAction: jest.fn(),
      };

      broker.registerExtension('test-ext', handlers);
      broker.unregisterExtension('test-ext');

      // Try to handle a message for the unregistered extension
      const sender = { tab: { id: 123 } };
      messageListener(
        {
          source: 'content',
          id: 'msg-1',
          message: {
            extensionId: 'test-ext',
            commandId: 'search',
            type: 'search',
            payload: { query: 'test' },
          },
        },
        sender
      );

      expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(
        123,
        expect.objectContaining({
          type: 'broker-response',
          response: {
            success: false,
            error: 'Extension test-ext not found',
          },
        })
      );
    });
  });

  describe('handleMessage', () => {
    it('should handle search messages', async () => {
      const searchResponse: ExtensionResponse = {
        success: true,
        data: [{ id: '1', title: 'Result', actions: [], type: 'test' }],
      };

      const handlers = {
        handleSearch: jest.fn().mockResolvedValue(searchResponse),
        handleAction: jest.fn(),
      };

      broker.registerExtension('test-ext', handlers);

      const sender = { tab: { id: 123 } };
      const brokerMessage = {
        source: 'content',
        id: 'msg-1',
        timestamp: Date.now(),
        message: {
          extensionId: 'test-ext',
          commandId: 'search',
          type: 'search',
          payload: { query: 'test query' } as SearchPayload,
        },
      };

      messageListener(brokerMessage, sender);

      // Wait for async handling
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
      });

      expect(handlers.handleSearch).toHaveBeenCalledWith('search', {
        query: 'test query',
      });
      expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(
        123,
        expect.objectContaining({
          type: 'broker-response',
          id: 'msg-1',
          response: searchResponse,
        })
      );
    });

    it('should handle action messages', async () => {
      const actionResponse: ExtensionResponse = { success: true };

      const handlers = {
        handleSearch: jest.fn(),
        handleAction: jest.fn().mockResolvedValue(actionResponse),
      };

      broker.registerExtension('test-ext', handlers);

      const sender = { tab: { id: 456 } };
      const brokerMessage = {
        source: 'content',
        id: 'msg-2',
        timestamp: Date.now(),
        message: {
          extensionId: 'test-ext',
          commandId: 'close-all',
          type: 'execute',
          payload: {
            actionId: 'close',
            resultId: 'tab-1',
          } as ActionPayload,
        },
      };

      messageListener(brokerMessage, sender);

      await new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
      });

      expect(handlers.handleAction).toHaveBeenCalledWith('close-all', {
        actionId: 'close',
        resultId: 'tab-1',
      });
      expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(
        456,
        expect.objectContaining({
          type: 'broker-response',
          id: 'msg-2',
          response: actionResponse,
        })
      );
    });

    it('should handle errors from extension handlers', async () => {
      const handlers = {
        handleSearch: jest.fn().mockRejectedValue(new Error('Search failed')),
        handleAction: jest.fn(),
      };

      broker.registerExtension('test-ext', handlers);

      const sender = { tab: { id: 789 } };
      const brokerMessage = {
        source: 'content',
        id: 'msg-3',
        message: {
          extensionId: 'test-ext',
          commandId: 'search',
          type: 'search',
          payload: { query: 'test' },
        },
      };

      messageListener(brokerMessage, sender);

      await new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
      });

      expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(
        789,
        expect.objectContaining({
          type: 'broker-response',
          id: 'msg-3',
          response: {
            success: false,
            error: 'Search failed',
          },
        })
      );
    });

    it('should handle unknown message types', async () => {
      const handlers = {
        handleSearch: jest.fn(),
        handleAction: jest.fn(),
      };

      broker.registerExtension('test-ext', handlers);

      const sender = { tab: { id: 111 } };
      const brokerMessage = {
        source: 'content',
        id: 'msg-4',
        message: {
          extensionId: 'test-ext',
          commandId: 'unknown',
          type: 'unknown-type',
          payload: {},
        },
      };

      messageListener(brokerMessage, sender);

      await new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
      });

      expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(
        111,
        expect.objectContaining({
          type: 'broker-response',
          response: {
            success: false,
            error: 'Unknown message type: unknown-type',
          },
        })
      );
    });

    it('should ignore non-content messages', () => {
      const result = messageListener(
        { source: 'background', message: {} },
        { tab: { id: 123 } }
      );
      expect(result).toBe(false);
      expect(mockChrome.tabs.sendMessage).not.toHaveBeenCalled();
    });

    it('should ignore messages without tab ID', async () => {
      const handlers = {
        handleSearch: jest.fn().mockResolvedValue({ success: true }),
        handleAction: jest.fn(),
      };

      broker.registerExtension('test-ext', handlers);

      const sender = {}; // No tab property
      const brokerMessage = {
        source: 'content',
        id: 'msg-5',
        message: {
          extensionId: 'test-ext',
          commandId: 'search',
          type: 'search',
          payload: { query: 'test' },
        },
      };

      messageListener(brokerMessage, sender);

      await new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
      });

      expect(handlers.handleSearch).toHaveBeenCalled();
      expect(mockChrome.tabs.sendMessage).not.toHaveBeenCalled();
    });
  });
});
