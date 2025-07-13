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
    <div className='mx-3 mb-1 flex items-center rounded-lg px-3 py-3.5'>
      <input
        ref={inputRef}
        type='text'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          e.stopPropagation();
          onKeyDown(e);
        }}
        placeholder='Search tabs, history, bookmarks... (↑↓ or ^N/^P to navigate)'
        className='w-full border-0 bg-transparent text-lg text-gray-100 placeholder-gray-500 focus:outline-none'
        autoComplete='off'
        spellCheck={false}
      />
    </div>
  );
}
