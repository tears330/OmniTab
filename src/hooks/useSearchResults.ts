/**
 * Custom hook for managing search results and search state
 */
import { useEffect, useState } from 'react';
import type { SearchResult } from '@/types';

export default function useSearchResults() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadResults = (term: string) => {
    setIsLoading(true);
    chrome.runtime.sendMessage(
      { action: 'search-tabs', searchTerm: term },
      (response: { results?: SearchResult[] }) => {
        if (response?.results) {
          setResults(response.results);
        }
        setIsLoading(false);
      }
    );
  };

  // Load initial results when hook mounts
  useEffect(() => {
    loadResults('');
  }, []);

  // Search when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      return undefined; // Skip empty search - already handled in mount effect
    }

    const debounceTimer = setTimeout(() => {
      loadResults(searchTerm);
    }, 100);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const removeResult = (index: number) => {
    setResults((prev) => prev.filter((_, i) => i !== index));
  };

  return {
    searchTerm,
    setSearchTerm,
    results,
    isLoading,
    removeResult,
  };
}
