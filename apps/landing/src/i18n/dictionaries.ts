import { locales } from './locales.js';
import { landing as en } from './en';
import { landing as es } from './es';
import { landing as pt } from './pt';
import { landing as ru } from './ru';
import { landing as uk } from './uk';
import { landing as zhCN } from './zh-CN';
import { landing as zhHK } from './zh-HK';
import { landing as th } from './th';
import { landing as id } from './id';
import { landing as vi } from './vi';
import { landing as ms } from './ms';
import { landing as fil } from './fil';
import type { LandingDictionary } from './types';

const dictionaries: Record<string, LandingDictionary> = {
  en,
  es,
  pt,
  ru,
  uk,
  'zh-CN': zhCN,
  'zh-HK': zhHK,
  th,
  id,
  vi,
  ms,
  fil,
};

function normalizeLocaleCode(localeCode: string | undefined): string {
  if (typeof localeCode !== 'string' || !localeCode) return 'en';

  // Exact match first (handles `zh-CN` / `zh-HK`).
  if (locales.some((locale) => locale.code === localeCode)) return localeCode;

  const normalized = localeCode.replaceAll('_', '-').toLowerCase();
  const match = locales.find((locale) => locale.code.toLowerCase() === normalized);
  return match?.code ?? 'en';
}

export function getLandingDictionary(localeCode: string | undefined): LandingDictionary {
  const normalized = normalizeLocaleCode(localeCode);
  const localeMeta = locales.find((locale) => locale.code === normalized) ?? locales[0];
  const dictionary = dictionaries[normalized] ?? en;

  if (dictionary.localeCode === localeMeta.code) return dictionary;

  return { ...dictionary, localeCode: localeMeta.code, localeName: localeMeta.label };
}
