// @ts-check
import { defineConfig } from 'astro/config';

// A user site on GitHub Pages lives at the domain root, so no `base` is needed.
export default defineConfig({
  site: 'https://alikonainofficial.github.io',
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
});
