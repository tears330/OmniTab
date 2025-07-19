import { useEffect } from 'react';

import { Theme } from '../types';
import useSettings from './useSettings';

/**
 * Hook specifically for theme management (backward compatibility)
 */
export default function useTheme() {
  const { theme, changeTheme } = useSettings();

  useEffect(() => {
    // Apply theme on mount and when it changes
    const applyTheme = (newTheme: Theme) => {
      const html = document.documentElement;
      if (newTheme === 'system') {
        const prefersDark = window.matchMedia(
          '(prefers-color-scheme: dark)'
        ).matches;
        html.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      } else {
        html.setAttribute('data-theme', newTheme);
      }
    };

    applyTheme(theme);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () =>
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [theme]);

  return { theme, changeTheme };
}
