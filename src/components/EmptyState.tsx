/**
 * Empty state component for different scenarios
 */

interface EmptyStateProps {
  searchTerm: string;
  isLoading: boolean;
}

export default function EmptyState({ searchTerm, isLoading }: EmptyStateProps) {
  if (isLoading) {
    return null; // Loading state is handled in StatusBar
  }

  if (searchTerm) {
    return (
      <div className='px-6 py-12 text-center'>
        <div className='text-gray-500'>
          <p className='text-sm'>No results found</p>
          <p className='mt-1 text-xs text-gray-600'>
            Try a different search term or use category search:
          </p>
          <div className='mt-2 space-y-1 text-xs text-gray-600'>
            <div>&quot;tab&quot; - show all tabs</div>
            <div>&quot;tab github&quot; - search only tabs for github</div>
            <div>&quot;history&quot; - show all history</div>
            <div>&quot;bookmark api&quot; - search only bookmarks for api</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='px-6 py-12 text-center'>
      <div className='text-gray-500'>
        <p className='text-sm'>No tabs found</p>
        <p className='mt-1 text-xs text-gray-600'>
          Make sure you have some tabs open or check extension permissions.
        </p>
      </div>
    </div>
  );
}
