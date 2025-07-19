import React, { useCallback, useEffect } from 'react';

import EmptyState from '@/components/EmptyState';
import ResultsList from '@/components/ResultsList';
import SearchInput from '@/components/SearchInput';
import StatusBar from '@/components/StatusBar';
import useKeyboardNavigation from '@/hooks/useKeyboardNavigation';
import { useOmniTabStore } from '@/stores/omniTabStore';

interface OmniTabProps {
  isOpen: boolean;
  onClose: () => void;
}

function OmniTab({ isOpen, onClose }: OmniTabProps) {
  const store = useOmniTabStore();
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Get resolved theme (convert 'system' to 'light' or 'dark')
  const resolvedTheme = React.useMemo(() => {
    if (store.theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return store.theme;
  }, [store.theme]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle search query changes
  const handleSearchChange = useCallback(
    (query: string) => {
      store.setQuery(query);
    },
    [store]
  );

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
  const { handleContainerKeyDown, handleSearchInputKeyDown } =
    useKeyboardNavigation({
      results: store.results,
      selectedIndex: store.selectedIndex,
      onSelectIndex: handleSelectIndex,
      onClose,
      onExecuteAction: store.executeAction,
      inputRef,
      isActionsMenuOpen: store.isActionsMenuOpen,
      actionsMenuSelectedIndex: store.actionsMenuSelectedIndex,
      onToggleActionsMenu: store.toggleActionsMenu,
      onCloseActionsMenu: store.closeActionsMenu,
      onSetActionsMenuSelectedIndex: store.setActionsMenuSelectedIndex,
    });

  if (!isOpen) return null;

  return (
    <div
      data-omnitab
      data-theme={resolvedTheme}
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
            <EmptyState searchTerm={store.query} />
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
