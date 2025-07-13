/**
 * Custom hook for keyboard navigation handling
 */
import type { SearchResult } from '@/types';
import type { ActionCallbacks } from '@/utils/resultActions';
import type React from 'react';

import {
  hasModifierKey,
  isEmacsNavigation,
  NavigationDirection,
} from '@/utils/keyboardUtils';
import { executeResultAction } from '@/utils/resultActions';

interface UseKeyboardNavigationProps {
  results: SearchResult[];
  selectedIndex: number;
  onNavigate: (direction: NavigationDirection) => void;
  onClose: () => void;
  actionCallbacks: ActionCallbacks;
}

export default function useKeyboardNavigation({
  results,
  selectedIndex,
  onNavigate,
  onClose,
  actionCallbacks,
}: UseKeyboardNavigationProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle Emacs-style navigation (Ctrl+N and Ctrl+P)
    const emacsNav = isEmacsNavigation(e);
    if (emacsNav.isEmacs && emacsNav.direction) {
      e.preventDefault();
      if (results.length > 0) {
        const direction =
          emacsNav.direction === 'next'
            ? NavigationDirection.Next
            : NavigationDirection.Previous;
        onNavigate(direction);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (results.length > 0) {
          onNavigate(NavigationDirection.Next);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (results.length > 0) {
          onNavigate(NavigationDirection.Previous);
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          const modifierPressed = hasModifierKey(e);
          executeResultAction(
            results[selectedIndex],
            actionCallbacks,
            modifierPressed
          );
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
      default:
        // Do nothing for other keys
        break;
    }
  };

  return { handleKeyDown };
}
