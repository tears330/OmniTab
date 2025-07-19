import { JSX } from 'react';

interface SidebarProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = [
  { id: 'general', label: 'General', icon: '⚙️' },
  { id: 'about', label: 'About', icon: 'ℹ️' },
];

export default function Sidebar({
  activeCategory,
  onCategoryChange,
}: SidebarProps): JSX.Element {
  return (
    <div className='w-64 flex-shrink-0'>
      <div className='sticky top-8'>
        <nav className='space-y-2'>
          {categories.map((category) => (
            <button
              key={category.id}
              type='button'
              onClick={() => onCategoryChange(category.id)}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
                activeCategory === category.id
                  ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                  : 'border-transparent text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/50'
              }`}
            >
              <span className='text-base'>{category.icon}</span>
              <span className='text-base font-medium'>{category.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
