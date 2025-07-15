import { useEffect } from 'react';

import { useOmniTabStore } from '@/stores/omniTabStore';

import OmniTab from './OmniTab';

export default function ContentApp() {
  const isOpen = useOmniTabStore((state) => state.isOpen);
  const close = useOmniTabStore((state) => state.close);

  useEffect(() => {
    const handleMessage = (message: { action?: string }) => {
      if (message.action === 'toggle-omnitab') {
        const store = useOmniTabStore.getState();
        if (store.isOpen) {
          store.close();
        } else {
          store.open();
        }
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  return <OmniTab isOpen={isOpen} onClose={close} />;
}
