import { JSX, useState } from 'react';

import useTheme from '../hooks/useTheme';
import AboutCard from './components/AboutCard';
import InfoCard from './components/InfoCard';
import OptionsHeader from './components/OptionsHeader';
import ShortcutCard from './components/ShortcutCard';
import Sidebar from './components/Sidebar';
import ThemeCard from './components/ThemeCard';

export default function Options(): JSX.Element {
  const { theme, changeTheme } = useTheme();
  const [activeCategory, setActiveCategory] = useState('general');

  const openKeyboardShortcuts = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
    }
  };

  const renderContent = () => {
    switch (activeCategory) {
      case 'general':
        return (
          <div className='space-y-6'>
            <ShortcutCard onOpenSettings={openKeyboardShortcuts} />
            <ThemeCard theme={theme} onChangeTheme={changeTheme} />
            <InfoCard />
          </div>
        );
      case 'about':
        return <AboutCard />;
      default:
        return null;
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800'>
      <OptionsHeader />

      {/* Main Content */}
      <div className='mx-auto max-w-7xl px-6 py-8'>
        <div className='flex gap-8'>
          {/* Left Sidebar */}
          <Sidebar
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />

          {/* Right Content */}
          <div className='min-w-0 flex-1'>{renderContent()}</div>
        </div>
      </div>
    </div>
  );
}
