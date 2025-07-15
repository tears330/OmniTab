# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OmniTab is a keyboard-first tab manager Chrome extension that provides a Spotlight-like interface for searching and switching between browser tabs. Built with Vite, TypeScript, React, Tailwind CSS, and DaisyUI.

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
└── bookmark/ (bookmark search)
```

### Core Extensions

- **CoreExtension** (`src/extensions/core/`) - System commands (help, reload) with modular structure
- **TabExtension** (`src/extensions/TabExtension.ts`) - Tab search, switch, close, duplicate management
- **HistoryExtension** (`src/extensions/HistoryExtension.ts`) - Browser history search
- **BookmarkExtension** (`src/extensions/BookmarkExtension.ts`) - Bookmark search

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
- **Manifest**: `src/manifest.ts` - Chrome extension manifest v3 with keyboard shortcut (Ctrl/Cmd+J) and tab permissions

### Modular Architecture (Refactored)

The main OmniTab component has been refactored into a clean, modular architecture:

#### **Utility Functions**

- `src/utils/searchUtils.ts` - **Core search utilities** including command parsing, result creation, and safe search operations
- `src/utils/urlUtils.ts` - URL-related utility functions including domain extraction and favicon resolution
- `src/utils/keyboardUtils.ts` - Keyboard event utilities and Emacs navigation support
- `src/utils/resultActions.ts` - Search result action handling with type-specific logic
- `src/utils/createShadowRoot.tsx` - Shadow DOM creation utility for style isolation

#### **Custom Hooks**

- `src/hooks/useSearchResults.ts` - Search state management, loading, and debouncing
- `src/hooks/useResultNavigation.ts` - Selection state and navigation logic
- `src/hooks/useKeyboardNavigation.ts` - Keyboard event handling and action execution
- **Zustand Store Integration**: Components use `useOmniTabStore` directly for optimal performance and automatic reactivity

#### **Reusable Components**

- `src/components/SearchInput.tsx` - Search input field with keyboard handling
- `src/components/ResultItem.tsx` - Individual result item with favicon and actions
- `src/components/ResultsList.tsx` - Container for all results with scrolling
- `src/components/StatusBar.tsx` - Loading indicator and context-sensitive shortcuts
- `src/components/EmptyState.tsx` - No results messaging with helpful hints

### Key Technologies & Configuration

- **Package Manager**: pnpm (v10.13.1+) with workspace configuration
- **Build Tool**: Vite with CRXJS plugin for Chrome extension bundling
- **TypeScript**: Strict mode enabled, path aliases configured (`@/*` → `src/*`)
- **React**: v19.1.0 with React Refresh for development
- **State Management**: Zustand for global state management with TypeScript support
- **Utility Library**: es-toolkit for optimized utility functions (debounce, clamp, etc.)
- **Styling**: Tailwind CSS + DaisyUI component library
- **Testing**: Jest with ts-jest, @testing-library/react, jsdom environment
- **Linting**: ESLint with Airbnb config + TypeScript rules + Jest plugin
- **Formatting**: Prettier with import sorting and Tailwind class ordering
- **Git Hooks**: Husky + lint-staged for pre-commit checks

### Development Workflow

1. Content scripts use shadow DOM via `createShadowRoot` utility to isolate styles
2. Dev mode includes visual indicators (e.g., "➡️ Dev" in extension name)
3. Font assets are bundled and served from `src/assets/fonts/`
4. Fallback icons are accessible via `chrome.runtime.getURL('icon16.png')` - icons are included in `web_accessible_resources` for production builds
5. Permissions: `activeTab` and `storage` are configured in manifest

### Code Quality Tools

- **Commit Convention**: Conventional commits enforced via commitlint
- **Pre-commit**: Automatically runs ESLint fix and Prettier formatting on staged files
- **Import Order**: Enforced by Prettier plugin with specific grouping (built-ins → React → types → third-party → local → styles)
- **Testing**: Comprehensive unit tests with 93%+ coverage for fuzzy search algorithm
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
- **Category Filters**: Use prefixes like "tab", "history", "bookmark"
- **Fuzzy Matching**: Intelligent scoring with substring and starts-with matching
- **Category Priority**: Tabs ranked higher than history, history higher than bookmarks

### Testing

The project includes comprehensive testing with Jest:

#### **Test Files**

- `src/utils/__tests__/searchUtils.test.ts` - 21 tests covering search utilities (command parsing, result creation, safe operations)
- `src/services/__tests__/searchService.test.ts` - 10 tests covering search service integration
- `src/content/__tests__/OmniTab.actions.test.tsx` - 18 tests covering action system and Emacs navigation

#### **Test Coverage**

- **Search Utilities**: 100% coverage for all search-related functions including command parsing and result creation
- **Search Service**: Comprehensive integration testing with mocked dependencies
- **Total Tests**: 49+ tests, all passing
- **Test Environment**: jsdom with React Testing Library support

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

Push the branch and create a pull request:

```bash
git push -u origin release/v<NEW_VERSION>
gh pr create --title "Release v<NEW_VERSION>" --body "Bump version to <NEW_VERSION>"
```

#### 4. Merge PR

After review and approval, merge the PR to main:

```bash
gh pr merge --merge  # Use merge commit for release PRs
```

#### 5. Create Release Tag

Create and push the release tag to trigger the GitHub Actions release workflow:

```bash
git checkout main
git pull origin main
git tag v<NEW_VERSION>
git push origin v<NEW_VERSION>
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
- Command aliases enable quick access (e.g., 't' for tabs, 'h' for history, 'b' for bookmarks)
- **Constants First**: Replace all hardcoded values with enums and constants defined in a dedicated constants file
