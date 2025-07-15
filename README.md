# 🚀 OmniTab - Spotlight for Your Browser

<p align="center">
  <img src="https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Chrome Extension">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License">
</p>

<p align="center">
  <strong>A powerful keyboard-first tab manager that brings a Spotlight-like experience to your browser.</strong>
</p>

<p align="center">
  Instantly search and switch between tabs, browse history, and manage bookmarks with a beautiful command palette interface.
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-usage">Usage</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-development">Development</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-contributing">Contributing</a>
</p>

---

## 📸 Screenshots

<div align="center">
  <img src="./docs/screenshots/search-interface.png" alt="Search Interface" width="600">
  <p><em>Clean, distraction-free search interface with instant results</em></p>
</div>

<div align="center">
  <img src="./docs/screenshots/tab-search.png" alt="Tab Search" width="600">
  <p><em>Search through all your open tabs with fuzzy matching</em></p>
</div>

<div align="center">
  <img src="./docs/screenshots/command-palette.png" alt="Command Palette" width="600">
  <p><em>Access powerful commands with symbol prefixes</em></p>
</div>

> **Note**: Screenshots coming soon! The extension is currently in active development.

## ✨ Features

### 🔍 **Universal Search**

- **Tabs**: Search through all your open tabs by title or URL
- **History**: Browse your browsing history with intelligent filtering
- **Bookmarks**: Find bookmarks across all folders and organize them
- **Commands**: Access powerful system commands and search available commands

### ⌨️ **Keyboard-First Experience**

- **Smart Navigation**: Navigate results with arrow keys or Emacs-style (`Ctrl+N`/`Ctrl+P`)
- **Quick Actions**:
  - `Enter` to switch to tab/open link
  - `Ctrl/Cmd + Enter` for secondary actions (close tab, etc.)
  - `Cmd/Ctrl + K` to open actions menu
- **Command Aliases**: Use shortcuts like `t` (tabs), `h` (history), `b` (bookmarks), `>` (commands)

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
   - `> help` - Search available commands
4. Navigate with arrow keys or `Ctrl+N`/`Ctrl+P`
5. Press `Enter` to execute primary action or `Cmd+K` for more options
6. Press `Escape` to close OmniTab

## 📦 Installation

### Chrome Web Store (Coming Soon)

The extension will be available on the Chrome Web Store once it's ready for public release.

### Manual Installation (Development)

1. Download or clone this repository
2. Run `pnpm install` and `pnpm build` to build the extension
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" in the top right
5. Click "Load unpacked" and select the `dist` folder
6. The extension should now be available in your browser

### System Requirements

- Chrome 88+ (Manifest V3 support)
- Windows, macOS, or Linux

## 🛠️ Development

### Prerequisites

- Node.js 20.x or higher
- pnpm 8.15.0 or higher

### Getting Started

```bash
# Clone the repository
git clone https://github.com/tears330/OmniTab.git
cd OmniTab

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
- **State Management**: Zustand store with es-toolkit optimizations
- **Extension**: Chrome Extension Manifest V3 with modular extension architecture
- **Testing**: Jest with ts-jest, React Testing Library, 49+ comprehensive tests
- **Code Quality**: ESLint (Airbnb config), Prettier, Husky git hooks
- **Package Manager**: pnpm with workspace configuration

## 🏛️ Architecture

OmniTab uses a modern **modular extension architecture** where functionality is organized into standardized, pluggable modules:

### 🏗️ Modular Extension Structure

Extensions follow a standardized structure for maintainability:

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

### 🔧 Core Extensions
- **CoreExtension**: System commands (help, reload, command search)
- **TabExtension**: Tab search, switching, closing, and management
- **HistoryExtension**: Browser history search and navigation
- **BookmarkExtension**: Bookmark search across folders

### ⚡ Key Components

- **Extension Registry**: Manages extension lifecycle and command routing
- **Message Broker**: Handles secure communication between content and background scripts
- **Search Service**: Intelligent search with command parsing and es-toolkit optimizations
- **Zustand Store**: Global state management with debounced search
- **Search Utilities**: Consolidated utilities for command parsing and result handling

### 🛠️ Developer Experience

- **Hot Module Replacement**: Instant updates during development
- **Shadow DOM Isolation**: CSS isolation prevents style conflicts
- **Comprehensive Testing**: 49+ unit tests covering all services and utilities
- **Type Safety**: Full TypeScript coverage with strict mode
- **Modular Architecture**: Consistent extension structure with constants-first approach

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### 🐛 Bug Reports

- Use the [issue tracker](https://github.com/tears330/OmniTab/issues) to report bugs
- Include steps to reproduce, expected behavior, and actual behavior
- Provide browser version and extension version

### 💡 Feature Requests

- Open an issue with the "enhancement" label
- Describe the feature and its use case
- Consider contributing the implementation!

### 🔧 Development

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the [coding standards](./CLAUDE.md)
4. Add tests for new functionality
5. Run tests and linting (`pnpm test && pnpm lint`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### 📋 Development Guidelines

- Follow the modular extension architecture
- Use TypeScript with strict mode
- Write comprehensive tests
- Follow conventional commit messages
- Update documentation for new features

## 🙏 Acknowledgments

- Inspired by macOS Spotlight and similar command palette interfaces
- Built with modern web technologies and Chrome Extension APIs
- Thanks to all contributors and the open-source community

## 📞 Support

- 📧 Email: [Create an issue](https://github.com/tears330/OmniTab/issues)
- 📖 Documentation: [CLAUDE.md](./CLAUDE.md)
- 🐛 Bug Reports: [Issue Tracker](https://github.com/tears330/OmniTab/issues)

---

<p align="center">
  <strong>Made with ❤️ for developers who love keyboard shortcuts</strong>
</p>

<p align="center">
  <a href="https://github.com/tears330/OmniTab/stargazers">⭐ Star this project</a> •
  <a href="https://github.com/tears330/OmniTab/fork">🍴 Fork this project</a> •
  <a href="https://github.com/tears330/OmniTab/issues">🐛 Report a bug</a>
</p>
