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
 * Gets a favicon URL for a given URL
 * @param url - The URL to get favicon for
 * @param fallback - Fallback icon URL if favicon cannot be determined
 * @returns The favicon URL
 */
export function getFaviconUrl(url: string, fallback?: string): string {
  if (!url) return fallback || '';

  try {
    const { origin } = new URL(url);
    return `${origin}/favicon.ico`;
  } catch {
    return fallback || '';
  }
}
