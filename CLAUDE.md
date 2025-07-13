# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OmniTab is a keyboard-first tab manager Chrome extension that provides a Spotlight-like interface for searching and switching between browser tabs. Built with Vite, TypeScript, React, Tailwind CSS, and DaisyUI.

## Key Commands

```bash
# Development (hot reload enabled)
pnpm dev

# Build for production
pnpm build

# Run ESLint
pnpm lint

# Preview production build
pnpm preview
```

## Architecture Overview

### Extension Structure

- **Background Service Worker**: `src/background/index.ts` - Handles keyboard commands, tab search, switching, and closing operations
- **Content Script**: `src/content/` - Injects the OmniTab search overlay into web pages
  - `Content.tsx` - Main container that manages overlay visibility
  - `OmniTab.tsx` - The search interface component with keyboard navigation
- **Manifest**: `src/manifest.ts` - Chrome extension manifest v3 with keyboard shortcut (Ctrl/Cmd+J) and tab permissions

### Key Technologies & Configuration

- **Package Manager**: pnpm (v10.13.1+) with workspace configuration
- **Build Tool**: Vite with CRXJS plugin for Chrome extension bundling
- **TypeScript**: Strict mode enabled, path aliases configured (`@/*` → `src/*`)
- **React**: v19.1.0 with React Refresh for development
- **Styling**: Tailwind CSS + DaisyUI component library
- **Linting**: ESLint with Airbnb config + TypeScript rules
- **Formatting**: Prettier with import sorting and Tailwind class ordering
- **Git Hooks**: Husky + lint-staged for pre-commit checks

### Development Workflow

1. Content scripts use shadow DOM via `createShadowRoot` utility to isolate styles
2. Dev mode includes visual indicators (e.g., "➡️ Dev" in extension name)
3. Font assets are bundled and served from `src/assets/fonts/`
4. Permissions: `activeTab` and `storage` are configured in manifest

### Code Quality Tools

- **Commit Convention**: Conventional commits enforced via commitlint
- **Pre-commit**: Automatically runs ESLint fix and Prettier formatting on staged files
- **Import Order**: Enforced by Prettier plugin with specific grouping (built-ins → React → types → third-party → local → styles)

### Important Notes

- The CRXJS plugin requires a workaround for manifest generation (see `viteManifestHackIssue846` in vite.config.ts)
- Content scripts are configured to inject CSS automatically
- Web accessible resources include all JS/CSS files and public assets
