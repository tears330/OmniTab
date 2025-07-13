# 🚀 OmniTab - Spotlight for Your Browser

OmniTab is a keyboard-first tab manager that brings a Spotlight-like experience to your browser. Instantly search and switch between tabs with a beautiful command palette interface.

## ✨ Features

- **Instant Search**: Search through all your open tabs by title or URL
- **Keyboard Navigation**: Navigate results with arrow keys
- **Quick Actions**:
  - `Enter` to switch to a tab
  - `Ctrl/Cmd + Enter` to close a tab
- **Minimal UI**: Clean, distraction-free interface that appears on demand
- **Fast & Responsive**: Built with performance in mind

## 🎯 Usage

1. Press `Ctrl+J` (Windows/Linux) or `Cmd+J` (Mac) to open OmniTab
2. Start typing to search through your tabs
3. Use arrow keys to navigate results
4. Press `Enter` to switch to the selected tab
5. Press `Escape` to close OmniTab

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
```

### Loading the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist` folder from your project

## 🏗️ Tech Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite with CRXJS plugin
- **Styling**: Tailwind CSS + DaisyUI
- **Extension**: Chrome Extension Manifest V3

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
