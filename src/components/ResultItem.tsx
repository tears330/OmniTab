/**
 * Individual search result item component for extension architecture
 */
import type { SearchResult } from '@/types/extension';
import type React from 'react';

interface ResultItemProps {
  result: SearchResult;
  index: number;
  isSelected: boolean;
  onSelect: (index: number) => void;
  onAction: (resultId: string, actionId: string) => void;
  resultRef: (el: HTMLDivElement | null) => void;
}

export default function ResultItem({
  result,
  index,
  isSelected,
  onSelect,
  onAction,
  resultRef,
}: ResultItemProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();

    // Check if modifier key is pressed for secondary action
    if (e.ctrlKey || e.metaKey) {
      const secondaryAction = result.actions.find((a) => !a.primary);
      if (secondaryAction) {
        onAction(result.id, secondaryAction.id);
      }
    } else {
      // Primary action
      onSelect(index);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(index);
    }
  };

  const handleFaviconError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    // Fallback to default icon
    img.src = chrome.runtime.getURL('icon16.png');
  };

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'tab':
        return 'Tab';
      case 'history':
        return 'History';
      case 'bookmark':
        return 'Bookmark';
      case 'command':
        return 'Command';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  return (
    <div
      ref={resultRef}
      className={`group mx-3 mb-1 flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors duration-150 ${
        isSelected ? 'bg-white/10' : 'hover:bg-white/5'
      }`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role='button'
      tabIndex={0}
    >
      {/* Icon */}
      <div className='flex-shrink-0'>
        <div className='flex h-8 w-8 items-center justify-center rounded-md bg-gray-800/50 ring-1 ring-white/5'>
          {result.icon ? (
            <img
              src={result.icon}
              alt=''
              className='h-4 w-4'
              onError={handleFaviconError}
            />
          ) : (
            <div className='h-4 w-4 rounded bg-gray-600' />
          )}
        </div>
      </div>

      {/* Content */}
      <div className='min-w-0 flex-1'>
        <div className='flex items-center gap-2'>
          <span className='truncate text-sm font-medium text-gray-100'>
            {result.title}
          </span>
          {result.description && (
            <span className='min-w-0 flex-shrink-0 text-sm text-gray-500'>
              {result.description}
            </span>
          )}
        </div>
      </div>

      {/* Type */}
      <div className='flex-shrink-0'>
        <span className='text-xs text-gray-500'>
          {getTypeLabel(result.type)}
        </span>
      </div>
    </div>
  );
}
