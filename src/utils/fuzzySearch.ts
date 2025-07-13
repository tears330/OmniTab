import type { SearchResult, SearchResultType } from '@/types';

export interface SearchQuery {
  category?: SearchResultType;
  term: string;
  originalQuery: string;
}

export interface ScoredSearchResult {
  id: string | number;
  title: string;
  url: string;
  favIconUrl: string;
  type: SearchResultType;
  windowId?: number;
  visitCount?: number;
  lastVisitTime?: number;
  dateAdded?: number;
  score: number;
  matchedFields: string[];
}

// Parse search query to extract category and search term
export function parseSearchQuery(query: string): SearchQuery {
  const trimmedQuery = query.trim().toLowerCase();

  // Check for category prefixes
  const categoryMap: Record<string, SearchResultType> = {
    tab: 'tab',
    tabs: 'tab',
    history: 'history',
    hist: 'history',
    bookmark: 'bookmark',
    bookmarks: 'bookmark',
    book: 'bookmark',
  };

  // Check for category-only search (just "tab", "history", "bookmark")
  if (categoryMap[trimmedQuery]) {
    return {
      category: categoryMap[trimmedQuery],
      term: '',
      originalQuery: query,
    };
  }

  // Check for category prefixes with search terms
  const categoryEntries = Object.entries(categoryMap);
  const matchedEntry = categoryEntries.find(([prefix]) =>
    trimmedQuery.startsWith(`${prefix} `)
  );

  if (matchedEntry) {
    const [prefix, category] = matchedEntry;
    return {
      category,
      term: trimmedQuery.slice(prefix.length + 1).trim(),
      originalQuery: query,
    };
  }

  return {
    term: trimmedQuery,
    originalQuery: query,
  };
}

// Calculate fuzzy match score between two strings
export function fuzzyScore(text: string, query: string): number {
  if (!query) return 1;
  if (!text) return 0;

  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();

  // Exact match gets highest score
  if (textLower === queryLower) return 100;

  // Starts with query gets high score
  if (textLower.startsWith(queryLower)) return 90;

  // Contains query as substring gets good score
  if (textLower.includes(queryLower)) return 80;

  // For queries 4+ characters, NO fuzzy matching at all
  // Only exact substring matches allowed
  if (queryLower.length >= 4) {
    return 0;
  }

  // For very short queries (1-3 chars), use extremely strict fuzzy matching
  // Must be consecutive characters only
  const words = textLower.split(/[^a-z0-9]+/);

  const matchingWord = words.find((word) => {
    if (word.length === 0) return false;

    // Check if query matches at word boundaries (start of words)
    if (word.startsWith(queryLower)) {
      return true;
    }

    // Only allow very short fuzzy matching within individual words
    if (word.includes(queryLower)) {
      return true;
    }

    return false;
  });

  if (matchingWord) {
    if (matchingWord.startsWith(queryLower)) {
      return 60; // Good score for word boundary match
    }
    return 50; // Good score for contains within word
  }

  // No fuzzy character-by-character matching at all
  return 0;
}

