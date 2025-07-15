/* eslint-disable max-classes-per-file */
import type {
  ActionPayload,
  ExtensionMessage,
  ExtensionResponse,
  SearchPayload,
  SearchResponse,
} from '@/types/extension';

// Message types for the message broker
export interface BrokerMessage {
  id: string;
  timestamp: number;
  source: 'content' | 'background';
  message: ExtensionMessage;
}

export interface BrokerResponse {
  id: string;
  response: ExtensionResponse;
}

// Content script side of the message broker
export class ContentMessageBroker {
  private pendingRequests = new Map<
    string,
    {
      resolve: (value: ExtensionResponse) => void;
      reject: (error: Error) => void;
      timeout: ReturnType<typeof setTimeout>;
    }
  >();

  constructor(private timeout = 5000) {
    // Listen for responses from background
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
      if (message.type === 'broker-response') {
        this.handleResponse(message as BrokerResponse);
      }
      // Return false to indicate we're not sending a response
      return false;
    });
  }

  async sendSearchRequest(
    extensionId: string,
    commandId: string,
    query: string
  ): Promise<SearchResponse> {
    const payload: SearchPayload = { query };
    return this.sendMessage({
      extensionId,
      commandId,
      type: 'search',
      payload,
    }) as Promise<SearchResponse>;
  }

  async sendActionRequest(
    extensionId: string,
    commandId: string,
    actionId: string,
    resultId?: string,
    metadata?: Record<string, unknown>
  ): Promise<ExtensionResponse> {
    const payload: ActionPayload = { actionId, resultId, metadata };
    return this.sendMessage({
      extensionId,
      commandId,
      type: 'execute',
      payload,
    });
  }

  private async sendMessage(
    message: ExtensionMessage
  ): Promise<ExtensionResponse> {
    const messageId = this.generateId();
    const brokerMessage: BrokerMessage = {
      id: messageId,
      timestamp: Date.now(),
      source: 'content',
      message,
    };

    return new Promise((resolve, reject) => {
      // Set up timeout
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(messageId);
        reject(new Error('Request timeout'));
      }, this.timeout);

      // Store the request
      this.pendingRequests.set(messageId, { resolve, reject, timeout });

      // Send the message
      chrome.runtime.sendMessage(brokerMessage).catch((error) => {
        this.pendingRequests.delete(messageId);
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  private handleResponse(response: BrokerResponse) {
    const pending = this.pendingRequests.get(response.id);
    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingRequests.delete(response.id);
      pending.resolve(response.response);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  destroy() {
    // Clear all pending requests
    this.pendingRequests.forEach(({ reject, timeout }) => {
      clearTimeout(timeout);
      reject(new Error('Message broker destroyed'));
    });
    this.pendingRequests.clear();
  }
}

// Background script side of the message broker
export class BackgroundMessageBroker {
  private extensions = new Map<
    string,
    {
      handleSearch: (
        commandId: string,
        payload: SearchPayload
      ) => Promise<ExtensionResponse>;
      handleAction: (
        commandId: string,
        payload: ActionPayload
      ) => Promise<ExtensionResponse>;
    }
  >();

  constructor() {
    // Listen for messages from content scripts
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    chrome.runtime.onMessage.addListener((message, sender, _sendResponse) => {
      if (message.source === 'content' && message.message) {
        this.handleMessage(message as BrokerMessage, sender.tab?.id);
      }
      // Return false to indicate we're not sending a response synchronously
      return false;
    });
  }

  registerExtension(
    extensionId: string,
    handlers: {
      handleSearch: (
        commandId: string,
        payload: SearchPayload
      ) => Promise<ExtensionResponse>;
      handleAction: (
        commandId: string,
        payload: ActionPayload
      ) => Promise<ExtensionResponse>;
    }
  ) {
    this.extensions.set(extensionId, handlers);
  }

  unregisterExtension(extensionId: string) {
    this.extensions.delete(extensionId);
  }

  private async handleMessage(brokerMessage: BrokerMessage, tabId?: number) {
    const { id, message } = brokerMessage;
    const { extensionId, commandId, type, payload } = message;

    try {
      const extension = this.extensions.get(extensionId);
      if (!extension) {
        throw new Error(`Extension ${extensionId} not found`);
      }

      let response: ExtensionResponse;
      if (type === 'search') {
        response = await extension.handleSearch(
          commandId,
          payload as SearchPayload
        );
      } else if (type === 'execute') {
        response = await extension.handleAction(
          commandId,
          payload as ActionPayload
        );
      } else {
        throw new Error(`Unknown message type: ${type}`);
      }

      // Send response back to content script
      const brokerResponse: BrokerResponse = {
        id,
        response,
      };

      if (tabId !== undefined) {
        chrome.tabs.sendMessage(tabId, {
          type: 'broker-response',
          ...brokerResponse,
        });
      }
    } catch (error) {
      // Send error response
      const errorResponse: ExtensionResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      const brokerResponse: BrokerResponse = {
        id,
        response: errorResponse,
      };

      if (tabId !== undefined) {
        chrome.tabs.sendMessage(tabId, {
          type: 'broker-response',
          ...brokerResponse,
        });
      }
    }
  }
}

// Singleton instances
let contentBroker: ContentMessageBroker | null = null;
let backgroundBroker: BackgroundMessageBroker | null = null;

export function getContentBroker(): ContentMessageBroker {
  if (!contentBroker) {
    contentBroker = new ContentMessageBroker();
  }
  return contentBroker;
}

export function getBackgroundBroker(): BackgroundMessageBroker {
  if (!backgroundBroker) {
    backgroundBroker = new BackgroundMessageBroker();
  }
  return backgroundBroker;
}
