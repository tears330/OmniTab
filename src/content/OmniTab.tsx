import React, { useEffect, useRef, useState } from 'react';

interface Tab {
  id: number;
  title: string;
  url: string;
  favIconUrl: string;
  windowId: number;
}

interface OmniTabProps {
  onClose: () => void;
}

export default function OmniTab({ onClose }: OmniTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Helper function to resolve favicon URLs
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

  // Focus input and load all tabs when component mounts
  useEffect(() => {
    inputRef.current?.focus();

    // Load all tabs initially
    chrome.runtime.sendMessage(
      { action: 'search-tabs', searchTerm: '' },
      (response) => {
        if (response?.tabs) {
          setTabs(response.tabs);
          setSelectedIndex(0);
          resultRefs.current = new Array(response.tabs.length).fill(null);
        }
      }
    );
  }, []);

  // Search tabs when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      // Load all tabs when search is empty
      chrome.runtime.sendMessage(
        { action: 'search-tabs', searchTerm: '' },
        (response) => {
          if (response?.tabs) {
            setTabs(response.tabs);
            setSelectedIndex(0);
            resultRefs.current = new Array(response.tabs.length).fill(null);
          }
        }
      );
      return undefined;
    }

    const debounceTimer = setTimeout(() => {
      chrome.runtime.sendMessage(
        { action: 'search-tabs', searchTerm },
        (response) => {
          if (response?.tabs) {
            setTabs(response.tabs);
            setSelectedIndex(0);
            resultRefs.current = new Array(response.tabs.length).fill(null);
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
        if (tabs.length > 0) {
          setSelectedIndex((prev) => (prev + 1) % tabs.length);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (tabs.length > 0) {
          setSelectedIndex((prev) => (prev - 1 + tabs.length) % tabs.length);
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (tabs[selectedIndex]) {
          if (e.ctrlKey || e.metaKey) {
            // Close tab
            chrome.runtime.sendMessage(
              {
                action: 'close-tab',
                tabId: tabs[selectedIndex].id,
              },
              () => {
                // Remove from local state
                setTabs((prev) => prev.filter((_, i) => i !== selectedIndex));
                setSelectedIndex((prev) => Math.min(prev, tabs.length - 2));
              }
            );
          } else {
            // Switch to tab
            chrome.runtime.sendMessage(
              {
                action: 'switch-tab',
                tabId: tabs[selectedIndex].id,
                windowId: tabs[selectedIndex].windowId,
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

  // Handle click on tab
  const handleTabClick = (tab: Tab, index: number) => {
    setSelectedIndex(index);
    chrome.runtime.sendMessage(
      {
        action: 'switch-tab',
        tabId: tab.id,
        windowId: tab.windowId,
      },
      () => {
        onClose();
      }
    );
  };

  return (
    <div
      className='fixed inset-0 z-[999999] flex items-start justify-center bg-black/40 backdrop-blur-md'
      onClick={onClose}
      onKeyDown={() => {}}
      role='button'
      tabIndex={0}
    >
      <div
        className='fade-in slide-in-from-top-4 mt-16 w-full max-w-2xl transform animate-in duration-200'
        onClick={(e) => e.stopPropagation()}
        onKeyDown={() => {}}
        role='presentation'
      >
        <div className='overflow-hidden rounded-lg bg-white/95 shadow-2xl ring-1 ring-black/5 backdrop-blur-xl dark:bg-gray-900/95 dark:ring-white/10'>
          <div className='px-4 py-2'>
            <input
              ref={inputRef}
              type='text'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Search tabs...'
              className='w-full border-0 bg-transparent py-2.5 text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none dark:text-gray-100 dark:placeholder-gray-500'
              autoComplete='off'
              spellCheck={false}
            />
            {(searchTerm || tabs.length > 0) && (
              <div className='mt-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-700' />
            )}
          </div>

          {searchTerm && tabs.length === 0 && (
            <div className='px-4 py-8 text-center'>
              <div className='text-gray-400 dark:text-gray-500'>
                <svg
                  className='mx-auto mb-2 h-6 w-6'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={1.5}
                    d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                  />
                </svg>
                <p className='text-sm font-medium text-gray-600 dark:text-gray-300'>
                  No tabs found
                </p>
                <p className='mt-1 text-xs text-gray-500 dark:text-gray-500'>
                  Try a different search term
                </p>
              </div>
            </div>
          )}

          {tabs.length > 0 && (
            <div className='max-h-80 overflow-y-auto'>
              {tabs.map((tab, index) => (
                <div
                  key={tab.id}
                  ref={(el) => {
                    resultRefs.current[index] = el;
                  }}
                  className={`group flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-all duration-100 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 ${
                    index === selectedIndex
                      ? 'bg-blue-50/80 dark:bg-blue-900/20'
                      : ''
                  }`}
                  onClick={() => handleTabClick(tab, index)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleTabClick(tab, index);
                    }
                  }}
                  role='button'
                  tabIndex={0}
                >
                  <div className='flex-shrink-0'>
                    <div className='flex h-5 w-5 items-center justify-center rounded bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700'>
                      <img
                        src={resolveFaviconUrl(tab.favIconUrl, tab.url)}
                        alt=''
                        className='h-3.5 w-3.5 rounded-sm'
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          const defaultIcon =
                            chrome.runtime.getURL('icon16.png');

                          // Always fall back to default icon on error
                          if (img.src !== defaultIcon) {
                            img.src = defaultIcon;
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div className='truncate text-sm font-medium text-gray-900 dark:text-gray-100'>
                      {tab.title}
                    </div>
                    <div className='truncate text-xs text-gray-500 dark:text-gray-400'>
                      {(() => {
                        try {
                          return new URL(tab.url).hostname;
                        } catch {
                          return tab.url;
                        }
                      })()}
                    </div>
                  </div>
                  {index === selectedIndex && (
                    <div className='flex items-center gap-1'>
                      <kbd className='inline-flex h-4 min-w-[16px] items-center justify-center rounded border border-gray-200 bg-gray-50 px-1 font-mono text-[9px] font-medium text-gray-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300'>
                        ↵
                      </kbd>
                      <kbd className='inline-flex h-4 min-w-[16px] items-center justify-center rounded border border-gray-200 bg-gray-50 px-1 font-mono text-[9px] font-medium text-gray-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300'>
                        ⌘↵
                      </kbd>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {tabs.length > 0 && (
            <div className='border-t border-gray-100 bg-gray-50/50 px-4 py-2.5 dark:border-gray-800 dark:bg-gray-900/50'>
              <div className='flex items-center justify-between text-xs text-gray-500 dark:text-gray-400'>
                <div className='flex items-center gap-4'>
                  <div className='flex items-center gap-1.5'>
                    <kbd className='inline-flex h-4 min-w-[16px] items-center justify-center rounded border border-gray-200 bg-white px-1 font-mono text-[9px] font-medium text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400'>
                      ↑↓
                    </kbd>
                    <span className='text-[11px] font-medium'>Navigate</span>
                  </div>
                  <div className='flex items-center gap-1.5'>
                    <kbd className='inline-flex h-4 min-w-[16px] items-center justify-center rounded border border-gray-200 bg-white px-1 font-mono text-[9px] font-medium text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400'>
                      esc
                    </kbd>
                    <span className='text-[11px] font-medium'>Close</span>
                  </div>
                </div>
                <div className='text-[11px] font-medium text-gray-600 dark:text-gray-300'>
                  {tabs.length} {tabs.length === 1 ? 'result' : 'results'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
