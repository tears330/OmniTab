/**
 * TopSites Extension Module
 * Main entry point for the TopSites extension
 */

// Export the main extension class
export { default as TopSitesExtension } from './extension';

// Export constants for external use
export {
  TOPSITES_EXTENSION_ID,
  TOPSITES_EXTENSION_NAME,
  TOPSITES_EXTENSION_DESCRIPTION,
  TopSitesCommandId,
  TopSitesCommandType,
  TOPSITES_ALIASES,
} from './constants';

// Export action functions
export { openTopSite, handleTopSitesSearch } from './actions';

// Export search utilities
export { searchTopSites, getTopSites, filterTopSites } from './search';
