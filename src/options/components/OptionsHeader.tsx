import { JSX } from 'react';

export default function OptionsHeader(): JSX.Element {
  return (
    <div className='bg-white/80 shadow-sm backdrop-blur-sm dark:bg-gray-900/80 dark:shadow-gray-800/20'>
      <div className='mx-auto max-w-4xl px-6 py-8'>
        <div className='flex items-center gap-4'>
          <div className='h-16 w-16 overflow-hidden rounded-2xl shadow-lg'>
            <img
              src='/icon128.png'
              alt='OmniTab Logo'
              className='h-full w-full object-cover'
            />
          </div>
          <div>
            <h1 className='bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-3xl font-bold text-transparent dark:from-white dark:to-gray-300'>
              OmniTab Settings
            </h1>
            <p className='mt-1 text-gray-600 dark:text-gray-400'>
              Configure your tab management experience
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
