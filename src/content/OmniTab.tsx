import React, { useEffect, useRef, useState } from 'react';
import type { SearchResult } from '@/types';

interface OmniTabProps {
  onClose: () => void;
}

export default function OmniTab({ onClose }: OmniTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Helper function to resolve favicon URLs with multiple fallbacks
  const resolveFaviconUrl = (favIconUrl: string, tabUrl: string): string => {
    const defaultIcon = chrome.runtime.getURL('icon16.png');

    if (!favIconUrl) return defaultIcon;

    try {
      let resolvedUrl: string;

      // If it's already an absolute URL, use as-is
      if (
        favIconUrl.startsWith('http://') ||
        favIconUrl.startsWith('https://') ||
        favIconUrl.startsWith('data:')
      ) {
        resolvedUrl = favIconUrl;
      } else {
        // Resolve relative URL against the tab's origin
        const tabOrigin = new URL(tabUrl).origin;
        resolvedUrl = new URL(favIconUrl, tabOrigin).href;
      }

      // Check for mixed content issues: if current page is HTTPS but favicon is HTTP
      const currentPageIsHTTPS = window.location.protocol === 'https:';
      const faviconIsHTTP = resolvedUrl.startsWith('http://');

      if (currentPageIsHTTPS && faviconIsHTTP) {
        // Don't attempt HTTPS upgrade as many HTTP-only sites don't support it
        // Instead, fall back to default icon to avoid mixed content blocking
        return defaultIcon;
      }

      return resolvedUrl;
    } catch {
      return defaultIcon;
    }
  };

  // Favicon error handler - fallback to default icon only
  const handleFaviconError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>,
    result: SearchResult
  ) => {
    const img = e.target as HTMLImageElement;
    const defaultIcon = chrome.runtime.getURL('icon16.png');
    const currentSrc = img.src;

    // If already showing default icon, don't retry
    if (currentSrc === defaultIcon) {
      return;
    }

    try {
      const url = new URL(result.url);

      // For tabs, we already have the correct favicon from Chrome
      // For history/bookmarks, try common favicon paths before giving up
      const fallbackSources = [
        // Try the site's root favicon.ico (if not already tried)
        `${url.origin}/favicon.ico`,
        // Try common favicon path
        `${url.origin}/favicon.png`,
        // Finally, use our default icon
        defaultIcon,
      ];

      // Find which fallback to try next
      const currentIndex = fallbackSources.findIndex(
        (src) => src === currentSrc
      );
      const nextIndex = currentIndex + 1;

      if (nextIndex < fallbackSources.length) {
        img.src = fallbackSources[nextIndex];
      } else {
        // All fallbacks failed, use default
        img.src = defaultIcon;
      }
    } catch {
      // URL parsing failed, just use default icon
      img.src = defaultIcon;
    }
  };

  // Focus input and load all tabs when component mounts
  useEffect(() => {
    inputRef.current?.focus();

    // Load all results initially
    chrome.runtime.sendMessage(
      { action: 'search-tabs', searchTerm: '' },
      (response: { results?: SearchResult[] }) => {
        if (response?.results) {
          setResults(response.results);
          setSelectedIndex(0);
          resultRefs.current = new Array(response.results.length).fill(null);
        }
      }
    );
  }, []);

  // Search tabs when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      // Load all results when search is empty
      chrome.runtime.sendMessage(
        { action: 'search-tabs', searchTerm: '' },
        (response: { results?: SearchResult[] }) => {
          if (response?.results) {
            setResults(response.results);
            setSelectedIndex(0);
            resultRefs.current = new Array(response.results.length).fill(null);
          }
        }
      );
      return undefined;
    }

    const debounceTimer = setTimeout(() => {
      chrome.runtime.sendMessage(
        { action: 'search-tabs', searchTerm },
        (response: { results?: SearchResult[] }) => {
          if (response?.results) {
            setResults(response.results);
            setSelectedIndex(0);
            resultRefs.current = new Array(response.results.length).fill(null);
          }
        }
      );
    }, 100);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

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

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (results.length > 0) {
          setSelectedIndex((prev) => (prev + 1) % results.length);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (results.length > 0) {
          setSelectedIndex(
            (prev) => (prev - 1 + results.length) % results.length
          );
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          const selectedResult = results[selectedIndex];

          if (selectedResult.type === 'tab') {
            if (e.ctrlKey || e.metaKey) {
              // Close tab
              chrome.runtime.sendMessage(
                {
                  action: 'close-tab',
                  tabId: selectedResult.id,
                },
                () => {
                  // Remove from local state
                  setResults((prev) =>
                    prev.filter((_, i) => i !== selectedIndex)
                  );
                  setSelectedIndex((prev) =>
                    Math.min(prev, results.length - 2)
                  );
                }
              );
            } else {
              // Switch to tab
              chrome.runtime.sendMessage(
                {
                  action: 'switch-tab',
                  tabId: selectedResult.id,
                  windowId: selectedResult.windowId,
                },
                () => {
                  onClose();
                }
              );
            }
          } else {
            // Open history/bookmark in new tab
            chrome.runtime.sendMessage(
              {
                action: 'open-url',
                url: selectedResult.url,
              },
              () => {
                onClose();
              }
            );
          }
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
      default:
        // Do nothing for other keys
        break;
    }
  };

  // Handle click on result
  const handleResultClick = (result: SearchResult, index: number) => {
    setSelectedIndex(index);

    if (result.type === 'tab') {
      chrome.runtime.sendMessage(
        {
          action: 'switch-tab',
          tabId: result.id,
          windowId: result.windowId,
        },
        () => {
          onClose();
        }
      );
    } else {
      // Open history/bookmark in new tab
      chrome.runtime.sendMessage(
        {
          action: 'open-url',
          url: result.url,
        },
        () => {
          onClose();
        }
      );
    }
  };

  return (
    <div
      data-omnitab
      className='fixed inset-0 z-[999999] flex items-start justify-center bg-black/50 backdrop-blur-2xl'
      onClick={onClose}
      onKeyDown={(e) => {
        e.stopPropagation();
      }}
      role='button'
      tabIndex={0}
    >
      <div
        className='fade-in slide-in-from-top-4 mt-40 w-full max-w-3xl transform animate-in duration-200'
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          e.stopPropagation();
        }}
        role='presentation'
      >
        <div className='overflow-hidden rounded-xl bg-gray-900/95 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl'>
          <div className='mx-3 mb-1 flex items-center rounded-lg px-3 py-3.5'>
            <input
              ref={inputRef}
              type='text'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                handleKeyDown(e);
              }}
              placeholder='Search tabs, history, bookmarks... (try "tab", "history", or "bookmark docs")'
              className='w-full border-0 bg-transparent text-lg text-gray-100 placeholder-gray-500 focus:outline-none'
              autoComplete='off'
              spellCheck={false}
            />
          </div>

          {searchTerm && results.length === 0 && (
            <div className='px-6 py-12 text-center'>
              <div className='text-gray-500'>
                <p className='text-sm'>No results found</p>
                <p className='mt-1 text-xs text-gray-600'>
                  Try a different search term or use category search:
                </p>
                <div className='mt-2 space-y-1 text-xs text-gray-600'>
                  <div>&quot;tab&quot; - show all tabs</div>
                  <div>
                    &quot;tab github&quot; - search only tabs for github
                  </div>
                  <div>&quot;history&quot; - show all history</div>
                  <div>
                    &quot;bookmark api&quot; - search only bookmarks for api
                  </div>
                </div>
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div className='max-h-[420px] overflow-y-auto'>
              {results.map((result, index) => (
                <div
                  key={result.id}
                  ref={(el) => {
                    resultRefs.current[index] = el;
                  }}
                  className={`group mx-3 mb-1 flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150 ${
                    index === selectedIndex ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                  onClick={() => handleResultClick(result, index)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleResultClick(result, index);
                    }
                  }}
                  role='button'
                  tabIndex={0}
                >
                  <div className='flex-shrink-0'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-md bg-gray-800/50 ring-1 ring-white/5'>
                      <img
                        src={resolveFaviconUrl(result.favIconUrl, result.url)}
                        alt=''
                        className='h-4 w-4'
                        onError={(e) => handleFaviconError(e, result)}
                      />
                    </div>
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div className='truncate text-sm font-medium text-gray-100'>
                      {result.title}
                    </div>
                    <div className='mt-0.5 truncate text-xs text-gray-500'>
                      {(() => {
                        try {
                          return new URL(result.url).hostname;
                        } catch {
                          return result.url;
                        }
                      })()}
                    </div>
                  </div>
                  <div className='flex-shrink-0'>
                    <span className='text-xs text-gray-500'>
                      {(() => {
                        if (result.type === 'tab') return 'Tab';
                        if (result.type === 'history') return 'History';
                        return 'Bookmark';
                      })()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {results.length > 0 && (
            <div className='border-t border-white/5 bg-gray-800/30 px-6 py-3'>
              <div className='flex items-center justify-end gap-4 text-xs text-gray-500'>
                <span>Open</span>
                <kbd className='rounded bg-gray-700/50 px-1.5 py-0.5 font-mono text-[10px]'>
                  ↵
                </kbd>
                <div className='h-3 w-px bg-gray-700' />
                <span>Close Tab</span>
                <kbd className='rounded bg-gray-700/50 px-1.5 py-0.5 font-mono text-[10px]'>
                  ⌘
                </kbd>
                <kbd className='rounded bg-gray-700/50 px-1.5 py-0.5 font-mono text-[10px]'>
                  ↵
                </kbd>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
