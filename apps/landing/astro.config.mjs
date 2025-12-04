import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const siteUrl = 'https://untron.finance';

export default defineConfig({
  site: siteUrl,
  output: 'static',          // full static export
  trailingSlash: 'never',    // or 'always' if you prefer
  integrations: [
    sitemap()
  ]
});