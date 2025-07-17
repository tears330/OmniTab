/**
 * @jest-environment jsdom
 */
import type { SearchResult } from '@/types/extension';
import type React from 'react';
import { act, renderHook } from '@testing-library/react';

import useKeyboardNavigation from '../useKeyboardNavigation';

describe('useKeyboardNavigation', () => {
  const mockOnClose = jest.fn();
  const mockOnSelectIndex = jest.fn();
  const mockOnExecuteAction = jest.fn();
  const mockOnToggleActionsMenu = jest.fn();
  const mockOnCloseActionsMenu = jest.fn();
  const mockOnSetActionsMenuSelectedIndex = jest.fn();

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

  // Helper function to create hook props
  const createHookProps = (
    overrides: Partial<Parameters<typeof useKeyboardNavigation>[0]> = {}
  ) => ({
    results: mockResults,
    selectedIndex: 0,
    onSelectIndex: mockOnSelectIndex,
    onClose: mockOnClose,
    onExecuteAction: mockOnExecuteAction,
    isActionsMenuOpen: false,
    actionsMenuSelectedIndex: 0,
    onToggleActionsMenu: mockOnToggleActionsMenu,
    onCloseActionsMenu: mockOnCloseActionsMenu,
    onSetActionsMenuSelectedIndex: mockOnSetActionsMenuSelectedIndex,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
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
        useKeyboardNavigation(createHookProps())
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
        useKeyboardNavigation(createHookProps())
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
        useKeyboardNavigation(createHookProps({ selectedIndex: 1 }))
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
        useKeyboardNavigation(createHookProps())
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
        useKeyboardNavigation(createHookProps())
      );

      const event = createKeyboardEvent('k', { metaKey: true });
      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(mockOnToggleActionsMenu).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should toggle actions menu with Ctrl+K', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation(createHookProps())
      );

      const event = createKeyboardEvent('K', { ctrlKey: true });
      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(mockOnToggleActionsMenu).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should handle Emacs navigation with Ctrl+N', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation(createHookProps())
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
        useKeyboardNavigation(createHookProps({ selectedIndex: 1 }))
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
        useKeyboardNavigation(createHookProps())
      );

      const event = createKeyboardEvent('a');
      let handled: boolean;
      act(() => {
        handled = result.current.handleKeyDown(event);
      });

      expect(handled!).toBe(false);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should always stop event propagation to prevent page shortcuts', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation(createHookProps())
      );

      const event = createKeyboardEvent('a');
      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(event.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('Actions Menu Navigation', () => {
    it('should close actions menu on Escape', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation(createHookProps({ isActionsMenuOpen: true }))
      );

      const event = createKeyboardEvent('Escape');
      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(mockOnCloseActionsMenu).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should execute selected secondary action on Enter', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation(
          createHookProps({
            isActionsMenuOpen: true,
            actionsMenuSelectedIndex: 1,
          })
        )
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
        useKeyboardNavigation(createHookProps({ isActionsMenuOpen: true }))
      );

      const downEvent = createKeyboardEvent('ArrowDown');
      act(() => {
        result.current.handleKeyDown(downEvent);
      });

      expect(mockOnSetActionsMenuSelectedIndex).toHaveBeenCalledWith(1);
      expect(downEvent.preventDefault).toHaveBeenCalled();
      expect(downEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should handle direct action shortcuts', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation(createHookProps({ isActionsMenuOpen: true }))
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
        useKeyboardNavigation(createHookProps({ isActionsMenuOpen: true }))
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
        useKeyboardNavigation(createHookProps({ isActionsMenuOpen: true }))
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
        useKeyboardNavigation(createHookProps({ isActionsMenuOpen: true }))
      );

      const lowercaseEvent = createKeyboardEvent('g');
      act(() => {
        result.current.handleKeyDown(lowercaseEvent);
      });

      expect(mockOnExecuteAction).toHaveBeenCalledWith('tab-1', 'close-group');
      expect(mockOnExecuteAction).not.toHaveBeenCalledWith(
        'tab-1',
        'close-other-groups'
      );
    });

    it('should handle Emacs navigation in actions menu', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation(createHookProps({ isActionsMenuOpen: true }))
      );

      const event = createKeyboardEvent('n', { ctrlKey: true });
      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(mockOnSetActionsMenuSelectedIndex).toHaveBeenCalledWith(1);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should close actions menu with Cmd/Ctrl+K when actions menu is open', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation(createHookProps({ isActionsMenuOpen: true }))
      );

      const cmdEvent = createKeyboardEvent('k', { metaKey: true });
      act(() => {
        result.current.handleKeyDown(cmdEvent);
      });

      expect(mockOnCloseActionsMenu).toHaveBeenCalled();
      expect(cmdEvent.preventDefault).toHaveBeenCalled();
      expect(cmdEvent.stopPropagation).toHaveBeenCalled();

      jest.clearAllMocks();

      const ctrlEvent = createKeyboardEvent('K', { ctrlKey: true });
      act(() => {
        result.current.handleKeyDown(ctrlEvent);
      });

      expect(mockOnCloseActionsMenu).toHaveBeenCalled();
      expect(ctrlEvent.preventDefault).toHaveBeenCalled();
      expect(ctrlEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should not trigger main navigation when actions menu is open', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation(createHookProps({ isActionsMenuOpen: true }))
      );

      const event = createKeyboardEvent('ArrowUp');
      act(() => {
        result.current.handleKeyDown(event);
      });

      // Should navigate actions menu, not main list
      expect(mockOnSetActionsMenuSelectedIndex).toHaveBeenCalled();
      expect(mockOnSelectIndex).not.toHaveBeenCalled();
    });

    it('should fallback to main navigation for unhandled keys', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation(createHookProps({ isActionsMenuOpen: true }))
      );

      const event = createKeyboardEvent('z'); // Unhandled key
      let handled: boolean;
      act(() => {
        handled = result.current.handleKeyDown(event);
      });

      expect(handled!).toBe(false);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty results', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation(createHookProps({ results: [] }))
      );

      const event = createKeyboardEvent('Enter');
      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(mockOnExecuteAction).not.toHaveBeenCalled();
    });

    it('should handle results without actions', () => {
      const resultsWithoutActions = [
        {
          id: 'empty-result',
          title: 'Empty Result',
          description: 'No actions',
          type: 'test',
          actions: [],
        },
      ];

      const { result } = renderHook(() =>
        useKeyboardNavigation(
          createHookProps({ results: resultsWithoutActions })
        )
      );

      const event = createKeyboardEvent('Enter');
      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(mockOnExecuteAction).not.toHaveBeenCalled();
    });

    it('should handle results without primary action', () => {
      const resultsWithoutPrimary = [
        {
          id: 'no-primary',
          title: 'No Primary Action',
          description: 'All secondary actions',
          type: 'test',
          actions: [{ id: 'secondary', label: 'Secondary', primary: false }],
        },
      ];

      const { result } = renderHook(() =>
        useKeyboardNavigation(
          createHookProps({ results: resultsWithoutPrimary })
        )
      );

      const event = createKeyboardEvent('Enter');
      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(mockOnExecuteAction).not.toHaveBeenCalled();
    });

    it('should handle invalid selected index in actions menu', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation(
          createHookProps({
            isActionsMenuOpen: true,
            actionsMenuSelectedIndex: 999,
          })
        )
      );

      const event = createKeyboardEvent('Enter');
      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(mockOnExecuteAction).not.toHaveBeenCalled();
    });
  });
});
