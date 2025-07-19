# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OmniTab is a keyboard-first tab manager Chrome extension that provides a Spotlight-like interface for searching and switching between browser tabs. Built with Vite, TypeScript, React, Tailwind CSS, and DaisyUI. The extension supports searching across tabs, browser history, bookmarks, and most visited sites with fuzzy matching and intelligent ranking.

## Extension-Based Architecture (New)

OmniTab now uses a modular extension-based architecture where functionality is organized into pluggable extensions:

### Standard Extension Structure

Extensions follow a standardized modular structure for better maintainability and consistency:

```
src/extensions/
├── index.ts (main entry point)
├── core/ (system commands)
│   ├── extension.ts (main extension class)
│   ├── constants.ts (enums and constants)
│   ├── actions.ts (action functions)
│   ├── search.ts (search utilities)
│   └── index.ts (module exports)
├── tab/ (tab management)
├── history/ (browser history)
├── bookmark/ (bookmark search)
└── topsites/ (most visited sites)
```

### Core Extensions

- **CoreExtension** (`src/extensions/core/`) - System commands (help, reload) with modular structure
- **TabExtension** (`src/extensions/tab/`) - Tab search, switch, close, duplicate management
- **HistoryExtension** (`src/extensions/history/`) - Browser history search
- **BookmarkExtension** (`src/extensions/bookmark/`) - Bookmark search
- **TopSitesExtension** (`src/extensions/topsites/`) - Search Chrome's most visited sites

### Extension Development Guidelines

When creating new extensions, follow this modular pattern:

#### **Required Files:**

1. **`extension.ts`** - Main extension class extending `BaseExtension`
2. **`constants.ts`** - All enums, constants, and hardcoded values
3. **`actions.ts`** - Individual exported action functions (not classes)
4. **`index.ts`** - Module entry point exporting all public APIs

#### **Optional Files:**

- **`search.ts`** - Search-related utility functions if the extension provides search
- **`utils.ts`** - Extension-specific utility functions
- **`types.ts`** - Extension-specific TypeScript types

#### **Best Practices:**

- Use **enums and constants** instead of hardcoded strings
- Export **individual functions** instead of static class methods for actions
- Keep **command definitions inline** within the main extension class
- Use **descriptive constant names** following the pattern `EXTENSION_NAME_*`
- Import/export through the **`index.ts` entry point** for clean module boundaries

### Architecture Components

- **Extension Registry** (`src/services/extensionRegistry.ts`) - Manages extension lifecycle and command routing
- **Message Broker** (`src/services/messageBroker.ts`) - Handles communication between content and background scripts
- **OmniTab Store** (`src/stores/omniTabStore.ts`) - Zustand store for global state management with debounced search and automatic initialization
- **Settings System** - Comprehensive settings management with Chrome storage integration:
  - `src/services/settingsService.ts` - Settings storage, validation, and change notifications
  - `src/services/settingsManager.ts` - Settings application and theme management
  - `src/types/settings.ts` - Settings schema and type definitions

## Key Commands

```bash
# Development (hot reload enabled)
pnpm dev

# Build for production
pnpm build

# Run ESLint
pnpm lint

# Run Jest tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch

# Preview production build
pnpm preview
```

## Architecture Overview

### Extension Structure

- **Background Service Worker**: `src/background/index.ts` - Handles keyboard commands, tab search, switching, and closing operations
- **Content Script**: `src/content/` - Injects the OmniTab search overlay into web pages
  - `Content.tsx` - Main container that manages overlay visibility
  - `OmniTab.tsx` - Refactored modular search interface component
- **Options Page**: `src/options/` - Extension settings and configuration interface
  - `Options.tsx` - Main options page with settings management
  - `components/` - Modular options page components (ThemeCard, ShortcutCard, etc.)
- **Popup**: `src/popup/` - Extension popup interface (optional quick access)
- **Manifest**: `src/manifest.ts` - Chrome extension manifest v3 with keyboard shortcut (Ctrl/Cmd+J) and tab permissions

### Modular Architecture (Refactored)

The main OmniTab component has been refactored into a clean, modular architecture:

#### **Utility Functions**

- `src/utils/searchUtils.ts` - **Core search utilities** including command parsing, result creation, and safe search operations
- `src/utils/urlUtils.ts` - URL-related utility functions including domain extraction and favicon resolution
- `src/utils/keyboardUtils.ts` - Keyboard event utilities and Emacs navigation support
- `src/utils/createShadowRoot.tsx` - Shadow DOM creation utility for style isolation
- `src/utils/storeLogger.ts` - Development-only store state logging utility for debugging

#### **Custom Hooks**

