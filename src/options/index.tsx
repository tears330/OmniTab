import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@assets/styles/index.css';

import Options from './Options';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <Options />
    </StrictMode>
  );
}
