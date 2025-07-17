/**
 * Container for search results for extension architecture
 */
import { useEffect, useRef } from 'react';
import type { SearchResult } from '@/types/extension';

import ResultItem from './ResultItem';

interface ResultsListProps {
  results: SearchResult[];
  selectedIndex: number;
  onSelectResult: (index: number) => void;
  onActionResult: (resultId: string, actionId: string) => void;
}

export default function ResultsList({
  results,
  selectedIndex,
  onSelectResult,
  onActionResult,
}: ResultsListProps) {
  const selectedRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to keep selected item in view
  useEffect(() => {
    if (selectedRef.current && containerRef.current) {
      const container = containerRef.current;
      const selected = selectedRef.current;

      const containerRect = container.getBoundingClientRect();
      const selectedRect = selected.getBoundingClientRect();

      // Calculate relative positions
      const isAbove = selectedRect.top < containerRect.top;
      const isBelow = selectedRect.bottom > containerRect.bottom;

      if (isAbove) {
        // Scroll up to show the selected item
        selected.scrollIntoView({ block: 'start', behavior: 'instant' });
      } else if (isBelow) {
        // Scroll down to show the selected item
        selected.scrollIntoView({ block: 'end', behavior: 'instant' });
      }
    }
  }, [selectedIndex]);

  return (
    <div
      ref={containerRef}
      className='scrollbar-thin scrollbar-track-gray-900 scrollbar-thumb-gray-700 max-h-[400px] overflow-y-auto overflow-x-hidden pb-1'
    >
      {results.map((result, index) => (
        <ResultItem
          key={result.id}
          result={result}
          index={index}
          isSelected={index === selectedIndex}
          onSelect={onSelectResult}
          onAction={onActionResult}
          resultRef={
            index === selectedIndex
              ? (el) => {
                  if (selectedRef.current !== el) selectedRef.current = el;
                }
              : () => {}
          }
        />
      ))}
    </div>
  );
}
