/**
 * Actions Menu Component - Displays secondary actions for selected results
 */
import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { ResultAction, SearchResult } from '@/types/extension';

import { useOmniTabStore } from '@/stores/omniTabStore';

import KeyboardShortcut from './KeyboardShortcut';

interface ActionsMenuProps {
  selectedResult: SearchResult | undefined;
}

export default function ActionsMenu({ selectedResult }: ActionsMenuProps) {
  const {
    isActionsMenuOpen,
    actionsMenuSelectedIndex,
    executeAction,
    closeActionsMenu,
  } = useOmniTabStore();

  const menuRef = useRef<HTMLDivElement>(null);

  // Get secondary actions
  const secondaryActions = useMemo(
    () => selectedResult?.actions.filter((a) => !a.primary) || [],
    [selectedResult]
  );

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;

      // Don't close if clicking on the menu itself
      if (menuRef.current && menuRef.current.contains(target)) {
        return;
      }

      // Don't close if clicking on the Actions shortcut button
      if (target.closest('[data-actions-shortcut]')) {
        return;
      }

      closeActionsMenu();
    };

    if (isActionsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }

    return undefined;
  }, [isActionsMenuOpen, closeActionsMenu]);

  // Handle action click
  const handleActionClick = useCallback(
    (action: ResultAction) => {
      if (selectedResult) {
        executeAction(selectedResult.id, action.id);
      }
    },
    [selectedResult, executeAction]
  );

  if (!isActionsMenuOpen || !selectedResult || secondaryActions.length === 0) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className='w-[240px] overflow-hidden rounded-lg bg-gray-50/95 shadow-xl ring-1 ring-black/5 backdrop-blur-xl dark:bg-gray-800/95 dark:ring-white/5'
    >
      {/* Section header with selected item title */}
      <div className='bg-white/80 px-4 py-2 dark:bg-gray-900/80'>
        <div className='truncate text-xs font-semibold text-gray-600 dark:text-gray-600'>
          {selectedResult.title}
        </div>
      </div>

      <div className='px-1 py-1'>
        {secondaryActions.map((action, index) => (
          <button
            key={action.id}
            type='button'
            onClick={() => handleActionClick(action)}
            className={`group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-150 ${
              index === actionsMenuSelectedIndex
                ? 'bg-gray-200/50 dark:bg-white/10'
                : 'hover:bg-gray-100/50 dark:hover:bg-white/5'
            }`}
          >
            <span className='flex-1 text-left text-sm font-medium text-gray-900 dark:text-gray-100'>
              {action.label}
            </span>

            {action.shortcut && (
              <KeyboardShortcut
                keys={action.shortcut}
                variant={
                  index === actionsMenuSelectedIndex ? 'active' : 'default'
                }
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
