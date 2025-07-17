/**
 * Custom hook for keyboard navigation handling
 */
import { useCallback } from 'react';
import type { SearchResult } from '@/types/extension';
import type React from 'react';

import { useOmniTabStore } from '@/stores/omniTabStore';
import { handleEmacsNavigation } from '@/utils/keyboardUtils';

interface UseKeyboardNavigationProps {
  results: SearchResult[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  onClose: () => void;
  onExecuteAction: (resultId: string, actionId: string) => void;
}

// Semantic keyboard constants
const KeyboardShortcuts = {
  CLOSE: 'Escape',
  CONFIRM: 'Enter',
  NAVIGATE_UP: 'ArrowUp',
  NAVIGATE_DOWN: 'ArrowDown',
  TOGGLE_ACTIONS_MENU: ['k', 'K'],
  EMACS_PREVIOUS: 'p',
  EMACS_NEXT: 'n',
} as const;

// Type for keyboard handler map
type KeyboardHandler = (e: React.KeyboardEvent) => void;
type KeyboardHandlerMap = Record<string, KeyboardHandler>;

// Type for handler result - can indicate if event was handled
type HandlerResult = boolean | void;

// Higher-order function to create keyboard navigation handler
function createKeyboardNavigator(
  handlers: KeyboardHandlerMap & {
    default?: (e: React.KeyboardEvent) => HandlerResult;
  },
  options: {
    preventDefault?: boolean;
    stopPropagation?: boolean;
  } = {}
) {
  return (e: React.KeyboardEvent): boolean => {
    const { preventDefault = true, stopPropagation = false } = options;

    // Check if we have a specific handler for this key
    if (handlers[e.key]) {
      if (preventDefault) e.preventDefault();
      if (stopPropagation) e.stopPropagation();
      handlers[e.key](e);
      return true;
    }

    // If no specific handler, check default handler
    if (handlers.default) {
      const handled = handlers.default(e);
      // Return true if the default handler explicitly handled the event
      return handled === true;
    }

    return false;
  };
}

export default function useKeyboardNavigation({
  results,
  selectedIndex,
  onSelectIndex,
  onClose,
  onExecuteAction,
}: UseKeyboardNavigationProps) {
  const {
    toggleActionsMenu,
    isActionsMenuOpen,
    actionsMenuSelectedIndex,
    setActionsMenuSelectedIndex,
    closeActionsMenu,
  } = useOmniTabStore();

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
        setActionsMenuSelectedIndex(actionsMenuSelectedIndex + delta);
      } else {
        onSelectIndex(selectedIndex + delta);
      }
    },
    [
      isActionsMenuOpen,
      actionsMenuSelectedIndex,
      selectedIndex,
      setActionsMenuSelectedIndex,
      onSelectIndex,
    ]
  );

  // Handle actions menu keyboard events
  const handleActionsMenuNavigation = useCallback(
    (e: React.KeyboardEvent) =>
      createKeyboardNavigator(
        {
          [KeyboardShortcuts.CLOSE]: () => closeActionsMenu(),

          [KeyboardShortcuts.CONFIRM]: () => {
            const selectedResult = results[selectedIndex];
            const secondaryActions =
              selectedResult?.actions.filter((a) => !a.primary) || [];
            const selectedAction = secondaryActions[actionsMenuSelectedIndex];

            if (selectedAction && selectedResult) {
              onExecuteAction(selectedResult.id, selectedAction.id);
            }
          },

          [KeyboardShortcuts.NAVIGATE_UP]: () => navigateSelection('up'),
          [KeyboardShortcuts.NAVIGATE_DOWN]: () => navigateSelection('down'),

          default: (event: React.KeyboardEvent) => {
            // Emacs-style navigation
            if (event.ctrlKey) {
              if (event.key === KeyboardShortcuts.EMACS_PREVIOUS) {
                event.preventDefault();
                event.stopPropagation();
                navigateSelection('up');
                return true;
              }
              if (event.key === KeyboardShortcuts.EMACS_NEXT) {
                event.preventDefault();
                event.stopPropagation();
                navigateSelection('down');
                return true;
              }
            }

            // Direct action shortcuts (single letter keys)
            if (!event.ctrlKey && !event.metaKey && !event.altKey) {
              const selectedResult = results[selectedIndex];
              const secondaryActions =
                selectedResult?.actions.filter((a) => !a.primary) || [];
              const action = secondaryActions.find(
                (a) => a.shortcut === event.key
              );

              if (action && selectedResult) {
                event.preventDefault();
                event.stopPropagation();
                onExecuteAction(selectedResult.id, action.id);
                return true;
              }
            }

            return false;
          },
        },
        { stopPropagation: true }
      )(e),
    [
      results,
      selectedIndex,
      actionsMenuSelectedIndex,
      closeActionsMenu,
      onExecuteAction,
      navigateSelection,
    ]
  );

  // Handle main navigation keyboard events
  const handleMainNavigation = useCallback(
    (e: React.KeyboardEvent) =>
      createKeyboardNavigator({
        [KeyboardShortcuts.CLOSE]: () => onClose(),
        [KeyboardShortcuts.CONFIRM]: () => handleSelectResult(selectedIndex),
        [KeyboardShortcuts.NAVIGATE_UP]: () => navigateSelection('up'),
        [KeyboardShortcuts.NAVIGATE_DOWN]: () => navigateSelection('down'),

        default: (event: React.KeyboardEvent) => {
          // Toggle actions menu (Cmd/Ctrl + K)
          if (
            (event.metaKey || event.ctrlKey) &&
            KeyboardShortcuts.TOGGLE_ACTIONS_MENU.includes(
              event.key as 'k' | 'K'
            )
          ) {
            event.preventDefault();
            event.stopPropagation();
            toggleActionsMenu();
            return true;
          }

          // Handle Emacs navigation
          const emacsResult = handleEmacsNavigation(
            event,
            selectedIndex,
            results.length
          );
          if (emacsResult.handled) {
            event.preventDefault();
            if (emacsResult.newIndex !== undefined) {
              onSelectIndex(emacsResult.newIndex);
            }
            if (emacsResult.shouldSelect) {
              handleSelectResult(selectedIndex);
            }
            return true;
          }

          return false;
        },
      })(e),
    [
      onClose,
      selectedIndex,
      handleSelectResult,
      navigateSelection,
      toggleActionsMenu,
      results.length,
      onSelectIndex,
    ]
  );

  // Main keyboard event handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): boolean => {
      // Handle actions menu navigation first if it's open
      if (isActionsMenuOpen) {
        const handled = handleActionsMenuNavigation(e);
        if (handled) return true;
      }

      // Otherwise handle main navigation
      return handleMainNavigation(e);
    },
    [isActionsMenuOpen, handleActionsMenuNavigation, handleMainNavigation]
  );

  return { handleKeyDown };
}
