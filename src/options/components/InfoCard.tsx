import { JSX } from 'react';

export default function InfoCard(): JSX.Element {
  return (
    <div className='overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 ring-1 ring-blue-200 dark:from-blue-900/20 dark:to-indigo-900/20 dark:ring-blue-800/50'>
      <div className='p-6'>
        <div className='flex items-center gap-3'>
          <div>
            <h4 className='text-sm font-medium text-blue-900 dark:text-blue-100'>
              Settings saved automatically
            </h4>
            <p className='text-sm text-blue-700 dark:text-blue-200'>
              Changes are applied instantly and synced across your browser
              profile
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
