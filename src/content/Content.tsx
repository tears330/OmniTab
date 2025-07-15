import { useEffect, useState } from 'react';

import { OmniTabProvider } from '@/contexts/OmniTabContext';

import OmniTab from './OmniTab';

export default function ContentApp() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleMessage = (message: { action?: string }) => {
      if (message.action === 'toggle-omnitab') {
        setIsOpen((prev) => !prev);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <OmniTabProvider>
      <OmniTab isOpen={isOpen} onClose={handleClose} />
    </OmniTabProvider>
  );
}
