import type React from 'react';

import {
  getNextIndex,
  getPrevIndex,
  handleEmacsNavigation,
  isEmacsNavigation,
  navigateInDirection,
  NavigationDirection,
} from '../keyboardUtils';

// Helper function to create mock keyboard events
function createMockKeyboardEvent(
  key: string,
  ctrlKey: boolean = false,
  metaKey: boolean = false
): React.KeyboardEvent {
  return {
    key,
    ctrlKey,
    metaKey,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
  } as unknown as React.KeyboardEvent;
}

describe('keyboardUtils', () => {
  describe('isEmacsNavigation', () => {
    it('should detect Ctrl+N as next navigation', () => {
      const event = createMockKeyboardEvent('n', true);
      const result = isEmacsNavigation(event);

      expect(result).toEqual({
        isEmacs: true,
        direction: 'next',
      });
    });

    it('should detect Ctrl+P as previous navigation', () => {
      const event = createMockKeyboardEvent('p', true);
      const result = isEmacsNavigation(event);

      expect(result).toEqual({
        isEmacs: true,
        direction: 'prev',
      });
    });

    it('should not detect navigation without Ctrl key', () => {
      const nEvent = createMockKeyboardEvent('n', false);
      const pEvent = createMockKeyboardEvent('p', false);

      expect(isEmacsNavigation(nEvent)).toEqual({ isEmacs: false });
      expect(isEmacsNavigation(pEvent)).toEqual({ isEmacs: false });
    });

    it('should not detect navigation for other keys with Ctrl', () => {
      const aEvent = createMockKeyboardEvent('a', true);
      const enterEvent = createMockKeyboardEvent('Enter', true);

      expect(isEmacsNavigation(aEvent)).toEqual({ isEmacs: false });
      expect(isEmacsNavigation(enterEvent)).toEqual({ isEmacs: false });
    });
  });

  describe('getNextIndex', () => {
    it('should return next index in normal case', () => {
      expect(getNextIndex(0, 5)).toBe(1);
      expect(getNextIndex(2, 5)).toBe(3);
    });

    it('should wrap around to 0 when at end', () => {
      expect(getNextIndex(4, 5)).toBe(0);
    });

    it('should handle single item array', () => {
      expect(getNextIndex(0, 1)).toBe(0);
    });

    it('should handle edge cases', () => {
      expect(getNextIndex(0, 0)).toBe(NaN); // Division by zero
    });
  });

  describe('getPrevIndex', () => {
    it('should return previous index in normal case', () => {
      expect(getPrevIndex(2, 5)).toBe(1);
      expect(getPrevIndex(4, 5)).toBe(3);
    });

    it('should wrap around to end when at beginning', () => {
      expect(getPrevIndex(0, 5)).toBe(4);
    });

    it('should handle single item array', () => {
      expect(getPrevIndex(0, 1)).toBe(0);
    });

    it('should handle edge cases', () => {
      expect(getPrevIndex(0, 0)).toBe(NaN); // Division by zero
    });
  });

  describe('NavigationDirection', () => {
    it('should have correct enum values', () => {
      expect(NavigationDirection.Next).toBe('next');
      expect(NavigationDirection.Previous).toBe('previous');
    });
  });

  describe('navigateInDirection', () => {
    it('should navigate next', () => {
      const result = navigateInDirection(NavigationDirection.Next, 2, 5);
      expect(result).toBe(3);
    });

    it('should navigate previous', () => {
      const result = navigateInDirection(NavigationDirection.Previous, 2, 5);
      expect(result).toBe(1);
    });

    it('should handle wrap around for next', () => {
      const result = navigateInDirection(NavigationDirection.Next, 4, 5);
      expect(result).toBe(0);
    });

    it('should handle wrap around for previous', () => {
      const result = navigateInDirection(NavigationDirection.Previous, 0, 5);
      expect(result).toBe(4);
    });

    it('should return 0 for empty array', () => {
      const nextResult = navigateInDirection(NavigationDirection.Next, 0, 0);
      const prevResult = navigateInDirection(
        NavigationDirection.Previous,
        0,
        0
      );

      expect(nextResult).toBe(0);
      expect(prevResult).toBe(0);
    });

    it('should return current index for invalid direction', () => {
      const result = navigateInDirection(
        'invalid' as NavigationDirection,
        2,
        5
      );
      expect(result).toBe(2);
    });
  });

  describe('handleEmacsNavigation', () => {
    it('should handle Ctrl+N (next)', () => {
      const event = createMockKeyboardEvent('n', true);
      const result = handleEmacsNavigation(event, 2, 5);

      expect(result).toEqual({
        handled: true,
        newIndex: 3,
      });
    });

    it('should handle Ctrl+P (previous)', () => {
      const event = createMockKeyboardEvent('p', true);
      const result = handleEmacsNavigation(event, 2, 5);

      expect(result).toEqual({
        handled: true,
        newIndex: 1,
      });
    });

    it('should handle wrap around for Ctrl+N', () => {
      const event = createMockKeyboardEvent('n', true);
      const result = handleEmacsNavigation(event, 4, 5);

      expect(result).toEqual({
        handled: true,
        newIndex: 0,
      });
    });

    it('should handle wrap around for Ctrl+P', () => {
      const event = createMockKeyboardEvent('p', true);
      const result = handleEmacsNavigation(event, 0, 5);

      expect(result).toEqual({
        handled: true,
        newIndex: 4,
      });
    });

    it('should not handle non-Emacs keys', () => {
      const event = createMockKeyboardEvent('a', true);
      const result = handleEmacsNavigation(event, 2, 5);

      expect(result).toEqual({ handled: false });
    });

    it('should not handle keys without Ctrl', () => {
      const nEvent = createMockKeyboardEvent('n', false);
      const pEvent = createMockKeyboardEvent('p', false);

      expect(handleEmacsNavigation(nEvent, 2, 5)).toEqual({ handled: false });
      expect(handleEmacsNavigation(pEvent, 2, 5)).toEqual({ handled: false });
    });

    it('should handle single item array', () => {
      const nextEvent = createMockKeyboardEvent('n', true);
      const prevEvent = createMockKeyboardEvent('p', true);

      const nextResult = handleEmacsNavigation(nextEvent, 0, 1);
      const prevResult = handleEmacsNavigation(prevEvent, 0, 1);

      expect(nextResult).toEqual({ handled: true, newIndex: 0 });
      expect(prevResult).toEqual({ handled: true, newIndex: 0 });
    });

    it('should handle empty array', () => {
      const event = createMockKeyboardEvent('n', true);
      const result = handleEmacsNavigation(event, 0, 0);

      expect(result).toEqual({ handled: true, newIndex: NaN });
    });
  });
});
