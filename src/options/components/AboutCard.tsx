import { JSX } from 'react';

import SettingField from './SettingField';

export default function AboutCard(): JSX.Element {
  const packageInfo = {
    name: 'OmniTab',
    version: '0.6.1',
    description:
      'Spotlight for your browser - Instantly search, switch, and manage tabs with a keyboard-first command palette.',
    github: 'https://github.com/tears330/omnitab',
  };

  const openGitHub = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: packageInfo.github });
    }
  };

  return (
    <div className='space-y-6'>
      {/* Package Info Card */}
      <SettingField title='Version'>
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2'>
            <span className='rounded bg-gray-100 px-2 py-1 font-mono text-sm text-gray-900 dark:bg-gray-800 dark:text-white'>
              {packageInfo.version}
            </span>
          </div>
        </div>
      </SettingField>

      {/* GitHub Link Card */}
      <SettingField
        title='Source Code'
        description='View the source code, report issues, or contribute to the project'
      >
        <button
          type='button'
          onClick={openGitHub}
          className='inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:bg-gray-800 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-offset-gray-900'
        >
          View on GitHub
        </button>
      </SettingField>

      {/* Additional Info Card */}
      <div className='overflow-hidden rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 ring-1 ring-green-200 dark:from-green-900/20 dark:to-emerald-900/20 dark:ring-green-800/50'>
        <div className='p-6'>
          <div className='flex items-center gap-3'>
            <div>
              <h4 className='text-sm font-medium text-green-900 dark:text-green-100'>
                Open Source Project
              </h4>
              <p className='text-sm text-green-700 dark:text-green-200'>
                OmniTab is built with ❤️ as an open-source browser extension.
                Contributions and feedback are welcome!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
