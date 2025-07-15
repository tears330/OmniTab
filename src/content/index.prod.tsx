import styles from '@assets/styles/index.css?inline';
import createShadowRoot from '@utils/createShadowRoot';

import ContentV2 from './Content';

const root = createShadowRoot(styles);

root.render(<ContentV2 />);