- `src/hooks/useKeyboardNavigation.ts` - Keyboard event handling and action execution
- `src/hooks/useSettings.ts` - Settings management and reactive updates
- `src/hooks/useTheme.ts` - Theme management with system preference detection
- **Zustand Store Integration**: Components use `useOmniTabStore` directly for optimal performance and automatic reactivity

#### **Reusable Components**

- `src/components/SearchInput.tsx` - Search input field with keyboard handling
- `src/components/ResultItem.tsx` - Individual result item with favicon and actions
- `src/components/ResultsList.tsx` - Container for all results with scrolling
- `src/components/StatusBar.tsx` - Loading indicator and context-sensitive shortcuts
- `src/components/EmptyState.tsx` - No results messaging with helpful hints
- `src/components/ActionsMenu.tsx` - Context menu for result actions
- `src/components/KeyboardShortcut.tsx` - Keyboard shortcut display component

### Key Technologies & Configuration

- **Package Manager**: pnpm (v10.13.1+) with workspace configuration
- **Build Tool**: Vite with CRXJS plugin for Chrome extension bundling
- **TypeScript**: Strict mode enabled, path aliases configured (`@/*` → `src/*`)
- **React**: v19.1.0 with React Refresh for development
- **State Management**: Zustand for global state management with TypeScript support
- **Utility Library**: es-toolkit for optimized utility functions (debounce, clamp, etc.)
- **Styling**: Tailwind CSS + DaisyUI component library with class-based dark mode (`darkMode: ['class', '[data-theme="dark"]']`)
- **Testing**: Jest with ts-jest, @testing-library/react, jsdom environment
- **Linting**: ESLint with Airbnb config + TypeScript rules + Jest plugin
- **Formatting**: Prettier with import sorting and Tailwind class ordering
- **Git Hooks**: Husky + lint-staged for pre-commit checks
- **Type Definitions**: Centralized type definitions in `src/types/` for extension, search, and core types

### Development Workflow

1. Content scripts use shadow DOM via `createShadowRoot` utility to isolate styles
2. Dev mode includes visual indicators (e.g., "➡️ Dev" in extension name)
3. Font assets are bundled and served from `src/assets/fonts/`
4. Fallback icons are accessible via `chrome.runtime.getURL('icon16.png')` - icons are included in `web_accessible_resources` for production builds
5. Permissions: `tabs`, `history`, `bookmarks`, `favicon`, `topSites`, and `storage` are configured in manifest, with optional `tabGroups` permission

### Code Quality Tools

- **Commit Convention**: Conventional commits enforced via commitlint
- **Pre-commit**: Automatically runs ESLint fix and Prettier formatting on staged files
- **Import Order**: Enforced by Prettier plugin with specific grouping (built-ins → React → types → third-party → local → styles)
- **Testing**: Comprehensive unit tests with high coverage across all major components
- **Type Safety**: Strict TypeScript with no `any` types in production code

### Utility Functions Best Practices

- **Use es-toolkit**: Prefer es-toolkit utility functions over custom implementations for better performance and smaller bundle size
  - `debounce` for delaying function execution (e.g., search input)
  - `clamp` for constraining values within bounds (e.g., array indices)
  - `memoize` for caching expensive function results (e.g., search operations)
  - `throttle` for rate-limiting function calls
  - `uniq`, `uniqBy` for array deduplication
  - `groupBy`, `keyBy` for object transformations
- **Avoid Lodash**: es-toolkit provides modern, tree-shakeable alternatives to lodash functions
- **Native Methods**: Use native JavaScript methods when they're sufficient (e.g., `Array.prototype.map`, `filter`, `reduce`)

#### **Search Utilities Organization**

- **Consolidated Module**: All search-related utilities are centralized in `src/utils/searchUtils.ts`
- **Function Exports**: Use individual function exports instead of class-based utilities for better tree-shaking
- **Type Safety**: Import types from `@/types` for consistent type definitions
- **Error Handling**: Use `safeSearchRequest()` for robust error handling in search operations
- **Command Parsing**: Use `parseCommand()` for consistent query parsing across the application
- **Result Creation**: Use standardized result creators (`createSuccessResult`, `createErrorResult`, `createEmptyResult`) for consistent response shapes

### ESLint Configuration

The project uses a comprehensive ESLint setup (`/.eslintrc.cjs`) with:

- **Base**: ESLint recommended + TypeScript recommended rules
- **React**: React hooks rules + Airbnb React style guide
- **Prettier**: Integration for consistent formatting
- **Key Rules**:
  - React Refresh for component exports
  - TypeScript-specific rules for unused vars and shadowing
  - Jest plugin for test files with specific test rules
  - Chrome global for extension APIs
  - TypeScript import resolver for path aliases
- **Important**: All generated code must follow these ESLint rules. Run `pnpm lint` to check

### Navigation & Keyboard Shortcuts

OmniTab supports multiple navigation methods for maximum accessibility:

