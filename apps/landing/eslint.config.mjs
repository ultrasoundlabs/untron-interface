import { URL, fileURLToPath } from 'node:url';
import js from '@eslint/js';
import eslintPluginAstro from 'eslint-plugin-astro';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import { includeIgnoreFile } from '@eslint/compat';
import eslintConfigPrettier from 'eslint-config-prettier';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default [
  includeIgnoreFile(gitignorePath),
  js.configs.recommended,
  {
    files: ['**/*.{js,ts,astro}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        extraFileExtensions: ['.astro'],
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      astro: eslintPluginAstro,
    },
    rules: {
      'no-undef': 'off',
    },
  },
  ...eslintPluginAstro.configs.recommended,
  eslintConfigPrettier,
];
