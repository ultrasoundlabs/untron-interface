// src/i18n/locales.js
// Single source of truth for which locales are enabled in the landing app.
// For now we only enable English while the main copy is being developed.
// Later, to add a new locale (e.g. "es"):
//   1. Add `{ code: 'es', label: 'Español' }` to this array.
//   2. Copy `en.ts` to `es.ts` in this folder and translate.
//   3. Copy `src/pages/index.astro` to `src/pages/es/index.astro`
//      and point it at the new `es` translations.
// Astro i18n config and the header language switcher both read from here.

export const locales = [
  { code: 'en', label: 'English' },
  // { code: 'es', label: 'Español' },
  // { code: 'ru', label: 'Русский' },
];