#### **Opening OmniTab**

- `Ctrl+Shift+K` (Windows/Linux) or `Cmd+Shift+K` (Mac) - Global keyboard shortcut
- Click extension icon in toolbar

#### **Navigation**

- `↑/↓` Arrow Keys - Navigate through results
- `Ctrl+N` / `Ctrl+P` - Emacs-style navigation (next/previous)
- `Tab` - Focus next element (standard behavior)

#### **Actions**

- `Enter` - Execute primary action:
  - **Tabs**: Switch to tab
  - **History/Bookmarks**: Open in new tab
- `Ctrl+Enter` / `Cmd+Enter` - Secondary action:
  - **Tabs**: Close tab
  - **History/Bookmarks**: Same as Enter (open in new tab)
- `Escape` - Close OmniTab

#### **Search Features**

- **Instant Search**: Results update as you type
- **Category Filters**: Use prefixes like "tab", "history", "bookmark", "topsites"
- **Fuzzy Matching**: Intelligent scoring with substring and starts-with matching
- **Category Priority**: Tabs ranked higher than history, history higher than bookmarks, bookmarks higher than topsites
- **Most Visited Sites**: Access Chrome's top sites for quick navigation

### Settings System

OmniTab includes a comprehensive settings system with Chrome storage integration and reactive updates:

#### **Settings Architecture**

The settings system is built with a modular architecture:

- **Settings Service** (`src/services/settingsService.ts`) - Core settings management with Chrome storage integration
- **Settings Manager** (`src/services/settingsManager.ts`) - Settings application and theme management with system preference detection
- **Settings Types** (`src/types/settings.ts`) - Complete type definitions and validation schemas
- **Settings Hooks** - React hooks for reactive settings integration:
  - `src/hooks/useSettings.ts` - Settings state management and updates
  - `src/hooks/useTheme.ts` - Theme management with system preference detection

#### **Settings Schema**

```typescript
interface ExtensionSettings {
  appearance: {
    theme: 'system' | 'light' | 'dark';
  };
  commands: {
    [commandId: string]: {
      enabled: boolean;
    };
  };
  version: number;
}
```

#### **Settings Features**

- **Chrome Storage Integration**: Automatic sync across browser instances using `chrome.storage.sync`
- **Schema Validation**: Runtime validation and migration of settings data
- **Default Settings**: Graceful fallback to defaults when storage is unavailable
- **Change Notifications**: Event-driven updates with listener pattern
- **Theme Management**: System preference detection with manual override support
- **Command Management**: Individual command enable/disable functionality
- **Error Handling**: Robust error handling with graceful degradation
- **Service Worker Support**: Works in both DOM and service worker contexts

#### **Settings Usage**

```typescript
// Using the settings service directly
import { settingsService } from '@/services/settingsService';

// Load settings
const settings = await settingsService.getSettings();

// Update appearance settings
await settingsService.updateSettings('appearance', { theme: 'dark' });

// Check if a command is enabled
const isEnabled = await settingsService.isCommandEnabled('tab.search');

// Using React hooks
import { useSettings } from '@/hooks/useSettings';
import { useTheme } from '@/hooks/useTheme';

function MyComponent() {
  const { settings, updateSettings } = useSettings();
  const { theme, setTheme } = useTheme();

  return (
    <div data-theme={theme}>
      <button onClick={() => setTheme('dark')}>
        Switch to Dark Theme
      </button>
    </div>
  );
}
```

#### **Settings Storage**

- **Storage Key**: `omnitab_settings` in Chrome sync storage
- **Automatic Sync**: Settings automatically sync across browser instances
- **Migration Support**: Automatic migration from older settings versions
- **Validation**: Runtime validation ensures data integrity
- **Error Recovery**: Graceful fallback to defaults on storage errors

### Testing

The project includes comprehensive testing with Jest:

#### **Test Files**

The project has comprehensive test coverage across all major components:

- **Extension Tests**: Each extension has dedicated test files in `__tests__/` subdirectories
- **Component Tests**: React components tested with React Testing Library
- **Utility Tests**: Core utilities have full test coverage including search, keyboard, and URL utilities
- **Service Tests**: Extension registry, message broker, and search service integration tests
- **Store Tests**: Zustand store functionality and state management tests

#### **Test Coverage**

- **Extensions**: Comprehensive testing for all extension types (core, tab, history, bookmark, topsites)
- **Components**: React components tested with user interaction scenarios
- **Utilities**: High coverage for search, keyboard, URL, and store utilities
- **Services**: Extension registry, message broker, search service, and comprehensive settings system with Chrome storage integration
- **Settings System**: Complete test coverage (55 tests total) including:
  - Settings service with Chrome storage mocking and validation testing
  - Settings manager with theme detection and error handling
  - Edge cases for service worker contexts and storage failures
  - Listener patterns and reactive updates
