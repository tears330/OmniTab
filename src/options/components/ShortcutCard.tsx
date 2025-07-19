import { JSX, useEffect, useState } from 'react';

import SettingField from './SettingField';

interface ShortcutCardProps {
  onOpenSettings: () => void;
}

interface ShortcutKey {
  key: string;
  isModifier: boolean;
  isPrimary?: boolean;
}

function parseShortcut(shortcut: string): ShortcutKey[] {
  if (!shortcut) return [];

  // Handle symbol-based shortcuts like "⇧⌘K" or text-based like "Shift+Command+K"
  let keys: string[] = [];

  if (shortcut.includes('+')) {
    // Text-based format: "Shift+Command+K"
    keys = shortcut.split('+').map((k) => k.trim());
  } else {
    // Symbol-based format: "⇧⌘K"
    const symbolMap: Record<string, string> = {
      '⇧': 'Shift',
      '⌘': '⌘',
      '⌃': 'Ctrl',
      '⌥': 'Alt',
      '⊞': 'Win',
    };

    // Split the string into individual characters and map symbols
    const chars = Array.from(shortcut);
    const mappedKeys: string[] = [];
    let remainingChars = '';

    chars.forEach((char) => {
      if (symbolMap[char]) {
        if (remainingChars) {
          mappedKeys.push(remainingChars);
          remainingChars = '';
        }
        mappedKeys.push(symbolMap[char]);
      } else {
        remainingChars += char;
      }
    });

    if (remainingChars) {
      mappedKeys.push(remainingChars);
    }

    keys = mappedKeys;
  }

  // Normalize key names
  const normalizedKeys = keys.map((key) => {
    if (key === 'Command') return '⌘';
    if (key === 'Ctrl') return 'Ctrl';
    if (key === 'Shift') return 'Shift';
    if (key === 'Alt') return 'Alt';
    if (key === 'Win') return 'Win';
    return key;
  });

  // Separate modifiers from primary key
  const modifiers: string[] = [];
  const primaryKeys: string[] = [];

  normalizedKeys.forEach((key) => {
    if (['⌘', 'Ctrl', 'Shift', 'Alt', 'Win'].includes(key)) {
      modifiers.push(key);
    } else {
      primaryKeys.push(key);
    }
  });

  // Sort modifiers in standard order: Ctrl/Cmd → Shift → Alt → Win
  const modifierOrder = ['Ctrl', '⌘', 'Shift', 'Alt', 'Win'];
  const sortedModifiers = modifiers.sort(
    (a, b) => modifierOrder.indexOf(a) - modifierOrder.indexOf(b)
  );

  // Combine sorted modifiers with primary keys
  const orderedKeys = [...sortedModifiers, ...primaryKeys];

  return orderedKeys.map((key, index) => {
    const isLastKey = index === orderedKeys.length - 1;
    return {
      key,
      isModifier: !isLastKey,
      isPrimary: isLastKey,
    };
  });
}

export default function ShortcutCard({
  onOpenSettings,
}: ShortcutCardProps): JSX.Element {
  const [shortcut, setShortcut] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadShortcut = async () => {
      try {
        if (typeof chrome !== 'undefined' && chrome.commands) {
          const commands = await chrome.commands.getAll();
          const executeActionCommand = commands.find(
            (cmd) => cmd.name === '_execute_action'
          );
          if (executeActionCommand?.shortcut) {
            setShortcut(executeActionCommand.shortcut);
          } else {
            // Fallback to default shortcut if none is set
            setShortcut('Ctrl+Shift+K');
          }
        } else {
          // Fallback for non-extension environment
          setShortcut('Ctrl+Shift+K');
        }
      } catch (error) {
        // Fallback on error
        setShortcut('Ctrl+Shift+K');
      } finally {
        setLoading(false);
      }
    };

    loadShortcut();
  }, []);

  const shortcutKeys = parseShortcut(shortcut);

  if (loading) {
    return (
      <SettingField
        title='Keyboard Shortcut'
        description='Quick access to OmniTab from any page'
      >
        <div className='flex items-center gap-2'>
          <div className='h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent' />
          <span className='text-sm text-gray-500 dark:text-gray-400'>
            Loading...
          </span>
        </div>
      </SettingField>
    );
  }
  return (
    <SettingField
      title='Keyboard Shortcut'
      description='Quick access to OmniTab from any page'
    >
      <button
        type='button'
        onClick={onOpenSettings}
        className='flex items-center justify-center gap-2 rounded-lg transition-all duration-200 hover:scale-105 focus:outline-none'
      >
        {shortcutKeys.map((keyInfo, index) => (
          <div
            key={`shortcut-${keyInfo.key}-${keyInfo.isModifier ? 'mod' : 'primary'}`}
            className='flex items-center gap-2'
          >
            <kbd
              className={`inline-flex items-center rounded-lg border px-3 py-2 text-sm font-bold shadow-md ${
                keyInfo.isPrimary
                  ? 'border-blue-400 bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                  : 'border-gray-300 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 dark:border-gray-500 dark:from-gray-700 dark:to-gray-600 dark:text-gray-200'
              }`}
            >
              {keyInfo.key}
            </kbd>
            {index < shortcutKeys.length - 1 && (
              <span className='text-lg font-light text-gray-400 dark:text-gray-500'>
                +
              </span>
            )}
          </div>
        ))}
      </button>
    </SettingField>
  );
}
