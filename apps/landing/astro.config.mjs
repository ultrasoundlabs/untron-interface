import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { locales } from './src/i18n/locales.js';

const siteUrl = 'https://untron.finance';

export default defineConfig({
  site: siteUrl,
  output: 'static', // full static export
  trailingSlash: 'always',
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
