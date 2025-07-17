/**
 * TopSites Extension Search Utilities
 * Handles searching and filtering top sites
 */

import type { SearchResult } from '@/types/extension';

import { getDomain, getFaviconUrl } from '@/utils/urlUtils';

import {
  TOPSITES_CONFIG,
  TopSitesActionId,
  TopSitesActionLabel,
  TopSitesActionShortcut,
  TopSitesResultType,
} from './constants';

/**
 * Get top sites from Chrome API
 */
export async function getTopSites(): Promise<chrome.topSites.MostVisitedURL[]> {
  return new Promise((resolve, reject) => {
    if (!chrome.topSites) {
      reject(new Error('Chrome topSites API not available'));
      return;
    }

    chrome.topSites.get((topSites) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(topSites || []);
    });
  });
}

/**
 * Convert Chrome top site to SearchResult
 */
export function topSiteToSearchResult(
  topSite: chrome.topSites.MostVisitedURL,
  index: number
): SearchResult {
  const domain = getDomain(topSite.url);
  const title = topSite.title || domain || topSite.url;
  const faviconUrl = getFaviconUrl(topSite.url);

  return {
    id: `topsites-${index}`,
    title,
    description: `${domain}`,
    icon: faviconUrl || chrome.runtime.getURL(TOPSITES_CONFIG.DEFAULT_ICON),
    type: TopSitesResultType.TOP_SITE,
    actions: [
      {
        id: TopSitesActionId.OPEN,
        label: TopSitesActionLabel.OPEN_SITE,
        shortcut: TopSitesActionShortcut.ENTER,
        primary: true,
      },
    ],
    metadata: {
      url: topSite.url,
      score: 100 - index, // Higher score for top sites
      source: 'topsites',
    },
  };
}

/**
 * Filter top sites based on query
 */
export function filterTopSites(
  topSites: chrome.topSites.MostVisitedURL[],
  query: string
): chrome.topSites.MostVisitedURL[] {
  if (!query.trim()) {
    return topSites.slice(0, TOPSITES_CONFIG.MAX_RESULTS);
  }

  const normalizedQuery = query.toLowerCase();

  return topSites
    .filter((site) => {
      const title = (site.title || '').toLowerCase();
      const url = site.url.toLowerCase();
      const domain = getDomain(site.url).toLowerCase();

      return (
        title.includes(normalizedQuery) ||
        url.includes(normalizedQuery) ||
        domain.includes(normalizedQuery)
      );
    })
    .slice(0, TOPSITES_CONFIG.MAX_RESULTS);
}

/**
 * Search top sites with query
 */
export async function searchTopSites(query: string): Promise<SearchResult[]> {
  const topSites = await getTopSites();
  const filteredSites = filterTopSites(topSites, query);

  return filteredSites.map((site, index) => topSiteToSearchResult(site, index));
}