- **Total Test Files**: 29 test files covering all major functionality
- **Test Environment**: Jest with jsdom and React Testing Library support

#### **Running Tests**

```bash
# Run all tests
pnpm test

# Run with coverage report
pnpm test:coverage

# Run in watch mode during development
pnpm test:watch
```

## Release Workflow

This project follows a standardized release process using semantic versioning and GitHub Actions for automated releases.

### Release Process

#### 1. Version Bump Branch

Create a new branch for the version bump:

```bash
git checkout main
git pull origin main
git checkout -b release/v<NEW_VERSION>
```

#### 2. Update Version

Update the version in `package.json`:

```bash
# For patch release (0.3.0 → 0.3.1)
pnpm version patch

# For minor release (0.3.0 → 0.4.0)
pnpm version minor

# For major release (0.3.0 → 1.0.0)
pnpm version major
```

This command will:

- Update the version in `package.json`
- Update the version in `src/manifest.ts` (extension version)
- Create a git commit with the version bump

#### 3. Create Release PR

Push the branch and tag created by `pnpm version` and create a pull request:

```bash
gh pr create --title "Release v<NEW_VERSION>" --body "Bump version to <NEW_VERSION>"
```

#### 4. Merge PR

After review and approval, merge the PR to main:

```bash
gh pr merge --rebase  # Use merge commit for release PRs
```

### Automated Release Workflow

The release is automatically handled by GitHub Actions when a tag is pushed:

1. **Build**: Compiles the extension for production
2. **Test**: Runs all tests to ensure quality
3. **Package**: Creates the extension `.zip` file
4. **Release**: Creates a GitHub release with the packaged extension
5. **Publish**: Optionally publishes to Chrome Web Store (if configured)

### Version Numbering

Follow semantic versioning (SemVer):

- **PATCH** (`0.3.0` → `0.3.1`): Bug fixes and minor improvements
- **MINOR** (`0.3.0` → `0.4.0`): New features that don't break existing functionality
- **MAJOR** (`0.3.0` → `1.0.0`): Breaking changes or major feature overhauls

### Release Notes

When creating the release tag, the GitHub Actions workflow will automatically:

- Generate release notes from commit messages
- Include the built extension package
- Tag the release appropriately

### Manual Release Commands

If you need to perform these steps manually:

```bash
# Check current version
pnpm version --json

# Build for production
pnpm build

# Run tests before release
pnpm test

# Check linting
pnpm lint
```

### Important Notes

- The CRXJS plugin requires a workaround for manifest generation (see `viteManifestHackIssue846` in vite.config.ts)
- Content scripts are configured to inject CSS automatically
- Web accessible resources include all JS/CSS files and public assets
- **Extension Architecture**: All new extensions should follow the modular structure defined in `src/extensions/core/` as the standard template
- **Entry Point**: Always use `src/extensions/index.ts` as the main entry point for importing extension functionality
- **Module Structure**: Extensions with complex logic should be organized into separate modules (constants, actions, search, etc.)
- All components follow single responsibility principle for better maintainability and testing
- Extension-based architecture allows for easy addition of new search providers
- Each extension can provide multiple commands (search or action types)
- Command aliases enable quick access (e.g., 't' for tabs, 'h' for history, 'b' for bookmarks, 'top' for topsites)
- **Constants First**: Replace all hardcoded values with enums and constants defined in a dedicated constants file

### Settings System Integration

When working with the settings system, follow these patterns:

#### **Settings Service Usage**

- **Always use the singleton**: Import `settingsService` instance, not the class
- **Await async operations**: All settings operations are async due to Chrome storage
- **Handle errors gracefully**: Use try-catch blocks for settings operations
- **Use reactive patterns**: Leverage change listeners for real-time updates

#### **Theme Integration**

- **Use data-theme attributes**: Apply themes via `data-theme="dark|light"` on component roots
- **System preference detection**: Use `SettingsManager.getCurrentTheme()` for resolved theme values
- **Store integration**: Theme is automatically loaded and managed in `omniTabStore`
- **Tailwind configuration**: Dark mode uses class-based detection with `[data-theme="dark"]` selector

#### **Command Management**

- **Extension registry integration**: Commands are automatically filtered based on settings
- **Default enabled**: New commands default to enabled unless explicitly disabled
- **Batch operations**: Use `getEnabledCommands()` for bulk command filtering
- **Settings updates**: Command changes trigger automatic re-registration

#### **Testing Settings**

- **Mock Chrome APIs**: Use proper Jest mocking for `chrome.storage` and `chrome.runtime`
- **Test edge cases**: Include service worker contexts and storage failures
- **Validate schemas**: Test settings validation and migration logic
- **Mock window.matchMedia**: Use `Object.defineProperty` for theme detection tests
