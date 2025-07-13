/**
 * Refactored OmniTab component using hooks and smaller components
 */
import React, { useEffect, useRef } from 'react';
import type { SearchResult } from '@/types';
import type { ActionCallbacks } from '@/utils/resultActions';

import EmptyState from '@/components/EmptyState';
import ResultsList from '@/components/ResultsList';
import SearchInput from '@/components/SearchInput';
import StatusBar from '@/components/StatusBar';
import useKeyboardNavigation from '@/hooks/useKeyboardNavigation';
import useResultNavigation from '@/hooks/useResultNavigation';
import useSearchResults from '@/hooks/useSearchResults';
import { hasModifierKey } from '@/utils/keyboardUtils';
import { executeResultAction } from '@/utils/resultActions';

interface OmniTabProps {
  onClose: () => void;
}

export default function OmniTab({ onClose }: OmniTabProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Custom hooks for state management
  const { searchTerm, setSearchTerm, results, isLoading, removeResult } =
    useSearchResults();
  const {
    selectedIndex,
    setSelectedIndex,
    resultRefs,
    navigate,
    adjustAfterRemoval,
  } = useResultNavigation(results.length);

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Action callbacks for result actions
  const actionCallbacks: ActionCallbacks = {
    onClose,
    onTabClosed: (removedIndex: number) => {
      removeResult(removedIndex);
      adjustAfterRemoval();
    },
  };

  // Keyboard navigation
  const { handleKeyDown } = useKeyboardNavigation({
    results,
    selectedIndex,
    onNavigate: navigate,
    onClose,
    actionCallbacks,
  });

  // Handle result click
  const handleResultClick = (
    result: SearchResult,
    index: number,
    e?: React.MouseEvent
  ) => {
    setSelectedIndex(index);

    // Check for modifier keys in click events
    const modifierPressed = e ? hasModifierKey(e) : false;

    // Create updated action callbacks with correct removal index
    const clickActionCallbacks: ActionCallbacks = {
      onClose,
      onTabClosed: () => {
        removeResult(index);
        adjustAfterRemoval();
      },
    };

    executeResultAction(result, clickActionCallbacks, modifierPressed);
  };

  const showResults = results.length > 0;
  const showEmptyState = !isLoading && results.length === 0;
  const showStatusBar = results.length > 0 || isLoading;

  return (
    <div
      data-omnitab
      className='fixed inset-0 z-[999999] flex items-start justify-center bg-black/50 backdrop-blur-2xl'
      onClick={onClose}
      onKeyDown={(e) => {
        e.stopPropagation();
      }}
      role='button'
      tabIndex={0}
    >
      <div
        className='fade-in slide-in-from-top-4 mt-40 w-full max-w-3xl transform animate-in duration-200'
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          e.stopPropagation();
        }}
        role='presentation'
      >
        <div className='overflow-hidden rounded-xl bg-gray-900/95 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl'>
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            onKeyDown={handleKeyDown}
            inputRef={inputRef}
          />

          {showEmptyState && (
            <EmptyState searchTerm={searchTerm} isLoading={isLoading} />
          )}

          {showResults && (
            <ResultsList
              results={results}
              selectedIndex={selectedIndex}
              onResultClick={handleResultClick}
              resultRefs={resultRefs}
              actionCallbacks={actionCallbacks}
            />
          )}

          {showStatusBar && (
            <StatusBar
              isLoading={isLoading}
              results={results}
              selectedIndex={selectedIndex}
            />
          )}
        </div>
      </div>
    </div>
  );
}
