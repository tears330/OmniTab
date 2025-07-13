import postcssRemToPx from '@thedutchcoder/postcss-rem-to-px';
import autoprefixer from 'autoprefixer';

import tailwindcss from 'tailwindcss';

/**
 * Configuration object for PostCSS plugins.
 * @type {Object}
 * @property {Function[]} plugins - Array of PostCSS plugins.
 */
const postcssConfig = {
  plugins: [
    // Apply Tailwind CSS
    tailwindcss(),

    // Convert rem units to px
    postcssRemToPx(),

    // Add vendor prefixes
    autoprefixer(),
  ],
};

export default postcssConfig;
