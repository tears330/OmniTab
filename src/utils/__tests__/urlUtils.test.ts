import { getDomain, getExtensionIconUrl, getFaviconUrl } from '../urlUtils';

// Mock chrome runtime
const mockChrome = {
  runtime: {
    getURL: jest.fn(),
  },
};

global.chrome = mockChrome as any;

describe('urlUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockChrome.runtime.getURL.mockImplementation(
      (path: string) => `chrome-extension://test-id/${path}`
    );
  });

  describe('getDomain', () => {
    it('should extract domain from valid URLs', () => {
      expect(getDomain('https://example.com')).toBe('example.com');
      expect(getDomain('http://google.com/search')).toBe('google.com');
      expect(getDomain('https://subdomain.github.com/user/repo')).toBe(
        'subdomain.github.com'
      );
      expect(getDomain('https://localhost:3000/app')).toBe('localhost');
    });

    it('should handle URLs with different protocols', () => {
      expect(getDomain('ftp://files.example.com')).toBe('files.example.com');
      expect(getDomain('file:///path')).toBe('');
      expect(getDomain('chrome-extension://id/page.html')).toBe('id');
    });

    it('should handle URLs with ports', () => {
      expect(getDomain('https://example.com:8080')).toBe('example.com');
      expect(getDomain('http://localhost:3000')).toBe('localhost');
    });

    it('should handle URLs with paths and query parameters', () => {
      expect(getDomain('https://example.com/path/to/page?param=value')).toBe(
        'example.com'
      );
      expect(getDomain('https://api.github.com/repos/user/repo#section')).toBe(
        'api.github.com'
      );
    });

    it('should return empty string for empty input', () => {
      expect(getDomain('')).toBe('');
    });

    it('should return original URL for invalid URLs', () => {
      expect(getDomain('not-a-url')).toBe('not-a-url');
      expect(getDomain('just text')).toBe('just text');
      expect(getDomain('http://')).toBe('http://');
    });

    it('should return empty string for URLs with empty hostnames', () => {
      expect(getDomain('invalid:///')).toBe('');
      expect(getDomain('file:///path')).toBe('');
    });

    it('should handle null and undefined gracefully', () => {
      expect(getDomain(null as any)).toBe('');
      expect(getDomain(undefined as any)).toBe('');
    });

    it('should handle URLs without protocol', () => {
      expect(getDomain('example.com')).toBe('example.com');
      expect(getDomain('//example.com')).toBe('//example.com'); // Invalid, returns original
    });
  });

  describe('getFaviconUrl', () => {
    it('should generate favicon URL with default size', () => {
      const result = getFaviconUrl('https://example.com');

      expect(mockChrome.runtime.getURL).toHaveBeenCalledWith('/_favicon/');
      expect(result).toBe(
        'chrome-extension://test-id//_favicon/?pageUrl=https%3A%2F%2Fexample.com&size=32'
      );
    });

    it('should generate favicon URL with custom size', () => {
      const result = getFaviconUrl('https://example.com', 64);

      expect(mockChrome.runtime.getURL).toHaveBeenCalledWith('/_favicon/');
      expect(result).toBe(
        'chrome-extension://test-id//_favicon/?pageUrl=https%3A%2F%2Fexample.com&size=64'
      );
    });

    it('should handle URLs with special characters', () => {
      const result = getFaviconUrl(
        'https://example.com/path?query=value&other=test',
        16
      );

      expect(result).toContain(
        'pageUrl=https%3A%2F%2Fexample.com%2Fpath%3Fquery%3Dvalue%26other%3Dtest'
      );
      expect(result).toContain('size=16');
    });

    it('should return fallback icon for empty pageUrl', () => {
      const result = getFaviconUrl('');

      expect(mockChrome.runtime.getURL).toHaveBeenCalledWith('icon16.png');
      expect(result).toBe('chrome-extension://test-id/icon16.png');
    });

    it('should return fallback icon for null/undefined pageUrl', () => {
      const nullResult = getFaviconUrl(null as any);
      const undefinedResult = getFaviconUrl(undefined as any);

      expect(nullResult).toBe('chrome-extension://test-id/icon16.png');
      expect(undefinedResult).toBe('chrome-extension://test-id/icon16.png');
    });

    it('should handle different page URL formats', () => {
      const httpResult = getFaviconUrl('http://example.com');
      const httpsResult = getFaviconUrl('https://example.com');
      const extensionResult = getFaviconUrl('chrome-extension://id/page.html');

      expect(httpResult).toContain('pageUrl=http%3A%2F%2Fexample.com');
      expect(httpsResult).toContain('pageUrl=https%3A%2F%2Fexample.com');
      expect(extensionResult).toContain(
        'pageUrl=chrome-extension%3A%2F%2Fid%2Fpage.html'
      );
    });

    it('should handle size parameter correctly', () => {
      expect(getFaviconUrl('https://example.com', 0)).toContain('size=0');
      expect(getFaviconUrl('https://example.com', 128)).toContain('size=128');
      expect(getFaviconUrl('https://example.com', -1)).toContain('size=-1');
    });
  });

  describe('getExtensionIconUrl', () => {
    it('should generate extension icon URL for basic path', () => {
      const result = getExtensionIconUrl('tab_icon.png');

      expect(mockChrome.runtime.getURL).toHaveBeenCalledWith('tab_icon.png');
      expect(result).toBe('chrome-extension://test-id/tab_icon.png');
    });

    it('should remove public/ prefix from path', () => {
      const result = getExtensionIconUrl('public/tab_icon.png');

      expect(mockChrome.runtime.getURL).toHaveBeenCalledWith('tab_icon.png');
      expect(result).toBe('chrome-extension://test-id/tab_icon.png');
    });

    it('should handle nested paths with public prefix', () => {
      const result = getExtensionIconUrl('public/icons/tab.svg');

      expect(mockChrome.runtime.getURL).toHaveBeenCalledWith('icons/tab.svg');
      expect(result).toBe('chrome-extension://test-id/icons/tab.svg');
    });

    it('should handle paths without public prefix', () => {
      const result = getExtensionIconUrl('icons/bookmark.png');

      expect(mockChrome.runtime.getURL).toHaveBeenCalledWith(
        'icons/bookmark.png'
      );
      expect(result).toBe('chrome-extension://test-id/icons/bookmark.png');
    });

    it('should return fallback icon for empty iconPath', () => {
      const result = getExtensionIconUrl('');

      expect(mockChrome.runtime.getURL).toHaveBeenCalledWith('icon16.png');
      expect(result).toBe('chrome-extension://test-id/icon16.png');
    });

    it('should return fallback icon for null/undefined iconPath', () => {
      const nullResult = getExtensionIconUrl(null as any);
      const undefinedResult = getExtensionIconUrl(undefined as any);

      expect(nullResult).toBe('chrome-extension://test-id/icon16.png');
      expect(undefinedResult).toBe('chrome-extension://test-id/icon16.png');
    });

    it('should handle different file extensions', () => {
      expect(getExtensionIconUrl('icon.svg')).toBe(
        'chrome-extension://test-id/icon.svg'
      );
      expect(getExtensionIconUrl('icon.jpg')).toBe(
        'chrome-extension://test-id/icon.jpg'
      );
      expect(getExtensionIconUrl('icon.gif')).toBe(
        'chrome-extension://test-id/icon.gif'
      );
    });

    it('should handle complex paths', () => {
      const result = getExtensionIconUrl(
        'public/assets/images/icons/tab-manager.png'
      );

      expect(mockChrome.runtime.getURL).toHaveBeenCalledWith(
        'assets/images/icons/tab-manager.png'
      );
      expect(result).toBe(
        'chrome-extension://test-id/assets/images/icons/tab-manager.png'
      );
    });

    it('should handle multiple public prefixes correctly', () => {
      const result = getExtensionIconUrl('public/public/icon.png');

      expect(mockChrome.runtime.getURL).toHaveBeenCalledWith('public/icon.png');
      expect(result).toBe('chrome-extension://test-id/public/icon.png');
    });

    it('should handle public in middle of path', () => {
      const result = getExtensionIconUrl('assets/public/icon.png');

      expect(mockChrome.runtime.getURL).toHaveBeenCalledWith(
        'assets/public/icon.png'
      );
      expect(result).toBe('chrome-extension://test-id/assets/public/icon.png');
    });
  });
});