// Score a search result against a query
export function scoreSearchResult(
  result: SearchResult,
  query: SearchQuery
): ScoredSearchResult {
  const { term } = query;

  // Note: Category filtering is handled at a higher level in fuzzySearchResults

  const matchedFields: string[] = [];
  let totalScore = 0;
  let fieldCount = 0;

  // Score title (weighted higher)
  const titleScore = fuzzyScore(result.title, term);
  if (titleScore > 0) {
    totalScore += titleScore * 2; // Title has 2x weight
    matchedFields.push('title');
  }
  fieldCount += 2; // Title counts as 2 fields for weighting

  // Score URL (weighted lower)
  const urlScore = fuzzyScore(result.url, term);
  if (urlScore > 0) {
    totalScore += urlScore * 0.8; // URL has 0.8x weight
    matchedFields.push('url');
  }
  fieldCount += 0.8;

  // Score hostname separately (medium weight)
  try {
    const { hostname } = new URL(result.url);
    const hostnameScore = fuzzyScore(hostname, term);
    if (hostnameScore > 0) {
      totalScore += hostnameScore * 1.2; // Hostname has 1.2x weight
      matchedFields.push('hostname');
    }
    fieldCount += 1.2;
  } catch {
    // Invalid URL, skip hostname scoring
  }

  // Calculate final score
  const finalScore = fieldCount > 0 ? totalScore / fieldCount : 0;

  // Require a minimum score threshold to avoid weak matches
  const minimumScoreThreshold = 30; // Minimum fuzzy score required (much higher)

  // If no match at all or score too low, return 0 score to filter out
  if (finalScore < minimumScoreThreshold || matchedFields.length === 0) {
    return {
      ...result,
      score: 0,
      matchedFields,
    };
  }

  // Add category-based base score to ensure proper ordering
  // This ensures tabs always rank higher than history, and history higher than bookmarks
  let categoryBaseScore = 0;
  if (result.type === 'tab') {
    categoryBaseScore = 1000; // Tabs get +1000 base score
  } else if (result.type === 'history') {
    categoryBaseScore = 500; // History gets +500 base score
    // Add visit count bonus within history category
    if (result.visitCount) {
      const { visitCount } = result;
      categoryBaseScore += Math.min(visitCount / 10, 50); // Up to +50 for frequent visits
    }
  } else {
    categoryBaseScore = 100; // Bookmarks get +100 base score
  }

  return {
    ...result,
    score: categoryBaseScore + finalScore, // Category base score + fuzzy match score
    matchedFields,
  };
}

// Filter and sort search results with fuzzy matching
export function fuzzySearchResults(
  results: SearchResult[],
  query: SearchQuery,
  maxResults: number = 50
): ScoredSearchResult[] {
  // First, apply strict category filtering if specified
  let filteredResults = results;
  if (query.category) {
    filteredResults = results.filter(
      (result) => result.type === query.category
    );
  }

  if (!query.term && !query.category) {
    // No search term and no category filter, return all with category priority
    return filteredResults
      .slice(0, maxResults)
      .map((result) => {
        let baseScore = 100; // Start with high base score
        if (result.type === 'tab')
          baseScore = 1000; // Tabs get highest priority
        else if (result.type === 'history')
          baseScore = 500; // History second
        else baseScore = 100; // Bookmarks third

        return {
          ...result,
          score: baseScore,
          matchedFields: [],
        };
      })
      .sort((a, b) => {
        // First sort by category type priority
        const typeOrder: Record<SearchResultType, number> = {
          tab: 0,
          history: 1,
          bookmark: 2,
        };
        const typeDiff = typeOrder[a.type] - typeOrder[b.type];
        if (typeDiff !== 0) return typeDiff;

        // Then by score within same category
        return b.score - a.score;
      });
  }

  if (!query.term && query.category) {
    // Category only search - return all items of that category with base scores
    return filteredResults
      .slice(0, maxResults)
      .map((result) => {
        let baseScore = 10; // Higher base score for category-filtered results
        if (result.type === 'history' && result.visitCount) {
          // Boost frequently visited history items
          const { visitCount } = result;
          baseScore += Math.min(visitCount / 10, 20);
        } else if (result.type === 'bookmark' && result.dateAdded) {
          // Boost recent bookmarks
          const daysSinceAdded =
            (Date.now() - result.dateAdded) / (1000 * 60 * 60 * 24);
          baseScore += Math.max(0, 10 - daysSinceAdded / 10);
        }

        return {
          ...result,
          score: baseScore,
          matchedFields: [],
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  // Score all filtered results (category + search term)
  const scoredResults = filteredResults
    .map((result) => scoreSearchResult(result, query))
    .filter((result) => result.score > 0) // Filter out non-matching results
    .sort((a, b) => {
      // FIRST: Sort by category type priority (Tab > History > Bookmark)
      const typeOrder: Record<SearchResultType, number> = {
        tab: 0,
        history: 1,
        bookmark: 2,
      };
      const typeDiff = typeOrder[a.type] - typeOrder[b.type];
      if (typeDiff !== 0) return typeDiff;

      // SECOND: Within same category, sort by score descending
      return b.score - a.score;
    })
    .slice(0, maxResults);

  return scoredResults;
}
