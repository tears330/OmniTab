import { JSX } from 'react';

import SettingField from './SettingField';

interface ThemeCardProps {
  theme: 'light' | 'dark' | 'system';
  onChangeTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export default function ThemeCard({
  theme,
  onChangeTheme,
}: ThemeCardProps): JSX.Element {
  const getThemeLabel = () => {
    if (theme === 'system') return 'System';
    if (theme === 'light') return 'Light';
    return 'Dark';
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    onChangeTheme(newTheme);
    // Close dropdown by removing focus from the trigger
    (document.activeElement as HTMLElement)?.blur();
  };

  return (
    <SettingField
      title='Appearance'
      description='Choose your preferred color scheme'
      className='relative overflow-visible'
    >
      <div className='dropdown dropdown-end'>
        <div
          tabIndex={0}
          role='button'
          className='btn rounded-xl border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-lg hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700'
        >
          {getThemeLabel()}
          <svg
            width='12px'
            height='12px'
            className='ml-2 inline-block h-3 w-3 fill-current opacity-60'
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 2048 2048'
          >
            <path d='M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z' />
          </svg>
        </div>
        <ul className='dropdown-content z-[100] w-32 rounded-box border border-gray-200 bg-white p-2 shadow-2xl dark:border-gray-600 dark:bg-gray-800'>
          <li>
            <button
              type='button'
              onClick={() => handleThemeChange('light')}
              className={`btn btn-ghost btn-sm w-full justify-start text-gray-900 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700 ${theme === 'light' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
            >
              Light
            </button>
          </li>
          <li>
            <button
              type='button'
              onClick={() => handleThemeChange('dark')}
              className={`btn btn-ghost btn-sm w-full justify-start text-gray-900 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700 ${theme === 'dark' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
            >
              Dark
            </button>
          </li>
          <li>
            <button
              type='button'
              onClick={() => handleThemeChange('system')}
              className={`btn btn-ghost btn-sm w-full justify-start text-gray-900 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700 ${theme === 'system' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
            >
              System
            </button>
          </li>
        </ul>
      </div>
    </SettingField>
  );
}
