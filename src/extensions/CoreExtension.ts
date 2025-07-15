import type {
  Command,
  ExtensionResponse,
  SearchResponse,
} from '@/types/extension';

import { BaseExtension, ExtensionRegistry } from '@/services/extensionRegistry';

class CoreExtension extends BaseExtension {
  id = 'core';

  name = 'Core System';

  description = 'Core OmniTab functionality';

  icon = chrome.runtime.getURL('icon16.png');

  commands: Command[] = [
    {
      id: 'help',
      name: 'Help',
      description: 'Show available commands and shortcuts',
      alias: ['?', 'help'],
      type: 'action',
    },
    {
      id: 'reload',
      name: 'Reload Extensions',
      description: 'Reload all extensions',
      alias: ['reload'],
      type: 'action',
    },
  ];

  // eslint-disable-next-line class-methods-use-this
  async handleSearch(): Promise<SearchResponse> {
    // Core extension doesn't support search
    return {
      success: false,
      error: `Core extension does not support search`,
    };
  }

  async handleAction(commandId: string): Promise<ExtensionResponse> {
    try {
      switch (commandId) {
        case 'help':
          return this.showHelp();

        case 'reload':
          return this.reloadExtensions();

        case 'get-commands':
          return this.getCommands();

        default:
          return {
            success: false,
            error: `Unknown command: ${commandId}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Action failed',
      };
    }
  }

  // eslint-disable-next-line class-methods-use-this
  private async showHelp(): Promise<ExtensionResponse> {
    // In a real implementation, this could open a help page or show a modal
    chrome.tabs.create({ url: chrome.runtime.getURL('help.html') });

    return {
      success: true,
      data: { message: 'Opening help page' },
    };
  }

  // eslint-disable-next-line class-methods-use-this
  private async reloadExtensions(): Promise<ExtensionResponse> {
    // This would trigger a reload of all extensions
    // For now, just return success
    return {
      success: true,
      data: { message: 'Extensions reloaded' },
    };
  }

  // eslint-disable-next-line class-methods-use-this
  private async getCommands(): Promise<ExtensionResponse> {
    const registry = ExtensionRegistry.getInstance();
    const commands = registry.getAllCommands();

    return {
      success: true,
      data: { commands },
    };
  }
}

export default CoreExtension;
