import type { SearchResult } from '@/types';

import {
  fuzzyScore,
  fuzzySearchResults,
  parseSearchQuery,
  scoreSearchResult,
} from '../fuzzySearch';

// Mock data for testing
const mockTabs: SearchResult[] = [
  {
    id: 1,
    title: 'GitHub - React Documentation',
    url: 'https://github.com/facebook/react',
    favIconUrl: 'https://github.com/favicon.ico',
    type: 'tab',
    windowId: 1,
  },
  {
    id: 2,
    title: 'Google Search',
    url: 'https://www.google.com/search?q=test',
    favIconUrl: 'https://www.google.com/favicon.ico',
    type: 'tab',
    windowId: 1,
  },
  {
    id: 3,
    title: 'Stack Overflow - JavaScript Questions',
    url: 'https://stackoverflow.com/questions/tagged/javascript',
    favIconUrl: 'https://stackoverflow.com/favicon.ico',
    type: 'tab',
    windowId: 1,
  },
];

const mockHistory: SearchResult[] = [
  {
    id: 'history-1',
    title: 'MDN Web Docs',
    url: 'https://developer.mozilla.org',
    favIconUrl: 'https://developer.mozilla.org/favicon.ico',
    type: 'history',
    visitCount: 45,
    lastVisitTime: Date.now() - 1000 * 60 * 60, // 1 hour ago
  },
  {
    id: 'history-2',
    title: 'React Official Website',
    url: 'https://react.dev',
    favIconUrl: 'https://react.dev/favicon.ico',
    type: 'history',
    visitCount: 12,
    lastVisitTime: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
  },
];

const mockBookmarks: SearchResult[] = [
  {
    id: 'bookmark-1',
    title: 'TypeScript Handbook',
    url: 'https://www.typescriptlang.org/docs/',
    favIconUrl: 'https://www.typescriptlang.org/favicon.ico',
    type: 'bookmark',
    dateAdded: Date.now() - 1000 * 60 * 60 * 24 * 7, // 1 week ago
  },
  {
    id: 'bookmark-2',
    title: 'Jest Testing Framework',
    url: 'https://jestjs.io/',
    favIconUrl: 'https://jestjs.io/favicon.ico',
    type: 'bookmark',
    dateAdded: Date.now() - 1000 * 60 * 60 * 24 * 30, // 1 month ago
  },
];

const allMockResults = [...mockTabs, ...mockHistory, ...mockBookmarks];

describe('parseSearchQuery', () => {
  it('should parse empty query', () => {
    const result = parseSearchQuery('');
    expect(result).toEqual({
      term: '',
      originalQuery: '',
    });
  });

  it('should parse regular search term', () => {
    const result = parseSearchQuery('react documentation');
    expect(result).toEqual({
      term: 'react documentation',
      originalQuery: 'react documentation',
    });
  });

  it('should parse category-only search', () => {
    const result = parseSearchQuery('tab');
    expect(result).toEqual({
      category: 'tab',
      term: '',
      originalQuery: 'tab',
    });

    const result2 = parseSearchQuery('history');
    expect(result2).toEqual({
      category: 'history',
      term: '',
      originalQuery: 'history',
    });

    const result3 = parseSearchQuery('bookmark');
    expect(result3).toEqual({
      category: 'bookmark',
      term: '',
      originalQuery: 'bookmark',
    });
  });

  it('should parse category with search term', () => {
    const result = parseSearchQuery('tab react');
    expect(result).toEqual({
      category: 'tab',
      term: 'react',
      originalQuery: 'tab react',
    });

    const result2 = parseSearchQuery('history docs');
    expect(result2).toEqual({
      category: 'history',
      term: 'docs',
      originalQuery: 'history docs',
    });
  });

  it('should handle case insensitive categories', () => {
    const result = parseSearchQuery('TAB React');
    expect(result).toEqual({
      category: 'tab',
      term: 'react',
      originalQuery: 'TAB React',
    });
  });

  it('should handle category aliases', () => {
    const result = parseSearchQuery('tabs react');
    expect(result).toEqual({
      category: 'tab',
      term: 'react',
      originalQuery: 'tabs react',
    });

    const result2 = parseSearchQuery('hist docs');
    expect(result2).toEqual({
      category: 'history',
      term: 'docs',
      originalQuery: 'hist docs',
    });
  });
});

