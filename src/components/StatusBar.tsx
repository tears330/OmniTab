/**
 * Status bar component showing loading state and keyboard shortcuts
 */
import type { SearchResult } from '@/types';

import { getActionLabel, getActionShortcut } from '@/utils/resultActions';

interface StatusBarProps {
  isLoading: boolean;
  results: SearchResult[];
  selectedIndex: number;
}

export default function StatusBar({
  isLoading,
  results,
  selectedIndex,
}: StatusBarProps) {
  const selectedResult = results[selectedIndex];
  const hasResults = results.length > 0;
  const hasValidSelection = selectedIndex >= 0 && selectedResult;

  return (
    <div className='border-t border-white/5 bg-gray-800/30 px-6 py-3'>
      <div className='flex items-center justify-between text-xs text-gray-500'>
        <div className='flex items-center gap-2'>
          {isLoading && (
            <div className='flex items-center gap-2'>
              <div className='h-3 w-3 animate-spin rounded-full border border-gray-600 border-t-gray-400' />
              <span>Loading...</span>
            </div>
          )}
          {!isLoading && hasResults && <span>{results.length} results</span>}
        </div>
        <div className='flex items-center gap-4'>
          {hasResults &&
            hasValidSelection &&
            (selectedResult.type === 'tab' ? (
              <>
                <span>{getActionLabel('tab', false)}</span>
                <kbd className='rounded bg-gray-700/50 px-1.5 py-0.5 font-mono text-[10px]'>
                  {getActionShortcut('tab', false)}
                </kbd>
                <div className='h-3 w-px bg-gray-700' />
                <span>{getActionLabel('tab', true)}</span>
                <kbd className='rounded bg-gray-700/50 px-1.5 py-0.5 font-mono text-[10px]'>
                  {getActionShortcut('tab', true)}
                </kbd>
              </>
            ) : (
              <>
                <span>{getActionLabel(selectedResult.type)}</span>
                <kbd className='rounded bg-gray-700/50 px-1.5 py-0.5 font-mono text-[10px]'>
                  {getActionShortcut(selectedResult.type)}
                </kbd>
              </>
            ))}
          {(!hasResults || !hasValidSelection) && (
            <>
              <span>Navigate</span>
              <kbd className='rounded bg-gray-700/50 px-1.5 py-0.5 font-mono text-[10px]'>
                ↑↓
              </kbd>
              <span className='text-gray-600'>or</span>
              <kbd className='rounded bg-gray-700/50 px-1.5 py-0.5 font-mono text-[10px]'>
                ^N
              </kbd>
              <kbd className='rounded bg-gray-700/50 px-1.5 py-0.5 font-mono text-[10px]'>
                ^P
              </kbd>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
