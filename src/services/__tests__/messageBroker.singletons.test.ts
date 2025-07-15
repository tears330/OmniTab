import {
  BackgroundMessageBroker,
  ContentMessageBroker,
  getBackgroundBroker,
  getContentBroker,
} from '../messageBroker';

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

describe('MessageBroker Singletons', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getContentBroker', () => {
    it('should return the same instance', () => {
      const broker1 = getContentBroker();
      const broker2 = getContentBroker();

      expect(broker1).toBe(broker2);
      expect(broker1).toBeInstanceOf(ContentMessageBroker);
    });
  });

  describe('getBackgroundBroker', () => {
    it('should return the same instance', () => {
      const broker1 = getBackgroundBroker();
      const broker2 = getBackgroundBroker();

      expect(broker1).toBe(broker2);
      expect(broker1).toBeInstanceOf(BackgroundMessageBroker);
    });
  });
});
