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
              placeholder='Search for tabs...'
              className='w-full border-0 bg-transparent text-lg text-gray-100 placeholder-gray-500 focus:outline-none'
              autoComplete='off'
              spellCheck={false}
            />
          </div>

          {searchTerm && tabs.length === 0 && (
            <div className='px-6 py-12 text-center'>
              <div className='text-gray-500'>
                <p className='text-sm'>No results found</p>
                <p className='mt-1 text-xs text-gray-600'>
                  Try a different search term
                </p>
              </div>
            </div>
          )}

          {tabs.length > 0 && (
            <div className='max-h-[420px] overflow-y-auto'>
              {tabs.map((tab, index) => (
                <div
                  key={tab.id}
                  ref={(el) => {
                    resultRefs.current[index] = el;
                  }}
                  className={`group mx-3 mb-1 flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150 ${
                    index === selectedIndex ? 'bg-white/10' : 'hover:bg-white/5'
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
                    <div className='flex h-8 w-8 items-center justify-center rounded-md bg-gray-800/50 ring-1 ring-white/5'>
                      <img
                        src={resolveFaviconUrl(tab.favIconUrl, tab.url)}
                        alt=''
                        className='h-4 w-4'
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
                    <div className='truncate text-sm font-medium text-gray-100'>
                      {tab.title}
                    </div>
                    <div className='mt-0.5 truncate text-xs text-gray-500'>
                      {(() => {
                        try {
                          return new URL(tab.url).hostname;
                        } catch {
                          return tab.url;
                        }
                      })()}
                    </div>
                  </div>
                  <div className='flex-shrink-0'>
                    <span className='text-xs text-gray-600'>Tab</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tabs.length > 0 && (
            <div className='border-t border-white/5 bg-gray-800/30 px-6 py-3'>
              <div className='flex items-center justify-end gap-4 text-xs text-gray-500'>
                <span>Open Tab</span>
                <kbd className='rounded bg-gray-700/50 px-1.5 py-0.5 font-mono text-[10px]'>
                  ↵
                </kbd>
                <div className='h-3 w-px bg-gray-700' />
                <button
                  type='button'
                  className='flex items-center gap-1.5 hover:text-gray-300'
                >
                  <span>Actions</span>
                </button>
                <kbd className='rounded bg-gray-700/50 px-1.5 py-0.5 font-mono text-[10px]'>
                  ⌘
                </kbd>
                <kbd className='rounded bg-gray-700/50 px-1.5 py-0.5 font-mono text-[10px]'>
                  K
                </kbd>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
