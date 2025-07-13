/**
 * Individual search result item component
 */
import type { SearchResult } from '@/types';
import type { ActionCallbacks } from '@/utils/resultActions';
import type React from 'react';

import {
  getFaviconFallbacks,
  getHostnameFromUrl,
  resolveFaviconUrl,
} from '@/utils/faviconUtils';
import { hasModifierKey } from '@/utils/keyboardUtils';
import { executeResultAction } from '@/utils/resultActions';

interface ResultItemProps {
  result: SearchResult;
  index: number;
  isSelected: boolean;
  onClick: (result: SearchResult, index: number, e?: React.MouseEvent) => void;
  resultRef: (el: HTMLDivElement | null) => void;
  actionCallbacks: ActionCallbacks;
}

export default function ResultItem({
  result,
  index,
  isSelected,
  onClick,
  resultRef,
  actionCallbacks,
}: ResultItemProps) {
  const handleFaviconError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    const img = e.target as HTMLImageElement;
    const fallbacks = getFaviconFallbacks(result.url);
    const currentSrc = img.src;

    // Find next fallback to try
    const currentIndex = fallbacks.findIndex((src) => src === currentSrc);
    const nextIndex = currentIndex + 1;

    if (nextIndex < fallbacks.length) {
      img.src = fallbacks[nextIndex];
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const modifierPressed = hasModifierKey(e);
      executeResultAction(result, actionCallbacks, modifierPressed);
    }
  };

  const getResultTypeLabel = (type: SearchResult['type']): string => {
    switch (type) {
      case 'tab':
        return 'Tab';
      case 'history':
        return 'History';
      case 'bookmark':
        return 'Bookmark';
      default:
        return 'Unknown';
    }
  };

  return (
    <div
      key={result.id}
      ref={resultRef}
      className={`group mx-3 mb-1 flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150 ${
        isSelected ? 'bg-white/10' : 'hover:bg-white/5'
      }`}
      onClick={(e) => onClick(result, index, e)}
      onKeyDown={handleKeyDown}
      role='button'
      tabIndex={0}
    >
      <div className='flex-shrink-0'>
        <div className='flex h-8 w-8 items-center justify-center rounded-md bg-gray-800/50 ring-1 ring-white/5'>
          <img
            src={resolveFaviconUrl(result.favIconUrl, result.url)}
            alt=''
            className='h-4 w-4'
            onError={handleFaviconError}
          />
        </div>
      </div>
      <div className='min-w-0 flex-1'>
        <div className='flex min-w-0 items-center gap-2'>
          <span className='min-w-0 truncate text-sm font-medium text-gray-100'>
            {result.title}
          </span>
          <span className='flex-shrink-0 text-xs text-gray-500'>•</span>
          <span className='flex-shrink-0 text-xs text-gray-500'>
            {getHostnameFromUrl(result.url)}
          </span>
        </div>
      </div>
      <div className='flex-shrink-0'>
        <span className='text-xs text-gray-500'>
          {getResultTypeLabel(result.type)}
        </span>
      </div>
    </div>
  );
}
