/**
 * Utility functions for keyboard event handling
 */
import type React from 'react';

/**
 * Checks if a keyboard event is an Emacs-style navigation key
 */
export function isEmacsNavigation(e: React.KeyboardEvent): {
  isEmacs: boolean;
  direction?: 'next' | 'prev';
} {
  if (!e.ctrlKey) return { isEmacs: false };

  if (e.key === 'n') {
    return { isEmacs: true, direction: 'next' };
  }

  if (e.key === 'p') {
    return { isEmacs: true, direction: 'prev' };
  }

  return { isEmacs: false };
}

/**
 * Checks if a keyboard or mouse event has modifier keys
 */
export function hasModifierKey(
  e: React.KeyboardEvent | React.MouseEvent
): boolean {
  return e.ctrlKey || e.metaKey;
}

/**
 * Calculates the next index for circular navigation
 */
export function getNextIndex(
  currentIndex: number,
  arrayLength: number
): number {
  return (currentIndex + 1) % arrayLength;
}

/**
 * Calculates the previous index for circular navigation
 */
export function getPrevIndex(
  currentIndex: number,
  arrayLength: number
): number {
  return (currentIndex - 1 + arrayLength) % arrayLength;
}

/**
 * Navigation directions enum
 */
export enum NavigationDirection {
  Next = 'next',
  Previous = 'previous',
}

/**
 * Handles navigation in a given direction
 */
export function navigateInDirection(
  direction: NavigationDirection,
  currentIndex: number,
  arrayLength: number
): number {
  if (arrayLength === 0) return 0;

  switch (direction) {
    case NavigationDirection.Next:
      return getNextIndex(currentIndex, arrayLength);
    case NavigationDirection.Previous:
      return getPrevIndex(currentIndex, arrayLength);
    default:
      return currentIndex;
  }
}

/**
 * Handles Emacs-style navigation
 */
export function handleEmacsNavigation(
  e: React.KeyboardEvent,
  currentIndex: number,
  arrayLength: number
): { handled: boolean; newIndex?: number; shouldSelect?: boolean } {
  const emacsResult = isEmacsNavigation(e);

  if (!emacsResult.isEmacs) {
    return { handled: false };
  }

  if (emacsResult.direction === 'next') {
    return {
      handled: true,
      newIndex: getNextIndex(currentIndex, arrayLength),
    };
  }

  if (emacsResult.direction === 'prev') {
    return {
      handled: true,
      newIndex: getPrevIndex(currentIndex, arrayLength),
    };
  }

  return { handled: false };
}

/**
 * Handles Tab key behavior
 */
export function handleTabKey(
  e: React.KeyboardEvent,
  _inputElement: HTMLInputElement | null // eslint-disable-line @typescript-eslint/no-unused-vars
): { handled: boolean } {
  if (e.key !== 'Tab') {
    return { handled: false };
  }

  // Let Tab work normally for now
  return { handled: false };
}
