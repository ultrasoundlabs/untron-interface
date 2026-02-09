export function normalizeLocaleUrl(url: string): string {
  if (!url) return '/';
  if (url === '/') return '/';

  // Handle absolute URLs (used for hreflang/canonical generation).
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const parsed = new URL(url);
      if (parsed.pathname !== '/' && parsed.pathname.endsWith('/')) {
        parsed.pathname = parsed.pathname.replace(/\/+$/, '');
      }
      return parsed.toString();
    } catch {
      // fall through to path normalization
    }
  }

  return url.replace(/\/+$/, '');
}
