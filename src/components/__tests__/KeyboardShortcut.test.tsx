/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react';

import KeyboardShortcut from '../KeyboardShortcut';

describe('KeyboardShortcut', () => {
  describe('Basic Rendering', () => {
    it('should render a single key', () => {
      const { getByText } = render(<KeyboardShortcut keys='Enter' />);
      expect(getByText('Enter')).toBeTruthy();
    });

    it('should render multiple keys without separator', () => {
      const { getByText, queryByText } = render(
        <KeyboardShortcut keys={['Cmd', 'K']} />
      );
      expect(getByText('Cmd')).toBeTruthy();
      expect(getByText('K')).toBeTruthy();
      expect(queryByText('/')).toBeFalsy();
    });

    it('should render with label', () => {
      const { getByText } = render(
        <KeyboardShortcut keys='Enter' label='Select' />
      );
      expect(getByText('Enter')).toBeTruthy();
      expect(getByText('Select')).toBeTruthy();
    });
  });

  describe('Styling Variants', () => {
    it('should apply default variant styles', () => {
      const { container } = render(<KeyboardShortcut keys='Enter' />);
      const kbd = container.querySelector('kbd');

      expect(kbd?.classList.contains('bg-gray-200')).toBe(true);
      expect(kbd?.classList.contains('text-gray-600')).toBe(true);
      expect(kbd?.classList.contains('dark:bg-gray-800')).toBe(true);
      expect(kbd?.classList.contains('dark:text-gray-400')).toBe(true);
    });

    it('should apply active variant styles', () => {
      const { container } = render(
        <KeyboardShortcut keys='Enter' variant='active' />
      );
      const kbd = container.querySelector('kbd');

      expect(kbd?.classList.contains('bg-gray-300')).toBe(true);
      expect(kbd?.classList.contains('text-gray-900')).toBe(true);
      expect(kbd?.classList.contains('dark:bg-gray-700')).toBe(true);
      expect(kbd?.classList.contains('dark:text-gray-100')).toBe(true);
    });
  });

  describe('Size Variants', () => {
    it('should apply xs size styles by default', () => {
      const { container } = render(<KeyboardShortcut keys='Enter' />);
      const kbd = container.querySelector('kbd');

      expect(kbd?.classList.contains('px-1.5')).toBe(true);
      expect(kbd?.classList.contains('py-0.5')).toBe(true);
      expect(kbd?.classList.contains('text-[10px]')).toBe(true);
    });

    it('should apply sm size styles', () => {
      const { container } = render(<KeyboardShortcut keys='Enter' size='sm' />);
      const kbd = container.querySelector('kbd');

      expect(kbd?.classList.contains('px-2')).toBe(true);
      expect(kbd?.classList.contains('py-1')).toBe(true);
      expect(kbd?.classList.contains('text-xs')).toBe(true);
    });
  });

  describe('Custom Class Names', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <KeyboardShortcut keys='Enter' className='custom-class' />
      );
      const wrapper = container.firstChild as HTMLElement;

      expect(wrapper?.classList.contains('custom-class')).toBe(true);
      expect(wrapper?.classList.contains('flex')).toBe(true);
      expect(wrapper?.classList.contains('items-center')).toBe(true);
      expect(wrapper?.classList.contains('gap-1')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty array', () => {
      const { container } = render(<KeyboardShortcut keys={[]} />);
      expect(container.firstChild).toBeTruthy();
    });

    it('should handle array with single key', () => {
      const { getByText } = render(<KeyboardShortcut keys={['Enter']} />);
      expect(getByText('Enter')).toBeTruthy();
    });
  });

  describe('Complex Scenarios', () => {
    it('should render a complex keyboard shortcut', () => {
      const { getByText } = render(
        <KeyboardShortcut
          keys={['⌘', 'Shift', 'P']}
          label='Command Palette'
          variant='active'
          size='sm'
        />
      );

      expect(getByText('⌘')).toBeTruthy();
      expect(getByText('Shift')).toBeTruthy();
      expect(getByText('P')).toBeTruthy();
      expect(getByText('Command Palette')).toBeTruthy();

      const kbds = document.querySelectorAll('kbd');
      expect(kbds).toHaveLength(3);
      kbds.forEach((kbd) => {
        expect(kbd.classList.contains('bg-gray-300')).toBe(true);
        expect(kbd.classList.contains('text-gray-900')).toBe(true);
        expect(kbd.classList.contains('px-2')).toBe(true);
        expect(kbd.classList.contains('py-1')).toBe(true);
      });
    });
  });
});
