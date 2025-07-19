/* eslint-disable max-classes-per-file */
import type {
  ActionPayload,
  Command,
  Extension,
  ExtensionResponse,
  SearchPayload,
  SearchResponse,
} from '@/types/extension';

import { buildCommandId } from '@/utils/searchUtils';

import { getBackgroundBroker } from './messageBroker';
import { settingsService } from './settingsService';

// Abstract base class for extensions
export abstract class BaseExtension implements Extension {
  abstract id: string;

  abstract name: string;

  abstract description?: string;

  abstract icon?: string;

  abstract commands: Command[];

  // eslint-disable-next-line class-methods-use-this
  async initialize(): Promise<void> {
    // Override in subclasses if needed
  }

  // eslint-disable-next-line class-methods-use-this
  async destroy(): Promise<void> {
    // Override in subclasses if needed
  }

  abstract handleSearch(
    commandId: string,
    payload: SearchPayload
  ): Promise<SearchResponse>;

  abstract handleAction(
    commandId: string,
    payload: ActionPayload
  ): Promise<ExtensionResponse>;
}

// Extension registry singleton
export class ExtensionRegistry {
  // eslint-disable-next-line no-use-before-define
  private static instance: ExtensionRegistry;

  private extensions = new Map<string, BaseExtension>();

  private broker = getBackgroundBroker();

  // eslint-disable-next-line no-useless-constructor, no-empty-function
  private constructor() {}

  static getInstance(): ExtensionRegistry {
    if (!ExtensionRegistry.instance) {
      ExtensionRegistry.instance = new ExtensionRegistry();
    }
    return ExtensionRegistry.instance;
  }

  async registerExtension(extension: BaseExtension): Promise<void> {
    if (this.extensions.has(extension.id)) {
      throw new Error(`Extension ${extension.id} is already registered`);
    }

    // Initialize the extension
    await extension.initialize();

    // Register with message broker
    this.broker.registerExtension(extension.id, {
      handleSearch: (commandId, payload) =>
        extension.handleSearch(commandId, payload),
      handleAction: (commandId, payload) =>
        extension.handleAction(commandId, payload),
    });

    // Store the extension
    this.extensions.set(extension.id, extension);
  }

  async unregisterExtension(extensionId: string): Promise<void> {
    const extension = this.extensions.get(extensionId);
    if (!extension) {
      return;
    }

    // Destroy the extension
    await extension.destroy();

    // Unregister from message broker
    this.broker.unregisterExtension(extensionId);

    // Remove from registry
    this.extensions.delete(extensionId);
  }

  getExtension(extensionId: string): BaseExtension | undefined {
    return this.extensions.get(extensionId);
  }

  getAllExtensions(): BaseExtension[] {
    return Array.from(this.extensions.values());
  }

  getAllCommands(): Command[] {
    const commands: Command[] = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const extension of this.extensions.values()) {
      commands.push(
        ...extension.commands.map((cmd) => ({
          ...cmd,
          // Add extension context to commands
          id: buildCommandId(extension.id, cmd.id),
          icon: cmd.icon || extension.icon,
        }))
      );
    }
    return commands;
  }

  async getEnabledCommands(): Promise<Command[]> {
    const allCommands = this.getAllCommands();
    const enabledCommands: Command[] = [];

    // Filter out disabled commands based on settings
    // eslint-disable-next-line no-restricted-syntax
    for (const command of allCommands) {
      // eslint-disable-next-line no-await-in-loop
      const isEnabled = await settingsService.isCommandEnabled(command.id);
      if (isEnabled) {
        enabledCommands.push(command);
      }
    }

    return enabledCommands;
  }

  findCommandByAlias(
    alias: string
  ): { extension: BaseExtension; command: Command } | undefined {
    // eslint-disable-next-line no-restricted-syntax
    for (const extension of this.extensions.values()) {
      // eslint-disable-next-line no-restricted-syntax
      for (const command of extension.commands) {
        if (command.alias?.includes(alias.toLowerCase())) {
          return { extension, command };
        }
      }
    }
    return undefined;
  }

  async destroy(): Promise<void> {
    // Unregister all extensions
    const extensionIds = Array.from(this.extensions.keys());
    // eslint-disable-next-line no-restricted-syntax
    for (const id of extensionIds) {
      // eslint-disable-next-line no-await-in-loop
      await this.unregisterExtension(id);
    }
  }
}
