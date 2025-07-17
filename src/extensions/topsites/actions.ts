/**
 * TopSites Extension Actions
 * Individual action functions for top sites operations
 */

import type { ExtensionResponse } from '@/types/extension';

/**
 * Open a top site URL in a new tab
 */
export async function openTopSite(url: string): Promise<ExtensionResponse> {
  try {
    await chrome.tabs.create({ url, active: true });

    return {
      success: true,
      data: { action: 'opened', url },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to open top site',
    };
  }
}

/**
 * Handle search command for top sites
 */
export async function handleTopSitesSearch(): Promise<ExtensionResponse> {
  // This is mainly for action-based searches, actual search is handled in handleSearch
  return {
    success: true,
    data: { action: 'search_ready' },
  };
}
