/**
 * List of search results component
 */
import type { SearchResult } from '@/types';
import type { ActionCallbacks } from '@/utils/resultActions';
import type React from 'react';

import ResultItem from './ResultItem';

interface ResultsListProps {
  results: SearchResult[];
  selectedIndex: number;
  onResultClick: (
    result: SearchResult,
    index: number,
    e?: React.MouseEvent
  ) => void;
  resultRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  actionCallbacks: ActionCallbacks;
}

export default function ResultsList({
  results,
  selectedIndex,
  onResultClick,
  resultRefs,
  actionCallbacks,
}: ResultsListProps) {
  return (
    <div className='max-h-[420px] overflow-y-auto'>
      {results.map((result, index) => (
        <ResultItem
          key={result.id}
          result={result}
          index={index}
          isSelected={index === selectedIndex}
          onClick={onResultClick}
          resultRef={(el) => {
            // eslint-disable-next-line no-param-reassign
            resultRefs.current[index] = el;
          }}
          actionCallbacks={actionCallbacks}
        />
      ))}
    </div>
  );
}
