import { useEffect, useState } from 'react';

import OmniTab from './OmniTab';

export default function Content() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Listen for messages from background script
    const handleMessage = (request: { action: string }) => {
      if (request.action === 'toggle-omnitab') {
        setIsOpen((prev) => !prev);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    // Prevent keyboard events from reaching the page, but allow our own handlers
    const handleKeyCapture = (e: KeyboardEvent) => {
      // Only stop propagation if the event target is not within our OmniTab component
      const target = e.target as HTMLElement;
      const isOmniTabElement = target.closest('[data-omnitab]');

      if (!isOmniTabElement) {
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    };

    // Use bubble phase instead of capture to allow our handlers to process first
    document.addEventListener('keydown', handleKeyCapture);
    document.addEventListener('keyup', handleKeyCapture);
    document.addEventListener('keypress', handleKeyCapture);

    return () => {
      document.removeEventListener('keydown', handleKeyCapture);
      document.removeEventListener('keyup', handleKeyCapture);
      document.removeEventListener('keypress', handleKeyCapture);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return <OmniTab onClose={() => setIsOpen(false)} />;
}
