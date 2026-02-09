import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { locales } from './src/i18n/locales.js';

const siteUrl = 'https://untron.finance';

export default defineConfig({
  site: siteUrl,
  output: 'static', // full static export
  // Cloudflare Pages is currently enforcing a trailing-slash *removal* redirect
  // (e.g. `/es/` -> `/es`). Directory-style output would then loop because
  // Cloudflare also canonicalizes `/es` -> `/es/` when a folder exists.
  // File-style output avoids the loop by serving `/es` directly.
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
  integrations: [sitemap()],
  i18n: {
    defaultLocale: 'en',
    locales: locales.map((l) => l.code),
    routing: {
      // for SEO I’d recommend:
      prefixDefaultLocale: false, // root `/` is English
      // redirectToDefaultLocale: true is the default
    },
  },
});
