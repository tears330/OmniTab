/**
 * Utility functions for favicon handling and URL resolution
 */

/**
 * Resolves favicon URLs with multiple fallbacks and handles mixed content issues
 */
export function resolveFaviconUrl(favIconUrl: string, tabUrl: string): string {
  const defaultIcon = chrome.runtime.getURL('icon16.png');

  if (!favIconUrl) return defaultIcon;

  try {
    let resolvedUrl: string;

    // If it's already an absolute URL, use as-is
    if (
      favIconUrl.startsWith('http://') ||
      favIconUrl.startsWith('https://') ||
      favIconUrl.startsWith('data:')
    ) {
      resolvedUrl = favIconUrl;
    } else {
      // Resolve relative URL against the tab's origin
      const tabOrigin = new URL(tabUrl).origin;
      resolvedUrl = new URL(favIconUrl, tabOrigin).href;
    }

    // Check for mixed content issues: if current page is HTTPS but favicon is HTTP
    const currentPageIsHTTPS = window.location.protocol === 'https:';
    const faviconIsHTTP = resolvedUrl.startsWith('http://');

    if (currentPageIsHTTPS && faviconIsHTTP) {
      // Don't attempt HTTPS upgrade as many HTTP-only sites don't support it
      // Instead, fall back to default icon to avoid mixed content blocking
      return defaultIcon;
    }

    return resolvedUrl;
  } catch {
    return defaultIcon;
  }
}

/**
 * Gets fallback favicon sources for error handling
 */
export function getFaviconFallbacks(url: string): string[] {
  const defaultIcon = chrome.runtime.getURL('icon16.png');

  try {
    const urlObj = new URL(url);
    return [
      `${urlObj.origin}/favicon.ico`,
      `${urlObj.origin}/favicon.png`,
      defaultIcon,
    ];
  } catch {
    return [defaultIcon];
  }
}

/**
 * Extracts hostname from URL safely
 */
export function getHostnameFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
