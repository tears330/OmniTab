/**
 * Custom hook for managing result navigation and selection
 */
import { useEffect, useRef, useState } from 'react';

import {
  navigateInDirection,
  NavigationDirection,
} from '@/utils/keyboardUtils';

export default function useResultNavigation(resultsLength: number) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const resultRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
    resultRefs.current = new Array(resultsLength).fill(null);
  }, [resultsLength]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultRefs.current[selectedIndex]) {
      resultRefs.current[selectedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [selectedIndex]);

  const navigate = (direction: NavigationDirection) => {
    if (resultsLength === 0) return;

    const newIndex = navigateInDirection(
      direction,
      selectedIndex,
      resultsLength
    );
    setSelectedIndex(newIndex);
  };

  const setSelectedIndexSafe = (index: number) => {
    if (index >= 0 && index < resultsLength) {
      setSelectedIndex(index);
    }
  };

  const adjustAfterRemoval = () => {
    setSelectedIndex((prev) => Math.min(prev, resultsLength - 2));
  };

  return {
    selectedIndex,
    setSelectedIndex: setSelectedIndexSafe,
    resultRefs,
    navigate,
    adjustAfterRemoval,
  };
}
