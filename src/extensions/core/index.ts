/**
 * Core extension main entry point
 */

// Export all public functions and types
export { commandToSearchResult, searchCommands } from './search';
export {
  getCommands,
  handleSearchCommands,
  reloadExtensions,
  showHelp,
} from './actions';
export {
  CORE_EXTENSION_ID,
  CORE_EXTENSION_NAME,
  CORE_EXTENSION_DESCRIPTION,
  CoreCommandId,
  CoreCommandType,
  CORE_MESSAGES,
} from './constants';

// Export the main extension class
export { default as CoreExtension } from './extension';
