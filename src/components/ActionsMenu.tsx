/**
 * Actions menu component showing secondary actions for the selected result
 */
import React, { useCallback, useEffect } from 'react';
import type { ResultAction, SearchResult } from '@/types/extension';

interface ActionsMenuProps {
  isOpen: boolean;
  selectedResult: SearchResult | undefined;
  onClose: () => void;
  onSelectAction: (resultId: string, actionId: string) => void;
}

export default function ActionsMenu({
  isOpen,
  selectedResult,
  onClose,
  onSelectAction,
}: ActionsMenuProps) {
  // Get secondary actions
  const secondaryActions =
    selectedResult?.actions.filter((a) => !a.primary) || [];

  // Handle keyboard navigation in the menu
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [onClose]
  );

  // Close on click outside
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClose();
    },
    [onClose]
  );

  // Handle action click
  const handleActionClick = useCallback(
    (action: ResultAction) => {
      if (selectedResult) {
        onSelectAction(selectedResult.id, action.id);
        onClose();
      }
    },
    [selectedResult, onSelectAction, onClose]
  );

  // Close when result changes
  useEffect(() => {
    if (!selectedResult) {
      onClose();
    }
  }, [selectedResult, onClose]);

  if (!isOpen || !selectedResult || secondaryActions.length === 0) {
    return null;
  }

  return (
    <div
      className='fixed inset-0 z-[9999999]'
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role='button'
      tabIndex={0}
    >
      <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'>
        <div
          className='min-w-[200px] rounded-lg bg-white/95 shadow-2xl ring-1 ring-gray-300/50 dark:bg-gray-900/95 dark:ring-white/10'
          onClick={(e) => e.stopPropagation()}
          role='presentation'
        >
          <div className='p-2'>
            <div className='mb-2 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400'>
              Actions for {selectedResult.title}
            </div>
            {secondaryActions.map((action) => (
              <button
                key={action.id}
                type='button'
                onClick={() => handleActionClick(action)}
                className='flex w-full items-center justify-between rounded px-3 py-2 text-sm text-gray-700 hover:bg-gray-300 dark:text-gray-300 dark:hover:bg-gray-700'
              >
                <span>{action.label}</span>
                {action.shortcut && (
                  <kbd className='ml-2 rounded bg-gray-200 px-1.5 py-0.5 text-[10px] text-gray-600 dark:bg-gray-800 dark:text-gray-400'>
                    {action.shortcut}
                  </kbd>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
