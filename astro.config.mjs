// @ts-check
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import { newTabLinks } from './src/lib/new-tab';

// A user site on GitHub Pages lives at the domain root, so no `base` is needed.
export default defineConfig({
  site: 'https://alikonainofficial.github.io',
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
  markdown: {
    // Links in the case files that leave the site open in a new tab.
    processor: satteri({ hastPlugins: [newTabLinks] }),
  },
});
