/**
 * Status bar showing shortcuts and loading state for extension architecture
 */
import type { SearchResult } from '@/types/extension';

interface StatusBarProps {
  resultCount: number;
  selectedIndex: number;
  selectedResult?: SearchResult; // eslint-disable-line react/require-default-props
  loading: boolean;
  activeCommand?: string; // eslint-disable-line react/require-default-props
  error?: string; // eslint-disable-line react/require-default-props
}

export default function StatusBar({
  resultCount,
  selectedIndex,
  selectedResult,
  loading,
  activeCommand,
  error,
}: StatusBarProps) {
  const getShortcuts = () => {
    const shortcuts = [];

    // Action shortcuts from selected result
    if (selectedResult && selectedResult.actions.length > 0) {
      // Primary action first
      const primaryAction = selectedResult.actions.find((a) => a.primary);
      if (primaryAction && primaryAction.shortcut) {
        shortcuts.push({
          keys: [primaryAction.shortcut],
          label: primaryAction.label,
        });
      }

      // Show actions menu shortcut if there are secondary actions
      const secondaryActions = selectedResult.actions.filter((a) => !a.primary);
      if (secondaryActions.length > 0) {
        shortcuts.push({
          keys: ['⌘', 'K'],
          label: 'Actions',
        });
      }
    } else {
      // Default shortcuts when no result is selected
      shortcuts.push({ keys: ['Enter'], label: 'Select' });
    }

    return shortcuts;
  };

  return (
    <div className='mt-2 flex items-center justify-between px-3 py-2 text-xs text-gray-500'>
      <div className='flex items-center gap-2'>
        {(() => {
          if (error) {
            return <span className='text-red-400'>{error}</span>;
          }
          if (loading) {
            return (
              <span className='flex items-center gap-1'>
                <span className='inline-block h-2 w-2 animate-pulse rounded-full bg-blue-500' />
                Searching...
              </span>
            );
          }
          return (
            <>
              {resultCount > 0 && (
                <span>
                  {selectedIndex + 1} of {resultCount}
                </span>
              )}
              {activeCommand && (
                <>
                  <span>•</span>
                  <span className='text-blue-400'>{activeCommand}</span>
                </>
              )}
            </>
          );
        })()}
      </div>

      <div className='flex items-center gap-3'>
        {getShortcuts().map(({ keys, label }) => (
          <span
            key={`${keys.join('-')}-${label}`}
            className='flex items-center gap-1'
          >
            {keys.map((key, keyIndex) => (
              <span key={`key-${key}`}>
                <kbd className='rounded bg-gray-800 px-1.5 py-0.5 font-mono text-[10px] text-gray-400'>
                  {key}
                </kbd>
                {keyIndex < keys.length - 1 && (
                  <span className='mx-0.5 text-gray-600'>/</span>
                )}
              </span>
            ))}
            <span className='ml-1 text-gray-600'>{label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
