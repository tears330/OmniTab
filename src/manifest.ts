import { defineManifest } from '@crxjs/vite-plugin';

import packageData from '../package.json';

const isDev = process.env.NODE_ENV === 'development';

export default defineManifest({
  manifest_version: 3,
  name: `${packageData.displayName || packageData.name} - Ultimate Launcher for Browser${
    isDev ? ` ➡️ Dev` : ''
  }`,
  short_name: 'OmniTab',
  version: packageData.version,
  description: packageData.description,
  author: { email: 'support@omnitab.app' },
  homepage_url: 'https://github.com/tears330/OmniTab',
  minimum_chrome_version: '90',
  offline_enabled: true,
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  icons: {
    16: 'icon16.png',
    32: 'icon32.png',
    48: 'icon48.png',
    128: 'icon128.png',
  },
  permissions: ['tabs', 'history', 'bookmarks', 'favicon', 'topSites'],
  optional_permissions: ['tabGroups'],
  host_permissions: [],
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self'",
  },
  action: {
    default_title: 'Open OmniTab search (Ctrl/Cmd+Shift+K)',
    default_icon: {
      16: 'icon16.png',
      32: 'icon32.png',
      48: 'icon48.png',
      128: 'icon128.png',
    },
  },
  commands: {
    _execute_action: {
      suggested_key: {
        default: 'Ctrl+Shift+K',
        mac: 'Command+Shift+K',
      },
      description: 'Open OmniTab search',
    },
  },
  content_scripts: [
    {
      js: isDev
        ? ['src/content/index.dev.tsx']
        : ['src/content/index.prod.tsx'],
      matches: ['<all_urls>'],
    },
  ],
  web_accessible_resources: [
    {
      resources: ['*.js', '*.css', 'public/*', '*.png', '_favicon/*'],
      matches: ['<all_urls>'],
    },
  ],
});
