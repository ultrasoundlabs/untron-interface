/**
 * Prettier configuration for the landing Astro app.
 * Astro support is provided via `prettier-plugin-astro`.
 */
export default {
  semi: true,
  singleQuote: true,
  trailingComma: 'es5',
  printWidth: 100,
  tabWidth: 2,
  plugins: ['prettier-plugin-astro'],
};
