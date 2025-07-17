/**
 * Search input component for OmniTab
 */
import type React from 'react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export default function SearchInput({
  value,
  onChange,
  onKeyDown,
  inputRef,
}: SearchInputProps) {
  return (
    <div className='mx-3 flex items-center rounded-lg px-3 py-3.5'>
      <input
        ref={inputRef}
        type='text'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder='Type to search or use shortcuts: > (commands), t (tabs), h (history), b (bookmarks)'
        className='w-full border-0 bg-transparent text-lg text-gray-900 placeholder-gray-400 focus:outline-none dark:text-gray-100 dark:placeholder-gray-500'
        autoComplete='off'
        spellCheck={false}
      />
    </div>
  );
}
