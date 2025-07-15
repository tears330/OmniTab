# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OmniTab is a keyboard-first tab manager Chrome extension that provides a Spotlight-like interface for searching and switching between browser tabs. Built with Vite, TypeScript, React, Tailwind CSS, and DaisyUI.

## Extension-Based Architecture (New)

OmniTab now uses a modular extension-based architecture where functionality is organized into pluggable extensions:

### Core Extensions

- **CoreExtension** (`src/extensions/CoreExtension.ts`) - System commands (help, reload)
- **TabExtension** (`src/extensions/TabExtension.ts`) - Tab search, switch, close, duplicate management
- **HistoryExtension** (`src/extensions/HistoryExtension.ts`) - Browser history search
- **BookmarkExtension** (`src/extensions/BookmarkExtension.ts`) - Bookmark search

### Architecture Components

- **Extension Registry** (`src/services/extensionRegistry.ts`) - Manages extension lifecycle and command routing
- **Message Broker** (`src/services/messageBroker.ts`) - Handles communication between content and background scripts
- **OmniTab Context** (`src/contexts/OmniTabContext.tsx`) - React context for state management and extension interaction

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

- `src/utils/faviconUtils.ts` - Favicon URL resolution and error handling
- `src/utils/resultActions.ts` - Search result action handling with type-specific logic
- `src/utils/keyboardUtils.ts` - Keyboard event utilities and Emacs navigation support
- `src/utils/fuzzySearch.ts` - Intelligent fuzzy search with category-based scoring
- `src/utils/urlUtils.ts` - URL-related utility functions including domain extraction from URL

#### **Custom Hooks**

- `src/hooks/useSearchResults.ts` - Search state management, loading, and debouncing
- `src/hooks/useResultNavigation.ts` - Selection state and navigation logic
- `src/hooks/useKeyboardNavigation.ts` - Keyboard event handling and action execution

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

- `Ctrl+J` (Windows/Linux) or `Cmd+J` (Mac) - Global keyboard shortcut
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

- `src/utils/__tests__/fuzzySearch.test.ts` - 30 tests covering fuzzy search algorithm
- `src/content/__tests__/OmniTab.actions.test.tsx` - 18 tests covering action system and Emacs navigation

#### **Test Coverage**

- **Fuzzy Search**: 93.96% statement coverage, 85.91% branch coverage
- **Total Tests**: 48 tests, all passing
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

### Important Notes

- The CRXJS plugin requires a workaround for manifest generation (see `viteManifestHackIssue846` in vite.config.ts)
- Content scripts are configured to inject CSS automatically
- Web accessible resources include all JS/CSS files and public assets
- The refactored architecture supports both the original monolithic component and the new modular structure
- All components follow single responsibility principle for better maintainability and testing
- Extension-based architecture allows for easy addition of new search providers
- Each extension can provide multiple commands (search or action types)
- Command aliases enable quick access (e.g., 't' for tabs, 'h' for history, 'b' for bookmarks)
