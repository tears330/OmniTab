import { JSX } from 'react';

import SettingField from './SettingField';

interface ShortcutCardProps {
  onOpenSettings: () => void;
}

export default function ShortcutCard({
  onOpenSettings,
}: ShortcutCardProps): JSX.Element {
  return (
    <SettingField
      title='Keyboard Shortcut'
      description='Quick access to OmniTab from any page'
    >
      <button
        type='button'
        onClick={onOpenSettings}
        className='flex items-center gap-2 rounded-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900'
      >
        <kbd className='inline-flex items-center rounded-lg border border-gray-300 bg-gradient-to-r from-gray-100 to-gray-200 px-3 py-2 text-sm font-bold text-gray-800 shadow-md dark:border-gray-500 dark:from-gray-700 dark:to-gray-600 dark:text-gray-200'>
          ⌘/Ctrl
        </kbd>
        <span className='text-lg font-light text-gray-400 dark:text-gray-500'>
          +
        </span>
        <kbd className='inline-flex items-center rounded-lg border border-gray-300 bg-gradient-to-r from-gray-100 to-gray-200 px-3 py-2 text-sm font-bold text-gray-800 shadow-md dark:border-gray-500 dark:from-gray-700 dark:to-gray-600 dark:text-gray-200'>
          Shift
        </kbd>
        <span className='text-lg font-light text-gray-400 dark:text-gray-500'>
          +
        </span>
        <kbd className='inline-flex items-center rounded-lg border border-blue-400 bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-2 text-sm font-bold text-white shadow-lg'>
          K
        </kbd>
      </button>
    </SettingField>
  );
}
