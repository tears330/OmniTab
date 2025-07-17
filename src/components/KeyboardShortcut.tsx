/**
 * Unified keyboard shortcut component for consistent styling
 */
import type { ReactElement } from 'react';

interface KeyboardShortcutProps {
  keys: string | string[];
  label?: string;
  variant?: 'default' | 'active';
  size?: 'xs' | 'sm';
  className?: string;
  onClick?: () => void;
}

export default function KeyboardShortcut({
  keys,
  label,
  variant = 'default',
  size = 'xs',
  className = '',
  onClick,
}: KeyboardShortcutProps): ReactElement {
  const keyArray = Array.isArray(keys) ? keys : [keys];

  const kbdStyles = {
    default: 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    active: 'bg-gray-300 text-gray-900 dark:bg-gray-700 dark:text-gray-100',
  };

  const sizeStyles = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-1 text-xs',
  };

  const Component = onClick ? 'button' : 'span';
  const clickableStyles = onClick
    ? 'cursor-pointer hover:opacity-80 transition-opacity'
    : '';

  return (
    <Component
      className={`flex items-center gap-1 ${clickableStyles} ${className}`}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
      data-actions-shortcut={
        className.includes('data-actions-shortcut') ? 'true' : undefined
      }
    >
      {keyArray.map((key) => (
        <kbd
          key={`key-${key}`}
          className={`
            rounded font-mono
            ${kbdStyles[variant]}
            ${sizeStyles[size]}
          `}
        >
          {key}
        </kbd>
      ))}
      {label && (
        <span className='ml-1 text-gray-500 dark:text-gray-500'>{label}</span>
      )}
    </Component>
  );
}
