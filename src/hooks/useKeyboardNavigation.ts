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
  onOpenActionsMenu?: () => void;
}

export default function useKeyboardNavigation({
  results,
  selectedIndex,
  onSelectIndex,
  onClose,
  onExecuteAction,
  onOpenActionsMenu,
}: UseKeyboardNavigationProps) {
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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Escape to close
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // Arrow navigation
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        onSelectIndex(selectedIndex + 1);
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        onSelectIndex(selectedIndex - 1);
        return;
      }

      // Cmd+K for actions menu
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        e.stopPropagation();
        const result = results[selectedIndex];
        if (
          result &&
          result.actions.filter((a) => !a.primary).length > 0 &&
          onOpenActionsMenu
        ) {
          onOpenActionsMenu();
        }
        return;
      }

      // Enter to select primary action
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSelectResult(selectedIndex);
        return;
      }

      // Emacs navigation
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
      }
    },
    [
      onClose,
      selectedIndex,
      results,
      handleSelectResult,
      onSelectIndex,
      onOpenActionsMenu,
    ]
  );

  return { handleKeyDown };
}
