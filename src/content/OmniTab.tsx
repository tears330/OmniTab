import React, { useCallback, useEffect } from 'react';

import EmptyState from '@/components/EmptyState';
import ResultsList from '@/components/ResultsList';
import SearchInput from '@/components/SearchInput';
import StatusBar from '@/components/StatusBar';
import useKeyboardNavigation from '@/hooks/useKeyboardNavigation';
import { performDebouncedSearch, useOmniTabStore } from '@/stores/omniTabStore';

interface OmniTabProps {
  isOpen: boolean;
  onClose: () => void;
}

function OmniTab({ isOpen, onClose }: OmniTabProps) {
  const store = useOmniTabStore();
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle search query changes
  const handleSearchChange = useCallback((query: string) => {
    performDebouncedSearch(query);
  }, []);

  // Handle result selection
  const handleSelectResult = useCallback(
    (index: number) => {
      const result = store.results[index];
      if (!result) return;

      const primaryAction = result.actions.find((a) => a.primary);
      if (primaryAction) {
        store.executeAction(result.id, primaryAction.id);
      }
    },
    [store]
  );

  // Handle selected index change
  const handleSelectIndex = useCallback(
    (index: number) => {
      store.setSelectedIndex(index);
    },
    [store]
  );

  // Use keyboard navigation hook
  const { handleKeyDown: handleNavigationKeyDown } = useKeyboardNavigation({
    results: store.results,
    selectedIndex: store.selectedIndex,
    onSelectIndex: handleSelectIndex,
    onClose,
    onExecuteAction: store.executeAction,
  });

  // Handle keyboard events at the container level
  const handleContainerKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Special handling for Escape key - always close
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Let the navigation handler try to handle the event first
      const handled = handleNavigationKeyDown(e);

      // If navigation didn't handle it and it's a text input key, focus the input
      if (
        !handled &&
        inputRef.current &&
        document.activeElement !== inputRef.current
      ) {
        // Check if it's a regular text input key (not a navigation key)
        const isTextInputKey =
          (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) || // Regular character keys
          ['Backspace', 'Delete'].includes(e.key);

        if (isTextInputKey) {
          inputRef.current.focus();
          // For character keys, we need to manually update the input value
          if (e.key.length === 1) {
            const currentValue = store.query;
            const newValue = currentValue + e.key;
            handleSearchChange(newValue);
            e.preventDefault();
          }
        }
      }
    },
    [handleNavigationKeyDown, onClose, store.query, handleSearchChange]
  );

  // Handle search input specific key events
  const handleSearchInputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Let navigation handle the event
      handleNavigationKeyDown(e);
    },
    [handleNavigationKeyDown]
  );

  if (!isOpen) return null;

  return (
    <div
      data-omnitab
      className='fixed inset-0 z-[999999] flex items-start justify-center bg-black/30 backdrop-blur-md dark:bg-black/50'
      onClick={onClose}
      onKeyDown={handleContainerKeyDown}
      role='button'
      tabIndex={0}
    >
      <div
        className='fade-in slide-in-from-top-4 mt-40 w-full max-w-3xl transform animate-in duration-200'
        onClick={(e) => e.stopPropagation()}
        role='presentation'
      >
        <div className='overflow-visible rounded-xl bg-white/95 shadow-2xl ring-1 ring-gray-300/50 backdrop-blur-xl dark:bg-gray-900/95 dark:ring-white/10'>
          <SearchInput
            inputRef={inputRef}
            value={store.query}
            onChange={handleSearchChange}
            onKeyDown={handleSearchInputKeyDown}
          />

          {store.results.length > 0 ? (
            <ResultsList
              results={store.results}
              selectedIndex={store.selectedIndex}
              onSelectResult={handleSelectResult}
              onActionResult={store.executeAction}
            />
          ) : (
            <EmptyState searchTerm={store.query} isLoading={store.loading} />
          )}

          <StatusBar
            resultCount={store.results.length}
            selectedIndex={store.selectedIndex}
            selectedResult={store.results[store.selectedIndex]}
            loading={store.loading}
            activeCommand={store.activeCommand}
            error={store.error}
          />
        </div>
      </div>
    </div>
  );
}

export default OmniTab;
