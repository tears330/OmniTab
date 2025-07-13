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

  if (!isOpen) return null;

  return <OmniTab onClose={() => setIsOpen(false)} />;
}
