# 🚀 OmniTab - Spotlight for Your Browser

OmniTab is a powerful keyboard-first tab manager that brings a Spotlight-like experience to your browser. Instantly search and switch between tabs, browse history, and manage bookmarks with a beautiful command palette interface.

## ✨ Features

### 🔍 **Universal Search**

- **Tabs**: Search through all your open tabs by title or URL
- **History**: Browse your browsing history with intelligent filtering
- **Bookmarks**: Find bookmarks across all folders and organize them
- **Commands**: Access powerful tab management commands like duplicate removal and grouping

### ⌨️ **Keyboard-First Experience**

- **Smart Navigation**: Navigate results with arrow keys or Emacs-style (`Ctrl+N`/`Ctrl+P`)
- **Quick Actions**:
  - `Enter` to switch to tab/open link
  - `Ctrl/Cmd + Enter` for secondary actions (close tab, etc.)
  - `Cmd/Ctrl + K` to open actions menu
- **Command Aliases**: Use shortcuts like `t` (tabs), `h` (history), `b` (bookmarks)

### 🎨 **Modern Interface**

- **Minimal UI**: Clean, distraction-free interface that appears on demand
- **Shadow DOM Isolation**: Styles don't interfere with web pages
- **Fast & Responsive**: Built with performance in mind using React 19 and TypeScript

### 🔧 **Advanced Features**

- **Tab Grouping**: Automatically group tabs by domain (`group-by-domain` command)
- **Duplicate Management**: Find and close duplicate tabs (`close-all-duplicates` command)
- **Smart Search**: Context-aware filtering (e.g., "t github" searches only tabs)
- **Extension Architecture**: Modular, pluggable design for extensibility

## 🎯 Usage

1. Press `Ctrl+Shift+K` (Windows/Linux) or `Cmd+Shift+K` (Mac) to open OmniTab
2. Start typing to search across tabs, history, and bookmarks
3. Use prefixes for focused search:
   - `t google` - Search only tabs containing "google"
   - `h reddit` - Search only history for "reddit"
   - `b docs` - Search only bookmarks for "docs"
4. Navigate with arrow keys or `Ctrl+N`/`Ctrl+P`
5. Press `Enter` to execute primary action or `Cmd+K` for more options
6. Press `Escape` to close OmniTab

## 🛠️ Development

### Prerequisites

- Node.js 20.x or higher
- pnpm 8.15.0 or higher

### Getting Started

```bash
# Clone the repository
git clone https://github.com/yourusername/omnitab.git
cd omnitab

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run linting
pnpm lint
```

### Loading the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist` folder from your project

## 🏗️ Tech Stack

- **Framework**: React 19 with TypeScript (strict mode)
- **Build Tool**: Vite with CRXJS plugin for Chrome extension bundling
- **Styling**: Tailwind CSS + DaisyUI component library
- **Extension**: Chrome Extension Manifest V3 with extension-based architecture
- **Testing**: Jest with ts-jest, React Testing Library, 88+ comprehensive tests
- **Code Quality**: ESLint (Airbnb config), Prettier, Husky git hooks
- **Package Manager**: pnpm with workspace configuration

## 🏛️ Architecture

OmniTab uses a modern **extension-based architecture** where functionality is organized into pluggable modules:

### Core Extensions

- **TabExtension**: Tab search, switching, closing, and management commands
- **HistoryExtension**: Browser history search and navigation
- **BookmarkExtension**: Bookmark search across folders
- **CoreExtension**: System commands (help, settings, etc.)

### Key Components

- **Extension Registry**: Manages extension lifecycle and command routing
- **Message Broker**: Handles secure communication between content and background scripts
- **Search Service**: Intelligent search with fuzzy matching and command parsing
- **React Context**: State management with reducer pattern

### Developer Experience

- **Hot Module Replacement**: Instant updates during development
- **Shadow DOM Isolation**: CSS isolation prevents style conflicts
- **Comprehensive Testing**: Unit tests for all services and utilities
- **Type Safety**: Full TypeScript coverage with strict mode

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
