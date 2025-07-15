import React, { useCallback, useEffect, useState } from 'react';

import ActionsMenu from '@/components/ActionsMenu';
import EmptyState from '@/components/EmptyState';
import ResultsList from '@/components/ResultsList';
import SearchInput from '@/components/SearchInput';
import StatusBar from '@/components/StatusBar';
import { useOmniTab } from '@/contexts/OmniTabContext';
import useKeyboardNavigation from '@/hooks/useKeyboardNavigation';

interface OmniTabProps {
  isOpen: boolean;
  onClose: () => void;
}

function OmniTab({ isOpen, onClose }: OmniTabProps) {
  const { state, dispatch, performSearch, executeAction } = useOmniTab();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);

  // Update state when isOpen changes
  useEffect(() => {
    if (isOpen) {
      dispatch({ type: 'OPEN' });
    } else {
      dispatch({ type: 'CLOSE' });
      setIsActionsMenuOpen(false);
    }
  }, [isOpen, dispatch]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle search query changes
  const handleSearchChange = useCallback(
    (query: string) => {
      performSearch(query);
    },
    [performSearch]
  );

  // Handle result selection
  const handleSelectResult = useCallback(
    (index: number) => {
      const result = state.results[index];
      if (!result) return;

      const primaryAction = result.actions.find((a) => a.primary);
      if (primaryAction) {
        executeAction(result.id, primaryAction.id);
      }
    },
    [state.results, executeAction]
  );

  // Handle selected index change
  const handleSelectIndex = useCallback(
    (index: number) => {
      dispatch({
        type: 'SET_SELECTED_INDEX',
        payload: index,
      });
    },
    [dispatch]
  );

  // Handle opening actions menu
  const handleOpenActionsMenu = useCallback(() => {
    const result = state.results[state.selectedIndex];
    if (!result) return;

    // Check if there are secondary actions
    const hasSecondaryActions = result.actions.some((a) => !a.primary);
    if (hasSecondaryActions) {
      setIsActionsMenuOpen(true);
    }
  }, [state.results, state.selectedIndex]);

  // Handle closing actions menu
  const handleCloseActionsMenu = useCallback(() => {
    setIsActionsMenuOpen(false);
  }, []);

  // Handle action selection from menu
  const handleActionMenuSelect = useCallback(
    (resultId: string, actionId: string) => {
      executeAction(resultId, actionId);
      setIsActionsMenuOpen(false);
    },
    [executeAction]
  );

  // Use keyboard navigation hook
  const { handleKeyDown } = useKeyboardNavigation({
    results: state.results,
    selectedIndex: state.selectedIndex,
    onSelectIndex: handleSelectIndex,
    onClose,
    onExecuteAction: executeAction,
    onOpenActionsMenu: handleOpenActionsMenu,
  });

  if (!isOpen) return null;

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
            inputRef={inputRef}
            value={state.query}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
          />

          {state.results.length > 0 ? (
            <ResultsList
              results={state.results}
              selectedIndex={state.selectedIndex}
              onSelectResult={handleSelectResult}
              onActionResult={executeAction}
            />
          ) : (
            <EmptyState searchTerm={state.query} isLoading={state.loading} />
          )}

          <StatusBar
            resultCount={state.results.length}
            selectedIndex={state.selectedIndex}
            selectedResult={state.results[state.selectedIndex]}
            loading={state.loading}
            activeCommand={state.activeCommand}
            error={state.error}
          />
        </div>
      </div>

      <ActionsMenu
        isOpen={isActionsMenuOpen}
        selectedResult={state.results[state.selectedIndex]}
        onClose={handleCloseActionsMenu}
        onSelectAction={handleActionMenuSelect}
      />
    </div>
  );
}

export default OmniTab;