describe('fuzzyScore', () => {
  it('should return 1 for empty query', () => {
    expect(fuzzyScore('any text', '')).toBe(1);
  });

  it('should return 0 for empty text', () => {
    expect(fuzzyScore('', 'query')).toBe(0);
  });

  it('should return 100 for exact match', () => {
    expect(fuzzyScore('react', 'react')).toBe(100);
    expect(fuzzyScore('React', 'react')).toBe(100);
  });

  it('should return 90 for starts with match', () => {
    expect(fuzzyScore('react documentation', 'react')).toBe(90);
    expect(fuzzyScore('GitHub Repository', 'git')).toBe(90);
  });

  it('should return 80 for substring match', () => {
    expect(fuzzyScore('MDN React Docs', 'react')).toBe(80);
    expect(fuzzyScore('JavaScript Tutorial', 'script')).toBe(80);
  });

  it('should return 0 for long queries without substring match', () => {
    expect(fuzzyScore('react documentation', 'typescript')).toBe(0);
    expect(fuzzyScore('github repository', 'stackoverflow')).toBe(0);
  });

  it('should handle word boundary matches for short queries', () => {
    expect(fuzzyScore('react documentation guide', 'doc')).toBe(80); // substring match
    expect(fuzzyScore('javascript tutorial basics', 'js')).toBe(0); // no match
  });

  it('should handle fuzzy matching within words for very short queries', () => {
    expect(fuzzyScore('react', 're')).toBe(90); // starts with
    expect(fuzzyScore('documentation', 'doc')).toBe(90); // starts with
    expect(fuzzyScore('github', 'hub')).toBe(80); // contains as substring
  });

  it('should be strict for queries 4+ characters', () => {
    expect(fuzzyScore('react documentation', 'docu')).toBe(80); // substring match
    expect(fuzzyScore('react guide', 'typescript')).toBe(0); // no match
  });
});

describe('scoreSearchResult', () => {
  const testResult: SearchResult = {
    id: 1,
    title: 'React Documentation Guide',
    url: 'https://react.dev/docs',
    favIconUrl: 'https://react.dev/favicon.ico',
    type: 'tab',
    windowId: 1,
  };

  it('should score title matches higher', () => {
    const query = { term: 'react', originalQuery: 'react' };
    const scored = scoreSearchResult(testResult, query);

    expect(scored.score).toBeGreaterThan(1000); // Has category base score
    expect(scored.matchedFields).toContain('title');
  });

  it('should score URL matches', () => {
    const query = { term: 'react.dev', originalQuery: 'react.dev' };
    const scored = scoreSearchResult(testResult, query);

    expect(scored.score).toBeGreaterThan(1000);
    expect(scored.matchedFields.length).toBeGreaterThan(0);
  });

  it('should score hostname matches', () => {
    const query = { term: 'react.dev', originalQuery: 'react.dev' };
    const scored = scoreSearchResult(testResult, query);

    expect(scored.score).toBeGreaterThan(1000);
    expect(scored.matchedFields).toContain('hostname');
  });

  it('should return 0 score for weak matches', () => {
    const query = {
      term: 'completely unrelated term',
      originalQuery: 'completely unrelated term',
    };
    const scored = scoreSearchResult(testResult, query);

    expect(scored.score).toBe(0);
    expect(scored.matchedFields).toEqual([]);
  });

  it('should add category base scores correctly', () => {
    const query = { term: 'react', originalQuery: 'react' }; // Use a term that matches

    const tabResult = { ...testResult, type: 'tab' as const };
    const historyResult = {
      id: 'history-test',
      title: testResult.title,
      url: testResult.url,
      favIconUrl: testResult.favIconUrl,
      type: 'history' as const,
      visitCount: 10,
      lastVisitTime: Date.now(),
    };
    const bookmarkResult = {
      id: 'bookmark-test',
      title: testResult.title,
      url: testResult.url,
      favIconUrl: testResult.favIconUrl,
      type: 'bookmark' as const,
      dateAdded: Date.now(),
    };

    const tabScore = scoreSearchResult(tabResult, query);
    const historyScore = scoreSearchResult(historyResult, query);
    const bookmarkScore = scoreSearchResult(bookmarkResult, query);

    // All should have scores > 0 since 'react' matches the title
    expect(tabScore.score).toBeGreaterThan(0);
    expect(historyScore.score).toBeGreaterThan(0);
    expect(bookmarkScore.score).toBeGreaterThan(0);

    // Tabs should have higher base score than history, history higher than bookmarks
    expect(tabScore.score).toBeGreaterThan(historyScore.score);
    expect(historyScore.score).toBeGreaterThan(bookmarkScore.score);
  });
});

