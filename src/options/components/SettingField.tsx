import { JSX, ReactNode } from 'react';

interface SettingFieldProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export default function SettingField({
  title,
  description,
  children,
  className = '',
}: SettingFieldProps): JSX.Element {
  return (
    <div
      className={`group overflow-visible rounded-2xl bg-white shadow-sm transition-all duration-200 hover:shadow-md dark:bg-gray-900 ${className}`}
    >
      <div className='p-6'>
        <div className='flex items-center justify-between gap-6'>
          <div className='flex-1'>
            <h3 className='mb-1 text-base font-semibold text-gray-900 dark:text-white'>
              {title}
            </h3>
            {description && (
              <p className='text-sm text-gray-600 dark:text-gray-400'>
                {description}
              </p>
            )}
          </div>

          <div className='flex-shrink-0'>{children}</div>
        </div>
      </div>
    </div>
  );
}
