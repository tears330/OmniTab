/**
 * Utility functions for URL manipulation
 */

/**
 * Extracts the domain (hostname) from a URL string
 * @param url - The URL string to extract domain from
 * @returns The domain/hostname, or the original URL if parsing fails
 */
export function getDomain(url: string): string {
  if (!url) return '';

  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
  } catch {
    // If URL parsing fails, return the original URL
    return url;
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

/**
 * Gets a favicon URL using Chrome's _favicon API for optimal performance and reliability
 * @param pageUrl - The URL of the page to get favicon for
 * @param size - Favicon size (default: 32)
 * @returns Chrome extension favicon URL
 */
export function getFaviconUrl(pageUrl: string, size: number = 32): string {
  if (!pageUrl) return chrome.runtime.getURL('icon16.png');

  const url = new URL(chrome.runtime.getURL('/_favicon/'));
  url.searchParams.set('pageUrl', pageUrl);
  url.searchParams.set('size', size.toString());
  return url.toString();
}

/**
 * Resolves the correct URL for extension icons in public folder
 * @param iconPath - Path to the icon file (e.g., 'public/tab_icon.png')
 * @returns Chrome extension runtime URL
 */
export function getExtensionIconUrl(iconPath: string): string {
  if (!iconPath) return chrome.runtime.getURL('icon16.png');

  // Remove 'public/' prefix if present since chrome.runtime.getURL uses the public folder as root
  const cleanPath = iconPath.replace(/^public\//, '');
  return chrome.runtime.getURL(cleanPath);
}
