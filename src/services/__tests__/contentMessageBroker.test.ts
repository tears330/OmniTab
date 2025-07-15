import type { ExtensionResponse } from '@/types/extension';

import { ContentMessageBroker } from '../messageBroker';

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

describe('ContentMessageBroker', () => {
  let broker: ContentMessageBroker;
  let messageListener: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Capture the message listener
    mockChrome.runtime.onMessage.addListener.mockImplementation((listener) => {
      messageListener = listener;
    });

    broker = new ContentMessageBroker(1000); // 1 second timeout for tests
  });

  afterEach(() => {
    // Only destroy if it hasn't been destroyed already in the test
    try {
      if (broker && typeof broker.destroy === 'function') {
        broker.destroy();
      }
    } catch (error) {
      // Ignore errors - broker might already be destroyed
    }
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should set up message listener', () => {
      expect(mockChrome.runtime.onMessage.addListener).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });
  });

  describe('sendSearchRequest', () => {
    it('should send search message and resolve with response', async () => {
      const expectedResponse: ExtensionResponse = {
        success: true,
        data: [
          { id: 'result-1', title: 'Test Result', actions: [], type: 'test' },
        ],
      };

      mockChrome.runtime.sendMessage.mockImplementation((message) => {
        // Simulate async response
        setTimeout(() => {
          messageListener({
            type: 'broker-response',
            id: message.id,
            response: expectedResponse,
          });
        }, 10);
        return Promise.resolve();
      });

      const responsePromise = broker.sendSearchRequest(
        'test-ext',
        'search',
        'query'
      );

      jest.advanceTimersByTime(20);

      const response = await responsePromise;
      expect(response).toEqual(expectedResponse);
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        id: expect.any(String),
        timestamp: expect.any(Number),
        source: 'content',
        message: {
          extensionId: 'test-ext',
          commandId: 'search',
          type: 'search',
          payload: { query: 'query' },
        },
      });
    });

    it('should timeout if no response received', async () => {
      mockChrome.runtime.sendMessage.mockResolvedValue(undefined);

      const responsePromise = broker.sendSearchRequest(
        'test-ext',
        'search',
        'query'
      );

      jest.advanceTimersByTime(1100); // Advance past timeout

      await expect(responsePromise).rejects.toThrow('Request timeout');
    });

    it('should handle sendMessage errors', async () => {
      const error = new Error('Failed to send message');
      mockChrome.runtime.sendMessage.mockRejectedValue(error);

      await expect(
        broker.sendSearchRequest('test-ext', 'search', 'query')
      ).rejects.toThrow('Failed to send message');
    });
  });

  describe('sendActionRequest', () => {
    it('should send action message with all parameters', async () => {
      const expectedResponse: ExtensionResponse = { success: true };
      const metadata = { key: 'value' };

      mockChrome.runtime.sendMessage.mockImplementation((message) => {
        setTimeout(() => {
          messageListener({
            type: 'broker-response',
            id: message.id,
            response: expectedResponse,
          });
        }, 10);
        return Promise.resolve();
      });

      const responsePromise = broker.sendActionRequest(
        'test-ext',
        'action',
        'close',
        'result-123',
        metadata
      );

      jest.advanceTimersByTime(20);

      const response = await responsePromise;
      expect(response).toEqual(expectedResponse);
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        id: expect.any(String),
        timestamp: expect.any(Number),
        source: 'content',
        message: {
          extensionId: 'test-ext',
          commandId: 'action',
          type: 'execute',
          payload: {
            actionId: 'close',
            resultId: 'result-123',
            metadata,
          },
        },
      });
    });

    it('should send action message without optional parameters', async () => {
      const expectedResponse: ExtensionResponse = { success: true };

      mockChrome.runtime.sendMessage.mockImplementation((message) => {
        setTimeout(() => {
          messageListener({
            type: 'broker-response',
            id: message.id,
            response: expectedResponse,
          });
        }, 10);
        return Promise.resolve();
      });

      const responsePromise = broker.sendActionRequest(
        'test-ext',
        'action',
        'execute'
      );

      jest.advanceTimersByTime(20);

      await responsePromise;

      const sentMessage = mockChrome.runtime.sendMessage.mock.calls[0][0];
      expect(sentMessage.message.payload).toEqual({
        actionId: 'execute',
        resultId: undefined,
        metadata: undefined,
      });
    });
  });

  describe('handleResponse', () => {
    it('should ignore responses for unknown request IDs', () => {
      // Send a response without a pending request
      messageListener({
        type: 'broker-response',
        id: 'unknown-id',
        response: { success: true },
      });

      // Should not throw any errors
      expect(true).toBe(true);
    });

    it('should handle non-broker-response messages', () => {
      const result = messageListener({ type: 'other-message' });
      expect(result).toBe(false);
    });
  });

  describe('destroy', () => {
    it('should reject all pending requests', async () => {
      mockChrome.runtime.sendMessage.mockResolvedValue(undefined);

      const promise1 = broker.sendSearchRequest('ext1', 'cmd1', 'query1');
      const promise2 = broker.sendSearchRequest('ext2', 'cmd2', 'query2');

      broker.destroy();

      await expect(promise1).rejects.toThrow('Message broker destroyed');
      await expect(promise2).rejects.toThrow('Message broker destroyed');
    });

    it('should clear all timeouts', async () => {
      mockChrome.runtime.sendMessage.mockResolvedValue(undefined);

      const promise1 = broker.sendSearchRequest('ext1', 'cmd1', 'query1');
      const promise2 = broker.sendSearchRequest('ext2', 'cmd2', 'query2');

      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      broker.destroy();

      // These promises should be rejected with "Message broker destroyed"
      await expect(promise1).rejects.toThrow('Message broker destroyed');
      await expect(promise2).rejects.toThrow('Message broker destroyed');

      expect(clearTimeoutSpy).toHaveBeenCalledTimes(2);
    });
  });
});
