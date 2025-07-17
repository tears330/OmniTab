/**
 * @jest-environment jsdom
 */
import type { SearchResult } from '@/types/extension';
import type React from 'react';
import { act, renderHook } from '@testing-library/react';

import { useOmniTabStore } from '@/stores/omniTabStore';

import useKeyboardNavigation from '../useKeyboardNavigation';

// Mock the store
jest.mock('@/stores/omniTabStore');

describe('useKeyboardNavigation', () => {
  const mockOnClose = jest.fn();
  const mockOnSelectIndex = jest.fn();
  const mockOnExecuteAction = jest.fn();

  const mockResults: SearchResult[] = [
    {
      id: 'tab-1',
      title: 'Tab 1',
      description: 'First tab',
      type: 'tab',
      actions: [
        { id: 'switch', label: 'Switch', primary: true },
        { id: 'close', label: 'Close', shortcut: 'x', primary: false },
        { id: 'duplicate', label: 'Duplicate', shortcut: 'd', primary: false },
        {
          id: 'close-group',
          label: 'Close Group',
          shortcut: 'g',
          primary: false,
        },
        {
          id: 'close-other-groups',
          label: 'Close Other Groups',
          shortcut: 'G',
          primary: false,
        },
      ],
    },
    {
      id: 'tab-2',
      title: 'Tab 2',
      description: 'Second tab',
      type: 'tab',
      actions: [
        { id: 'switch', label: 'Switch', primary: true },
        { id: 'close', label: 'Close', shortcut: 'x', primary: false },
      ],
    },
  ];

  // Mock store state
  const mockStoreState = {
    isActionsMenuOpen: false,
    actionsMenuSelectedIndex: 0,
    toggleActionsMenu: jest.fn(),
    setActionsMenuSelectedIndex: jest.fn(),
    closeActionsMenu: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mock store state
    mockStoreState.isActionsMenuOpen = false;
    mockStoreState.actionsMenuSelectedIndex = 0;

    // Setup store mock
    (useOmniTabStore as unknown as jest.Mock).mockReturnValue(mockStoreState);
  });

  const createKeyboardEvent = (
    key: string,
    options: Partial<React.KeyboardEvent> = {}
  ): React.KeyboardEvent =>
    ({
      key,
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      shiftKey: false,
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      ...options,
    }) as unknown as React.KeyboardEvent;

  describe('Main Navigation', () => {
    it('should handle Escape key to close', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          results: mockResults,
          selectedIndex: 0,
          onSelectIndex: mockOnSelectIndex,
          onClose: mockOnClose,
          onExecuteAction: mockOnExecuteAction,
        })
      );

      const event = createKeyboardEvent('Escape');
      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(mockOnClose).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should handle Enter key to execute primary action', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          results: mockResults,
          selectedIndex: 0,
          onSelectIndex: mockOnSelectIndex,
          onClose: mockOnClose,
          onExecuteAction: mockOnExecuteAction,
        })
      );

      const event = createKeyboardEvent('Enter');
      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(mockOnExecuteAction).toHaveBeenCalledWith('tab-1', 'switch');
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should handle ArrowUp key to navigate up', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          results: mockResults,
          selectedIndex: 1,
          onSelectIndex: mockOnSelectIndex,
          onClose: mockOnClose,
          onExecuteAction: mockOnExecuteAction,
        })
      );

      const event = createKeyboardEvent('ArrowUp');
      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(mockOnSelectIndex).toHaveBeenCalledWith(0);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should handle ArrowDown key to navigate down', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          results: mockResults,
          selectedIndex: 0,
          onSelectIndex: mockOnSelectIndex,
          onClose: mockOnClose,
          onExecuteAction: mockOnExecuteAction,
        })
      );

      const event = createKeyboardEvent('ArrowDown');
      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(mockOnSelectIndex).toHaveBeenCalledWith(1);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should toggle actions menu with Cmd+K', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          results: mockResults,
          selectedIndex: 0,
          onSelectIndex: mockOnSelectIndex,
          onClose: mockOnClose,
          onExecuteAction: mockOnExecuteAction,
        })
      );

      const event = createKeyboardEvent('k', { metaKey: true });
      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(mockStoreState.toggleActionsMenu).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should toggle actions menu with Ctrl+K', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          results: mockResults,
          selectedIndex: 0,
          onSelectIndex: mockOnSelectIndex,
          onClose: mockOnClose,
          onExecuteAction: mockOnExecuteAction,
        })
      );

      const event = createKeyboardEvent('K', { ctrlKey: true });
      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(mockStoreState.toggleActionsMenu).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should handle Emacs navigation with Ctrl+N', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          results: mockResults,
          selectedIndex: 0,
          onSelectIndex: mockOnSelectIndex,
          onClose: mockOnClose,
          onExecuteAction: mockOnExecuteAction,
        })
      );

      const event = createKeyboardEvent('n', { ctrlKey: true });
      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(mockOnSelectIndex).toHaveBeenCalledWith(1);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should handle Emacs navigation with Ctrl+P', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          results: mockResults,
          selectedIndex: 1,
          onSelectIndex: mockOnSelectIndex,
          onClose: mockOnClose,
          onExecuteAction: mockOnExecuteAction,
        })
      );

      const event = createKeyboardEvent('p', { ctrlKey: true });
      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(mockOnSelectIndex).toHaveBeenCalledWith(0);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow normal text input', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          results: mockResults,
          selectedIndex: 0,
          onSelectIndex: mockOnSelectIndex,
          onClose: mockOnClose,
          onExecuteAction: mockOnExecuteAction,
        })
      );

      const event = createKeyboardEvent('a');
      act(() => {
        result.current.handleKeyDown(event);
      });

      // Should not prevent default for normal text input
      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
      expect(mockOnExecuteAction).not.toHaveBeenCalled();
    });
  });

  describe('Actions Menu Navigation', () => {
    beforeEach(() => {
      mockStoreState.isActionsMenuOpen = true;
    });

    it('should close actions menu on Escape', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          results: mockResults,
          selectedIndex: 0,
          onSelectIndex: mockOnSelectIndex,
          onClose: mockOnClose,
          onExecuteAction: mockOnExecuteAction,
        })
      );

      const event = createKeyboardEvent('Escape');
      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(mockStoreState.closeActionsMenu).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should execute selected secondary action on Enter', () => {
      mockStoreState.actionsMenuSelectedIndex = 1; // Select "duplicate" action

      const { result } = renderHook(() =>
        useKeyboardNavigation({
          results: mockResults,
          selectedIndex: 0,
          onSelectIndex: mockOnSelectIndex,
          onClose: mockOnClose,
          onExecuteAction: mockOnExecuteAction,
        })
      );

      const event = createKeyboardEvent('Enter');
      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(mockOnExecuteAction).toHaveBeenCalledWith('tab-1', 'duplicate');
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should navigate actions menu with arrow keys', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          results: mockResults,
          selectedIndex: 0,
          onSelectIndex: mockOnSelectIndex,
          onClose: mockOnClose,
          onExecuteAction: mockOnExecuteAction,
        })
      );

      const downEvent = createKeyboardEvent('ArrowDown');
      act(() => {
        result.current.handleKeyDown(downEvent);
      });

      expect(mockStoreState.setActionsMenuSelectedIndex).toHaveBeenCalledWith(
        1
      );
      expect(downEvent.preventDefault).toHaveBeenCalled();
      expect(downEvent.stopPropagation).toHaveBeenCalled();

      jest.clearAllMocks();

      const upEvent = createKeyboardEvent('ArrowUp');
      act(() => {
        result.current.handleKeyDown(upEvent);
      });

      expect(mockStoreState.setActionsMenuSelectedIndex).toHaveBeenCalledWith(
        -1
      );
      expect(upEvent.preventDefault).toHaveBeenCalled();
      expect(upEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should handle direct action shortcuts', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          results: mockResults,
          selectedIndex: 0,
          onSelectIndex: mockOnSelectIndex,
          onClose: mockOnClose,
          onExecuteAction: mockOnExecuteAction,
        })
      );

      const event = createKeyboardEvent('x');
      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(mockOnExecuteAction).toHaveBeenCalledWith('tab-1', 'close');
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should handle case-sensitive shortcuts (lowercase)', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          results: mockResults,
          selectedIndex: 0,
          onSelectIndex: mockOnSelectIndex,
          onClose: mockOnClose,
          onExecuteAction: mockOnExecuteAction,
        })
      );

      const event = createKeyboardEvent('g');
      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(mockOnExecuteAction).toHaveBeenCalledWith('tab-1', 'close-group');
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should handle case-sensitive shortcuts (uppercase)', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          results: mockResults,
          selectedIndex: 0,
          onSelectIndex: mockOnSelectIndex,
          onClose: mockOnClose,
          onExecuteAction: mockOnExecuteAction,
        })
      );

      const event = createKeyboardEvent('G');
      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(mockOnExecuteAction).toHaveBeenCalledWith(
        'tab-1',
        'close-other-groups'
      );
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should distinguish between uppercase and lowercase shortcuts', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          results: mockResults,
          selectedIndex: 0,
          onSelectIndex: mockOnSelectIndex,
          onClose: mockOnClose,
          onExecuteAction: mockOnExecuteAction,
        })
      );

      // Test lowercase 'g' first
      const lowercaseEvent = createKeyboardEvent('g');
      act(() => {
        result.current.handleKeyDown(lowercaseEvent);
      });

      expect(mockOnExecuteAction).toHaveBeenCalledWith('tab-1', 'close-group');
      expect(mockOnExecuteAction).not.toHaveBeenCalledWith(
        'tab-1',
        'close-other-groups'
      );

      jest.clearAllMocks();

      // Test uppercase 'G'
      const uppercaseEvent = createKeyboardEvent('G');
      act(() => {
        result.current.handleKeyDown(uppercaseEvent);
      });

      expect(mockOnExecuteAction).toHaveBeenCalledWith(
        'tab-1',
        'close-other-groups'
      );
      expect(mockOnExecuteAction).not.toHaveBeenCalledWith(
        'tab-1',
        'close-group'
      );
    });

    it('should handle Emacs navigation in actions menu', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          results: mockResults,
          selectedIndex: 0,
          onSelectIndex: mockOnSelectIndex,
          onClose: mockOnClose,
          onExecuteAction: mockOnExecuteAction,
        })
      );

      const event = createKeyboardEvent('n', { ctrlKey: true });
      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(mockStoreState.setActionsMenuSelectedIndex).toHaveBeenCalledWith(
        1
      );
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should not trigger main navigation when actions menu is open', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          results: mockResults,
          selectedIndex: 0,
          onSelectIndex: mockOnSelectIndex,
          onClose: mockOnClose,
          onExecuteAction: mockOnExecuteAction,
        })
      );

      // Try to navigate main list with arrow key
      const event = createKeyboardEvent('ArrowDown');
      act(() => {
        result.current.handleKeyDown(event);
      });

      // Should navigate actions menu, not main list
      expect(mockStoreState.setActionsMenuSelectedIndex).toHaveBeenCalled();
      expect(mockOnSelectIndex).not.toHaveBeenCalled();
    });

    it('should fallback to main navigation for unhandled keys', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          results: mockResults,
          selectedIndex: 0,
          onSelectIndex: mockOnSelectIndex,
          onClose: mockOnClose,
          onExecuteAction: mockOnExecuteAction,
        })
      );

      // Type a normal character that's not a shortcut
      const event = createKeyboardEvent('q');
      act(() => {
        result.current.handleKeyDown(event);
      });

      // Should not prevent default for unhandled keys
      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(event.stopPropagation).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty results', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          results: [],
          selectedIndex: 0,
          onSelectIndex: mockOnSelectIndex,
          onClose: mockOnClose,
          onExecuteAction: mockOnExecuteAction,
        })
      );

      const event = createKeyboardEvent('Enter');
      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(mockOnExecuteAction).not.toHaveBeenCalled();
    });

    it('should handle results without actions', () => {
      const resultsWithoutActions: SearchResult[] = [
        {
          id: 'test-1',
          title: 'Test',
          description: 'Test result',
          type: 'tab',
          actions: [],
        },
      ];

      const { result } = renderHook(() =>
        useKeyboardNavigation({
          results: resultsWithoutActions,
          selectedIndex: 0,
          onSelectIndex: mockOnSelectIndex,
          onClose: mockOnClose,
          onExecuteAction: mockOnExecuteAction,
        })
      );

      const event = createKeyboardEvent('Enter');
      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(mockOnExecuteAction).not.toHaveBeenCalled();
    });

    it('should handle results without primary action', () => {
      const resultsWithoutPrimary: SearchResult[] = [
        {
          id: 'test-1',
          title: 'Test',
          description: 'Test result',
          type: 'tab',
          actions: [{ id: 'action1', label: 'Action 1', primary: false }],
        },
      ];

      const { result } = renderHook(() =>
        useKeyboardNavigation({
          results: resultsWithoutPrimary,
          selectedIndex: 0,
          onSelectIndex: mockOnSelectIndex,
          onClose: mockOnClose,
          onExecuteAction: mockOnExecuteAction,
        })
      );

      const event = createKeyboardEvent('Enter');
      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(mockOnExecuteAction).not.toHaveBeenCalled();
    });

    it('should handle invalid selected index in actions menu', () => {
      mockStoreState.isActionsMenuOpen = true;
      mockStoreState.actionsMenuSelectedIndex = 10; // Out of bounds

      const { result } = renderHook(() =>
        useKeyboardNavigation({
          results: mockResults,
          selectedIndex: 0,
          onSelectIndex: mockOnSelectIndex,
          onClose: mockOnClose,
          onExecuteAction: mockOnExecuteAction,
        })
      );

      const event = createKeyboardEvent('Enter');
      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(mockOnExecuteAction).not.toHaveBeenCalled();
    });
  });
});
