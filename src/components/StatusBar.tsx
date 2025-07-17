/**
 * Status bar showing shortcuts and loading state for extension architecture
 */
import type { SearchResult } from '@/types/extension';

import { useOmniTabStore } from '@/stores/omniTabStore';

import ActionsMenu from './ActionsMenu';
import KeyboardShortcut from './KeyboardShortcut';

interface StatusBarProps {
  resultCount: number;
  selectedIndex: number;
  selectedResult?: SearchResult;
  loading: boolean;
  activeCommand?: string;
  error?: string;
}

export default function StatusBar({
  resultCount,
  selectedIndex,
  selectedResult,
  loading,
  activeCommand,
  error,
}: StatusBarProps) {
  const { isActionsMenuOpen, toggleActionsMenu } = useOmniTabStore();

  const getShortcuts = () => {
    const shortcuts: Array<{
      keys: string | string[];
      label: string;
      variant: 'default' | 'active';
      onClick?: () => void;
    }> = [];

    // Action shortcuts from selected result
    if (selectedResult && selectedResult.actions.length > 0) {
      // Primary action first
      const primaryAction = selectedResult.actions.find((a) => a.primary);
      if (primaryAction && primaryAction.shortcut) {
        shortcuts.push({
          keys: [primaryAction.shortcut],
          label: primaryAction.label,
          variant: 'default',
        });
      }

      // Show actions menu shortcut if there are secondary actions
      const secondaryActions = selectedResult.actions.filter((a) => !a.primary);
      if (secondaryActions.length > 0) {
        shortcuts.push({
          keys: ['⌘', 'K'],
          label: 'Actions',
          variant: isActionsMenuOpen ? 'active' : 'default',
          onClick: toggleActionsMenu,
        });
      }
    } else {
      // Default shortcuts when no result is selected
      shortcuts.push({ keys: ['Enter'], label: 'Select', variant: 'default' });
    }

    return shortcuts;
  };

  return (
    <div className='relative mt-2 px-3 py-2 text-xs text-gray-500 dark:text-gray-500'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          {(() => {
            if (error) {
              return (
                <span className='text-red-600 dark:text-red-400'>{error}</span>
              );
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
          {getShortcuts().map(({ keys, label, variant, onClick }) => (
            <KeyboardShortcut
              key={`${Array.isArray(keys) ? keys.join('-') : keys}-${label}`}
              keys={keys}
              label={label}
              variant={variant}
              onClick={onClick}
              className={label === 'Actions' ? 'data-actions-shortcut' : ''}
            />
          ))}
        </div>
      </div>

      {/* Actions Menu positioned at the right side */}
      <div className='absolute bottom-full right-3 mb-1'>
        <ActionsMenu selectedResult={selectedResult} />
      </div>
    </div>
  );
}
