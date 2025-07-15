import React, { useCallback, useEffect, useState } from 'react';

import ActionsMenu from '@/components/ActionsMenu';
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
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);

  // Close actions menu when OmniTab closes
  useEffect(() => {
    if (!isOpen) {
      setIsActionsMenuOpen(false);
    }
  }, [isOpen]);

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

  // Handle opening actions menu
  const handleOpenActionsMenu = useCallback(() => {
    const result = store.results[store.selectedIndex];
    if (!result) return;

    // Check if there are secondary actions
    const hasSecondaryActions = result.actions.some((a) => !a.primary);
    if (hasSecondaryActions) {
      setIsActionsMenuOpen(true);
    }
  }, [store]);

  // Handle closing actions menu
  const handleCloseActionsMenu = useCallback(() => {
    setIsActionsMenuOpen(false);
  }, []);

  // Handle action selection from menu
  const handleActionMenuSelect = useCallback(
    (resultId: string, actionId: string) => {
      store.executeAction(resultId, actionId);
      setIsActionsMenuOpen(false);
    },
    [store]
  );

  // Use keyboard navigation hook
  const { handleKeyDown } = useKeyboardNavigation({
    results: store.results,
    selectedIndex: store.selectedIndex,
    onSelectIndex: handleSelectIndex,
    onClose,
    onExecuteAction: store.executeAction,
    onOpenActionsMenu: handleOpenActionsMenu,
  });

  if (!isOpen) return null;

  return (
    <div
      data-omnitab
      className='fixed inset-0 z-[999999] flex items-start justify-center bg-black/30 backdrop-blur-md dark:bg-black/50'
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
        <div className='overflow-hidden rounded-xl bg-white/95 shadow-2xl ring-1 ring-gray-300/50 backdrop-blur-xl dark:bg-gray-900/95 dark:ring-white/10'>
          <SearchInput
            inputRef={inputRef}
            value={store.query}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
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

      <ActionsMenu
        isOpen={isActionsMenuOpen}
        selectedResult={store.results[store.selectedIndex]}
        onClose={handleCloseActionsMenu}
        onSelectAction={handleActionMenuSelect}
      />
    </div>
  );
}

export default OmniTab;
