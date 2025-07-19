import styles from '@assets/styles/index.css?inline';
import createShadowRoot from '@utils/createShadowRoot';

import { settingsManager } from '@/services/settingsManager';

import ContentV2 from './Content';

// Initialize settings manager
settingsManager.initialize();

const root = createShadowRoot(styles);

root.render(<ContentV2 />);
