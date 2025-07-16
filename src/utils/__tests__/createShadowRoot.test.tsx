/**
 * @jest-environment jsdom
 */

import { createRoot } from 'react-dom/client';

import createShadowRoot from '../createShadowRoot';

// Mock React DOM client
jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(),
}));

// Mock chrome runtime
const mockChrome = {
  runtime: {
    getURL: jest.fn(),
  },
};

global.chrome = mockChrome as any;

const mockRoot = {
  render: jest.fn(),
  unmount: jest.fn(),
};

// Mock CSSStyleSheet
class MockCSSStyleSheet {
  replaceSync = jest.fn();
}

global.CSSStyleSheet = MockCSSStyleSheet as any;

describe('createShadowRoot', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockChrome.runtime.getURL.mockImplementation(
      (path: string) => `chrome-extension://test-id/${path}`
    );
    (createRoot as jest.Mock).mockReturnValue(mockRoot);

    // Clear document body
    document.body.innerHTML = '';
  });

  it('should process font URLs in styles', () => {
    const styles = `
      @font-face {
        font-family: 'MyFont';
        src: url('../fonts/MyFont.woff2') format('woff2');
      }
    `;

    createShadowRoot(styles);

    expect(mockChrome.runtime.getURL).toHaveBeenCalledWith(
      'assets/fonts/MyFont.woff2'
    );
  });

  it('should handle multiple font URLs', () => {
    const styles = `
      src: url('../fonts/font1.woff2'), url("../fonts/font2.ttf");
    `;

    createShadowRoot(styles);

    expect(mockChrome.runtime.getURL).toHaveBeenCalledWith(
      'assets/fonts/font1.woff2'
    );
    expect(mockChrome.runtime.getURL).toHaveBeenCalledWith(
      'assets/fonts/font2.ttf'
    );
  });

  it('should handle font URLs without quotes', () => {
    const styles = 'src: url(../fonts/font.woff);';

    createShadowRoot(styles);

    expect(mockChrome.runtime.getURL).toHaveBeenCalledWith(
      'assets/fonts/font.woff'
    );
  });

  it('should not modify styles without font URLs', () => {
    const styles = '.test { color: blue; background: url(image.png); }';

    createShadowRoot(styles);

    expect(mockChrome.runtime.getURL).not.toHaveBeenCalled();
  });

  it('should handle empty styles', () => {
    const styles = '';

    const result = createShadowRoot(styles);

    expect(result).toBe(mockRoot);
  });

  it('should return React root', () => {
    const result = createShadowRoot('.test {}');

    expect(createRoot).toHaveBeenCalled();
    expect(result).toBe(mockRoot);
  });

  it('should create container element and append to body', () => {
    const initialChildCount = document.body.children.length;

    createShadowRoot('.test {}');

    expect(document.body.children).toHaveLength(initialChildCount + 1);
  });

  it('should handle complex font URL transformations', () => {
    const styles = `
      .font1 { font-family: url('../fonts/Inter-Regular.woff2'); }
      .font2 { src: url("../fonts/Roboto-Bold.ttf") format('truetype'); }
      .font3 { background: url('../fonts/icon-font.svg#icon'); }
    `;

    createShadowRoot(styles);

    expect(mockChrome.runtime.getURL).toHaveBeenCalledWith(
      'assets/fonts/Inter-Regular.woff2'
    );
    expect(mockChrome.runtime.getURL).toHaveBeenCalledWith(
      'assets/fonts/Roboto-Bold.ttf'
    );
    expect(mockChrome.runtime.getURL).toHaveBeenCalledWith(
      'assets/fonts/icon-font.svg#icon'
    );
  });
});