describe('fuzzySearchResults', () => {
  it('should return all results with category priority when no search term', () => {
    const query = { term: '', originalQuery: '' };
    const results = fuzzySearchResults(allMockResults, query, 50);

    expect(results).toHaveLength(allMockResults.length);

    // Check category ordering: tabs first, then history, then bookmarks
    const tabResults = results.filter((r) => r.type === 'tab');
    const historyResults = results.filter((r) => r.type === 'history');
    const bookmarkResults = results.filter((r) => r.type === 'bookmark');

    expect(tabResults).toHaveLength(3);
    expect(historyResults).toHaveLength(2);
    expect(bookmarkResults).toHaveLength(2);

    // Tabs should come first
    expect(results.slice(0, 3).every((r) => r.type === 'tab')).toBe(true);
  });

  it('should filter by category when specified', () => {
    const query = { category: 'tab' as const, term: '', originalQuery: 'tab' };
    const results = fuzzySearchResults(allMockResults, query, 50);

    expect(results).toHaveLength(3);
    expect(results.every((r) => r.type === 'tab')).toBe(true);
  });

  it('should search within category when both category and term specified', () => {
    const query = {
      category: 'tab' as const,
      term: 'github',
      originalQuery: 'tab github',
    };
    const results = fuzzySearchResults(allMockResults, query, 50);

    expect(results).toHaveLength(1);
    expect(results[0].title).toContain('GitHub');
    expect(results[0].type).toBe('tab');
  });

  it('should search across all categories with proper ordering', () => {
    const query = { term: 'react', originalQuery: 'react' };
    const results = fuzzySearchResults(allMockResults, query, 50);

    // Should find React results in both tabs and history
    expect(results.length).toBeGreaterThan(0);

    // Tab results should come before history results
    const reactTab = results.find(
      (r) => r.type === 'tab' && r.title.toLowerCase().includes('react')
    );
    const reactHistory = results.find(
      (r) => r.type === 'history' && r.title.toLowerCase().includes('react')
    );

    // Only check ordering if both exist
    expect(reactTab).toBeDefined();
    expect(reactHistory).toBeDefined();

    const tabIndex = results.indexOf(reactTab!);
    const historyIndex = results.indexOf(reactHistory!);
    expect(tabIndex).toBeLessThan(historyIndex);
  });

  it('should respect maxResults limit', () => {
    const query = { term: '', originalQuery: '' };
    const results = fuzzySearchResults(allMockResults, query, 3);

    expect(results).toHaveLength(3);
  });

  it('should filter out low-scoring results', () => {
    const query = {
      term: 'nonexistent search term',
      originalQuery: 'nonexistent search term',
    };
    const results = fuzzySearchResults(allMockResults, query, 50);

    expect(results).toHaveLength(0);
  });

  it('should boost history results by visit count', () => {
    const highVisitHistory = {
      ...mockHistory[0],
      visitCount: 100,
    };
    const lowVisitHistory = {
      ...mockHistory[1],
      visitCount: 1,
    };

    const testData = [highVisitHistory, lowVisitHistory];
    const query = {
      category: 'history' as const,
      term: '',
      originalQuery: 'history',
    };
    const results = fuzzySearchResults(testData, query, 50);

    expect(results[0].visitCount).toBe(100);
    expect(results[1].visitCount).toBe(1);
  });

  it('should boost recent bookmarks', () => {
    const recentBookmark = {
      ...mockBookmarks[0],
      dateAdded: Date.now() - 1000 * 60 * 60, // 1 hour ago
    };
    const oldBookmark = {
      ...mockBookmarks[1],
      dateAdded: Date.now() - 1000 * 60 * 60 * 24 * 365, // 1 year ago
    };

    const testData = [oldBookmark, recentBookmark];
    const query = {
      category: 'bookmark' as const,
      term: '',
      originalQuery: 'bookmark',
    };
    const results = fuzzySearchResults(testData, query, 50);

    // Recent bookmark should score higher
    expect(results[0].dateAdded).toBe(recentBookmark.dateAdded);
    expect(results[1].dateAdded).toBe(oldBookmark.dateAdded);
  });

  it('should handle empty results gracefully', () => {
    const query = { term: 'test', originalQuery: 'test' };
    const results = fuzzySearchResults([], query, 50);

    expect(results).toEqual([]);
  });

  it('should maintain result structure with scoring', () => {
    const query = { term: 'github', originalQuery: 'github' };
    const results = fuzzySearchResults(allMockResults, query, 50);

    expect(results.length).toBeGreaterThan(0);

    const result = results[0];
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('matchedFields');
    expect(result.score).toBeGreaterThan(0);
    expect(Array.isArray(result.matchedFields)).toBe(true);
  });
});
