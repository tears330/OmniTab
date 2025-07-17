/**
 * Custom hook for keyboard navigation handling
 */
import { useCallback } from 'react';
import type { SearchResult } from '@/types/extension';
import type React from 'react';

import { handleEmacsNavigation } from '@/utils/keyboardUtils';

interface UseKeyboardNavigationProps {
  results: SearchResult[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  onClose: () => void;
  onExecuteAction: (resultId: string, actionId: string) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  // Actions menu state
  isActionsMenuOpen: boolean;
  actionsMenuSelectedIndex: number;
  onToggleActionsMenu: () => void;
  onCloseActionsMenu: () => void;
  onSetActionsMenuSelectedIndex: (index: number) => void;
}

// Utility functions
function isTextInputKey(e: React.KeyboardEvent): boolean {
  return (
    (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) ||
    ['Backspace', 'Delete'].includes(e.key)
  );
}

function isNavigationKey(e: React.KeyboardEvent): boolean {
  return (
    ['ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(e.key) ||
    ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) ||
    (e.ctrlKey && ['n', 'N', 'p', 'P'].includes(e.key))
  );
}

function focusInputIfNeeded(
  inputRef?: React.RefObject<HTMLInputElement | null>
): boolean {
  if (inputRef?.current && document.activeElement !== inputRef.current) {
    inputRef.current.focus();
    return true;
  }
  return false;
}

export default function useKeyboardNavigation({
  results,
  selectedIndex,
  onSelectIndex,
  onClose,
  onExecuteAction,
  inputRef,
  isActionsMenuOpen,
  actionsMenuSelectedIndex,
  onToggleActionsMenu,
  onCloseActionsMenu,
  onSetActionsMenuSelectedIndex,
}: UseKeyboardNavigationProps) {
  // Execute primary action for a result
  const handleSelectResult = useCallback(
    (index: number) => {
      const result = results[index];
      if (!result) return;

      const primaryAction = result.actions.find((a) => a.primary);
      if (primaryAction) {
        onExecuteAction(result.id, primaryAction.id);
      }
    },
    [results, onExecuteAction]
  );

  // Navigate selection up/down
  const navigateSelection = useCallback(
    (direction: 'up' | 'down') => {
      const delta = direction === 'up' ? -1 : 1;

      if (isActionsMenuOpen) {
        onSetActionsMenuSelectedIndex(actionsMenuSelectedIndex + delta);
      } else {
        onSelectIndex(selectedIndex + delta);
      }
    },
    [
      isActionsMenuOpen,
      actionsMenuSelectedIndex,
      selectedIndex,
      onSetActionsMenuSelectedIndex,
      onSelectIndex,
    ]
  );

  // Main keyboard event handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): boolean => {
      e.stopPropagation();

      // Handle actions menu navigation
      if (isActionsMenuOpen) {
        switch (e.key) {
          case 'Escape':
            e.preventDefault();
            onCloseActionsMenu();
            return true;

          case 'Enter': {
            e.preventDefault();
            const selectedResult = results[selectedIndex];
            const secondaryActions =
              selectedResult?.actions.filter((a) => !a.primary) || [];
            const selectedAction = secondaryActions[actionsMenuSelectedIndex];

            if (selectedAction && selectedResult) {
              onExecuteAction(selectedResult.id, selectedAction.id);
            }
            return true;
          }

          case 'ArrowUp':
            e.preventDefault();
            navigateSelection('up');
            return true;

          case 'ArrowDown':
            e.preventDefault();
            navigateSelection('down');
            return true;

          default:
            // Handle Cmd/Ctrl+K for closing actions menu
            if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
              e.preventDefault();
              onCloseActionsMenu();
              return true;
            }

            // Handle Emacs navigation in actions menu
            if (e.ctrlKey && e.key === 'p') {
              e.preventDefault();
              navigateSelection('up');
              return true;
            }
            if (e.ctrlKey && e.key === 'n') {
              e.preventDefault();
              navigateSelection('down');
              return true;
            }

            // Handle direct action shortcuts
            if (!e.ctrlKey && !e.metaKey && !e.altKey) {
              const selectedResult = results[selectedIndex];
              const secondaryActions =
                selectedResult?.actions.filter((a) => !a.primary) || [];
              const action = secondaryActions.find((a) => a.shortcut === e.key);

              if (action && selectedResult) {
                e.preventDefault();
                onExecuteAction(selectedResult.id, action.id);
                return true;
              }
            }
            return false;
        }
      }

      // Handle main navigation
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          return true;

        case 'Enter':
          e.preventDefault();
          handleSelectResult(selectedIndex);
          return true;

        case 'ArrowUp':
          e.preventDefault();
          navigateSelection('up');
          return true;

        case 'ArrowDown':
          e.preventDefault();
          navigateSelection('down');
          return true;

        default: {
          // Handle Cmd/Ctrl+K for actions menu
          if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
            e.preventDefault();
            onToggleActionsMenu();
            return true;
          }

          // Handle Emacs navigation
          const emacsResult = handleEmacsNavigation(
            e,
            selectedIndex,
            results.length
          );
          if (emacsResult.handled) {
            e.preventDefault();
            if (emacsResult.newIndex !== undefined) {
              onSelectIndex(emacsResult.newIndex);
            }
            if (emacsResult.shouldSelect) {
              handleSelectResult(selectedIndex);
            }
            return true;
          }

          return false;
        }
      }
    },
    [
      isActionsMenuOpen,
      results,
      selectedIndex,
      actionsMenuSelectedIndex,
      onCloseActionsMenu,
      onExecuteAction,
      navigateSelection,
      onClose,
      handleSelectResult,
      onToggleActionsMenu,
      onSelectIndex,
    ]
  );

  // Handle container-level keyboard events
  const handleContainerKeyDown = useCallback(
    (e: React.KeyboardEvent): boolean => {
      if (e.key === 'Escape') {
        onClose();
        return true;
      }

      const handled = handleKeyDown(e);

      if (!handled && isTextInputKey(e)) {
        const focused = focusInputIfNeeded(inputRef);
        if (focused) {
          return false; // Let input handle the key naturally
        }
      }

      return handled;
    },
    [handleKeyDown, onClose, inputRef]
  );

  // Handle search input specific keyboard events
  const handleSearchInputKeyDown = useCallback(
    (e: React.KeyboardEvent): boolean => {
      if (isNavigationKey(e)) {
        return handleKeyDown(e);
      }
      return false; // Let other keys pass through naturally
    },
    [handleKeyDown]
  );

  return {
    handleKeyDown,
    handleContainerKeyDown,
    handleSearchInputKeyDown,
  };
}
