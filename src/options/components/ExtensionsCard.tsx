import { JSX, useCallback, useEffect, useState } from 'react';
import type { Command } from '@/types/extension';

import useSettings from '@/hooks/useSettings';

interface CommandItemProps {
  command: Command;
  enabled: boolean;
  onToggle: (commandId: string, enabled: boolean) => void;
  disabled?: boolean;
}

function CommandItem({
  command,
  enabled,
  onToggle,
  disabled = false,
}: CommandItemProps): JSX.Element {
  const handleToggle = useCallback(() => {
    if (!disabled) {
      onToggle(command.id, !enabled);
    }
  }, [command.id, enabled, onToggle, disabled]);

  const typeIcon = command.type === 'search' ? '🔍' : '⚡';
  const aliases =
    command.alias && command.alias.length > 0 ? command.alias : null;

  return (
    <div
      className={`flex items-center justify-between px-4 py-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/50 ${disabled ? 'opacity-60' : ''}`}
    >
      <div className='flex min-w-0 flex-1 items-center gap-3'>
        <span className='flex-shrink-0 text-sm'>{typeIcon}</span>

        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-2'>
            <span
              className={`truncate text-sm font-medium ${disabled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}
            >
              {command.name}
            </span>
            {disabled && (
              <span className='inline-flex flex-shrink-0 items-center rounded bg-yellow-100 px-1.5 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'>
                System
              </span>
            )}
            {aliases && (
              <div className='flex flex-shrink-0 items-center gap-1'>
                {aliases.map((alias) => (
                  <span
                    key={alias}
                    className='inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 font-mono text-xs font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                  >
                    <kbd className='font-mono text-xs'>{alias}</kbd>
                  </span>
                ))}
              </div>
            )}
          </div>
          <p
            className={`mt-0.5 truncate text-xs ${disabled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400'}`}
          >
            {command.description}
          </p>
        </div>
      </div>

      <div className='ml-3 flex-shrink-0'>
        <label
          className={`relative inline-flex items-center ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          htmlFor={`toggle-${command.id}`}
        >
          <input
            id={`toggle-${command.id}`}
            type='checkbox'
            className='peer sr-only'
            checked={enabled}
            onChange={handleToggle}
            disabled={disabled}
          />
          <div
            className={`peer h-5 w-9 rounded-full after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-focus:outline-none peer-focus:ring-2 ${disabled ? 'bg-gray-300 after:bg-gray-200 dark:bg-gray-600 dark:after:bg-gray-400' : 'bg-gray-200 peer-checked:bg-blue-600 peer-checked:after:translate-x-4 peer-checked:after:border-white peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800'}`}
          />
          <span className='sr-only'>Toggle command</span>
        </label>
      </div>
    </div>
  );
}

// Helper function to check if a command belongs to the core extension
function isCoreCommand(commandId: string): boolean {
  return commandId.startsWith('core.');
}

// Helper function to group commands by extension
function groupCommandsByExtension(
  commands: Command[]
): Record<string, Command[]> {
  return commands.reduce(
    (groups, command) => {
      const extensionName = command.id.split('.')[0];
      const updatedGroups = { ...groups };
      if (!updatedGroups[extensionName]) {
        updatedGroups[extensionName] = [];
      }
      updatedGroups[extensionName].push(command);
      return updatedGroups;
    },
    {} as Record<string, Command[]>
  );
}

export default function ExtensionsCard(): JSX.Element {
  const [commands, setCommands] = useState<Command[]>([]);
  const [commandsLoading, setCommandsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use the settings hook for command state management
  const {
    loading: settingsLoading,
    setCommandEnabled,
    isCommandEnabled,
  } = useSettings();

  // Load available commands
  useEffect(() => {
    const loadCommands = async () => {
      try {
        setCommandsLoading(true);
        setError(null);

        // Get all commands from extension registry
        if (typeof chrome !== 'undefined' && chrome.runtime) {
          const response = await chrome.runtime.sendMessage({
            action: 'get-all-commands',
          });

          if (response.success) {
            const allCommands = response.data.commands || [];
            setCommands(allCommands);
          } else {
            setError('Failed to load commands');
          }
        } else {
          setError('Chrome extension APIs not available');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setCommandsLoading(false);
      }
    };

    loadCommands();
  }, []);

  const handleToggleCommand = useCallback(
    async (commandId: string, enabled: boolean) => {
      // Prevent toggling core commands
      if (isCoreCommand(commandId)) {
        return;
      }

      try {
        await setCommandEnabled(commandId, enabled);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to update command'
        );
      }
    },
    [setCommandEnabled]
  );

  // Show loading if either commands or settings are still loading
  const loading = commandsLoading || settingsLoading;

  if (loading) {
    return (
      <div className='rounded-2xl bg-white shadow-sm transition-all duration-200 hover:shadow-md dark:bg-gray-900'>
        <div className='p-6'>
          <div className='flex items-center gap-3'>
            <div className='h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent' />
            <span className='text-gray-600 dark:text-gray-400'>
              Loading commands...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='rounded-2xl bg-red-50 shadow-sm transition-all duration-200 hover:shadow-md dark:bg-red-900/20'>
        <div className='p-6'>
          <div className='flex items-center gap-3'>
            <span className='text-red-600 dark:text-red-400'>❌</span>
            <div>
              <h3 className='font-medium text-red-800 dark:text-red-300'>
                Error loading commands
              </h3>
              <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
                {error}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const groupedCommands = groupCommandsByExtension(commands);
  const extensionNames = Object.keys(groupedCommands).sort((a, b) => {
    // Sort core first, then alphabetically
    if (a === 'core') return -1;
    if (b === 'core') return 1;
    return a.localeCompare(b);
  });

  return (
    <div className='rounded-2xl bg-white shadow-sm transition-all duration-200 hover:shadow-md dark:bg-gray-900'>
      <div className='p-6'>
        <div className='mb-6'>
          <h2 className='text-base font-semibold text-gray-900 dark:text-white'>
            Extension Commands
          </h2>
          <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
            Control which commands appear in search results. Core commands
            cannot be disabled.
          </p>
        </div>

        {commands.length === 0 ? (
          <div className='rounded-lg bg-gray-50 p-6 text-center dark:bg-gray-800'>
            <span className='text-2xl'>🧩</span>
            <h3 className='mt-2 font-medium text-gray-900 dark:text-white'>
              No commands found
            </h3>
            <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
              No extension commands are currently available.
            </p>
          </div>
        ) : (
          <div className='space-y-6'>
            {extensionNames.map((extensionId) => (
              <div key={extensionId}>
                <div className='mb-3'>
                  <h3 className='text-sm font-semibold uppercase tracking-wide text-gray-900 dark:text-white'>
                    {extensionId}
                    <span className='ml-2 text-xs font-normal lowercase text-gray-600 dark:text-gray-400'>
                      {groupedCommands[extensionId].length} commands
                    </span>
                  </h3>
                </div>
                <div className='divide-y divide-gray-100 rounded-lg bg-gray-50 dark:divide-gray-700/50 dark:bg-gray-800/30'>
                  {groupedCommands[extensionId].map((command) => (
                    <CommandItem
                      key={command.id}
                      command={command}
                      enabled={isCommandEnabled(command.id)}
                      onToggle={handleToggleCommand}
                      disabled={isCoreCommand(command.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className='mt-6 rounded-2xl bg-blue-50 p-6 shadow-sm transition-all duration-200 dark:bg-blue-900/20'>
          <div className='flex items-start gap-3'>
            <span className='text-blue-600 dark:text-blue-400'>💡</span>
            <div>
              <h4 className='text-base font-semibold text-blue-800 dark:text-blue-300'>
                Quick Tip
              </h4>
              <p className='mt-1 text-sm text-blue-600 dark:text-blue-400'>
                Changes apply instantly. Disabled commands won&apos;t appear in
                search results.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
